/**
 * A composed development ruleset spanning six academic stages.
 *
 * Real content only exists for 7.º, so the proof that the composer is generic
 * cannot come from production data — it has to come from a content set with
 * several stages, different eligibility per stage, and enough variety that each
 * year has a genuine choice. That is what the development fixtures already are,
 * and this wires them to a composition policy.
 *
 * What it demonstrates, in one object:
 *
 * - five stages composed in one pass, each with its own budget and target;
 * - difficulty targets that **rise** across the career without the composer
 *   knowing anything about school years;
 * - a stage that composes a single ordinary beat, because once a template may
 *   not repeat there is only one thing left to schedule — the one-beat path,
 *   exercised for real rather than configured into existence;
 * - stages (`year-5`, `graduation`) deliberately left out, used by the tests to
 *   prove that composition fails loudly instead of quietly shortening a career.
 *
 * Five and not seven because the fixtures hold eight templates: a career of six
 * years at two beats each needs eleven, and no-repeat scheduling says so by
 * refusing rather than by playing the same challenge twice. That refusal is the
 * behaviour under test.
 *
 * Adding `year-6` here would be a policy entry and nothing else. That is the
 * property STAGE-08 depends on, and the reason it is asserted in a fixture
 * rather than promised in a document.
 */

import { EngineInvariantError } from '../../core/invariant'
import { toContentSetId, toRulesetId } from '../../core/branded'
import { developmentDifficultyPolicy } from '../../difficulty/development-policy'
import { developmentProfilePolicy } from '../../profiles/development-policy'
import { developmentScoringPolicy } from '../../scoring/development-policy'
import { candidateDifficultyCostPolicy } from '../../difficulty/cost-policy'
import {
  COMPOSITION_OBJECTIVES,
  stageCompositionPolicy,
  type CompositionPolicy,
} from '../../plan/composition-policy'
import type { EngineDependencies } from '../../runs/transition'
import { createRuleset, type Ruleset } from '../../ruleset/ruleset'
import type { StageConfig } from '../../progression/stages'
import {
  createDevelopmentContentCatalog,
  DEVELOPMENT_CONTENT_VERSION,
} from './development-ruleset'
import { developmentStorylets } from './storylets'

export const COMPOSED_DEVELOPMENT_RULESET_VERSION = '0.1.0-dev-composed'

/**
 * Stages of a composed development career.
 *
 * `eventCount` is still declared because the ruleset contract requires it, but a
 * composed run does not read it: the plan says how long each stage runs. It is
 * left at the uncomposed value so the difference is visible in a test rather
 * than hidden by making the two agree.
 */
const COMPOSED_STAGES: readonly StageConfig[] = [
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
    targetDifficulty: 3,
    categories: [
      'quantity',
      'time-and-rates',
      'space-and-shape',
      'proportions-and-percentages',
    ],
  },
  {
    id: 'year-2',
    labelKey: 'stage.year2',
    eventCount: 2,
    targetDifficulty: 3,
    categories: [
      'proportions-and-percentages',
      'optimization-and-constraints',
      'data-and-statistics',
      'time-and-rates',
      'quantity',
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
      'quantity',
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
]

/**
 * The composition policy of a development career.
 *
 * Targets climb from 250 to 310 hundredths, which is a **shape**, not a
 * calibration: it exists to prove the architecture can express progression, and
 * no teacher has approved a single one of these numbers.
 */
export const composedDevelopmentCompositionPolicy: CompositionPolicy = {
  id: 'development-composed',
  version: '1.0.0-dev',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: [...COMPOSITION_OBJECTIVES],
  stages: [
    stageCompositionPolicy('grade-7', {
      difficulty: { target: 250, tolerance: 110 },
    }),
    stageCompositionPolicy('year-1', {
      difficulty: { target: 250, tolerance: 110 },
    }),
    stageCompositionPolicy('year-2', {
      difficulty: { target: 280, tolerance: 110 },
    }),
    stageCompositionPolicy('year-3', {
      difficulty: { target: 310, tolerance: 110 },
    }),
    // Lo único elegible en 4.º después de no repetir plantillas puede ser un
    // solo anchor. El presupuesto no hay que gastarlo para respetarlo.
    stageCompositionPolicy('year-4', {
      difficulty: { target: 260, tolerance: 110 },
    }),
  ],
}

export function createComposedDevelopmentRuleset(): Ruleset {
  const result = createRuleset({
    id: toRulesetId('development-composed'),
    version: COMPOSED_DEVELOPMENT_RULESET_VERSION,
    contentSetId: toContentSetId('development'),
    contentVersion: DEVELOPMENT_CONTENT_VERSION,
    stages: COMPOSED_STAGES,
    scoring: developmentScoringPolicy,
    difficulty: developmentDifficultyPolicy,
    profile: developmentProfilePolicy,
    narrative: { cooldownEvents: 4, allowRepeats: false },
    composition: composedDevelopmentCompositionPolicy,
  })

  if (!result.ok) {
    throw new EngineInvariantError(
      `the composed development ruleset is invalid: ${result.error.kind}`,
    )
  }

  return result.value
}

/** Everything `transition` needs to play a composed development career. */
export function createComposedDevelopmentDependencies(): EngineDependencies {
  return {
    ruleset: createComposedDevelopmentRuleset(),
    catalog: createDevelopmentContentCatalog(),
    storylets: developmentStorylets,
    composition: composedDevelopmentCompositionPolicy,
  }
}
