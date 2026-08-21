/**
 * School progression.
 *
 * `rules-scoring-and-progression.md` fixes the seven canonical stages. The
 * ordering and everything a stage may change — target difficulty, enabled
 * mathematical categories, event count — are configuration owned by a ruleset,
 * never `if (year === 3)` scattered through the engine.
 */

import type { DifficultyLevel, MathCategory } from '../challenges/taxonomy'

/**
 * The canonical stages, in order.
 *
 * The tuple is the single source of truth: the type is derived from it, so the
 * runtime list and the union can never drift, and schemas built from it infer
 * the exact literal union instead of `string`.
 */
export const STAGE_ORDER = [
  'grade-7',
  'year-1',
  'year-2',
  'year-3',
  'year-4',
  'year-5',
  'graduation',
] as const

export type StageId = (typeof STAGE_ORDER)[number]

export interface StageConfig {
  readonly id: StageId
  /** Stable key the UI maps to a localized stage name. */
  readonly labelKey: string
  /** Number of events the stage plays before completing. */
  readonly eventCount: number
  /** Intrinsic difficulty this stage targets. */
  readonly targetDifficulty: DifficultyLevel
  /** Mathematical categories the stage may draw from. */
  readonly categories: readonly MathCategory[]
}

export function isStageId(value: string): value is StageId {
  return (STAGE_ORDER as readonly string[]).includes(value)
}

export function stageIndex(stage: StageId): number {
  return STAGE_ORDER.indexOf(stage)
}

/** Next stage in canonical order, or `undefined` after the final stage. */
export function nextStage(stage: StageId): StageId | undefined {
  return STAGE_ORDER[stageIndex(stage) + 1]
}
