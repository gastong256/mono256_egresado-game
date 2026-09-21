import 'server-only'

import {
  nicknameKey,
  normalizeNickname,
  rankEntries,
  validateNickname,
} from '@/lib/competition'
import type {
  AttemptRow,
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import type {
  CompetitionStore,
  ParticipantPatch,
} from '@/server/persistence/competition/store'
import type { Clock } from './clock'
import type { CompetitionDeploymentConfig } from './config'
import { toPrivateParticipant, type PrivateParticipant } from './dto'
import { competitionError, type CompetitionError } from './errors'
import {
  createOpaqueToken,
  hashToken,
  ORGANIZER_SESSION_HOURS,
  verifyOrganizerPassword,
} from './tokens'

/**
 * La superficie del organizador.
 *
 * Es deliberadamente chica. Un docente necesita seis cosas —abrir y cerrar,
 * saber de quién es un alias, corregir un tipeo, ocultar un alias
 * inapropiado, invalidar un resultado y exportar— y cada una de las tres
 * últimas deja rastro. No hay roles, no hay permisos finos y no hay un portal:
 * una feria de escuela no los necesita, y construirlos sería agregar superficie
 * de ataque alrededor del dato más sensible del sistema.
 *
 * Dos cosas que **no** están, y por qué. No hay DNI en claro para mostrar,
 * porque no se guarda: la verificación de un ganador se hace con nombre, año y
 * los últimos cuatro dígitos, y el documento lo muestra la persona. Y no hay
 * edición de la clave de identidad: un documento mal tipeado se corrige
 * borrando el registro y volviendo a anotarse, no mutando la clave, porque una
 * clave editable a mano deja de ser una identidad.
 */

export interface OrganizerDependencies {
  readonly store: CompetitionStore
  readonly clock: Clock
  readonly config: CompetitionDeploymentConfig
}

type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CompetitionError }

export interface OrganizerSessionContext {
  readonly username: string
  readonly tokenHash: string
}

export async function authenticateOrganizer(
  dependencies: OrganizerDependencies,
  username: string,
  password: string,
): Promise<Outcome<{ readonly token: string; readonly expiresAt: string }>> {
  const expected = dependencies.config.organizer
  // La contraseña se verifica siempre, aun con usuario incorrecto: devolver
  // antes de derivar convertiría el tiempo de respuesta en un oráculo sobre
  // qué nombre de usuario existe.
  const passwordMatches = await verifyOrganizerPassword(
    password,
    expected.passwordHash,
  )
  if (username !== expected.username || !passwordMatches) {
    return {
      ok: false,
      error: competitionError('ORGANIZER_CREDENTIALS_INVALID'),
    }
  }

  const token = createOpaqueToken()
  const expiresAt = new Date(
    dependencies.clock.now().getTime() + ORGANIZER_SESSION_HOURS * 3600 * 1000,
  ).toISOString()
  await dependencies.store.insertOrganizerSession({
    organizerUsername: expected.username,
    tokenHash: hashToken(token),
    expiresAt,
  })
  return { ok: true, value: { token, expiresAt } }
}

export async function resolveOrganizerSession(
  dependencies: Pick<OrganizerDependencies, 'store' | 'clock'>,
  token: string | undefined,
): Promise<OrganizerSessionContext | undefined> {
  if (token === undefined || token.length === 0) return undefined
  const tokenHash = hashToken(token)
  const session = await dependencies.store.findOrganizerSession(tokenHash)
  if (session === undefined || session.revokedAt !== undefined) return undefined
  if (
    new Date(session.expiresAt).getTime() <= dependencies.clock.now().getTime()
  ) {
    return undefined
  }
  return { username: session.organizerUsername, tokenHash }
}

export async function endOrganizerSession(
  dependencies: Pick<OrganizerDependencies, 'store' | 'clock'>,
  token: string | undefined,
): Promise<void> {
  if (token === undefined || token.length === 0) return
  await dependencies.store.revokeOrganizerSession(
    hashToken(token),
    dependencies.clock.now().toISOString(),
  )
}

export interface OrganizerAttemptView {
  readonly id: string
  readonly attemptNumber: number
  readonly status: AttemptRow['status']
  readonly startedAt: string
  readonly submittedAt: string | undefined
  readonly fairScore: number | undefined
  readonly prestigeScore: number | undefined
  readonly rejectionCode: string | undefined
  readonly invalidatedAt: string | undefined
  readonly invalidatedReason: string | undefined
}

export interface OrganizerDashboard {
  readonly competition: {
    readonly id: string
    readonly slug: string
    readonly name: string
    readonly status: CompetitionRow['status']
    readonly opensAt: string | undefined
    readonly closesAt: string | undefined
    readonly submissionGraceSeconds: number
    readonly runSeed: string
    readonly runPlanFingerprint: string
    readonly privacyNoticeVersion: string
    readonly retentionDays: number
    readonly resultsFrozenAt: string | undefined
  }
  readonly participants: readonly (PrivateParticipant & {
    readonly rank: number | undefined
    readonly attemptDetail: readonly OrganizerAttemptView[]
  })[]
}

function toAttemptView(attempt: AttemptRow): OrganizerAttemptView {
  return {
    id: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    fairScore: attempt.verifiedFairScore,
    prestigeScore: attempt.verifiedPrestigeScore,
    rejectionCode: attempt.rejectionCode,
    invalidatedAt: attempt.invalidatedAt,
    invalidatedReason: attempt.invalidatedReason,
  }
}

export async function loadOrganizerDashboard(
  dependencies: OrganizerDependencies,
  competition: CompetitionRow,
): Promise<OrganizerDashboard> {
  const participants = await dependencies.store.listParticipants(competition.id)
  const attempts = await dependencies.store.listAttempts(competition.id)
  const best = await dependencies.store.bestVerifiedAttempts(competition.id)
  const ranked = rankEntries(
    best.map((row) => ({
      participantId: row.participantId,
      fairScore: row.verifiedFairScore,
      prestigeScore: row.verifiedPrestigeScore,
    })),
  )

  const byParticipant = new Map<string, AttemptRow[]>()
  for (const attempt of attempts) {
    const bucket = byParticipant.get(attempt.participantId) ?? []
    bucket.push(attempt)
    byParticipant.set(attempt.participantId, bucket)
  }

  return {
    competition: {
      id: competition.id,
      slug: competition.slug,
      name: competition.name,
      status: competition.status,
      opensAt: competition.opensAt,
      closesAt: competition.closesAt,
      submissionGraceSeconds: competition.submissionGraceSeconds,
      runSeed: competition.runSeed,
      runPlanFingerprint: competition.runPlanFingerprint,
      privacyNoticeVersion: competition.privacyNoticeVersion,
      retentionDays: competition.retentionDays,
      resultsFrozenAt: competition.resultsFrozenAt,
    },
    participants: participants.map((participant) => {
      const mine = (byParticipant.get(participant.id) ?? []).sort(
        (left, right) => right.attemptNumber - left.attemptNumber,
      )
      return {
        ...toPrivateParticipant(participant, mine),
        rank: ranked.find(
          (entry) => entry.result.participantId === participant.id,
        )?.rank,
        attemptDetail: mine.map(toAttemptView),
      }
    }),
  }
}

async function audit(
  dependencies: OrganizerDependencies,
  actor: string,
  competitionId: string,
  action: string,
  target: { readonly type: string; readonly id: string } | undefined,
  reason: string | undefined,
  metadata?: Readonly<Record<string, unknown>>,
): Promise<void> {
  await dependencies.store.appendAudit({
    competitionId,
    actor,
    action,
    targetType: target?.type,
    targetId: target?.id,
    reason,
    metadata,
  })
}

export async function setCompetitionStatus(
  dependencies: OrganizerDependencies,
  actor: string,
  competition: CompetitionRow,
  status: CompetitionRow['status'],
  reason: string,
): Promise<Outcome<CompetitionRow>> {
  const updated = await dependencies.store.updateCompetition(competition.id, {
    status,
  })
  if (updated === undefined) {
    return { ok: false, error: competitionError('INVALID_REQUEST') }
  }
  await audit(
    dependencies,
    actor,
    competition.id,
    'competition.status',
    { type: 'competition', id: competition.id },
    reason,
    { from: competition.status, to: status },
  )
  return { ok: true, value: updated }
}

export interface ParticipantCorrection {
  readonly nickname?: string
  readonly fullName?: string
  readonly schoolYear?: string
  readonly division?: string | null
  readonly nicknameHidden?: boolean
}

export async function correctParticipant(
  dependencies: OrganizerDependencies,
  actor: string,
  competition: CompetitionRow,
  participantId: string,
  correction: ParticipantCorrection,
  reason: string,
): Promise<Outcome<ParticipantRow>> {
  const participant =
    await dependencies.store.findParticipantById(participantId)
  if (
    participant === undefined ||
    participant.competitionId !== competition.id
  ) {
    return {
      ok: false,
      error: competitionError('INVALID_REQUEST', 'participante'),
    }
  }

  let patch: ParticipantPatch = {}
  const changed: string[] = []

  if (correction.nickname !== undefined) {
    const problem = validateNickname(correction.nickname)
    if (problem !== undefined) {
      return { ok: false, error: competitionError('NICKNAME_INVALID', problem) }
    }
    const display = normalizeNickname(correction.nickname)
    const key = nicknameKey(display)
    const taken = await dependencies.store.findParticipantByNickname(
      competition.id,
      key,
    )
    if (taken !== undefined && taken.id !== participantId) {
      return { ok: false, error: competitionError('NICKNAME_TAKEN') }
    }
    patch = { ...patch, publicNickname: display, nicknameKey: key }
    changed.push('nickname')
  }
  if (correction.fullName !== undefined) {
    patch = { ...patch, fullNamePrivate: correction.fullName.trim() }
    changed.push('fullName')
  }
  if (correction.schoolYear !== undefined) {
    if (!dependencies.config.schoolYears.includes(correction.schoolYear)) {
      return {
        ok: false,
        error: competitionError('INVALID_REQUEST', 'schoolYear'),
      }
    }
    patch = { ...patch, schoolYearPrivate: correction.schoolYear }
    changed.push('schoolYear')
  }
  if (correction.division !== undefined) {
    patch = { ...patch, divisionPrivate: correction.division }
    changed.push('division')
  }
  if (correction.nicknameHidden !== undefined) {
    patch = { ...patch, nicknameHidden: correction.nicknameHidden }
    changed.push('nicknameHidden')
  }

  const updated = await dependencies.store.updateParticipant(
    participantId,
    patch,
  )
  if (updated === undefined) {
    return { ok: false, error: competitionError('INVALID_REQUEST') }
  }
  // El registro de auditoría guarda **qué campos** cambiaron, nunca sus
  // valores: un log con el nombre viejo y el nuevo sería una segunda copia del
  // dato personal, en un lugar que nadie purga.
  await audit(
    dependencies,
    actor,
    competition.id,
    'participant.correct',
    { type: 'participant', id: participantId },
    reason,
    { fields: changed },
  )
  return { ok: true, value: updated }
}

export async function setParticipantEligibility(
  dependencies: OrganizerDependencies,
  actor: string,
  competition: CompetitionRow,
  participantId: string,
  status: ParticipantRow['status'],
  reason: string,
): Promise<Outcome<ParticipantRow>> {
  const participant =
    await dependencies.store.findParticipantById(participantId)
  if (
    participant === undefined ||
    participant.competitionId !== competition.id
  ) {
    return {
      ok: false,
      error: competitionError('INVALID_REQUEST', 'participante'),
    }
  }
  const updated = await dependencies.store.updateParticipant(participantId, {
    status,
    statusReason: reason,
  })
  if (updated === undefined) {
    return { ok: false, error: competitionError('INVALID_REQUEST') }
  }
  if (status === 'DISQUALIFIED') {
    // La sesión se revoca junto con la elegibilidad: si no, el navegador
    // seguiría jugando partidas que ya no pueden entrar al ranking.
    await dependencies.store.revokeParticipantSessions(
      participantId,
      dependencies.clock.now().toISOString(),
    )
  }
  await audit(
    dependencies,
    actor,
    competition.id,
    status === 'DISQUALIFIED'
      ? 'participant.disqualify'
      : 'participant.reinstate',
    { type: 'participant', id: participantId },
    reason,
  )
  return { ok: true, value: updated }
}

export async function setAttemptValidity(
  dependencies: OrganizerDependencies,
  actor: string,
  competition: CompetitionRow,
  attemptId: string,
  invalid: boolean,
  reason: string,
): Promise<Outcome<AttemptRow>> {
  const attempt = await dependencies.store.findAttemptById(attemptId)
  if (attempt === undefined || attempt.competitionId !== competition.id) {
    return { ok: false, error: competitionError('ATTEMPT_NOT_FOUND') }
  }
  // La evidencia no se borra. Un intento invalidado conserva su log, su score
  // verificado y sus versiones: deja de rankear, y sigue auditándose.
  const updated = invalid
    ? await dependencies.store.invalidateAttempt(
        attemptId,
        dependencies.clock.now().toISOString(),
        reason,
      )
    : await dependencies.store.restoreAttempt(attemptId)
  if (updated === undefined) {
    return { ok: false, error: competitionError('ATTEMPT_NOT_FOUND') }
  }
  await audit(
    dependencies,
    actor,
    competition.id,
    invalid ? 'attempt.invalidate' : 'attempt.restore',
    { type: 'attempt', id: attemptId },
    reason,
  )
  return { ok: true, value: updated }
}

export async function verifyWinnerIdentity(
  dependencies: OrganizerDependencies,
  actor: string,
  competition: CompetitionRow,
  participantId: string,
  verified: boolean,
  reason: string,
): Promise<Outcome<ParticipantRow>> {
  const updated = await dependencies.store.updateParticipant(participantId, {
    identityVerifiedAt: verified
      ? dependencies.clock.now().toISOString()
      : null,
  })
  if (updated === undefined) {
    return { ok: false, error: competitionError('INVALID_REQUEST') }
  }
  await audit(
    dependencies,
    actor,
    competition.id,
    'participant.identity-verified',
    { type: 'participant', id: participantId },
    reason,
    { verified },
  )
  return { ok: true, value: updated }
}
