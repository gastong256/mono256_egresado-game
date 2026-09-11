/**
 * Independent validation of a composed run plan.
 *
 * The composer builds plans that satisfy the rules; this decides whether a plan
 * satisfies them. They are deliberately two programs, for the same reason
 * [ADR-020](../../../docs/03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md)
 * keeps a generator and its validator apart: a checker that works by re-running
 * the builder and comparing can only ever confirm the builder's own opinion, and
 * would reject a plan that is different but perfectly legal.
 *
 * So nothing here composes anything. It takes a plan — which may have arrived
 * over a wire, from a snapshot, or from a client nobody trusts — plus the
 * authoritative catalog and policy, and answers whether that plan could
 * legitimately be played.
 *
 * ## What it does not take on faith
 *
 * The plan's own claims. A beat states its role, its band and its cost; all
 * three are recomputed from the catalog and the policy and compared. A plan that
 * says a `stretch` template is worth a `core` beat is exactly the plan a
 * competition has to be able to refuse, and it parses perfectly.
 */

import { contentError, type ValidationIssue } from '../core/issues'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { ApprovedVariantLookup } from '../challenges/variant-source'
import {
  formatVariantAddress,
  isEligibleForStage,
  isOrdinaryBeatRole,
} from '../challenges/content-model'
import { bandOf } from '../difficulty/cognitive'
import { costOf } from '../difficulty/cost-policy'
import { isStageId, stageIndex, type StageId } from '../progression/stages'
import { toRunPlan, type ComposedRunPlan } from './composer'
import { stagePolicyFor, type CompositionPolicy } from './composition-policy'
import { validateRunPlan } from './run-plan'
import { compositionMetadataIssues } from '../challenges/composition-metadata'
import { careerConstraintIssues } from './career-constraints'

export interface PlanValidationContext {
  readonly catalog: ContentCatalog
  readonly policy: CompositionPolicy
  /** The approved catalog the plan claims to draw from, when it claims one. */
  readonly approvedVariants?: ApprovedVariantLookup
}

/**
 * Checks a composed plan against the rules it must satisfy.
 *
 * Returns every problem it finds rather than the first, because a content author
 * fixing a plan wants the list, and a server rejecting one wants to say why in a
 * single answer.
 */
export function validateComposedPlan(
  plan: ComposedRunPlan,
  context: PlanValidationContext,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { catalog, policy } = context

  if (policy.career !== undefined) {
    const career = policy.career
    const fail = (code: string, detail: string) =>
      issues.push(contentError(`plan.career-${code}`, 'run', detail))
    for (const issue of careerConstraintIssues(career)) fail('policy', issue)
    if (
      plan.stages.map((stage) => stage.stageId).join(',') !==
      career.requiredStages.join(',')
    )
      fail(
        'stages',
        'career must contain every required stage, exactly once and in order',
      )
    for (const stage of plan.stages) {
      const chronology = stage.beats.map(
        (beat) =>
          catalog.template(beat.variant.templateId)?.composition?.chronology ??
          0,
      )
      if (
        chronology.some(
          (order, i) => order < (chronology[i - 1] ?? Number.NEGATIVE_INFINITY),
        )
      )
        fail('chronology', 'beats violate authored stage chronology')
    }
    const templates = plan.stages.flatMap((stage) =>
      stage.beats.flatMap((beat) => {
        const template = catalog.template(beat.variant.templateId)
        return template === undefined ? [] : [template]
      }),
    )
    if (
      templates.some(
        (template) =>
          template.composition === undefined ||
          compositionMetadataIssues(template.composition).length > 0,
      )
    )
      fail('metadata', 'missing or invalid authoritative composition metadata')
    const checkRange = (
      name: string,
      actual: number,
      range: { readonly min: number; readonly max: number },
    ) => {
      if (actual < range.min || actual > range.max)
        fail('quota', `${name}: ${actual}, required ${range.min}–${range.max}`)
    }
    checkRange(
      'ordinary',
      templates.filter((t) => isOrdinaryBeatRole(t.placement)).length,
      career.ordinaryBeats,
    )
    for (const [band, range] of Object.entries(career.bands))
      checkRange(
        band,
        templates.filter((t) => bandOf(t.cognitive) === band).length,
        range,
      )
    for (const [pacing, range] of Object.entries(career.pacing))
      checkRange(
        pacing,
        templates.filter((t) => t.composition?.pacingClass === pacing).length,
        range,
      )
    const metadata = templates.flatMap((t) =>
      t.composition === undefined ? [] : [t.composition],
    )
    const families = new Set(metadata.map((m) => m.primaryReasoningFamily))
    const engines = new Set(metadata.map((m) => m.interactionEngine))
    if (families.size < career.minReasoningFamilies)
      fail('diversity', 'not enough primary reasoning families')
    if (engines.size < career.minInteractionEngines)
      fail('diversity', 'not enough reusable interaction engines')
    for (const [family, max] of Object.entries(career.maxByReasoning))
      if (
        metadata.filter((m) => m.primaryReasoningFamily === family).length > max
      )
        fail('reasoning-max', `${family} exceeds ${max}`)
    if (
      metadata.filter(
        (m) =>
          m.primaryReasoningFamily === 'DATA_UNCERTAINTY' ||
          m.primaryReasoningFamily === 'LOGIC_CLASSIFICATION',
      ).length < career.minDataOrLogic
    )
      fail('data-logic', 'missing data/logic coverage')
    const clusters = new Set(
      metadata.flatMap((m) =>
        m.eventCluster === undefined ? [] : [m.eventCluster],
      ),
    )
    for (const cluster of clusters)
      if (
        metadata.filter((m) => m.eventCluster === cluster).length >
        career.maxPerEventCluster
      )
        fail('cluster', `event cluster ${cluster} occurs too often`)
    checkRange(
      'Project Arc',
      metadata.filter((m) => m.recurringArc === 'PROJECT').length,
      career.projectArc,
    )
  }

  if (
    plan.compositionPolicyId !== policy.id ||
    plan.compositionPolicyVersion !== policy.version
  ) {
    issues.push(
      contentError(
        'plan.policy-mismatch',
        plan.compositionPolicyId,
        `plan was composed by ${plan.compositionPolicyId}@${plan.compositionPolicyVersion}, validated against ${policy.id}@${policy.version}`,
      ),
    )
  }
  if (plan.difficultyCostPolicyVersion !== policy.costPolicy.version) {
    issues.push(
      contentError(
        'plan.cost-policy-mismatch',
        plan.difficultyCostPolicyVersion,
        `plan priced its beats with ${plan.difficultyCostPolicyVersion}, validated against ${policy.costPolicy.version}`,
      ),
    )
  }

  const declaredCatalog = plan.variantCatalogVersion
  const actualCatalog = context.approvedVariants?.catalogVersion
  if ((declaredCatalog ?? null) !== (actualCatalog ?? null)) {
    issues.push(
      contentError(
        'plan.catalog-mismatch',
        declaredCatalog ?? '(no catalog)',
        `plan draws from ${declaredCatalog ?? '(no catalog)'}, validated against ${actualCatalog ?? '(no catalog)'}`,
      ),
    )
  }

  if (plan.stages.length === 0) {
    issues.push(
      contentError('plan.empty', 'run', 'a run plan must contain a stage'),
    )
  }

  const seenStages = new Set<StageId>()
  const templatesInPreviousStages = new Set<string>()
  let previousIndex = -1
  let recomputedRunCost = 0

  for (const stage of plan.stages) {
    const subject = stage.stageId

    if (!isStageId(stage.stageId)) {
      issues.push(
        contentError('plan.unknown-stage', subject, 'not a canonical stage'),
      )
      continue
    }
    if (seenStages.has(stage.stageId)) {
      issues.push(
        contentError(
          'plan.duplicate-stage',
          subject,
          'the stage appears twice',
        ),
      )
      continue
    }
    seenStages.add(stage.stageId)

    // Stages must run in school order. A plan that plays 2.º before 1.º is not
    // a career, whatever else it satisfies.
    const index = stageIndex(stage.stageId)
    if (index <= previousIndex) {
      issues.push(
        contentError(
          'plan.stage-order',
          subject,
          'stages are not in canonical school order',
        ),
      )
    }
    previousIndex = index

    const stagePolicy = stagePolicyFor(policy, stage.stageId)
    if (stagePolicy === undefined) {
      issues.push(
        contentError(
          'plan.stage-not-configured',
          subject,
          `policy ${policy.id} says nothing about this stage`,
        ),
      )
      continue
    }

    let recomputedStageCost = 0
    let anchors = 0
    const templatesInStage = new Set<string>()

    for (const beat of stage.beats) {
      const address = formatVariantAddress(beat.variant)
      const beatSubject = `${stage.stageId}:${address}`
      const template = catalog.template(beat.variant.templateId)

      if (template === undefined) {
        issues.push(
          contentError(
            'plan.unknown-template',
            beatSubject,
            'the catalog has no such template',
          ),
        )
        continue
      }
      if (template.family !== beat.variant.familyId) {
        issues.push(
          contentError(
            'plan.family-mismatch',
            beatSubject,
            `template belongs to ${template.family}`,
          ),
        )
      }
      if (!isEligibleForStage(template, stage.stageId)) {
        issues.push(
          contentError(
            'plan.ineligible-stage',
            beatSubject,
            `template ${template.id} may not be scheduled in ${stage.stageId}`,
          ),
        )
      }
      if (
        stagePolicy.hostableTemplates !== undefined &&
        !stagePolicy.hostableTemplates.includes(template.id)
      ) {
        issues.push(
          contentError(
            'plan.template-not-hostable',
            beatSubject,
            `the narrative for ${stage.stageId} cannot host template ${template.id}`,
          ),
        )
      }
      if (
        stagePolicy.allowTemplateRepeats !== true &&
        templatesInPreviousStages.has(template.id)
      ) {
        issues.push(
          contentError(
            'plan.repeated-template',
            beatSubject,
            'the template was already planned in an earlier stage',
          ),
        )
      }
      if (templatesInStage.has(template.id)) {
        issues.push(
          contentError(
            'plan.duplicate-template',
            beatSubject,
            'the same template is planned twice in one stage',
          ),
        )
      }
      templatesInStage.add(template.id)

      if (template.placement !== beat.role) {
        issues.push(
          contentError(
            'plan.role-mismatch',
            beatSubject,
            `beat claims role ${beat.role}; the template is ${template.placement}`,
          ),
        )
      }
      if (!isOrdinaryBeatRole(template.placement)) {
        issues.push(
          contentError(
            'plan.non-ordinary-beat',
            beatSubject,
            `${template.placement} is not an ordinary beat and cannot occupy the budget`,
          ),
        )
      }
      if (template.placement === 'anchor') {
        anchors += 1
      } else if (!stagePolicy.secondaryRoles.includes(template.placement)) {
        issues.push(
          contentError(
            'plan.role-not-allowed',
            beatSubject,
            `${stage.stageId} does not accept ${template.placement} as a secondary beat`,
          ),
        )
      }

      // Approved-only is a hard boundary for a composed run. The curated
      // fallback the runtime keeps for a catalog-less content set does not
      // extend here: a plan naming an unapproved address is refused.
      const approved =
        context.approvedVariants === undefined
          ? template.variants
          : context.approvedVariants.variantsFor(template.id)
      if (!approved.includes(beat.variant.variantId)) {
        issues.push(
          contentError(
            'plan.unapproved-variant',
            beatSubject,
            'the variant is not approved in the catalog this plan declares',
          ),
        )
      }

      const band = bandOf(template.cognitive)
      const cost = costOf(policy.costPolicy, band)
      if (band !== beat.band) {
        issues.push(
          contentError(
            'plan.band-mismatch',
            beatSubject,
            `beat claims band ${beat.band}; the template's structure derives ${band}`,
          ),
        )
      }
      if (cost !== beat.cost) {
        issues.push(
          contentError(
            'plan.cost-mismatch',
            beatSubject,
            `beat claims cost ${String(beat.cost)}; ${policy.costPolicy.version} prices ${band} at ${String(cost)}`,
          ),
        )
      }
      recomputedStageCost += cost
    }

    for (const templateId of templatesInStage) {
      templatesInPreviousStages.add(templateId)
    }

    if (anchors !== 1) {
      issues.push(
        contentError(
          'plan.anchor-count',
          subject,
          `${String(anchors)} anchors; exactly one is required`,
        ),
      )
    }

    const ordinary = stage.beats.length
    if (
      ordinary < stagePolicy.ordinaryBeats.min ||
      ordinary > stagePolicy.ordinaryBeats.max
    ) {
      issues.push(
        contentError(
          'plan.beat-budget',
          subject,
          `${String(ordinary)} ordinary beats, budget is ${String(stagePolicy.ordinaryBeats.min)}–${String(stagePolicy.ordinaryBeats.max)}`,
        ),
      )
    }

    if (stage.difficultyCost !== recomputedStageCost) {
      issues.push(
        contentError(
          'plan.stage-cost-mismatch',
          subject,
          `stage declares ${String(stage.difficultyCost)}, its beats price at ${String(recomputedStageCost)}`,
        ),
      )
    }
    if (
      Math.abs(recomputedStageCost - stagePolicy.difficulty.target) >
      stagePolicy.difficulty.tolerance
    ) {
      issues.push(
        contentError(
          'plan.difficulty-envelope',
          subject,
          `${String(recomputedStageCost)} is outside ${String(stagePolicy.difficulty.target)}±${String(stagePolicy.difficulty.tolerance)}`,
        ),
      )
    }
    if (stage.eventCount !== ordinary + stagePolicy.narrativeBeats) {
      issues.push(
        contentError(
          'plan.event-count',
          subject,
          `stage declares ${String(stage.eventCount)} events; ${String(ordinary)} beats plus ${String(stagePolicy.narrativeBeats)} narrative cards is ${String(ordinary + stagePolicy.narrativeBeats)}`,
        ),
      )
    }

    recomputedRunCost += recomputedStageCost
  }

  if (plan.difficultyCost !== recomputedRunCost) {
    issues.push(
      contentError(
        'plan.run-cost-mismatch',
        'run',
        `run declares ${String(plan.difficultyCost)}, its stages price at ${String(recomputedRunCost)}`,
      ),
    )
  }

  // The structural contract every content plan answers to, composed or not.
  // Running it here means the composer cannot be the only thing that knows what
  // a legal stage plan looks like.
  issues.push(
    ...validateRunPlan(catalog, toRunPlan(plan), {
      ...(context.approvedVariants === undefined
        ? {}
        : { approvedVariants: context.approvedVariants }),
    }),
  )

  return issues
}
