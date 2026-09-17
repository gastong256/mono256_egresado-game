import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import { materializeVariant } from '@/game/testing'
import { candidateAxes } from '@/content/authoring'
import {
  OPTIONS,
  PASS_RADICES,
  PASS_SPACE,
  PASS_STRIDE,
  REVIEW_SPACE,
  breakEvenTrips,
  cheapestAt,
  costOf,
  evaluatePass,
  evaluateReview,
  fixedVariableReview,
  generateReview,
  likelyGap,
  passChoices,
  passPricesAt,
  passSchema,
  reviewGates,
  tierOf,
  transportPass,
  tripRange,
  type OptionId,
  type PassParams,
} from '@/content/grade-3/challenges/transport-pass'
import {
  createGrade3Dependencies,
  grade3VariantCatalog,
} from '@/content/grade-3'
import { publishedParams } from '../helpers/published-params'

const published: readonly PassParams[] = publishedParams(
  createGrade3Dependencies(),
  grade3VariantCatalog,
  'y3.transport-pass',
  (params) => passSchema.parse(params),
)

const optimalOf = (p: PassParams) =>
  passChoices(p).find((choice) => choice.quality === 'optimal')?.optionId

describe('3.º · cómo pagar el colectivo', () => {
  it('publica un catálogo suficiente en varias formas de mes y es el CORE del año', () => {
    expect(published.length).toBeGreaterThanOrEqual(24)
    expect(PASS_SPACE).toBeGreaterThan(published.length)
    // Template de alto riesgo: al menos cuatro formas semánticas publicadas.
    expect(new Set(published.map((p) => p.shape)).size).toBeGreaterThanOrEqual(
      4,
    )
    expect(transportPass.band).toBe('core')
    expect(bandOf(transportPass.cognitive)).toBe('core')
    expect(cognitiveLoad(transportPass.cognitive)).toBeLessThanOrEqual(4)
    expect(transportPass.composition).toMatchObject({
      primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
      interactionEngine: 'choice-compare',
      pacingClass: 'QUICK',
    })
  })

  it('RS-MAT-001: ningún precio depende de los viajes del mes', () => {
    // Dos direcciones que sólo difieren en la forma del mes tienen los mismos
    // precios: la forma es un eje y los precios, otros.
    const groups = new Map<string, Set<string>>()
    for (let index = 0; index < 4000; index++) {
      const axes = candidateAxes(index, PASS_RADICES, PASS_STRIDE)
      const p = passPricesAt(index)
      const key = axes.slice(1).join('.')
      const prices = [
        p.ticket,
        p.card,
        p.fare,
        p.combo,
        p.included,
        p.extra,
        p.pass,
      ].join('.')
      const seen = groups.get(key) ?? new Set<string>()
      seen.add(prices)
      groups.set(key, seen)
    }
    for (const prices of groups.values()) expect(prices.size).toBe(1)
  })

  it('RS-MAT-001: existe un mes de pocos viajes donde el boleto suelto es lo más barato', () => {
    expect(published.some((p) => p.shape === 'pocos-viajes')).toBe(true)
    expect(
      published.some(
        (p) => p.shape === 'pocos-viajes' && optimalOf(p) === 'suelto',
      ),
    ).toBe(true)
  })

  it('RS-MAT-001: cada forma de pago es la óptima en al menos 3 variantes y ninguna en más del 40 %', () => {
    for (const option of OPTIONS) {
      const count = published.filter((p) => optimalOf(p) === option.id).length
      expect(count).toBeGreaterThanOrEqual(3)
      expect(count * 100).toBeLessThanOrEqual(published.length * 40)
    }
  })

  it('RS-MAT-001: en al menos el 30 % del catálogo el cambio de conveniencia está a 3 viajes o menos de lo esperado', () => {
    const near = published.filter((p) => {
      const trips = tripRange(p)
      const winners = trips.map((n) => cheapestAt(p, n))
      const crossings = trips.filter(
        (_, k) => k > 0 && winners[k] !== winners[k - 1],
      )
      return crossings.some((n) => Math.abs(n - p.likely) <= 3)
    })
    expect(near.length * 100).toBeGreaterThanOrEqual(published.length * 30)
  })

  it('RS-MAT-001: la más barata le saca a la segunda al menos $100 y el 2 %', () => {
    for (const p of published) {
      const costs = OPTIONS.map((o) => costOf(p, o.id, p.likely)).sort(
        (a, b) => a - b,
      )
      const gap = costs[1]! - costs[0]!
      expect(gap).toBeGreaterThanOrEqual(100)
      expect(gap * 50).toBeGreaterThanOrEqual(costs[0]!)
      expect(likelyGap(p)).toEqual({ gap, cheapest: costs[0] })
    }
  })

  it('RS-MAT-001: la pantalla dice que se decide con los viajes del mes pasado', () => {
    const entry = grade3VariantCatalog.entries.find(
      (candidate) => (candidate.templateId as string) === 'y3.transport-pass',
    )!
    const instance = materializeVariant(transportPass, {
      variantId: entry.variantId,
      seed: 'regla',
    })
    expect(instance.narrative.setup).toContain(
      'Los viajes del mes pasado son tu mejor estimación',
    )
    expect(instance.narrative.setup).toContain(
      'el rango dice cuánto puede cambiar',
    )
    expect(instance.narrative.goal).toContain(
      'si este mes viajás como el pasado',
    )
  })

  it('RS-MAT-001: el feedback de una apuesta dice hacia dónde gana esa forma de pago, y es cierto', () => {
    let checked = 0
    for (const p of published)
      for (const option of OPTIONS) {
        if (tierOf(p, option.id) !== 'efficient') continue
        const wins = tripRange(p).filter((n) => cheapestAt(p, n) === option.id)
        const below = wins.filter((n) => n < p.likely)
        const above = wins.filter((n) => n > p.likely)
        const result = evaluatePass(p, option.id)
        if (!result.ok) throw new Error('evaluación rechazada')
        const text = result.value.feedback.consequence ?? ''
        if (below.length > 0)
          expect(text).toContain(
            `viajás ${String(Math.max(...below))} veces o menos`,
          )
        else expect(text).not.toContain('o menos')
        if (above.length > 0)
          expect(text).toContain(
            `viajás ${String(Math.min(...above))} veces o más`,
          )
        else expect(text).not.toContain('o más')
        checked += 1
      }
    expect(checked).toBeGreaterThanOrEqual(published.length)
  })

  it('RS-MAT-001: las reglas alternativas —peor caso y costo medio— nunca eligen la forma inválida', () => {
    for (const p of published) {
      const trips = tripRange(p)
      const worst = (o: OptionId) =>
        Math.max(...trips.map((n) => costOf(p, o, n)))
      const mean = (o: OptionId) =>
        trips.reduce((total, n) => total + costOf(p, o, n), 0)
      const pick = (measure: (o: OptionId) => number) =>
        OPTIONS.map((o) => o.id).reduce((a, b) =>
          measure(b) < measure(a) ? b : a,
        )
      expect(tierOf(p, pick(worst))).not.toBe('invalid')
      expect(tierOf(p, pick(mean))).not.toBe('invalid')
    }
  })

  it('LOCKED: la conveniencia cambia dentro del rango posible de viajes', () => {
    for (const params of published) {
      const winners = new Set(
        tripRange(params).map((trips) => cheapestAt(params, trips)),
      )
      expect(winners.size).toBeGreaterThan(1)
      expect(winners.has(undefined)).toBe(false)
    }
  })

  it('la elección equivocada cuesta más que la correcta en todo el rango', () => {
    for (const params of published) {
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

  it('el evaluador reproduce la escalera del oráculo y rechaza lo que no es una opción', () => {
    for (const params of published) {
      for (const choice of passChoices(params)) {
        const result = evaluatePass(params, choice.optionId)
        expect(result.ok).toBe(true)
        if (result.ok) expect(result.value.quality).toBe(choice.quality)
      }
    }
    expect(evaluatePass(published[0]!, 'bicicleta').ok).toBe(false)
  })

  it('no reparte Equipo, Aura ni Estilo: la decisión es de una persona sobre su mes', () => {
    expect(transportPass.scoring?.team).toBe('none')
    expect(transportPass.scoring?.aura).toBe('none')
    const params = published[0]
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
