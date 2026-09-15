import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  COURT_SPACE,
  POSTS,
  bestSpread,
  coveredCells,
  courtGates,
  courtPlans,
  courtZones,
  evaluateCourt,
  generateCourt,
  playable,
  tierOf,
  type CourtParams,
} from '@/content/grade-2/challenges/court-zones'

const approved: readonly CourtParams[] = Array.from(
  { length: COURT_SPACE },
  (_, index) => generateCourt(index),
).filter((params) => courtGates(params).length === 0)

const place = (spots: readonly { x: number; y: number }[]) =>
  POSTS.map((post, index) => ({
    objectId: post.id,
    x: spots[index]?.x ?? 0,
    y: spots[index]?.y ?? 0,
    rotation: 0 as const,
  }))

describe('2.º · las postas de la cancha', () => {
  it('aprueba un catálogo suficiente en las tres formas y es la geometría STRETCH del año', () => {
    expect(approved.length).toBeGreaterThanOrEqual(12)
    expect(new Set(approved.map((p) => p.shape))).toEqual(
      new Set(['separation', 'margin', 'covered']),
    )
    expect(courtZones.band).toBe('stretch')
    expect(bandOf(courtZones.cognitive)).toBe('stretch')
    expect(cognitiveLoad(courtZones.cognitive)).toBeGreaterThan(7)
    expect(courtZones.composition).toMatchObject({
      primaryReasoningFamily: 'SPATIAL',
      interactionEngine: 'spatial-graph',
      pacingClass: 'DEEP',
      eventCluster: 'intercurso',
    })
  })

  it('la distancia decide: es zonas y distancias, no encastre por tamaño', () => {
    for (const post of POSTS.map((p) => p)) expect(post.code).toHaveLength(1)
    for (const p of approved) {
      // Todas las postas ocupan una celda: el tamaño no es la restricción.
      const cells = playable(p)
      expect(cells.length).toBeGreaterThanOrEqual(POSTS.length)
      // Pegadas es inválido aunque entren de sobra en la cancha.
      const together = place([
        cells[0]!,
        { x: cells[0]!.x + 1, y: cells[0]!.y },
        { x: cells[0]!.x, y: cells[0]!.y + 1 },
      ])
      const result = evaluateCourt(p, together)
      expect(result.ok && result.value.quality).toBe('invalid')
    }
  })

  it('la escalera son condiciones escritas y el óptimo siempre es alcanzable', () => {
    for (const p of approved) {
      expect(tierOf(p, p.apart - 1)).toBe('invalid')
      expect(tierOf(p, p.apart)).toBe('functional')
      expect(tierOf(p, p.apart + 1)).toBe('efficient')
      expect(tierOf(p, p.apart + 2)).toBe('optimal')
      expect(bestSpread(p)).toBeGreaterThanOrEqual(p.apart + 2)
    }
  })

  it('la búsqueda descendente coincide con enumerar todas las ubicaciones', () => {
    for (const p of approved.slice(0, 4)) {
      let brute = 0
      for (const plan of courtPlans(p))
        if (plan.quality !== 'invalid') brute = Math.max(brute, plan.spread)
      expect(bestSpread(p)).toBe(brute)
    }
  })

  it('el evaluador coincide con el oráculo en un espacio completo de ubicaciones', () => {
    const p = approved[0]!
    for (const plan of courtPlans(p).slice(0, 4000)) {
      const result = evaluateCourt(p, plan.placements)
      expect(result.ok && result.value.quality).toBe(plan.quality)
    }
  })

  it('el sector techado obliga a la posta de saque cuando la forma lo declara', () => {
    for (const p of approved.filter((entry) => entry.shape === 'covered')) {
      const covered = coveredCells(p)
      expect(covered.length).toBeGreaterThan(0)
      const outside = playable(p).find(
        (cell) => !covered.some((c) => c.x === cell.x && c.y === cell.y),
      )
      if (outside === undefined) continue
      const far = playable(p).filter(
        (cell) =>
          Math.max(
            Math.abs(cell.x - outside.x),
            Math.abs(cell.y - outside.y),
          ) >=
          p.apart + 2,
      )
      if (far.length < 2) continue
      const result = evaluateCourt(p, place([outside, far[0]!, far[1]!]))
      expect(result.ok && result.value.quality).toBe('invalid')
    }
  })

  it('cierra la frontera de payload antes de medir distancias', () => {
    const p = approved[0]!
    const cells = playable(p)
    for (const bad of [
      [],
      place([cells[0]!]).slice(0, 1),
      [
        { objectId: POSTS[0].id, x: 0, y: 0, rotation: 0 as const },
        { objectId: POSTS[0].id, x: 1, y: 1, rotation: 0 as const },
        { objectId: POSTS[1].id, x: 2, y: 2, rotation: 0 as const },
      ],
    ])
      expect(evaluateCourt(p, bad).ok).toBe(false)
  })
})
