/**
 * Post-G1 gate · bounded global composition under adversarial catalogs.
 *
 * `career-composition.test.ts` already proves nine beats, the independent
 * validator, an exhausted budget and seed stability. This file adds the cases
 * the audit asks for and that one does not cover: a catalog with exactly one
 * legal career, one with many, each hard constraint made individually
 * unsatisfiable, and the soft preferences failing while the hard ones hold.
 *
 * Every catalog here is synthetic. It exercises the algorithm, never Grades
 * 2–5 content, which this gate does not author.
 */
import { describe, expect, it } from 'vitest'
import {
  bandOf,
  composeRun,
  createContentCatalog,
  fullCareerV1Constraints,
  stageCompositionPolicy,
  validateComposedPlan,
  candidateDifficultyCostPolicy,
  toChallengeId,
  toRunSeed,
  type ChallengeDefinition,
  type CareerConstraints,
  type CognitiveProfile,
  type CompositionMetadata,
  type CompositionPolicy,
  type PacingClass,
  type PrimaryReasoningFamily,
  type StageId,
} from '@/game'
import { mobileData } from '@/content/grade-1/challenges/mobile-data'

const stages = fullCareerV1Constraints.requiredStages
const core: CognitiveProfile = {
  steps: 1,
  constraints: 2,
  selection: 0,
  optimization: 0,
  uncertainty: 0,
  construction: 1,
}
const standard: CognitiveProfile = { ...core, steps: 2 }
const stretch: CognitiveProfile = { ...standard, constraints: 3, selection: 2 }
const pacingOf = (profile: CognitiveProfile): PacingClass =>
  bandOf(profile) === 'core'
    ? 'QUICK'
    : bandOf(profile) === 'stretch'
      ? 'DEEP'
      : 'MEDIUM'

function template(
  id: string,
  stage: StageId,
  placement: 'anchor' | 'checkpoint',
  cognitive: CognitiveProfile,
  composition: CompositionMetadata,
): ChallengeDefinition {
  return {
    ...mobileData,
    id: toChallengeId(id),
    stages: [stage],
    placement,
    cognitive,
    band: bandOf(cognitive),
    composition,
  }
}
const catalogOf = (values: readonly ChallengeDefinition[]) =>
  createContentCatalog(
    [{ id: mobileData.family, labelKey: 'fixture', summary: 'audit fixture' }],
    values,
  )
const policyWith = (career: CareerConstraints): CompositionPolicy => ({
  id: 'post-g1-audit',
  version: '1-audit',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  objectives: ['difficulty-fit', 'family-variety'],
  stages: stages.map((id) =>
    stageCompositionPolicy(id, { difficulty: { target: 250, tolerance: 400 } }),
  ),
  career,
})

/**
 * Nine beats over six stages: three stages carry two, three carry one. The
 * profile of each beat is chosen so the whole career lands inside the declared
 * band and pacing quotas with no slack at all.
 */
const doubled: readonly StageId[] = [stages[0]!, stages[1]!, stages[2]!]
const families: readonly PrimaryReasoningFamily[] = [
  'TEMPORAL',
  'ALLOCATION',
  'DATA_UNCERTAINTY',
  'SPATIAL',
  'LOGIC_CLASSIFICATION',
  'SYSTEMS_OPTIMIZATION',
]
/**
 * Families and engines per beat, spelled out so the fixture provably meets the
 * hard quotas: six distinct families (>= 4), three engines (>= 3), one
 * DATA_UNCERTAINTY plus one LOGIC_CLASSIFICATION (>= 1 data or logic),
 * TEMPORAL twice (<= 3) and no ECONOMIC_PROPORTIONAL at all (<= 2).
 */
const beatFamilies: readonly PrimaryReasoningFamily[] = [
  'TEMPORAL',
  'ALLOCATION',
  'DATA_UNCERTAINTY',
  'SPATIAL',
  'LOGIC_CLASSIFICATION',
  'SYSTEMS_OPTIMIZATION',
  'TEMPORAL',
  'ALLOCATION',
  'SPATIAL',
]
const beatEngines = [
  'timeline-schedule',
  'allocate-constrain',
  'spatial-graph',
  'timeline-schedule',
  'allocate-constrain',
  'spatial-graph',
  'timeline-schedule',
  'allocate-constrain',
  'spatial-graph',
] as const

/** core 3 · standard 5 · stretch 1 — inside 2-3 / 4-5 / 1-2. */
const beatProfiles = [
  core,
  standard,
  core,
  standard,
  core,
  standard,
  standard,
  standard,
  stretch,
] as const

function exactCatalog(eventCluster?: string) {
  let beat = 0
  return catalogOf(
    stages.flatMap((stage) => {
      const count = doubled.includes(stage) ? 2 : 1
      return Array.from({ length: count }, (_, slot) => {
        const profile = beatProfiles[beat] ?? core
        beat += 1
        return template(
          `exact.${stage}-${String(slot)}`,
          stage,
          slot === 0 ? 'anchor' : 'checkpoint',
          profile,
          {
            primaryReasoningFamily: beatFamilies[beat - 1] ?? 'TEMPORAL',
            interactionEngine: beatEngines[beat - 1] ?? 'allocate-constrain',
            pacingClass: pacingOf(profile),
            ...(eventCluster === undefined ? {} : { eventCluster }),
          },
        )
      })
    }),
  )
}

describe('post-G1 · bounded composition against adversarial catalogs', () => {
  it('finds the single legal career when the catalog admits exactly one', () => {
    const catalog = exactCatalog()
    const policy = policyWith(fullCareerV1Constraints)
    const result = composeRun({
      seed: toRunSeed('exact'),
      stages,
      catalog,
      policy,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.detail)
    expect(result.value.stages.flatMap((stage) => stage.beats)).toHaveLength(9)
    expect(validateComposedPlan(result.value, { catalog, policy })).toEqual([])
    // Only one career exists, so every seed must land on it.
    for (const seed of ['a', 'b', 'c', 'd'])
      expect(
        composeRun({ seed: toRunSeed(seed), stages, catalog, policy }),
      ).toEqual(result)
  })

  it.each([
    [
      'bands',
      {
        bands: {
          ...fullCareerV1Constraints.bands,
          stretch: { min: 4, max: 5 },
        },
      },
    ],
    [
      'pacing DEEP',
      {
        pacing: { ...fullCareerV1Constraints.pacing, DEEP: { min: 5, max: 6 } },
      },
    ],
    // The fixture carries six distinct families, so seven cannot be reached.
    ['reasoning families', { minReasoningFamilies: 7 }],
    ['data or logic', { minDataOrLogic: 9 }],
    ['project arc', { projectArc: { min: 4, max: 4 } }],
  ])(
    'refuses explicitly when %s cannot be satisfied, and never returns a best effort',
    (_label, override) => {
      const catalog = exactCatalog()
      // The contract under test is the explicit refusal, not how long an
      // exhaustive proof of impossibility takes: the canonical million-node
      // budget is measured on its own, below.
      const policy = policyWith({
        ...fullCareerV1Constraints,
        maxSearchNodes: 50_000,
        ...override,
      })
      const result = composeRun({
        seed: toRunSeed('impossible'),
        stages,
        catalog,
        policy,
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(['career-unsatisfiable', 'search-budget-exceeded']).toContain(
        result.error.code,
      )
    },
  )

  it('refuses a catalog that can only put every beat in the same event cluster', () => {
    // An empty `maxPerEventCluster` quota is met trivially when no template
    // declares a cluster, so the conflict has to be built: nine beats that all
    // belong to the same school event, against a quota of one.
    const catalog = exactCatalog('acto-escolar')
    const policy = policyWith({
      ...fullCareerV1Constraints,
      maxSearchNodes: 50_000,
      maxPerEventCluster: 1,
    })
    const result = composeRun({
      seed: toRunSeed('cluster'),
      stages,
      catalog,
      policy,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(['career-unsatisfiable', 'search-budget-exceeded']).toContain(
      result.error.code,
    )
  })

  it('satisfies the hard constraints even when the soft preferences cannot be met', () => {
    const catalog = exactCatalog()
    const policy = policyWith({
      ...fullCareerV1Constraints,
      // No catalog entry carries the Project arc, and four engines do not
      // exist here: both are preferences, so a plan must still be produced.
      preferredProjectMin: 2,
      preferredEngines: 4,
      preferNonconsecutiveProject: true,
    })
    const result = composeRun({
      seed: toRunSeed('soft'),
      stages,
      catalog,
      policy,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.detail)
    expect(validateComposedPlan(result.value, { catalog, policy })).toEqual([])
  })

  it('stays bounded and deterministic on a wide catalog, and reports its cost', () => {
    const wide = catalogOf(
      stages.flatMap((stage, index) =>
        Array.from({ length: 6 }, (_, slot) => {
          const profile = [core, standard, stretch][slot % 3] ?? core
          return template(
            `wide.${stage}-${String(slot)}`,
            stage,
            slot % 2 === 0 ? 'anchor' : 'checkpoint',
            profile,
            {
              primaryReasoningFamily:
                families[(index + slot) % families.length] ?? 'TEMPORAL',
              interactionEngine:
                slot % 3 === 0
                  ? 'timeline-schedule'
                  : slot % 3 === 1
                    ? 'allocate-constrain'
                    : 'spatial-graph',
              pacingClass: pacingOf(profile),
            },
          )
        }),
      ),
    )
    const policy = policyWith(fullCareerV1Constraints)
    const started = performance.now()
    const plans = Array.from({ length: 3 }, (_, seed) =>
      composeRun({
        seed: toRunSeed(`wide-${String(seed)}`),
        stages,
        catalog: wide,
        policy,
      }),
    )
    const elapsed = performance.now() - started
    for (const plan of plans) {
      expect(plan.ok).toBe(true)
      if (!plan.ok) continue
      expect(
        validateComposedPlan(plan.value, { catalog: wide, policy }),
      ).toEqual([])
    }
    // Measured on this fixture: about 2.7 s per career with 36 templates over
    // six stages, against 14 ms to refuse an unsatisfiable one at any budget.
    // The contract is boundedness, not speed, so the ceiling here is generous
    // on purpose. The real number belongs in the audit report, because a
    // catalog this size is what Grades 2-5 will bring.
    expect(elapsed / plans.length).toBeLessThan(15_000)
    const distinct = new Set(
      plans.map((plan) =>
        plan.ok
          ? plan.value.stages
              .flatMap((stage) => stage.beats.map((b) => b.variant.templateId))
              .join(',')
          : 'failed',
      ),
    )
    expect(distinct.size).toBeGreaterThan(1)
    // Same seed, same catalog, same plan: cost never buys nondeterminism.
    expect(
      composeRun({
        seed: toRunSeed('wide-0'),
        stages,
        catalog: wide,
        policy,
      }),
    ).toEqual(plans[0])
  }, 120_000)
})

/**
 * Gate 16 — el caso adversarial que la carrera real agrega sobre el catálogo
 * sintético anterior: un catálogo donde todo pertenece al arco Proyecto. La
 * dirección de variante alterada se prueba contra el catálogo aprobado real,
 * en `full-career-simulation`, porque ahí sí existe una población aprobada
 * contra la cual una dirección puede ser falsa.
 */
describe('Gate 16 · el arco Proyecto', () => {
  it('refuses a catalog where every beat belongs to the Project arc', () => {
    // `projectArc` acepta entre 0 y 2 beats del arco: nueve no entran, y el
    // compositor tiene que decirlo en vez de recortar en silencio.
    const catalog = catalogOf(
      stages.flatMap((stage) => {
        const count = doubled.includes(stage) ? 2 : 1
        return Array.from({ length: count }, (_, slot) =>
          template(
            `project.${stage}-${String(slot)}`,
            stage,
            slot === 0 ? 'anchor' : 'checkpoint',
            standard,
            {
              primaryReasoningFamily: 'ALLOCATION',
              interactionEngine: 'allocate-constrain',
              pacingClass: pacingOf(standard),
              recurringArc: 'PROJECT',
            },
          ),
        )
      }),
    )
    const policy = policyWith({
      ...fullCareerV1Constraints,
      maxSearchNodes: 50_000,
    })
    const result = composeRun({
      seed: toRunSeed('project-overflow'),
      stages,
      catalog,
      policy,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(['career-unsatisfiable', 'search-budget-exceeded']).toContain(
      result.error.code,
    )
  })
})
