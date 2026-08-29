/**
 * 7.º grado — con cuánto tiempo hay que salir.
 *
 * Segunda plantilla de la familia **colectivo**, y la razón por la que la
 * familia existe: la situación es la misma —el 60 viene con demora— pero la
 * pregunta se da vuelta.
 *
 * `g7.bus-timing` **evalúa**: hay cuatro salidas, calculá cuándo llega cada una
 * y elegí. La respuesta está entre las opciones y el trabajo es descartarlas.
 *
 * Ésta **invierte**: no hay opciones. El grupo pregunta con cuánto tiempo hay
 * que salir para llegar con margen, y el jugador tiene que producir el número.
 * Se recorre la misma relación al revés — de la hora de llegada hacia atrás
 * hasta la de salida— y eso es una operación distinta, no la misma cuenta con
 * otros valores.
 *
 * La restricción es asimétrica y ésa es la enseñanza: pasarse de tiempo cuesta
 * espera, quedarse corto cuesta llegar tarde. No son el mismo error.
 */

import {
  defineChallenge,
  err,
  metrics,
  ok,
  authoredVariantIds,
  compare,
  fromDecimalString,
  fromInteger,
  subtract,
  toChallengeId,
  toNumber,
  type ChallengeDefinition,
  type ChallengeEvaluation,
  type EngineRejection,
  type InteractionAnswer,
  type Rational,
  type Result,
} from '@/game'
import { BUS_FAMILY } from '../families'
import {
  busLatestDepartureVariants,
  type LatestDepartureParams,
} from './bus-latest-departure.variants'

interface LatestDepartureModel {
  readonly scheduledMinutes: number
  readonly delayPercent: number
  readonly travelMinutes: number
  readonly entryMinutesOfDay: number
  readonly safetyMarginMinutes: number
  /** Anticipación mínima para llegar con el margen pedido. */
  readonly requiredMinutes: number
}

/** Identidad estable de la plantilla. */
const BUS_LATEST_DEPARTURE_ID = toChallengeId('g7.bus-latest-departure')

/**
 * Cuánto puede sobrar sin que la respuesta deje de ser buena.
 *
 * Dos minutos de más siguen siendo la misma decisión bien tomada; a partir de
 * ahí el jugador está pidiendo un colchón que nadie pidió.
 */
const GENEROUS_SLACK = 2

/** A partir de acá salir antes ya es perder la mañana en la parada. */
const WASTEFUL_SLACK = 15

function formatClock(minutesOfDay: number): string {
  const hours = Math.floor(minutesOfDay / 60)
  const minutes = minutesOfDay % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/** Duración real del viaje: la programada más el porcentaje de demora. */
function travelWithDelay(scheduled: number, delayPercent: number): number {
  return scheduled + (scheduled * delayPercent) / 100
}

export const busLatestDeparture: ChallengeDefinition = defineChallenge<
  LatestDepartureModel,
  LatestDepartureParams
>({
  id: BUS_LATEST_DEPARTURE_ID,
  family: BUS_FAMILY,
  // Es un beat primario del año como el otro colectivo: la misma situación,
  // otra pregunta. Cuál de los dos juega una partida lo decide el seed.
  placement: 'anchor',
  variants: authoredVariantIds(busLatestDepartureVariants.authored),
  variantSource: busLatestDepartureVariants,
  interaction: 'numeric-input',
  categories: ['time-and-rates', 'proportions-and-percentages'],
  stages: ['grade-7'],
  baseDifficulty: 3,
  // La misma estructura que `g7.bus-timing` recorrida al revés, y con una
  // diferencia que se paga: no hay opciones que descartar, el número lo produce
  // el jugador. Ésa es la única traza que separa a las dos plantillas, y es
  // exactamente la que el modelo cognitivo existe para representar.
  cognitive: {
    steps: 2,
    constraints: 1,
    selection: 1,
    optimization: 1,
    uncertainty: 0,
    construction: 1,
  },
  // Igual que su hermana de familia: el número que produjo el jugador es el
  // único hecho, y las cuatro bandas de holgura son su resolución real.
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La anticipación que el jugador produjo es el único hecho medido; no hay una segunda señal independiente que equipo o aura puedan leer.',
  },
  tools: ['calculator'],

  generate({ params }) {
    const travelMinutes = travelWithDelay(
      params.scheduledMinutes,
      params.delayPercent,
    )

    return {
      scheduledMinutes: params.scheduledMinutes,
      delayPercent: params.delayPercent,
      travelMinutes,
      entryMinutesOfDay: params.entryMinutesOfDay,
      safetyMarginMinutes: params.safetyMarginMinutes,
      requiredMinutes: travelMinutes + params.safetyMarginMinutes,
    }
  },

  verify(model) {
    const issues: string[] = []

    if (!Number.isInteger(model.travelMinutes)) {
      issues.push('el viaje con demora no da minutos enteros')
    }
    if (model.travelMinutes <= model.scheduledMinutes) {
      issues.push('la demora no alarga el viaje')
    }
    if (model.safetyMarginMinutes <= 0) {
      issues.push('sin margen pedido la restricción desaparece')
    }
    if (model.requiredMinutes <= 0) {
      issues.push('la anticipación pedida tiene que ser positiva')
    }
    if (model.entryMinutesOfDay - model.requiredMinutes < 5 * 60) {
      issues.push('habría que salir antes de las cinco de la mañana')
    }

    return issues
  },

  narrate() {
    return {
      title: 'La pregunta del grupo',
      setup:
        'En el grupo del curso alguien tira la pregunta que todos se hacen: el 60 sigue viniendo con demora y nadie quiere volver a entrar con el timbre sonando.',
      goal: 'Decí con cuántos minutos de anticipación hay que salir.',
    }
  },

  present(model) {
    return {
      kind: 'numeric-input',
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
          // Es el número que aprieta, y va marcado antes de que el jugador haga
          // nada: subraya la tensión de la situación, no un error.
          constraint: true,
        },
        {
          label: 'Entrada',
          value: formatClock(model.entryMinutesOfDay),
          unit: 'sin excepción',
        },
        {
          label: 'Margen que pide el grupo',
          value: String(model.safetyMarginMinutes),
          unit: 'minutos antes',
          span: 2,
        },
      ],
      unitLabel: 'minutos antes',
      min: '0',
      max: '120',
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
        detail: `se esperaba numeric-input y llegó ${answer.kind}`,
      })
    }

    let submitted: Rational
    try {
      submitted = fromDecimalString(answer.value)
    } catch {
      return err({
        kind: 'invalid-answer',
        detail: `"${answer.value}" no es un número`,
      })
    }

    if (compare(submitted, fromInteger(0)) < 0) {
      return err({
        kind: 'invalid-answer',
        detail: 'la anticipación no puede ser negativa',
      })
    }

    const answered = toNumber(submitted)
    const slack = toNumber(
      subtract(submitted, fromInteger(model.requiredMinutes)),
    )
    const departure = model.entryMinutesOfDay - answered
    const arrival = departure + model.travelMinutes
    const extra = model.travelMinutes - model.scheduledMinutes

    const facts = [
      { label: 'Viaje normal', value: `${String(model.scheduledMinutes)} min` },
      { label: 'Demora', value: `${String(extra)} min` },
      { label: 'Viaje de hoy', value: `${String(model.travelMinutes)} min` },
      { label: 'Saliendo', value: formatClock(departure) },
      { label: 'Llegás', value: formatClock(arrival) },
    ]

    // Quedarse corto no es un error chico: es entrar tarde. La restricción es
    // asimétrica y el resultado tiene que decirlo.
    if (slack < 0) {
      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'bus-latest.short',
          // Corto de tiempo, y entra tanto llegar tarde como llegar sin el
          // margen pedido. Trece caracteres: el sello va rotado y a 360 px uno
          // más largo se sale de la hoja.
          stamp: 'Sobre la hora',
          facts: [
            ...facts,
            {
              label: 'Faltaban',
              value: `${String(Math.round(-slack))} min`,
            },
          ],
          violatedConstraint:
            arrival > model.entryMinutesOfDay
              ? 'hora de entrada'
              : 'margen pedido por el grupo',
          optimalComparison: `Con la demora de hoy el viaje son ${String(model.travelMinutes)} min, así que hacían falta ${String(model.requiredMinutes)}.`,
          consequence:
            arrival > model.entryMinutesOfDay
              ? 'Media clase entra tarde y en el grupo se acuerdan de quién dio la hora.'
              : `Llegan justo, sin los ${String(model.safetyMarginMinutes)} min que el grupo había pedido.`,
        },
        metrics: metrics({
          efficiency: 0.2,
          precision: Math.max(0, 1 - Math.abs(slack) / model.requiredMinutes),
          risk: 0.9,
        }),
        // El colectivo no es un evento académico: nadie pone una nota. Sólo
        // mueve Estilo, y quedarse corto es jugarla de improvisador.
        careerEffects: { estilo: { axis: 'improvisador', amount: 8 } },
        flagEffects: [{ flag: 'g7.calculoCorto', value: true }],
      })
    }

    if (slack <= GENEROUS_SLACK) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'bus-latest.exact',
          stamp: 'Justo',
          facts: [
            ...facts,
            {
              label: 'Margen real',
              value: `${String(Math.round(model.safetyMarginMinutes + slack))} min`,
            },
          ],
          optimalComparison:
            'Diste el número que hacía falta: llegan con el margen pedido y ni un minuto perdido.',
          consequence:
            'El grupo sale a esa hora y entran todos juntos, sin correr.',
        },
        metrics: metrics({ efficiency: 1, precision: 1, risk: 0.2 }),
        careerEffects: { estilo: { axis: 'estratega', amount: 8 } },
        flagEffects: [{ flag: 'g7.calculoJusto', value: true }],
      })
    }

    if (slack <= WASTEFUL_SLACK) {
      return ok({
        quality: 'efficient',
        feedback: {
          outcomeKey: 'bus-latest.safe',
          stamp: 'Llegan bien',
          facts: [
            ...facts,
            { label: 'De más', value: `${String(Math.round(slack))} min` },
          ],
          optimalComparison: `Con ${String(model.requiredMinutes)} min alcanzaba.`,
          consequence: 'Llegan con tiempo y esperan un rato en la puerta.',
        },
        metrics: metrics({
          efficiency: Math.max(0, 1 - slack / 30),
          precision: 0.8,
          risk: 0.1,
        }),
        careerEffects: { estilo: { axis: 'aplicado', amount: 8 } },
        flagEffects: [{ flag: 'g7.calculoSeguro', value: true }],
      })
    }

    return ok({
      quality: 'functional',
      feedback: {
        outcomeKey: 'bus-latest.early',
        stamp: 'Muy temprano',
        facts: [
          ...facts,
          { label: 'De más', value: `${String(Math.round(slack))} min` },
        ],
        optimalComparison: `Con ${String(model.requiredMinutes)} min alcanzaba: pediste ${String(Math.round(slack))} de más.`,
        consequence:
          'Llegan con la escuela todavía cerrada y esperan en la vereda.',
      },
      metrics: metrics({
        efficiency: Math.max(0, 1 - slack / 60),
        precision: 0.4,
        risk: 0.05,
      }),
      careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
      flagEffects: [{ flag: 'g7.calculoSeguro', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido, que verifican la matemática autorada. */
export const busLatestDepartureReference = {
  variants: busLatestDepartureVariants.authored,
  generousSlack: GENEROUS_SLACK,
  wastefulSlack: WASTEFUL_SLACK,
  travelWithDelay,
  formatClock,
}
