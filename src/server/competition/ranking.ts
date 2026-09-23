import 'server-only'

import { selectRankingWindow } from './ranking-window'
import { readRunSummary } from '@/lib/competition/run-summary'

import type {
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import {
  rankOf,
  displayNickname,
  toPublicSummary,
  type PublicCompetitionState,
  type PublicSelfSummary,
} from './dto'

/** Public window of best runs; ties keep their true rank and total membership.
 * MAX_PUBLIC_RANK is the frozen podium boundary, not the display row limit.
 */
export const MAX_PUBLIC_RANK = 3

export interface RankingDependencies {
  readonly store: CompetitionStore
}

export async function loadPublicState(
  dependencies: RankingDependencies,
  competition: CompetitionRow,
  viewer: ParticipantRow | undefined,
): Promise<PublicCompetitionState> {
  const best = await dependencies.store.bestVerifiedAttempts(competition.id)
  const window = selectRankingWindow(best, viewer?.id)
  const summaries = new Map(
    (
      await dependencies.store.readAttemptSummaries(
        window.map(({ row }) => row.attemptId),
      )
    ).map(({ id, summary }) => [id, summary]),
  )
  const entries = window.map(({ row, rank, sharedCount, gapBefore }) => {
    const stored = summaries.get(row.attemptId)
    const candidate =
      typeof stored === 'object' && stored !== null && 'ranking' in stored
        ? readRunSummary(stored.ranking)
        : undefined
    // A stale or corrupt projection cannot contradict the official total.
    const summary =
      candidate?.components.reduce(
        (sum, part) => sum + part.contribution,
        0,
      ) === row.verifiedFairScore
        ? candidate
        : undefined
    return {
      rank,
      nickname: displayNickname(row),
      fairScore: row.verifiedFairScore,
      isYou: row.participantId === viewer?.id,
      sharedCount,
      gapBefore,
      ...(summary === undefined ? {} : { summary }),
    }
  })

  let you: PublicSelfSummary | undefined
  if (viewer !== undefined) {
    const mine = best.find((row) => row.participantId === viewer.id)
    const [attemptCount, active] = await Promise.all([
      dependencies.store.countAttempts(viewer.id),
      dependencies.store.findActiveAttempt(viewer.id),
    ])
    you = {
      nickname: viewer.publicNickname,
      bestFairScore: mine?.verifiedFairScore,
      bestPrestigeScore: mine?.verifiedPrestigeScore,
      rank: mine === undefined ? undefined : rankOf(best, viewer.id),
      attempts: attemptCount,
      activeAttempt: active?.id,
    }
  }

  return {
    competition: toPublicSummary(competition),
    leaderboard: entries,
    totalRanked: best.length,
    you,
  }
}

/** El estado cuando el despliegue no tiene competencia configurada. */
export function unconfiguredState(): PublicCompetitionState {
  return {
    competition: {
      name: 'Egresado',
      status: 'not-configured',
      opensAt: undefined,
      closesAt: undefined,
    },
    leaderboard: [],
    totalRanked: 0,
    you: undefined,
  }
}
