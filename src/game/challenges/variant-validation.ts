/**
 * Variant validation.
 *
 * A generator saying "I produced it" is not the same as "this is safe to put in
 * front of a player during a competition". Between the two sits this module:
 * two levels of checks that every variant, authored or generated, has to pass
 * before it can be approved.
 *
 * **Generic** checks know nothing about any challenge. They protect the things
 * that are wrong for structural reasons: a parameter that is not JSON-safe, an
 * address the template does not accept, two options the player cannot tell
 * apart, a label no phone can show.
 *
 * **Template-specific** checks are written next to the challenge they guard and
 * are where the mathematics is defended. They should use an *independent*
 * method wherever one is affordable — an exhaustive search, a second derivation
 * — because a validator that reuses the generator's own reasoning will happily
 * confirm the generator's own mistake.
 *
 * Diagnostics are data, never thrown strings: a rejected candidate is an
 * expected outcome of generation, and the audit needs to count reasons.
 */

import { formatVariantAddress, type ChallengeVariantRef } from './content-model'
import type { MaterializedChallenge } from './contracts'

/** Stable, machine-readable reasons a variant can be rejected. */
export const VARIANT_DIAGNOSTIC_CODES = [
  'address-not-accepted',
  'address-not-deterministic',
  'parameters-not-serializable',
  'unsafe-number',
  'template-invariant',
  'duplicate-option',
  'option-count',
  'label-too-long',
  'value-too-long',
  'no-valid-solution',
  'ambiguous-optimum',
  'unreasonable-value',
  'trivial-decision',
  'generation-failed',
] as const

export type VariantDiagnosticCode = (typeof VARIANT_DIAGNOSTIC_CODES)[number]

export interface VariantDiagnostic {
  readonly code: VariantDiagnosticCode
  /** Flat address of the variant the diagnostic is about. */
  readonly address: string
  readonly detail: string
}

export function variantDiagnostic(
  code: VariantDiagnosticCode,
  ref: ChallengeVariantRef,
  detail: string,
): VariantDiagnostic {
  return { code, address: formatVariantAddress(ref), detail }
}

/** Everything a validator may look at. */
export interface VariantValidationInput<TParams = unknown> {
  readonly ref: ChallengeVariantRef
  readonly params: TParams
  /** The instance a run would present. Gives access to the public view. */
  readonly instance: MaterializedChallenge
}

export type VariantValidator<TParams = unknown> = (
  input: VariantValidationInput<TParams>,
) => readonly VariantDiagnostic[]

/**
 * Presentation limits the current interfaces can actually honour.
 *
 * These are semantic content constraints, not CSS: the engine has no business
 * knowing a padding value, but it does need to refuse a variant that would
 * produce a nine-option card or a label that cannot be read on a 360 px phone.
 * The numbers come from what the authored content already respects, with a
 * little headroom.
 */
export const PRESENTATION_LIMITS = {
  maxOptions: 6,
  maxOptionLabelChars: 48,
  maxDatumValueChars: 24,
  maxGridNumbers: 24,
} as const

function isJsonSafe(value: unknown, path: string): string | undefined {
  if (value === null) return undefined

  switch (typeof value) {
    case 'string':
    case 'boolean':
      return undefined
    case 'number':
      return Number.isFinite(value)
        ? undefined
        : `${path} is ${String(value)}, which cannot survive serialization`
    case 'object': {
      if (Array.isArray(value)) {
        for (const [index, entry] of value.entries()) {
          const issue = isJsonSafe(entry, `${path}[${String(index)}]`)
          if (issue !== undefined) return issue
        }
        return undefined
      }
      for (const [key, entry] of Object.entries(value)) {
        const issue = isJsonSafe(entry, `${path}.${key}`)
        if (issue !== undefined) return issue
      }
      return undefined
    }
    default:
      return `${path} is a ${typeof value}, which is not JSON-safe`
  }
}

/**
 * Checks that hold for every variant of every template.
 *
 * They run against the materialised instance, so they see exactly what a player
 * would: the same public view, with the solution already excluded.
 */
export function validateGeneric(
  input: VariantValidationInput<unknown>,
): readonly VariantDiagnostic[] {
  const diagnostics: VariantDiagnostic[] = []
  const { ref, params, instance } = input

  const serializationIssue = isJsonSafe(params, 'params')
  if (serializationIssue !== undefined) {
    diagnostics.push(
      variantDiagnostic(
        typeof params === 'number' ||
          serializationIssue.includes('which cannot')
          ? 'unsafe-number'
          : 'parameters-not-serializable',
        ref,
        serializationIssue,
      ),
    )
  }

  // The template's own content-time invariants. A non-empty result is exactly
  // the challenge saying this instance should never have been built.
  for (const issue of instance.verify()) {
    diagnostics.push(variantDiagnostic('template-invariant', ref, issue))
  }

  const view = instance.present([])

  if ('options' in view) {
    const options = view.options
    if (options.length > PRESENTATION_LIMITS.maxOptions) {
      diagnostics.push(
        variantDiagnostic(
          'option-count',
          ref,
          `${String(options.length)} options exceeds the ${String(PRESENTATION_LIMITS.maxOptions)} the interface supports`,
        ),
      )
    }

    const ids = new Set<string>()
    const labels = new Set<string>()
    for (const option of options) {
      if (ids.has(option.id)) {
        diagnostics.push(
          variantDiagnostic(
            'duplicate-option',
            ref,
            `repeated id ${option.id}`,
          ),
        )
      }
      ids.add(option.id)

      if (labels.has(option.label)) {
        diagnostics.push(
          variantDiagnostic(
            'duplicate-option',
            ref,
            `two options read exactly "${option.label}"`,
          ),
        )
      }
      labels.add(option.label)

      if (option.label.length > PRESENTATION_LIMITS.maxOptionLabelChars) {
        diagnostics.push(
          variantDiagnostic(
            'label-too-long',
            ref,
            `option label of ${String(option.label.length)} characters: "${option.label}"`,
          ),
        )
      }
    }
  }

  if ('data' in view) {
    for (const datum of view.data) {
      if (datum.value.length > PRESENTATION_LIMITS.maxDatumValueChars) {
        diagnostics.push(
          variantDiagnostic(
            'value-too-long',
            ref,
            `datum "${datum.label}" renders ${String(datum.value.length)} characters`,
          ),
        )
      }
    }
  }

  if (view.kind === 'number-grid') {
    for (const round of view.rounds) {
      if (round.numbers.length > PRESENTATION_LIMITS.maxGridNumbers) {
        diagnostics.push(
          variantDiagnostic(
            'option-count',
            ref,
            `round ${round.id} shows ${String(round.numbers.length)} cells`,
          ),
        )
      }
    }
  }

  return diagnostics
}

/** Runs the generic checks and then the template's own. */
export function validateVariant<TParams>(
  input: VariantValidationInput<TParams>,
  templateValidators: readonly VariantValidator<TParams>[],
): readonly VariantDiagnostic[] {
  return [
    ...validateGeneric(input),
    ...templateValidators.flatMap((validator) => validator(input)),
  ]
}

/** Convenience for a template validator that only reads its own parameters. */
export function paramsValidator<TParams>(
  check: (
    params: TParams,
    ref: ChallengeVariantRef,
  ) => readonly VariantDiagnostic[],
): VariantValidator<TParams> {
  return (input) => check(input.params, input.ref)
}

/** Groups diagnostics by code, for reports. */
export function countByCode(
  diagnostics: readonly VariantDiagnostic[],
): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const diagnostic of diagnostics) {
    counts[diagnostic.code] = (counts[diagnostic.code] ?? 0) + 1
  }
  return counts
}

/** True when nothing in the list blocks approval. */
export function isApprovable(
  diagnostics: readonly VariantDiagnostic[],
): boolean {
  return diagnostics.length === 0
}
