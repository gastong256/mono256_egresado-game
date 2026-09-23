import 'server-only'

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
  ParticipantStatus,
  PinnedVersions,
} from './rows'

/**
 * El puerto de persistencia de la competencia.
 *
 * Las operaciones están escritas al nivel en el que la **base** puede
 * garantizarlas, no al nivel en el que sería cómodo llamarlas. `insertParticipant`
 * no es "insertar si no existe" resuelto con un `select` previo: es un insert
 * que devuelve qué restricción única ganó, porque entre el `select` y el
 * `insert` entra otro pedido. Lo mismo con el intento activo y con la
 * finalización, que son un índice único parcial y un `update` condicional.
 *
 * Esa forma es la que permite que la implementación sobre PostgREST no necesite
 * transacciones explícitas: cada operación que tiene que ser atómica es una
 * sola sentencia, y la concurrencia la resuelve una restricción de la base en
 * lugar de un lock en el proceso.
 */

export interface CompetitionInput extends PinnedVersions {
  readonly slug: string
  readonly name: string
  readonly status: CompetitionStatus
  readonly opensAt: string | undefined
  readonly closesAt: string | undefined
  readonly submissionGraceSeconds: number
  readonly runSeed: string
  readonly runPlanFingerprint: string
  readonly privacyNoticeVersion: string
  readonly retentionDays: number
}

export interface ParticipantInput {
  readonly competitionId: string
  readonly publicNickname: string
  readonly nicknameKey: string
  readonly fullNamePrivate: string
  readonly schoolYearPrivate: string
  readonly divisionPrivate: string | undefined
  readonly identityHmac: string
  readonly dniLast4Private: string
  readonly privacyNoticeVersion: string
}

/**
 * Resultado de intentar crear un participante.
 *
 * `identity-conflict` significa que ese documento ya está registrado en la
 * edición; `nickname-conflict`, que el alias está tomado. Distinguirlos importa
 * porque la respuesta al jugador es distinta y ninguna de las dos puede
 * revelar de quién es el registro que había.
 */
export type ParticipantInsert =
  | { readonly outcome: 'created'; readonly participant: ParticipantRow }
  | { readonly outcome: 'identity-conflict' }
  | { readonly outcome: 'nickname-conflict' }

export interface ParticipantPatch {
  readonly publicNickname?: string
  readonly nicknameKey?: string
  readonly nicknameHidden?: boolean
  readonly fullNamePrivate?: string | null
  readonly schoolYearPrivate?: string | null
  readonly divisionPrivate?: string | null
  readonly dniLast4Private?: string | null
  readonly status?: ParticipantStatus
  readonly statusReason?: string | null
  readonly identityVerifiedAt?: string | null
  readonly anonymizedAt?: string | null
}

export interface AttemptInput extends PinnedVersions {
  readonly competitionId: string
  readonly participantId: string
  readonly attemptNumber: number
  readonly runId: string
  readonly seed: string
  readonly runPlanFingerprint: string
  readonly startedAt: string
}

/**
 * Resultado de emitir un intento.
 *
 * `active-conflict` es el índice único parcial diciendo que el participante ya
 * tiene una partida en curso. No es un error de programación: es dos pestañas
 * abiertas, y el servicio lo resuelve devolviendo la partida que ya existe.
 */
export type AttemptInsert =
  | { readonly outcome: 'created'; readonly attempt: AttemptRow }
  | { readonly outcome: 'active-conflict' }
  | { readonly outcome: 'number-conflict' }

export interface AttemptFinalization {
  readonly status: AttemptStatus
  readonly submittedAt: string
  readonly verifiedAt: string | undefined
  readonly actionLog: unknown
  readonly submissionDigest: string
  readonly verifiedFairScore: number | undefined
  readonly verifiedPrestigeScore: number | undefined
  readonly verifiedSummary: unknown
  readonly rejectionCode: string | undefined
}

export interface CompetitionStore {
  findCompetitionBySlug(slug: string): Promise<CompetitionRow | undefined>
  findCompetitionById(id: string): Promise<CompetitionRow | undefined>
  listCompetitions(): Promise<readonly CompetitionRow[]>
  insertCompetition(input: CompetitionInput): Promise<CompetitionRow>
  updateCompetition(
    id: string,
    patch: {
      readonly status?: CompetitionStatus
      readonly opensAt?: string | null
      readonly closesAt?: string | null
      readonly resultsFrozenAt?: string | null
    },
  ): Promise<CompetitionRow | undefined>

  insertParticipant(input: ParticipantInput): Promise<ParticipantInsert>
  findParticipantByIdentity(
    competitionId: string,
    identityHmac: string,
  ): Promise<ParticipantRow | undefined>
  findParticipantById(id: string): Promise<ParticipantRow | undefined>
  findParticipantByNickname(
    competitionId: string,
    nicknameKey: string,
  ): Promise<ParticipantRow | undefined>
  listParticipants(competitionId: string): Promise<readonly ParticipantRow[]>
  updateParticipant(
    id: string,
    patch: ParticipantPatch,
  ): Promise<ParticipantRow | undefined>

  insertParticipantSession(input: {
    readonly participantId: string
    readonly tokenHash: string
    readonly expiresAt: string
  }): Promise<ParticipantSessionRow>
  findParticipantSession(
    tokenHash: string,
  ): Promise<ParticipantSessionRow | undefined>
  touchParticipantSession(id: string, at: string): Promise<void>
  revokeParticipantSession(tokenHash: string, at: string): Promise<void>
  revokeParticipantSessions(participantId: string, at: string): Promise<void>

  insertAttempt(input: AttemptInput): Promise<AttemptInsert>
  findActiveAttempt(participantId: string): Promise<AttemptRow | undefined>
  findAttemptById(id: string): Promise<AttemptRow | undefined>
  countAttempts(participantId: string): Promise<number>
  listAttempts(competitionId: string): Promise<readonly AttemptRow[]>
  listAttemptsForParticipant(
    participantId: string,
  ): Promise<readonly AttemptRow[]>
  /**
   * Cierra un intento si —y sólo si— todavía está en uno de los estados dados.
   *
   * Devolver `undefined` no es un fallo: es que otro pedido llegó primero. Es
   * la diferencia entre un doble envío idempotente y dos resultados distintos
   * para la misma partida.
   */
  finalizeAttempt(
    id: string,
    expected: readonly AttemptStatus[],
    finalization: AttemptFinalization,
  ): Promise<AttemptRow | undefined>
  abandonAttempt(id: string): Promise<AttemptRow | undefined>
  invalidateAttempt(
    id: string,
    at: string,
    reason: string,
  ): Promise<AttemptRow | undefined>
  restoreAttempt(id: string): Promise<AttemptRow | undefined>

  /** Offline maintenance, keyset-paged: at most 100 legacy verified logs. */
  listLegacySummaryAttempts(
    competitionId: string,
    afterId?: string,
  ): Promise<readonly AttemptRow[]>
  /** Bounded batch: never fetch action logs for a public ranking read. */
  readAttemptSummaries(
    ids: readonly string[],
  ): Promise<readonly { readonly id: string; readonly summary: unknown }[]>
  /** Idempotent repair of a legacy projection, preserving scores and evidence. */
  saveAttemptSummary(id: string, summary: unknown): Promise<boolean>

  bestVerifiedAttempts(
    competitionId: string,
  ): Promise<readonly BestAttemptRow[]>

  insertOrganizerSession(input: {
    readonly organizerUsername: string
    readonly tokenHash: string
    readonly expiresAt: string
  }): Promise<OrganizerSessionRow>
  findOrganizerSession(
    tokenHash: string,
  ): Promise<OrganizerSessionRow | undefined>
  revokeOrganizerSession(tokenHash: string, at: string): Promise<void>

  appendAudit(entry: AuditEntry): Promise<void>
  listAudit(competitionId: string, limit: number): Promise<readonly AuditRow[]>

  /**
   * Incrementa un contador de ventana fija y devuelve el valor resultante.
   *
   * Vive en la base y no en memoria del proceso porque en serverless cada
   * instancia contaría por su cuenta, y N instancias multiplicarían el límite
   * por N justo cuando la ráfaga lo hace importar.
   */
  incrementRateLimit(bucket: string, windowStart: string): Promise<number>
  purgeRateLimits(before: string): Promise<void>
}
