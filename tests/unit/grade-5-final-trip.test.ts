import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  COMPARISON_REVIEW_SPACE,
  PACKAGES,
  TRIP_SPACE,
  blockedBy,
  comparisonReviewGates,
  evaluateComparisonReview,
  evaluateTrip,
  feasible,
  finalTripOrEvent,
  generateComparisonReview,
  generateTrip,
  includesWhatWasAsked,
  multiOptionComparisonReview,
  tierOf,
  totalWithBus,
  tripChoices,
  tripGates,
  type TripParams,
} from '@/content/grade-5/challenges/final-trip'

const WINDOW = 600
const approved: readonly TripParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateTrip(index),
).filter((params) => tripGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')

describe('5.º · el viaje', () => {
  it('aprueba un catálogo suficiente y es STRETCH del cluster de egreso', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(TRIP_SPACE).toBeGreaterThan(WINDOW)
    expect(finalTripOrEvent.band).toBe('stretch')
    expect(bandOf(finalTripOrEvent.cognitive)).toBe('stretch')
    expect(cognitiveLoad(finalTripOrEvent.cognitive)).toBeGreaterThan(7)
    expect(finalTripOrEvent.composition).toMatchObject({
      primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
      interactionEngine: 'choice-compare',
      eventCluster: 'egreso',
    })
  })

  it('LOCKED: deciden al menos dos datos además del precio', () => {
    for (const params of approved.slice(0, 60)) {
      // Lo que deja un paquete afuera nunca es sólo la plata…
      const reasons = new Set(
        PACKAGES.map((_, index) => blockedBy(params, index)).filter(
          (reason) => reason !== undefined,
        ),
      )
      expect(
        reasons.has('dias') || reasons.has('lugares'),
        JSON.stringify([...reasons]),
      ).toBe(true)
      // …y lo que incluye separa niveles entre los que sí se pueden hacer.
      expect(
        PACKAGES.some(
          (_, index) =>
            feasible(params, index) && !includesWhatWasAsked(params, index),
        ),
      ).toBe(true)
    }
  })

  it('LOCKED: el paquete más barato nunca es la respuesta', () => {
    for (const params of approved.slice(0, 60)) {
      const costs = params.offers.map((offer) => offer.cost)
      const cheapest = costs.indexOf(Math.min(...costs))
      expect(tierOf(params, cheapest)).not.toBe('optimal')
    }
  })

  it('el mejor paquete es único y cambia entre variantes', () => {
    const winners = new Set<string>()
    for (const params of approved.slice(0, 60)) {
      const optimal = tripChoices(params).filter(
        (choice) => choice.quality === 'optimal',
      )
      expect(optimal).toHaveLength(1)
      if (optimal[0] !== undefined) winners.add(optimal[0].packageId)
    }
    expect(winners.size).toBeGreaterThanOrEqual(3)
  })

  it('la plata es del curso: el desafío no pregunta por ninguna persona', () => {
    // El fondo, la reserva y los precios son del curso; no hay ningún dato
    // por persona en los parámetros.
    expect(Object.keys(sample)).toEqual(
      expect.arrayContaining(['fund', 'reserve', 'course', 'freeDays']),
    )
    expect(JSON.stringify(sample)).not.toContain('perPerson')
    expect(finalTripOrEvent.scoring?.team).toBe('none')
    expect(finalTripOrEvent.scoring?.aura).toBe('none')
  })

  it('el evaluador reproduce el oráculo y rechaza un paquete inventado', () => {
    for (const choice of tripChoices(sample)) {
      const result = evaluateTrip(sample, choice.packageId)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(choice.quality)
    }
    expect(evaluateTrip(sample, 'crucero').ok).toBe(false)
  })
})

describe('5.º · Repaso de lo que no está incluido', () => {
  const reviews = Array.from({ length: COMPARISON_REVIEW_SPACE }, (_, index) =>
    generateComparisonReview(index),
  ).filter((params) => comparisonReviewGates(params).length === 0)

  it('un precio por persona se multiplica antes de sumarse', () => {
    expect(reviews.length).toBeGreaterThanOrEqual(24)
    const params = reviews[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    const exact = totalWithBus(params)
    expect(exact).toBe(params.packagePrice + params.perPerson * params.people)
    const right = evaluateComparisonReview(params, String(exact))
    expect(right.ok && right.value.quality).toBe('optimal')
    const once = evaluateComparisonReview(
      params,
      String(params.packagePrice + params.perPerson),
    )
    expect(once.ok && once.value.quality).toBe('functional')
    expect(evaluateComparisonReview(params, 'mucho').ok).toBe(false)
    expect(multiOptionComparisonReview.placement).toBe('recovery')
  })
})
