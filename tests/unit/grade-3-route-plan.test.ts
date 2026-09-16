import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  ROUTE_SPACE,
  STOPS,
  blocksBetween,
  evaluateRoute,
  generateRoute,
  readRoute,
  routeGates,
  routePlan,
  routePlans,
  type RouteParams,
} from '@/content/grade-3/challenges/route-plan'

const WINDOW = 400
const approved: readonly RouteParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateRoute(index),
).filter((params) => routeGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')
const plans = routePlans(sample)

describe('3.º · los mandados del sábado', () => {
  it('aprueba un catálogo suficiente en las tres formas y es el STRETCH del año', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(ROUTE_SPACE).toBeGreaterThan(WINDOW)
    expect(new Set(approved.map((p) => p.shape)).size).toBeGreaterThanOrEqual(2)
    expect(routePlan.band).toBe('stretch')
    expect(bandOf(routePlan.cognitive)).toBe('stretch')
    expect(cognitiveLoad(routePlan.cognitive)).toBeGreaterThan(7)
    expect(routePlan.composition).toMatchObject({
      primaryReasoningFamily: 'SPATIAL',
      interactionEngine: 'spatial-graph',
      pacingClass: 'DEEP',
    })
  })

  it('LOCKED: el orden cambia materialmente el resultado', () => {
    for (const params of approved.slice(0, 60)) {
      const byStops = new Map<string, Set<string>>()
      const byBlocks = new Map<string, Set<number>>()
      for (const plan of routePlans(params)) {
        const key = [...plan.order].sort().join('+')
        const qualities = byStops.get(key) ?? new Set<string>()
        qualities.add(plan.quality)
        byStops.set(key, qualities)
        const blocks = byBlocks.get(key) ?? new Set<number>()
        blocks.add(plan.blocks)
        byBlocks.set(key, blocks)
      }
      // Los mismos lugares, en otro orden: cambia si se puede hacer…
      expect(
        [...byStops.values()].some((qualities) => qualities.size > 1),
      ).toBe(true)
      // …y cambia cuántas cuadras caminás.
      expect([...byBlocks.values()].some((blocks) => blocks.size > 1)).toBe(
        true,
      )
    }
  })

  it('los horarios aprietan: hay recorridos que llegan con el lugar cerrado y otros que vuelven tarde', () => {
    const readings = plans.map((plan) => readRoute(sample, plan.order))
    expect(readings.some((read) => read.failure?.reason === 'cerrado')).toBe(
      true,
    )
    expect(readings.some((read) => read.late === true)).toBe(true)
    expect(
      plans.filter((plan) => plan.quality !== 'invalid').length,
    ).toBeLessThan(plans.length * 0.8)
  })

  it('se camina por la calle: la distancia es la suma de las dos coordenadas', () => {
    expect(blocksBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7)
    expect(blocksBetween({ x: 5, y: 2 }, { x: 5, y: 2 })).toBe(0)
  })

  it('esperar a que abra está permitido; entrar cuando cerró, no', () => {
    const early = { ...sample, start: 480 }
    const plan = plans.find((entry) => entry.quality === 'functional')
    if (plan === undefined) throw new Error('sin recorrido functional')
    // Salir antes nunca empeora: como mucho se espera a que abra.
    expect(readRoute(early, plan.order).quality).not.toBe('invalid')
  })

  it('es Math sola: no reparte Equipo, Aura ni Estilo', () => {
    expect(routePlan.scoring?.team).toBe('none')
    expect(routePlan.scoring?.aura).toBe('none')
    const plan = plans.find((entry) => entry.quality === 'optimal')
    if (plan === undefined) throw new Error('sin recorrido óptimo')
    const result = evaluateRoute(sample, plan.order)
    if (!result.ok) throw new Error('evaluación rechazada')
    expect(result.value.careerEffects.estilo).toBeUndefined()
    expect(result.value.careerEffects.equipo).toBeUndefined()
    expect(result.value.careerEffects.aura).toBeUndefined()
  })

  it('el evaluador reproduce el oráculo y rechaza una parada repetida o inventada', () => {
    for (const quality of ['optimal', 'efficient', 'functional'] as const) {
      const plan = plans.find((entry) => entry.quality === quality)
      if (plan === undefined) throw new Error(`falta un recorrido ${quality}`)
      const result = evaluateRoute(sample, plan.order)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(quality)
    }
    const first = STOPS[0]
    expect(evaluateRoute(sample, [first.id, first.id]).ok).toBe(false)
    expect(evaluateRoute(sample, ['veterinaria']).ok).toBe(false)
    // Dejar un mandado obligatorio afuera es una respuesta legal y mala.
    const incomplete = evaluateRoute(sample, [])
    expect(incomplete.ok && incomplete.value.quality).toBe('invalid')
  })
})
