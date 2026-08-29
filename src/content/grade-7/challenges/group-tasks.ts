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
  authoredVariantIds,
  toChallengeId,
  type AgentAssignment,
  type ChallengeDefinition,
  type ChallengeEvaluation,
  type EngineRejection,
  type InteractionAnswer,
  type Result,
} from '@/game'
import { groupTasksVariants, type GroupParams } from './group-tasks.variants'
import { GROUP_PROJECT_FAMILY } from '../families'

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
/** Identidad estable de la plantilla. */
const GROUP_TASKS_ID = toChallengeId('g7.group-tasks')

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

export const groupTasks: ChallengeDefinition = defineChallenge<
  GroupModel,
  GroupParams
>({
  id: GROUP_TASKS_ID,
  family: GROUP_PROJECT_FAMILY,
  placement: 'anchor',
  variants: authoredVariantIds(groupTasksVariants.authored),
  variantSource: groupTasksVariants,
  interaction: 'assignment-board',
  categories: ['optimization-and-constraints', 'quantity'],
  stages: ['grade-7'],
  baseDifficulty: 3,
  // El más exigente del año, y por estructura: hay que repartir todas las tareas
  // (una restricción) sin pasarse de las horas de nadie (otra), leyendo a la vez
  // afinidad y disponibilidad, y el reparto se construye —no está entre opciones—
  // buscando el mejor, no uno que funcione.
  cognitive: {
    steps: 2,
    constraints: 2,
    selection: 2,
    optimization: 2,
    uncertainty: 0,
    construction: 1,
  },
  tools: ['notepad'],

  generate({ params }) {
    const { members } = params
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
          stamp: 'Quedó a medias',
          consequence:
            'La semana siguiente falta la mitad del trabajo y hay que rehacerlo a las apuradas.',
          facts,
          violatedConstraint:
            overloadedMember && overloadedTask
              ? `${overloadedMember.name} tiene ${String(overloadedMember.hoursFree)} h y ${overloadedTask.label} pide ${String(overloadedTask.hours)} h`
              : 'quedaron tareas sin asignar',
        },
        metrics: metrics({ efficiency: 0, precision: 0.2, risk: 0.5 }),
        // Repartir el trabajo pone en juego la conducta hacia el grupo, no una
        // nota: mueve Equipo y Estilo.
        careerEffects: {
          equipo: -3,
          estilo: { axis: 'improvisador', amount: 10 },
        },
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
          stamp: 'Repartido',
          consequence:
            'Cada uno hace lo suyo sin quejarse y el proyecto llega entero a la feria.',
          facts,
          optimalComparison:
            'Cada parte quedó en manos de quien mejor la hacía y a nadie le faltaron horas.',
        },
        metrics: metrics({ efficiency: 1, precision: 1, risk: 0 }),
        careerEffects: {
          equipo: 5,
          estilo: { axis: 'estratega', amount: 10 },
        },
        flagEffects: [{ flag: 'g7.grupoOrganizado', value: true }],
      })
    }

    if (ratio >= 0.8) {
      return ok({
        quality: 'efficient',
        feedback: {
          outcomeKey: 'group.efficient',
          stamp: 'Repartido',
          consequence:
            'El trabajo sale, con un par de reclamos por cómo quedó repartido.',
          facts,
          optimalComparison: comparison,
        },
        metrics: metrics({ efficiency: ratio, precision: 1, risk: 0.1 }),
        careerEffects: {
          equipo: 3,
          estilo: { axis: 'estratega', amount: 8 },
        },
        flagEffects: [{ flag: 'g7.grupoOrganizado', value: true }],
      })
    }

    return ok({
      quality: 'functional',
      feedback: {
        outcomeKey: 'group.functional',
        stamp: 'Repartido',
        consequence:
          'Se cubren todas las partes, aunque algunos terminan haciendo de más.',
        facts,
        optimalComparison: comparison,
      },
      metrics: metrics({ efficiency: ratio, precision: 1, risk: 0.2 }),
      careerEffects: {
        equipo: 2,
        estilo: { axis: 'aplicado', amount: 8 },
      },
      flagEffects: [{ flag: 'g7.grupoCubierto', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido. */
export const groupTasksReference = {
  tasks: TASKS,
  variants: groupTasksVariants.authored,
}
