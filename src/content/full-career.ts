/**
 * La carrera completa: `7.º → 5.º` con el presupuesto de nueve beats.
 *
 * Los sets por año existen para desarrollar e inspeccionar un año a la vez, y
 * cada uno compone dos beats por etapa. Éste es el otro: el mismo contenido y
 * el mismo catálogo aprobado, con las restricciones de carrera de producto —
 * nueve beats ordinarios, seis anchors y tres secundarias, cuotas de banda,
 * pacing, razonamiento, cluster y arco— que hasta ahora sólo se habían probado
 * contra catálogos sintéticos.
 *
 * `official` sigue en false. Lo que define una run oficial —intentos, seed
 * emitida por servidor, ranking— es de STAGE-09; lo que esta pieza cierra es
 * que la carrera de nueve beats se puede componer con el contenido real.
 */
import {
  ENGINE_VERSION,
  EngineInvariantError,
  PUBLISHED_OBJECTIVES_V1,
  candidateDifficultyCostPolicy,
  candidateFairScorePolicy,
  composeRun,
  createRuleset,
  fullCareerV1Constraints,
  ok,
  planFingerprint,
  stageCompositionPolicy,
  toRulesetId,
  toRunId,
  toRunSeed,
  type CompositionFailure,
  type CompositionPolicy,
  type EngineDependencies,
  type Result,
  type RunDescriptor,
} from '@/game'
import { GRADE_7_HOSTABLE_TEMPLATES } from '@/content/grade-7/composition'
import {
  GRADE_5_CONTENT_VERSION,
  GRADE_5_VARIANT_CATALOG_VERSION,
} from '@/content/grade-5/versions'
import {
  createGrade5Dependencies,
  grade5ApprovedVariants,
} from '@/content/grade-5'

/** Identidad propia: el contenido es el de 5.º, la política de carrera no. */
export const FULL_CAREER_RULESET_VERSION = '1.0.0-full-career'

/**
 * Nueve beats entre seis años, con un anchor por año.
 *
 * Cada etapa admite uno o dos beats ordinarios; la cuenta total la fija la
 * restricción de carrera, así que es la búsqueda global la que decide en qué
 * tres años entra la secundaria. El objetivo de dificultad sube con los años
 * porque las bandas suben con ellos, y la tolerancia deja lugar a que un año
 * traiga una sola situación.
 */
export const fullCareerCompositionPolicy: CompositionPolicy = {
  id: 'full-career',
  version: '1.0.0-candidate',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  /**
   * Adentro del sobre de dificultad, la variedad manda.
   *
   * `difficulty-fit` no está en la lista, y eso es una decisión medida: con él
   * primero, el óptimo global es único y las trescientas carreras que se
   * compusieron usaban las mismas doce Templates. El sobre sigue siendo duro
   * —el compositor no produce un plan fuera de la tolerancia de la etapa—; lo
   * que cambia es qué prefiere **entre** los planes que ya entran, y ahí la
   * carrera prefiere que dos runs no se parezcan.
   */
  objectives: PUBLISHED_OBJECTIVES_V1.filter(
    (objective) => objective !== 'difficulty-fit',
  ).concat('cognitive-variety'),
  stages: [
    stageCompositionPolicy('grade-7', {
      difficulty: { target: 200, tolerance: 160 },
      narrativeBeats: 1,
      hostableTemplates: [...GRADE_7_HOSTABLE_TEMPLATES],
    }),
    stageCompositionPolicy('year-1', {
      difficulty: { target: 220, tolerance: 170 },
      narrativeBeats: 2,
    }),
    stageCompositionPolicy('year-2', {
      difficulty: { target: 240, tolerance: 180 },
      narrativeBeats: 2,
    }),
    stageCompositionPolicy('year-3', {
      difficulty: { target: 260, tolerance: 190 },
      narrativeBeats: 2,
    }),
    stageCompositionPolicy('year-4', {
      difficulty: { target: 280, tolerance: 200 },
      narrativeBeats: 2,
    }),
    stageCompositionPolicy('year-5', {
      difficulty: { target: 300, tolerance: 210 },
      narrativeBeats: 2,
    }),
  ],
  career: fullCareerV1Constraints,
}

export function createFullCareerDependencies(): EngineDependencies {
  const base = createGrade5Dependencies()
  const created = createRuleset({
    ...base.ruleset,
    id: toRulesetId('full-career'),
    version: FULL_CAREER_RULESET_VERSION,
    composition: fullCareerCompositionPolicy,
  })
  if (!created.ok)
    throw new EngineInvariantError(
      `invalid full-career ruleset: ${created.error.kind}`,
    )
  return {
    ...base,
    ruleset: created.value,
    composition: fullCareerCompositionPolicy,
  }
}

export function createFullCareerRunDescriptor(
  seed: string,
): Result<RunDescriptor, CompositionFailure> {
  const dependencies = createFullCareerDependencies()
  const base: RunDescriptor = {
    runId: toRunId(`career-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'fixed',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: FULL_CAREER_RULESET_VERSION,
    contentVersion: GRADE_5_CONTENT_VERSION,
    variantCatalogVersion: GRADE_5_VARIANT_CATALOG_VERSION,
    scoreVersion: candidateFairScorePolicy.version,
  }
  const composed = composeRun({
    seed: base.seed,
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    approvedVariants: grade5ApprovedVariants,
    policy: fullCareerCompositionPolicy,
  })
  return composed.ok
    ? ok({ ...base, planFingerprint: planFingerprint(composed.value) })
    : composed
}
