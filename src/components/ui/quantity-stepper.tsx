'use client'

import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/ui/cn'

/**
 * Selector de cantidad.
 *
 * Un campo numérico con dos botones de 44 px a los costados. Los botones existen
 * porque las flechitas nativas de un `input[type=number]` son inusables con el
 * pulgar, y porque las reglas de UX piden ajuste fino que no dependa de escribir.
 *
 * Los tres controles llevan nombre accesible obligatorio. No es una opción: un
 * `input[type=number]` suelto, sin etiqueta, es una violación de accesibilidad
 * crítica, y dejar que el componente se pueda usar mal es dejar que el bug
 * exista. Por eso los tres nombres son props requeridas.
 */
export function QuantityStepper({
  id,
  value,
  min = 0,
  max,
  disabled = false,
  valueLabel,
  decreaseLabel,
  increaseLabel,
  onChange,
  className,
}: {
  readonly id: string
  readonly value: number
  readonly min?: number
  readonly max: number
  readonly disabled?: boolean
  /** Nombre del campo de cantidad, por ejemplo «Cantidad de alfajor suelto». */
  readonly valueLabel: string
  readonly decreaseLabel: string
  readonly increaseLabel: string
  readonly onChange: (value: number) => void
  readonly className?: string
}) {
  const stepButton = cn(
    'flex size-11 shrink-0 items-center justify-center rounded-control',
    'border border-line-interactive bg-surface text-foreground',
    'motion-fast transition-[background-color,border-color]',
    'hover:bg-surface-muted',
    'disabled:cursor-not-allowed disabled:border-disabled-line disabled:text-disabled-foreground',
  )

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        disabled={disabled || value <= min}
        aria-label={decreaseLabel}
        onClick={() => {
          onChange(value - 1)
        }}
        className={stepButton}
      >
        <Minus aria-hidden="true" className="size-5" />
      </button>
      <input
        id={id}
        type="number"
        aria-label={valueLabel}
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10)
          onChange(Number.isFinite(parsed) ? parsed : min)
        }}
        className={cn(
          'rounded-control border-line-interactive bg-surface h-11 w-16 border',
          'text-data text-foreground text-center tabular-nums',
          'disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:cursor-not-allowed',
        )}
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        aria-label={increaseLabel}
        onClick={() => {
          onChange(value + 1)
        }}
        className={stepButton}
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}
