import 'server-only'

import type {
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import {
  rankOf,
  toPublicLeaderboard,
  toPublicSummary,
  type PublicCompetitionState,
  type PublicSelfSummary,
} from './dto'

/**
 * El estado público de la competencia.
 *
 * Una sola consulta arma lo que `/` muestra: la edición, el podio y —si hay
 * sesión— el puesto propio. Se resuelve en el servidor porque el podio es dato
 * de todos y el puesto propio es dato de uno, y mezclarlos en el navegador
 * significaría haber mandado los dos.
 *
 * `MAX_PUBLIC_RANK` es 3 por decisión de producto v1: se destaca el podio, no
 * se publica una lista de estudiantes con puestos bajos. El corte es por
 * **puesto**, no por cantidad de filas, así que un empate legítimo en el tercer
 * lugar muestra a las tres personas empatadas en vez de elegir arbitrariamente
 * a una. El puesto propio se ve siempre, en privado, sin importar cuál sea.
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
  const board = toPublicLeaderboard(best, {
    maxRank: MAX_PUBLIC_RANK,
    ...(viewer === undefined ? {} : { viewerParticipantId: viewer.id }),
  })

  let you: PublicSelfSummary | undefined
  if (viewer !== undefined) {
    const mine = best.find((row) => row.participantId === viewer.id)
    const attempts = await dependencies.store.listAttemptsForParticipant(
      viewer.id,
    )
    const active = attempts.find((attempt) => attempt.status === 'STARTED')
    you = {
      nickname: viewer.publicNickname,
      bestFairScore: mine?.verifiedFairScore,
      bestPrestigeScore: mine?.verifiedPrestigeScore,
      rank: mine === undefined ? undefined : rankOf(best, viewer.id),
      attempts: attempts.length,
      activeAttempt: active?.id,
    }
  }

  return {
    competition: toPublicSummary(competition),
    leaderboard: board.entries,
    totalRanked: board.total,
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
