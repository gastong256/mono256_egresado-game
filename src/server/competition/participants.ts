import 'server-only'

import {
  dniLast4,
  fullNameComparisonKey,
  nicknameKey,
  normalizeDni,
  normalizeFullName,
  normalizeNickname,
  validateDni,
  validateFullName,
  validateNickname,
} from '@/lib/competition'
import type {
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import type { Clock } from './clock'
import { competitionError, type CompetitionError } from './errors'
import { deriveIdentityKey } from './identity'
import {
  createOpaqueToken,
  hashToken,
  PARTICIPANT_SESSION_DAYS,
} from './tokens'

/**
 * Identificación de participantes.
 *
 * Una sola operación cubre los dos casos que un estudiante vive como uno: la
 * primera vez que se anota y la vez que vuelve desde otro teléfono. El servidor
 * los distingue por la clave derivada del documento; el jugador completa el
 * mismo formulario en los dos casos y no tiene que acordarse de nada.
 *
 * La regla que gobierna todo lo de acá: **el documento identifica, no
 * autentica**. Saber un DNI no es saber una contraseña, así que una sesión
 * establecida así da continuidad —"seguís siendo vos entre partidas"— y nunca
 * es prueba de identidad para entregar un premio. Eso lo verifica un
 * organizador en persona.
 *
 * De ahí sale la respuesta ante un conflicto: si el documento ya está
 * registrado con otro nombre, el servidor **no dice de quién es** ni crea un
 * duplicado. Devuelve un pedido neutral de ayuda a un organizador, porque las
 * dos explicaciones posibles —un error de tipeo y alguien poniendo el documento
 * de otro— se ven iguales desde acá, y sólo una persona puede distinguirlas.
 */

export interface IdentitySubmission {
  readonly nickname: string
  readonly fullName: string
  readonly dni: string
  readonly schoolYear: string
  readonly division?: string
  readonly privacyNoticeVersion: string
}

export interface IdentityResult {
  readonly participant: ParticipantRow
  readonly created: boolean
  /** Token opaco de sesión. Se entrega una sola vez, para la cookie. */
  readonly sessionToken: string
  readonly expiresAt: string
}

export interface ParticipantSessionContext {
  readonly participant: ParticipantRow
  readonly sessionId: string
}

export interface ParticipantServiceDependencies {
  readonly store: CompetitionStore
  readonly clock: Clock
  readonly identitySecret: string
  readonly schoolYears: readonly string[]
  readonly schoolDivisions: readonly string[]
}

type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CompetitionError }

/**
 * Valida la forma de lo que llegó, antes de tocar la base.
 *
 * Se revalida del lado del servidor aunque el formulario ya haya validado: lo
 * que el navegador comprobó no es una garantía sobre lo que llegó por la red.
 */
export function validateIdentitySubmission(
  submission: IdentitySubmission,
  dependencies: Pick<
    ParticipantServiceDependencies,
    'schoolYears' | 'schoolDivisions'
  >,
): CompetitionError | undefined {
  const nickname = validateNickname(submission.nickname)
  if (nickname !== undefined) {
    return competitionError('NICKNAME_INVALID', `nickname:${nickname}`)
  }
  const fullName = validateFullName(submission.fullName)
  if (fullName !== undefined) {
    return competitionError('INVALID_REQUEST', `fullName:${fullName}`)
  }
  const dni = validateDni(submission.dni)
  if (dni !== undefined) {
    return competitionError('INVALID_REQUEST', `dni:${dni}`)
  }
  if (!dependencies.schoolYears.includes(submission.schoolYear)) {
    return competitionError('INVALID_REQUEST', 'schoolYear:no-listado')
  }
  if (dependencies.schoolDivisions.length > 0) {
    if (
      submission.division === undefined ||
      !dependencies.schoolDivisions.includes(submission.division)
    ) {
      return competitionError('INVALID_REQUEST', 'division:no-listada')
    }
  } else if (submission.division !== undefined) {
    return competitionError('INVALID_REQUEST', 'division:no-pedida')
  }
  return undefined
}

async function issueSession(
  dependencies: ParticipantServiceDependencies,
  participantId: string,
): Promise<{ readonly token: string; readonly expiresAt: string }> {
  const token = createOpaqueToken()
  const expiresAt = new Date(
    dependencies.clock.now().getTime() +
      PARTICIPANT_SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()
  await dependencies.store.insertParticipantSession({
    participantId,
    tokenHash: hashToken(token),
    expiresAt,
  })
  return { token, expiresAt }
}

/**
 * Registra o reconoce a un participante, en una sola operación.
 *
 * El orden importa. El `insert` se intenta **primero**, sin un `select` previo,
 * porque entre mirar y escribir entra otro pedido: dos pestañas enviando el
 * mismo formulario a la vez crearían dos participantes con el mismo documento
 * si la decisión dependiera de una lectura. La restricción única de la base es
 * la que decide, y su rechazo es la señal de que este documento ya existe.
 */
export async function identifyParticipant(
  dependencies: ParticipantServiceDependencies,
  competition: CompetitionRow,
  submission: IdentitySubmission,
): Promise<Outcome<IdentityResult>> {
  const shape = validateIdentitySubmission(submission, dependencies)
  if (shape !== undefined) return { ok: false, error: shape }

  if (submission.privacyNoticeVersion !== competition.privacyNoticeVersion) {
    return {
      ok: false,
      error: competitionError(
        'PRIVACY_NOTICE_REQUIRED',
        `esperaba ${competition.privacyNoticeVersion}`,
      ),
    }
  }

  const normalizedDni = normalizeDni(submission.dni.trim())
  const identityHmac = deriveIdentityKey(
    dependencies.identitySecret,
    competition.id,
    normalizedDni,
  )
  const displayName = normalizeFullName(submission.fullName)
  const displayNickname = normalizeNickname(submission.nickname)

  const insert = await dependencies.store.insertParticipant({
    competitionId: competition.id,
    publicNickname: displayNickname,
    nicknameKey: nicknameKey(displayNickname),
    fullNamePrivate: displayName,
    schoolYearPrivate: submission.schoolYear,
    divisionPrivate: submission.division,
    identityHmac,
    dniLast4Private: dniLast4(normalizedDni),
    privacyNoticeVersion: submission.privacyNoticeVersion,
  })

  if (insert.outcome === 'created') {
    const session = await issueSession(dependencies, insert.participant.id)
    return {
      ok: true,
      value: {
        participant: insert.participant,
        created: true,
        sessionToken: session.token,
        expiresAt: session.expiresAt,
      },
    }
  }

  if (insert.outcome === 'nickname-conflict') {
    return { ok: false, error: competitionError('NICKNAME_TAKEN') }
  }

  // El documento ya está registrado en esta edición. Es el camino de "volví
  // desde otro teléfono" y también el de "puse el documento de otro": desde acá
  // los dos se ven igual, y lo que los separa es si el nombre coincide.
  const existing = await dependencies.store.findParticipantByIdentity(
    competition.id,
    identityHmac,
  )
  if (existing === undefined) {
    // La fila existía al insertar y ya no está: alguien la borró entre medio.
    return { ok: false, error: competitionError('IDENTITY_MISMATCH') }
  }

  if (existing.status === 'DISQUALIFIED') {
    return { ok: false, error: competitionError('PARTICIPANT_DISQUALIFIED') }
  }

  const storedName = existing.fullNamePrivate
  if (
    storedName === undefined ||
    fullNameComparisonKey(storedName) !== fullNameComparisonKey(displayName)
  ) {
    // Deliberadamente no se dice qué nombre había. El mensaje es el mismo para
    // un acento distinto y para un documento ajeno, porque distinguirlos acá
    // convertiría el formulario en un oráculo sobre quién se anotó.
    return { ok: false, error: competitionError('IDENTITY_MISMATCH') }
  }

  const session = await issueSession(dependencies, existing.id)
  return {
    ok: true,
    value: {
      // El alias se conserva: es la identidad pública de la persona dentro de
      // la edición, y dejar que cambie sola en cada reingreso rompería el
      // ranking que otros ya vieron.
      participant: existing,
      created: false,
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    },
  }
}

/**
 * Resuelve la sesión de un token de cookie.
 *
 * Una sesión revocada o vencida no es un error del jugador: es "identificate de
 * nuevo". Por eso devuelve `undefined` y no explota.
 */
export async function resolveParticipantSession(
  dependencies: Pick<ParticipantServiceDependencies, 'store' | 'clock'>,
  token: string | undefined,
): Promise<ParticipantSessionContext | undefined> {
  if (token === undefined || token.length === 0) return undefined

  const session = await dependencies.store.findParticipantSession(
    hashToken(token),
  )
  if (session === undefined || session.revokedAt !== undefined) return undefined

  const now = dependencies.clock.now()
  if (new Date(session.expiresAt).getTime() <= now.getTime()) return undefined

  const participant = await dependencies.store.findParticipantById(
    session.participantId,
  )
  if (participant === undefined) return undefined

  await dependencies.store.touchParticipantSession(
    session.id,
    now.toISOString(),
  )
  return { participant, sessionId: session.id }
}

/** «No soy yo»: revoca la sesión de este navegador y sólo la de éste. */
export async function forgetParticipantSession(
  dependencies: Pick<ParticipantServiceDependencies, 'store' | 'clock'>,
  token: string | undefined,
): Promise<void> {
  if (token === undefined || token.length === 0) return
  await dependencies.store.revokeParticipantSession(
    hashToken(token),
    dependencies.clock.now().toISOString(),
  )
}
