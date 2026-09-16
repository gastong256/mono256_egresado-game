import {
  createContentCatalog,
  toScenarioFamilyId,
  type ChallengeDefinition,
  type ContentCatalog,
  type ScenarioFamilyDefinition,
} from '@/game'
import { grade3CatalogParts } from '@/content/grade-3/registry'
import { shiftCoverage } from './challenges/shift-coverage'
import {
  courseProjectFundraiser,
  marginReview,
} from './challenges/course-project-fundraiser'
import { schoolEventFlow } from './challenges/school-event-flow'
import {
  eventFloorPlan,
  spatialCapacityReview,
} from './challenges/event-floor-plan'
import { representClass } from './challenges/represent-class'

export const grade4Challenges: readonly ChallengeDefinition[] = [
  courseProjectFundraiser,
  shiftCoverage,
  schoolEventFlow,
  eventFloorPlan,
  representClass,
  marginReview,
  spatialCapacityReview,
]

/**
 * Families new to 4.º.
 *
 * `course-project` is not here: the recurring arc already has its family, and
 * the fundraiser belongs to it.
 */
export const grade4Families: readonly ScenarioFamilyDefinition[] = [
  {
    id: toScenarioFamilyId('evento-escolar'),
    labelKey: 'family.evento-escolar',
    summary: 'Hacer que el evento del colegio funcione para los que vienen.',
  },
  {
    id: toScenarioFamilyId('consejo-escolar'),
    labelKey: 'family.consejo-escolar',
    summary: 'Llevar lo que el curso quiere a donde se decide.',
  },
]

export function grade4CatalogParts(): {
  readonly families: readonly ScenarioFamilyDefinition[]
  readonly challenges: readonly ChallengeDefinition[]
} {
  const parts = grade3CatalogParts()
  return {
    families: [...parts.families, ...grade4Families],
    challenges: [...parts.challenges, ...grade4Challenges],
  }
}

export function createGrade4Catalog(): ContentCatalog {
  const parts = grade4CatalogParts()
  return createContentCatalog(parts.families, parts.challenges)
}
