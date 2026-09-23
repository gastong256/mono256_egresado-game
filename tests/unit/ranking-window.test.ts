import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { selectRankingWindow } from '@/server/competition/ranking-window'
import { rankEntries } from '@/lib/competition'
import type { BestAttemptRow } from '@/server/persistence/competition/rows'

function rows(scores: number[]): BestAttemptRow[] {
  return scores.map((score, i) => ({
    competitionId: 'c',
    participantId: String(i),
    attemptId: `a${i}`,
    publicNickname: `P${i}`,
    nicknameHidden: false,
    verifiedFairScore: score,
    verifiedPrestigeScore: 0,
    verifiedAt: '2026-09-23T00:00:00Z',
  }))
}

describe('bounded ranking window', () => {
  it('compresses even 500 tied players, keeps the viewer and the true next rank', () => {
    const result = selectRankingWindow(
      rows([...Array<number>(500).fill(10000), 9000]),
      '300',
    )
    expect(result.map((entry) => [entry.rank, entry.sharedCount])).toEqual([
      [1, 499],
      [501, 0],
    ])
    expect(result[0]?.row.participantId).toBe('300')
    expect(result[1]?.gapBefore).toBe(0)
  })
  it('shows leading ranks, the viewer and two groups on either side without duplicates', () => {
    const result = selectRankingWindow(
      rows(Array.from({ length: 100 }, (_, i) => 10000 - i)),
      '49',
    )
    expect(result.map((entry) => entry.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 48, 49, 50, 51, 52,
    ])
    expect(result[7]?.gapBefore).toBe(40)
  })
  it('shows a finite overview and tail without a session', () => {
    const result = selectRankingWindow(
      rows(Array.from({ length: 50 }, (_, i) => 10000 - i)),
    )
    expect(result.map((entry) => entry.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 48, 49, 50,
    ])
    expect(result[9]?.gapBefore).toBe(38)
  })
  it('preserves rank, count, viewer and bound for arbitrary ties and input order', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 10000 }), { maxLength: 400 }),
        (scores) => {
          const best = rows(scores)
          const viewer = best.at(-1)?.participantId
          const actual = selectRankingWindow([...best].reverse(), viewer)
          const ranked = rankEntries(
            best.map((row) => ({
              ...row,
              fairScore: row.verifiedFairScore,
              prestigeScore: 0,
            })),
          )
          expect(actual.length).toBeLessThanOrEqual(12)
          expect(new Set(actual.map((entry) => entry.rank)).size).toBe(
            actual.length,
          )
          if (viewer)
            expect(
              actual.some((entry) => entry.row.participantId === viewer),
            ).toBe(true)
          for (const entry of actual) {
            expect(
              ranked.find(
                (item) => item.result.participantId === entry.row.participantId,
              )?.rank,
            ).toBe(entry.rank)
            expect(entry.sharedCount + 1).toBe(
              ranked.filter((item) => item.rank === entry.rank).length,
            )
            expect(entry.gapBefore).toBeGreaterThanOrEqual(0)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
