/**
 * 5.º · El año que viene (`y5.next-step-options`).
 *
 * Cinco escenarios ya armados —no hay que construir ninguno— y tres datos que
 * los limitan: las horas libres que quedan por semana, cuánto viaje diario se
 * banca y el compromiso que ya existe y no se mueve. La acción matemática es
 * decir cuáles **entran** con esos datos.
 *
 * Esa es toda la evaluación. La pregunta de qué te gustaría hacer está en su
 * propio campo, no se puntúa nunca y no hay una respuesta correcta: estudiar,
 * trabajar, hacer un curso o tomarse un tiempo son opciones, no un ranking. Lo
 * único que hace esa elección es quedar registrada para el cierre.
 *
 * La distinción con la semana de 3.º es `LOCKED` y es de fondo: allá se
 * construye una semana, acá se comparan escenarios que ya vienen escritos.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type ClassificationEntry,
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
} from '@/content/authoring'
import { teamworkCallback } from '../../career-facts'
import { graded } from '../../grades'

export const SCENARIOS = [
  { id: 'facultad', label: 'Cursar en la facultad' },
  { id: 'terciario', label: 'Un terciario cerca' },
  { id: 'trabajo', label: 'Trabajo de media jornada' },
  { id: 'oficio', label: 'Un curso de oficio' },
  { id: 'mixto', label: 'Curso a la mañana y trabajo a la tarde' },
] as const
export type ScenarioId = (typeof SCENARIOS)[number]['id']

/** Los días de la semana que un escenario puede ocupar. */
export const DAYS = ['lun', 'mar', 'mié', 'jue', 'vie'] as const

const scenario = z.strictObject({
  /** Horas por semana que ocupa, con el viaje ya incluido. */
  hours: z.number().int().min(2).max(45),
  /** Minutos de viaje por día. */
  travel: z.number().int().min(0).max(180).multipleOf(5),
  /** Qué días ocupa, en el orden de la semana. */
  days: z.tuple([
    z.boolean(),
    z.boolean(),
    z.boolean(),
    z.boolean(),
    z.boolean(),
  ]),
})
export const nextStepSchema = z
  .strictObject({
    shape: z.enum(['horas-justas', 'viaje-largo', 'compromiso-fijo']),
    /** Horas libres por semana, viaje diario que se banca, y el día tomado. */
    freeHours: z.number().int().min(10).max(45),
    maxTravel: z.number().int().min(20).max(180).multipleOf(5),
    takenDay: z.number().int().min(0).max(4),
    scenarios: z.tuple([scenario, scenario, scenario, scenario, scenario]),
  })
  .refine(
    (p) => p.scenarios.some((entry) => entry.days.includes(true)),
    'ningún escenario ocupa un día',
  )
export type NextStepParams = z.infer<typeof nextStepSchema>

/** Si un escenario entra con las horas, el viaje y el día ya tomado. */
export function fitsScenario(p: NextStepParams, index: number): boolean {
  const entry = p.scenarios[index]
  return (
    entry !== undefined &&
    entry.hours <= p.freeHours &&
    entry.travel <= p.maxTravel &&
    entry.days[p.takenDay] !== true
  )
}

/** Cuál de los tres datos lo deja afuera, si alguno. */
export function blockedBy(
  p: NextStepParams,
  index: number,
): 'horas' | 'viaje' | 'dia' | undefined {
  const entry = p.scenarios[index]
  if (entry === undefined) return undefined
  if (entry.hours > p.freeHours) return 'horas'
  if (entry.travel > p.maxTravel) return 'viaje'
  if (entry.days[p.takenDay] === true) return 'dia'
  return undefined
}

export function nextStepQuality(
  p: NextStepParams,
  entries: readonly ClassificationEntry[],
): SolutionQuality {
  let overreach = 0
  let missed = 0
  SCENARIOS.forEach((entry, index) => {
    const said = entries.find((item) => item.statementId === entry.id)?.labelId
    if (said === undefined) return
    const viable = fitsScenario(p, index)
    if (!viable && said === 'entra') overreach += 1
    if (viable && said === 'no-entra') missed += 1
  })
  // Decir que entra algo que no entra es el error: el año que viene se arma
  // sobre eso. Dejarse uno afuera baja de nivel, no invalida.
  return overreach > 0
    ? 'invalid'
    : missed === 0
      ? 'optimal'
      : missed === 1
        ? 'efficient'
        : 'functional'
}

export interface NextStepPlan {
  readonly entries: readonly ClassificationEntry[]
  readonly quality: SolutionQuality
}

/** Oráculo independiente sobre todas las clasificaciones posibles. */
export function nextStepPlans(p: NextStepParams): readonly NextStepPlan[] {
  const plans: NextStepPlan[] = []
  const total = 2 ** SCENARIOS.length
  for (let mask = 0; mask < total; mask++) {
    const entries = SCENARIOS.map((entry, index) => ({
      statementId: entry.id,
      labelId: (mask & (1 << index)) === 0 ? 'no-entra' : 'entra',
    }))
    plans.push({ entries, quality: nextStepQuality(p, entries) })
  }
  return plans
}

const SHAPES = ['horas-justas', 'viaje-largo', 'compromiso-fijo'] as const
type Reason = 'horas' | 'viaje' | 'dia'
/** El motivo con el que abre cada forma: el dato que aprieta primero. */
const REASONS: readonly Reason[] = ['horas', 'viaje', 'dia']

/**
 * Qué escenarios entran en cada papel, en el orden de `SCENARIOS`: facultad,
 * terciario, trabajo, curso de oficio y mixto.
 *
 * Antes la facultad no entraba en ninguna variante del catálogo y el terciario
 * en tres de veinticuatro: el año de egreso le mostraba al jugador, una y otra
 * vez, que estudiar no le entraba en la semana (MAT-AJ-NEW-007). El ciclo deja a
 * cada escenario entrando entre la mitad y cinco de cada ocho papeles, a alguna
 * opción de estudio entrando en siete de cada ocho, y ninguna respuesta repetida
 * en más de uno de cada ocho.
 */
export const NEXT_STEP_ROLES: readonly (readonly boolean[])[] = [
  [true, true, false, false, false],
  [false, true, true, false, true],
  [true, false, true, true, false],
  [false, false, true, true, true],
  [true, true, false, true, false],
  [false, true, false, true, true],
  [true, false, false, true, true],
  [false, true, true, false, false],
]

/** Horas libres, viaje diario tolerable y el día ya tomado. */
const FREE_HOURS = [24, 30, 34] as const
const MAX_TRAVEL = [45, 60, 80] as const
/** Cuánto le falta a un escenario que entra, o le sobra a uno que no. */
const HOUR_SLACK = [2, 4, 6] as const
const TRAVEL_SLACK = [5, 10, 15] as const
/** Días de la semana que puede ocupar un escenario, como índices de `DAYS`. */
const DAY_PATTERNS: readonly (readonly number[])[] = [
  [0, 2, 4],
  [1, 3],
  [0, 1, 3, 4],
  [2, 3, 4],
  [0, 2],
  [1, 2, 3],
]
const RADICES = [
  FREE_HOURS.length,
  MAX_TRAVEL.length,
  DAYS.length,
  HOUR_SLACK.length,
  TRAVEL_SLACK.length,
  DAY_PATTERNS.length,
]
/** Direcciones distintas: el ciclo de papeles por el de motivos, por los ejes. */
export const NEXT_STEP_SPACE =
  NEXT_STEP_ROLES.length * REASONS.length * spaceOf(RADICES)

/** El papel de una dirección: qué entra y con qué motivo empiezan las exclusiones. */
export function nextStepRoleOf(index: number) {
  const cycle = Math.abs(index)
  return {
    viable:
      NEXT_STEP_ROLES[cycle % NEXT_STEP_ROLES.length] ?? NEXT_STEP_ROLES[0]!,
    offset: Math.floor(cycle / NEXT_STEP_ROLES.length) % REASONS.length,
  }
}

/**
 * Construcción por papel.
 *
 * Cada escenario que entra respeta las tres restricciones con algo de margen;
 * cada uno que no entra viola exactamente la que le toca —las exclusiones de
 * una variante rotan entre horas, viaje y día desde el motivo de su papel—, así
 * que ninguna opción queda afuera siempre por la misma razón.
 */
export function generateNextStep(index: number): NextStepParams {
  const role = nextStepRoleOf(index)
  const axes = candidateAxes(index, RADICES, 101)
  const freeHours = at(FREE_HOURS, digit(axes, 0))
  const maxTravel = at(MAX_TRAVEL, digit(axes, 1))
  const takenDay = digit(axes, 2) % DAYS.length
  const withDay = DAY_PATTERNS.filter((days) => days.includes(takenDay))
  const withoutDay = DAY_PATTERNS.filter((days) => !days.includes(takenDay))
  let excluded = 0
  const scenarios = SCENARIOS.map((_, position) => {
    const shift = digit(axes, 3) + position
    const hoursOk = freeHours - at(HOUR_SLACK, shift)
    const travelOk = Math.max(
      0,
      maxTravel - at(TRAVEL_SLACK, digit(axes, 4) + position),
    )
    const freeDays = at(
      withoutDay as [readonly number[], ...(readonly number[])[]],
      digit(axes, 5) + position,
    )
    const pattern = (days: readonly number[]) =>
      DAYS.map((_, day) => days.includes(day)) as [
        boolean,
        boolean,
        boolean,
        boolean,
        boolean,
      ]
    if (role.viable[position] === true)
      return { hours: hoursOk, travel: travelOk, days: pattern(freeDays) }
    const reason = REASONS[(role.offset + excluded) % REASONS.length] ?? 'horas'
    excluded += 1
    if (reason === 'horas')
      return {
        hours: freeHours + at(HOUR_SLACK, shift),
        travel: travelOk,
        days: pattern(freeDays),
      }
    if (reason === 'viaje')
      return {
        hours: hoursOk,
        travel: maxTravel + at(TRAVEL_SLACK, digit(axes, 4) + position),
        days: pattern(freeDays),
      }
    return {
      hours: hoursOk,
      travel: travelOk,
      days: pattern(
        at(
          withDay as [readonly number[], ...(readonly number[])[]],
          digit(axes, 5) + position,
        ),
      ),
    }
  })
  return nextStepSchema.parse({
    shape: at(SHAPES, role.offset),
    freeHours,
    maxTravel,
    takenDay,
    scenarios,
  })
}

export function nextStepGates(p: NextStepParams): readonly string[] {
  const issues: string[] = []
  const viable = SCENARIOS.filter((_, index) => fitsScenario(p, index)).length
  if (viable === 0) issues.push('ningún escenario entra')
  if (viable === SCENARIOS.length) issues.push('todos los escenarios entran')
  if (viable < 2) issues.push('entra uno solo: no hay nada que comparar')

  // Los tres datos tienen que decidir algo, o dos de ellos son decorado.
  const reasons = new Set(
    SCENARIOS.map((_, index) => blockedBy(p, index)).filter(
      (reason) => reason !== undefined,
    ),
  )
  if (reasons.size < 2)
    issues.push('un solo dato deja afuera a todos los que no entran')

  // Las horas de un escenario incluyen su viaje: tienen que alcanzar para el
  // viaje de todos sus días y al menos una hora de actividad por día.
  p.scenarios.forEach((entry, index) => {
    const days = entry.days.filter(Boolean).length
    if (entry.hours * 60 < days * (entry.travel + 60))
      issues.push(
        `las horas de ${SCENARIOS[index]?.id ?? ''} no alcanzan para su viaje`,
      )
  })
  return issues
}

export function evaluateNextStep(
  p: NextStepParams,
  entries: readonly ClassificationEntry[],
  preference: string | undefined,
) {
  if (
    new Set(entries.map((entry) => entry.statementId)).size !==
      entries.length ||
    entries.some(
      (entry) =>
        !SCENARIOS.some((scenario) => scenario.id === entry.statementId) ||
        !['entra', 'no-entra'].includes(entry.labelId),
    ) ||
    (preference !== undefined &&
      preference !== 'sin-decidir' &&
      !SCENARIOS.some((scenario) => scenario.id === preference))
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'clasificación o preferencia fuera de contrato',
    })

  const quality = nextStepQuality(p, entries)
  const wrong = SCENARIOS.map((entry, index) => ({ entry, index })).find(
    ({ entry, index }) =>
      !fitsScenario(p, index) &&
      entries.find((item) => item.statementId === entry.id)?.labelId ===
        'entra',
  )

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `next-step-options.${p.shape}.${quality}`,
        stamp: quality === 'invalid' ? 'No cierra' : 'Mirado',
        facts: [
          { label: 'Horas libres', value: `${String(p.freeHours)} por semana` },
          { label: 'Viaje', value: `hasta ${String(p.maxTravel)} min por día` },
          {
            label: 'Escenarios que entran',
            value: String(
              SCENARIOS.filter((_, index) => fitsScenario(p, index)).length,
            ),
          },
        ],
        ...(quality === 'invalid' && wrong !== undefined
          ? {
              violatedConstraint: `«${wrong.entry.label}» no entra: lo deja afuera ${
                blockedBy(p, wrong.index) === 'horas'
                  ? 'la cantidad de horas'
                  : blockedBy(p, wrong.index) === 'viaje'
                    ? 'el viaje diario'
                    : 'el día que ya está tomado'
              }.`,
            }
          : {}),
        consequence:
          quality === 'invalid'
            ? 'Contar con algo que no entra es lo que hace que después no entre nada.'
            : 'Con eso ya sabés entre qué podés elegir. Lo que elijas es tuyo.',
      },
      {},
      [
        { flag: 'y5.nextStep.outcome', value: quality },
        // La preferencia se registra para el cierre y nada más: no puntúa, no
        // mueve Estilo y no hay una opción mejor que otra.
        ...(preference === undefined
          ? []
          : [{ flag: 'y5.nextStep.preference', value: preference }]),
      ],
    ),
  )
}

export const nextStepVariants = generatedSource({
  id: 'y5.next-step-options.scenarios',
  version: '2',
  schema: nextStepSchema,
  size: NEXT_STEP_SPACE,
  generate: generateNextStep,
  gates: nextStepGates,
})

const nextStepOptionsDefinition = defineChallenge<
  NextStepParams,
  NextStepParams
>({
  id: toChallengeId('y5.next-step-options'),
  family: toScenarioFamilyId('despues-del-colegio'),
  placement: 'checkpoint',
  variants: authoredVariantIds(nextStepVariants.authored),
  variantSource: nextStepVariants,
  interaction: 'classification',
  stages: ['year-5'],
  categories: ['time-and-rates', 'optimization-and-constraints'],
  baseDifficulty: 2,
  cognitive: {
    steps: 1,
    constraints: 2,
    selection: 1,
    optimization: 0,
    uncertainty: 0,
    construction: 0,
  },
  composition: {
    primaryReasoningFamily: 'LOGIC_CLASSIFICATION',
    interactionEngine: 'choice-compare',
    pacingClass: 'MEDIUM',
    chronology: 60,
  },
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Sólo se evalúa la viabilidad: qué escenarios entran con las horas, el viaje y el día ya tomado. La preferencia personal no se puntúa de ninguna manera —no hay Equipo, Aura ni Estilo acá— y ninguna opción de vida vale más que otra.',
  },
  tools: ['calculator', 'notepad'],
  generate: ({ params }) => parameters(nextStepSchema, params),
  verify: (p) =>
    SCENARIOS.some((_, index) => fitsScenario(p, index))
      ? []
      : ['ningún escenario entra'],
  narrate: (_p, context) => ({
    title: 'El año que viene',
    setup: `${teamworkCallback(context.flags)}Alguien te pregunta qué vas a hacer el año que viene. Hay varias ideas dando vueltas y algunas no entran en la semana que tenés.`,
    goal: 'Marcá cuáles entran con lo que tenés. Después, si querés, decí cuál te gustaría.',
  }),
  present: (p) => ({
    kind: 'classification',
    instructions:
      'Marcá cuáles entran con tus horas, tu viaje y el día que ya está tomado. Las horas de cada opción ya incluyen el viaje.',
    data: [
      {
        label: 'Horas libres',
        value: String(p.freeHours),
        unit: 'por semana',
        constraint: true,
      },
      {
        label: 'Viaje que te bancás',
        value: String(p.maxTravel),
        unit: 'minutos por día',
        constraint: true,
      },
      {
        label: 'Ya tenés tomado',
        value: `los ${DAYS[p.takenDay] ?? 'mar'}`,
        span: 2,
      },
    ],
    statements: SCENARIOS.map((entry, index) => {
      const data = p.scenarios[index]
      const days = DAYS.filter((_, day) => data?.days[day] === true).join(' ')
      return {
        id: entry.id,
        label: entry.label,
        detail: `${String(data?.hours ?? 0)} h por semana con el viaje incluido · ${String(data?.travel ?? 0)} min de viaje por día · ${days || 'sin días fijos'}`,
      }
    }),
    labels: [
      { id: 'entra', label: 'Entra con lo que tengo' },
      { id: 'no-entra', label: 'No entra' },
    ],
    stance: {
      prompt: 'Y si pudieras elegir, ¿cuál te gustaría? (no se puntúa)',
      options: [
        ...SCENARIOS.map((entry) => ({ id: entry.id, label: entry.label })),
        { id: 'sin-decidir', label: 'Todavía no sé' },
      ],
    },
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'classification'
      ? evaluateNextStep(p, answer.entries, answer.stance)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba una clasificación de escenarios',
        }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const nextStepOptions = graded(nextStepOptionsDefinition)
