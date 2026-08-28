'use client'

/**
 * Lista de opciones.
 *
 * Cuatro interacciones del motor —decision card, timeline, chart y pedido de
 * información— piden lo mismo: elegir una entre varias. Se diferencian en el
 * contexto que va arriba, no en la elección, así que comparten esta lista en
 * lugar de duplicar cuatro grupos de radios casi iguales.
 *
 * La accesibilidad es estructural: son radios nativos que comparten `name`, así
 * que las flechas, la selección con espacio y el anuncio como grupo vienen sin
 * escribir una línea de ARIA. El nombre del grupo lo pone la consigna, que es la
 * `legend` del bloque de decisión.
 *
 * El estado seleccionado lo dibuja `ChoiceCard`, que es neutro a propósito:
 * elegir no puede parecerse a acertar.
 */

import { ChoiceCard, type OutcomeTone } from '@/components/ui'
import type { PresentedOption } from '@/game'

export interface OptionListProps {
  readonly name: string
  readonly options: readonly PresentedOption[]
  readonly value: string | undefined
  readonly disabled: boolean
  /** Presente sólo después de confirmar. Antes no hay color de resultado. */
  readonly resolution?: {
    readonly chosenId: string | undefined
    readonly tone: OutcomeTone
  }
  readonly onSelect: (optionId: string) => void
}

export function OptionList({
  name,
  options,
  value,
  disabled,
  resolution,
  onSelect,
}: OptionListProps) {
  return (
    <ul className="flex list-none flex-col gap-1.5 p-0">
      {options.map((option) => {
        const id = `${name}-${option.id}`
        const chosen =
          resolution !== undefined && resolution.chosenId === option.id

        return (
          <li key={option.id}>
            <ChoiceCard
              id={id}
              name={name}
              value={option.id}
              label={option.label}
              {...(option.detail === undefined
                ? {}
                : { detail: option.detail })}
              selected={value === option.id}
              disabled={disabled}
              state={
                resolution === undefined
                  ? { kind: 'pending' }
                  : chosen
                    ? { kind: 'chosen', tone: resolution.tone }
                    : { kind: 'unchosen' }
              }
              onSelect={() => {
                onSelect(option.id)
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}
