/**
 * El checkpoint local de un intento de competencia.
 *
 * La arquitectura sigue siendo local-first (ADR-006): una vez emitida la
 * partida, el navegador juega sin hablar con el servidor, porque el Wi-Fi de
 * una escuela llena no aguanta un pedido por decisión. Lo que el servidor
 * conserva es la **identidad** de la partida —seed, plan, versiones—; lo que el
 * navegador conserva es el avance.
 *
 * El checkpoint está atado al id del intento **y** a la huella del plan. Un
 * checkpoint que no coincide no se adapta ni se migra: se descarta. Inventar
 * avance sería peor que perderlo, porque el servidor va a volver a jugar el log
 * y un log que no corresponde a la emisión se rechaza igual.
 */

import {
  canonicalize,
  parseActionLog,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
  type RunActionLog,
  type RunDescriptor,
  type RunState,
} from '@/game'

const PREFIX = 'egresado.competition.v1.'

export interface StoredAttempt {
  readonly state: RunState
  readonly log: RunActionLog
}

function keyFor(attemptId: string): string {
  return `${PREFIX}${attemptId}`
}

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function saveAttemptCheckpoint(
  attemptId: string,
  state: RunState,
  log: RunActionLog,
): boolean {
  const store = storage()
  if (store === undefined) return false
  try {
    store.setItem(
      keyFor(attemptId),
      JSON.stringify({
        snapshot: serializeSnapshot(state),
        log: serializeActionLog(log),
      }),
    )
    return true
  } catch {
    return false
  }
}

export function clearAttemptCheckpoint(attemptId: string): void {
  try {
    storage()?.removeItem(keyFor(attemptId))
  } catch {
    // Nada que hacer: el checkpoint queda huérfano y no molesta.
  }
}

/**
 * Lee el checkpoint de un intento.
 *
 * Devuelve `undefined` ante cualquier duda: no hay nada guardado, está
 * corrupto, el descriptor no es exactamente el que el servidor emitió, o el
 * snapshot no supera la validación del motor. La comparación del descriptor es
 * por canonicalización completa, no campo por campo: alcanza con que una
 * versión o la huella del plan difieran para que ese avance ya no corresponda a
 * esta partida.
 */
export function readAttemptCheckpoint(
  attemptId: string,
  descriptor: RunDescriptor,
): StoredAttempt | undefined {
  const store = storage()
  if (store === undefined) return undefined

  let raw: string | null
  try {
    raw = store.getItem(keyFor(attemptId))
  } catch {
    return undefined
  }
  if (raw === null) return undefined

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('snapshot' in parsed) ||
      !('log' in parsed)
    ) {
      return undefined
    }

    const log = parseActionLog(parsed.log)
    if (!log.ok) return undefined
    if (canonicalize(log.value.descriptor) !== canonicalize(descriptor)) {
      return undefined
    }

    const snapshot = restoreSnapshot(parsed.snapshot, descriptor)
    if (!snapshot.ok) return undefined

    return { state: snapshot.value, log: log.value }
  } catch {
    return undefined
  }
}
