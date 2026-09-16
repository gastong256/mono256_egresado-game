import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  DAYS,
  WEEK_SPACE,
  absolute,
  evaluateWeek,
  generateWeek,
  readWeek,
  startsOfTask,
  weekGates,
  weekPlanner,
  weekPlans,
  type WeekParams,
} from '@/content/grade-3/challenges/week-planner'

const WINDOW = 120
const approved: readonly WeekParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateWeek(index),
).filter((params) => weekGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')
const plans = weekPlans(sample)
const fixedPlacements = sample.fixed.map((entry) => ({
  activityId: entry.id,
  startMinute: absolute(entry.day, entry.start),
}))

describe('3.º · la semana que viene', () => {
  it('aprueba un catálogo suficiente y es STANDARD con señal fuerte de Estilo', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(WEEK_SPACE).toBeGreaterThan(WINDOW)
    expect(weekPlanner.band).toBe('standard')
    expect(bandOf(weekPlanner.cognitive)).toBe('standard')
    expect(cognitiveLoad(weekPlanner.cognitive)).toBeLessThanOrEqual(7)
    expect(weekPlanner.composition).toMatchObject({
      primaryReasoningFamily: 'TEMPORAL',
      interactionEngine: 'timeline-schedule',
      pacingClass: 'MEDIUM',
    })
    expect(weekPlanner.scoring?.team).toBe('none')
    expect(weekPlanner.scoring?.aura).toBe('none')
  })

  it('el vencimiento decide: hay semanas que fallan sólo por llegar tarde', () => {
    for (const params of approved.slice(0, 10)) {
      const failures = weekPlans(params).map(
        (plan) => readWeek(params, plan.placements).failure,
      )
      expect(failures).toContain('vence')
      expect(failures).toContain('pisa')
    }
  })

  it('Estilo describe el reparto y nunca anuncia el resultado', () => {
    const byStyle = new Map<string, Set<string>>()
    for (const plan of plans) {
      if (plan.quality === 'invalid') {
        expect(plan.style).toBeUndefined()
        continue
      }
      expect(plan.style).toBeDefined()
      const tiers = byStyle.get(plan.style ?? '') ?? new Set<string>()
      tiers.add(plan.quality)
      byStyle.set(plan.style ?? '', tiers)
    }
    // Cada estrategia aparece en más de un nivel y el óptimo admite varias.
    for (const tiers of byStyle.values()) expect(tiers.size).toBeGreaterThan(1)
    expect(
      [...byStyle.values()].filter((tiers) => tiers.has('optimal')).length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('los minutos son absolutos: el día viaja en el mismo entero', () => {
    const task = sample.tasks[0]
    if (task === undefined) throw new Error('sin pendientes')
    for (const start of startsOfTask(task)) {
      const day = Math.floor(start / 1440)
      expect(task.days).toContain(day)
      expect(start % 1440).toBeGreaterThanOrEqual(960)
      expect(DAYS[day]).toBeDefined()
    }
  })

  it('lo que ya estaba tomado se acepta en su horario y no se cuenta dos veces', () => {
    const plan = plans.find((entry) => entry.quality === 'optimal')
    if (plan === undefined) throw new Error('sin plan óptimo')
    const conFijos = evaluateWeek(sample, [
      ...plan.placements,
      ...fixedPlacements,
    ])
    const sinFijos = evaluateWeek(sample, plan.placements)
    expect(conFijos.ok && conFijos.value.quality).toBe('optimal')
    expect(sinFijos.ok && sinFijos.value.quality).toBe('optimal')
    const movido = evaluateWeek(sample, [
      ...plan.placements,
      ...fixedPlacements.map((entry) => ({
        ...entry,
        startMinute: entry.startMinute + 60,
      })),
    ])
    expect(movido.ok).toBe(false)
  })

  it('el evaluador reproduce el oráculo y rechaza un horario fuera de contrato', () => {
    for (const quality of ['optimal', 'efficient', 'functional'] as const) {
      const plan = plans.find((entry) => entry.quality === quality)
      if (plan === undefined) throw new Error(`falta un plan ${quality}`)
      const result = evaluateWeek(sample, plan.placements)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(quality)
    }
    const task = sample.tasks[0]
    if (task === undefined) throw new Error('sin pendientes')
    expect(
      evaluateWeek(sample, [{ activityId: task.id, startMinute: 7 }]).ok,
    ).toBe(false)
  })
})
