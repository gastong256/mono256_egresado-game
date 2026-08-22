'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Tarjeta de opción.
 *
 * Por dentro es un `<input type="radio">` dentro de su `<label>`: el grupo se
 * recorre con flechas, se selecciona con espacio y un lector de pantalla lo
 * anuncia como lo que es. La tarjeta es la piel, no el widget.
 *
 * El radio se restila con `appearance-none` pero sigue visible y sigue siendo el
 * blanco del clic. Esconderlo con `sr-only` habría roto dos cosas a la vez: el
 * anillo de foco se dibuja sobre el control, y un control de 1 px no recibe bien
 * el puntero.
 *
 * Regla de UX que este componente existe para sostener: **elegir no es acertar**.
 * El estado seleccionado es neutro —tinta gris oscura— y nunca verde. Si
 * seleccionar pintara la tarjeta de verde, el jugador deduciría que eligió bien
 * antes de confirmar, y el juego dejaría de ser una decisión.
 *
 * La selección tampoco depende del color: cambia el grosor del borde de la
 * tarjeta, el radio pasa de anillo fino a anillo grueso, y el propio input queda
 * marcado para la tecnología asistiva.
 */
export function ChoiceCard({
  id,
  name,
  value,
  label,
  detail,
  selected,
  disabled,
  onSelect,
  children,
}: {
  readonly id: string
  readonly name: string
  readonly value: string
  readonly label: ReactNode
  readonly detail?: ReactNode
  readonly selected: boolean
  readonly disabled: boolean
  readonly onSelect: () => void
  /** Contenido extra dentro de la tarjeta, debajo del detalle. */
  readonly children?: ReactNode
}) {
  return (
    <label
      htmlFor={id}
      data-selected={selected}
      className={cn(
        'rounded-surface flex min-h-14 cursor-pointer items-start gap-3 p-4 text-left',
        'motion-fast border-2 transition-[background-color,border-color]',
        'bg-surface border-line hover:border-line-interactive',
        selected && 'bg-selected-surface border-line-selected',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
        className={cn(
          'mt-0.5 size-6 shrink-0 cursor-pointer appearance-none rounded-full',
          'border-line-interactive bg-surface border-2',
          'motion-fast transition-[border-width,border-color]',
          'checked:border-line-selected checked:border-[7px]',
          'disabled:cursor-not-allowed',
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="text-subheading text-foreground block">{label}</span>
        {detail === undefined ? null : (
          <span className="text-body-sm text-foreground-muted mt-0.5 block">
            {detail}
          </span>
        )}
        {children}
      </span>
    </label>
  )
}
