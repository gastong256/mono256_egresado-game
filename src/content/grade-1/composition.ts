import {
  COMPOSITION_OBJECTIVES,
  candidateDifficultyCostPolicy,
  fullCareerV1Constraints,
  stageCompositionPolicy,
  type CompositionPolicy,
  type CareerConstraints,
} from '@/game'
import { grade7CompositionPolicy } from '@/content/grade-7'

/** Partial means partial: two real stages, never a fake nine-beat official career. */
export const grade1PartialConstraints: CareerConstraints = {
  ...fullCareerV1Constraints,
  id: 'grade-7-through-1-partial',
  version: '1.0.0-candidate',
  scope: 'partial-development',
  requiredStages: ['grade-7', 'year-1'],
  ordinaryBeats: { min: 4, max: 4 },
  bands: {
    core: { min: 0, max: 4 },
    standard: { min: 0, max: 4 },
    stretch: { min: 0, max: 2 },
  },
  pacing: {
    QUICK: { min: 0, max: 4 },
    MEDIUM: { min: 0, max: 4 },
    DEEP: { min: 0, max: 2 },
  },
  minReasoningFamilies: 1,
  minInteractionEngines: 1,
  minDataOrLogic: 0,
  preferredEngines: 0,
  preferredProjectMin: 0,
}
export const grade1CompositionPolicy: CompositionPolicy = {
  id: 'grade-7-through-1',
  version: '1.0.0-candidate',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  // This partial practice admits the whole declared difficulty envelope. A
  // single preferred cost would permanently exclude an anchor (e.g. 310 vs
  // 250) rather than measure full-career balance. Calibration stays candidate.
  objectives: COMPOSITION_OBJECTIVES.filter(
    (objective) =>
      objective === 'family-variety' || objective === 'template-freshness',
  ),
  stages: [
    ...grade7CompositionPolicy.stages.map((stage) => ({
      ...stage,
      ordinaryBeats: { min: 2, max: 2 },
    })),
    stageCompositionPolicy('year-1', {
      ordinaryBeats: { min: 2, max: 2 },
      difficulty: { target: 275, tolerance: 125 },
      narrativeBeats: 2,
    }),
  ],
  career: grade1PartialConstraints,
}
