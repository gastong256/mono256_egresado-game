/**
 * Variantes de «cuánto dura el viaje hoy».
 *
 * **Generada**, y con el mismo dominio paramétrico que las otras dos del
 * colectivo: duración y demora, restringidas a las combinaciones que dan
 * minutos enteros. Que compartan el espacio es deliberado — la recuperación
 * revisa el mismo concepto, no otro—, y que sea otra plantilla también: la
 * pregunta que hace es sólo el paso intermedio.
 */

import {
  paramsValidator,
  variantDiagnostic,
  type CandidateContext,
  type VariantSourceSpec,
} from '@/game'

export interface TravelReviewParams {
  readonly scheduledMinutes: number
  readonly delayPercent: number
}

const DURATIONS = [20, 24, 25, 28, 30, 32, 35, 36, 40, 45] as const
const DELAYS = [10, 15, 20, 25, 40, 50] as const

/** Pares cuya demora da minutos enteros. La misma restricción que la familia. */
const CLEAN_PAIRS = DURATIONS.flatMap((scheduled) =>
  DELAYS.filter((delay) => (scheduled * delay) % 100 === 0).map((delay) => ({
    scheduled,
    delay,
  })),
)

/** El viaje de hoy. Cálculo independiente del que hace el desafío. */
export function travelWithDelay(params: TravelReviewParams): number {
  return (
    params.scheduledMinutes +
    (params.scheduledMinutes * params.delayPercent) / 100
  )
}

function generateTravelReview({ rng }: CandidateContext): TravelReviewParams {
  const pair = rng.pick(CLEAN_PAIRS)
  return { scheduledMinutes: pair.scheduled, delayPercent: pair.delay }
}

/** Oráculo independiente: recalcula desde los parámetros crudos. */
const validateTravelReview = paramsValidator<TravelReviewParams>(
  (params, ref) => {
    const diagnostics = []
    const travel = travelWithDelay(params)

    if (!Number.isInteger(travel)) {
      diagnostics.push(
        variantDiagnostic(
          'unreasonable-value',
          ref,
          `el viaje con demora da ${String(travel)} minutos, que no es entero`,
        ),
      )
    }
    if (travel <= params.scheduledMinutes) {
      diagnostics.push(
        variantDiagnostic(
          'trivial-decision',
          ref,
          'la demora no alarga el viaje, así que no hay nada que calcular',
        ),
      )
    }
    // El paso intermedio tiene que seguir siendo una cuenta, no una lectura.
    if (params.delayPercent < 10) {
      diagnostics.push(
        variantDiagnostic(
          'trivial-decision',
          ref,
          'una demora tan chica no obliga a calcular el porcentaje',
        ),
      )
    }

    return diagnostics
  },
)

const AUTHORED: readonly (TravelReviewParams & { readonly id: string })[] = [
  { id: 'repaso-25', scheduledMinutes: 28, delayPercent: 25 },
  { id: 'repaso-50', scheduledMinutes: 30, delayPercent: 50 },
]

export const busTravelReviewVariants: VariantSourceSpec<TravelReviewParams> = {
  authored: AUTHORED,
  generator: {
    id: 'bus.travel-review.constraint-first',
    version: '1',
    candidateSpace: 20_000,
    generate: generateTravelReview,
  },
  validators: [validateTravelReview],
  canonical: (params) => ({
    scheduledMinutes: params.scheduledMinutes,
    delayPercent: params.delayPercent,
  }),
}
