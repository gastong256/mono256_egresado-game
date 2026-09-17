import { describe, expect, it } from 'vitest'
import { cognitiveLoad, type SolutionQuality } from '@/game'
import { materializeVariant } from '@/game/testing'
import {
  createGrade2Dependencies,
  grade2VariantCatalog,
} from '@/content/grade-2'
import {
  CLAIM_LABELS,
  PUBLICATION_RULE,
  PUBLICATION_RULE_TEXT,
  WHOLE_YEAR_RULE_TEXT,
  courseProjectSurvey,
  dataClaimReview,
  evaluateReview,
  evaluateSurvey,
  meetsPublicationRule,
  reviewClaims,
  reviewKey,
  reviewSchema,
  surveyClaims,
  surveyKey,
  surveyPlans,
  surveySchema,
  type ReviewParams,
  type SurveyParams,
} from '@/content/grade-2/challenges/course-project-survey'
import { publishedParams } from '../helpers/published-params'

const dependencies = createGrade2Dependencies()
const approved: readonly SurveyParams[] = publishedParams(
  dependencies,
  grade2VariantCatalog,
  'y2.course-project-survey',
  (params) => surveySchema.parse(params),
)
const approvedReviews: readonly ReviewParams[] = publishedParams(
  dependencies,
  grade2VariantCatalog,
  'y2.data-claim-review',
  (params) => reviewSchema.parse(params),
)

const label = (p: SurveyParams, chosen: (supported: boolean) => boolean) =>
  surveyClaims(p).map((claim) => ({
    statementId: claim.id,
    labelId: chosen(claim.supported) ? 'publish' : 'hold',
  }))

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0)

/** La escalera de la encuesta, escrita de nuevo acá y no importada. */
function ladder(truths: readonly boolean[], published: readonly boolean[]) {
  const falsePublished = truths.filter((t, i) => !t && published[i]).length
  const missed = truths.filter((t, i) => t && !published[i]).length
  const quality: SolutionQuality =
    falsePublished > 0
      ? 'invalid'
      : missed === 0
        ? 'optimal'
        : missed === 1
          ? 'efficient'
          : 'functional'
  return quality
}

describe('2.º · la encuesta del Proyecto del Curso', () => {
  it('publica un catálogo suficiente en sus cuatro formas semánticas', () => {
    expect(approved.length).toBeGreaterThanOrEqual(20)
    expect(new Set(approved.map((p) => p.shape))).toEqual(
      new Set(['denominator', 'missing-data', 'margin', 'high-response']),
    )
  })

  it('declara datos como familia primaria y no reparte evidencia competitiva extra', () => {
    expect(courseProjectSurvey.composition).toMatchObject({
      primaryReasoningFamily: 'DATA_UNCERTAINTY',
      interactionEngine: 'choice-compare',
      pacingClass: 'MEDIUM',
      recurringArc: 'PROJECT',
    })
    expect(courseProjectSurvey.placement).toBe('anchor')
    expect(courseProjectSurvey.scoring.team).toBe('none')
    expect(courseProjectSurvey.scoring.aura).toBe('none')
    expect(cognitiveLoad(courseProjectSurvey.cognitive)).toBe(6)
    expect(courseProjectSurvey.band).toBe('standard')
  })

  it('el evaluador coincide con una escalera independiente en las 64 clasificaciones de cada variante', () => {
    for (const p of approved) {
      const [first = 0, second = 0, third = 0] = p.answers
      const n = sum(p.answers)
      const silent = p.population - n
      // Las seis verdades, recalculadas sin el módulo.
      const truths = [
        first > second && first > third,
        first * 2 > n,
        first * 2 > p.population,
        first - Math.max(second, third) > silent,
        (first - second) * 10 > n,
        third < first && third < second,
      ]
      expect(surveyClaims(p).map((claim) => claim.supported)).toEqual(truths)
      for (let mask = 0; mask < 64; mask++) {
        const published = truths.map((_, i) => (mask >> i) % 2 === 1)
        const entries = surveyClaims(p).map((claim, i) => ({
          statementId: claim.id,
          labelId: published[i] ? 'publish' : 'hold',
        }))
        const result = evaluateSurvey(p, entries)
        expect(result.ok && result.value.quality).toBe(
          ladder(truths, published),
        )
      }
      expect(surveyPlans(p)).toHaveLength(64)
    }
  })

  it('publicar una afirmación que los datos no sostienen es el error grave', () => {
    for (const p of approved) {
      const all = evaluateSurvey(
        p,
        label(p, () => true),
      )
      expect(all.ok && all.value.quality).toBe('invalid')
      const exact = evaluateSurvey(
        p,
        label(p, (supported) => supported),
      )
      expect(exact.ok && exact.value.quality).toBe('optimal')
      const nothing = evaluateSurvey(
        p,
        label(p, () => false),
      )
      expect(nothing.ok && nothing.value.quality).toBe('functional')
    }
  })

  it('RS-MAT-003: la afirmación del margen está acotada a quienes contestaron y usa la regla visible', () => {
    for (const p of approved) {
      const claim = surveyClaims(p).find((c) => c.id === 'beats-runner-up')!
      expect(claim.label).toMatch(/^Entre quienes contestaron, /u)
      expect(claim.label).toContain('según la regla del curso')
      expect(claim.label).not.toContain('con claridad')
    }
  })

  it('RS-MAT-003: pantalla, evaluador y oráculo leen la misma regla de publicación', () => {
    expect(PUBLICATION_RULE_TEXT).toContain(
      `más de 1 de cada ${String(PUBLICATION_RULE.oneIn)} respuestas`,
    )
    for (let answers = 20; answers <= 150; answers++)
      for (let difference = 0; difference <= 30; difference++)
        expect(meetsPublicationRule(difference, answers)).toBe(
          difference * PUBLICATION_RULE.oneIn > answers,
        )
    for (const p of approved) {
      const [first = 0, second = 0] = p.answers
      const claim = surveyClaims(p).find((c) => c.id === 'beats-runner-up')!
      expect(claim.supported).toBe(
        meetsPublicationRule(first - second, sum(p.answers)),
      )
    }
    const entry = grade2VariantCatalog.entries.find(
      (candidate) =>
        (candidate.templateId as string) === 'y2.course-project-survey',
    )!
    const view = materializeVariant(courseProjectSurvey, {
      variantId: entry.variantId,
      seed: 'regla',
    }).present([])
    if (view.kind !== 'classification')
      throw new Error('se esperaba clasificación')
    expect(view.instructions).toContain(PUBLICATION_RULE_TEXT)
    expect(view.instructions).toContain(WHOLE_YEAR_RULE_TEXT)
  })

  it('RS-MAT-003: ninguna variante queda a una respuesta del borde de la regla', () => {
    for (const p of approved) {
      const [first = 0, second = 0] = p.answers
      const n = sum(p.answers)
      const d = first - second
      expect(meetsPublicationRule(d - 1, n)).toBe(meetsPublicationRule(d, n))
      expect(meetsPublicationRule(d + 1, n)).toBe(meetsPublicationRule(d, n))
    }
  })

  it('RS-MAT-003: la consigna no usa vocabulario inferencial ni criterios ocultos', () => {
    const forbidden = [
      'significativ',
      'estadísticamente',
      'probablemente',
      'margen de error',
      'confianza',
      'con claridad',
    ]
    for (const entry of grade2VariantCatalog.entries.filter(
      (candidate) =>
        (candidate.templateId as string) === 'y2.course-project-survey',
    )) {
      const instance = materializeVariant(courseProjectSurvey, {
        variantId: entry.variantId,
        seed: 'vocabulario',
      })
      const text = JSON.stringify([
        instance.narrative,
        instance.present([]),
      ]).toLowerCase()
      for (const word of forbidden) expect(text).not.toContain(word)
    }
  })

  it('RS-MAT-004: «el nivel entero prefiere» se decide con la cota de peor caso, sin empate en el borde', () => {
    for (const p of approved) {
      const [first = 0, second = 0, third = 0] = p.answers
      const silent = p.population - sum(p.answers)
      // Peor caso: toda la gente que no contestó elige la misma otra opción.
      const survives = [second, third].every((other) => first > other + silent)
      const claim = surveyClaims(p).find((c) => c.id === 'year-prefers')!
      expect(claim.supported).toBe(survives)
      expect(first - Math.max(second, third)).not.toBe(silent)
    }
  })

  it('RS-MAT-004: al menos cuatro afirmaciones varían y hay al menos cuatro claves', () => {
    const keys = approved.map(surveyKey)
    expect(new Set(keys).size).toBeGreaterThanOrEqual(4)
    const varying = [0, 1, 2, 3, 4, 5].filter(
      (i) => new Set(keys.map((key) => key[i])).size === 2,
    )
    expect(varying.length).toBeGreaterThanOrEqual(4)
  })

  it('RS-MAT-004: ninguna forma semántica determina la clave', () => {
    for (const shape of new Set(approved.map((p) => p.shape)))
      expect(
        new Set(approved.filter((p) => p.shape === shape).map(surveyKey)).size,
      ).toBeGreaterThanOrEqual(2)
  })

  it('RS-MAT-004: el contraste de denominador sigue en al menos la mitad del catálogo y la trampa del margen existe', () => {
    const contrast = approved.filter((p) => {
      const claims = surveyClaims(p)
      return claims[1]!.supported && !claims[2]!.supported
    })
    expect(contrast.length * 2).toBeGreaterThanOrEqual(approved.length)
    expect(
      approved.some((p) => {
        const claims = surveyClaims(p)
        return claims[0]!.supported && !claims[4]!.supported
      }),
    ).toBe(true)
  })

  it('RS-MAT-004: la opción que el curso publica es siempre la más elegida, con al menos dos ciertas y dos que no', () => {
    for (const p of approved) {
      const [first = 0, second = 0, third = 0] = p.answers
      expect(first).toBeGreaterThan(second)
      expect(first).toBeGreaterThan(third)
      const supported = surveyClaims(p).filter((c) => c.supported).length
      expect(supported).toBeGreaterThanOrEqual(2)
      expect(6 - supported).toBeGreaterThanOrEqual(2)
    }
  })

  it('cierra la frontera de payload antes de evaluar', () => {
    const p = approved[0]!
    const claims = surveyClaims(p)
    for (const bad of [
      [],
      [{ statementId: claims[0]!.id, labelId: 'publish' }],
      claims.map(() => ({ statementId: claims[0]!.id, labelId: 'publish' })),
      claims.map((claim) => ({ statementId: claim.id, labelId: 'quizas' })),
      claims.map((claim) => ({
        statementId: `${claim.id}x`,
        labelId: 'publish',
      })),
    ])
      expect(evaluateSurvey(p, bad).ok).toBe(false)
  })
})

describe('2.º · repaso del denominador', () => {
  it('aísla el concepto, es más corto y no puntúa', () => {
    expect(approvedReviews.length).toBeGreaterThanOrEqual(20)
    expect(dataClaimReview.placement).toBe('recovery')
    expect(dataClaimReview.composition?.pacingClass).toBe('QUICK')
    expect(cognitiveLoad(dataClaimReview.cognitive)).toBeLessThan(
      cognitiveLoad(courseProjectSurvey.cognitive),
    )
    expect(reviewClaims(approvedReviews[0]!)).toHaveLength(3)
    expect(CLAIM_LABELS).toHaveLength(2)
  })

  it('RS-MAT-002: el catálogo trae los tres casos posibles, con el contraste del denominador como mayoría', () => {
    const count = (key: string) =>
      approvedReviews.filter((p) => reviewKey(p) === key).length
    const n = approvedReviews.length
    expect(count('TF') * 100).toBeGreaterThanOrEqual(n * 40)
    expect(count('TF') * 100).toBeLessThanOrEqual(n * 60)
    expect(count('TT') * 100).toBeGreaterThanOrEqual(n * 15)
    expect(count('FF') * 100).toBeGreaterThanOrEqual(n * 15)
    expect(count('FT')).toBe(0)
  })

  it('RS-MAT-002: ninguna variante pone la cifra exactamente en la mitad', () => {
    for (const p of approvedReviews) {
      expect(p.chose * 2).not.toBe(p.answered)
      expect(p.chose * 2).not.toBe(p.population)
      expect(p.answered).toBeLessThan(p.population)
    }
  })

  it('RS-MAT-002: las 8 clasificaciones coinciden con un oráculo independiente, y functional existe cuando las dos cuentas dan sí', () => {
    for (const p of approvedReviews) {
      const truths = [
        p.chose * 2 > p.answered,
        p.chose * 2 > p.population,
        false,
      ]
      expect(reviewClaims(p).map((claim) => claim.supported)).toEqual(truths)
      const reached = new Set<SolutionQuality>()
      for (let mask = 0; mask < 8; mask++) {
        const published = truths.map((_, i) => (mask >> i) % 2 === 1)
        const wrong = truths.filter((t, i) => t !== published[i]).length
        const expected: SolutionQuality = truths.some(
          (t, i) => !t && published[i],
        )
          ? 'invalid'
          : wrong === 0
            ? 'optimal'
            : wrong === 1
              ? 'efficient'
              : 'functional'
        const result = evaluateReview(
          p,
          reviewClaims(p).map((claim, i) => ({
            statementId: claim.id,
            labelId: published[i] ? 'publish' : 'hold',
          })),
        )
        expect(result.ok && result.value.quality).toBe(expected)
        reached.add(expected)
      }
      if (reviewKey(p) === 'TT') expect(reached.has('functional')).toBe(true)
    }
  })
})
