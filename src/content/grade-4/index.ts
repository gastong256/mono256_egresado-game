/**
 * 4.º — Responsabilidad, as a content set.
 *
 * Practice only, exactly like the `7.º → 3.º` set it extends: `official` stays
 * false and the official nine-beat career still waits for 5.º.
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
  createGrade3Dependencies,
  grade3RecoveryContent,
} from '@/content/grade-3'
import { createGrade4Catalog } from './registry'
import artifact from './variant-catalog.grade-4-dev-3.json' with { type: 'json' }
import { grade4CareerStorylets, grade4ReviewId } from './storylets'
import { grade4CompositionPolicy } from './composition'
import {
  GRADE_4_CONTENT_VERSION,
  GRADE_4_DEMO_RULESET_VERSION,
  GRADE_4_RULESET_VERSION,
  GRADE_4_VARIANT_CATALOG_VERSION,
} from './versions'

const parsed = parseApprovedVariantCatalog(artifact)
if (!parsed.ok)
  throw new EngineInvariantError('invalid Grade-4 approved catalog')
export const grade4VariantCatalog = parsed.value
export const grade4ApprovedVariants =
  approvedVariantLookup(grade4VariantCatalog)

/**
 * Recovery routing for the career so far.
 *
 * 4.º declares the two routes its design approves: the peña is repaired by the
 * break-even review and the floor plan by the capacity one. The other three
 * Templates of the year say `none`, which is a written decision and not an
 * omission — including the special one, which never opens a Repaso.
 */
export const grade4RecoveryContent: RecoveryContent = {
  ...grade3RecoveryContent,
  storyletByStage: {
    ...grade3RecoveryContent.storyletByStage,
    'year-4': grade4ReviewId,
  },
  reviews: {
    ...grade3RecoveryContent.reviews,
    'y4.course-project-fundraiser': [toChallengeId('y4.margin-review')],
    'y4.event-floor-plan': [toChallengeId('y4.spatial-capacity-review')],
  },
  debriefs: {
    ...grade3RecoveryContent.debriefs,
    'y4.course-project-fundraiser': {
      title: 'Lo que deja cada bandeja',
      text: 'De cada bandeja no queda el precio: queda el precio menos lo que costó prepararla. El costo fijo se cubre con eso, y recién después empieza lo que el curso junta.',
    },
    'y4.event-floor-plan': {
      title: 'El espacio que queda',
      text: 'Antes de contar mesas, descontá lo que no se puede usar: el pasillo, la puerta y las columnas ocupan lugar aunque estén vacías.',
    },
  },
}

export function createGrade4Dependencies(demo = false): EngineDependencies {
  const base = createGrade3Dependencies(demo)
  const created = createRuleset({
    ...base.ruleset,
    id: toRulesetId(demo ? 'grade-4-demo' : 'grade-7-through-4'),
    version: demo ? GRADE_4_DEMO_RULESET_VERSION : GRADE_4_RULESET_VERSION,
    contentSetId: toContentSetId('grade-7-through-4'),
    contentVersion: GRADE_4_CONTENT_VERSION,
    stages: [
      ...base.ruleset.stages,
      {
        id: 'year-4',
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
    ...(!demo ? { composition: grade4CompositionPolicy } : {}),
  })
  if (!created.ok)
    throw new EngineInvariantError(
      `invalid Grade-4 ruleset: ${created.error.kind}`,
    )
  return {
    ruleset: created.value,
    catalog: createGrade4Catalog(),
    storylets: grade4CareerStorylets,
    recoveryContent: grade4RecoveryContent,
    competitiveScore: candidateFairScorePolicy,
    approvedVariants: grade4ApprovedVariants,
    ...(!demo ? { composition: grade4CompositionPolicy } : {}),
  }
}

export function createGrade4RunDescriptor(
  seed: string,
  demo = false,
): Result<RunDescriptor, CompositionFailure> {
  const dependencies = createGrade4Dependencies(demo)
  const base: RunDescriptor = {
    runId: toRunId(`g4-${demo ? 'demo' : 'partial'}-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'fixed',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: GRADE_4_CONTENT_VERSION,
    variantCatalogVersion: GRADE_4_VARIANT_CATALOG_VERSION,
    scoreVersion: candidateFairScorePolicy.version,
  }
  if (demo) return ok(base)
  const composed = composeRun({
    seed: base.seed,
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    approvedVariants: grade4ApprovedVariants,
    policy: grade4CompositionPolicy,
  })
  return composed.ok
    ? ok({ ...base, planFingerprint: planFingerprint(composed.value) })
    : composed
}

export const grade4ReviewStoryletId = toStoryletId('y4.review')
export {
  grade4Challenges,
  grade4Families,
  createGrade4Catalog,
} from './registry'
export {
  grade4CompositionPolicy,
  grade4PartialConstraints,
} from './composition'
export {
  GRADE_4_CONTENT_VERSION,
  GRADE_4_RULESET_VERSION,
  GRADE_4_DEMO_RULESET_VERSION,
  GRADE_4_VARIANT_CATALOG_VERSION,
} from './versions'
