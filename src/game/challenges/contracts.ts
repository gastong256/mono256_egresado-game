/**
 * Challenge contracts.
 *
 * A challenge is expressed as four separable responsibilities, following the
 * generation pattern required by `docs/01-game-design/challenge-system.md`:
 *
 * 1. **generate** parameters from the seeded RNG;
 * 2. **verify** the generated instance against its own invariants;
 * 3. **present** a public view that never carries the solution;
 * 4. **evaluate** a typed answer into a structured, explainable result.
 *
 * A generated model is a pure function of its address — seed, stage, event
 * index, definition and difficulty — so the engine stores only that address and
 * recomputes the model on demand. Nothing non-serializable ever reaches run
 * state, snapshots stay small, and replay cannot drift from the original run.
 */

import type {
  ChallengeId,
  ChallengeInstanceId,
  ScenarioFamilyId,
  VariantId,
} from '../core/branded'
import { EngineInvariantError } from '../core/invariant'
import type { EngineRejection } from '../core/errors'
import type { Result } from '../core/result'
import type { Rng } from '../random/rng'
import type {
  InteractionAnswer,
  InteractionKind,
  InteractionPresentation,
  RequestableInformation,
  ToolId,
} from './interactions'
import type { StageId } from '../progression/stages'
import {
  bandOf,
  type CognitiveProfile,
  type DifficultyBand,
} from '../difficulty/cognitive'
import type { ChallengeScoringProfile } from './scoring-profile'
import type { CompositionMetadata } from './composition-metadata'
import type { CareerEffects } from '../progression/career'
import type { DifficultyLevel, MathCategory, SolutionQuality } from './taxonomy'
import type {
  ChallengePlacementRole,
  ChallengeVariantRef,
} from './content-model'
import {
  eraseVariantSource,
  resolveVariantParams,
  type ErasedVariantSource,
  type VariantSourceSpec,
} from './variant-source'

export type { CareerEffects, DifficultyLevel, MathCategory, SolutionQuality }

/** Structured explanation of a result. Localization happens in the UI layer. */
export interface FeedbackFact {
  readonly label: string
  readonly value: string
}

export interface ChallengeFeedback {
  /** Stable key the UI maps to a localized headline. */
  readonly outcomeKey: string
  /** The numbers that explain the consequence, per the math framework. */
  readonly facts: readonly FeedbackFact[]
  /** Constraint that was violated, when the answer was invalid. */
  readonly violatedConstraint?: string
  /** Comparison against the declared optimum, when the challenge declares one. */
  readonly optimalComparison?: string
  /**
   * What happens in the story because of this outcome.
   *
   * The panel's job is to turn a result into a consequence, not to hand out a
   * verdict: the ledger explains the arithmetic and this line says what it cost
   * or bought in the world. Authored per outcome, because a consequence the
   * engine could derive would be a restatement of the numbers above it.
   */
  readonly consequence?: string
  /**
   * El veredicto en una o dos palabras, para el sello.
   *
   * «Alcanzó», «Llegaste tarde». Es lenguaje de legajo y es opcional: no toda
   * situación tiene un veredicto que se pueda decir en una palabra, y forzarlo
   * produciría sellos genéricos que no dicen nada.
   */
  readonly stamp?: string
}

/**
 * Hidden educational metrics gathered per answer.
 *
 * These feed difficulty adaptation and the final profile. They are never shown
 * to the player, per the GDD separation of visible stats and derived metrics.
 */
export interface ReasoningMetrics {
  /** Resource efficiency, 0..1, where 1 means nothing was wasted. */
  readonly efficiency: number
  /** Closeness of the answer to the declared target, 0..1. */
  readonly precision: number
  /** How much uncertainty the decision accepted, 0..1. */
  readonly risk: number
  /** Fraction of the offered optional information the player consulted, 0..1. */
  readonly informationUse: number
}

export interface ChallengeEvaluation {
  readonly quality: SolutionQuality
  readonly feedback: ChallengeFeedback
  readonly metrics: ReasoningMetrics
  /**
   * What this outcome does to the career.
   *
   * An outcome declares only the dimensions it can genuinely touch — most
   * declare one or two, never four. Deciding which bus to take exercises
   * arithmetic but is not academic, so it moves Estilo and nothing else.
   */
  readonly careerEffects: CareerEffects
  /** Narrative flags this outcome sets. */
  readonly flagEffects: readonly FlagEffect[]
}

export interface FlagEffect {
  readonly flag: string
  readonly value: boolean | number | string
}

/** Narrative wrapper shown above the interaction. */
export interface ChallengeNarrative {
  readonly title: string
  readonly setup: string
  readonly goal: string
}

/**
 * Address that fully determines a generated challenge instance.
 *
 * It carries the full content address — family, template, variant — plus where
 * the run placed it. `templateId` names the challenge definition: a definition
 * *is* a template in the content model.
 */
export interface ChallengeInstanceRef {
  readonly instanceId: ChallengeInstanceId
  readonly familyId: ScenarioFamilyId
  readonly templateId: ChallengeId
  readonly variantId: VariantId
  readonly stageId: StageId
  readonly eventIndex: number
  readonly difficulty: DifficultyLevel
}

/** The content address of an instance, without where the run placed it. */
export function variantRefOf(ref: ChallengeInstanceRef): ChallengeVariantRef {
  return {
    familyId: ref.familyId,
    templateId: ref.templateId,
    variantId: ref.variantId,
  }
}

/** What a caller supplies to materialise an instance. */
export interface MaterializationContext {
  readonly rng: Rng
  readonly difficulty: DifficultyLevel
  /** Which variant of this template is being materialised. */
  readonly variantId: VariantId
  /**
   * Substream addressed by the variant identity alone.
   *
   * It is derived from the fixed variant-space seed, not from the run, so the
   * same address is the same problem in every run.
   */
  readonly variantRng: Rng
}

/** What a template's `generate` receives: the context plus resolved parameters. */
export interface GenerationContext<
  TParams = unknown,
> extends MaterializationContext {
  /**
   * The parameters behind this variant address.
   *
   * Already resolved: authored records are looked up, generated candidates are
   * produced from the variant substream. A template turns them into its private
   * model and never has to know which of the two happened.
   */
  readonly params: TParams
}

/**
 * One obligation, as the single remediation beat of its year presents it.
 *
 * `title` and `text` are the content set's authored debrief for the template
 * that went badly; the ids say which obligation it is, not what to render.
 */
export interface RecoveryNote {
  readonly obligationId: string
  readonly sourceTemplateId: string
  readonly title: string
  readonly text: string
}

/** Everything the UI may see. Deliberately excludes the solution. */
export interface PublicChallengeView {
  readonly ref: ChallengeInstanceRef
  readonly narrative: ChallengeNarrative
  readonly interaction: InteractionPresentation
  readonly tools: readonly ToolId[]
  /**
   * What a remediation beat closes, split by how it closes it.
   *
   * Derived from the obligations still pending and the content set's routing,
   * never persisted: `practised` is what this interaction works on, `debriefed`
   * is closed by the same beat with authored text and is not practised in a
   * second interaction (ADR-025).
   */
  readonly review?: {
    readonly practised: readonly RecoveryNote[]
    readonly debriefed: readonly RecoveryNote[]
  }
  /**
   * Lo que un evento raro le agregó a esta escena, si apareció alguno.
   *
   * Es texto sobre la misma situación: la variante que se juega es una
   * aprobada del catálogo y el evaluador no sabe que el evento existió.
   */
  readonly rareNote?: {
    readonly id: string
    readonly title: string
    readonly text: string
  }
}

/**
 * A generated challenge bound to its model.
 *
 * The model itself never escapes: the definition closes over it and exposes
 * only the operations the engine is allowed to perform. This keeps the registry
 * heterogeneous without casts and keeps evaluators out of the UI.
 */
export interface MaterializedChallenge {
  readonly ref: ChallengeInstanceRef
  readonly narrative: ChallengeNarrative
  /** Presentation-only flags cannot alter parameters, evaluation or scoring. */
  narrativeFor(
    flags: Readonly<Record<string, boolean | number | string>>,
  ): ChallengeNarrative
  readonly tools: readonly ToolId[]
  /**
   * Generation attempts spent before the instance satisfied its invariants.
   *
   * One means the first draw was valid. A consistently high count means the
   * generator is producing degenerate parameters and should be constructed more
   * carefully; content validation reports it.
   */
  readonly attempts: number
  /** Information the player may request before deciding, if any. */
  readonly requestable: readonly RequestableInformation[]
  present(revealed: readonly string[]): InteractionPresentation
  evaluate(
    answer: InteractionAnswer,
    revealed: readonly string[],
  ): Result<ChallengeEvaluation, EngineRejection>
  /** Content-time invariants; a non-empty result blocks the definition. */
  verify(): readonly string[]
}

/**
 * Author-facing specification of a challenge template.
 *
 * A spec declares three things the content model needs on top of the gameplay
 * rule: which scenario family it belongs to, how a run may place it, and which
 * concrete variants it can produce.
 */
export interface ChallengeSpec<TModel, TParams> {
  readonly composition?: CompositionMetadata
  readonly id: ChallengeId
  /** Scenario family this template belongs to. */
  readonly family: ScenarioFamilyId
  /** How a run may schedule this template. */
  readonly placement: ChallengePlacementRole
  /**
   * The variants this template can produce, in authored order.
   *
   * Non-empty and without repetition. The order is part of the content
   * contract: variant selection draws an index from it, so reordering the list
   * changes which case a stored seed produces and needs a content version bump.
   */
  readonly variants: readonly VariantId[]
  /**
   * Where this template's variants come from, and how they are checked.
   *
   * The declared `variants` above are what the live game plays; the source can
   * reach further — a candidate space the catalog pipeline explores — without
   * changing what a normal run schedules.
   */
  readonly variantSource: VariantSourceSpec<TParams>
  readonly interaction: InteractionKind
  readonly categories: readonly MathCategory[]
  /** Stages this template may be scheduled in. Permission, not selection. */
  readonly stages: readonly StageId[]
  readonly baseDifficulty: DifficultyLevel
  /**
   * What makes this template demanding, declared as structure.
   *
   * The run composer schedules by the band derived from this, so an author who
   * wants a template treated as harder has to name the trait that makes it so.
   * `baseDifficulty` remains the runtime knob the difficulty policy turns; the
   * two answer different questions and are allowed to disagree.
   */
  readonly cognitive: CognitiveProfile
  /**
   * How this template's result becomes competitive evidence.
   *
   * Declared here, beside the evaluator that produced the result, because only
   * the template knows whether its honest resolution is four quality steps or
   * something finer, and whether it measured a second, genuinely different fact
   * a secondary component may read.
   */
  readonly scoring: ChallengeScoringProfile
  readonly tools: readonly ToolId[]
  generate(context: GenerationContext<TParams>): TModel
  verify(model: TModel): readonly string[]
  narrate(
    model: TModel,
    context: {
      readonly flags: Readonly<Record<string, boolean | number | string>>
    },
  ): ChallengeNarrative
  requestable?(model: TModel): readonly RequestableInformation[]
  present(model: TModel, revealed: readonly string[]): InteractionPresentation
  evaluate(
    model: TModel,
    answer: InteractionAnswer,
    revealed: readonly string[],
  ): Result<ChallengeEvaluation, EngineRejection>
}

/**
 * Type-erased challenge template stored in the content catalog.
 *
 * The model type is gone; the content address, the placement metadata and the
 * variant list survive, because the catalog and the plan validator reason about
 * exactly those.
 */
export interface ChallengeDefinition {
  /** Required by global composition; absent in historical content sets. */
  readonly composition?: CompositionMetadata
  readonly id: ChallengeId
  readonly family: ScenarioFamilyId
  readonly placement: ChallengePlacementRole
  readonly variants: readonly VariantId[]
  readonly variantSource: ErasedVariantSource
  readonly interaction: InteractionKind
  readonly categories: readonly MathCategory[]
  readonly stages: readonly StageId[]
  readonly baseDifficulty: DifficultyLevel
  /** The structure that makes this template demanding, as the author declared it. */
  readonly cognitive: CognitiveProfile
  /** Authoring band derived from `cognitive`. What the run composer schedules by. */
  readonly band: DifficultyBand
  /** How this template's result becomes competitive evidence. */
  readonly scoring: ChallengeScoringProfile
  readonly tools: readonly ToolId[]
  materialize(
    ref: ChallengeInstanceRef,
    context: MaterializationContext,
  ): MaterializedChallenge
}

/**
 * Chooses which variant of a template an instance uses.
 *
 * A single-variant template draws nothing: there is no choice to make, and
 * spending a draw on it would couple every template's numbers to how many
 * variants its neighbours happen to declare.
 */
export function selectVariantId(
  rng: Rng,
  variants: readonly VariantId[],
): VariantId {
  const only = variants[0]
  if (only === undefined) {
    throw new EngineInvariantError(
      'a template must declare at least one variant',
    )
  }
  return variants.length === 1 ? only : rng.pick(variants)
}

/**
 * Attempts allowed before a generator is declared broken.
 *
 * Generators should construct valid parameters directly; rejection sampling is
 * a safety net for the rare corner a constructive rule cannot cover, not a
 * substitute for solving the problem internally.
 */
const MAX_GENERATION_ATTEMPTS = 24

/**
 * Erases the model type while preserving full type safety inside the closure.
 *
 * No cast is involved: the generated model stays in scope and every exposed
 * operation is applied to it directly.
 *
 * Generation is retried on its own RNG substream until the instance satisfies
 * its declared invariants, so a degenerate draw is never presented to a player.
 * Because the attempt index is part of the substream address, the retry is as
 * deterministic as the first draw and replay is unaffected.
 */
export function defineChallenge<TModel, TParams>(
  spec: ChallengeSpec<TModel, TParams>,
): ChallengeDefinition {
  if (spec.variants.length === 0) {
    throw new EngineInvariantError(
      `challenge ${spec.id} must declare at least one variant`,
    )
  }
  if (new Set(spec.variants).size !== spec.variants.length) {
    throw new EngineInvariantError(
      `challenge ${spec.id} declares a duplicate variant id`,
    )
  }

  return {
    id: spec.id,
    family: spec.family,
    placement: spec.placement,
    variants: spec.variants,
    variantSource: eraseVariantSource(spec.id, spec.variantSource),
    interaction: spec.interaction,
    categories: spec.categories,
    stages: spec.stages,
    baseDifficulty: spec.baseDifficulty,
    cognitive: spec.cognitive,
    ...(spec.composition === undefined
      ? {}
      : { composition: spec.composition }),
    band: bandOf(spec.cognitive),
    scoring: spec.scoring,
    tools: spec.tools,
    materialize(
      ref: ChallengeInstanceRef,
      context: MaterializationContext,
    ): MaterializedChallenge {
      const params = resolveVariantParams(
        spec.id,
        spec.variantSource,
        context.variantId,
        context.variantRng,
      )

      let model: TModel | undefined
      let attempts = 0
      let lastIssues: readonly string[] = []

      for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
        attempts = attempt + 1
        const candidate = spec.generate({
          rng: context.rng.derive('attempt', attempt),
          difficulty: context.difficulty,
          variantId: context.variantId,
          variantRng: context.variantRng,
          params,
        })
        lastIssues = spec.verify(candidate)
        if (lastIssues.length === 0) {
          model = candidate
          break
        }
      }

      if (model === undefined) {
        throw new EngineInvariantError(
          `challenge ${spec.id} variant ${context.variantId} could not generate a valid instance in ${String(MAX_GENERATION_ATTEMPTS)} attempts: ${lastIssues.join('; ')}`,
        )
      }

      const generated = model

      return {
        ref,
        attempts,
        narrative: spec.narrate(generated, { flags: {} }),
        narrativeFor: (flags) => spec.narrate(generated, { flags }),
        tools: spec.tools,
        requestable: spec.requestable?.(generated) ?? [],
        present: (revealed) => spec.present(generated, revealed),
        evaluate: (answer, revealed) =>
          spec.evaluate(generated, answer, revealed),
        verify: () => spec.verify(generated),
      }
    },
  }
}
