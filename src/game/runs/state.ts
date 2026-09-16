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
import type { ComposedRunPlan } from '../plan/composer'
import type { RareOccurrence } from '../narrative/rare-events'
import type { ProgressionState } from '../progression/recovery'
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
  /**
   * Fingerprint of the composed plan this run must play.
   *
   * Present only for a composed run, and then it is a promise the engine keeps:
   * `createRun` composes from the seed and the declared policies and refuses the
   * run if what comes out is not this plan. A calibration that moved after the
   * run was created is caught here instead of quietly producing a different
   * game under the same identity.
   */
  readonly planFingerprint?: string
  /**
   * The competitive score policy this run is played under.
   *
   * Present only when the run is meant to be scored competitively, and then it
   * is part of the run's identity for the same reason the catalog version is:
   * a score computed under `fair-score-dev-1` and one computed under
   * `fair-score-dev-2` are different claims about the same gameplay, and a
   * submission that did not say which one it meant could not be verified.
   *
   * Absent is a real answer. A practice run is not competing.
   */
  readonly scoreVersion?: string
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
  /**
   * True when this beat is remediating what the year owes.
   *
   * The engine needs it to know that resolving this beat closes obligations
   * rather than creating one, and the screen needs it to say so in words.
   */
  readonly recovery?: boolean
  /**
   * Lo que un evento raro le agregó a esta escena.
   *
   * Presentación y nada más: no toca parámetros, evaluación ni score. Está en
   * el estado para que una reanudación vuelva a contar lo mismo.
   */
  readonly rareNote?: {
    readonly id: string
    readonly title: string
    readonly text: string
  }
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
  /**
   * True when the beat was remediating what the year owed.
   *
   * The history has to be able to tell the two apart after the fact: an
   * ordinary beat is competitive evidence and a remediation beat is not, and a
   * record that could not distinguish them would make «did failing buy extra
   * score» a question nobody could answer from the run itself.
   */
  readonly recovery?: boolean
}

export interface RunCompletion {
  /**
   * Whether the run reached the end of the career.
   *
   * True for every run that played its final stage out with nothing owed —
   * which, by the progression rules, is every valid completed run. False only
   * when a run ended early because content could not serve it, which is a
   * defect and not an outcome a player can reach.
   */
  readonly graduated: boolean
  /** Years that closed owing something. Hidden history, never a visible stat. */
  readonly previas: number
  /** Remediation beats the run played. */
  readonly recoveries: number
  readonly totalScore: number
  readonly profile: ProfileResult
  readonly career: CareerState
  readonly eventsPlayed: number
}

export interface RunState {
  /**
   * The content this run plays, decided once before it started.
   *
   * Present for a composed run and absent for one that resolves its content as
   * it goes. When it is here it is authoritative: the runtime executes these
   * beats and never draws a template or a variant of its own, because a plan
   * the engine can quietly deviate from is not a plan.
   */
  readonly plan?: ComposedRunPlan
  /**
   * What the run owes and how it has closed what it owed.
   *
   * Separate from `history`, which records what was played. This records what
   * playing it *committed the year to*, and it is the state graduation is
   * decided from — never from «every visible event happened».
   */
  readonly progression: ProgressionState
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
  /**
   * Los eventos raros que aparecieron, en el orden en el que aparecieron.
   *
   * Es historia de la carrera, no una decisión pendiente: la selección es
   * determinista desde la seed y el estado, así que un replay la reconstruye.
   * Vive acá —y no en el plan— porque la elegibilidad mira cómo se viene
   * jugando, que es algo que el plan no sabe.
   */
  readonly rare: readonly RareOccurrence[]
  /** Client-side preview only; ADR-004 keeps the official total on the server. */
  readonly scorePreview: number
  readonly optimalStreak: number
  readonly completion: RunCompletion | undefined
}
