import 'server-only'

/**
 * Authoritative run validation.
 *
 * ADR-004: the browser is not trusted. A client submits *what the player did*,
 * and the server recomputes the result by replaying it. This module is that
 * boundary.
 *
 * The submission is `unknown` on purpose — it arrives from the network. Nothing
 * a client asserts about the outcome is read: the score, the profile and the
 * final career returned here is produced by the engine replaying the actions,
 * so a payload claiming a score simply has that field ignored.
 *
 * This is the use case only. Endpoints, sessions, rate limiting and persistence
 * are separate feature work; what is closed here is that the engine can be
 * driven from a server context and that its result cannot be influenced by the
 * client's claims.
 */

import {
  assertCompatibleVersions,
  ENGINE_VERSION,
  isErr,
  ok,
  parseActionLog,
  planFingerprint,
  replayRun,
  scoreRun,
  scoredEventsOf,
  validateComposedPlan,
  type EngineDependencies,
  type EngineRejection,
  type CareerState,
  type ProfileId,
  type Result,
  type FairScoreResult,
  type RunId,
  type VersionTriple,
} from '@/game'

export interface AuthoritativeRunResult {
  readonly runId: RunId
  /** Recomputed by replay. Never taken from the submission. */
  readonly officialScore: number
  readonly profile: ProfileId
  readonly career: CareerState
  readonly eventsPlayed: number
  readonly versions: VersionTriple
  /** Commands the server actually accepted while replaying. */
  readonly actionsApplied: number
  /**
   * The plan the run actually played, when it was composed.
   *
   * Recomputed by the server from the seed and its own policies, checked
   * against the fingerprint the submission declared, and validated against the
   * rules independently of how it was built.
   */
  readonly planFingerprint?: string
  /** Total scheduling load of the composed plan. Never a score. */
  readonly difficultyCost?: number
  /**
   * Whether the run reached the end of the career, decided here.
   *
   * Recomputed from the replayed progression, never read from the submission.
   * A client that could assert its own graduation could assert it while still
   * owing a year, which is the one state the progression rules exist to make
   * unreachable.
   */
  readonly graduated: boolean
  /** Remediation beats the run played. Progression evidence, never score. */
  readonly recoveries: number
  /** Years that closed owing something. Hidden career history. */
  readonly previas: number
  /**
   * The competitive score, recomputed here.
   *
   * Present only when the run declared a policy and the server holds it. Like
   * `officialScore`, it is produced by replaying the run: nothing the client
   * says about its own score is read, and there is no field a client could set
   * to influence it.
   */
  readonly competitiveScore?: FairScoreResult
}

/**
 * Replays an untrusted submission and returns the authoritative result.
 *
 * Every rejection is typed, so a caller can map it to a response without
 * inspecting messages: a malformed payload, an incompatible ruleset, an action
 * the rules would not have allowed, or a run that never finished.
 */
export function validateSubmittedRun(
  submission: unknown,
  dependencies: EngineDependencies,
): Result<AuthoritativeRunResult, EngineRejection> {
  // 1. Parse. This is where identifier charsets, command shapes and action
  //    sequence continuity are enforced.
  const log = parseActionLog(submission)
  if (isErr(log)) {
    return log
  }

  // 2. Refuse a run produced by rules this server does not implement. Replaying
  //    it would score the player against the wrong ruleset.
  const expected: VersionTriple = {
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: dependencies.ruleset.contentVersion,
  }
  const compatible = assertCompatibleVersions(expected, {
    gameVersion: log.value.descriptor.gameVersion,
    rulesetVersion: log.value.descriptor.rulesetVersion,
    contentVersion: log.value.descriptor.contentVersion,
  })
  if (isErr(compatible)) {
    return compatible
  }

  // 3. Replay. A command the rules would not have allowed aborts the whole
  //    submission rather than being skipped.
  const replayed = replayRun(log.value, dependencies)
  if (isErr(replayed)) {
    return replayed
  }

  const state = replayed.value.state

  /*
   * 4. Check the composition, when there is one.
   *
   * The client does not send a plan and could not be believed if it did: the
   * server composes from the seed and its own policies, and the submission's
   * fingerprint says which plan the player was promised. Then the plan is put
   * through the same independent validator a plan from anywhere else would
   * face — approved variants, one anchor, the beat budget, honest costs.
   */
  const plan = state.plan
  if (plan !== undefined) {
    const declared = log.value.descriptor.planFingerprint
    const actual = planFingerprint(plan)
    if (declared !== undefined && declared !== actual) {
      return {
        ok: false,
        error: {
          kind: 'unsupported-version',
          field: 'planFingerprint',
          expected: actual,
          received: declared,
        },
      }
    }

    if (dependencies.composition !== undefined) {
      const issues = validateComposedPlan(plan, {
        catalog: dependencies.catalog,
        policy: dependencies.composition,
        ...(dependencies.approvedVariants === undefined
          ? {}
          : { approvedVariants: dependencies.approvedVariants }),
      })
      const blocking = issues.filter((issue) => issue.severity === 'error')
      if (blocking.length > 0) {
        return {
          ok: false,
          error: {
            kind: 'invalid-content',
            issues: blocking.map(
              (issue) => `${issue.code} @ ${issue.subject}: ${issue.message}`,
            ),
          },
        }
      }
    }
  }

  /*
   * 5. Score the run competitively, when it declared a policy.
   *
   * From the replayed history and nothing else. The submission does not carry a
   * score to compare against — it carries the actions, and this is what they are
   * worth under the policy the run named.
   */
  let competitiveScore: FairScoreResult | undefined
  if (
    log.value.descriptor.scoreVersion !== undefined &&
    dependencies.competitiveScore !== undefined
  ) {
    const scored = scoreRun(
      scoredEventsOf(state.history),
      dependencies.catalog,
      dependencies.competitiveScore,
    )
    if (isErr(scored)) {
      return {
        ok: false,
        error: {
          kind: 'invalid-content',
          issues: [
            `${scored.error.code} @ ${scored.error.subject}: ${scored.error.detail}`,
          ],
        },
      }
    }
    competitiveScore = scored.value
  }

  /*
   * 6. Refuse a run that finished owing something.
   *
   * Not a defensive check against a hostile client — a client cannot reach this
   * state, because the transition will not produce it. It is a check against
   * *us*: if a future change ever let a run complete with an open obligation,
   * this is where the server notices instead of ranking it.
   */
  if (state.progression.pending.length > 0) {
    return {
      ok: false,
      error: {
        kind: 'invalid-content',
        issues: [
          `the replayed run completed with ${String(state.progression.pending.length)} obligations still open`,
        ],
      },
    }
  }

  // 7. Only a finished run has an official result.
  if (state.status !== 'completed' || state.completion === undefined) {
    return {
      ok: false,
      error: {
        kind: 'replay-mismatch',
        detail: `the submitted actions leave the run ${state.status} at phase ${state.phase}`,
      },
    }
  }

  return ok({
    runId: state.descriptor.runId,
    officialScore: state.completion.totalScore,
    profile: state.completion.profile.profileId,
    career: state.completion.career,
    eventsPlayed: state.completion.eventsPlayed,
    versions: expected,
    actionsApplied: replayed.value.applied,
    ...(plan === undefined
      ? {}
      : {
          planFingerprint: planFingerprint(plan),
          difficultyCost: plan.difficultyCost,
        }),
    graduated: state.progression.graduated,
    recoveries: state.progression.history.length,
    previas: state.progression.history.filter((entry) => entry.previa).length,
    ...(competitiveScore === undefined ? {} : { competitiveScore }),
  })
}
