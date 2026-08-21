import { describe, expect, it } from 'vitest'

import {
  assertCompatibleVersions,
  describeRejection,
  EngineInvariantError,
  ENGINE_VERSION,
  isErr,
  isOk,
  type EngineRejection,
} from '@/game'
import { isIdentifier, isSeed, toRunSeed } from '@/game/core/branded'
import { assertNever } from '@/game/core/exhaustive'
import { invariant } from '@/game/core/invariant'
import { err, mapOk, ok, unwrapOr } from '@/game/core/result'
import {
  clampDifficulty,
  isDifficultyLevel,
  MATH_CATEGORIES,
} from '@/game/challenges/taxonomy'
import {
  clamp01,
  efficiencyFromUsage,
  informationUseRatio,
  metrics,
  precisionFromDistance,
  qualityRank,
} from '@/game/challenges/evaluation'
import {
  divide,
  equals,
  fromDecimalString,
  fromInteger,
  greaterThan,
  greaterThanOrEqual,
  isInteger,
  isZero,
  lessThan,
  lessThanOrEqual,
  maximum,
  minimum,
  rational,
  sign,
  sum,
  ZERO,
} from '@/game/math/rational'
import {
  applyPercent,
  formatDecimal,
  roundTo,
  roundUpToMultiple,
  unitsRequired,
} from '@/game/math/rounding'
import { withinTolerance } from '@/game/math/tolerance'
import {
  evaluateCondition,
  validateCondition,
  type NarrativeContext,
  type StoryletCondition,
} from '@/game/narrative/conditions'
import { applyEffects, validateEffect } from '@/game/narrative/effects'
import {
  emptySelectionState,
  recordSelection,
  selectStorylet,
} from '@/game/narrative/selection'
import { initialStats } from '@/game/progression/stats'
import { createRng } from '@/game/random/rng'
import { toStoryletId } from '@/game'
import type { Storylet } from '@/game'

describe('result helpers', () => {
  it('distinguishes success from rejection and maps only the success channel', () => {
    const success = ok(2)
    const failure = err('nope')

    expect(isOk(success)).toBe(true)
    expect(isErr(success)).toBe(false)
    expect(isOk(failure)).toBe(false)
    expect(isErr(failure)).toBe(true)

    expect(mapOk(success, (value) => value * 3)).toEqual(ok(6))
    expect(mapOk(failure, () => 'unused')).toEqual(failure)

    expect(unwrapOr(success, 99)).toBe(2)
    expect(unwrapOr(failure, 99)).toBe(99)
  })
})

describe('invariants and exhaustiveness', () => {
  it('throws a typed error when an invariant is broken', () => {
    expect(() => {
      invariant(false, 'this cannot happen')
    }).toThrow(EngineInvariantError)
    expect(() => {
      invariant(true, 'fine')
    }).not.toThrow()
  })

  it('throws when an unhandled union member reaches assertNever', () => {
    expect(() => assertNever('surprise' as never)).toThrow(EngineInvariantError)
  })
})

describe('identifier parsing', () => {
  it('recognises valid identifiers and seeds', () => {
    expect(isIdentifier('dev.mural-coverage')).toBe(true)
    expect(isIdentifier('grade-7:0:x')).toBe(true)
    expect(isIdentifier('Uppercase')).toBe(false)
    expect(isIdentifier('')).toBe(false)

    expect(isSeed('Feria-2026_x')).toBe(true)
    expect(isSeed('')).toBe(false)
    // The RNG path encoder separates the seed from its path with U+0001 and
    // segments from each other with U+0000, and prefixes numeric segments with
    // '#'. None of those may appear in a seed or identifier, which is what
    // makes a path collision impossible. See tests/unit/rng-addressing.test.ts.
    expect(isSeed('Feria 2026')).toBe(false)
    expect(isSeed('Feria#2026')).toBe(false)
    expect(isIdentifier('has space')).toBe(false)
    expect(isIdentifier('has#hash')).toBe(false)
  })
})

describe('rejection descriptions', () => {
  const rejections: readonly EngineRejection[] = [
    { kind: 'invalid-command', detail: 'bad shape' },
    { kind: 'invalid-transition', phase: 'feedback', command: 'ANSWER' },
    { kind: 'unknown-challenge', challengeId: 'dev.nope' },
    { kind: 'stale-challenge-answer', expected: 'a', received: 'b' },
    { kind: 'challenge-already-answered', instanceId: 'a' },
    { kind: 'invalid-answer', detail: 'wrong kind' },
    { kind: 'unknown-information-key', key: 'sample' },
    { kind: 'tool-not-available', tool: 'ruler' },
    { kind: 'run-already-completed' },
    { kind: 'invalid-content', issues: ['one', 'two'] },
    { kind: 'invalid-ruleset', detail: 'no stages' },
    {
      kind: 'unsupported-version',
      field: 'rulesetVersion',
      expected: '1',
      received: '2',
    },
    { kind: 'corrupted-snapshot', detail: 'bad json' },
    { kind: 'action-log-sequence-gap', expected: 3, received: 5 },
    { kind: 'replay-mismatch', detail: 'diverged' },
  ]

  it.each(rejections)('describes $kind without throwing', (rejection) => {
    const description = describeRejection(rejection)
    expect(description.length).toBeGreaterThan(0)
    expect(description).not.toContain('undefined')
  })
})

describe('version compatibility', () => {
  const expected = {
    gameVersion: ENGINE_VERSION,
    rulesetVersion: '0.1.0-dev',
    contentVersion: '0.1.0-dev',
  }

  it('accepts an exact match', () => {
    expect(isOk(assertCompatibleVersions(expected, expected))).toBe(true)
  })

  it.each(['gameVersion', 'rulesetVersion', 'contentVersion'] as const)(
    'rejects a mismatched %s',
    (field) => {
      const result = assertCompatibleVersions(expected, {
        ...expected,
        [field]: 'different',
      })

      expect(isErr(result)).toBe(true)
      if (result.ok) return
      expect(result.error.kind).toBe('unsupported-version')
      if (result.error.kind !== 'unsupported-version') return
      expect(result.error.field).toBe(field)
    },
  )
})

describe('taxonomy helpers', () => {
  it('clamps difficulty into the 1..5 scale', () => {
    expect(clampDifficulty(-4)).toBe(1)
    expect(clampDifficulty(3.4)).toBe(3)
    expect(clampDifficulty(99)).toBe(5)
    expect(isDifficultyLevel(3)).toBe(true)
    expect(isDifficultyLevel(0)).toBe(false)
    expect(MATH_CATEGORIES).toHaveLength(8)
  })
})

describe('evaluation helpers', () => {
  it('clamps metrics and rejects non-finite values', () => {
    expect(clamp01(-3)).toBe(0)
    expect(clamp01(4)).toBe(1)
    expect(clamp01(0.5)).toBe(0.5)
    expect(() => clamp01(Number.NaN)).toThrow(EngineInvariantError)

    expect(metrics({})).toEqual({
      efficiency: 0,
      precision: 0,
      risk: 0,
      informationUse: 0,
    })
  })

  it('scores precision and efficiency against a target', () => {
    expect(precisionFromDistance(fromInteger(10), fromInteger(10))).toBe(1)
    expect(precisionFromDistance(fromInteger(0), fromInteger(10))).toBe(0)
    expect(precisionFromDistance(ZERO, ZERO)).toBe(1)
    expect(precisionFromDistance(fromInteger(5), ZERO)).toBe(0)

    expect(efficiencyFromUsage(fromInteger(2), fromInteger(2))).toBe(1)
    expect(efficiencyFromUsage(fromInteger(2), fromInteger(4))).toBe(0.5)
    expect(efficiencyFromUsage(fromInteger(2), ZERO)).toBe(0)
  })

  it('ranks qualities and information use', () => {
    expect(qualityRank('invalid')).toBe(0)
    expect(qualityRank('optimal')).toBe(3)
    expect(informationUseRatio(1, 2)).toBe(0.5)
    expect(informationUseRatio(3, 0)).toBe(0)
  })
})

describe('rational edge cases', () => {
  it('refuses impossible values', () => {
    expect(() => rational(1n, 0n)).toThrow(EngineInvariantError)
    expect(() => divide(fromInteger(1), ZERO)).toThrow(EngineInvariantError)
    expect(() => fromDecimalString('not-a-number')).toThrow(
      EngineInvariantError,
    )
    expect(() => fromInteger(1.5)).toThrow(EngineInvariantError)
  })

  it('normalises sign and provides ordering helpers', () => {
    const negative = rational(3n, -4n)
    expect(negative.d).toBe(4n)
    expect(negative.n).toBe(-3n)

    expect(sign(fromInteger(-2))).toBe(-1)
    expect(sign(ZERO)).toBe(0)
    expect(sign(fromInteger(2))).toBe(1)
    expect(isZero(ZERO)).toBe(true)
    expect(isInteger(fromInteger(4))).toBe(true)
    expect(isInteger(rational(1n, 2n))).toBe(false)

    const small = fromInteger(1)
    const large = fromInteger(9)
    expect(lessThan(small, large)).toBe(true)
    expect(lessThanOrEqual(small, small)).toBe(true)
    expect(greaterThan(large, small)).toBe(true)
    expect(greaterThanOrEqual(large, large)).toBe(true)
    expect(equals(minimum(small, large), small)).toBe(true)
    expect(equals(maximum(small, large), large)).toBe(true)
    expect(equals(sum([small, large, small]), fromInteger(11))).toBe(true)
    expect(equals(sum([]), ZERO)).toBe(true)
  })

  it('accepts signed decimal literals', () => {
    expect(equals(fromDecimalString('-0.25'), rational(-1n, 4n))).toBe(true)
    expect(equals(fromDecimalString('+2'), fromInteger(2))).toBe(true)
  })
})

describe('rounding edge cases', () => {
  it('applies each mode at a tie', () => {
    const half = rational(5n, 2n)
    expect(formatDecimal(roundTo(half, 0, 'half-up'), 0)).toBe('3')
    expect(formatDecimal(roundTo(half, 0, 'half-even'), 0)).toBe('2')
    expect(formatDecimal(roundTo(half, 0, 'ceil'), 0)).toBe('3')
    expect(formatDecimal(roundTo(half, 0, 'floor'), 0)).toBe('2')
    expect(formatDecimal(roundTo(half, 0, 'truncate'), 0)).toBe('2')

    const threeHalves = rational(3n, 2n)
    expect(formatDecimal(roundTo(threeHalves, 0, 'half-even'), 0)).toBe('2')
  })

  it('rounds negative values away from zero for half-up', () => {
    const value = rational(-5n, 2n)
    expect(formatDecimal(roundTo(value, 0, 'half-up'), 0)).toBe('-3')
    expect(formatDecimal(roundTo(value, 0, 'ceil'), 0)).toBe('-2')
    expect(formatDecimal(roundTo(value, 0, 'floor'), 0)).toBe('-3')
    expect(formatDecimal(roundTo(value, 0, 'truncate'), 0)).toBe('-2')
  })

  it('rejects unsupported precision and non-positive purchase units', () => {
    expect(() => roundTo(fromInteger(1), -1)).toThrow(EngineInvariantError)
    expect(() => roundTo(fromInteger(1), 99)).toThrow(EngineInvariantError)
    expect(() => roundUpToMultiple(fromInteger(1), ZERO)).toThrow(
      EngineInvariantError,
    )
    expect(() => unitsRequired(fromInteger(1), ZERO)).toThrow(
      EngineInvariantError,
    )
  })

  it('buys nothing when nothing is required', () => {
    expect(unitsRequired(ZERO, fromInteger(2))).toBe(0n)
    expect(unitsRequired(fromInteger(-5), fromInteger(2))).toBe(0n)
  })

  it('rounds a purchase up to whole units', () => {
    // 1.8 litres of paint with 1 litre tins means two tins, not 1.8.
    const required = fromDecimalString('1.8')
    expect(formatDecimal(roundUpToMultiple(required, fromInteger(1)), 0)).toBe(
      '2',
    )
  })

  it('applies percentage increases exactly', () => {
    expect(
      formatDecimal(applyPercent(fromInteger(200), fromInteger(25)), 2),
    ).toBe('250.00')
    expect(
      formatDecimal(applyPercent(fromInteger(200), fromInteger(-10)), 2),
    ).toBe('180.00')
  })
})

describe('tolerance edge cases', () => {
  it('supports an explicit range', () => {
    const tolerance = {
      kind: 'range' as const,
      min: fromInteger(10),
      max: fromInteger(20),
    }
    expect(withinTolerance(fromInteger(10), ZERO, tolerance)).toBe(true)
    expect(withinTolerance(fromInteger(20), ZERO, tolerance)).toBe(true)
    expect(withinTolerance(fromInteger(9), ZERO, tolerance)).toBe(false)
  })

  it('falls back to equality when the expected value is zero', () => {
    const tolerance = {
      kind: 'relative-percent' as const,
      percent: fromInteger(50),
    }
    expect(withinTolerance(ZERO, ZERO, tolerance)).toBe(true)
    expect(withinTolerance(fromInteger(1), ZERO, tolerance)).toBe(false)
  })

  it('refuses a negative tolerance instead of silently accepting everything', () => {
    expect(() =>
      withinTolerance(fromInteger(1), fromInteger(1), {
        kind: 'absolute',
        amount: fromInteger(-1),
      }),
    ).toThrow(EngineInvariantError)
    expect(() =>
      withinTolerance(fromInteger(1), fromInteger(1), {
        kind: 'relative-percent',
        percent: fromInteger(-1),
      }),
    ).toThrow(EngineInvariantError)
  })
})

describe('storylet conditions', () => {
  const context: NarrativeContext = {
    stage: 'year-2',
    eventIndex: 5,
    stats: { ...initialStats(), knowledge: 70, energy: 20 },
    flags: { 'mural.optimal': true, attempts: 3 },
    seenStorylets: [toStoryletId('dev.mural')],
    qualityHistory: ['functional', 'optimal', 'efficient', 'invalid'],
  }

  const cases: readonly [string, StoryletCondition, boolean][] = [
    ['always', { kind: 'always' }, true],
    ['matching stage', { kind: 'stage-in', stages: ['year-2'] }, true],
    ['other stage', { kind: 'stage-in', stages: ['year-4'] }, false],
    [
      'stat at least',
      { kind: 'stat-at-least', stat: 'knowledge', value: 70 },
      true,
    ],
    [
      'stat at least, unmet',
      { kind: 'stat-at-least', stat: 'knowledge', value: 71 },
      false,
    ],
    ['stat at most', { kind: 'stat-at-most', stat: 'energy', value: 20 }, true],
    [
      'stat at most, unmet',
      { kind: 'stat-at-most', stat: 'energy', value: 19 },
      false,
    ],
    ['flag set', { kind: 'flag-set', flag: 'mural.optimal' }, true],
    ['flag not set', { kind: 'flag-not-set', flag: 'absent' }, true],
    ['flag equals', { kind: 'flag-equals', flag: 'attempts', value: 3 }, true],
    [
      'flag equals, wrong value',
      { kind: 'flag-equals', flag: 'attempts', value: 4 },
      false,
    ],
    [
      'storylet seen',
      { kind: 'storylet-seen', storyletId: toStoryletId('dev.mural') },
      true,
    ],
    [
      'storylet not seen',
      { kind: 'storylet-not-seen', storyletId: toStoryletId('dev.trip') },
      true,
    ],
    [
      'recent quality met',
      {
        kind: 'recent-quality-at-least',
        quality: 'efficient',
        withinLast: 4,
        count: 2,
      },
      true,
    ],
    [
      'recent quality unmet',
      {
        kind: 'recent-quality-at-least',
        quality: 'optimal',
        withinLast: 2,
        count: 2,
      },
      false,
    ],
    [
      'recent quality over the whole history',
      {
        kind: 'recent-quality-at-least',
        quality: 'functional',
        withinLast: 0,
        count: 3,
      },
      true,
    ],
    [
      'all',
      {
        kind: 'all',
        conditions: [
          { kind: 'always' },
          { kind: 'flag-set', flag: 'mural.optimal' },
        ],
      },
      true,
    ],
    [
      'all, one failing',
      {
        kind: 'all',
        conditions: [{ kind: 'always' }, { kind: 'flag-set', flag: 'absent' }],
      },
      false,
    ],
    [
      'any',
      {
        kind: 'any',
        conditions: [{ kind: 'flag-set', flag: 'absent' }, { kind: 'always' }],
      },
      true,
    ],
    [
      'not',
      { kind: 'not', condition: { kind: 'flag-set', flag: 'absent' } },
      true,
    ],
  ]

  it.each(cases)('evaluates %s', (_label, condition, expected) => {
    expect(evaluateCondition(condition, context)).toBe(expected)
  })

  it.each([
    [
      'an empty stage list',
      { kind: 'stage-in', stages: [] } as StoryletCondition,
    ],
    ['an empty all', { kind: 'all', conditions: [] } as StoryletCondition],
    ['an empty any', { kind: 'any', conditions: [] } as StoryletCondition],
    [
      'a non-positive count',
      {
        kind: 'recent-quality-at-least',
        quality: 'optimal',
        withinLast: 3,
        count: 0,
      } as StoryletCondition,
    ],
    [
      'a nested empty branch',
      {
        kind: 'not',
        condition: { kind: 'all', conditions: [] },
      } as StoryletCondition,
    ],
  ])('reports %s as invalid content', (_label, condition) => {
    expect(validateCondition(condition).length).toBeGreaterThan(0)
  })

  it('accepts well-formed conditions', () => {
    expect(validateCondition({ kind: 'always' })).toEqual([])
    expect(
      validateCondition({ kind: 'stat-at-least', stat: 'team', value: 10 }),
    ).toEqual([])
  })
})

describe('storylet effects', () => {
  it('applies and removes flags without mutating the input', () => {
    const before = { stats: initialStats(), flags: { keep: true, drop: 1 } }
    const after = applyEffects(before, [
      { kind: 'stat-add', stat: 'team', delta: 5 },
      { kind: 'flag-set', flag: 'added', value: 'yes' },
      { kind: 'flag-clear', flag: 'drop' },
      { kind: 'flag-clear', flag: 'never-existed' },
    ])

    expect(after.stats.team).toBe(55)
    expect(after.flags).toEqual({ keep: true, added: 'yes' })
    // The input is untouched.
    expect(before.flags).toEqual({ keep: true, drop: 1 })
    expect(before.stats.team).toBe(50)
  })

  it('rejects oversized stat deltas and empty flag names', () => {
    expect(
      validateEffect({ kind: 'stat-add', stat: 'team', delta: 40 }).length,
    ).toBeGreaterThan(0)
    expect(
      validateEffect({ kind: 'stat-add', stat: 'team', delta: Number.NaN })
        .length,
    ).toBeGreaterThan(0)
    expect(
      validateEffect({ kind: 'flag-set', flag: '', value: 1 }).length,
    ).toBe(1)
    expect(validateEffect({ kind: 'flag-clear', flag: '' }).length).toBe(1)
    expect(
      validateEffect({ kind: 'stat-add', stat: 'team', delta: 3 }),
    ).toEqual([])
  })
})

describe('storylet selection edge cases', () => {
  const base: Storylet = {
    id: toStoryletId('test.one'),
    kind: 'one-shot',
    stages: ['year-1'],
    weight: 10,
    priority: 0,
    requires: { kind: 'always' },
    tags: [],
    title: 'Uno',
    text: 'Texto',
    challengePool: [],
    effects: [],
    followUps: [],
  }

  const context: NarrativeContext = {
    stage: 'year-1',
    eventIndex: 3,
    stats: initialStats(),
    flags: {},
    seenStorylets: [],
    qualityHistory: [],
  }

  const rng = () => createRng(toRunSeed('selection'))

  it('reports an empty pool instead of throwing', () => {
    const outcome = selectStorylet(
      [],
      context,
      emptySelectionState(),
      { cooldownEvents: 0, allowRepeats: true },
      rng(),
    )
    expect(outcome.kind).toBe('empty-pool')
  })

  it('excludes a zero-weight storylet', () => {
    const outcome = selectStorylet(
      [{ ...base, weight: 0 }],
      context,
      emptySelectionState(),
      { cooldownEvents: 0, allowRepeats: true },
      rng(),
    )
    expect(outcome.kind).toBe('empty-pool')
  })

  it('excludes a storylet already seen when repeats are disabled', () => {
    const state = recordSelection(emptySelectionState(), base.id, 0)
    const outcome = selectStorylet(
      [base],
      context,
      state,
      { cooldownEvents: 0, allowRepeats: false },
      rng(),
    )
    expect(outcome.kind).toBe('empty-pool')
  })

  it('honours the cooldown window when repeats are allowed', () => {
    const state = recordSelection(emptySelectionState(), base.id, 2)
    const options = { cooldownEvents: 4, allowRepeats: true }

    // Only one event has passed, so the storylet is still cooling down.
    expect(selectStorylet([base], context, state, options, rng()).kind).toBe(
      'empty-pool',
    )

    // Far enough away, it becomes eligible again.
    const later = { ...context, eventIndex: 10 }
    expect(selectStorylet([base], later, state, options, rng()).kind).toBe(
      'selected',
    )
  })

  it('prefers the highest priority tier', () => {
    const low = { ...base, id: toStoryletId('test.low'), priority: 0 }
    const high = { ...base, id: toStoryletId('test.high'), priority: 9 }

    const outcome = selectStorylet(
      [low, high],
      context,
      emptySelectionState(),
      { cooldownEvents: 0, allowRepeats: true },
      rng(),
    )

    expect(outcome.kind).toBe('selected')
    if (outcome.kind !== 'selected') return
    expect(outcome.storylet.id).toBe(high.id)
  })
})
