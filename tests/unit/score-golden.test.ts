import { describe, expect, it } from 'vitest'

import {
  createContentCatalog,
  isOk,
  metrics,
  scoreRun,
  candidateFairScorePolicy,
  type ScoredEvent,
} from '@/game'
import { grade7Challenges, grade7Families } from '@/content/grade-7'

/**
 * Golden del score competitivo.
 *
 * Fija lo que la política candidata produce para cuatro runs concretas. Un
 * cambio en cualquiera de estos números significa que dos jugadores puntuarían
 * distinto por la misma partida, así que **regenerarlos sin subir la versión de
 * la política reescribiría en silencio el resultado de una competencia**.
 *
 * Son los mismos cuatro ejemplos que la documentación usa para discutir la
 * calibración con el Departamento de Matemática, y por eso se calculan enteros:
 * cada cuenta de la tabla del documento tiene que poder rehacerse desde acá.
 *
 * Estos golden son del score **competitivo** y no tocan los de
 * `engine-golden.test.ts`, que fijan el score por evento de la capa de carrera.
 * Son dos capas distintas y ninguna de las dos reinterpreta a la otra.
 */

const catalog = createContentCatalog(grade7Families, grade7Challenges)
const policy = candidateFairScorePolicy

function event(
  templateId: string,
  quality: ScoredEvent['quality'],
  precision = 1,
  efficiency = 1,
): ScoredEvent {
  return {
    templateId: templateId as ScoredEvent['templateId'],
    quality,
    metrics: metrics({ precision, efficiency, risk: 0 }),
  }
}

interface Golden {
  readonly label: string
  readonly events: readonly ScoredEvent[]
  readonly fairScore: number
  readonly mathPerformance: number
  readonly teamPerformance: number
  readonly mathContribution: number
  readonly teamContribution: number
  readonly effectiveMathWeight: number
}

const GOLDENS: readonly Golden[] = [
  {
    // Óptimo en el colectivo y un reparto grupal correcto pero torpe: la
    // matemática casi entera, el equipo casi nada.
    label: 'matemática fuerte, secundario flojo',
    events: [
      event('g7.bus-timing', 'optimal'),
      event('g7.group-tasks', 'efficient', 1, 0.2),
    ],
    fairScore: 7_651,
    mathPerformance: 8_711,
    teamPerformance: 2_000,
    mathContribution: 7_335,
    teamContribution: 316,
    effectiveMathWeight: 8_421,
  },
  {
    // El espejo: un reparto que falla la matemática y aprovecha perfectamente
    // las fuerzas de cada uno. El equipo perfecto no compra la run.
    label: 'matemática floja, secundario perfecto',
    events: [
      event('g7.bus-timing', 'functional'),
      event('g7.group-tasks', 'invalid', 1, 1),
    ],
    fairScore: 3_645,
    mathPerformance: 2_453,
    teamPerformance: 10_000,
    mathContribution: 2_066,
    teamContribution: 1_579,
    effectiveMathWeight: 8_421,
  },
  {
    label: 'run perfecta',
    events: [
      event('g7.bus-timing', 'optimal'),
      event('g7.may-25-act', 'optimal'),
    ],
    fairScore: 10_000,
    mathPerformance: 10_000,
    teamPerformance: 0,
    mathContribution: 10_000,
    teamContribution: 0,
    effectiveMathWeight: 10_000,
  },
  {
    // Una partida compuesta normal de 7.º: sin contenido de equipo ni de aura,
    // así que la matemática se lleva la escala entera y el score es su propio
    // desempeño.
    label: 'sin oportunidad de equipo ni de aura',
    events: [
      event('g7.bus-latest-departure', 'efficient'),
      event('g7.may-25-act', 'efficient', 0.8, 0.7),
    ],
    fairScore: 7_484,
    mathPerformance: 7_484,
    teamPerformance: 0,
    mathContribution: 7_484,
    teamContribution: 0,
    effectiveMathWeight: 10_000,
  },
]

describe('golden del score competitivo', () => {
  it.each(GOLDENS)('reproduce «$label»', (golden) => {
    const result = scoreRun(golden.events, catalog, policy)
    if (!isOk(result)) throw new Error(`no puntuó: ${result.error.code}`)

    const math = result.value.components.find((c) => c.component === 'math')
    const team = result.value.components.find((c) => c.component === 'team')

    expect(result.value.fairScore).toBe(golden.fairScore)
    expect(math?.performance).toBe(golden.mathPerformance)
    expect(math?.contribution).toBe(golden.mathContribution)
    expect(math?.effectiveWeight).toBe(golden.effectiveMathWeight)
    expect(team?.performance).toBe(golden.teamPerformance)
    expect(team?.contribution).toBe(golden.teamContribution)
  })

  it('cada golden cierra: las partes suman el total', () => {
    for (const golden of GOLDENS) {
      const result = scoreRun(golden.events, catalog, policy)
      if (!isOk(result)) throw new Error('no puntuó')
      expect(
        result.value.components.reduce(
          (sum, component) => sum + component.contribution,
          0,
        ),
      ).toBe(golden.fairScore)
    }
  })

  it('fija la calibración que los produjo', () => {
    // Si alguien cambia un peso o un factor sin publicar una política nueva,
    // los golden de arriba se caen y este test dice por qué.
    expect(policy.id).toBe('fair-score-dev-1')
    expect(policy.version).toBe('1.0.0-candidate')
    expect(policy.weights).toEqual({ math: 8_000, team: 1_500, aura: 500 })
    expect(policy.difficultyReward).toEqual({
      core: 10_000,
      standard: 10_800,
      stretch: 11_500,
    })
    expect(policy.discreteQuality).toEqual({
      optimal: 10_000,
      efficient: 7_500,
      functional: 4_000,
      invalid: 1_000,
    })
  })
})
