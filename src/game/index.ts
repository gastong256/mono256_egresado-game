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
  toScenarioFamilyId,
  toStoryletId,
  toVariantId,
  type ChallengeId,
  type ChallengeInstanceId,
  type ContentSetId,
  type RulesetId,
  type RunId,
  type RunSeed,
  type ScenarioFamilyId,
  type StoryletId,
  type VariantId,
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

// Numeric primitives and evaluation helpers for content authors.
// Content computes with exact rationals, never with binary floats (ADR-013).
export {
  absolute,
  add,
  compare,
  divide,
  equals,
  fromDecimalString,
  fromInteger,
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  multiply,
  rational,
  subtract,
  sum,
  toNumber,
  ZERO,
  type Rational,
} from './math/rational'
export {
  applyPercent,
  formatDecimal,
  percentOf,
  roundTo,
  roundUpToMultiple,
  unitsRequired,
  type RoundingMode,
} from './math/rounding'
export {
  formatMoney,
  formatQuantity,
  money,
  quantity,
  rectangleArea,
  type Quantity,
  type Unit,
} from './math/quantity'
export { withinTolerance, type Tolerance } from './math/tolerance'
// Clasificación de enteros. Es el único lugar del producto donde se decide si un
// número es par, múltiplo de 3 o primo; la UI consume el veredicto, no lo repite.
export {
  classifyCell,
  isEven,
  isMultipleOfThree,
  isNumberRule,
  isPrime,
  matchesRule,
  NUMBER_RULES,
  targetsFor,
  type CellClassification,
  type NumberRule,
} from './math/classification'
export {
  addClassification,
  clamp01,
  classificationScore,
  countClassification,
  efficiencyFromUsage,
  EMPTY_CLASSIFICATION,
  informationUseRatio,
  metrics,
  precisionFromDistance,
  qualityRank,
  type ClassificationCounts,
  type ClassificationScore,
} from './challenges/evaluation'

// Challenge and interaction contracts
export type {
  ChallengeDefinition,
  ChallengeEvaluation,
  ChallengeFeedback,
  ChallengeInstanceRef,
  ChallengeNarrative,
  FeedbackFact,
  MaterializedChallenge,
  PublicChallengeView,
  ReasoningMetrics,
} from './challenges/contracts'
export {
  defineChallenge,
  selectVariantId,
  variantRefOf,
  type ChallengeSpec,
} from './challenges/contracts'
export {
  createContentCatalog,
  type ContentCatalog,
} from './challenges/content-catalog'

// Content model: scenario family, challenge template, challenge variant
export {
  authoredVariant,
  authoredVariantIds,
  deriveVariantSeed,
  formatVariantAddress,
  isEligibleForStage,
  isOrdinaryBeatRole,
  isPlacementRole,
  parseVariantAddress,
  sameVariantAddress,
  createVariantRng,
  variantRngPath,
  PLACEMENT_ROLES,
  VARIANT_SPACE_SEED,
  type AuthoredVariant,
  type ChallengePlacementRole,
  type ChallengeVariantRef,
  type ScenarioFamilyDefinition,
  type StageEligibility,
} from './challenges/content-model'
export {
  planEntry,
  resolvePlanEntry,
  validateRunPlan,
  validateStagePlan,
  DEFAULT_STAGE_BEAT_BUDGET,
  type ResolvedPlanEntry,
  type RunPlan,
  type RunPlanEntry,
  type StageBeatBudget,
  type StageContentPlan,
} from './content/run-plan'
export {
  demoAsStagePlan,
  isValidStagePlan,
  validateDemoPlan,
  DEFAULT_DEMO_COVERAGE,
  type DemoCoverage,
  type DemoPlan,
  type DemoPlanEntry,
} from './content/demo-plan'
export {
  hasNoErrors,
  type ValidationIssue,
  type ValidationSeverity,
} from './content/issues'

// Variant pipeline: sources, validation, fingerprints and approved catalogs
export { sha256Hex } from './content/hash'
export {
  candidateIndexOf,
  candidateVariantId,
  resolveVariantParams,
  sourceAcceptsVariant,
  type AuthoredParams,
  type CandidateContext,
  type ApprovedVariantLookup,
  type ErasedVariantSource,
  type VariantGenerator,
  type VariantSourceSpec,
} from './challenges/variant-source'
export {
  countByCode,
  isApprovable,
  paramsValidator,
  validateGeneric,
  validateVariant,
  variantDiagnostic,
  PRESENTATION_LIMITS,
  VARIANT_DIAGNOSTIC_CODES,
  type VariantDiagnostic,
  type VariantDiagnosticCode,
  type VariantValidationInput,
  type VariantValidator,
} from './challenges/variant-validation'
export {
  approvedVariantLookup,
  approvedVariantsFor,
  canonicalCatalog,
  findApprovedVariant,
  parseApprovedVariantCatalog,
  serializeCatalog,
  variantFingerprint,
  verifyCatalogIntegrity,
  type ApprovedVariant,
  type ApprovedVariantCatalog,
  type CatalogGeneratorRecord,
  type VariantSourceKind,
} from './content/variant-catalog'
export {
  auditVariantCatalog,
  AUDIT_THRESHOLDS,
  type OptionPositionStats,
  type TemplateAudit,
  type VariantAuditReport,
} from './content/variant-audit'
export {
  buildVariantCatalog,
  evaluateVariant,
  type BuildCatalogOptions,
  type BuildCatalogOutput,
  type CandidateResult,
  type PipelineReport,
  type TemplatePipelineReport,
} from './content/variant-pipeline'
export {
  instanceRefFor,
  type InstanceAddressOptions,
} from './challenges/instance-address'
export type {
  AgentAssignment,
  BudgetLine,
  GridRoundSelection,
  InteractionAnswer,
  InteractionKind,
  InteractionPresentation,
  PresentedAgent,
  PresentedBudgetItem,
  PresentedChartPoint,
  PresentedDatum,
  PresentedGridRound,
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
  applyCareerEffects,
  AURA_DELTA_BUDGET,
  clampEquipo,
  clampGrade,
  ESTILO_AXES,
  ESTILO_EVIDENCE_THRESHOLD,
  EQUIPO_DELTA_BUDGET,
  estiloAxisLabel,
  initialCareer,
  isEstiloAxis,
  isEstiloEstablished,
  leadingEstiloAxis,
  nudgeEstilo,
  promedio,
  validateCareerEffects,
  type CareerChange,
  type CareerEffects,
  type CareerState,
  type Estilo,
  type EstiloAxis,
  type EstiloNudge,
  type MasteryGain,
} from './progression/career'
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
  CareerDimension,
  StoryletCondition,
  FlagMap,
  FlagValue,
} from './narrative/conditions'
export { CAREER_DIMENSIONS } from './narrative/conditions'
export type { StoryletEffect } from './narrative/effects'

// Content validation
export {
  validateContent,
  type ContentValidationInput,
  type ContentValidationReport,
} from './content/validation'
