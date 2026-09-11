import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { parseCommand, type SchedulePlacement } from '@/game'
import {
  evaluateSchedule,
  rehearsalSchedule,
  scheduleGates,
  scheduleOracle,
  schedulePlans,
  scheduleReview,
  scheduleSchema,
  startOptions,
  type ScheduleParams,
} from '@/content/grade-1/challenges/rehearsal-schedule'
import { approvedParams } from '../helpers/grade-1-approved'

const evaluate = (
  p: ScheduleParams,
  placements: readonly SchedulePlacement[],
) => {
  const result = evaluateSchedule(p, placements)
  if (!result.ok) throw new Error(result.error.kind)
  return result.value
}

describe.each([
  { template: rehearsalSchedule, minimum: 12, shapes: 3 },
  { template: scheduleReview, minimum: 8, shapes: 1 },
])('$template.id', ({ template, minimum, shapes }) => {
  const approved = approvedParams(template, (value) =>
    scheduleSchema.parse(value),
  )
  const review = template.placement === 'recovery'

  it('aprueba su catálogo con gates limpios y la banda/pacing del diseño', () => {
    expect(approved.length).toBeGreaterThanOrEqual(minimum)
    expect(
      new Set(approved.map(({ params }) => params.shape)).size,
    ).toBeGreaterThanOrEqual(shapes)
    for (const { params } of approved) expect(scheduleGates(params)).toEqual([])
    expect(template.band).toBe(review ? 'core' : 'standard')
    expect(template.composition?.pacingClass).toBe(review ? 'QUICK' : 'MEDIUM')
    expect(template.composition?.interactionEngine).toBe('timeline-schedule')
    if (review) {
      for (const { params } of approved)
        expect(params.activities).toHaveLength(2)
    } else {
      for (const { params } of approved) {
        expect(params.activities).toHaveLength(4)
        expect(params.activities.filter((a) => a.optional)).toHaveLength(1)
      }
    }
  })

  it.each(
    approved.map(({ variantId, params }) => [variantId, params] as const),
  )(
    '%s: todas las agendas válidas coinciden con evaluador y oráculo',
    (_, p) => {
      const plans = schedulePlans(p)
      expect(new Set(plans.map((plan) => plan.quality))).toEqual(
        new Set(['optimal', 'efficient', 'functional']),
      )
      for (const plan of plans.filter(
        (_, i) => i % 3 === 0 || plans.length < 300,
      )) {
        const result = evaluate(p, plan.placements)
        expect(result.quality).toBe(plan.quality)
        expect(scheduleOracle(p, plan.placements)).toBe(plan.quality)
        const strategy = result.flagEffects.find((flag) =>
          flag.flag.endsWith('strategy'),
        )
        expect(strategy?.value).toBe(plan.style)
      }
    },
  )

  it('Intrinsic Math Gate: olvidar el viaje rompe la agenda', () => {
    for (const { params: p } of approved) {
      let cursor = p.start
      const naive = p.activities
        .filter((activity) => !activity.optional)
        .map((activity) => {
          const start = Math.max(activity.earliest, cursor + activity.setup)
          cursor = start + activity.duration
          return { activityId: activity.id, startMinute: start }
        })
      expect(evaluate(p, naive).quality).toBe('invalid')
    }
  })

  it('propiedad: evaluador y clasificador independiente coinciden en respuestas arbitrarias', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: approved.length - 1 }),
        fc.array(fc.integer({ min: -1, max: 40 }), {
          minLength: 4,
          maxLength: 4,
        }),
        (index, picks) => {
          const p = approved[index]!.params
          const placements = p.activities.flatMap((activity, i) => {
            const options = startOptions(activity)
            const pick = picks[i] ?? -1
            return pick < 0 || options.length === 0
              ? []
              : [
                  {
                    activityId: activity.id,
                    startMinute: options[pick % options.length]!,
                  },
                ]
          })
          expect(evaluate(p, placements).quality).toBe(
            scheduleOracle(p, placements),
          )
        },
      ),
      { numRuns: 800 },
    )
  })

  it('cierra la frontera de payload antes de evaluar matemática', () => {
    const p = approved[0]!.params
    const first = p.activities[0]!
    for (const placements of [
      [{ activityId: 'fake', startMinute: p.start }],
      [
        { activityId: first.id, startMinute: p.start },
        { activityId: first.id, startMinute: p.start },
      ],
      [{ activityId: first.id, startMinute: p.start + 1 }],
      [{ activityId: first.id, startMinute: 2000 }],
    ])
      expect(evaluateSchedule(p, placements).ok).toBe(false)
    expect(
      parseCommand({
        type: 'ANSWER',
        instanceId: 'test',
        answer: {
          kind: 'schedule-builder',
          placements: [],
          officialScore: 100,
        },
      }).ok,
    ).toBe(false)
  })
})

describe('agenda y repaso: diferencias pedagógicas', () => {
  const rehearsal = approvedParams(rehearsalSchedule, (value) =>
    scheduleSchema.parse(value),
  )
  const review = approvedParams(scheduleReview, (value) =>
    scheduleSchema.parse(value),
  )

  it('la agenda expresa estrategias distintas en planes óptimos; el repaso no etiqueta estilo', () => {
    for (const { params } of rehearsal) {
      const optimal = schedulePlans(params).filter(
        (plan) => plan.quality === 'optimal',
      )
      expect(new Set(optimal.map((plan) => plan.style)).size).toBeGreaterThan(1)
    }
    for (const { params } of review) {
      const plan = schedulePlans(params).find(
        (entry) => entry.quality === 'optimal',
      )!
      const result = evaluate(params, plan.placements)
      expect(result.careerEffects).toEqual({})
      expect(result.feedback.optimalComparison).toMatch(/Desde el límite/u)
    }
  })

  it('el repaso ofrece inicios tardíos que ya no entran: hay que pensar desde el límite', () => {
    for (const { params } of review) {
      const pack = params.activities[0]!
      const latest = Math.max(
        ...schedulePlans(params).flatMap((plan) =>
          plan.placements
            .filter((entry) => entry.activityId === pack.id)
            .map((entry) => entry.startMinute),
        ),
      )
      expect(startOptions(pack).at(-1)).toBeGreaterThan(latest)
      expect(latest).toBe(
        params.deadline -
          params.activities[1]!.duration -
          params.travel -
          pack.duration,
      )
    }
  })
})
