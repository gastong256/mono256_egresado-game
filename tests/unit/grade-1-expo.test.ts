import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { cognitiveLoad, parseCommand } from '@/game'
import {
  courseProjectExpo,
  evaluateExpo,
  expoGates,
  expoPlans,
  expoSchema,
  type ExpoParams,
} from '@/content/grade-1/challenges/course-project-expo'
import { approvedParams } from '../helpers/grade-1-approved'

const approved = approvedParams(courseProjectExpo, (value) =>
  expoSchema.parse(value),
)
const evaluate = (
  p: ExpoParams,
  assignments: readonly { taskId: string; agentId: string }[],
) => {
  const result = evaluateExpo(p, assignments)
  if (!result.ok) throw new Error(result.error.kind)
  return result.value
}

describe('1.º · Proyecto del Curso I', () => {
  it('aprueba al menos 12 variantes de al menos tres formas, STANDARD derivado', () => {
    expect(approved.length).toBeGreaterThanOrEqual(12)
    expect(
      new Set(approved.map(({ params }) => params.shape)).size,
    ).toBeGreaterThanOrEqual(3)
    for (const { params } of approved) expect(expoGates(params)).toEqual([])
    expect(courseProjectExpo.band).toBe('standard')
    expect(cognitiveLoad(courseProjectExpo.cognitive)).toBe(7)
    expect(courseProjectExpo.composition).toMatchObject({
      primaryReasoningFamily: 'ALLOCATION',
      recurringArc: 'PROJECT',
      pacingClass: 'MEDIUM',
    })
  })

  it.each(
    approved.map(({ variantId, params }) => [variantId, params] as const),
  )(
    '%s: Math y Equipo coinciden con el oráculo y son independientes',
    (_, p) => {
      const plans = expoPlans(p)
      const optimal = plans.filter((plan) => plan.quality === 'optimal')
      expect(optimal.some((plan) => plan.team === 3)).toBe(true)
      expect(new Set(optimal.map((plan) => plan.team)).size).toBeGreaterThan(1)
      expect(
        plans.some(
          (plan) =>
            plan.team === 3 &&
            plan.quality !== 'optimal' &&
            plan.quality !== 'invalid',
        ),
      ).toBe(true)
      for (const plan of plans) {
        const result = evaluate(p, plan.assignments)
        expect(result.quality).toBe(plan.quality)
        expect(result.metrics.efficiency).toBe(plan.team / 3)
        expect(evaluate(p, [...plan.assignments].reverse())).toEqual(result)
      }
    },
  )

  it('Equipo no lee horas: más horas para todos no cambia la evidencia social de un plan válido', () => {
    for (const { params: p } of approved.slice(0, 6)) {
      const roomier: ExpoParams = {
        ...p,
        members: [
          { ...p.members[0], hours: p.members[0].hours + 2 },
          { ...p.members[1], hours: p.members[1].hours + 2 },
          { ...p.members[2], hours: p.members[2].hours + 2 },
        ],
      }
      for (const plan of expoPlans(p).filter(
        (entry) => entry.quality !== 'invalid',
      )) {
        expect(evaluate(roomier, plan.assignments).metrics.efficiency).toBe(
          evaluate(p, plan.assignments).metrics.efficiency,
        )
      }
    }
  })

  it('la dependencia es real: presentar sin haber investigado ni construido es INVALID', () => {
    for (const { params: p } of approved) {
      const witness = expoPlans(p).find((plan) => plan.quality === 'optimal')!
      const presenter = witness.assignments.find(
        (entry) => entry.taskId === 'present',
      )!
      const outsider = p.members.find(
        (member) =>
          !witness.assignments.some(
            (entry) =>
              entry.agentId === member.id &&
              (entry.taskId === 'research' || entry.taskId === 'build'),
          ),
      )
      if (outsider === undefined || outsider.id === presenter.agentId) continue
      const swapped = witness.assignments.map((entry) =>
        entry.taskId === 'present' ? { ...entry, agentId: outsider.id } : entry,
      )
      const result = evaluate(p, swapped)
      expect(result.quality).toBe('invalid')
      expect(result.feedback.violatedConstraint).toMatch(
        /investigado o construido/u,
      )
    }
  })

  it('efectos de carrera: Equipo desde acuerdos, Estilo sólo en planes válidos; la nota la pone `graded`', () => {
    const p = approved[0]!.params
    const plans = expoPlans(p)
    const best = evaluate(
      p,
      plans.find((plan) => plan.quality === 'optimal' && plan.team === 3)!
        .assignments,
    )
    // El evaluador de la expo ya no autora su propia escala: la nota la pone
    // la regla de contenido (10/8/6/4) al materializar. Ver content-grades.
    expect(best.careerEffects.grade).toBeUndefined()
    expect(best.careerEffects.equipo).toBe(4)
    expect(best.careerEffects.estilo?.amount).toBeGreaterThan(0)
    const failed = evaluate(p, [])
    expect(failed.quality).toBe('invalid')
    expect(failed.careerEffects).toEqual({ equipo: -2 })
    expect(failed.metrics.efficiency).toBe(0)
    expect(courseProjectExpo.scoring.aura).toBe('none')
  })

  it('rechaza IDs y payloads duplicados antes de evaluar matemática', () => {
    const p = approved[0]!.params
    const member = p.members[0].id
    expect(evaluateExpo(p, [{ taskId: 'fake', agentId: member }]).ok).toBe(
      false,
    )
    expect(evaluateExpo(p, [{ taskId: 'research', agentId: 'fake' }]).ok).toBe(
      false,
    )
    expect(
      evaluateExpo(p, [
        { taskId: 'research', agentId: member },
        { taskId: 'research', agentId: member },
      ]).ok,
    ).toBe(false)
    // A client cannot assert Team: the command codec drops the field and the
    // evaluator recomputes Team from the assignments alone.
    const claimed = parseCommand({
      type: 'ANSWER',
      instanceId: 'test',
      answer: { kind: 'assignment-board', assignments: [], team: 3 },
    })
    expect(claimed.ok).toBe(true)
    if (claimed.ok && claimed.value.type === 'ANSWER') {
      expect(claimed.value.answer).toEqual({
        kind: 'assignment-board',
        assignments: [],
      })
    }
  })

  it('propiedad: cualquier reparto acotado coincide con el oráculo exhaustivo', () => {
    const indexed = approved.map(({ params }) => ({
      params,
      byKey: new Map(
        expoPlans(params).map((plan) => [
          JSON.stringify(plan.assignments),
          plan,
        ]),
      ),
    }))
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: indexed.length - 1 }),
        fc.array(fc.integer({ min: -1, max: 2 }), {
          minLength: 5,
          maxLength: 5,
        }),
        (index, who) => {
          const { params: p, byKey } = indexed[index]!
          const assignments = p.tasks.flatMap((task, i) => {
            const member = p.members[who[i] ?? -1]
            return member === undefined
              ? []
              : [{ taskId: task.id, agentId: member.id }]
          })
          const expected = byKey.get(JSON.stringify(assignments))
          const result = evaluate(p, assignments)
          expect(result.quality).toBe(expected?.quality)
          expect(result.metrics.efficiency).toBe((expected?.team ?? 0) / 3)
        },
      ),
      { numRuns: 800 },
    )
  })
})
