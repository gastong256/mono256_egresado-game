/**
 * Quantities and units.
 *
 * The content rules forbid publishing a challenge whose units are ambiguous, so
 * numbers that reach an evaluator carry the unit they were measured in. Money is
 * represented in minor units (centavos) as an integer count so currency never
 * needs a decimal at all.
 */

import { EngineInvariantError } from '../core/invariant'
import { formatDecimal, roundTo, type RoundingMode } from './rounding'
import {
  add,
  compare,
  divide,
  fromInteger,
  multiply,
  serializeRational,
  subtract,
  type Rational,
} from './rational'

/** Units the documented challenge families need today. */
export type Unit =
  | 'currency-minor'
  | 'metre'
  | 'square-metre'
  | 'litre'
  | 'minute'
  | 'hour'
  | 'kilometre'
  | 'megabyte'
  | 'gigabyte'
  | 'person'
  | 'unit'
  | 'percent'
  | 'ratio'

export interface Quantity {
  readonly amount: Rational
  readonly unit: Unit
}

export interface SerializedQuantity {
  readonly amount: string
  readonly unit: Unit
}

export function quantity(amount: Rational, unit: Unit): Quantity {
  return { amount, unit }
}

export function serializeQuantity(value: Quantity): SerializedQuantity {
  return { amount: serializeRational(value.amount), unit: value.unit }
}

function assertSameUnit(left: Quantity, right: Quantity): void {
  if (left.unit !== right.unit) {
    throw new EngineInvariantError(
      `cannot combine ${left.unit} with ${right.unit}`,
    )
  }
}

export function addQuantities(left: Quantity, right: Quantity): Quantity {
  assertSameUnit(left, right)
  return quantity(add(left.amount, right.amount), left.unit)
}

export function subtractQuantities(left: Quantity, right: Quantity): Quantity {
  assertSameUnit(left, right)
  return quantity(subtract(left.amount, right.amount), left.unit)
}

export function scaleQuantity(value: Quantity, factor: Rational): Quantity {
  return quantity(multiply(value.amount, factor), value.unit)
}

export function compareQuantities(left: Quantity, right: Quantity): -1 | 0 | 1 {
  assertSameUnit(left, right)
  return compare(left.amount, right.amount)
}

/**
 * Area of a rectangle in square metres.
 *
 * Both sides must be metres; the result changes unit, which is why the
 * multiplication is not expressed with {@link scaleQuantity}.
 */
export function rectangleArea(width: Quantity, height: Quantity): Quantity {
  if (width.unit !== 'metre' || height.unit !== 'metre') {
    throw new EngineInvariantError('rectangle sides must be measured in metres')
  }

  return quantity(multiply(width.amount, height.amount), 'square-metre')
}

/** Divides two quantities into a dimensionless ratio. */
export function ratioOf(left: Quantity, right: Quantity): Rational {
  assertSameUnit(left, right)
  return divide(left.amount, right.amount)
}

/** Money helpers. Amounts are whole centavos; no currency value uses decimals. */
export function money(minorUnits: number | bigint): Quantity {
  return quantity(fromInteger(minorUnits), 'currency-minor')
}

/** Formats currency minor units as a major-unit decimal string. */
export function formatMoney(value: Quantity): string {
  if (value.unit !== 'currency-minor') {
    throw new EngineInvariantError('formatMoney expects currency minor units')
  }

  return formatDecimal(divide(value.amount, fromInteger(100)), 2)
}

/** Display helper honouring an explicit rounding decision. */
export function formatQuantity(
  value: Quantity,
  decimals: number,
  mode: RoundingMode = 'half-up',
): string {
  if (value.unit === 'currency-minor') {
    return formatMoney(value)
  }

  return formatDecimal(roundTo(value.amount, decimals, mode), decimals, mode)
}

/** Converts hours to minutes, the canonical internal time unit. */
export function toMinutes(value: Quantity): Quantity {
  switch (value.unit) {
    case 'minute':
      return value
    case 'hour':
      return quantity(multiply(value.amount, fromInteger(60)), 'minute')
    default:
      throw new EngineInvariantError(`cannot convert ${value.unit} to minutes`)
  }
}
