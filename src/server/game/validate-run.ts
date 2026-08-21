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
 * final stats returned here are produced by the engine replaying the actions,
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
  replayRun,
  type EngineDependencies,
  type EngineRejection,
  type PlayerStats,
  type ProfileId,
  type Result,
  type RunId,
  type VersionTriple,
} from '@/game'

export interface AuthoritativeRunResult {
  readonly runId: RunId
  /** Recomputed by replay. Never taken from the submission. */
  readonly officialScore: number
  readonly profile: ProfileId
  readonly stats: PlayerStats
  readonly eventsPlayed: number
  readonly versions: VersionTriple
  /** Commands the server actually accepted while replaying. */
  readonly actionsApplied: number
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

  // 4. Only a finished run has an official result.
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
    stats: state.completion.stats,
    eventsPlayed: state.completion.eventsPlayed,
    versions: expected,
    actionsApplied: replayed.value.applied,
  })
}
