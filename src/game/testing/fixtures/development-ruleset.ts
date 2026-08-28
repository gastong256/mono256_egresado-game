/**
 * DEVELOPMENT RULESET AND CONTENT SET — not final Egresado content.
 *
 * Assembles the development policies, stages, storylets and challenge
 * definitions into something the engine can actually run. Stage sizes follow the
 * GDD's suggested shape (two events per school year, one closing event), but
 * open questions 1, 2, 5 and 24 mean none of these numbers is balanced or final.
 *
 * `createRuleset` refuses to mark this official because every policy it uses is
 * flagged as development.
 */

import { toContentSetId, toRulesetId } from '../../core/branded'
import { EngineInvariantError } from '../../core/invariant'
import {
  createChallengeRegistry,
  type ChallengeRegistry,
} from '../../challenges/registry'
import { developmentDifficultyPolicy } from '../../difficulty/development-policy'
import { developmentProfilePolicy } from '../../profiles/development-policy'
import { developmentScoringPolicy } from '../../scoring/development-policy'
import type { StageConfig } from '../../progression/stages'
import { createRuleset, type Ruleset } from '../../ruleset/ruleset'
import type { EngineDependencies } from '../../runs/transition'
import { busDeparture } from './challenges/bus-departure'
import { groupAssignment } from './challenges/group-assignment'
import { muralCoverage } from './challenges/mural-coverage'
import { notebookDiscount } from './challenges/notebook-discount'
import { recyclingChart } from './challenges/recycling-chart'
import { studyTimeline } from './challenges/study-timeline'
import { surveyConfidence } from './challenges/survey-confidence'
import { tripBudget } from './challenges/trip-budget'
import { developmentStorylets } from './storylets'

export const DEVELOPMENT_RULESET_VERSION = '0.2.0-dev'
export const DEVELOPMENT_CONTENT_VERSION = '0.2.0-dev'

/** Every development challenge definition. */
export const developmentChallenges = [
  busDeparture,
  groupAssignment,
  muralCoverage,
  notebookDiscount,
  recyclingChart,
  studyTimeline,
  surveyConfidence,
  tripBudget,
]

export function createDevelopmentChallengeRegistry(): ChallengeRegistry {
  return createChallengeRegistry(developmentChallenges)
}

/**
 * Stage configuration.
 *
 * Categories follow the orientation table in `math-design-framework.md`; the
 * target difficulty climbs one level roughly every two years.
 */
const DEVELOPMENT_STAGES: readonly StageConfig[] = [
  {
    id: 'grade-7',
    labelKey: 'stage.grade7',
    eventCount: 2,
    targetDifficulty: 2,
    categories: ['quantity', 'time-and-rates', 'space-and-shape'],
  },
  {
    id: 'year-1',
    labelKey: 'stage.year1',
    eventCount: 2,
    targetDifficulty: 2,
    categories: [
      'proportions-and-percentages',
      'quantity',
      'time-and-rates',
      'space-and-shape',
    ],
  },
  {
    id: 'year-2',
    labelKey: 'stage.year2',
    eventCount: 2,
    targetDifficulty: 3,
    categories: [
      'time-and-rates',
      'proportions-and-percentages',
      'optimization-and-constraints',
      'data-and-statistics',
    ],
  },
  {
    id: 'year-3',
    labelKey: 'stage.year3',
    eventCount: 2,
    targetDifficulty: 4,
    categories: [
      'optimization-and-constraints',
      'patterns-and-relations',
      'data-and-statistics',
    ],
  },
  {
    id: 'year-4',
    labelKey: 'stage.year4',
    eventCount: 2,
    targetDifficulty: 4,
    categories: [
      'data-and-statistics',
      'probability-and-uncertainty',
      'proportions-and-percentages',
    ],
  },
  {
    id: 'year-5',
    labelKey: 'stage.year5',
    eventCount: 2,
    targetDifficulty: 5,
    categories: [
      'probability-and-uncertainty',
      'optimization-and-constraints',
      'data-and-statistics',
    ],
  },
  {
    id: 'graduation',
    labelKey: 'stage.graduation',
    eventCount: 1,
    targetDifficulty: 5,
    categories: ['quantity'],
  },
]

/**
 * Builds the development ruleset.
 *
 * Throws rather than returning a rejection: a broken fixture is a programming
 * error inside this repository, not a runtime condition a player can cause.
 */
export function createDevelopmentRuleset(): Ruleset {
  const result = createRuleset({
    id: toRulesetId('development'),
    version: DEVELOPMENT_RULESET_VERSION,
    contentSetId: toContentSetId('development'),
    contentVersion: DEVELOPMENT_CONTENT_VERSION,
    stages: DEVELOPMENT_STAGES,
    scoring: developmentScoringPolicy,
    difficulty: developmentDifficultyPolicy,
    profile: developmentProfilePolicy,
    narrative: { cooldownEvents: 4, allowRepeats: false },
  })

  if (!result.ok) {
    throw new EngineInvariantError(
      `the development ruleset is invalid: ${result.error.kind}`,
    )
  }

  return result.value
}

/** Everything `transition` needs to run development content. */
export function createDevelopmentDependencies(): EngineDependencies {
  return {
    ruleset: createDevelopmentRuleset(),
    challenges: createDevelopmentChallengeRegistry(),
    storylets: developmentStorylets,
  }
}
