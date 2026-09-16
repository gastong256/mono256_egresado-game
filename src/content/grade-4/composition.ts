import {
  COMPOSITION_OBJECTIVES,
  candidateDifficultyCostPolicy,
  fullCareerV1Constraints,
  stageCompositionPolicy,
  type CareerConstraints,
  type CompositionPolicy,
} from '@/game'
import { grade3CompositionPolicy } from '@/content/grade-3'

/** Still partial: five real stages, never the official nine-beat career. */
export const grade4PartialConstraints: CareerConstraints = {
  ...fullCareerV1Constraints,
  id: 'grade-7-through-4-partial',
  version: '1.0.0-candidate',
  scope: 'partial-development',
  requiredStages: ['grade-7', 'year-1', 'year-2', 'year-3', 'year-4'],
  ordinaryBeats: { min: 10, max: 10 },
  bands: {
    core: { min: 0, max: 10 },
    standard: { min: 0, max: 10 },
    stretch: { min: 0, max: 5 },
  },
  pacing: {
    QUICK: { min: 0, max: 10 },
    MEDIUM: { min: 0, max: 10 },
    DEEP: { min: 0, max: 4 },
  },
  minReasoningFamilies: 4,
  minInteractionEngines: 3,
  minDataOrLogic: 1,
  preferredEngines: 0,
  preferredProjectMin: 0,
}

export const grade4CompositionPolicy: CompositionPolicy = {
  id: 'grade-7-through-4',
  version: '1.0.0-candidate',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: COMPOSITION_OBJECTIVES.filter(
    (objective) =>
      objective === 'family-variety' ||
      objective === 'cognitive-variety' ||
      objective === 'template-freshness',
  ),
  stages: [
    ...grade3CompositionPolicy.stages,
    stageCompositionPolicy('year-4', {
      ordinaryBeats: { min: 2, max: 2 },
      difficulty: { target: 340, tolerance: 170 },
      narrativeBeats: 2,
    }),
  ],
  career: grade4PartialConstraints,
}
