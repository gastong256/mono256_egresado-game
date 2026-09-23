'use client'

import { useEffect, useState } from 'react'
import type {
  PublicCompetitionStatus,
  PublicCompetitionSummary,
} from '@/lib/competition'

/** Presentation only: an OPEN edition must also be inside its announced window.
 * Recheck at boundaries and on tab resume, never rerender the Home each second.
 * UPCOMING/CLOSED still require an explicit change from the server.
 */
export function useAccessStatus(competition: PublicCompetitionSummary) {
  const { status, opensAt, closesAt } = competition
  const key = `${status}:${opensAt ?? ''}:${closesAt ?? ''}`
  const [observed, setObserved] = useState<{
    key: string
    status: PublicCompetitionStatus
  }>()

  useEffect(() => {
    if (status !== 'open') return
    const opens = Date.parse(opensAt ?? '')
    const closes = Date.parse(closesAt ?? '')
    let timer: ReturnType<typeof setTimeout>
    const update = () => {
      clearTimeout(timer)
      const now = Date.now()
      const current =
        now >= closes ? 'closed' : now < opens ? 'upcoming' : 'open'
      setObserved((previous) =>
        previous?.key === key && previous.status === current
          ? previous
          : { key, status: current },
      )
      const next = Math.min(...[opens, closes].filter((time) => time > now))
      if (Number.isFinite(next))
        timer = setTimeout(update, Math.min(next - now, 2_147_483_647))
    }
    // Same initial render on server and client; clock starts after hydration.
    timer = setTimeout(update, 0)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [status, opensAt, closesAt, key])

  return observed?.key === key ? observed.status : status
}
