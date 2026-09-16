import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  CREW,
  ITEMS,
  RATE_REVIEW_SPACE,
  TECH_SPACE,
  courseProjectTech,
  evaluateRateReview,
  evaluateTech,
  fitsWhole,
  generateRateReview,
  generateTech,
  rateCapacityReview,
  rateReviewGates,
  readTech,
  techGates,
  techPlans,
  uploadMinutes,
  usage,
  type TechParams,
} from '@/content/grade-3/challenges/course-project-tech'

const WINDOW = 400
const approved: readonly TechParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateTech(index),
).filter((params) => techGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')

describe('3.º · Proyecto del Curso: la feria de tecnología', () => {
  it('aprueba un catálogo suficiente en las tres formas y es STANDARD del arco Proyecto', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(TECH_SPACE).toBeGreaterThan(WINDOW)
    expect(new Set(approved.map((p) => p.shape)).size).toBeGreaterThanOrEqual(2)
    expect(courseProjectTech.band).toBe('standard')
    expect(bandOf(courseProjectTech.cognitive)).toBe('standard')
    expect(cognitiveLoad(courseProjectTech.cognitive)).toBeLessThanOrEqual(7)
    expect(courseProjectTech.composition).toMatchObject({
      primaryReasoningFamily: 'ALLOCATION',
      interactionEngine: 'allocate-constrain',
      recurringArc: 'PROJECT',
    })
  })

  it('LOCKED: más de un recurso decide; no se resuelve con una sola división', () => {
    for (const params of approved.slice(0, 40)) {
      const binding = new Set(
        techPlans(params).flatMap((plan) =>
          plan.over === undefined || plan.over === 'minimo' ? [] : [plan.over],
        ),
      )
      expect(binding.size).toBeGreaterThanOrEqual(2)
    }
  })

  it('LOCKED: Math y Equipo son evidencias distintas sobre el mismo plan', () => {
    for (const params of approved.slice(0, 40)) {
      const plans = techPlans(params)
      const optimal = plans.filter((plan) => plan.quality === 'optimal')
      expect(new Set(optimal.map((plan) => plan.team)).size).toBeGreaterThan(1)
      expect(
        plans.some((plan) => plan.quality !== 'invalid' && plan.team === 3),
      ).toBe(true)
    }
  })

  it('lo que ocupa el pendrive es lo mismo que hay que subir', () => {
    const lines = ITEMS.map((item) => ({ itemId: item.id, quantity: 2 }))
    const { megabytes } = usage(lines)
    expect(megabytes).toBe(
      ITEMS.reduce((total, item) => total + item.megabytes * 2, 0),
    )
    expect(uploadMinutes(sample, megabytes)).toBe(
      Math.ceil(megabytes / sample.uploadRate),
    )
  })

  it('el reparto por dueño no cambia la calidad matemática', () => {
    // Dos planes con las mismas cantidades totales pero distinto reparto no
    // existen —cada ítem tiene un dueño—, así que la prueba es la inversa: la
    // calidad se calcula sin mirar a nadie.
    const plan = techPlans(sample).find((entry) => entry.quality === 'optimal')
    if (plan === undefined) throw new Error('sin plan óptimo')
    const read = readTech(sample, plan.lines)
    expect(read.quality).toBe('optimal')
    const cheated = readTech(
      { ...sample, spread: 30, tightCap: 30 },
      plan.lines,
    )
    expect(cheated.quality).toBe('optimal')
    expect(cheated.team).toBeGreaterThanOrEqual(read.team)
    expect(CREW.length).toBe(ITEMS.length)
  })

  it('el evaluador reproduce el oráculo y rechaza cantidades fuera de contrato', () => {
    for (const quality of ['optimal', 'efficient', 'functional'] as const) {
      const plan = techPlans(sample).find((entry) => entry.quality === quality)
      if (plan === undefined) throw new Error(`falta un plan ${quality}`)
      const result = evaluateTech(sample, plan.lines)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.quality).toBe(quality)
    }
    expect(evaluateTech(sample, [{ itemId: 'video', quantity: 99 }]).ok).toBe(
      false,
    )
    expect(
      evaluateTech(sample, [
        { itemId: 'video', quantity: 1 },
        { itemId: 'video', quantity: 2 },
      ]).ok,
    ).toBe(false)
  })
})

describe('3.º · Repaso de cuánto entra', () => {
  const reviews = Array.from({ length: RATE_REVIEW_SPACE }, (_, index) =>
    generateRateReview(index),
  ).filter((params) => rateReviewGates(params).length === 0)

  it('entra la parte entera, y redondear para arriba es el error que nombra', () => {
    expect(reviews.length).toBeGreaterThanOrEqual(24)
    for (const params of reviews) {
      const whole = fitsWhole(params)
      expect(whole * params.perUnit).toBeLessThanOrEqual(params.capacity)
      expect((whole + 1) * params.perUnit).toBeGreaterThan(params.capacity)
    }
    const params = reviews[0]
    if (params === undefined) throw new Error('sin variante aprobada')
    const whole = fitsWhole(params)
    expect(evaluateRateReview(params, String(whole)).ok).toBe(true)
    const arriba = evaluateRateReview(params, String(whole + 1))
    expect(arriba.ok && arriba.value.quality).toBe('functional')
    const lejos = evaluateRateReview(params, String(whole + 6))
    expect(lejos.ok && lejos.value.quality).toBe('invalid')
    expect(evaluateRateReview(params, '-3').ok).toBe(false)
  })

  it('cubre las dos unidades del proyecto y no aporta evidencia competitiva', () => {
    expect(new Set(reviews.map((params) => params.kind))).toEqual(
      new Set(['pendrive', 'laboratorio']),
    )
    expect(rateCapacityReview.placement).toBe('recovery')
    expect(rateCapacityReview.scoring?.team).toBe('none')
    expect(rateCapacityReview.scoring?.aura).toBe('none')
  })
})
