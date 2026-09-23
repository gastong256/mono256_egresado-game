'use client'

import type { PublicCompetitionStatus } from '@/lib/competition'
import { useEventSecondsRemaining } from './event-countdown'

/** Coarse, truthful time windows: a call to play, not a second ticking clock. */
export function rankingDeadlineMessage(seconds: number): string | undefined {
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined
  if (seconds >= 3600)
    return `¡Mejorá tu marca! Quedan menos de ${Math.floor(seconds / 3600) + 1} horas.`
  if (seconds >= 60)
    return `¡Dale una más! Quedan menos de ${Math.floor(seconds / 60) + 1} minutos.`
  return '¡Últimos segundos para mejorar tu marca!'
}

export function RankingDeadlineNotice({
  status,
  closesAt,
}: {
  readonly status: PublicCompetitionStatus
  readonly closesAt: string | undefined
}) {
  const remaining = useEventSecondsRemaining(
    status === 'open' ? closesAt : undefined,
  )
  const message =
    remaining === undefined ? undefined : rankingDeadlineMessage(remaining)
  if (message === undefined) return null

  return (
    <p
      className="border-red text-red max-w-viewport border-l-2 pl-3 text-left"
      data-testid="ranking-deadline-notice"
    >
      <span
        key={message}
        className="text-goal font-display motion-resolve inline-block text-pretty tabular-nums motion-reduce:animate-none"
      >
        {message}
      </span>
    </p>
  )
}
