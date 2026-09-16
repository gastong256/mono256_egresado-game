import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  BLOCKS,
  DAY,
  DAY_SPACE,
  dayGates,
  dayPlans,
  evaluateDay,
  friendDay,
  generateFriendDay,
  readDay,
  startsOf,
  type FriendDayParams,
} from '@/content/grade-3/challenges/friend-day'

/**
 * Una ventana del espacio de candidatas, no el espacio entero.
 *
 * Cada candidata enumera diecisiete mil tardes para responder sus gates, así
 * que barrer las mil trescientas acá sería repetir en cada corrida lo que el
 * pipeline ya hace al aprobar. La ventana alcanza para las afirmaciones de este
 * archivo y `pnpm game:variants check` cubre el resto.
 */
const WINDOW = 120
const approved: readonly FriendDayParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateFriendDay(index),
).filter((params) => dayGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')
const plans = dayPlans(sample)

describe('3.º · el Día del Amigo', () => {
  it('aprueba un catálogo suficiente en las tres formas y es STANDARD', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(DAY_SPACE).toBeGreaterThan(WINDOW)
    expect(new Set(approved.map((p) => p.shape))).toEqual(
      new Set(['ventana-corta', 'traslado-largo', 'gustos-cruzados']),
    )
    expect(friendDay.band).toBe('standard')
    expect(bandOf(friendDay.cognitive)).toBe('standard')
    expect(cognitiveLoad(friendDay.cognitive)).toBeLessThanOrEqual(7)
    expect(friendDay.composition).toMatchObject({
      primaryReasoningFamily: 'TEMPORAL',
      interactionEngine: 'timeline-schedule',
      pacingClass: 'MEDIUM',
    })
  })

  it('LOCKED: Math y Equipo son evidencias distintas sobre la misma tarde', () => {
    for (const params of approved.slice(0, 10)) {
      const all = dayPlans(params)
      const optimal = all.filter((plan) => plan.quality === 'optimal')
      // Varias tardes impecables con consecuencias distintas para el grupo.
      expect(new Set(optimal.map((plan) => plan.team)).size).toBeGreaterThan(1)
      // Y el Equipo máximo se alcanza sin que la calidad lo garantice.
      expect(
        all.some((plan) => plan.quality !== 'invalid' && plan.team === 3),
      ).toBe(true)
      expect(
        all.some((plan) => plan.quality !== 'invalid' && plan.team <= 1),
      ).toBe(true)
    }
  })

  it('una tarde inválida no reparte Equipo ni etiqueta una estrategia', () => {
    for (const plan of plans)
      if (plan.quality === 'invalid') {
        expect(plan.team).toBe(0)
        expect(plan.style).toBeUndefined()
      }
  })

  it('no alcanza con encontrar la única franja libre', () => {
    const valid = plans.filter((plan) => plan.quality !== 'invalid')
    expect(valid.length).toBeGreaterThan(8)
  })

  it('la disponibilidad de otra persona decide, no sólo el reloj', () => {
    // Una tarde legal por horarios deja de serlo si el bloque necesita a
    // alguien que todavía no llegó.
    const needy = approved.find((params) =>
      Object.values(params.needs).some((ids) => ids.length > 0),
    )
    if (needy === undefined) throw new Error('ninguna variante pide presencia')
    const blocked = dayPlans(needy).filter((plan) => plan.quality === 'invalid')
    expect(blocked.length).toBeGreaterThan(0)
  })

  it('el evaluador reproduce el oráculo y rechaza un horario fuera de contrato', () => {
    for (const quality of ['optimal', 'efficient', 'functional'] as const) {
      const plan = plans.find((entry) => entry.quality === quality)
      if (plan === undefined) throw new Error(`falta un plan ${quality}`)
      const result = evaluateDay(sample, plan.placements)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.quality).toBe(quality)
        expect(result.value.metrics.efficiency).toBeCloseTo(
          readDay(sample, plan.placements).team / 3,
        )
      }
    }
    const first = BLOCKS[0]
    if (first === undefined) throw new Error('sin bloques')
    const outOfContract = evaluateDay(sample, [
      { activityId: first.id, startMinute: DAY.from + 7 },
    ])
    expect(outOfContract.ok).toBe(false)
    expect(startsOf(first)).not.toContain(DAY.from + 7)
  })
})
