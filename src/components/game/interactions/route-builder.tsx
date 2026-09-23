'use client'

/**
 * Recorrido en red: el modo Spatial / Graph Canvas de 3.º.
 *
 * La respuesta es el **orden** de las paradas, y se arma con un `select` por
 * posición: teclado y tap producen exactamente la misma respuesta y nada exige
 * arrastrar. Cada posición ofrece sólo las paradas que todavía no están en el
 * recorrido, así que el borrador nunca repite una parada; para cambiar el orden
 * se saca una con «No ir» y se vuelve a elegir, y las que venían después suben
 * un lugar como en cualquier lista.
 *
 * El mapa dibuja las esquinas y dónde queda cada punto; **no** calcula ninguna
 * distancia ni dibuja el camino elegido como si fuera correcto. Contar cuadras
 * es la cuenta del desafío, y la misma información está escrita en la lista y
 * en el detalle de cada punto, así que nada depende de ver la cuadrícula.
 */

import { useId } from 'react'

import type { InteractionPresentation, PresentedRoutePoint } from '@/game'

type RoutePresentation = Extract<
  InteractionPresentation,
  { kind: 'route-builder' }
>

const ORDINALS = ['1.ª', '2.ª', '3.ª', '4.ª', '5.ª', '6.ª', '7.ª', '8.ª']

export interface RouteBuilderProps {
  readonly presentation: RoutePresentation
  readonly stops: readonly string[]
  readonly disabled: boolean
  readonly onChange: (value: readonly string[]) => void
}

export function RouteBuilder({
  presentation: p,
  stops,
  disabled,
  onChange,
}: RouteBuilderProps) {
  const prefix = useId()
  const pointOf = (id: string): PresentedRoutePoint | undefined =>
    p.points.find((point) => point.id === id)

  const set = (position: number, pointId: string) => {
    if (pointId === '') {
      onChange(stops.filter((_, index) => index !== position))
      return
    }
    const next = [...stops]
    // The list is dense: a new stop lands at the end of what is already
    // planned, so a position the player never filled cannot open a hole.
    if (position >= next.length) next.push(pointId)
    else next[position] = pointId
    onChange(next)
  }

  return (
    <fieldset
      disabled={disabled}
      className="flex min-w-0 flex-col gap-3 border-0 p-0"
    >
      <legend className="sr-only">Armá el recorrido</legend>
      <p className="text-body text-ink-secondary">{p.instructions}</p>

      <ul className="flex list-none flex-col gap-2 p-0">
        {p.points.map((_, position) => {
          const id = `${prefix}-stop-${String(position)}`
          const value = stops[position] ?? ''
          return (
            <li
              key={position}
              className="border-rule bg-surface flex min-w-0 flex-col gap-1 border p-3"
            >
              <label htmlFor={id} className="text-meta text-ink font-bold">
                {ORDINALS[position] ?? `${String(position + 1)}.ª`} parada
              </label>
              <select
                id={id}
                value={value}
                onChange={(event) => {
                  set(position, event.target.value)
                }}
                className="border-ink bg-surface text-ink text-option font-display block h-11 w-full border px-2"
              >
                <option value="">No ir</option>
                {p.points
                  .filter(
                    (point) =>
                      !stops.includes(point.id) || stops[position] === point.id,
                  )
                  .map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.label}
                      {point.optional ? ' (opcional)' : ''}
                    </option>
                  ))}
              </select>
              {value === '' ? null : (
                <p className="text-caption text-ink-secondary tabular-nums">
                  {pointOf(value)?.detail}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <MapView presentation={p} stops={stops} />

      <ol
        aria-label="Recorrido elegido"
        className="text-meta text-ink flex list-none flex-col gap-1 p-0 tabular-nums"
      >
        <li>
          Salida · {p.origin.label} · esquina {p.origin.x} y {p.origin.y}
        </li>
        {stops.map((stopId, position) => {
          const point = pointOf(stopId)
          return point === undefined ? null : (
            <li key={stopId}>
              {ORDINALS[position] ?? String(position + 1)} · {point.label} ·
              esquina {point.x} y {point.y}
            </li>
          )
        })}
      </ol>
    </fieldset>
  )
}

/**
 * El mapa de esquinas.
 *
 * Decorativo para la tecnología de asistencia: cada punto lleva su coordenada
 * escrita en la lista de paradas y en su propio detalle.
 */
function MapView({
  presentation: p,
  stops,
}: {
  readonly presentation: RoutePresentation
  readonly stops: readonly string[]
}) {
  const rows = Array.from({ length: p.height + 1 }, (_, row) => p.height - row)
  const columns = Array.from({ length: p.width + 1 }, (_, column) => column)
  const at = (x: number, y: number) => {
    if (p.origin.x === x && p.origin.y === y)
      return { code: p.origin.code, order: 'S' }
    const point = p.points.find((entry) => entry.x === x && entry.y === y)
    if (point === undefined) return undefined
    const position = stops.indexOf(point.id)
    return {
      code: point.code,
      order: position < 0 ? '·' : String(position + 1),
    }
  }

  return (
    <figure className="m-0" data-testid="route-map">
      <div
        aria-hidden="true"
        className="border-rule bg-canvas grid border"
        style={{
          gridTemplateColumns: `1.25rem repeat(${String(columns.length)}, minmax(0, 1fr))`,
        }}
      >
        {rows.map((y) => (
          <RouteRow key={y} y={y} columns={columns} at={at} />
        ))}
        <span className="text-caption text-ink-label px-0.5" />
        {columns.map((x) => (
          <span
            key={x}
            className="text-caption text-ink-label border-rule border-t px-0.5 text-center tabular-nums"
          >
            {x}
          </span>
        ))}
      </div>
      <figcaption className="text-caption text-ink-secondary mt-1">
        Cada casillero es una cuadra. «S» es la salida y el número es el orden
        que elegiste; «·» es un punto que todavía no está en el recorrido. Las
        cuadras entre dos puntos son tu cuenta: el mapa no las suma.
      </figcaption>
    </figure>
  )
}

function RouteRow({
  y,
  columns,
  at,
}: {
  readonly y: number
  readonly columns: readonly number[]
  readonly at: (
    x: number,
    y: number,
  ) => { readonly code: string; readonly order: string } | undefined
}) {
  return (
    <>
      <span className="text-caption text-ink-label border-rule border-r px-0.5 text-right tabular-nums">
        {y}
      </span>
      {columns.map((x) => {
        const mark = at(x, y)
        return (
          <span
            key={x}
            className="text-caption text-ink border-rule flex min-h-6 items-center justify-center border-r border-b text-center leading-tight"
          >
            {mark === undefined ? '' : `${mark.code}${mark.order}`}
          </span>
        )
      })}
    </>
  )
}
