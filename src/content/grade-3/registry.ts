import {
  createContentCatalog,
  toScenarioFamilyId,
  type ChallengeDefinition,
  type ContentCatalog,
  type ScenarioFamilyDefinition,
} from '@/game'
import { grade2CatalogParts } from '@/content/grade-2/registry'
import { friendDay } from './challenges/friend-day'
import {
  courseProjectTech,
  rateCapacityReview,
} from './challenges/course-project-tech'
import { weekPlanner } from './challenges/week-planner'
import { fixedVariableReview, transportPass } from './challenges/transport-pass'
import { routePlan } from './challenges/route-plan'

export const grade3Challenges: readonly ChallengeDefinition[] = [
  courseProjectTech,
  friendDay,
  weekPlanner,
  transportPass,
  routePlan,
  rateCapacityReview,
  fixedVariableReview,
]

/**
 * Families new to 3.º.
 *
 * `proyecto-del-curso` is not here: the recurring arc already has its family
 * from 1.º, and the tech fair belongs to it, which is the point of an arc.
 */
export const grade3Families: readonly ScenarioFamilyDefinition[] = [
  {
    id: toScenarioFamilyId('dia-del-amigo'),
    labelKey: 'family.dia-del-amigo',
    summary: 'Organizar una salida con gente que no está toda a la misma hora.',
  },
  {
    id: toScenarioFamilyId('semana-propia'),
    labelKey: 'family.semana-propia',
    summary: 'Repartir la semana propia entre lo que vence y lo que se quiere.',
  },
  {
    id: toScenarioFamilyId('transporte'),
    labelKey: 'family.transporte',
    summary: 'Elegir cómo pagar lo que se usa muchas veces.',
  },
  {
    id: toScenarioFamilyId('barrio'),
    labelKey: 'family.barrio',
    summary: 'Recorrer el barrio con horarios y distancias.',
  },
]

export function grade3CatalogParts(): {
  readonly families: readonly ScenarioFamilyDefinition[]
  readonly challenges: readonly ChallengeDefinition[]
} {
  const parts = grade2CatalogParts()
  return {
    families: [...parts.families, ...grade3Families],
    challenges: [...parts.challenges, ...grade3Challenges],
  }
}

export function createGrade3Catalog(): ContentCatalog {
  const parts = grade3CatalogParts()
  return createContentCatalog(parts.families, parts.challenges)
}
