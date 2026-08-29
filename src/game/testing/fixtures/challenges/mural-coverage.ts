/**
 * DEVELOPMENT FIXTURE — not final Egresado content.
 *
 * Exercises the canonical "mural" scenario from `challenge-system.md`: a wall
 * has to be covered, paint is sold in fixed tins, and the player picks a tin.
 * The mathematics is area and coverage; the decision is a purchase.
 *
 * Objective function: minimum cost among options that actually cover the wall.
 */

import { toChallengeId, toVariantId } from '../../../core/branded'
import {
  developmentVariantSource,
  type DevelopmentParams,
} from '../variant-source'
import { DEV_MURAL_FAMILY } from '../families'
import { err, ok, type Result } from '../../../core/result'
import type { EngineRejection } from '../../../core/errors'
import {
  defineChallenge,
  type ChallengeDefinition,
  type ChallengeEvaluation,
} from '../../../challenges/contracts'
import {
  efficiencyFromUsage,
  metrics,
  precisionFromDistance,
} from '../../../challenges/evaluation'
import type {
  InteractionAnswer,
  PresentedOption,
} from '../../../challenges/interactions'
import {
  divide,
  fromDecimalString,
  fromInteger,
  greaterThan,
  greaterThanOrEqual,
  multiply,
  subtract,
  type Rational,
} from '../../../math/rational'
import { formatDecimal } from '../../../math/rounding'
import { formatMoney, money } from '../../../math/quantity'

interface PaintOption {
  readonly id: string
  readonly litres: Rational
  readonly priceMinor: number
}

interface MuralModel {
  readonly width: Rational
  readonly height: Rational
  readonly coveragePerLitre: Rational
  readonly area: Rational
  readonly requiredLitres: Rational
  readonly options: readonly PaintOption[]
}

const WIDTH_STEPS = ['3.0', '4.0', '4.5', '5.0', '6.0', '7.0', '8.0']
const HEIGHT_STEPS = ['2.0', '2.2', '2.4', '2.6', '3.0']
const COVERAGE_STEPS = [6, 8, 10]
const TIN_SIZES = ['1', '2', '4', '5']

export const muralCoverage: ChallengeDefinition = defineChallenge<
  MuralModel,
  DevelopmentParams
>({
  id: toChallengeId('dev.mural-coverage'),
  family: DEV_MURAL_FAMILY,
  placement: 'checkpoint',
  variants: [toVariantId('base')],
  variantSource: developmentVariantSource,
  interaction: 'decision-card',
  categories: ['space-and-shape', 'quantity'],
  stages: ['grade-7', 'year-1'],
  baseDifficulty: 2,
  cognitive: {
    steps: 2,
    constraints: 1,
    selection: 0,
    optimization: 1,
    uncertainty: 0,
    construction: 0,
  },
  tools: ['calculator'],

  generate({ rng, difficulty }) {
    // Higher difficulty widens the parameter space toward awkward decimals.
    const widthPool = difficulty <= 2 ? WIDTH_STEPS.slice(0, 4) : WIDTH_STEPS
    const heightPool = difficulty <= 2 ? HEIGHT_STEPS.slice(0, 3) : HEIGHT_STEPS

    const width = fromDecimalString(rng.pick(widthPool))
    const height = fromDecimalString(rng.pick(heightPool))
    const area = multiply(width, height)

    // Coverage is chosen so the wall always needs more than the smallest tin.
    // Otherwise every option would be sufficient and the decision would be
    // decorative — an invariant the generator would then have to reject.
    const smallestTin = fromDecimalString(TIN_SIZES[0] ?? '1')
    const viableCoverage = COVERAGE_STEPS.filter((candidate) =>
      greaterThan(divide(area, fromInteger(candidate)), smallestTin),
    )
    const coveragePerLitre = fromInteger(
      rng.pick(viableCoverage.length > 0 ? viableCoverage : COVERAGE_STEPS),
    )
    const requiredLitres = divide(area, coveragePerLitre)

    // Price per litre varies per tin so the cheapest tin is not simply the
    // largest one; the player has to compare cost against sufficiency.
    const basePricePerLitre = rng.nextInt(180, 260) * 100
    const options = TIN_SIZES.map((size, index) => {
      const litres = fromDecimalString(size)
      const discount = rng.nextInt(0, 12 + index * 4)
      const perLitre = Math.round((basePricePerLitre * (100 - discount)) / 100)
      const litreCount = Number(litres.n) / Number(litres.d)
      return {
        id: `tin-${size}l`,
        litres,
        priceMinor: Math.round(perLitre * litreCount),
      }
    })

    return { width, height, coveragePerLitre, area, requiredLitres, options }
  },

  verify(model) {
    const issues: string[] = []

    const sufficient = model.options.filter((option) =>
      greaterThanOrEqual(option.litres, model.requiredLitres),
    )

    if (sufficient.length === 0) {
      issues.push('no option covers the generated wall')
    }
    if (sufficient.length === model.options.length) {
      issues.push('every option covers the wall, so the decision is trivial')
    }
    if (model.coveragePerLitre.n <= 0n) {
      issues.push('coverage per litre must be positive')
    }
    if (model.options.some((option) => option.priceMinor <= 0)) {
      issues.push('every option needs a positive price')
    }

    const distinctPrices = new Set(
      sufficient.map((option) => option.priceMinor),
    )
    if (sufficient.length > 1 && distinctPrices.size === 1) {
      issues.push('sufficient options are indistinguishable on price')
    }

    return issues
  },

  narrate() {
    return {
      title: 'El mural',
      setup:
        'El curso prepara un mural para la feria y hay que comprar la pintura.',
      goal: 'Elegí el envase que alcance sin gastar de más.',
    }
  },

  present(model) {
    const options: PresentedOption[] = model.options.map((option) => ({
      id: option.id,
      label: `${formatDecimal(option.litres, 1)} L`,
      detail: `$ ${formatMoney(money(option.priceMinor))}`,
    }))

    return {
      kind: 'decision-card',
      data: [
        { label: 'Pared', value: `${formatDecimal(model.width, 1)} m` },
        { label: 'Alto', value: `${formatDecimal(model.height, 1)} m` },
        {
          label: 'Rendimiento',
          value: `${formatDecimal(model.coveragePerLitre, 0)} m² por litro`,
        },
      ],
      options,
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'decision-card') {
      return err({
        kind: 'invalid-answer',
        detail: `expected decision-card, received ${answer.kind}`,
      })
    }

    const chosen = model.options.find((option) => option.id === answer.optionId)
    if (chosen === undefined) {
      return err({
        kind: 'invalid-answer',
        detail: `unknown option ${answer.optionId}`,
      })
    }

    const sufficient = model.options.filter((option) =>
      greaterThanOrEqual(option.litres, model.requiredLitres),
    )
    const prices = [
      ...new Set(sufficient.map((option) => option.priceMinor)),
    ].sort((left, right) => left - right)
    const cheapest = prices[0]
    const runnerUp = prices[1]

    const covers = greaterThanOrEqual(chosen.litres, model.requiredLitres)
    const areaFact = {
      label: 'Superficie',
      value: `${formatDecimal(model.area, 2)} m²`,
    }
    const requiredFact = {
      label: 'Pintura necesaria',
      value: `${formatDecimal(model.requiredLitres, 2)} L`,
    }
    const chosenFact = {
      label: 'Compraste',
      value: `${formatDecimal(chosen.litres, 1)} L`,
    }

    if (!covers) {
      const missing = subtract(model.requiredLitres, chosen.litres)
      const uncovered = multiply(missing, model.coveragePerLitre)
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'mural.insufficient',
          facts: [
            areaFact,
            requiredFact,
            chosenFact,
            {
              label: 'Faltó cubrir',
              value: `${formatDecimal(uncovered, 2)} m²`,
            },
          ],
          violatedConstraint: 'coverage',
        },
        metrics: metrics({
          efficiency: 0,
          precision: precisionFromDistance(chosen.litres, model.requiredLitres),
          risk: 0,
        }),
        careerEffects: { estilo: { axis: 'improvisador', amount: 6 } },
        flagEffects: [{ flag: 'mural.repurchase', value: true }],
      })
    }

    const leftover = subtract(chosen.litres, model.requiredLitres)
    const efficiency = efficiencyFromUsage(model.requiredLitres, chosen.litres)
    const leftoverFact = {
      label: 'Sobró',
      value: `${formatDecimal(leftover, 2)} L`,
    }

    if (cheapest !== undefined && chosen.priceMinor === cheapest) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'mural.optimal',
          facts: [areaFact, requiredFact, chosenFact, leftoverFact],
          optimalComparison: `Fue la opción suficiente más barata: $ ${formatMoney(money(chosen.priceMinor))}.`,
        },
        metrics: metrics({ efficiency, precision: 1, risk: 0 }),
        careerEffects: { estilo: { axis: 'estratega', amount: 6 } },
        flagEffects: [{ flag: 'mural.optimal', value: true }],
      })
    }

    const quality =
      runnerUp !== undefined && chosen.priceMinor <= runnerUp
        ? 'efficient'
        : 'functional'

    return ok({
      quality,
      feedback: {
        outcomeKey:
          quality === 'efficient' ? 'mural.efficient' : 'mural.functional',
        facts: [areaFact, requiredFact, chosenFact, leftoverFact],
        ...(cheapest === undefined
          ? {}
          : {
              optimalComparison: `La opción suficiente más barata costaba $ ${formatMoney(money(cheapest))}.`,
            }),
      },
      metrics: metrics({ efficiency, precision: 1, risk: 0 }),
      careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
      flagEffects: [],
    })
  },
})
