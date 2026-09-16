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

export const SCENARIOS = [
  { id: 'facultad', label: 'Cursar en la facultad' },
  { id: 'terciario', label: 'Un terciario cerca' },
  { id: 'trabajo', label: 'Trabajo de media jornada' },
  { id: 'oficio', label: 'Un curso de oficio' },
  { id: 'mixto', label: 'Curso a la mañana y trabajo a la tarde' },
] as const
export type ScenarioId = (typeof SCENARIOS)[number]['id']

/** Los días de la semana que un escenario puede ocupar. */
export const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie'] as const

const scenario = z.strictObject({
  /** Horas por semana que ocupa. */
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
const HOURS = [
  [26, 16, 22, 8, 30],
  [22, 12, 26, 10, 24],
  [30, 18, 14, 6, 20],
] as const
const TRAVELS = [
  [90, 30, 45, 20, 60],
  [60, 25, 80, 15, 40],
  [120, 40, 30, 10, 70],
] as const
const DAY_SETS = [
  [
    [true, true, false, true, true],
    [true, false, true, false, true],
    [true, true, false, true, true],
    [false, true, false, true, false],
    [true, false, true, false, true],
  ],
  [
    [true, false, true, true, false],
    [false, true, true, false, true],
    [true, true, false, true, false],
    [true, false, false, true, true],
    [false, true, false, true, true],
  ],
] as const
const FREE_HOURS = [24, 30, 34] as const
const MAX_TRAVEL = [45, 60, 80] as const
const TAKEN = [1, 3] as const
const RADICES = [
  SHAPES.length,
  HOURS.length,
  TRAVELS.length,
  DAY_SETS.length,
  FREE_HOURS.length,
  MAX_TRAVEL.length,
  TAKEN.length,
]
export const NEXT_STEP_SPACE = spaceOf(RADICES)

export function generateNextStep(index: number): NextStepParams {
  const axes = candidateAxes(index, RADICES, 101)
  const shape = at(SHAPES, digit(axes, 0))
  const hours = at(HOURS, digit(axes, 1))
  const travels = at(TRAVELS, digit(axes, 2))
  const days = at(DAY_SETS, digit(axes, 3))
  // La forma dice qué dato aprieta primero, y cada una tiene su firma: menos
  // horas libres, menos viaje tolerado o el día tomado en el medio de la semana.
  return nextStepSchema.parse({
    shape,
    freeHours: shape === 'horas-justas' ? 20 : at(FREE_HOURS, digit(axes, 4)),
    maxTravel: shape === 'viaje-largo' ? 35 : at(MAX_TRAVEL, digit(axes, 5)),
    takenDay: shape === 'compromiso-fijo' ? 2 : at(TAKEN, digit(axes, 6)),
    scenarios: SCENARIOS.map((_, position) => ({
      hours: hours[position] ?? 20,
      travel: travels[position] ?? 40,
      days: [...(days[position] ?? [true, true, true, true, true])],
    })),
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
  version: '1',
  schema: nextStepSchema,
  size: NEXT_STEP_SPACE,
  generate: generateNextStep,
  gates: nextStepGates,
})

export const nextStepOptions = defineChallenge<NextStepParams, NextStepParams>({
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
      'Marcá cuáles entran con tus horas, tu viaje y el día que ya está tomado.',
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
        detail: `${String(data?.hours ?? 0)} h por semana · ${String(data?.travel ?? 0)} min de viaje · ${days || 'sin días fijos'}`,
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
