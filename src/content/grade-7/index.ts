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
  createChallengeRegistry,
  createRuleset,
  EngineInvariantError,
  toContentSetId,
  toRulesetId,
  type ChallengeDefinition,
  type EngineDependencies,
  type Ruleset,
  type StageConfig,
} from '@/game'
import { developmentDifficultyPolicy } from '@/game/difficulty/development-policy'
import { developmentProfilePolicy } from '@/game/profiles/development-policy'
import { developmentScoringPolicy } from '@/game/scoring/development-policy'

import { busTiming } from './challenges/bus-timing'
import { groupTasks } from './challenges/group-tasks'
import { may25Act } from './challenges/may-25-act'
import { muralPaint } from './challenges/mural-paint'
import { notebookOffer } from './challenges/notebook-offer'
import { standSupplies } from './challenges/stand-supplies'
import { grade7Storylets } from './storylets'

/*
 * Las dos versiones suben juntas a 0.3.0 por el acto del 25 de Mayo: el
 * contenido cambió —hay un desafío y un storylet nuevos— y la configuración de
 * la etapa también, porque el año pasó a jugar ocho eventos y habilitó una
 * categoría matemática más. Un checkpoint 0.2.0 no reproduce este año, y ése es
 * exactamente el trabajo del triple de versiones.
 */
export const GRADE_7_RULESET_VERSION = '0.3.0-grade-7'
export const GRADE_7_CONTENT_VERSION = '0.3.0-grade-7'

/** Los seis desafíos jugables de 7.º grado. */
export const grade7Challenges: readonly ChallengeDefinition[] = [
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
 * Ocho eventos: los seis desafíos más la apertura y la bifurcación narrativa.
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
    challenges: createChallengeRegistry(grade7Challenges),
    storylets: grade7Storylets,
  }
}

export { grade7Storylets, grade7StoryletIds } from './storylets'
