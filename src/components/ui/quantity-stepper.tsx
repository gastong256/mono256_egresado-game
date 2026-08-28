'use client'

import { cn } from '@/lib/ui/cn'

/**
 * Selector de cantidad.
 *
 * Un campo numérico con dos botones de 44 px a los costados. Los botones existen
 * porque las flechitas nativas de un `input[type=number]` son inusables con el
 * pulgar, y porque las reglas de UX piden ajuste fino que no dependa de escribir.
 *
 * Los signos son dos barras de 2 px dibujadas con CSS, no un ícono importado.
 * El pack de pictogramas está diferido a propósito —dibujar iconos antes de que
 * una pantalla los pida es cómo se podrean las librerías—, y un más y un menos
 * con terminación cuadrada son exactamente la geometría del resto del sistema.
 *
 * Los tres controles llevan nombre accesible obligatorio. No es una opción: un
 * `input[type=number]` suelto, sin etiqueta, es una violación de accesibilidad
 * crítica, y dejar que el componente se pueda usar mal es dejar que el bug
 * exista. Por eso los tres nombres son props requeridas.
 */

const BAR = 'absolute bg-current'

function MinusGlyph() {
  return (
    <span aria-hidden="true" className="relative block size-[18px]">
      <span className={cn(BAR, 'top-2 left-0 h-0.5 w-full')} />
    </span>
  )
}

function PlusGlyph() {
  return (
    <span aria-hidden="true" className="relative block size-[18px]">
      <span className={cn(BAR, 'top-2 left-0 h-0.5 w-full')} />
      <span className={cn(BAR, 'top-0 left-2 h-full w-0.5')} />
    </span>
  )
}

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
    'flex size-11 shrink-0 items-center justify-center',
    'border-ink bg-surface text-ink motion-select border-[1.5px]',
    'hover:bg-canvas-sunken',
    'disabled:cursor-not-allowed disabled:border-rule disabled:text-disabled-ink',
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
        <MinusGlyph />
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
          'border-ink bg-surface h-11 w-16 border-[1.5px]',
          'text-data font-display text-ink text-center tabular-nums',
          'disabled:bg-disabled-surface disabled:text-disabled-ink disabled:cursor-not-allowed',
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
        <PlusGlyph />
      </button>
    </div>
  )
}
