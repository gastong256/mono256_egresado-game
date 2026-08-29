/**
 * FairScore: what a whole run is worth in a competition.
 *
 * The inputs are the authoritative history of a run and a versioned policy;
 * nothing else. No career totals, no visible stats, no client claim, no clock.
 * That is what makes the same score recomputable from an action log months
 * later and on a server that never trusted the browser.
 *
 * ## The shape, from `competitive-scoring-and-ranking.md`
 *
 * ```text
 * MathRaw         = Σ q_i × difficultyReward_i
 * MathMax         = Σ 10000 × difficultyReward_i
 * MathPerformance = 10000 × MathRaw / MathMax
 * FairScore       = round(Σ weight_k × Performance_k)
 * ```
 *
 * Normalising against *this run's* own maximum is what lets two runs built from
 * different templates be compared: a harder plan is worth a differently weighted
 * maximum, never a bigger one.
 *
 * ## Opportunity: renormalising the active weights
 *
 * Plans differ in what they contain. A run whose beats offer no collaboration
 * evidence must not be scored out of 8500 while another is scored out of 10000 —
 * that would punish a player for a draw they did not make. So a component with
 * no opportunity in a run is **removed and its weight redistributed** across the
 * ones that are present, in proportion.
 *
 * Two consequences worth stating: perfect play reaches exactly 10000 in every
 * valid run, and dropping a secondary component only ever *increases* the share
 * of mathematics. The alternatives — normalising per opportunity, guaranteeing
 * opportunities in the composer, treating secondaries as bonuses — are compared
 * in ADR-023.
 *
 * ## Arithmetic
 *
 * Exact rationals throughout, rounded half-up exactly once at the end. The
 * component figures in the breakdown are then allocated by largest remainder, so
 * the parts sum to the whole with nothing hidden.
 */

import { err, ok, type Result } from '../core/result'
import type { ChallengeId } from '../core/branded'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { ChallengeDefinition } from '../challenges/contracts'
import type { SolutionQuality } from '../challenges/taxonomy'
import type { ReasoningMetrics } from '../challenges/contracts'
import type { ScoringSignal } from '../challenges/scoring-profile'
import { PERFORMANCE_SCALE } from '../challenges/scoring-profile'
import type { DifficultyBand } from '../difficulty/cognitive'
import {
  add,
  divide,
  fromInteger,
  multiply,
  subtract,
  type Rational,
} from '../math/rational'
import { roundTo } from '../math/rounding'
import {
  competitiveScorePolicyIssues,
  SCORE_COMPONENTS,
  SCORE_SCALE,
  type CompetitiveScorePolicy,
  type ScoreComponentKey,
} from './competitive-policy'

/** One resolved beat, as the authoritative history recorded it. */
export interface ScoredEvent {
  readonly templateId: ChallengeId
  readonly quality: SolutionQuality
  readonly metrics: ReasoningMetrics
}

export const SCORING_FAILURE_CODES = [
  /** The policy itself would not produce a defensible ranking. */
  'invalid-score-policy',
  /** A beat names a template the catalog does not hold. */
  'unknown-template',
  /** A template reached the competitive layer without declaring how it scores. */
  'unscorable-template',
  /** A scoring profile returned something outside 0..10000. */
  'performance-out-of-range',
  /** The run resolved no beat that could be scored mathematically. */
  'no-scorable-evidence',
] as const

export type ScoringFailureCode = (typeof SCORING_FAILURE_CODES)[number]

export interface ScoringFailure {
  readonly code: ScoringFailureCode
  readonly subject: string
  readonly detail: string
}

function failure(
  code: ScoringFailureCode,
  subject: string,
  detail: string,
): ScoringFailure {
  return { code, subject, detail }
}

/** What one component of one beat contributed, and what it could have. */
export interface ComponentEvidence {
  /** Basis points achieved, weighted by the difficulty reward for mathematics. */
  readonly achieved: number
  /** Basis points available on the same weighting. Zero means no opportunity. */
  readonly available: number
}

export interface BeatEvidence {
  readonly templateId: ChallengeId
  readonly band: DifficultyBand
  readonly difficultyReward: number
  readonly math: ComponentEvidence
  readonly team: ComponentEvidence
  readonly aura: ComponentEvidence
}

export interface ComponentBreakdown {
  readonly component: ScoreComponentKey
  /** How many beats offered this component. */
  readonly opportunities: number
  /** Normalised performance, 0..10000, after the policy's cap. */
  readonly performance: number
  /** The policy weight, in basis points, before renormalisation. */
  readonly declaredWeight: number
  /** The weight actually applied once absent components were removed. */
  readonly effectiveWeight: number
  /** Points this component put into the final score. Sums exactly to it. */
  readonly contribution: number
}

export interface FairScoreResult {
  readonly scorePolicyId: string
  readonly scorePolicyVersion: string
  readonly official: boolean
  /** 0..10000. */
  readonly fairScore: number
  readonly components: readonly ComponentBreakdown[]
  /** Weighted sums behind `MathPerformance`, kept for auditing. */
  readonly mathRaw: number
  readonly mathMax: number
  readonly scoredBeats: number
  /** Beats resolved as `optimal`. Reported for a future tie-break, never scored. */
  readonly optimalCount: number
  readonly evidence: readonly BeatEvidence[]
}

function resolveSignal(
  signal: ScoringSignal,
  policy: CompetitiveScorePolicy,
  event: ScoredEvent,
): number | undefined {
  if (signal === 'none') {
    return undefined
  }
  if (signal === 'discrete-quality') {
    return policy.discreteQuality[event.quality]
  }
  return signal({ quality: event.quality, metrics: event.metrics })
}

function evidenceFor(
  template: ChallengeDefinition,
  policy: CompetitiveScorePolicy,
  event: ScoredEvent,
): Result<BeatEvidence, ScoringFailure> {
  const profile = template.scoring
  const reward = policy.difficultyReward[template.band]

  const measured: Partial<Record<ScoreComponentKey, number | undefined>> = {
    math: resolveSignal(profile.math, policy, event),
    team: resolveSignal(profile.team, policy, event),
    aura: resolveSignal(profile.aura, policy, event),
  }

  for (const component of SCORE_COMPONENTS) {
    const value = measured[component]
    if (value === undefined) {
      continue
    }
    if (
      !Number.isSafeInteger(value) ||
      value < 0 ||
      value > PERFORMANCE_SCALE
    ) {
      return err(
        failure(
          'performance-out-of-range',
          `${template.id}:${component}`,
          `the scoring profile returned ${String(value)}, outside 0..${String(PERFORMANCE_SCALE)}`,
        ),
      )
    }
  }

  const math = measured.math
  if (math === undefined) {
    return err(
      failure(
        'unscorable-template',
        template.id,
        'the template declares no mathematical performance',
      ),
    )
  }

  // Only mathematics carries the difficulty reward. Collaboration and public
  // performance are not harder because the arithmetic behind them was.
  const flat = (value: number | undefined): ComponentEvidence =>
    value === undefined
      ? { achieved: 0, available: 0 }
      : { achieved: value, available: PERFORMANCE_SCALE }

  return ok({
    templateId: template.id,
    band: template.band,
    difficultyReward: reward,
    math: {
      achieved: math * reward,
      available: PERFORMANCE_SCALE * reward,
    },
    team: flat(measured.team),
    aura: flat(measured.aura),
  })
}

function totals(
  evidence: readonly BeatEvidence[],
  component: ScoreComponentKey,
): {
  readonly achieved: number
  readonly available: number
  readonly count: number
} {
  let achieved = 0
  let available = 0
  let count = 0

  for (const beat of evidence) {
    const part = beat[component]
    achieved += part.achieved
    available += part.available
    if (part.available > 0) {
      count += 1
    }
  }

  return { achieved, available, count }
}

function roundHalfUp(value: Rational): number {
  return Number(roundTo(value, 0, 'half-up').n)
}

/**
 * Allocates an exact total across components without losing or inventing points.
 *
 * Rounding each contribution on its own would produce a breakdown whose parts do
 * not add up to the score beside them, and a scoring page that does not add up
 * is a scoring page nobody can defend. Largest remainder distributes the
 * leftover units deterministically, ties broken by the declared component order.
 */
function allocate(
  exact: readonly {
    readonly component: ScoreComponentKey
    readonly value: Rational
  }[],
  total: number,
): Readonly<Record<ScoreComponentKey, number>> {
  const floors = exact.map((entry) => {
    const floored = Number(entry.value.n / entry.value.d)
    return {
      component: entry.component,
      floor: floored,
      remainder: subtract(entry.value, fromInteger(floored)),
    }
  })

  let assigned = floors.reduce((sum, entry) => sum + entry.floor, 0)
  const order = [...floors].sort((left, right) => {
    const difference = subtract(right.remainder, left.remainder)
    if (difference.n !== 0n) {
      return difference.n > 0n ? 1 : -1
    }
    return (
      SCORE_COMPONENTS.indexOf(left.component) -
      SCORE_COMPONENTS.indexOf(right.component)
    )
  })

  const result: Record<ScoreComponentKey, number> = {
    math: 0,
    team: 0,
    aura: 0,
  }
  for (const entry of floors) {
    result[entry.component] = entry.floor
  }

  let index = 0
  while (assigned < total && order.length > 0) {
    const entry = order[index % order.length]
    if (entry !== undefined) {
      result[entry.component] += 1
      assigned += 1
    }
    index += 1
  }

  return result
}

/**
 * Scores a run.
 *
 * Pure, deterministic and free of any browser or server dependency: the same
 * inputs give the same result in a tab, in a simulation and during an
 * authoritative replay.
 */
export function scoreRun(
  events: readonly ScoredEvent[],
  catalog: ContentCatalog,
  policy: CompetitiveScorePolicy,
): Result<FairScoreResult, ScoringFailure> {
  const evidence = resolveEvidence(events, catalog, policy)
  if (!evidence.ok) {
    return evidence
  }

  return aggregate(
    evidence.value,
    policy,
    events.filter((event) => event.quality === 'optimal').length,
  )
}

/**
 * Turns a run's authoritative results into per-beat competitive evidence.
 *
 * Separated from the aggregation so that an audit can explore how the weights,
 * the normalisation and the rounding behave over synthetic performances without
 * having to invent gameplay to produce them — and so that neither half can hide
 * a mistake inside the other.
 */
export function resolveEvidence(
  events: readonly ScoredEvent[],
  catalog: ContentCatalog,
  policy: CompetitiveScorePolicy,
): Result<readonly BeatEvidence[], ScoringFailure> {
  const policyIssues = competitiveScorePolicyIssues(policy)
  if (policyIssues.length > 0) {
    return err(
      failure('invalid-score-policy', policy.id, policyIssues.join('; ')),
    )
  }

  const evidence: BeatEvidence[] = []

  for (const event of events) {
    const template = catalog.template(event.templateId)
    if (template === undefined) {
      return err(
        failure(
          'unknown-template',
          event.templateId,
          'the catalog does not hold this template, so its result cannot be scored',
        ),
      )
    }

    const beat = evidenceFor(template, policy, event)
    if (!beat.ok) {
      return beat
    }
    evidence.push(beat.value)
  }

  return ok(evidence)
}

/** Aggregates per-beat evidence into a run's competitive score. */
export function aggregate(
  evidence: readonly BeatEvidence[],
  policy: CompetitiveScorePolicy,
  optimalCount = 0,
): Result<FairScoreResult, ScoringFailure> {
  const policyIssues = competitiveScorePolicyIssues(policy)
  if (policyIssues.length > 0) {
    return err(
      failure('invalid-score-policy', policy.id, policyIssues.join('; ')),
    )
  }

  const math = totals(evidence, 'math')
  if (math.available === 0) {
    return err(
      failure(
        'no-scorable-evidence',
        'run',
        'the run resolved no beat with mathematical performance',
      ),
    )
  }

  // Normalised performance per component, capped by the policy.
  const performances: Record<ScoreComponentKey, number> = {
    math: 0,
    team: 0,
    aura: 0,
  }
  const opportunities: Record<ScoreComponentKey, number> = {
    math: 0,
    team: 0,
    aura: 0,
  }

  for (const component of SCORE_COMPONENTS) {
    const sums = totals(evidence, component)
    opportunities[component] = sums.count
    if (sums.available === 0) {
      continue
    }
    const normalised = roundHalfUp(
      divide(
        multiply(fromInteger(SCORE_SCALE), fromInteger(sums.achieved)),
        fromInteger(sums.available),
      ),
    )
    performances[component] = Math.min(
      normalised,
      policy.componentCaps[component],
    )
  }

  // Components with no opportunity leave, and their weight is shared out among
  // the ones that stayed. Absence must not cost a player points they had no way
  // of earning.
  const active = SCORE_COMPONENTS.filter(
    (component) => opportunities[component] > 0,
  )
  const activeWeight = active.reduce(
    (sum, component) => sum + policy.weights[component],
    0,
  )

  const exact = active.map((component) => ({
    component,
    value: divide(
      multiply(
        fromInteger(policy.weights[component]),
        fromInteger(performances[component]),
      ),
      fromInteger(activeWeight),
    ),
  }))

  const exactTotal = exact.reduce(
    (sum, entry) => add(sum, entry.value),
    fromInteger(0),
  )
  const fairScore = roundHalfUp(exactTotal)
  const allocated = allocate(exact, fairScore)

  const components: readonly ComponentBreakdown[] = SCORE_COMPONENTS.map(
    (component) => ({
      component,
      opportunities: opportunities[component],
      performance: performances[component],
      declaredWeight: policy.weights[component],
      effectiveWeight:
        opportunities[component] > 0
          ? roundHalfUp(
              divide(
                multiply(
                  fromInteger(SCORE_SCALE),
                  fromInteger(policy.weights[component]),
                ),
                fromInteger(activeWeight),
              ),
            )
          : 0,
      contribution: opportunities[component] > 0 ? allocated[component] : 0,
    }),
  )

  return ok({
    scorePolicyId: policy.id,
    scorePolicyVersion: policy.version,
    official: policy.official,
    fairScore,
    components,
    mathRaw: math.achieved,
    mathMax: math.available,
    scoredBeats: evidence.length,
    optimalCount,
    evidence,
  })
}

/** The scored beats of a run's authoritative history, in play order. */
export function scoredEventsOf(
  history: readonly {
    readonly challengeId: ChallengeId | undefined
    readonly quality: SolutionQuality | undefined
    readonly metrics: ReasoningMetrics | undefined
  }[],
): readonly ScoredEvent[] {
  return history.flatMap((entry) =>
    entry.challengeId === undefined ||
    entry.quality === undefined ||
    entry.metrics === undefined
      ? []
      : [
          {
            templateId: entry.challengeId,
            quality: entry.quality,
            metrics: entry.metrics,
          },
        ],
  )
}
