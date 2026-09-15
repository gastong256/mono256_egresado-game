'use client'

/**
 * Plano por coordenadas: el modo Spatial / Graph Canvas de 1.º.
 *
 * Las coordenadas del plano son dato público y semántico —celdas enteras desde
 * 0—, nunca píxeles. La entrada son controles nativos por objeto (incluir, X,
 * Y, orientación): teclado y tap producen exactamente la misma respuesta, y
 * nada exige arrastrar.
 *
 * El plano dibuja lo elegido y no decide nada: cada celda lleva escrito el
 * código del objeto que la ocupa, o la marca de lo que ya estaba —columna,
 * pasillo que queda libre, puerta—, así que ningún estado depende del color.
 * Dos objetos en la misma celda se escriben juntos; no se señalan como error.
 */

import { useId } from 'react'

import type { InteractionPresentation, SpatialPlacement } from '@/game'
import { cn } from '@/lib/ui/cn'

type SpatialPresentation = Extract<
  InteractionPresentation,
  { kind: 'spatial-layout' }
>

const MARKS = {
  blocked: { code: 'col', label: 'columna u obstáculo' },
  clearance: { code: 'pas', label: 'pasillo que queda libre' },
  entrance: { code: 'pta', label: 'puerta' },
} as const

export interface SpatialLayoutProps {
  readonly presentation: SpatialPresentation
  readonly placements: readonly SpatialPlacement[]
  readonly disabled: boolean
  readonly onChange: (value: readonly SpatialPlacement[]) => void
}

export function SpatialLayout({
  presentation: p,
  placements,
  disabled,
  onChange,
}: SpatialLayoutProps) {
  const prefix = useId()
  const singleRow = p.height === 1

  const set = (objectId: string, value: Partial<SpatialPlacement>) => {
    const before = placements.find((entry) => entry.objectId === objectId) ?? {
      objectId,
      x: 0,
      y: 0,
      rotation: 0 as const,
    }
    onChange([
      ...placements.filter((entry) => entry.objectId !== objectId),
      { ...before, ...value },
    ])
  }

  const cellOf = (x: number, y: number) => {
    const marks = [
      ...(p.blocked.some((c) => c.x === x && c.y === y) ? [MARKS.blocked] : []),
      ...(p.clearance.some((c) => c.x === x && c.y === y)
        ? [MARKS.clearance]
        : []),
      ...(p.entrances.some((c) => c.x === x && c.y === y)
        ? [MARKS.entrance]
        : []),
    ]
    const codes: string[] = []
    for (const placed of placements) {
      const object = p.objects.find((entry) => entry.id === placed.objectId)
      if (object === undefined) continue
      const width =
        placed.rotation === 90 ? object.heightCells : object.widthCells
      const height =
        placed.rotation === 90 ? object.widthCells : object.heightCells
      if (
        x >= placed.x &&
        x < placed.x + width &&
        y >= placed.y &&
        y < placed.y + height
      )
        codes.push(object.code)
    }
    return { marks, codes }
  }

  return (
    <fieldset
      disabled={disabled}
      className="flex min-w-0 flex-col gap-3 border-0 p-0"
    >
      <legend className="sr-only">Ubicá los objetos</legend>
      <p className="text-body text-ink-secondary">{p.instructions}</p>
      <div
        role="region"
        aria-label="Plano por coordenadas"
        tabIndex={0}
        // `relative` ancla el desborde de la grilla a esta región: sin él, el
        // scroll local de la tabla estira el documento entero y la página
        // scrollea horizontalmente en 320 px. La grilla necesita dos
        // dimensiones por significado; la página, no.
        className="relative max-w-full overflow-x-auto"
      >
        <table className="border-collapse tabular-nums">
          <caption className="text-caption text-ink-secondary pb-2 text-left">
            Cada celda mide {p.cellCentimeters} cm. X crece hacia la derecha
            {singleRow ? '' : ' e Y hacia abajo'}, desde 0.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="text-caption text-ink-label px-1">
                <span className="sr-only">Fila Y, columna X</span>
              </th>
              {Array.from({ length: p.width }, (_, x) => (
                <th
                  key={x}
                  scope="col"
                  className="text-caption text-ink-label w-9 font-normal"
                >
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: p.height }, (_, y) => (
              <tr key={y}>
                <th
                  scope="row"
                  className="text-caption text-ink-label pr-1 font-normal"
                >
                  {y}
                </th>
                {Array.from({ length: p.width }, (_, x) => {
                  const { marks, codes } = cellOf(x, y)
                  const blocked = marks.includes(MARKS.blocked)
                  const reserved =
                    marks.includes(MARKS.clearance) ||
                    marks.includes(MARKS.entrance)
                  return (
                    <td
                      key={x}
                      data-testid={`cell-${String(x)}-${String(y)}`}
                      className={cn(
                        // Varios objetos en una celda se escriben juntos, y esa
                        // cadena no puede ensanchar la celda: sin corte, su
                        // ancho mínimo infla la tabla y saca del viewport a la
                        // pantalla entera en 360 px.
                        'text-meta font-display size-9 min-w-9 border text-center break-all',
                        codes.length > 1
                          ? 'border-ink border-2'
                          : reserved
                            ? 'border-ink-label border-dashed'
                            : 'border-rule',
                        blocked
                          ? 'bg-canvas-sunken text-ink-label'
                          : 'bg-surface text-ink',
                        codes.length > 0 ? 'font-bold' : '',
                      )}
                    >
                      {codes.length > 0
                        ? codes.join('+')
                        : marks.map((mark) => mark.code).join(' ')}
                      {codes.length === 0 && marks.length === 0 ? (
                        <span className="sr-only">libre</span>
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl
        data-testid="plan-legend"
        className="text-caption text-ink-secondary flex flex-wrap gap-x-3 gap-y-1"
      >
        {p.objects.map((object) => (
          <div key={object.id} className="flex gap-1">
            <dt className="text-ink font-bold">{object.code}</dt>
            <dd className="m-0">{object.label}</dd>
          </div>
        ))}
        {Object.values(MARKS)
          .filter(
            (mark) =>
              (mark === MARKS.blocked && p.blocked.length > 0) ||
              (mark === MARKS.clearance && p.clearance.length > 0) ||
              (mark === MARKS.entrance && p.entrances.length > 0),
          )
          .map((mark) => (
            <div key={mark.code} className="flex gap-1">
              <dt className="text-ink font-bold">{mark.code}</dt>
              <dd className="m-0">{mark.label}</dd>
            </div>
          ))}
      </dl>
      {p.objects.map((object) => {
        const value = placements.find((entry) => entry.objectId === object.id)
        const id = `${prefix}-${object.id}`
        const axes = singleRow ? (['x'] as const) : (['x', 'y'] as const)
        return (
          <fieldset
            key={object.id}
            className="border-rule bg-surface border p-3"
          >
            <legend className="text-goal text-ink font-display px-1">
              {object.label}
            </legend>
            <p className="text-meta text-ink-secondary tabular-nums">
              <span aria-hidden="true" className="text-ink mr-1 font-bold">
                {object.code}
              </span>
              {object.detail}
            </p>
            <label className="text-meta text-ink flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                className="size-5"
                checked={value !== undefined}
                onChange={(event) => {
                  if (event.target.checked) set(object.id, {})
                  else
                    onChange(
                      placements.filter(
                        (entry) => entry.objectId !== object.id,
                      ),
                    )
                }}
              />
              {object.optional ? 'Incluir (opcional)' : 'Ubicar en el plano'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {axes.map((axis) => (
                <label
                  key={axis}
                  htmlFor={`${id}-${axis}`}
                  className="text-meta text-ink"
                >
                  {object.label} · {axis.toUpperCase()}
                  <select
                    id={`${id}-${axis}`}
                    disabled={disabled || value === undefined}
                    value={value?.[axis] ?? 0}
                    onChange={(event) => {
                      set(object.id, { [axis]: Number(event.target.value) })
                    }}
                    className="border-ink bg-surface text-ink text-meta block h-11 w-full border px-2 tabular-nums"
                  >
                    {Array.from(
                      { length: axis === 'x' ? p.width : p.height },
                      (_, n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              ))}
            </div>
            {object.rotatable ? (
              <label
                htmlFor={`${id}-rotation`}
                className="text-meta text-ink mt-2 block"
              >
                {object.label} · Orientación
                <select
                  id={`${id}-rotation`}
                  disabled={disabled || value === undefined}
                  value={value?.rotation ?? 0}
                  onChange={(event) => {
                    set(object.id, {
                      rotation: event.target.value === '90' ? 90 : 0,
                    })
                  }}
                  className="border-ink bg-surface text-ink text-meta block h-11 w-full border px-2"
                >
                  <option value={0}>Horizontal · 0°</option>
                  <option value={90}>Girada · 90°</option>
                </select>
              </label>
            ) : null}
          </fieldset>
        )
      })}
    </fieldset>
  )
}
