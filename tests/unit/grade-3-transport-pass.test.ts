import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  OPTIONS,
  PASS_SPACE,
  REVIEW_SPACE,
  breakEvenTrips,
  cheapestAt,
  costOf,
  evaluatePass,
  evaluateReview,
  fixedVariableReview,
  generatePass,
  generateReview,
  passChoices,
  passGates,
  reviewGates,
  transportPass,
  tripRange,
  type PassParams,
} from '@/content/grade-3/challenges/transport-pass'
import { grade3VariantCatalog } from '@/content/grade-3'

/**
 * Una ventana del espacio de candidatas, no el espacio entero.
 *
 * Barrer los once mil quinientos meses posibles en cada corrida sería repetir
 * acá lo que el pipeline ya hace al aprobar; `pnpm game:variants check` cubre
 * el resto.
 */
const WINDOW = 1_200
const approved: readonly PassParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generatePass(index),
).filter((params) => passGates(params).length === 0)

/** Las primeras que el catálogo publicaría: es lo que un jugador puede ver. */
const published = Array.from({ length: 400 }, (_, index) => generatePass(index))
  .filter((params) => passGates(params).length === 0)
  .slice(0, 24)

describe('3.º · cómo pagar el colectivo', () => {
  it('aprueba un catálogo suficiente en los cinco meses y es el CORE del año', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(PASS_SPACE).toBeGreaterThan(WINDOW)
    expect(new Set(approved.map((p) => p.shape)).size).toBe(5)
    expect(transportPass.band).toBe('core')
    expect(bandOf(transportPass.cognitive)).toBe('core')
    expect(cognitiveLoad(transportPass.cognitive)).toBeLessThanOrEqual(4)
    expect(transportPass.composition).toMatchObject({
      primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
      interactionEngine: 'choice-compare',
      pacingClass: 'QUICK',
    })
  })

  it('LOCKED: la conveniencia cambia dentro del rango posible de viajes', () => {
    for (const params of approved) {
      const winners = new Set(
        tripRange(params).map((trips) => cheapestAt(params, trips)),
      )
      expect(winners.size).toBeGreaterThan(1)
      expect(winners.has(undefined)).toBe(false)
    }
  })

  it('la elección equivocada cuesta más que la correcta en todo el rango', () => {
    for (const params of approved) {
      const choices = passChoices(params)
      const best = choices.find((choice) => choice.quality === 'optimal')
      const wrong = choices.find((choice) => choice.quality === 'invalid')
      expect(best).toBeDefined()
      expect(wrong).toBeDefined()
      if (best === undefined || wrong === undefined) continue
      for (const trips of tripRange(params))
        expect(costOf(params, wrong.optionId, trips)).toBeGreaterThan(
          costOf(params, best.optionId, trips),
        )
    }
  })

  it('no se contesta de memoria: ninguna opción es la correcta en más de la mitad del catálogo publicado', () => {
    const winners = new Map<string, number>()
    for (const params of published) {
      const best = passChoices(params).find(
        (choice) => choice.quality === 'optimal',
      )
      if (best !== undefined)
        winners.set(best.optionId, (winners.get(best.optionId) ?? 0) + 1)
    }
    expect(published.length).toBe(24)
    expect(winners.size).toBeGreaterThanOrEqual(3)
    for (const count of winners.values())
      expect(count).toBeLessThanOrEqual(published.length / 2)
  })

  it('el evaluador reproduce la escalera del oráculo y rechaza lo que no es una opción', () => {
    const params = approved[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    for (const choice of passChoices(params)) {
      const result = evaluatePass(params, choice.optionId)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(choice.quality)
    }
    const rejected = evaluatePass(params, 'bicicleta')
    expect(rejected.ok).toBe(false)
  })

  it('no reparte Equipo, Aura ni Estilo: la decisión es de una persona sobre su mes', () => {
    expect(transportPass.scoring?.team).toBe('none')
    expect(transportPass.scoring?.aura).toBe('none')
    const params = approved[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    for (const option of OPTIONS) {
      const result = evaluatePass(params, option.id)
      if (!result.ok) throw new Error('evaluación rechazada')
      expect(result.value.careerEffects.estilo).toBeUndefined()
      expect(result.value.careerEffects.equipo).toBeUndefined()
      expect(result.value.careerEffects.aura).toBeUndefined()
    }
  })
})

describe('3.º · Repaso de costo fijo y costo por viaje', () => {
  const reviews = Array.from({ length: REVIEW_SPACE }, (_, index) =>
    generateReview(index),
  ).filter((params) => reviewGates(params).length === 0)

  it('el umbral es el primer viaje en el que el abono ya salió más barato', () => {
    expect(reviews.length).toBeGreaterThanOrEqual(24)
    for (const params of reviews) {
      const exact = breakEvenTrips(params)
      expect(params.ticket * (exact - 1)).toBeLessThan(params.pass)
      expect(params.ticket * exact).toBeGreaterThan(params.pass)
    }
  })

  it('nombra el error de quedarse en la parte entera en vez de marcarlo mal', () => {
    const params = reviews[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    const exact = breakEvenTrips(params)
    const justo = evaluateReview(params, String(exact))
    const entero = evaluateReview(params, String(exact - 1))
    const lejos = evaluateReview(params, String(exact + 9))
    expect(justo.ok && justo.value.quality).toBe('optimal')
    expect(entero.ok && entero.value.quality).toBe('functional')
    expect(lejos.ok && lejos.value.quality).toBe('invalid')
    expect(entero.ok && entero.value.feedback.violatedConstraint).toContain(
      'todavía menos',
    )
    const rechazado = evaluateReview(params, 'nueve')
    expect(rechazado.ok).toBe(false)
  })

  it('es contenido de recuperación y no aporta evidencia competitiva', () => {
    expect(fixedVariableReview.placement).toBe('recovery')
    expect(fixedVariableReview.scoring?.team).toBe('none')
    expect(fixedVariableReview.scoring?.aura).toBe('none')
    const entries = grade3VariantCatalog.entries.filter(
      (entry) => entry.templateId === 'y3.fixed-variable-review',
    )
    expect(entries.length).toBeGreaterThanOrEqual(12)
  })
})
