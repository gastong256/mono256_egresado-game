/**
 * Modelo de ritmo de una run, para el cierre de ingeniería de STAGE-08.
 *
 * El objetivo de producto es una run estándar de **4 a 7 minutos**
 * (`docs/00-product/product-vision.md`). Hasta acá nadie lo había medido: el
 * exit gate de STAGE-08 lo pide y la validación con jugadores reales está
 * diferida a un gate humano posterior.
 *
 * Esto **no** es evidencia humana. Es un proxy de ingeniería: cuenta lo que la
 * pantalla realmente imprime en una carrera determinista y lo convierte en
 * segundos con constantes declaradas. Sirve para detectar inflación sistémica
 * de ritmo y para comparar formas de run entre sí, no para afirmar cuánto tarda
 * una persona. Las constantes están acá, con su razón, y se pueden cambiar sin
 * tocar nada del dominio.
 *
 * Nada de este módulo entra al motor ni al juego: es instrumentación de
 * auditoría, como la auditoría ciega de estrategias.
 */
import type { InteractionPresentation, PublicChallengeView } from '@/game'

/**
 * Clases de esfuerzo de una pantalla.
 *
 * Separan **leer** de **decidir**: dos beats con el mismo texto no cuestan lo
 * mismo si uno se contesta eligiendo entre cuatro opciones y el otro armando
 * un plano. El orden es de menor a mayor costo de decisión.
 */
export const EFFORT_CLASSES = [
  'SIMPLE_DECISION',
  'NUMERIC_ENTRY',
  'GRID_CLASSIFICATION',
  'ALLOCATION',
  'ASSIGNMENT',
  'ROUTE',
  'SCHEDULE',
  'SPATIAL',
] as const
export type EffortClass = (typeof EFFORT_CLASSES)[number]

/**
 * Supuestos del modelo, todos discutibles y todos explícitos.
 *
 * `wordsPerMinute` es lectura cuidadosa de una consigna, no lectura recreativa:
 * un lector de secundaria que está por decidir algo relee. Los segundos por
 * clase son estimaciones de ingeniería sobre cuánto lleva **operar** el
 * control, ya descontado el tiempo de leer, que se cuenta aparte por palabras.
 */
export interface PacingAssumptions {
  /** Prosa: consigna, situación, consecuencia. Se lee de corrido. */
  readonly wordsPerMinute: number
  /**
   * Contenido estructurado: filas de datos, etiquetas de opción, hechos del
   * resultado.
   *
   * No se lee de corrido, se consulta mientras se decide: el jugador barre la
   * tabla buscando el número que necesita y vuelve. Medirlo al ritmo de la
   * prosa infla la estimación, porque además parte de esa consulta ya está
   * contada dentro de los segundos de decisión de cada clase.
   */
  readonly scannedWordsPerMinute: number
  /** Segundos de decisión y manipulación, por clase, sin contar lectura. */
  readonly decisionSeconds: Readonly<Record<EffortClass, number>>
  /** Costo fijo de pasar de una pantalla a la siguiente. */
  readonly transitionSeconds: number
  /** Acusar recibo de un resultado: leerlo se cuenta por palabras. */
  readonly acknowledgeSeconds: number
  /** Arranque: elegir nombre y entender el loop. */
  readonly onboardingSeconds: number
}

export const DEFAULT_ASSUMPTIONS: PacingAssumptions = {
  wordsPerMinute: 150,
  scannedWordsPerMinute: 300,
  decisionSeconds: {
    SIMPLE_DECISION: 8,
    NUMERIC_ENTRY: 12,
    GRID_CLASSIFICATION: 18,
    ALLOCATION: 24,
    ASSIGNMENT: 24,
    ROUTE: 24,
    SCHEDULE: 28,
    SPATIAL: 28,
  },
  transitionSeconds: 1.5,
  acknowledgeSeconds: 1,
  onboardingSeconds: 20,
}

/** A qué clase de esfuerzo pertenece cada motor de interacción presentado. */
export function effortClassOf(
  kind: InteractionPresentation['kind'],
): EffortClass {
  switch (kind) {
    case 'numeric-input':
      return 'NUMERIC_ENTRY'
    case 'quantity-builder':
    case 'budget-builder':
      return 'ALLOCATION'
    case 'schedule-builder':
      return 'SCHEDULE'
    case 'spatial-layout':
      return 'SPATIAL'
    case 'assignment-board':
      return 'ASSIGNMENT'
    case 'route-builder':
      return 'ROUTE'
    case 'classification':
    case 'number-grid':
      return 'GRID_CLASSIFICATION'
    default:
      return 'SIMPLE_DECISION'
  }
}

/** Palabras de un texto, contando como palabra cualquier racimo no vacío. */
export function words(text: string | undefined): number {
  if (text === undefined) return 0
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/u).length
}

/** Lo que la pantalla imprime, separado en prosa y en contenido consultado. */
export function presentationWords(view: InteractionPresentation): {
  readonly prose: number
  readonly structured: number
} {
  // `InteractionPresentation` es una unión de once formas con listas distintas
  // —`options`, `items`, `agents`, `activities`…—. Contar palabras no depende de
  // cuál sea: recorre las que existan. Tipar once ramas para sumar lo mismo en
  // todas agregaría ruido sin agregar seguridad, y esto es instrumentación de
  // auditoría, no código de producto.
  const record = view as unknown as Record<string, unknown>
  const prose = words(record['instructions'] as string | undefined)
  let structured = 0
  const lists = [
    'data',
    'items',
    'options',
    'agents',
    'tasks',
    'objects',
    'activities',
    'statements',
    'labels',
    'points',
    'rounds',
    'available',
    'revealed',
  ]
  for (const key of lists) {
    const list = record[key]
    if (!Array.isArray(list)) continue
    for (const entry of list as readonly Record<string, unknown>[]) {
      if (entry === null || typeof entry !== 'object') continue
      for (const field of [
        'label',
        'detail',
        'value',
        'unit',
        'cue',
        'ruleLabel',
        'text',
      ]) {
        structured += words(entry[field] as string | undefined)
      }
    }
  }
  return { prose, structured }
}

/** Lo que el jugador lee de la escena antes de que aparezca el control. */
export function narrativeWords(view: PublicChallengeView): number {
  const rare = view.rareNote
  return (
    words(view.narrative.title) +
    words(view.narrative.setup) +
    words(view.narrative.goal) +
    (rare === undefined ? 0 : words(rare.title) + words(rare.text))
  )
}

/** Un beat medido: qué se leyó, qué se operó y cuánto costó. */
export interface BeatCost {
  readonly templateId: string
  readonly effort: EffortClass
  /** Palabras que se leen de corrido. */
  readonly prose: number
  /** Palabras que se consultan: tablas, etiquetas, hechos. */
  readonly structured: number
  readonly recovery: boolean
  readonly seconds: number
}

export function beatSeconds(
  beat: Omit<BeatCost, 'seconds'>,
  assumptions: PacingAssumptions = DEFAULT_ASSUMPTIONS,
): number {
  const reading =
    beat.prose * (60 / assumptions.wordsPerMinute) +
    beat.structured * (60 / assumptions.scannedWordsPerMinute)
  return (
    reading +
    assumptions.decisionSeconds[beat.effort] +
    assumptions.transitionSeconds +
    assumptions.acknowledgeSeconds
  )
}

export interface RunPacing {
  readonly beats: readonly BeatCost[]
  readonly screens: number
  readonly words: number
  readonly recoveries: number
  readonly seconds: number
  readonly minutes: number
  readonly byEffort: Readonly<Record<EffortClass, number>>
}

export function summarize(
  beats: readonly BeatCost[],
  narrativeScreens: number,
  assumptions: PacingAssumptions = DEFAULT_ASSUMPTIONS,
): RunPacing {
  const byEffort = Object.fromEntries(
    EFFORT_CLASSES.map((effort) => [effort, 0]),
  ) as Record<EffortClass, number>
  let seconds = assumptions.onboardingSeconds
  let totalWords = 0
  for (const beat of beats) {
    byEffort[beat.effort] += 1
    seconds += beat.seconds
    totalWords += beat.prose + beat.structured
  }
  // Las pantallas narrativas —transiciones de año, hitos, epílogo— no tienen
  // control que operar, pero se leen y se pasan.
  seconds +=
    narrativeScreens *
    (assumptions.transitionSeconds + assumptions.acknowledgeSeconds)
  return {
    beats,
    screens: beats.length + narrativeScreens,
    words: totalWords,
    recoveries: beats.filter((beat) => beat.recovery).length,
    seconds,
    minutes: seconds / 60,
    byEffort,
  }
}
