import 'server-only'

import { closeCareer } from '@/content/full-career'
import { isEstiloEstablished } from '@/game'
import {
  runSummarySchema,
  type PublicRunSummary,
} from '@/lib/competition/run-summary'
import {
  careerNumbersOf,
  deriveAchievements,
  deriveCareerRecap,
  playStyleOf,
} from '@/lib/presentation/ending-model'
import type { AuthoritativeRunResult } from '@/server/game/validate-run'

/** One projection of the already validated state: no additional replay. */
export function summarizeVerifiedRun(
  result: AuthoritativeRunResult,
): PublicRunSummary {
  const state = result.finalState
  const closing = closeCareer(state)
  return runSummarySchema.parse({
    version: 1,
    career: careerNumbersOf(state),
    estilo: isEstiloEstablished(state.career) ? state.career.estilo : null,
    playStyle: playStyleOf(state),
    profile: result.profile,
    graduated: result.graduated,
    eventsPlayed: result.eventsPlayed,
    recoveries: result.recoveries,
    previas: result.previas,
    optimalCount: result.competitiveScore?.optimalCount ?? 0,
    components: result.competitiveScore?.components ?? [],
    achievements: deriveAchievements(
      state,
      closing.milestones,
      closing.memories,
    ),
    years: deriveCareerRecap(state, closing.memories),
    memories: closing.epilogue.memories.map(({ title, text, kind }) => ({
      title,
      text,
      kind,
    })),
  })
}
