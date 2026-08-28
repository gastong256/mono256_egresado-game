'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

import { PartialMark, SlashMark, TickMark } from './marks'
import type { OutcomeTone } from './outcome-tone'

/**
 * Tarjeta de opción. El componente más importante del juego.
 *
 * > **Seleccionado es blanco, nunca verde.** Elegir significa «esta es mi
 * > decisión», no «esta es la correcta». El color de resultado aparece recién
 * > después de Confirmar. Es la regla más importante del sistema, y este
 * > componente existe para sostenerla: mientras `state` es `pending` no hay
 * > forma de que una opción tome verde ni rojo, porque `tone` sólo se lee en los
 * > estados resueltos.
 *
 * Por dentro es un `<input type="radio">` dentro de su `<label>`: el grupo se
 * recorre con flechas, se selecciona con espacio y un lector de pantalla lo
 * anuncia como lo que es. La tarjeta es la piel, no el widget.
 *
 * El input **es** la casilla de 32 px —restilado con `appearance-none`, no
 * escondido—, así que sigue siendo el blanco del clic a tamaño completo. El
 * tilde se dibuja encima con `pointer-events: none`, y el anillo de foco se
 * pinta sobre la fila entera con `has-[:focus-visible]` porque un anillo de
 * 32 px alrededor de la casilla no dice qué opción está enfocada.
 *
 * Las dos superficies no son decoración. La decisión ocurre en oscuro y el
 * resultado vuelve al papel; ese cambio de superficie *es* la transición de
 * estado, antes de que el color entre a jugar.
 */

/** En qué momento de la decisión está esta opción. */
export type ChoiceState =
  /** Todavía se está decidiendo. Ninguna opción revela nada. */
  | { readonly kind: 'pending' }
  /** Resuelto: ésta fue la elegida, y ahora sí lleva marca de corrección. */
  | { readonly kind: 'chosen'; readonly tone: OutcomeTone }
  /** Resuelto: ésta no se eligió. Baja de peso y no lleva marca. */
  | { readonly kind: 'unchosen' }

export interface ChoiceCardProps {
  readonly id: string
  readonly name: string
  readonly value: string
  readonly label: ReactNode
  /** Valor tabular al final de la fila: un precio, una hora, una cantidad. */
  readonly detail?: ReactNode
  readonly selected: boolean
  readonly disabled?: boolean
  readonly onSelect: () => void
  readonly state?: ChoiceState
  readonly surface?: 'decision' | 'paper'
  readonly className?: string
}

const BOX_ON_DECISION: Readonly<Record<OutcomeTone, string>> = {
  optimal: 'bg-outcome-optimal text-white border-0',
  resolved: 'border-outcome-resolved text-outcome-resolved',
  partial: 'border-outcome-partial text-outcome-partial',
  // El tachado no vive en una casilla: cae sobre la opción, no en un marco.
  insufficient: 'border-0 text-outcome-insufficient',
}

const ROW_ON_PAPER: Readonly<Record<OutcomeTone, string>> = {
  optimal: 'bg-surface border-outcome-optimal',
  resolved: 'bg-surface border-rule',
  partial: 'bg-surface border-outcome-partial',
  insufficient: 'bg-surface border-outcome-insufficient',
}

function ResolutionMark({ tone }: { readonly tone: OutcomeTone }) {
  if (tone === 'insufficient') {
    return <SlashMark />
  }
  if (tone === 'partial') {
    return <PartialMark />
  }
  return <TickMark className={tone === 'optimal' ? 'size-[17px]' : 'size-4'} />
}

export function ChoiceCard({
  id,
  name,
  value,
  label,
  detail,
  selected,
  disabled = false,
  onSelect,
  state = { kind: 'pending' },
  surface = 'decision',
  className,
}: ChoiceCardProps) {
  const onDecision = surface === 'decision'
  const pending = state.kind === 'pending'
  const chosen = state.kind === 'chosen'

  return (
    <label
      htmlFor={id}
      data-selected={selected}
      data-state={state.kind}
      className={cn(
        'font-display motion-select relative flex min-h-[52px] items-center gap-[10px]',
        'cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
        onDecision
          ? 'has-[:focus-visible]:outline-focus-ring-inverse px-2'
          : 'has-[:focus-visible]:outline-focus-ring border-[1.5px] px-[10px]',
        onDecision && pending && 'hover:bg-decision-raised',
        onDecision && chosen && 'bg-decision-raised',
        onDecision && selected && pending && 'bg-decision-raised',
        // Resuelta y no elegida: baja de peso, sin marca y sin color.
        onDecision && state.kind === 'unchosen' && 'opacity-40',
        !onDecision && pending && 'bg-surface border-rule hover:border-ink',
        !onDecision && chosen && ROW_ON_PAPER[state.tone],
        !onDecision &&
          state.kind === 'unchosen' &&
          'bg-canvas-sunken border-canvas-grid border opacity-55',
        disabled && pending && 'opacity-40',
        className,
      )}
    >
      <span className="relative block size-8 shrink-0">
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={selected}
          disabled={disabled || !pending}
          onChange={onSelect}
          className={cn(
            'motion-select absolute inset-0 size-full cursor-pointer appearance-none border-[1.5px]',
            'focus-visible:outline-none disabled:cursor-default',
            onDecision ? 'border-decision-rule' : 'border-rule bg-surface',
            // Seleccionado: casilla blanca llena. Nunca verde.
            selected && pending && 'bg-selected-box border-0',
            chosen && BOX_ON_DECISION[state.tone],
            chosen && !onDecision && state.tone === 'optimal' && 'bg-green',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center',
            selected && pending && 'text-on-selected-box',
            chosen && state.tone === 'optimal' && 'text-white',
            chosen && state.tone !== 'optimal' && 'text-current',
          )}
        >
          {selected && pending ? <TickMark /> : null}
          {chosen ? <ResolutionMark tone={state.tone} /> : null}
        </span>
      </span>

      <span
        className={cn(
          'text-option min-w-0 flex-1',
          onDecision
            ? selected || chosen
              ? 'text-on-decision-strong font-bold'
              : 'text-on-decision'
            : 'text-ink',
          !onDecision && (selected || chosen) && 'font-bold',
        )}
      >
        {label}
      </span>

      {detail === undefined ? null : (
        <span
          data-numeric
          className={cn(
            'text-detail shrink-0',
            onDecision
              ? selected || chosen
                ? 'text-on-decision-strong'
                : 'text-on-decision-muted'
              : 'text-ink',
          )}
        >
          {detail}
        </span>
      )}
    </label>
  )
}
