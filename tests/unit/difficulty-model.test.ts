import { describe, expect, it } from 'vitest'

import {
  agreesWithDocumentedLevel,
  bandOf,
  cognitiveLoad,
  costOf,
  difficultyCostPolicyIssues,
  documentedLevelsFor,
  formatCost,
  candidateDifficultyCostPolicy,
  BAND_THRESHOLDS,
  DIFFICULTY_BANDS,
  MAX_COGNITIVE_LOAD,
  MIN_COGNITIVE_LOAD,
  type CognitiveProfile,
  type DifficultyCostPolicy,
} from '@/game'
import { grade7Challenges } from '@/content/grade-7'

/**
 * El modelo de dificultad.
 *
 * Lo que se prueba no es que los números sean los correctos —eso lo decide el
 * Teacher Gate— sino que la dificultad salga de la **estructura** de la tarea y
 * no del tamaño de sus números, y que la calibración sea un dato y no una
 * constante escondida en un algoritmo.
 */

const trivial: CognitiveProfile = {
  steps: 1,
  constraints: 0,
  selection: 0,
  optimization: 0,
  uncertainty: 0,
  construction: 0,
}

const heaviest: CognitiveProfile = {
  steps: 4,
  constraints: 3,
  selection: 3,
  optimization: 2,
  uncertainty: 2,
  construction: 1,
}

describe('la carga cognitiva', () => {
  it('va del mínimo al máximo que el tipo admite', () => {
    expect(cognitiveLoad(trivial)).toBe(MIN_COGNITIVE_LOAD)
    expect(cognitiveLoad(heaviest)).toBe(MAX_COGNITIVE_LOAD)
  })

  it('sube con cada rasgo, y sólo con los rasgos', () => {
    const base = cognitiveLoad(trivial)

    expect(cognitiveLoad({ ...trivial, steps: 2 })).toBe(base + 1)
    expect(cognitiveLoad({ ...trivial, constraints: 2 })).toBe(base + 2)
    expect(cognitiveLoad({ ...trivial, selection: 3 })).toBe(base + 3)
    expect(cognitiveLoad({ ...trivial, optimization: 2 })).toBe(base + 2)
    expect(cognitiveLoad({ ...trivial, uncertainty: 1 })).toBe(base + 1)
    expect(cognitiveLoad({ ...trivial, construction: 1 })).toBe(base + 1)
  })

  it('clasifica en las tres bandas del documento de diseño', () => {
    expect(bandOf(trivial)).toBe('core')
    expect(bandOf(heaviest)).toBe('stretch')

    const atCoreCeiling = { ...trivial, steps: 4 as const }
    expect(cognitiveLoad(atCoreCeiling)).toBe(BAND_THRESHOLDS.core)
    expect(bandOf(atCoreCeiling)).toBe('core')

    const justAbove = { ...atCoreCeiling, construction: 1 as const }
    expect(bandOf(justAbove)).toBe('standard')
  })

  it('es monótona: más carga nunca baja de banda', () => {
    const order = { core: 0, standard: 1, stretch: 2 }
    const profiles: CognitiveProfile[] = []

    for (let steps = 1; steps <= 4; steps += 1) {
      for (let constraints = 0; constraints <= 3; constraints += 1) {
        for (let selection = 0; selection <= 3; selection += 1) {
          profiles.push({
            ...trivial,
            steps: steps as CognitiveProfile['steps'],
            constraints: constraints as CognitiveProfile['constraints'],
            selection: selection as CognitiveProfile['selection'],
          })
        }
      }
    }

    // Ordenadas por carga, las bandas no pueden retroceder. Es la propiedad que
    // hace utilizable el modelo: agregar un rasgo nunca vuelve más fácil una
    // plantilla.
    const sorted = [...profiles].sort(
      (left, right) => cognitiveLoad(left) - cognitiveLoad(right),
    )
    let previous = -1
    for (const profile of sorted) {
      expect(order[bandOf(profile)]).toBeGreaterThanOrEqual(previous)
      previous = order[bandOf(profile)]
    }
  })
})

describe('el costo de scheduling', () => {
  it('ordena estrictamente las tres bandas', () => {
    const { costs } = candidateDifficultyCostPolicy
    expect(costs.core).toBeLessThan(costs.standard)
    expect(costs.standard).toBeLessThan(costs.stretch)
  })

  it('lleva los valores candidatos del documento, en centésimas', () => {
    // 1,00 · 1,50 · 2,10. Enteros porque un presupuesto que suma flotantes
    // termina discutiendo consigo mismo si un plan entraba o no.
    expect(formatCost(costOf(candidateDifficultyCostPolicy, 'core'))).toBe(
      '1,00',
    )
    expect(formatCost(costOf(candidateDifficultyCostPolicy, 'standard'))).toBe(
      '1,50',
    )
    expect(formatCost(costOf(candidateDifficultyCostPolicy, 'stretch'))).toBe(
      '2,10',
    )

    for (const band of DIFFICULTY_BANDS) {
      expect(
        Number.isSafeInteger(costOf(candidateDifficultyCostPolicy, band)),
      ).toBe(true)
    }
  })

  it('no puede declararse oficial por su cuenta', () => {
    expect(candidateDifficultyCostPolicy.official).toBe(false)
  })

  it('rechaza una calibración que no ordena las bandas', () => {
    const flat: DifficultyCostPolicy = {
      ...candidateDifficultyCostPolicy,
      costs: { core: 150, standard: 150, stretch: 210 },
    }
    expect(difficultyCostPolicyIssues(flat)).toContainEqual(
      expect.stringContaining('increase strictly'),
    )
  })

  it('rechaza una calibración sin identidad', () => {
    expect(
      difficultyCostPolicyIssues({
        ...candidateDifficultyCostPolicy,
        version: '  ',
      }),
    ).not.toHaveLength(0)
  })
})

describe('la clasificación del contenido de 7.º', () => {
  it('declara un perfil cognitivo por plantilla', () => {
    for (const template of grade7Challenges) {
      expect(cognitiveLoad(template.cognitive)).toBeGreaterThanOrEqual(
        MIN_COGNITIVE_LOAD,
      )
      expect(template.band).toBe(bandOf(template.cognitive))
    }
  })

  /*
   * La clasificación candidata del año, fijada.
   *
   * No es verdad pedagógica: es calibración de ingeniería, y el Teacher Gate
   * puede moverla. Fijarla acá es lo que hace que moverla sea una decisión
   * visible en un diff en lugar de un efecto secundario.
   */
  it('clasifica el año como la auditoría de dificultad lo documenta', () => {
    const bands = Object.fromEntries(
      grade7Challenges.map((template) => [template.id, template.band]),
    )

    expect(bands).toEqual({
      'g7.may-25-act': 'core',
      'g7.bus-timing': 'standard',
      'g7.bus-latest-departure': 'standard',
      'g7.mural-paint': 'standard',
      'g7.notebook-offer': 'standard',
      'g7.stand-supplies': 'stretch',
      'g7.group-tasks': 'stretch',
      // El repaso del colectivo: un solo paso, sin restricciones simultáneas.
      // Una recuperación baja el piso, no sube el techo.
      'g7.bus-travel-review': 'core',
    })
  })

  it('separa las dos plantillas del colectivo por construir la respuesta', () => {
    const timing = grade7Challenges.find((t) => t.id === 'g7.bus-timing')
    const latest = grade7Challenges.find(
      (t) => t.id === 'g7.bus-latest-departure',
    )
    if (timing === undefined || latest === undefined) throw new Error('faltan')

    // Misma situación, misma matemática, y una sola traza distinta: en una la
    // respuesta está entre las opciones y en la otra hay que producirla.
    expect({ ...timing.cognitive, construction: 0 }).toEqual({
      ...latest.cognitive,
      construction: 0,
    })
    expect(latest.cognitive.construction).toBe(1)
    expect(cognitiveLoad(latest.cognitive)).toBeGreaterThan(
      cognitiveLoad(timing.cognitive),
    )
  })

  /*
   * Dónde la banda estructural y el `baseDifficulty` autorado no coinciden.
   *
   * El documento llama a esa correspondencia «una lectura documental, no una
   * migración», y esto la trata como tal: registra el desacuerdo en vez de
   * forzar una de las dos escalas a mentir. Cada fila es una pregunta concreta
   * para el Teacher Gate, no un defecto del motor.
   */
  it('registra las divergencias con el nivel autorado', () => {
    const diverging = grade7Challenges
      .filter(
        (template) =>
          !agreesWithDocumentedLevel(template.band, template.baseDifficulty),
      )
      .map(
        (template) =>
          `${template.id}:${template.band}/${String(template.baseDifficulty)}`,
      )
      .sort()

    expect(diverging).toEqual([
      'g7.bus-timing:standard/2',
      'g7.group-tasks:stretch/3',
      'g7.mural-paint:standard/2',
      'g7.stand-supplies:stretch/3',
    ])
  })

  it('mapea cada banda a los niveles que el documento declara', () => {
    expect(documentedLevelsFor('core')).toEqual([1, 2])
    expect(documentedLevelsFor('standard')).toEqual([3])
    expect(documentedLevelsFor('stretch')).toEqual([4, 5])
  })
})
