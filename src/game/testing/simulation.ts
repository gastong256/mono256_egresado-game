/**
 * Mass simulation.
 *
 * Plays many deterministic runs and asserts the invariants that a single unit
 * test cannot cover: that no seed dead-ends, that scores stay finite, that
 * replay reproduces every run exactly, and that a snapshot of the final state
 * round-trips.
 *
 * This is the tool that will matter for balancing later; today it is the
 * strongest evidence that the engine and the content actually work together.
 */

import { toRunId, toRunSeed } from '../core/branded'
import { describeRejection } from '../core/errors'
import { isErr } from '../core/result'
import { ENGINE_VERSION } from '../core/versioning'
import { parseActionLog, serializeActionLog } from '../runs/action-log'
import { canonicalize } from '../core/canonical'
import { replayRun } from '../runs/replay'
import { restoreSnapshot, serializeSnapshot } from '../runs/snapshot'
import type { RunDescriptor } from '../runs/state'
import type { EngineDependencies } from '../runs/transition'
import { simulateRun, type AgentOptions, DEFAULT_AGENT_OPTIONS } from './agent'

export interface SimulationFinding {
  readonly seed: string
  readonly code: string
  readonly detail: string
}

export interface SimulationSummary {
  readonly runs: number
  readonly completed: number
  readonly findings: readonly SimulationFinding[]
  readonly totalEvents: number
  readonly minScore: number
  readonly maxScore: number
  readonly averageScore: number
  readonly averageEvents: number
  /** How often each profile was assigned, useful for balance review. */
  readonly profileCounts: Readonly<Record<string, number>>
  /** How often each quality was reached across every answered challenge. */
  readonly qualityCounts: Readonly<Record<string, number>>
  /** Runs that reached graduation. Should equal `completed` where progression exists. */
  readonly graduated: number
  /** Remediation beats played across the sweep, and the worst single run. */
  readonly recoveries: number
  readonly maxRecoveriesPerRun: number
  /** Years that closed owing something. Hidden career history. */
  readonly previas: number
}

/**
 * Builds a run descriptor for a seed, from the dependencies it will be played
 * with.
 *
 * Every version the run declares is read off those dependencies, the approved
 * catalog included. A simulator that hard-coded three of the four would reject
 * every run of a content set that has a catalog — and it would be right to,
 * which is precisely why the descriptor has to be derived and not assumed.
 */
export function developmentRunDescriptor(
  seed: string,
  dependencies: EngineDependencies,
  overrides: Partial<Pick<RunDescriptor, 'mode' | 'difficulty'>> = {},
): RunDescriptor {
  const catalogVersion = dependencies.approvedVariants?.catalogVersion

  return {
    runId: toRunId(`dev-run-${seed}`),
    seed: toRunSeed(seed),
    mode: overrides.mode ?? 'practice',
    difficulty: overrides.difficulty ?? 'adaptive',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: dependencies.ruleset.contentVersion,
    ...(catalogVersion === undefined
      ? {}
      : { variantCatalogVersion: catalogVersion }),
  }
}

export interface SimulationOptions {
  readonly runs: number
  readonly seedPrefix?: string
  readonly agent?: AgentOptions
  /** Replay and snapshot checks are the slowest part; sampling keeps CI quick. */
  readonly verifyEvery?: number
}

/**
 * Runs `options.runs` deterministic simulations.
 *
 * Seeds are derived from an explicit prefix and the run index, so a sweep is
 * itself reproducible and a reported finding can always be replayed by hand.
 */
export function simulateMany(
  dependencies: EngineDependencies,
  options: SimulationOptions,
): SimulationSummary {
  const findings: SimulationFinding[] = []
  const profileCounts: Record<string, number> = {}
  const qualityCounts: Record<string, number> = {}
  const prefix = options.seedPrefix ?? 'sim'
  const verifyEvery = options.verifyEvery ?? 25

  let completed = 0
  let totalEvents = 0
  let graduated = 0
  let recoveries = 0
  let maxRecoveries = 0
  let previas = 0
  let totalScore = 0
  let minScore = Number.POSITIVE_INFINITY
  let maxScore = Number.NEGATIVE_INFINITY

  for (let index = 0; index < options.runs; index += 1) {
    const seed = `${prefix}-${String(index)}`
    const descriptor = developmentRunDescriptor(seed, dependencies)
    // An invariant error means broken content or a broken engine. A sweep must
    // report every seed that trips it rather than dying on the first one, so it
    // is captured as a finding here.
    let outcome: ReturnType<typeof simulateRun>
    try {
      outcome = simulateRun(
        descriptor,
        dependencies,
        options.agent ?? DEFAULT_AGENT_OPTIONS,
      )
    } catch (error) {
      findings.push({
        seed,
        code: 'invariant-violation',
        detail: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    if (isErr(outcome)) {
      findings.push({
        seed,
        code: 'run-rejected',
        detail: describeRejection(outcome.error),
      })
      continue
    }

    const { state, log } = outcome.value

    if (state.status !== 'completed') {
      findings.push({
        seed,
        code: 'run-did-not-complete',
        detail: `run ended in status ${state.status} at phase ${state.phase}`,
      })
      continue
    }

    completed += 1
    totalEvents += state.history.length
    totalScore += state.scorePreview
    minScore = Math.min(minScore, state.scorePreview)
    maxScore = Math.max(maxScore, state.scorePreview)

    if (!Number.isFinite(state.scorePreview) || state.scorePreview < 0) {
      findings.push({
        seed,
        code: 'invalid-score',
        detail: `score preview was ${String(state.scorePreview)}`,
      })
    }

    if (state.history.length === 0) {
      findings.push({
        seed,
        code: 'empty-run',
        detail: 'the run completed without resolving any event',
      })
    }

    /*
     * A composed run has to play the year it was given.
     *
     * If it finishes with beats unplayed, the plan named content the narrative
     * could not host, and the run quietly became shorter than the one the
     * composer promised. That is the failure mode a plan exists to prevent, so
     * it is worth a finding rather than a shrug.
     */
    /*
     * A completed run that did not graduate.
     *
     * The product rule is absolute: every valid completed run reaches
     * graduation. The only way to finish without it is content failing to serve
     * the run, so a finding here is a content defect wearing an outcome's
     * clothes — and worth the same noise as a dead end.
     */
    if (
      dependencies.ruleset.recovery !== undefined &&
      state.status === 'completed' &&
      state.completion?.graduated !== true
    ) {
      findings.push({
        seed,
        code: 'not-graduated',
        detail: `the run completed owing ${String(state.progression.pending.length)} obligations`,
      })
    }

    if (state.plan !== undefined) {
      const planned = state.plan.stages.reduce(
        (sum, stage) => sum + stage.beats.length,
        0,
      )
      // Ordinary beats only. A remediation beat is conditional content that
      // lives outside the plan, so counting it here would report every run that
      // had a bad year as having played content it was never given.
      const played = state.history.filter(
        (entry) => entry.challengeId !== undefined && entry.recovery !== true,
      ).length
      if (played !== planned) {
        findings.push({
          seed,
          code: 'plan-unplayed',
          detail: `the plan holds ${String(planned)} beats and the run played ${String(played)}`,
        })
      }
    }

    graduated += state.completion?.graduated === true ? 1 : 0
    recoveries += state.progression.history.length
    maxRecoveries = Math.max(maxRecoveries, state.progression.history.length)
    previas += state.completion?.previas ?? 0

    const profile = state.completion?.profile.profileId
    if (profile !== undefined) {
      profileCounts[profile] = (profileCounts[profile] ?? 0) + 1
    }

    for (const entry of state.history) {
      if (entry.quality !== undefined) {
        qualityCounts[entry.quality] = (qualityCounts[entry.quality] ?? 0) + 1
      }
      for (const metric of Object.values(entry.metrics ?? {})) {
        if (!Number.isFinite(metric)) {
          findings.push({
            seed,
            code: 'invalid-metric',
            detail: `event ${String(entry.sequence)} produced a non-finite metric`,
          })
        }
      }
    }

    if (index % verifyEvery !== 0) {
      continue
    }

    // Replay must reproduce the run exactly, through the same serialized form a
    // client would submit.
    const reparsed = parseActionLog(serializeActionLog(log))
    if (isErr(reparsed)) {
      findings.push({
        seed,
        code: 'action-log-round-trip',
        detail: describeRejection(reparsed.error),
      })
      continue
    }

    const replayed = replayRun(reparsed.value, dependencies)
    if (isErr(replayed)) {
      findings.push({
        seed,
        code: 'replay-rejected',
        detail: describeRejection(replayed.error),
      })
      continue
    }

    if (canonicalize(replayed.value.state) !== canonicalize(state)) {
      findings.push({
        seed,
        code: 'replay-divergence',
        detail: 'replayed final state differs from the played run',
      })
    }

    const restored = restoreSnapshot(
      JSON.parse(JSON.stringify(serializeSnapshot(state))),
      {
        gameVersion: descriptor.gameVersion,
        rulesetVersion: descriptor.rulesetVersion,
        contentVersion: descriptor.contentVersion,
      },
    )
    if (isErr(restored)) {
      findings.push({
        seed,
        code: 'snapshot-round-trip',
        detail: describeRejection(restored.error),
      })
      continue
    }

    if (canonicalize(restored.value) !== canonicalize(state)) {
      findings.push({
        seed,
        code: 'snapshot-divergence',
        detail: 'restored snapshot differs from the played run',
      })
    }
  }

  return {
    runs: options.runs,
    completed,
    findings,
    totalEvents,
    minScore: completed === 0 ? 0 : minScore,
    maxScore: completed === 0 ? 0 : maxScore,
    averageScore: completed === 0 ? 0 : Math.round(totalScore / completed),
    averageEvents: completed === 0 ? 0 : totalEvents / completed,
    profileCounts,
    qualityCounts,
    graduated,
    recoveries,
    maxRecoveriesPerRun: maxRecoveries,
    previas,
  }
}
