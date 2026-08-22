'use client'

/**
 * Armado de presupuesto.
 *
 * Cada ítem es una fila con su precio unitario y un selector de cantidad. Se
 * parece más a un mostrador que a una planilla: el precio va como dato, no como
 * celda, y la cantidad se toca con el pulgar.
 *
 * No muestra el total. Calcularlo es exactamente el desafío; mostrarlo lo
 * convertiría en comparar dos números que sacó otro.
 */

import { useId } from 'react'

import { QuantityStepper } from '@/components/ui'
import type { BudgetLine, PresentedBudgetItem } from '@/game'

export interface BudgetBuilderProps {
  readonly items: readonly PresentedBudgetItem[]
  readonly lines: readonly BudgetLine[]
  readonly disabled: boolean
  readonly onChange: (lines: readonly BudgetLine[]) => void
}

function quantityOf(lines: readonly BudgetLine[], itemId: string): number {
  return lines.find((line) => line.itemId === itemId)?.quantity ?? 0
}

export function BudgetBuilder({
  items,
  lines,
  disabled,
  onChange,
}: BudgetBuilderProps) {
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
      <ul className="flex list-none flex-col gap-2.5 p-0">
        {items.map((item) => {
          const fieldId = `${groupId}-${item.id}`
          const quantity = quantityOf(lines, item.id)

          return (
            <li
              key={item.id}
              data-chosen={quantity > 0}
              className="border-line bg-surface rounded-surface data-[chosen=true]:border-line-selected flex flex-wrap items-center justify-between gap-3 border-2 p-3"
            >
              <label htmlFor={fieldId} className="min-w-0 flex-1">
                <span className="text-subheading text-foreground block">
                  {item.label}
                </span>
                <span
                  data-numeric
                  className="text-body-sm text-data-foreground block font-semibold"
                >
                  {item.unitPrice}
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
                onChange={(next) => {
                  setQuantity(item.id, next, item.maxQuantity)
                }}
              />
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
