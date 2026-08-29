/**
 * 7.º grado — la notebook del curso.
 *
 * Situación: el curso junta plata para una notebook y hay dos ofertas.
 *
 * La matemática es un porcentaje contra un monto fijo. La trampa es que el
 * descuento que suena más grande no siempre lo es: hay que traducir el
 * porcentaje a pesos para poder comparar.
 *
 * Toda la plata se maneja en centavos enteros. Ningún importe pasa por punto
 * flotante.
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
  notebookOfferVariants,
  type NotebookParams,
} from './notebook-offer.variants'
import { NOTEBOOK_FAMILY } from '../families'

import { pesos } from '../../pesos'

interface Offer {
  readonly id: string
  readonly label: string
  readonly detail: string
  readonly totalMinor: number
}

interface NotebookModel {
  readonly listPriceMinor: number
  readonly percentOff: number
  readonly fixedOffMinor: number
  readonly budgetMinor: number
  readonly offers: readonly Offer[]
}

/**
 * Dos variantes autoradas. En las dos el porcentaje descuenta más que el monto
 * fijo, y en las dos el presupuesto alcanza sólo para la más barata.
 */
/** Identidad estable de la plantilla. */
const NOTEBOOK_OFFER_ID = toChallengeId('g7.notebook-offer')

/** Porcentaje sobre centavos enteros: el resultado sigue siendo entero. */
function percentOfMinor(amountMinor: number, percent: number): number {
  return Math.round((amountMinor * percent) / 100)
}

export const notebookOffer: ChallengeDefinition = defineChallenge<
  NotebookModel,
  NotebookParams
>({
  id: NOTEBOOK_OFFER_ID,
  family: NOTEBOOK_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(notebookOfferVariants.authored),
  variantSource: notebookOfferVariants,
  interaction: 'decision-card',
  categories: ['proportions-and-percentages', 'quantity'],
  stages: ['grade-7'],
  baseDifficulty: 3,
  // Dos ofertas que no se comparan solas: hay que llevar las dos a la misma
  // unidad y recién ahí mirarlas contra la plata que hay. El efectivo es la
  // restricción y elegir la más barata que entra es la optimización.
  cognitive: {
    steps: 2,
    constraints: 1,
    selection: 1,
    optimization: 1,
    uncertainty: 0,
    construction: 0,
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Comparar dos ofertas contra el efectivo disponible es un único hecho; no hay evidencia de equipo ni de actuación pública en la decisión.',
  },
  tools: ['calculator'],

  generate({ params }) {
    const percentValue = percentOfMinor(
      params.listPriceMinor,
      params.percentOff,
    )
    const percentTotal = params.listPriceMinor - percentValue
    const fixedTotal = params.listPriceMinor - params.fixedOffMinor

    // El presupuesto queda entre las dos ofertas: sólo una entra.
    const budgetMinor =
      Math.min(percentTotal, fixedTotal) +
      Math.floor(Math.abs(fixedTotal - percentTotal) / 2)

    return {
      listPriceMinor: params.listPriceMinor,
      percentOff: params.percentOff,
      fixedOffMinor: params.fixedOffMinor,
      budgetMinor,
      offers: [
        {
          id: 'oferta-porcentaje',
          label: `${String(params.percentOff)} % de descuento`,
          // Cuánto queda es exactamente lo que hay que calcular: decirlo acá
          // convertiría el desafío en comparar dos números dados.
          detail: 'Sobre el precio de lista',
          totalMinor: percentTotal,
        },
        {
          id: 'oferta-fija',
          label: `${pesos(params.fixedOffMinor)} de descuento`,
          detail: 'Se resta del precio de lista',
          totalMinor: fixedTotal,
        },
      ],
    }
  },

  verify(model) {
    const issues: string[] = []
    const affordable = model.offers.filter(
      (offer) => offer.totalMinor <= model.budgetMinor,
    )

    if (affordable.length === 0) {
      issues.push('ninguna oferta entra en el presupuesto')
    }
    if (affordable.length === model.offers.length) {
      issues.push(
        'las dos ofertas entran, así que el presupuesto no restringe nada',
      )
    }
    if (
      new Set(model.offers.map((offer) => offer.totalMinor)).size !==
      model.offers.length
    ) {
      issues.push('las dos ofertas cuestan lo mismo')
    }
    if (model.offers.some((offer) => offer.totalMinor <= 0)) {
      issues.push('un total quedó en cero o negativo')
    }

    return issues
  },

  narrate() {
    return {
      title: 'La notebook del curso',
      setup:
        'Juntaron plata todo el año para una notebook que queda en la escuela. Aparecieron dos ofertas y hay que decidir hoy.',
      goal: 'Elegí la oferta que se pueda pagar con lo que juntaron.',
    }
  },

  present(model) {
    return {
      kind: 'decision-card',
      data: [
        {
          label: 'Precio de lista',
          value: pesos(model.listPriceMinor),
        },
        {
          label: 'Juntaron',
          value: pesos(model.budgetMinor),
        },
      ],
      options: model.offers.map((offer) => ({
        id: offer.id,
        label: offer.label,
        detail: offer.detail,
      })),
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'decision-card') {
      return err({
        kind: 'invalid-answer',
        detail: `se esperaba decision-card y llegó ${answer.kind}`,
      })
    }

    const chosen = model.offers.find((offer) => offer.id === answer.optionId)
    if (chosen === undefined) {
      return err({
        kind: 'invalid-answer',
        detail: `oferta desconocida ${answer.optionId}`,
      })
    }

    const cheapest = Math.min(...model.offers.map((offer) => offer.totalMinor))
    const percentValue = percentOfMinor(model.listPriceMinor, model.percentOff)

    const facts = [
      {
        label: `${String(model.percentOff)} % de ${pesos(model.listPriceMinor)}`,
        value: pesos(percentValue),
      },
      {
        label: 'Descuento fijo',
        value: pesos(model.fixedOffMinor),
      },
      {
        label: 'Elegiste pagar',
        value: pesos(chosen.totalMinor),
      },
      {
        label: 'Tenían',
        value: pesos(model.budgetMinor),
      },
    ]

    if (chosen.totalMinor > model.budgetMinor) {
      const missing = chosen.totalMinor - model.budgetMinor

      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'notebook.unaffordable',
          stamp: 'No alcanzó',
          consequence:
            'Se posterga la compra y el proyecto se muestra desde el celular de alguien.',
          facts: [...facts, { label: 'Faltaban', value: pesos(missing) }],
          violatedConstraint: 'la plata que juntaron',
          optimalComparison: `La otra oferta dejaba la notebook en ${pesos(cheapest)}.`,
        },
        metrics: metrics({ efficiency: 0, precision: 0.2, risk: 0.6 }),
        // La plata es del curso y el proyecto depende de la compra: lo que
        // está en juego es la conducta hacia el grupo, no una nota.
        careerEffects: {
          equipo: -3,
          estilo: { axis: 'improvisador', amount: 8 },
        },
        flagEffects: [{ flag: 'g7.notebookNoSalio', value: true }],
      })
    }

    return ok({
      quality: 'optimal',
      feedback: {
        outcomeKey: 'notebook.bought',
        stamp: 'Comprada',
        consequence:
          'La notebook llega a tiempo y el proyecto se puede mostrar como estaba pensado.',
        facts: [
          ...facts,
          {
            label: 'Quedó a favor',
            value: pesos(model.budgetMinor - chosen.totalMinor),
          },
        ],
        optimalComparison:
          'El descuento en porcentaje era mayor que el descuento fijo, aunque sonara al revés.',
      },
      metrics: metrics({
        efficiency: efficiencyFromUsage(
          fromInteger(cheapest),
          fromInteger(chosen.totalMinor),
        ),
        precision: 1,
        risk: 0,
      }),
      careerEffects: {
        equipo: 3,
        estilo: { axis: 'estratega', amount: 10 },
      },
      flagEffects: [{ flag: 'g7.notebookComprada', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido. */
export const notebookOfferReference = {
  variants: notebookOfferVariants.authored,
  percentOfMinor,
}
