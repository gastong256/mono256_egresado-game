/**
 * Composition policy.
 *
 * The composer is a mechanism; this is everything a project may want to say
 * about *how* it should choose. Keeping the two apart is the reason a Teacher
 * Gate can recalibrate a year without anyone touching an algorithm, and the
 * reason adding 1.º to 5.º later is a data change.
 *
 * Nothing here names a challenge, a family or a school subject. A policy names
 * stages, roles, budgets and preferences; what content exists is the catalog's
 * business.
 */

import type { ChallengeId } from '../core/branded'
import type { ChallengePlacementRole } from '../challenges/content-model'
import type { StageId } from '../progression/stages'
import type {
  DifficultyCost,
  DifficultyCostPolicy,
} from '../difficulty/cost-policy'
import { candidateDifficultyCostPolicy } from '../difficulty/cost-policy'
import { DEFAULT_STAGE_BEAT_BUDGET, type StageBeatBudget } from './run-plan'
import {
  careerConstraintIssues,
  type CareerConstraints,
} from './career-constraints'

/**
 * The soft objectives, in the order they are applied.
 *
 * Lexicographic and not a weighted sum, deliberately. A weighted sum hides why
 * a plan won and lets an unrelated preference outvote the one that mattered;
 * this way «closest to the difficulty target, and among those the most varied»
 * is exactly what the code does and exactly what the documentation can claim.
 */
export const COMPOSITION_OBJECTIVES = [
  /** Distance from the stage's difficulty target. Smaller is better. */
  'difficulty-fit',
  /** Scenario families not already used earlier in the run. More is better. */
  'family-variety',
  /** Interaction kinds not already used earlier in the run. More is better. */
  'interaction-variety',
  /** Mathematical domains not already covered by the run. More is better. */
  'domain-coverage',
  /** Templates the run has not played yet. More is better. */
  'template-freshness',
  /**
   * Beats of a stage that ask the player for the same thing. Fewer is better.
   *
   * Counts the pairs whose cognitive profiles differ in at most one trait — two
   * constructions holding the same number of constraints, say — which is the
   * preference the design of 3.º calls soft. It is soft here too: it never
   * filters a plan, it only orders the valid ones, so a stage whose only legal
   * pairing is two similar beats still composes.
   */
  'cognitive-variety',
] as const

export type CompositionObjective = (typeof COMPOSITION_OBJECTIVES)[number]

/**
 * Los objetivos con los que se publicaron las políticas anteriores a 3.º.
 *
 * Congelado a propósito. Una política publicada ordena planes con la lista que
 * declaró, no con la que el motor tenga más adelante: agregar un objetivo al
 * vocabulario no puede cambiar en silencio qué plan gana en un content set que
 * ya existe. El que quiera el objetivo nuevo, lo declara.
 */
export const PUBLISHED_OBJECTIVES_V1: readonly CompositionObjective[] = [
  'difficulty-fit',
  'family-variety',
  'interaction-variety',
  'domain-coverage',
  'template-freshness',
]

/** What one academic stage contributes to a run, and under what limits. */
export interface StageCompositionPolicy {
  readonly stageId: StageId
  /**
   * Ordinary beats this stage may contribute.
   *
   * Defaults to the run budget from [ADR-019](../../../docs/03-architecture/adr/ADR-019-scenario-family-template-variant.md):
   * one or two. A policy may narrow it; it may not widen it past what
   * `validateStagePlan` accepts, and the composer checks that.
   */
  readonly ordinaryBeats: StageBeatBudget
  /**
   * Roles the optional second ordinary beat may take.
   *
   * The first is always the anchor — exactly one per stage is the canonical
   * invariant. Recovery is never here: it is conditional content and lives
   * outside the ordinary budget entirely.
   */
  readonly secondaryRoles: readonly ChallengePlacementRole[]
  /** Where the stage's total scheduling cost should land, and by how much it may miss. */
  readonly difficulty: {
    readonly target: DifficultyCost
    readonly tolerance: DifficultyCost
  }
  /**
   * Narrative events the stage plays besides its composed beats.
   *
   * A year is not only its decisions: the opening card is what makes the first
   * beat mean something. The composer needs the number to say how long the stage
   * runs; which storylets fill it stays the narrative layer's business.
   */
  readonly narrativeBeats: number
  /**
   * Whether a template already played earlier in the run may be played again.
   *
   * False by default, and it is a **hard** constraint rather than a preference,
   * for a reason the development career made concrete: a storylet that hosts a
   * template is usually one-shot, so scheduling the same template twice can
   * leave the second beat with nowhere to happen. Repetition is also the fastest
   * way to make a six-year run feel like one year played six times.
   *
   * A family may still recur across years — transfer between contexts is a
   * design goal — because this is about templates, not families.
   */
  readonly allowTemplateRepeats?: boolean
  /**
   * Templates this stage's narrative can actually host, when it is restricted.
   *
   * Authored content is not an unordered bag: a storylet chain decides what can
   * follow what, and a plan naming a beat the year can never reach is a plan
   * that cannot be played. Rather than teach the composer to read a storylet
   * graph — which would make it depend on the narrative layer and stop being
   * generic — the content set declares the restriction as data.
   *
   * Absent means «everything the catalog says is eligible», which is the normal
   * case for a stage whose storylets are not a fixed chain.
   */
  readonly hostableTemplates?: readonly ChallengeId[]
}

export interface CompositionPolicy {
  readonly career?: CareerConstraints
  readonly id: string
  readonly version: string
  /**
   * False until a Teacher Gate approves the calibration.
   *
   * Same rule as the scoring and cost policies: a run composed under a
   * development policy has to be able to say so, and no file declares itself
   * official.
   */
  readonly official: boolean
  readonly costPolicy: DifficultyCostPolicy
  readonly stages: readonly StageCompositionPolicy[]
  readonly objectives: readonly CompositionObjective[]
}

export function stagePolicyFor(
  policy: CompositionPolicy,
  stageId: StageId,
): StageCompositionPolicy | undefined {
  return policy.stages.find((stage) => stage.stageId === stageId)
}

/**
 * A stage policy with the defaults every stage shares.
 *
 * The budget and the secondary roles are the same product rule everywhere; a
 * stage that wants something else has to say so explicitly, which is what makes
 * the exception visible in a diff.
 */
export function stageCompositionPolicy(
  stageId: StageId,
  overrides: Partial<Omit<StageCompositionPolicy, 'stageId'>> = {},
): StageCompositionPolicy {
  return {
    stageId,
    ordinaryBeats: overrides.ordinaryBeats ?? DEFAULT_STAGE_BEAT_BUDGET,
    secondaryRoles: overrides.secondaryRoles ?? ['checkpoint', 'special'],
    difficulty: overrides.difficulty ?? { target: 250, tolerance: 110 },
    narrativeBeats: overrides.narrativeBeats ?? 1,
    allowTemplateRepeats: overrides.allowTemplateRepeats ?? false,
    ...(overrides.hostableTemplates === undefined
      ? {}
      : { hostableTemplates: overrides.hostableTemplates }),
  }
}

/**
 * Structural problems that would make a policy unable to compose anything.
 *
 * Checked where a policy enters the engine rather than trusted, because a
 * policy is configuration and configuration arrives from outside.
 */
export function compositionPolicyIssues(
  policy: CompositionPolicy,
): readonly string[] {
  const issues: string[] = []
  if (policy.career !== undefined)
    issues.push(...careerConstraintIssues(policy.career))

  if (policy.id.trim() === '' || policy.version.trim() === '') {
    issues.push('a composition policy must be identified and versioned')
  }
  if (policy.stages.length === 0) {
    issues.push('a composition policy must configure at least one stage')
  }
  if (policy.objectives.length === 0) {
    issues.push('a composition policy must declare its objective order')
  }
  if (new Set(policy.objectives).size !== policy.objectives.length) {
    issues.push('an objective is listed twice')
  }

  const seen = new Set<StageId>()
  for (const stage of policy.stages) {
    if (seen.has(stage.stageId)) {
      issues.push(`stage ${stage.stageId} is configured twice`)
    }
    seen.add(stage.stageId)

    const { min, max } = stage.ordinaryBeats
    if (
      min < DEFAULT_STAGE_BEAT_BUDGET.min ||
      max > DEFAULT_STAGE_BEAT_BUDGET.max
    ) {
      issues.push(
        `stage ${stage.stageId} asks for ${String(min)}–${String(max)} ordinary beats, outside the run budget of ${String(DEFAULT_STAGE_BEAT_BUDGET.min)}–${String(DEFAULT_STAGE_BEAT_BUDGET.max)}`,
      )
    }
    if (min > max) {
      issues.push(`stage ${stage.stageId} has an inverted beat budget`)
    }
    if (stage.secondaryRoles.includes('anchor')) {
      issues.push(
        `stage ${stage.stageId} lists anchor as a secondary role; exactly one anchor is the invariant`,
      )
    }
    if (stage.secondaryRoles.includes('recovery')) {
      issues.push(
        `stage ${stage.stageId} lists recovery as a secondary role; recovery is conditional and outside the ordinary budget`,
      )
    }
    if (stage.difficulty.tolerance < 0 || stage.difficulty.target <= 0) {
      issues.push(`stage ${stage.stageId} has an unusable difficulty envelope`)
    }
    if (stage.narrativeBeats < 0) {
      issues.push(
        `stage ${stage.stageId} cannot play a negative number of narrative beats`,
      )
    }
  }

  return issues
}

/**
 * The development composition policy.
 *
 * Every number is `RECOMENDADA` and subject to Teacher Gate. It exists so the
 * composer has something real to run against; it does not claim any of these
 * targets is the right one for a fifteen-year-old.
 */
export const developmentCompositionPolicy: CompositionPolicy = {
  id: 'development',
  version: '1.0.0-dev',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: [...PUBLISHED_OBJECTIVES_V1],
  stages: [stageCompositionPolicy('grade-7')],
}
