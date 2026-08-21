'use client'

/**
 * Assignment control.
 *
 * The design documents describe this family as a drag-and-drop board, and the
 * UX rules require that dragging is never the only way to complete a task. The
 * accessible path — choosing a person per task from a native select — is
 * therefore built first and on its own: it works with keyboard, touch and screen
 * readers, and no drag-and-drop library is needed for the interaction to be
 * complete.
 *
 * Pointer dragging can be layered on later as an enhancement over this same
 * state; the answer contract will not change when it is.
 */

import { useId } from 'react'

import type { AgentAssignment, PresentedAgent, PresentedTask } from '@/game'

export interface AssignmentBoardProps {
  readonly agents: readonly PresentedAgent[]
  readonly tasks: readonly PresentedTask[]
  readonly assignments: readonly AgentAssignment[]
  readonly disabled: boolean
  readonly onChange: (assignments: readonly AgentAssignment[]) => void
}

export function AssignmentBoard({
  agents,
  tasks,
  assignments,
  disabled,
  onChange,
}: AssignmentBoardProps) {
  const groupId = useId()

  const agentFor = (taskId: string): string =>
    assignments.find((entry) => entry.taskId === taskId)?.agentId ?? ''

  const assign = (taskId: string, agentId: string): void => {
    const next = tasks.flatMap((task) => {
      const chosen = task.id === taskId ? agentId : agentFor(task.id)
      return chosen === '' ? [] : [{ taskId: task.id, agentId: chosen }]
    })
    onChange(next)
  }

  return (
    <fieldset className="min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">Asigná una persona por tarea</legend>
      <ul className="flex list-none flex-col gap-2 p-0">
        {tasks.map((task) => {
          const fieldId = `${groupId}-${task.id}`
          const selected = agentFor(task.id)
          // A person already used elsewhere is shown but marked, so the
          // constraint is visible before the answer is submitted.
          const takenElsewhere = new Set(
            assignments
              .filter((entry) => entry.taskId !== task.id)
              .map((entry) => entry.agentId),
          )

          return (
            <li
              key={task.id}
              className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900"
            >
              <label htmlFor={fieldId} className="block">
                <span className="block font-medium">{task.label}</span>
                <span className="block text-sm text-slate-600 dark:text-slate-400">
                  {task.detail}
                </span>
              </label>
              <select
                id={fieldId}
                value={selected}
                disabled={disabled}
                onChange={(event) => {
                  assign(task.id, event.target.value)
                }}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:focus-visible:outline-slate-100"
              >
                <option value="">Sin asignar</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.label} — {agent.detail}
                    {takenElsewhere.has(agent.id) ? ' (ya asignado)' : ''}
                  </option>
                ))}
              </select>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
