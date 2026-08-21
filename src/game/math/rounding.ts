/**
 * Rounding policy.
 *
 * The math framework requires every challenge to declare its internal
 * precision, its display rounding rule and its input tolerance. Those are three
 * different decisions and this module keeps them separate:
 *
 * - {@link roundTo} produces the value a player is shown.
 * - {@link roundUpToMultiple} models real purchase units (you cannot buy 1.8
 *   tins of paint).
 * - `../math/tolerance` decides whether a submitted answer counts as correct.
 *
 * Evaluation never rounds implicitly. A rounded value only enters a comparison
 * when the challenge says the rounding is part of the question.
 */

import { assertNever } from '../core/exhaustive'
import { EngineInvariantError } from '../core/invariant'
import {
  add,
  compare,
  divide,
  fromInteger,
  multiply,
  rational,
  subtract,
  ZERO,
  type Rational,
} from './rational'

export type RoundingMode =
  'half-up' | 'half-even' | 'ceil' | 'floor' | 'truncate'

/** Integer part and remainder of `value`, with the remainder keeping the sign. */
function splitInteger(value: Rational): {
  readonly whole: bigint
  readonly remainder: Rational
} {
  const whole = value.n / value.d
  const remainder = subtract(value, fromInteger(whole))
  return { whole, remainder }
}

function roundToInteger(value: Rational, mode: RoundingMode): bigint {
  const { whole, remainder } = splitInteger(value)

  if (remainder.n === 0n) {
    return whole
  }

  const negative = remainder.n < 0n
  const magnitude = negative ? { n: -remainder.n, d: remainder.d } : remainder
  const half = rational(1n, 2n)
  const againstHalf = compare(magnitude, half)

  switch (mode) {
    case 'truncate':
      return whole
    case 'ceil':
      return negative ? whole : whole + 1n
    case 'floor':
      return negative ? whole - 1n : whole
    case 'half-up': {
      if (againstHalf < 0) {
        return whole
      }
      return negative ? whole - 1n : whole + 1n
    }
    case 'half-even': {
      if (againstHalf < 0) {
        return whole
      }
      if (againstHalf > 0) {
        return negative ? whole - 1n : whole + 1n
      }
      const candidate = negative ? whole - 1n : whole + 1n
      return whole % 2n === 0n ? whole : candidate
    }
    default:
      return assertNever(mode)
  }
}

/**
 * Rounds to a fixed number of decimal places, exactly.
 *
 * The result is still a rational, so a rounded display value can be compared or
 * combined without ever becoming a float.
 */
export function roundTo(
  value: Rational,
  decimals: number,
  mode: RoundingMode = 'half-up',
): Rational {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 12) {
    throw new EngineInvariantError(
      `unsupported decimal precision: ${String(decimals)}`,
    )
  }

  const scale = 10n ** BigInt(decimals)
  const scaled = multiply(value, fromInteger(scale))
  const rounded = roundToInteger(scaled, mode)

  return rational(rounded, scale)
}

/**
 * Smallest multiple of `unit` that is greater than or equal to `value`.
 *
 * This is the purchase rule behind scenarios such as the mural: 1.8 litres of
 * required paint with a 1 litre tin means two tins, not 1.8.
 */
export function roundUpToMultiple(value: Rational, unit: Rational): Rational {
  if (unit.n <= 0n) {
    throw new EngineInvariantError('purchase unit must be positive')
  }

  const quotient = divide(value, unit)
  const units = roundToInteger(quotient, 'ceil')

  return multiply(fromInteger(units), unit)
}

/** Number of whole `unit` packages needed to cover `value`. */
export function unitsRequired(value: Rational, unit: Rational): bigint {
  if (unit.n <= 0n) {
    throw new EngineInvariantError('purchase unit must be positive')
  }

  if (compare(value, ZERO) <= 0) {
    return 0n
  }

  return roundToInteger(divide(value, unit), 'ceil')
}

/**
 * Formats a rational for display with a fixed number of decimals.
 *
 * Presentation only. The engine passes the formatted string to the UI; it never
 * reads one back for evaluation.
 */
export function formatDecimal(
  value: Rational,
  decimals: number,
  mode: RoundingMode = 'half-up',
): string {
  const rounded = roundTo(value, decimals, mode)
  const scale = 10n ** BigInt(decimals)
  const scaled = multiply(rounded, fromInteger(scale))
  const asInteger = scaled.n / scaled.d
  const negative = asInteger < 0n
  const magnitude = negative ? -asInteger : asInteger
  const whole = magnitude / scale
  const fraction = magnitude % scale
  const sign = negative ? '-' : ''

  if (decimals === 0) {
    return `${sign}${whole.toString()}`
  }

  return `${sign}${whole.toString()}.${fraction.toString().padStart(decimals, '0')}`
}

/** Convenience for percentage arithmetic: `value` increased by `percent`%. */
export function applyPercent(value: Rational, percent: Rational): Rational {
  const factor = add(fromInteger(1), divide(percent, fromInteger(100)))
  return multiply(value, factor)
}

/** `percent`% of `value`. */
export function percentOf(value: Rational, percent: Rational): Rational {
  return divide(multiply(value, percent), fromInteger(100))
}
