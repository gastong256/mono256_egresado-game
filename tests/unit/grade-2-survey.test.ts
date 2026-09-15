import { describe, expect, it } from 'vitest'
import { cognitiveLoad } from '@/game'
import {
  CLAIM_LABELS,
  REVIEW_SPACE,
  SURVEY_SPACE,
  courseProjectSurvey,
  dataClaimReview,
  evaluateReview,
  evaluateSurvey,
  generateReview,
  generateSurvey,
  reviewClaims,
  reviewGates,
  surveyClaims,
  surveyGates,
  surveyPlans,
  type ReviewParams,
  type SurveyParams,
} from '@/content/grade-2/challenges/course-project-survey'

const approved: readonly SurveyParams[] = Array.from(
  { length: SURVEY_SPACE },
  (_, index) => generateSurvey(index),
).filter((params) => surveyGates(params).length === 0)

const approvedReviews: readonly ReviewParams[] = Array.from(
  { length: REVIEW_SPACE },
  (_, index) => generateReview(index),
).filter((params) => reviewGates(params).length === 0)

const label = (p: SurveyParams, chosen: (supported: boolean) => boolean) =>
  surveyClaims(p).map((claim) => ({
    statementId: claim.id,
    labelId: chosen(claim.supported) ? 'publish' : 'hold',
  }))

describe('2.º · la encuesta del Proyecto del Curso', () => {
  it('aprueba un catálogo suficiente en las tres formas semánticas', () => {
    expect(approved.length).toBeGreaterThanOrEqual(12)
    expect(new Set(approved.map((p) => p.shape))).toEqual(
      new Set(['denominator', 'missing-data', 'margin']),
    )
    for (const shape of ['denominator', 'missing-data', 'margin'] as const)
      expect(
        approved.filter((p) => p.shape === shape).length,
      ).toBeGreaterThanOrEqual(8)
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

  it.each(approved.slice(0, 20).map((p, i) => [i, p] as const))(
    '%s: el oráculo independiente coincide con el evaluador en todas las clasificaciones',
    (_, p) => {
      for (const plan of surveyPlans(p)) {
        const result = evaluateSurvey(p, plan.entries)
        expect(result.ok && result.value.quality).toBe(plan.quality)
      }
    },
  )

  it('publicar una afirmación que los datos no sostienen es el error grave', () => {
    for (const p of approved) {
      expect(
        evaluateSurvey(
          p,
          label(p, () => true),
        ).ok,
      ).toBe(true)
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

  it('Intrinsic Math Gate: el denominador decide, salvo cuando la pelea es pareja', () => {
    for (const p of approved) {
      const claims = surveyClaims(p)
      const ofAnswers = claims.find((c) => c.id === 'half-of-answers')!
      const ofYear = claims.find((c) => c.id === 'half-of-year')!
      if (p.shape === 'margin') expect(ofAnswers.supported).toBe(false)
      else {
        expect(ofAnswers.supported).toBe(true)
        expect(ofYear.supported).toBe(false)
      }
      // Nunca se puede afirmar qué prefiere quien no contestó.
      expect(claims.find((c) => c.id === 'year-prefers')!.supported).toBe(false)
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
    expect(approvedReviews.length).toBeGreaterThanOrEqual(8)
    expect(dataClaimReview.placement).toBe('recovery')
    expect(dataClaimReview.composition?.pacingClass).toBe('QUICK')
    expect(cognitiveLoad(dataClaimReview.cognitive)).toBeLessThan(
      cognitiveLoad(courseProjectSurvey.cognitive),
    )
    expect(reviewClaims(approvedReviews[0]!)).toHaveLength(3)
  })

  it('la misma cifra sostiene una afirmación y no la otra', () => {
    for (const p of approvedReviews) {
      const claims = reviewClaims(p)
      expect(claims.find((c) => c.id === 'of-answers')!.supported).toBe(true)
      expect(claims.find((c) => c.id === 'of-year')!.supported).toBe(false)
      expect(claims.find((c) => c.id === 'unknown')!.supported).toBe(false)
      const exact = evaluateReview(
        p,
        claims.map((claim) => ({
          statementId: claim.id,
          labelId: claim.supported ? 'publish' : 'hold',
        })),
      )
      expect(exact.ok && exact.value.quality).toBe('optimal')
      const forced = evaluateReview(
        p,
        claims.map((claim) => ({ statementId: claim.id, labelId: 'publish' })),
      )
      expect(forced.ok && forced.value.quality).toBe('invalid')
    }
    expect(CLAIM_LABELS).toHaveLength(2)
  })
})
