/**
 * Códigos de rechazo de la competencia.
 *
 * Son estables y tipados: una respuesta HTTP los devuelve tal cual, la UI los
 * traduce a una frase para el jugador y el organizador puede ver el código.
 * Nunca se le muestra a un jugador el texto interno de un error, y nunca se
 * devuelve un mensaje que revele si un DNI pertenece a otra persona.
 */

export const COMPETITION_ERROR_CODES = [
  'COMPETITION_NOT_CONFIGURED',
  'COMPETITION_NOT_OPEN',
  'COMPETITION_CLOSED',
  'PARTICIPANT_SESSION_REQUIRED',
  'PARTICIPANT_DISQUALIFIED',
  'IDENTITY_MISMATCH',
  'NICKNAME_TAKEN',
  'NICKNAME_INVALID',
  'INVALID_REQUEST',
  'PRIVACY_NOTICE_REQUIRED',
  'ACTIVE_ATTEMPT_EXISTS',
  'ATTEMPT_NOT_FOUND',
  'ATTEMPT_NOT_OWNED',
  'ATTEMPT_ALREADY_FINALIZED',
  'ATTEMPT_VERSION_UNSUPPORTED',
  'RUN_VALIDATION_FAILED',
  'SUBMISSION_CONFLICT',
  'SUBMISSION_TOO_LATE',
  'RATE_LIMITED',
  'ORGANIZER_AUTH_REQUIRED',
  'ORGANIZER_CREDENTIALS_INVALID',
  'STORAGE_UNAVAILABLE',
] as const

export type CompetitionErrorCode = (typeof COMPETITION_ERROR_CODES)[number]

export interface CompetitionError {
  readonly code: CompetitionErrorCode
  /**
   * Detalle para el organizador y los logs. Nunca contiene datos personales.
   *
   * La UI del jugador no lo muestra: un mensaje que distinga "ese DNI ya está
   * registrado con otro nombre" de "no existe" convierte el formulario en un
   * oráculo sobre quién se anotó.
   */
  readonly detail?: string
}

/** Qué status HTTP le corresponde a cada código. */
export function httpStatusFor(code: CompetitionErrorCode): number {
  switch (code) {
    case 'INVALID_REQUEST':
    case 'NICKNAME_INVALID':
    case 'PRIVACY_NOTICE_REQUIRED':
    case 'ATTEMPT_VERSION_UNSUPPORTED':
    case 'RUN_VALIDATION_FAILED':
      return 400
    case 'PARTICIPANT_SESSION_REQUIRED':
    case 'ORGANIZER_AUTH_REQUIRED':
    case 'ORGANIZER_CREDENTIALS_INVALID':
      return 401
    case 'PARTICIPANT_DISQUALIFIED':
    case 'ATTEMPT_NOT_OWNED':
    case 'COMPETITION_NOT_OPEN':
    case 'COMPETITION_CLOSED':
    case 'SUBMISSION_TOO_LATE':
      return 403
    case 'ATTEMPT_NOT_FOUND':
      return 404
    case 'IDENTITY_MISMATCH':
    case 'NICKNAME_TAKEN':
    case 'ACTIVE_ATTEMPT_EXISTS':
    case 'ATTEMPT_ALREADY_FINALIZED':
    case 'SUBMISSION_CONFLICT':
      return 409
    case 'RATE_LIMITED':
      return 429
    case 'COMPETITION_NOT_CONFIGURED':
    case 'STORAGE_UNAVAILABLE':
      return 503
  }
}

/**
 * El texto que ve el jugador.
 *
 * Hay uno por código porque la alternativa —mostrar el código— convierte un
 * problema operativo en una pantalla que el estudiante no puede accionar.
 */
export function playerMessageFor(code: CompetitionErrorCode): string {
  switch (code) {
    case 'COMPETITION_NOT_CONFIGURED':
    case 'STORAGE_UNAVAILABLE':
      return 'La competencia no está disponible en este momento. Avisale a un organizador.'
    case 'COMPETITION_NOT_OPEN':
      return 'La competencia todavía no abrió.'
    case 'COMPETITION_CLOSED':
    case 'SUBMISSION_TOO_LATE':
      return 'La competencia ya cerró.'
    case 'PARTICIPANT_SESSION_REQUIRED':
      return 'Identificate de nuevo para seguir jugando.'
    case 'PARTICIPANT_DISQUALIFIED':
      return 'Tu participación está suspendida. Pedí ayuda a un organizador.'
    case 'IDENTITY_MISMATCH':
      return 'No pudimos confirmar tus datos. Pedí ayuda a un organizador.'
    case 'NICKNAME_TAKEN':
      return 'Ese alias ya está en uso. Probá con otro.'
    case 'NICKNAME_INVALID':
      return 'Ese alias no se puede usar. Probá con otro.'
    case 'INVALID_REQUEST':
      return 'Revisá los datos y volvé a intentar.'
    case 'PRIVACY_NOTICE_REQUIRED':
      return 'Leé el aviso de privacidad antes de empezar.'
    case 'ACTIVE_ATTEMPT_EXISTS':
      return 'Ya tenés una partida en curso.'
    case 'ATTEMPT_NOT_FOUND':
    case 'ATTEMPT_NOT_OWNED':
      return 'No encontramos esa partida.'
    case 'ATTEMPT_ALREADY_FINALIZED':
      return 'Esa partida ya está cerrada.'
    case 'ATTEMPT_VERSION_UNSUPPORTED':
      return 'Tu partida quedó con una versión que el servidor ya no acepta. Empezá una nueva.'
    case 'RUN_VALIDATION_FAILED':
      return 'No pudimos verificar esta partida.'
    case 'SUBMISSION_CONFLICT':
      return 'Hubo un conflicto al guardar el resultado. Probá de nuevo.'
    case 'RATE_LIMITED':
      return 'Esperá unos segundos antes de volver a intentar.'
    case 'ORGANIZER_AUTH_REQUIRED':
    case 'ORGANIZER_CREDENTIALS_INVALID':
      return 'No tenés acceso a esta sección.'
  }
}

export function competitionError(
  code: CompetitionErrorCode,
  detail?: string,
): CompetitionError {
  return detail === undefined ? { code } : { code, detail }
}
