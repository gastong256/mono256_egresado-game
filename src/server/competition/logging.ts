import 'server-only'

// Compatibility export: the existing competition logging contract is unchanged.
export {
  applicationLog as competitionLog,
  FORBIDDEN_LOG_FIELDS,
  type ApplicationLogFields as CompetitionLogFields,
} from '@/server/observability/events'
