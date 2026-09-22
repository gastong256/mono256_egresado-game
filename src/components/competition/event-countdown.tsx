'use client'

import { useEffect, useRef, useState } from 'react'

import type { PublicCompetitionSummary } from '@/lib/competition'
import { Button } from '@/components/ui'

/** Public event dates are instants; the printed date is always Argentina time. */
export function eventDeadline(competition: PublicCompetitionSummary) {
  const value =
    competition.status === 'upcoming'
      ? competition.opensAt
      : competition.status === 'open'
        ? competition.closesAt
        : undefined
  if (value === undefined || !Number.isFinite(Date.parse(value)))
    return undefined
  return value
}

export function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

/** Presentation only. Never changes the competition status or grants an attempt. */
export function EventCountdown({
  competition,
  onElapsed,
}: {
  readonly competition: PublicCompetitionSummary
  readonly onElapsed: () => void
}) {
  const deadline = eventDeadline(competition)
  // Both SSR and the first client render show dashes plus the real deadline.
  // Read the wall clock only after hydration, never during render.
  const [now, setNow] = useState<number>()
  const [hidden, setHidden] = useState(false)
  const notified = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (deadline === undefined || hidden) return
    const update = () => {
      setNow(Date.now())
    }
    const initial = setTimeout(update, 0)
    const interval = setInterval(update, 1000)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearTimeout(initial)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', update)
    }
  }, [deadline, hidden])

  const remaining =
    deadline === undefined || now === undefined
      ? undefined
      : Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000))
  const boundary = `${competition.status}:${deadline ?? ''}`

  useEffect(() => {
    if (remaining !== 0 || notified.current === boundary) return
    notified.current = boundary
    onElapsed()
  }, [remaining, boundary, onElapsed])

  if (deadline === undefined) return null
  const opening = competition.status === 'upcoming'
  const values =
    remaining === undefined
      ? undefined
      : [
          Math.floor(remaining / 86400),
          Math.floor((remaining % 86400) / 3600),
          Math.floor((remaining % 3600) / 60),
          remaining % 60,
        ]

  return (
    <div
      className="border-rule flex min-w-0 flex-col gap-3 border-t pt-4"
      data-testid="event-countdown"
    >
      <p className="text-label font-display text-ink-label uppercase">
        {opening ? 'Empieza en' : 'Cierra en'}
      </p>
      {!hidden && remaining !== 0 ? (
        <div
          className="grid grid-cols-4 gap-2"
          aria-hidden="true"
          data-testid="countdown-digits"
        >
          {['Días', 'Horas', 'Min', 'Seg'].map((label, index) => (
            <div
              key={label}
              className="border-rule bg-surface flex min-w-0 flex-col border px-1 py-3 text-center"
            >
              <span
                key={values?.[index]}
                className="motion-enter text-display font-display text-ink tabular-nums motion-reduce:animate-none"
              >
                {values?.[index]?.toLocaleString('es-AR', {
                  minimumIntegerDigits: 2,
                }) ?? '—'}
              </span>
              <span className="text-label font-display text-ink-label mt-2 uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {remaining === 0 ? (
        <p
          className="text-meta text-ink-secondary"
          data-testid="countdown-elapsed"
        >
          El horario anunciado se cumplió. Esperando confirmación de la
          competencia.
        </p>
      ) : null}
      <p className="text-caption text-ink-secondary">
        {opening ? 'Apertura' : 'Cierre'}:{' '}
        <time dateTime={deadline}>{formatEventDate(deadline)}</time> (hora
        argentina, UTC−3).
      </p>
      <Button
        variant="ghost"
        className="self-start px-0"
        aria-pressed={hidden}
        onClick={() => {
          setHidden(!hidden)
        }}
      >
        {hidden ? 'Mostrar contador' : 'Ocultar contador'}
      </Button>
    </div>
  )
}
