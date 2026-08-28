/**
 * Variantes del colectivo.
 *
 * **Generada.** El espacio de parámetros es rico y ninguno de sus números es
 * copy: una duración, un porcentaje de demora, una hora de entrada y cuatro
 * salidas. Es exactamente el tipo de contenido que se memoriza si no cambia, y
 * exactamente el tipo que se puede generar sin perder nada.
 *
 * ## Generación por restricción
 *
 * No se sortean horarios a ver qué sale. Se elige primero **la forma que la
 * decisión tiene que tener** y recién después se derivan los números:
 *
 * 1. una demora que dé minutos enteros sobre la duración elegida —el jugador
 *    tiene que poder hacer la cuenta, no arrastrar decimales—;
 * 2. un margen óptimo: chico pero seguro;
 * 3. un margen negativo, para que exista la opción de llegar tarde;
 * 4. dos márgenes más, todos distintos entre sí;
 * 5. las salidas salen restando: `salida = entrada − viaje − margen`.
 *
 * Generar al revés es lo que garantiza que siempre haya exactamente un óptimo y
 * al menos una salida que no llega. Generar salidas al azar y después mirar qué
 * pasó habría dejado esa garantía librada a la suerte.
 */

import {
  paramsValidator,
  variantDiagnostic,
  type CandidateContext,
  type VariantSourceSpec,
} from '@/game'

export interface BusParams {
  /** Duración del viaje sin demora, en minutos. */
  readonly scheduledMinutes: number
  readonly delayPercent: number
  /** Hora de entrada, en minutos desde medianoche. */
  readonly entryMinutesOfDay: number
  /** Horarios de salida, en minutos desde medianoche, ascendentes. */
  readonly departures: readonly number[]
}

/** Margen mínimo, en minutos, para que una llegada cuente como segura. */
export const SAFE_MARGIN = 5

/** Duraciones creíbles de un viaje escolar en colectivo. */
const DURATIONS = [20, 24, 25, 28, 30, 32, 35, 36, 40, 45] as const

/** Porcentajes que un chico de 7.º puede calcular de cabeza. */
const DELAYS = [10, 15, 20, 25, 40, 50] as const

/** Horas de entrada reales de un colegio. */
const ENTRY_TIMES = [7 * 60 + 30, 7 * 60 + 45, 8 * 60, 13 * 60 + 15] as const

/**
 * Pares duración/demora cuyo producto da minutos enteros.
 *
 * Es la restricción que mantiene la cuenta limpia: `28 min + 25 %` son 35
 * minutos exactos, y `28 min + 15 %` serían 32,2. El segundo no se genera.
 */
const CLEAN_PAIRS = DURATIONS.flatMap((scheduled) =>
  DELAYS.filter((delay) => (scheduled * delay) % 100 === 0).map((delay) => ({
    scheduled,
    delay,
  })),
)

/** Duración real del viaje. Cálculo independiente del que hace el desafío. */
export function travelMinutesOf(params: BusParams): number {
  return (
    params.scheduledMinutes +
    (params.scheduledMinutes * params.delayPercent) / 100
  )
}

/** Margen de llegada de cada salida, en el orden en que vienen. */
export function marginsOf(params: BusParams): readonly number[] {
  const travel = travelMinutesOf(params)
  return params.departures.map(
    (departure) => params.entryMinutesOfDay - (departure + travel),
  )
}

function generateBus({ rng }: CandidateContext): BusParams {
  const pair = rng.pick(CLEAN_PAIRS)
  const entryMinutesOfDay = rng.pick(ENTRY_TIMES)
  const travel = pair.scheduled + (pair.scheduled * pair.delay) / 100

  // El margen que queremos que sea la mejor respuesta: alcanza para entrar sin
  // correr y no sobra tanto como para que esperar fuera lo razonable.
  const optimalMargin = rng.nextInt(SAFE_MARGIN, 12)
  // Una o dos salidas que no llegan. Que sean siempre una convertiría «no
  // elijas la última» en la respuesta, que es justo lo que la variación existe
  // para evitar: con dos, el óptimo se corre de lugar.
  const lateCount = rng.chance(1, 2) ? 1 : 2
  const margins = new Set<number>([optimalMargin])
  while (margins.size < 1 + lateCount) {
    margins.add(-rng.nextInt(1, 18))
  }

  while (margins.size < 4) {
    // Las otras dos son o bien holgadas —llegar temprano y esperar— o bien
    // justas: llegan, pero sin colchón.
    const candidate = rng.chance(1, 2)
      ? optimalMargin + rng.nextInt(6, 25)
      : rng.nextInt(0, SAFE_MARGIN - 1)
    margins.add(candidate)
  }

  const departures = [...margins]
    .map((margin) => entryMinutesOfDay - travel - margin)
    .sort((left, right) => left - right)

  return {
    scheduledMinutes: pair.scheduled,
    delayPercent: pair.delay,
    entryMinutesOfDay,
    departures,
  }
}

/**
 * Oráculo independiente.
 *
 * Recalcula el viaje y los márgenes desde los parámetros crudos, sin tocar el
 * modelo del desafío, y comprueba la forma que la decisión promete tener: un
 * óptimo único, alguien que llega tarde, márgenes distinguibles y horarios que
 * existen en un día.
 */
const validateBus = paramsValidator<BusParams>((params, ref) => {
  const diagnostics = []
  const travel = travelMinutesOf(params)
  const margins = marginsOf(params)

  if (!Number.isInteger(travel)) {
    diagnostics.push(
      variantDiagnostic(
        'unreasonable-value',
        ref,
        `el viaje con demora da ${String(travel)} minutos, que no es un número entero`,
      ),
    )
  }
  if (travel <= params.scheduledMinutes) {
    diagnostics.push(
      variantDiagnostic(
        'trivial-decision',
        ref,
        'la demora no alarga el viaje',
      ),
    )
  }
  if (new Set(margins).size !== margins.length) {
    diagnostics.push(
      variantDiagnostic('ambiguous-optimum', ref, 'dos salidas llegan igual'),
    )
  }
  if (!margins.some((margin) => margin < 0)) {
    diagnostics.push(
      variantDiagnostic(
        'trivial-decision',
        ref,
        'ninguna salida llega tarde, así que elegir no arriesga nada',
      ),
    )
  }

  const safe = margins.filter((margin) => margin >= SAFE_MARGIN)
  if (safe.length === 0) {
    diagnostics.push(
      variantDiagnostic(
        'no-valid-solution',
        ref,
        'ninguna salida llega con margen seguro',
      ),
    )
  } else {
    const best = Math.min(...safe)
    if (safe.filter((margin) => margin === best).length !== 1) {
      diagnostics.push(
        variantDiagnostic(
          'ambiguous-optimum',
          ref,
          'dos salidas comparten el mejor margen seguro',
        ),
      )
    }
  }

  for (const departure of params.departures) {
    if (departure < 5 * 60 || departure >= 24 * 60) {
      diagnostics.push(
        variantDiagnostic(
          'unreasonable-value',
          ref,
          `salir a las ${String(departure)} minutos del día no es una hora de ir al colegio`,
        ),
      )
    }
  }

  if (params.departures.length !== 4) {
    diagnostics.push(
      variantDiagnostic(
        'option-count',
        ref,
        `la grilla ofrece ${String(params.departures.length)} salidas`,
      ),
    )
  }

  return diagnostics
})

/** Las dos variantes que juega la partida actual. */
const AUTHORED: readonly (BusParams & { readonly id: string })[] = [
  {
    id: 'demora-25',
    scheduledMinutes: 28,
    delayPercent: 25,
    entryMinutesOfDay: 7 * 60 + 45,
    departures: [405, 420, 430, 440],
  },
  {
    id: 'demora-50',
    scheduledMinutes: 28,
    delayPercent: 50,
    entryMinutesOfDay: 7 * 60 + 45,
    departures: [405, 420, 430, 440],
  },
]

export const busTimingVariants: VariantSourceSpec<BusParams> = {
  authored: AUTHORED,
  generator: {
    id: 'bus.timing.constraint-first',
    version: '1',
    candidateSpace: 20_000,
    generate: generateBus,
  },
  validators: [validateBus],
  canonical: (params) => ({
    scheduledMinutes: params.scheduledMinutes,
    delayPercent: params.delayPercent,
    entryMinutesOfDay: params.entryMinutesOfDay,
    departures: [...params.departures].sort((left, right) => left - right),
  }),
}
