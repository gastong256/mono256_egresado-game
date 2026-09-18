import {
  createGrade4Dependencies,
  grade4VariantCatalog,
} from '@/content/grade-4'
import { publishedParams } from '../helpers/published-params'
import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  FUNDRAISER_SPACE,
  ITEMS,
  MARGIN_REVIEW_SPACE,
  courseProjectFundraiser,
  evaluateFundraiser,
  evaluateMarginReview,
  fundraiserGates,
  fundraiserSchema,
  fundraiserPlans,
  generateFundraiser,
  generateMarginReview,
  marginOf,
  marginReview,
  marginReviewGates,
  readFundraiser,
  traysToBreakEven,
  type FundraiserParams,
} from '@/content/grade-4/challenges/course-project-fundraiser'

const WINDOW = 800
const approved: readonly FundraiserParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateFundraiser(index),
).filter((params) => fundraiserGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')
const plans = fundraiserPlans(sample)

describe('4.º · Proyecto del Curso: la peña', () => {
  it('aprueba un catálogo suficiente y es STANDARD del arco Proyecto', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(FUNDRAISER_SPACE).toBeGreaterThan(WINDOW)
    expect(courseProjectFundraiser.band).toBe('standard')
    expect(bandOf(courseProjectFundraiser.cognitive)).toBe('standard')
    expect(
      cognitiveLoad(courseProjectFundraiser.cognitive),
    ).toBeLessThanOrEqual(7)
    expect(courseProjectFundraiser.composition).toMatchObject({
      primaryReasoningFamily: 'ECONOMIC_PROPORTIONAL',
      interactionEngine: 'allocate-constrain',
      recurringArc: 'PROJECT',
    })
  })

  it('LOCKED: cubrir costos y llegar al objetivo son niveles distintos', () => {
    for (const params of approved.slice(0, 40)) {
      const all = fundraiserPlans(params)
      const covers = all.filter((plan) => plan.quality === 'functional')
      const reaches = all.filter(
        (plan) => plan.quality === 'efficient' || plan.quality === 'optimal',
      )
      expect(covers.length).toBeGreaterThan(0)
      expect(reaches.length).toBeGreaterThan(0)
      // Y cubrir costos de verdad significa no perder plata.
      for (const plan of covers) {
        expect(plan.profit).toBeGreaterThanOrEqual(0)
        expect(plan.profit).toBeLessThan(params.target)
      }
    }
  })

  it('LOCKED: no se resuelve mirando el margen por bandeja', () => {
    for (const params of approved.slice(0, 40)) {
      const byUnit = ITEMS.map((_, index) => marginOf(params, index))
      const byMinute = ITEMS.map(
        (_, index) =>
          marginOf(params, index) / (params.items[index]?.minutes ?? 1),
      )
      expect(byUnit.indexOf(Math.max(...byUnit))).not.toBe(
        byMinute.indexOf(Math.max(...byMinute)),
      )
    }
  })

  it('la cocina aprieta: preparar todo nunca entra', () => {
    for (const params of approved.slice(0, 40)) {
      const everything = ITEMS.map((entry) => ({
        itemId: entry.id,
        quantity: entry.max,
      }))
      expect(readFundraiser(params, everything).quality).toBe('invalid')
    }
  })

  it('Estilo describe la producción y no anuncia el resultado', () => {
    const byStyle = new Map<string, Set<string>>()
    for (const plan of plans) {
      if (plan.quality === 'invalid') {
        expect(plan.style).toBeUndefined()
        continue
      }
      const tiers = byStyle.get(plan.style ?? '') ?? new Set<string>()
      tiers.add(plan.quality)
      byStyle.set(plan.style ?? '', tiers)
    }
    for (const tiers of byStyle.values()) expect(tiers.size).toBeGreaterThan(1)
    expect(
      [...byStyle.values()].filter((tiers) => tiers.has('optimal')).length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('la agregación coincide con los witnesses y rechaza cantidades fuera de contrato', () => {
    for (const quality of ['optimal', 'efficient', 'functional'] as const) {
      const plan = plans.find((entry) => entry.quality === quality)
      if (plan === undefined) throw new Error(`falta un plan ${quality}`)
      const result = evaluateFundraiser(sample, plan.lines)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(quality)
    }
    expect(
      evaluateFundraiser(sample, [{ itemId: 'panchos', quantity: 99 }]).ok,
    ).toBe(false)
  })
})

describe('4.º · Repaso de cubrir el costo fijo', () => {
  const reviews = Array.from({ length: MARGIN_REVIEW_SPACE }, (_, index) =>
    generateMarginReview(index),
  ).filter((params) => marginReviewGates(params).length === 0)

  it('lo que cubre el costo fijo es lo que deja cada bandeja, no el precio', () => {
    expect(reviews.length).toBeGreaterThanOrEqual(24)
    for (const params of reviews) {
      const exact = traysToBreakEven(params)
      expect((exact - 1) * (params.price - params.cost)).toBeLessThan(
        params.fixedCost,
      )
      expect(exact * (params.price - params.cost)).toBeGreaterThanOrEqual(
        params.fixedCost,
      )
      expect(Math.ceil(params.fixedCost / params.price)).not.toBe(exact)
    }
  })

  it('nombra el error de dividir por el precio en vez de marcarlo mal', () => {
    const params = reviews[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    const exact = traysToBreakEven(params)
    const byPrice = Math.ceil(params.fixedCost / params.price)
    const right = evaluateMarginReview(params, String(exact))
    expect(right.ok && right.value.quality).toBe('optimal')
    const wrong = evaluateMarginReview(params, String(byPrice))
    expect(wrong.ok && wrong.value.quality).toBe('functional')
    expect(wrong.ok && wrong.value.feedback.violatedConstraint).toContain(
      'preparar también cuesta',
    )
    expect(evaluateMarginReview(params, 'doce').ok).toBe(false)
    expect(marginReview.placement).toBe('recovery')
    expect(marginReview.scoring?.team).toBe('none')
    expect(marginReview.scoring?.aura).toBe('none')
  })
})

// Independiente: no deriva ni la calidad ni la ganancia de readFundraiser/plans.
describe('RS-RA-003 · catálogo publicado y oráculo independiente', () => {
  const variants = publishedParams(
    createGrade4Dependencies(),
    grade4VariantCatalog,
    'y4.course-project-fundraiser',
    (x) => fundraiserSchema.parse(x),
  )
  it('distribuye al menos tres órdenes de margen por minuto sin mayoría', () => {
    const orders = new Map<string, number>()
    for (const p of variants) {
      const order = [0, 1, 2]
        .sort(
          (a, b) =>
            (p.items[b]!.price - p.items[b]!.cost) * p.items[a]!.minutes -
              (p.items[a]!.price - p.items[a]!.cost) * p.items[b]!.minutes ||
            a - b,
        )
        .join('>')
      orders.set(order, (orders.get(order) ?? 0) + 1)
    }
    expect(orders.size).toBeGreaterThanOrEqual(3)
    expect(Math.max(...orders.values()) * 2).toBeLessThanOrEqual(
      variants.length,
    )
  })
  it.each(variants.map((p, index) => ({ p, index })))(
    'variante $index: todos los 630 planes y textos',
    ({ p }) => {
      const tiers = new Set<string>()
      const styles = new Map<string, Set<string>>()
      let best = -p.fixedCost,
        bestWithSpare = -p.fixedCost
      for (let a = 0; a <= 8; a++)
        for (let b = 0; b <= 6; b++)
          for (let c = 0; c <= 9; c++) {
            const counts = [a, b, c]
            const minutes = p.items.reduce(
              (total, it, i) => total + it.minutes * counts[i]!,
              0,
            )
            const profit = p.items.reduce(
              (total, it, i) => total + (it.price - it.cost) * counts[i]!,
              -p.fixedCost,
            )
            const expected =
              minutes > p.kitchenMinutes || profit < 0
                ? 'invalid'
                : profit >= p.target + p.reserve
                  ? 'optimal'
                  : profit >= p.target
                    ? 'efficient'
                    : 'functional'
            const result = evaluateFundraiser(
              p,
              ITEMS.map((it, i) => ({ itemId: it.id, quantity: counts[i]! })),
            )
            if (!result.ok) throw new Error('respuesta válida rechazada')
            expect(result.value.quality).toBe(expected)
            const text = result.value.feedback.consequence
            if (minutes > p.kitchenMinutes)
              expect(text).toContain('cocina no alcanza')
            else if (profit < 0) expect(text).toContain('costando plata')
            else if (profit < p.target) expect(text).toContain('no alcanza')
            else if (profit < p.target + p.reserve)
              expect(text).toContain('falta para el colchón')
            else expect(text).toContain('queda un colchón')
            if (minutes <= p.kitchenMinutes) best = Math.max(best, profit)
            if (minutes * 4 < p.kitchenMinutes * 3)
              bestWithSpare = Math.max(bestWithSpare, profit)
            tiers.add(expected)
            const style =
              expected === 'invalid'
                ? undefined
                : minutes * 4 < p.kitchenMinutes * 3
                  ? 'improvisador'
                  : counts.filter((n) => n > 0).length <= 1
                    ? 'estratega'
                    : 'aplicado'
            expect(result.value.careerEffects.estilo?.axis).toBe(style)
            if (style) {
              const seen = styles.get(style) ?? new Set<string>()
              seen.add(expected)
              styles.set(style, seen)
            }
          }
      expect(tiers).toEqual(
        new Set(['invalid', 'functional', 'efficient', 'optimal']),
      )
      expect(best).toBeGreaterThanOrEqual(p.target + p.reserve)
      // El objetivo usa la capacidad de una estrategia con tiempo libre, sin
      // exigir agotar cocina ni eliminar el witness de Estilo.
      expect(bestWithSpare - (p.target + p.reserve)).toBeGreaterThanOrEqual(0)
      expect(bestWithSpare - (p.target + p.reserve)).toBeLessThanOrEqual(3000)
      for (const seen of styles.values())
        expect(seen.size).toBeGreaterThanOrEqual(2)
      expect(
        [...styles.values()].filter((seen) => seen.has('optimal')).length,
      ).toBeGreaterThanOrEqual(2)
    },
  )
})
