import 'server-only'

import { createPrivilegedSupabaseClient } from '../supabase/privileged-client'
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
 * El adaptador de Postgres, sobre la clave secreta.
 *
 * Cada operación que tiene que ser atómica es **una sola sentencia**, y la
 * atomicidad la da la base: un `insert` que choca contra un índice único, un
 * `update` con la condición de estado en el `where`, un `upsert` que incrementa.
 * Eso es lo que permite no necesitar transacciones explícitas sobre PostgREST,
 * que no las ofrece — y, más importante, es lo que hace que la garantía no
 * dependa de que este proceso sea el único escribiendo.
 *
 * Los códigos de error de Postgres se leen por número, no por mensaje:
 * `23505` es violación de unicidad, y el nombre de la restricción dice cuál.
 */

type Client = ReturnType<typeof createPrivilegedSupabaseClient>

interface PostgrestFailure {
  readonly code?: string
  readonly message?: string
}

const UNIQUE_VIOLATION = '23505'

export class CompetitionStorageError extends Error {
  constructor(operation: string, cause: PostgrestFailure) {
    super(
      `La operación de competencia "${operation}" falló: ${cause.code ?? 'sin código'}`,
    )
    this.name = 'CompetitionStorageError'
  }
}

function fail(operation: string, error: PostgrestFailure): never {
  throw new CompetitionStorageError(operation, error)
}

function optional(value: string | null): string | undefined {
  return value ?? undefined
}

/**
 * Normaliza un `timestamptz` a ISO-8601 en UTC.
 *
 * Postgres devuelve `2026-10-03T18:00:00+00:00` y el store en memoria
 * `2026-10-03T18:00:00.000Z`: el mismo instante con dos ortografías. Las
 * comparaciones del dominio pasan por `new Date(...)` y no notan la
 * diferencia, pero cualquier igualdad de texto sí, y una fecha que se ve
 * distinta según la implementación es una trampa esperando a que alguien
 * compare dos strings. Se canoniza acá, en el borde.
 */
function instant(value: string | null): string | undefined {
  if (value === null) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}

function requiredInstant(value: string): string {
  return instant(value) ?? value
}

/* eslint-disable @typescript-eslint/no-explicit-any -- El cliente generado
   tipa cada tabla, pero las filas se mapean a los tipos del dominio en un solo
   lugar; anotar cada shape intermedio duplicaría el esquema sin agregar una
   garantía que el mapeo no dé ya. */

function toCompetition(row: any): CompetitionRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status as CompetitionStatus,
    opensAt: instant(row.opens_at),
    closesAt: instant(row.closes_at),
    submissionGraceSeconds: row.submission_grace_seconds,
    runSeed: row.run_seed,
    runPlanFingerprint: row.run_plan_fingerprint,
    engineVersion: row.engine_version,
    rulesetVersion: row.ruleset_version,
    contentVersion: row.content_version,
    variantCatalogVersion: row.variant_catalog_version,
    scoreVersion: row.score_version,
    actionLogVersion: row.action_log_version,
    snapshotVersion: row.snapshot_version,
    privacyNoticeVersion: row.privacy_notice_version,
    retentionDays: row.retention_days,
    resultsFrozenAt: instant(row.results_frozen_at),
  }
}

function toParticipant(row: any): ParticipantRow {
  return {
    id: row.id,
    competitionId: row.competition_id,
    publicNickname: row.public_nickname,
    nicknameKey: row.nickname_key,
    nicknameHidden: row.nickname_hidden,
    fullNamePrivate: optional(row.full_name_private),
    schoolYearPrivate: optional(row.school_year_private),
    divisionPrivate: optional(row.division_private),
    identityHmac: row.identity_hmac,
    dniLast4Private: optional(row.dni_last4_private),
    status: row.status,
    statusReason: optional(row.status_reason),
    identityVerifiedAt: instant(row.identity_verified_at),
    privacyNoticeVersion: row.privacy_notice_version,
    anonymizedAt: instant(row.anonymized_at),
    createdAt: requiredInstant(row.created_at),
    updatedAt: requiredInstant(row.updated_at),
  }
}

function toParticipantSession(row: any): ParticipantSessionRow {
  return {
    id: row.id,
    participantId: row.participant_id,
    tokenHash: row.token_hash,
    createdAt: requiredInstant(row.created_at),
    expiresAt: requiredInstant(row.expires_at),
    revokedAt: instant(row.revoked_at),
    lastSeenAt: instant(row.last_seen_at),
  }
}

function toAttempt(row: any): AttemptRow {
  return {
    id: row.id,
    competitionId: row.competition_id,
    participantId: row.participant_id,
    attemptNumber: row.attempt_number,
    status: row.status as AttemptStatus,
    runId: row.run_id,
    seed: row.seed,
    runPlanFingerprint: row.run_plan_fingerprint,
    engineVersion: row.engine_version,
    rulesetVersion: row.ruleset_version,
    contentVersion: row.content_version,
    variantCatalogVersion: row.variant_catalog_version,
    scoreVersion: row.score_version,
    actionLogVersion: row.action_log_version,
    snapshotVersion: row.snapshot_version,
    startedAt: requiredInstant(row.started_at),
    submittedAt: instant(row.submitted_at),
    verifiedAt: instant(row.verified_at),
    actionLog: row.action_log ?? undefined,
    submissionDigest: optional(row.submission_digest),
    verifiedFairScore: row.verified_fair_score ?? undefined,
    verifiedPrestigeScore: row.verified_prestige_score ?? undefined,
    verifiedSummary: row.verified_summary ?? undefined,
    rejectionCode: optional(row.rejection_code),
    invalidatedAt: instant(row.invalidated_at),
    invalidatedReason: optional(row.invalidated_reason),
  }
}

function toOrganizerSession(row: any): OrganizerSessionRow {
  return {
    id: row.id,
    organizerUsername: row.organizer_username,
    tokenHash: row.token_hash,
    createdAt: requiredInstant(row.created_at),
    expiresAt: requiredInstant(row.expires_at),
    revokedAt: instant(row.revoked_at),
  }
}

export class SupabaseCompetitionStore implements CompetitionStore {
  private readonly client: Client

  constructor(client?: Client) {
    this.client = client ?? createPrivilegedSupabaseClient()
  }

  private table(name: string) {
    return (this.client as any).from(name)
  }

  async findCompetitionBySlug(slug: string) {
    const { data, error } = await this.table('competitions')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (error) fail('findCompetitionBySlug', error)
    return data === null ? undefined : toCompetition(data)
  }

  async findCompetitionById(id: string) {
    const { data, error } = await this.table('competitions')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) fail('findCompetitionById', error)
    return data === null ? undefined : toCompetition(data)
  }

  async listCompetitions() {
    const { data, error } = await this.table('competitions')
      .select('*')
      .order('slug')
    if (error) fail('listCompetitions', error)
    return (data ?? []).map(toCompetition)
  }

  async insertCompetition(input: CompetitionInput) {
    const { data, error } = await this.table('competitions')
      .insert({
        slug: input.slug,
        name: input.name,
        status: input.status,
        opens_at: input.opensAt ?? null,
        closes_at: input.closesAt ?? null,
        submission_grace_seconds: input.submissionGraceSeconds,
        run_seed: input.runSeed,
        run_plan_fingerprint: input.runPlanFingerprint,
        engine_version: input.engineVersion,
        ruleset_version: input.rulesetVersion,
        content_version: input.contentVersion,
        variant_catalog_version: input.variantCatalogVersion,
        score_version: input.scoreVersion,
        action_log_version: input.actionLogVersion,
        snapshot_version: input.snapshotVersion,
        privacy_notice_version: input.privacyNoticeVersion,
        retention_days: input.retentionDays,
      })
      .select('*')
      .single()
    if (error) fail('insertCompetition', error)
    return toCompetition(data)
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
    const { data, error } = await this.table('competitions')
      .update({
        ...(patch.status === undefined ? {} : { status: patch.status }),
        ...(patch.opensAt === undefined ? {} : { opens_at: patch.opensAt }),
        ...(patch.closesAt === undefined ? {} : { closes_at: patch.closesAt }),
        ...(patch.resultsFrozenAt === undefined
          ? {}
          : { results_frozen_at: patch.resultsFrozenAt }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error) fail('updateCompetition', error)
    return data === null ? undefined : toCompetition(data)
  }

  async insertParticipant(input: ParticipantInput): Promise<ParticipantInsert> {
    const { data, error } = await this.table('participants')
      .insert({
        competition_id: input.competitionId,
        public_nickname: input.publicNickname,
        nickname_key: input.nicknameKey,
        full_name_private: input.fullNamePrivate,
        school_year_private: input.schoolYearPrivate,
        division_private: input.divisionPrivate ?? null,
        identity_hmac: input.identityHmac,
        dni_last4_private: input.dniLast4Private,
        privacy_notice_version: input.privacyNoticeVersion,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        // Cuál de las dos restricciones ganó decide qué se le dice al jugador:
        // "ya estás registrado" y "ese alias está tomado" son respuestas
        // distintas, y ninguna de las dos puede describir a la otra persona.
        return (error.message ?? '').includes('participants_identity_unique')
          ? { outcome: 'identity-conflict' }
          : { outcome: 'nickname-conflict' }
      }
      fail('insertParticipant', error)
    }
    return { outcome: 'created', participant: toParticipant(data) }
  }

  async findParticipantByIdentity(competitionId: string, identityHmac: string) {
    const { data, error } = await this.table('participants')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('identity_hmac', identityHmac)
      .maybeSingle()
    if (error) fail('findParticipantByIdentity', error)
    return data === null ? undefined : toParticipant(data)
  }

  async findParticipantById(id: string) {
    const { data, error } = await this.table('participants')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) fail('findParticipantById', error)
    return data === null ? undefined : toParticipant(data)
  }

  async findParticipantByNickname(competitionId: string, nicknameKey: string) {
    const { data, error } = await this.table('participants')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('nickname_key', nicknameKey)
      .maybeSingle()
    if (error) fail('findParticipantByNickname', error)
    return data === null ? undefined : toParticipant(data)
  }

  async listParticipants(competitionId: string) {
    const { data, error } = await this.table('participants')
      .select('*')
      .eq('competition_id', competitionId)
      .order('created_at')
    if (error) fail('listParticipants', error)
    return (data ?? []).map(toParticipant)
  }

  async updateParticipant(id: string, patch: ParticipantPatch) {
    const { data, error } = await this.table('participants')
      .update({
        ...(patch.publicNickname === undefined
          ? {}
          : { public_nickname: patch.publicNickname }),
        ...(patch.nicknameKey === undefined
          ? {}
          : { nickname_key: patch.nicknameKey }),
        ...(patch.nicknameHidden === undefined
          ? {}
          : { nickname_hidden: patch.nicknameHidden }),
        ...(patch.fullNamePrivate === undefined
          ? {}
          : { full_name_private: patch.fullNamePrivate }),
        ...(patch.schoolYearPrivate === undefined
          ? {}
          : { school_year_private: patch.schoolYearPrivate }),
        ...(patch.divisionPrivate === undefined
          ? {}
          : { division_private: patch.divisionPrivate }),
        ...(patch.dniLast4Private === undefined
          ? {}
          : { dni_last4_private: patch.dniLast4Private }),
        ...(patch.status === undefined ? {} : { status: patch.status }),
        ...(patch.statusReason === undefined
          ? {}
          : { status_reason: patch.statusReason }),
        ...(patch.identityVerifiedAt === undefined
          ? {}
          : { identity_verified_at: patch.identityVerifiedAt }),
        ...(patch.anonymizedAt === undefined
          ? {}
          : { anonymized_at: patch.anonymizedAt }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error) fail('updateParticipant', error)
    return data === null ? undefined : toParticipant(data)
  }

  async insertParticipantSession(input: {
    readonly participantId: string
    readonly tokenHash: string
    readonly expiresAt: string
  }) {
    const { data, error } = await this.table('participant_sessions')
      .insert({
        participant_id: input.participantId,
        token_hash: input.tokenHash,
        expires_at: input.expiresAt,
      })
      .select('*')
      .single()
    if (error) fail('insertParticipantSession', error)
    return toParticipantSession(data)
  }

  async findParticipantSession(tokenHash: string) {
    const { data, error } = await this.table('participant_sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle()
    if (error) fail('findParticipantSession', error)
    return data === null ? undefined : toParticipantSession(data)
  }

  async touchParticipantSession(id: string, at: string) {
    const { error } = await this.table('participant_sessions')
      .update({ last_seen_at: at })
      .eq('id', id)
    if (error) fail('touchParticipantSession', error)
  }

  async revokeParticipantSession(tokenHash: string, at: string) {
    const { error } = await this.table('participant_sessions')
      .update({ revoked_at: at })
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
    if (error) fail('revokeParticipantSession', error)
  }

  async revokeParticipantSessions(participantId: string, at: string) {
    const { error } = await this.table('participant_sessions')
      .update({ revoked_at: at })
      .eq('participant_id', participantId)
      .is('revoked_at', null)
    if (error) fail('revokeParticipantSessions', error)
  }

  async insertAttempt(input: AttemptInput): Promise<AttemptInsert> {
    const { data, error } = await this.table('attempts')
      .insert({
        competition_id: input.competitionId,
        participant_id: input.participantId,
        attempt_number: input.attemptNumber,
        run_id: input.runId,
        seed: input.seed,
        run_plan_fingerprint: input.runPlanFingerprint,
        engine_version: input.engineVersion,
        ruleset_version: input.rulesetVersion,
        content_version: input.contentVersion,
        variant_catalog_version: input.variantCatalogVersion,
        score_version: input.scoreVersion,
        action_log_version: input.actionLogVersion,
        snapshot_version: input.snapshotVersion,
        started_at: input.startedAt,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return (error.message ?? '').includes(
          'attempts_one_active_per_participant',
        )
          ? { outcome: 'active-conflict' }
          : { outcome: 'number-conflict' }
      }
      fail('insertAttempt', error)
    }
    return { outcome: 'created', attempt: toAttempt(data) }
  }

  async findActiveAttempt(participantId: string) {
    const { data, error } = await this.table('attempts')
      .select('*')
      .eq('participant_id', participantId)
      .eq('status', 'STARTED')
      .maybeSingle()
    if (error) fail('findActiveAttempt', error)
    return data === null ? undefined : toAttempt(data)
  }

  async findAttemptById(id: string) {
    const { data, error } = await this.table('attempts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) fail('findAttemptById', error)
    return data === null ? undefined : toAttempt(data)
  }

  async countAttempts(participantId: string) {
    const { count, error } = await this.table('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('participant_id', participantId)
    if (error) fail('countAttempts', error)
    return count ?? 0
  }

  async listAttempts(competitionId: string) {
    const { data, error } = await this.table('attempts')
      .select('*')
      .eq('competition_id', competitionId)
      .order('started_at')
    if (error) fail('listAttempts', error)
    return (data ?? []).map(toAttempt)
  }

  async listAttemptsForParticipant(participantId: string) {
    const { data, error } = await this.table('attempts')
      .select('*')
      .eq('participant_id', participantId)
      .order('attempt_number', { ascending: false })
    if (error) fail('listAttemptsForParticipant', error)
    return (data ?? []).map(toAttempt)
  }

  async finalizeAttempt(
    id: string,
    expected: readonly AttemptStatus[],
    finalization: AttemptFinalization,
  ) {
    // El estado esperado viaja en el `where`, así que dos envíos simultáneos
    // compiten por la misma fila y sólo uno la mueve. El que pierde recibe
    // cero filas, no un resultado distinto.
    const { data, error } = await this.table('attempts')
      .update({
        status: finalization.status,
        submitted_at: finalization.submittedAt,
        verified_at: finalization.verifiedAt ?? null,
        action_log: finalization.actionLog ?? null,
        submission_digest: finalization.submissionDigest,
        verified_fair_score: finalization.verifiedFairScore ?? null,
        verified_prestige_score: finalization.verifiedPrestigeScore ?? null,
        verified_summary: finalization.verifiedSummary ?? null,
        rejection_code: finalization.rejectionCode ?? null,
      })
      .eq('id', id)
      .in('status', [...expected])
      .select('*')
      .maybeSingle()
    if (error) fail('finalizeAttempt', error)
    return data === null ? undefined : toAttempt(data)
  }

  async abandonAttempt(id: string) {
    const { data, error } = await this.table('attempts')
      .update({ status: 'ABANDONED' })
      .eq('id', id)
      .eq('status', 'STARTED')
      .select('*')
      .maybeSingle()
    if (error) fail('abandonAttempt', error)
    return data === null ? undefined : toAttempt(data)
  }

  async invalidateAttempt(id: string, at: string, reason: string) {
    const { data, error } = await this.table('attempts')
      .update({ invalidated_at: at, invalidated_reason: reason })
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error) fail('invalidateAttempt', error)
    return data === null ? undefined : toAttempt(data)
  }

  async restoreAttempt(id: string) {
    const { data, error } = await this.table('attempts')
      .update({ invalidated_at: null, invalidated_reason: null })
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error) fail('restoreAttempt', error)
    return data === null ? undefined : toAttempt(data)
  }

  async bestVerifiedAttempts(competitionId: string) {
    const { data, error } = await this.table('competition_best_attempts')
      .select('*')
      .eq('competition_id', competitionId)
    if (error) fail('bestVerifiedAttempts', error)
    return (data ?? []).map((row: any): BestAttemptRow => ({
      competitionId: row.competition_id,
      participantId: row.participant_id,
      attemptId: row.attempt_id,
      publicNickname: row.public_nickname,
      nicknameHidden: row.nickname_hidden,
      verifiedFairScore: row.verified_fair_score ?? 0,
      verifiedPrestigeScore: row.verified_prestige_score ?? 0,
      verifiedAt: requiredInstant(row.verified_at),
    }))
  }

  async insertOrganizerSession(input: {
    readonly organizerUsername: string
    readonly tokenHash: string
    readonly expiresAt: string
  }) {
    const { data, error } = await this.table('organizer_sessions')
      .insert({
        organizer_username: input.organizerUsername,
        token_hash: input.tokenHash,
        expires_at: input.expiresAt,
      })
      .select('*')
      .single()
    if (error) fail('insertOrganizerSession', error)
    return toOrganizerSession(data)
  }

  async findOrganizerSession(tokenHash: string) {
    const { data, error } = await this.table('organizer_sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle()
    if (error) fail('findOrganizerSession', error)
    return data === null ? undefined : toOrganizerSession(data)
  }

  async revokeOrganizerSession(tokenHash: string, at: string) {
    const { error } = await this.table('organizer_sessions')
      .update({ revoked_at: at })
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
    if (error) fail('revokeOrganizerSession', error)
  }

  async appendAudit(entry: AuditEntry) {
    const { error } = await this.table('organizer_audit_log').insert({
      competition_id: entry.competitionId ?? null,
      actor: entry.actor,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      reason: entry.reason ?? null,
      metadata: entry.metadata ?? null,
    })
    if (error) fail('appendAudit', error)
  }

  async listAudit(competitionId: string, limit: number) {
    const { data, error } = await this.table('organizer_audit_log')
      .select('*')
      .eq('competition_id', competitionId)
      .order('id', { ascending: false })
      .limit(limit)
    if (error) fail('listAudit', error)
    return (data ?? []).map((row: any): AuditRow => ({
      id: Number(row.id),
      competitionId: optional(row.competition_id),
      actor: row.actor,
      action: row.action,
      targetType: optional(row.target_type),
      targetId: optional(row.target_id),
      reason: optional(row.reason),
      metadata: row.metadata ?? undefined,
      createdAt: requiredInstant(row.created_at),
    }))
  }

  async incrementRateLimit(bucket: string, windowStart: string) {
    // El incremento es una función de la base: un `insert ... on conflict do
    // update` es una sola sentencia atómica, así que dos pedidos simultáneos
    // suman dos y nunca uno.
    const { data, error } = await (this.client as any).rpc(
      'competition_bump_rate_limit',
      { p_bucket: bucket, p_window_start: windowStart },
    )
    if (error) fail('incrementRateLimit', error)
    return Number(data ?? 0)
  }

  async purgeRateLimits(before: string) {
    const { error } = await this.table('rate_limit_counters')
      .delete()
      .lt('window_start', before)
    if (error) fail('purgeRateLimits', error)
  }
}
