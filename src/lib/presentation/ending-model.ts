/**
 * El modelo del cierre: todo lo que el ending deriva, sin DOM.
 *
 * El motor termina una run con hechos —historial, progresión, carrera,
 * hitos— y el servidor devuelve un puntaje verificado y un puesto. Este
 * módulo los convierte en lo que la pantalla dice: una franja de desempeño,
 * un estilo de juego, los hitos que de verdad pasaron, el recorrido por año y
 * las afirmaciones competitivas que la evidencia permite.
 *
 * Reglas que sostiene:
 *
 * 1. **Presentación pura.** Nada de acá puntúa, ordena un ranking ni vuelve al motor.
 *    El servidor puede persistir estas proyecciones tras validar la partida. Mismo estado final → mismas palabras.
 * 2. **Si el estado no lo demuestra, el ending no lo afirma.** Un hito sale de
 *    un hecho registrado (hito del motor, flag de contenido, dimensión de
 *    carrera); una afirmación competitiva sale de lo que el servidor devolvió.
 * 3. **La franja se lee del FairScore verificado**, en su propia escala
 *    (0–10.000), y no de una segunda cuenta local.
 */

import {
  ESTILO_AXES,
  STAGE_ORDER,
  isEstiloEstablished,
  promedio,
  type CareerMemory,
  type Estilo,
  type EstiloAxis,
  type Milestone,
  type RunState,
  type SolutionQuality,
  type StageId,
} from '@/game'
import type {
  PublicCompetitionState,
  VerifiedAttemptPayload,
} from '@/lib/competition'

import { stageNumeral } from './stage-label'

// ---------------------------------------------------------------------------
// Franjas de desempeño
// ---------------------------------------------------------------------------

export const PERFORMANCE_BANDS = [
  'exceptional',
  'strong',
  'solid',
  'weak',
  'struggling',
] as const

export type PerformanceBand = (typeof PERFORMANCE_BANDS)[number]

/**
 * Umbrales sobre la escala del FairScore (10.000 = perfecto).
 *
 * Son de presentación y salen de la calibración conocida: un beat Óptimo vale
 * 10.000, uno Resuelto 7.500, uno Parcial 4.000 y uno Insuficiente 1.000, y la
 * matemática pesa el 85 %. Con nueve beats: todo Resuelto ronda 7.500
 * («solid»), todo Parcial ronda 4.000 («weak»), y sólo una carrera casi toda
 * Óptima pasa de 9.500. No son reglas de ranking y no se guardan.
 */
export const PERFORMANCE_THRESHOLDS: Readonly<
  Record<Exclude<PerformanceBand, 'struggling'>, number>
> = {
  exceptional: 9_500,
  strong: 8_000,
  solid: 6_000,
  weak: 4_000,
}

export function performanceBand(fairScore: number): PerformanceBand {
  if (fairScore >= PERFORMANCE_THRESHOLDS.exceptional) return 'exceptional'
  if (fairScore >= PERFORMANCE_THRESHOLDS.strong) return 'strong'
  if (fairScore >= PERFORMANCE_THRESHOLDS.solid) return 'solid'
  if (fairScore >= PERFORMANCE_THRESHOLDS.weak) return 'weak'
  return 'struggling'
}

export interface PerformanceFeedback {
  /** Debajo del puntaje: cómo fue la partida, en una frase. */
  readonly headline: string
  /** Antes de las acciones: qué hacer con eso. */
  readonly closing: string
}

/**
 * El catálogo, entero y a la vista.
 *
 * Se ríe de la partida, nunca de la persona; critica el resultado, no la
 * capacidad. La intensidad crece con la franja para que «gran recorrido»
 * siga significando algo, y la franja más baja invita a la revancha sin
 * disfrazar el número.
 */
export const PERFORMANCE_FEEDBACK: Readonly<
  Record<PerformanceBand, PerformanceFeedback>
> = {
  exceptional: {
    headline: 'Un recorrido de los que se cuentan.',
    closing: 'Casi nada quedó sobre la mesa. Si volvés a jugar, es por gusto.',
  },
  strong: {
    headline: 'Gran recorrido.',
    closing:
      'Sólido de punta a punta. Lo que falta está a un par de decisiones.',
  },
  solid: {
    headline: 'Buen recorrido, con margen para rascar.',
    closing:
      'Estuviste bien. Una segunda vuelta puede mover bastante ese número.',
  },
  weak: {
    headline: 'Egresaste. Digamos que no sobró demasiado.',
    closing: 'Hay mucho puntaje todavía sobre la mesa, y ya conocés el camino.',
  },
  struggling: {
    headline: 'Safaste: el diploma está, y el margen para mejorar también.',
    closing:
      'Llegaste al final, pero ese puntaje pide revancha. La próxima arranca con todo esto ya visto.',
  },
}

export function performanceFeedback(
  band: PerformanceBand,
): PerformanceFeedback {
  return PERFORMANCE_FEEDBACK[band]
}

// ---------------------------------------------------------------------------
// Estilo de juego
// ---------------------------------------------------------------------------

export const PLAY_STYLE_IDS = [
  'motor-del-equipo',
  'aura-del-curso',
  'estratega',
  'cabeza-fria',
  'sobre-la-marcha',
  'equilibrio',
  'todo-terreno',
] as const

export type PlayStyleId = (typeof PLAY_STYLE_IDS)[number]

export interface PlayStyle {
  readonly id: PlayStyleId
  readonly label: string
  readonly detail: string
}

/** Equipo arranca en 50; +6 neto son al menos dos repartos que salieron bien. */
export const TEAM_STYLE_MIN = 56
/** Un momento público impecable vale +1.000: desde ahí el curso te recuerda. */
export const AURA_STYLE_MIN = 1_000
/** Puntos de ventaja del eje dominante sobre el segundo para nombrarlo. */
export const ESTILO_LEAD_MARGIN = 10

const PLAY_STYLES: Readonly<Record<PlayStyleId, PlayStyle>> = {
  'motor-del-equipo': {
    id: 'motor-del-equipo',
    label: 'Motor del equipo',
    detail: 'Cuando hubo que repartir, el curso salió mejor con vos adentro.',
  },
  'aura-del-curso': {
    id: 'aura-del-curso',
    label: 'Aura del curso',
    detail: 'Los momentos públicos fueron tuyos: el curso todavía los cuenta.',
  },
  estratega: {
    id: 'estratega',
    label: 'Estratega del curso',
    detail: 'Mirás dónde conviene poner el esfuerzo antes de moverte.',
  },
  'cabeza-fria': {
    id: 'cabeza-fria',
    label: 'Cabeza fría',
    detail: 'Hacés las cosas cuando hay que hacerlas, sin apuro y sin drama.',
  },
  'sobre-la-marcha': {
    id: 'sobre-la-marcha',
    label: 'Sobre la marcha',
    detail: 'Lo arreglás en el momento, y muchas veces sale.',
  },
  equilibrio: {
    id: 'equilibrio',
    label: 'Equilibrio total',
    detail: 'Ninguna manera de resolver te ganó a las otras: usaste las tres.',
  },
  'todo-terreno': {
    id: 'todo-terreno',
    label: 'Todo terreno',
    detail: 'Fuiste cambiando según lo que tenías delante.',
  },
}

export interface PlayStyleInput {
  readonly estilo: Estilo
  readonly estiloEstablished: boolean
  readonly equipo: number | null
  readonly aura: number | null
}

const AXIS_STYLE: Readonly<Record<EstiloAxis, PlayStyleId>> = {
  estratega: 'estratega',
  aplicado: 'cabeza-fria',
  improvisador: 'sobre-la-marcha',
}

/**
 * Un estilo por carrera, determinista.
 *
 * Primero lo social, porque es lo más escaso: Equipo neto positivo o un Aura
 * de acto entero son hechos que pocas carreras tienen. Después el eje de
 * Estilo que domina con margen; si ninguno domina, equilibrio; si el triángulo
 * nunca tuvo evidencia suficiente, todo terreno. Los empates no se fuerzan.
 */
export function derivePlayStyle(input: PlayStyleInput): PlayStyle {
  if (input.equipo !== null && input.equipo >= TEAM_STYLE_MIN)
    return PLAY_STYLES['motor-del-equipo']
  if (input.aura !== null && input.aura >= AURA_STYLE_MIN)
    return PLAY_STYLES['aura-del-curso']
  if (!input.estiloEstablished) return PLAY_STYLES['todo-terreno']

  const ranked = [...ESTILO_AXES].sort(
    (left, right) => input.estilo[right] - input.estilo[left],
  )
  const first = ranked[0]
  const second = ranked[1]
  if (
    first !== undefined &&
    second !== undefined &&
    input.estilo[first] - input.estilo[second] >= ESTILO_LEAD_MARGIN
  )
    return PLAY_STYLES[AXIS_STYLE[first]]
  return PLAY_STYLES.equilibrio
}

export function playStyleOf(state: RunState): PlayStyle {
  return derivePlayStyle({
    estilo: state.career.estilo,
    estiloEstablished: isEstiloEstablished(state.career),
    equipo: state.career.equipo,
    aura: state.career.aura,
  })
}

// ---------------------------------------------------------------------------
// Hitos
// ---------------------------------------------------------------------------

export interface Achievement {
  readonly id: string
  readonly label: string
  readonly detail: string
  /** De dónde sale el hecho, para que nadie tenga que confiar en la etiqueta. */
  readonly source: 'milestone' | 'flag' | 'career'
}

const PROJECT_OUTCOME_FLAGS = [
  'y1.project.outcome',
  'y2.survey.outcome',
  'y3.projectTech.outcome',
  'y4.fundraiser.outcome',
  'y5.projectFinal.outcome',
] as const

function ordinaryQualities(
  state: RunState,
  stage: StageId,
): readonly SolutionQuality[] {
  return state.history.flatMap((entry) =>
    entry.stage === stage &&
    entry.challengeId !== undefined &&
    entry.recovery !== true &&
    entry.quality !== undefined
      ? [entry.quality]
      : [],
  )
}

/** Los años en los que todo beat ordinario salió Óptimo. */
export function perfectYears(state: RunState): readonly StageId[] {
  return STAGE_ORDER.filter((stage) => {
    const qualities = ordinaryQualities(state, stage)
    return (
      qualities.length > 0 &&
      qualities.every((quality) => quality === 'optimal')
    )
  })
}

function listYears(stages: readonly StageId[]): string {
  const numerals = stages.map(stageNumeral)
  if (numerals.length <= 1) return numerals.join('')
  return `${numerals.slice(0, -1).join(', ')} y ${numerals.at(-1) ?? ''}`
}

/**
 * Los hitos de una carrera, sólo los que un hecho registrado sostiene.
 *
 * Los del motor entran como están —son los que la carrera ya desbloqueó— y
 * dos de ellos se completan con detalle derivado del mismo estado (qué años
 * fueron redondos, qué evento raro apareció). Los de contenido salen de flags
 * que una Template escribió al evaluar; los de carrera, de una dimensión que
 * el motor estableció. Un hito que no esté acá no existe en el dominio, y no
 * se inventa: «Abanderado», «Escolta» y «Capitán» no son hechos de esta
 * edición.
 */
export function deriveAchievements(
  state: RunState,
  milestones: readonly Milestone[],
  memories: readonly CareerMemory[] = [],
): readonly Achievement[] {
  const achievements: Achievement[] = []

  const rareTitles = memories
    .filter((memory) => memory.kind === 'rare')
    .map((memory) => memory.title)

  for (const milestone of milestones) {
    if (milestone.id === 'milestone.perfect-year') {
      const years = perfectYears(state)
      achievements.push({
        id: milestone.id,
        label: milestone.label,
        detail:
          years.length === 0
            ? milestone.detail
            : `${years.length === 1 ? 'Un año entero' : 'Años enteros'} con todo Óptimo: ${listYears(years)}.`,
        source: 'milestone',
      })
      continue
    }
    if (milestone.id === 'milestone.saw-something-rare' && rareTitles.length) {
      achievements.push({
        id: milestone.id,
        label: milestone.label,
        detail: `Te tocó algo que no le pasa a todas las carreras: ${rareTitles.join(' · ')}.`,
        source: 'milestone',
      })
      continue
    }
    achievements.push({
      id: milestone.id,
      label: milestone.label,
      detail: milestone.detail,
      source: 'milestone',
    })
  }

  const flags = state.flags
  if (flags['g7.actoImpecable'] === true)
    achievements.push({
      id: 'flag.acto-impecable',
      label: 'Acto impecable',
      detail: 'La coreografía del 25 de Mayo salió sin un paso de más.',
      source: 'flag',
    })
  if (PROJECT_OUTCOME_FLAGS.some((flag) => flags[flag] === 'optimal'))
    achievements.push({
      id: 'flag.proyecto-redondo',
      label: 'Proyecto redondo',
      detail: 'Un año del Proyecto del Curso salió de la mejor manera posible.',
      source: 'flag',
    })
  if (flags['y1.project.everyone-participated'] === true)
    achievements.push({
      id: 'flag.todos-participaron',
      label: 'Todos participaron',
      detail: 'En la expo de 1.º nadie se quedó sin una parte.',
      source: 'flag',
    })

  if (state.career.aura !== null && state.career.aura >= AURA_STYLE_MIN)
    achievements.push({
      id: 'career.aura',
      label: 'El curso te recuerda',
      detail: 'Aura de +1.000 o más: un momento público que no se olvida.',
      source: 'career',
    })

  return achievements
}

// ---------------------------------------------------------------------------
// Recorrido por año
// ---------------------------------------------------------------------------

/** La espina narrativa aprobada (`narrative-system.md`). */
export const YEAR_THEME: Readonly<Record<StageId, string>> = {
  'grade-7': 'Adaptación',
  'year-1': 'Consolidación',
  'year-2': 'Pertenencia',
  'year-3': 'Autonomía',
  'year-4': 'Responsabilidad',
  'year-5': 'Cierre',
  graduation: 'Egreso',
}

export type YearMarker =
  'perfect' | 'review' | 'review-previa' | 'completed' | 'not-played'

export interface YearRecap {
  readonly stage: StageId
  readonly numeral: string
  readonly theme: string
  readonly played: boolean
  readonly marker: YearMarker
  /** Lo que ese año dejó escrito: el evento raro, la escena icónica o el Repaso. */
  readonly highlight: string | undefined
}

const MEMORY_PRIORITY: readonly CareerMemory['kind'][] = [
  'rare',
  'iconic',
  'recovery',
  'ordinary',
]

export const YEAR_MARKER_LABEL: Readonly<Record<YearMarker, string>> = {
  perfect: 'Todo Óptimo',
  review: 'Repaso cerrado',
  'review-previa': 'Repaso con lo justo',
  completed: 'Completado',
  'not-played': 'Sin jugar',
}

/**
 * El recorrido, un renglón por año.
 *
 * Todo sale del estado final: qué años se jugaron, en cuáles todo fue Óptimo,
 * cuáles necesitaron Repaso y qué escena vale la pena recordar. No hay copia
 * guardada de los cierres de año: se reconstruyen con la misma regla que los
 * mostró en su momento.
 */
export function deriveCareerRecap(
  state: RunState,
  memories: readonly CareerMemory[] = [],
): readonly YearRecap[] {
  const perfect = new Set(perfectYears(state))
  return STAGE_ORDER.filter((stage) => stage !== 'graduation').map((stage) => {
    const played = state.history.some((entry) => entry.stage === stage)
    const record = state.progression.history.find(
      (entry) => entry.stageId === stage,
    )
    const marker: YearMarker = !played
      ? 'not-played'
      : perfect.has(stage)
        ? 'perfect'
        : record === undefined
          ? 'completed'
          : record.previa
            ? 'review-previa'
            : 'review'
    const highlight = memories
      .filter((memory) => memory.stage === stage && memory.kind !== 'milestone')
      .sort(
        (left, right) =>
          MEMORY_PRIORITY.indexOf(left.kind) -
            MEMORY_PRIORITY.indexOf(right.kind) ||
          right.salienceRank - left.salienceRank ||
          left.id.localeCompare(right.id),
      )[0]?.title
    return {
      stage,
      numeral: stageNumeral(stage),
      theme: YEAR_THEME[stage],
      played,
      marker,
      highlight,
    }
  })
}

// ---------------------------------------------------------------------------
// Números de la carrera
// ---------------------------------------------------------------------------

export interface CareerNumbers {
  readonly promedio: number | null
  readonly equipo: number | null
  readonly aura: number | null
}

export function careerNumbersOf(state: RunState): CareerNumbers {
  return {
    promedio: promedio(state.career),
    equipo: state.career.equipo,
    aura: state.career.aura,
  }
}

// ---------------------------------------------------------------------------
// Posición competitiva
// ---------------------------------------------------------------------------

/** Lo que la portada sabía de este participante y del podio al emitir el intento. */
export interface PlacementSnapshot {
  readonly rank: number | undefined
  readonly bestFairScore: number | undefined
  /** El mejor puntaje del podio en ese momento; ausente si no había nadie. */
  readonly topScore: number | undefined
}

export type PersonalBestClaim = 'first' | 'improved' | 'not-best'

export interface CompetitivePlacement {
  readonly rank: number | undefined
  /**
   * Si el puesto está compartido. Sólo se sabe dentro del podio, donde el
   * servidor publica a todas las personas del puesto; afuera queda `undefined`
   * y la pantalla no afirma exclusividad.
   */
  readonly shared: boolean | undefined
  readonly podium: boolean
  readonly first: boolean
  /** Evidencia: esta partida es la mejor propia, ahora sos 1.º y antes no. */
  readonly newFirst: boolean
  /**
   * Evidencia: mejor propia, 1.º sin compartir, y el puntaje supera el mejor
   * del podio que existía al empezar el intento.
   */
  readonly record: boolean
  readonly personalBest: PersonalBestClaim
  readonly totalRanked: number
}

export function deriveCompetitivePlacement(
  result: VerifiedAttemptPayload,
  state: PublicCompetitionState,
  before?: PlacementSnapshot,
): CompetitivePlacement {
  const rank = state.you?.rank
  const podium = rank !== undefined && rank <= 3
  const shared = podium
    ? state.leaderboard.some(
        (entry) => entry.rank === rank && (entry.sharedCount ?? 0) > 0,
      ) || state.leaderboard.filter((entry) => entry.rank === rank).length > 1
    : undefined
  const first = rank === 1
  const personalBest: PersonalBestClaim = !result.personalBest
    ? 'not-best'
    : before?.bestFairScore === undefined
      ? 'first'
      : 'improved'
  const newFirst =
    first && result.personalBest && before !== undefined && before.rank !== 1
  const record =
    first &&
    shared === false &&
    result.personalBest &&
    before?.topScore !== undefined &&
    result.fairScore !== undefined &&
    result.fairScore > before.topScore
  return {
    rank,
    shared,
    podium,
    first,
    newFirst,
    record,
    personalBest,
    totalRanked: state.totalRanked,
  }
}

export interface PlacementCopy {
  /** La afirmación fuerte, si la evidencia la permite. */
  readonly claim: string | undefined
  /**
   * Sólo cuando no hay puesto que dibujar: el número grande y el claim ya
   * dicen todo lo demás, y repetirlo en prosa era ruido.
   */
  readonly rankLine: string | undefined
  readonly personalBest: string
}

function ordinal(rank: number): string {
  return `${String(rank)}.º`
}

export function placementCopy(placement: CompetitivePlacement): PlacementCopy {
  const rankLine =
    placement.rank === undefined
      ? 'No pudimos leer tu puesto. Está en el ranking.'
      : undefined
  const claim = placement.record
    ? 'Récord de la competencia: nadie había llegado a este puntaje.'
    : placement.newFirst && placement.shared === false
      ? 'Subiste al 1.º puesto.'
      : placement.first
        ? placement.shared === true
          ? 'Compartís el 1.º puesto.'
          : 'Estás 1.º.'
        : placement.podium
          ? placement.shared === true
            ? `Entraste al podio: compartís el ${ordinal(placement.rank ?? 0)} puesto.`
            : 'Entraste al podio.'
          : undefined
  const personalBest =
    placement.personalBest === 'improved'
      ? 'Nuevo mejor puntaje personal. Es el que cuenta en el ranking.'
      : placement.personalBest === 'first'
        ? 'Es tu mejor partida hasta ahora. Es la que cuenta en el ranking.'
        : 'No superó tu mejor partida: en el ranking sigue contando la anterior.'
  return { claim, rankLine, personalBest }
}
