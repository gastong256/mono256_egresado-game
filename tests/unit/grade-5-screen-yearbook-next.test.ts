import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  PROPORTION_REVIEW_SPACE,
  SECTIONS,
  YEARBOOK_SPACE,
  bestCoverage,
  evaluateProportionReview,
  evaluateYearbook,
  generateProportionReview,
  generateYearbook,
  pagesForAll,
  pagesNeeded,
  proportionCapacityReview,
  proportionReviewGates,
  readYearbook,
  yearbook,
  yearbookGates,
  yearbookPlans,
  type YearbookParams,
} from '@/content/grade-5/challenges/yearbook'
import {
  SCREEN_SPACE,
  WAYS,
  evaluateScreen,
  generateScreen,
  keepsBanner,
  project,
  screenChoices,
  screenGates,
  stageScreen,
  type ScreenParams,
} from '@/content/grade-5/challenges/stage-screen'
import {
  NEXT_STEP_SPACE,
  SCENARIOS,
  blockedBy,
  evaluateNextStep,
  fitsScenario,
  generateNextStep,
  nextStepGates,
  nextStepOptions,
  nextStepPlans,
  type NextStepParams,
} from '@/content/grade-5/challenges/next-step-options'

const yearbooks: readonly YearbookParams[] = Array.from(
  { length: YEARBOOK_SPACE },
  (_, index) => generateYearbook(index),
).filter((params) => yearbookGates(params).length === 0)
const screens: readonly ScreenParams[] = Array.from(
  { length: 600 },
  (_, index) => generateScreen(index),
).filter((params) => screenGates(params).length === 0)
const steps: readonly NextStepParams[] = Array.from(
  { length: 600 },
  (_, index) => generateNextStep(index),
).filter((params) => nextStepGates(params).length === 0)

describe('5.º · el anuario', () => {
  const sample = yearbooks[0]
  if (sample === undefined) throw new Error('sin variante aprobada')

  it('aprueba un catálogo suficiente y es STANDARD del cluster de egreso', () => {
    expect(yearbooks.length).toBeGreaterThanOrEqual(24)
    expect(yearbook.band).toBe('standard')
    expect(bandOf(yearbook.cognitive)).toBe('standard')
    expect(cognitiveLoad(yearbook.cognitive)).toBeLessThanOrEqual(7)
    expect(yearbook.composition).toMatchObject({
      interactionEngine: 'allocate-constrain',
      eventCluster: 'egreso',
    })
  })

  it('LOCKED: ni el reparto igualitario ni el proporcional son la respuesta', () => {
    for (const params of yearbooks.slice(0, 40)) {
      const equal = Math.floor(params.pages / SECTIONS.length)
      const equalLines = SECTIONS.map((entry, index) => ({
        itemId: entry.id,
        quantity:
          index === 0 ? params.pages - equal * (SECTIONS.length - 1) : equal,
      }))
      expect(readYearbook(params, equalLines).quality).not.toBe('optimal')
      // Y el material no entra entero: hay que decidir qué sección se completa.
      const needed = SECTIONS.reduce(
        (total, _, index) => total + pagesForAll(params, index),
        0,
      )
      expect(needed).toBeGreaterThan(params.pages)
      expect(bestCoverage(params)).toBeGreaterThanOrEqual(2)
    }
  })

  it('el total tiene que dar exacto y los mínimos se respetan', () => {
    const plans = yearbookPlans(sample)
    for (const plan of plans.filter((entry) => entry.quality !== 'invalid')) {
      const used = plan.lines.reduce((total, line) => total + line.quantity, 0)
      expect(used).toBe(sample.pages)
    }
    const short = SECTIONS.map((entry, index) => ({
      itemId: entry.id,
      quantity: index === 0 ? 0 : Math.floor(sample.pages / 3),
    }))
    expect(evaluateYearbook(sample, short).ok).toBe(true)
    const result = evaluateYearbook(sample, short)
    if (result.ok) expect(result.value.quality).toBe('invalid')
  })

  it('el Repaso sube al entero: lo que sobra también ocupa una página', () => {
    const reviews = Array.from(
      { length: PROPORTION_REVIEW_SPACE },
      (_, index) => generateProportionReview(index),
    ).filter((params) => proportionReviewGates(params).length === 0)
    expect(reviews.length).toBeGreaterThanOrEqual(12)
    const params = reviews[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    const exact = pagesNeeded(params)
    expect((exact - 1) * params.perPage).toBeLessThan(params.items)
    const right = evaluateProportionReview(params, String(exact))
    expect(right.ok && right.value.quality).toBe('optimal')
    const down = evaluateProportionReview(params, String(exact - 1))
    expect(down.ok && down.value.quality).toBe('functional')
    expect(proportionCapacityReview.placement).toBe('recovery')
  })
})

describe('5.º · la pantalla del acto', () => {
  const sample = screens[0]
  if (sample === undefined) throw new Error('sin variante aprobada')

  it('aprueba un catálogo suficiente y es el STRETCH rápido del año', () => {
    expect(screens.length).toBeGreaterThanOrEqual(24)
    expect(SCREEN_SPACE).toBeGreaterThan(600)
    expect(stageScreen.band).toBe('stretch')
    expect(bandOf(stageScreen.cognitive)).toBe('stretch')
    expect(cognitiveLoad(stageScreen.cognitive)).toBeGreaterThan(7)
    expect(stageScreen.composition).toMatchObject({
      primaryReasoningFamily: 'SPATIAL',
      pacingClass: 'QUICK',
      eventCluster: 'egreso',
    })
  })

  it('LOCKED: toda la geometría está dada y el cartel decide', () => {
    for (const params of screens.slice(0, 60)) {
      // Estirar siempre deforma, y recortar por el medio siempre toca el cartel.
      expect(project(params, 'estirar').deforms).toBe(true)
      expect(keepsBanner(params, 'ancho-centro')).toBe(false)
      // El lado del cartel es el que decide cuál de los dos recortes sirve.
      const best = screenChoices(params).find(
        (choice) => choice.quality === 'optimal',
      )
      expect(best?.wayId).toBe(
        params.bannerAt === 'arriba' ? 'ancho-arriba' : 'ancho-abajo',
      )
    }
  })

  it('la respuesta correcta cambia según de qué lado está el cartel', () => {
    const winners = new Set(
      screens
        .slice(0, 60)
        .map(
          (params) =>
            screenChoices(params).find((choice) => choice.quality === 'optimal')
              ?.wayId,
        ),
    )
    expect(winners.size).toBe(2)
  })

  it('el evaluador reproduce el oráculo y rechaza una forma inventada', () => {
    for (const choice of screenChoices(sample)) {
      const result = evaluateScreen(sample, choice.wayId)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(choice.quality)
    }
    expect(evaluateScreen(sample, 'girarla').ok).toBe(false)
    expect(WAYS.length).toBeLessThanOrEqual(6)
  })
})

describe('5.º · el año que viene', () => {
  const sample = steps[0]
  if (sample === undefined) throw new Error('sin variante aprobada')

  it('aprueba un catálogo suficiente y es el CORE del año', () => {
    expect(steps.length).toBeGreaterThanOrEqual(24)
    expect(NEXT_STEP_SPACE).toBeGreaterThan(600)
    expect(nextStepOptions.band).toBe('core')
    expect(bandOf(nextStepOptions.cognitive)).toBe('core')
    expect(cognitiveLoad(nextStepOptions.cognitive)).toBeLessThanOrEqual(4)
  })

  it('LOCKED: sólo se evalúa viabilidad; la preferencia no puntúa nunca', () => {
    expect(nextStepOptions.scoring?.team).toBe('none')
    expect(nextStepOptions.scoring?.aura).toBe('none')
    const truth = SCENARIOS.map((entry, index) => ({
      statementId: entry.id,
      labelId: fitsScenario(sample, index) ? 'entra' : 'no-entra',
    }))
    const preferences = [...SCENARIOS.map((entry) => entry.id), 'sin-decidir']
    const results = preferences.map((preference) => {
      const result = evaluateNextStep(sample, truth, preference)
      if (!result.ok) throw new Error('evaluación rechazada')
      return result.value
    })
    // Ninguna preferencia cambia la calidad, ni mueve carrera de ninguna forma.
    expect(new Set(results.map((entry) => entry.quality))).toEqual(
      new Set(['optimal']),
    )
    for (const result of results) {
      expect(result.careerEffects.aura).toBeUndefined()
      expect(result.careerEffects.equipo).toBeUndefined()
      expect(result.careerEffects.estilo).toBeUndefined()
      expect(Object.keys(result.careerEffects)).toHaveLength(0)
    }
    // Y queda registrada, que es lo único que hace.
    expect(
      results[0]?.flagEffects.some(
        (effect) => effect.flag === 'y5.nextStep.preference',
      ),
    ).toBe(true)
  })

  it('compara escenarios ya escritos: no hay nada que construir', () => {
    for (const params of steps.slice(0, 40)) {
      const viable = SCENARIOS.filter((_, index) =>
        fitsScenario(params, index),
      ).length
      expect(viable).toBeGreaterThanOrEqual(2)
      expect(viable).toBeLessThan(SCENARIOS.length)
      const reasons = new Set(
        SCENARIOS.map((_, index) => blockedBy(params, index)).filter(
          (reason) => reason !== undefined,
        ),
      )
      expect(reasons.size).toBeGreaterThanOrEqual(2)
    }
  })

  it('marcar como viable algo que no entra es el error que invalida', () => {
    const impossible = SCENARIOS.findIndex(
      (_, index) => !fitsScenario(sample, index),
    )
    const entries = SCENARIOS.map((entry, index) => ({
      statementId: entry.id,
      labelId:
        index === impossible
          ? 'entra'
          : fitsScenario(sample, index)
            ? 'entra'
            : 'no-entra',
    }))
    const result = evaluateNextStep(sample, entries, 'sin-decidir')
    expect(result.ok && result.value.quality).toBe('invalid')
    expect(
      nextStepPlans(sample).some((plan) => plan.quality === 'optimal'),
    ).toBe(true)
    expect(evaluateNextStep(sample, entries, 'irme-de-viaje').ok).toBe(false)
  })
})
