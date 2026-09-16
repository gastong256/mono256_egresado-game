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
 * `10.0.0` adds rare events: a run records which ones appeared, and a beat can
 * carry the note one of them added. The selection is deterministic —eligibility
 * first, then a draw on its own `rare-events` substream, then the career
 * budget— so a replay reproduces it, and what a rare event may do is bounded by
 * construction: tell something else, or swap **which approved variant** of the
 * same Template is played. It never adds a beat, moves a score ceiling or
 * decides graduation. Run state grew the record and the snapshot codec moved
 * with it (`SNAPSHOT_SCHEMA_VERSION` 8). The action log did **not** move: a
 * rare event needs no new command, because it is not something the player does.
 *
 * `9.0.0` adds the route response — the stops of a trip in the order the player
 * chose, where the order *is* the answer — and a multi-day mode for the
 * schedule: its minutes are absolute from the first day, so a plan that spans a
 * week stays one line of integers instead of growing a second field.
 * ACTION_LOG_VERSION 7 encodes both; snapshot 7 is untouched because nothing
 * new is persisted. Grade 7, Grade 1 and Grade 2 content, traits, scoring and
 * composition are unchanged.
 *
 * `8.0.0` adds the classification response — statements labelled against a
 * shared set, with the public stance carried in its own field so a Template can
 * keep its Math action and its Aura action apart. ACTION_LOG_VERSION 6 encodes
 * it; snapshot 7 is untouched because nothing new is persisted. Grade 7 and
 * Grade 1 content, traits, scoring and composition are unchanged.
 *
 * `7.0.0` adds bounded global composition, semantic constructive responses,
 * presentation-only narrative context and approved-only recovery/debriefs.
 * ACTION_LOG_VERSION 5 encodes the three new answer kinds. Snapshot 7 remains:
 * new views are derived and no persisted field was added. G7 content, traits,
 * scoring and legacy composition remain unchanged. Older version triples/logs
 * are explicitly rejected, never silently migrated or reinterpreted.
 *
 * `6.0.0` is progression: a run now knows what a bad year owes and whether it
 * graduated. A poor ordinary result leaves an obligation the year must close
 * before it can end, closing it is a remediation beat scheduled outside the
 * ordinary budget, and a run that plays its final year out owing nothing
 * reaches `GRADUATED` — which, by construction, is every valid completed run.
 * Run state grew a progression field and the snapshot codec moved with it
 * (`SNAPSHOT_SCHEMA_VERSION` 7).
 *
 * The action log did **not** move: remediation needs no new command, because a
 * remediation beat is answered exactly like any other. Bumping its version for
 * a change it does not encode would have made every stored log look
 * incompatible with a format it still matches.
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
export const ENGINE_VERSION = '10.0.0'

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
