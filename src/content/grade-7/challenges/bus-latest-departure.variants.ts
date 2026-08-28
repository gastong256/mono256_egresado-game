/**
 * Variantes de «¿con cuánto tiempo salgo?».
 *
 * **Generada.** Duración, demora, hora de entrada y margen pedido son cuatro
 * números sin copy adentro, y los cuatro cambian la respuesta.
 *
 * ## Generación por restricción
 *
 * La plantilla promete una cuenta que se pueda hacer de cabeza y una respuesta
 * que exista. Se elige entonces, en este orden:
 *
 * 1. un par duración/demora cuyo producto dé **minutos enteros** —el jugador
 *    calcula un porcentaje, no arrastra decimales—;
 * 2. una hora de entrada real de colegio;
 * 3. el margen que el grupo pide, de los que alguien diría en voz alta: 5, 10
 *    o 15 minutos;
 * 4. y se comprueba que la anticipación resultante caiga en un rango que una
 *    persona pueda estimar: ni tres minutos ni dos horas.
 *
 * La respuesta correcta se deriva de los parámetros, nunca al revés, así que no
 * hay variante sin solución.
 */

import {
  paramsValidator,
  variantDiagnostic,
  type CandidateContext,
  type VariantSourceSpec,
} from '@/game'

export interface LatestDepartureParams {
  /** Duración del viaje sin demora, en minutos. */
  readonly scheduledMinutes: number
  readonly delayPercent: number
  /** Hora de entrada, en minutos desde medianoche. */
  readonly entryMinutesOfDay: number
  /** Margen que el grupo quiere tener al llegar, en minutos. */
  readonly safetyMarginMinutes: number
}

/** Duraciones creíbles de un viaje escolar en colectivo. */
const DURATIONS = [20, 24, 25, 28, 30, 32, 35, 36, 40, 45] as const

/** Porcentajes que un chico de 7.º puede calcular de cabeza. */
const DELAYS = [10, 15, 20, 25, 40, 50] as const

/** Horas de entrada reales de un colegio. */
const ENTRY_TIMES = [7 * 60 + 30, 7 * 60 + 45, 8 * 60, 13 * 60 + 15] as const

/** Márgenes que alguien pediría en voz alta. */
const MARGINS = [5, 10, 15] as const

/**
 * Anticipación mínima que una persona puede estimar sin que la pregunta se
 * vuelva absurda en ninguno de los dos extremos.
 */
export const MIN_ANTICIPATION = 20
export const MAX_ANTICIPATION = 90

/** Pares cuya demora da minutos enteros. Misma restricción que la otra plantilla. */
const CLEAN_PAIRS = DURATIONS.flatMap((scheduled) =>
  DELAYS.filter((delay) => (scheduled * delay) % 100 === 0).map((delay) => ({
    scheduled,
    delay,
  })),
)

/** Duración real del viaje. Cálculo independiente del que hace el desafío. */
export function travelMinutesOf(params: LatestDepartureParams): number {
  return (
    params.scheduledMinutes +
    (params.scheduledMinutes * params.delayPercent) / 100
  )
}

/**
 * La respuesta: cuántos minutos antes de la entrada hay que salir.
 *
 * Es el viaje con demora más el margen pedido. Derivarla acá, desde los
 * parámetros crudos, es lo que permite que la validación no le pregunte al
 * evaluador del desafío si está conforme con su propio resultado.
 */
export function requiredAnticipation(params: LatestDepartureParams): number {
  return travelMinutesOf(params) + params.safetyMarginMinutes
}

function generateLatestDeparture({
  rng,
}: CandidateContext): LatestDepartureParams {
  const pair = rng.pick(CLEAN_PAIRS)

  return {
    scheduledMinutes: pair.scheduled,
    delayPercent: pair.delay,
    entryMinutesOfDay: rng.pick(ENTRY_TIMES),
    safetyMarginMinutes: rng.pick(MARGINS),
  }
}

/**
 * Oráculo independiente.
 *
 * Recalcula viaje y anticipación desde los parámetros, sin tocar el modelo del
 * desafío, y comprueba lo único que la plantilla promete: que la cuenta dé
 * entero y que la respuesta viva en un rango estimable.
 */
const validateLatestDeparture = paramsValidator<LatestDepartureParams>(
  (params, ref) => {
    const diagnostics = []
    const travel = travelMinutesOf(params)
    const anticipation = requiredAnticipation(params)

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
          'la demora no alarga el viaje, así que no hay nada que ajustar',
        ),
      )
    }
    if (params.safetyMarginMinutes <= 0) {
      diagnostics.push(
        variantDiagnostic(
          'trivial-decision',
          ref,
          'sin margen pedido la respuesta es el viaje y la restricción desaparece',
        ),
      )
    }
    if (anticipation < MIN_ANTICIPATION || anticipation > MAX_ANTICIPATION) {
      diagnostics.push(
        variantDiagnostic(
          'unreasonable-value',
          ref,
          `salir ${String(anticipation)} minutos antes no es una anticipación que alguien estime`,
        ),
      )
    }
    if (
      params.entryMinutesOfDay - anticipation < 5 * 60 ||
      params.entryMinutesOfDay >= 24 * 60
    ) {
      diagnostics.push(
        variantDiagnostic(
          'unreasonable-value',
          ref,
          'la salida cae fuera de una hora de ir al colegio',
        ),
      )
    }

    return diagnostics
  },
)

/** Las dos variantes curadas que la partida juega hoy. */
const AUTHORED: readonly (LatestDepartureParams & { readonly id: string })[] = [
  {
    id: 'margen-10',
    scheduledMinutes: 28,
    delayPercent: 25,
    entryMinutesOfDay: 7 * 60 + 45,
    safetyMarginMinutes: 10,
  },
  {
    id: 'margen-5',
    scheduledMinutes: 30,
    delayPercent: 40,
    entryMinutesOfDay: 7 * 60 + 45,
    safetyMarginMinutes: 5,
  },
]

export const busLatestDepartureVariants: VariantSourceSpec<LatestDepartureParams> =
  {
    authored: AUTHORED,
    generator: {
      id: 'bus.latest-departure.constraint-first',
      version: '1',
      candidateSpace: 20_000,
      generate: generateLatestDeparture,
    },
    validators: [validateLatestDeparture],
    canonical: (params) => ({
      scheduledMinutes: params.scheduledMinutes,
      delayPercent: params.delayPercent,
      entryMinutesOfDay: params.entryMinutesOfDay,
      safetyMarginMinutes: params.safetyMarginMinutes,
    }),
  }
