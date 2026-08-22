'use client'

/**
 * Respuesta numérica.
 *
 * El valor se guarda como la cadena que escribió el jugador y se envía como
 * literal decimal, nunca como `number` de JavaScript. El parseo pasa una sola
 * vez, adentro del motor y sobre racionales exactos: lo que se escribió es lo
 * que se evalúa.
 *
 * Un slider solo no cumpliría las reglas de UX —ajuste fino, teclado, lector de
 * pantalla—, así que el campo es el control y el slider es un acompañante grueso
 * atado al mismo valor.
 */

import { useId } from 'react'

import { NumberField } from '@/components/ui'

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
  const sliderId = useId()
  const numericValue = Number(value)
  const sliderValue = Number.isFinite(numericValue) ? value : min

  return (
    <div className="flex flex-col gap-4">
      <NumberField
        label="Tu respuesta"
        unit={unitLabel}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value)
        }}
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
        className="accent-primary w-full"
      />
    </div>
  )
}
