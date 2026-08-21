/**
 * Shared evaluation helpers.
 *
 * Every challenge produces the same structured result shape, so scoring,
 * difficulty adaptation and the profile engine can consume any family without
 * knowing which one produced the answer.
 */

import { EngineInvariantError } from '../core/invariant'
import { compare, divide, subtract, type Rational } from '../math/rational'
import { absolute, isZero, toNumber } from '../math/rational'
import type { ReasoningMetrics } from './contracts'
import type { SolutionQuality } from './taxonomy'

/** Clamps a metric into the documented 0..1 range. */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new EngineInvariantError(
      `metric must be finite, received ${String(value)}`,
    )
  }
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

export interface MetricsInput {
  readonly efficiency?: number
  readonly precision?: number
  readonly risk?: number
  readonly informationUse?: number
}

export function metrics(input: MetricsInput): ReasoningMetrics {
  return {
    efficiency: clamp01(input.efficiency ?? 0),
    precision: clamp01(input.precision ?? 0),
    risk: clamp01(input.risk ?? 0),
    informationUse: clamp01(input.informationUse ?? 0),
  }
}

/**
 * Precision as a 0..1 score from the relative distance to a target.
 *
 * Computed on rationals and only converted to a number at the very end, where
 * the value is a soft metric rather than an authoritative comparison.
 */
export function precisionFromDistance(
  submitted: Rational,
  target: Rational,
): number {
  if (isZero(target)) {
    return compare(submitted, target) === 0 ? 1 : 0
  }

  const relative = divide(
    absolute(subtract(submitted, target)),
    absolute(target),
  )
  return clamp01(1 - toNumber(relative))
}

/**
 * Efficiency as a 0..1 score comparing consumed resources against the optimum.
 *
 * `optimal / used`, so using exactly the optimum scores 1 and overspending
 * degrades smoothly.
 */
export function efficiencyFromUsage(optimal: Rational, used: Rational): number {
  if (isZero(used)) {
    return 0
  }
  return clamp01(toNumber(divide(optimal, used)))
}

/** Ranks qualities so policies can compare outcomes without a lookup table. */
export function qualityRank(quality: SolutionQuality): 0 | 1 | 2 | 3 {
  switch (quality) {
    case 'invalid':
      return 0
    case 'functional':
      return 1
    case 'efficient':
      return 2
    case 'optimal':
      return 3
  }
}

/** Fraction of the offered optional information the player consulted. */
export function informationUseRatio(
  revealedCount: number,
  availableCount: number,
): number {
  if (availableCount <= 0) {
    return 0
  }
  return clamp01(revealedCount / availableCount)
}
