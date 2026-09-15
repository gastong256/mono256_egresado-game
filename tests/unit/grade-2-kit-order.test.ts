import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { bandOf, cognitiveLoad, parseCommand } from '@/game'
import {
  KIT_ORDER_SPACE,
  TEAMS,
  evaluateKitOrder,
  generateKitOrder,
  kitGates,
  kitOrderSchema,
  kitPlans,
  spareShare,
  teamKitOrder,
  type KitOrderParams,
} from '@/content/grade-2/challenges/team-kit-order'

/** Every address the authoring gates accept, which is what the pipeline approves. */
const approved: readonly KitOrderParams[] = Array.from(
  { length: KIT_ORDER_SPACE },
  (_, index) => generateKitOrder(index),
).filter((params) => kitGates(params).length === 0)

const lines = (ordered: readonly number[]) =>
  TEAMS.map((team, index) => ({
    itemId: team.id,
    quantity: ordered[index] ?? 0,
  }))
const evaluate = (p: KitOrderParams, ordered: readonly number[]) => {
  const result = evaluateKitOrder(p, lines(ordered))
  if (!result.ok) throw new Error(result.error.kind)
  return result.value
}
const total = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0)

describe('2.º · el pedido de pecheras', () => {
  it('aprueba un catálogo suficiente en las tres formas semánticas', () => {
    expect(approved.length).toBeGreaterThanOrEqual(12)
    const shapes = new Set(approved.map((params) => params.shape))
    expect(shapes).toEqual(
      new Set(['exact-share', 'remainder', 'stock-capped']),
    )
    for (const shape of shapes)
      expect(
        approved.filter((params) => params.shape === shape).length,
      ).toBeGreaterThanOrEqual(8)
  })

  it('usa el modelo vigente: CORE, sin optimización y sin evidencia competitiva extra', () => {
    expect(cognitiveLoad(teamKitOrder.cognitive)).toBe(4)
    expect(teamKitOrder.band).toBe('core')
    expect(teamKitOrder.cognitive.optimization).toBe(0)
    expect(teamKitOrder.composition).toMatchObject({
      primaryReasoningFamily: 'ALLOCATION',
      interactionEngine: 'allocate-constrain',
      pacingClass: 'QUICK',
    })
    expect(teamKitOrder.scoring.team).toBe('none')
    expect(teamKitOrder.scoring.aura).toBe('none')
    // El cluster Intercurso es plan/standings/zonas: el pedido no lo integra.
    expect(teamKitOrder.composition?.eventCluster).toBeUndefined()
  })

  it.each(approved.slice(0, 24).map((p, i) => [i, p] as const))(
    '%s: el oráculo independiente coincide con el evaluador en todo el espacio de pedidos',
    (_, p) => {
      for (const plan of kitPlans(p)) {
        const result = evaluateKitOrder(p, plan.lines)
        expect(result.ok && result.value.quality).toBe(plan.quality)
        expect(result.ok && result.value.careerEffects).toEqual({})
      }
    },
  )

  it('Intrinsic Math Gate: el reparto parejo nunca es el pedido acordado', () => {
    for (const p of approved) {
      const even = TEAMS.map(() => Math.floor(p.spares / TEAMS.length))
      let rest = p.spares - total(even)
      for (let i = 0; i < even.length && rest > 0; i++, rest--)
        even[i] = (even[i] ?? 0) + 1
      const ordered = p.players.map(
        (count, index) => count + (even[index] ?? 0),
      )
      // Un reparto parejo que ni siquiera cabe en el stock es todavía más
      // claro: el contrato lo rechaza antes de llegar a la matemática.
      const result = evaluateKitOrder(p, lines(ordered))
      if (result.ok) expect(result.value.quality).not.toBe('optimal')
      else expect(result.error.kind).toBe('invalid-answer')
    }
  })

  it('el reparto acordado cubre a todos, respeta stock y coloca todos los repuestos', () => {
    for (const p of approved) {
      const room = p.players.map(
        (count, index) => (p.stock[index] ?? 0) - count,
      )
      const share = spareShare(p.players, p.spares, room)
      expect(total(share)).toBe(p.spares)
      share.forEach((value, index) => {
        expect(value).toBeLessThanOrEqual(room[index] ?? 0)
      })
      const ordered = p.players.map(
        (count, index) => count + (share[index] ?? 0),
      )
      expect(evaluate(p, ordered).quality).toBe('optimal')
      expect(total(ordered)).toBeLessThanOrEqual(p.cap)
    }
  })

  it('rechaza dejar gente sin pechera, pasarse del stock y quedarse corto de repuestos', () => {
    for (const p of approved) {
      expect(evaluate(p, [0, 0, 0]).quality).toBe('invalid')
      expect(evaluate(p, [...p.players]).quality).toBe('invalid')
      // Cubrir de menos a un equipo es inválido aunque el resto sobre.
      const short = p.players.map((count, index) =>
        index === 0
          ? count - 1
          : Math.min(count + p.spares, p.stock[index] ?? 0),
      )
      expect(evaluate(p, short).quality).toBe('invalid')
    }
    const p = approved[0]!
    for (const bad of [
      [
        { itemId: TEAMS[0].id, quantity: 1 },
        { itemId: TEAMS[0].id, quantity: 1 },
      ],
      [{ itemId: 'fantasma', quantity: 1 }],
      [{ itemId: TEAMS[0].id, quantity: -1 }],
    ])
      expect(evaluateKitOrder(p, bad).ok).toBe(false)
    expect(
      parseCommand({
        type: 'ANSWER',
        instanceId: 'test',
        answer: { kind: 'quantity-builder', lines: [], team: 3 },
      }).ok,
    ).toBe(false)
  })

  it('propiedad: sólo cobertura, stock, tope y reparto deciden; el orden de las líneas no importa', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: approved.length - 1 }),
        fc.tuple(
          fc.integer({ min: 0, max: 30 }),
          fc.integer({ min: 0, max: 30 }),
          fc.integer({ min: 0, max: 30 }),
        ),
        (index, ordered) => {
          const p = approved[index]!
          const capped = ordered.map((value, i) =>
            Math.min(value, p.stock[i] ?? 0),
          )
          const direct = evaluateKitOrder(p, lines(capped))
          expect(direct).toEqual(
            evaluateKitOrder(p, [...lines(capped)].reverse()),
          )
          const plan = kitPlans(p).find((entry) =>
            entry.ordered.every((value, i) => value === capped[i]),
          )
          if (plan !== undefined)
            expect(direct.ok && direct.value.quality).toBe(plan.quality)
        },
      ),
      { numRuns: 400 },
    )
  })

  it('la banda se deriva del modelo y una variante más exigente dejaría de ser CORE', () => {
    expect(bandOf({ ...teamKitOrder.cognitive, optimization: 2 })).not.toBe(
      'core',
    )
    for (const p of approved.slice(0, 40))
      expect(kitOrderSchema.safeParse(p).success).toBe(true)
  })
})
