/**
 * 7.º grado — el colectivo demorado.
 *
 * Situación: el colectivo viene con demora y hay que decidir en qué horario
 * salir. No se nombra una línea: el número de un colectivo real no aporta a la
 * cuenta y ata la escena a una ciudad que el juego no declara.
 *
 * La matemática es tiempo con un porcentaje simple aplicado a una duración. No
 * se le pregunta al jugador cuánto es el 25 % de 28: se le pregunta en qué
 * colectivo se sube, y para responder eso necesita el cálculo.
 *
 * Función objetivo: llegar antes de la entrada con el margen más chico que
 * siga siendo seguro. Salir demasiado temprano funciona, pero es tiempo
 * perdido; salir sobre la hora llega, pero sin ningún colchón.
 */

import {
  defineChallenge,
  err,
  metrics,
  ok,
  authoredVariantIds,
  toChallengeId,
  type ChallengeDefinition,
  type ChallengeEvaluation,
  type EngineRejection,
  type InteractionAnswer,
  type PresentedOption,
  type Rational,
  type Result,
  add,
  formatDecimal,
  fromInteger,
  percentOf,
  roundTo,
} from '@/game'
import { BUS_FAMILY } from '../families'
import { busTimingVariants, type BusParams } from './bus-timing.variants'

interface Departure {
  readonly id: string
  /** Minutes past midnight. */
  readonly minutesOfDay: number
}

interface BusModel {
  readonly scheduledMinutes: number
  readonly delayPercent: number
  readonly travelMinutes: number
  readonly entryMinutesOfDay: number
  readonly departures: readonly Departure[]
}

/** Margen mínimo, en minutos, para considerar que la llegada es segura. */
const SAFE_MARGIN = 5

/** Identidad estable de la plantilla. */
const BUS_TIMING_ID = toChallengeId('g7.bus-timing')

/**
 * Referencia para los tests de contenido.
 *
 * Los parámetros de cada variante —duración, demora, entrada y salidas— viven
 * en su fuente de variantes; acá sólo queda lo que el desafío fija.
 */
const SCHEDULED_MINUTES = 28
const ENTRY_MINUTES_OF_DAY = 7 * 60 + 45

function formatClock(minutesOfDay: number): string {
  const hours = Math.floor(minutesOfDay / 60)
  const minutes = minutesOfDay % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/** Duración real del viaje: la programada más el porcentaje de demora. */
function travelWithDelay(scheduled: number, delayPercent: number): Rational {
  const base = fromInteger(scheduled)
  return roundTo(add(base, percentOf(base, fromInteger(delayPercent))), 0)
}

function arrivalOf(model: BusModel, departure: Departure): number {
  return departure.minutesOfDay + model.travelMinutes
}

function marginOf(model: BusModel, departure: Departure): number {
  return model.entryMinutesOfDay - arrivalOf(model, departure)
}

/** El margen seguro más chico. Es la referencia de la decisión. */
function bestMargin(model: BusModel): number | undefined {
  const safe = model.departures
    .map((departure) => marginOf(model, departure))
    .filter((margin) => margin >= SAFE_MARGIN)
    .sort((left, right) => left - right)
  return safe[0]
}

export const busTiming: ChallengeDefinition = defineChallenge<
  BusModel,
  BusParams
>({
  id: BUS_TIMING_ID,
  family: BUS_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(busTimingVariants.authored),
  variantSource: busTimingVariants,
  interaction: 'timeline',
  categories: ['time-and-rates', 'proportions-and-percentages'],
  stages: ['grade-7'],
  baseDifficulty: 2,
  // Aplicar la demora es una relación; llevarla a cuatro salidas y compararlas
  // con la hora de entrada es la segunda. La respuesta está entre las opciones
  // —no hay que construirla— y elegir bien es elegir la que llega sin esperar
  // de más, que es una optimización chica pero real.
  cognitive: {
    steps: 2,
    constraints: 1,
    selection: 1,
    optimization: 1,
    uncertainty: 0,
    construction: 0,
  },
  // Un solo hecho: si elegiste la salida que llega a horario sin esperar de más.
  // El evaluador resuelve en cuatro escalones y no midió nada más fino, así que
  // el mapeo discreto de la política es la lectura honesta. No hay evidencia de
  // colaboración ni de actuación pública que no sea ya ese mismo hecho.
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Elegir la salida correcta es el único hecho que el colectivo mide; leerlo otra vez como equipo o aura sería cobrarlo dos veces.',
  },
  tools: ['calculator'],

  generate({ params }) {
    const travel = travelWithDelay(params.scheduledMinutes, params.delayPercent)

    return {
      scheduledMinutes: params.scheduledMinutes,
      delayPercent: params.delayPercent,
      travelMinutes: Number(travel.n),
      entryMinutesOfDay: params.entryMinutesOfDay,
      departures: params.departures.map((minutesOfDay) => ({
        id: `salida-${String(minutesOfDay)}`,
        minutesOfDay,
      })),
    }
  },

  verify(model) {
    const issues: string[] = []
    const margins = model.departures.map((departure) =>
      marginOf(model, departure),
    )

    if (!margins.some((margin) => margin < 0)) {
      issues.push(
        'ninguna salida llega tarde, así que la decisión no arriesga nada',
      )
    }
    if (!margins.some((margin) => margin >= SAFE_MARGIN)) {
      issues.push('ninguna salida llega con margen seguro')
    }
    if (model.travelMinutes <= model.scheduledMinutes) {
      issues.push('la demora no aumenta la duración del viaje')
    }
    if (new Set(margins).size !== margins.length) {
      issues.push('dos salidas llegan exactamente igual')
    }

    return issues
  },

  narrate() {
    return {
      title: 'El colectivo de siempre',
      setup:
        'El colectivo viene con demora otra vez. En el grupo del curso ya avisaron y todos están calculando a qué hora salir.',
      goal: 'Elegí en qué colectivo te subís para llegar a horario.',
    }
  },

  present(model) {
    const options: PresentedOption[] = model.departures.map((departure) => ({
      id: departure.id,
      label: `Salir ${formatClock(departure.minutesOfDay)}`,
    }))

    return {
      kind: 'timeline',
      data: [
        {
          label: 'Viaje normal',
          value: String(model.scheduledMinutes),
          unit: 'minutos',
        },
        {
          label: 'Demora de hoy',
          value: `${String(model.delayPercent)} %`,
          unit: 'más de viaje',
          // Es el número que aprieta, y es rojo *antes* de que el jugador haga
          // nada: el subrayado marca la tensión de la situación, no un error.
          constraint: true,
        },
        {
          label: 'Entrada',
          value: formatClock(model.entryMinutesOfDay),
          unit: 'sin excepción',
          // La restricción de la que trata la pantalla ocupa las dos columnas.
          span: 2,
        },
      ],
      unitLabel: 'minutos',
      options,
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'timeline') {
      return err({
        kind: 'invalid-answer',
        detail: `se esperaba timeline y llegó ${answer.kind}`,
      })
    }

    const chosen = model.departures.find(
      (departure) => departure.id === answer.optionId,
    )
    if (chosen === undefined) {
      return err({
        kind: 'invalid-answer',
        detail: `salida desconocida ${answer.optionId}`,
      })
    }

    const arrival = arrivalOf(model, chosen)
    const margin = marginOf(model, chosen)
    const extra = model.travelMinutes - model.scheduledMinutes

    const facts = [
      { label: 'Viaje normal', value: `${String(model.scheduledMinutes)} min` },
      { label: 'Demora', value: `${String(extra)} min` },
      { label: 'Viaje de hoy', value: `${String(model.travelMinutes)} min` },
      { label: 'Salís', value: formatClock(chosen.minutesOfDay) },
      { label: 'Llegás', value: formatClock(arrival) },
    ]

    if (margin < 0) {
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'bus.late',
          stamp: 'Llegaste tarde',
          facts: [
            ...facts,
            { label: 'Tarde por', value: `${String(-margin)} min` },
          ],
          violatedConstraint: 'hora de entrada',
          consequence:
            'Entrás con el timbre ya sonando y te anotan la llegada tarde.',
        },
        metrics: metrics({ efficiency: 0, precision: 0, risk: 0.9 }),
        // El colectivo no es un evento académico: ejercita porcentaje y tiempo
        // pero nadie pone una nota. Sólo mueve Estilo.
        careerEffects: { estilo: { axis: 'improvisador', amount: 8 } },
        flagEffects: [{ flag: 'g7.llegoTarde', value: true }],
      })
    }

    const best = bestMargin(model)
    const marginFact = { label: 'Margen', value: `${String(margin)} min` }

    if (margin < SAFE_MARGIN) {
      return ok({
        quality: 'functional',
        feedback: {
          outcomeKey: 'bus.tight',
          stamp: 'Llegaste',
          facts: [...facts, marginFact],
          // Calculado: con margen de 1 a 4 min, «cualquier demora» era falso.
          optimalComparison:
            margin === 0
              ? 'Llegaste sin ningún minuto de margen: cualquier demora extra te dejaba afuera.'
              : `Llegaste con ${String(margin)} min de margen: una demora de más de ${String(margin)} min te dejaba afuera.`,
          consequence: 'Entrás justo, sin tiempo para nada más que sentarte.',
        },
        metrics: metrics({ efficiency: 0.5, precision: 0.6, risk: 0.7 }),
        careerEffects: { estilo: { axis: 'estratega', amount: 8 } },
        flagEffects: [{ flag: 'g7.llegoJusto', value: true }],
      })
    }

    if (best !== undefined && margin === best) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'bus.optimal',
          stamp: 'Llegaste',
          facts: [...facts, marginFact],
          optimalComparison:
            'Llegaste con tiempo suficiente sin madrugar de más.',
          consequence:
            'Entrás caminando, con tiempo de sobra para acomodar las cosas.',
        },
        metrics: metrics({ efficiency: 1, precision: 1, risk: 0.2 }),
        careerEffects: { estilo: { axis: 'estratega', amount: 8 } },
        flagEffects: [{ flag: 'g7.llegoComodo', value: true }],
      })
    }

    const wasted = best === undefined ? 0 : margin - best
    return ok({
      quality: 'efficient',
      feedback: {
        outcomeKey: 'bus.early',
        stamp: 'Llegaste',
        facts: [
          ...facts,
          marginFact,
          { label: 'Esperando', value: `${String(wasted)} min de más` },
        ],
        consequence:
          'Llegás con la escuela todavía cerrada y esperás en la puerta.',
        ...(best === undefined
          ? {}
          : {
              optimalComparison: `Con ${String(best)} min de margen alcanzaba igual.`,
            }),
      },
      metrics: metrics({
        efficiency: Math.max(0, 1 - wasted / 40),
        precision: 1,
        risk: 0.1,
      }),
      // Tomarse el primero y esperar en la puerta es la lectura por el libro:
      // llega seguro, gastando tiempo que no hacía falta.
      careerEffects: { estilo: { axis: 'aplicado', amount: 8 } },
      flagEffects: [{ flag: 'g7.llegoComodo', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido, que verifican la matemática autorada. */
export const busTimingReference = {
  scheduledMinutes: SCHEDULED_MINUTES,
  entryMinutesOfDay: ENTRY_MINUTES_OF_DAY,
  safeMargin: SAFE_MARGIN,
  variants: busTimingVariants.authored,
  travelWithDelay: (delayPercent: number): number =>
    Number(travelWithDelay(SCHEDULED_MINUTES, delayPercent).n),
  formatClock,
  formatMinutes: (value: Rational): string => formatDecimal(value, 0),
}
