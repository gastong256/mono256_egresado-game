import {
  COMPOSITION_OBJECTIVES,
  candidateDifficultyCostPolicy,
  fullCareerV1Constraints,
  stageCompositionPolicy,
  type CareerConstraints,
  type CompositionPolicy,
} from '@/game'
import { grade2CompositionPolicy } from '@/content/grade-2'

/** Still partial: four real stages, never the official nine-beat career. */
export const grade3PartialConstraints: CareerConstraints = {
  ...fullCareerV1Constraints,
  id: 'grade-7-through-3-partial',
  version: '1.0.0-candidate',
  scope: 'partial-development',
  requiredStages: ['grade-7', 'year-1', 'year-2', 'year-3'],
  ordinaryBeats: { min: 8, max: 8 },
  bands: {
    core: { min: 0, max: 8 },
    standard: { min: 0, max: 8 },
    stretch: { min: 0, max: 4 },
  },
  pacing: {
    QUICK: { min: 0, max: 8 },
    MEDIUM: { min: 0, max: 8 },
    DEEP: { min: 0, max: 3 },
  },
  minReasoningFamilies: 3,
  minInteractionEngines: 3,
  minDataOrLogic: 1,
  preferredEngines: 0,
  preferredProjectMin: 0,
}

export const grade3CompositionPolicy: CompositionPolicy = {
  id: 'grade-7-through-3',
  version: '1.0.0-candidate',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  /**
   * `cognitive-variety` entra acá porque 3.º lo pide: la preferencia blanda de
   * su diseño es evitar dos construcciones que piden lo mismo —la semana y el
   * recorrido tienen casi el mismo vector de rasgos— cuando hay una composición
   * igualmente válida y más diversa. Sigue siendo blanda: ordena planes
   * válidos, no filtra ninguno.
   */
  objectives: COMPOSITION_OBJECTIVES.filter(
    (objective) =>
      objective === 'family-variety' ||
      objective === 'cognitive-variety' ||
      objective === 'template-freshness',
  ),
  stages: [
    ...grade2CompositionPolicy.stages,
    stageCompositionPolicy('year-3', {
      ordinaryBeats: { min: 2, max: 2 },
      difficulty: { target: 320, tolerance: 160 },
      narrativeBeats: 2,
    }),
  ],
  career: grade3PartialConstraints,
}
