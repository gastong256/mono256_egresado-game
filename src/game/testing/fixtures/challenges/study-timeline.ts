/**
 * DEVELOPMENT FIXTURE — not final Egresado content.
 *
 * The "semana de pruebas" scenario: several free windows exist before the exam
 * and the subject needs a known number of minutes. The mathematics is duration
 * comparison; the decision is which window to commit to, where the tightest
 * sufficient window is the one that leaves the rest of the week usable.
 */

import { toChallengeId, toVariantId } from '../../../core/branded'
import { performanceFromRatio } from '../../../challenges/scoring-profile'
import {
  developmentVariantSource,
  type DevelopmentParams,
} from '../variant-source'
import { DEV_STUDY_FAMILY } from '../families'
import { err, ok, type Result } from '../../../core/result'
import type { EngineRejection } from '../../../core/errors'
import {
  defineChallenge,
  type ChallengeDefinition,
  type ChallengeEvaluation,
} from '../../../challenges/contracts'
import { efficiencyFromUsage, metrics } from '../../../challenges/evaluation'
import type { InteractionAnswer } from '../../../challenges/interactions'
import { fromInteger } from '../../../math/rational'

interface StudyWindow {
  readonly id: string
  readonly label: string
  readonly minutes: number
}

interface StudyTimelineModel {
  readonly subject: string
  readonly minutesNeeded: number
  readonly windows: readonly StudyWindow[]
  readonly bestId: string
}

const SUBJECTS = ['Matemática', 'Historia', 'Biología', 'Literatura']
const SLOTS: readonly { id: string; label: string }[] = [
  { id: 'monday-evening', label: 'Lunes a la tarde' },
  { id: 'wednesday-morning', label: 'Miércoles temprano' },
  { id: 'thursday-evening', label: 'Jueves a la noche' },
  { id: 'weekend', label: 'Sábado a la mañana' },
]

export const studyTimeline: ChallengeDefinition = defineChallenge<
  StudyTimelineModel,
  DevelopmentParams
>({
  id: toChallengeId('dev.study-timeline'),
  family: DEV_STUDY_FAMILY,
  placement: 'special',
  variants: [toVariantId('base')],
  variantSource: developmentVariantSource,
  interaction: 'timeline',
  categories: ['time-and-rates', 'optimization-and-constraints'],
  stages: ['year-1', 'year-2'],
  baseDifficulty: 2,
  cognitive: {
    steps: 2,
    constraints: 1,
    selection: 0,
    optimization: 0,
    uncertainty: 0,
    construction: 1,
  },
  // The only fixture that feeds the aura channel. Production content currently
  // has no non-duplicating aura evidence, so without this the aggregation of a
  // three-component score would never be exercised against real arithmetic.
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: ({ metrics }) => performanceFromRatio(metrics.precision),
    rationale:
      'Fixture: planning quality is the mathematics, and the precision of the plan under public commitment is the separate signal that exercises the aura component.',
  },
  tools: ['notepad'],

  generate({ rng }) {
    const minutesNeeded = rng.nextInt(45, 150)

    // At least one window is long enough and at least one is too short, so
    // the comparison always matters.
    const windows = SLOTS.map((slot, index) => ({
      ...slot,
      minutes:
        index === 0 ? minutesNeeded + rng.nextInt(5, 40) : rng.nextInt(30, 200),
    }))

    const sufficient = windows.filter(
      (window) => window.minutes >= minutesNeeded,
    )
    const best = sufficient.reduce<StudyWindow | undefined>(
      (tightest, window) =>
        tightest === undefined || window.minutes < tightest.minutes
          ? window
          : tightest,
      undefined,
    )

    return {
      subject: rng.pick(SUBJECTS),
      minutesNeeded,
      windows: rng.shuffle(windows),
      bestId: best?.id ?? 'monday-evening',
    }
  },

  verify(model) {
    const issues: string[] = []
    const sufficient = model.windows.filter(
      (window) => window.minutes >= model.minutesNeeded,
    )

    if (sufficient.length === 0) {
      issues.push('no window fits the required study time')
    }
    if (sufficient.length === model.windows.length) {
      issues.push('every window fits, so the comparison is decorative')
    }
    if (model.minutesNeeded <= 0) {
      issues.push('required study time must be positive')
    }

    const durations = sufficient.map((window) => window.minutes)
    if (durations.length > 1 && new Set(durations).size === 1) {
      issues.push('sufficient windows are indistinguishable')
    }

    return issues
  },

  narrate(model) {
    return {
      title: 'Semana de pruebas',
      setup: `Se viene la prueba de ${model.subject} y la semana ya está cargada.`,
      goal: 'Elegí el bloque que alcance sin bloquear toda la semana.',
    }
  },

  present(model) {
    return {
      kind: 'timeline',
      data: [
        {
          label: 'Necesitás estudiar',
          value: `${String(model.minutesNeeded)} min`,
        },
        { label: 'Materia', value: model.subject },
      ],
      unitLabel: 'minutos',
      options: model.windows.map((window) => ({
        id: window.id,
        label: window.label,
        detail: `${String(window.minutes)} min libres`,
      })),
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'timeline') {
      return err({
        kind: 'invalid-answer',
        detail: `expected timeline, received ${answer.kind}`,
      })
    }

    const chosen = model.windows.find((window) => window.id === answer.optionId)
    if (chosen === undefined) {
      return err({
        kind: 'invalid-answer',
        detail: `unknown option ${answer.optionId}`,
      })
    }

    const facts = [
      { label: 'Necesitabas', value: `${String(model.minutesNeeded)} min` },
      {
        label: 'Elegiste',
        value: `${chosen.label} (${String(chosen.minutes)} min)`,
      },
    ]

    if (chosen.minutes < model.minutesNeeded) {
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'study.tooShort',
          facts: [
            ...facts,
            {
              label: 'Faltaron',
              value: `${String(model.minutesNeeded - chosen.minutes)} min`,
            },
          ],
          violatedConstraint: 'study-time',
        },
        metrics: metrics({
          efficiency: 0,
          precision: chosen.minutes / model.minutesNeeded,
          risk: 0.7,
        }),
        careerEffects: { estilo: { axis: 'improvisador', amount: 6 } },
        flagEffects: [{ flag: 'study.underprepared', value: true }],
      })
    }

    const efficiency = efficiencyFromUsage(
      fromInteger(model.minutesNeeded),
      fromInteger(chosen.minutes),
    )

    if (chosen.id === model.bestId) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'study.tightFit',
          facts,
          optimalComparison:
            'Fue el bloque más ajustado que alcanzaba, así que el resto de la semana quedó libre.',
        },
        metrics: metrics({ efficiency, precision: 1, risk: 0.2 }),
        careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
        flagEffects: [{ flag: 'study.planned', value: true }],
      })
    }

    return ok({
      quality: efficiency >= 0.75 ? 'efficient' : 'functional',
      feedback: {
        outcomeKey: 'study.sufficient',
        facts: [
          ...facts,
          {
            label: 'Tiempo bloqueado de más',
            value: `${String(chosen.minutes - model.minutesNeeded)} min`,
          },
        ],
      },
      metrics: metrics({ efficiency, precision: 1, risk: 0.1 }),
      careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
      flagEffects: [],
    })
  },
})
