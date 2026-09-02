/**
 * Content set de 7.º grado.
 *
 * Ensambla el contenido jugable y el ruleset que lo gobierna. Es contenido de
 * producto, no fixtures: vive versionado y pasa el validador como cualquier
 * otro content set.
 *
 * Las políticas de score, dificultad y perfil siguen siendo las de desarrollo
 * mientras las preguntas abiertas 5 y 24 estén sin cerrar, así que este ruleset
 * no puede declararse oficial. `createRuleset` lo impide por diseño.
 */

import {
  createContentCatalog,
  createRuleset,
  EngineInvariantError,
  ENGINE_VERSION,
  toContentSetId,
  toRulesetId,
  ok,
  planFingerprint,
  toRunId,
  toRunSeed,
  candidateFairScorePolicy,
  resolveCompetitiveScorePolicy,
  composeRun,
  type ChallengeDefinition,
  type CompositionFailure,
  type EngineDependencies,
  type Result,
  type RunDescriptor,
  type Ruleset,
  type StageConfig,
} from '@/game'
import { developmentDifficultyPolicy } from '@/game/difficulty/development-policy'
import { developmentProfilePolicy } from '@/game/profiles/development-policy'
import { developmentScoringPolicy } from '@/game/scoring/development-policy'

import { grade7Families } from './families'
import {
  GRADE_7_COMPOSED_RULESET_VERSION,
  GRADE_7_CONTENT_VERSION,
  GRADE_7_RULESET_VERSION,
  GRADE_7_VARIANT_CATALOG_VERSION,
} from './versions'
import { grade7CompositionPolicy } from './composition'
import { busLatestDeparture } from './challenges/bus-latest-departure'
import { busTiming } from './challenges/bus-timing'
import { groupTasks } from './challenges/group-tasks'
import { may25Act } from './challenges/may-25-act'
import { muralPaint } from './challenges/mural-paint'
import { notebookOffer } from './challenges/notebook-offer'
import { standSupplies } from './challenges/stand-supplies'
import { grade7Storylets } from './storylets'
import { grade7ApprovedVariants } from './variant-catalogs'

/** Los siete desafíos jugables de 7.º grado. */
export const grade7Challenges: readonly ChallengeDefinition[] = [
  busLatestDeparture,
  busTiming,
  may25Act,
  muralPaint,
  notebookOffer,
  groupTasks,
  standSupplies,
]

/**
 * Configuración de la etapa.
 *
 * Ocho eventos: seis desafíos más la apertura y la bifurcación narrativa. Las
 * plantillas son siete porque el slot del colectivo tiene dos y el seed elige.
 * La dificultad objetivo es baja porque 7.º es el comienzo del rango de edad.
 */
const GRADE_7_STAGE: StageConfig = {
  id: 'grade-7',
  labelKey: 'stage.grade7',
  eventCount: 8,
  targetDifficulty: 2,
  categories: [
    'quantity',
    'time-and-rates',
    'space-and-shape',
    'proportions-and-percentages',
    'optimization-and-constraints',
    // La agrega el acto del 25 de Mayo: clasificar por paridad, múltiplos y
    // primos es reconocer un patrón, no medir una cantidad.
    'patterns-and-relations',
  ],
}

export function createGrade7Ruleset(): Ruleset {
  const result = createRuleset({
    id: toRulesetId('grade-7'),
    version: GRADE_7_RULESET_VERSION,
    contentSetId: toContentSetId('grade-7'),
    contentVersion: GRADE_7_CONTENT_VERSION,
    stages: [GRADE_7_STAGE],
    scoring: developmentScoringPolicy,
    difficulty: developmentDifficultyPolicy,
    profile: developmentProfilePolicy,
    // El arco es una secuencia autorada, así que ningún evento se repite.
    narrative: { cooldownEvents: 0, allowRepeats: false },
  })

  if (!result.ok) {
    throw new EngineInvariantError(
      `el ruleset de 7.º grado es inválido: ${result.error.kind}`,
    )
  }

  return result.value
}

/**
 * El ruleset de una partida **compuesta** de 7.º.
 *
 * La diferencia con el de arriba no es de configuración: es qué es una run. Éste
 * declara una política de composición, así que el contenido del año se elige una
 * sola vez, antes de empezar, y el motor lo ejecuta. Son uno o dos beats
 * ordinarios —el presupuesto de ADR-019— en vez del arco completo.
 *
 * La etapa declara los mismos ocho eventos que la demo porque un ruleset tiene
 * que declarar alguno; una run compuesta no los lee, porque el plan dice cuánto
 * dura cada año. Que los dos números no coincidan es visible a propósito.
 */
export function createGrade7ComposedRuleset(): Ruleset {
  const result = createRuleset({
    id: toRulesetId('grade-7-composed'),
    version: GRADE_7_COMPOSED_RULESET_VERSION,
    contentSetId: toContentSetId('grade-7'),
    contentVersion: GRADE_7_CONTENT_VERSION,
    stages: [GRADE_7_STAGE],
    scoring: developmentScoringPolicy,
    difficulty: developmentDifficultyPolicy,
    profile: developmentProfilePolicy,
    narrative: { cooldownEvents: 0, allowRepeats: false },
    composition: grade7CompositionPolicy,
  })

  if (!result.ok) {
    throw new EngineInvariantError(
      `el ruleset compuesto de 7.º grado es inválido: ${result.error.kind}`,
    )
  }

  return result.value
}

/** Todo lo que el motor necesita para jugar 7.º grado. */
export function createGrade7Dependencies(): EngineDependencies {
  return {
    ruleset: createGrade7Ruleset(),
    catalog: createContentCatalog(grade7Families, grade7Challenges),
    storylets: grade7Storylets,
    // La partida elige dentro de lo aprobado, no dentro de lo que un generador
    // puede alcanzar. Ésa es la diferencia entre tener un pipeline y usarlo.
    approvedVariants: grade7ApprovedVariants,
  }
}

/**
 * Todo lo que el motor necesita para jugar una partida **compuesta** de 7.º.
 *
 * Mismo contenido, mismo catálogo aprobado, otra idea de run: el compositor
 * elige el año antes de que empiece y el motor lo ejecuta sin volver a sortear
 * nada.
 */
export function createGrade7ComposedDependencies(): EngineDependencies {
  return {
    ruleset: createGrade7ComposedRuleset(),
    catalog: createContentCatalog(grade7Families, grade7Challenges),
    storylets: grade7Storylets,
    approvedVariants: grade7ApprovedVariants,
    composition: grade7CompositionPolicy,
  }
}

/**
 * Lo que el motor necesita para jugar una partida **competitiva** de 7.º.
 *
 * La misma partida compuesta, más la política de score bajo la que se la va a
 * puntuar. Es una configuración de competencia y no contenido: el score no
 * cambia ni un resultado, ni un efecto de carrera, ni qué contenido se compone.
 * Está acá para que una run pueda declarar bajo qué calibración se jugó, que es
 * lo que después permite verificar el score que reclame.
 */
export function createGrade7CompetitiveDependencies(
  scoreReference: string = candidateFairScorePolicy.version,
): EngineDependencies {
  const policy = resolveCompetitiveScorePolicy(scoreReference)
  if (!policy.ok) {
    throw new EngineInvariantError(
      `la política de score competitivo no existe: ${scoreReference}`,
    )
  }
  return {
    ...createGrade7ComposedDependencies(),
    competitiveScore: policy.value,
  }
}

/** El descriptor de una partida competitiva de 7.º, con su `scoreVersion`. */
export function createGrade7CompetitiveRunDescriptor(
  seed: string,
  overrides: Partial<
    Pick<RunDescriptor, 'runId' | 'mode' | 'difficulty' | 'scoreVersion'>
  > = {},
): Result<RunDescriptor, CompositionFailure> {
  const composed = createGrade7ComposedRunDescriptor(seed, overrides)
  if (!composed.ok) {
    return composed
  }
  return ok({
    ...composed.value,
    scoreVersion: overrides.scoreVersion ?? candidateFairScorePolicy.version,
  })
}

export {
  GRADE_7_COMPOSED_RULESET_VERSION,
  GRADE_7_CONTENT_VERSION,
  GRADE_7_RULESET_VERSION,
  GRADE_7_VARIANT_CATALOG_VERSION,
} from './versions'
export {
  grade7CompositionPolicy,
  GRADE_7_HOSTABLE_TEMPLATES,
} from './composition'
/**
 * El descriptor de una run nueva de 7.º grado.
 *
 * Vive acá porque las versiones que una run declara son propiedad del content
 * set: la del ruleset, la del contenido y la del catálogo aprobado del que sale
 * lo que se va a jugar. Un llamador que las arme a mano puede olvidarse de la
 * última, y entonces el motor rechaza la run — que es correcto, pero es un
 * error que no debería poder cometerse.
 */
export function createGrade7RunDescriptor(
  seed: string,
  overrides: Partial<Pick<RunDescriptor, 'runId' | 'mode' | 'difficulty'>> = {},
): RunDescriptor {
  return {
    runId: overrides.runId ?? toRunId(`run-${seed}`),
    seed: toRunSeed(seed),
    // El slice es local: no hay ranking, así que la run no es competitiva.
    mode: overrides.mode ?? 'practice',
    difficulty: overrides.difficulty ?? 'adaptive',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: GRADE_7_RULESET_VERSION,
    contentVersion: GRADE_7_CONTENT_VERSION,
    variantCatalogVersion: GRADE_7_VARIANT_CATALOG_VERSION,
  }
}

/**
 * El descriptor de una partida compuesta de 7.º.
 *
 * Compone el plan y estampa su huella. Estampar la huella es lo que convierte
 * «esta run juega este año» en algo que el motor puede comprobar: si la
 * calibración se movió entre que la run se creó y que se la reproduce,
 * `createRun` la rechaza en vez de jugar otro año con la misma identidad.
 */
export function createGrade7ComposedRunDescriptor(
  seed: string,
  overrides: Partial<Pick<RunDescriptor, 'runId' | 'mode' | 'difficulty'>> = {},
): Result<RunDescriptor, CompositionFailure> {
  const dependencies = createGrade7ComposedDependencies()
  const composed = composeRun({
    seed: toRunSeed(seed),
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    approvedVariants: grade7ApprovedVariants,
    policy: grade7CompositionPolicy,
  })

  if (!composed.ok) {
    return composed
  }

  return ok({
    runId: overrides.runId ?? toRunId(`run-${seed}`),
    seed: toRunSeed(seed),
    mode: overrides.mode ?? 'practice',
    difficulty: overrides.difficulty ?? 'adaptive',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: GRADE_7_COMPOSED_RULESET_VERSION,
    contentVersion: GRADE_7_CONTENT_VERSION,
    variantCatalogVersion: GRADE_7_VARIANT_CATALOG_VERSION,
    planFingerprint: planFingerprint(composed.value),
  })
}

export { grade7Storylets, grade7StoryletIds } from './storylets'
export { grade7TeacherDemoPlan, GRADE_7_DEMO_PLAN_ID } from './demo-plan'
export { grade7Families } from './families'
export {
  grade7ApprovedVariants,
  grade7VariantCatalog,
  grade7VariantCatalogs,
} from './variant-catalogs'
