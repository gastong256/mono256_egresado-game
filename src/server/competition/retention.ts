import 'server-only'

import type { CompetitionRow } from '@/server/persistence/competition/rows'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import type { Clock } from './clock'

/**
 * Retención y supresión de los datos privados.
 *
 * El principio es el del artículo 4 de la 25.326: un dato se guarda mientras
 * sea necesario para el fin que lo justificó, y cuando deja de serlo se
 * destruye. Acá ese fin es concreto y tiene fecha — verificar resultados y
 * entregar premios de una feria— así que la retención es un número de días
 * desde el cierre y no una política abierta.
 *
 * La anonimización **no borra el resultado**. Se van el nombre, el año, la
 * división y los últimos cuatro dígitos; quedan el alias, el score verificado y
 * la evidencia de replay, que no identifican a nadie y sí permiten que el
 * ranking de la feria siga siendo legible el año que viene.
 *
 * La clave de identidad se conserva hasta la purga junto con el resto, y se
 * borra con ella: mantenerla después permitiría reconocer a la misma persona en
 * una edición futura, que es precisamente lo que el HMAC por competencia existe
 * para impedir.
 */

export interface RetentionDependencies {
  readonly store: CompetitionStore
  readonly clock: Clock
}

export interface PurgePlan {
  readonly competitionSlug: string
  readonly dueAt: string | undefined
  readonly eligible: boolean
  readonly participants: number
  readonly alreadyAnonymized: number
}

/** Cuándo vence la retención: el cierre más los días declarados. */
export function retentionDueAt(
  competition: CompetitionRow,
): string | undefined {
  if (competition.closesAt === undefined) return undefined
  return new Date(
    new Date(competition.closesAt).getTime() +
      competition.retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString()
}

export async function planPurge(
  dependencies: RetentionDependencies,
  competition: CompetitionRow,
): Promise<PurgePlan> {
  const participants = await dependencies.store.listParticipants(competition.id)
  const dueAt = retentionDueAt(competition)
  return {
    competitionSlug: competition.slug,
    dueAt,
    eligible:
      dueAt !== undefined &&
      dependencies.clock.now().getTime() >= new Date(dueAt).getTime(),
    participants: participants.length,
    alreadyAnonymized: participants.filter(
      (row) => row.anonymizedAt !== undefined,
    ).length,
  }
}

export interface PurgeResult {
  readonly anonymized: number
  readonly sessionsRevoked: number
  readonly skipped: number
}

/**
 * Anonimiza los datos privados de una edición vencida.
 *
 * `force` existe para el caso en que el organizador decide purgar antes —por
 * ejemplo, porque los premios ya se entregaron—, y es explícito justamente
 * porque el riesgo de purgar temprano es real: sin nombre ni últimos cuatro
 * dígitos ya no se puede verificar a un ganador. La operación deja rastro en la
 * auditoría.
 */
export async function purgeCompetition(
  dependencies: RetentionDependencies,
  competition: CompetitionRow,
  options: { readonly actor: string; readonly force?: boolean },
): Promise<PurgeResult> {
  const plan = await planPurge(dependencies, competition)
  if (!plan.eligible && options.force !== true) {
    return { anonymized: 0, sessionsRevoked: 0, skipped: plan.participants }
  }

  const now = dependencies.clock.now().toISOString()
  const participants = await dependencies.store.listParticipants(competition.id)
  let anonymized = 0
  let sessionsRevoked = 0

  for (const participant of participants) {
    if (participant.anonymizedAt !== undefined) continue
    await dependencies.store.updateParticipant(participant.id, {
      fullNamePrivate: null,
      schoolYearPrivate: null,
      divisionPrivate: null,
      dniLast4Private: null,
      anonymizedAt: now,
    })
    await dependencies.store.revokeParticipantSessions(participant.id, now)
    anonymized += 1
    sessionsRevoked += 1
  }

  await dependencies.store.appendAudit({
    competitionId: competition.id,
    actor: options.actor,
    action: 'competition.purge',
    targetType: 'competition',
    targetId: competition.id,
    reason: options.force === true ? 'purga forzada' : 'retención vencida',
    metadata: { anonymized, dueAt: plan.dueAt },
  })

  return { anonymized, sessionsRevoked, skipped: 0 }
}
