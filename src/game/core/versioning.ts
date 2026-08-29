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
 * `5.1.0` adds the competitive layer's identity to a run. A run may now declare
 * the `scoreVersion` it is played under, so a submitted score says which
 * calibration it is a claim about; the snapshot codec moved to carry it
 * (`SNAPSHOT_SCHEMA_VERSION` 6) and so did the action log (`ACTION_LOG_VERSION`
 * 4). **Gameplay did not move.** Scoring reads the history and never feeds back
 * into it: the golden runs reproduce the same trace, score preview, profile and
 * command count, and a run that declares no score policy plays exactly as before.
 *
 * `5.0.0` is run composition: a run's content is chosen **before** it starts.
 * A composed run carries a plan — which beats, in which years, drawn from which
 * approved variants — and the runtime executes it instead of drawing a template
 * from a storylet pool as it goes. That changes what a run *is*, so it changes
 * the ruleset too: the composition and difficulty-cost policies are part of the
 * rules now, not of the content. The snapshot codec moved to carry the plan
 * (`SNAPSHOT_SCHEMA_VERSION` 5) and the action log to carry its fingerprint
 * (`ACTION_LOG_VERSION` 3). An uncomposed run — the broad teacher demo, a
 * content set with no composition policy — plays exactly as it did.
 *
 * `4.1.0` puts the approved catalog into real gameplay: a run selects among
 * validated variants instead of a template's curated list, `createRun` refuses
 * a run whose declared catalog is not the one it is being replayed against, and
 * the action log carries that catalog version — which it silently dropped
 * before, so a submitted log could have been replayed against a different
 * approved set. Additive: no serialized state shape changed.
 *
 * `4.0.0` was the variant catalog: a run descriptor can now record which
 * approved variant catalog it drew from, which changed the snapshot codec. The
 * field is optional — a run that plays a template's curated variants drew from
 * no catalog and says so by omitting it — but the serialized shape moved, and a
 * `3.x` snapshot is refused rather than guessed at. Gameplay, mathematics and
 * RNG consumption did not move: the golden runs reproduce the same trace, score,
 * profile and command count.
 *
 * `3.0.0` was the content model: a challenge instance is now addressed by its
 * full content identity — scenario family, template and variant — instead of a
 * bare definition id. The snapshot codec changed with it, and variant selection
 * moved onto its own substream, so a seed that used to produce one authored
 * variant may now produce another. The gameplay, the mathematics and the
 * engine's deterministic protocol did not move: the golden runs reproduce
 * exactly.
 *
 * `2.0.0` was the career migration: the visible player model went from four
 * bounded stats to `Promedio · Equipo · Aura · Estilo`, which changed run state,
 * the transition function and the snapshot codec. A `1.x` action log cannot
 * reproduce its original result under this engine, and that is exactly what the
 * version triple exists to say out loud instead of discovering it in a replay.
 */
export const ENGINE_VERSION = '5.1.0'

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
