import 'server-only'

import { rankEntries } from '@/lib/competition'
import type {
  PublicCompetitionState,
  PublicCompetitionStatus,
  PublicCompetitionSummary,
  PublicLeaderboardEntry,
  PublicSelfSummary,
} from '@/lib/competition'
import type {
  AttemptRow,
  BestAttemptRow,
  CompetitionRow,
  ParticipantRow,
} from '@/server/persistence/competition/rows'

/**
 * La frontera entre el dato público y el dato privado de un menor.
 *
 * No es una convención ni una revisión de código: es un tipo. Una respuesta
 * pública se arma con `PublicLeaderboardEntry` o `PublicCompetitionState`, y
 * esos tipos **no tienen** un campo donde poner un nombre, un año o un digest
 * de identidad. Ocultar el dato en React no serviría —ya habría viajado por la
 * red, y estaría en el HTML—, así que el filtro está acá, del lado del
 * servidor, y la consulta pública ni siquiera selecciona las columnas
 * privadas: lee la vista `competition_best_attempts`, que no las tiene.
 *
 * `PublicSafe` cierra el círculo en tiempo de compilación. Un campo privado
 * agregado por descuido a un DTO público no compila; no hace falta que alguien
 * se acuerde de revisarlo.
 */

/**
 * Los nombres que nunca pueden aparecer en una respuesta pública.
 *
 * Están escritos como nombres de campo y no como una regla difusa porque la
 * comprobación tiene que ser mecánica: el compilador no sabe qué es "privado",
 * sabe comparar claves.
 */
type PrivateIdentityField =
  | 'fullName'
  | 'fullNamePrivate'
  | 'schoolYear'
  | 'schoolYearPrivate'
  | 'division'
  | 'divisionPrivate'
  | 'dni'
  | 'dniLast4'
  | 'dniLast4Private'
  | 'identityHmac'
  | 'identityKey'
  | 'sessionId'
  | 'tokenHash'
  | 'ip'

/**
 * Lo anterior, más lo que identifica a **otra** persona o su evidencia.
 *
 * El id del intento y la seed no son datos personales, pero en una respuesta
 * que habla de terceros son una superficie que nadie necesita. En la respuesta
 * que el jugador recibe de su propia partida sí son necesarios —sin el id no
 * podría enviarla—, y por eso la distinción existe en dos listas y no en una.
 */
type ForbiddenPublicField =
  | PrivateIdentityField
  | 'participantId'
  | 'attemptId'
  | 'actionLog'
  | 'seed'
  | 'runPlanFingerprint'
  | 'rejectionCode'

/** Falla la compilación si `T` declara alguno de los campos prohibidos. */
export type PublicSafe<T> =
  Extract<keyof T, ForbiddenPublicField> extends never ? T : never

/**
 * Para lo que el jugador recibe de sí mismo.
 *
 * Más permisivo que `PublicSafe` en capacidades y exactamente igual de
 * estricto en datos personales: el navegador nunca necesita el nombre, el año
 * ni los últimos cuatro dígitos, ni siquiera los propios, porque el jugador ya
 * los sabe y guardarlos en la página los pondría en el HTML.
 */
export type IdentitySafe<T> =
  Extract<keyof T, PrivateIdentityField> extends never ? T : never

/*
 * Las formas públicas se declaran en `@/lib/competition/contracts` porque la
 * UI también las necesita y no puede importar `@/server`. Acá se las somete a
 * la comprobación de frontera: declararlas en un lado y verificarlas en el
 * otro es lo que hace que agregar un campo privado a un contrato compartido
 * rompa la compilación del servidor.
 */
export type {
  PublicCompetitionState,
  PublicCompetitionStatus,
  PublicCompetitionSummary,
  PublicLeaderboardEntry,
  PublicSelfSummary,
}

/**
 * El alias que se publica.
 *
 * Un organizador puede ocultar un alias inapropiado sin borrar el resultado: el
 * puesto sigue existiendo y el score sigue contando, pero la pantalla dice
 * «Jugador oculto». Borrar la entrada le daría a un insulto el poder de sacar a
 * alguien del ranking.
 */
export const HIDDEN_NICKNAME = 'Jugador oculto'

export function displayNickname(row: {
  readonly publicNickname: string
  readonly nicknameHidden: boolean
}): string {
  return row.nicknameHidden ? HIDDEN_NICKNAME : row.publicNickname
}

/**
 * Arma el leaderboard público.
 *
 * `viewerParticipantId` no sale de acá: se usa para marcar una fila y se
 * descarta. El id de participante nunca llega al navegador.
 */
export function toPublicLeaderboard(
  best: readonly BestAttemptRow[],
  options: {
    readonly viewerParticipantId?: string
    readonly maxRank: number
  },
): {
  readonly entries: readonly PublicLeaderboardEntry[]
  readonly total: number
} {
  const ranked = rankEntries(
    best.map((row) => ({
      participantId: row.participantId,
      fairScore: row.verifiedFairScore,
      prestigeScore: row.verifiedPrestigeScore,
      nickname: displayNickname(row),
    })),
  )

  const entries = ranked
    .filter((entry) => entry.rank <= options.maxRank)
    .map((entry): PublicLeaderboardEntry => ({
      rank: entry.rank,
      nickname: entry.result.nickname,
      fairScore: entry.result.fairScore,
      prestigeScore: entry.result.prestigeScore,
      isYou:
        options.viewerParticipantId !== undefined &&
        entry.result.participantId === options.viewerParticipantId,
    }))

  return { entries, total: ranked.length }
}

/** El puesto de un participante, contando a todos y no sólo al Top. */
export function rankOf(
  best: readonly BestAttemptRow[],
  participantId: string,
): number | undefined {
  return rankEntries(
    best.map((row) => ({
      participantId: row.participantId,
      fairScore: row.verifiedFairScore,
      prestigeScore: row.verifiedPrestigeScore,
    })),
  ).find((entry) => entry.result.participantId === participantId)?.rank
}

/**
 * La vista privada de un participante, para el organizador autenticado.
 *
 * Existe como tipo aparte justamente para que no se pueda confundir con el
 * anterior: si alguien devolviera esto desde una ruta pública, la diferencia
 * sería visible en la firma y no escondida en un `select *`.
 */
export interface PrivateParticipant {
  readonly id: string
  readonly nickname: string
  readonly nicknameHidden: boolean
  readonly fullName: string | undefined
  readonly schoolYear: string | undefined
  readonly division: string | undefined
  /** Los últimos cuatro dígitos. El documento completo no se guarda. */
  readonly dniLast4: string | undefined
  readonly status: ParticipantRow['status']
  readonly statusReason: string | undefined
  readonly identityVerifiedAt: string | undefined
  readonly privacyNoticeVersion: string
  readonly anonymizedAt: string | undefined
  readonly createdAt: string
  readonly attempts: number
  readonly verifiedAttempts: number
  readonly bestFairScore: number | undefined
  readonly bestPrestigeScore: number | undefined
}

export function toPrivateParticipant(
  participant: ParticipantRow,
  attempts: readonly AttemptRow[],
): PrivateParticipant {
  const verified = attempts.filter(
    (attempt) =>
      attempt.status === 'VERIFIED' && attempt.invalidatedAt === undefined,
  )
  const best = [...verified].sort((left, right) => {
    const fair = (right.verifiedFairScore ?? 0) - (left.verifiedFairScore ?? 0)
    if (fair !== 0) return fair
    return (
      (right.verifiedPrestigeScore ?? 0) - (left.verifiedPrestigeScore ?? 0)
    )
  })[0]

  return {
    id: participant.id,
    nickname: participant.publicNickname,
    nicknameHidden: participant.nicknameHidden,
    fullName: participant.fullNamePrivate,
    schoolYear: participant.schoolYearPrivate,
    division: participant.divisionPrivate,
    dniLast4: participant.dniLast4Private,
    status: participant.status,
    statusReason: participant.statusReason,
    identityVerifiedAt: participant.identityVerifiedAt,
    privacyNoticeVersion: participant.privacyNoticeVersion,
    anonymizedAt: participant.anonymizedAt,
    createdAt: participant.createdAt,
    attempts: attempts.length,
    verifiedAttempts: verified.length,
    bestFairScore: best?.verifiedFairScore,
    bestPrestigeScore: best?.verifiedPrestigeScore,
  }
}

/**
 * Traduce el estado interno de la edición al que ve el público.
 *
 * `DRAFT` y `ARCHIVED` se presentan como `upcoming` y `closed`: son estados de
 * operación, y publicarlos le contaría al jugador algo sobre el trabajo interno
 * del organizador en vez de sobre si puede jugar.
 */
export function toPublicStatus(row: CompetitionRow): PublicCompetitionStatus {
  switch (row.status) {
    case 'OPEN':
      return 'open'
    case 'CLOSED':
    case 'ARCHIVED':
      return 'closed'
    case 'DRAFT':
    case 'UPCOMING':
      return 'upcoming'
  }
}

export function toPublicSummary(row: CompetitionRow): PublicCompetitionSummary {
  return {
    name: row.name,
    status: toPublicStatus(row),
    opensAt: row.opensAt,
    closesAt: row.closesAt,
  }
}

/*
 * Las comprobaciones de la frontera, en tiempo de compilación.
 *
 * Si alguien agrega `fullName` a una entrada del leaderboard, `PublicSafe`
 * resuelve a `never` y estas líneas dejan de compilar. Es el tipo de garantía
 * que no se puede olvidar de correr.
 */
type _LeaderboardIsPublic = PublicSafe<PublicLeaderboardEntry>
type _StateIsPublic = PublicSafe<PublicCompetitionState>
type _SummaryIsPublic = PublicSafe<PublicCompetitionSummary>
type _SelfIsPublic = IdentitySafe<PublicSelfSummary>

export type PublicBoundaryProof = readonly [
  _LeaderboardIsPublic,
  _StateIsPublic,
  _SummaryIsPublic,
  _SelfIsPublic,
]
