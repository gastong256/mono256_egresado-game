import {
  canonicalize,
  parseActionLog,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
  type RunActionLog,
  type RunState,
} from '@/game'

export const PRACTICE_STORAGE_KEY = 'egresado.practice.v1.active'

export interface PracticeCheckpoint {
  readonly state: RunState
  readonly log: RunActionLog
}
export type PracticeStorageRead =
  | { readonly kind: 'empty' | 'unavailable' | 'invalid' }
  | { readonly kind: 'saved'; readonly checkpoint: PracticeCheckpoint }

export function readPracticeCheckpoint(): PracticeStorageRead {
  let raw: string | null
  try {
    raw = localStorage.getItem(PRACTICE_STORAGE_KEY)
  } catch {
    return { kind: 'unavailable' }
  }
  if (raw === null) return { kind: 'empty' }
  if (raw.length > 1024 * 1024) return { kind: 'invalid' }
  try {
    const saved: unknown = JSON.parse(raw)
    if (
      typeof saved !== 'object' ||
      saved === null ||
      !('version' in saved) ||
      saved.version !== 1 ||
      !('log' in saved) ||
      !('snapshot' in saved)
    )
      return { kind: 'invalid' }
    const log = parseActionLog(saved.log)
    if (!log.ok || log.value.descriptor.mode !== 'practice')
      return { kind: 'invalid' }
    const snapshot = restoreSnapshot(saved.snapshot, log.value.descriptor)
    if (
      !snapshot.ok ||
      canonicalize(snapshot.value.descriptor) !==
        canonicalize(log.value.descriptor)
    )
      return { kind: 'invalid' }
    return {
      kind: 'saved',
      checkpoint: { state: snapshot.value, log: log.value },
    }
  } catch {
    return { kind: 'invalid' }
  }
}

export function savePracticeCheckpoint(
  state: RunState,
  log: RunActionLog,
): boolean {
  if (
    state.descriptor.mode !== 'practice' ||
    log.descriptor.mode !== 'practice'
  )
    return false
  try {
    localStorage.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        snapshot: serializeSnapshot(state),
        log: serializeActionLog(log),
      }),
    )
    return true
  } catch {
    return false
  }
}
