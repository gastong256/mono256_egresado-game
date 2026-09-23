'use client'

/**
 * Armado de presupuesto y de cantidades.
 *
 * Cada ítem es una fila con su dato por unidad y un selector de cantidad. Se
 * parece más a un mostrador que a una planilla: el precio o el consumo va como
 * dato, no como celda, y la cantidad se toca con el pulgar.
 *
 * **No muestra el total corriente.** Calcularlo es exactamente el desafío;
 * mostrarlo lo convertiría en comparar dos números que sacó otro. El handoff de
 * diseño especifica un total anclado arriba del slot de acción, pero marca esta
 * interacción como «especificada, no construida» y la difiere a v0.3 — así que la
 * diferencia es una decisión de gameplay pendiente, no una deuda de
 * implementación. Queda anotada en el registro de preguntas abiertas.
 *
 * El presupuesto disponible sí está a la vista: es la restricción, y esconderla
 * convertiría el problema en adivinanza.
 *
 * Una **distribución** (la rueda de 1.º) agrega la vista de sus posiciones:
 * reparte conteos entre posiciones iguales, y ver las posiciones ocupadas es la
 * representación del objeto que se construye, no una cuenta hecha por la UI.
 */

import { useId } from 'react'

import { QuantityStepper } from '@/components/ui'
import type {
  BudgetLine,
  PresentedBudgetItem,
  PresentedQuantityItem,
} from '@/game'

export interface BudgetBuilderProps {
  readonly items: readonly PresentedBudgetItem[]
  readonly budgetLabel: string
  readonly lines: readonly BudgetLine[]
  readonly disabled: boolean
  readonly onChange: (lines: readonly BudgetLine[]) => void
}

function quantityOf(lines: readonly BudgetLine[], itemId: string): number {
  return lines.find((line) => line.itemId === itemId)?.quantity ?? 0
}

export function BudgetBuilder({
  items,
  budgetLabel,
  lines,
  disabled,
  onChange,
}: BudgetBuilderProps) {
  return (
    <QuantityBuilder
      items={items.map((item) => ({ ...item, detail: item.unitPrice }))}
      instructions={budgetLabel}
      lines={lines}
      disabled={disabled}
      onChange={onChange}
    />
  )
}

export interface QuantityBuilderProps {
  readonly items: readonly PresentedQuantityItem[]
  readonly instructions: string
  readonly lines: readonly BudgetLine[]
  readonly disabled: boolean
  readonly onChange: (lines: readonly BudgetLine[]) => void
  /** Equiprobable positions the counts fill, when the plan is a distribution. */
  readonly positions?: number
}

/** Same accessible quantity controls for counts, resources and distributions. */
export function QuantityBuilder({
  items,
  instructions,
  lines,
  disabled,
  onChange,
  positions,
}: QuantityBuilderProps) {
  const groupId = useId()

  const setQuantity = (itemId: string, quantity: number, max: number): void => {
    const clamped = Math.max(
      0,
      Math.min(Number.isFinite(quantity) ? quantity : 0, max),
    )
    const next = items.map((item) => ({
      itemId: item.id,
      quantity: item.id === itemId ? clamped : quantityOf(lines, item.id),
    }))
    onChange(next)
  }

  return (
    <fieldset className="min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">Elegí las cantidades</legend>
      {positions === undefined ? null : (
        <PositionsPreview items={items} lines={lines} total={positions} />
      )}
      <ul className="flex list-none flex-col gap-1.5 p-0">
        {items.map((item) => {
          const fieldId = `${groupId}-${item.id}`
          const quantity = quantityOf(lines, item.id)

          return (
            <li
              key={item.id}
              data-chosen={quantity > 0}
              className="bg-surface border-rule data-[chosen=true]:border-ink flex flex-wrap items-center justify-between gap-3 border p-3 data-[chosen=true]:border-[1.5px]"
            >
              {/*
                La etiqueta pide nueve rem antes de compartir la fila con el
                selector: en un teléfono los tres controles de 44 px bajan a
                su propio renglón, a la derecha, y el nombre del ítem se lee
                entero en vez de romperse en una columna de una palabra.
              */}
              <label htmlFor={fieldId} className="min-w-0 flex-[1_1_9rem]">
                <span className="text-goal font-display text-ink block">
                  {item.code === undefined ? null : (
                    <span
                      aria-hidden="true"
                      className="border-ink text-meta mr-2 inline-block border px-1 font-bold"
                    >
                      {item.code}
                    </span>
                  )}
                  {item.label}
                </span>
                <span
                  data-numeric
                  className="text-meta font-display text-ink block font-bold"
                >
                  {item.detail}
                </span>
              </label>
              <QuantityStepper
                id={fieldId}
                value={quantity}
                max={item.maxQuantity}
                disabled={disabled}
                valueLabel={`Cantidad de ${item.label}`}
                decreaseLabel={`Quitar uno de ${item.label}`}
                increaseLabel={`Agregar uno de ${item.label}`}
                className="ml-auto"
                onChange={(next) => {
                  setQuantity(item.id, next, item.maxQuantity)
                }}
              />
            </li>
          )
        })}
      </ul>
      <p className="text-caption text-ink-secondary mt-3">{instructions}</p>
    </fieldset>
  )
}

/**
 * Las posiciones que ocupan los conteos de una distribución.
 *
 * Dibuja el reparto, no lo juzga: no dice si cumple la regla ni convierte un
 * conteo en fracción. Cada posición lleva escrito el código de su categoría,
 * así que nada depende del color, y una posición libre tiene borde punteado,
 * como una tarea sin asignar. La lectura accesible del reparto son los campos
 * de cantidad; esta vista los acompaña y lo dice en su pie.
 */
function PositionsPreview({
  items,
  lines,
  total,
}: {
  readonly items: readonly PresentedQuantityItem[]
  readonly lines: readonly BudgetLine[]
  readonly total: number
}) {
  const captionId = useId()
  const filled = items.flatMap((item) =>
    Array.from(
      { length: quantityOf(lines, item.id) },
      () => item.code ?? item.label,
    ),
  )
  const extra = Math.max(0, filled.length - total)
  const free = Math.max(0, total - filled.length)

  return (
    <figure
      aria-labelledby={captionId}
      className="mb-3"
      data-testid="positions"
    >
      <ol aria-hidden="true" className="grid list-none grid-cols-6 gap-1 p-0">
        {filled.slice(0, total).map((code, i) => (
          <li
            key={`filled-${String(i)}`}
            className="border-ink bg-surface text-meta font-display text-ink flex h-9 items-center justify-center border font-bold"
          >
            {code}
          </li>
        ))}
        {Array.from({ length: free }, (_, i) => (
          <li
            key={`free-${String(i)}`}
            className="border-rule h-9 border border-dashed"
          />
        ))}
      </ol>
      <figcaption
        id={captionId}
        className="text-caption text-ink-secondary mt-2"
      >
        Rueda de {total} posiciones iguales.{' '}
        {free > 0
          ? `Quedan ${String(free)} sin asignar.`
          : extra > 0
            ? `Hay ${String(extra)} de más.`
            : 'Todas asignadas.'}
      </figcaption>
    </figure>
  )
}
