'use client'

import { useEffect, useRef, useState } from 'react'

import type { PublicCompetitionSummary } from '@/lib/competition'
import { cn } from '@/lib/ui/cn'

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

/**
 * Cuánta urgencia transmite el reloj, derivada sólo del tiempo que falta.
 *
 * Cuatro escalones y ninguno inventa nada: la misma cuenta que dibuja los
 * dígitos decide si el rótulo se pone rojo y si el segundo «salta». Más de un
 * día es calma; menos de un día ya se nota; menos de una hora es alto; menos
 * de diez minutos, crítico. La palabra acompaña siempre al color.
 */
export type CountdownUrgency = 'calm' | 'near' | 'high' | 'critical'

export function countdownUrgency(remainingSeconds: number): CountdownUrgency {
  if (remainingSeconds < 10 * 60) return 'critical'
  if (remainingSeconds < 60 * 60) return 'high'
  if (remainingSeconds < 24 * 60 * 60) return 'near'
  return 'calm'
}

const URGENCY_LABEL: Readonly<
  Record<
    CountdownUrgency,
    { readonly opening: string; readonly closing: string }
  >
> = {
  calm: { opening: 'Empieza en', closing: 'Cierra en' },
  near: {
    opening: 'Empieza en menos de un día',
    closing: 'Cierra en menos de un día',
  },
  high: {
    opening: 'Empieza en menos de una hora',
    closing: 'Cierra en menos de una hora',
  },
  critical: { opening: 'Empieza en minutos', closing: 'Últimos minutos' },
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

/** Hydration-safe presentation clock shared by the timer and ranking notice. */
export function useEventSecondsRemaining(deadline: string | undefined) {
  const [now, setNow] = useState<number>()
  const target = deadline === undefined ? Number.NaN : Date.parse(deadline)

  useEffect(() => {
    if (!Number.isFinite(target)) return
    const update = () => setNow(Date.now())
    const initial = setTimeout(update, 0)
    const interval = setInterval(update, 1000)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearTimeout(initial)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', update)
    }
  }, [target])

  return !Number.isFinite(target) || now === undefined
    ? undefined
    : Math.max(0, Math.ceil((target - now) / 1000))
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
  const remaining = useEventSecondsRemaining(deadline)
  const notified = useRef<string | undefined>(undefined)
  const boundary = `${competition.status}:${deadline ?? ''}`

  useEffect(() => {
    if (remaining !== 0 || notified.current === boundary) return
    notified.current = boundary
    onElapsed()
  }, [remaining, boundary, onElapsed])

  if (deadline === undefined) return null
  const opening = competition.status === 'upcoming'
  const urgency = remaining === undefined ? 'calm' : countdownUrgency(remaining)
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
      className="border-ink bg-canvas-sunken @container flex min-w-0 flex-col gap-3 border-y-2 px-3 py-4 sm:px-4"
      data-testid="event-countdown"
      data-urgency={urgency}
    >
      <p
        className={cn(
          'text-goal font-display',
          urgency === 'high' || urgency === 'critical'
            ? 'text-red'
            : 'text-ink-label',
        )}
      >
        {opening
          ? URGENCY_LABEL[urgency].opening
          : URGENCY_LABEL[urgency].closing}
      </p>
      {remaining !== 0 ? (
        <div
          className="grid grid-cols-4 gap-2"
          aria-hidden="true"
          data-testid="countdown-digits"
        >
          {['Días', 'Horas', 'Min', 'Seg'].map((label, index) => (
            <div
              key={label}
              className={cn(
                'bg-surface flex min-w-0 flex-col border px-1 py-3 text-center',
                // De un día para abajo el reloj toma cuerpo: filete de tinta.
                // Sobre la hora, los segundos llevan el rojo del sistema; la
                // palabra de arriba ya dijo lo mismo.
                urgency === 'calm' ? 'border-rule' : 'border-ink',
                urgency === 'critical' && index === 3 && 'border-red border-2',
              )}
            >
              <span
                className={cn(
                  /*
                    Las cifras cambian sin fundido. Un pop por segundo era
                    movimiento continuo —lo que el sistema dice no tener— y
                    su fundido de opacidad dejaba la cifra en gris a mitad
                    de camino: un escaneo de contraste la medía en 2,6:1 y
                    una persona la veía parpadear. El paso del tiempo ya lo
                    muestra el número que cambia.
                  */
                  'text-countdown font-display text-ink tabular-nums',
                  (urgency === 'high' || urgency === 'critical') &&
                    index === 3 &&
                    'text-red',
                )}
              >
                {values?.[index]?.toLocaleString('es-AR', {
                  minimumIntegerDigits: 2,
                }) ?? '—'}
              </span>
              {/* Tracking más corto que el de una etiqueta suelta: «HORAS»
                  con 0,13 em no entra en la celda de una hoja de 320 px. */}
              <span className="text-label font-display text-ink-label mt-2 tracking-[0.08em] uppercase">
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
      {!opening && remaining !== 0 ? (
        <p className="text-meta text-ink">
          Queda tiempo para jugar y superarte.
        </p>
      ) : null}
      <p className="text-caption text-ink-secondary">
        {opening ? 'Apertura' : 'Cierre'}:{' '}
        <time dateTime={deadline}>{formatEventDate(deadline)}</time> (hora
        argentina, UTC−3).
      </p>
    </div>
  )
}
