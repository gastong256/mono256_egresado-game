/**
 * 2.º · El plan del Intercurso (`y2.intercurso-plan`).
 *
 * Tres actividades en dos franjas y cuatro personas que no están todas todo el
 * tiempo. El tiempo no es decorado: una persona no puede estar en dos lugares
 * en la misma franja, y quien sólo viene a la tarde no puede cubrir la mañana.
 * Eso es lo que separa este plan del reparto estático de 1.º.
 *
 * Math mide que el plan se pueda ejecutar: cobertura, disponibilidad, choques
 * de franja y si queda alguien libre por si algo se cae. Equipo mide otra cosa
 * —quién participa, a quién le tocó lo que no quería y qué tan parejo quedó el
 * reparto— y se mide entre planes que ya son Math-válidos. Un plan impecable
 * puede dejar a alguien afuera, y uno generoso puede no cerrar.
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
  type EstiloAxis,
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
  styleGateIssues,
  tierWitnessIssues,
  type StyledPlan,
} from '@/content/authoring'

export const SLOTS = [
  { id: 'manana', label: 'mañana' },
  { id: 'tarde', label: 'tarde' },
] as const
export const ACTIVITIES = [
  { id: 'futbol', label: 'Fútbol', optional: false },
  { id: 'voley', label: 'Vóley', optional: false },
  { id: 'ajedrez', label: 'Ajedrez', optional: true },
] as const
export const CREW = [
  { id: 'ana', label: 'Ana' },
  { id: 'beto', label: 'Beto' },
  { id: 'cris', label: 'Cris' },
  { id: 'dani', label: 'Dani' },
] as const

/** Every task is one activity in one slot: that is where time enters. */
export const TASKS = ACTIVITIES.flatMap((activity) =>
  SLOTS.map((slot) => ({
    id: `${activity.id}-${slot.id}`,
    activityId: activity.id,
    slotId: slot.id,
    optional: activity.optional,
  })),
)

const availability = z.tuple([z.boolean(), z.boolean()])
const member = z.strictObject({
  /** Which slots this person can actually be there. */
  available: availability,
  /** The activity they would rather do, and the one they would rather not. */
  prefers: z.enum(['futbol', 'voley', 'ajedrez']),
  avoids: z.enum(['futbol', 'voley', 'ajedrez']),
})
export const planSchema = z.discriminatedUnion('shape', [
  /** Somebody is only there for one slot, which forces part of the plan. */
  z.strictObject({
    shape: z.literal('tight-availability'),
    crew: z.tuple([member, member, member, member]),
  }),
  /** Two people want the same activity and only one can have it. */
  z.strictObject({
    shape: z.literal('clash'),
    crew: z.tuple([member, member, member, member]),
  }),
  /** There is room to spare, and the decision is where to leave it. */
  z.strictObject({
    shape: z.literal('spare'),
    crew: z.tuple([member, member, member, member]),
  }),
])
export type PlanParams = z.infer<typeof planSchema>

const SHAPES = ['tight-availability', 'clash', 'spare'] as const
const PREFERENCES = [
  ['futbol', 'voley', 'ajedrez', 'futbol'],
  ['voley', 'futbol', 'futbol', 'ajedrez'],
  ['ajedrez', 'futbol', 'voley', 'voley'],
  ['futbol', 'futbol', 'ajedrez', 'voley'],
] as const
const AVOIDS = [
  ['ajedrez', 'ajedrez', 'futbol', 'voley'],
  ['voley', 'ajedrez', 'voley', 'futbol'],
  ['futbol', 'voley', 'ajedrez', 'ajedrez'],
] as const
const RADICES = [SHAPES.length, PREFERENCES.length, AVOIDS.length, 2]
export const PLAN_SPACE = spaceOf(RADICES)

export function generatePlan(index: number): PlanParams {
  const axes = candidateAxes(index, RADICES, 17)
  const shape = at(SHAPES, digit(axes, 0))
  const prefers = at(PREFERENCES, digit(axes, 1))
  const avoids = at(AVOIDS, digit(axes, 2))
  const swap = digit(axes, 3)

  const available: readonly (readonly [boolean, boolean])[] =
    shape === 'tight-availability'
      ? // Only one person is tied to a single slot. With two, the afternoon and
        // the morning both become forced and every legal plan ends up with the
        // same shape, which leaves Estilo with nothing to distinguish.
        [
          [true, false],
          [true, true],
          [true, true],
          [true, true],
        ]
      : shape === 'clash'
        ? // Cris misses the morning. Each shape owns a distinct availability
          // signature: the shape itself is never shown, so two shapes that can
          // produce the same crew would be the same situation twice.
          [
            [true, true],
            [true, true],
            [false, true],
            [true, true],
          ]
        : [
            [true, true],
            [true, true],
            [true, true],
            [true, true],
          ]

  return planSchema.parse({
    shape,
    crew: CREW.map((_, index) => ({
      available: [...(available[index] ?? [true, true])],
      prefers: prefers[(index + swap) % prefers.length] ?? 'futbol',
      avoids: avoids[index] ?? 'ajedrez',
    })),
  })
}

const slotIndex = (slotId: string): number =>
  SLOTS.findIndex((slot) => slot.id === slotId)

export interface PlanOutcome {
  readonly quality: SolutionQuality
  /** Team agreements met, 0 to 3. Measured only among Math-valid plans. */
  readonly team: number
  readonly style?: EstiloAxis
}

/**
 * The full reading of one assignment, with its own arithmetic.
 *
 * Math first and alone: coverage, availability and slot clashes. Team is read
 * afterwards and never changes the quality, which is what keeps the two kinds
 * of evidence from paying for each other.
 */
export function readPlan(
  p: PlanParams,
  assignments: readonly AgentAssignment[],
): PlanOutcome {
  const taken = new Map<string, string>()
  for (const entry of assignments) taken.set(entry.taskId, entry.agentId)

  const loadBySlot = CREW.map(() => SLOTS.map(() => 0))
  const loadByPerson = CREW.map(() => 0)
  let unavailable = false
  for (const task of TASKS) {
    const agentId = taken.get(task.id)
    if (agentId === undefined) continue
    const person = CREW.findIndex((entry) => entry.id === agentId)
    if (person < 0) continue
    const slot = slotIndex(task.slotId)
    const row = loadBySlot[person]
    if (row !== undefined) row[slot] = (row[slot] ?? 0) + 1
    loadByPerson[person] = (loadByPerson[person] ?? 0) + 1
    if (p.crew[person]?.available[slot] !== true) unavailable = true
  }

  const missingRequired = TASKS.filter(
    (task) => !task.optional && taken.get(task.id) === undefined,
  ).length
  const clash = loadBySlot.some((row) => row.some((value) => value > 1))
  const optionalTasks = TASKS.filter((task) => task.optional).length
  const optionalCovered = TASKS.filter(
    (task) => task.optional && taken.get(task.id) !== undefined,
  ).length

  // Written ladder: the obligations close the plan, and each optional activity
  // the crew manages to cover on top is one more thing the Intercurso offers.
  const quality: SolutionQuality =
    missingRequired > 0 || clash || unavailable
      ? 'invalid'
      : optionalCovered >= optionalTasks
        ? 'optimal'
        : optionalCovered > 0
          ? 'efficient'
          : 'functional'

  // Team is read on the same plan, from entirely different facts.
  const everyone = loadByPerson.every((value) => value > 0)
  const avoided = CREW.every((_, person) => {
    const disliked = p.crew[person]?.avoids
    return !TASKS.some(
      (task) =>
        taken.get(task.id) === CREW[person]?.id && task.activityId === disliked,
    )
  })
  const spread = Math.max(...loadByPerson) - Math.min(...loadByPerson) <= 1
  const team =
    quality === 'invalid'
      ? 0
      : [everyone, avoided, spread].filter(Boolean).length

  // Estilo describes the shape of the split, never how well the plan closed:
  // leaving somebody out, leaning on one person or spreading the load can each
  // happen with or without the optional activity covered.
  const maxLoad = Math.max(...loadByPerson)
  const idle = loadByPerson.filter((value) => value === 0).length
  const style: EstiloAxis | undefined =
    quality === 'invalid'
      ? undefined
      : idle > 0
        ? 'improvisador'
        : maxLoad >= 3
          ? 'estratega'
          : 'aplicado'

  return { quality, team, ...(style === undefined ? {} : { style }) }
}

export interface Plan extends StyledPlan {
  readonly assignments: readonly AgentAssignment[]
  readonly team: number
}

/**
 * Independent oracle over every assignment of the six tasks.
 *
 * Each task takes one of the four people or nobody, which is the whole legal
 * space and small enough to enumerate. It never calls the evaluator.
 */
export function planOptions(p: PlanParams): readonly Plan[] {
  const options = [undefined, ...CREW.map((person) => person.id)]
  const plans: Plan[] = []
  const total = options.length ** TASKS.length
  for (let mask = 0; mask < total; mask++) {
    let rest = mask
    const assignments: AgentAssignment[] = []
    for (const task of TASKS) {
      const agentId = options[rest % options.length]
      rest = Math.floor(rest / options.length)
      if (agentId !== undefined) assignments.push({ agentId, taskId: task.id })
    }
    const read = readPlan(p, assignments)
    plans.push({
      assignments,
      quality: read.quality,
      team: read.team,
      ...(read.style === undefined ? {} : { style: read.style }),
    })
  }
  return plans
}

export function planGates(p: PlanParams): readonly string[] {
  const issues: string[] = []
  const plans = planOptions(p)
  issues.push(...tierWitnessIssues(plans), ...styleGateIssues(plans))

  const valid = plans.filter((plan) => plan.quality !== 'invalid')
  if (valid.length === 0) issues.push('ningún plan cierra')

  // LOCKED: several Math-valid plans with different Team consequences.
  const teamsAmongOptimal = new Set(
    plans.filter((plan) => plan.quality === 'optimal').map((plan) => plan.team),
  )
  if (teamsAmongOptimal.size < 2)
    issues.push('todos los planes óptimos dejan el mismo Equipo')
  if (!valid.some((plan) => plan.team === 3))
    issues.push('ningún plan válido cumple los tres acuerdos')
  if (!valid.some((plan) => plan.team <= 1))
    issues.push('ningún plan válido descuida los acuerdos')

  // Availability has to bind: somebody must be unable to take some task.
  const blocked = p.crew.some((person) => person.available.includes(false))
  if (p.shape === 'tight-availability' && !blocked)
    issues.push('nadie tiene la disponibilidad restringida')
  if (p.crew.every((person) => person.prefers === person.avoids))
    issues.push('preferencias y rechazos coinciden')
  return issues
}

export function evaluatePlan(
  p: PlanParams,
  assignments: readonly AgentAssignment[],
) {
  if (
    new Set(assignments.map((entry) => entry.taskId)).size !==
      assignments.length ||
    assignments.some(
      (entry) =>
        !TASKS.some((task) => task.id === entry.taskId) ||
        !CREW.some((person) => person.id === entry.agentId),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'asignación repetida o fuera de contrato',
    })

  const read = readPlan(p, assignments)
  const taken = new Map(
    assignments.map((entry) => [entry.taskId, entry.agentId]),
  )
  const missing = TASKS.filter(
    (task) => !task.optional && taken.get(task.id) === undefined,
  )
  const nameOf = (id: string | undefined) =>
    CREW.find((person) => person.id === id)?.label ?? 'nadie'

  const base = outcome(
    read.quality,
    {
      outcomeKey: `intercurso-plan.${p.shape}.${read.quality}`,
      stamp: read.quality === 'invalid' ? 'No cierra' : 'Plan armado',
      facts: [
        ...SLOTS.map((slot) => ({
          label: `Turno ${slot.label}`,
          value: ACTIVITIES.map(
            (activity) =>
              `${activity.label}: ${nameOf(taken.get(`${activity.id}-${slot.id}`))}`,
          ).join(' · '),
        })),
        { label: 'Acuerdos del grupo', value: `${String(read.team)} de 3` },
      ],
      ...(read.quality === 'invalid'
        ? {
            violatedConstraint:
              missing[0] !== undefined
                ? `Falta cubrir ${missing[0].activityId} en la ${missing[0].slotId}.`
                : 'Alguien quedó en dos actividades del mismo turno o en un turno en el que no está.',
          }
        : {}),
      consequence:
        read.quality === 'invalid'
          ? 'Con ese plan el Intercurso empieza y hay una cancha sin nadie.'
          : read.team === 3
            ? 'El plan cierra y nadie quedó afuera ni haciendo lo que no quería.'
            : 'El plan cierra, aunque alguien va a tener algo para decir después.',
    },
    {},
    [
      { flag: 'y2.intercurso.outcome', value: read.quality },
      ...(read.style === undefined
        ? []
        : [{ flag: 'y2.intercurso.strategy', value: read.style }]),
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
        : { estilo: { axis: read.style, amount: 6 } }),
    },
  })
}

export const planVariants = generatedSource({
  id: 'y2.intercurso-plan.slots',
  version: '1',
  schema: planSchema,
  size: PLAN_SPACE,
  generate: generatePlan,
  gates: planGates,
})

export const intercursoPlan = defineChallenge<PlanParams, PlanParams>({
  id: toChallengeId('y2.intercurso-plan'),
  family: toScenarioFamilyId('intercurso'),
  placement: 'anchor',
  variants: authoredVariantIds(planVariants.authored),
  variantSource: planVariants,
  interaction: 'assignment-board',
  stages: ['year-2'],
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
    primaryReasoningFamily: 'ALLOCATION',
    interactionEngine: 'allocate-constrain',
    pacingClass: 'MEDIUM',
    chronology: 50,
    eventCluster: 'intercurso',
  },
  scoring: {
    math: 'discrete-quality',
    team: ({ metrics: evidence }) => performanceFromRatio(evidence.efficiency),
    aura: 'none',
    rationale:
      'Math mide que el plan se pueda ejecutar: cobertura, disponibilidad y choques de turno. Equipo mide los acuerdos del grupo entre planes que ya cierran, así que un plan impecable puede dejar a alguien afuera y no cobra por eso dos veces.',
  },
  tools: ['notepad'],
  generate: ({ params }) => parameters(planSchema, params),
  verify: (p) =>
    p.crew.some((person) => person.available.includes(true))
      ? []
      : ['nadie está disponible en ningún turno'],
  narrate: () => ({
    title: 'El plan del Intercurso',
    setup:
      'Hay que cubrir las canchas en los dos turnos y no todos pueden estar todo el día.',
    goal: 'Armá el plan: que no falte nadie donde hace falta y que el grupo quede conforme.',
  }),
  present: (p) => ({
    kind: 'assignment-board',
    agents: CREW.map((person, index) => {
      const data = p.crew[index]
      const slots = SLOTS.filter((_, slot) => data?.available[slot] === true)
        .map((slot) => slot.label)
        .join(' y ')
      const prefers =
        ACTIVITIES.find((a) => a.id === data?.prefers)?.label ?? ''
      const avoids = ACTIVITIES.find((a) => a.id === data?.avoids)?.label ?? ''
      return {
        id: person.id,
        label: person.label,
        detail: `está ${slots || 'sin turnos'} · prefiere ${prefers} · evitaría ${avoids}`,
      }
    }),
    tasks: TASKS.map((task) => {
      const activity = ACTIVITIES.find((entry) => entry.id === task.activityId)
      const slot = SLOTS.find((entry) => entry.id === task.slotId)
      return {
        id: task.id,
        label: `${activity?.label ?? ''} · ${slot?.label ?? ''}`,
        detail: task.optional
          ? 'opcional: suma si queda gente'
          : 'hay que cubrirlo',
        ...(task.optional ? { optional: true } : {}),
      }
    }),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'assignment-board'
      ? evaluatePlan(p, answer.assignments)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un plan de asignación',
        }),
})
