/**
 * Pure selectors.
 *
 * The UI asks questions here instead of reaching into the state tree, so a
 * change to the internal shape does not ripple through components, and no
 * component ever has to re-derive a rule.
 *
 * Every function is pure and allocation-light; none mutates state.
 */

import type { StageConfig, StageId } from '../progression/stages'
import { stageConfig, type Ruleset } from '../ruleset/ruleset'
import type { PendingFeedback, RunState } from './state'

export function isRunComplete(state: RunState): boolean {
  return state.status !== 'active'
}

export function currentStage(
  state: RunState,
  ruleset: Ruleset,
): StageConfig | undefined {
  return stageConfig(ruleset, state.stage)
}

/** Zero-based index of the current stage within the ruleset. */
export function currentStageIndex(state: RunState, ruleset: Ruleset): number {
  return ruleset.stages.findIndex((stage) => stage.id === state.stage)
}

export interface RunProgress {
  readonly stage: StageId
  readonly stageIndex: number
  readonly stageCount: number
  readonly eventInStage: number
  readonly eventsInStage: number
  readonly totalEvents: number
  readonly eventsResolved: number
}

export function runProgress(state: RunState, ruleset: Ruleset): RunProgress {
  const totalEvents = ruleset.stages.reduce(
    (total, stage) => total + stage.eventCount,
    0,
  )
  const stage = currentStage(state, ruleset)

  return {
    stage: state.stage,
    stageIndex: currentStageIndex(state, ruleset),
    stageCount: ruleset.stages.length,
    eventInStage: state.stageEventIndex,
    eventsInStage: stage?.eventCount ?? 0,
    totalEvents,
    eventsResolved: state.history.length,
  }
}

/** True when the engine would accept an `ANSWER` right now. */
export function canSubmitAnswer(state: RunState): boolean {
  return (
    state.status === 'active' &&
    state.phase === 'challenge' &&
    state.activeEvent?.challenge !== undefined
  )
}

/** True when the engine would accept a `CONTINUE` right now. */
export function canContinue(state: RunState): boolean {
  return (
    state.status === 'active' &&
    (state.phase === 'feedback' || state.phase === 'narrative')
  )
}

export function pendingFeedback(state: RunState): PendingFeedback | undefined {
  return state.pendingFeedback
}

/**
 * Score shown during play.
 *
 * ADR-004 keeps the official total on the server; this is explicitly a preview
 * and the UI is expected to label it as one.
 */
export function scorePreview(state: RunState): number {
  return state.scorePreview
}

export function activeInstanceId(state: RunState): string | undefined {
  return state.activeEvent?.challenge?.instanceId
}

/** Information keys already revealed on the active event. */
export function revealedInformation(state: RunState): readonly string[] {
  return state.activeEvent?.revealed ?? []
}
