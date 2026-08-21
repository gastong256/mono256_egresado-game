/**
 * DEVELOPMENT SCORING POLICY — not the official Egresado ruleset.
 *
 * The constants below are the mid-points of the reference ranges in
 * `rules-scoring-and-progression.md`. They exist so the engine can be exercised
 * end to end; open question 24 must be closed before any of them is treated as
 * a balanced or official value. `production` is `false`, and the ruleset loader
 * refuses to build an official ruleset from a policy flagged this way.
 *
 * All arithmetic runs on exact rationals and rounds once, at the end, half-up.
 * Two runs with the same evidence therefore always produce the same integer.
 */

import { assertNever } from '../core/exhaustive'
import type { DifficultyLevel, SolutionQuality } from '../challenges/taxonomy'
import {
  add,
  fromDecimalString,
  fromInteger,
  multiply,
  toNumber,
  type Rational,
} from '../math/rational'
import { formatDecimal, roundTo } from '../math/rounding'
import type {
  ScoreBreakdown,
  ScoreComponent,
  ScoreEventInput,
  ScoringPolicy,
} from './policy'

/** Reference base value of a normal event. */
const BASE_POINTS = 1000

/** Quality factors: mid-point of the documented 0.20–0.40 band for invalid. */
function qualityFactor(quality: SolutionQuality): Rational {
  switch (quality) {
    case 'invalid':
      return fromDecimalString('0.30')
    case 'functional':
      return fromDecimalString('0.70')
    case 'efficient':
      return fromDecimalString('0.90')
    case 'optimal':
      return fromDecimalString('1.00')
    default:
      return assertNever(quality)
  }
}

/** Difficulty 1 scores at face value; difficulty 5 is worth 60 % more. */
function difficultyFactor(difficulty: DifficultyLevel): Rational {
  return add(
    fromInteger(1),
    multiply(fromDecimalString('0.15'), fromInteger(difficulty - 1)),
  )
}

/** Streak multiplier, capped at +8 % exactly as the rules require. */
function streakBonusPercent(optimalStreak: number): Rational {
  if (optimalStreak >= 4) {
    return fromInteger(8)
  }
  if (optimalStreak === 3) {
    return fromInteger(5)
  }
  if (optimalStreak === 2) {
    return fromInteger(3)
  }
  return fromInteger(0)
}

function roundToPoints(value: Rational): number {
  return Number(roundTo(value, 0, 'half-up').n)
}

export const developmentScoringPolicy: ScoringPolicy = {
  id: 'development-scoring-v1',
  production: false,

  scoreEvent(input: ScoreEventInput): ScoreBreakdown {
    const quality = qualityFactor(input.quality)
    const difficulty = difficultyFactor(input.difficulty)
    const base = multiply(
      multiply(fromInteger(BASE_POINTS), quality),
      difficulty,
    )

    const components: ScoreComponent[] = []

    // Streak recognises sustained optimal play without letting it dominate.
    const streakPercent = streakBonusPercent(input.optimalStreak)
    const streakPoints =
      streakPercent.n === 0n
        ? 0
        : roundToPoints(
            multiply(base, multiply(streakPercent, fromDecimalString('0.01'))),
          )
    if (streakPoints > 0) {
      components.push({ key: 'streak', points: streakPoints })
    }

    // Efficiency rewards not wasting resources, which the design treats as the
    // signal that separates a working answer from a good one.
    const efficiencyPoints =
      input.quality === 'invalid'
        ? 0
        : roundToPoints(
            multiply(
              fromInteger(120),
              fromDecimalString(input.metrics.efficiency.toFixed(4)),
            ),
          )
    if (efficiencyPoints > 0) {
      components.push({ key: 'efficiency', points: efficiencyPoints })
    }

    // Consulting the evidence a challenge offers is rewarded, so asking for
    // data is never the expensive choice.
    const informationPoints = roundToPoints(
      multiply(
        fromInteger(60),
        fromDecimalString(input.metrics.informationUse.toFixed(4)),
      ),
    )
    if (informationPoints > 0) {
      components.push({ key: 'information-use', points: informationPoints })
    }

    const bonusPoints = components.reduce(
      (total, component) => total + component.points,
      0,
    )
    // No penalties are defined yet: the rules only allow penalising declared
    // playful decisions, and none exist in the development content.
    const penaltyPoints = 0
    const basePoints = roundToPoints(base)
    const totalPoints = Math.max(0, basePoints + bonusPoints - penaltyPoints)

    return {
      basePoints,
      qualityFactor: formatDecimal(quality, 2),
      difficultyFactor: formatDecimal(difficulty, 2),
      components,
      bonusPoints,
      penaltyPoints,
      totalPoints,
    }
  },
}

/** Exposed for tests that assert the documented factor table. */
export function developmentQualityFactor(quality: SolutionQuality): number {
  return toNumber(qualityFactor(quality))
}
