/**
 * Development-only engine surface.
 *
 * Fixtures, the synthetic player and the simulation helpers. Kept out of
 * `@/game` so nothing here can reach a production bundle through the public
 * API; the development harness route and the tooling scripts import it
 * explicitly.
 */

export {
  createDevelopmentContentCatalog,
  createDevelopmentDependencies,
  createDevelopmentRuleset,
  developmentChallenges,
  DEVELOPMENT_CONTENT_VERSION,
  DEVELOPMENT_RULESET_VERSION,
} from './fixtures/development-ruleset'
export { developmentStorylets } from './fixtures/storylets'
export {
  createSixStageDependencies,
  createSixStageRuleset,
  sixStageCompositionPolicy,
  sixStageRecoveryContent,
  sixStageRecoveryPolicy,
  SIX_STAGE_IDS,
  SIX_STAGE_RULESET_VERSION,
} from './fixtures/six-stage-progression'
export {
  orderedTeacherGateCases,
  teacherGateCase,
  teacherGateCaseIssues,
  TEACHER_GATE_1_CASES,
  type TeacherGateCase,
  type TeacherGateSurface,
} from './teacher-gate/cases'
export {
  verifyTeacherGateCase,
  type TeacherGateCaseReport,
} from './teacher-gate/verify'
export {
  createComposedDevelopmentDependencies,
  createComposedDevelopmentRuleset,
  composedDevelopmentCompositionPolicy,
  COMPOSED_DEVELOPMENT_RULESET_VERSION,
} from './fixtures/composed-ruleset'
export {
  createSyntheticSixStageCompositionCatalog,
  syntheticSixStageCompositionPolicy,
  SYNTHETIC_SIX_STAGE_IDS,
} from './fixtures/six-stage-composition'
export { developmentFamilies } from './fixtures/families'
export {
  materializeEveryVariant,
  materializeVariant,
  type MaterializeOptions,
} from './materialize'
export {
  DEFAULT_AGENT_OPTIONS,
  simulateRun,
  synthesizeAnswer,
  type AgentOptions,
  type SimulatedRun,
} from './agent'
export {
  developmentRunDescriptor,
  simulateMany,
  type SimulationFinding,
  type SimulationSummary,
} from './simulation'
