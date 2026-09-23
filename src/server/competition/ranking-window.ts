import 'server-only'

import { rankEntries } from '@/lib/competition'
import type { BestAttemptRow } from '@/server/persistence/competition/rows'

/** Presentation policy only. Never changes the authoritative comparator. */
export const RANKING_WINDOW = {
  version: 1,
  maxRows: 12,
  leadingRows: 7,
  nearbyRows: 2,
  anonymousTail: 3,
} as const

export function selectRankingWindow(
  best: readonly BestAttemptRow[],
  viewerId?: string,
) {
  const ranked = rankEntries(
    best.map((row) => ({
      ...row,
      fairScore: row.verifiedFairScore,
      prestigeScore: row.verifiedPrestigeScore,
    })),
  )
  const groups: { rank: number; rows: BestAttemptRow[] }[] = []
  for (const entry of ranked) {
    const last = groups.at(-1)
    if (last?.rank === entry.rank) last.rows.push(entry.result)
    else groups.push({ rank: entry.rank, rows: [entry.result] })
  }
  const ownIndex = groups.findIndex((group) =>
    group.rows.some((row) => row.participantId === viewerId),
  )
  const chosen = new Set<number>()
  const add = (index: number) => {
    if (
      index >= 0 &&
      index < groups.length &&
      chosen.size < RANKING_WINDOW.maxRows
    )
      chosen.add(index)
  }
  for (let i = 0; i < Math.min(RANKING_WINDOW.leadingRows, groups.length); i++)
    add(i)
  if (ownIndex >= 0) {
    for (
      let i = ownIndex - RANKING_WINDOW.nearbyRows;
      i <= ownIndex + RANKING_WINDOW.nearbyRows;
      i++
    )
      add(i)
  } else if (groups.length > RANKING_WINDOW.maxRows) {
    for (
      let i = groups.length - RANKING_WINDOW.anonymousTail;
      i < groups.length;
      i++
    )
      add(i)
  }
  for (
    let i = 0;
    i < groups.length && chosen.size < RANKING_WINDOW.maxRows;
    i++
  )
    add(i)
  let previousEnd = 1
  return [...chosen]
    .sort((a, b) => a - b)
    .flatMap((index) => {
      const group = groups[index]
      if (group === undefined) return []
      const row =
        group.rows.find((entry) => entry.participantId === viewerId) ??
        group.rows[0]
      if (row === undefined) return []
      const gapBefore = group.rank - previousEnd
      previousEnd = group.rank + group.rows.length
      return [
        {
          row,
          rank: group.rank,
          sharedCount: group.rows.length - 1,
          gapBefore,
        },
      ]
    })
}
