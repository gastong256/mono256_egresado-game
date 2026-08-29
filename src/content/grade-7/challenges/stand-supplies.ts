/**
 * 7.º grado — la merienda del stand.
 *
 * Situación: el stand del curso atiende toda la tarde y hay que comprar la
 * merienda para los que atienden y para los que visitan.
 *
 * La matemática es costo unitario y combinación: los paquetes grandes salen más
 * baratos por porción, pero comprar de más también es plata perdida. Hay que
 * cubrir las porciones necesarias sin pasarse del presupuesto.
 *
 * El costo mínimo se calcula con programación dinámica sobre las porciones, así
 * que el óptimo se resuelve internamente antes de mostrar nada.
 */

import {
  defineChallenge,
  efficiencyFromUsage,
  err,
  fromInteger,
  metrics,
  ok,
  authoredVariantIds,
  toChallengeId,
  type ChallengeDefinition,
  type ChallengeEvaluation,
  type EngineRejection,
  type InteractionAnswer,
  type Result,
} from '@/game'
import {
  standSuppliesVariants,
  type StandParams,
} from './stand-supplies.variants'
import { SCHOOL_FAIR_FAMILY } from '../families'

import { pesos } from '../../pesos'

interface Pack {
  readonly id: string
  readonly label: string
  readonly servings: number
  readonly priceMinor: number
  readonly maxQuantity: number
}

interface StandModel {
  readonly servingsNeeded: number
  readonly budgetMinor: number
  readonly packs: readonly Pack[]
  readonly optimalCostMinor: number
}

/**
 * Paquetes reales de kiosco. El precio por porción baja con el tamaño, así que
 * comprar todo suelto es caro y comprar sólo el grande puede sobrar.
 */
const PACKS: readonly Pack[] = [
  {
    id: 'suelto',
    label: 'Alfajor suelto',
    servings: 1,
    priceMinor: 90_000,
    maxQuantity: 12,
  },
  {
    id: 'pack-6',
    label: 'Pack x6',
    servings: 6,
    priceMinor: 480_000,
    maxQuantity: 8,
  },
  {
    id: 'caja-12',
    label: 'Caja x12',
    servings: 12,
    priceMinor: 900_000,
    maxQuantity: 5,
  },
]

/** Dos variantes autoradas: las dos son resolubles y dejan margen para elegir mal. */
/** Identidad estable de la plantilla. */
const STAND_SUPPLIES_ID = toChallengeId('g7.stand-supplies')

/**
 * Costo mínimo para cubrir al menos `target` porciones.
 *
 * Comprar de más está permitido —una caja puede salir más barata que la
 * combinación exacta— así que la tabla se extiende por el paquete más grande.
 */
function minimumCost(target: number, packs: readonly Pack[]): number {
  const largest = packs.reduce((max, pack) => Math.max(max, pack.servings), 0)
  const limit = target + largest
  const best = new Array<number>(limit + 1).fill(Number.POSITIVE_INFINITY)
  best[0] = 0

  for (let servings = 1; servings <= limit; servings += 1) {
    for (const pack of packs) {
      const previous = best[Math.max(0, servings - pack.servings)]
      if (previous === undefined || !Number.isFinite(previous)) {
        continue
      }
      const candidate = previous + pack.priceMinor
      const current = best[servings]
      if (current === undefined || candidate < current) {
        best[servings] = candidate
      }
    }
  }

  let optimum = Number.POSITIVE_INFINITY
  for (let servings = target; servings <= limit; servings += 1) {
    const cost = best[servings]
    if (cost !== undefined && cost < optimum) {
      optimum = cost
    }
  }

  return optimum
}

export const standSupplies: ChallengeDefinition = defineChallenge<
  StandModel,
  StandParams
>({
  id: STAND_SUPPLIES_ID,
  family: SCHOOL_FAIR_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(standSuppliesVariants.authored),
  variantSource: standSuppliesVariants,
  interaction: 'budget-builder',
  categories: ['quantity', 'optimization-and-constraints'],
  stages: ['grade-7'],
  baseDifficulty: 3,
  // Dos restricciones simultáneas que no se satisfacen por separado —cubrir las
  // porciones y no pasarse del presupuesto— sobre una combinación de packs que
  // el jugador arma, buscando la más barata.
  cognitive: {
    steps: 2,
    constraints: 2,
    selection: 1,
    optimization: 2,
    uncertainty: 0,
    construction: 1,
  },
  tools: ['calculator', 'notepad'],

  generate({ params }) {
    return {
      servingsNeeded: params.servingsNeeded,
      budgetMinor: params.budgetMinor,
      packs: PACKS,
      optimalCostMinor: minimumCost(params.servingsNeeded, PACKS),
    }
  },

  verify(model) {
    const issues: string[] = []

    if (!Number.isFinite(model.optimalCostMinor)) {
      issues.push('ninguna combinación llega a las porciones necesarias')
    }
    if (model.optimalCostMinor > model.budgetMinor) {
      issues.push('ni siquiera la mejor combinación entra en el presupuesto')
    }

    const capacity = model.packs.reduce(
      (total, pack) => total + pack.servings * pack.maxQuantity,
      0,
    )
    if (capacity < model.servingsNeeded) {
      issues.push('el stock disponible no alcanza para las porciones pedidas')
    }

    const unitPrices = model.packs.map(
      (pack) => pack.priceMinor / pack.servings,
    )
    if (new Set(unitPrices).size === 1) {
      issues.push('todos los paquetes tienen el mismo precio por porción')
    }

    return issues
  },

  narrate() {
    return {
      title: 'La merienda del stand',
      setup:
        'El stand abre a las dos y cierra a las siete. Hay que llevar algo para los que atienden y para los que se acercan.',
      goal: 'Cubrí las porciones sin pasarte de la plata del curso.',
    }
  },

  present(model) {
    return {
      kind: 'budget-builder',
      data: [
        {
          label: 'Porciones necesarias',
          value: String(model.servingsNeeded),
        },
        {
          label: 'Plata del curso',
          value: pesos(model.budgetMinor),
        },
      ],
      budgetLabel: pesos(model.budgetMinor),
      items: model.packs.map((pack) => ({
        id: pack.id,
        label: `${pack.label} · ${String(pack.servings)} porc.`,
        unitPrice: pesos(pack.priceMinor),
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
        detail: `se esperaba budget-builder y llegó ${answer.kind}`,
      })
    }

    let servings = 0
    let cost = 0

    for (const line of answer.lines) {
      const pack = model.packs.find((candidate) => candidate.id === line.itemId)
      if (pack === undefined) {
        return err({
          kind: 'invalid-answer',
          detail: `paquete desconocido ${line.itemId}`,
        })
      }
      if (!Number.isSafeInteger(line.quantity) || line.quantity < 0) {
        return err({
          kind: 'invalid-answer',
          detail: `cantidad inválida para ${line.itemId}`,
        })
      }
      if (line.quantity > pack.maxQuantity) {
        return err({
          kind: 'invalid-answer',
          detail: `no hay tantos ${pack.label} disponibles`,
        })
      }
      servings += pack.servings * line.quantity
      cost += pack.priceMinor * line.quantity
    }

    const facts = [
      { label: 'Porciones compradas', value: String(servings) },
      { label: 'Necesarias', value: String(model.servingsNeeded) },
      { label: 'Gastaste', value: pesos(cost) },
    ]

    if (servings < model.servingsNeeded) {
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'stand.short',
          stamp: 'Faltó',
          consequence:
            'A media tarde no queda nada para ofrecer y el stand cierra antes.',
          facts: [
            ...facts,
            {
              label: 'Faltaron',
              value: `${String(model.servingsNeeded - servings)} porciones`,
            },
          ],
          violatedConstraint: 'cubrir las porciones',
        },
        metrics: metrics({
          efficiency: 0,
          precision: servings / model.servingsNeeded,
        }),
        // El stand es del curso: alcanzar o no alcanzar con la merienda es
        // conducta hacia el grupo.
        careerEffects: {
          equipo: -3,
          estilo: { axis: 'improvisador', amount: 8 },
        },
        flagEffects: [{ flag: 'g7.standFaltoMerienda', value: true }],
      })
    }

    if (cost > model.budgetMinor) {
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'stand.overBudget',
          stamp: 'Te pasaste',
          consequence:
            'Hay que poner la diferencia de los bolsillos del curso, y no cae bien.',
          facts: [
            ...facts,
            {
              label: 'Te pasaste por',
              value: pesos(cost - model.budgetMinor),
            },
          ],
          violatedConstraint: 'la plata del curso',
        },
        metrics: metrics({ efficiency: 0, precision: 1 }),
        careerEffects: {
          equipo: -2,
          estilo: { axis: 'improvisador', amount: 8 },
        },
        flagEffects: [{ flag: 'g7.standSePaso', value: true }],
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
          outcomeKey: 'stand.optimal',
          stamp: 'Abastecido',
          consequence:
            'El stand llega hasta el final con mercadería y sin deberle plata a nadie.',
          facts,
          optimalComparison:
            'Ninguna combinación de paquetes cubría las porciones por menos.',
        },
        metrics: metrics({ efficiency, precision: 1 }),
        careerEffects: {
          equipo: 4,
          estilo: { axis: 'estratega', amount: 10 },
        },
        flagEffects: [{ flag: 'g7.standRedondo', value: true }],
      })
    }

    const overspend = cost - model.optimalCostMinor
    return ok({
      quality: efficiency >= 0.9 ? 'efficient' : 'functional',
      feedback: {
        outcomeKey: 'stand.covered',
        stamp: 'Abastecido',
        consequence:
          'El stand funciona, aunque sobró mercadería que nadie sabe qué hacer con ella.',
        facts: [...facts, { label: 'De más', value: pesos(overspend) }],
        optimalComparison: `La mejor combinación costaba ${pesos(model.optimalCostMinor)}.`,
      },
      metrics: metrics({ efficiency, precision: 1 }),
      careerEffects: {
        equipo: 2,
        estilo: { axis: 'aplicado', amount: 8 },
      },
      flagEffects: [{ flag: 'g7.standAbastecido', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido. */
export const standSuppliesReference = {
  packs: PACKS,
  variants: standSuppliesVariants.authored,
  minimumCost,
}
