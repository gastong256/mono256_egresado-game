/**
 * Career Epilogue v1.
 *
 * Una síntesis, no un volcado. Lo que el epílogo arma es **datos** —secciones y
 * recuerdos elegidos— y no prosa generada: el texto que se muestra está
 * autorado o sale de lo que la carrera ya escribió (el título de una escena, la
 * nota de un evento raro, la etiqueta de un hito). No hay LLM en runtime y no
 * puede haberlo: mismos hechos de carrera, mismo epílogo.
 *
 * El epílogo no toca el score. Se calcula sobre una carrera terminada y sólo
 * lee.
 *
 * ## Saliencia v1
 *
 * Tres recuerdos obligatorios por tramo —uno temprano de 7.º a 2.º, uno medio
 * de 3.º o 4.º, uno final de 5.º— y hasta dos extras de rareza o hito, sin
 * repetir. Dentro de cada tramo manda la clase del recuerdo: evento raro →
 * hito → Repaso que dejó algo → evento icónico del año → evento ordinario. Los
 * empates los rompe la prioridad editorial y, después, el id: nunca el orden en
 * el que algo entró a una lista.
 */
import type { StageId } from '../progression/stages'
import { stageIndex } from '../progression/stages'
import type { RunState } from '../runs/state'
import type { Storylet } from './storylet'
import type { RareEventDefinition } from './rare-events'
import type { Milestone } from './milestones'
import type { EstiloAxis } from '../progression/career'
import { isEstiloEstablished, promedio } from '../progression/career'

/** Las clases de recuerdo, de la que más pesa a la que menos. */
export const MEMORY_KINDS = [
  'rare',
  'milestone',
  'recovery',
  'iconic',
  'ordinary',
] as const
export type MemoryKind = (typeof MEMORY_KINDS)[number]

export interface CareerMemory {
  readonly id: string
  readonly stage: StageId
  readonly kind: MemoryKind
  readonly title: string
  readonly text: string
  /** Prioridad editorial. Sólo desempata; no cambia la clase. */
  readonly salienceRank: number
}

export type MemorySegment = 'early' | 'middle' | 'final'

const SEGMENTS: Readonly<Record<MemorySegment, readonly StageId[]>> = {
  early: ['grade-7', 'year-1', 'year-2'],
  middle: ['year-3', 'year-4'],
  final: ['year-5'],
}

function segmentOf(stage: StageId): MemorySegment | undefined {
  if (SEGMENTS.early.includes(stage)) return 'early'
  if (SEGMENTS.middle.includes(stage)) return 'middle'
  if (SEGMENTS.final.includes(stage)) return 'final'
  return undefined
}

function better(left: CareerMemory, right: CareerMemory): number {
  const kind =
    MEMORY_KINDS.indexOf(left.kind) - MEMORY_KINDS.indexOf(right.kind)
  if (kind !== 0) return kind
  if (left.salienceRank !== right.salienceRank)
    return right.salienceRank - left.salienceRank
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0
}

/**
 * Todo lo que una carrera terminada puede recordar.
 *
 * Sale de lo que ya está escrito: las escenas que se jugaron, los Repasos que
 * cerraron algo, los eventos raros que aparecieron y los hitos desbloqueados.
 * Nada se inventa acá.
 */
export function careerMemories(input: {
  readonly state: RunState
  readonly storylets: readonly Storylet[]
  readonly rareEvents: readonly RareEventDefinition[]
  readonly milestones: readonly Milestone[]
  /** Escenas icónicas del año: el acto, el Intercurso, el egreso. */
  readonly iconicStorylets: readonly string[]
}): readonly CareerMemory[] {
  const memories: CareerMemory[] = []
  const storyletById = new Map(
    input.storylets.map((storylet) => [String(storylet.id), storylet]),
  )

  for (const entry of input.state.history) {
    const storylet = storyletById.get(String(entry.storyletId))
    if (storylet === undefined) continue
    if (entry.challengeId === undefined) continue
    const iconic = input.iconicStorylets.includes(String(storylet.id))
    memories.push({
      id: `scene:${String(storylet.id)}`,
      stage: entry.stage,
      kind:
        entry.recovery === true ? 'recovery' : iconic ? 'iconic' : 'ordinary',
      title: storylet.title,
      text: storylet.eyebrow,
      salienceRank: iconic ? 50 : 10,
    })
  }

  for (const occurrence of input.state.rare) {
    const definition = input.rareEvents.find(
      (entry) => entry.id === occurrence.id,
    )
    if (definition === undefined) continue
    memories.push({
      id: `rare:${definition.id}`,
      stage: occurrence.stage,
      kind: 'rare',
      title: definition.note.title,
      text: definition.note.text,
      salienceRank: definition.salienceRank,
    })
  }

  for (const milestone of input.milestones) {
    // Un hito no es un momento: es algo que se lee del recorrido entero. Por
    // eso entra como extra y no compite por el recuerdo de un tramo, que tiene
    // que ser algo que pasó ahí. Se lo ancla en el último año para ordenarlo.
    memories.push({
      id: `milestone:${milestone.id}`,
      stage: 'year-5',
      kind: 'milestone',
      title: milestone.label,
      text: milestone.detail,
      salienceRank: 30,
    })
  }

  return memories.sort((left, right) =>
    stageIndex(left.stage) !== stageIndex(right.stage)
      ? stageIndex(left.stage) - stageIndex(right.stage)
      : better(left, right),
  )
}

/**
 * Los tres a cinco recuerdos del cierre.
 *
 * Los tramos primero —uno de cada uno, con el ordinario como piso, así que el
 * mínimo no depende de que haya habido rareza ni Proyecto— y después hasta dos
 * extras de rareza o hito. Si un tramo no tiene nada, se devuelve lo que hay:
 * el epílogo de una carrera corta es más corto, no inventado.
 */
export function selectSalientMemories(
  memories: readonly CareerMemory[],
): readonly CareerMemory[] {
  const chosen: CareerMemory[] = []
  for (const segment of ['early', 'middle', 'final'] as const) {
    const best = memories
      .filter(
        (memory) =>
          segmentOf(memory.stage) === segment && memory.kind !== 'milestone',
      )
      .sort(better)[0]
    if (best !== undefined) chosen.push(best)
  }

  const extras = memories
    .filter(
      (memory) =>
        (memory.kind === 'rare' || memory.kind === 'milestone') &&
        !chosen.some((entry) => entry.id === memory.id),
    )
    .sort(better)
    .slice(0, 2)

  // Primero el recorrido, en orden: temprano, medio, final. Después los
  // extras. Reordenar todo junto pondría un hito de carrera antes del año que
  // lo produjo, que es exactamente al revés de como se lee un cierre.
  return [
    ...[...chosen].sort(
      (left, right) => stageIndex(left.stage) - stageIndex(right.stage),
    ),
    ...extras,
  ]
}

/** El perfil narrativo: dos a cuatro líneas, sin jerarquía moral. */
export function narrativeProfile(state: RunState): readonly string[] {
  const lines: string[] = []
  const estilo = state.career.estilo
  const axes: readonly EstiloAxis[] = ['aplicado', 'estratega', 'improvisador']
  const top = [...axes].sort((left, right) => estilo[right] - estilo[left])
  const first = top[0]
  const second = top[1]
  if (!isEstiloEstablished(state.career)) {
    lines.push(
      'No hay una sola forma en la que resolvés las cosas: fuiste cambiando según lo que tenías delante.',
    )
  } else if (
    first !== undefined &&
    second !== undefined &&
    estilo[first] - estilo[second] <= 10
  ) {
    lines.push(
      `Resolvés entre dos maneras, ${first} y ${second}, y el año decidía cuál.`,
    )
  } else if (first !== undefined) {
    lines.push(
      first === 'aplicado'
        ? 'Lo tuyo fue hacer las cosas cuando había que hacerlas.'
        : first === 'estratega'
          ? 'Lo tuyo fue mirar dónde convenía poner el esfuerzo.'
          : 'Lo tuyo fue arreglarlo sobre la marcha, y muchas veces salió.',
    )
  }

  const equipo = state.career.equipo
  const aura = state.career.aura
  if (equipo !== null && equipo >= 60)
    lines.push('El curso contaba con vos cuando había que repartir algo.')
  else if (aura !== null && aura >= 60)
    lines.push('Cuando el curso tuvo que decir algo, tu voz estuvo ahí.')
  else if (equipo !== null || aura !== null)
    lines.push(
      'Tu recorrido pasó más por lo que resolviste que por lo que se vio.',
    )

  const average = promedio(state.career)
  lines.push(
    average === null
      ? 'Terminás el colegio. Eso ya es un hecho.'
      : 'Terminás el colegio con un recorrido que es tuyo y de nadie más.',
  )
  return lines.slice(0, 4)
}

export interface CareerEpilogue {
  /** Siempre, y primero: ningún desempeño lo reemplaza por un fracaso. */
  readonly graduated: boolean
  readonly profile: readonly string[]
  readonly memories: readonly CareerMemory[]
  readonly career: {
    readonly promedio: number | null
    readonly equipo: number | null
    readonly aura: number | null
    readonly estilo: Readonly<Record<EstiloAxis, number>>
    readonly estiloEstablished: boolean
  }
  readonly milestones: readonly Milestone[]
  readonly prestige: number | undefined
  /** En práctica no hay puesto: el cierre es personal. */
  readonly mode: 'practice' | 'fair' | 'standard'
}

/** El epílogo de una carrera terminada. Puro: sólo lee. */
export function buildEpilogue(input: {
  readonly state: RunState
  readonly storylets: readonly Storylet[]
  readonly rareEvents: readonly RareEventDefinition[]
  readonly milestones: readonly Milestone[]
  readonly iconicStorylets: readonly string[]
  readonly prestige?: number
}): CareerEpilogue {
  const memories = selectSalientMemories(
    careerMemories({
      state: input.state,
      storylets: input.storylets,
      rareEvents: input.rareEvents,
      milestones: input.milestones,
      iconicStorylets: input.iconicStorylets,
    }),
  )
  return {
    graduated: input.state.completion?.graduated === true,
    profile: narrativeProfile(input.state),
    memories,
    career: {
      promedio: promedio(input.state.career),
      equipo: input.state.career.equipo,
      aura: input.state.career.aura,
      estilo: input.state.career.estilo,
      estiloEstablished: isEstiloEstablished(input.state.career),
    },
    milestones: input.milestones,
    prestige: input.prestige,
    mode: input.state.descriptor.mode,
  }
}
