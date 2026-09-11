'use client'

/**
 * Agenda constructiva: el modo Timeline / Schedule de 1.º.
 *
 * La entrada es un `select` nativo por actividad —teclado, tap y lector de
 * pantalla sin una línea de ARIA a mano—; nada se arrastra. El borrador es la
 * agenda entera y se confirma de una vez: ningún inicio intermedio es una acción
 * del motor.
 *
 * La vista de la tarde acompaña a la entrada y no la reemplaza. Dibuja cada
 * bloque en la columna de su lugar y del alto de lo que dura; **no** dibuja
 * viajes ni preparaciones —cuánto necesita cada cambio de lugar es la cuenta
 * del desafío— y no marca choques como error: muestra lo elegido, sin juzgarlo.
 */

import { useId } from 'react'

import type { PresentedActivity, SchedulePlacement } from '@/game'

export function formatMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

export interface ScheduleBuilderProps {
  readonly activities: readonly PresentedActivity[]
  readonly instructions: string
  readonly placements: readonly SchedulePlacement[]
  readonly span: { readonly from: number; readonly to: number }
  readonly disabled: boolean
  readonly onChange: (value: readonly SchedulePlacement[]) => void
}

/** A draft of a whole schedule; no evaluator, feasibility hints or intermediate actions. */
export function ScheduleBuilder({
  activities,
  instructions,
  placements,
  span,
  disabled,
  onChange,
}: ScheduleBuilderProps) {
  const prefix = useId()
  const chosen = [...placements].sort(
    (a, b) =>
      a.startMinute - b.startMinute ||
      (a.activityId < b.activityId ? -1 : a.activityId > b.activityId ? 1 : 0),
  )

  return (
    <fieldset
      disabled={disabled}
      className="flex min-w-0 flex-col gap-3 border-0 p-0"
    >
      <legend className="sr-only">Armá la agenda</legend>
      <p className="text-body text-ink-secondary">{instructions}</p>
      {activities.map((activity) => {
        const value = placements.find(
          (placement) => placement.activityId === activity.id,
        )?.startMinute
        const id = `${prefix}-${activity.id}`
        return (
          <div key={activity.id} className="border-rule bg-surface border p-3">
            <label
              htmlFor={id}
              className="text-goal text-ink font-display block"
            >
              {activity.label}
            </label>
            <p
              id={`${id}-detail`}
              className="text-meta text-ink-secondary tabular-nums"
            >
              {activity.detail}
            </p>
            <select
              id={id}
              aria-describedby={`${id}-detail`}
              value={value ?? ''}
              onChange={(event) => {
                const rest = placements.filter(
                  (placement) => placement.activityId !== activity.id,
                )
                onChange(
                  event.target.value === ''
                    ? rest
                    : [
                        ...rest,
                        {
                          activityId: activity.id,
                          startMinute: Number(event.target.value),
                        },
                      ],
                )
              }}
              className="border-ink bg-surface text-ink text-meta mt-2 h-11 w-full border-[1.5px] px-2 tabular-nums"
            >
              <option value="">
                {activity.optional
                  ? 'No incluir (flexible)'
                  : 'Elegí el inicio'}
              </option>
              {activity.startMinutes.map((minute) => (
                <option key={minute} value={minute}>
                  {formatMinute(minute)}
                </option>
              ))}
            </select>
          </div>
        )
      })}
      <AfternoonView activities={activities} placements={chosen} span={span} />
      <ol
        aria-label="Agenda elegida"
        className="text-meta text-ink flex list-none flex-col gap-1 p-0 tabular-nums"
      >
        {chosen.map((placement) => {
          const activity = activities.find(
            (entry) => entry.id === placement.activityId,
          )
          return activity === undefined ? null : (
            <li key={placement.activityId}>
              {formatMinute(placement.startMinute)} · {activity.label} ·{' '}
              {activity.location} · {activity.durationMinutes} min
            </li>
          )
        })}
      </ol>
    </fieldset>
  )
}

const MINUTES_PER_ROW = 5

/**
 * La tarde en columnas por lugar, filas de cinco minutos.
 *
 * Decorativa para la tecnología de asistencia: la misma información está en la
 * lista «Agenda elegida», escrita, y en los campos de inicio.
 */
function AfternoonView({
  activities,
  placements,
  span,
}: {
  readonly activities: readonly PresentedActivity[]
  readonly placements: readonly SchedulePlacement[]
  readonly span: { readonly from: number; readonly to: number }
}) {
  const places = [...new Set(activities.map((activity) => activity.location))]
  const rows = Math.max(1, Math.ceil((span.to - span.from) / MINUTES_PER_ROW))
  const rowOf = (minute: number) =>
    Math.min(
      rows,
      Math.max(0, Math.floor((minute - span.from) / MINUTES_PER_ROW)),
    )

  // Two sub-columns per place, so two blocks the player made overlap stay
  // visible side by side instead of hiding one under the other.
  const blocks = places.flatMap((place, column) => {
    const here = placements
      .map((placement) => ({
        placement,
        activity: activities.find((entry) => entry.id === placement.activityId),
      }))
      .filter(
        (
          entry,
        ): entry is {
          placement: SchedulePlacement
          activity: PresentedActivity
        } => entry.activity?.location === place,
      )
    let laneEnd = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
    return here.map(({ placement, activity }) => {
      const start = placement.startMinute
      const end = start + activity.durationMinutes
      const lane = start >= (laneEnd[0] ?? 0) ? 0 : 1
      laneEnd = lane === 0 ? [end, laneEnd[1] ?? 0] : [laneEnd[0] ?? 0, end]
      const overlapping = here.some(
        (other) =>
          other.placement !== placement &&
          other.placement.startMinute < end &&
          other.placement.startMinute + other.activity.durationMinutes > start,
      )
      return {
        key: placement.activityId,
        label: activity.label,
        start,
        column: 2 + column * 2 + (overlapping ? lane : 0),
        span: overlapping ? 1 : 2,
        rowStart: rowOf(start) + 1,
        rowSpan: Math.max(1, rowOf(end) - rowOf(start)),
      }
    })
  })

  const marks = Array.from({ length: rows + 1 }, (_, i) => span.from + i * 5)
    .filter((minute) => minute % 30 === 0 || minute === span.from)
    .map((minute) => ({ minute, row: rowOf(minute) + 1 }))

  return (
    <figure className="m-0" data-testid="afternoon-view">
      <div
        aria-hidden="true"
        className="border-rule bg-canvas grid border"
        style={{
          gridTemplateColumns: `3rem repeat(${String(places.length * 2)}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${String(rows)}, 0.875rem)`,
        }}
      >
        <span className="text-caption text-ink-label px-1" />
        {places.map((place, column) => (
          <span
            key={place}
            className="text-caption text-ink border-rule border-b border-l px-1 font-bold"
            style={{ gridColumn: `${String(2 + column * 2)} / span 2` }}
          >
            {place}
          </span>
        ))}
        {marks.map(({ minute, row }) => (
          <span
            key={minute}
            className="text-caption text-ink-label px-1 tabular-nums"
            style={{ gridColumn: '1', gridRow: `${String(row + 1)}` }}
          >
            {formatMinute(minute)}
          </span>
        ))}
        {blocks.map((block) => (
          <span
            key={block.key}
            className="border-ink bg-surface text-caption text-ink overflow-hidden border px-1 leading-tight"
            style={{
              gridColumn: `${String(block.column)} / span ${String(block.span)}`,
              gridRow: `${String(block.rowStart + 1)} / span ${String(block.rowSpan)}`,
            }}
          >
            {formatMinute(block.start)} {block.label}
          </span>
        ))}
      </div>
      <figcaption className="text-caption text-ink-secondary mt-1 tabular-nums">
        De {formatMinute(span.from)} a {formatMinute(span.to)}. Los viajes y las
        preparaciones no se dibujan: entran en tu cuenta.
      </figcaption>
    </figure>
  )
}
