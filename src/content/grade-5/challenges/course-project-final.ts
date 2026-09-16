/**
 * 5.º · Proyecto del Curso V (`y5.course-project-final`).
 *
 * Faltan tres días para la muestra final y se cae algo: alguien no va a poder
 * estar. Las tareas ya estaban repartidas, así que el plan hay que rehacerlo
 * con lo que queda: cada tarea se mantiene con su dueño, se reparte entre los
 * demás o se recorta.
 *
 * Tres evidencias distintas salen de la misma pantalla y ninguna paga por otra:
 *
 * - **Math** es si el plan se puede ejecutar: que lo esencial siga estando y
 *   que a nadie le toquen más horas de las que tiene.
 * - **Equipo** son los acuerdos del grupo entre planes que ya cierran: cómo
 *   quedó repartida la carga y si se respetó lo que cada uno había pedido.
 * - **Aura** es otra decisión, en su propio campo: qué dice el curso sobre el
 *   cambio, y se mide contra si el cambio le cambia el día a alguien más.
 *
 * Estilo describe la forma de la reconstrucción y es señal de carrera: no
 * puntúa. Los callbacks pueden cambiar de quién se habla, nunca la matemática.
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
  type ClassificationEntry,
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

export const CREW = [
  { id: 'lu', label: 'Lu' },
  { id: 'mateo', label: 'Mateo' },
  { id: 'nadia', label: 'Nadia' },
  { id: 'octa', label: 'Octa' },
] as const
export type CrewId = (typeof CREW)[number]['id']

export const TASKS = [
  { id: 'muestra', label: 'Montar la muestra', essential: true },
  { id: 'video', label: 'Terminar el video', essential: true },
  { id: 'folletos', label: 'Imprimir los folletos', essential: false },
  { id: 'maqueta', label: 'Armar la maqueta', essential: true },
  { id: 'musica', label: 'Preparar la música', essential: false },
  { id: 'fotos', label: 'Colgar las fotos', essential: false },
] as const
export type TaskId = (typeof TASKS)[number]['id']

export const DISPOSITIONS = [
  { id: 'mantener', label: 'La hace quien la tenía' },
  { id: 'repartir', label: 'Se reparte entre los demás' },
  { id: 'recortar', label: 'Se recorta' },
] as const

export const STANCES = [
  { id: 'avisar', label: 'Avisamos hoy que cambia' },
  { id: 'resolver', label: 'Lo resolvemos y listo' },
  { id: 'pedir', label: 'Pedimos ayuda a otro curso' },
] as const

const crewId = z.enum(['lu', 'mateo', 'nadia', 'octa'])
const task = z.strictObject({
  /** Horas que lleva la tarea. */
  hours: z.number().int().min(1).max(12),
  owner: crewId,
})
export const finalSchema = z
  .strictObject({
    shape: z.enum(['se-cae-el-video', 'menos-horas', 'todo-esencial']),
    /** Quién no va a poder estar. Sus horas disponibles son cero. */
    missing: crewId,
    /** Horas que tiene cada uno en estos tres días, en el orden del curso. */
    available: z.tuple([
      z.number().int().min(0).max(20),
      z.number().int().min(0).max(20),
      z.number().int().min(0).max(20),
      z.number().int().min(0).max(20),
    ]),
    /** Quién pidió quedarse con su tarea. */
    keeps: crewId,
    /** Cuánta diferencia de carga tolera el grupo. */
    spread: z.number().int().min(1).max(10),
    /** Si el cambio le cambia el día a gente de afuera del curso. */
    visible: z.boolean(),
    tasks: z.tuple([task, task, task, task, task, task]),
  })
  .refine(
    (p) => p.available[CREW.findIndex((entry) => entry.id === p.missing)] === 0,
    'quien no está tiene horas disponibles',
  )
export type FinalParams = z.infer<typeof finalSchema>

const crewIndex = (id: string): number =>
  CREW.findIndex((entry) => entry.id === id)

export interface FinalOutcome {
  readonly quality: SolutionQuality
  /** Acuerdos del grupo cumplidos, 0 a 3. Sólo entre planes que cierran. */
  readonly team: number
  readonly style?: EstiloAxis
  readonly failure?: 'esencial' | 'horas' | 'ausente'
  readonly loads: readonly number[]
}

/**
 * La lectura completa de un plan rehecho.
 *
 * Math primero y solo: lo esencial sigue estando y a nadie le tocan más horas
 * de las que tiene. Equipo se lee después, sobre el mismo plan pero mirando
 * cómo quedó la carga; la calidad no se mueve por eso.
 */
export function readFinal(
  p: FinalParams,
  entries: readonly ClassificationEntry[],
): FinalOutcome {
  const loads = CREW.map(() => 0)
  const others = CREW.filter((person) => person.id !== p.missing)
  let cutEssential = false
  let onMissing = false
  let cutCount = 0
  let sharedCount = 0

  TASKS.forEach((task, position) => {
    const data = p.tasks[position]
    if (data === undefined) return
    const said = entries.find((entry) => entry.statementId === task.id)?.labelId
    const owner = crewIndex(data.owner)
    if (said === 'recortar') {
      cutCount += 1
      if (task.essential) cutEssential = true
      return
    }
    if (said === 'mantener') {
      if (data.owner === p.missing) onMissing = true
      loads[owner] = (loads[owner] ?? 0) + data.hours
      return
    }
    // Repartir: las horas se dividen entre los que sí están, y lo que no da
    // exacto lo absorbe el reparto hacia arriba.
    sharedCount += 1
    const each = Math.ceil(data.hours / others.length)
    for (const person of others) {
      const index = crewIndex(person.id)
      loads[index] = (loads[index] ?? 0) + each
    }
  })

  const over = CREW.some(
    (_, index) => (loads[index] ?? 0) > (p.available[index] ?? 0),
  )
  const failure = cutEssential
    ? ('esencial' as const)
    : onMissing
      ? ('ausente' as const)
      : over
        ? ('horas' as const)
        : undefined

  const extras = TASKS.filter((task) => !task.essential).length
  const keptExtras = extras - Math.min(cutCount, extras)

  // Escalera escrita: primero que el plan se pueda ejecutar, y después cuánto
  // de lo que no era imprescindible sobrevivió al cambio.
  const quality: SolutionQuality =
    failure !== undefined
      ? 'invalid'
      : keptExtras >= extras
        ? 'optimal'
        : keptExtras >= 1
          ? 'efficient'
          : 'functional'

  // Equipo: los mismos datos, leídos como reparto.
  const working = CREW.filter((person) => person.id !== p.missing)
  const busy = working.map((person) => loads[crewIndex(person.id)] ?? 0)
  const even = Math.max(...busy) - Math.min(...busy) <= p.spread
  const everyone = busy.every((load) => load > 0)
  const respected = TASKS.every((task, position) => {
    if (p.tasks[position]?.owner !== p.keeps) return true
    const said = entries.find((entry) => entry.statementId === task.id)?.labelId
    return said === 'mantener' || said === undefined
  })
  const team =
    quality === 'invalid'
      ? 0
      : [even, everyone, respected].filter(Boolean).length

  // Estilo describe cómo se rehízo el plan, no cuánto sobrevivió: recortar
  // para proteger lo esencial, repartir todo o cargar a una sola persona
  // pueden pasar con o sin extras adentro.
  const maxLoad = Math.max(...busy)
  const style: EstiloAxis | undefined =
    quality === 'invalid'
      ? undefined
      : sharedCount >= 3
        ? 'aplicado'
        : cutCount >= 2
          ? 'estratega'
          : 'improvisador'

  return {
    quality,
    team,
    loads,
    ...(style === undefined ? {} : { style }),
    ...(failure === undefined ? {} : { failure }),
    ...(maxLoad >= 0 ? {} : {}),
  }
}

export interface FinalPlan extends StyledPlan {
  readonly entries: readonly ClassificationEntry[]
  readonly team: number
}

/**
 * Oráculo independiente sobre todas las formas de rehacer el plan.
 *
 * Tres destinos por tarea y seis tareas: setecientas veintinueve maneras, que
 * se enumeran enteras. Las posturas no entran acá porque no cambian ni la
 * calidad ni el Equipo, y eso es justamente lo que el oráculo tiene que poder
 * mostrar.
 */
export function finalPlans(p: FinalParams): readonly FinalPlan[] {
  const plans: FinalPlan[] = []
  const total = DISPOSITIONS.length ** TASKS.length
  for (let mask = 0; mask < total; mask++) {
    let rest = mask
    const entries = TASKS.map((task) => {
      const disposition = DISPOSITIONS[rest % DISPOSITIONS.length]
      rest = Math.floor(rest / DISPOSITIONS.length)
      return {
        statementId: task.id,
        labelId: disposition?.id ?? 'mantener',
      }
    })
    const read = readFinal(p, entries)
    plans.push({
      entries,
      quality: read.quality,
      team: read.team,
      ...(read.style === undefined ? {} : { style: read.style }),
    })
  }
  return plans
}

/** Qué tan expuesta queda la comunicación, contra a quién le cambia el día. */
export function stanceRisk(p: FinalParams, stance: string): number {
  if (stance === 'pedir') return 0.5
  // Avisar cuando el cambio se nota afuera y resolverlo sin ruido cuando no:
  // las dos son la respuesta justa de su situación y las dos llegan a cero. Si
  // ninguna lo hiciera, el techo de Aura de esa variante sería inalcanzable.
  if (stance === 'avisar') return p.visible ? 0 : 0.6
  return p.visible ? 0.8 : 0
}

export function auraPointsOf(p: FinalParams, stance: string): number {
  if (stance === 'pedir') return 50
  if (stance === 'avisar') return p.visible ? 300 : -100
  return p.visible ? -200 : 200
}

const SHAPES = ['se-cae-el-video', 'menos-horas', 'todo-esencial'] as const
const HOURS = [
  [4, 6, 2, 5, 2, 3],
  [5, 4, 3, 6, 2, 2],
  [3, 7, 2, 4, 3, 2],
] as const
const OWNERS = [
  ['lu', 'mateo', 'nadia', 'octa', 'lu', 'mateo'],
  ['mateo', 'nadia', 'octa', 'lu', 'nadia', 'octa'],
  ['nadia', 'octa', 'lu', 'mateo', 'octa', 'lu'],
] as const
const AVAILABLE = [
  [12, 13, 11, 12],
  [14, 11, 13, 10],
  [11, 12, 12, 14],
] as const
const MISSING = ['lu', 'mateo', 'nadia', 'octa'] as const
const SPREADS = [3, 5] as const
const VISIBLE = [true, false] as const
const RADICES = [
  SHAPES.length,
  HOURS.length,
  OWNERS.length,
  AVAILABLE.length,
  MISSING.length,
  SPREADS.length,
  VISIBLE.length,
]
export const FINAL_SPACE = spaceOf(RADICES)

export function generateFinal(index: number): FinalParams {
  const axes = candidateAxes(index, RADICES, 373)
  const shape = at(SHAPES, digit(axes, 0))
  const hours = at(HOURS, digit(axes, 1))
  const owners = at(OWNERS, digit(axes, 2))
  const available = at(AVAILABLE, digit(axes, 3))
  const missing = at(MISSING, digit(axes, 4))
  const keeps = MISSING[(MISSING.indexOf(missing) + 1) % MISSING.length] ?? 'lu'
  // La forma dice qué aprieta: la tarea más pesada se queda sin dueño, el
  // grupo tiene menos horas, o casi todo es imprescindible.
  return finalSchema.parse({
    shape,
    missing,
    keeps,
    spread: at(SPREADS, digit(axes, 5)),
    visible: at(VISIBLE, digit(axes, 6)),
    available: CREW.map((person, index) =>
      person.id === missing
        ? 0
        : shape === 'menos-horas'
          ? Math.max(1, (available[index] ?? 12) - 3)
          : (available[index] ?? 12),
    ),
    tasks: TASKS.map((task, position) => ({
      hours:
        shape === 'se-cae-el-video' && position === 1
          ? (hours[position] ?? 4) + 2
          : (hours[position] ?? 4),
      owner:
        shape === 'se-cae-el-video' && position === 1
          ? missing
          : (owners[position] ?? 'lu'),
    })),
  })
}

export function finalGates(p: FinalParams): readonly string[] {
  const issues: string[] = []
  // Witness del máximo de Aura: alguna postura tiene que dejar riesgo cero. Sin
  // eso, la variante tendría un techo competitivo inalcanzable y dos carreras
  // competirían con máximos distintos.
  if (!STANCES.some((stance) => stanceRisk(p, stance.id) === 0))
    issues.push('ninguna postura llega al máximo de Aura')
  const plans = finalPlans(p)
  issues.push(...tierWitnessIssues(plans), ...styleGateIssues(plans))

  const valid = plans.filter((plan) => plan.quality !== 'invalid')
  if (valid.length === 0) issues.push('ningún plan cierra')

  // LOCKED: Math y Equipo son evidencias distintas.
  const teamsAmongOptimal = new Set(
    plans.filter((plan) => plan.quality === 'optimal').map((plan) => plan.team),
  )
  if (teamsAmongOptimal.size < 2)
    issues.push('todos los planes óptimos dejan el mismo Equipo')
  if (!valid.some((plan) => plan.team === 3))
    issues.push('ningún plan válido cumple los tres acuerdos')
  // Witness del máximo competitivo: tiene que existir una respuesta que sea
  // Math óptima **y** deje el Equipo máximo. Sin eso, una carrera que sacara
  // esta variante no podría llegar al tope de FairScore por más que jugara
  // perfecto, y dos carreras tendrían techos distintos.
  if (!plans.some((plan) => plan.quality === 'optimal' && plan.team === 3))
    issues.push('ninguna respuesta óptima deja el Equipo máximo')
  if (!valid.some((plan) => plan.team <= 1))
    issues.push('ningún plan válido descuida los acuerdos')

  // LOCKED: Aura es otra decisión. Las tres posturas tienen que separarse, y
  // ninguna puede depender de cómo se rehízo el plan.
  const auras = new Set(STANCES.map((stance) => auraPointsOf(p, stance.id)))
  if (auras.size < 3) issues.push('dos posturas dejan exactamente lo mismo')

  // La contingencia tiene que apretar: mantener todo como estaba no puede
  // seguir cerrando.
  const untouched = TASKS.map((task) => ({
    statementId: task.id,
    labelId: 'mantener',
  }))
  if (readFinal(p, untouched).quality !== 'invalid')
    issues.push('el plan de antes sigue funcionando')
  return issues
}

export function evaluateFinal(
  p: FinalParams,
  entries: readonly ClassificationEntry[],
  stance: string | undefined,
) {
  if (
    new Set(entries.map((entry) => entry.statementId)).size !==
      entries.length ||
    entries.some(
      (entry) =>
        !TASKS.some((task) => task.id === entry.statementId) ||
        !DISPOSITIONS.some((option) => option.id === entry.labelId),
    ) ||
    stance === undefined ||
    !STANCES.some((option) => option.id === stance)
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'plan o postura fuera de contrato',
    })

  const read = readFinal(p, entries)
  const risk = stanceRisk(p, stance)
  const auraPoints = auraPointsOf(p, stance)
  const missingLabel =
    CREW.find((person) => person.id === p.missing)?.label ?? ''

  const base = outcome(
    read.quality,
    {
      outcomeKey: `course-project-final.${p.shape}.${read.quality}`,
      stamp: read.quality === 'invalid' ? 'No llega' : 'Rehecho',
      facts: [
        ...CREW.filter((person) => person.id !== p.missing).map(
          (person, index) => ({
            label: person.label,
            value: `${String(read.loads[crewIndex(person.id)] ?? 0)} de ${String(p.available[crewIndex(person.id)] ?? 0)} h`,
            unit: index === 0 ? undefined : undefined,
          }),
        ),
        { label: 'Acuerdos del grupo', value: `${String(read.team)} de 3` },
      ].map((fact) => ({ label: fact.label, value: fact.value })),
      ...(read.quality === 'invalid'
        ? {
            violatedConstraint:
              read.failure === 'esencial'
                ? 'Recortaste algo sin lo cual la muestra no se puede hacer.'
                : read.failure === 'ausente'
                  ? `${missingLabel} no va a estar: su tarea no puede quedarse como estaba.`
                  : 'A alguien le tocaron más horas de las que tiene.',
          }
        : {}),
      consequence:
        read.quality === 'invalid'
          ? 'Con ese plan la muestra no llega.'
          : stance === 'avisar' && p.visible
            ? 'La muestra sale, y avisar a tiempo le ahorró el viaje a la gente que venía a esa hora.'
            : stance === 'resolver' && p.visible
              ? 'La muestra sale, pero alguien llegó a una hora que ya no era.'
              : stance === 'resolver'
                ? 'La muestra sale y el cambio no lo notó nadie de afuera.'
                : 'La muestra sale, con el otro curso enterado del cambio.',
    },
    {
      aura: auraPoints,
      ...(read.quality === 'invalid' ? {} : { equipo: read.team - 1 }),
      ...(read.style === undefined
        ? {}
        : { estilo: { axis: read.style, amount: 10 } }),
    },
    [
      { flag: 'y5.projectFinal.outcome', value: read.quality },
      { flag: 'y5.projectFinal.stance', value: stance },
      ...(read.style === undefined
        ? []
        : [{ flag: 'y5.projectFinal.strategy', value: read.style }]),
    ],
  )
  return ok({
    ...base,
    metrics: metrics({ ...base.metrics, efficiency: read.team / 3, risk }),
  })
}

export const finalVariants = generatedSource({
  id: 'y5.course-project-final.contingency',
  version: '1',
  schema: finalSchema,
  size: FINAL_SPACE,
  generate: generateFinal,
  gates: finalGates,
})

export const courseProjectFinal = defineChallenge<FinalParams, FinalParams>({
  id: toChallengeId('y5.course-project-final'),
  family: toScenarioFamilyId('course-project'),
  placement: 'anchor',
  variants: authoredVariantIds(finalVariants.authored),
  variantSource: finalVariants,
  interaction: 'classification',
  stages: ['year-5'],
  categories: ['time-and-rates', 'optimization-and-constraints'],
  baseDifficulty: 4,
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
    pacingClass: 'DEEP',
    chronology: 30,
    recurringArc: 'PROJECT',
  },
  scoring: {
    math: 'discrete-quality',
    team: ({ metrics: evidence }) => performanceFromRatio(evidence.efficiency),
    aura: ({ metrics: evidence }) => performanceFromRatio(1 - evidence.risk),
    rationale:
      'Math mide que el plan rehecho se pueda ejecutar: lo esencial sigue y nadie se pasa de horas. Equipo mide los acuerdos del grupo entre planes que ya cierran. Aura mide otra decisión, en otro campo de la respuesta: qué dice el curso sobre el cambio, contra si el cambio le cambia el día a alguien más. Ninguna paga por otra.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(finalSchema, params),
  verify: (p) =>
    p.available[CREW.findIndex((entry) => entry.id === p.missing)] === 0
      ? []
      : ['quien no está tiene horas disponibles'],
  narrate: () => ({
    title: 'Proyecto del Curso: la muestra final',
    setup:
      'Faltan tres días para la muestra y se cae algo. Las tareas ya estaban repartidas.',
    goal: 'Rehacé el plan con lo que queda, y decidí qué dice el curso sobre el cambio.',
  }),
  present: (p) => ({
    kind: 'classification',
    instructions:
      'Decidí qué pasa con cada tarea. Repartir una tarea la divide entre los que sí están.',
    data: [
      {
        label: 'No va a estar',
        value: CREW.find((person) => person.id === p.missing)?.label ?? '',
        constraint: true,
      },
      {
        label: 'Pidió quedarse con la suya',
        value: CREW.find((person) => person.id === p.keeps)?.label ?? '',
      },
      ...CREW.filter((person) => person.id !== p.missing).map((person) => ({
        label: person.label,
        value: String(p.available[crewIndex(person.id)] ?? 0),
        unit: 'horas en tres días',
      })),
      {
        label: 'El cambio',
        value: p.visible ? 'lo nota gente de afuera' : 'no se nota afuera',
        span: 2 as const,
      },
    ],
    statements: TASKS.map((task, index) => {
      const data = p.tasks[index]
      const owner = CREW.find((person) => person.id === data?.owner)
      return {
        id: task.id,
        label: task.label,
        detail: `${String(data?.hours ?? 0)} h · la tenía ${owner?.label ?? ''}${
          task.essential ? ' · sin esto no hay muestra' : ' · se puede recortar'
        }`,
      }
    }),
    labels: DISPOSITIONS.map((option) => ({
      id: option.id,
      label: option.label,
    })),
    stance: {
      prompt: '¿Qué dice el curso sobre el cambio?',
      options: STANCES.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    },
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'classification'
      ? evaluateFinal(p, answer.entries, answer.stance)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un plan con postura',
        }),
})
