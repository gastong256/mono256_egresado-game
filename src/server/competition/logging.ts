import 'server-only'

/**
 * Registro operativo de la competencia.
 *
 * Lo que se registra es lo que hace falta para entender una feria en vivo: qué
 * operación fue, con qué código terminó, sobre qué identificador opaco y cuánto
 * tardó. Lo que **no** se registra está escrito abajo como una lista de campos
 * prohibidos y comprobado por un test, porque un log es el lugar donde el dato
 * personal se filtra sin que nadie lo decida: nadie escribe
 * `console.log(dni)`, pero sí `console.log(submission)`.
 *
 * Por eso esta función no acepta un objeto cualquiera. Acepta un conjunto
 * cerrado de campos, todos opacos o numéricos, y cualquier otra cosa no tiene
 * dónde entrar.
 */

export interface CompetitionLogFields {
  readonly event: string
  readonly outcome: 'ok' | 'rejected' | 'error'
  readonly code?: string
  /** Identificadores internos: uuid o seudónimo. Nunca un dato de la persona. */
  readonly competitionId?: string
  readonly participantId?: string
  readonly attemptId?: string
  readonly requestId?: string
  readonly durationMs?: number
  readonly detail?: string
}

/**
 * Nombres que nunca pueden aparecer en una línea de log.
 *
 * Es el mismo criterio que la frontera de DTOs, aplicado a la otra salida por
 * la que un dato se escapa del servidor.
 */
export const FORBIDDEN_LOG_FIELDS = [
  'dni',
  'documento',
  'fullName',
  'nombre',
  'nickname',
  'alias',
  'token',
  'password',
  'secret',
  'identityHmac',
  'ip',
] as const

export function competitionLog(fields: CompetitionLogFields): void {
  const line = {
    scope: 'competition',
    ...fields,
  }
  // Una línea JSON por evento: es lo que cualquier recolector entiende sin
  // configuración, y lo que permite `grep` en una feria sin infraestructura.
  const serialized = JSON.stringify(line)
  if (fields.outcome === 'error') {
    console.error(serialized)
    return
  }
  console.info(serialized)
}
