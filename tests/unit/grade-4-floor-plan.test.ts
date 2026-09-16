import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  CAPACITY_REVIEW_SPACE,
  FLOOR_SPACE,
  SEATS_PER_TABLE,
  ZONES,
  capacityReviewGates,
  evaluateCapacityReview,
  evaluateFloor,
  eventFloorPlan,
  floorGates,
  floorSearch,
  generateCapacityReview,
  generateFloor,
  readFloor,
  seatsThatFit,
  spatialCapacityReview,
  type FloorParams,
} from '@/content/grade-4/challenges/event-floor-plan'

const WINDOW = 120
const approved: readonly FloorParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateFloor(index),
).filter((params) => floorGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')
const witnesses = floorSearch(sample).witnesses

describe('4.º · el salón del evento', () => {
  it('aprueba un catálogo suficiente en las tres formas y es el STRETCH del año', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(FLOOR_SPACE).toBeGreaterThan(WINDOW)
    expect(new Set(approved.map((p) => p.shape)).size).toBe(3)
    expect(eventFloorPlan.band).toBe('stretch')
    expect(bandOf(eventFloorPlan.cognitive)).toBe('stretch')
    expect(cognitiveLoad(eventFloorPlan.cognitive)).toBeGreaterThan(7)
    expect(eventFloorPlan.composition).toMatchObject({
      primaryReasoningFamily: 'SPATIAL',
      interactionEngine: 'spatial-graph',
      pacingClass: 'DEEP',
      eventCluster: 'evento-escolar',
    })
  })

  it('LOCKED: la capacidad decide, y sacar una mesa deja el salón corto', () => {
    for (const params of approved.slice(0, 12)) {
      const minimum = floorSearch(params).witnesses.functional
      expect(minimum.length).toBeGreaterThan(0)
      const tables = minimum.filter((placement) => {
        const zone = ZONES.find((entry) => entry.id === placement.objectId)
        return zone !== undefined && zone.seats > 0
      })
      const dropped = tables[tables.length - 1]
      const withoutOne = minimum.filter((placement) => placement !== dropped)
      expect(readFloor(params, withoutOne).failure).toBe('capacidad')
    }
  })

  it('LOCKED: la circulación decide: una zona encerrada invalida el plano', () => {
    // Un plano que tapa el pasillo con una mesa no es un plano válido.
    const corridor = sample.corridor[0] ?? sample.door
    const blocking = evaluateFloor(sample, [
      { objectId: 'mesa-a', x: corridor.x, y: corridor.y, rotation: 0 },
    ])
    expect(blocking.ok && blocking.value.quality).toBe('invalid')
  })

  it('los tres niveles se alcanzan y cada uno agrega algo real', () => {
    for (const tier of ['functional', 'efficient', 'optimal'] as const) {
      const placements = witnesses[tier]
      expect(placements.length, tier).toBeGreaterThan(0)
      const read = readFloor(sample, placements)
      expect(read.quality).toBe(tier)
      expect(read.seats).toBeGreaterThanOrEqual(sample.guests)
    }
    expect(readFloor(sample, witnesses.optimal).seats).toBeGreaterThanOrEqual(
      sample.guests + SEATS_PER_TABLE,
    )
  })

  it('el evaluador rechaza una zona repetida o inventada', () => {
    expect(
      evaluateFloor(sample, [
        { objectId: 'mesa-a', x: 0, y: 0, rotation: 0 },
        { objectId: 'mesa-a', x: 2, y: 0, rotation: 0 },
      ]).ok,
    ).toBe(false)
    expect(
      evaluateFloor(sample, [{ objectId: 'pileta', x: 0, y: 0, rotation: 0 }])
        .ok,
    ).toBe(false)
    // Y un salón vacío es una respuesta legal y mala: no sienta a nadie.
    const empty = evaluateFloor(sample, [])
    expect(empty.ok && empty.value.quality).toBe('invalid')
  })
})

describe('4.º · Repaso de cuánta gente entra', () => {
  const reviews = Array.from({ length: CAPACITY_REVIEW_SPACE }, (_, index) =>
    generateCapacityReview(index),
  ).filter((params) => capacityReviewGates(params).length === 0)

  it('descuenta lo reservado antes de contar mesas', () => {
    expect(reviews.length).toBeGreaterThanOrEqual(24)
    for (const params of reviews) {
      const free = params.width * params.height - params.reserved
      expect(seatsThatFit(params)).toBe(Math.floor(free / 4) * SEATS_PER_TABLE)
      expect(Math.floor(free / 4)).not.toBe(
        Math.floor((params.width * params.height) / 4),
      )
    }
  })

  it('nombra el error de contar el salón entero', () => {
    const params = reviews[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    const exact = seatsThatFit(params)
    const whole =
      Math.floor((params.width * params.height) / 4) * SEATS_PER_TABLE
    expect(evaluateCapacityReview(params, String(exact)).ok).toBe(true)
    const wrong = evaluateCapacityReview(params, String(whole))
    expect(wrong.ok && wrong.value.quality).toBe('functional')
    expect(evaluateCapacityReview(params, '-4').ok).toBe(false)
    expect(spatialCapacityReview.placement).toBe('recovery')
    expect(spatialCapacityReview.scoring?.team).toBe('none')
  })
})
