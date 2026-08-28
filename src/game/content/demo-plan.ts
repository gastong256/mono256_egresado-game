/**
 * Demo plan: the content a teacher demonstration plays.
 *
 * A run plan answers "what does this player play this year", and its answer is
 * one or two beats ([`run-plan`](./run-plan.ts)). A demonstration asks a
 * different question — "what is there to show" — and the honest answer to that
 * one is longer. The two are not the same artifact and this module exists so
 * that nobody has to pretend they are.
 *
 * ## Why not a run plan with a bigger budget
 *
 * Because that would make the budget negotiable. The one-to-two beat ceiling is
 * the reason a six-year run stays replayable, and a rule that any caller can
 * widen by passing an argument is not a rule. So the demo is a **separate
 * type**, validated by **separate rules**, and the ordinary-beat budget of a
 * run plan is never consulted, relaxed or overridden.
 *
 * The separation is enforced from the demo's side too: a demo plan is required
 * to carry *more* ordinary beats than a stage plan may. It cannot accidentally
 * become a valid run plan, and a run plan cannot accidentally satisfy the demo
 * rules. `demoAsStagePlan` exists to make that provable rather than assumed.
 *
 * ## What a demo has that a run does not
 *
 * A reason per entry. In a run, why a beat is there is the composer's business
 * and the player never asks. In a demonstration the question is the whole
 * point: someone is standing in front of a class explaining what they are about
 * to show. `showcases` is that sentence, and it is required.
 */

import {
  formatVariantAddress,
  isOrdinaryBeatRole,
  type ChallengeVariantRef,
} from '../challenges/content-model'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { InteractionKind } from '../challenges/interactions'
import type { StageId } from '../progression/stages'
import { contentError, contentWarning, type ValidationIssue } from './issues'
import {
  resolvePlanEntry,
  validateStagePlan,
  DEFAULT_STAGE_BEAT_BUDGET,
  type RunPlanEntry,
  type StageContentPlan,
} from './run-plan'

/** What a demonstration beat is there to prove. */
export interface DemoPlanEntry {
  readonly variant: ChallengeVariantRef
  /** Why this beat is in the demonstration, in the demonstrator's words. */
  readonly showcases: string
}

/**
 * A demonstration of one school year.
 *
 * `stageId` is the year the content is drawn from, not a claim that a class
 * would ever play this sequence: it is what makes eligibility checkable.
 */
export interface DemoPlan {
  readonly id: string
  readonly stageId: StageId
  readonly entries: readonly DemoPlanEntry[]
}

/**
 * How much a demonstration has to cover before it is worth calling one.
 *
 * The two family numbers are the interesting ones. A demo that shows six
 * templates from six families proves breadth and nothing else; the claim that
 * this content model actually earns its shape is that **one situation can hold
 * two different questions**, and only a family with two templates in the demo
 * shows it. Hence `minFamiliesWithTwoTemplates`.
 */
export interface DemoCoverage {
  readonly minEntries: number
  readonly minFamilies: number
  readonly minInteractions: number
  readonly minFamiliesWithTwoTemplates: number
}

export const DEFAULT_DEMO_COVERAGE: DemoCoverage = {
  // Above the run budget by construction: see `validateDemoPlan`.
  minEntries: DEFAULT_STAGE_BEAT_BUDGET.max + 1,
  minFamilies: 3,
  minInteractions: 3,
  minFamiliesWithTwoTemplates: 1,
}

/**
 * The demonstration seen as a stage plan.
 *
 * Only for asserting the separation: run this through `validateStagePlan` and
 * it must fail. Nothing in the engine plays a demo plan as a run.
 */
export function demoAsStagePlan(plan: DemoPlan): StageContentPlan {
  const entries: readonly RunPlanEntry[] = plan.entries.map((entry) => ({
    variant: entry.variant,
  }))
  return { stageId: plan.stageId, entries }
}

/** True when the demonstration would also be a legal run plan. It must not be. */
export function isValidStagePlan(
  catalog: ContentCatalog,
  plan: DemoPlan,
): boolean {
  return validateStagePlan(catalog, demoAsStagePlan(plan)).length === 0
}

/**
 * Checks a demonstration.
 *
 * Same resolution rules as a run plan — an address that does not resolve is
 * broken content wherever it appears — plus the coverage the demo exists to
 * deliver, plus the one rule that keeps the two artifacts apart.
 */
export function validateDemoPlan(
  catalog: ContentCatalog,
  plan: DemoPlan,
  coverage: DemoCoverage = DEFAULT_DEMO_COVERAGE,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()
  const shown = new Set<string>()
  const families = new Map<string, Set<string>>()
  const interactions = new Set<InteractionKind>()
  let ordinary = 0

  for (const entry of plan.entries) {
    const address = formatVariantAddress(entry.variant)
    const subject = `${plan.id}:${address}`

    if (entry.showcases.trim() === '') {
      issues.push(
        contentError(
          'demo.missing-purpose',
          subject,
          'a demonstration beat has to say what it demonstrates',
        ),
      )
    }

    if (seen.has(address)) {
      issues.push(
        contentError(
          'demo.duplicate-entry',
          subject,
          'the same variant is demonstrated twice',
        ),
      )
      continue
    }
    seen.add(address)

    const resolved = resolvePlanEntry(catalog, { variant: entry.variant })
    if (resolved === undefined) {
      issues.push(
        contentError(
          'demo.unresolved-entry',
          subject,
          'the address does not resolve against the catalog',
        ),
      )
      continue
    }

    if (!resolved.template.stages.includes(plan.stageId)) {
      issues.push(
        contentError(
          'demo.ineligible-stage',
          subject,
          `template ${resolved.template.id} is not eligible for ${plan.stageId}`,
        ),
      )
      continue
    }

    shown.add(resolved.template.id)
    const templates = families.get(resolved.variant.familyId) ?? new Set()
    templates.add(resolved.template.id)
    families.set(resolved.variant.familyId, templates)
    interactions.add(resolved.template.interaction)
    if (isOrdinaryBeatRole(resolved.role)) {
      ordinary += 1
    }
  }

  if (plan.entries.length < coverage.minEntries) {
    issues.push(
      contentError(
        'demo.too-short',
        plan.id,
        `demonstrates ${String(plan.entries.length)} beats, at least ${String(coverage.minEntries)} are required`,
      ),
    )
  }

  if (families.size < coverage.minFamilies) {
    issues.push(
      contentError(
        'demo.family-coverage',
        plan.id,
        `covers ${String(families.size)} families, at least ${String(coverage.minFamilies)} are required`,
      ),
    )
  }

  if (interactions.size < coverage.minInteractions) {
    issues.push(
      contentError(
        'demo.interaction-coverage',
        plan.id,
        `covers ${String(interactions.size)} interactions, at least ${String(coverage.minInteractions)} are required`,
      ),
    )
  }

  const contrasting = [...families.values()].filter(
    (templates) => templates.size >= 2,
  ).length
  if (contrasting < coverage.minFamiliesWithTwoTemplates) {
    issues.push(
      contentError(
        'demo.family-contrast',
        plan.id,
        `no family contributes two templates; ${String(coverage.minFamiliesWithTwoTemplates)} must, so the demo shows one situation asking two questions`,
      ),
    )
  }

  // The rule that keeps a demonstration from becoming a run. It is stated as a
  // floor on the demo, not as a raised ceiling on the run: the run budget is
  // read here and never written.
  if (ordinary <= DEFAULT_STAGE_BEAT_BUDGET.max) {
    issues.push(
      contentError(
        'demo.indistinct-from-run',
        plan.id,
        `demonstrates ${String(ordinary)} ordinary beats, which a run plan may also play; a demonstration must exceed the run budget of ${String(DEFAULT_STAGE_BEAT_BUDGET.max)}`,
      ),
    )
  }

  if (isValidStagePlan(catalog, plan)) {
    issues.push(
      contentError(
        'demo.indistinct-from-run',
        plan.id,
        'the demonstration is also a valid stage plan, so the two artifacts are not separate',
      ),
    )
  }

  const uncovered = catalog
    .forStage(plan.stageId)
    .filter((template) => !shown.has(template.id))
  if (uncovered.length > 0) {
    issues.push(
      contentWarning(
        'demo.template-not-shown',
        plan.id,
        `${String(uncovered.length)} eligible templates are not demonstrated: ${uncovered.map((template) => template.id).join(', ')}`,
      ),
    )
  }

  return issues
}
