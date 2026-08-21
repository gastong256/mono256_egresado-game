/**
 * Difficulty contract.
 *
 * Three concerns are kept apart, as the mission architecture requires:
 *
 * - a challenge template's **intrinsic** difficulty (`baseDifficulty`);
 * - the **run's** current difficulty state, owned here;
 * - **content selection**, which belongs to the storylet pool.
 *
 * Open question 5 has not decided between manual, adaptive and hybrid
 * difficulty, so this file defines only the mechanism. Any adaptation must be an
 * explainable deterministic rule; opaque models are out of scope by design.
 */

import type { DifficultyLevel, SolutionQuality } from '../challenges/taxonomy'
import type { StageConfig } from '../progression/stages'

export interface DifficultyState {
  readonly current: DifficultyLevel
  /** Qualities observed since the last adjustment, oldest first. */
  readonly recent: readonly SolutionQuality[]
}

export interface DifficultyPolicy {
  readonly id: string
  readonly production: boolean
  /** Difficulty a stage opens at. */
  initialFor(
    stage: StageConfig,
    previous: DifficultyState | undefined,
  ): DifficultyLevel
  /** Difficulty for the next event, given what just happened. */
  next(state: DifficultyState, stage: StageConfig): DifficultyState
}

export function initialDifficultyState(
  current: DifficultyLevel,
): DifficultyState {
  return { current, recent: [] }
}
