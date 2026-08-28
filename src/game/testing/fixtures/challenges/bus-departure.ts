/**
 * DEVELOPMENT FIXTURE — not final Egresado content.
 *
 * The "colectivo" scenario: a scheduled trip, a percentage delay and a fixed
 * arrival deadline. The player estimates how many minutes before the bell they
 * need to leave. The mathematics is time plus a percentage applied to a
 * duration; the decision is planning margin.
 *
 * Time is kept in whole minutes throughout, which is the internal precision the
 * challenge declares. The answer tolerance is explicit rather than a float
 * comparison.
 */

import { toChallengeId, toVariantId } from '../../../core/branded'
import { DEV_BUS_FAMILY } from '../families'
import { err, ok, type Result } from '../../../core/result'
import type { EngineRejection } from '../../../core/errors'
import {
  defineChallenge,
  type ChallengeDefinition,
  type ChallengeEvaluation,
} from '../../../challenges/contracts'
import { metrics, precisionFromDistance } from '../../../challenges/evaluation'
import type { InteractionAnswer } from '../../../challenges/interactions'
import {
  absolute,
  add,
  compare,
  fromDecimalString,
  fromInteger,
  subtract,
  toNumber,
  type Rational,
} from '../../../math/rational'
import { formatDecimal, percentOf, roundTo } from '../../../math/rounding'
import { withinTolerance, type Tolerance } from '../../../math/tolerance'

interface BusModel {
  readonly scheduledMinutes: number
  readonly delayPercent: number
  readonly totalMinutes: Rational
  readonly entryLabel: string
  readonly tolerance: Tolerance
}

/** Formats minutes-of-day as HH:MM without touching a clock. */
function formatClock(minutesOfDay: number): string {
  const hours = Math.floor(minutesOfDay / 60)
  const minutes = minutesOfDay % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export const busDeparture: ChallengeDefinition = defineChallenge<BusModel>({
  id: toChallengeId('dev.bus-departure'),
  family: DEV_BUS_FAMILY,
  placement: 'anchor',
  variants: [toVariantId('base')],
  interaction: 'numeric-input',
  categories: ['time-and-rates', 'proportions-and-percentages'],
  stages: ['grade-7', 'year-1', 'year-2'],
  baseDifficulty: 2,
  tools: ['calculator', 'notepad'],

  generate({ rng, difficulty }) {
    const scheduledMinutes = rng.nextInt(18, 42)
    // Percentages that keep the result a whole number of minutes at the lower
    // difficulties, so early stages never require rounding to answer.
    const delayPercent =
      difficulty <= 2 ? rng.pick([25, 50]) : rng.pick([15, 20, 25, 35, 40])

    const scheduled = fromInteger(scheduledMinutes)
    // The bus company announces delays as a percentage of the timetable.
    const totalMinutes = roundTo(
      add(scheduled, percentOf(scheduled, fromInteger(delayPercent))),
      0,
      'half-up',
    )

    const entryMinutes = rng.pick([7 * 60 + 30, 7 * 60 + 45, 8 * 60])

    return {
      scheduledMinutes,
      delayPercent,
      totalMinutes,
      entryLabel: formatClock(entryMinutes),
      // Two minutes of slack acknowledges that the player is estimating a
      // departure, not solving for an exact instant.
      tolerance: { kind: 'absolute', amount: fromInteger(2) },
    }
  },

  verify(model) {
    const issues: string[] = []

    if (model.scheduledMinutes <= 0) {
      issues.push('scheduled trip must be positive')
    }
    if (model.delayPercent <= 0) {
      issues.push('a delay of zero makes the percentage decorative')
    }
    if (compare(model.totalMinutes, fromInteger(model.scheduledMinutes)) <= 0) {
      issues.push('the delayed trip must exceed the scheduled trip')
    }
    if (compare(model.totalMinutes, fromInteger(180)) > 0) {
      issues.push('trip duration exceeds a believable school commute')
    }

    return issues
  },

  narrate() {
    return {
      title: 'El colectivo',
      setup: 'El colectivo viene con demora y no querés entrar tarde otra vez.',
      goal: 'Estimá cuántos minutos antes de la entrada tenés que salir.',
    }
  },

  present(model) {
    return {
      kind: 'numeric-input',
      data: [
        {
          label: 'Viaje sin demora',
          value: `${String(model.scheduledMinutes)} min`,
        },
        { label: 'Demora habitual', value: `${String(model.delayPercent)} %` },
        { label: 'Entrada', value: model.entryLabel },
      ],
      unitLabel: 'minutos',
      min: '0',
      max: '180',
      step: '1',
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'numeric-input') {
      return err({
        kind: 'invalid-answer',
        detail: `expected numeric-input, received ${answer.kind}`,
      })
    }

    let submitted: Rational
    try {
      submitted = fromDecimalString(answer.value)
    } catch {
      return err({
        kind: 'invalid-answer',
        detail: `"${answer.value}" is not a decimal literal`,
      })
    }

    if (compare(submitted, fromInteger(0)) < 0) {
      return err({
        kind: 'invalid-answer',
        detail: 'departure margin cannot be negative',
      })
    }

    const facts = [
      {
        label: 'Viaje con demora',
        value: `${formatDecimal(model.totalMinutes, 0)} min`,
      },
      { label: 'Tu margen', value: `${answer.value} min` },
    ]

    const late = compare(submitted, model.totalMinutes) < 0
    const precision = precisionFromDistance(submitted, model.totalMinutes)
    const exact = compare(submitted, model.totalMinutes) === 0
    const acceptable = withinTolerance(
      submitted,
      model.totalMinutes,
      model.tolerance,
    )

    if (late && !acceptable) {
      const missing = subtract(model.totalMinutes, submitted)
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'bus.late',
          facts: [
            ...facts,
            {
              label: 'Llegás tarde por',
              value: `${formatDecimal(missing, 0)} min`,
            },
          ],
          violatedConstraint: 'arrival-deadline',
        },
        metrics: metrics({ efficiency: 0, precision, risk: 0.8 }),
        careerEffects: { estilo: { axis: 'improvisador', amount: 6 } },
        flagEffects: [{ flag: 'bus.late', value: true }],
      })
    }

    if (exact) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'bus.optimal',
          facts,
          optimalComparison: 'Calculaste la demora exacta.',
        },
        metrics: metrics({ efficiency: 1, precision: 1, risk: 0.2 }),
        careerEffects: { estilo: { axis: 'estratega', amount: 6 } },
        flagEffects: [{ flag: 'bus.onTime', value: true }],
      })
    }

    const slack = absolute(subtract(submitted, model.totalMinutes))
    const wastedMargin = compare(submitted, model.totalMinutes) > 0

    return ok({
      quality: acceptable ? 'efficient' : 'functional',
      feedback: {
        outcomeKey: wastedMargin ? 'bus.early' : 'bus.tight',
        facts: [
          ...facts,
          {
            label: wastedMargin ? 'Esperaste de más' : 'Margen ajustado',
            value: `${formatDecimal(slack, 0)} min`,
          },
        ],
      },
      metrics: metrics({
        efficiency: wastedMargin ? Math.max(0, 1 - toNumber(slack) / 30) : 1,
        precision,
        risk: wastedMargin ? 0.1 : 0.6,
      }),
      careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
      flagEffects: [],
    })
  },
})
