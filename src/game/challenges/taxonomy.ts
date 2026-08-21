/**
 * Shared vocabulary.
 *
 * These are leaf types with no dependencies of their own, so progression,
 * challenges, scoring and narrative can all speak the same language without
 * importing each other.
 */

/** Mathematical taxonomy from `challenge-system.md`. */
export const MATH_CATEGORIES = [
  'quantity',
  'proportions-and-percentages',
  'time-and-rates',
  'space-and-shape',
  'patterns-and-relations',
  'data-and-statistics',
  'probability-and-uncertainty',
  'optimization-and-constraints',
] as const

export type MathCategory = (typeof MATH_CATEGORIES)[number]

/** Intrinsic difficulty of a challenge template, 1 (simplest) to 5. */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

export function isDifficultyLevel(value: number): value is DifficultyLevel {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

/** Clamps an arbitrary integer into the difficulty scale. */
export function clampDifficulty(value: number): DifficultyLevel {
  const rounded = Math.round(value)
  if (rounded <= 1) {
    return 1
  }
  if (rounded >= 5) {
    return 5
  }
  return rounded as DifficultyLevel
}

/**
 * Resolution quality, per the GDD.
 *
 * `invalid` means an essential constraint was broken; the run still continues.
 */
export const SOLUTION_QUALITIES = [
  'invalid',
  'functional',
  'efficient',
  'optimal',
] as const

export type SolutionQuality = (typeof SOLUTION_QUALITIES)[number]
