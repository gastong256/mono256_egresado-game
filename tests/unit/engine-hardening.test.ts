import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  createRun,
  isErr,
  isOk,
  parseActionLog,
  parseCommand,
  restoreSnapshot,
  runStateIssues,
  serializeActionLog,
  serializeSnapshot,
} from '@/game'
import {
  createDevelopmentDependencies,
  developmentRunDescriptor,
  simulateRun,
} from '@/game/testing'
import { rational, toNumber } from '@/game/math/rational'
import { clamp01 } from '@/game/challenges/evaluation'

/**
 * Regression tests for the 2026-08-21 engine audit.
 *
 * Each block corresponds to a finding in
 * `docs/audits/game-engine-2026-08-21/findings.md`.
 */

const dependencies = createDevelopmentDependencies()
const descriptor = developmentRunDescriptor('hardening', dependencies)
const versions = {
  gameVersion: descriptor.gameVersion,
  rulesetVersion: descriptor.rulesetVersion,
  contentVersion: descriptor.contentVersion,
}

/** A snapshot of a run that has only just opened, so an event is active. */
function openSnapshot(): unknown {
  const created = createRun(
    developmentRunDescriptor('hardening-open', dependencies),
    dependencies,
  )
  if (!created.ok) throw new Error('run creation failed')
  return JSON.parse(JSON.stringify(serializeSnapshot(created.value.state)))
}

function playedSnapshot(): Record<string, never> {
  const played = simulateRun(
    developmentRunDescriptor('hardening-snap', dependencies),
    dependencies,
  )
  if (!played.ok) throw new Error('simulation failed')
  return JSON.parse(
    JSON.stringify(serializeSnapshot(played.value.state)),
  ) as Record<string, never>
}

describe('ENG-MATH-001 · toNumber never yields a non-finite value', () => {
  it('recovers a ratio whose terms both exceed the double range', () => {
    // Number(10n ** 400n) is Infinity, so the naive form produced NaN, which
    // reached clamp01 and was reported as a broken engine invariant.
    const enormous = rational(10n ** 400n, 3n * 10n ** 400n + 1n)

    expect(Number.isNaN(toNumber(enormous))).toBe(false)
    expect(toNumber(enormous)).toBeCloseTo(1 / 3, 12)
    expect(() => clamp01(toNumber(enormous))).not.toThrow()
  })

  it('keeps the direct conversion wherever it was already well defined', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (numerator, denominator) => {
          const value = rational(BigInt(numerator), BigInt(denominator))
          // Deterministic output depends on this staying identical.
          expect(toNumber(value)).toBe(Number(value.n) / Number(value.d))
        },
      ),
    )
  })

  it('stays finite across extreme magnitudes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 400 }),
        fc.integer({ min: 1, max: 400 }),
        fc.boolean(),
        (numeratorScale, denominatorScale, negative) => {
          const numerator = 10n ** BigInt(numeratorScale)
          const value = rational(
            negative ? -numerator : numerator,
            10n ** BigInt(denominatorScale),
          )
          const converted = toNumber(value)

          expect(Number.isNaN(converted)).toBe(false)
          // Infinity is still legitimate when the value genuinely exceeds the
          // double range; NaN never is.
          if (numeratorScale - denominatorScale < 300) {
            expect(Number.isFinite(converted)).toBe(true)
          }
        },
      ),
    )
  })
})

describe('ENG-SEC-001 · identifier charset enforced at trust boundaries', () => {
  const hostile = [
    ['a space', 'seed with space'],
    ['the path separator', 'a\u0001b'],
    ['the segment separator', 'a\u0000b'],
    ['an emoji', 'seed\u{1F642}'],
    ['an empty value', ''],
    ['an overlong value', 'x'.repeat(200)],
  ] as const

  it.each(hostile)('the action log rejects a seed with %s', (_label, seed) => {
    const result = parseActionLog({
      version: 1,
      descriptor: { ...descriptor, seed },
      actions: [],
    })

    expect(isErr(result)).toBe(true)
  })

  it.each(hostile)(
    'a command rejects an instance id with %s',
    (_label, instanceId) => {
      const result = parseCommand({
        type: 'ANSWER',
        instanceId,
        answer: { kind: 'decision-card', optionId: 'a' },
      })

      expect(isErr(result)).toBe(true)
    },
  )

  it('still accepts the identifiers the system produces', () => {
    for (const seed of ['e2e-alpha', 'Feria-2026', 'sim-0', 'dev.run:1']) {
      expect(
        isOk(
          parseActionLog({
            version: 1,
            descriptor: { ...descriptor, seed },
            actions: [],
          }),
        ),
      ).toBe(true)
    }
  })

  it('rejects a hostile seed inside a restored snapshot', () => {
    const snapshot = playedSnapshot() as Record<string, Record<string, never>>
    const state = snapshot['state'] as unknown as Record<string, unknown>
    state['descriptor'] = {
      ...(state['descriptor'] as Record<string, unknown>),
      seed: 'a\u0001b',
    }

    const result = restoreSnapshot(snapshot, versions)
    expect(isErr(result)).toBe(true)
  })
})

describe('ENG-STATE-001 · impossible states are refused on restore', () => {
  const mutations: readonly [
    string,
    'open' | 'played',
    (state: Record<string, unknown>) => void,
  ][] = [
    [
      'a challenge phase with no challenge',
      'open',
      (state) => {
        state['phase'] = 'challenge'
        const active = state['activeEvent'] as Record<string, unknown>
        active['challenge'] = null
      },
    ],
    [
      'a challenge phase with no active event',
      'open',
      (state) => {
        state['phase'] = 'challenge'
        state['activeEvent'] = null
      },
    ],
    [
      'a narrative phase with no active event',
      'open',
      (state) => {
        state['phase'] = 'narrative'
        state['activeEvent'] = null
      },
    ],
    [
      'a feedback phase with no pending feedback',
      'open',
      (state) => {
        state['phase'] = 'feedback'
        state['pendingFeedback'] = null
      },
    ],
    [
      'a narrative phase carrying a completion result',
      'open',
      (state) => {
        state['completion'] = {
          totalScore: 10,
          profile: { profileId: 'balanced', evidence: [], runnerUpId: null },
          stats: { knowledge: 1, team: 1, initiative: 1, energy: 1 },
          eventsPlayed: 1,
        }
      },
    ],
    [
      'a completed run with no result',
      'played',
      (state) => {
        state['completion'] = null
      },
    ],
    [
      'a score that does not match the points awarded',
      'played',
      (state) => {
        state['scorePreview'] = 999_999
      },
    ],
    [
      'a history whose sequence numbers are shuffled',
      'played',
      (state) => {
        const history = state['history'] as { sequence: number }[]
        const first = history[0]
        if (first !== undefined) {
          history[0] = { ...first, sequence: 5 }
        }
      },
    ],
  ]

  it.each(mutations)('refuses %s', (_label, source, mutate) => {
    const snapshot = (
      source === 'open' ? openSnapshot() : playedSnapshot()
    ) as {
      state: Record<string, unknown>
    }
    mutate(snapshot.state)

    const result = restoreSnapshot(snapshot, versions)
    expect(isErr(result)).toBe(true)
    if (result.ok) return
    expect(['corrupted-snapshot', 'unsupported-version']).toContain(
      result.error.kind,
    )
  })

  it('still restores a legitimate snapshot untouched', () => {
    expect(isOk(restoreSnapshot(playedSnapshot(), versions))).toBe(true)
  })

  it('holds for every state a real run passes through', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 12, unit: 'grapheme-ascii' })
          .map((value) => value.replace(/[^a-z0-9-]/gu, 'x'))
          .filter((value) => value.length > 0),
        (seed) => {
          const played = simulateRun(
            developmentRunDescriptor(seed, dependencies),
            dependencies,
          )
          if (!played.ok) return
          // Reachable states must never trip the invariants the codec enforces.
          expect(runStateIssues(played.value.state)).toEqual([])
        },
      ),
      { numRuns: 30 },
    )
  })
})

describe('ENG-SRV-001 · a played run survives the full transport round trip', () => {
  it('parses back from its serialized form', () => {
    const played = simulateRun(
      developmentRunDescriptor('hardening-transport', dependencies),
      dependencies,
    )
    if (!played.ok) throw new Error('simulation failed')

    const parsed = parseActionLog(serializeActionLog(played.value.log))
    expect(isOk(parsed)).toBe(true)
  })
})
