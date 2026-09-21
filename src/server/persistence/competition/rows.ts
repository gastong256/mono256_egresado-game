import 'server-only'

/**
 * Las filas de la competencia, tal como viven en la base.
 *
 * Son el vocabulario de la capa de datos y no salen de ella sin pasar por un
 * DTO: `ParticipantRow` tiene nombre completo y últimos cuatro dígitos, y
 * devolverlo desde una ruta pública sería exactamente el error que STAGE-09
 * existe para hacer imposible. La frontera está en `@/server/competition/dto`.
 */

export type CompetitionStatus =
  'DRAFT' | 'UPCOMING' | 'OPEN' | 'CLOSED' | 'ARCHIVED'

export type ParticipantStatus = 'ELIGIBLE' | 'DISQUALIFIED'

export type AttemptStatus =
  'STARTED' | 'ABANDONED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'

/** La tupla congelada que una edición permite y un intento repite. */
export interface PinnedVersions {
  readonly engineVersion: string
  readonly rulesetVersion: string
  readonly contentVersion: string
  readonly variantCatalogVersion: string
  readonly scoreVersion: string
  readonly actionLogVersion: number
  readonly snapshotVersion: number
}

export interface CompetitionRow extends PinnedVersions {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly status: CompetitionStatus
  readonly opensAt: string | undefined
  readonly closesAt: string | undefined
  readonly submissionGraceSeconds: number
  /** Competition Seed compartida de la edición. Igual para todos los intentos. */
  readonly runSeed: string
  readonly runPlanFingerprint: string
  readonly privacyNoticeVersion: string
  readonly retentionDays: number
  readonly resultsFrozenAt: string | undefined
}

export interface ParticipantRow {
  readonly id: string
  readonly competitionId: string
  readonly publicNickname: string
  readonly nicknameKey: string
  readonly nicknameHidden: boolean
  readonly fullNamePrivate: string | undefined
  readonly schoolYearPrivate: string | undefined
  readonly divisionPrivate: string | undefined
  readonly identityHmac: string
  readonly dniLast4Private: string | undefined
  readonly status: ParticipantStatus
  readonly statusReason: string | undefined
  readonly identityVerifiedAt: string | undefined
  readonly privacyNoticeVersion: string
  readonly anonymizedAt: string | undefined
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ParticipantSessionRow {
  readonly id: string
  readonly participantId: string
  readonly tokenHash: string
  readonly createdAt: string
  readonly expiresAt: string
  readonly revokedAt: string | undefined
  readonly lastSeenAt: string | undefined
}

export interface AttemptRow extends PinnedVersions {
  readonly id: string
  readonly competitionId: string
  readonly participantId: string
  readonly attemptNumber: number
  readonly status: AttemptStatus
  readonly runId: string
  readonly seed: string
  readonly runPlanFingerprint: string
  readonly startedAt: string
  readonly submittedAt: string | undefined
  readonly verifiedAt: string | undefined
  readonly actionLog: unknown
  readonly submissionDigest: string | undefined
  readonly verifiedFairScore: number | undefined
  readonly verifiedPrestigeScore: number | undefined
  readonly verifiedSummary: unknown
  readonly rejectionCode: string | undefined
  readonly invalidatedAt: string | undefined
  readonly invalidatedReason: string | undefined
}

/** Fila de la vista del mejor intento verificado. Sin un solo campo privado. */
export interface BestAttemptRow {
  readonly competitionId: string
  readonly participantId: string
  readonly attemptId: string
  readonly publicNickname: string
  readonly nicknameHidden: boolean
  readonly verifiedFairScore: number
  readonly verifiedPrestigeScore: number
  readonly verifiedAt: string
}

export interface OrganizerSessionRow {
  readonly id: string
  readonly organizerUsername: string
  readonly tokenHash: string
  readonly createdAt: string
  readonly expiresAt: string
  readonly revokedAt: string | undefined
}

export interface AuditEntry {
  readonly competitionId: string | undefined
  readonly actor: string
  readonly action: string
  readonly targetType: string | undefined
  readonly targetId: string | undefined
  readonly reason: string | undefined
  readonly metadata: Readonly<Record<string, unknown>> | undefined
}

export interface AuditRow extends AuditEntry {
  readonly id: number
  readonly createdAt: string
}
