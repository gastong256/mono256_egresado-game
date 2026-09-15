import {
  COMPOSITION_OBJECTIVES,
  candidateDifficultyCostPolicy,
  fullCareerV1Constraints,
  stageCompositionPolicy,
  type CareerConstraints,
  type CompositionPolicy,
} from '@/game'
import { grade1CompositionPolicy } from '@/content/grade-1'

/** Still partial: three real stages, never the official nine-beat career. */
export const grade2PartialConstraints: CareerConstraints = {
  ...fullCareerV1Constraints,
  id: 'grade-7-through-2-partial',
  version: '1.0.0-candidate',
  scope: 'partial-development',
  requiredStages: ['grade-7', 'year-1', 'year-2'],
  ordinaryBeats: { min: 6, max: 6 },
  bands: {
    core: { min: 0, max: 6 },
    standard: { min: 0, max: 6 },
    stretch: { min: 0, max: 3 },
  },
  pacing: {
    QUICK: { min: 0, max: 6 },
    MEDIUM: { min: 0, max: 6 },
    DEEP: { min: 0, max: 2 },
  },
  minReasoningFamilies: 2,
  minInteractionEngines: 2,
  minDataOrLogic: 1,
  preferredEngines: 0,
  preferredProjectMin: 0,
}

export const grade2CompositionPolicy: CompositionPolicy = {
  id: 'grade-7-through-2',
  version: '1.0.0-candidate',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: COMPOSITION_OBJECTIVES.filter(
    (objective) =>
      objective === 'family-variety' || objective === 'template-freshness',
  ),
  stages: [
    ...grade1CompositionPolicy.stages,
    stageCompositionPolicy('year-2', {
      ordinaryBeats: { min: 2, max: 2 },
      difficulty: { target: 300, tolerance: 150 },
      narrativeBeats: 2,
    }),
  ],
  career: grade2PartialConstraints,
}
