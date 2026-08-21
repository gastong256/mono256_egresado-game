/**
 * Structural invariants of a run state.
 *
 * The snapshot schema validates each field on its own, but a run state is only
 * coherent when fields *agree*: a challenge phase needs a challenge, a completed
 * run needs a result, and the preview score has to be the sum of what was
 * actually awarded. A snapshot that satisfies the schema while breaking those
 * relationships restores into a run that cannot progress, so the codec checks
 * them before handing the state back.
 *
 * These are cheap structural checks, not a re-simulation. Proving a run *could*
 * have happened is what replaying its action log is for.
 *
 * The correlation is expressed here rather than in the type because making
 * `phase` a discriminated union that carries its payload would change the
 * persisted shape and ripple through transition, selectors and UI, while the
 * defect only ever enters through this one boundary. The union remains a
 * reasonable future evolution.
 */

import { assertNever } from '../core/exhaustive'
import type { RunState } from './state'

/** Returns one message per broken invariant; empty means coherent. */
export function runStateIssues(state: RunState): readonly string[] {
  const issues: string[] = []
  const active = state.activeEvent

  switch (state.phase) {
    case 'narrative':
      if (active === undefined) {
        issues.push('phase "narrative" requires an active event')
      } else if (active.challenge !== undefined) {
        issues.push('phase "narrative" must not carry a challenge')
      }
      break
    case 'challenge':
      if (active?.challenge === undefined) {
        issues.push('phase "challenge" requires an active challenge')
      }
      break
    case 'feedback':
      if (state.pendingFeedback === undefined) {
        issues.push('phase "feedback" requires pending feedback')
      }
      if (active === undefined) {
        issues.push('phase "feedback" requires an active event')
      }
      break
    case 'completed':
      if (active !== undefined) {
        issues.push('a completed run must not carry an active event')
      }
      if (state.pendingFeedback !== undefined) {
        issues.push('a completed run must not carry pending feedback')
      }
      break
    default:
      assertNever(state.phase)
  }

  if (state.status === 'active' && state.phase === 'completed') {
    issues.push('an active run cannot be in the completed phase')
  }
  if (state.status !== 'active' && state.phase !== 'completed') {
    issues.push(`a ${state.status} run must be in the completed phase`)
  }
  if (state.status === 'completed' && state.completion === undefined) {
    issues.push('a completed run requires a completion result')
  }
  if (state.status !== 'completed' && state.completion !== undefined) {
    issues.push('only a completed run may carry a completion result')
  }

  // History has to be a contiguous log starting at zero.
  for (const [index, entry] of state.history.entries()) {
    if (entry.sequence !== index) {
      issues.push(
        `history entry ${String(index)} declares sequence ${String(entry.sequence)}`,
      )
    }
  }

  if (state.history.length > state.eventIndex + 1) {
    issues.push('history holds more events than the run has reached')
  }

  // The preview score is a derived value, so a tampered total is detectable
  // without replaying anything.
  const awarded = state.history.reduce(
    (total, entry) => total + entry.points,
    0,
  )
  if (awarded !== state.scorePreview) {
    issues.push(
      `score preview ${String(state.scorePreview)} does not match the ${String(awarded)} points awarded`,
    )
  }

  const resolvedQualities = state.history.filter(
    (entry) => entry.quality !== undefined,
  ).length
  if (resolvedQualities !== state.qualityHistory.length) {
    issues.push('quality history does not match the resolved events')
  }

  if (state.optimalStreak > state.qualityHistory.length) {
    issues.push('optimal streak exceeds the number of resolved challenges')
  }

  // Every storylet the run played must be recorded as seen, otherwise cooldown
  // and no-repeat selection would behave differently after a resume.
  const seen = new Set<string>(state.seenStorylets)
  for (const entry of state.history) {
    if (!seen.has(entry.storyletId)) {
      issues.push(`history references unseen storylet ${entry.storyletId}`)
    }
  }
  if (active !== undefined && !seen.has(active.storyletId)) {
    issues.push(`active event references unseen storylet ${active.storyletId}`)
  }

  return issues
}
