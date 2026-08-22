/**
 * Game controller.
 *
 * The bridge between the browser and the deterministic engine:
 *
 *     React  →  GameController  →  transition()
 *
 * The controller owns the in-memory session and nothing else. It never decides
 * a rule: every state change comes back from `transition`, and every rejection
 * is surfaced rather than swallowed. Effects requested by the engine are handed
 * to injected sinks, so persistence and analytics stay outside both the engine
 * and the UI.
 *
 * It is deliberately framework-free — a plain observable store — so it can be
 * unit-tested without React and bound to any renderer. React subscribes through
 * `useSyncExternalStore` in `./use-game-run`.
 *
 * No state library is used. The session is a single immutable tree updated by a
 * reducer, and selector-based subscription is exactly what `useSyncExternalStore`
 * provides; adding Zustand would duplicate that without adding capability. The
 * architecture overview keeps Zustand out until an implemented need justifies it.
 */

import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  isErr,
  serializeSnapshot,
  transition,
  type DomainEvent,
  type EffectRequest,
  type EngineDependencies,
  type EngineRejection,
  type GameCommand,
  type PublicChallengeView,
  type RunActionLog,
  type RunDescriptor,
  type RunSnapshot,
  type RunState,
} from '@/game'

export interface ControllerState {
  readonly run: RunState
  /** Public view of the active challenge, or undefined on a narrative beat. */
  readonly view: PublicChallengeView | undefined
  readonly log: RunActionLog
  /** Domain events emitted by the most recent command, for debug tooling. */
  readonly lastEvents: readonly DomainEvent[]
  /** Set when the engine refused the most recent command. */
  readonly lastRejection: EngineRejection | undefined
}

export interface ControllerSinks {
  /**
   * Called when the engine asks for a checkpoint.
   *
   * Left unset by default: writing to storage is feature work governed by
   * FR-009, and the engine must never assume it happened.
   */
  readonly onSnapshot?: (
    snapshot: RunSnapshot,
    reason: 'event-resolved' | 'run-completed',
  ) => void
  /** Called for every domain event, as a future analytics seam. */
  readonly onEvent?: (event: DomainEvent) => void
}

export interface GameController {
  getState(): ControllerState
  subscribe(listener: () => void): () => void
  /** Applies a command. Returns the rejection when the engine refused it. */
  dispatch(command: GameCommand): EngineRejection | undefined
  /** Starts a new run, discarding the current session. */
  restart(descriptor: RunDescriptor): EngineRejection | undefined
}

/**
 * A session recovered from a checkpoint.
 *
 * The state has already been validated by the snapshot codec, so the controller
 * adopts it as-is rather than replaying to reach it.
 */
export interface ResumedSession {
  readonly state: RunState
  readonly log: RunActionLog
}

function buildView(
  run: RunState,
  dependencies: EngineDependencies,
): PublicChallengeView | undefined {
  const view = activeChallengeView(run, dependencies)
  // A failure here means content the run references is missing. The controller
  // surfaces it as "no challenge to draw" rather than crashing the tree; the
  // engine has already recorded the rejection path for diagnostics.
  return isErr(view) ? undefined : view.value
}

export function createGameController(
  descriptor: RunDescriptor,
  dependencies: EngineDependencies,
  sinks: ControllerSinks = {},
  resumed?: ResumedSession,
): GameController {
  const listeners = new Set<() => void>()
  let state: ControllerState

  const notify = (): void => {
    for (const listener of listeners) {
      listener()
    }
  }

  const drain = (effects: readonly EffectRequest[], run: RunState): void => {
    for (const effect of effects) {
      if (effect.type === 'track') {
        sinks.onEvent?.(effect.event)
        continue
      }
      sinks.onSnapshot?.(serializeSnapshot(run), effect.reason)
    }
  }

  const start = (next: RunDescriptor): EngineRejection | undefined => {
    const created = createRun(next, dependencies)

    if (isErr(created)) {
      return created.error
    }

    state = {
      run: created.value.state,
      view: buildView(created.value.state, dependencies),
      log: emptyActionLog(next),
      lastEvents: created.value.events,
      lastRejection: undefined,
    }
    drain(created.value.effects, created.value.state)
    return undefined
  }

  if (resumed === undefined) {
    const initialRejection = start(descriptor)
    if (initialRejection !== undefined) {
      throw new Error(`Could not create the run: ${initialRejection.kind}`)
    }
  } else {
    state = {
      run: resumed.state,
      view: buildView(resumed.state, dependencies),
      log: resumed.log,
      lastEvents: [],
      lastRejection: undefined,
    }
  }

  const initialRejection = undefined as EngineRejection | undefined
  if (initialRejection !== undefined) {
    // A run that cannot be created is a configuration error, not a player
    // action, so it fails loudly at construction time.
    throw new Error(`Could not create the run: ${initialRejection.kind}`)
  }

  return {
    getState(): ControllerState {
      return state
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    dispatch(command: GameCommand): EngineRejection | undefined {
      const result = transition(state.run, command, dependencies)

      if (isErr(result)) {
        // A refusal is a legitimate outcome: the session keeps its state and
        // the UI is told why, rather than silently doing nothing.
        state = { ...state, lastRejection: result.error, lastEvents: [] }
        notify()
        return result.error
      }

      const run = result.value.state
      state = {
        run,
        view: buildView(run, dependencies),
        log: appendAction(state.log, command),
        lastEvents: result.value.events,
        lastRejection: undefined,
      }
      drain(result.value.effects, run)
      notify()
      return undefined
    },

    restart(next: RunDescriptor): EngineRejection | undefined {
      const rejection = start(next)
      notify()
      return rejection
    },
  }
}
