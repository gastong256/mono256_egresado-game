import {
  PRIMARY_REASONING_FAMILIES,
  type PrimaryReasoningFamily,
  type PacingClass,
} from '../challenges/composition-metadata'
import type { DifficultyBand } from '../difficulty/cognitive'
import { isStageId, stageIndex, type StageId } from '../progression/stages'

export interface CountRange {
  readonly min: number
  readonly max: number
}

/** Versioned product configuration, not fixed constants inside the algorithm. */
export interface CareerConstraints {
  readonly id: string
  readonly version: string
  readonly scope: 'partial-development' | 'full-career'
  readonly requiredStages: readonly StageId[]
  readonly ordinaryBeats: CountRange
  readonly bands: Readonly<Record<DifficultyBand, CountRange>>
  readonly pacing: Readonly<Record<PacingClass, CountRange>>
  readonly minReasoningFamilies: number
  readonly minInteractionEngines: number
  readonly maxByReasoning: Readonly<
    Partial<Record<PrimaryReasoningFamily, number>>
  >
  readonly minDataOrLogic: number
  readonly maxPerEventCluster: number
  readonly projectArc: CountRange
  readonly preferredEngines: number
  readonly preferredProjectMin: number
  readonly preferNonconsecutiveProject: boolean
  /** If exhausted, fail explicitly; never return an unproven local optimum. */
  readonly maxSearchNodes: number
}

/** Product-direction calibration; official eligibility remains a server concern. */
export const fullCareerV1Constraints: CareerConstraints = {
  id: 'full-career-v1',
  version: '1.0.0-candidate',
  scope: 'full-career',
  requiredStages: ['grade-7', 'year-1', 'year-2', 'year-3', 'year-4', 'year-5'],
  ordinaryBeats: { min: 9, max: 9 },
  bands: {
    core: { min: 2, max: 3 },
    standard: { min: 4, max: 5 },
    stretch: { min: 1, max: 2 },
  },
  pacing: {
    QUICK: { min: 2, max: 4 },
    MEDIUM: { min: 4, max: 5 },
    DEEP: { min: 1, max: 2 },
  },
  minReasoningFamilies: 4,
  minInteractionEngines: 3,
  maxByReasoning: { TEMPORAL: 3, ECONOMIC_PROPORTIONAL: 2 },
  minDataOrLogic: 1,
  maxPerEventCluster: 1,
  projectArc: { min: 0, max: 2 },
  preferredEngines: 4,
  preferredProjectMin: 1,
  preferNonconsecutiveProject: true,
  maxSearchNodes: 1_000_000,
}

export function careerConstraintIssues(
  c: CareerConstraints,
): readonly string[] {
  const issues: string[] = []
  if (c.id.trim() === '' || c.version.trim() === '')
    issues.push('career constraints need identity and version')
  if (
    c.requiredStages.length === 0 ||
    new Set(c.requiredStages).size !== c.requiredStages.length
  )
    issues.push('career stages must be nonempty and unique')
  if (c.scope !== 'partial-development' && c.scope !== 'full-career')
    issues.push('unknown career scope')
  if (
    c.requiredStages.some(
      (stage, i) =>
        !isStageId(stage) ||
        stage === 'graduation' ||
        (i > 0 && stageIndex(stage) <= stageIndex(c.requiredStages[i - 1]!)),
    )
  )
    issues.push('career stages must be ordered academic stages')
  if (
    Object.keys(c.maxByReasoning).some(
      (key) => !PRIMARY_REASONING_FAMILIES.some((family) => family === key),
    )
  )
    issues.push('unknown reasoning quota')
  if (
    Object.keys(c.bands).sort().join(',') !== 'core,standard,stretch' ||
    Object.keys(c.pacing).sort().join(',') !== 'DEEP,MEDIUM,QUICK'
  )
    issues.push('career needs all band and pacing ranges')
  const ranges = [
    c.ordinaryBeats,
    ...Object.values(c.bands),
    ...Object.values(c.pacing),
    c.projectArc,
  ]
  if (
    ranges.some(
      (r) =>
        !Number.isSafeInteger(r.min) ||
        !Number.isSafeInteger(r.max) ||
        r.min < 0 ||
        r.max < r.min,
    )
  )
    issues.push('invalid career count range')
  const counts = [
    c.minReasoningFamilies,
    c.minInteractionEngines,
    c.minDataOrLogic,
    c.maxPerEventCluster,
    c.preferredEngines,
    c.preferredProjectMin,
    ...Object.values(c.maxByReasoning),
  ]
  if (counts.some((n) => !Number.isSafeInteger(n) || n < 0))
    issues.push('invalid career count')
  if (
    !Number.isSafeInteger(c.maxSearchNodes) ||
    c.maxSearchNodes < 1 ||
    c.maxSearchNodes > 10_000_000
  )
    issues.push('invalid bounded search budget')
  if (
    c.scope === 'full-career' &&
    c.requiredStages.join(',') !== 'grade-7,year-1,year-2,year-3,year-4,year-5'
  )
    issues.push('full career requires all six ordered stages')
  return issues
}
