/**
 * Replay.
 *
 * Re-executes a run from its descriptor and action log:
 *
 *     createRun(descriptor) -> action[0] -> action[1] -> ... -> finalState
 *
 * This is the mechanism ADR-004 relies on. It runs identically in the browser
 * and in Node because the engine touches no environment, so the server can
 * recompute an official score without trusting anything the client claimed.
 *
 * A rejected command aborts the replay: a log that contains a move the rules
 * would not have allowed is not a valid run.
 */

import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import type { DomainEvent } from './events'
import type { RunState } from './state'
import type { RunActionLog } from './action-log'
import { createRun, transition, type EngineDependencies } from './transition'

export interface ReplayOutcome {
  readonly state: RunState
  readonly events: readonly DomainEvent[]
  /** Number of commands applied. */
  readonly applied: number
}

export function replayRun(
  log: RunActionLog,
  dependencies: EngineDependencies,
): Result<ReplayOutcome, EngineRejection> {
  const created = createRun(log.descriptor, dependencies)

  if (!created.ok) {
    return created
  }

  let state = created.value.state
  const events: DomainEvent[] = [...created.value.events]

  for (const envelope of log.actions) {
    const result = transition(state, envelope.command, dependencies)

    if (!result.ok) {
      return err({
        kind: 'replay-mismatch',
        detail: `action ${String(envelope.sequence)} (${envelope.command.type}) was rejected: ${result.error.kind}`,
      })
    }

    state = result.value.state
    events.push(...result.value.events)
  }

  return ok({ state, events, applied: log.actions.length })
}

/**
 * Compares a replayed run against a claimed final state.
 *
 * Used by tests and by future server validation to detect an engine version
 * whose deterministic output has drifted. Comparison is on the canonical JSON
 * form, so field order can never produce a false mismatch.
 */
export function statesMatch(left: RunState, right: RunState): boolean {
  return canonicalize(left) === canonicalize(right)
}

/**
 * Stable JSON with keys sorted at every level.
 *
 * `JSON.stringify` preserves insertion order, which two structurally identical
 * states can differ in; sorting removes that as a source of false negatives.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))

    return Object.fromEntries(
      entries.map(([key, entry]) => [key, sortValue(entry)]),
    )
  }

  return value
}
