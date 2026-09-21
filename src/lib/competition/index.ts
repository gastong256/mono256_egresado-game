/**
 * Reglas de competencia compartidas entre el navegador y el servidor.
 *
 * Todo lo de acá es puro: sin `crypto`, sin red, sin entorno. Lo que necesita
 * un secreto vive en `@/server/competition`.
 */

export {
  describeDniProblem,
  describeFullNameProblem,
  dniLast4,
  DNI_MAX_DIGITS,
  DNI_MIN_DIGITS,
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  fullNameComparisonKey,
  normalizeDni,
  normalizeFullName,
  validateDni,
  validateFullName,
  type DniProblem,
  type FullNameProblem,
} from './identity-rules'
export {
  describeNicknameProblem,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  nicknameKey,
  normalizeNickname,
  validateNickname,
  type NicknameProblem,
} from './nickname'
export {
  compareResults,
  rankEntries,
  type RankableResult,
  type RankedEntry,
} from './ranking'
export type {
  CompetitionErrorBody,
  IdentityFormConfig,
  IssuedAttemptPayload,
  PrivacyNotice,
  PrivacyNoticeSection,
  PublicCompetitionState,
  PublicCompetitionStatus,
  PublicCompetitionSummary,
  PublicLeaderboardEntry,
  PublicSelfSummary,
  SubmissionResponse,
  VerifiedAttemptPayload,
} from './contracts'
