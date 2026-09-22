import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  aggregate,
  candidateFairScorePolicy,
  competitiveScorePolicies,
  competitiveScorePolicyIssues,
  fairScoreDev1Policy,
  fairScoreDev2Policy,
  fairScoreV1Policy,
  isOk,
  metrics,
  officialFairScorePolicy,
  resolveCompetitiveScorePolicy,
  SCORE_SCALE,
  scorePolicyDifferences,
  scoreRun,
  scoringShapeOf,
  type BeatEvidence,
  type ScoredEvent,
} from '@/game'
import { createFullCareerDependencies } from '@/content/full-career'
import { FAIR_EDITION_V1 } from '@/release'

/**
 * La oficialización de FairScore, probada por aritmética.
 *
 * El FREEZE de producción publicó `fair-score-v1` con los mismos números que
 * `fair-score-dev-2`. Eso es una afirmación fuerte y fácil de romper sin querer:
 * alcanza con que alguien «redondee» un peso mientras copia. Comparar los dos
 * objetos campo por campo detecta esa clase de error, pero sólo esa; lo que
 * estos tests agregan es que **el resultado** coincide sobre un corpus grande,
 * que es la propiedad que de verdad importa —dos personas con la misma partida
 * tienen que recibir el mismo número bajo cualquiera de las dos identidades—.
 *
 * Si algún día hay que recalibrar, estos tests tienen que fallar. Ese es el
 * punto: una recalibración es una versión nueva, no una edición de ésta.
 */

/**
 * El catálogo de la edición competitiva, no un fixture.
 *
 * Las veintiocho Templates de `7.º → 5.º` son las que un intento de feria puede
 * puntuar, así que son las que la equivalencia tiene que cubrir. Probarla sobre
 * un contenido más chico demostraría que las dos identidades coinciden en el
 * contenido que no se juega.
 */
const catalog = createFullCareerDependencies().catalog
const templates = catalog.templates.map((template) => String(template.id))

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

describe('identidad de la política oficial', () => {
  it('es la que el manifiesto del release fija', () => {
    expect(officialFairScorePolicy.id).toBe(FAIR_EDITION_V1.score.policyId)
    expect(officialFairScorePolicy.version).toBe(
      FAIR_EDITION_V1.score.policyVersion,
    )
    expect(officialFairScorePolicy.official).toBe(true)
  })

  it('no es `current` ni `latest`, y pasa las reglas estructurales', () => {
    expect(competitiveScorePolicyIssues(fairScoreV1Policy)).toEqual([])
    expect(fairScoreV1Policy.id).not.toBe('current')
    expect(fairScoreV1Policy.id).not.toBe('latest')
  })

  it('se resuelve por id y por versión, sin fallback', () => {
    for (const reference of [fairScoreV1Policy.id, fairScoreV1Policy.version]) {
      const resolved = resolveCompetitiveScorePolicy(reference)
      expect(isOk(resolved) && resolved.value).toBe(fairScoreV1Policy)
    }
    expect(isOk(resolveCompetitiveScorePolicy('latest'))).toBe(false)
  })

  it('conserva las dos candidatas publicadas, sin editarlas', () => {
    // Un intento emitido bajo una calibración se verifica bajo esa calibración
    // o no se verifica. Borrar una versión publicada convierte evidencia
    // guardada en un intento que nadie puede volver a puntuar.
    expect(competitiveScorePolicies).toContain(fairScoreDev1Policy)
    expect(competitiveScorePolicies).toContain(fairScoreDev2Policy)
    expect(fairScoreDev1Policy.official).toBe(false)
    expect(fairScoreDev2Policy.official).toBe(false)
    expect(candidateFairScorePolicy).toBe(fairScoreDev2Policy)
  })
})

describe('equivalencia con la candidata que promovió', () => {
  it('no movió un solo número de la configuración', () => {
    expect(
      scorePolicyDifferences(fairScoreDev2Policy, fairScoreV1Policy),
    ).toEqual([])
    expect(scoringShapeOf(fairScoreV1Policy)).toEqual(
      scoringShapeOf(fairScoreDev2Policy),
    )
  })

  it('mantiene 85 / 10 / 5 y los cuatro escalones 100 / 75 / 40 / 10', () => {
    expect(fairScoreV1Policy.weights).toEqual({
      math: 8_500,
      team: 1_000,
      aura: 500,
    })
    expect(fairScoreV1Policy.discreteQuality).toEqual({
      optimal: 10_000,
      efficient: 7_500,
      functional: 4_000,
      invalid: 1_000,
    })
  })

  it('mantiene los factores de dificultad', () => {
    expect(fairScoreV1Policy.difficultyReward).toEqual({
      core: 10_000,
      standard: 10_800,
      stretch: 11_500,
    })
  })

  it('sí cambia frente a la calibración pre-Teacher-Gate-1', () => {
    // El control negativo. Sin él, `scorePolicyDifferences` podría estar
    // devolviendo la lista vacía porque no compara nada.
    expect(
      scorePolicyDifferences(fairScoreDev1Policy, fairScoreV1Policy),
    ).toContain('weight.math: 8000 vs 8500')
  })
})

describe('equivalencia sobre un corpus determinista', () => {
  /**
   * Corpus determinista de secuencias de uno a tres beats.
   * Por Template hay 4 secuencias de un beat, 16 de dos, 16 de tres
   * y 15 combinaciones de precisión/eficiencia: 51 × 42 = 2142.
   * Se comparan tanto los rechazos como las 1936 secuencias puntuables.
   */
  const qualities: readonly ScoredEvent['quality'][] = [
    'optimal',
    'efficient',
    'functional',
    'invalid',
  ]

  function corpus(): readonly (readonly ScoredEvent[])[] {
    const runs: (readonly ScoredEvent[])[] = []
    templates.forEach((templateId, index) => {
      const next = templates[(index + 1) % templates.length] ?? templateId
      const far = templates[(index + 7) % templates.length] ?? templateId
      for (const quality of qualities) {
        runs.push([event(templateId, quality)])
        for (const second of qualities) {
          runs.push([event(templateId, quality), event(next, second)])
          runs.push([
            event(templateId, quality),
            event(next, second),
            event(far, quality),
          ])
        }
      }
      // Precisión y eficiencia intermedias: los evaluadores continuos no caen
      // en los cuatro escalones, y la recompensa por dificultad los multiplica.
      for (const precision of [0, 0.25, 0.5, 0.75, 1]) {
        for (const efficiency of [0, 0.5, 1]) {
          runs.push([event(templateId, 'efficient', precision, efficiency)])
        }
      }
    })
    return runs
  }

  const runs = corpus()

  it('cubre un corpus de tamaño no trivial', () => {
    expect(runs.length).toBeGreaterThan(1_000)
  })

  it('da exactamente el mismo FairScore bajo las dos identidades', () => {
    let compared = 0
    for (const run of runs) {
      const candidate = scoreRun(run, catalog, fairScoreDev2Policy)
      const official = scoreRun(run, catalog, fairScoreV1Policy)
      expect(isOk(official)).toBe(isOk(candidate))
      if (!isOk(candidate) || !isOk(official)) continue
      compared += 1
      expect(official.value.fairScore).toBe(candidate.value.fairScore)
      expect(official.value.mathRaw).toBe(candidate.value.mathRaw)
      expect(official.value.mathMax).toBe(candidate.value.mathMax)
      expect(official.value.scoredBeats).toBe(candidate.value.scoredBeats)
      expect(official.value.optimalCount).toBe(candidate.value.optimalCount)
      expect(official.value.components).toEqual(candidate.value.components)
    }
    expect(compared).toBeGreaterThan(1_000)
  })

  it('sólo difiere en lo que la promoción cambió: la identidad', () => {
    const run = [event(templates[0] ?? '', 'optimal')]
    const candidate = scoreRun(run, catalog, fairScoreDev2Policy)
    const official = scoreRun(run, catalog, fairScoreV1Policy)
    if (!isOk(candidate) || !isOk(official)) throw new Error('no puntuó')

    expect(official.value.scorePolicyId).toBe('fair-score-v1')
    expect(candidate.value.scorePolicyId).toBe('fair-score-dev-2')
    expect(official.value.official).toBe(true)
    expect(candidate.value.official).toBe(false)

    const strip = (result: typeof official.value) => ({
      ...result,
      scorePolicyId: '',
      scorePolicyVersion: '',
      official: false,
    })
    expect(strip(official.value)).toEqual(strip(candidate.value))
  })
})

describe('la partida perfecta sigue valiendo 10 000 exactos', () => {
  /** Evidencia de una partida sin un solo error, en cada banda. */
  function perfect(band: BeatEvidence['band']): BeatEvidence {
    const reward = fairScoreV1Policy.difficultyReward[band]
    return {
      templateId: 'p.perfect' as BeatEvidence['templateId'],
      band,
      difficultyReward: reward,
      math: { achieved: SCORE_SCALE * reward, available: SCORE_SCALE * reward },
      team: { achieved: SCORE_SCALE, available: SCORE_SCALE },
      aura: { achieved: SCORE_SCALE, available: SCORE_SCALE },
    }
  }

  it.each(['core', 'standard', 'stretch'] as const)(
    'en banda %s, y sin diferencia entre las dos identidades',
    (band) => {
      const evidence = [perfect(band)]
      const official = aggregate(evidence, fairScoreV1Policy)
      const candidate = aggregate(evidence, fairScoreDev2Policy)
      if (!isOk(official) || !isOk(candidate)) throw new Error('no puntuó')
      expect(official.value.fairScore).toBe(10_000)
      expect(candidate.value.fairScore).toBe(10_000)
    },
  )

  it('y una carrera entera de nueve beats mezclados también', () => {
    const bands: readonly BeatEvidence['band'][] = [
      'core',
      'core',
      'standard',
      'standard',
      'standard',
      'stretch',
      'core',
      'standard',
      'stretch',
    ]
    const result = aggregate(bands.map(perfect), fairScoreV1Policy)
    if (!isOk(result)) throw new Error('no puntuó')
    expect(result.value.fairScore).toBe(10_000)
  })
})

describe('equivalencia sobre evidencia arbitraria', () => {
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
      const reward = fairScoreV1Policy.difficultyReward[beatBand]
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

  it('coincide sobre cualquier evidencia que el modelo admita', () => {
    fc.assert(
      fc.property(
        fc.array(beatArbitrary, { minLength: 1, maxLength: 9 }),
        (evidence) => {
          const official = aggregate(evidence, fairScoreV1Policy)
          const candidate = aggregate(evidence, fairScoreDev2Policy)
          expect(isOk(official)).toBe(isOk(candidate))
          if (!isOk(official) || !isOk(candidate)) return
          expect(official.value.fairScore).toBe(candidate.value.fairScore)
        },
      ),
      { numRuns: 500 },
    )
  })
})
