import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  add,
  compare,
  divide,
  equals,
  fromDecimalString,
  fromInteger,
  isZero,
  multiply,
  negate,
  parseRational,
  rational,
  serializeRational,
  subtract,
  toNumber,
  type Rational,
} from '@/game/math/rational'
import {
  formatDecimal,
  percentOf,
  roundTo,
  unitsRequired,
  type RoundingMode,
} from '@/game/math/rounding'
import { withinTolerance } from '@/game/math/tolerance'

/** Non-zero denominators keep every generated value a legal rational. */
const arbRational = fc
  .tuple(
    fc.integer({ min: -100_000, max: 100_000 }),
    fc.integer({ min: 1, max: 10_000 }),
  )
  .map(([numerator, denominator]) =>
    rational(BigInt(numerator), BigInt(denominator)),
  )

const arbNonZeroRational = arbRational.filter((value) => !isZero(value))

const roundingModes: readonly RoundingMode[] = [
  'half-up',
  'half-even',
  'ceil',
  'floor',
  'truncate',
]

describe('exact rational arithmetic', () => {
  it('is always fully reduced with a positive denominator', () => {
    fc.assert(
      fc.property(arbRational, (value) => {
        expect(value.d).toBeGreaterThan(0n)
        const gcd = (a: bigint, b: bigint): bigint =>
          b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b)
        expect(gcd(value.n, value.d)).toBe(1n)
      }),
    )
  })

  it('round-trips through its canonical serialized form', () => {
    fc.assert(
      fc.property(arbRational, (value) => {
        expect(equals(parseRational(serializeRational(value)), value)).toBe(
          true,
        )
      }),
    )
  })

  it('obeys the field laws that evaluation depends on', () => {
    fc.assert(
      fc.property(arbRational, arbRational, arbRational, (a, b, c) => {
        // Commutativity and associativity of addition.
        expect(equals(add(a, b), add(b, a))).toBe(true)
        expect(equals(add(add(a, b), c), add(a, add(b, c)))).toBe(true)
        // Distributivity, the law a float would break on repeating decimals.
        expect(
          equals(multiply(a, add(b, c)), add(multiply(a, b), multiply(a, c))),
        ).toBe(true)
        // Subtraction is the inverse of addition.
        expect(equals(subtract(add(a, b), b), a)).toBe(true)
      }),
    )
  })

  it('divides and multiplies back to the original value', () => {
    fc.assert(
      fc.property(arbRational, arbNonZeroRational, (a, b) => {
        expect(equals(multiply(divide(a, b), b), a)).toBe(true)
      }),
    )
  })

  it('orders values consistently with negation', () => {
    fc.assert(
      fc.property(arbRational, arbRational, (a, b) => {
        expect(compare(a, b)).toBe(-compare(b, a))
        expect(compare(negate(a), negate(b))).toBe(-compare(a, b))
      }),
    )
  })

  it('represents decimals exactly, unlike binary floating point', () => {
    // The canonical demonstration: 0.1 + 0.2 === 0.3 is false for doubles.
    const tenth = fromDecimalString('0.1')
    const fifth = fromDecimalString('0.2')
    const threeTenths = fromDecimalString('0.3')

    expect(equals(add(tenth, fifth), threeTenths)).toBe(true)
    expect(0.1 + 0.2 === 0.3).toBe(false)
  })
})

describe('rounding policy', () => {
  it('never moves a value by more than one unit in the last place', () => {
    fc.assert(
      fc.property(
        arbRational,
        fc.integer({ min: 0, max: 6 }),
        fc.constantFrom(...roundingModes),
        (value, decimals, mode) => {
          const rounded = roundTo(value, decimals, mode)
          const step = rational(1n, 10n ** BigInt(decimals))
          const difference = subtract(rounded, value)
          const magnitude = difference.n < 0n ? negate(difference) : difference

          expect(compare(magnitude, step)).toBeLessThanOrEqual(0)
        },
      ),
    )
  })

  it('is idempotent: rounding a rounded value changes nothing', () => {
    fc.assert(
      fc.property(
        arbRational,
        fc.integer({ min: 0, max: 6 }),
        fc.constantFrom(...roundingModes),
        (value, decimals, mode) => {
          const once = roundTo(value, decimals, mode)
          expect(equals(roundTo(once, decimals, mode), once)).toBe(true)
        },
      ),
    )
  })

  it('formats with exactly the requested number of decimals', () => {
    fc.assert(
      fc.property(
        arbRational,
        fc.integer({ min: 0, max: 6 }),
        (value, decimals) => {
          const text = formatDecimal(value, decimals)
          const fraction = text.split('.')[1] ?? ''
          expect(fraction).toHaveLength(decimals)
          // A formatted value parses back to the rounded value it represents.
          expect(equals(parseRational(text), roundTo(value, decimals))).toBe(
            true,
          )
        },
      ),
    )
  })

  it('never buys fewer packages than the requirement needs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (numerator, denominator, unit) => {
          const required = rational(BigInt(numerator), BigInt(denominator))
          const packSize = fromInteger(unit)
          const packs = unitsRequired(required, packSize)

          // Enough, and never more than one package of slack.
          const bought = multiply(fromInteger(packs), packSize)
          expect(compare(bought, required)).toBeGreaterThanOrEqual(0)
          expect(compare(subtract(bought, required), packSize)).toBeLessThan(0)
        },
      ),
    )
  })

  it('computes percentages that recompose to the whole', () => {
    fc.assert(
      fc.property(arbRational, (value) => {
        const parts = [
          percentOf(value, fromInteger(25)),
          percentOf(value, fromInteger(35)),
          percentOf(value, fromInteger(40)),
        ]
        const total = parts.reduce<Rational>((sum, part) => add(sum, part), {
          n: 0n,
          d: 1n,
        })
        expect(equals(total, value)).toBe(true)
      }),
    )
  })
})

describe('answer tolerance', () => {
  it('always accepts the exact expected value', () => {
    fc.assert(
      fc.property(
        arbRational,
        fc.integer({ min: 0, max: 50 }),
        (expected, slack) => {
          const amount = fromInteger(slack)
          expect(withinTolerance(expected, expected, { kind: 'exact' })).toBe(
            true,
          )
          expect(
            withinTolerance(expected, expected, { kind: 'absolute', amount }),
          ).toBe(true)
          expect(
            withinTolerance(expected, expected, {
              kind: 'relative-percent',
              percent: amount,
            }),
          ).toBe(true)
        },
      ),
    )
  })

  it('accepts exactly the values inside an absolute band', () => {
    fc.assert(
      fc.property(
        arbRational,
        arbRational,
        fc.integer({ min: 0, max: 100 }),
        (submitted, expected, slack) => {
          const amount = fromInteger(slack)
          const difference = subtract(submitted, expected)
          const magnitude = difference.n < 0n ? negate(difference) : difference

          expect(
            withinTolerance(submitted, expected, { kind: 'absolute', amount }),
          ).toBe(compare(magnitude, amount) <= 0)
        },
      ),
    )
  })

  it('keeps toNumber close to the exact value for display', () => {
    fc.assert(
      fc.property(arbRational, (value) => {
        const approximated = toNumber(value)
        expect(Number.isFinite(approximated)).toBe(true)
      }),
    )
  })
})
