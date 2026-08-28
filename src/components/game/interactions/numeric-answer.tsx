'use client'

/**
 * Respuesta numérica libre.
 *
 * El valor se guarda como la cadena que escribió el jugador y se envía como
 * literal decimal, nunca como `number` de JavaScript. El parseo pasa una sola
 * vez, adentro del motor y sobre racionales exactos: lo que se escribió es lo
 * que se evalúa.
 *
 * Los steppers de 44×44 son el ajuste fino con el pulgar; el campo es el control
 * real y funciona solo con teclado.
 *
 * **La validación es al blur, nunca por tecla.** Marcar en rojo a alguien que
 * todavía está escribiendo el segundo dígito de `14` no es ayudar, es
 * interrumpir. El error se anuncia con `role="alert"` y marca `aria-invalid`, así
 * que nunca depende de que el borde se vea rojo.
 */

import { useId, useState } from 'react'

import { cn } from '@/lib/ui/cn'

export interface NumericAnswerProps {
  readonly unitLabel: string
  readonly min: string
  readonly max: string
  readonly step: string
  readonly value: string
  readonly disabled: boolean
  readonly onChange: (value: string) => void
}

const STEP_BUTTON = cn(
  'flex size-11 shrink-0 items-center justify-center border-[1.5px]',
  'border-decision-rule text-on-decision motion-select',
  'hover:border-decision-rule-hover hover:bg-decision-raised cursor-pointer',
  'disabled:cursor-not-allowed disabled:opacity-40',
)

export function NumericAnswer({
  unitLabel,
  min,
  max,
  step,
  value,
  disabled,
  onChange,
}: NumericAnswerProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [touched, setTouched] = useState(false)

  const numeric = Number(value)
  const stepValue = Number(step)
  const outOfRange =
    value !== '' &&
    Number.isFinite(numeric) &&
    (numeric < Number(min) || numeric > Number(max))
  const error = touched
    ? value === ''
      ? 'Escribí un número.'
      : outOfRange
        ? `Tiene que estar entre ${min} y ${max}.`
        : undefined
    : undefined

  const nudge = (direction: 1 | -1): void => {
    const base = Number.isFinite(numeric) ? numeric : Number(min)
    const stepped =
      base + direction * (Number.isFinite(stepValue) ? stepValue : 1)
    const clamped = Math.min(Number(max), Math.max(Number(min), stepped))
    // Se reescribe con la misma precisión que el paso, así que sumar 0,1 diez
    // veces no produce `0.9999999999999999`.
    const decimals = (step.split('.')[1] ?? '').length
    onChange(clamped.toFixed(decimals))
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        Tu respuesta en {unitLabel}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={STEP_BUTTON}
          disabled={disabled}
          aria-label={`Restar ${step} ${unitLabel}`}
          onClick={() => {
            nudge(-1)
          }}
        >
          <span aria-hidden="true" className="h-0.5 w-4 bg-current" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={error === undefined ? undefined : errorId}
          onBlur={() => {
            setTouched(true)
          }}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          className={cn(
            'text-data font-display h-11 min-w-0 flex-1 border-[1.5px] px-3 text-right tabular-nums',
            'bg-decision-raised text-on-decision-strong border-decision-rule',
            'aria-[invalid=true]:border-aura-loss',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        />
        <button
          type="button"
          className={STEP_BUTTON}
          disabled={disabled}
          aria-label={`Sumar ${step} ${unitLabel}`}
          onClick={() => {
            nudge(1)
          }}
        >
          <span aria-hidden="true" className="relative block size-4">
            <span className="absolute top-[7px] left-0 h-0.5 w-full bg-current" />
            <span className="absolute top-0 left-[7px] h-full w-0.5 bg-current" />
          </span>
        </button>
        <span className="text-meta text-on-decision-muted shrink-0">
          {unitLabel}
        </span>
      </div>
      {error === undefined ? null : (
        <p
          id={errorId}
          role="alert"
          className="text-caption font-display text-aura-loss"
        >
          {error}
        </p>
      )}
    </div>
  )
}
