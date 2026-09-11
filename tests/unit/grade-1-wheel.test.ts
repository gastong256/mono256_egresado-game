import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { bandOf, cognitiveLoad, parseCommand } from '@/game'
import {
  evaluateWheel,
  generateWheel,
  studentDayWheel,
  wheelGates,
  wheelPlans,
  wheelRuleText,
  wheelSchema,
  WHEEL_CATEGORIES,
  type WheelParams,
} from '@/content/grade-1/challenges/student-day-challenge-wheel'
import { approvedParams } from '../helpers/grade-1-approved'

const approved = approvedParams(studentDayWheel, (value) =>
  wheelSchema.parse(value),
)
const ids = WHEEL_CATEGORIES.map((category) => category.id)
const lines = (counts: readonly number[]) =>
  ids.map((itemId, i) => ({ itemId, quantity: counts[i] ?? 0 }))
const evaluate = (p: WheelParams, counts: readonly number[]) => {
  const result = evaluateWheel(p, lines(counts))
  if (!result.ok) throw new Error(result.error.kind)
  return result.value
}

describe('1.º · rueda del Día del Estudiante', () => {
  it('cumple el objetivo de alto riesgo: ≥16 materializaciones y ≥4 formas semánticas de regla', () => {
    expect(approved.length).toBeGreaterThanOrEqual(16)
    const shapes = new Set(
      approved.map(
        ({ params }) =>
          `${params.rule.comparator}:${params.rule.categories.join('+')}`,
      ),
    )
    expect(shapes.size).toBeGreaterThanOrEqual(4)
    expect(
      new Set(approved.map(({ params }) => params.rule.notation)).size,
    ).toBeGreaterThanOrEqual(3)
    expect(
      new Set(
        approved.map(
          ({ params }) => `${params.rule.numerator}/${params.rule.denominator}`,
        ),
      ).size,
    ).toBeGreaterThanOrEqual(4)
    for (const { params } of approved) expect(wheelGates(params)).toEqual([])
  })

  it('usa el modelo vigente: CORE, una sola regla proporcional y sin optimización', () => {
    expect(cognitiveLoad(studentDayWheel.cognitive)).toBe(4)
    expect(studentDayWheel.band).toBe('core')
    expect(bandOf({ ...studentDayWheel.cognitive, constraints: 3 })).toBe(
      'standard',
    )
    expect(studentDayWheel.composition).toMatchObject({
      primaryReasoningFamily: 'DATA_UNCERTAINTY',
      interactionEngine: 'grid-select-classify',
      pacingClass: 'QUICK',
    })
    for (const extra of [
      { balanceObjective: true },
      { secondRule: {} },
      { spins: 3 },
    ])
      expect(
        wheelSchema.safeParse({ ...generateWheel(0), ...extra }).success,
      ).toBe(false)
    expect(
      wheelSchema.safeParse({
        ...generateWheel(0),
        total: 10,
        rule: { ...generateWheel(0).rule, numerator: 1, denominator: 3 },
      }).success,
    ).toBe(false)
  })

  it.each(
    approved.map(({ variantId, params }) => [variantId, params] as const),
  )(
    '%s: el oráculo independiente coincide con el evaluador y hay varias ruedas óptimas',
    (_, p) => {
      const plans = wheelPlans(p)
      expect(
        plans.filter((plan) => plan.quality === 'optimal').length,
      ).toBeGreaterThan(1)
      // Every optimal plan plus a deterministic sample of the rest.
      const sample = plans.filter(
        (plan, i) => plan.quality === 'optimal' || i % 37 === 0,
      )
      for (const plan of sample) {
        const result = evaluateWheel(p, plan.lines)
        expect(result.ok && result.value.quality).toBe(plan.quality)
        expect(result.ok && result.value.careerEffects).toEqual({})
      }
    },
  )

  it('Intrinsic Math Gate: la regla decide y el reparto parejo no alcanza sin leerla', () => {
    for (const { params: p } of approved) {
      const even = ids.map(
        (_, i) => Math.floor(p.total / 5) + (i < p.total % 5 ? 1 : 0),
      )
      expect(evaluate(p, even).quality).not.toBe('optimal')
      expect(wheelRuleText(p)).toContain(
        p.rule.notation === 'percent'
          ? '%'
          : p.rule.notation === 'one-in'
            ? '1 de cada'
            : `${String(p.rule.numerator)}/${String(p.rule.denominator)}`,
      )
    }
  })

  it('rechaza el total incorrecto y el exploit de llenar cada categoría', () => {
    for (const { params: p } of approved) {
      expect(evaluate(p, [0, 0, 0, 0, 0]).quality).toBe('invalid')
      expect(
        evaluate(
          p,
          ids.map(() => p.total),
        ).quality,
      ).toBe('invalid')
    }
    const p = approved[0]!.params
    for (const bad of [
      [
        { itemId: 'games', quantity: 1 },
        { itemId: 'games', quantity: 1 },
      ],
      [{ itemId: 'fake', quantity: 1 }],
      [{ itemId: 'games', quantity: 0.5 }],
      [{ itemId: 'rest', quantity: p.total + 1 }],
    ])
      expect(evaluateWheel(p, bad).ok).toBe(false)
    expect(
      parseCommand({
        type: 'ANSWER',
        instanceId: 'test',
        answer: { kind: 'quantity-builder', lines: [], probability: 1 },
      }).ok,
    ).toBe(false)
  })

  it('la consecuencia enseña probabilidad intuitiva sin sortear nada', () => {
    const p = approved[0]!.params
    const optimal = wheelPlans(p).find((plan) => plan.quality === 'optimal')!
    const result = evaluateWheel(p, optimal.lines)
    expect(result.ok && result.value.feedback.consequence).toMatch(/giros/u)
    expect(result.ok && result.value.flagEffects[0]).toEqual({
      flag: 'y1.student-day.outcome',
      value: 'optimal',
    })
  })

  it('propiedad: sólo total, regla y variedad deciden; el orden de las líneas no importa', () => {
    const indexed = approved.map(({ params }) => ({
      params,
      byKey: new Map(
        wheelPlans(params).map((plan) => [
          plan.lines.map((line) => line.quantity).join(','),
          plan.quality,
        ]),
      ),
    }))
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: indexed.length - 1 }),
        fc.tuple(...ids.map(() => fc.integer({ min: 0, max: 24 }))),
        (index, raw) => {
          const { params: p, byKey } = indexed[index]!
          const counts = raw.map((count) => Math.min(count, p.total))
          const expected = byKey.get(counts.join(',')) ?? 'invalid'
          expect(evaluate(p, counts).quality).toBe(expected)
          expect(evaluateWheel(p, [...lines(counts)].reverse())).toEqual(
            evaluateWheel(p, lines(counts)),
          )
        },
      ),
      { numRuns: 800 },
    )
  })
})
