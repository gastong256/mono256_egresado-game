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

import {
  toChallengeInstanceId,
  toRunSeed,
  type VariantId,
} from '../core/branded'
import {
  variantRefOf,
  type ChallengeDefinition,
  type ChallengeInstanceRef,
  type MaterializedChallenge,
} from '../challenges/contracts'
import { variantRngPath } from '../challenges/content-model'
import type { DifficultyLevel } from '../challenges/taxonomy'
import { EngineInvariantError } from '../core/invariant'
import type { StageId } from '../progression/stages'
import { createRng } from '../random/rng'

export interface MaterializeOptions {
  /** Run seed the two substreams are derived from. */
  readonly seed: string
  /** Defaults to the template's first declared stage. */
  readonly stage?: StageId
  /** Defaults to the template's first declared variant. */
  readonly variantId?: VariantId
  readonly eventIndex?: number
  /** Defaults to the template's intrinsic difficulty. */
  readonly difficulty?: DifficultyLevel
}

/** The instance address a run would build for these options. */
export function instanceRefFor(
  template: ChallengeDefinition,
  options: MaterializeOptions,
): ChallengeInstanceRef {
  const stage = options.stage ?? template.stages[0]
  if (stage === undefined) {
    throw new EngineInvariantError(
      `challenge ${template.id} declares no stage to materialise in`,
    )
  }

  const variantId = options.variantId ?? template.variants[0]
  if (variantId === undefined) {
    throw new EngineInvariantError(
      `challenge ${template.id} declares no variant`,
    )
  }

  if (!template.variants.includes(variantId)) {
    throw new EngineInvariantError(
      `challenge ${template.id} does not declare variant ${variantId}`,
    )
  }

  const eventIndex = options.eventIndex ?? 0

  return {
    instanceId: toChallengeInstanceId(
      `${stage}:${String(eventIndex)}:${template.id}`,
    ),
    familyId: template.family,
    templateId: template.id,
    variantId,
    stageId: stage,
    eventIndex,
    difficulty: options.difficulty ?? template.baseDifficulty,
  }
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
    variantRng: createRng(seed, variantRngPath(variantRefOf(ref))),
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
