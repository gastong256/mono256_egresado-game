/**
 * 5.º — Cierre y futuro, as a content set.
 *
 * El primer set que tiene los seis años. Sigue siendo práctica de desarrollo
 * —`official` es false— porque el presupuesto oficial de nueve beats, la
 * rareza, Prestige y el epílogo se cierran en la integración; lo que ya no
 * falta es contenido de ningún año.
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
  createGrade4Dependencies,
  grade4RecoveryContent,
} from '@/content/grade-4'
import { createGrade5Catalog } from './registry'
import artifact from './variant-catalog.grade-5-dev-2.json' with { type: 'json' }
import { grade5CareerStorylets, grade5ReviewId } from './storylets'
import { grade5CompositionPolicy } from './composition'
import {
  GRADE_5_CONTENT_VERSION,
  GRADE_5_DEMO_RULESET_VERSION,
  GRADE_5_RULESET_VERSION,
  GRADE_5_VARIANT_CATALOG_VERSION,
} from './versions'

const parsed = parseApprovedVariantCatalog(artifact)
if (!parsed.ok)
  throw new EngineInvariantError('invalid Grade-5 approved catalog')
export const grade5VariantCatalog = parsed.value
export const grade5ApprovedVariants =
  approvedVariantLookup(grade5VariantCatalog)

/**
 * Recovery routing for the career so far.
 *
 * 5.º declares the two routes its design approves: the peña is repaired by the
 * break-even review and the floor plan by the capacity one. The other three
 * Templates of the year say `none`, which is a written decision and not an
 * omission — including the special one, which never opens a Repaso.
 */
export const grade5RecoveryContent: RecoveryContent = {
  ...grade4RecoveryContent,
  storyletByStage: {
    ...grade4RecoveryContent.storyletByStage,
    'year-5': grade5ReviewId,
  },
  reviews: {
    ...grade4RecoveryContent.reviews,
    'y5.final-trip-or-event': [
      toChallengeId('y5.multi-option-comparison-review'),
    ],
    'y5.yearbook': [toChallengeId('y5.proportion-capacity-review')],
  },
  debriefs: {
    ...grade4RecoveryContent.debriefs,
    'y5.final-trip-or-event': {
      title: 'Lo que no está incluido',
      text: 'Dos paquetes no se comparan por el precio de la lista: primero hay que sumarle a cada uno lo que no incluye, y un precio por persona se multiplica por cuántos son.',
    },
    'y5.yearbook': {
      title: 'La página que sobra',
      text: 'Cuando el material no entra justo en las páginas, lo que sobra también necesita una: se divide y se sube al entero.',
    },
  },
}

export function createGrade5Dependencies(demo = false): EngineDependencies {
  const base = createGrade4Dependencies(demo)
  const created = createRuleset({
    ...base.ruleset,
    id: toRulesetId(demo ? 'grade-5-demo' : 'grade-7-through-5'),
    version: demo ? GRADE_5_DEMO_RULESET_VERSION : GRADE_5_RULESET_VERSION,
    contentSetId: toContentSetId('grade-7-through-5'),
    contentVersion: GRADE_5_CONTENT_VERSION,
    stages: [
      ...base.ruleset.stages,
      {
        id: 'year-5',
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
    ...(!demo ? { composition: grade5CompositionPolicy } : {}),
  })
  if (!created.ok)
    throw new EngineInvariantError(
      `invalid Grade-5 ruleset: ${created.error.kind}`,
    )
  return {
    ruleset: created.value,
    catalog: createGrade5Catalog(),
    storylets: grade5CareerStorylets,
    recoveryContent: grade5RecoveryContent,
    competitiveScore: candidateFairScorePolicy,
    approvedVariants: grade5ApprovedVariants,
    ...(!demo ? { composition: grade5CompositionPolicy } : {}),
  }
}

export function createGrade5RunDescriptor(
  seed: string,
  demo = false,
): Result<RunDescriptor, CompositionFailure> {
  const dependencies = createGrade5Dependencies(demo)
  const base: RunDescriptor = {
    runId: toRunId(`g5-${demo ? 'demo' : 'partial'}-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'fixed',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: dependencies.ruleset.version,
    contentVersion: GRADE_5_CONTENT_VERSION,
    variantCatalogVersion: GRADE_5_VARIANT_CATALOG_VERSION,
    scoreVersion: candidateFairScorePolicy.version,
  }
  if (demo) return ok(base)
  const composed = composeRun({
    seed: base.seed,
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    approvedVariants: grade5ApprovedVariants,
    policy: grade5CompositionPolicy,
  })
  return composed.ok
    ? ok({ ...base, planFingerprint: planFingerprint(composed.value) })
    : composed
}

export const grade5ReviewStoryletId = toStoryletId('y5.review')
export {
  grade5Challenges,
  grade5Families,
  createGrade5Catalog,
} from './registry'
export {
  grade5CompositionPolicy,
  grade5PartialConstraints,
} from './composition'
export {
  GRADE_5_CONTENT_VERSION,
  GRADE_5_RULESET_VERSION,
  GRADE_5_DEMO_RULESET_VERSION,
  GRADE_5_VARIANT_CATALOG_VERSION,
} from './versions'
