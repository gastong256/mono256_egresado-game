/**
 * DEVELOPMENT FIXTURE — not final Egresado content.
 *
 * The "trabajo grupal" scenario: each classmate has a number of available hours
 * and a skill level per task, and every task has to be covered. The mathematics
 * is assignment under constraints; the decision is who does what.
 *
 * The optimum is found by exhaustive permutation, which is tractable because
 * the generated boards stay small, and it is verified at generation time rather
 * than assumed.
 */

import { toChallengeId, toVariantId } from '../../../core/branded'
import { DEV_GROUP_PROJECT_FAMILY } from '../families'
import { err, ok, type Result } from '../../../core/result'
import type { EngineRejection } from '../../../core/errors'
import {
  defineChallenge,
  type ChallengeDefinition,
  type ChallengeEvaluation,
} from '../../../challenges/contracts'
import { metrics } from '../../../challenges/evaluation'
import type { InteractionAnswer } from '../../../challenges/interactions'

interface Member {
  readonly id: string
  readonly label: string
  readonly hoursAvailable: number
  /** Skill per task id, 1 (weak) to 5 (strong). */
  readonly skill: Readonly<Record<string, number>>
}

interface Task {
  readonly id: string
  readonly label: string
  readonly hoursRequired: number
}

interface AssignmentModel {
  readonly members: readonly Member[]
  readonly tasks: readonly Task[]
  readonly bestScore: number
}

const NAMES = ['Sofi', 'Tomás', 'Nadia', 'Julián', 'Bruno', 'Ivo']
const TASKS: readonly { id: string; label: string }[] = [
  { id: 'research', label: 'Investigación' },
  { id: 'slides', label: 'Presentación' },
  { id: 'build', label: 'Maqueta' },
]

/** Total skill of a feasible one-member-per-task assignment, or -1 if invalid. */
function scoreAssignment(
  model: AssignmentModel,
  pairs: readonly { agentId: string; taskId: string }[],
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
    if (member.hoursAvailable < task.hoursRequired) {
      return -1
    }

    usedMembers.add(member.id)
    coveredTasks.add(task.id)
    total += member.skill[task.id] ?? 0
  }

  return coveredTasks.size === model.tasks.length ? total : -1
}

/** Enumerates every injective member→task mapping. */
function permute<T>(items: readonly T[], size: number): readonly T[][] {
  if (size === 0) {
    return [[]]
  }

  const result: T[][] = []
  for (let index = 0; index < items.length; index += 1) {
    const head = items[index]
    if (head === undefined) {
      continue
    }
    const rest = [...items.slice(0, index), ...items.slice(index + 1)]
    for (const tail of permute(rest, size - 1)) {
      result.push([head, ...tail])
    }
  }
  return result
}

function bestPossibleScore(model: AssignmentModel): number {
  let best = -1
  for (const ordering of permute(model.members, model.tasks.length)) {
    const pairs = model.tasks.map((task, index) => ({
      agentId: ordering[index]?.id ?? '',
      taskId: task.id,
    }))
    best = Math.max(best, scoreAssignment(model, pairs))
  }
  return best
}

export const groupAssignment: ChallengeDefinition =
  defineChallenge<AssignmentModel>({
    id: toChallengeId('dev.group-assignment'),
    family: DEV_GROUP_PROJECT_FAMILY,
    placement: 'anchor',
    variants: [toVariantId('base')],
    interaction: 'assignment-board',
    categories: ['optimization-and-constraints', 'patterns-and-relations'],
    stages: ['year-2', 'year-3'],
    baseDifficulty: 4,
    tools: ['notepad'],

    generate({ rng }) {
      const tasks = TASKS.map((task) => ({
        ...task,
        hoursRequired: rng.nextInt(2, 6),
      }))

      // Feasibility is built in rather than hoped for: the first `tasks.length`
      // members are given enough hours to cover the most demanding task, so a
      // valid assignment always exists. The remaining member is unconstrained,
      // which is what keeps the choice interesting.
      const hardestTask = tasks.reduce(
        (max, task) => Math.max(max, task.hoursRequired),
        0,
      )
      const members = rng
        .shuffle(NAMES)
        .slice(0, 4)
        .map((label, index) => {
          const skill: Record<string, number> = {}
          for (const task of tasks) {
            skill[task.id] = rng.nextInt(1, 5)
          }
          return {
            id: `member-${String(index)}`,
            label,
            hoursAvailable:
              index < tasks.length
                ? rng.nextInt(hardestTask, hardestTask + 3)
                : rng.nextInt(2, hardestTask + 3),
            skill,
          }
        })

      const draft: AssignmentModel = { members, tasks, bestScore: 0 }
      return { members, tasks, bestScore: bestPossibleScore(draft) }
    },

    verify(model) {
      const issues: string[] = []

      if (model.bestScore < 0) {
        issues.push('no feasible assignment covers every task')
      }
      if (model.members.length < model.tasks.length) {
        issues.push('there are fewer members than tasks')
      }

      const skillValues = model.members.flatMap((member) =>
        model.tasks.map((task) => member.skill[task.id] ?? 0),
      )
      if (new Set(skillValues).size === 1) {
        issues.push(
          'every member is equally skilled, so the choice is arbitrary',
        )
      }

      return issues
    },

    narrate() {
      return {
        title: 'El trabajo grupal',
        setup:
          'Hay que repartir el trabajo final y cada quien tiene horas y fuertes distintos.',
        goal: 'Asigná una persona por tarea sin pasarte de sus horas.',
      }
    },

    present(model) {
      return {
        kind: 'assignment-board',
        agents: model.members.map((member) => ({
          id: member.id,
          label: member.label,
          detail: `${String(member.hoursAvailable)} h · ${model.tasks
            .map(
              (task) => `${task.label} ${String(member.skill[task.id] ?? 0)}/5`,
            )
            .join(' · ')}`,
        })),
        tasks: model.tasks.map((task) => ({
          id: task.id,
          label: task.label,
          detail: `${String(task.hoursRequired)} h`,
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
          detail: `expected assignment-board, received ${answer.kind}`,
        })
      }

      for (const pair of answer.assignments) {
        if (!model.members.some((member) => member.id === pair.agentId)) {
          return err({
            kind: 'invalid-answer',
            detail: `unknown member ${pair.agentId}`,
          })
        }
        if (!model.tasks.some((task) => task.id === pair.taskId)) {
          return err({
            kind: 'invalid-answer',
            detail: `unknown task ${pair.taskId}`,
          })
        }
      }

      const score = scoreAssignment(model, answer.assignments)
      const facts = model.tasks.map((task) => {
        const pair = answer.assignments.find(
          (entry) => entry.taskId === task.id,
        )
        const member = model.members.find((entry) => entry.id === pair?.agentId)
        return {
          label: task.label,
          value:
            member === undefined
              ? 'sin asignar'
              : `${member.label} (${String(member.skill[task.id] ?? 0)}/5, ${String(member.hoursAvailable)} h)`,
        }
      })

      if (score < 0) {
        const overloaded = answer.assignments.find((pair) => {
          const member = model.members.find(
            (entry) => entry.id === pair.agentId,
          )
          const task = model.tasks.find((entry) => entry.id === pair.taskId)
          return (
            member !== undefined &&
            task !== undefined &&
            member.hoursAvailable < task.hoursRequired
          )
        })

        return ok({
          quality: 'invalid',
          feedback: {
            outcomeKey: overloaded
              ? 'assignment.overloaded'
              : 'assignment.incomplete',
            facts,
            violatedConstraint: overloaded ? 'member-hours' : 'task-coverage',
          },
          metrics: metrics({ efficiency: 0, precision: 0, risk: 0.5 }),
          careerEffects: { equipo: -2 },
          flagEffects: [{ flag: 'assignment.failed', value: true }],
        })
      }

      const ratio = model.bestScore > 0 ? score / model.bestScore : 1

      if (score === model.bestScore) {
        return ok({
          quality: 'optimal',
          feedback: {
            outcomeKey: 'assignment.optimal',
            facts,
            optimalComparison:
              'Ninguna otra distribución aprovechaba mejor los fuertes del grupo.',
          },
          metrics: metrics({ efficiency: 1, precision: 1, risk: 0 }),
          careerEffects: {
            equipo: 4,
            estilo: { axis: 'estratega', amount: 6 },
          },
          flagEffects: [{ flag: 'assignment.optimal', value: true }],
        })
      }

      return ok({
        quality: ratio >= 0.85 ? 'efficient' : 'functional',
        feedback: {
          outcomeKey: 'assignment.covered',
          facts,
          optimalComparison: `La mejor distribución sumaba ${String(model.bestScore)} puntos de afinidad; la tuya sumó ${String(score)}.`,
        },
        metrics: metrics({ efficiency: ratio, precision: 1, risk: 0.2 }),
        careerEffects: { equipo: 2 },
        flagEffects: [],
      })
    },
  })
