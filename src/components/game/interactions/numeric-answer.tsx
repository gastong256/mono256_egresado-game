'use client'

/**
 * Numeric answer control.
 *
 * The value is kept as the string the player typed and submitted as a decimal
 * literal, never as a JavaScript number. Parsing happens once, inside the
 * engine, on exact rationals — so what the player wrote is what gets evaluated.
 *
 * A range input alone would fail the UX rules (fine adjustment, keyboard,
 * screen readers), so the number field is the control and the slider is an
 * optional coarse companion bound to the same value.
 */

import { useId } from 'react'

export interface NumericAnswerProps {
  readonly unitLabel: string
  readonly min: string
  readonly max: string
  readonly step: string
  readonly value: string
  readonly disabled: boolean
  readonly onChange: (value: string) => void
}

export function NumericAnswer({
  unitLabel,
  min,
  max,
  step,
  value,
  disabled,
  onChange,
}: NumericAnswerProps) {
  const fieldId = useId()
  const sliderId = `${fieldId}-slider`
  const numericValue = Number(value)
  const sliderValue = Number.isFinite(numericValue) ? value : min

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={fieldId} className="text-sm font-medium">
        Tu respuesta ({unitLabel})
      </label>
      <input
        id={fieldId}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:focus-visible:outline-slate-100"
      />
      <label htmlFor={sliderId} className="sr-only">
        Ajuste aproximado ({unitLabel})
      </label>
      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className="w-full accent-slate-900 dark:accent-slate-100"
      />
    </div>
  )
}
