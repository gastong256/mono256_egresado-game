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

import type { ChallengeId, ChallengeInstanceId } from '../core/branded'
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
import type { StatEffect, VisibleStat } from '../progression/stats'
import type { DifficultyLevel, MathCategory, SolutionQuality } from './taxonomy'

export type {
  DifficultyLevel,
  MathCategory,
  SolutionQuality,
  StatEffect,
  VisibleStat,
}

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
  /** Visible-stat deltas requested by this outcome. */
  readonly statEffects: readonly StatEffect[]
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

/** Address that fully determines a generated challenge instance. */
export interface ChallengeInstanceRef {
  readonly instanceId: ChallengeInstanceId
  readonly definitionId: ChallengeId
  readonly stageId: StageId
  readonly eventIndex: number
  readonly difficulty: DifficultyLevel
}

export interface GenerationContext {
  readonly rng: Rng
  readonly difficulty: DifficultyLevel
}

/** Everything the UI may see. Deliberately excludes the solution. */
export interface PublicChallengeView {
  readonly ref: ChallengeInstanceRef
  readonly narrative: ChallengeNarrative
  readonly interaction: InteractionPresentation
  readonly tools: readonly ToolId[]
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

/** Author-facing specification, generic over the private model type. */
export interface ChallengeSpec<TModel> {
  readonly id: ChallengeId
  readonly interaction: InteractionKind
  readonly categories: readonly MathCategory[]
  readonly stages: readonly StageId[]
  readonly baseDifficulty: DifficultyLevel
  readonly tools: readonly ToolId[]
  generate(context: GenerationContext): TModel
  verify(model: TModel): readonly string[]
  narrate(model: TModel): ChallengeNarrative
  requestable?(model: TModel): readonly RequestableInformation[]
  present(model: TModel, revealed: readonly string[]): InteractionPresentation
  evaluate(
    model: TModel,
    answer: InteractionAnswer,
    revealed: readonly string[],
  ): Result<ChallengeEvaluation, EngineRejection>
}

/** Type-erased definition stored in the registry. */
export interface ChallengeDefinition {
  readonly id: ChallengeId
  readonly interaction: InteractionKind
  readonly categories: readonly MathCategory[]
  readonly stages: readonly StageId[]
  readonly baseDifficulty: DifficultyLevel
  readonly tools: readonly ToolId[]
  materialize(
    ref: ChallengeInstanceRef,
    context: GenerationContext,
  ): MaterializedChallenge
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
export function defineChallenge<TModel>(
  spec: ChallengeSpec<TModel>,
): ChallengeDefinition {
  return {
    id: spec.id,
    interaction: spec.interaction,
    categories: spec.categories,
    stages: spec.stages,
    baseDifficulty: spec.baseDifficulty,
    tools: spec.tools,
    materialize(
      ref: ChallengeInstanceRef,
      context: GenerationContext,
    ): MaterializedChallenge {
      let model: TModel | undefined
      let attempts = 0
      let lastIssues: readonly string[] = []

      for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
        attempts = attempt + 1
        const candidate = spec.generate({
          rng: context.rng.derive('attempt', attempt),
          difficulty: context.difficulty,
        })
        lastIssues = spec.verify(candidate)
        if (lastIssues.length === 0) {
          model = candidate
          break
        }
      }

      if (model === undefined) {
        throw new EngineInvariantError(
          `challenge ${spec.id} could not generate a valid instance in ${String(MAX_GENERATION_ATTEMPTS)} attempts: ${lastIssues.join('; ')}`,
        )
      }

      const generated = model

      return {
        ref,
        attempts,
        narrative: spec.narrate(generated),
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
