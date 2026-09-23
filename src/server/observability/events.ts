import 'server-only'

import { currentRelease, releaseFingerprint } from '@/release'

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

export interface ApplicationLogFields {
  readonly scope?: 'competition' | 'practice'
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

/**
 * La identidad del release, resuelta una vez por proceso.
 *
 * Va en cada línea porque es lo que convierte un log en evidencia: durante un
 * incidente, «esto pasó» sólo sirve junto con «bajo qué versión», y reconstruir
 * la segunda mitad correlacionando con un panel de deploy es exactamente el
 * trabajo que nadie quiere hacer a las once de la mañana de una feria.
 *
 * Se resuelve perezosamente y se cachea: el manifiesto es constante y volver a
 * hashearlo en cada línea sería pagar un SHA-256 por evento.
 */
let releaseTag:
  | { readonly releaseId: string; readonly releaseFingerprint: string }
  | undefined

function release(): {
  readonly releaseId: string
  readonly releaseFingerprint: string
} {
  if (releaseTag === undefined) {
    const manifest = currentRelease()
    releaseTag = {
      releaseId: `${manifest.releaseId}@${manifest.releaseVersion}`,
      releaseFingerprint: releaseFingerprint(manifest).slice(0, 12),
    }
  }
  return releaseTag
}

export function applicationLog(fields: ApplicationLogFields): void {
  const line = {
    scope: fields.scope ?? 'competition',
    ...release(),
    // Pick fields explicitly: TypeScript cannot strip extra properties from
    // an object received at runtime, including an accidentally spread DTO.
    event: fields.event,
    outcome: fields.outcome,
    code: fields.code,
    competitionId: fields.competitionId,
    participantId: fields.participantId,
    attemptId: fields.attemptId,
    requestId: fields.requestId,
    durationMs: fields.durationMs,
    detail: fields.detail,
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
