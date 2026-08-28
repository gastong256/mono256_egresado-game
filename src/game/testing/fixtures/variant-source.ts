/**
 * Variant source for the development fixtures.
 *
 * The fixtures exist to exercise the engine, not to be catalogued: each one
 * declares a single `base` variant and draws its numbers from the run substream,
 * which is exactly what a real catalogued template must not do. That is
 * deliberate — it gives the pipeline a genuine counter-example to reject, and
 * `address-not-deterministic` is tested against it.
 */

import type { VariantSourceSpec } from '../../challenges/variant-source'

export type DevelopmentParams = Record<string, never>

export const developmentVariantSource: VariantSourceSpec<DevelopmentParams> = {
  authored: [{ id: 'base' } as DevelopmentParams & { readonly id: string }],
  validators: [],
  canonical: () => ({}),
}
