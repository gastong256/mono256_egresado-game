/**
 * 7.º grado — el acto del 25 de Mayo.
 *
 * Situación: te tocó la coreografía folklórica del acto, adelante de toda la
 * escuela. Como no te acordás los pasos de memoria, armaste una ayudamemoria:
 * cada paso tiene una regla numérica, y en la tira de números que la maestra va
 * cantando marcás los que te toca acompañar.
 *
 * La matemática son tres clasificaciones que 7.º ya trabajó —pares, múltiplos de
 * 3 y primos— y no está de adorno: la regla **es** la coreografía. Equivocarse no
 * es tener mal una cuenta, es dar un paso cuando no iba, adelante de todos.
 *
 * Por qué este evento y no otro mueve Aura: es el único momento del año que pasa
 * en público. Aura es capital narrativo —lo memorable, lo vergonzoso, lo que se
 * comenta en el pasillo—, y no se gana resolviendo bien una cuenta en el
 * cuaderno. Un acto escolar es exactamente el tipo de escena donde alguien de
 * doce años se hace o se quema una reputación en cuatro minutos.
 *
 * Por qué **no** pone nota: no es una evaluación de matemática. Promedio sale del
 * legajo de notas reales, y el acto del 25 de Mayo no lleva una. Que un desafío
 * tenga números no lo vuelve académico.
 *
 * Por qué no toca Equipo: bailás vos. El curso mira. Coordinar con otros sería
 * otro evento.
 *
 * ## Cómo se juzga
 *
 * Las tres rondas se agregan sumando sus confusiones —`TP`, `FP` y `FN`— y se
 * juzgan con un solo F1. Micro-agregar y no promediar tres F1 es deliberado: así
 * cada celda de la coreografía pesa lo mismo, y una ronda con menos objetivos no
 * vale por sí sola un tercio del acto.
 *
 * Los umbrales están elegidos para que ninguna estrategia degenerada pase por
 * buena. Marcar la grilla entera da `F1 = 0,67` y cae en Insuficiente; marcar una
 * sola celda evidente, todavía menos. Hay que clasificar de verdad.
 */

import {
  f1FromMetrics,
  addClassification,
  classificationScore,
  clamp01,
  compare,
  countClassification,
  defineChallenge,
  EMPTY_CLASSIFICATION,
  err,
  fromInteger,
  metrics,
  ok,
  rational,
  targetsFor,
  authoredVariantIds,
  toChallengeId,
  toNumber,
  type ChallengeDefinition,
  type ChallengeEvaluation,
  type ClassificationCounts,
  type EngineRejection,
  type InteractionAnswer,
  type NumberRule,
  type Rational,
  type Result,
  type SolutionQuality,
} from '@/game'
import { may25ActVariants, type May25Params } from './may-25-act.variants'
import { MAY_25_FAMILY } from '../families'

interface ActRound {
  readonly id: string
  /** El paso de la coreografía. Nunca es sólo un color: es un movimiento. */
  readonly cue: string
  readonly ruleLabel: string
  readonly rule: NumberRule
  readonly numbers: readonly number[]
}

interface May25Model {
  readonly rounds: readonly ActRound[]
}

/** Columnas de la grilla. Cuatro entran a 360 px con celdas de 56 px de alto. */
const COLUMNS = 4

/**
 * Las tres variantes autoradas.
 *
 * Cada una son tres rondas de ocho números, siempre en el mismo orden de
 * dificultad: paridad, múltiplos de 3 y primos. Los números se eligieron para que
 * la cuenta nunca sea el obstáculo —todos menores que 31— y para que cada ronda
 * tenga entre 3 y 4 objetivos: ni tan pocos que marcar uno alcance, ni tantos que
 * marcar todo se parezca a jugar.
 *
 * La ronda de primos incluye el 1 a propósito. Es el error clásico de la edad y
 * el único lugar donde el juego lo puede señalar sin que sea una pregunta de
 * examen: 1 tiene un solo divisor, así que no es primo, y la grilla corregida lo
 * muestra tachado sin decirle nada a nadie.
 *
 * Esto es contenido autorado y determinista. La generalización a familias y
 * variantes es otra tarea; la forma —lista de rondas con su regla y sus números—
 * está pensada para migrar sin reescribir el evaluador.
 */
/** Identidad estable de la plantilla. */
const MAY_25_ACT_ID = toChallengeId('g7.may-25-act')

/**
 * La coreografía: tres pasos, con su seña y su regla.
 *
 * Es la escena y no cambia. Lo que varía de una función a otra son los números
 * de la grilla, que es exactamente lo que un chico memorizaría si fuera fijo.
 */
const ROUND_SHAPE = [
  {
    id: 'paso-1',
    cue: 'Pañuelo blanco',
    ruleLabel: 'Números pares',
    rule: 'even',
  },
  {
    id: 'paso-2',
    cue: 'Pañuelo celeste',
    ruleLabel: 'Múltiplos de 3',
    rule: 'multiple-of-three',
  },
  { id: 'paso-3', cue: 'Zapateo', ruleLabel: 'Números primos', rule: 'prime' },
] as readonly Omit<ActRound, 'numbers'>[]

/**
 * Los umbrales del acto, sobre el F1 agregado.
 *
 * Son racionales exactos y se comparan como racionales: una coreografía no se
 * decide por el último bit de un flotante.
 */
const OPTIMAL_AT = fromInteger(1)
const EFFICIENT_AT = rational(17n, 20n) // 0,85
const FUNCTIONAL_AT = rational(7n, 10n) // 0,70

function qualityFor(f1: Rational): SolutionQuality {
  if (compare(f1, OPTIMAL_AT) >= 0) {
    return 'optimal'
  }
  if (compare(f1, EFFICIENT_AT) >= 0) {
    return 'efficient'
  }
  if (compare(f1, FUNCTIONAL_AT) >= 0) {
    return 'functional'
  }
  return 'invalid'
}

/** Porcentaje entero, sólo para escribirlo en el ledger. */
function percent(value: Rational): string {
  return `${String(Math.round(toNumber(value) * 100))} %`
}

/** Lo que el jugador marcó en una ronda, tolerando que falte. */
function selectionFor(
  answer: Extract<InteractionAnswer, { kind: 'number-grid' }>,
  roundId: string,
): readonly number[] {
  return answer.rounds.find((round) => round.roundId === roundId)?.numbers ?? []
}

export const may25Act: ChallengeDefinition = defineChallenge<
  May25Model,
  May25Params
>({
  id: MAY_25_ACT_ID,
  family: MAY_25_FAMILY,
  placement: 'special',
  variants: authoredVariantIds(may25ActVariants.authored),
  variantSource: may25ActVariants,
  interaction: 'number-grid',
  categories: ['patterns-and-relations', 'quantity'],
  stages: ['grade-7'],
  baseDifficulty: 2,
  // Cada celda es una sola pregunta —¿cumple la regla?— y la regla está escrita.
  // Lo que pesa es que hay tres reglas distintas y veinticuatro celdas, y que la
  // respuesta es el conjunto que el jugador arma, no una que reconoce.
  cognitive: {
    steps: 1,
    constraints: 0,
    selection: 2,
    optimization: 0,
    uncertainty: 0,
    construction: 1,
  },
  // El acto ya se juzga con F1, así que la componente matemática lee esa medida
  // continua en vez de la banda que la resume: tirar precisión y cobertura para
  // quedarse con cuatro cajas sería perder evidencia que el evaluador ya
  // calculó.
  //
  // Y **no** aporta aura competitiva, aunque sea el único evento que mueve Aura
  // en la carrera. La pregunta «qué tan bien saliste en público» no tiene acá
  // otra respuesta que el F1 que ya se contó como matemática; una segunda
  // lectura del mismo hecho es cobrarlo dos veces con otro nombre.
  scoring: {
    math: ({ metrics }) => f1FromMetrics(metrics.precision, metrics.efficiency),
    team: 'none',
    aura: 'none',
    rationale:
      'La clasificación se mide con F1 y ése es su único hecho: el aura de carrera sale de la misma medida, así que darle además aura competitiva la cobraría dos veces.',
  },
  // Sin herramientas: estás bailando adelante de la escuela, no resolviendo una
  // guía. Una calculadora acá sería una mentira sobre la situación.
  tools: [],

  generate({ params }) {
    return {
      rounds: ROUND_SHAPE.map((shape, index) => ({
        ...shape,
        numbers: params.rounds[index] ?? [],
      })),
    }
  },

  verify(model) {
    const issues: string[] = []

    if (model.rounds.length !== 3) {
      issues.push('el acto tiene que tener exactamente tres pasos')
    }
    if (
      new Set(model.rounds.map((round) => round.id)).size !==
      model.rounds.length
    ) {
      issues.push('dos pasos comparten el mismo id')
    }

    for (const round of model.rounds) {
      const { numbers } = round
      if (numbers.length !== COLUMNS * 2) {
        issues.push(
          `${round.id}: la grilla tiene que tener ${String(COLUMNS * 2)} números`,
        )
      }
      if (new Set(numbers).size !== numbers.length) {
        issues.push(`${round.id}: la grilla repite un número`)
      }
      if (numbers.some((value) => !Number.isSafeInteger(value) || value < 0)) {
        issues.push(`${round.id}: la grilla tiene un número que no es entero`)
      }
      if (numbers.some((value) => value > 30)) {
        issues.push(
          `${round.id}: un número mayor que 30 convierte la clasificación en una cuenta`,
        )
      }

      const targets = targetsFor(round.rule, numbers)
      if (targets.length < 2) {
        issues.push(
          `${round.id}: con menos de dos objetivos marcar uno solo ya resuelve la ronda`,
        )
      }
      if (targets.length > numbers.length - 2) {
        issues.push(
          `${round.id}: casi todo cumple la regla, así que marcar todo casi acierta`,
        )
      }
    }

    return issues
  },

  narrate() {
    return {
      title: '25 de Mayo',
      setup:
        'Te toca la coreografía frente a toda la escuela y no te sabés los pasos de memoria. Armaste una ayudamemoria: cada paso tiene una regla, y de los números que canta la maestra acompañás sólo los que la cumplen.',
      goal: 'Marcá, en cada paso, los números que cumplen su regla.',
    }
  },

  present(model) {
    return {
      kind: 'number-grid',
      // Ningún dato suelto arriba: los números de la grilla son el dato, y
      // repetirlos en cajas sería pedir que se lean dos veces.
      data: [],
      columns: COLUMNS,
      rounds: model.rounds.map((round) => ({
        id: round.id,
        cue: round.cue,
        ruleLabel: round.ruleLabel,
        rule: round.rule,
        numbers: round.numbers,
      })),
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'number-grid') {
      return err({
        kind: 'invalid-answer',
        detail: `se esperaba number-grid y llegó ${answer.kind}`,
      })
    }

    const known = new Set(model.rounds.map((round) => round.id))
    const stray = answer.rounds.find((round) => !known.has(round.roundId))
    if (stray !== undefined) {
      return err({
        kind: 'invalid-answer',
        detail: `paso desconocido ${stray.roundId}`,
      })
    }

    let counts: ClassificationCounts = EMPTY_CLASSIFICATION
    let missedRule: string | undefined

    for (const round of model.rounds) {
      const targets = targetsFor(round.rule, round.numbers)
      const roundCounts = countClassification(
        targets,
        selectionFor(answer, round.id),
      )
      counts = addClassification(counts, roundCounts)

      // El paso que más se desarmó, para poder nombrarlo en el resultado. El
      // primero que aparece gana, así que dos pasos igual de flojos no cambian
      // el texto según el orden de un `sort`.
      if (
        missedRule === undefined &&
        roundCounts.falseNegatives + roundCounts.falsePositives > 0
      ) {
        missedRule = round.ruleLabel
      }
    }

    const score = classificationScore(counts)
    const quality = qualityFor(score.f1)
    const targetTotal = counts.truePositives + counts.falseNegatives

    const facts = [
      { label: 'Pasos en la ayudamemoria', value: String(targetTotal) },
      { label: 'Acertaste', value: String(counts.truePositives) },
      { label: 'De más', value: String(counts.falsePositives) },
      { label: 'Sin marcar', value: String(counts.falseNegatives) },
      { label: 'Coreografía', value: percent(score.f1) },
    ]

    const reasoning = metrics({
      precision: clamp01(toNumber(score.precision)),
      efficiency: clamp01(toNumber(score.coverage)),
      // Un acto es una sola pasada delante de la escuela: no hay información que
      // consultar ni una segunda oportunidad, así que la incertidumbre que se
      // aceptó es la misma para cualquier respuesta.
      risk: 0.5,
    })

    if (quality === 'optimal') {
      return ok({
        quality,
        feedback: {
          outcomeKey: 'may25.perfect',
          stamp: 'Impecable',
          facts,
          optimalComparison:
            'Seguiste la ayudamemoria sin dudar y los pasos salieron en tiempo.',
          consequence:
            'Media escuela lo filma. Durante dos semanas te paran en el pasillo para decírtelo.',
        },
        metrics: reasoning,
        // El acto no lleva nota y no lo bailás con nadie: mueve Aura y Estilo, y
        // nada más. Aplicado, porque salió por hacerlo completo y con cuidado.
        careerEffects: {
          aura: 1000,
          estilo: { axis: 'aplicado', amount: 12 },
        },
        flagEffects: [{ flag: 'g7.actoImpecable', value: true }],
      })
    }

    if (quality === 'efficient') {
      return ok({
        quality,
        feedback: {
          outcomeKey: 'may25.solid',
          stamp: 'Salió',
          facts,
          optimalComparison:
            missedRule === undefined
              ? 'Un paso quedó a destiempo y lo acomodaste enseguida.'
              : `Un paso de «${missedRule}» quedó a destiempo y lo acomodaste enseguida.`,
          consequence:
            'Sale bien. Alguien te grita el nombre desde las gradas y terminás saludando.',
        },
        metrics: reasoning,
        // Salió pese a un error: leer el patrón rápido es lo que lo sostuvo.
        careerEffects: {
          aura: 400,
          estilo: { axis: 'estratega', amount: 10 },
        },
        flagEffects: [{ flag: 'g7.actoSalio', value: true }],
      })
    }

    if (quality === 'functional') {
      return ok({
        quality,
        feedback: {
          outcomeKey: 'may25.recovered',
          stamp: 'Zafaste',
          facts,
          optimalComparison:
            missedRule === undefined
              ? 'Perdiste la cuenta en el medio y volviste a engancharte mirando a los costados.'
              : `Perdiste la cuenta en «${missedRule}» y volviste a engancharte mirando a los costados.`,
          consequence:
            'Nadie se acuerda del acto la semana siguiente, y eso también es un resultado.',
        },
        metrics: reasoning,
        // Se salvó improvisando: la coreografía no se siguió, se reconstruyó.
        careerEffects: {
          aura: 80,
          estilo: { axis: 'improvisador', amount: 12 },
        },
        flagEffects: [{ flag: 'g7.actoZafado', value: true }],
      })
    }

    return ok({
      quality,
      feedback: {
        outcomeKey: 'may25.lost',
        stamp: 'Se cortó',
        facts,
        violatedConstraint: 'seguir la coreografía',
        optimalComparison:
          missedRule === undefined
            ? 'La ayudamemoria decía otra cosa que lo que marcaste.'
            : `La regla de «${missedRule}» era la que había que seguir.`,
        consequence:
          'Chocás con la fila de adelante y el acto sigue sin vos. La escena queda dando vueltas un rato largo.',
      },
      metrics: reasoning,
      // Un desastre público resta Aura y sigue siendo Improvisador: terminaste el
      // acto igual, inventando. Nada de esto corta la partida.
      careerEffects: {
        aura: -300,
        estilo: { axis: 'improvisador', amount: 8 },
      },
      flagEffects: [{ flag: 'g7.actoPerdido', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido. */
export const may25ActReference = {
  variants: may25ActVariants.authored,
  columns: COLUMNS,
  thresholds: {
    optimal: OPTIMAL_AT,
    efficient: EFFICIENT_AT,
    functional: FUNCTIONAL_AT,
  },
} as const
