import {
  createGrade3Dependencies,
  grade3VariantCatalog,
} from '@/content/grade-3'
import { publishedParams } from '../helpers/published-params'
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
  techSchema,
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
    const { megabytes } = usage(sample, lines)
    expect(megabytes).toBe(
      sample.rates.reduce((total, rate) => total + rate.megabytes * 2, 0),
    )
    expect(uploadMinutes(sample, megabytes)).toBe(
      Math.ceil(megabytes / sample.uploadRate),
    )
  })

  it('lo prometido es un total y ningún vector copiado de la pantalla lo alcanza', () => {
    for (const params of approved.slice(0, 40)) {
      // Copiar el piso de la feria en las tres casillas: válido, nunca óptimo.
      const floor = ITEMS.map((item) => ({
        itemId: item.id,
        quantity: params.minimum[item.id],
      }))
      const read = readTech(params, floor)
      expect(read.quality).not.toBe('optimal')
      // Y lo prometido no es un vector: es la suma.
      expect(params.promised).toBeGreaterThan(
        params.minimum.video +
          params.minimum.entrevistas +
          params.minimum.laminas,
      )
    }
  })

  it('las tasas cambian entre variantes, así que no hay una cosa barata siempre', () => {
    const cheapestByNotebook = new Set<number>()
    const cheapestByMegabytes = new Set<number>()
    for (const params of approved.slice(0, 40)) {
      const rates = [...params.rates]
      cheapestByNotebook.add(
        rates.indexOf(
          rates.reduce((best, rate) =>
            rate.notebook < best.notebook ? rate : best,
          ),
        ),
      )
      cheapestByMegabytes.add(
        rates.indexOf(
          rates.reduce((best, rate) =>
            rate.megabytes < best.megabytes ? rate : best,
          ),
        ),
      )
    }
    expect(cheapestByNotebook.size).toBeGreaterThanOrEqual(2)
    expect(cheapestByMegabytes.size).toBeGreaterThanOrEqual(2)
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

  it('la agregación coincide con los witnesses y rechaza cantidades fuera de contrato', () => {
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

// RS-RA-002: la verdad esperada se deriva aquí de las cantidades y restricciones,
// sin readTech/techPlans/usage/uploadMinutes, que son la misma ruta del evaluador.
describe('RS-RA-002 · catálogo publicado y oráculo independiente', () => {
  const variants = publishedParams(
    createGrade3Dependencies(),
    grade3VariantCatalog,
    'y3.course-project-tech',
    (x) => techSchema.parse(x),
  )
  const everything = ITEMS.map((item) => ({
    itemId: item.id,
    quantity: item.max,
  }))
  it.each(variants.map((p, index) => ({ p, index })))(
    'variante $index: todos los 1573 planes',
    ({ p }) => {
      const tiers = new Set<string>()
      let perfectTeam = false
      for (let v = 0; v <= 10; v++)
        for (let e = 0; e <= 10; e++)
          for (let l = 0; l <= 12; l++) {
            const [rv, re, rl] = p.rates
            const nb = rv.notebook * v + re.notebook * e + rl.notebook * l
            const mb = rv.megabytes * v + re.megabytes * e + rl.megabytes * l
            const valid =
              nb <= p.notebookMinutes &&
              mb <= p.megabytes &&
              mb <= p.labMinutes * p.uploadRate &&
              v >= p.minimum.video &&
              e >= p.minimum.entrevistas &&
              l >= p.minimum.laminas
            const pieces = v + e + l
            const expected = !valid
              ? 'invalid'
              : pieces >= p.promised
                ? 'optimal'
                : pieces + 2 >= p.promised
                  ? 'efficient'
                  : 'functional'
            const lines = [
              { itemId: 'video', quantity: v },
              { itemId: 'entrevistas', quantity: e },
              { itemId: 'laminas', quantity: l },
            ]
            const result = evaluateTech(p, lines)
            if (!result.ok) throw new Error('respuesta válida rechazada')
            expect(result.value.quality).toBe(expected)
            const carga = [rv.notebook * v, re.notebook * e, rl.notebook * l]
            const loads: Record<TechParams['tight'], number> = {
              nico: rv.notebook * v,
              sofi: re.notebook * e,
              tomi: rl.notebook * l,
            }
            const team = valid
              ? Number(v > 0 && e > 0 && l > 0) +
                Number(Math.max(...carga) - Math.min(...carga) <= p.spread) +
                Number(loads[p.tight] <= p.tightCap)
              : 0
            expect(result.value.metrics.efficiency).toBe(team / 3)
            if (expected === 'optimal' && team === 3) perfectTeam = true
            tiers.add(expected)
          }
      expect(tiers).toEqual(
        new Set(['invalid', 'functional', 'efficient', 'optimal']),
      )
      expect(perfectTeam).toBe(true)
      // Producir el máximo de todo nunca entra: los recursos aprietan.
      const dominating = evaluateTech(p, everything)
      expect(dominating.ok && dominating.value.quality).toBe('invalid')
    },
  )
})
