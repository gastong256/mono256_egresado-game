/**
 * Composition-only proof spanning the six playable academic stages.
 *
 * Production content still covers 7.º only. This fixture therefore clones the
 * metadata of development templates under test-only ids and gives every stage
 * two anchors and two secondaries. It is intentionally not wired to a ruleset
 * or storylets: its sole job is to prove that the generic composer and its
 * independent validator can schedule a full career without production content
 * pretending to exist.
 */

import { createContentCatalog } from '../../challenges/content-catalog'
import type { ChallengeDefinition } from '../../challenges/contracts'
import { toChallengeId } from '../../core/branded'
import { bandOf, type CognitiveProfile } from '../../difficulty/cognitive'
import { candidateDifficultyCostPolicy } from '../../difficulty/cost-policy'
import {
  COMPOSITION_OBJECTIVES,
  stageCompositionPolicy,
  type CompositionPolicy,
} from '../../plan/composition-policy'
import type { StageId } from '../../progression/stages'
import { developmentChallenges } from './development-ruleset'
import { developmentFamilies } from './families'

export const SYNTHETIC_SIX_STAGE_IDS: readonly StageId[] = [
  'grade-7',
  'year-1',
  'year-2',
  'year-3',
  'year-4',
  'year-5',
]

const CORE: CognitiveProfile = {
  steps: 1,
  constraints: 1,
  selection: 1,
  optimization: 0,
  uncertainty: 0,
  construction: 0,
}

const STANDARD: CognitiveProfile = {
  steps: 2,
  constraints: 1,
  selection: 1,
  optimization: 1,
  uncertainty: 1,
  construction: 0,
}

const STRETCH: CognitiveProfile = {
  steps: 2,
  constraints: 2,
  selection: 2,
  optimization: 2,
  uncertainty: 0,
  construction: 1,
}

interface SyntheticStageShape {
  readonly stageId: StageId
  readonly anchor: CognitiveProfile
  readonly secondary: CognitiveProfile
  readonly target: number
}

const STAGE_SHAPES: readonly SyntheticStageShape[] = [
  { stageId: 'grade-7', anchor: CORE, secondary: STANDARD, target: 250 },
  { stageId: 'year-1', anchor: STANDARD, secondary: STANDARD, target: 300 },
  { stageId: 'year-2', anchor: CORE, secondary: STRETCH, target: 310 },
  { stageId: 'year-3', anchor: STANDARD, secondary: STRETCH, target: 360 },
  { stageId: 'year-4', anchor: STRETCH, secondary: STRETCH, target: 420 },
  { stageId: 'year-5', anchor: STRETCH, secondary: STRETCH, target: 420 },
]

const anchorBases = developmentChallenges.filter(
  (template) => template.placement === 'anchor',
)
const secondaryBases = developmentChallenges.filter(
  (template) =>
    template.placement === 'checkpoint' || template.placement === 'special',
)

function baseAt(
  bases: readonly ChallengeDefinition[],
  index: number,
): ChallengeDefinition {
  const base = bases[index % bases.length]
  if (base === undefined) {
    throw new Error('the synthetic composition fixture has no base template')
  }
  return base
}

function cloneForComposition(
  base: ChallengeDefinition,
  stageId: StageId,
  slot: string,
  cognitive: CognitiveProfile,
): ChallengeDefinition {
  return {
    ...base,
    id: toChallengeId(`test.six-stage.${stageId}.${slot}`),
    stages: [stageId],
    cognitive,
    band: bandOf(cognitive),
  }
}

const syntheticTemplates = STAGE_SHAPES.flatMap((shape, index) => [
  cloneForComposition(
    baseAt(anchorBases, index),
    shape.stageId,
    'anchor-a',
    shape.anchor,
  ),
  cloneForComposition(
    baseAt(anchorBases, index),
    shape.stageId,
    'anchor-b',
    shape.anchor,
  ),
  cloneForComposition(
    baseAt(secondaryBases, index),
    shape.stageId,
    'secondary-a',
    shape.secondary,
  ),
  cloneForComposition(
    baseAt(secondaryBases, index),
    shape.stageId,
    'secondary-b',
    shape.secondary,
  ),
])

export const syntheticSixStageCompositionPolicy: CompositionPolicy = {
  id: 'synthetic-six-stage-composition',
  version: '1.0.0-test',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: [...COMPOSITION_OBJECTIVES],
  stages: STAGE_SHAPES.map((shape) =>
    stageCompositionPolicy(shape.stageId, {
      ordinaryBeats: { min: 2, max: 2 },
      difficulty: { target: shape.target, tolerance: 0 },
      narrativeBeats: 1,
    }),
  ),
}

export function createSyntheticSixStageCompositionCatalog() {
  return createContentCatalog(developmentFamilies, syntheticTemplates)
}
