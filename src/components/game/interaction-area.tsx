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
import { Classification } from './interactions/classification'
import { BudgetBuilder, QuantityBuilder } from './interactions/budget-builder'
import { NumberGridBoard } from './interactions/number-grid'
import { NumericAnswer } from './interactions/numeric-answer'
import { OptionList } from './interactions/option-list'
import { ScheduleBuilder } from './interactions/schedule-builder'
import { SpatialLayout } from './interactions/spatial-layout'

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
    case 'quantity-builder':
    case 'schedule-builder':
    case 'spatial-layout':
    case 'information-request':
      return toGridItems(presentation.data)
    case 'chart-interpretation':
      // La serie del gráfico son los datos: repetirlos arriba sería pedir que se
      // lean dos veces.
      return []
    case 'assignment-board':
      return []
    case 'number-grid':
      // Los números de la grilla son el dato. Repetirlos arriba en cajas sería
      // pedir que se lean dos veces.
      return []
    case 'classification':
      return [...presentation.data]
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
    case 'quantity-builder':
    case 'assignment-board':
    case 'number-grid':
    case 'classification':
      return false
    case 'schedule-builder':
    case 'spatial-layout':
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
    case 'schedule-builder':
      return (
        <ScheduleBuilder
          activities={presentation.activities}
          instructions={presentation.instructions}
          span={presentation.span}
          placements={
            draft?.kind === 'schedule-builder' ? draft.placements : []
          }
          disabled={disabled}
          onChange={(placements) =>
            onDraftChange({ kind: 'schedule-builder', placements })
          }
        />
      )
    case 'spatial-layout':
      return (
        <SpatialLayout
          presentation={presentation}
          placements={draft?.kind === 'spatial-layout' ? draft.placements : []}
          disabled={disabled}
          onChange={(placements) =>
            onDraftChange({ kind: 'spatial-layout', placements })
          }
        />
      )
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

    case 'quantity-builder':
      return (
        <QuantityBuilder
          items={presentation.items}
          instructions={presentation.instructions}
          {...(presentation.positions === undefined
            ? {}
            : { positions: presentation.positions })}
          lines={draft?.kind === 'quantity-builder' ? draft.lines : []}
          disabled={disabled}
          onChange={(lines) =>
            onDraftChange({ kind: 'quantity-builder', lines })
          }
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

    case 'number-grid':
      return (
        <NumberGridBoard
          rounds={presentation.rounds}
          columns={presentation.columns}
          selections={draft?.kind === 'number-grid' ? draft.rounds : []}
          disabled={disabled}
          /*
            La corrección por celda pide dos cosas, y las dos tienen que estar.
            `resolution` dice que el motor evaluó; el borrador dice qué marcó el
            jugador. Al reanudar sobre una pantalla de resultado el borrador se
            perdió —vive en la vista, no en el snapshot—, y sin él la grilla
            afirmaría que no se marcó nada. Igual que la lista de opciones sin
            `chosenId`, prefiere no afirmar nada: el ledger sigue explicando la
            cuenta.
          */
          resolved={resolution !== undefined && draft?.kind === 'number-grid'}
          onChange={(rounds) => {
            onDraftChange({ kind: 'number-grid', rounds })
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

    case 'classification':
      return (
        <Classification
          presentation={presentation}
          entries={draft?.kind === 'classification' ? draft.entries : []}
          stance={draft?.kind === 'classification' ? draft.stance : undefined}
          disabled={disabled}
          onChange={(value) => {
            onDraftChange({ kind: 'classification', ...value })
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
    case 'schedule-builder':
      return (
        presentation.kind === 'schedule-builder' &&
        presentation.activities.every(
          (activity) =>
            activity.optional ||
            draft.placements.some((p) => p.activityId === activity.id),
        )
      )
    case 'spatial-layout':
      return (
        presentation.kind === 'spatial-layout' &&
        presentation.objects.every(
          (object) =>
            object.optional ||
            draft.placements.some((p) => p.objectId === object.id),
        )
      )
    case 'decision-card':
    case 'timeline':
    case 'chart-interpretation':
    case 'information-request':
      return draft.optionId.length > 0
    case 'numeric-input':
      return /^[+-]?\d+(?:\.\d+)?$/u.test(draft.value)
    case 'budget-builder':
    case 'quantity-builder':
      return draft.lines.some((line) => line.quantity > 0)
    case 'assignment-board':
      return (
        presentation.kind === 'assignment-board' &&
        presentation.tasks.every(
          (task) =>
            task.optional === true ||
            draft.assignments.some((entry) => entry.taskId === task.id),
        )
      )
    case 'number-grid':
      // Cada paso del acto tiene que estar contestado. Una ronda vacía es una
      // respuesta legítima para el motor, pero enviarla sin haberla mirado es
      // casi siempre un descuido, así que la UI pide una marca por ronda y dice
      // cuál falta.
      return (
        presentation.kind === 'number-grid' &&
        presentation.rounds.every((round) =>
          draft.rounds.some(
            (entry) => entry.roundId === round.id && entry.numbers.length > 0,
          ),
        )
      )
    case 'classification':
      return (
        presentation.kind === 'classification' &&
        presentation.statements.every((statement) =>
          draft.entries.some((entry) => entry.statementId === statement.id),
        ) &&
        (presentation.stance === undefined || draft.stance !== undefined)
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
    case 'quantity-builder':
      return 'Agregá al menos una cantidad para confirmar.'
    case 'assignment-board': {
      const assigned =
        draft?.kind === 'assignment-board' ? draft.assignments : []
      const missing = presentation.tasks.filter(
        (task) =>
          task.optional !== true &&
          !assigned.some((entry) => entry.taskId === task.id),
      ).length
      return `Falta asignar ${String(missing)} ${missing === 1 ? 'tarea' : 'tareas'}.`
    }
    case 'schedule-builder':
      return 'Elegí el inicio de cada actividad obligatoria para confirmar.'
    case 'spatial-layout':
      return 'Incluí los objetos obligatorios y elegí su ubicación para confirmar.'
    case 'number-grid': {
      const marked = draft?.kind === 'number-grid' ? draft.rounds : []
      const pending = presentation.rounds.filter(
        (round) =>
          !marked.some(
            (entry) => entry.roundId === round.id && entry.numbers.length > 0,
          ),
      )
      const first = pending[0]
      if (first === undefined) {
        return undefined
      }
      return `Falta marcar el paso «${first.cue}» para confirmar.`
    }
    case 'classification': {
      const entries = draft?.kind === 'classification' ? draft.entries : []
      const pending = presentation.statements.filter(
        (statement) =>
          !entries.some((entry) => entry.statementId === statement.id),
      )
      const first = pending[0]
      if (first !== undefined)
        return `Falta clasificar «${first.label}» para confirmar.`
      if (
        presentation.stance !== undefined &&
        (draft?.kind !== 'classification' || draft.stance === undefined)
      )
        return `Falta responder «${presentation.stance.prompt}» para confirmar.`
      return undefined
    }
    default:
      return assertNever(presentation)
  }
}
