/**
 * 1.º · Proyecto del Curso I: la primera expo (`y1.course-project-expo`).
 *
 * Un problema chico de asignación. Math pregunta si el plan funciona: tareas
 * esenciales cubiertas, horas de cada persona, fases, roles y una dependencia
 * real —presenta quien investigó o construyó, porque tiene que saber qué
 * explica—. La robustez del óptimo es de contingencia: en la fase de la
 * presentación queda libre alguien que también podría presentar.
 *
 * Equipo mide otra cosa, entre planes ya factibles: que todos participen, que
 * se respete a quien se ofreció para la tarea ingrata y a quien pidió presentar.
 * Nunca lee horas ni calidad Math. Estilo describe cómo se distribuyó el
 * trabajo —reserva, especialización o rotación— y no aporta competencia.
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
  grade1StylePolicy,
  outcome,
  parameters,
  semanticId,
  spaceOf,
  styleGateIssues,
  tierWitnessIssues,
  type StyledPlan,
} from '../authoring'
import { graded } from '../../grades'

const ROLES = ['production', 'voice', 'setup'] as const
type Role = (typeof ROLES)[number]
const ROLE_LABEL: Readonly<Record<Role, string>> = {
  production: 'producción',
  voice: 'presentación',
  setup: 'montaje',
}
const TASK_IDS = ['research', 'build', 'visual', 'present', 'setup'] as const
type TaskId = (typeof TASK_IDS)[number]
export const EXPO_TASK_LABEL: Readonly<Record<TaskId, string>> = {
  research: 'Investigar',
  build: 'Construir la maqueta',
  visual: 'Apoyo visual',
  present: 'Presentar',
  setup: 'Montar y ordenar',
}
/** Presenting needs to know the project: whoever researched or built it. */
const KNOWLEDGE: readonly TaskId[] = ['research', 'build']

const phase = z.number().int().min(1).max(3)
const memberSchema = z.strictObject({
  id: semanticId,
  name: z.string().min(1).max(16),
  hours: z.number().int().min(2).max(7),
  phases: z.array(phase).min(1).max(3),
  roles: z.array(z.enum(ROLES)).min(1).max(3),
})
const taskSchema = z.strictObject({
  id: z.enum(TASK_IDS),
  hours: z.number().int().min(1).max(3),
  phase,
  role: z.enum(ROLES),
  optional: z.boolean(),
})
export const expoSchema = z
  .strictObject({
    shape: z.enum(['open-roles', 'late-arrival', 'role-gap', 'tight-hours']),
    members: z.tuple([memberSchema, memberSchema, memberSchema]),
    tasks: z.tuple([
      taskSchema,
      taskSchema,
      taskSchema,
      taskSchema,
      taskSchema,
    ]),
    /** Offered to take «Montar y ordenar», the unglamorous task. */
    volunteer: semanticId,
    /** Asked to present this time. */
    requester: semanticId,
  })
  .refine(
    (p) => p.tasks.map((task) => task.id).join() === TASK_IDS.join(),
    'tareas fuera del orden autorado',
  )
  .refine(
    (p) => new Set(p.members.map((member) => member.id)).size === 3,
    'personas repetidas',
  )
  .refine(
    (p) =>
      p.volunteer !== p.requester &&
      p.members.some((member) => member.id === p.volunteer) &&
      p.members.some((member) => member.id === p.requester),
    'pedidos sociales sin persona o repetidos',
  )
export type ExpoParams = z.infer<typeof expoSchema>

const SHAPES = [
  'open-roles',
  'late-arrival',
  'role-gap',
  'tight-hours',
] as const
const CAPACITIES = [
  [4, 4, 4],
  [5, 4, 3],
  [3, 5, 4],
  [4, 3, 5],
  [5, 5, 3],
  [3, 4, 5],
] as const
const NAMES = [
  ['Alex', 'Dani', 'Sam'],
  ['Juli', 'Ari', 'Cami'],
  ['Maru', 'Noa', 'Eli'],
  ['Lu', 'Sasha', 'Fran'],
] as const
const SOCIAL = [
  [0, 1],
  [0, 2],
  [1, 0],
  [1, 2],
  [2, 0],
  [2, 1],
] as const
const RADICES = [SHAPES.length, CAPACITIES.length, NAMES.length, SOCIAL.length]
export const EXPO_SPACE = spaceOf(RADICES)

export function generateExpo(index: number): ExpoParams {
  const axes = candidateAxes(index, RADICES, 385)
  const shape = at(SHAPES, digit(axes, 0))
  const hours = at(CAPACITIES, digit(axes, 1))
  const names = at(NAMES, digit(axes, 2))
  const [volunteer, requester] = at(SOCIAL, digit(axes, 3))
  const all = [...ROLES]
  const members = names.map((name, i) => ({
    id: name.toLowerCase(),
    name,
    hours: hours[i] ?? 4,
    phases: shape === 'late-arrival' && i === 1 ? [2, 3] : [1, 2, 3],
    roles:
      shape === 'role-gap' && i === 0
        ? ['voice', 'setup']
        : shape === 'role-gap' && i === 2
          ? ['production', 'setup']
          : all,
  }))
  return expoSchema.parse({
    shape,
    members,
    tasks: [
      {
        id: 'research',
        hours: 2,
        phase: 1,
        role: 'production',
        optional: false,
      },
      {
        id: 'build',
        hours: shape === 'tight-hours' ? 3 : 2,
        phase: 2,
        role: 'production',
        optional: false,
      },
      { id: 'visual', hours: 1, phase: 2, role: 'production', optional: true },
      { id: 'present', hours: 1, phase: 3, role: 'voice', optional: false },
      { id: 'setup', hours: 1, phase: 3, role: 'setup', optional: false },
    ],
    volunteer: members[volunteer]?.id ?? 'alex',
    requester: members[requester]?.id ?? 'dani',
  })
}

/** Everything the evaluator reads from one assignment, before naming a tier. */
interface ExpoAudit {
  readonly violations: readonly string[]
  readonly loads: readonly { readonly id: string; readonly load: number }[]
  readonly visual: boolean
  readonly backup: string | undefined
  readonly everyone: boolean
  readonly volunteerRespected: boolean
  readonly requestRespected: boolean
  readonly centralized: boolean
  readonly style: EstiloAxis
}

function audit(
  p: ExpoParams,
  assignments: readonly AgentAssignment[],
): ExpoAudit {
  const holder = (taskId: TaskId) =>
    assignments.find((entry) => entry.taskId === taskId)?.agentId
  const violations: string[] = []
  const loads = p.members.map((member) => {
    const mine = p.tasks.filter((task) => holder(task.id) === member.id)
    const load = mine.reduce((sum, task) => sum + task.hours, 0)
    if (load > member.hours)
      violations.push(
        `${member.name}: ${String(load)} h de tareas y tiene ${String(member.hours)} h.`,
      )
    for (const task of mine) {
      if (!member.roles.includes(task.role))
        violations.push(
          `${member.name} no hace ${ROLE_LABEL[task.role]}: no puede ${EXPO_TASK_LABEL[task.id].toLowerCase()}.`,
        )
      if (!member.phases.includes(task.phase))
        violations.push(
          `${member.name} no está en la fase ${String(task.phase)}.`,
        )
    }
    for (const phaseNumber of [1, 2, 3])
      if (mine.filter((task) => task.phase === phaseNumber).length > 1)
        violations.push(
          `${member.name} tiene dos tareas en la fase ${String(phaseNumber)}.`,
        )
    return { member, mine, load }
  })
  for (const task of p.tasks)
    if (!task.optional && holder(task.id) === undefined)
      violations.push(`Falta ${EXPO_TASK_LABEL[task.id]}.`)

  const presenter = holder('present')
  const knows = (id: string | undefined) =>
    id !== undefined && KNOWLEDGE.some((taskId) => holder(taskId) === id)
  if (presenter !== undefined && !knows(presenter))
    violations.push('Quien presenta tiene que haber investigado o construido.')

  const presentTask = p.tasks[3]
  const backup = loads.find(
    ({ member, mine, load }) =>
      member.id !== presenter &&
      !mine.some((task) => task.phase === presentTask.phase) &&
      member.roles.includes('voice') &&
      member.phases.includes(presentTask.phase) &&
      knows(member.id) &&
      member.hours - load >= presentTask.hours,
  )?.member.name

  const reserve = loads.every(({ member, load }) => member.hours - load >= 1)
  const research = holder('research')
  const style: EstiloAxis = reserve
    ? 'aplicado'
    : research !== undefined && research === holder('build')
      ? 'estratega'
      : 'improvisador'

  return {
    violations,
    loads: loads.map(({ member, load }) => ({ id: member.id, load })),
    visual: holder('visual') !== undefined,
    backup,
    everyone: loads.every(({ mine }) => mine.length > 0),
    volunteerRespected: holder('setup') === p.volunteer,
    requestRespected: presenter === p.requester,
    centralized: loads.some(({ mine }) => mine.length >= 3),
    style,
  }
}

function qualityOf(result: ExpoAudit): SolutionQuality {
  if (result.violations.length > 0) return 'invalid'
  if (!result.visual) return 'functional'
  return result.backup === undefined ? 'efficient' : 'optimal'
}

/** Team evidence among feasible plans: participation and two explicit requests. */
function agreementsOf(result: ExpoAudit): number {
  return result.violations.length > 0
    ? 0
    : Number(result.everyone) +
        Number(result.volunteerRespected) +
        Number(result.requestRespected)
}

export interface ExpoPlan extends StyledPlan {
  readonly assignments: readonly AgentAssignment[]
  readonly team: number
}

/**
 * Independent exhaustive oracle: every task to nobody or one of three people.
 *
 * Bitmasks per phase and its own spelling of each rule; it shares no code
 * with the evaluator, so the two can disagree when one of them drifts.
 */
export function expoPlans(p: ExpoParams): readonly ExpoPlan[] {
  const plans: ExpoPlan[] = []
  for (let code = 0; code < 4 ** p.tasks.length; code++) {
    const who = p.tasks.map((_, i) => (Math.floor(code / 4 ** i) % 4) - 1)
    const hours = [0, 0, 0]
    const phaseMask = [0, 0, 0]
    const count = [0, 0, 0]
    let ok = true
    for (const [i, task] of p.tasks.entries()) {
      const m = who[i] ?? -1
      const member = p.members[m]
      if (member === undefined) {
        if (!task.optional) ok = false
        continue
      }
      const bit = 1 << task.phase
      if ((phaseMask[m] ?? 0) & bit) ok = false
      phaseMask[m] = (phaseMask[m] ?? 0) | bit
      hours[m] = (hours[m] ?? 0) + task.hours
      count[m] = (count[m] ?? 0) + 1
      if (
        !member.roles.includes(task.role) ||
        !member.phases.includes(task.phase)
      )
        ok = false
    }
    for (let m = 0; m < 3; m++)
      if ((hours[m] ?? 0) > (p.members[m]?.hours ?? 0)) ok = false
    const presenter = who[3] ?? -1
    const informed = (m: number) => m >= 0 && (who[0] === m || who[1] === m)
    if (presenter >= 0 && !informed(presenter)) ok = false
    const assignments = p.tasks.flatMap((task, i) => {
      const member = p.members[who[i] ?? -1]
      return member === undefined
        ? []
        : [{ taskId: task.id, agentId: member.id }]
    })
    if (!ok) {
      plans.push({ assignments, quality: 'invalid', team: 0 })
      continue
    }
    const backup = [0, 1, 2].some(
      (m) =>
        m !== presenter &&
        ((phaseMask[m] ?? 0) & (1 << 3)) === 0 &&
        (p.members[m]?.roles.includes('voice') ?? false) &&
        (p.members[m]?.phases.includes(3) ?? false) &&
        informed(m) &&
        (p.members[m]?.hours ?? 0) - (hours[m] ?? 0) >= 1,
    )
    const quality: SolutionQuality =
      (who[2] ?? -1) < 0 ? 'functional' : backup ? 'optimal' : 'efficient'
    const team =
      (count.every((n) => n > 0) ? 1 : 0) +
      (p.members[who[4] ?? -1]?.id === p.volunteer ? 1 : 0) +
      (p.members[presenter]?.id === p.requester ? 1 : 0)
    const reserve = [0, 1, 2].every(
      (m) => (p.members[m]?.hours ?? 0) - (hours[m] ?? 0) > 0,
    )
    const style: EstiloAxis = reserve
      ? 'aplicado'
      : who[0] === who[1]
        ? 'estratega'
        : 'improvisador'
    plans.push({ assignments, quality, team, style })
  }
  return plans
}

export function expoGates(p: ExpoParams): readonly string[] {
  const plans = expoPlans(p)
  const issues = [...tierWitnessIssues(plans), ...styleGateIssues(plans)]
  const optimal = plans.filter((plan) => plan.quality === 'optimal')
  if (optimal.length < 2) issues.push('una sola asignación óptima')
  if (!optimal.some((plan) => plan.team === 3))
    issues.push('Math y Equipo máximos no son simultáneamente alcanzables')
  if (new Set(optimal.map((plan) => plan.team)).size < 2)
    issues.push('Equipo repite la factibilidad de Math entre planes óptimos')
  if (
    !plans.some(
      (plan) =>
        plan.quality !== 'optimal' &&
        plan.quality !== 'invalid' &&
        plan.team === 3,
    )
  )
    issues.push('Equipo máximo sólo aparece con Math máximo')

  // Intrinsic Math Gate: each quantitative rule removes plans that the others allow.
  const violationsOf = (plan: ExpoPlan) => audit(p, plan.assignments).violations
  const onlyBy = (pattern: RegExp) =>
    plans.some((plan) => {
      const found = violationsOf(plan)
      return found.length > 0 && found.every((text) => pattern.test(text))
    })
  if (!onlyBy(/h de tareas/u))
    issues.push('las horas no descartan ningún plan por sí solas')
  if (!onlyBy(/investigado o construido/u))
    issues.push('la dependencia de presentar no descarta ningún plan')
  return issues
}

function verifyExpo(p: ExpoParams): readonly string[] {
  return p.members.some((member) => member.roles.includes('voice'))
    ? []
    : ['nadie puede presentar']
}

export function evaluateExpo(
  p: ExpoParams,
  assignments: readonly AgentAssignment[],
) {
  if (
    new Set(assignments.map((entry) => entry.taskId)).size !==
      assignments.length ||
    assignments.some(
      (entry) =>
        !p.tasks.some((task) => task.id === entry.taskId) ||
        !p.members.some((member) => member.id === entry.agentId),
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'asignación duplicada o desconocida',
    })

  const result = audit(p, assignments)
  const quality = qualityOf(result)
  const agreements = agreementsOf(result)
  const valid = quality !== 'invalid'
  const nameOf = (id: string) =>
    p.members.find((member) => member.id === id)?.name ?? id
  const presenterName = nameOf(
    assignments.find((entry) => entry.taskId === 'present')?.agentId ?? '',
  )

  const teamSentence = !valid
    ? ''
    : [
        result.everyone
          ? 'Participa todo el grupo.'
          : 'Alguien quedó afuera del trabajo.',
        result.volunteerRespected
          ? `${nameOf(p.volunteer)} monta, como se había ofrecido.`
          : `${nameOf(p.volunteer)} se había ofrecido para montar y lo hace otra persona.`,
        result.requestRespected
          ? `${nameOf(p.requester)} presenta, como pidió.`
          : `${nameOf(p.requester)} había pedido presentar.`,
      ].join(' ')

  const base = outcome(
    quality,
    {
      outcomeKey: `expo.${quality}`,
      stamp: valid ? 'Expo en marcha' : 'Reparto pendiente',
      facts: [
        ...p.members.map((member) => {
          const tasks = p.tasks
            .filter((task) =>
              assignments.some(
                (entry) =>
                  entry.taskId === task.id && entry.agentId === member.id,
              ),
            )
            .map((task) => EXPO_TASK_LABEL[task.id])
          const load =
            result.loads.find((entry) => entry.id === member.id)?.load ?? 0
          return {
            label: member.name,
            value: `${tasks.length === 0 ? 'sin tareas' : tasks.join(' + ')} · ${String(load)} de ${String(member.hours)} h`,
          }
        }),
        {
          label: 'Apoyo visual',
          value: result.visual ? 'incluido' : 'quedó afuera',
        },
        {
          label: 'Si falta quien presenta',
          value:
            result.backup === undefined
              ? 'nadie libre puede reemplazar'
              : `${result.backup} puede reemplazar`,
        },
        {
          label: 'Acuerdos del grupo',
          value: `${String(agreements)} de 3`,
        },
      ],
      ...(valid ? {} : { violatedConstraint: result.violations.join(' ') }),
      consequence: !valid
        ? 'Así la expo no se sostiene: el grupo tiene que rearmar el reparto antes de empezar.'
        : `${
            quality === 'functional'
              ? 'La expo sale sin el apoyo visual: el stand queda más pobre, pero se presenta.'
              : quality === 'efficient'
                ? `La expo está completa, pero si ${presenterName} falta ese día, nadie libre puede presentar.`
                : `Expo completa y con plan B: si hace falta, ${result.backup ?? ''} puede presentar.`
          } ${teamSentence}`,
    },
    {
      // La nota la pone la regla de contenido (`graded`, 10/8/6/4 por
      // calidad), la misma para toda situación ordinaria de la carrera.
      equipo: valid ? ([-1, 1, 2, 4][agreements] ?? 0) : -2,
      ...(valid
        ? { estilo: { axis: result.style, amount: grade1StylePolicy.evidence } }
        : {}),
    },
    [
      { flag: 'y1.project.outcome', value: quality },
      {
        flag: 'y1.project.everyone-participated',
        value: valid && result.everyone,
      },
      {
        flag: 'y1.project.volunteer-respected',
        value: valid && result.volunteerRespected,
      },
      {
        flag: 'y1.project.request-respected',
        value: valid && result.requestRespected,
      },
      { flag: 'y1.project.centralized', value: result.centralized },
      {
        flag: 'y1.project.backup-presenter',
        value: result.backup !== undefined && valid,
      },
      ...(valid ? [{ flag: 'y1.project.strategy', value: result.style }] : []),
    ],
  )
  // Team reads participation opportunities, never hours or the Math tier.
  return ok({
    ...base,
    metrics: metrics({ ...base.metrics, efficiency: agreements / 3 }),
  })
}

export const expoVariants = generatedSource({
  id: 'y1.expo.assignments',
  version: '1',
  schema: expoSchema,
  size: EXPO_SPACE,
  generate: generateExpo,
  gates: expoGates,
})

function roleList(roles: readonly Role[]): string {
  return roles.map((role) => ROLE_LABEL[role]).join(', ')
}

function callback(flags: Readonly<Record<string, boolean | number | string>>) {
  if (flags['g7.grupoOrganizado'] === true)
    return '«En séptimo el reparto salió bien; veamos si lo repetimos», dice alguien del grupo. '
  if (flags['g7.grupoCubierto'] === true)
    return 'En séptimo el trabajo salió, aunque alguien terminó haciendo de más. '
  if (flags['g7.grupoDesarmado'] === true)
    return 'El grupo se acuerda del trabajo de séptimo: esta vez quieren hablar del reparto antes de arrancar. '
  return ''
}

const courseProjectExpoDefinition = defineChallenge<ExpoParams, ExpoParams>({
  id: toChallengeId('y1.course-project-expo'),
  family: toScenarioFamilyId('course-project'),
  placement: 'anchor',
  variants: authoredVariantIds(expoVariants.authored),
  variantSource: expoVariants,
  interaction: 'assignment-board',
  stages: ['year-1'],
  categories: ['optimization-and-constraints', 'quantity'],
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
    recurringArc: 'PROJECT',
    chronology: 20,
  },
  scoring: {
    math: 'discrete-quality',
    team: ({ metrics: evidence }) => performanceFromRatio(evidence.efficiency),
    aura: 'none',
    rationale:
      'Math mide tareas esenciales, horas, fases, roles, la dependencia de presentar y el plan de contingencia. Equipo mide participación, el ofrecimiento para montar y el pedido de presentar: no lee horas ni calidad Math.',
  },
  tools: ['notepad'],
  generate: ({ params }) => parameters(expoSchema, params),
  verify: verifyExpo,
  narrate: (p, { flags }) => {
    const [a, b, c] = p.members
    const name = (id: string) =>
      p.members.find((member) => member.id === id)?.name ?? id
    return {
      title: 'La primera expo',
      setup: `${callback(flags)}El Proyecto del Curso llega a su exposición. ${a.name}, ${b.name} y ${c.name} se reparten lo que hay que hacer antes, durante y al cierre.`,
      goal: `Asigná las tareas sin pasarte de las horas de nadie y respetando fases y roles; presenta alguien que haya investigado o construido. Mejor si suman el apoyo visual y, en la fase 3, queda libre alguien que también podría presentar. ${name(p.volunteer)} se ofreció a montar y ordenar; ${name(p.requester)} pidió presentar.`,
    }
  },
  present: (p) => ({
    kind: 'assignment-board',
    agents: p.members.map((member) => ({
      id: member.id,
      label: member.name,
      detail: `${String(member.hours)} h · fases ${member.phases.join(', ')} · ${roleList(member.roles)}`,
    })),
    tasks: p.tasks.map((task) => ({
      id: task.id,
      label: EXPO_TASK_LABEL[task.id],
      optional: task.optional,
      detail: `${String(task.hours)} h · fase ${String(task.phase)} · ${ROLE_LABEL[task.role]}${task.id === 'present' ? ' · quien investigó o construyó' : ''}${task.optional ? ' · opcional' : ''}`,
    })),
  }),
  evaluate: (p, answer: InteractionAnswer) =>
    answer.kind === 'assignment-board'
      ? evaluateExpo(p, answer.assignments)
      : err({
          kind: 'invalid-answer',
          detail: 'se esperaba un reparto de tareas',
        }),
})

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const courseProjectExpo = graded(courseProjectExpoDefinition)
