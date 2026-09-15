import { describe, expect, it } from 'vitest'
import {
  ACTIVITIES,
  CREW,
  PLAN_SPACE,
  SLOTS,
  TASKS,
  evaluatePlan,
  generatePlan,
  intercursoPlan,
  planGates,
  planOptions,
  readPlan,
  type PlanParams,
} from '@/content/grade-2/challenges/intercurso-plan'

const approved: readonly PlanParams[] = Array.from(
  { length: PLAN_SPACE },
  (_, index) => generatePlan(index),
).filter((params) => planGates(params).length === 0)

describe('2.º · el plan del Intercurso', () => {
  it('aprueba las tres formas y declara el cluster y la evidencia del año', () => {
    expect(approved.length).toBeGreaterThanOrEqual(12)
    expect(new Set(approved.map((p) => p.shape))).toEqual(
      new Set(['tight-availability', 'clash', 'spare']),
    )
    expect(intercursoPlan.composition?.eventCluster).toBe('intercurso')
    expect(intercursoPlan.placement).toBe('anchor')
    expect(intercursoPlan.scoring.team).not.toBe('none')
    expect(intercursoPlan.scoring.aura).toBe('none')
    expect(TASKS).toHaveLength(ACTIVITIES.length * SLOTS.length)
  })

  it('LOCKED · hay varios planes Math-válidos con consecuencias distintas de Equipo', () => {
    for (const p of approved) {
      const optimal = planOptions(p).filter(
        (plan) => plan.quality === 'optimal',
      )
      expect(optimal.length).toBeGreaterThan(1)
      expect(new Set(optimal.map((plan) => plan.team)).size).toBeGreaterThan(1)
      // Y el Estilo describe la forma del reparto, no el resultado.
      expect(
        new Set(optimal.flatMap((plan) => plan.style ?? [])).size,
      ).toBeGreaterThan(1)
    }
  })

  it('el Equipo no mueve la calidad matemática', () => {
    for (const p of approved) {
      const optimal = planOptions(p).filter(
        (plan) => plan.quality === 'optimal',
      )
      const best = optimal.find((plan) => plan.team === 3)
      const worst = optimal.reduce((low, plan) =>
        plan.team < low.team ? plan : low,
      )
      if (best === undefined || best.team === worst.team) continue
      const one = evaluatePlan(p, best.assignments)
      const other = evaluatePlan(p, worst.assignments)
      if (!one.ok || !other.ok) throw new Error('rechazo inesperado')
      expect(one.value.quality).toBe(other.value.quality)
      expect(one.value.metrics.efficiency).toBeGreaterThan(
        other.value.metrics.efficiency,
      )
    }
  })

  it('el tiempo pesa: nadie en dos actividades del mismo turno ni fuera de su disponibilidad', () => {
    for (const p of approved) {
      const slot = SLOTS[0]!.id
      const doubled = [
        { agentId: CREW[0]!.id, taskId: `${ACTIVITIES[0]!.id}-${slot}` },
        { agentId: CREW[0]!.id, taskId: `${ACTIVITIES[1]!.id}-${slot}` },
      ]
      expect(readPlan(p, doubled).quality).toBe('invalid')

      const blocked = p.crew.findIndex((person) =>
        person.available.includes(false),
      )
      if (blocked < 0) continue
      const missingSlot = p.crew[blocked]!.available.indexOf(false)
      const assignment = [
        {
          agentId: CREW[blocked]!.id,
          taskId: `${ACTIVITIES[0]!.id}-${SLOTS[missingSlot]!.id}`,
        },
      ]
      expect(readPlan(p, assignment).quality).toBe('invalid')
    }
  })

  it.each(approved.slice(0, 3).map((p, i) => [i, p] as const))(
    '%s: el oráculo independiente coincide con el evaluador',
    (_, p) => {
      for (const plan of planOptions(p).slice(0, 2500)) {
        const result = evaluatePlan(p, plan.assignments)
        expect(result.ok && result.value.quality).toBe(plan.quality)
      }
    },
  )

  it('la escalera es cobertura: obligatorias, y cada opcional suma', () => {
    for (const p of approved.slice(0, 12)) {
      const required = TASKS.filter((task) => !task.optional)
      const options = planOptions(p)
      const functional = options.find((plan) => plan.quality === 'functional')
      expect(functional).toBeDefined()
      // Un plan funcional cubre lo obligatorio y ninguna opcional.
      for (const task of required)
        expect(
          functional!.assignments.some((entry) => entry.taskId === task.id),
        ).toBe(true)
      expect(
        functional!.assignments.some((entry) =>
          TASKS.some((task) => task.optional && task.id === entry.taskId),
        ),
      ).toBe(false)
    }
  })

  it('cierra la frontera de payload antes de leer el plan', () => {
    const p = approved[0]!
    for (const bad of [
      [
        { agentId: CREW[0]!.id, taskId: TASKS[0]!.id },
        { agentId: CREW[1]!.id, taskId: TASKS[0]!.id },
      ],
      [{ agentId: 'fantasma', taskId: TASKS[0]!.id }],
      [{ agentId: CREW[0]!.id, taskId: 'inventada' }],
    ])
      expect(evaluatePlan(p, bad).ok).toBe(false)
  })
})
