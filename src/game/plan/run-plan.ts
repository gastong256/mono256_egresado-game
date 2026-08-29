/**
 * Run plan: the content a single run actually plays.
 *
 * The catalog says what exists; the plan says what was chosen. The distinction
 * is the whole point. A finished Egresado can hold a large catalog — many
 * families, several templates each, many variants — while one run stays short
 * enough to replay: six school years, one or two beats each.
 *
 * ## What a plan is
 *
 * An ordered list of stages, each with the variant addresses it will play. An
 * entry carries only the address, never the resolved template: the placement
 * role, the eligibility and the gameplay rule all live in the catalog, and
 * duplicating them into the plan would create a second source of truth that can
 * disagree with the first.
 *
 * ## What this module does not do
 *
 * It does not *build* plans. Choosing content by difficulty budget, variety and
 * narrative coherence is the run composer's job, and the composer needs a
 * definition of a valid plan before it can produce good ones. This module is
 * that definition: it says what makes a plan valid, and the composer will later
 * say which valid plan is best.
 */

import type { ChallengeId, ScenarioFamilyId } from '../core/branded'
import {
  isEligibleForStage,
  isOrdinaryBeatRole,
  formatVariantAddress,
  type ChallengePlacementRole,
  type ChallengeVariantRef,
} from '../challenges/content-model'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { ApprovedVariantLookup } from '../challenges/variant-source'
import type { ChallengeDefinition } from '../challenges/contracts'
import type { StageId } from '../progression/stages'
import { contentError, type ValidationIssue } from '../core/issues'

/** One beat a run will play, addressed by content identity alone. */
export interface RunPlanEntry {
  readonly variant: ChallengeVariantRef
}

/** The beats one school year contributes to a run, in play order. */
export interface StageContentPlan {
  readonly stageId: StageId
  readonly entries: readonly RunPlanEntry[]
}

/** The content selected for a whole run, in stage order. */
export interface RunPlan {
  readonly stages: readonly StageContentPlan[]
}

/**
 * How many ordinary beats a school year may contribute.
 *
 * One is the floor because a year the player passes through without deciding
 * anything is not a year. Two is the ceiling because a full run crosses six of
 * them — `7.º → 1.º → 2.º → 3.º → 4.º → 5.º` — and the product depends on that
 * run staying short enough to play again. Richness comes from *which* two, out
 * of a large catalog, not from playing more of them.
 *
 * A checkpoint spends one of these slots. It is a beat like any other; modelling
 * it as an extra mandatory evaluation on top of the budget is exactly how a
 * six-year run turns into a twenty-minute one.
 *
 * Recovery is outside the budget entirely, because it is conditional.
 */
export interface StageBeatBudget {
  readonly min: number
  readonly max: number
}

export const DEFAULT_STAGE_BEAT_BUDGET: StageBeatBudget = {
  min: 1,
  max: 2,
}

/**
 * What a plan is checked against besides the catalog.
 *
 * The approved catalog is optional and the reason is historical: this module
 * was written before one existed, when the only variants a plan could name were
 * the ones a template declared. A composed run names approved addresses
 * instead, so «the template declares it» stopped being the whole rule. Both are
 * accepted, and which one applies is a property of the run, not of the plan.
 */
export interface PlanResolutionOptions {
  readonly budget?: StageBeatBudget
  readonly approvedVariants?: ApprovedVariantLookup
}

/** Variants a template may legitimately be planned with. */
function playableVariants(
  template: ChallengeDefinition,
  approved: ApprovedVariantLookup | undefined,
): readonly ChallengeVariantRef['variantId'][] {
  if (approved === undefined) {
    return template.variants
  }
  const fromCatalog = approved.variantsFor(template.id)
  return fromCatalog.length === 0 ? template.variants : fromCatalog
}

/** A plan entry with its template resolved from the catalog. */
export interface ResolvedPlanEntry {
  readonly variant: ChallengeVariantRef
  readonly template: ChallengeDefinition
  readonly role: ChallengePlacementRole
}

function describe(ref: ChallengeVariantRef): string {
  return formatVariantAddress(ref)
}

/**
 * Resolves one entry against the catalog.
 *
 * Every failure is explicit. Falling back to "the first challenge that exists"
 * would turn a content bug into a silently different run, which is the one
 * outcome a deterministic engine cannot afford.
 */
export function resolvePlanEntry(
  catalog: ContentCatalog,
  entry: RunPlanEntry,
  approved?: ApprovedVariantLookup,
): ResolvedPlanEntry | undefined {
  const template = catalog.template(entry.variant.templateId)
  if (template === undefined) {
    return undefined
  }
  if (template.family !== entry.variant.familyId) {
    return undefined
  }
  if (!playableVariants(template, approved).includes(entry.variant.variantId)) {
    return undefined
  }
  return { variant: entry.variant, template, role: template.placement }
}

/**
 * Resolves an entry and says exactly why when it cannot.
 *
 * One walk, one answer: either the resolved entry or the single issue that
 * explains the failure. Splitting the two would mean two functions that have to
 * agree about what a valid entry is.
 */
function resolveOrExplain(
  catalog: ContentCatalog,
  entry: RunPlanEntry,
  subject: string,
  approved: ApprovedVariantLookup | undefined,
): ResolvedPlanEntry | ValidationIssue {
  const { familyId, templateId, variantId } = entry.variant
  const template = catalog.template(templateId)

  if (template === undefined) {
    return contentError(
      'plan.unknown-template',
      subject,
      `no template ${templateId} in the catalog`,
    )
  }
  if (template.family !== familyId) {
    return contentError(
      'plan.family-mismatch',
      subject,
      `template ${templateId} belongs to ${template.family}, not ${familyId}`,
    )
  }
  if (!playableVariants(template, approved).includes(variantId)) {
    return contentError(
      'plan.unknown-variant',
      subject,
      `variant ${variantId} is neither declared by ${templateId} nor approved for it`,
    )
  }
  return { variant: entry.variant, template, role: template.placement }
}

function isIssue(
  value: ResolvedPlanEntry | ValidationIssue,
): value is ValidationIssue {
  return 'severity' in value
}

/**
 * Checks one school year's slice of a plan.
 *
 * Four rules, and they are all about placement, never about gameplay quality:
 * every entry resolves, every entry is eligible for the stage it was placed in,
 * the ordinary beats stay inside the budget, and exactly one of them is the
 * anchor.
 *
 * Exactly one anchor is deliberate. A year without a primary beat has no centre,
 * and a year with two primaries has no centre either — the second is really a
 * checkpoint or a special. Making it an invariant means a composer cannot
 * produce a shapeless year by accident.
 */
export function validateStagePlan(
  catalog: ContentCatalog,
  plan: StageContentPlan,
  options: PlanResolutionOptions = {},
): readonly ValidationIssue[] {
  const budget = options.budget ?? DEFAULT_STAGE_BEAT_BUDGET
  const issues: ValidationIssue[] = []
  const resolved: ResolvedPlanEntry[] = []
  const seen = new Set<string>()

  for (const entry of plan.entries) {
    const subject = `${plan.stageId}:${describe(entry.variant)}`
    const outcome = resolveOrExplain(
      catalog,
      entry,
      subject,
      options.approvedVariants,
    )
    if (isIssue(outcome)) {
      issues.push(outcome)
      continue
    }

    if (seen.has(describe(entry.variant))) {
      issues.push(
        contentError(
          'plan.duplicate-entry',
          subject,
          'the same variant is planned twice in one stage',
        ),
      )
      continue
    }
    seen.add(describe(entry.variant))

    const entryResolved = outcome

    if (!isEligibleForStage(entryResolved.template, plan.stageId)) {
      issues.push(
        contentError(
          'plan.ineligible-stage',
          subject,
          `template ${entryResolved.template.id} is not eligible for ${plan.stageId}`,
        ),
      )
      continue
    }

    resolved.push(entryResolved)
  }

  const ordinary = resolved.filter((entry) => isOrdinaryBeatRole(entry.role))
  const anchors = ordinary.filter((entry) => entry.role === 'anchor')

  if (ordinary.length < budget.min || ordinary.length > budget.max) {
    issues.push(
      contentError(
        'plan.beat-budget',
        plan.stageId,
        `stage plans ${String(ordinary.length)} ordinary beats, budget is ${String(budget.min)}–${String(budget.max)}`,
      ),
    )
  }

  if (anchors.length !== 1) {
    issues.push(
      contentError(
        'plan.anchor-count',
        plan.stageId,
        `stage plans ${String(anchors.length)} anchor beats, exactly one is required`,
      ),
    )
  }

  return issues
}

/** Checks a whole run plan, stage by stage. */
export function validateRunPlan(
  catalog: ContentCatalog,
  plan: RunPlan,
  options: PlanResolutionOptions = {},
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seenStages = new Set<StageId>()

  for (const stagePlan of plan.stages) {
    if (seenStages.has(stagePlan.stageId)) {
      issues.push(
        contentError(
          'plan.duplicate-stage',
          stagePlan.stageId,
          'the plan contains the same stage twice',
        ),
      )
      continue
    }
    seenStages.add(stagePlan.stageId)
    issues.push(...validateStagePlan(catalog, stagePlan, options))
  }

  return issues
}

/** Convenience constructor for a plan entry from its three identifiers. */
export function planEntry(
  familyId: ScenarioFamilyId,
  templateId: ChallengeId,
  variantId: ChallengeVariantRef['variantId'],
): RunPlanEntry {
  return { variant: { familyId, templateId, variantId } }
}
