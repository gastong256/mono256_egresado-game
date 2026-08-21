'use client'

/**
 * Shared single-choice control.
 *
 * Four contracted interactions — decision card, timeline, chart interpretation
 * and information request — all ask the player to pick one option. They differ
 * in the context drawn above the choice, not in the choice itself, so they share
 * this control rather than duplicating four nearly identical radio groups.
 *
 * Accessibility is structural here, not polish: a native radio group inside a
 * fieldset gives keyboard navigation, grouping semantics and screen-reader
 * labelling for free, and the visible state never depends on colour alone.
 */

import type { PresentedOption } from '@/game'

export interface OptionGroupProps {
  readonly legend: string
  readonly name: string
  readonly options: readonly PresentedOption[]
  readonly value: string | undefined
  readonly disabled: boolean
  readonly onSelect: (optionId: string) => void
}

export function OptionGroup({
  legend,
  name,
  options,
  value,
  disabled,
  onSelect,
}: OptionGroupProps) {
  return (
    <fieldset className="min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      <ul className="flex list-none flex-col gap-2 p-0">
        {options.map((option) => {
          const id = `${name}-${option.id}`
          const selected = value === option.id

          return (
            <li key={option.id}>
              <label
                htmlFor={id}
                data-selected={selected}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-300 bg-white p-3 text-left transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-slate-900 data-[selected=true]:border-slate-900 data-[selected=true]:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:focus-within:outline-slate-100 dark:data-[selected=true]:border-slate-100 dark:data-[selected=true]:bg-slate-800"
              >
                <input
                  type="radio"
                  id={id}
                  name={name}
                  value={option.id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => {
                    onSelect(option.id)
                  }}
                  className="mt-1 h-5 w-5 shrink-0 accent-slate-900 dark:accent-slate-100"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{option.label}</span>
                  {option.detail === undefined ? null : (
                    <span className="block text-sm text-slate-600 dark:text-slate-400">
                      {option.detail}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

/** Read-only list of the numbers a challenge gives the player. */
export function DataList({
  items,
}: {
  readonly items: readonly { label: string; value: string }[]
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-slate-600 dark:text-slate-400">{item.label}</dt>
          <dd className="font-medium tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
