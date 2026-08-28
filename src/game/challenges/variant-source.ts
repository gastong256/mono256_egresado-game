/**
 * Where a template's variants come from.
 *
 * A template has one of two variant sources, and both go through the same
 * pipeline:
 *
 * - **authored** — a short curated list of parameter records written by hand.
 *   Right for content whose value is the writing: named classmates, a
 *   choreography, a milestone. Curated does **not** mean trusted: an authored
 *   variant is validated, fingerprinted and deduplicated like any other.
 * - **generated** — a finite candidate space addressed by index. A candidate's
 *   parameters are a pure function of its address, so nothing has to be stored
 *   for a variant to be reproducible: `family/template/candidate` is enough.
 *
 * The two are not exclusive at the template level. A generated template still
 * declares the curated variants the current game plays, because widening what
 * the live run picks is a content decision, not a pipeline one.
 *
 * ## Why parameters and not models
 *
 * A source produces **parameters**: plain JSON-safe data. The template turns
 * parameters into its private model. That split is what lets the pipeline
 * fingerprint semantic content without knowing anything about a challenge, and
 * what keeps a generated variant reproducible from its address alone.
 */

import type { ChallengeId, VariantId } from '../core/branded'
import { toVariantId } from '../core/branded'
import { EngineInvariantError } from '../core/invariant'
import type { Rng } from '../random/rng'
import { authoredVariant, type AuthoredVariant } from './content-model'
import type { ChallengeVariantRef } from './content-model'
import type { MaterializedChallenge } from './contracts'
import {
  validateVariant,
  type VariantDiagnostic,
  type VariantValidator,
} from './variant-validation'

/** Prefix and width of a generated candidate address. */
const CANDIDATE_PREFIX = 'c'
const CANDIDATE_DIGITS = 5

/**
 * The variant id of a candidate at `index`.
 *
 * Zero-padded so the flat address sorts the way a human expects, and prefixed
 * so a generated address can never be confused with an authored one.
 */
export function candidateVariantId(index: number): VariantId {
  if (!Number.isSafeInteger(index) || index < 0) {
    throw new EngineInvariantError(
      `candidate index must be a non-negative integer, received ${String(index)}`,
    )
  }
  return toVariantId(
    `${CANDIDATE_PREFIX}${String(index).padStart(CANDIDATE_DIGITS, '0')}`,
  )
}

/** The candidate index an address names, or `undefined` if it names none. */
export function candidateIndexOf(variantId: string): number | undefined {
  if (!variantId.startsWith(CANDIDATE_PREFIX)) return undefined
  const digits = variantId.slice(CANDIDATE_PREFIX.length)
  if (!/^\d+$/.test(digits)) return undefined
  const index = Number.parseInt(digits, 10)
  return Number.isSafeInteger(index) ? index : undefined
}

/**
 * Everything a generator may read.
 *
 * One substream and nothing else. The substream is addressed by the variant's
 * semantic identity — family, template, candidate — so a candidate produces the
 * same parameters wherever it is generated: in a build job, in a test, or on a
 * server revalidating a submitted run.
 */
export interface CandidateContext {
  readonly rng: Rng
  readonly index: number
}

/**
 * A deterministic candidate generator.
 *
 * `generate` is expected to build parameters that already satisfy the
 * template's intent — constraint first, not draw-and-hope. It may still produce
 * a candidate that validation rejects; that is what the pipeline is for.
 */
export interface VariantGenerator<TParams> {
  /** Stable identity, used in reports and catalog metadata. */
  readonly id: string
  /**
   * Bumped whenever the same candidate address would produce different
   * parameters. It travels into the catalog so a stale artifact is detectable.
   */
  readonly version: string
  /** How many candidate addresses exist. Bounds the address space. */
  readonly candidateSpace: number
  generate(context: CandidateContext): TParams
}

/** An authored parameter record: the parameters plus their stable id. */
export type AuthoredParams<TParams> = TParams & AuthoredVariant

export interface VariantSourceSpec<TParams> {
  /** Curated variants, in authored order. This is what the live game plays. */
  readonly authored: readonly AuthoredParams<TParams>[]
  /** Optional candidate space. Absent means the template is authored-only. */
  readonly generator?: VariantGenerator<TParams>
  /**
   * Checks written next to the challenge, run after the generic ones.
   *
   * This is where the mathematics is defended, ideally with a method
   * independent of the generator's own reasoning.
   */
  readonly validators: readonly VariantValidator<TParams>[]
  /**
   * The semantic content of a variant, as JSON-safe data.
   *
   * This is what the fingerprint covers, so it must contain everything that
   * makes two variants a different problem and nothing that does not — no ids,
   * no ordering artifacts, no derived values that merely restate a parameter.
   */
  canonical(params: TParams): unknown
}

/**
 * Resolves the parameters behind a variant address.
 *
 * One function for both sources, which is what keeps every template's
 * `generate` free of a branch: an authored id is looked up, a candidate id is
 * generated from its own substream.
 */
export function resolveVariantParams<TParams>(
  templateId: ChallengeId,
  source: VariantSourceSpec<TParams>,
  variantId: VariantId,
  variantRng: Rng,
): TParams {
  const index = candidateIndexOf(variantId)

  if (index === undefined) {
    return authoredVariant(templateId, source.authored, variantId)
  }

  const generator = source.generator
  if (generator === undefined) {
    throw new EngineInvariantError(
      `challenge ${templateId} has no generator but was asked for candidate ${variantId}`,
    )
  }
  if (index >= generator.candidateSpace) {
    throw new EngineInvariantError(
      `challenge ${templateId} candidate ${variantId} is outside its space of ${String(generator.candidateSpace)}`,
    )
  }

  return generator.generate({ rng: variantRng, index })
}

/** Whether a template's source can produce this address at all. */
export function sourceAcceptsVariant<TParams>(
  source: VariantSourceSpec<TParams>,
  variantId: string,
): boolean {
  const index = candidateIndexOf(variantId)

  if (index === undefined) {
    return source.authored.some((variant) => variant.id === variantId)
  }

  return (
    source.generator !== undefined && index < source.generator.candidateSpace
  )
}

/**
 * The variant source with its parameter type erased.
 *
 * Same trick as the challenge definition: the concrete type stays inside the
 * closures, so the catalog and the pipeline can work with any template without
 * a cast and without knowing a single challenge's shape.
 */
export interface ErasedVariantSource {
  readonly kind: 'authored' | 'generated'
  readonly authoredIds: readonly VariantId[]
  readonly generatorId: string | undefined
  readonly generatorVersion: string | undefined
  /** Zero when the template is authored-only. */
  readonly candidateSpace: number
  accepts(variantId: string): boolean
  /** Canonical semantic content of the variant at this address. */
  canonicalFor(variantId: VariantId, variantRng: Rng): unknown
  /**
   * Validates the variant at this address.
   *
   * Parameters are resolved inside the closure, where their concrete type is
   * still known, so neither the pipeline nor the catalog ever needs a cast to
   * run a challenge's own checks.
   */
  validate(input: ErasedValidationInput): readonly VariantDiagnostic[]
}

export interface ErasedValidationInput {
  readonly ref: ChallengeVariantRef
  readonly instance: MaterializedChallenge
  readonly variantRng: Rng
}

export function eraseVariantSource<TParams>(
  templateId: ChallengeId,
  source: VariantSourceSpec<TParams>,
): ErasedVariantSource {
  const generator = source.generator

  return {
    kind: generator === undefined ? 'authored' : 'generated',
    authoredIds: source.authored.map((variant) => toVariantId(variant.id)),
    generatorId: generator?.id,
    generatorVersion: generator?.version,
    candidateSpace: generator?.candidateSpace ?? 0,
    accepts: (variantId) => sourceAcceptsVariant(source, variantId),
    canonicalFor: (variantId, variantRng) =>
      source.canonical(
        resolveVariantParams(templateId, source, variantId, variantRng),
      ),
    validate: ({ ref, instance, variantRng }) =>
      validateVariant(
        {
          ref,
          params: resolveVariantParams(
            templateId,
            source,
            ref.variantId,
            variantRng,
          ),
          instance,
        },
        source.validators,
      ),
  }
}
