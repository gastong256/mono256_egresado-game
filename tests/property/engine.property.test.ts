import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  canonicalize,
  createRun,
  isOk,
  parseActionLog,
  replayRun,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
  STAGE_ORDER,
  toRunSeed,
} from '@/game'
import {
  createDevelopmentDependencies,
  developmentRunDescriptor,
  simulateRun,
} from '@/game/testing'
import { createRng } from '@/game/random/rng'
import { deriveSeedValue } from '@/game/random/seed'
import { eligibleStorylets, selectStorylet } from '@/game/narrative/selection'
import {
  EQUIPO_MAX,
  EQUIPO_MIN,
  ESTILO_AXES,
  initialCareer,
  promedio,
  PROMEDIO_MAX,
  PROMEDIO_MIN,
} from '@/game/progression/career'
import { developmentScoringPolicy } from '@/game/scoring/development-policy'
import { developmentProfilePolicy } from '@/game/profiles/development-policy'
import { SOLUTION_QUALITIES } from '@/game/challenges/taxonomy'

const dependencies = createDevelopmentDependencies()

const arbSeed = fc
  .string({ minLength: 1, maxLength: 24, unit: 'grapheme-ascii' })
  .map((value) => value.replace(/[^A-Za-z0-9._:-]/gu, 'x'))
  .filter((value) => value.length > 0)

const arbQuality = fc.constantFrom(...SOLUTION_QUALITIES)
const arbDifficulty = fc.constantFrom(1, 2, 3, 4, 5) as fc.Arbitrary<
  1 | 2 | 3 | 4 | 5
>
const arbUnitInterval = fc.double({
  min: 0,
  max: 1,
  noNaN: true,
  noDefaultInfinity: true,
})

describe('deterministic random source', () => {
  it('produces identical sequences for the same seed and path', () => {
    fc.assert(
      fc.property(
        arbSeed,
        fc.array(fc.integer(), { maxLength: 4 }),
        (seed, path) => {
          const draw = () => {
            const rng = createRng(toRunSeed(seed), path)
            return [rng.nextInt(0, 1_000_000), rng.nextInt(0, 1_000_000)]
          }
          expect(draw()).toEqual(draw())
        },
      ),
    )
  })

  it('keeps integers inside the requested inclusive range', () => {
    fc.assert(
      fc.property(
        arbSeed,
        fc.integer({ min: -10_000, max: 10_000 }),
        fc.integer({ min: 0, max: 10_000 }),
        (seed, min, span) => {
          const max = min + span
          const rng = createRng(toRunSeed(seed))
          for (let index = 0; index < 25; index += 1) {
            const value = rng.nextInt(min, max)
            expect(value).toBeGreaterThanOrEqual(min)
            expect(value).toBeLessThanOrEqual(max)
            expect(Number.isSafeInteger(value)).toBe(true)
          }
        },
      ),
    )
  })

  it('keeps floats inside [0, 1)', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const rng = createRng(toRunSeed(seed))
        for (let index = 0; index < 25; index += 1) {
          const value = rng.nextFloat()
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThan(1)
        }
      }),
    )
  })

  it('shuffles without adding or losing elements', () => {
    fc.assert(
      fc.property(
        arbSeed,
        fc.array(fc.integer(), { minLength: 1, maxLength: 20 }),
        (seed, items) => {
          const shuffled = createRng(toRunSeed(seed)).shuffle(items)
          expect(shuffled).toHaveLength(items.length)
          expect([...shuffled].sort()).toEqual([...items].sort())
        },
      ),
    )
  })

  it('never selects a zero-weight entry', () => {
    fc.assert(
      fc.property(
        arbSeed,
        fc.array(fc.nat({ max: 8 }), { minLength: 2, maxLength: 8 }),
        (seed, weights) => {
          // At least one positive weight is required for a draw to be defined.
          fc.pre(weights.some((weight) => weight > 0))

          const entries = weights.map((weight, index) => ({
            item: index,
            weight,
          }))
          const rng = createRng(toRunSeed(seed))

          for (let index = 0; index < 40; index += 1) {
            const chosen = rng.weightedPick(entries)
            expect(weights[chosen] ?? 0).toBeGreaterThan(0)
          }
        },
      ),
    )
  })

  it('gives different substreams to different paths', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const runSeed = toRunSeed(seed)
        // Adding a consumer under one path must not disturb another path.
        const a = deriveSeedValue(runSeed, ['stage', 1, 'challenge'])
        const b = deriveSeedValue(runSeed, ['stage', 1, 'storylet'])
        const c = deriveSeedValue(runSeed, ['stage', 2, 'challenge'])

        expect(a).not.toBe(b)
        expect(a).not.toBe(c)
      }),
    )
  })

  it('cannot collide a numeric segment with a textual one', () => {
    const seed = toRunSeed('collision')
    expect(deriveSeedValue(seed, ['a', 1])).not.toBe(
      deriveSeedValue(seed, ['a1']),
    )
  })
})

describe('scoring policy', () => {
  it('never produces a negative, infinite or fractional score', () => {
    fc.assert(
      fc.property(
        arbQuality,
        arbDifficulty,
        arbUnitInterval,
        arbUnitInterval,
        arbUnitInterval,
        fc.nat({ max: 20 }),
        (
          quality,
          difficulty,
          efficiency,
          precision,
          informationUse,
          streak,
        ) => {
          const breakdown = developmentScoringPolicy.scoreEvent({
            quality,
            difficulty,
            metrics: { efficiency, precision, risk: 0, informationUse },
            optimalStreak: streak,
          })

          expect(Number.isFinite(breakdown.totalPoints)).toBe(true)
          expect(Number.isInteger(breakdown.totalPoints)).toBe(true)
          expect(breakdown.totalPoints).toBeGreaterThanOrEqual(0)
          expect(Number.isInteger(breakdown.basePoints)).toBe(true)
        },
      ),
    )
  })

  it('rewards better quality at equal difficulty', () => {
    fc.assert(
      fc.property(arbDifficulty, (difficulty) => {
        const metrics = {
          efficiency: 0,
          precision: 0,
          risk: 0,
          informationUse: 0,
        }
        const score = (quality: (typeof SOLUTION_QUALITIES)[number]) =>
          developmentScoringPolicy.scoreEvent({
            quality,
            difficulty,
            metrics,
            optimalStreak: 0,
          }).totalPoints

        expect(score('invalid')).toBeLessThan(score('functional'))
        expect(score('functional')).toBeLessThan(score('efficient'))
        expect(score('efficient')).toBeLessThan(score('optimal'))
      }),
    )
  })

  it('caps the streak bonus at the documented +8 %', () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 50 }), (streak) => {
        const input = {
          quality: 'optimal' as const,
          difficulty: 3 as const,
          metrics: { efficiency: 0, precision: 0, risk: 0, informationUse: 0 },
          optimalStreak: streak,
        }
        const capped = developmentScoringPolicy.scoreEvent(input)
        const atCap = developmentScoringPolicy.scoreEvent({
          ...input,
          optimalStreak: 4,
        })

        expect(capped.totalPoints).toBe(atCap.totalPoints)
      }),
    )
  })
})

describe('profile policy', () => {
  it('always assigns exactly one known profile', () => {
    fc.assert(
      fc.property(
        fc.record({
          efficiency: arbUnitInterval,
          precision: arbUnitInterval,
          risk: arbUnitInterval,
          collaboration: arbUnitInterval,
          initiative: arbUnitInterval,
          informationUse: arbUnitInterval,
          stability: arbUnitInterval,
        }),
        (dimensions) => {
          const result = developmentProfilePolicy.classify(
            dimensions,
            initialCareer(),
          )
          expect(result.profileId).toBeTruthy()
          expect(result.runnerUpId).not.toBe(result.profileId)
        },
      ),
    )
  })

  it('is deterministic for identical evidence', () => {
    fc.assert(
      fc.property(
        fc.record({
          efficiency: arbUnitInterval,
          precision: arbUnitInterval,
          risk: arbUnitInterval,
          collaboration: arbUnitInterval,
          initiative: arbUnitInterval,
          informationUse: arbUnitInterval,
          stability: arbUnitInterval,
        }),
        (dimensions) => {
          const first = developmentProfilePolicy.classify(
            dimensions,
            initialCareer(),
          )
          const second = developmentProfilePolicy.classify(
            dimensions,
            initialCareer(),
          )
          expect(second).toEqual(first)
        },
      ),
    )
  })
})

describe('storylet selection', () => {
  it('never selects a storylet the filter excluded', () => {
    fc.assert(
      fc.property(
        arbSeed,
        fc.constantFrom(...STAGE_ORDER),
        fc.nat({ max: 12 }),
        (seed, stage, eventIndex) => {
          const context = {
            stage,
            eventIndex,
            career: initialCareer(),
            flags: {},
            seenStorylets: [],
            qualityHistory: [],
          }
          const state = { lastSeenAt: {} }
          const options = dependencies.ruleset.narrative

          const eligible = eligibleStorylets(
            dependencies.storylets,
            context,
            state,
            options,
          )
          const outcome = selectStorylet(
            dependencies.storylets,
            context,
            state,
            options,
            createRng(toRunSeed(seed)),
          )

          if (eligible.length === 0) {
            expect(outcome.kind).toBe('empty-pool')
            return
          }

          expect(outcome.kind).toBe('selected')
          if (outcome.kind !== 'selected') return
          expect(eligible).toContain(outcome.storylet)
          // Only the highest surviving priority tier may be selected.
          const highest = Math.max(
            ...eligible.map((storylet) => storylet.priority),
          )
          expect(outcome.storylet.priority).toBe(highest)
        },
      ),
    )
  })
})

describe('run invariants across seeds', () => {
  it('completes every run, keeps stats bounded and stays inside known stages', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const descriptor = developmentRunDescriptor(seed, dependencies)
        const outcome = simulateRun(descriptor, dependencies)

        expect(isOk(outcome)).toBe(true)
        if (!outcome.ok) return

        const { state } = outcome.value
        expect(state.status).toBe('completed')

        // No seed may dead-end: every stage plays its full event budget. This
        // is the guarantee the greedy-reachability content check protects.
        const expectedEvents = dependencies.ruleset.stages.reduce(
          (total, stage) => total + stage.eventCount,
          0,
        )
        expect(state.history).toHaveLength(expectedEvents)
        expect(new Set(state.history.map((entry) => entry.stage)).size).toBe(
          dependencies.ruleset.stages.length,
        )

        // Ninguna run válida puede producir un estado de carrera imposible:
        // una dimensión establecida está dentro de rango, y una que nadie tocó
        // sigue en `null` en vez de haberse convertido en 0.
        const average = promedio(state.career)
        if (average !== null) {
          expect(average).toBeGreaterThanOrEqual(PROMEDIO_MIN)
          expect(average).toBeLessThanOrEqual(PROMEDIO_MAX)
        }
        if (state.career.equipo !== null) {
          expect(state.career.equipo).toBeGreaterThanOrEqual(EQUIPO_MIN)
          expect(state.career.equipo).toBeLessThanOrEqual(EQUIPO_MAX)
          expect(Number.isInteger(state.career.equipo)).toBe(true)
        }
        if (state.career.aura !== null) {
          expect(Number.isInteger(state.career.aura)).toBe(true)
        }

        // Estilo es ternario: los tres porcentajes suman exactamente 100 en
        // cualquier run, sin importar cuántos empujones recibió.
        const estiloTotal = ESTILO_AXES.reduce(
          (sum, axis) => sum + state.career.estilo[axis],
          0,
        )
        expect(estiloTotal).toBe(100)
        for (const axis of ESTILO_AXES) {
          expect(Number.isInteger(state.career.estilo[axis])).toBe(true)
        }

        for (const value of Object.values(state.career.mastery)) {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(1)
        }

        expect(Number.isFinite(state.scorePreview)).toBe(true)
        expect(state.scorePreview).toBeGreaterThanOrEqual(0)

        for (const entry of state.history) {
          expect(STAGE_ORDER).toContain(entry.stage)
          expect(entry.points).toBeGreaterThanOrEqual(0)
        }
      }),
      { numRuns: 40 },
    )
  })

  it('reproduces every run through replay and through a snapshot', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const descriptor = developmentRunDescriptor(seed, dependencies)
        const played = simulateRun(descriptor, dependencies)
        if (!played.ok) throw new Error('simulation failed')

        const log = parseActionLog(serializeActionLog(played.value.log))
        if (!log.ok) throw new Error('action log rejected')

        const replayed = replayRun(log.value, dependencies)
        if (!replayed.ok) throw new Error('replay rejected')
        expect(canonicalize(replayed.value.state)).toBe(
          canonicalize(played.value.state),
        )

        const restored = restoreSnapshot(
          JSON.parse(JSON.stringify(serializeSnapshot(played.value.state))),
          {
            gameVersion: descriptor.gameVersion,
            rulesetVersion: descriptor.rulesetVersion,
            contentVersion: descriptor.contentVersion,
          },
        )
        if (!restored.ok) throw new Error('snapshot rejected')
        expect(canonicalize(restored.value)).toBe(
          canonicalize(played.value.state),
        )
      }),
      { numRuns: 25 },
    )
  })

  it('creates identical runs from identical descriptors', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const descriptor = developmentRunDescriptor(seed, dependencies)
        const first = createRun(descriptor, dependencies)
        const second = createRun(descriptor, dependencies)

        if (!first.ok || !second.ok) throw new Error('run creation failed')
        expect(canonicalize(second.value.state)).toBe(
          canonicalize(first.value.state),
        )
        expect(second.value.events).toEqual(first.value.events)
      }),
    )
  })
})

describe('challenge generation and evaluation', () => {
  it('generates instances that satisfy their own invariants', () => {
    fc.assert(
      fc.property(
        arbSeed,
        fc.nat({ max: dependencies.challenges.definitions.length - 1 }),
        arbDifficulty,
        (seed, index, difficulty) => {
          const definition = dependencies.challenges.definitions[index]
          if (definition === undefined) return

          const stage = definition.stages[0]
          if (stage === undefined) return

          const materialized = definition.materialize(
            {
              instanceId: `${stage}:0:${definition.id}` as never,
              definitionId: definition.id,
              stageId: stage,
              eventIndex: 0,
              difficulty,
            },
            { rng: createRng(toRunSeed(seed), ['property']), difficulty },
          )

          expect(materialized.verify()).toEqual([])
          expect(materialized.attempts).toBeGreaterThanOrEqual(1)
          // The public view must never leak the internal model.
          const view = JSON.stringify(materialized.present([]))
          expect(view).not.toContain('optimalCost')
          expect(view).not.toContain('bestScore')
        },
      ),
    )
  })

  it('evaluates the same answer to the same result every time', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const descriptor = developmentRunDescriptor(seed, dependencies)
        const first = simulateRun(descriptor, dependencies)
        const second = simulateRun(descriptor, dependencies)

        if (!first.ok || !second.ok) throw new Error('simulation failed')
        expect(canonicalize(second.value.state)).toBe(
          canonicalize(first.value.state),
        )
      }),
      { numRuns: 20 },
    )
  })
})
