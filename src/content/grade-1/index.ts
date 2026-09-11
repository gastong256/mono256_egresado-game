import {
  approvedVariantLookup,
  parseApprovedVariantCatalog,
  createRuleset,
  ENGINE_VERSION,
  EngineInvariantError,
  toContentSetId,
  toRulesetId,
  toRunId,
  toRunSeed,
  toChallengeId,
  composeRun,
  planFingerprint,
  ok,
  candidateFairScorePolicy,
  type RunDescriptor,
  type EngineDependencies,
  type CompositionFailure,
  type Result,
  type RecoveryContent,
} from '@/game'
import { createGrade7Ruleset, grade7RecoveryContent } from '@/content/grade-7'
import { createGrade1Catalog } from './registry'
import { grade1CompositionPolicy } from './composition'
import { grade1CareerStorylets, grade1ReviewId } from './storylets'
import {
  GRADE_1_CONTENT_VERSION,
  GRADE_1_RULESET_VERSION,
  GRADE_1_DEMO_RULESET_VERSION,
  GRADE_1_VARIANT_CATALOG_VERSION,
} from './versions'
import artifact from './variant-catalog.grade-1-dev-1.json' with { type: 'json' }

const parsed = parseApprovedVariantCatalog(artifact)
if (!parsed.ok)
  throw new EngineInvariantError('invalid Grade-1 approved catalog')
export const grade1VariantCatalog = parsed.value
export const grade1ApprovedVariants =
  approvedVariantLookup(grade1VariantCatalog)
export const grade1RecoveryContent: RecoveryContent = {
  ...grade7RecoveryContent,
  storyletByStage: { 'year-1': grade1ReviewId },
  reviews: {
    ...grade7RecoveryContent.reviews,
    'y1.rehearsal-schedule': [toChallengeId('y1.schedule-review')],
    'y1.classroom-layout': [toChallengeId('y1.scale-fit-review')],
  },
  debriefs: {
    'g7.bus-timing': {
      title: 'Duración del viaje',
      text: 'Separá la demora del tiempo normal; recién después compará la llegada con el límite.',
    },
    'g7.bus-latest-departure': {
      title: 'Duración del viaje',
      text: 'Partí del límite de llegada y descontá el viaje completo, incluida la demora.',
    },
    'y1.rehearsal-schedule': {
      title: 'Agenda y traslados',
      text: 'Una actividad ocupa su duración; antes de la siguiente también entran traslado y preparación. Mirá las ventanas desde el compromiso fijo hacia atrás.',
    },
    'y1.classroom-layout': {
      title: 'Escala y encastre',
      text: 'Convertí las medidas con la escala antes de ubicar. Dos objetos que entran por área pueden solaparse o cortar el recorrido: comprobá sus huellas y el paso.',
    },
  },
}

export function createGrade1Dependencies(demo = false): EngineDependencies {
  const base = createGrade7Ruleset()
  const created = createRuleset({
    ...base,
    id: toRulesetId(demo ? 'grade-1-demo' : 'grade-7-through-1'),
    version: demo ? GRADE_1_DEMO_RULESET_VERSION : GRADE_1_RULESET_VERSION,
    contentSetId: toContentSetId('grade-7-through-1'),
    contentVersion: GRADE_1_CONTENT_VERSION,
    stages: [
      ...base.stages,
      {
        id: 'year-1',
        labelKey: 'stage.year1',
        eventCount: 7,
        targetDifficulty: 3,
        categories: [
          'quantity',
          'time-and-rates',
          'space-and-shape',
          'proportions-and-percentages',
          'optimization-and-constraints',
          'probability-and-uncertainty',
        ],
      },
    ],
    ...(!demo ? { composition: grade1CompositionPolicy } : {}),
  })
  if (!created.ok)
    throw new EngineInvariantError(
      `invalid Grade-1 ruleset: ${created.error.kind}`,
    )
  return {
    ruleset: created.value,
    catalog: createGrade1Catalog(),
    storylets: grade1CareerStorylets,
    approvedVariants: grade1ApprovedVariants,
    recoveryContent: grade1RecoveryContent,
    competitiveScore: candidateFairScorePolicy,
    ...(!demo ? { composition: grade1CompositionPolicy } : {}),
  }
}

/** Both modes are explicitly local practice, never the official full-career edition. */
export function createGrade1RunDescriptor(
  seed: string,
  demo = false,
): Result<RunDescriptor, CompositionFailure> {
  const dependencies = createGrade1Dependencies(demo)
  const base: RunDescriptor = {
    runId: toRunId(`g1-${demo ? 'demo' : 'partial'}-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'fixed',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: GRADE_1_CONTENT_VERSION,
    variantCatalogVersion: GRADE_1_VARIANT_CATALOG_VERSION,
    scoreVersion: candidateFairScorePolicy.version,
  }
  if (demo) return ok(base)
  const composed = composeRun({
    seed: base.seed,
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    approvedVariants: grade1ApprovedVariants,
    policy: grade1CompositionPolicy,
  })
  return composed.ok
    ? ok({ ...base, planFingerprint: planFingerprint(composed.value) })
    : composed
}

export {
  grade1Challenges,
  grade1Families,
  createGrade1Catalog,
} from './registry'
export {
  grade1CompositionPolicy,
  grade1PartialConstraints,
} from './composition'
export {
  GRADE_1_CONTENT_VERSION,
  GRADE_1_RULESET_VERSION,
  GRADE_1_DEMO_RULESET_VERSION,
  GRADE_1_VARIANT_CATALOG_VERSION,
} from './versions'
