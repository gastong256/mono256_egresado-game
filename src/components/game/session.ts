/**
 * Sesión del jugador.
 *
 * Todo lo que el motor determinista no puede hacer por sí mismo vive acá: la
 * entropía que produce un seed nuevo, el nickname —que es dato del jugador y no
 * del dominio matemático— y el checkpoint en `localStorage`.
 *
 * El motor no conoce nada de esto. Recibe un `RunDescriptor` ya armado y pide
 * que se guarde un snapshot; quién lo escribe y dónde es decisión de esta capa.
 */

import {
  ENGINE_VERSION,
  parseActionLog,
  restoreSnapshot,
  toRunId,
  toRunSeed,
  type RunActionLog,
  type RunDescriptor,
  type RunSnapshot,
  type RunState,
} from '@/game'

/** Sube cuando cambia la forma de lo que se guarda, no cuando cambian las reglas. */
const CHECKPOINT_VERSION = 1
const CHECKPOINT_KEY = 'egresado.checkpoint.v1'

export const NICKNAME_MIN_LENGTH = 2
export const NICKNAME_MAX_LENGTH = 16

export interface PlayerSession {
  readonly nickname: string
  readonly descriptor: RunDescriptor
}

export interface StoredCheckpoint {
  readonly nickname: string
  readonly state: RunState
  /**
   * El log de acciones de la partida.
   *
   * El snapshot alcanza para seguir jugando, pero el log es lo que permitiría
   * revalidar la run por replay. Guardar los dos evita que reanudar deje una
   * partida imposible de verificar más adelante.
   */
  readonly actionLog: RunActionLog
}

export type NicknameProblem =
  'vacio' | 'muy-corto' | 'muy-largo' | 'caracteres-invalidos'

/**
 * Normaliza lo que el jugador escribió.
 *
 * Colapsa espacios interiores y recorta los extremos, de modo que `"  Sofi  "` y
 * `"Sofi"` sean el mismo nombre.
 */
export function normalizeNickname(raw: string): string {
  return raw.trim().replace(/\s+/gu, ' ')
}

/**
 * Valida un nickname.
 *
 * Se aceptan letras con acentos y ñ, números, espacios y guiones: un jugador
 * argentino tiene que poder escribir su nombre. Se rechazan caracteres de
 * control, que no se ven y no aportan nada.
 *
 * No hay moderación de contenido: no está en el alcance del slice y no se
 * inventa una política que el producto todavía no decidió.
 */
export function validateNickname(raw: string): NicknameProblem | undefined {
  const value = normalizeNickname(raw)

  if (value.length === 0) {
    return 'vacio'
  }
  if (value.length < NICKNAME_MIN_LENGTH) {
    return 'muy-corto'
  }
  if (value.length > NICKNAME_MAX_LENGTH) {
    return 'muy-largo'
  }
  if (!/^[\p{L}\p{N} '-]+$/u.test(value)) {
    return 'caracteres-invalidos'
  }

  return undefined
}

export function describeNicknameProblem(problem: NicknameProblem): string {
  switch (problem) {
    case 'vacio':
      return 'Escribí un nombre para empezar.'
    case 'muy-corto':
      return `Poné al menos ${String(NICKNAME_MIN_LENGTH)} caracteres.`
    case 'muy-largo':
      return `Máximo ${String(NICKNAME_MAX_LENGTH)} caracteres.`
    case 'caracteres-invalidos':
      return 'Usá sólo letras, números, espacios o guiones.'
  }
}

/** Alfabeto del seed: coincide con el charset que el motor acepta. */
const SEED_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

/**
 * Genera un seed nuevo.
 *
 * La entropía vive fuera del núcleo determinista: el motor recibe el seed ya
 * elegido y a partir de ahí todo es reproducible.
 */
export function createSeedValue(
  randomBytes: (length: number) => Uint8Array = defaultRandomBytes,
): string {
  const bytes = randomBytes(10)
  let seed = ''

  for (const byte of bytes) {
    seed += SEED_ALPHABET[byte % SEED_ALPHABET.length] ?? 'a'
  }

  return seed
}

function defaultRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

/** Arma el descriptor de una run nueva para un content set dado. */
export function createRunDescriptor(
  seed: string,
  rulesetVersion: string,
  contentVersion: string,
): RunDescriptor {
  return {
    runId: toRunId(`run-${seed}`),
    seed: toRunSeed(seed),
    // El slice es local: no hay ranking, así que la run no es competitiva.
    mode: 'practice',
    difficulty: 'adaptive',
    gameVersion: ENGINE_VERSION,
    rulesetVersion,
    contentVersion,
  }
}

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    // Modo privado o almacenamiento bloqueado: el juego sigue andando, sólo
    // que sin poder reanudar.
    return undefined
  }
}

/**
 * Cambios del checkpoint.
 *
 * Guardar, descartar, y lo que escriba otra pestaña cuentan como cambios. Sin
 * esto una pantalla que ya leyó el checkpoint seguiría mostrando lo que había
 * cuando se montó: el jugador que vuelve a `/jugar` sin recargar no vería la
 * partida que dejó por la mitad.
 *
 * Suscribirse es lo que le permite a una pantalla montada enterarse; la
 * frescura de la lectura la garantiza `readCheckpoint`, que compara contra lo
 * que hay escrito en cada llamada.
 */
const checkpointListeners = new Set<() => void>()

function announceCheckpointChange(): void {
  for (const listener of checkpointListeners) {
    listener()
  }
}

function onStorageEvent(event: StorageEvent): void {
  // `null` es "se limpió todo el storage".
  if (event.key === null || event.key === CHECKPOINT_KEY) {
    announceCheckpointChange()
  }
}

export function subscribeToCheckpoint(listener: () => void): () => void {
  checkpointListeners.add(listener)
  if (checkpointListeners.size === 1) {
    globalThis.addEventListener?.('storage', onStorageEvent)
  }

  return () => {
    checkpointListeners.delete(listener)
    if (checkpointListeners.size === 0) {
      globalThis.removeEventListener?.('storage', onStorageEvent)
    }
  }
}

/** Guarda el checkpoint. Un fallo de escritura nunca interrumpe la partida. */
export function saveCheckpoint(
  nickname: string,
  snapshot: RunSnapshot,
  actionLog: unknown,
): void {
  const store = storage()
  if (store === undefined) {
    return
  }

  try {
    store.setItem(
      CHECKPOINT_KEY,
      JSON.stringify({
        version: CHECKPOINT_VERSION,
        nickname,
        snapshot,
        actionLog,
      }),
    )
  } catch {
    // Cuota llena: preferimos perder la posibilidad de reanudar antes que
    // romper la run en curso.
  }

  announceCheckpointChange()
}

/**
 * Borra el checkpoint sin avisar a nadie.
 *
 * Lo usa la lectura cuando encuentra algo que no puede restaurar. Ahí no hay
 * cambio que notificar —la respuesta ya es "no hay partida"— y avisar mientras
 * React está renderizando sería pedirle que se re-renderice a sí mismo.
 */
function removeStoredCheckpoint(): void {
  const store = storage()
  try {
    store?.removeItem(CHECKPOINT_KEY)
  } catch {
    // Nada que hacer; el checkpoint queda huérfano pero no molesta.
  }
}

/** Descarta la partida guardada. Es una acción del jugador o del final del año. */
export function clearCheckpoint(): void {
  removeStoredCheckpoint()
  announceCheckpointChange()
}

/**
 * Lee el checkpoint guardado.
 *
 * Devuelve `undefined` ante cualquier duda: no hay checkpoint, está corrupto,
 * lo escribió otra versión del formato o el estado no supera la validación del
 * motor. Un estado inválido nunca se restaura; se descarta.
 */
export function loadCheckpoint(
  expected: Pick<
    RunDescriptor,
    'gameVersion' | 'rulesetVersion' | 'contentVersion'
  >,
): StoredCheckpoint | undefined {
  const store = storage()
  if (store === undefined) {
    return undefined
  }

  let raw: string | null = null
  try {
    raw = store.getItem(CHECKPOINT_KEY)
  } catch {
    return undefined
  }
  if (raw === null) {
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    removeStoredCheckpoint()
    return undefined
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { version?: unknown }).version !== CHECKPOINT_VERSION
  ) {
    removeStoredCheckpoint()
    return undefined
  }

  const candidate = parsed as {
    nickname?: unknown
    snapshot?: unknown
    actionLog?: unknown
  }
  if (typeof candidate.nickname !== 'string') {
    removeStoredCheckpoint()
    return undefined
  }

  const actionLog = parseActionLog(candidate.actionLog)
  if (!actionLog.ok) {
    removeStoredCheckpoint()
    return undefined
  }

  const restored = restoreSnapshot(candidate.snapshot, {
    gameVersion: expected.gameVersion,
    rulesetVersion: expected.rulesetVersion,
    contentVersion: expected.contentVersion,
  })

  if (!restored.ok) {
    // Versión incompatible o snapshot corrupto: se descarta y el jugador
    // empieza limpio en lugar de arrastrar un estado que el motor no acepta.
    removeStoredCheckpoint()
    return undefined
  }

  return {
    nickname: candidate.nickname,
    state: restored.value,
    actionLog: actionLog.value,
  }
}

/**
 * Lectura estable del checkpoint.
 *
 * Devuelve exactamente la misma referencia mientras lo guardado no cambie, que
 * es lo que necesita un `useSyncExternalStore` para no re-renderizar sin parar.
 * La clave del recuerdo incluye el texto crudo del storage, así que cualquier
 * escritura —propia, de otra pestaña o de un test— invalida la memoria sola.
 */
let readCache:
  | {
      readonly key: string
      readonly raw: string | null
      readonly value: StoredCheckpoint | undefined
    }
  | undefined

export function readCheckpoint(
  expected: Pick<
    RunDescriptor,
    'gameVersion' | 'rulesetVersion' | 'contentVersion'
  >,
): StoredCheckpoint | undefined {
  const store = storage()

  let raw: string | null = null
  try {
    raw = store?.getItem(CHECKPOINT_KEY) ?? null
  } catch {
    raw = null
  }

  const key = `${expected.gameVersion}\u0000${expected.rulesetVersion}\u0000${expected.contentVersion}`
  if (
    readCache !== undefined &&
    readCache.key === key &&
    readCache.raw === raw
  ) {
    return readCache.value
  }

  const value = raw === null ? undefined : loadCheckpoint(expected)
  readCache = { key, raw, value }
  return value
}
