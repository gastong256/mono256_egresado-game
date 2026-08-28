'use client'

import { useId } from 'react'

import { cn } from '@/lib/ui/cn'

import { Eyebrow } from './badge'
import { PartialMark, SlashMark, TickMark } from './marks'

/**
 * Grilla de clasificación.
 *
 * Una regla escrita arriba y una grilla de números abajo: el jugador marca los
 * que la cumplen. Es la primitiva de la familia de interacción «grilla», no una
 * pantalla: el acto del 25 de Mayo es su primer contenido, y cualquier otra
 * clasificación —divisores, fracciones equivalentes— usa esta misma pieza.
 *
 * > **Marcado no es correcto.** Igual que en `ChoiceCard`, mientras no llega una
 * > `resolution` la celda marcada es **blanca con borde de tinta y tilde**, nunca
 * > verde. Marcar significa «elegí ésta», no «acerté». La regla está sostenida
 * > por la estructura y no por disciplina: `resolution` es opcional y los colores
 * > de resultado sólo se leen dentro de esa rama, así que una grilla sin corregir
 * > no tiene forma de tomar verde ni rojo.
 *
 * Por dentro cada celda es un `<input type="checkbox">` dentro de su `<label>`,
 * restilado con `appearance-none` y no escondido: la celda entera de 56 px **es**
 * la casilla, así que sigue siendo el blanco del toque a tamaño completo. Se
 * recorre con Tab y se marca con Espacio, que es lo que un grupo de casillas hace
 * de forma nativa; un lector de pantalla lo anuncia como «casilla, 12, no
 * marcado» sin que haya que enseñarle nada.
 *
 * Los cuatro estados corregidos no se distinguen por color. Cada uno cambia
 * **relleno, trazo del borde y glifo** a la vez, y además lleva la palabra en
 * texto sólo para lector de pantalla:
 *
 * | | marcada | sin marcar |
 * |---|---|---|
 * | **cumplía** | `hit` — relleno verde, tilde | `missed` — borde punteado, cuadrado |
 * | **no cumplía** | `extra` — borde rojo, tachado | `clear` — regla fina, sin glifo |
 *
 * La grilla se lee igual en escala de grises, que es la prueba que este sistema
 * le exige a cualquier estado.
 */

/** Cómo quedó una celda una vez corregida. Vocabulario de clasificación, no de juego. */
export type NumberGridResolution = 'hit' | 'extra' | 'missed' | 'clear'

export interface NumberGridCell {
  readonly id: string
  /** El número, ya escrito. La primitiva no formatea. */
  readonly value: string
  readonly selected: boolean
  /** Presente sólo después de corregir. Su ausencia es lo que mantiene la regla. */
  readonly resolution?: NumberGridResolution
}

const COLUMN_CLASS: Readonly<Record<3 | 4, string>> = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

const RESOLVED_CELL: Readonly<Record<NumberGridResolution, string>> = {
  // Cumplía y la marcaste: relleno lleno, como el tilde del docente sobre el
  // renglón. Es el único estado con fondo saturado.
  hit: 'bg-outcome-optimal text-white border-0',
  // Marcaste de más: borde rojo y tachado encima.
  extra:
    'bg-surface border-outcome-insufficient text-outcome-insufficient border-[1.5px]',
  // Cumplía y no la marcaste: punteado. El hueco se lee como hueco sin depender
  // del color, igual que la tarea sin asignar del tablero.
  missed:
    'bg-surface border-outcome-optimal text-ink border-[1.5px] border-dashed',
  // No cumplía y no la marcaste: no pasó nada. Baja de peso y no lleva glifo.
  clear: 'bg-canvas-sunken border-rule text-ink-label border',
}

/** La palabra del estado. Sólo para lector de pantalla: el glifo ya lo dice. */
const RESOLVED_WORD: Readonly<Record<NumberGridResolution, string>> = {
  hit: 'marcado y correspondía',
  extra: 'marcado de más',
  missed: 'sin marcar y correspondía',
  clear: 'sin marcar y no correspondía',
}

function ResolutionGlyph({
  resolution,
}: {
  readonly resolution: NumberGridResolution
}) {
  switch (resolution) {
    case 'hit':
      return <TickMark className="size-[15px]" />
    case 'extra':
      return <SlashMark className="size-[15px]" />
    case 'missed':
      return <PartialMark className="text-outcome-optimal" />
    case 'clear':
      return null
  }
}

export interface NumberGridProps {
  /** El paso al que corresponde la grilla: «Pañuelo blanco». */
  readonly cue: string
  /** La regla, escrita. Nunca es opcional: la consigna no puede ser un color. */
  readonly rule: string
  readonly cells: readonly NumberGridCell[]
  readonly columns?: 3 | 4
  readonly disabled?: boolean
  readonly onToggle: (id: string) => void
  /** Nota al pie, para explicar la corrección una vez que existe. */
  readonly note?: string
  readonly className?: string
}

export function NumberGrid({
  cue,
  rule,
  cells,
  columns = 4,
  disabled = false,
  onToggle,
  note,
  className,
}: NumberGridProps) {
  const groupId = useId()
  const headingId = `${groupId}-rule`

  return (
    <section
      aria-labelledby={headingId}
      data-testid="number-grid"
      className={cn('flex min-w-0 flex-col gap-2.5', className)}
    >
      {/*
        La consigna de la ronda. Borde rojo porque es la restricción de la
        pantalla —tensión, no error—, el mismo rojo que subraya la cifra que
        aprieta en una caja de dato.
      */}
      <div
        id={headingId}
        className="bg-surface border-red flex flex-col gap-0.5 border-[1.5px] px-3 py-2.5"
      >
        <Eyebrow>{cue}</Eyebrow>
        <span className="text-title font-display text-ink">{rule}</span>
      </div>

      <div className={cn('grid gap-1.5', COLUMN_CLASS[columns])}>
        {cells.map((cell) => {
          const cellId = `${groupId}-${cell.id}`
          const { resolution } = cell
          const pending = resolution === undefined

          return (
            <label
              key={cell.id}
              htmlFor={cellId}
              data-value={cell.value}
              data-selected={cell.selected}
              data-resolution={resolution ?? 'pending'}
              className={cn(
                'motion-select relative flex min-h-[56px] items-center justify-center',
                'cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                'has-[:focus-visible]:outline-focus-ring',
                pending &&
                  (cell.selected
                    ? // Marcado: blanco con borde de tinta. Nunca verde.
                      'bg-selected-box border-ink text-ink border-2'
                    : 'bg-canvas-sunken border-rule text-ink-secondary hover:border-ink border'),
                resolution !== undefined && RESOLVED_CELL[resolution],
                disabled && pending && 'cursor-default opacity-40',
              )}
            >
              <input
                type="checkbox"
                id={cellId}
                checked={cell.selected}
                disabled={disabled || !pending}
                onChange={() => {
                  onToggle(cell.id)
                }}
                className="absolute inset-0 size-full cursor-pointer appearance-none focus-visible:outline-none disabled:cursor-default"
              />
              <span
                aria-hidden="true"
                data-numeric
                className="text-data font-display pointer-events-none"
              >
                {cell.value}
              </span>
              {/*
                El glifo cae *sobre* la celda, arriba a la derecha, y no en un
                marco alrededor: es la marca de corrección del sistema.
              */}
              {pending && cell.selected ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1 right-1"
                >
                  <TickMark className="size-[13px]" />
                </span>
              ) : null}
              {resolution === undefined ? null : (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1 right-1"
                >
                  <ResolutionGlyph resolution={resolution} />
                </span>
              )}
              <span className="sr-only">
                {cell.value}
                {resolution === undefined
                  ? ''
                  : `, ${RESOLVED_WORD[resolution]}`}
              </span>
            </label>
          )
        })}
      </div>

      {note === undefined ? null : (
        <p className="text-caption text-ink-secondary text-pretty">{note}</p>
      )}
    </section>
  )
}
