/**
 * Materialising one challenge instance outside a run.
 *
 * Content tests, property tests and authoring tools all need the same thing:
 * take a template, pick a variant, and get the instance a run would have
 * produced. Doing it by hand means rebuilding the instance address and both
 * substreams at every call site, and a call site that gets the address wrong
 * tests something the engine would never generate.
 *
 * The address is built from the template's own declarations, so a test cannot
 * accidentally ask for a variant or a stage the template does not have.
 */

import { toRunSeed } from '../core/branded'
import {
  variantRefOf,
  type ChallengeDefinition,
  type MaterializedChallenge,
} from '../challenges/contracts'
import {
  instanceRefFor,
  type InstanceAddressOptions,
} from '../challenges/instance-address'
import { createVariantRng } from '../challenges/content-model'
import { createRng } from '../random/rng'

export interface MaterializeOptions extends InstanceAddressOptions {
  /** Run seed the challenge substream is derived from. */
  readonly seed: string
}

/** Generates the instance a run would generate at this address. */
export function materializeVariant(
  template: ChallengeDefinition,
  options: MaterializeOptions,
): MaterializedChallenge {
  const ref = instanceRefFor(template, options)
  const seed = toRunSeed(options.seed)

  return template.materialize(ref, {
    rng: createRng(seed, [
      'stage',
      ref.stageId,
      'event',
      ref.eventIndex,
      'challenge',
      ref.templateId,
      'difficulty',
      ref.difficulty,
    ]),
    difficulty: ref.difficulty,
    variantId: ref.variantId,
    variantRng: createVariantRng(variantRefOf(ref)),
  })
}

/** One instance per declared variant, in authored order. */
export function materializeEveryVariant(
  template: ChallengeDefinition,
  seed: string,
): readonly MaterializedChallenge[] {
  return template.variants.map((variantId) =>
    materializeVariant(template, { seed, variantId }),
  )
}
