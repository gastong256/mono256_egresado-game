/**
 * Answer tolerance.
 *
 * The math framework requires each challenge to declare the input tolerance it
 * accepts. A numeric answer is judged against an explicit, serializable rule
 * rather than an approximate float comparison, so an evaluator can never mark a
 * mathematically correct answer wrong because of representation error.
 */

import { assertNever } from '../core/exhaustive'
import { EngineInvariantError } from '../core/invariant'
import {
  absolute,
  compare,
  divide,
  fromInteger,
  isZero,
  multiply,
  subtract,
  type Rational,
} from './rational'

export type Tolerance =
  /** The submitted value must equal the expected value exactly. */
  | { readonly kind: 'exact' }
  /** |submitted - expected| <= amount. */
  | { readonly kind: 'absolute'; readonly amount: Rational }
  /** |submitted - expected| <= |expected| * percent / 100. */
  | { readonly kind: 'relative-percent'; readonly percent: Rational }
  /** The submitted value must fall inside a closed interval. */
  | { readonly kind: 'range'; readonly min: Rational; readonly max: Rational }

export function withinTolerance(
  submitted: Rational,
  expected: Rational,
  tolerance: Tolerance,
): boolean {
  switch (tolerance.kind) {
    case 'exact':
      return compare(submitted, expected) === 0
    case 'absolute': {
      if (tolerance.amount.n < 0n) {
        throw new EngineInvariantError('tolerance amount must not be negative')
      }
      const difference = absolute(subtract(submitted, expected))
      return compare(difference, tolerance.amount) <= 0
    }
    case 'relative-percent': {
      if (tolerance.percent.n < 0n) {
        throw new EngineInvariantError('tolerance percent must not be negative')
      }
      if (isZero(expected)) {
        return compare(submitted, expected) === 0
      }
      const allowed = divide(
        multiply(absolute(expected), tolerance.percent),
        fromInteger(100),
      )
      const difference = absolute(subtract(submitted, expected))
      return compare(difference, allowed) <= 0
    }
    case 'range':
      return (
        compare(submitted, tolerance.min) >= 0 &&
        compare(submitted, tolerance.max) <= 0
      )
    default:
      return assertNever(tolerance)
  }
}
