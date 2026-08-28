/**
 * Building the address of a challenge instance outside a run.
 *
 * The pipeline, the content validator and the test helpers all need the same
 * thing: take a template, pick a variant, and produce the address a run would
 * have produced. Doing it by hand at each call site means rebuilding the address
 * every time, and a call site that gets it wrong exercises something the engine
 * would never generate.
 *
 * The address is built from the template's own declarations, so a caller cannot
 * ask for a variant or a stage the template does not have.
 */

import { toChallengeInstanceId, type VariantId } from '../core/branded'
import { EngineInvariantError } from '../core/invariant'
import type { StageId } from '../progression/stages'
import type { ChallengeDefinition, ChallengeInstanceRef } from './contracts'
import type { DifficultyLevel } from './taxonomy'

export interface InstanceAddressOptions {
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
  options: InstanceAddressOptions = {},
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

  if (!template.variantSource.accepts(variantId)) {
    throw new EngineInvariantError(
      `challenge ${template.id} does not accept variant ${variantId}`,
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
