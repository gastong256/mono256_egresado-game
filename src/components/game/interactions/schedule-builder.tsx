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
 *
 * El mismo componente tiene dos modos. Sin calendario es una tarde y las
 * columnas son lugares, que es lo de 1.º. Con calendario los minutos son
 * absolutos desde el primer día y las columnas son días, que es lo que necesita
 * una organización de varios días: la entrada, la respuesta y el evaluador no
 * cambian, sólo cambia cómo se lee la misma recta de tiempo.
 */

import { useId } from 'react'

import type {
  PresentedActivity,
  PresentedCalendar,
  SchedulePlacement,
} from '@/game'

export function formatMinute(minute: number): string {
  const clock = minute % 1440
  return `${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`
}

const MINUTES_PER_DAY = 1440

/** «Mié 17:30» en el modo de varios días; «17:30» en el de una tarde. */
function formatStart(
  minute: number,
  calendar: PresentedCalendar | undefined,
): string {
  if (calendar === undefined) return formatMinute(minute)
  const day = calendar.days[Math.floor(minute / MINUTES_PER_DAY)]
  return `${day ?? ''} ${formatMinute(minute)}`.trim()
}

export interface ScheduleBuilderProps {
  readonly activities: readonly PresentedActivity[]
  readonly instructions: string
  readonly placements: readonly SchedulePlacement[]
  readonly span: { readonly from: number; readonly to: number }
  readonly calendar?: PresentedCalendar
  readonly disabled: boolean
  readonly onChange: (value: readonly SchedulePlacement[]) => void
}

/** A draft of a whole schedule; no evaluator, feasibility hints or intermediate actions. */
export function ScheduleBuilder({
  activities,
  instructions,
  placements,
  span,
  calendar,
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
              className="border-ink bg-surface text-ink text-option font-display mt-2 h-11 w-full border-[1.5px] px-2 tabular-nums"
            >
              <option value="">
                {activity.optional
                  ? 'No incluir (flexible)'
                  : 'Elegí el inicio'}
              </option>
              {activity.startMinutes.map((minute) => (
                <option key={minute} value={minute}>
                  {formatStart(minute, calendar)}
                </option>
              ))}
            </select>
          </div>
        )
      })}
      {calendar === undefined ? (
        <AfternoonView
          activities={activities}
          placements={chosen}
          span={span}
        />
      ) : (
        <WeekView
          activities={activities}
          placements={chosen}
          calendar={calendar}
        />
      )}
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
              {formatStart(placement.startMinute, calendar)} · {activity.label}{' '}
              · {activity.location} · {activity.durationMinutes} min
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
 *
 * Cada fila mide 10 px: una tarde de seis horas son 72 filas, y a 14 px por
 * fila el dibujo costaba mil píxeles de scroll en un teléfono para mostrar
 * cuatro bloques. Los rótulos de los bloques van en 10 px y se parten por
 * donde haga falta en vez de recortarse: un bloque de diez minutos —dos
 * filas— muestra la hora y la primera palabra, y el resto está en la lista.
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
          gridTemplateRows: `auto repeat(${String(rows)}, 0.625rem)`,
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
            className="border-ink bg-surface text-ink overflow-hidden border px-1 text-[10px] leading-none font-semibold [overflow-wrap:anywhere]"
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

const WEEK_MINUTES_PER_ROW = 15

/**
 * La semana en columnas por día, filas de quince minutos.
 *
 * Decorativa para la tecnología de asistencia, igual que la tarde: la misma
 * información está escrita en la lista «Agenda elegida» y en cada campo.
 */
function WeekView({
  activities,
  placements,
  calendar,
}: {
  readonly activities: readonly PresentedActivity[]
  readonly placements: readonly SchedulePlacement[]
  readonly calendar: PresentedCalendar
}) {
  const rows = Math.max(
    1,
    Math.ceil((calendar.dayEnd - calendar.dayStart) / WEEK_MINUTES_PER_ROW),
  )
  const rowOf = (clock: number) =>
    Math.min(
      rows,
      Math.max(
        0,
        Math.floor((clock - calendar.dayStart) / WEEK_MINUTES_PER_ROW),
      ),
    )

  const blocks = placements.flatMap((placement) => {
    const activity = activities.find(
      (entry) => entry.id === placement.activityId,
    )
    if (activity === undefined) return []
    const day = Math.floor(placement.startMinute / MINUTES_PER_DAY)
    const clock = placement.startMinute % MINUTES_PER_DAY
    const end = clock + activity.durationMinutes
    return [
      {
        key: placement.activityId,
        label: activity.label,
        start: placement.startMinute,
        column: 2 + day,
        rowStart: rowOf(clock) + 1,
        rowSpan: Math.max(1, rowOf(end) - rowOf(clock)),
      },
    ]
  })

  const marks = Array.from(
    { length: rows + 1 },
    (_, index) => calendar.dayStart + index * WEEK_MINUTES_PER_ROW,
  )
    .filter((minute) => minute % 60 === 0 || minute === calendar.dayStart)
    .map((minute) => ({ minute, row: rowOf(minute) + 1 }))

  return (
    <figure className="m-0" data-testid="week-view">
      <div
        aria-hidden="true"
        className="border-rule bg-canvas grid border"
        style={{
          gridTemplateColumns: `2.5rem repeat(${String(calendar.days.length)}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${String(rows)}, 0.875rem)`,
        }}
      >
        <span className="text-caption text-ink-label px-1" />
        {calendar.days.map((day) => (
          <span
            key={day}
            className="text-caption text-ink border-rule border-b border-l px-1 font-bold"
          >
            {day}
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
            className="border-ink bg-surface text-ink overflow-hidden border px-1 text-[10px] leading-none font-semibold [overflow-wrap:anywhere]"
            style={{
              gridColumn: `${String(block.column)}`,
              gridRow: `${String(block.rowStart + 1)} / span ${String(block.rowSpan)}`,
            }}
          >
            {block.label}
          </span>
        ))}
      </div>
      <figcaption className="text-caption text-ink-secondary mt-1 tabular-nums">
        Cada día va de {formatMinute(calendar.dayStart)} a{' '}
        {formatMinute(calendar.dayEnd)}. Lo que ya estaba comprometido también
        ocupa lugar.
      </figcaption>
    </figure>
  )
}
