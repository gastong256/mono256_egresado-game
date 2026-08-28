/**
 * Content model: scenario family → challenge template → challenge variant.
 *
 * The three levels answer three different questions, and collapsing any two of
 * them is what made the first content set impossible to grow:
 *
 * - **ScenarioFamily** — *where does this happen?* A recognisable, stable
 *   context: the bus, the mural, the school fair. A family is thematic, not
 *   mathematical, and it is not tied to one school year.
 * - **ChallengeTemplate** — *what does the player have to reason about?* One
 *   cognitive structure inside a family. Two templates of the same family are
 *   different **questions**, not the same question with other numbers: the bus
 *   family can ask for a percentage delay and, separately, for the latest safe
 *   departure. A challenge definition *is* a template.
 * - **ChallengeVariant** — *which concrete case is this?* One reproducible
 *   parameterisation of a template, addressed by a stable authored id.
 *
 * Everything here is data. No executable rule and no generated model lives in
 * this module: a variant is an **address**, and the model behind it is
 * recomputed from that address by the template that owns it. That is what keeps
 * run state small, snapshots JSON-safe and replay exact.
 *
 * What this module deliberately does *not* do: generate populations of
 * variants, validate them statistically or deploy an approved competitive
 * catalog. Those belong to the variant-generation stage and need this vocabulary
 * to exist first.
 */

import {
  IDENTIFIER_PATTERN,
  toChallengeId,
  toScenarioFamilyId,
  toVariantId,
  type ChallengeId,
  type RunSeed,
  type ScenarioFamilyId,
  type VariantId,
} from '../core/branded'
import type { EngineRejection } from '../core/errors'
import { EngineInvariantError } from '../core/invariant'
import { err, ok, type Result } from '../core/result'
import { deriveSeedValue, type RngPath } from '../random/seed'
import type { StageId } from '../progression/stages'

/**
 * Why a beat exists in a school year.
 *
 * These are **placement** semantics: they say how a piece of content may be
 * scheduled, and nothing about how well the player did or what it does to a
 * career. A checkpoint is not "worth more" than an anchor.
 */
export const PLACEMENT_ROLES = [
  /** The primary beat of a school year. Exactly one per planned stage. */
  'anchor',
  /** An assessment beat. It spends one of the year's ordinary slots. */
  'checkpoint',
  /** A social, narrative or otherwise exceptional beat. Also spends a slot. */
  'special',
  /**
   * A conditional beat.
   *
   * Recovery content is never part of ordinary selection and never spends an
   * ordinary slot: only progression rules may schedule it, and those rules are
   * not part of this stage. The content model only has to be able to *say* that
   * a template is recovery content.
   */
  'recovery',
] as const

export type ChallengePlacementRole = (typeof PLACEMENT_ROLES)[number]

export function isPlacementRole(
  value: string,
): value is ChallengePlacementRole {
  return (PLACEMENT_ROLES as readonly string[]).includes(value)
}

/**
 * Roles that consume one of a stage's ordinary beats.
 *
 * `special` counts. A social event is still a beat the player plays, and
 * exempting it would let a year quietly grow to three or four situations, which
 * is the one thing the run-length budget exists to prevent.
 */
export function isOrdinaryBeatRole(role: ChallengePlacementRole): boolean {
  return role !== 'recovery'
}

/** A recognisable context that groups several cognitive structures. */
export interface ScenarioFamilyDefinition {
  readonly id: ScenarioFamilyId
  /** Stable key the UI and tooling map to a localized name. */
  readonly labelKey: string
  /** One line describing what the family is about, for authoring tools. */
  readonly summary: string
}

/**
 * The address of one concrete challenge variant.
 *
 * Three stable semantic identifiers and nothing else: no array index, no
 * catalog position, no insertion order. Adding a family to the catalog cannot
 * change what this address resolves to.
 */
export interface ChallengeVariantRef {
  readonly familyId: ScenarioFamilyId
  readonly templateId: ChallengeId
  readonly variantId: VariantId
}

/** Field separator for the flat form of a variant address. */
const ADDRESS_SEPARATOR = '/'

/**
 * Flat, human-readable form of a variant address: `family/template/variant`.
 *
 * The separator cannot occur inside an identifier, so the encoding is
 * unambiguous and the round trip is total.
 */
export function formatVariantAddress(ref: ChallengeVariantRef): string {
  return [ref.familyId, ref.templateId, ref.variantId].join(ADDRESS_SEPARATOR)
}

/** Parses an untrusted flat variant address. */
export function parseVariantAddress(
  value: string,
): Result<ChallengeVariantRef, EngineRejection> {
  const parts = value.split(ADDRESS_SEPARATOR)

  if (parts.length !== 3) {
    return err({
      kind: 'invalid-content',
      issues: [`variant address must be family/template/variant, got ${value}`],
    })
  }

  const [familyId, templateId, variantId] = parts
  if (
    familyId === undefined ||
    templateId === undefined ||
    variantId === undefined
  ) {
    return err({
      kind: 'invalid-content',
      issues: [`variant address must be family/template/variant, got ${value}`],
    })
  }

  for (const [field, part] of [
    ['familyId', familyId],
    ['templateId', templateId],
    ['variantId', variantId],
  ] as const) {
    if (!IDENTIFIER_PATTERN.test(part)) {
      return err({
        kind: 'invalid-content',
        issues: [`${field} must match ${IDENTIFIER_PATTERN.source}`],
      })
    }
  }

  return ok({
    familyId: toScenarioFamilyId(familyId),
    templateId: toChallengeId(templateId),
    variantId: toVariantId(variantId),
  })
}

/** True when both addresses name the same variant. */
export function sameVariantAddress(
  left: ChallengeVariantRef,
  right: ChallengeVariantRef,
): boolean {
  return (
    left.familyId === right.familyId &&
    left.templateId === right.templateId &&
    left.variantId === right.variantId
  )
}

/**
 * RNG substream address of a variant.
 *
 * Only the semantic address takes part. A variant therefore draws the same
 * numbers no matter which school year scheduled it, which slot it landed in or
 * how many other families the catalog happens to contain — the property a
 * future pre-generated variant catalog depends on.
 */
export function variantRngPath(ref: ChallengeVariantRef): RngPath {
  return [
    'family',
    ref.familyId,
    'template',
    ref.templateId,
    'variant',
    ref.variantId,
  ]
}

/**
 * The deterministic generator seed a variant owns under a run.
 *
 * `same run seed + same variant address = same variant seed`, and nothing else
 * enters the derivation. It reuses the engine's substream derivation rather than
 * introducing a second source of randomness.
 */
export function deriveVariantSeed(
  runSeed: RunSeed,
  ref: ChallengeVariantRef,
): number {
  return deriveSeedValue(runSeed, variantRngPath(ref))
}

/**
 * An authored variant: a stable id plus whatever parameters the template needs.
 *
 * Authored variants are the simple case — a short, hand-written list of cases a
 * template can produce. A generated population is a later concern and will
 * address its members the same way, by id.
 */
export interface AuthoredVariant {
  readonly id: string
}

/**
 * The ordered variant ids a template declares.
 *
 * Order comes from the array, never from object key iteration: it is part of the
 * content contract, and reading it from a record would make the contract depend
 * on how a JavaScript engine happens to enumerate keys.
 */
export function authoredVariantIds(
  variants: readonly AuthoredVariant[],
): readonly VariantId[] {
  return variants.map((variant) => toVariantId(variant.id))
}

/**
 * Looks up the authored variant a materialisation asked for.
 *
 * A missing id is an engine invariant failure, not a rejection: the id came from
 * the template's own declared list, so a miss means the content and the address
 * disagree about what exists.
 */
export function authoredVariant<TVariant extends AuthoredVariant>(
  templateId: ChallengeId,
  variants: readonly TVariant[],
  variantId: VariantId,
): TVariant {
  const found = variants.find((variant) => variant.id === variantId)
  if (found === undefined) {
    throw new EngineInvariantError(
      `challenge ${templateId} has no authored variant ${variantId}`,
    )
  }
  return found
}

/** Content-level declaration of where a template may be scheduled. */
export interface StageEligibility {
  readonly stages: readonly StageId[]
}

/**
 * Whether content declares itself eligible for a stage.
 *
 * Eligibility is *permission*, never selection: a template eligible for 7.º does
 * not appear in every 7.º run, and a run plan still has to choose it.
 */
export function isEligibleForStage(
  eligibility: StageEligibility,
  stage: StageId,
): boolean {
  return eligibility.stages.includes(stage)
}
