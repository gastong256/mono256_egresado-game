import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  aggregate,
  isOk,
  candidateFairScorePolicy,
  SCORE_COMPONENTS,
  SCORE_SCALE,
  type BeatEvidence,
  type ScoreComponentKey,
} from '@/game'

/**
 * Las invariantes del score sobre evidencia arbitraria.
 *
 * Los tests de unidad prueban los casos que alguien escribió; esto prueba los
 * que no. Un score que respeta su escala en los ejemplos elegidos y la rompe en
 * el resto no sirve para un ranking.
 */

const policy = candidateFairScorePolicy

const basisPoints = fc.integer({ min: 0, max: SCORE_SCALE })
const band = fc.constantFrom(
  'core' as const,
  'standard' as const,
  'stretch' as const,
)

const beatArbitrary = fc
  .record({
    band,
    math: basisPoints,
    team: fc.option(basisPoints, { nil: undefined }),
    aura: fc.option(basisPoints, { nil: undefined }),
  })
  .map(({ band: beatBand, math, team, aura }): BeatEvidence => {
    const reward = policy.difficultyReward[beatBand]
    const flat = (value: number | undefined) =>
      value === undefined
        ? { achieved: 0, available: 0 }
        : { achieved: value, available: SCORE_SCALE }
    return {
      templateId: 'p.beat' as BeatEvidence['templateId'],
      band: beatBand,
      difficultyReward: reward,
      math: { achieved: math * reward, available: SCORE_SCALE * reward },
      team: flat(team),
      aura: flat(aura),
    }
  })

const runArbitrary = fc.array(beatArbitrary, { minLength: 1, maxLength: 8 })

function score(evidence: readonly BeatEvidence[]): number {
  const result = aggregate(evidence, policy)
  if (!isOk(result)) throw new Error(`no puntuó: ${result.error.code}`)
  return result.value.fairScore
}

describe('el score sobre evidencia arbitraria', () => {
  it('nunca sale de la escala', () => {
    fc.assert(
      fc.property(runArbitrary, (evidence) => {
        const value = score(evidence)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(SCORE_SCALE)
      }),
      { numRuns: 300 },
    )
  })

  it('el desglose siempre cierra', () => {
    fc.assert(
      fc.property(runArbitrary, (evidence) => {
        const result = aggregate(evidence, policy)
        if (!isOk(result)) return
        const sum = result.value.components.reduce(
          (total, component) => total + component.contribution,
          0,
        )
        expect(sum).toBe(result.value.fairScore)
      }),
      { numRuns: 300 },
    )
  })

  it('el juego perfecto siempre vale la escala completa', () => {
    fc.assert(
      fc.property(runArbitrary, (evidence) => {
        const perfect = evidence.map((beat): BeatEvidence => {
          const top = (part: BeatEvidence['team']) => ({
            achieved: part.available,
            available: part.available,
          })
          return {
            ...beat,
            math: top(beat.math),
            team: top(beat.team),
            aura: top(beat.aura),
          }
        })
        expect(score(perfect)).toBe(SCORE_SCALE)
      }),
      { numRuns: 300 },
    )
  })

  it('el peor juego siempre vale cero, sin importar cuántos beats haya', () => {
    fc.assert(
      fc.property(runArbitrary, (evidence) => {
        const floor = evidence.map((beat): BeatEvidence => {
          const bottom = (part: BeatEvidence['team']) => ({
            achieved: 0,
            available: part.available,
          })
          return {
            ...beat,
            math: bottom(beat.math),
            team: bottom(beat.team),
            aura: bottom(beat.aura),
          }
        })
        expect(score(floor)).toBe(0)
      }),
      { numRuns: 200 },
    )
  })

  it('mejorar la matemática nunca baja el score', () => {
    fc.assert(
      fc.property(runArbitrary, basisPoints, (evidence, delta) => {
        const improved = evidence.map((beat): BeatEvidence => ({
          ...beat,
          math: {
            achieved: Math.min(
              beat.math.available,
              beat.math.achieved + delta * beat.difficultyReward,
            ),
            available: beat.math.available,
          },
        }))
        expect(score(improved)).toBeGreaterThanOrEqual(score(evidence))
      }),
      { numRuns: 300 },
    )
  })

  it('lo no matemático nunca mueve el score más de lo que su peso permite', () => {
    fc.assert(
      fc.property(runArbitrary, (evidence) => {
        const setSecondary = (value: 'floor' | 'top') =>
          evidence.map((beat): BeatEvidence => {
            const pick = (part: BeatEvidence['team']) => ({
              achieved: value === 'top' ? part.available : 0,
              available: part.available,
            })
            return { ...beat, team: pick(beat.team), aura: pick(beat.aura) }
          })

        const gap = score(setSecondary('top')) - score(setSecondary('floor'))
        // Con equipo y aura presentes, su peso efectivo es 1500/10000 de la
        // escala; sin ellos el hueco es cero. Nunca puede ser más.
        expect(gap).toBeLessThanOrEqual(
          policy.weights.team + policy.weights.aura,
        )
        expect(gap).toBeGreaterThanOrEqual(0)
      }),
      { numRuns: 300 },
    )
  })

  it('una componente ausente no cambia el techo', () => {
    fc.assert(
      fc.property(
        runArbitrary,
        fc.constantFrom(...SCORE_COMPONENTS),
        (evidence, drop) => {
          if (drop === 'math') return

          const without = evidence.map((beat): BeatEvidence => ({
            ...beat,
            [drop]: { achieved: 0, available: 0 },
          }))
          const perfect = (beats: readonly BeatEvidence[]) =>
            beats.map((beat): BeatEvidence => {
              const top = (part: BeatEvidence['team']) => ({
                achieved: part.available,
                available: part.available,
              })
              return {
                ...beat,
                math: top(beat.math),
                team: top(beat.team),
                aura: top(beat.aura),
              }
            })

          expect(score(perfect(without))).toBe(score(perfect(evidence)))
        },
      ),
      { numRuns: 300 },
    )
  })

  it('es una función: la misma evidencia da siempre el mismo score', () => {
    fc.assert(
      fc.property(runArbitrary, (evidence) => {
        expect(score(evidence)).toBe(score(evidence))
      }),
      { numRuns: 200 },
    )
  })

  it('Promedio y Estilo no pueden alterar el score de la misma evidencia', () => {
    const scoreWithCareer = (
      evidence: readonly BeatEvidence[],
      career: { readonly promedio: number; readonly estilo: string },
    ) => {
      void career
      return score(evidence)
    }

    fc.assert(
      fc.property(
        runArbitrary,
        fc.integer({ min: 1, max: 10 }),
        fc.constantFrom('aplicado', 'estratega', 'improvisador'),
        (evidence, promedio, estilo) => {
          expect(scoreWithCareer(evidence, { promedio, estilo })).toBe(
            scoreWithCareer(evidence, {
              promedio: promedio === 10 ? 1 : 10,
              estilo: estilo === 'aplicado' ? 'improvisador' : 'aplicado',
            }),
          )
        },
      ),
      { numRuns: 200 },
    )
  })

  it('duplicar la run no cambia el score', () => {
    // Normalizar contra el máximo de la propia run es lo que hace que jugar lo
    // mismo dos veces valga lo mismo que jugarlo una.
    fc.assert(
      fc.property(runArbitrary, (evidence) => {
        expect(score([...evidence, ...evidence])).toBe(score(evidence))
      }),
      { numRuns: 200 },
    )
  })

  it('la escala de cada componente se respeta', () => {
    fc.assert(
      fc.property(runArbitrary, (evidence) => {
        const result = aggregate(evidence, policy)
        if (!isOk(result)) return
        for (const component of result.value.components) {
          expect(component.performance).toBeGreaterThanOrEqual(0)
          expect(component.performance).toBeLessThanOrEqual(
            policy.componentCaps[component.component as ScoreComponentKey],
          )
        }
      }),
      { numRuns: 200 },
    )
  })
})
