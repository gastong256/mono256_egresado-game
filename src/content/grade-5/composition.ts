import {
  COMPOSITION_OBJECTIVES,
  candidateDifficultyCostPolicy,
  fullCareerV1Constraints,
  stageCompositionPolicy,
  type CareerConstraints,
  type CompositionPolicy,
} from '@/game'
import { grade4CompositionPolicy } from '@/content/grade-4'

/**
 * La carrera entera, por primera vez: seis etapas reales.
 *
 * Sigue siendo desarrollo —`official: false` y `partial-development`— porque el
 * presupuesto oficial de nueve beats y su calibración se cierran en la
 * integración. Lo que cambia acá es que ya no falta ningún año.
 */
export const grade5PartialConstraints: CareerConstraints = {
  ...fullCareerV1Constraints,
  id: 'grade-7-through-5-partial',
  version: '1.0.0-candidate',
  scope: 'partial-development',
  requiredStages: ['grade-7', 'year-1', 'year-2', 'year-3', 'year-4', 'year-5'],
  ordinaryBeats: { min: 12, max: 12 },
  bands: {
    core: { min: 0, max: 12 },
    standard: { min: 0, max: 12 },
    stretch: { min: 0, max: 6 },
  },
  pacing: {
    QUICK: { min: 0, max: 12 },
    MEDIUM: { min: 0, max: 12 },
    DEEP: { min: 0, max: 5 },
  },
  minReasoningFamilies: 5,
  minInteractionEngines: 3,
  minDataOrLogic: 1,
  preferredEngines: 0,
  preferredProjectMin: 0,
}

export const grade5CompositionPolicy: CompositionPolicy = {
  id: 'grade-7-through-5',
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
    ...grade4CompositionPolicy.stages,
    stageCompositionPolicy('year-5', {
      ordinaryBeats: { min: 2, max: 2 },
      difficulty: { target: 360, tolerance: 180 },
      narrativeBeats: 2,
    }),
  ],
  career: grade5PartialConstraints,
}
