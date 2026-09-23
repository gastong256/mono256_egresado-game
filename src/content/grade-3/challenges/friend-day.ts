/**
 * 3.º · El Día del Amigo (`y3.friend-day`).
 *
 * Cuatro personas que no están todas a la misma hora, dos lugares con un viaje
 * en el medio y una tarde que tiene un principio y un final. Hay que decidir a
 * qué hora empieza cada cosa.
 *
 * No es la agenda de 1.º. Allá una sola persona encadenaba bloques contra un
 * límite fijo; acá las ventanas son de **otras personas**: un bloque no se
 * puede hacer si quien tiene que estar todavía no llegó o ya se fue. Esa es la
 * factibilidad, y es toda la matemática que puntúa.
 *
 * Equipo mide otra cosa, y se lee sólo entre planes que ya cierran: si a cada
 * quien le tocó estar en algo, si lo que cada uno quería hacer pasó mientras
 * estaba, y si alguien se quedó esperando un rato largo al pedo. Un plan
 * impecable puede dejar a alguien mirando el teléfono una hora, y no cobra dos
 * veces por eso.
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
  type EstiloAxis,
  type InteractionAnswer,
  type SchedulePlacement,
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
  styleGateIssues,
  tierWitnessIssues,
  type StyledPlan,
} from '@/content/authoring'
import { graded } from '../../grades'

export const FRIENDS = [
  { id: 'ale', label: 'Ale' },
  { id: 'bruno', label: 'Bruno' },
  { id: 'cami', label: 'Cami' },
  { id: 'dante', label: 'Dante' },
] as const
export type FriendId = (typeof FRIENDS)[number]['id']

export const PLACE_LABEL = { casa: 'Casa de Ale', club: 'Club' } as const
export type Place = keyof typeof PLACE_LABEL

/** La tarde: de las tres a las nueve, que es cuando hay que estar en casa. */
export const DAY = { from: 900, to: 1260 } as const
const STEP = 30

export const BLOCKS = [
  {
    id: 'merienda',
    label: 'La merienda',
    place: 'casa' as Place,
    duration: 60,
    optional: false,
  },
  {
    id: 'partido',
    label: 'El partido',
    place: 'club' as Place,
    duration: 90,
    optional: false,
  },
  {
    id: 'juegos',
    label: 'Los jueguitos',
    place: 'casa' as Place,
    duration: 45,
    optional: true,
  },
  {
    id: 'vuelta',
    label: 'La vuelta a la plaza',
    place: 'club' as Place,
    duration: 30,
    optional: true,
  },
] as const
export type BlockId = (typeof BLOCKS)[number]['id']

const minute = z.number().int().min(0).max(1439).multipleOf(STEP)
const friend = z.strictObject({
  /** Cuándo llega y cuándo se tiene que ir. */
  arrives: minute,
  leaves: minute,
  /** Qué le gustaría hacer. No cambia si el plan cierra. */
  prefers: z.enum(['merienda', 'partido', 'juegos', 'vuelta']),
})
export const friendDaySchema = z
  .strictObject({
    shape: z.enum(['ventana-corta', 'traslado-largo', 'gustos-cruzados']),
    crew: z.tuple([friend, friend, friend, friend]),
    /** Minutos entre la casa y el club, en cualquier sentido. */
    travel: z.number().int().min(15).max(45).multipleOf(15),
    /** Quiénes tienen que estar sí o sí en cada bloque. */
    needs: z.strictObject({
      merienda: z.array(z.enum(['ale', 'bruno', 'cami', 'dante'])).max(4),
      partido: z.array(z.enum(['ale', 'bruno', 'cami', 'dante'])).max(4),
      juegos: z.array(z.enum(['ale', 'bruno', 'cami', 'dante'])).max(4),
      vuelta: z.array(z.enum(['ale', 'bruno', 'cami', 'dante'])).max(4),
    }),
    /** Cuánto puede esperar alguien recién llegado sin que sea un plantón. */
    wait: z.number().int().min(30).max(90).multipleOf(15),
  })
  .refine(
    (p) => p.crew.every((entry) => entry.leaves - entry.arrives >= 120),
    'alguien pasa menos de dos horas',
  )

export type FriendDayParams = z.infer<typeof friendDaySchema>

export function clock(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

/** Los inicios que la tarde admite para un bloque, cada media hora. */
export function startsOf(block: (typeof BLOCKS)[number]): readonly number[] {
  const last = DAY.to - block.duration
  const total = Math.floor((last - DAY.from) / STEP) + 1
  return Array.from(
    { length: Math.max(0, total) },
    (_, i) => DAY.from + i * STEP,
  )
}

interface Scheduled {
  readonly block: (typeof BLOCKS)[number]
  readonly start: number
  readonly end: number
}

export interface DayOutcome {
  readonly quality: SolutionQuality
  /** Acuerdos del grupo cumplidos, de 0 a 3. Sólo entre planes que cierran. */
  readonly team: number
  readonly style?: EstiloAxis
}

const friendIndex = (id: FriendId): number =>
  FRIENDS.findIndex((entry) => entry.id === id)

/**
 * La lectura completa de una tarde, con su propia aritmética.
 *
 * Math primero y solo: que los bloques obligatorios estén, que no se pisen, que
 * el viaje entre la casa y el club entre, y que quien tiene que estar esté toda
 * la duración. Equipo se lee después y nunca cambia la calidad.
 */
export function readDay(
  p: FriendDayParams,
  placements: readonly SchedulePlacement[],
): DayOutcome {
  const scheduled: Scheduled[] = []
  for (const block of BLOCKS) {
    const placed = placements.find(
      (placement) => placement.activityId === block.id,
    )
    if (placed === undefined) continue
    scheduled.push({
      block,
      start: placed.startMinute,
      end: placed.startMinute + block.duration,
    })
  }
  scheduled.sort(
    (a, b) => a.start - b.start || (a.block.id < b.block.id ? -1 : 1),
  )

  const missing = BLOCKS.filter(
    (block) =>
      !block.optional &&
      !scheduled.some((entry) => entry.block.id === block.id),
  ).length
  const outside = scheduled.some(
    (entry) => entry.start < DAY.from || entry.end > DAY.to,
  )
  let overlap = false
  let rushed = false
  for (let i = 1; i < scheduled.length; i++) {
    const before = scheduled[i - 1]
    const here = scheduled[i]
    if (before === undefined || here === undefined) continue
    if (here.start < before.end) overlap = true
    else if (
      before.block.place !== here.block.place &&
      here.start - before.end < p.travel
    )
      rushed = true
  }
  const absent = scheduled.some((entry) =>
    p.needs[entry.block.id].some((id) => {
      const data = p.crew[friendIndex(id)]
      return (
        data === undefined ||
        data.arrives > entry.start ||
        data.leaves < entry.end
      )
    }),
  )

  const optionalPlaced = scheduled.filter(
    (entry) => entry.block.optional,
  ).length
  const quality: SolutionQuality =
    missing > 0 || outside || overlap || rushed || absent
      ? 'invalid'
      : optionalPlaced >= 2
        ? 'optimal'
        : optionalPlaced === 1
          ? 'efficient'
          : 'functional'

  // Equipo: los mismos bloques, hechos de otros datos.
  const attends = (index: number, entry: Scheduled): boolean => {
    const data = p.crew[index]
    return (
      data !== undefined &&
      data.arrives <= entry.start &&
      data.leaves >= entry.end
    )
  }
  const everyone = FRIENDS.every((_, index) =>
    scheduled.some((entry) => attends(index, entry)),
  )
  const wishes = FRIENDS.filter((_, index) => {
    const wanted = p.crew[index]?.prefers
    return scheduled.some(
      (entry) => entry.block.id === wanted && attends(index, entry),
    )
  }).length
  const waits = FRIENDS.every((_, index) => {
    const data = p.crew[index]
    if (data === undefined) return true
    const first = scheduled.find((entry) => attends(index, entry))
    return first === undefined || first.start - data.arrives <= p.wait
  })
  const team =
    quality === 'invalid'
      ? 0
      : [everyone, wishes >= 3, waits].filter(Boolean).length

  // Estilo describe la forma de la tarde, no cuánto entró: arrancar apenas se
  // puede, quedarse en un lugar o ir y volver pueden pasar con dos bloques
  // opcionales adentro o con ninguno.
  const first = scheduled[0]
  const trips = scheduled.filter(
    (entry, index) =>
      index > 0 && scheduled[index - 1]?.block.place !== entry.block.place,
  ).length
  const style: EstiloAxis | undefined =
    quality === 'invalid'
      ? undefined
      : first !== undefined && first.start === DAY.from
        ? 'aplicado'
        : trips <= 1
          ? 'estratega'
          : 'improvisador'

  return { quality, team, ...(style === undefined ? {} : { style }) }
}

export interface DayPlan extends StyledPlan {
  readonly placements: readonly SchedulePlacement[]
  readonly team: number
}

/**
 * Oráculo independiente sobre todas las tardes posibles.
 *
 * Cada bloque toma uno de sus inicios, y los opcionales además pueden no estar.
 * Nunca llama al evaluador.
 */
export function dayPlans(p: FriendDayParams): readonly DayPlan[] {
  const choices = BLOCKS.map((block) => [
    ...(block.optional ? [undefined] : []),
    ...startsOf(block),
  ])
  const plans: DayPlan[] = []
  const total = choices.reduce((product, list) => product * list.length, 1)
  for (let mask = 0; mask < total; mask++) {
    let rest = mask
    const placements: SchedulePlacement[] = []
    BLOCKS.forEach((block, index) => {
      const list = choices[index] ?? []
      const start = list[rest % list.length]
      rest = Math.floor(rest / list.length)
      if (start !== undefined)
        placements.push({ activityId: block.id, startMinute: start })
    })
    const read = readDay(p, placements)
    plans.push({
      placements,
      quality: read.quality,
      team: read.team,
      ...(read.style === undefined ? {} : { style: read.style }),
    })
  }
  return plans
}

const WINDOWS = [
  [
    [900, 1260],
    [900, 1140],
    [960, 1260],
    [930, 1200],
  ],
  [
    [900, 1200],
    [960, 1260],
    [900, 1260],
    [1020, 1260],
  ],
  [
    [930, 1260],
    [900, 1080],
    [900, 1260],
    [960, 1230],
  ],
  [
    [900, 1260],
    [1020, 1260],
    [900, 1170],
    [930, 1260],
  ],
] as const
const PREFERENCES = [
  ['merienda', 'partido', 'juegos', 'vuelta'],
  ['partido', 'juegos', 'merienda', 'partido'],
  ['juegos', 'partido', 'vuelta', 'merienda'],
  ['vuelta', 'merienda', 'partido', 'juegos'],
] as const
const NEEDS = [
  { merienda: ['ale'], partido: ['bruno', 'cami'], juegos: [], vuelta: [] },
  {
    merienda: ['ale', 'dante'],
    partido: ['bruno'],
    juegos: [],
    vuelta: ['cami'],
  },
  {
    merienda: ['ale'],
    partido: ['bruno', 'dante'],
    juegos: ['cami'],
    vuelta: [],
  },
] as const
const TRAVELS = [15, 30, 45] as const
const WAITS = [45, 60, 75] as const
const SHAPES = ['ventana-corta', 'traslado-largo', 'gustos-cruzados'] as const
const RADICES = [
  SHAPES.length,
  WINDOWS.length,
  PREFERENCES.length,
  NEEDS.length,
  TRAVELS.length,
  WAITS.length,
]
export const DAY_SPACE = spaceOf(RADICES)

export function generateFriendDay(index: number): FriendDayParams {
  const axes = candidateAxes(index, RADICES, 157)
  const shape = at(SHAPES, digit(axes, 0))
  const windows = at(WINDOWS, digit(axes, 1))
  const prefers = at(PREFERENCES, digit(axes, 2))
  const needs = at(NEEDS, digit(axes, 3))
  // La forma decide qué aprieta: una ventana corta, un viaje largo o los
  // gustos cruzados. Cada una tiene su propia firma, porque la forma no se
  // muestra y dos formas que produjeran la misma tarde serían la misma tarde.
  const travel = shape === 'traslado-largo' ? 45 : at(TRAVELS, digit(axes, 4))
  const wait = shape === 'gustos-cruzados' ? 45 : at(WAITS, digit(axes, 5))
  return friendDaySchema.parse({
    shape,
    travel,
    wait,
    needs: {
      merienda: [...needs.merienda],
      partido: [...needs.partido],
      juegos: [...needs.juegos],
      vuelta: [...needs.vuelta],
    },
    crew: FRIENDS.map((_, position) => {
      const window = windows[position] ?? [900, 1260]
      const early = shape === 'ventana-corta' && position === 1
      return {
        arrives: window[0],
        // Nadie viene por menos de dos horas: recortar la tarde de alguien es
        // apretar la ventana, no borrarle la tarde.
        leaves: early
          ? Math.max(window[0] + 120, Math.min(window[1], 1110))
          : window[1],
        prefers: prefers[position] ?? 'merienda',
      }
    }),
  })
}

export function dayGates(p: FriendDayParams): readonly string[] {
  const issues: string[] = []
  const plans = dayPlans(p)
  issues.push(...tierWitnessIssues(plans), ...styleGateIssues(plans))

  const valid = plans.filter((plan) => plan.quality !== 'invalid')
  if (valid.length === 0) issues.push('ninguna tarde cierra')

  // LOCKED: varios planes Math-valid con consecuencias distintas de Equipo.
  const teamsAmongOptimal = new Set(
    plans.filter((plan) => plan.quality === 'optimal').map((plan) => plan.team),
  )
  if (teamsAmongOptimal.size < 2)
    issues.push('todas las tardes óptimas dejan el mismo Equipo')
  if (!valid.some((plan) => plan.team === 3))
    issues.push('ninguna tarde válida cumple los tres acuerdos')
  // Witness del máximo competitivo: tiene que existir una respuesta que sea
  // Math óptima **y** deje el Equipo máximo. Sin eso, una carrera que sacara
  // esta variante no podría llegar al tope de FairScore por más que jugara
  // perfecto, y dos carreras tendrían techos distintos.
  if (!plans.some((plan) => plan.quality === 'optimal' && plan.team === 3))
    issues.push('ninguna respuesta óptima deja el Equipo máximo')
  if (!valid.some((plan) => plan.team <= 1))
    issues.push('ninguna tarde válida descuida los acuerdos')

  // No alcanza con encontrar la única franja libre: tiene que haber varias
  // tardes que cierren, y con inicios distintos.
  const starts = new Set(
    valid.map((plan) =>
      plan.placements
        .map(
          (placement) =>
            `${placement.activityId}@${String(placement.startMinute)}`,
        )
        .sort()
        .join(' '),
    ),
  )
  if (starts.size < 8) issues.push('hay muy pocas tardes posibles')

  // Las ventanas tienen que apretar: si nadie se va antes del final, la
  // disponibilidad es decorado.
  if (!p.crew.some((entry) => entry.leaves < DAY.to))
    issues.push('nadie se va antes del final de la tarde')
  if (
    !plans.some(
      (plan) =>
        plan.quality === 'invalid' && plan.placements.length === BLOCKS.length,
    )
  )
    issues.push('ninguna tarde completa falla')
  return issues
}

export function evaluateDay(
  p: FriendDayParams,
  placements: readonly SchedulePlacement[],
) {
  if (
    new Set(placements.map((placement) => placement.activityId)).size !==
      placements.length ||
    placements.some(
      (placement) =>
        !BLOCKS.some((block) => block.id === placement.activityId) ||
        !startsOf(
          BLOCKS.find((block) => block.id === placement.activityId) ??
            BLOCKS[0],
        ).includes(placement.startMinute),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'horario repetido o fuera de contrato',
    })

  const read = readDay(p, placements)
  const startOf = (id: BlockId) =>
    placements.find((placement) => placement.activityId === id)?.startMinute

  const missing = BLOCKS.find(
    (block) => !block.optional && startOf(block.id) === undefined,
  )
  const base = outcome(
    read.quality,
    {
      outcomeKey: `friend-day.${p.shape}.${read.quality}`,
      stamp: read.quality === 'invalid' ? 'No pasa' : 'Salió',
      facts: [
        ...BLOCKS.map((block) => {
          const start = startOf(block.id)
          return {
            label: block.label,
            value:
              start === undefined
                ? 'no va'
                : `${clock(start)} a ${clock(start + block.duration)}`,
          }
        }),
        { label: 'Acuerdos del grupo', value: `${String(read.team)} de 3` },
      ],
      ...(read.quality === 'invalid'
        ? {
            violatedConstraint:
              missing !== undefined
                ? `${missing.label} quedó sin horario.`
                : 'Algo se pisa, no da el tiempo del viaje o alguien que tiene que estar no llegó o ya se fue.',
          }
        : {}),
      consequence:
        read.quality === 'invalid'
          ? 'Con esa tarde alguien llega a un lugar vacío.'
          : read.team === 3
            ? 'La tarde entra y nadie se quedó afuera ni esperando.'
            : 'La tarde entra, aunque alguien va a decir que la próxima se organiza distinto.',
    },
    {},
    [
      { flag: 'y3.friendDay.outcome', value: read.quality },
      ...(read.style === undefined
        ? []
        : [{ flag: 'y3.friendDay.strategy', value: read.style }]),
    ],
  )
  return ok({
    ...base,
    metrics: metrics({ ...base.metrics, efficiency: read.team / 3 }),
    careerEffects: {
      ...base.careerEffects,
      ...(read.quality === 'invalid' ? {} : { equipo: read.team - 1 }),
      ...(read.style === undefined
        ? {}
        : { estilo: { axis: read.style, amount: 8 } }),
    },
  })
}

export const friendDayVariants = generatedSource({
  id: 'y3.friend-day.windows',
  version: '1',
  schema: friendDaySchema,
  size: DAY_SPACE,
  generate: generateFriendDay,
  gates: dayGates,
})

const friendDayDefinition = defineChallenge<FriendDayParams, FriendDayParams>({
  id: toChallengeId('y3.friend-day'),
  family: toScenarioFamilyId('dia-del-amigo'),
  placement: 'anchor',
  variants: authoredVariantIds(friendDayVariants.authored),
  variantSource: friendDayVariants,
  interaction: 'schedule-builder',
  stages: ['year-3'],
  categories: ['time-and-rates', 'optimization-and-constraints'],
  baseDifficulty: 3,
  cognitive: {
    steps: 2,
    constraints: 3,
    selection: 1,
    optimization: 0,
    uncertainty: 0,
    construction: 1,
  },
  composition: {
    primaryReasoningFamily: 'TEMPORAL',
    interactionEngine: 'timeline-schedule',
    pacingClass: 'MEDIUM',
    chronology: 40,
  },
  scoring: {
    math: 'discrete-quality',
    team: ({ metrics: evidence }) => performanceFromRatio(evidence.efficiency),
    aura: 'none',
    rationale:
      'Math mide que la tarde se pueda hacer: horarios que no se pisan, el viaje entre los dos lugares y que quien tiene que estar esté. Equipo mide los acuerdos del grupo entre tardes que ya cierran, así que una tarde impecable puede dejar a alguien esperando y no cobra por eso dos veces.',
  },
  tools: ['notepad'],
  generate: ({ params }) => parameters(friendDaySchema, params),
  verify: (p) =>
    p.crew.some((entry) => entry.leaves < DAY.to)
      ? []
      : ['nadie se va antes del final de la tarde'],
  narrate: () => ({
    title: 'El Día del Amigo',
    setup:
      'Se juntan a la tarde, pero no todos llegan a la misma hora y hay que cruzar hasta el club.',
    goal: 'Poné el horario de cada cosa: que la tarde entre y que el grupo quede conforme.',
  }),
  present: (p) => ({
    kind: 'schedule-builder',
    instructions:
      'Elegí a qué hora empieza cada cosa. Los jueguitos y la vuelta a la plaza son opcionales.',
    data: [
      ...FRIENDS.map((person, index) => {
        const data = p.crew[index]
        const wanted = BLOCKS.find((block) => block.id === data?.prefers)
        return {
          label: person.label,
          value:
            data === undefined
              ? ''
              : `${clock(data.arrives)} a ${clock(data.leaves)}`,
          unit: `quiere estar en ${wanted?.label ?? ''}`,
        }
      }),
      {
        label: 'De la casa al club',
        value: String(p.travel),
        unit: 'minutos de viaje',
        constraint: true,
      },
      {
        label: 'Nadie quiere esperar más de',
        value: String(p.wait),
        unit: 'minutos',
      },
    ],
    activities: BLOCKS.map((block) => {
      const needs = p.needs[block.id]
        .map((id) => FRIENDS.find((person) => person.id === id)?.label ?? '')
        .join(' y ')
      return {
        id: block.id,
        label: block.label,
        detail: `${String(block.duration)} min · ${PLACE_LABEL[block.place]}${
          needs === '' ? '' : ` · necesita a ${needs}`
        }`,
        location: PLACE_LABEL[block.place],
        durationMinutes: block.duration,
        setupMinutes: 0,
        startMinutes: startsOf(block),
        optional: block.optional,
      }
    }),
    span: { from: DAY.from, to: DAY.to },
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'schedule-builder'
      ? evaluateDay(p, answer.placements)
      : err({ kind: 'invalid-answer', detail: 'se esperaba una tarde armada' }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const friendDay = graded(friendDayDefinition)
