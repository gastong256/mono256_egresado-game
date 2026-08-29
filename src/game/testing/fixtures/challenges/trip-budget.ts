/**
 * DEVELOPMENT FIXTURE — not final Egresado content.
 *
 * The "viaje" scenario as a small optimisation problem: meals are sold in packs
 * of different sizes whose unit price falls with size, the group needs a known
 * number of meals, and there is a budget ceiling. The player chooses how many
 * of each pack to buy.
 *
 * The optimum is computed by exhaustive dynamic programming over pack counts
 * rather than assumed, which is what `challenge-system.md` requires: solve the
 * problem internally before presenting it.
 */

import { toChallengeId, toVariantId } from '../../../core/branded'
import {
  developmentVariantSource,
  type DevelopmentParams,
} from '../variant-source'
import { DEV_TRIP_FAMILY } from '../families'
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
import { formatMoney, money } from '../../../math/quantity'

interface MealPack {
  readonly id: string
  readonly meals: number
  readonly priceMinor: number
  readonly maxQuantity: number
}

interface TripBudgetModel {
  readonly mealsNeeded: number
  readonly budgetMinor: number
  readonly packs: readonly MealPack[]
  readonly optimalCostMinor: number
}

/**
 * Minimum cost to reach at least `target` meals.
 *
 * Buying past the target is allowed — a larger pack can be cheaper than an
 * exact combination — so the table is extended by the biggest pack size.
 */
function minimumCost(target: number, packs: readonly MealPack[]): number {
  const largest = packs.reduce((max, pack) => Math.max(max, pack.meals), 0)
  const limit = target + largest
  const best = new Array<number>(limit + 1).fill(Number.POSITIVE_INFINITY)
  best[0] = 0

  for (let meals = 1; meals <= limit; meals += 1) {
    for (const pack of packs) {
      const previous = best[Math.max(0, meals - pack.meals)]
      if (previous === undefined || !Number.isFinite(previous)) {
        continue
      }
      const candidate = previous + pack.priceMinor
      const current = best[meals]
      if (current === undefined || candidate < current) {
        best[meals] = candidate
      }
    }
  }

  let optimum = Number.POSITIVE_INFINITY
  for (let meals = target; meals <= limit; meals += 1) {
    const cost = best[meals]
    if (cost !== undefined && cost < optimum) {
      optimum = cost
    }
  }

  return optimum
}

export const tripBudget: ChallengeDefinition = defineChallenge<
  TripBudgetModel,
  DevelopmentParams
>({
  id: toChallengeId('dev.trip-budget'),
  family: DEV_TRIP_FAMILY,
  placement: 'anchor',
  variants: [toVariantId('base')],
  variantSource: developmentVariantSource,
  interaction: 'budget-builder',
  categories: ['optimization-and-constraints', 'quantity'],
  stages: ['year-2', 'year-3', 'year-5'],
  baseDifficulty: 4,
  cognitive: {
    steps: 2,
    constraints: 2,
    selection: 1,
    optimization: 2,
    uncertainty: 0,
    construction: 1,
  },
  tools: ['calculator', 'notepad'],

  generate({ rng, difficulty }) {
    const mealsNeeded = rng.nextInt(18, difficulty >= 4 ? 47 : 32)
    const unitPrice = rng.nextInt(90, 160) * 100

    // Larger packs get a better unit price, so the cheapest combination is not
    // simply "buy singles" and not always "buy the biggest pack" either.
    const packs: readonly MealPack[] = [
      { id: 'pack-1', meals: 1, priceMinor: unitPrice, maxQuantity: 12 },
      {
        id: 'pack-4',
        meals: 4,
        priceMinor: Math.round(unitPrice * 4 * (1 - rng.nextInt(4, 12) / 100)),
        maxQuantity: 12,
      },
      {
        id: 'pack-10',
        meals: 10,
        priceMinor: Math.round(
          unitPrice * 10 * (1 - rng.nextInt(10, 20) / 100),
        ),
        maxQuantity: 8,
      },
    ]

    const optimalCostMinor = minimumCost(mealsNeeded, packs)
    // The budget always admits the optimum and leaves a little slack, so the
    // problem is solvable but overspending is still possible.
    const budgetMinor =
      optimalCostMinor + rng.nextInt(2, 14) * Math.round(unitPrice / 2)

    return { mealsNeeded, budgetMinor, packs, optimalCostMinor }
  },

  verify(model) {
    const issues: string[] = []

    if (!Number.isFinite(model.optimalCostMinor)) {
      issues.push('no combination of packs reaches the required meals')
    }
    if (model.optimalCostMinor > model.budgetMinor) {
      issues.push('the optimum does not fit inside the budget')
    }
    if (model.mealsNeeded <= 0) {
      issues.push('meals needed must be positive')
    }

    const capacity = model.packs.reduce(
      (total, pack) => total + pack.meals * pack.maxQuantity,
      0,
    )
    if (capacity < model.mealsNeeded) {
      issues.push('pack limits make the requirement unreachable')
    }

    const unitPrices = model.packs.map((pack) => pack.priceMinor / pack.meals)
    if (new Set(unitPrices).size === 1) {
      issues.push('every pack has the same unit price, so size does not matter')
    }

    return issues
  },

  narrate() {
    return {
      title: 'La comida del viaje',
      setup:
        'Falta cerrar la comida del viaje y los combos se venden por paquete.',
      goal: 'Cubrí todas las viandas gastando lo menos posible.',
    }
  },

  present(model) {
    return {
      kind: 'budget-builder',
      data: [
        { label: 'Viandas necesarias', value: String(model.mealsNeeded) },
        {
          label: 'Presupuesto',
          value: `$ ${formatMoney(money(model.budgetMinor))}`,
        },
      ],
      budgetLabel: `$ ${formatMoney(money(model.budgetMinor))}`,
      items: model.packs.map((pack) => ({
        id: pack.id,
        label: `Combo x${String(pack.meals)}`,
        unitPrice: `$ ${formatMoney(money(pack.priceMinor))}`,
        maxQuantity: pack.maxQuantity,
      })),
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'budget-builder') {
      return err({
        kind: 'invalid-answer',
        detail: `expected budget-builder, received ${answer.kind}`,
      })
    }

    let meals = 0
    let cost = 0

    for (const line of answer.lines) {
      const pack = model.packs.find((candidate) => candidate.id === line.itemId)
      if (pack === undefined) {
        return err({
          kind: 'invalid-answer',
          detail: `unknown item ${line.itemId}`,
        })
      }
      if (!Number.isSafeInteger(line.quantity) || line.quantity < 0) {
        return err({
          kind: 'invalid-answer',
          detail: `quantity for ${line.itemId} must be a non-negative integer`,
        })
      }
      if (line.quantity > pack.maxQuantity) {
        return err({
          kind: 'invalid-answer',
          detail: `quantity for ${line.itemId} exceeds the available stock`,
        })
      }
      meals += pack.meals * line.quantity
      cost += pack.priceMinor * line.quantity
    }

    const facts = [
      { label: 'Viandas compradas', value: String(meals) },
      { label: 'Necesarias', value: String(model.mealsNeeded) },
      { label: 'Gasto', value: `$ ${formatMoney(money(cost))}` },
    ]

    if (meals < model.mealsNeeded) {
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'trip.insufficient',
          facts: [
            ...facts,
            {
              label: 'Faltaron',
              value: String(model.mealsNeeded - meals),
            },
          ],
          violatedConstraint: 'meals-required',
        },
        metrics: metrics({
          efficiency: 0,
          precision: meals / model.mealsNeeded,
        }),
        careerEffects: { equipo: -2 },
        flagEffects: [{ flag: 'trip.short', value: true }],
      })
    }

    if (cost > model.budgetMinor) {
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'trip.overBudget',
          facts: [
            ...facts,
            {
              label: 'Excedente',
              value: `$ ${formatMoney(money(cost - model.budgetMinor))}`,
            },
          ],
          violatedConstraint: 'budget',
        },
        metrics: metrics({ efficiency: 0, precision: 1 }),
        careerEffects: { estilo: { axis: 'improvisador', amount: 6 } },
        flagEffects: [{ flag: 'trip.overBudget', value: true }],
      })
    }

    const efficiency = efficiencyFromUsage(
      fromInteger(model.optimalCostMinor),
      fromInteger(cost),
    )

    if (cost === model.optimalCostMinor) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'trip.optimal',
          facts,
          optimalComparison:
            'Ninguna combinación de combos cubría las viandas por menos.',
        },
        metrics: metrics({ efficiency, precision: 1 }),
        careerEffects: { equipo: 2, estilo: { axis: 'aplicado', amount: 6 } },
        flagEffects: [{ flag: 'trip.optimal', value: true }],
      })
    }

    const overspend = cost - model.optimalCostMinor
    return ok({
      quality: efficiency >= 0.9 ? 'efficient' : 'functional',
      feedback: {
        outcomeKey: 'trip.covered',
        facts: [
          ...facts,
          {
            label: 'De más',
            value: `$ ${formatMoney(money(overspend))}`,
          },
        ],
        optimalComparison: `La mejor combinación costaba $ ${formatMoney(money(model.optimalCostMinor))}.`,
      },
      metrics: metrics({ efficiency, precision: 1 }),
      careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
      flagEffects: [],
    })
  },
})
