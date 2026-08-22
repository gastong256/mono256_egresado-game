/**
 * 7.º grado — el trabajo grupal.
 *
 * Situación: hay que repartir las cuatro partes del trabajo entre cuatro
 * personas, cada una con las horas que tiene libres y con lo que se le da mejor.
 *
 * La matemática es asignación con restricciones: horas disponibles contra horas
 * que pide cada tarea, y afinidad para desempatar. No hay una única respuesta
 * correcta; hay repartos que funcionan y repartos que aprovechan mejor al grupo.
 *
 * El óptimo se calcula recorriendo todas las asignaciones posibles. Con cuatro
 * personas y cuatro tareas son 24 combinaciones, así que es exacto y barato.
 */

import {
  defineChallenge,
  err,
  metrics,
  ok,
  toChallengeId,
  type AgentAssignment,
  type ChallengeDefinition,
  type ChallengeEvaluation,
  type EngineRejection,
  type InteractionAnswer,
  type Result,
} from '@/game'

interface Task {
  readonly id: string
  readonly label: string
  readonly hours: number
}

interface Member {
  readonly id: string
  readonly name: string
  readonly hoursFree: number
  /** Afinidad por tarea, de 1 a 3 estrellas. */
  readonly skill: Readonly<Record<string, number>>
}

interface GroupModel {
  readonly tasks: readonly Task[]
  readonly members: readonly Member[]
  readonly bestSkill: number
}

const TASKS: readonly Task[] = [
  { id: 'investigacion', label: 'Investigación', hours: 5 },
  { id: 'diseno', label: 'Diseño', hours: 3 },
  { id: 'presentacion', label: 'Presentación', hours: 2 },
  { id: 'maqueta', label: 'Maqueta', hours: 6 },
]

/**
 * Dos repartos autorados del grupo. En los dos existe al menos una asignación
 * que cubre todas las tareas sin pasarse de las horas de nadie.
 */
const VARIANTS: readonly (readonly Member[])[] = [
  [
    {
      id: 'lucas',
      name: 'Lucas',
      hoursFree: 6,
      skill: { investigacion: 1, diseno: 1, presentacion: 1, maqueta: 3 },
    },
    {
      id: 'sofia',
      name: 'Sofía',
      hoursFree: 5,
      skill: { investigacion: 3, diseno: 1, presentacion: 2, maqueta: 1 },
    },
    {
      id: 'mateo',
      name: 'Mateo',
      hoursFree: 4,
      skill: { investigacion: 2, diseno: 3, presentacion: 1, maqueta: 1 },
    },
    {
      id: 'vos',
      name: 'Vos',
      hoursFree: 3,
      skill: { investigacion: 1, diseno: 2, presentacion: 3, maqueta: 2 },
    },
  ],
  [
    {
      id: 'lucas',
      name: 'Lucas',
      hoursFree: 7,
      skill: { investigacion: 2, diseno: 1, presentacion: 1, maqueta: 3 },
    },
    {
      id: 'sofia',
      name: 'Sofía',
      hoursFree: 6,
      skill: { investigacion: 3, diseno: 2, presentacion: 1, maqueta: 1 },
    },
    {
      id: 'mateo',
      name: 'Mateo',
      hoursFree: 3,
      skill: { investigacion: 1, diseno: 3, presentacion: 2, maqueta: 1 },
    },
    {
      id: 'vos',
      name: 'Vos',
      hoursFree: 2,
      skill: { investigacion: 1, diseno: 1, presentacion: 3, maqueta: 1 },
    },
  ],
]

/** Afinidad total de un reparto, o -1 si viola alguna restricción. */
function scoreAssignment(
  model: GroupModel,
  pairs: readonly AgentAssignment[],
): number {
  const usedMembers = new Set<string>()
  const coveredTasks = new Set<string>()
  let total = 0

  for (const pair of pairs) {
    const member = model.members.find((entry) => entry.id === pair.agentId)
    const task = model.tasks.find((entry) => entry.id === pair.taskId)

    if (member === undefined || task === undefined) {
      return -1
    }
    if (usedMembers.has(member.id) || coveredTasks.has(task.id)) {
      return -1
    }
    if (member.hoursFree < task.hours) {
      return -1
    }

    usedMembers.add(member.id)
    coveredTasks.add(task.id)
    total += member.skill[task.id] ?? 0
  }

  return coveredTasks.size === model.tasks.length ? total : -1
}

function permutations<T>(items: readonly T[]): readonly T[][] {
  if (items.length <= 1) {
    return [[...items]]
  }

  const result: T[][] = []
  for (let index = 0; index < items.length; index += 1) {
    const head = items[index]
    if (head === undefined) {
      continue
    }
    const rest = [...items.slice(0, index), ...items.slice(index + 1)]
    for (const tail of permutations(rest)) {
      result.push([head, ...tail])
    }
  }
  return result
}

function bestPossibleSkill(model: GroupModel): number {
  let best = -1
  for (const ordering of permutations(model.members)) {
    const pairs = model.tasks.map((task, index) => ({
      agentId: ordering[index]?.id ?? '',
      taskId: task.id,
    }))
    best = Math.max(best, scoreAssignment(model, pairs))
  }
  return best
}

export const groupTasks: ChallengeDefinition = defineChallenge<GroupModel>({
  id: toChallengeId('g7.group-tasks'),
  interaction: 'assignment-board',
  categories: ['optimization-and-constraints', 'quantity'],
  stages: ['grade-7'],
  baseDifficulty: 3,
  tools: ['notepad'],

  generate({ rng }) {
    const members = rng.pick(VARIANTS)
    const draft: GroupModel = { tasks: TASKS, members, bestSkill: 0 }
    return { tasks: TASKS, members, bestSkill: bestPossibleSkill(draft) }
  },

  verify(model) {
    const issues: string[] = []

    if (model.bestSkill < 0) {
      issues.push('no existe ningún reparto que cubra todas las tareas')
    }
    if (model.members.length !== model.tasks.length) {
      issues.push('la cantidad de personas y de tareas no coincide')
    }

    const skills = model.members.flatMap((member) =>
      model.tasks.map((task) => member.skill[task.id] ?? 0),
    )
    if (new Set(skills).size === 1) {
      issues.push('todos tienen la misma afinidad, así que elegir da igual')
    }

    return issues
  },

  narrate() {
    return {
      title: 'El trabajo grupal',
      setup:
        'El proyecto de la feria se entrega en dos semanas. Cada quien tiene las horas que tiene, y las estrellas dicen qué tan bien le sale cada parte.',
      goal: 'Repartí las cuatro partes sin pasarte de las horas de nadie.',
    }
  },

  present(model) {
    const stars = (value: number): string => '★'.repeat(Math.max(0, value))

    return {
      kind: 'assignment-board',
      agents: model.members.map((member) => ({
        id: member.id,
        label: member.name,
        detail: `${String(member.hoursFree)} h libres · ${model.tasks
          .map((task) => `${task.label} ${stars(member.skill[task.id] ?? 0)}`)
          .join(' · ')}`,
      })),
      tasks: model.tasks.map((task) => ({
        id: task.id,
        label: task.label,
        detail: `${String(task.hours)} h`,
      })),
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'assignment-board') {
      return err({
        kind: 'invalid-answer',
        detail: `se esperaba assignment-board y llegó ${answer.kind}`,
      })
    }

    for (const pair of answer.assignments) {
      if (!model.members.some((member) => member.id === pair.agentId)) {
        return err({
          kind: 'invalid-answer',
          detail: `persona desconocida ${pair.agentId}`,
        })
      }
      if (!model.tasks.some((task) => task.id === pair.taskId)) {
        return err({
          kind: 'invalid-answer',
          detail: `tarea desconocida ${pair.taskId}`,
        })
      }
    }

    const skill = scoreAssignment(model, answer.assignments)
    const facts = model.tasks.map((task) => {
      const pair = answer.assignments.find((entry) => entry.taskId === task.id)
      const member = model.members.find((entry) => entry.id === pair?.agentId)

      return {
        label: `${task.label} (${String(task.hours)} h)`,
        value:
          member === undefined
            ? 'sin asignar'
            : `${member.name} · ${String(member.hoursFree)} h libres`,
      }
    })

    if (skill < 0) {
      const overloaded = answer.assignments.find((pair) => {
        const member = model.members.find((entry) => entry.id === pair.agentId)
        const task = model.tasks.find((entry) => entry.id === pair.taskId)
        return (
          member !== undefined &&
          task !== undefined &&
          member.hoursFree < task.hours
        )
      })
      const overloadedMember = model.members.find(
        (entry) => entry.id === overloaded?.agentId,
      )
      const overloadedTask = model.tasks.find(
        (entry) => entry.id === overloaded?.taskId,
      )

      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: overloaded ? 'group.overloaded' : 'group.incomplete',
          facts,
          violatedConstraint:
            overloadedMember && overloadedTask
              ? `${overloadedMember.name} tiene ${String(overloadedMember.hoursFree)} h y ${overloadedTask.label} pide ${String(overloadedTask.hours)} h`
              : 'quedaron tareas sin asignar',
        },
        metrics: metrics({ efficiency: 0, precision: 0.2, risk: 0.5 }),
        statEffects: [{ stat: 'team', delta: -3 }],
        flagEffects: [{ flag: 'g7.grupoDesarmado', value: true }],
      })
    }

    const ratio = model.bestSkill > 0 ? skill / model.bestSkill : 1
    const comparison = `El mejor reparto sumaba ${String(model.bestSkill)} estrellas de afinidad; el tuyo sumó ${String(skill)}.`

    if (skill === model.bestSkill) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'group.optimal',
          facts,
          optimalComparison:
            'Cada parte quedó en manos de quien mejor la hacía y a nadie le faltaron horas.',
        },
        metrics: metrics({ efficiency: 1, precision: 1, risk: 0 }),
        statEffects: [
          { stat: 'team', delta: 5 },
          { stat: 'initiative', delta: 3 },
        ],
        flagEffects: [{ flag: 'g7.grupoOrganizado', value: true }],
      })
    }

    if (ratio >= 0.8) {
      return ok({
        quality: 'efficient',
        feedback: {
          outcomeKey: 'group.efficient',
          facts,
          optimalComparison: comparison,
        },
        metrics: metrics({ efficiency: ratio, precision: 1, risk: 0.1 }),
        statEffects: [
          { stat: 'team', delta: 3 },
          { stat: 'initiative', delta: 1 },
        ],
        flagEffects: [{ flag: 'g7.grupoOrganizado', value: true }],
      })
    }

    return ok({
      quality: 'functional',
      feedback: {
        outcomeKey: 'group.functional',
        facts,
        optimalComparison: comparison,
      },
      metrics: metrics({ efficiency: ratio, precision: 1, risk: 0.2 }),
      statEffects: [{ stat: 'team', delta: 2 }],
      flagEffects: [{ flag: 'g7.grupoCubierto', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido. */
export const groupTasksReference = { tasks: TASKS, variants: VARIANTS }
