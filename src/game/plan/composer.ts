/**
 * Run composer.
 *
 * The catalog says what exists; this says what one run plays. It is the piece
 * [ADR-019](../../../docs/03-architecture/adr/ADR-019-scenario-family-template-variant.md)
 * left as a promise: a rich catalog and a short run only coexist if something
 * chooses, and until now nothing did — a storylet drew from its pool and the
 * seed drew from the approved variants, with no one looking at load, variety or
 * budget.
 *
 * ## How it chooses
 *
 * By enumeration, not by retrying. A stage plays one anchor and at most one
 * secondary, so the whole feasible space is
 *
 *     anchors × (nothing | secondaries)
 *
 * which is small enough to build in full, filter against the hard constraints,
 * and then rank. A `while (!valid) drawAgain()` loop would be shorter to write
 * and would hide its own distribution: it can bias toward whatever the RNG
 * reaches first, and it has no bounded worst case. Enumeration has an
 * inspectable answer to «why this plan» — it beat the others, in this order, on
 * these objectives.
 *
 * ## Hard versus soft
 *
 * Hard constraints are filters and are never traded: stage eligibility, an
 * approved variant, exactly one anchor, the ordinary beat budget, an allowed
 * secondary role, no template twice in a stage, the difficulty envelope.
 * Encoding any of them as a penalty would mean a good enough plan could buy its
 * way past a rule.
 *
 * Soft objectives are lexicographic and ordered by the policy. Ties are broken
 * by a seeded draw over a canonically sorted list, so the answer is deterministic
 * without being positional.
 *
 * ## What it does not do
 *
 * It does not know a single challenge id, family or school subject; everything
 * it reads is metadata. It does not score. It does not decide when recovery
 * happens — recovery is conditional content outside the ordinary budget, and
 * belongs to the stage that implements academic debt.
 */

import type { ChallengeId, RunSeed } from '../core/branded'
import { err, ok, type Result } from '../core/result'
import type { ChallengeDefinition } from '../challenges/contracts'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { ApprovedVariantLookup } from '../challenges/variant-source'
import {
  formatVariantAddress,
  isEligibleForStage,
  isOrdinaryBeatRole,
  type ChallengeVariantRef,
} from '../challenges/content-model'
import type { InteractionKind } from '../challenges/interactions'
import type { MathCategory } from '../challenges/taxonomy'
import { bandOf, type DifficultyBand } from '../difficulty/cognitive'
import { costOf, type DifficultyCost } from '../difficulty/cost-policy'
import type { StageId } from '../progression/stages'
import { createRng, type Rng } from '../random/rng'
import {
  compositionFailure,
  type CompositionFailure,
} from './composition-failure'
import {
  compositionPolicyIssues,
  stagePolicyFor,
  type CompositionObjective,
  type CompositionPolicy,
  type StageCompositionPolicy,
} from './composition-policy'
import type { RunPlan, RunPlanEntry, StageContentPlan } from './run-plan'

/** One beat of a composed run, with the load it was scheduled for. */
export interface ComposedBeat {
  readonly variant: ChallengeVariantRef
  readonly role: 'anchor' | 'checkpoint' | 'special'
  /**
   * Band and cost as the composer saw them.
   *
   * Carried, not just derivable, because a serialized plan reaches a validator
   * that must be able to disagree with it. Recomputing these from the catalog
   * and comparing is how the validator catches a plan built under a different
   * calibration; a plan that only carried addresses could not be contradicted.
   */
  readonly band: DifficultyBand
  readonly cost: DifficultyCost
}

export interface ComposedStagePlan {
  readonly stageId: StageId
  readonly beats: readonly ComposedBeat[]
  /** Sum of the beats' scheduling costs. Never a score. */
  readonly difficultyCost: DifficultyCost
  /**
   * Events this stage plays: its composed beats plus its narrative cards.
   *
   * The runtime needs a length, and deriving it from the plan rather than from
   * a fixed stage constant is what stops a composed year from running past the
   * content it was given.
   */
  readonly eventCount: number
}

export interface ComposedRunPlan {
  readonly compositionPolicyId: string
  readonly compositionPolicyVersion: string
  readonly difficultyCostPolicyVersion: string
  /** The approved catalog the beats were drawn from, when there was one. */
  readonly variantCatalogVersion?: string
  readonly stages: readonly ComposedStagePlan[]
  readonly difficultyCost: DifficultyCost
}

export interface RunCompositionRequest {
  readonly seed: RunSeed
  readonly stages: readonly StageId[]
  readonly catalog: ContentCatalog
  readonly approvedVariants?: ApprovedVariantLookup
  readonly policy: CompositionPolicy
}

/** What the run has already played, so later stages can prefer something else. */
interface RunHistory {
  readonly families: ReadonlySet<string>
  readonly interactions: ReadonlySet<InteractionKind>
  readonly domains: ReadonlySet<MathCategory>
  readonly templates: ReadonlySet<ChallengeId>
}

const EMPTY_HISTORY: RunHistory = {
  families: new Set(),
  interactions: new Set(),
  domains: new Set(),
  templates: new Set(),
}

/** A template paired with the approved variant a stage would play. */
interface Candidate {
  readonly template: ChallengeDefinition
  readonly variant: ChallengeVariantRef
  readonly band: DifficultyBand
  readonly cost: DifficultyCost
}

/**
 * Which variant of a template this stage plays.
 *
 * Pinned here, not left to the runtime. Difficulty, comparability and replay all
 * depend on knowing which concrete problem a run contains; a plan that named a
 * template and let the engine draw the variant later would be a plan that could
 * not be validated.
 *
 * A normal composed run draws **only** from the approved catalog. The curated
 * fallback the runtime keeps for a content set without a catalog does not apply
 * here: this is the boundary a competition would trust.
 */
function pickVariant(
  template: ChallengeDefinition,
  approved: ApprovedVariantLookup | undefined,
  rng: Rng,
): ChallengeVariantRef | undefined {
  const pool =
    approved === undefined
      ? template.variants
      : approved.variantsFor(template.id)
  if (pool.length === 0) {
    return undefined
  }

  const sorted = [...pool].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  )
  const variantId = sorted.length === 1 ? sorted[0] : rng.pick(sorted)
  if (variantId === undefined) {
    return undefined
  }
  return {
    familyId: template.family,
    templateId: template.id,
    variantId,
  }
}

function candidatesFor(
  stage: StageCompositionPolicy,
  request: RunCompositionRequest,
  eligible: readonly ChallengeDefinition[],
): readonly Candidate[] {
  const { policy } = request

  return eligible.flatMap((template) => {
    // The variant substream is addressed by the template, not by where the
    // stage happens to sit, so a stage growing a neighbouring candidate cannot
    // change which variant an unrelated template plays.
    const variant = pickVariant(
      template,
      request.approvedVariants,
      createRng(request.seed, [
        'compose',
        stage.stageId,
        'variant',
        template.id,
      ]),
    )
    if (variant === undefined) {
      return []
    }
    const band = bandOf(template.cognitive)
    return [{ template, variant, band, cost: costOf(policy.costPolicy, band) }]
  })
}

/** Every structurally legal beat combination for one stage. */
function feasiblePlans(
  stage: StageCompositionPolicy,
  anchors: readonly Candidate[],
  secondaries: readonly Candidate[],
): readonly (readonly Candidate[])[] {
  const plans: (readonly Candidate[])[] = []

  for (const anchor of anchors) {
    if (stage.ordinaryBeats.min <= 1) {
      plans.push([anchor])
    }
    if (stage.ordinaryBeats.max >= 2) {
      for (const secondary of secondaries) {
        // The same template twice in one year is not variety, it is a repeat.
        if (secondary.template.id === anchor.template.id) {
          continue
        }
        plans.push([anchor, secondary])
      }
    }
  }

  return plans
}

function totalCost(plan: readonly Candidate[]): DifficultyCost {
  return plan.reduce((sum, beat) => sum + beat.cost, 0)
}

function withinEnvelope(
  stage: StageCompositionPolicy,
  cost: DifficultyCost,
): boolean {
  return Math.abs(cost - stage.difficulty.target) <= stage.difficulty.tolerance
}

/**
 * How well a plan serves one objective. Higher is better, always.
 *
 * `difficulty-fit` is negated distance so that «closer to target» reads as
 * «larger score» like every other objective, and the comparison below stays a
 * single rule instead of a table of directions.
 */
function objectiveScore(
  objective: CompositionObjective,
  plan: readonly Candidate[],
  stage: StageCompositionPolicy,
  history: RunHistory,
): number {
  switch (objective) {
    case 'difficulty-fit':
      return -Math.abs(totalCost(plan) - stage.difficulty.target)
    case 'family-variety':
      return new Set(
        plan
          .map((beat) => beat.template.family as string)
          .filter((family) => !history.families.has(family)),
      ).size
    case 'interaction-variety':
      return new Set(
        plan
          .map((beat) => beat.template.interaction)
          .filter((kind) => !history.interactions.has(kind)),
      ).size
    case 'domain-coverage':
      return new Set(
        plan
          .flatMap((beat) => beat.template.categories)
          .filter((domain) => !history.domains.has(domain)),
      ).size
    case 'template-freshness':
      return plan.filter((beat) => !history.templates.has(beat.template.id))
        .length
  }
}

/** A stable, content-addressed key. Two different plans never share one. */
function planKey(plan: readonly Candidate[]): string {
  return plan.map((beat) => formatVariantAddress(beat.variant)).join('+')
}

function composeStagePlan(
  request: RunCompositionRequest,
  stage: StageCompositionPolicy,
  history: RunHistory,
): Result<ComposedStagePlan, CompositionFailure> {
  const eligible = request.catalog.templates.filter(
    (template) =>
      isEligibleForStage(template, stage.stageId) &&
      isOrdinaryBeatRole(template.placement) &&
      (stage.hostableTemplates === undefined ||
        stage.hostableTemplates.includes(template.id)) &&
      // Already played, and repeats are off: a hard constraint, not a
      // preference. Its narrative host is usually spent too.
      (stage.allowTemplateRepeats === true ||
        !history.templates.has(template.id)),
  )

  if (eligible.length === 0) {
    return err(
      compositionFailure(
        'no-eligible-content',
        stage.stageId,
        'the catalog offers no ordinary-beat template eligible for this stage',
        {
          counts: {
            eligible: 0,
            approved: 0,
            anchors: 0,
            secondaries: 0,
            feasiblePlans: 0,
          },
        },
      ),
    )
  }

  const candidates = candidatesFor(stage, request, eligible)
  const anchors = candidates.filter(
    (candidate) => candidate.template.placement === 'anchor',
  )
  const secondaries = candidates.filter((candidate) =>
    stage.secondaryRoles.includes(candidate.template.placement),
  )
  const counts = {
    eligible: eligible.length,
    approved: candidates.length,
    anchors: anchors.length,
    secondaries: secondaries.length,
    feasiblePlans: 0,
  }

  if (candidates.length === 0) {
    return err(
      compositionFailure(
        'no-approved-variant',
        stage.stageId,
        `${String(eligible.length)} eligible templates, none with an approved variant in this catalog`,
        { counts },
      ),
    )
  }
  if (anchors.length === 0) {
    return err(
      compositionFailure(
        'no-eligible-anchor',
        stage.stageId,
        'no eligible template carries the anchor role, and exactly one anchor is required',
        { counts },
      ),
    )
  }
  if (stage.ordinaryBeats.min >= 2 && secondaries.length === 0) {
    return err(
      compositionFailure(
        'no-valid-secondary',
        stage.stageId,
        'the stage requires a second ordinary beat and nothing eligible can fill it',
        { counts, roles: stage.secondaryRoles },
      ),
    )
  }

  const structural = feasiblePlans(stage, anchors, secondaries)
  const feasible = structural.filter((plan) =>
    withinEnvelope(stage, totalCost(plan)),
  )

  if (feasible.length === 0) {
    const reachable = structural
      .map((plan) => totalCost(plan))
      .sort((left, right) => left - right)
    return err(
      compositionFailure(
        'difficulty-unsatisfiable',
        stage.stageId,
        `no plan lands within ${String(stage.difficulty.target)}±${String(stage.difficulty.tolerance)}; reachable totals were ${reachable.join(', ') || 'none'}`,
        { counts: { ...counts, feasiblePlans: structural.length } },
      ),
    )
  }

  // Lexicographic ranking. Each objective narrows the field; the next only ever
  // sees what survived, so a later preference can never overturn an earlier one.
  let surviving = [...feasible].sort((left, right) =>
    planKey(left) < planKey(right)
      ? -1
      : planKey(left) > planKey(right)
        ? 1
        : 0,
  )
  for (const objective of request.policy.objectives) {
    const best = surviving.reduce(
      (max, plan) =>
        Math.max(max, objectiveScore(objective, plan, stage, history)),
      Number.NEGATIVE_INFINITY,
    )
    surviving = surviving.filter(
      (plan) => objectiveScore(objective, plan, stage, history) === best,
    )
  }

  const chosen =
    surviving.length === 1
      ? surviving[0]
      : createRng(request.seed, ['compose', stage.stageId, 'tie-break']).pick(
          surviving,
        )

  if (chosen === undefined) {
    return err(
      compositionFailure(
        'no-eligible-content',
        stage.stageId,
        'ranking eliminated every feasible plan, which is a composer defect',
        { counts: { ...counts, feasiblePlans: feasible.length } },
      ),
    )
  }

  const beats: readonly ComposedBeat[] = chosen.map((candidate) => ({
    variant: candidate.variant,
    role: candidate.template.placement as ComposedBeat['role'],
    band: candidate.band,
    cost: candidate.cost,
  }))

  return ok({
    stageId: stage.stageId,
    beats,
    difficultyCost: totalCost(chosen),
    eventCount: beats.length + stage.narrativeBeats,
  })
}

function extendHistory(
  history: RunHistory,
  plan: ComposedStagePlan,
  catalog: ContentCatalog,
): RunHistory {
  const families = new Set(history.families)
  const interactions = new Set(history.interactions)
  const domains = new Set(history.domains)
  const templates = new Set(history.templates)

  for (const beat of plan.beats) {
    const template = catalog.template(beat.variant.templateId)
    if (template === undefined) {
      continue
    }
    families.add(template.family)
    interactions.add(template.interaction)
    templates.add(template.id)
    for (const domain of template.categories) {
      domains.add(domain)
    }
  }

  return { families, interactions, domains, templates }
}

/**
 * Composes one run.
 *
 * Stages are composed in order and each one sees what the earlier ones played,
 * which is what lets variety be a property of the run rather than of a year in
 * isolation. Nothing later revisits an earlier stage: composition is one pass,
 * and a run is executed, never recomposed.
 */
export function composeRun(
  request: RunCompositionRequest,
): Result<ComposedRunPlan, CompositionFailure> {
  const policyIssues = compositionPolicyIssues(request.policy)
  if (policyIssues.length > 0) {
    return err(
      compositionFailure('invalid-policy', undefined, policyIssues.join('; ')),
    )
  }

  const stages: ComposedStagePlan[] = []
  let history = EMPTY_HISTORY

  for (const stageId of request.stages) {
    const stagePolicy = stagePolicyFor(request.policy, stageId)
    if (stagePolicy === undefined) {
      return err(
        compositionFailure(
          'stage-not-configured',
          stageId,
          `composition policy ${request.policy.id} says nothing about this stage`,
        ),
      )
    }

    const composed = composeStagePlan(request, stagePolicy, history)
    if (!composed.ok) {
      return composed
    }

    stages.push(composed.value)
    history = extendHistory(history, composed.value, request.catalog)
  }

  return ok({
    compositionPolicyId: request.policy.id,
    compositionPolicyVersion: request.policy.version,
    difficultyCostPolicyVersion: request.policy.costPolicy.version,
    ...(request.approvedVariants === undefined
      ? {}
      : { variantCatalogVersion: request.approvedVariants.catalogVersion }),
    stages,
    difficultyCost: stages.reduce(
      (sum, stage) => sum + stage.difficultyCost,
      0,
    ),
  })
}

/** Composes a single stage, for tooling and tests that do not want a whole run. */
export function composeStage(
  request: RunCompositionRequest,
  stageId: StageId,
): Result<ComposedStagePlan, CompositionFailure> {
  const composed = composeRun({ ...request, stages: [stageId] })
  if (!composed.ok) {
    return composed
  }
  const stage = composed.value.stages[0]
  if (stage === undefined) {
    return err(
      compositionFailure('no-eligible-content', stageId, 'nothing composed'),
    )
  }
  return ok(stage)
}

/** The composed plan seen as the plain content plan the validator already knows. */
export function toRunPlan(plan: ComposedRunPlan): RunPlan {
  const stages: readonly StageContentPlan[] = plan.stages.map((stage) => {
    const entries: readonly RunPlanEntry[] = stage.beats.map((beat) => ({
      variant: beat.variant,
    }))
    return { stageId: stage.stageId, entries }
  })
  return { stages }
}

/** The stage slice of a composed plan, or `undefined` when the run skips it. */
export function composedStage(
  plan: ComposedRunPlan,
  stageId: StageId,
): ComposedStagePlan | undefined {
  return plan.stages.find((stage) => stage.stageId === stageId)
}
