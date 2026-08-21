/**
 * DEVELOPMENT DIFFICULTY POLICY — not the official Egresado ruleset.
 *
 * A deliberately transparent rule: two strong answers in a row step the run up,
 * two weak answers step it down, and the result is always clamped into the
 * stage's own band so a good streak in 7.º grado cannot produce a 5.º año
 * problem. Open question 5 must be closed before this becomes official.
 */

import { qualityRank } from '../challenges/evaluation'
import {
  clampDifficulty,
  type DifficultyLevel,
  type SolutionQuality,
} from '../challenges/taxonomy'
import type { StageConfig } from '../progression/stages'
import type { DifficultyPolicy, DifficultyState } from './policy'

/** How many recent answers the rule looks at. */
const WINDOW = 2

/** A stage may drift one level either side of its target. */
const DRIFT = 1

function boundsFor(stage: StageConfig): {
  readonly min: DifficultyLevel
  readonly max: DifficultyLevel
} {
  return {
    min: clampDifficulty(stage.targetDifficulty - DRIFT),
    max: clampDifficulty(stage.targetDifficulty + DRIFT),
  }
}

function clampToStage(value: number, stage: StageConfig): DifficultyLevel {
  const { min, max } = boundsFor(stage)
  return clampDifficulty(Math.min(Math.max(value, min), max))
}

export const developmentDifficultyPolicy: DifficultyPolicy = {
  id: 'development-difficulty-v1',
  production: false,

  initialFor(stage: StageConfig, previous: DifficultyState | undefined) {
    if (previous === undefined) {
      return stage.targetDifficulty
    }
    // Carry momentum across the stage boundary, but never outside the new
    // stage's band.
    return clampToStage(previous.current, stage)
  },

  next(state: DifficultyState, stage: StageConfig): DifficultyState {
    const recentWindow = state.recent.slice(-WINDOW)

    if (recentWindow.length < WINDOW) {
      return state
    }

    const strong = recentWindow.every(
      (quality: SolutionQuality) => qualityRank(quality) >= 2,
    )
    const weak = recentWindow.every(
      (quality: SolutionQuality) => qualityRank(quality) <= 1,
    )

    if (!strong && !weak) {
      return state
    }

    const adjusted = clampToStage(state.current + (strong ? 1 : -1), stage)

    // The window is cleared after an adjustment so one streak cannot move the
    // difficulty twice.
    return { current: adjusted, recent: [] }
  },
}
