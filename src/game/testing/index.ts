/**
 * Development-only engine surface.
 *
 * Fixtures, the synthetic player and the simulation helpers. Kept out of
 * `@/game` so nothing here can reach a production bundle through the public
 * API; the development harness route and the tooling scripts import it
 * explicitly.
 */

export {
  createDevelopmentChallengeRegistry,
  createDevelopmentDependencies,
  createDevelopmentRuleset,
  developmentChallenges,
  DEVELOPMENT_CONTENT_VERSION,
  DEVELOPMENT_RULESET_VERSION,
} from './fixtures/development-ruleset'
export { developmentStorylets } from './fixtures/storylets'
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
