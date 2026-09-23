/**
 * Qué significa «seguir» en cada pantalla.
 *
 * El motor sabe dónde está la run —qué evento del año se está jugando, si el
 * año todavía debe un Repaso, cuál es la etapa siguiente— pero no le pone
 * palabras. Este módulo las pone, y las pone **sólo acá**: el botón de acción
 * de la run lee una intención y la traduce, así que ninguna pantalla vuelve a
 * decidir si «Seguir» significa pasar al año siguiente o entrar al Repaso.
 *
 * Todo se deriva de selectores públicos del motor. No hay estado nuevo, no hay
 * acción nueva y no hay ninguna transición que exista sólo para que un botón
 * pueda decir «Pasar a 3.º»: el jugador aprieta el mismo `CONTINUE` de siempre;
 * lo único que cambia es que ahora sabe qué va a pasar cuando lo apriete.
 *
 * Es presentación pura. Si una predicción quedara desalineada del motor, el
 * botón diría una palabra de más y el motor haría lo correcto igual.
 */

import {
  owesRecovery,
  runProgress,
  type Ruleset,
  type RunState,
  type SolutionQuality,
  type StageId,
} from '@/game'

import { stageNumeral } from './stage-label'

export type ContinueIntent =
  /** La apertura de un año: el beat narrativo con el que empieza. */
  | { readonly kind: 'start-year'; readonly stage: StageId }
  /** Un evento más del mismo año. */
  | { readonly kind: 'next-event' }
  /** El año terminó sus beats y todavía debe algo: lo que sigue es el Repaso. */
  | { readonly kind: 'review'; readonly stage: StageId }
  /** El año cerró; lo que sigue es la apertura del siguiente. */
  | {
      readonly kind: 'next-year'
      readonly completed: StageId
      readonly next: StageId
    }
  /** Cerró la última etapa del ruleset; lo que sigue es el cierre de la run. */
  | { readonly kind: 'finish'; readonly completed: StageId }

/**
 * Qué hace `CONTINUE` desde la pantalla actual.
 *
 * El último evento planificado del año es el borde: desde ahí, `advance`
 * agenda el Repaso si el año debe algo, y si no, abre la etapa siguiente o
 * completa la run. Un Repaso ya abierto cuenta como «después del último
 * evento», que es exactamente cómo lo cuenta el motor.
 */
export function continueIntent(
  state: RunState,
  ruleset: Ruleset,
): ContinueIntent {
  const progress = runProgress(state, ruleset)
  const atLastEvent = progress.eventInStage + 1 >= progress.eventsInStage

  if (!atLastEvent) {
    return state.phase === 'narrative' && progress.eventInStage === 0
      ? { kind: 'start-year', stage: state.stage }
      : { kind: 'next-event' }
  }

  if (owesRecovery(state.progression, state.stage)) {
    return { kind: 'review', stage: state.stage }
  }

  const next = ruleset.stages[progress.stageIndex + 1]
  return next === undefined
    ? { kind: 'finish', completed: state.stage }
    : { kind: 'next-year', completed: state.stage, next: next.id }
}

/**
 * El texto del botón.
 *
 * Un botón anticipa su consecuencia cuando la consecuencia importa: pasar de
 * año, entrar al Repaso, egresar. Entre dos eventos del mismo año, «Seguir»
 * sigue siendo la palabra correcta, y ponerle un verbo más largo a cada clic
 * sólo gastaría el peso que los hitos necesitan.
 *
 * Cerrar 5.º no es pasar a otro año: es el final de la trayectoria. Un ruleset
 * de desarrollo que termina antes cierra su etapa, sin prometer un egreso.
 */
export function continueLabel(intent: ContinueIntent): string {
  switch (intent.kind) {
    case 'start-year':
      return `Empezar ${stageNumeral(intent.stage)}`
    case 'next-event':
      return 'Seguir'
    case 'review':
      return 'Ir al Repaso'
    case 'next-year':
      return `Pasar a ${stageNumeral(intent.next)}`
    case 'finish':
      return intent.completed === 'year-5'
        ? 'Ver mi egreso'
        : `Cerrar ${stageNumeral(intent.completed)}`
  }
}

/** Si esta pantalla es la última del año y merece el hito de cierre. */
export function completesYear(
  intent: ContinueIntent,
): intent is Extract<ContinueIntent, { kind: 'next-year' | 'finish' }> {
  return intent.kind === 'next-year' || intent.kind === 'finish'
}

/**
 * La línea de cada año al cerrarse.
 *
 * Sigue la espina narrativa aprobada —adaptación, consolidación, pertenencia,
 * autonomía, responsabilidad, cierre— y no inventa una etapa nueva. Es una
 * frase, no un arquetipo: el arquetipo pertenece al cierre de la carrera.
 */
const YEAR_LINE: Readonly<Record<StageId, string>> = {
  'grade-7': 'Ya sabés cómo funciona la escuela.',
  'year-1': 'Ya tenés una forma propia de resolver.',
  'year-2': 'Ya tenés un lugar en el curso.',
  'year-3': 'La agenda la armaste vos.',
  'year-4': 'Hubo gente que dependió de tus decisiones.',
  'year-5': 'Terminaste la secundaria.',
  graduation: 'Terminaste la secundaria.',
}

export interface YearMilestoneCopy {
  /** «7.º», «1.º»… Es un numeral, no un título. */
  readonly numeral: string
  /** La etiqueta chica de arriba. */
  readonly eyebrow: string
  /** Una o dos frases, derivadas de lo que el año registró. */
  readonly line: string
  /** Verdadero cuando cerró 5.º: el hito prepara el egreso. */
  readonly final: boolean
}

/**
 * El hito de cierre de un año, derivado de lo que ese año dejó escrito.
 *
 * Determinista y sólo lectura: cuenta los resultados ordinarios del año en el
 * historial y si la progresión registró un Repaso. Dos runs con el mismo año
 * cierran con la misma frase. No hay score parcial ni ninguna dimensión que el
 * motor no haya establecido ya; la tira de carrera, arriba, sigue siendo la
 * única lectura de los números.
 */
export function yearMilestoneCopy(
  state: RunState,
  intent: Extract<ContinueIntent, { kind: 'next-year' | 'finish' }>,
): YearMilestoneCopy {
  const stage = intent.completed
  const final = intent.kind === 'finish' && stage === 'year-5'
  const qualities: readonly SolutionQuality[] = state.history.flatMap(
    (entry) =>
      entry.stage === stage &&
      entry.challengeId !== undefined &&
      entry.recovery !== true &&
      entry.quality !== undefined
        ? [entry.quality]
        : [],
  )
  const reviewed = state.progression.history.some(
    (record) => record.stageId === stage,
  )
  const allOptimal =
    qualities.length > 0 && qualities.every((quality) => quality === 'optimal')

  const suffix = reviewed
    ? ' Quedó algo dando vueltas y lo cerraste igual.'
    : allOptimal
      ? ' Todo salió como lo pensaste.'
      : ''

  return {
    numeral: stageNumeral(stage),
    eyebrow: final ? 'Fin de la secundaria' : 'Año completado',
    line: `${YEAR_LINE[stage]}${suffix}`,
    final,
  }
}
