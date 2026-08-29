/**
 * Fingerprint of a composed run plan.
 *
 * Two things need to answer «is this the same plan?» without comparing it field
 * by field: a resume, which has to notice that the policy behind a saved run has
 * moved, and a future server, which has to notice that a submitted plan is not
 * the one it issued.
 *
 * It covers **everything that determines the plan**, the policy identities
 * included, because a plan built under a different calibration is a different
 * plan even when it happens to name the same beats. It covers nothing volatile,
 * because there is nothing volatile to cover: a composed plan is a pure function
 * of its inputs.
 *
 * The primitives are the ones the variant catalog already uses — canonical JSON
 * and the portable SHA-256 — so this adds a use, not an implementation.
 */

import { canonicalize } from '../core/canonical'
import { sha256Hex } from '../core/hash'
import { formatVariantAddress } from '../challenges/content-model'
import type { ComposedRunPlan } from './composer'

export function planFingerprint(plan: ComposedRunPlan): string {
  return sha256Hex(
    canonicalize({
      composition: [
        plan.compositionPolicyId,
        plan.compositionPolicyVersion,
        plan.difficultyCostPolicyVersion,
        plan.variantCatalogVersion ?? null,
      ],
      difficultyCost: plan.difficultyCost,
      stages: plan.stages.map((stage) => ({
        stageId: stage.stageId,
        difficultyCost: stage.difficultyCost,
        eventCount: stage.eventCount,
        beats: stage.beats.map((beat) => ({
          address: formatVariantAddress(beat.variant),
          role: beat.role,
          band: beat.band,
          cost: beat.cost,
        })),
      })),
    }),
  )
}
