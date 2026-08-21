'use client'

/**
 * React binding for the game controller.
 *
 * `useSyncExternalStore` is the sanctioned way to read an external mutable
 * source in React 19: it subscribes correctly, keeps concurrent rendering
 * consistent and lets a component select just the slice it needs, so a stat
 * change does not re-render the whole board.
 *
 * The hooks here read and dispatch. They never compute a rule — everything they
 * expose comes from an engine selector.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react'

import {
  canContinue,
  canSubmitAnswer,
  isRunComplete,
  runProgress,
  scorePreview,
  type EngineDependencies,
  type EngineRejection,
  type GameCommand,
  type RunProgress,
} from '@/game'
import type { ControllerState, GameController } from './controller'

/**
 * Subscribes to a slice of controller state.
 *
 * The selector must return a stable value for unchanged state; every value read
 * here is either a primitive or an object the controller replaces on change.
 */
export function useControllerSelector<T>(
  controller: GameController,
  select: (state: ControllerState) => T,
): T {
  const subscribe = useCallback(
    (listener: () => void) => controller.subscribe(listener),
    [controller],
  )
  const snapshot = useCallback(
    () => select(controller.getState()),
    [controller, select],
  )

  // The controller state is identical on server and client for a given
  // descriptor, so the server snapshot is the same function.
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

export interface GameRunView {
  readonly state: ControllerState
  readonly progress: RunProgress
  readonly score: number
  readonly canAnswer: boolean
  readonly canAdvance: boolean
  readonly complete: boolean
  dispatch(command: GameCommand): EngineRejection | undefined
}

export function useGameRun(
  controller: GameController,
  dependencies: EngineDependencies,
): GameRunView {
  const state = useControllerSelector(
    controller,
    useCallback((current: ControllerState) => current, []),
  )

  const dispatch = useCallback(
    (command: GameCommand) => controller.dispatch(command),
    [controller],
  )

  return useMemo(
    () => ({
      state,
      progress: runProgress(state.run, dependencies.ruleset),
      score: scorePreview(state.run),
      canAnswer: canSubmitAnswer(state.run),
      canAdvance: canContinue(state.run),
      complete: isRunComplete(state.run),
      dispatch,
    }),
    [state, dependencies.ruleset, dispatch],
  )
}
