/**
 * Exact rational arithmetic.
 *
 * Egresado evaluates school mathematics, so an evaluator must never decide that
 * a correct answer is wrong because of binary floating point. Every documented
 * domain — money, percentages, proportions, rates, areas, time — is exactly
 * representable as a ratio of integers, so the engine computes on rationals and
 * rounds only where the challenge declares a rounding rule.
 *
 * `Rational` holds `bigint` fields and is therefore deliberately **not** JSON
 * serializable. It is an internal computation type: persisted state stores the
 * canonical string produced by {@link serializeRational}.
 *
 * Invariants held by every value produced here: the denominator is positive and
 * the fraction is fully reduced, so structural equality matches mathematical
 * equality.
 */

import { EngineInvariantError, invariant } from '../core/invariant'

export interface Rational {
  readonly n: bigint
  readonly d: bigint
}

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/u
const FRACTION_PATTERN = /^([+-]?\d+)\/(\d+)$/u

function gcd(a: bigint, b: bigint): bigint {
  let left = a < 0n ? -a : a
  let right = b < 0n ? -b : b

  while (right !== 0n) {
    const next = left % right
    left = right
    right = next
  }

  return left
}

/** Builds a reduced rational with a positive denominator. */
export function rational(numerator: bigint, denominator: bigint): Rational {
  if (denominator === 0n) {
    throw new EngineInvariantError('rational denominator must not be zero')
  }

  const sign = denominator < 0n ? -1n : 1n
  const n = numerator * sign
  const d = denominator * sign
  const divisor = gcd(n, d)

  if (divisor === 0n) {
    return { n: 0n, d: 1n }
  }

  return { n: n / divisor, d: d / divisor }
}

export const ZERO: Rational = { n: 0n, d: 1n }

export function fromInteger(value: number | bigint): Rational {
  if (typeof value === 'number') {
    invariant(
      Number.isSafeInteger(value),
      `expected a safe integer, received ${String(value)}`,
    )
    return { n: BigInt(value), d: 1n }
  }

  return { n: value, d: 1n }
}

/**
 * Parses an exact decimal literal such as `"14.4"` or `"-0.075"`.
 *
 * Content and test data declare decimals as strings precisely so no value ever
 * passes through a binary float on its way into the engine.
 */
export function fromDecimalString(value: string): Rational {
  const match = DECIMAL_PATTERN.exec(value)

  if (!match) {
    throw new EngineInvariantError(`invalid decimal literal: ${value}`)
  }

  const [, sign = '', whole = '0', fraction = ''] = match
  const scale = 10n ** BigInt(fraction.length)
  const digits = BigInt(`${whole}${fraction}`)

  return rational(sign === '-' ? -digits : digits, scale)
}

/** Parses the canonical `"n/d"` form produced by {@link serializeRational}. */
export function parseRational(value: string): Rational {
  const fractionMatch = FRACTION_PATTERN.exec(value)

  if (fractionMatch) {
    const [, numerator = '0', denominator = '1'] = fractionMatch
    return rational(BigInt(numerator), BigInt(denominator))
  }

  return fromDecimalString(value)
}

/** Canonical, stable, JSON-safe representation used by persisted state. */
export function serializeRational(value: Rational): string {
  return `${value.n.toString()}/${value.d.toString()}`
}

export function add(left: Rational, right: Rational): Rational {
  return rational(left.n * right.d + right.n * left.d, left.d * right.d)
}

export function subtract(left: Rational, right: Rational): Rational {
  return rational(left.n * right.d - right.n * left.d, left.d * right.d)
}

export function multiply(left: Rational, right: Rational): Rational {
  return rational(left.n * right.n, left.d * right.d)
}

export function divide(left: Rational, right: Rational): Rational {
  if (right.n === 0n) {
    throw new EngineInvariantError('division by zero')
  }

  return rational(left.n * right.d, left.d * right.n)
}

export function negate(value: Rational): Rational {
  return { n: -value.n, d: value.d }
}

export function absolute(value: Rational): Rational {
  return value.n < 0n ? negate(value) : value
}

/** Returns -1, 0 or 1 for `left` against `right`. */
export function compare(left: Rational, right: Rational): -1 | 0 | 1 {
  const difference = left.n * right.d - right.n * left.d

  if (difference === 0n) {
    return 0
  }

  return difference < 0n ? -1 : 1
}

export function equals(left: Rational, right: Rational): boolean {
  return left.n === right.n && left.d === right.d
}

export function lessThan(left: Rational, right: Rational): boolean {
  return compare(left, right) < 0
}

export function lessThanOrEqual(left: Rational, right: Rational): boolean {
  return compare(left, right) <= 0
}

export function greaterThan(left: Rational, right: Rational): boolean {
  return compare(left, right) > 0
}

export function greaterThanOrEqual(left: Rational, right: Rational): boolean {
  return compare(left, right) >= 0
}

export function isZero(value: Rational): boolean {
  return value.n === 0n
}

export function sign(value: Rational): -1 | 0 | 1 {
  if (value.n === 0n) {
    return 0
  }

  return value.n < 0n ? -1 : 1
}

export function minimum(left: Rational, right: Rational): Rational {
  return compare(left, right) <= 0 ? left : right
}

export function maximum(left: Rational, right: Rational): Rational {
  return compare(left, right) >= 0 ? left : right
}

export function sum(values: readonly Rational[]): Rational {
  return values.reduce<Rational>((total, value) => add(total, value), ZERO)
}

/** Fixed precision used to recover a ratio whose terms exceed the double range. */
const FRACTION_SCALE = 10n ** 15n

/**
 * Converts to a JavaScript number.
 *
 * Only for presentation and for coarse telemetry. Never use the result to make
 * an authoritative comparison; compare rationals instead.
 *
 * The direct conversion is kept wherever it is well defined, because it is what
 * the engine has always produced and changing it would move deterministic
 * output. It breaks down in exactly one case: when numerator *and* denominator
 * both exceed the double range, `Number()` turns both into `Infinity` and the
 * ratio comes out as `NaN`. A non-finite metric is treated as a broken
 * invariant further up, so that case would surface as an engine crash rather
 * than a number. The fallback recovers the ratio by dividing on bigints.
 */
export function toNumber(value: Rational): number {
  const direct = Number(value.n) / Number(value.d)

  if (!Number.isNaN(direct)) {
    return direct
  }

  const negative = value.n < 0n
  const numerator = negative ? -value.n : value.n
  const whole = numerator / value.d
  const remainder = numerator - whole * value.d
  const fraction =
    Number((remainder * FRACTION_SCALE) / value.d) / Number(FRACTION_SCALE)
  // A genuinely enormous quotient still saturates, which is the honest answer.
  const magnitude = Number(whole) + fraction

  return negative ? -magnitude : magnitude
}

/** True when the value denotes a whole number. */
export function isInteger(value: Rational): boolean {
  return value.d === 1n
}
