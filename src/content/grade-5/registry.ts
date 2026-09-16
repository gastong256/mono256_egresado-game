import {
  createContentCatalog,
  toScenarioFamilyId,
  type ChallengeDefinition,
  type ContentCatalog,
  type ScenarioFamilyDefinition,
} from '@/game'
import { grade4CatalogParts } from '@/content/grade-4/registry'
import {
  finalTripOrEvent,
  multiOptionComparisonReview,
} from './challenges/final-trip'
import { courseProjectFinal } from './challenges/course-project-final'
import { stageScreen } from './challenges/stage-screen'
import { proportionCapacityReview, yearbook } from './challenges/yearbook'
import { nextStepOptions } from './challenges/next-step-options'

export const grade5Challenges: readonly ChallengeDefinition[] = [
  finalTripOrEvent,
  courseProjectFinal,
  stageScreen,
  yearbook,
  nextStepOptions,
  multiOptionComparisonReview,
  proportionCapacityReview,
]

/**
 * Families new to 5.º.
 *
 * `course-project` is not here: the recurring arc closes with the year but its
 * family is the one it always had.
 */
export const grade5Families: readonly ScenarioFamilyDefinition[] = [
  {
    id: toScenarioFamilyId('egreso'),
    labelKey: 'family.egreso',
    summary: 'Cerrar el colegio: el viaje, el acto y el anuario.',
  },
  {
    id: toScenarioFamilyId('despues-del-colegio'),
    labelKey: 'family.despues-del-colegio',
    summary: 'Mirar qué entra en el año que viene, sin decidir por nadie.',
  },
]

export function grade5CatalogParts(): {
  readonly families: readonly ScenarioFamilyDefinition[]
  readonly challenges: readonly ChallengeDefinition[]
} {
  const parts = grade4CatalogParts()
  return {
    families: [...parts.families, ...grade5Families],
    challenges: [...parts.challenges, ...grade5Challenges],
  }
}

export function createGrade5Catalog(): ContentCatalog {
  const parts = grade5CatalogParts()
  return createContentCatalog(parts.families, parts.challenges)
}
