'use client'

/**
 * Control compartido de opción única.
 *
 * Cuatro interacciones del motor —decision card, timeline, chart y pedido de
 * información— piden lo mismo: elegir una entre varias. Se diferencian en el
 * contexto que va arriba, no en la elección, así que comparten este control en
 * lugar de duplicar cuatro grupos de radios casi iguales.
 *
 * La accesibilidad es estructural: un grupo de radios nativo dentro de un
 * `fieldset` da navegación por teclado, semántica de grupo y etiquetado sin
 * escribir ARIA. El estado seleccionado lo dibuja `ChoiceCard`, que es neutro a
 * propósito.
 */

import { ChoiceCard } from '@/components/ui'
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
      <ul className="flex list-none flex-col gap-2.5 p-0">
        {options.map((option) => {
          const id = `${name}-${option.id}`

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
                onSelect={() => {
                  onSelect(option.id)
                }}
              />
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
