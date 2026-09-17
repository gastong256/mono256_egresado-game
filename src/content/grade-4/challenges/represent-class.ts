/**
 * 4.º · Representar al curso (`y4.represent-class`).
 *
 * El consejo escolar pide una propuesta y el curso manda a alguien. Hay cinco
 * ideas sobre la mesa y tres límites escritos: la plata que hay, los minutos
 * que dura la reunión y la gente que entra en el lugar. La acción matemática es
 * decir cuáles se pueden sostener con esos límites.
 *
 * Después hay una segunda acción, que es otra cosa: cómo lo dice el curso. Esa
 * decisión no se evalúa con los números —se evalúa contra a quién afecta lo que
 * se propone— y vive en su propio campo de la respuesta. Clasificar bien nunca
 * concede Aura, y una postura afortunada nunca arregla una propuesta que no
 * entra: son dos evidencias distintas sobre la misma pantalla.
 *
 * Prestige no se otorga acá. Aparecer en esta oportunidad vale cero por sí
 * solo, y el logro de carrera que sí podría valer se implementa —una sola vez—
 * cuando se integre la carrera completa.
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
  type InteractionAnswer,
  type SolutionQuality,
} from '@/game'
import {
  at,
  candidateAxes,
  digit,
  generatedSource,
  mil,
  outcome,
  parameters,
  spaceOf,
} from '@/content/authoring'

export const PROPOSALS = [
  { id: 'torneo', label: 'Un torneo entre cursos' },
  { id: 'taller', label: 'Un taller abierto los viernes' },
  { id: 'mural', label: 'Un mural en el patio' },
  { id: 'radio', label: 'La radio del recreo' },
  { id: 'huerta', label: 'La huerta del fondo' },
] as const
export type ProposalId = (typeof PROPOSALS)[number]['id']

export const STANCES = [
  { id: 'del-curso', label: 'Lo pedimos como curso' },
  { id: 'propia', label: 'Lo presento como idea mía' },
  { id: 'consulta', label: 'Que lo decida la dirección' },
] as const

const proposal = z.strictObject({
  cost: z.number().int().min(0).max(200_000).multipleOf(500),
  minutes: z.number().int().min(5).max(120).multipleOf(5),
  people: z.number().int().min(5).max(300),
})
export const representSchema = z
  .strictObject({
    /** A quién afecta lo que el curso propone. Decide la acción pública. */
    stakes: z.enum(['todo-el-colegio', 'solo-el-curso']),
    budget: z.number().int().min(1000).max(200_000).multipleOf(500),
    minutes: z.number().int().min(10).max(120).multipleOf(5),
    capacity: z.number().int().min(10).max(300),
    proposals: z.tuple([proposal, proposal, proposal, proposal, proposal]),
  })
  .refine(
    (p) => p.proposals.length === PROPOSALS.length,
    'faltan propuestas sobre la mesa',
  )
export type RepresentParams = z.infer<typeof representSchema>

/** Si una propuesta entra en los tres límites escritos. */
export function fits(p: RepresentParams, index: number): boolean {
  const entry = p.proposals[index]
  return (
    entry !== undefined &&
    entry.cost <= p.budget &&
    entry.minutes <= p.minutes &&
    entry.people <= p.capacity
  )
}

/** Cuál de los tres límites la deja afuera, si alguno. */
export function blockedBy(
  p: RepresentParams,
  index: number,
): 'plata' | 'tiempo' | 'lugar' | undefined {
  const entry = p.proposals[index]
  if (entry === undefined) return undefined
  if (entry.cost > p.budget) return 'plata'
  if (entry.minutes > p.minutes) return 'tiempo'
  if (entry.people > p.capacity) return 'lugar'
  return undefined
}

/**
 * Qué tan expuesta queda una postura pública.
 *
 * Se mide contra a quién afecta la propuesta, que es un dato de la situación y
 * no depende de cómo se clasificó nada. Ése es el punto: son dos evidencias.
 */
export function stanceRisk(p: RepresentParams, stance: string): number {
  if (stance === 'consulta') return 0.4
  const shared = p.stakes === 'todo-el-colegio'
  // Cada situación tiene una forma de decirlo que no expone a nadie: hablar
  // como curso cuando la propuesta es de todos, y hablar por uno cuando es de
  // uno. Si ninguna llegara a cero, el techo de Aura sería inalcanzable.
  if (stance === 'del-curso') return shared ? 0 : 0.8
  return shared ? 0.8 : 0
}

export function auraPointsOf(p: RepresentParams, stance: string): number {
  const shared = p.stakes === 'todo-el-colegio'
  if (stance === 'consulta') return 0
  if (stance === 'del-curso') return shared ? 300 : -150
  return shared ? -150 : 250
}

export interface RepresentPlan {
  readonly entries: readonly ClassificationEntry[]
  readonly stance: string
  readonly quality: SolutionQuality
  readonly risk: number
}

export function classificationQuality(
  p: RepresentParams,
  entries: readonly ClassificationEntry[],
): SolutionQuality {
  let overreach = 0
  let missed = 0
  PROPOSALS.forEach((entry, index) => {
    const said = entries.find((item) => item.statementId === entry.id)?.labelId
    if (said === undefined) return
    const viable = fits(p, index)
    if (!viable && said === 'entra') overreach += 1
    if (viable && said === 'no-entra') missed += 1
  })
  // Llevar al consejo algo que no se puede sostener es el error que esta
  // pantalla existe para evitar; dejarse una propuesta viable afuera es más
  // barato, y por eso baja de nivel en vez de invalidar.
  return overreach > 0
    ? 'invalid'
    : missed === 0
      ? 'optimal'
      : missed === 1
        ? 'efficient'
        : 'functional'
}

/**
 * Oráculo independiente sobre clasificaciones y posturas.
 *
 * Recalcula la viabilidad por su cuenta y nunca llama al evaluador. Las dos
 * acciones se enumeran juntas justamente para que una filtración de una en la
 * otra aparezca acá como desacuerdo.
 */
export function representPlans(p: RepresentParams): readonly RepresentPlan[] {
  const plans: RepresentPlan[] = []
  const total = 2 ** PROPOSALS.length
  for (let mask = 0; mask < total; mask++) {
    const entries = PROPOSALS.map((entry, index) => ({
      statementId: entry.id,
      labelId: (mask & (1 << index)) === 0 ? 'no-entra' : 'entra',
    }))
    const quality = classificationQuality(p, entries)
    for (const stance of STANCES)
      plans.push({
        entries,
        stance: stance.id,
        quality,
        risk: stanceRisk(p, stance.id),
      })
  }
  return plans
}

const STAKES = ['todo-el-colegio', 'solo-el-curso'] as const
const BUDGETS = [12_000, 20_000, 30_000] as const
const MINUTES = [20, 30, 45] as const
const CAPACITIES = [40, 60, 90] as const
const COSTS = [
  [8000, 15_000, 25_000, 6000, 18_000],
  [22_000, 9000, 14_000, 28_000, 5000],
  [6000, 24_000, 11_000, 16_000, 32_000],
] as const
const DURATIONS = [
  [15, 35, 25, 10, 50],
  [40, 20, 15, 30, 25],
  [25, 15, 50, 20, 35],
] as const
const CROWDS = [
  [80, 35, 50, 25, 110],
  [30, 70, 100, 45, 55],
  [55, 95, 30, 65, 40],
] as const
const RADICES = [
  STAKES.length,
  BUDGETS.length,
  MINUTES.length,
  CAPACITIES.length,
  COSTS.length,
  DURATIONS.length,
  CROWDS.length,
]
export const REPRESENT_SPACE = spaceOf(RADICES)

export function generateRepresent(index: number): RepresentParams {
  const axes = candidateAxes(index, RADICES, 373)
  const costs = at(COSTS, digit(axes, 4))
  const durations = at(DURATIONS, digit(axes, 5))
  const crowds = at(CROWDS, digit(axes, 6))
  return representSchema.parse({
    stakes: at(STAKES, digit(axes, 0)),
    budget: at(BUDGETS, digit(axes, 1)),
    minutes: at(MINUTES, digit(axes, 2)),
    capacity: at(CAPACITIES, digit(axes, 3)),
    proposals: PROPOSALS.map((_, position) => ({
      cost: costs[position] ?? 10_000,
      minutes: durations[position] ?? 20,
      people: crowds[position] ?? 50,
    })),
  })
}

export function representGates(p: RepresentParams): readonly string[] {
  const issues: string[] = []
  // Witness del máximo de Aura: alguna postura tiene que dejar riesgo cero. Sin
  // eso, la variante tendría un techo competitivo inalcanzable y dos carreras
  // competirían con máximos distintos.
  if (!STANCES.some((stance) => stanceRisk(p, stance.id) === 0))
    issues.push('ninguna postura llega al máximo de Aura')
  const viable = PROPOSALS.filter((_, index) => fits(p, index)).length
  if (viable === 0) issues.push('ninguna propuesta entra en los límites')
  if (viable === PROPOSALS.length) issues.push('todas las propuestas entran')
  // Con una sola viable, marcar todas como «No entra» quedaba en el segundo
  // nivel: 75 por no llevar nada al consejo (MAT-007).
  if (viable < 2)
    issues.push('entra una sola propuesta: no hay nada que comparar')

  // Los tres límites tienen que decidir algo, o dos de ellos son decorado.
  const reasons = new Set(
    PROPOSALS.map((_, index) => blockedBy(p, index)).filter(
      (reason) => reason !== undefined,
    ),
  )
  if (reasons.size < 2)
    issues.push('un solo límite deja afuera a todas las que no entran')

  // LOCKED: la acción pública tiene su propia evidencia. Las posturas tienen
  // que separarse entre sí, o elegir no sería una decisión.
  const auras = new Set(STANCES.map((stance) => auraPointsOf(p, stance.id)))
  if (auras.size < 3) issues.push('dos posturas dejan exactamente lo mismo')

  // Y no puede depender de la clasificación: el mismo Aura para cualquier
  // clasificación es exactamente lo que impide el doble pago.
  const plans = representPlans(p)
  for (const stance of STANCES) {
    const risks = new Set(
      plans
        .filter((plan) => plan.stance === stance.id)
        .map((plan) => plan.risk),
    )
    if (risks.size !== 1)
      issues.push('la postura cambia según cómo se clasificó')
  }
  return issues
}

export function evaluateRepresent(
  p: RepresentParams,
  entries: readonly ClassificationEntry[],
  stance: string | undefined,
) {
  if (
    new Set(entries.map((entry) => entry.statementId)).size !==
      entries.length ||
    entries.some(
      (entry) =>
        !PROPOSALS.some((proposal) => proposal.id === entry.statementId) ||
        !['entra', 'no-entra'].includes(entry.labelId),
    ) ||
    stance === undefined ||
    !STANCES.some((option) => option.id === stance)
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'clasificación o postura fuera de contrato',
    })

  const quality = classificationQuality(p, entries)
  const risk = stanceRisk(p, stance)
  const auraPoints = auraPointsOf(p, stance)
  const wrong = PROPOSALS.map((entry, index) => ({ entry, index })).find(
    ({ entry, index }) =>
      !fits(p, index) &&
      entries.find((item) => item.statementId === entry.id)?.labelId ===
        'entra',
  )

  const base = outcome(
    quality,
    {
      outcomeKey: `represent-class.${p.stakes}.${quality}`,
      stamp: quality === 'invalid' ? 'No entra' : 'Llevada',
      facts: [
        { label: 'Plata', value: `$${mil(p.budget)}` },
        { label: 'Reunión', value: `${String(p.minutes)} min` },
        { label: 'Entran', value: `${String(p.capacity)} personas` },
        {
          label: 'Propuestas que entran',
          value: String(PROPOSALS.filter((_, index) => fits(p, index)).length),
        },
      ],
      ...(quality === 'invalid' && wrong !== undefined
        ? {
            violatedConstraint: `«${wrong.entry.label}» no entra: la deja afuera ${
              blockedBy(p, wrong.index) ?? 'algún límite'
            }.`,
          }
        : {}),
      consequence:
        quality === 'invalid'
          ? 'El curso llevó al consejo algo que no se puede sostener, y volvió sin nada.'
          : !entries.some((entry) => entry.labelId === 'entra')
            ? 'El curso no llevó ninguna propuesta al consejo, aunque había varias que se podían sostener.'
            : stance === 'del-curso'
              ? p.stakes === 'todo-el-colegio'
                ? 'El curso habló por algo que le importa a todo el colegio, y se notó.'
                : 'El curso pidió como curso algo que sólo le servía al curso.'
              : stance === 'propia'
                ? p.stakes === 'todo-el-colegio'
                  ? 'Te pusiste al frente de algo que era de todos.'
                  : 'Lo presentaste como tuyo, y era tuyo.'
                : 'El curso prefirió que decidiera la dirección.',
    },
    { aura: auraPoints },
    [
      { flag: 'y4.represent.outcome', value: quality },
      { flag: 'y4.represent.stance', value: stance },
    ],
  )
  return ok({ ...base, metrics: metrics({ ...base.metrics, risk }) })
}

export const representVariants = generatedSource({
  id: 'y4.represent-class.limits',
  version: '1',
  schema: representSchema,
  size: REPRESENT_SPACE,
  generate: generateRepresent,
  gates: representGates,
})

export const representClass = defineChallenge<RepresentParams, RepresentParams>(
  {
    id: toChallengeId('y4.represent-class'),
    family: toScenarioFamilyId('consejo-escolar'),
    // «special» es el rol que la composición agenda **en lugar de** una
    // oportunidad compatible: nunca agrega un beat ni techo de FairScore.
    placement: 'special',
    variants: authoredVariantIds(representVariants.authored),
    variantSource: representVariants,
    interaction: 'classification',
    stages: ['year-4'],
    categories: ['optimization-and-constraints', 'quantity'],
    baseDifficulty: 3,
    cognitive: {
      steps: 2,
      constraints: 3,
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
      aura: ({ metrics: evidence }) => performanceFromRatio(1 - evidence.risk),
      rationale:
        'Math mide si la propuesta se sostiene con la plata, el tiempo y el lugar que hay. Aura mide otra cosa y se lee de otro campo de la respuesta: cómo lo dice el curso frente a a quién afecta. Clasificar bien no concede Aura y una postura afortunada no arregla una propuesta que no entra. Prestige no se otorga acá: aparecer vale cero.',
    },
    tools: ['calculator', 'notepad'],
    generate: ({ params }) => parameters(representSchema, params),
    verify: (p) =>
      PROPOSALS.some((_, index) => fits(p, index))
        ? []
        : ['ninguna propuesta entra en los límites'],
    narrate: () => ({
      title: 'Representar al curso',
      setup:
        'El consejo escolar escucha propuestas y el curso manda a alguien con las ideas que juntó.',
      goal: 'Decidí cuáles se sostienen con lo que hay, y cómo las presenta el curso.',
    }),
    present: (p) => ({
      kind: 'classification',
      instructions:
        'Marcá cuáles entran en los tres límites. Después, decidí cómo lo dice el curso.',
      data: [
        { label: 'Plata', value: `$${mil(p.budget)}`, constraint: true },
        {
          label: 'Reunión',
          value: String(p.minutes),
          unit: 'minutos',
          constraint: true,
        },
        {
          label: 'Lugar',
          value: String(p.capacity),
          unit: 'personas',
          constraint: true,
        },
        {
          label: 'Afecta a',
          value:
            p.stakes === 'todo-el-colegio'
              ? 'todo el colegio'
              : 'sólo el curso',
          span: 2,
        },
      ],
      statements: PROPOSALS.map((entry, index) => {
        const data = p.proposals[index]
        return {
          id: entry.id,
          label: entry.label,
          detail: `$${mil(data?.cost ?? 0)} · ${String(data?.minutes ?? 0)} min · ${String(data?.people ?? 0)} personas`,
        }
      }),
      labels: [
        { id: 'entra', label: 'Entra en los límites' },
        { id: 'no-entra', label: 'No entra' },
      ],
      stance: {
        prompt: '¿Cómo lo presenta el curso?',
        options: STANCES.map((option) => ({
          id: option.id,
          label: option.label,
        })),
      },
    }),
    evaluate: (p, answer: InteractionAnswer) =>
      answer.kind === 'classification'
        ? evaluateRepresent(p, answer.entries, answer.stance)
        : err({
            kind: 'invalid-answer',
            detail: 'se esperaba una clasificación con postura',
          }),
  },
)
