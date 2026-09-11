/**
 * Pure selectors.
 *
 * The UI asks questions here instead of reaching into the state tree, so a
 * change to the internal shape does not ripple through components, and no
 * component ever has to re-derive a rule.
 *
 * Every function is pure and allocation-light; none mutates state.
 */

import { plannedEventCount } from '../plan/composer'
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
function currentStageIndex(state: RunState, ruleset: Ruleset): number {
  return ruleset.stages.findIndex((stage) => stage.id === state.stage)
}

export interface RunProgress {
  readonly stage: StageId
  readonly stageIndex: number
  readonly stageCount: number
  readonly eventInStage: number
  /** Events the current stage plays: the composed plan's count when there is one. */
  readonly eventsInStage: number
  /** Events of the current stage already closed, a remediation beat included. */
  readonly resolvedInStage: number
  /**
   * Cells the stage needs right now: its planned events, plus the remediation
   * beat once the year opens one. Never fewer than the event being played.
   */
  readonly stageCells: number
  readonly totalEvents: number
  readonly eventsResolved: number
}

export function runProgress(state: RunState, ruleset: Ruleset): RunProgress {
  const totalEvents = ruleset.stages.reduce(
    (total, stage) => total + plannedEventCount(state.plan, stage),
    0,
  )
  const stage = currentStage(state, ruleset)
  const eventsInStage =
    stage === undefined ? 0 : plannedEventCount(state.plan, stage)
  const resolvedInStage = state.history.filter(
    (entry) => entry.stage === state.stage,
  ).length

  return {
    stage: state.stage,
    stageIndex: currentStageIndex(state, ruleset),
    stageCount: ruleset.stages.length,
    eventInStage: state.stageEventIndex,
    eventsInStage,
    resolvedInStage,
    stageCells: Math.max(
      eventsInStage,
      resolvedInStage + (state.status === 'active' ? 1 : 0),
    ),
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
