'use client'

/**
 * Las rondas de una grilla de clasificación.
 *
 * Compone una `NumberGrid` por ronda y junta el borrador. Como el tablero de
 * asignación y el presupuesto, vive sobre el papel y no dentro del bloque
 * oscuro: son tres grillas anchas, y encerrarlas en el bloque de decisión las
 * volvería ilegibles antes que enfocadas.
 *
 * **Acá no se clasifica nada.** Ni qué es un número primo, ni cuántos acertó, ni
 * qué calidad salió: eso lo decide el motor. Lo único que este componente hace
 * con matemática es, *una vez que el motor ya resolvió el desafío*, pedirle a
 * `classifyCell` —la misma función que usó el evaluador— cómo quedó cada celda,
 * para poder dibujar la corrección. Que la respuesta salga de una única función
 * del dominio es lo que garantiza que la grilla corregida no pueda contradecir al
 * ledger que tiene debajo.
 *
 * Antes de resolver no se llama a nada: `resolved` es `false`, ninguna celda
 * recibe `resolution` y marcar sigue significando sólo «elegí ésta».
 */

import {
  classifyCell,
  type GridRoundSelection,
  type PresentedGridRound,
} from '@/game'
import { NumberGrid, type NumberGridCell } from '@/components/ui'

export interface NumberGridBoardProps {
  readonly rounds: readonly PresentedGridRound[]
  readonly columns: number
  readonly selections: readonly GridRoundSelection[]
  readonly disabled: boolean
  /** El motor ya evaluó: recién ahora las celdas pueden decir cómo quedaron. */
  readonly resolved: boolean
  readonly onChange: (selections: readonly GridRoundSelection[]) => void
}

/** La presentación declara columnas; la primitiva sólo soporta las dos que el sistema dibuja. */
function toColumns(columns: number): 3 | 4 {
  return columns === 3 ? 3 : 4
}

export function NumberGridBoard({
  rounds,
  columns,
  selections,
  disabled,
  resolved,
  onChange,
}: NumberGridBoardProps) {
  const selectedIn = (roundId: string): readonly number[] =>
    selections.find((entry) => entry.roundId === roundId)?.numbers ?? []

  const toggle = (roundId: string, value: number): void => {
    const current = selectedIn(roundId)
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value]

    // El borrador siempre lleva las tres rondas, en el orden de la
    // presentación: así una ronda que quedó vacía viaja como vacía y no como
    // ausente, que es lo que el evaluador necesita para distinguir «no marcó
    // nada» de «no llegó a este paso».
    onChange(
      rounds.map((round) => ({
        roundId: round.id,
        numbers: round.id === roundId ? next : [...selectedIn(round.id)],
      })),
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {rounds.map((round) => {
        const selected = selectedIn(round.id)
        const cells: NumberGridCell[] = round.numbers.map((value) => ({
          id: String(value),
          value: String(value),
          selected: selected.includes(value),
          ...(resolved
            ? {
                resolution: classifyCell(
                  round.rule,
                  value,
                  selected.includes(value),
                ),
              }
            : {}),
        }))

        const missed = resolved
          ? cells.filter((cell) => cell.resolution === 'missed').length
          : 0

        return (
          <NumberGrid
            key={round.id}
            cue={round.cue}
            rule={round.ruleLabel}
            columns={toColumns(columns)}
            cells={cells}
            disabled={disabled}
            {...(missed > 0
              ? {
                  note: `Los punteados cumplían «${round.ruleLabel}» y no los marcaste.`,
                }
              : {})}
            onToggle={(id) => {
              toggle(round.id, Number(id))
            }}
          />
        )
      })}
    </div>
  )
}
