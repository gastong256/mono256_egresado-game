/**
 * Version identity for runs, rules and content.
 *
 * FR-017 requires every official run to record `gameVersion`, `rulesetVersion`
 * and `contentVersion`. ADR-003 makes those versions the compatibility contract
 * for replay: a run may only be resumed or revalidated by an engine that
 * declares the same triple.
 *
 * Which version to raise when behaviour changes:
 *
 * - `ENGINE_VERSION`  — the transition function, RNG consumption order, seed
 *   derivation, action-log format or snapshot codec changed. Existing action
 *   logs may no longer reproduce their original result.
 * - ruleset version   — scoring, difficulty, progression or profile policy
 *   changed while the kernel stayed identical.
 * - content version   — challenge or storylet data changed.
 */

import { assertNever } from './exhaustive'
import type { EngineRejection } from './errors'
import { err, ok, type Result } from './result'

/**
 * Engine/game version of this build. Also serialized as `gameVersion`.
 *
 * `2.0.0` is the career migration: the visible player model went from four
 * bounded stats to `Promedio · Equipo · Aura · Estilo`, which changed run state,
 * the transition function and the snapshot codec. A `1.x` action log cannot
 * reproduce its original result under this engine, and that is exactly what the
 * version triple exists to say out loud instead of discovering it in a replay.
 */
export const ENGINE_VERSION = '2.0.0'

export interface VersionTriple {
  readonly gameVersion: string
  readonly rulesetVersion: string
  readonly contentVersion: string
}

export type VersionField = 'gameVersion' | 'rulesetVersion' | 'contentVersion'

function describeField(field: VersionField): string {
  switch (field) {
    case 'gameVersion':
      return 'gameVersion'
    case 'rulesetVersion':
      return 'rulesetVersion'
    case 'contentVersion':
      return 'contentVersion'
    default:
      return assertNever(field)
  }
}

/**
 * Compatibility is exact equality rather than semver range matching. A run is
 * evidence produced by one specific rule set; silently migrating it between
 * rulesets would invalidate the score it already reported to a player.
 */
export function assertCompatibleVersions(
  expected: VersionTriple,
  received: VersionTriple,
): Result<VersionTriple, EngineRejection> {
  const fields: readonly VersionField[] = [
    'gameVersion',
    'rulesetVersion',
    'contentVersion',
  ]

  for (const field of fields) {
    if (expected[field] !== received[field]) {
      return err({
        kind: 'unsupported-version',
        field: describeField(field),
        expected: expected[field],
        received: received[field],
      })
    }
  }

  return ok(received)
}
