import {
  createContentCatalog,
  toScenarioFamilyId,
  type ChallengeDefinition,
  type ContentCatalog,
  type ScenarioFamilyDefinition,
} from '@/game'
import { grade1CatalogParts } from '@/content/grade-1/registry'
import { teamKitOrder } from './challenges/team-kit-order'
import {
  courseProjectSurvey,
  dataClaimReview,
} from './challenges/course-project-survey'
import { standingsClaim } from './challenges/standings-claim'
import { courtZones } from './challenges/court-zones'
import { intercursoPlan } from './challenges/intercurso-plan'

export const grade2Challenges: readonly ChallengeDefinition[] = [
  courseProjectSurvey,
  intercursoPlan,
  courtZones,
  teamKitOrder,
  standingsClaim,
  dataClaimReview,
]

/**
 * Families new to 2.º.
 *
 * `course-project` is not here: the recurring arc already has its family from
 * 1.º and the survey belongs to it, which is the point of an arc.
 */
export const grade2Families: readonly ScenarioFamilyDefinition[] = [
  {
    id: toScenarioFamilyId('team-kit'),
    labelKey: 'family.team-kit',
    summary: 'Pedir lo que el curso necesita, en la proporción que hace falta.',
  },
  {
    id: toScenarioFamilyId('intercurso'),
    labelKey: 'family.intercurso',
    summary: 'Organizar el día del Intercurso y leer cómo va.',
  },
  {
    id: toScenarioFamilyId('court-space'),
    labelKey: 'family.court-space',
    summary: 'Repartir zonas y distancias en la cancha.',
  },
]

/**
 * The career content through 2.º, as parts.
 *
 * Same reason as in 1.º: a later year extends this list instead of rebuilding
 * the Grade-7 composition overlay, which would be a second place to keep in
 * sync.
 */
export function grade2CatalogParts(): {
  readonly families: readonly ScenarioFamilyDefinition[]
  readonly challenges: readonly ChallengeDefinition[]
} {
  const parts = grade1CatalogParts()
  return {
    families: [...parts.families, ...grade2Families],
    challenges: [...parts.challenges, ...grade2Challenges],
  }
}

export function createGrade2Catalog(): ContentCatalog {
  const parts = grade2CatalogParts()
  return createContentCatalog(parts.families, parts.challenges)
}
