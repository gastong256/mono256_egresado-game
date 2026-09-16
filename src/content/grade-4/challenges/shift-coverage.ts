/**
 * 4.º · Los turnos del evento (`y4.shift-coverage`).
 *
 * El evento escolar dura tres horas y hay dos puestos que no pueden quedar
 * vacíos. Cuatro personas se anotaron, cada una puede en algunas horas, y hay
 * que decidir quién está dónde y cuándo.
 *
 * Lo que decide la calidad es de tiempo, no de cantidad: que nadie se quede las
 * tres horas seguidas y que un puesto no cambie de manos todo el tiempo. Ahí
 * está la diferencia con el reparto de 1.º y con las actividades por turno de
 * 2.º: acá los bloques son consecutivos y lo que importa es cómo se encadenan.
 *
 * Equipo mide otra cosa, y sólo entre cronogramas que ya cierran: si todos
 * entraron, si a alguien le tocó dos veces lo que había dicho que no quería y
 * si la carga quedó pareja. Cubrir los turnos no compra ese crédito.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  metrics,
  ok,
  performanceFromRatio,
  toChallengeId,
  toScenarioFamilyId,
  type AgentAssignment,
  type InteractionAnswer,
  type SolutionQuality,
} from '@/game'
import {
  at,
  candidateAxes,
  digit,
  generatedSource,
  outcome,
  parameters,
  spaceOf,
  tierWitnessIssues,
} from '@/content/authoring'

export const BLOCKS = [
  { id: 'b1', label: '17 a 18' },
  { id: 'b2', label: '18 a 19' },
  { id: 'b3', label: '19 a 20' },
] as const
export const POSTS = [
  { id: 'puerta', label: 'Puerta' },
  { id: 'buffet', label: 'Buffet' },
] as const
export const CREW = [
  { id: 'ana', label: 'Ana' },
  { id: 'beni', label: 'Beni' },
  { id: 'caro', label: 'Caro' },
  { id: 'dylan', label: 'Dylan' },
] as const

/** Un turno es un puesto en un bloque: ahí entra el tiempo. */
export const SHIFTS = POSTS.flatMap((post) =>
  BLOCKS.map((block) => ({
    id: `${post.id}-${block.id}`,
    postId: post.id,
    blockId: block.id,
  })),
)

const availability = z.tuple([z.boolean(), z.boolean(), z.boolean()])
const member = z.strictObject({
  /** En qué bloques puede estar. */
  available: availability,
  /** El puesto que preferiría no hacer. No cambia si el cronograma cierra. */
  avoids: z.enum(['puerta', 'buffet']),
})
export const shiftSchema = z
  .strictObject({
    shape: z.enum(['llega-tarde', 'se-va-temprano', 'todos-parciales']),
    crew: z.tuple([member, member, member, member]),
  })
  .refine(
    (p) =>
      p.crew.every((entry) => entry.available.some(Boolean)) &&
      BLOCKS.every(
        (_, block) =>
          p.crew.filter((entry) => entry.available[block] === true).length >=
          POSTS.length,
      ),
    'un bloque no tiene gente suficiente',
  )
export type ShiftParams = z.infer<typeof shiftSchema>

const blockIndex = (blockId: string): number =>
  BLOCKS.findIndex((block) => block.id === blockId)
const crewIndex = (agentId: string): number =>
  CREW.findIndex((person) => person.id === agentId)

export interface ShiftOutcome {
  readonly quality: SolutionQuality
  /** Acuerdos del grupo cumplidos, 0 a 3. Sólo entre cronogramas que cierran. */
  readonly team: number
  /** Cuántas veces un puesto cambia de manos entre bloques consecutivos. */
  readonly handovers: number
  /** El puesto que más cambió de manos. */
  readonly worstPost: number
  /** Si alguien se quedó los tres bloques. */
  readonly noRest: boolean
}

/**
 * La lectura completa de un cronograma, con su propia aritmética.
 *
 * Math primero y solo: cobertura, disponibilidad y que nadie esté en dos
 * puestos a la vez; después, el descanso y los relevos, que son hechos del
 * tiempo y no del grupo. Equipo se lee al final y nunca cambia la calidad.
 */
export function readShifts(
  p: ShiftParams,
  assignments: readonly AgentAssignment[],
): ShiftOutcome {
  const taken = new Map<string, string>()
  for (const entry of assignments) taken.set(entry.taskId, entry.agentId)

  const missing = SHIFTS.filter(
    (shift) => taken.get(shift.id) === undefined,
  ).length
  let clash = false
  let unavailable = false
  const loadByPerson = CREW.map(() => 0)
  const blocksByPerson = CREW.map(() => new Set<number>())
  for (const shift of SHIFTS) {
    const agentId = taken.get(shift.id)
    if (agentId === undefined) continue
    const person = crewIndex(agentId)
    if (person < 0) continue
    const block = blockIndex(shift.blockId)
    if (blocksByPerson[person]?.has(block) === true) clash = true
    blocksByPerson[person]?.add(block)
    loadByPerson[person] = (loadByPerson[person] ?? 0) + 1
    if (p.crew[person]?.available[block] !== true) unavailable = true
  }

  // Relevos: un puesto que cambia de manos entre dos bloques seguidos. Se
  // cuentan por puesto porque lo que se siente es que *un* puesto no pare de
  // cambiar, no el total del evento.
  const handoversByPost = POSTS.map((post) => {
    let changes = 0
    for (let block = 1; block < BLOCKS.length; block++) {
      const before = taken.get(`${post.id}-${BLOCKS[block - 1]?.id ?? ''}`)
      const now = taken.get(`${post.id}-${BLOCKS[block]?.id ?? ''}`)
      if (before !== undefined && now !== undefined && before !== now)
        changes += 1
    }
    return changes
  })
  const handovers = handoversByPost.reduce((total, value) => total + value, 0)
  const worstPost = Math.max(...handoversByPost)
  const noRest = blocksByPerson.some((blocks) => blocks.size >= BLOCKS.length)

  // Escalera escrita: el evento cierra, después descansa la gente y después
  // ningún puesto cambia de manos más de una vez. Que cada puesto cambie al
  // menos una vez es inevitable —quedarse las tres horas es no descansar—, así
  // que lo que se pide es que no cambie dos.
  const quality: SolutionQuality =
    missing > 0 || clash || unavailable
      ? 'invalid'
      : noRest
        ? 'functional'
        : worstPost > 1
          ? 'efficient'
          : 'optimal'

  const everyone = loadByPerson.every((load) => load > 0)
  const disliked = CREW.filter((person, index) => {
    const avoided = p.crew[index]?.avoids
    return (
      SHIFTS.filter(
        (shift) =>
          taken.get(shift.id) === person.id && shift.postId === avoided,
      ).length >= 2
    )
  }).length
  const even = Math.max(...loadByPerson) - Math.min(...loadByPerson) <= 1
  const team =
    quality === 'invalid'
      ? 0
      : [everyone, disliked === 0, even].filter(Boolean).length

  return { quality, team, handovers, worstPost, noRest }
}

export interface ShiftPlan {
  readonly assignments: readonly AgentAssignment[]
  readonly quality: SolutionQuality
  readonly team: number
}

/**
 * Oráculo independiente sobre todos los cronogramas posibles.
 *
 * Cada turno lo toma una de las cuatro personas o nadie: 5^6 combinaciones, que
 * se enumeran enteras. Nunca llama al evaluador.
 */
export function shiftPlans(p: ShiftParams): readonly ShiftPlan[] {
  const options = [undefined, ...CREW.map((person) => person.id)]
  const plans: ShiftPlan[] = []
  const total = options.length ** SHIFTS.length
  for (let mask = 0; mask < total; mask++) {
    let rest = mask
    const assignments: AgentAssignment[] = []
    for (const shift of SHIFTS) {
      const agentId = options[rest % options.length]
      rest = Math.floor(rest / options.length)
      if (agentId !== undefined) assignments.push({ agentId, taskId: shift.id })
    }
    const read = readShifts(p, assignments)
    plans.push({ assignments, quality: read.quality, team: read.team })
  }
  return plans
}

const SHAPES = ['llega-tarde', 'se-va-temprano', 'todos-parciales'] as const
const WINDOWS = [
  [
    [true, true, true],
    [false, true, true],
    [true, true, false],
    [true, false, true],
  ],
  [
    [true, true, false],
    [true, true, true],
    [false, true, true],
    [true, true, true],
  ],
  [
    [false, true, true],
    [true, true, false],
    [true, true, true],
    [true, true, true],
  ],
  [
    [true, false, true],
    [true, true, true],
    [true, true, true],
    [false, true, true],
  ],
  [
    [true, true, true],
    [true, false, true],
    [false, true, true],
    [true, true, false],
  ],
  [
    [false, true, true],
    [true, true, true],
    [true, false, true],
    [true, true, true],
  ],
] as const
const AVOIDS = [
  ['puerta', 'buffet', 'puerta', 'buffet'],
  ['buffet', 'buffet', 'puerta', 'puerta'],
  ['puerta', 'puerta', 'buffet', 'buffet'],
  ['buffet', 'puerta', 'puerta', 'buffet'],
] as const
const RADICES = [SHAPES.length, WINDOWS.length, AVOIDS.length, 2]
export const SHIFT_SPACE = spaceOf(RADICES)

export function generateShifts(index: number): ShiftParams {
  const axes = candidateAxes(index, RADICES, 19)
  const shape = at(SHAPES, digit(axes, 0))
  const windows = at(WINDOWS, digit(axes, 1))
  const avoids = at(AVOIDS, digit(axes, 2))
  const swap = digit(axes, 3)
  return shiftSchema.parse({
    shape,
    crew: CREW.map((_, position) => {
      const window = windows[(position + swap) % windows.length] ?? [
        true,
        true,
        true,
      ]
      // Cada forma tiene su propia firma: alguien que llega para el segundo
      // bloque, alguien que se va antes del último, o disponibilidades
      // parciales repartidas. La forma no se muestra, así que dos formas que
      // produjeran la misma tabla serían la misma situación dos veces.
      const shaped =
        shape === 'llega-tarde' && position === 0
          ? [false, true, true]
          : shape === 'se-va-temprano' && position === 1
            ? [true, true, false]
            : [...window]
      return { available: shaped, avoids: avoids[position] ?? 'puerta' }
    }),
  })
}

export function shiftGates(p: ShiftParams): readonly string[] {
  const issues: string[] = []
  const plans = shiftPlans(p)
  issues.push(...tierWitnessIssues(plans))

  const valid = plans.filter((plan) => plan.quality !== 'invalid')
  if (valid.length === 0) issues.push('ningún cronograma cierra')

  // LOCKED: varias soluciones Math-valid con consecuencias distintas de Equipo.
  const teamsAmongOptimal = new Set(
    plans.filter((plan) => plan.quality === 'optimal').map((plan) => plan.team),
  )
  if (teamsAmongOptimal.size < 2)
    issues.push('todos los cronogramas óptimos dejan el mismo Equipo')
  if (!valid.some((plan) => plan.team === 3))
    issues.push('ningún cronograma válido cumple los tres acuerdos')
  // Witness del máximo competitivo: tiene que existir una respuesta que sea
  // Math óptima **y** deje el Equipo máximo. Sin eso, una carrera que sacara
  // esta variante no podría llegar al tope de FairScore por más que jugara
  // perfecto, y dos carreras tendrían techos distintos.
  if (!plans.some((plan) => plan.quality === 'optimal' && plan.team === 3))
    issues.push('ninguna respuesta óptima deja el Equipo máximo')
  if (!valid.some((plan) => plan.team <= 1))
    issues.push('ningún cronograma válido descuida los acuerdos')

  // La disponibilidad tiene que apretar de verdad.
  if (!p.crew.some((entry) => entry.available.includes(false)))
    issues.push('todos pueden en todos los bloques')
  return issues
}

export function evaluateShifts(
  p: ShiftParams,
  assignments: readonly AgentAssignment[],
) {
  if (
    new Set(assignments.map((entry) => entry.taskId)).size !==
      assignments.length ||
    assignments.some(
      (entry) =>
        !SHIFTS.some((shift) => shift.id === entry.taskId) ||
        !CREW.some((person) => person.id === entry.agentId),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'turno repetido o fuera de contrato',
    })

  const read = readShifts(p, assignments)
  const taken = new Map(
    assignments.map((entry) => [entry.taskId, entry.agentId]),
  )
  const nameOf = (id: string | undefined) =>
    CREW.find((person) => person.id === id)?.label ?? 'nadie'
  const empty = SHIFTS.find((shift) => taken.get(shift.id) === undefined)

  const base = outcome(
    read.quality,
    {
      outcomeKey: `shift-coverage.${p.shape}.${read.quality}`,
      stamp: read.quality === 'invalid' ? 'Descubierto' : 'Cubierto',
      facts: [
        ...POSTS.map((post) => ({
          label: post.label,
          value: BLOCKS.map((block) =>
            nameOf(taken.get(`${post.id}-${block.id}`)),
          ).join(' · '),
        })),
        { label: 'Relevos', value: String(read.handovers) },
        { label: 'Acuerdos del grupo', value: `${String(read.team)} de 3` },
      ],
      ...(read.quality === 'invalid'
        ? {
            violatedConstraint:
              empty !== undefined
                ? `El ${POSTS.find((post) => post.id === empty.postId)?.label ?? ''} queda vacío de ${BLOCKS.find((block) => block.id === empty.blockId)?.label ?? ''}.`
                : 'Alguien quedó en dos puestos a la misma hora o en una hora en la que no está.',
          }
        : {}),
      consequence:
        read.quality === 'invalid'
          ? 'Con ese cronograma el evento arranca con un puesto sin nadie.'
          : read.quality === 'functional'
            ? 'Cierra, pero alguien se queda las tres horas sin parar.'
            : read.quality === 'efficient'
              ? 'Cierra y todos descansan, aunque los puestos cambian de manos seguido.'
              : 'Cierra, todos descansan y cada puesto casi no cambia de manos.',
    },
    {},
    [{ flag: 'y4.shifts.outcome', value: read.quality }],
  )
  return ok({
    ...base,
    metrics: metrics({ ...base.metrics, efficiency: read.team / 3 }),
    careerEffects: {
      ...base.careerEffects,
      ...(read.quality === 'invalid' ? {} : { equipo: read.team - 1 }),
    },
  })
}

export const shiftVariants = generatedSource({
  id: 'y4.shift-coverage.blocks',
  version: '1',
  schema: shiftSchema,
  size: SHIFT_SPACE,
  generate: generateShifts,
  gates: shiftGates,
})

export const shiftCoverage = defineChallenge<ShiftParams, ShiftParams>({
  id: toChallengeId('y4.shift-coverage'),
  family: toScenarioFamilyId('evento-escolar'),
  placement: 'checkpoint',
  variants: authoredVariantIds(shiftVariants.authored),
  variantSource: shiftVariants,
  interaction: 'assignment-board',
  stages: ['year-4'],
  categories: ['time-and-rates', 'optimization-and-constraints'],
  baseDifficulty: 2,
  // Una relación encadenada —quién puede cuándo— y dos restricciones a la vez,
  // con la respuesta construida: carga 4, que `bandOf` lee como CORE.
  cognitive: {
    steps: 1,
    constraints: 2,
    selection: 0,
    optimization: 0,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'ALLOCATION',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'QUICK',
    chronology: 30,
    eventCluster: 'evento-escolar',
  },
  scoring: {
    math: 'discrete-quality',
    team: ({ metrics: evidence }) => performanceFromRatio(evidence.efficiency),
    aura: 'none',
    rationale:
      'Math mide que el evento quede cubierto: disponibilidad, nadie en dos puestos a la vez, descanso y relevos. Equipo mide los acuerdos del grupo entre cronogramas que ya cierran, así que cubrir los turnos no compra el crédito social.',
  },
  tools: ['notepad'],
  generate: ({ params }) => parameters(shiftSchema, params),
  verify: (p) =>
    p.crew.some((entry) => entry.available.includes(false))
      ? []
      : ['todos pueden en todos los bloques'],
  narrate: () => ({
    title: 'Los turnos del evento',
    setup:
      'El evento dura tres horas y la puerta y el buffet no pueden quedar sin nadie.',
    goal: 'Armá los turnos: que no falte nadie, que todos descansen y que los puestos no cambien de manos todo el tiempo.',
  }),
  present: (p) => ({
    kind: 'assignment-board',
    agents: CREW.map((person, index) => {
      const data = p.crew[index]
      const hours = BLOCKS.filter((_, block) => data?.available[block] === true)
        .map((block) => block.label)
        .join(' y ')
      const avoided =
        POSTS.find((post) => post.id === data?.avoids)?.label ?? ''
      return {
        id: person.id,
        label: person.label,
        detail: `puede ${hours || 'en ningún bloque'} · preferiría no hacer ${avoided}`,
      }
    }),
    tasks: SHIFTS.map((shift) => {
      const post = POSTS.find((entry) => entry.id === shift.postId)
      const block = BLOCKS.find((entry) => entry.id === shift.blockId)
      return {
        id: shift.id,
        label: `${post?.label ?? ''} · ${block?.label ?? ''}`,
        detail: 'no puede quedar vacío',
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'assignment-board'
      ? evaluateShifts(p, answer.assignments)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un cronograma de turnos',
        }),
})
