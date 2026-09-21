import 'server-only'

import { randomUUID } from 'node:crypto'

import type {
  AttemptFinalization,
  AttemptInput,
  AttemptInsert,
  CompetitionInput,
  CompetitionStore,
  ParticipantInput,
  ParticipantInsert,
  ParticipantPatch,
} from './store'
import type {
  AttemptRow,
  AttemptStatus,
  AuditEntry,
  AuditRow,
  BestAttemptRow,
  CompetitionRow,
  CompetitionStatus,
  OrganizerSessionRow,
  ParticipantRow,
  ParticipantSessionRow,
} from './rows'

/**
 * Implementación en memoria del puerto de competencia.
 *
 * No es un mock: es una segunda implementación real, y la suite de contrato
 * corre contra ésta y contra Postgres. Sirve para dos cosas. Deja probar la
 * lógica de dominio —empates, mejor intento, idempotencia, expiración de
 * sesión— sin levantar una base, y obliga a que las garantías que el servicio
 * usa estén escritas en el puerto y no descubiertas por casualidad en el SQL.
 *
 * Las restricciones únicas se emulan explícitamente. Un proceso de Node es de
 * un solo hilo y cada método resuelve sin ceder, así que la atomicidad es
 * trivial acá; lo que importa es que el **resultado** sea el mismo que devuelve
 * Postgres, incluido qué restricción gana cuando dos chocan.
 */
export class InMemoryCompetitionStore implements CompetitionStore {
  private readonly competitions = new Map<string, CompetitionRow>()
  private readonly participants = new Map<string, ParticipantRow>()
  private readonly participantSessions = new Map<
    string,
    ParticipantSessionRow
  >()
  private readonly attempts = new Map<string, AttemptRow>()
  private readonly organizerSessions = new Map<string, OrganizerSessionRow>()
  private readonly audit: AuditRow[] = []
  private readonly rateLimits = new Map<string, number>()
  private auditSequence = 0

  private now(): string {
    return new Date().toISOString()
  }

  async findCompetitionBySlug(slug: string) {
    return [...this.competitions.values()].find((row) => row.slug === slug)
  }

  async findCompetitionById(id: string) {
    return this.competitions.get(id)
  }

  async listCompetitions() {
    return [...this.competitions.values()].sort((left, right) =>
      left.slug < right.slug ? -1 : 1,
    )
  }

  async insertCompetition(input: CompetitionInput): Promise<CompetitionRow> {
    if ((await this.findCompetitionBySlug(input.slug)) !== undefined) {
      throw new Error(`duplicate competition slug: ${input.slug}`)
    }
    const row: CompetitionRow = {
      id: randomUUID(),
      resultsFrozenAt: undefined,
      ...input,
    }
    this.competitions.set(row.id, row)
    return row
  }

  async updateCompetition(
    id: string,
    patch: {
      readonly status?: CompetitionStatus
      readonly opensAt?: string | null
      readonly closesAt?: string | null
      readonly resultsFrozenAt?: string | null
    },
  ) {
    const current = this.competitions.get(id)
    if (current === undefined) return undefined
    const next: CompetitionRow = {
      ...current,
      ...(patch.status === undefined ? {} : { status: patch.status }),
      ...(patch.opensAt === undefined
        ? {}
        : { opensAt: patch.opensAt ?? undefined }),
      ...(patch.closesAt === undefined
        ? {}
        : { closesAt: patch.closesAt ?? undefined }),
      ...(patch.resultsFrozenAt === undefined
        ? {}
        : { resultsFrozenAt: patch.resultsFrozenAt ?? undefined }),
    }
    this.competitions.set(id, next)
    return next
  }

  async insertParticipant(input: ParticipantInput): Promise<ParticipantInsert> {
    const rows = [...this.participants.values()].filter(
      (row) => row.competitionId === input.competitionId,
    )
    // El orden importa y es el mismo que el de la base: la unicidad de
    // identidad se evalúa primero porque decide si esta persona ya existe. Un
    // alias tomado por otra persona es un problema distinto y posterior.
    if (rows.some((row) => row.identityHmac === input.identityHmac)) {
      return { outcome: 'identity-conflict' }
    }
    if (rows.some((row) => row.nicknameKey === input.nicknameKey)) {
      return { outcome: 'nickname-conflict' }
    }
    const timestamp = this.now()
    const row: ParticipantRow = {
      id: randomUUID(),
      competitionId: input.competitionId,
      publicNickname: input.publicNickname,
      nicknameKey: input.nicknameKey,
      nicknameHidden: false,
      fullNamePrivate: input.fullNamePrivate,
      schoolYearPrivate: input.schoolYearPrivate,
      divisionPrivate: input.divisionPrivate,
      identityHmac: input.identityHmac,
      dniLast4Private: input.dniLast4Private,
      status: 'ELIGIBLE',
      statusReason: undefined,
      identityVerifiedAt: undefined,
      privacyNoticeVersion: input.privacyNoticeVersion,
      anonymizedAt: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.participants.set(row.id, row)
    return { outcome: 'created', participant: row }
  }

  async findParticipantByIdentity(competitionId: string, identityHmac: string) {
    return [...this.participants.values()].find(
      (row) =>
        row.competitionId === competitionId &&
        row.identityHmac === identityHmac,
    )
  }

  async findParticipantById(id: string) {
    return this.participants.get(id)
  }

  async findParticipantByNickname(competitionId: string, nicknameKey: string) {
    return [...this.participants.values()].find(
      (row) =>
        row.competitionId === competitionId && row.nicknameKey === nicknameKey,
    )
  }

  async listParticipants(competitionId: string) {
    return [...this.participants.values()]
      .filter((row) => row.competitionId === competitionId)
      .sort((left, right) => (left.createdAt < right.createdAt ? -1 : 1))
  }

  async updateParticipant(id: string, patch: ParticipantPatch) {
    const current = this.participants.get(id)
    if (current === undefined) return undefined
    if (
      patch.nicknameKey !== undefined &&
      patch.nicknameKey !== current.nicknameKey &&
      [...this.participants.values()].some(
        (row) =>
          row.competitionId === current.competitionId &&
          row.nicknameKey === patch.nicknameKey,
      )
    ) {
      throw new Error('duplicate nickname')
    }

    const next: ParticipantRow = {
      ...current,
      ...(patch.publicNickname === undefined
        ? {}
        : { publicNickname: patch.publicNickname }),
      ...(patch.nicknameKey === undefined
        ? {}
        : { nicknameKey: patch.nicknameKey }),
      ...(patch.nicknameHidden === undefined
        ? {}
        : { nicknameHidden: patch.nicknameHidden }),
      ...(patch.fullNamePrivate === undefined
        ? {}
        : { fullNamePrivate: patch.fullNamePrivate ?? undefined }),
      ...(patch.schoolYearPrivate === undefined
        ? {}
        : { schoolYearPrivate: patch.schoolYearPrivate ?? undefined }),
      ...(patch.divisionPrivate === undefined
        ? {}
        : { divisionPrivate: patch.divisionPrivate ?? undefined }),
      ...(patch.dniLast4Private === undefined
        ? {}
        : { dniLast4Private: patch.dniLast4Private ?? undefined }),
      ...(patch.status === undefined ? {} : { status: patch.status }),
      ...(patch.statusReason === undefined
        ? {}
        : { statusReason: patch.statusReason ?? undefined }),
      ...(patch.identityVerifiedAt === undefined
        ? {}
        : { identityVerifiedAt: patch.identityVerifiedAt ?? undefined }),
      ...(patch.anonymizedAt === undefined
        ? {}
        : { anonymizedAt: patch.anonymizedAt ?? undefined }),
      updatedAt: this.now(),
    }
    this.participants.set(id, next)
    return next
  }

  async insertParticipantSession(input: {
    readonly participantId: string
    readonly tokenHash: string
    readonly expiresAt: string
  }) {
    const row: ParticipantSessionRow = {
      id: randomUUID(),
      participantId: input.participantId,
      tokenHash: input.tokenHash,
      createdAt: this.now(),
      expiresAt: input.expiresAt,
      revokedAt: undefined,
      lastSeenAt: undefined,
    }
    this.participantSessions.set(row.tokenHash, row)
    return row
  }

  async findParticipantSession(tokenHash: string) {
    return this.participantSessions.get(tokenHash)
  }

  async touchParticipantSession(id: string, at: string) {
    for (const [key, row] of this.participantSessions) {
      if (row.id === id) {
        this.participantSessions.set(key, { ...row, lastSeenAt: at })
      }
    }
  }

  async revokeParticipantSession(tokenHash: string, at: string) {
    const row = this.participantSessions.get(tokenHash)
    if (row !== undefined) {
      this.participantSessions.set(tokenHash, { ...row, revokedAt: at })
    }
  }

  async revokeParticipantSessions(participantId: string, at: string) {
    for (const [key, row] of this.participantSessions) {
      if (row.participantId === participantId && row.revokedAt === undefined) {
        this.participantSessions.set(key, { ...row, revokedAt: at })
      }
    }
  }

  async insertAttempt(input: AttemptInput): Promise<AttemptInsert> {
    const mine = [...this.attempts.values()].filter(
      (row) => row.participantId === input.participantId,
    )
    if (mine.some((row) => row.status === 'STARTED')) {
      return { outcome: 'active-conflict' }
    }
    if (mine.some((row) => row.attemptNumber === input.attemptNumber)) {
      return { outcome: 'number-conflict' }
    }
    const row: AttemptRow = {
      id: randomUUID(),
      status: 'STARTED',
      submittedAt: undefined,
      verifiedAt: undefined,
      actionLog: undefined,
      submissionDigest: undefined,
      verifiedFairScore: undefined,
      verifiedPrestigeScore: undefined,
      verifiedSummary: undefined,
      rejectionCode: undefined,
      invalidatedAt: undefined,
      invalidatedReason: undefined,
      ...input,
    }
    this.attempts.set(row.id, row)
    return { outcome: 'created', attempt: row }
  }

  async findActiveAttempt(participantId: string) {
    return [...this.attempts.values()].find(
      (row) => row.participantId === participantId && row.status === 'STARTED',
    )
  }

  async findAttemptById(id: string) {
    return this.attempts.get(id)
  }

  async countAttempts(participantId: string) {
    return [...this.attempts.values()].filter(
      (row) => row.participantId === participantId,
    ).length
  }

  async listAttempts(competitionId: string) {
    return [...this.attempts.values()]
      .filter((row) => row.competitionId === competitionId)
      .sort((left, right) => (left.startedAt < right.startedAt ? -1 : 1))
  }

  async listAttemptsForParticipant(participantId: string) {
    return [...this.attempts.values()]
      .filter((row) => row.participantId === participantId)
      .sort((left, right) => right.attemptNumber - left.attemptNumber)
  }

  async finalizeAttempt(
    id: string,
    expected: readonly AttemptStatus[],
    finalization: AttemptFinalization,
  ) {
    const current = this.attempts.get(id)
    if (current === undefined || !expected.includes(current.status)) {
      return undefined
    }
    const next: AttemptRow = { ...current, ...finalization }
    this.attempts.set(id, next)
    return next
  }

  async abandonAttempt(id: string) {
    const current = this.attempts.get(id)
    if (current === undefined || current.status !== 'STARTED') return undefined
    const next: AttemptRow = { ...current, status: 'ABANDONED' }
    this.attempts.set(id, next)
    return next
  }

  async invalidateAttempt(id: string, at: string, reason: string) {
    const current = this.attempts.get(id)
    if (current === undefined) return undefined
    const next: AttemptRow = {
      ...current,
      invalidatedAt: at,
      invalidatedReason: reason,
    }
    this.attempts.set(id, next)
    return next
  }

  async restoreAttempt(id: string) {
    const current = this.attempts.get(id)
    if (current === undefined) return undefined
    const next: AttemptRow = {
      ...current,
      invalidatedAt: undefined,
      invalidatedReason: undefined,
    }
    this.attempts.set(id, next)
    return next
  }

  async bestVerifiedAttempts(competitionId: string) {
    const best = new Map<string, BestAttemptRow>()
    const candidates = [...this.attempts.values()]
      .filter(
        (row) =>
          row.competitionId === competitionId &&
          row.status === 'VERIFIED' &&
          row.invalidatedAt === undefined,
      )
      .sort((left, right) => {
        const fair =
          (right.verifiedFairScore ?? 0) - (left.verifiedFairScore ?? 0)
        if (fair !== 0) return fair
        const prestige =
          (right.verifiedPrestigeScore ?? 0) - (left.verifiedPrestigeScore ?? 0)
        if (prestige !== 0) return prestige
        return left.id < right.id ? -1 : 1
      })

    for (const attempt of candidates) {
      const participant = this.participants.get(attempt.participantId)
      if (participant === undefined || participant.status !== 'ELIGIBLE') {
        continue
      }
      if (best.has(attempt.participantId)) continue
      best.set(attempt.participantId, {
        competitionId,
        participantId: attempt.participantId,
        attemptId: attempt.id,
        publicNickname: participant.publicNickname,
        nicknameHidden: participant.nicknameHidden,
        verifiedFairScore: attempt.verifiedFairScore ?? 0,
        verifiedPrestigeScore: attempt.verifiedPrestigeScore ?? 0,
        verifiedAt: attempt.verifiedAt ?? attempt.startedAt,
      })
    }

    return [...best.values()]
  }

  async insertOrganizerSession(input: {
    readonly organizerUsername: string
    readonly tokenHash: string
    readonly expiresAt: string
  }) {
    const row: OrganizerSessionRow = {
      id: randomUUID(),
      organizerUsername: input.organizerUsername,
      tokenHash: input.tokenHash,
      createdAt: this.now(),
      expiresAt: input.expiresAt,
      revokedAt: undefined,
    }
    this.organizerSessions.set(row.tokenHash, row)
    return row
  }

  async findOrganizerSession(tokenHash: string) {
    return this.organizerSessions.get(tokenHash)
  }

  async revokeOrganizerSession(tokenHash: string, at: string) {
    const row = this.organizerSessions.get(tokenHash)
    if (row !== undefined) {
      this.organizerSessions.set(tokenHash, { ...row, revokedAt: at })
    }
  }

  async appendAudit(entry: AuditEntry) {
    this.auditSequence += 1
    this.audit.push({ ...entry, id: this.auditSequence, createdAt: this.now() })
  }

  async listAudit(competitionId: string, limit: number) {
    return this.audit
      .filter((row) => row.competitionId === competitionId)
      .sort((left, right) => right.id - left.id)
      .slice(0, limit)
  }

  async incrementRateLimit(bucket: string, windowStart: string) {
    const key = `${bucket}::${windowStart}`
    const next = (this.rateLimits.get(key) ?? 0) + 1
    this.rateLimits.set(key, next)
    return next
  }

  async purgeRateLimits(before: string) {
    for (const key of [...this.rateLimits.keys()]) {
      const windowStart = key.slice(key.indexOf('::') + 2)
      if (windowStart < before) this.rateLimits.delete(key)
    }
  }
}
