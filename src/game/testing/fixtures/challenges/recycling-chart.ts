/**
 * DEVELOPMENT FIXTURE — not final Egresado content.
 *
 * The "campaña de reciclaje" scenario: each year collects a different total,
 * but the years have different sizes. The mathematics is a ratio; the trap is
 * comparing absolute totals, which is exactly the misreading the challenge
 * exists to surface.
 *
 * Comparison is done on exact rationals, so two courses with genuinely equal
 * kilograms per student are detected as a tie instead of being separated by
 * floating point noise.
 */

import { toChallengeId } from '../../../core/branded'
import { err, ok, type Result } from '../../../core/result'
import type { EngineRejection } from '../../../core/errors'
import {
  defineChallenge,
  type ChallengeDefinition,
  type ChallengeEvaluation,
} from '../../../challenges/contracts'
import { metrics } from '../../../challenges/evaluation'
import type { InteractionAnswer } from '../../../challenges/interactions'
import {
  compare,
  divide,
  fromInteger,
  toNumber,
  type Rational,
} from '../../../math/rational'
import { formatDecimal } from '../../../math/rounding'

interface CourseResult {
  readonly id: string
  readonly label: string
  readonly kilograms: number
  readonly students: number
  readonly perStudent: Rational
}

interface RecyclingModel {
  readonly courses: readonly CourseResult[]
  readonly bestId: string
  readonly highestTotalId: string
}

const COURSE_LABELS = ['2.º A', '3.º B', '4.º C', '5.º A']

export const recyclingChart: ChallengeDefinition =
  defineChallenge<RecyclingModel>({
    id: toChallengeId('dev.recycling-chart'),
    interaction: 'chart-interpretation',
    categories: ['data-and-statistics', 'proportions-and-percentages'],
    stages: ['year-2', 'year-3', 'year-4'],
    baseDifficulty: 3,
    tools: ['calculator'],

    generate({ rng }) {
      const labels = rng.shuffle(COURSE_LABELS).slice(0, 3)

      // The trap is built in, not hoped for. One course is given the largest
      // absolute total *and* a large cohort, while another is given a smaller
      // total spread over a small cohort so it wins on kilograms per student.
      // Rejection sampling cannot be relied on here: whether the misleading
      // reading exists is a structural property, not a lucky draw.
      const bestStudents = rng.nextInt(12, 18)
      const bestRatio = rng.nextInt(8, 14)
      const bestKilograms = bestStudents * bestRatio

      const loudStudents = rng.nextInt(30, 40)
      // Strictly more kilograms than the winner, but a ratio that stays below
      // it: kg < bestRatio * students guarantees the second condition.
      const loudUpperBound = bestRatio * loudStudents - 1
      const loudKilograms = rng.nextInt(
        bestKilograms + 1,
        Math.max(bestKilograms + 2, loudUpperBound),
      )

      // The third course sits strictly between the two on both measures, so no
      // ratio ties with either of them.
      const thirdStudents = rng.nextInt(20, 28)
      const thirdKilograms = rng.nextInt(
        Math.max(1, Math.round(thirdStudents * 2)),
        Math.max(
          2,
          Math.min(bestKilograms - 1, thirdStudents * (bestRatio - 1)),
        ),
      )

      const raw = [
        { students: bestStudents, kilograms: bestKilograms, role: 'best' },
        { students: loudStudents, kilograms: loudKilograms, role: 'loud' },
        { students: thirdStudents, kilograms: thirdKilograms, role: 'third' },
      ]

      const courses = raw.map((entry, index) => ({
        id: `course-${String(index)}`,
        label: labels[index] ?? `Curso ${String(index)}`,
        kilograms: entry.kilograms,
        students: entry.students,
        perStudent: divide(
          fromInteger(entry.kilograms),
          fromInteger(entry.students),
        ),
      }))

      let best = courses[0]
      let highestTotal = courses[0]
      for (const course of courses) {
        if (
          best !== undefined &&
          compare(course.perStudent, best.perStudent) > 0
        ) {
          best = course
        }
        if (
          highestTotal !== undefined &&
          course.kilograms > highestTotal.kilograms
        ) {
          highestTotal = course
        }
      }

      return {
        courses,
        bestId: best?.id ?? 'course-0',
        highestTotalId: highestTotal?.id ?? 'course-0',
      }
    },

    verify(model) {
      const issues: string[] = []

      if (model.courses.length < 2) {
        issues.push('at least two courses are needed to compare')
      }
      if (model.bestId === model.highestTotalId) {
        // Without this the absolute total and the ratio agree and the
        // challenge stops teaching anything.
        issues.push(
          'the largest total is also the best ratio, so the trap is absent',
        )
      }

      const ratios = model.courses.map((course) =>
        formatDecimal(course.perStudent, 4),
      )
      if (new Set(ratios).size !== ratios.length) {
        issues.push('two courses tie on kilograms per student')
      }
      if (model.courses.some((course) => course.students <= 0)) {
        issues.push('course size must be positive')
      }

      return issues
    },

    narrate() {
      return {
        title: 'Campaña de reciclaje',
        setup:
          'Terminó la campaña y cada curso juntó una cantidad distinta de papel.',
        goal: 'Decidí qué curso tuvo mejor participación.',
      }
    },

    present(model) {
      return {
        kind: 'chart-interpretation',
        axisLabel: 'kg juntados',
        series: model.courses.map((course) => ({
          label: `${course.label} (${String(course.students)} alumnos)`,
          value: course.kilograms,
          display: `${String(course.kilograms)} kg`,
        })),
        options: model.courses.map((course) => ({
          id: course.id,
          label: course.label,
          detail: `${String(course.kilograms)} kg · ${String(course.students)} alumnos`,
        })),
      }
    },

    evaluate(
      model,
      answer: InteractionAnswer,
    ): Result<ChallengeEvaluation, EngineRejection> {
      if (answer.kind !== 'chart-interpretation') {
        return err({
          kind: 'invalid-answer',
          detail: `expected chart-interpretation, received ${answer.kind}`,
        })
      }

      const chosen = model.courses.find(
        (course) => course.id === answer.optionId,
      )
      if (chosen === undefined) {
        return err({
          kind: 'invalid-answer',
          detail: `unknown option ${answer.optionId}`,
        })
      }

      const best = model.courses.find((course) => course.id === model.bestId)
      if (best === undefined) {
        return err({
          kind: 'invalid-content',
          issues: ['the winning course is missing from the model'],
        })
      }

      const facts = model.courses.map((course) => ({
        label: course.label,
        value: `${formatDecimal(course.perStudent, 2)} kg por alumno`,
      }))

      if (chosen.id === model.bestId) {
        return ok({
          quality: 'optimal',
          feedback: {
            outcomeKey: 'recycling.ratio',
            facts,
            optimalComparison:
              'Comparaste kilos por alumno y no el total absoluto.',
          },
          metrics: metrics({ efficiency: 1, precision: 1, risk: 0 }),
          statEffects: [
            { stat: 'knowledge', delta: 2 },
            { stat: 'team', delta: 1 },
          ],
          flagEffects: [{ flag: 'recycling.readRatio', value: true }],
        })
      }

      const precision = Math.min(
        1,
        toNumber(divide(chosen.perStudent, best.perStudent)),
      )

      if (chosen.id === model.highestTotalId) {
        return ok({
          quality: 'invalid',
          feedback: {
            outcomeKey: 'recycling.absoluteTotal',
            facts,
            violatedConstraint: 'course-size',
            optimalComparison: `${best.label} juntó ${formatDecimal(best.perStudent, 2)} kg por alumno.`,
          },
          metrics: metrics({ efficiency: 0, precision, risk: 0.4 }),
          statEffects: [{ stat: 'knowledge', delta: 0 }],
          flagEffects: [{ flag: 'recycling.readTotals', value: true }],
        })
      }

      return ok({
        quality: 'functional',
        feedback: {
          outcomeKey: 'recycling.other',
          facts,
          optimalComparison: `${best.label} tuvo la mejor proporción.`,
        },
        metrics: metrics({ efficiency: 0.4, precision, risk: 0.3 }),
        statEffects: [{ stat: 'knowledge', delta: 1 }],
        flagEffects: [],
      })
    },
  })
