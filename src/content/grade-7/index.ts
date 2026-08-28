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
  toRunId,
  toRunSeed,
  type ChallengeDefinition,
  type EngineDependencies,
  type RunDescriptor,
  type Ruleset,
  type StageConfig,
} from '@/game'
import { developmentDifficultyPolicy } from '@/game/difficulty/development-policy'
import { developmentProfilePolicy } from '@/game/profiles/development-policy'
import { developmentScoringPolicy } from '@/game/scoring/development-policy'

import { grade7Families } from './families'
import {
  GRADE_7_CONTENT_VERSION,
  GRADE_7_RULESET_VERSION,
  GRADE_7_VARIANT_CATALOG_VERSION,
} from './versions'
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

export {
  GRADE_7_CONTENT_VERSION,
  GRADE_7_RULESET_VERSION,
  GRADE_7_VARIANT_CATALOG_VERSION,
} from './versions'
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

export { grade7Storylets, grade7StoryletIds } from './storylets'
export { grade7TeacherDemoPlan, GRADE_7_DEMO_PLAN_ID } from './demo-plan'
export { grade7Families } from './families'
export {
  grade7ApprovedVariants,
  grade7VariantCatalog,
  grade7VariantCatalogs,
} from './variant-catalogs'
