'use client'

/**
 * Registro de renderers de interacción.
 *
 * Este switch exhaustivo *es* el registro. Como `InteractionPresentation` es una
 * unión discriminada y la rama por defecto llama a `assertNever`, agregarle una
 * variante al motor hace que este archivo no compile hasta que exista un
 * renderer — que es exactamente la garantía de cobertura que un
 * `Record<string, Component>` no puede dar. Cada rama queda además acotada a su
 * propio tipo, así que no hace falta ni un cast.
 *
 * Los renderers juntan un **borrador** y nada más. No evalúan nada: acá no se
 * importa ningún evaluador, y la única forma de que una respuesta se juzgue es
 * despachándola al motor.
 *
 * La división en dos —datos sobre papel, controles dentro del bloque oscuro— no
 * es organización de código: es la regla de superficie del sistema. El dato se
 * lee sobre la hoja, la decisión pasa en oscuro, y el resultado vuelve al papel.
 */

import { assertNever } from '@/game/core/exhaustive'
import type {
  InteractionAnswer,
  InteractionPresentation,
  PresentedDatum,
} from '@/game'
import { Button, type DataGridItem } from '@/components/ui'

import { AssignmentBoard } from './interactions/assignment-board'
import { BudgetBuilder } from './interactions/budget-builder'
import { NumericAnswer } from './interactions/numeric-answer'
import { OptionList } from './interactions/option-list'

/** Traduce los datos del motor a celdas de la grilla, sin decidir nada. */
function toGridItems(data: readonly PresentedDatum[]): DataGridItem[] {
  return data.map((datum) => ({
    label: datum.label,
    value: datum.value,
    ...(datum.unit === undefined ? {} : { unit: datum.unit }),
    ...(datum.constraint === undefined ? {} : { constraint: datum.constraint }),
    ...(datum.span === undefined ? {} : { span: datum.span }),
  }))
}

/**
 * Los datos que van sobre el papel, arriba del bloque de decisión.
 *
 * Todo número con el que haya que razonar va acá. Esconder un dato necesario en
 * la prosa convierte un problema de matemática en uno de lectura.
 */
export function interactionData(
  presentation: InteractionPresentation,
): DataGridItem[] {
  switch (presentation.kind) {
    case 'decision-card':
    case 'timeline':
    case 'numeric-input':
    case 'budget-builder':
    case 'information-request':
      return toGridItems(presentation.data)
    case 'chart-interpretation':
      // La serie del gráfico son los datos: repetirlos arriba sería pedir que se
      // lean dos veces.
      return []
    case 'assignment-board':
      return []
    default:
      return assertNever(presentation)
  }
}

/**
 * Si esta interacción se decide dentro del bloque oscuro.
 *
 * Elegir entre opciones y escribir un número sí. Repartir tareas y armar un
 * presupuesto no: son tablas anchas donde el foco no es «cuál de estas», y
 * meterlas en el bloque oscuro las volvería ilegibles antes que enfocadas.
 */
export function usesDecisionBlock(
  presentation: InteractionPresentation,
): boolean {
  switch (presentation.kind) {
    case 'decision-card':
    case 'timeline':
    case 'chart-interpretation':
    case 'information-request':
    case 'numeric-input':
      return true
    case 'budget-builder':
    case 'assignment-board':
      return false
    default:
      return assertNever(presentation)
  }
}

export interface InteractionControlsProps {
  readonly presentation: InteractionPresentation
  readonly draft: InteractionAnswer | undefined
  readonly disabled: boolean
  /** Ya resuelto: las opciones muestran la marca de corrección. */
  readonly resolution?: {
    readonly chosenId: string | undefined
    readonly tone: import('@/components/ui').OutcomeTone
  }
  readonly onDraftChange: (answer: InteractionAnswer | undefined) => void
  readonly onRequestInformation: (key: string) => void
  /** Namespacea los grupos de radio para que dos desafíos no colisionen. */
  readonly instanceId: string
}

/** Id de la opción elegida cuando el borrador coincide con la variante esperada. */
function selectedOption(
  draft: InteractionAnswer | undefined,
  kind: InteractionAnswer['kind'],
): string | undefined {
  if (draft?.kind !== kind) {
    return undefined
  }
  return 'optionId' in draft ? draft.optionId : undefined
}

export function InteractionControls({
  presentation,
  draft,
  disabled,
  resolution,
  onDraftChange,
  onRequestInformation,
  instanceId,
}: InteractionControlsProps) {
  switch (presentation.kind) {
    case 'decision-card':
    case 'timeline':
    case 'chart-interpretation':
    case 'information-request': {
      const kind = presentation.kind
      return (
        <div className="flex flex-col gap-3">
          {kind === 'chart-interpretation' ? (
            <ChartTable presentation={presentation} />
          ) : null}
          {kind === 'information-request' &&
          presentation.available.length > 0 ? (
            <ul className="flex list-none flex-col gap-1.5 p-0">
              {presentation.available.map((entry) => (
                <li key={entry.key}>
                  <Button
                    variant="secondary"
                    size="md"
                    surface="decision"
                    disabled={disabled}
                    className="w-full justify-start"
                    onClick={() => {
                      onRequestInformation(entry.key)
                    }}
                  >
                    {entry.label}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <OptionList
            name={`${kind}-${instanceId}`}
            options={presentation.options}
            value={selectedOption(draft, kind)}
            disabled={disabled}
            {...(resolution === undefined ? {} : { resolution })}
            onSelect={(optionId) => {
              onDraftChange({ kind, optionId })
            }}
          />
        </div>
      )
    }

    case 'numeric-input':
      return (
        <NumericAnswer
          unitLabel={presentation.unitLabel}
          min={presentation.min}
          max={presentation.max}
          step={presentation.step}
          value={draft?.kind === 'numeric-input' ? draft.value : ''}
          disabled={disabled}
          onChange={(value) => {
            onDraftChange(
              value === '' ? undefined : { kind: 'numeric-input', value },
            )
          }}
        />
      )

    case 'budget-builder':
      return (
        <BudgetBuilder
          items={presentation.items}
          budgetLabel={presentation.budgetLabel}
          lines={draft?.kind === 'budget-builder' ? draft.lines : []}
          disabled={disabled}
          onChange={(lines) => {
            onDraftChange({ kind: 'budget-builder', lines })
          }}
        />
      )

    case 'assignment-board':
      return (
        <AssignmentBoard
          agents={presentation.agents}
          tasks={presentation.tasks}
          assignments={
            draft?.kind === 'assignment-board' ? draft.assignments : []
          }
          disabled={disabled}
          onChange={(assignments) => {
            onDraftChange({ kind: 'assignment-board', assignments })
          }}
        />
      )

    default:
      return assertNever(presentation)
  }
}

/**
 * La serie de un gráfico, como tabla con barras.
 *
 * Los números están siempre escritos, así que el significado nunca depende del
 * largo de una barra ni de un color. La barra acompaña la comparación; no la
 * sustituye.
 */
function ChartTable({
  presentation,
}: {
  readonly presentation: Extract<
    InteractionPresentation,
    { kind: 'chart-interpretation' }
  >
}) {
  const largest = presentation.series.reduce(
    (max, point) => Math.max(max, point.value),
    0,
  )

  return (
    <table className="text-meta w-full">
      <caption className="sr-only">{presentation.axisLabel}</caption>
      <tbody>
        {presentation.series.map((point) => (
          <tr key={point.label}>
            <th
              scope="row"
              className="text-on-decision-muted py-1 pr-3 text-left font-normal"
            >
              {point.label}
            </th>
            <td className="w-full py-1">
              <span
                aria-hidden="true"
                className="bg-on-decision-muted block h-2.5"
                style={{
                  width: `${String(largest === 0 ? 0 : Math.round((point.value / largest) * 100))}%`,
                }}
              />
            </td>
            <td
              data-numeric
              className="text-on-decision font-display py-1 pl-3 text-right font-bold"
            >
              {point.display}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Si un borrador está estructuralmente completo para enviarse.
 *
 * Es sólo una guarda de UX. El motor revalida cada respuesta, así que un cliente
 * que esquive el botón deshabilitado no gana nada.
 */
export function isDraftSubmittable(
  presentation: InteractionPresentation,
  draft: InteractionAnswer | undefined,
): boolean {
  if (draft === undefined || draft.kind !== presentation.kind) {
    return false
  }

  switch (draft.kind) {
    case 'decision-card':
    case 'timeline':
    case 'chart-interpretation':
    case 'information-request':
      return draft.optionId.length > 0
    case 'numeric-input':
      return /^[+-]?\d+(?:\.\d+)?$/u.test(draft.value)
    case 'budget-builder':
      return draft.lines.some((line) => line.quantity > 0)
    case 'assignment-board':
      return (
        presentation.kind === 'assignment-board' &&
        draft.assignments.length === presentation.tasks.length
      )
    default:
      return assertNever(draft)
  }
}

/**
 * Qué falta para poder confirmar, dicho en texto.
 *
 * El deshabilitado **nunca** es la única explicación: si el primario está
 * apagado, la línea de consigna dice por qué. Un botón gris sin motivo es la
 * forma más rápida de que alguien crea que el juego se rompió.
 */
export function missingRequirement(
  presentation: InteractionPresentation,
  draft: InteractionAnswer | undefined,
): string | undefined {
  if (isDraftSubmittable(presentation, draft)) {
    return undefined
  }

  switch (presentation.kind) {
    case 'decision-card':
    case 'timeline':
    case 'chart-interpretation':
    case 'information-request':
      return 'Elegí una opción para confirmar.'
    case 'numeric-input':
      return 'Escribí un número para confirmar.'
    case 'budget-builder':
      return 'Agregá al menos una cantidad para confirmar.'
    case 'assignment-board': {
      const assigned =
        draft?.kind === 'assignment-board' ? draft.assignments.length : 0
      const missing = presentation.tasks.length - assigned
      return `Falta asignar ${String(missing)} ${missing === 1 ? 'tarea' : 'tareas'}.`
    }
    default:
      return assertNever(presentation)
  }
}
