/**
 * 3.º · La semana (`y3.week-planner`).
 *
 * Cuatro días, una tarde de cinco horas en cada uno y cosas que hay que hacer
 * antes de que venza cada una. Algunas ya tienen día y hora y no se mueven; las
 * demás las ubica el jugador. No es la tarde de 1.º ni la del Día del Amigo:
 * acá la unidad es el día, la capacidad es toda la semana y lo que aprieta son
 * los vencimientos.
 *
 * Math mide que la semana entre: que lo obligatorio esté, que nada se pise con
 * lo que ya estaba y que cada cosa termine antes de su vencimiento. Lo que
 * suma de más es lo que el jugador logra meter encima.
 *
 * Estilo describe **cómo** quedó repartida: dejar todo pegado al vencimiento,
 * guardarse un día entero libre o repartir con margen son tres formas de
 * organizarse, y ninguna es mejor. Es señal de carrera y no puntúa: no hay
 * Equipo ni Aura acá, y el juego no opina sobre trabajar o descansar.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
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

export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue'] as const
/** La tarde libre de cada día: de cuatro a nueve. */
export const DAY_WINDOW = { start: 960, end: 1260 } as const
const MINUTES_PER_DAY = 1440
const SLOT = 60

/** Minuto absoluto desde la medianoche del lunes. */
export function absolute(day: number, minute: number): number {
  return day * MINUTES_PER_DAY + minute
}
export function dayOf(absoluteMinute: number): number {
  return Math.floor(absoluteMinute / MINUTES_PER_DAY)
}
export function clockOf(absoluteMinute: number): number {
  return absoluteMinute % MINUTES_PER_DAY
}
export function weekText(absoluteMinute: number): string {
  const clock = clockOf(absoluteMinute)
  return `${DAYS[dayOf(absoluteMinute)] ?? ''} ${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`
}

const day = z.number().int().min(0).max(3)
const taskSchema = z.strictObject({
  id: z.enum(['historia', 'matematica', 'lectura', 'ensayo']),
  minutes: z.number().int().min(30).max(180).multipleOf(30),
  /** Los días en los que se puede hacer. Fuera de ahí no hay dónde. */
  days: z.array(day).min(1).max(4),
  /** El último día en el que todavía sirve hacerla. */
  dueDay: day,
  optional: z.boolean(),
})
const fixedSchema = z.strictObject({
  id: z.enum(['entrenamiento', 'hermana', 'trabajo']),
  day,
  start: z.number().int().min(960).max(1260).multipleOf(SLOT),
  minutes: z.number().int().min(60).max(180).multipleOf(30),
})
export const weekSchema = z
  .strictObject({
    shape: z.enum(['semana-cargada', 'vencimiento-temprano', 'tarde-ocupada']),
    tasks: z.array(taskSchema).min(4).max(4),
    fixed: z.array(fixedSchema).min(2).max(2),
  })
  .refine(
    (p) => p.tasks.filter((task) => task.optional).length === 2,
    'la semana lleva exactamente dos pendientes opcionales',
  )
  .refine(
    (p) => p.tasks.every((task) => task.days.includes(task.dueDay)),
    'un pendiente vence un día en el que no se puede hacer',
  )
export type WeekParams = z.infer<typeof weekSchema>
export type WeekTask = WeekParams['tasks'][number]

/** Los inicios posibles de un pendiente: cada hora, en los días que admite. */
export function startsOfTask(task: WeekTask): readonly number[] {
  return task.days.flatMap((entry) => {
    const last = DAY_WINDOW.end - task.minutes
    const total = Math.floor((last - DAY_WINDOW.start) / SLOT) + 1
    return Array.from({ length: Math.max(0, total) }, (_, i) =>
      absolute(entry, DAY_WINDOW.start + i * SLOT),
    )
  })
}

interface Block {
  readonly id: string
  readonly start: number
  readonly end: number
  readonly task?: WeekTask
}

function blocksOf(
  p: WeekParams,
  placements: readonly SchedulePlacement[],
): readonly Block[] {
  const blocks: Block[] = p.fixed.map((entry) => ({
    id: entry.id,
    start: absolute(entry.day, entry.start),
    end: absolute(entry.day, entry.start) + entry.minutes,
  }))
  for (const task of p.tasks) {
    const placed = placements.find(
      (placement) => placement.activityId === task.id,
    )
    if (placed === undefined) continue
    blocks.push({
      id: task.id,
      start: placed.startMinute,
      end: placed.startMinute + task.minutes,
      task,
    })
  }
  return blocks.sort((a, b) => a.start - b.start || (a.id < b.id ? -1 : 1))
}

export interface WeekOutcome {
  readonly quality: SolutionQuality
  readonly style?: EstiloAxis
  /** Qué falló, para poder decirlo con nombre. */
  readonly failure?: 'falta' | 'pisa' | 'vence' | 'fuera'
}

/**
 * La lectura completa de una semana.
 *
 * Math es una sola cosa: que la semana se pueda cumplir. Estilo se lee sobre la
 * misma semana pero mirando otra cosa —cuándo quedó cada pendiente y qué días
 * quedaron ocupados— y nunca cambia la calidad.
 */
export function readWeek(
  p: WeekParams,
  placements: readonly SchedulePlacement[],
): WeekOutcome {
  const blocks = blocksOf(p, placements)
  const placedTasks = blocks.flatMap((block) =>
    block.task === undefined ? [] : [block],
  )

  const missing = p.tasks.some(
    (task) =>
      !task.optional &&
      !placedTasks.some((block) => block.task?.id === task.id),
  )
  const outside = placedTasks.some(
    (block) =>
      clockOf(block.start) < DAY_WINDOW.start ||
      clockOf(block.start) + (block.task?.minutes ?? 0) > DAY_WINDOW.end ||
      !(block.task?.days ?? []).includes(dayOf(block.start)),
  )
  const overlap = blocks.some(
    (block, index) => index > 0 && block.start < (blocks[index - 1]?.end ?? 0),
  )
  const late = placedTasks.some(
    (block) => dayOf(block.start) > (block.task?.dueDay ?? 0),
  )

  const failure = missing
    ? ('falta' as const)
    : outside
      ? ('fuera' as const)
      : overlap
        ? ('pisa' as const)
        : late
          ? ('vence' as const)
          : undefined

  const extras = placedTasks.filter(
    (block) => block.task?.optional === true,
  ).length
  const quality: SolutionQuality =
    failure !== undefined
      ? 'invalid'
      : extras >= 2
        ? 'optimal'
        : extras === 1
          ? 'efficient'
          : 'functional'

  // Estilo: la forma del reparto. Se lee en orden y es total, así que ninguna
  // semana válida queda sin etiqueta ni con dos.
  const onDueDay = placedTasks.some(
    (block) =>
      block.task?.optional === false &&
      dayOf(block.start) === block.task.dueDay,
  )
  const usedDays = new Set(blocks.map((block) => dayOf(block.start)))
  const style: EstiloAxis | undefined =
    failure !== undefined
      ? undefined
      : onDueDay
        ? 'improvisador'
        : usedDays.size < DAYS.length
          ? 'estratega'
          : 'aplicado'

  return {
    quality,
    ...(style === undefined ? {} : { style }),
    ...(failure === undefined ? {} : { failure }),
  }
}

export interface WeekPlan extends StyledPlan {
  readonly placements: readonly SchedulePlacement[]
}

/** Oráculo independiente sobre todas las semanas posibles. */
export function weekPlans(p: WeekParams): readonly WeekPlan[] {
  const choices = p.tasks.map((task) => [
    ...(task.optional ? [undefined] : []),
    ...startsOfTask(task),
  ])
  const plans: WeekPlan[] = []
  const total = choices.reduce((product, list) => product * list.length, 1)
  for (let mask = 0; mask < total; mask++) {
    let rest = mask
    const placements: SchedulePlacement[] = []
    p.tasks.forEach((task, index) => {
      const list = choices[index] ?? []
      const start = list[rest % list.length]
      rest = Math.floor(rest / list.length)
      if (start !== undefined)
        placements.push({ activityId: task.id, startMinute: start })
    })
    const read = readWeek(p, placements)
    plans.push({
      placements,
      quality: read.quality,
      ...(read.style === undefined ? {} : { style: read.style }),
    })
  }
  return plans
}

const SHAPES = [
  'semana-cargada',
  'vencimiento-temprano',
  'tarde-ocupada',
] as const
const REQUIRED_DAYS = [
  [
    [0, 1, 2],
    [1, 2, 3],
  ],
  [
    [0, 1],
    [0, 2, 3],
  ],
  [
    [1, 2, 3],
    [0, 1, 2],
  ],
  [
    [0, 2],
    [1, 3],
  ],
] as const
const OPTIONAL_DAYS = [
  [
    [0, 3],
    [1, 2],
  ],
  [
    [2, 3],
    [0, 1],
  ],
  [
    [0, 1],
    [2, 3],
  ],
] as const
const LENGTHS = [
  [120, 90, 60, 30],
  [90, 120, 30, 60],
  [150, 60, 60, 30],
  [120, 60, 90, 30],
] as const
const FIXED = [
  [
    { id: 'entrenamiento', day: 1, start: 1020, minutes: 90 },
    { id: 'hermana', day: 3, start: 960, minutes: 120 },
  ],
  [
    { id: 'entrenamiento', day: 0, start: 1080, minutes: 120 },
    { id: 'trabajo', day: 2, start: 960, minutes: 90 },
  ],
  [
    { id: 'hermana', day: 1, start: 960, minutes: 120 },
    { id: 'trabajo', day: 3, start: 1080, minutes: 120 },
  ],
  [
    { id: 'trabajo', day: 0, start: 960, minutes: 90 },
    { id: 'entrenamiento', day: 2, start: 1080, minutes: 120 },
  ],
] as const
const RADICES = [
  SHAPES.length,
  REQUIRED_DAYS.length,
  OPTIONAL_DAYS.length,
  LENGTHS.length,
  FIXED.length,
]
export const WEEK_SPACE = spaceOf(RADICES)

const TASK_IDS = ['historia', 'matematica', 'lectura', 'ensayo'] as const

export function generateWeek(index: number): WeekParams {
  const axes = candidateAxes(index, RADICES, 133)
  const shape = at(SHAPES, digit(axes, 0))
  const required = at(REQUIRED_DAYS, digit(axes, 1))
  const optional = at(OPTIONAL_DAYS, digit(axes, 2))
  const lengths = at(LENGTHS, digit(axes, 3))
  const fixed = at(FIXED, digit(axes, 4))
  const days = [...required, ...optional]
  return weekSchema.parse({
    shape,
    // Cada forma tiene su propia firma visible. La forma no se muestra: dos
    // formas que produjeran la misma semana serían la misma semana dos veces,
    // y el jugador vería la misma pantalla con dos direcciones distintas.
    fixed: fixed.map((entry) => ({
      ...entry,
      minutes:
        shape === 'tarde-ocupada'
          ? Math.min(180, entry.minutes + 30)
          : entry.minutes,
    })),
    tasks: TASK_IDS.map((id, position) => {
      const allowed = [...(days[position] ?? [0])]
      // Un vencimiento temprano es el primer día en el que se puede hacer; si
      // no, el anteúltimo: en los dos casos queda margen que el jugador puede
      // gastar o no, que es lo que Estilo describe.
      const early = shape === 'vencimiento-temprano' && position === 0
      const dueDay =
        allowed[early ? 0 : Math.max(0, allowed.length - 2)] ?? allowed[0] ?? 0
      return {
        id,
        minutes:
          (lengths[position] ?? 60) +
          (shape === 'semana-cargada' && position < 2 ? 30 : 0),
        days: allowed,
        dueDay: position < 2 ? dueDay : (allowed[allowed.length - 1] ?? 0),
        optional: position >= 2,
      }
    }),
  })
}

export function weekGates(p: WeekParams): readonly string[] {
  const issues: string[] = []
  const plans = weekPlans(p)
  issues.push(...tierWitnessIssues(plans), ...styleGateIssues(plans))

  const valid = plans.filter((plan) => plan.quality !== 'invalid')
  if (valid.length === 0) issues.push('ninguna semana cierra')
  if (valid.length < 8) issues.push('hay muy pocas semanas posibles')

  // Los vencimientos tienen que apretar: si ninguna semana falla por llegar
  // tarde, el vencimiento es decorado y esto es acomodar bloques.
  if (!plans.some((plan) => readWeek(p, plan.placements).failure === 'vence'))
    issues.push('ninguna semana falla por vencimiento')
  // Y lo que ya estaba también: sin choques, la capacidad de la semana sobra.
  if (!plans.some((plan) => readWeek(p, plan.placements).failure === 'pisa'))
    issues.push('nada se pisa con lo que ya estaba')
  return issues
}

const TASK_LABEL = {
  historia: 'Trabajo de Historia',
  matematica: 'Guía de Matemática',
  lectura: 'Leer el capítulo',
  ensayo: 'Ensayo con la banda',
} as const
const FIXED_LABEL = {
  entrenamiento: 'Entrenamiento',
  hermana: 'Cuidar a tu hermana',
  trabajo: 'Turno en el kiosco',
} as const

export function evaluateWeek(
  p: WeekParams,
  placements: readonly SchedulePlacement[],
) {
  // Lo que ya estaba tomado también viaja en la respuesta —la agenda lo
  // muestra como un bloque con un solo horario posible—, así que se acepta
  // exactamente en su horario y no se cuenta dos veces: `readWeek` lo toma de
  // los parámetros, que es de donde no se puede mover.
  if (
    new Set(placements.map((placement) => placement.activityId)).size !==
      placements.length ||
    placements.some((placement) => {
      const task = p.tasks.find((entry) => entry.id === placement.activityId)
      if (task !== undefined)
        return !startsOfTask(task).includes(placement.startMinute)
      const fixed = p.fixed.find((entry) => entry.id === placement.activityId)
      return (
        fixed === undefined ||
        placement.startMinute !== absolute(fixed.day, fixed.start)
      )
    })
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'pendiente repetido o fuera de contrato',
    })

  const read = readWeek(p, placements)
  const startOf = (id: string) =>
    placements.find((placement) => placement.activityId === id)?.startMinute

  return ok(
    outcome(
      read.quality,
      {
        outcomeKey: `week-planner.${p.shape}.${read.quality}`,
        stamp: read.quality === 'invalid' ? 'No entra' : 'Semana',
        facts: p.tasks.map((task) => {
          const start = startOf(task.id)
          return {
            label: TASK_LABEL[task.id],
            value:
              start === undefined
                ? 'sin hacer'
                : `${weekText(start)} · vence ${DAYS[task.dueDay] ?? ''}`,
          }
        }),
        ...(read.quality === 'invalid'
          ? {
              violatedConstraint:
                read.failure === 'falta'
                  ? 'Falta ubicar algo que hay que entregar sí o sí.'
                  : read.failure === 'vence'
                    ? 'Algo quedó para después de su vencimiento.'
                    : read.failure === 'pisa'
                      ? 'Dos cosas quedaron a la misma hora.'
                      : 'Algo quedó fuera de la tarde libre de su día.',
            }
          : {}),
        consequence:
          read.quality === 'invalid'
            ? 'Con esa semana algo llega tarde o no llega.'
            : read.quality === 'optimal'
              ? 'Entró todo, y encima lo que querías hacer.'
              : 'La semana cierra a tiempo.',
      },
      read.style === undefined
        ? {}
        : { estilo: { axis: read.style, amount: 10 } },
      [
        { flag: 'y3.week.outcome', value: read.quality },
        ...(read.style === undefined
          ? []
          : [{ flag: 'y3.week.strategy', value: read.style }]),
      ],
    ),
  )
}

export const weekVariants = generatedSource({
  id: 'y3.week-planner.days',
  version: '1',
  schema: weekSchema,
  size: WEEK_SPACE,
  generate: generateWeek,
  gates: weekGates,
})

export const weekPlanner = defineChallenge<WeekParams, WeekParams>({
  id: toChallengeId('y3.week-planner'),
  family: toScenarioFamilyId('semana-propia'),
  placement: 'checkpoint',
  variants: authoredVariantIds(weekVariants.authored),
  variantSource: weekVariants,
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
    chronology: 50,
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'La semana es propia: no hay nadie más cuyas preferencias medir, así que no hay Equipo ni Aura. Estilo describe cómo quedó repartida y es señal de carrera, nunca puntaje.',
  },
  tools: ['notepad'],
  generate: ({ params }) => parameters(weekSchema, params),
  verify: (p) =>
    p.tasks.every((task) => startsOfTask(task).length > 0)
      ? []
      : ['un pendiente no tiene ningún horario posible'],
  narrate: () => ({
    title: 'La semana que viene',
    setup:
      'Cuatro tardes libres, dos cosas que ya tienen día y hora, y una lista de pendientes con fecha.',
    goal: 'Armá la semana: que todo lo que vence llegue a tiempo.',
  }),
  present: (p) => ({
    kind: 'schedule-builder',
    instructions:
      'Elegí el día y la hora de cada pendiente. Lo que ya tiene día y hora no se mueve.',
    data: [
      {
        label: 'Tarde libre de cada día',
        value: '16:00 a 21:00',
        span: 2,
      },
      ...p.tasks
        .filter((task) => !task.optional)
        .map((task) => ({
          label: TASK_LABEL[task.id],
          value: `vence ${DAYS[task.dueDay] ?? ''}`,
          unit: `${String(task.minutes)} minutos`,
          constraint: true,
        })),
    ],
    activities: [
      ...p.fixed.map((entry) => ({
        id: entry.id,
        label: FIXED_LABEL[entry.id],
        detail: `${String(entry.minutes)} min · ya está tomado`,
        location: 'Fijo',
        durationMinutes: entry.minutes,
        setupMinutes: 0,
        startMinutes: [absolute(entry.day, entry.start)],
        optional: false,
      })),
      ...p.tasks.map((task) => ({
        id: task.id,
        label: TASK_LABEL[task.id],
        detail: `${String(task.minutes)} min · ${
          task.optional
            ? 'si entra'
            : `hay que terminarlo el ${DAYS[task.dueDay] ?? ''}`
        }`,
        location: task.optional ? 'Si entra' : 'Con fecha',
        durationMinutes: task.minutes,
        setupMinutes: 0,
        startMinutes: startsOfTask(task),
        optional: task.optional,
      })),
    ],
    span: {
      from: absolute(0, DAY_WINDOW.start),
      to: absolute(DAYS.length - 1, DAY_WINDOW.end),
    },
    calendar: {
      days: [...DAYS],
      dayStart: DAY_WINDOW.start,
      dayEnd: DAY_WINDOW.end,
    },
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'schedule-builder'
      ? evaluateWeek(p, answer.placements)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba una semana armada',
        }),
})
