import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  CREW,
  SHIFTS,
  SHIFT_SPACE,
  evaluateShifts,
  generateShifts,
  readShifts,
  shiftCoverage,
  shiftGates,
  shiftPlans,
  type ShiftParams,
} from '@/content/grade-4/challenges/shift-coverage'

const approved: readonly ShiftParams[] = Array.from(
  { length: SHIFT_SPACE },
  (_, index) => generateShifts(index),
).filter((params) => shiftGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')
const plans = shiftPlans(sample)

describe('4.º · los turnos del evento', () => {
  it('aprueba un catálogo suficiente en las tres formas y es el CORE del año', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(new Set(approved.map((p) => p.shape)).size).toBe(3)
    expect(shiftCoverage.band).toBe('core')
    expect(bandOf(shiftCoverage.cognitive)).toBe('core')
    expect(cognitiveLoad(shiftCoverage.cognitive)).toBeLessThanOrEqual(4)
    expect(shiftCoverage.composition).toMatchObject({
      primaryReasoningFamily: 'ALLOCATION',
      interactionEngine: 'allocate-constrain',
      pacingClass: 'QUICK',
      eventCluster: 'evento-escolar',
    })
  })

  it('LOCKED: varios cronogramas Math-valid dejan Equipo distinto', () => {
    for (const params of approved.slice(0, 20)) {
      const all = shiftPlans(params)
      const optimal = all.filter((plan) => plan.quality === 'optimal')
      expect(new Set(optimal.map((plan) => plan.team)).size).toBeGreaterThan(1)
      expect(
        all.some((plan) => plan.quality !== 'invalid' && plan.team === 3),
      ).toBe(true)
      expect(
        all.some((plan) => plan.quality !== 'invalid' && plan.team <= 1),
      ).toBe(true)
    }
  })

  it('la escalera mira el tiempo: descanso primero, relevos después', () => {
    const noRest = plans.find(
      (plan) =>
        plan.quality === 'functional' &&
        readShifts(sample, plan.assignments).noRest,
    )
    expect(noRest).toBeDefined()
    for (const plan of plans) {
      const read = readShifts(sample, plan.assignments)
      if (plan.quality === 'optimal') {
        expect(read.noRest).toBe(false)
        expect(read.worstPost).toBeLessThanOrEqual(1)
      }
      if (plan.quality === 'functional') expect(read.noRest).toBe(true)
    }
  })

  it('cubrir los turnos no compra el crédito social', () => {
    // Existe un cronograma impecable que deja a alguien afuera, y uno más
    // flojo que cumple los tres acuerdos.
    expect(
      plans.some((plan) => plan.quality === 'optimal' && plan.team <= 1),
    ).toBe(true)
    expect(
      plans.some((plan) => plan.quality === 'efficient' && plan.team === 3),
    ).toBe(true)
  })

  it('un cronograma inválido no reparte Equipo', () => {
    for (const plan of plans)
      if (plan.quality === 'invalid') expect(plan.team).toBe(0)
  })

  it('el evaluador reproduce el oráculo y rechaza un turno fuera de contrato', () => {
    for (const quality of ['optimal', 'efficient', 'functional'] as const) {
      const plan = plans.find((entry) => entry.quality === quality)
      if (plan === undefined) throw new Error(`falta un plan ${quality}`)
      const result = evaluateShifts(sample, plan.assignments)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(quality)
    }
    const first = SHIFTS[0]
    const person = CREW[0]
    if (first === undefined || person === undefined)
      throw new Error('sin datos')
    expect(
      evaluateShifts(sample, [
        { agentId: person.id, taskId: first.id },
        { agentId: person.id, taskId: first.id },
      ]).ok,
    ).toBe(false)
    expect(
      evaluateShifts(sample, [{ agentId: 'fantasma', taskId: first.id }]).ok,
    ).toBe(false)
  })
})
