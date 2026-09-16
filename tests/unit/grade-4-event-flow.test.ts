import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  FLOW_SPACE,
  STATIONS,
  bestThroughput,
  evaluateFlow,
  flowGates,
  flowPlans,
  generateFlow,
  readFlow,
  requiredRate,
  schoolEventFlow,
  stationRate,
  throughput,
  type FlowParams,
} from '@/content/grade-4/challenges/school-event-flow'

const approved: readonly FlowParams[] = Array.from(
  { length: FLOW_SPACE },
  (_, index) => generateFlow(index),
).filter((params) => flowGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')
const plans = flowPlans(sample)

describe('4.º · la cola del evento', () => {
  it('aprueba un catálogo suficiente y estrena la familia de razonamiento de sistemas', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(new Set(approved.map((p) => p.shape)).size).toBe(3)
    expect(schoolEventFlow.band).toBe('standard')
    expect(bandOf(schoolEventFlow.cognitive)).toBe('standard')
    expect(cognitiveLoad(schoolEventFlow.cognitive)).toBeLessThanOrEqual(7)
    expect(schoolEventFlow.composition).toMatchObject({
      primaryReasoningFamily: 'SYSTEMS_OPTIMIZATION',
      interactionEngine: 'allocate-constrain',
      pacingClass: 'MEDIUM',
      eventCluster: 'evento-escolar',
    })
  })

  it('la fila va al ritmo del puesto más lento', () => {
    const lines = STATIONS.map((station) => ({
      itemId: station.id,
      quantity: 0,
    }))
    expect(throughput(sample, lines)).toBe(
      Math.min(...STATIONS.map((_, index) => stationRate(sample, index, 0))),
    )
    // Poner ayudantes en un puesto que no es el cuello no cambia el ritmo.
    const rates = STATIONS.map((_, index) => stationRate(sample, index, 0))
    const fastest = rates.indexOf(Math.max(...rates))
    const padded = lines.map((line, index) =>
      index === fastest ? { ...line, quantity: 1 } : line,
    )
    expect(throughput(sample, padded)).toBe(throughput(sample, lines))
  })

  it('LOCKED: el mejor reparto nunca cabe en un solo puesto', () => {
    for (const params of approved.slice(0, 40)) {
      const optimal = flowPlans(params).filter(
        (plan) => plan.quality === 'optimal',
      )
      expect(optimal.length).toBeGreaterThan(0)
      for (const plan of optimal)
        expect(
          plan.lines.filter((line) => line.quantity > 0).length,
        ).toBeGreaterThanOrEqual(2)
    }
  })

  it('el puesto más lento no es el que más rinde por ayudante', () => {
    for (const params of approved.slice(0, 40)) {
      const bases = params.stations.map((station) => station.base)
      const gains = params.stations.map((station) => station.perHelper)
      expect(bases.indexOf(Math.min(...bases))).not.toBe(
        gains.indexOf(Math.max(...gains)),
      )
    }
  })

  it('repartir más ayudantes de los que hay no es un plan, es un error', () => {
    const tooMany = STATIONS.map((station) => ({
      itemId: station.id,
      quantity: station.max,
    }))
    const read = readFlow(sample, tooMany)
    expect(read.overstaffed).toBe(true)
    expect(read.quality).toBe('invalid')
  })

  it('el evaluador reproduce el oráculo y rechaza cantidades fuera de contrato', () => {
    expect(bestThroughput(sample)).toBeGreaterThan(requiredRate(sample) + 1)
    for (const quality of ['optimal', 'efficient', 'functional'] as const) {
      const plan = plans.find((entry) => entry.quality === quality)
      if (plan === undefined) throw new Error(`falta un plan ${quality}`)
      const result = evaluateFlow(sample, plan.lines)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(quality)
    }
    expect(evaluateFlow(sample, [{ itemId: 'puerta', quantity: 99 }]).ok).toBe(
      false,
    )
  })

  it('es Math sola: la consecuencia se ve, pero no se cobra como Equipo', () => {
    expect(schoolEventFlow.scoring?.team).toBe('none')
    expect(schoolEventFlow.scoring?.aura).toBe('none')
    const plan = plans.find((entry) => entry.quality === 'optimal')
    if (plan === undefined) throw new Error('sin plan óptimo')
    const result = evaluateFlow(sample, plan.lines)
    if (!result.ok) throw new Error('evaluación rechazada')
    expect(result.value.careerEffects.equipo).toBeUndefined()
    expect(result.value.careerEffects.aura).toBeUndefined()
    expect(result.value.careerEffects.estilo).toBeUndefined()
  })
})
