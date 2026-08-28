/**
 * Run state.
 *
 * Everything here is JSON-compatible: no `Date`, `Map`, `Set`, class instance or
 * function ever enters this tree. That is what makes a run serializable for a
 * resume snapshot and reproducible during a server-side replay.
 *
 * The active challenge is held as an *address*, not as a generated model.
 * Because generation is a pure function of that address, the model can always be
 * recomputed, and it can never drift out of step with the state that references
 * it.
 */

import type {
  ChallengeId,
  ChallengeInstanceId,
  RunId,
  RunSeed,
  StoryletId,
} from '../core/branded'
import type {
  ChallengeFeedback,
  ChallengeInstanceRef,
  ReasoningMetrics,
} from '../challenges/contracts'
import type { DifficultyLevel, SolutionQuality } from '../challenges/taxonomy'
import type { ToolId } from '../challenges/interactions'
import type { DifficultyState } from '../difficulty/policy'
import type { FlagMap } from '../narrative/conditions'
import type { SelectionState } from '../narrative/selection'
import type { ProfileResult } from '../profiles/policy'
import type { StageId } from '../progression/stages'
import type { CareerChange, CareerState } from '../progression/career'
import type { ScoreBreakdown } from '../scoring/policy'

/** Modes from the GDD. `practice` carries no ranking. */
export type GameMode = 'standard' | 'fair' | 'practice'

/**
 * Difficulty selection for a run.
 *
 * Open question 5 has not chosen between manual, adaptive and hybrid, so only
 * the two mechanisms the engine can honour today are offered.
 */
export type DifficultySetting = 'adaptive' | 'fixed'

/**
 * Immutable identity and configuration of a run.
 *
 * Field names follow the documented contract in `api-contracts.md` and FR-017.
 */
export interface RunDescriptor {
  readonly runId: RunId
  readonly seed: RunSeed
  readonly mode: GameMode
  readonly difficulty: DifficultySetting
  readonly gameVersion: string
  readonly rulesetVersion: string
  readonly contentVersion: string
  /**
   * The approved variant catalog this run draws from, when it draws from one.
   *
   * Absent is a real answer, not a missing value: a run that plays a template's
   * curated variants is not drawing from a catalog, and stamping one on it
   * would claim an approval that never happened. It becomes required only for
   * runs that must be auditable against a frozen competitive catalog.
   */
  readonly variantCatalogVersion?: string
}

/**
 * Where the run currently is.
 *
 * `narrative` is a storylet with no challenge, which the player acknowledges.
 * `challenge` awaits an answer. `feedback` awaits an explicit continue, which
 * the design requires before the consequence scrolls away.
 */
export type RunPhase = 'narrative' | 'challenge' | 'feedback' | 'completed'

export interface ActiveEvent {
  readonly storyletId: StoryletId
  /** The moment of the year, shown above the title. */
  readonly eyebrow: string
  readonly title: string
  readonly text: string
  /** Absent for a purely narrative beat. */
  readonly challenge: ChallengeInstanceRef | undefined
  /** Information keys the player has revealed on this event. */
  readonly revealed: readonly string[]
  /** Tools opened on this event; recorded for analytics, never penalised. */
  readonly toolsUsed: readonly ToolId[]
  /**
   * What the storylet's own effects moved when the beat opened.
   *
   * A purely narrative beat can still change the career — the course offering
   * you the coordination of the project moves Equipo — and the card shows a chip
   * for it. Keeping the report in state means a resume redraws the same chip.
   */
  readonly careerChange: CareerChange
}

/** Feedback awaiting acknowledgement, kept in state so a resume can restore it. */
export interface PendingFeedback {
  readonly instanceId: ChallengeInstanceId
  readonly quality: SolutionQuality
  readonly feedback: ChallengeFeedback
  readonly score: ScoreBreakdown
  /**
   * The career dimensions this outcome actually moved.
   *
   * Reported by the engine rather than diffed by the UI, so the panel can render
   * one chip per dimension present and none for the rest. `Promedio +0` is not
   * representable.
   */
  readonly careerChange: CareerChange
}

export interface ResolvedEvent {
  readonly sequence: number
  readonly stage: StageId
  readonly eventIndex: number
  readonly storyletId: StoryletId
  readonly challengeId: ChallengeId | undefined
  readonly instanceId: ChallengeInstanceId | undefined
  readonly difficulty: DifficultyLevel
  readonly quality: SolutionQuality | undefined
  readonly metrics: ReasoningMetrics | undefined
  readonly points: number
  readonly revealedCount: number
}

export interface RunCompletion {
  readonly totalScore: number
  readonly profile: ProfileResult
  readonly career: CareerState
  readonly eventsPlayed: number
}

export interface RunState {
  readonly descriptor: RunDescriptor
  readonly phase: RunPhase
  readonly status: 'active' | 'completed' | 'abandoned'
  readonly stage: StageId
  /** Global event counter across the whole run. */
  readonly eventIndex: number
  /** Event counter within the current stage. */
  readonly stageEventIndex: number
  readonly career: CareerState
  readonly flags: FlagMap
  readonly difficulty: DifficultyState
  readonly selection: SelectionState
  readonly seenStorylets: readonly StoryletId[]
  readonly qualityHistory: readonly SolutionQuality[]
  readonly activeEvent: ActiveEvent | undefined
  readonly pendingFeedback: PendingFeedback | undefined
  readonly history: readonly ResolvedEvent[]
  /** Client-side preview only; ADR-004 keeps the official total on the server. */
  readonly scorePreview: number
  readonly optimalStreak: number
  readonly completion: RunCompletion | undefined
}
