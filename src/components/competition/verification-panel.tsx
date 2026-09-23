'use client'

import { CompetitionResult } from '@/components/game/ending/ending-result'
import type { PlacementSnapshot } from '@/components/game/ending/ending-model'
import type {
  PublicCompetitionState,
  VerifiedAttemptPayload,
} from '@/lib/competition'

/**
 * El resultado, después de que el servidor lo verificó.
 *
 * Es el bloque de resultado del cierre de carrera, con la forma de props que
 * la partida de competencia ya conocía. Las acciones —jugar de nuevo, volver
 * al ranking— ya no viven acá: las decide el cierre entero, que sabe si la
 * edición sigue abierta. Se conservan como props opcionales para no romper a
 * nadie que las pase.
 */
export function VerificationPanel({
  phase,
  result,
  message,
  onRetry,
  competition,
  before,
}: {
  readonly phase: 'idle' | 'verifying' | 'verified' | 'failed'
  readonly result?: VerifiedAttemptPayload
  readonly message?: string
  readonly onRetry: () => void
  readonly onPlayAgain?: () => void
  readonly onBackToRanking?: () => void
  /** El estado público que llegó con la verificación: de ahí sale el puesto. */
  readonly competition?: PublicCompetitionState
  readonly before?: PlacementSnapshot
}) {
  if (phase === 'idle' || phase === 'verifying')
    return (
      <CompetitionResult result={{ kind: 'competition', phase: 'verifying' }} />
    )
  if (phase === 'failed')
    return (
      <CompetitionResult
        result={{
          kind: 'competition',
          phase: 'failed',
          message: message ?? 'Probá de nuevo en unos segundos.',
          onRetry,
        }}
      />
    )
  if (result === undefined)
    return (
      <CompetitionResult
        result={{
          kind: 'competition',
          phase: 'failed',
          message: 'No recibimos el resultado.',
          onRetry,
        }}
      />
    )
  return (
    <CompetitionResult
      result={{
        kind: 'competition',
        phase: 'verified',
        result,
        competition: competition ?? EMPTY_STATE,
        ...(before === undefined ? {} : { before }),
      }}
    />
  )
}

/** Sin estado público no hay puesto que mostrar; el puntaje sí. */
const EMPTY_STATE: PublicCompetitionState = {
  competition: {
    name: '',
    status: 'open',
    opensAt: undefined,
    closesAt: undefined,
  },
  leaderboard: [],
  totalRanked: 0,
  you: undefined,
}
