/**
 * Public engine API.
 *
 * The supported surface of the deterministic core. Consumers — the React
 * adapter, future server use cases, tooling — import from here; everything else
 * under `src/game` is internal and may change without notice.
 *
 * Development content is deliberately absent: it lives behind
 * `@/game/testing`, so fixtures cannot be pulled into a production bundle by
 * accident.
 */

// Identity and versioning
export {
  toChallengeId,
  toChallengeInstanceId,
  toContentSetId,
  toRunId,
  toRunSeed,
  toRulesetId,
  toStoryletId,
  type ChallengeId,
  type ChallengeInstanceId,
  type ContentSetId,
  type RulesetId,
  type RunId,
  type RunSeed,
  type StoryletId,
} from './core/branded'
export {
  assertCompatibleVersions,
  ENGINE_VERSION,
  type VersionTriple,
} from './core/versioning'

// Result and error handling
export { err, isErr, isOk, ok, type Result } from './core/result'
export { describeRejection, type EngineRejection } from './core/errors'
export { EngineInvariantError } from './core/invariant'
/** Exhaustiveness helper, exported so consumers can keep their own switches complete. */
export { assertNever } from './core/exhaustive'

// Run lifecycle
export {
  activeChallengeView,
  createRun,
  materializeChallenge,
  transition,
  type EngineDependencies,
} from './runs/transition'
export { parseCommand, type GameCommand } from './runs/commands'
export type {
  DomainEvent,
  EffectRequest,
  TransitionResult,
} from './runs/events'
export type {
  ActiveEvent,
  DifficultySetting,
  GameMode,
  PendingFeedback,
  ResolvedEvent,
  RunCompletion,
  RunDescriptor,
  RunPhase,
  RunState,
} from './runs/state'

// Replay and persistence
export {
  appendAction,
  emptyActionLog,
  parseActionLog,
  serializeActionLog,
  ACTION_LOG_VERSION,
  type RunActionEnvelope,
  type RunActionLog,
} from './runs/action-log'
export {
  canonicalize,
  replayRun,
  statesMatch,
  type ReplayOutcome,
} from './runs/replay'
export {
  restoreSnapshot,
  serializeSnapshot,
  SNAPSHOT_SCHEMA_VERSION,
  type RunSnapshot,
} from './runs/snapshot'

// Derived state for presentation
export {
  activeInstanceId,
  canContinue,
  canSubmitAnswer,
  currentStage,
  isRunComplete,
  pendingFeedback,
  revealedInformation,
  runProgress,
  scorePreview,
  type RunProgress,
} from './runs/selectors'

// Challenge and interaction contracts
export type {
  ChallengeDefinition,
  ChallengeEvaluation,
  ChallengeFeedback,
  ChallengeInstanceRef,
  ChallengeNarrative,
  FeedbackFact,
  PublicChallengeView,
  ReasoningMetrics,
} from './challenges/contracts'
export { defineChallenge, type ChallengeSpec } from './challenges/contracts'
export {
  createChallengeRegistry,
  type ChallengeRegistry,
} from './challenges/registry'
export type {
  AgentAssignment,
  BudgetLine,
  InteractionAnswer,
  InteractionKind,
  InteractionPresentation,
  PresentedAgent,
  PresentedBudgetItem,
  PresentedChartPoint,
  PresentedDatum,
  PresentedOption,
  PresentedTask,
  RequestableInformation,
  ToolId,
} from './challenges/interactions'
export type {
  DifficultyLevel,
  MathCategory,
  SolutionQuality,
} from './challenges/taxonomy'

// Progression, rules and policies
export {
  STAGE_ORDER,
  type StageConfig,
  type StageId,
} from './progression/stages'
export {
  type PlayerStats,
  type VisibleStat,
  VISIBLE_STATS,
} from './progression/stats'
export {
  contentFingerprint,
  engineFingerprint,
  rulesetFingerprint,
} from './ruleset/fingerprint'
export { runStateIssues } from './runs/invariants'
export {
  createRuleset,
  type NarrativePacing,
  type Ruleset,
  type RulesetInput,
} from './ruleset/ruleset'
export type { ScoreBreakdown, ScoringPolicy } from './scoring/policy'
export type { DifficultyPolicy, DifficultyState } from './difficulty/policy'
export type {
  ProfileDimensions,
  ProfileId,
  ProfilePolicy,
  ProfileResult,
} from './profiles/policy'

// Narrative authoring contracts
export type { Storylet, StoryletKind } from './narrative/storylet'
export type {
  StoryletCondition,
  FlagMap,
  FlagValue,
} from './narrative/conditions'
export type { StoryletEffect } from './narrative/effects'

// Content validation
export {
  validateContent,
  type ContentValidationInput,
  type ContentValidationReport,
  type ValidationIssue,
} from './content/validation'
