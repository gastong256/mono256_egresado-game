'use client'

/**
 * Budget builder control.
 *
 * Quantities are chosen with number inputs plus explicit increment and
 * decrement buttons. The buttons exist because the UX rules require fine
 * adjustment that does not depend on typing or dragging, and because a 44 px
 * target is far easier on a phone than a spinner arrow.
 */

import { useId } from 'react'

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
      <ul className="flex list-none flex-col gap-2 p-0">
        {items.map((item) => {
          const fieldId = `${groupId}-${item.id}`
          const quantity = quantityOf(lines, item.id)

          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-900"
            >
              <label htmlFor={fieldId} className="min-w-0 flex-1">
                <span className="block font-medium">{item.label}</span>
                <span className="block text-sm text-slate-600 dark:text-slate-400">
                  {item.unitPrice}
                </span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled || quantity <= 0}
                  aria-label={`Quitar uno de ${item.label}`}
                  onClick={() => {
                    setQuantity(item.id, quantity - 1, item.maxQuantity)
                  }}
                  className="h-11 w-11 rounded-lg border border-slate-300 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-40 dark:border-slate-600 dark:focus-visible:outline-slate-100"
                >
                  −
                </button>
                <input
                  id={fieldId}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={item.maxQuantity}
                  step={1}
                  value={quantity}
                  disabled={disabled}
                  onChange={(event) => {
                    setQuantity(
                      item.id,
                      Number.parseInt(event.target.value, 10),
                      item.maxQuantity,
                    )
                  }}
                  className="h-11 w-16 rounded-lg border border-slate-300 bg-white text-center tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:focus-visible:outline-slate-100"
                />
                <button
                  type="button"
                  disabled={disabled || quantity >= item.maxQuantity}
                  aria-label={`Agregar uno de ${item.label}`}
                  onClick={() => {
                    setQuantity(item.id, quantity + 1, item.maxQuantity)
                  }}
                  className="h-11 w-11 rounded-lg border border-slate-300 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-40 dark:border-slate-600 dark:focus-visible:outline-slate-100"
                >
                  +
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
