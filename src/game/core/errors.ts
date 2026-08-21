/**
 * Engine error taxonomy.
 *
 * `EngineRejection` values describe expected refusals: the player, the client
 * or a stored artefact asked for something the rules do not allow. They travel
 * through `Result` and never interrupt control flow.
 *
 * `EngineInvariantError` marks a broken engine assumption. It is thrown because
 * continuing would produce an unsound run, and it must never be triggered by
 * player input alone.
 */

import { assertNever } from './exhaustive'

export type EngineRejection =
  | { readonly kind: 'invalid-command'; readonly detail: string }
  | {
      readonly kind: 'invalid-transition'
      readonly phase: string
      readonly command: string
    }
  | { readonly kind: 'unknown-challenge'; readonly challengeId: string }
  | {
      readonly kind: 'stale-challenge-answer'
      readonly expected: string
      readonly received: string
    }
  | { readonly kind: 'challenge-already-answered'; readonly instanceId: string }
  | { readonly kind: 'invalid-answer'; readonly detail: string }
  | { readonly kind: 'unknown-information-key'; readonly key: string }
  | { readonly kind: 'tool-not-available'; readonly tool: string }
  | { readonly kind: 'run-already-completed' }
  | { readonly kind: 'invalid-content'; readonly issues: readonly string[] }
  | { readonly kind: 'invalid-ruleset'; readonly detail: string }
  | {
      readonly kind: 'unsupported-version'
      readonly field: string
      readonly expected: string
      readonly received: string
    }
  | { readonly kind: 'corrupted-snapshot'; readonly detail: string }
  | {
      readonly kind: 'action-log-sequence-gap'
      readonly expected: number
      readonly received: number
    }
  | { readonly kind: 'replay-mismatch'; readonly detail: string }

/** Stable, localization-free summary used in logs, tests and developer tools. */
export function describeRejection(rejection: EngineRejection): string {
  switch (rejection.kind) {
    case 'invalid-command':
      return `invalid command: ${rejection.detail}`
    case 'invalid-transition':
      return `command ${rejection.command} is not allowed while the run is in phase ${rejection.phase}`
    case 'unknown-challenge':
      return `unknown challenge ${rejection.challengeId}`
    case 'stale-challenge-answer':
      return `answer targets ${rejection.received} but ${rejection.expected} is active`
    case 'challenge-already-answered':
      return `challenge ${rejection.instanceId} was already answered`
    case 'invalid-answer':
      return `invalid answer: ${rejection.detail}`
    case 'unknown-information-key':
      return `unknown information key ${rejection.key}`
    case 'tool-not-available':
      return `tool ${rejection.tool} is not available for this challenge`
    case 'run-already-completed':
      return 'the run is already completed'
    case 'invalid-content':
      return `invalid content: ${rejection.issues.join('; ')}`
    case 'invalid-ruleset':
      return `invalid ruleset: ${rejection.detail}`
    case 'unsupported-version':
      return `unsupported ${rejection.field}: expected ${rejection.expected}, received ${rejection.received}`
    case 'corrupted-snapshot':
      return `corrupted snapshot: ${rejection.detail}`
    case 'action-log-sequence-gap':
      return `action log expected sequence ${String(rejection.expected)} but received ${String(rejection.received)}`
    case 'replay-mismatch':
      return `replay mismatch: ${rejection.detail}`
    default:
      return assertNever(rejection)
  }
}
