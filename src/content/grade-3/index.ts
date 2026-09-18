/**
 * 3.º — Autonomía, as a content set.
 *
 * Practice only, exactly like the `7.º → 2.º` set it extends: `official` stays
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
  createGrade2Dependencies,
  grade2RecoveryContent,
} from '@/content/grade-2'
import { createGrade3Catalog } from './registry'
import artifact from './variant-catalog.grade-3-dev-4.json' with { type: 'json' }
import { grade3CareerStorylets, grade3ReviewId } from './storylets'
import { grade3CompositionPolicy } from './composition'
import {
  GRADE_3_CONTENT_VERSION,
  GRADE_3_DEMO_RULESET_VERSION,
  GRADE_3_RULESET_VERSION,
  GRADE_3_VARIANT_CATALOG_VERSION,
} from './versions'

const parsed = parseApprovedVariantCatalog(artifact)
if (!parsed.ok)
  throw new EngineInvariantError('invalid Grade-3 approved catalog')
export const grade3VariantCatalog = parsed.value
export const grade3ApprovedVariants =
  approvedVariantLookup(grade3VariantCatalog)

/**
 * Recovery routing for the career so far.
 *
 * 3.º declares the two routes its design approves: the tech fair is repaired by
 * the capacity review and the bus fare by the fixed-versus-variable one. The
 * other three Templates of the year say `none`, which is a written decision and
 * not an omission.
 */
export const grade3RecoveryContent: RecoveryContent = {
  ...grade2RecoveryContent,
  storyletByStage: {
    ...grade2RecoveryContent.storyletByStage,
    'year-3': grade3ReviewId,
  },
  reviews: {
    ...grade2RecoveryContent.reviews,
    'y3.course-project-tech': [toChallengeId('y3.rate-capacity-review')],
    'y3.transport-pass': [toChallengeId('y3.fixed-variable-review')],
  },
  debriefs: {
    ...grade2RecoveryContent.debriefs,
    'y3.course-project-tech': {
      title: 'Cuánto entra',
      text: 'Antes de repartir el trabajo, mirá cuánto entra: lo que hay dividido por lo que gasta cada cosa, y sólo la parte entera. El pedazo que sobra no alcanza para uno más.',
    },
    'y3.transport-pass': {
      title: 'Lo que se paga una vez',
      text: 'Un costo que se paga una vez y otro que se paga cada vez no se comparan de a uno: se comparan a partir de cuántas veces, y ese número es el que decide.',
    },
  },
}

export function createGrade3Dependencies(demo = false): EngineDependencies {
  const base = createGrade2Dependencies(demo)
  const created = createRuleset({
    ...base.ruleset,
    id: toRulesetId(demo ? 'grade-3-demo' : 'grade-7-through-3'),
    version: demo ? GRADE_3_DEMO_RULESET_VERSION : GRADE_3_RULESET_VERSION,
    contentSetId: toContentSetId('grade-7-through-3'),
    contentVersion: GRADE_3_CONTENT_VERSION,
    stages: [
      ...base.ruleset.stages,
      {
        id: 'year-3',
        labelKey: 'stage.year3',
        eventCount: 7,
        targetDifficulty: 3,
        categories: [
          'quantity',
          'proportions-and-percentages',
          'time-and-rates',
          'space-and-shape',
          'optimization-and-constraints',
          'patterns-and-relations',
        ],
      },
    ],
    ...(!demo ? { composition: grade3CompositionPolicy } : {}),
  })
  if (!created.ok)
    throw new EngineInvariantError(
      `invalid Grade-3 ruleset: ${created.error.kind}`,
    )
  return {
    ruleset: created.value,
    catalog: createGrade3Catalog(),
    storylets: grade3CareerStorylets,
    recoveryContent: grade3RecoveryContent,
    competitiveScore: candidateFairScorePolicy,
    approvedVariants: grade3ApprovedVariants,
    ...(!demo ? { composition: grade3CompositionPolicy } : {}),
  }
}

export function createGrade3RunDescriptor(
  seed: string,
  demo = false,
): Result<RunDescriptor, CompositionFailure> {
  const dependencies = createGrade3Dependencies(demo)
  const base: RunDescriptor = {
    runId: toRunId(`g3-${demo ? 'demo' : 'partial'}-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'fixed',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: GRADE_3_CONTENT_VERSION,
    variantCatalogVersion: GRADE_3_VARIANT_CATALOG_VERSION,
    scoreVersion: candidateFairScorePolicy.version,
  }
  if (demo) return ok(base)
  const composed = composeRun({
    seed: base.seed,
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    approvedVariants: grade3ApprovedVariants,
    policy: grade3CompositionPolicy,
  })
  return composed.ok
    ? ok({ ...base, planFingerprint: planFingerprint(composed.value) })
    : composed
}

export const grade3ReviewStoryletId = toStoryletId('y3.review')
export {
  grade3Challenges,
  grade3Families,
  createGrade3Catalog,
} from './registry'
export {
  grade3CompositionPolicy,
  grade3PartialConstraints,
} from './composition'
export {
  GRADE_3_CONTENT_VERSION,
  GRADE_3_RULESET_VERSION,
  GRADE_3_DEMO_RULESET_VERSION,
  GRADE_3_VARIANT_CATALOG_VERSION,
} from './versions'
