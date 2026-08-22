'use client'

/**
 * Asignación de personas a tareas.
 *
 * Los documentos de diseño describen esta familia como un tablero de arrastrar y
 * soltar, y las reglas de UX exigen que arrastrar nunca sea la única forma de
 * completar una tarea. Por eso el camino accesible —elegir una persona por tarea
 * desde un `select` nativo— está construido primero y solo: anda con teclado,
 * con el dedo y con lector de pantalla, y no necesita ninguna librería.
 *
 * El arrastre con puntero se puede sumar después sobre este mismo estado; el
 * contrato de la respuesta no va a cambiar cuando pase.
 */

import { useId } from 'react'

import { Surface } from '@/components/ui'
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
    <fieldset
      className="flex min-w-0 flex-col gap-4 border-0 p-0"
      disabled={disabled}
    >
      <legend className="sr-only">Asigná una persona por tarea</legend>

      {/*
        Quién puede hacer qué tiene que estar a la vista. Metido sólo dentro de
        las opciones del select, el dato queda truncado en un teléfono y la
        decisión se vuelve adivinanza: hay que abrir cuatro desplegables y
        recordar lo que decía cada uno.
      */}
      <ul
        className="flex list-none flex-col gap-1.5 p-0"
        aria-label="Quién puede hacer qué"
      >
        {agents.map((agent) => (
          <li key={agent.id}>
            <Surface tone="muted" padding="compact">
              <span className="text-subheading text-foreground block">
                {agent.label}
              </span>
              <span className="text-body-sm text-foreground-muted block">
                {agent.detail}
              </span>
            </Surface>
          </li>
        ))}
      </ul>

      <ul className="flex list-none flex-col gap-2.5 p-0">
        {tasks.map((task) => {
          const fieldId = `${groupId}-${task.id}`
          const selected = agentFor(task.id)
          // Una persona ya usada en otra tarea se muestra pero marcada, así la
          // restricción se ve antes de confirmar.
          const takenElsewhere = new Set(
            assignments
              .filter((entry) => entry.taskId !== task.id)
              .map((entry) => entry.agentId),
          )

          return (
            <li
              key={task.id}
              data-chosen={selected !== ''}
              className="border-line bg-surface rounded-surface data-[chosen=true]:border-line-selected border-2 p-3"
            >
              <label htmlFor={fieldId} className="block">
                <span className="text-subheading text-foreground block">
                  {task.label}
                </span>
                <span
                  data-numeric
                  className="text-body-sm text-data-foreground block font-semibold"
                >
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
                className="border-line-interactive bg-surface text-foreground rounded-control text-body mt-2 h-11 w-full px-2"
              >
                <option value="">Sin asignar</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.label}
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
