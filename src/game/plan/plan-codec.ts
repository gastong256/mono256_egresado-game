/**
 * Serialized form of a composed run plan.
 *
 * A plan crosses three boundaries — a resume snapshot, a future server
 * submission, and any tooling that writes one to disk — and at every one of them
 * it stops being a value the engine produced and becomes data of unknown
 * provenance. So it is parsed, never cast.
 *
 * Parsing only establishes shape. Whether the plan is *legitimate* — approved
 * variants, one anchor, the right budget, honest costs — is
 * [`validateComposedPlan`](./plan-validator.ts), and a plan that parses cleanly
 * can still be refused there. Conflating the two is how a client ends up
 * trusted because its JSON was well formed.
 */

import { z } from 'zod'

import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import { toChallengeId, toScenarioFamilyId, toVariantId } from '../core/branded'
import { DIFFICULTY_BANDS } from '../difficulty/cognitive'
import { STAGE_ORDER } from '../progression/stages'
import type { ComposedRunPlan } from './composer'

const identifier = z.string().min(1).max(120)

const beatSchema = z.object({
  familyId: identifier,
  templateId: identifier,
  variantId: identifier,
  role: z.enum(['anchor', 'checkpoint', 'special']),
  band: z.enum(DIFFICULTY_BANDS),
  cost: z.int().positive().max(100_000),
})

const stageSchema = z.object({
  stageId: z.enum(STAGE_ORDER),
  beats: z.array(beatSchema).min(1).max(8),
  difficultyCost: z.int().nonnegative().max(1_000_000),
  eventCount: z.int().positive().max(64),
})

const planSchema = z.object({
  compositionPolicyId: identifier,
  compositionPolicyVersion: identifier,
  difficultyCostPolicyVersion: identifier,
  variantCatalogVersion: identifier.nullable(),
  stages: z.array(stageSchema).min(1).max(16),
  difficultyCost: z.int().nonnegative().max(10_000_000),
})

/** The plan as JSON: branded ids flattened, an absent catalog written as null. */
export function serializeRunPlan(plan: ComposedRunPlan): unknown {
  return {
    compositionPolicyId: plan.compositionPolicyId,
    compositionPolicyVersion: plan.compositionPolicyVersion,
    difficultyCostPolicyVersion: plan.difficultyCostPolicyVersion,
    variantCatalogVersion: plan.variantCatalogVersion ?? null,
    difficultyCost: plan.difficultyCost,
    stages: plan.stages.map((stage) => ({
      stageId: stage.stageId,
      difficultyCost: stage.difficultyCost,
      eventCount: stage.eventCount,
      beats: stage.beats.map((beat) => ({
        familyId: beat.variant.familyId,
        templateId: beat.variant.templateId,
        variantId: beat.variant.variantId,
        role: beat.role,
        band: beat.band,
        cost: beat.cost,
      })),
    })),
  }
}

export function parseRunPlan(
  value: unknown,
): Result<ComposedRunPlan, EngineRejection> {
  const parsed = planSchema.safeParse(value)

  if (!parsed.success) {
    return err({
      kind: 'invalid-content',
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || 'plan'}: ${issue.message}`,
      ),
    })
  }

  const raw = parsed.data

  return ok({
    compositionPolicyId: raw.compositionPolicyId,
    compositionPolicyVersion: raw.compositionPolicyVersion,
    difficultyCostPolicyVersion: raw.difficultyCostPolicyVersion,
    ...(raw.variantCatalogVersion === null
      ? {}
      : { variantCatalogVersion: raw.variantCatalogVersion }),
    difficultyCost: raw.difficultyCost,
    stages: raw.stages.map((stage) => ({
      stageId: stage.stageId,
      difficultyCost: stage.difficultyCost,
      eventCount: stage.eventCount,
      beats: stage.beats.map((beat) => ({
        variant: {
          familyId: toScenarioFamilyId(beat.familyId),
          templateId: toChallengeId(beat.templateId),
          variantId: toVariantId(beat.variantId),
        },
        role: beat.role,
        band: beat.band,
        cost: beat.cost,
      })),
    })),
  })
}
