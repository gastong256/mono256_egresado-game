/**
 * Scheduling cost of a difficulty band.
 *
 * The run composer needs one number per beat so it can say whether two runs
 * carry comparable load. That number is **not** a score multiplier and must
 * never become one: `difficulty-and-playability.md` keeps them apart because the
 * scheduler wants a strong signal — it has to feel the gap between `core` and
 * `stretch` to balance anything — while the score wants a weak one, so that
 * which variant the draw handed you never beats how well you played.
 *
 * ## Integers, not decimals
 *
 * The documented candidates are 1,00 · 1,50 · 2,10. They live here as 100, 150
 * and 210 **hundredths**, because a deterministic engine that adds floats and
 * then compares against a bound will eventually disagree with itself about
 * whether a plan fit. The engine already refuses floating point everywhere the
 * result matters ([ADR-013](../../../docs/03-architecture/adr/ADR-013-exact-rational-arithmetic.md));
 * a budget is one of those places.
 *
 * ## Candidate, not official
 *
 * The values are `RECOMENDADA` and subject to Teacher Gate (open question 44).
 * They are a versioned policy object rather than constants sprinkled through the
 * composer precisely so recalibrating them is a data change.
 */

import { EngineInvariantError } from '../core/invariant'
import { DIFFICULTY_BANDS, type DifficultyBand } from './cognitive'

/** Scheduling cost in hundredths of a beat. `core` is the unit. */
export type DifficultyCost = number

export interface DifficultyCostPolicy {
  /** Stable identity, so a composed run can say which calibration built it. */
  readonly id: string
  /** Bumped whenever a cost changes, because that changes composed plans. */
  readonly version: string
  /**
   * False until a Teacher Gate approves the calibration.
   *
   * Same discipline as the scoring policy: nothing can call itself official by
   * writing `true` in its own file, and a run composed under a development
   * calibration must be able to say so.
   */
  readonly official: boolean
  readonly costs: Readonly<Record<DifficultyBand, DifficultyCost>>
}

/**
 * The candidate calibration from the design document.
 *
 * `core` 1,00 · `standard` 1,50 · `stretch` 2,10. The gaps are deliberately
 * wider than the score multipliers they sit beside in that table.
 */
export const candidateDifficultyCostPolicy: DifficultyCostPolicy = {
  id: 'candidate',
  version: '1.0.0-candidate',
  official: false,
  costs: { core: 100, standard: 150, stretch: 210 },
}

export function costOf(
  policy: DifficultyCostPolicy,
  band: DifficultyBand,
): DifficultyCost {
  const cost = policy.costs[band]
  if (!Number.isSafeInteger(cost) || cost <= 0) {
    throw new EngineInvariantError(
      `difficulty cost policy ${policy.id} has no positive cost for ${band}`,
    )
  }
  return cost
}

/** Rejects a policy that could not produce comparable plans. */
export function difficultyCostPolicyIssues(
  policy: DifficultyCostPolicy,
): readonly string[] {
  const issues: string[] = []

  if (policy.id.trim() === '' || policy.version.trim() === '') {
    issues.push('a difficulty cost policy must be identified and versioned')
  }

  for (const band of DIFFICULTY_BANDS) {
    const cost = policy.costs[band]
    if (!Number.isSafeInteger(cost) || cost <= 0) {
      issues.push(`band ${band} has no positive integer cost`)
    }
  }

  // A calibration that does not order the bands would make the budget blind to
  // the very difference it exists to measure.
  if (
    policy.costs.core >= policy.costs.standard ||
    policy.costs.standard >= policy.costs.stretch
  ) {
    issues.push('costs must increase strictly from core to standard to stretch')
  }

  return issues
}

/** Renders a cost the way the design document writes it. Diagnostics only. */
export function formatCost(cost: DifficultyCost): string {
  const whole = Math.trunc(cost / 100)
  const fraction = Math.abs(cost % 100)
  return `${String(whole)},${fraction.toString().padStart(2, '0')}`
}
