/**
 * 2.º — Pertenencia e identidad, as a content set.
 *
 * Practice only, exactly like the `7.º → 1.º` set it extends: `official` stays
 * false and the official nine-beat career still waits for the remaining years.
 */
import {
  ENGINE_VERSION,
  EngineInvariantError,
  approvedVariantLookup,
  parseApprovedVariantCatalog,
  candidateFairScorePolicy,
  composeRun,
  createRuleset,
  ok,
  planFingerprint,
  toChallengeId,
  toContentSetId,
  toRulesetId,
  toRunId,
  toRunSeed,
  toStoryletId,
  type CompositionFailure,
  type EngineDependencies,
  type RecoveryContent,
  type Result,
  type RunDescriptor,
} from '@/game'
import {
  createGrade1Dependencies,
  grade1RecoveryContent,
} from '@/content/grade-1'
import { createGrade2Catalog } from './registry'
import artifact from './variant-catalog.grade-2-dev-5.json' with { type: 'json' }
import { grade2CareerStorylets, grade2ReviewId } from './storylets'
import { grade2CompositionPolicy } from './composition'
import {
  GRADE_2_CONTENT_VERSION,
  GRADE_2_DEMO_RULESET_VERSION,
  GRADE_2_RULESET_VERSION,
  GRADE_2_VARIANT_CATALOG_VERSION,
} from './versions'

/**
 * Recovery routing for the career so far.
 *
 * 2.º declares exactly one route, the one its design approves: the survey is
 * repaired by the denominator review. Every other Template of the year says
 * `none`, which is a written decision and not an omission.
 */
const parsed = parseApprovedVariantCatalog(artifact)
if (!parsed.ok)
  throw new EngineInvariantError('invalid Grade-2 approved catalog')
export const grade2VariantCatalog = parsed.value
export const grade2ApprovedVariants =
  approvedVariantLookup(grade2VariantCatalog)

export const grade2RecoveryContent: RecoveryContent = {
  ...grade1RecoveryContent,
  storyletByStage: {
    ...grade1RecoveryContent.storyletByStage,
    'year-2': grade2ReviewId,
  },
  reviews: {
    ...grade1RecoveryContent.reviews,
    'y2.course-project-survey': [toChallengeId('y2.data-claim-review')],
  },
  debriefs: {
    ...grade1RecoveryContent.debriefs,
    'y2.course-project-survey': {
      title: 'Sobre cuánta gente',
      text: 'Antes de publicar un porcentaje, mirá sobre cuánta gente está calculado: la misma cifra sostiene una afirmación sobre quienes contestaron y no la sostiene sobre el nivel entero.',
    },
  },
}

export function createGrade2Dependencies(demo = false): EngineDependencies {
  const base = createGrade1Dependencies(demo)
  const created = createRuleset({
    ...base.ruleset,
    id: toRulesetId(demo ? 'grade-2-demo' : 'grade-7-through-2'),
    version: demo ? GRADE_2_DEMO_RULESET_VERSION : GRADE_2_RULESET_VERSION,
    contentSetId: toContentSetId('grade-7-through-2'),
    contentVersion: GRADE_2_CONTENT_VERSION,
    stages: [
      ...base.ruleset.stages,
      {
        id: 'year-2',
        labelKey: 'stage.year2',
        eventCount: 7,
        targetDifficulty: 3,
        categories: [
          'quantity',
          'proportions-and-percentages',
          'probability-and-uncertainty',
          'patterns-and-relations',
          'space-and-shape',
          'optimization-and-constraints',
          'time-and-rates',
        ],
      },
    ],
    ...(!demo ? { composition: grade2CompositionPolicy } : {}),
  })
  if (!created.ok)
    throw new EngineInvariantError(
      `invalid Grade-2 ruleset: ${created.error.kind}`,
    )
  return {
    ruleset: created.value,
    catalog: createGrade2Catalog(),
    storylets: grade2CareerStorylets,
    recoveryContent: grade2RecoveryContent,
    competitiveScore: candidateFairScorePolicy,
    approvedVariants: grade2ApprovedVariants,
    ...(!demo ? { composition: grade2CompositionPolicy } : {}),
  }
}

export function createGrade2RunDescriptor(
  seed: string,
  demo = false,
): Result<RunDescriptor, CompositionFailure> {
  const dependencies = createGrade2Dependencies(demo)
  const base: RunDescriptor = {
    runId: toRunId(`g2-${demo ? 'demo' : 'partial'}-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'fixed',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: GRADE_2_CONTENT_VERSION,
    variantCatalogVersion: GRADE_2_VARIANT_CATALOG_VERSION,
    scoreVersion: candidateFairScorePolicy.version,
  }
  if (demo) return ok(base)
  const composed = composeRun({
    seed: base.seed,
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    approvedVariants: grade2ApprovedVariants,
    policy: grade2CompositionPolicy,
  })
  return composed.ok
    ? ok({ ...base, planFingerprint: planFingerprint(composed.value) })
    : composed
}

export const grade2ReviewStoryletId = toStoryletId('y2.review')
export {
  grade2Challenges,
  grade2Families,
  createGrade2Catalog,
} from './registry'
export {
  grade2CompositionPolicy,
  grade2PartialConstraints,
} from './composition'
export {
  GRADE_2_CONTENT_VERSION,
  GRADE_2_RULESET_VERSION,
  GRADE_2_DEMO_RULESET_VERSION,
  GRADE_2_VARIANT_CATALOG_VERSION,
} from './versions'
