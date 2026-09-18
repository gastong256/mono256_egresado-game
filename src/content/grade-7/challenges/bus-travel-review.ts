/**
 * 7.º grado — cuánto dura el viaje hoy. **Contenido de recuperación.**
 *
 * La tercera plantilla de la familia colectivo, y la única con rol `recovery`:
 * no se compone nunca, no gasta un beat ordinario y sólo la agenda la
 * progresión cuando el año quedó debiendo algo.
 *
 * ## Por qué esta pregunta
 *
 * Las otras dos plantillas del colectivo piden lo mismo por caminos opuestos —
 * elegir una salida, o construir la anticipación—, y las dos apoyan sobre un
 * paso intermedio: **cuánto dura el viaje una vez aplicada la demora**. Ahí es
 * donde vive el error más común, y el enunciado completo lo esconde detrás de
 * la decisión.
 *
 * Así que la recuperación aísla ese paso. No es la misma pregunta más fácil ni
 * otra pregunta distinta: es la cuenta que la anterior daba por sabida, sola y
 * a la vista.
 *
 * ## Qué NO es
 *
 * No es un castigo, y no escala el currículo. El Teacher Gate separó año
 * escolar de prerrequisito matemático, y eso vale también acá: una recuperación
 * que exigiera matemática más avanzada convertiría el error en una barrera, que
 * es exactamente lo contrario de lo que el fail-forward busca.
 *
 * Es `core`, con menos carga estructural que la situación que la disparó, y esa
 * asimetría es intencional: se baja el piso sin bajar el techo del concepto.
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
  busTravelReviewVariants,
  travelWithDelay,
  type TravelReviewParams,
} from './bus-travel-review.variants'

interface TravelReviewModel {
  readonly scheduledMinutes: number
  readonly delayPercent: number
  readonly travelMinutes: number
  /** Cuántos minutos agrega la demora. Es el andamio. */
  readonly extraMinutes: number
}

const BUS_TRAVEL_REVIEW_ID = toChallengeId('g7.bus-travel-review')

export const busTravelReview: ChallengeDefinition = defineChallenge<
  TravelReviewModel,
  TravelReviewParams
>({
  id: BUS_TRAVEL_REVIEW_ID,
  family: BUS_FAMILY,
  // El único rol que la composición nunca elige. Sólo la progresión lo agenda.
  placement: 'recovery',
  variants: authoredVariantIds(busTravelReviewVariants.authored),
  variantSource: busTravelReviewVariants,
  interaction: 'numeric-input',
  categories: ['time-and-rates', 'proportions-and-percentages'],
  stages: ['grade-7'],
  baseDifficulty: 1,

  // Un solo paso, sin restricciones que sostener a la vez y sin nada que
  // optimizar: la respuesta hay que producirla, y eso es todo lo que pesa.
  cognitive: {
    steps: 1,
    constraints: 0,
    selection: 0,
    optimization: 0,
    uncertainty: 0,
    construction: 1,
  },

  // Contenido de recuperación: no aporta evidencia competitiva de ninguna
  // clase. La evidencia de la competencia es el beat ordinario que salió mal, y
  // volver a cobrar acá convertiría equivocarse en una estrategia.
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Contenido de recuperación: la evidencia competitiva es el beat ordinario que la disparó, y puntuar la remediación premiaría haber fallado.',
  },

  tools: ['calculator'],

  generate({ params }) {
    const travelMinutes = travelWithDelay(params)
    return {
      scheduledMinutes: params.scheduledMinutes,
      delayPercent: params.delayPercent,
      travelMinutes,
      extraMinutes: travelMinutes - params.scheduledMinutes,
    }
  },

  verify(model) {
    const issues: string[] = []
    if (!Number.isInteger(model.travelMinutes)) {
      issues.push('el viaje con demora no da minutos enteros')
    }
    if (model.extraMinutes <= 0) {
      issues.push('la demora no alarga el viaje')
    }
    return issues
  },

  narrate() {
    return {
      title: 'El viaje de hoy',
      setup:
        'Quedó dando vueltas la cuenta del colectivo, así que la volvés a hacer con calma: primero cuánto agrega la demora, después cuánto dura el viaje.',
      goal: 'Decí cuántos minutos dura el viaje de hoy.',
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
          constraint: true,
        },
        {
          // El andamio: la pregunta se hace en dos mitades y la primera está
          // nombrada. Bajar el piso no es dar la respuesta.
          label: 'Primero',
          value: `${String(model.delayPercent)} % de ${String(model.scheduledMinutes)}`,
          unit: 'minutos que agrega',
          span: 2,
        },
      ],
      unitLabel: 'minutos',
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
        detail: 'un viaje no dura menos que cero',
      })
    }

    const gap = Math.abs(
      toNumber(subtract(submitted, fromInteger(model.travelMinutes))),
    )

    const facts = [
      { label: 'Viaje normal', value: `${String(model.scheduledMinutes)} min` },
      {
        label: `${String(model.delayPercent)} % de ${String(model.scheduledMinutes)}`,
        value: `${String(model.extraMinutes)} min`,
      },
      { label: 'Viaje de hoy', value: `${String(model.travelMinutes)} min` },
    ]

    if (gap === 0) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'bus-review.exact',
          stamp: 'Esa es',
          facts,
          optimalComparison:
            'La demora agrega su porcentaje del viaje normal, y eso se suma al viaje normal.',
          consequence: 'Con esa cuenta el resto del problema se ordena solo.',
        },
        metrics: metrics({ efficiency: 1, precision: 1, risk: 0 }),
        careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
        flagEffects: [{ flag: 'g7.repasoColectivo', value: true }],
      })
    }

    // Confundir «la demora» con «el viaje con demora» es el error que esta
    // pantalla existe para nombrar, así que se lo nombra en vez de marcarlo mal.
    //
    // La condición se compara **con signo** contra los minutos que agrega la
    // demora, no con la distancia al viaje de hoy: `|respuesta − viajeDeHoy| =
    // viajeNormal` tiene dos raíces —la demora sola, que es el error, y
    // `viajeDeHoy + viajeNormal`, que es haber contado el viaje normal dos
    // veces—, y en la segunda este texto afirmaba lo contrario de lo que pasó
    // (MAT-RA-001, RS-RA-001). Quien se pasa cae en la escalera por distancia,
    // que es donde corresponde.
    const answeredExtra =
      compare(submitted, fromInteger(model.extraMinutes)) === 0
    if (answeredExtra) {
      return ok({
        quality: 'functional',
        feedback: {
          outcomeKey: 'bus-review.extra-only',
          stamp: 'Casi',
          facts,
          optimalComparison: `Ésos son los minutos que la demora agrega. El viaje de hoy es el normal más esos: ${String(model.travelMinutes)}.`,
          consequence: 'Faltaba sumarle el viaje normal.',
        },
        metrics: metrics({ efficiency: 0.6, precision: 0.6, risk: 0.2 }),
        careerEffects: { estilo: { axis: 'improvisador', amount: 4 } },
        flagEffects: [{ flag: 'g7.repasoColectivo', value: true }],
      })
    }

    if (gap <= 2) {
      return ok({
        quality: 'efficient',
        feedback: {
          outcomeKey: 'bus-review.close',
          stamp: 'Cerca',
          facts,
          optimalComparison: `El viaje de hoy son ${String(model.travelMinutes)} minutos.`,
          consequence: 'La idea está; el número se te fue por poco.',
        },
        metrics: metrics({ efficiency: 0.8, precision: 0.8, risk: 0.1 }),
        careerEffects: { estilo: { axis: 'aplicado', amount: 4 } },
        flagEffects: [{ flag: 'g7.repasoColectivo', value: true }],
      })
    }

    return ok({
      quality: 'invalid',
      feedback: {
        outcomeKey: 'bus-review.off',
        stamp: 'No es por ahí',
        facts,
        optimalComparison: `${String(model.delayPercent)} % de ${String(model.scheduledMinutes)} son ${String(model.extraMinutes)} minutos, y el viaje de hoy son ${String(model.travelMinutes)}.`,
        consequence: 'Queda anotado, y el año sigue.',
      },
      metrics: metrics({ efficiency: 0.2, precision: 0.2, risk: 0.4 }),
      careerEffects: { estilo: { axis: 'improvisador', amount: 6 } },
      flagEffects: [{ flag: 'g7.repasoColectivo', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido. */
export const busTravelReviewReference = {
  variants: busTravelReviewVariants.authored,
  travelWithDelay,
}
