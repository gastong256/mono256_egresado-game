/**
 * Compile-time exhaustiveness for discriminated unions.
 *
 * Adding a variant to a union makes every `switch` that forgets it fail to
 * type-check, which is how the engine keeps command, event, interaction and
 * condition handling complete without a pattern-matching dependency.
 */

import { EngineInvariantError } from './invariant'

export function assertNever(value: never): never {
  throw new EngineInvariantError(
    `unhandled union member: ${JSON.stringify(value)}`,
  )
}
