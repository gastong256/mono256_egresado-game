import { describe, expect, it } from 'vitest'

import {
  activeInstanceId,
  canContinue,
  canSubmitAnswer,
  createChallengeRegistry,
  createRuleset,
  createRun,
  currentStage,
  EngineInvariantError,
  describeRejection,
  isErr,
  isRunComplete,
  pendingFeedback,
  restoreSnapshot,
  revealedInformation,
  runProgress,
  scorePreview,
  STAGE_ORDER,
  toContentSetId,
  toRulesetId,
  transition,
} from '@/game'
import {
  createDevelopmentChallengeRegistry,
  createDevelopmentDependencies,
  createDevelopmentRuleset,
  developmentRunDescriptor,
  simulateMany,
  simulateRun,
} from '@/game/testing'
import { nextStage, stageIndex, isStageId } from '@/game/progression/stages'
import { isNarrativeOnly } from '@/game/narrative/storylet'
import {
  applyStatEffects,
  clampStat,
  initialStats,
  isVisibleStat,
  readStat,
} from '@/game/progression/stats'
import {
  addQuantities,
  compareQuantities,
  formatMoney,
  formatQuantity,
  money,
  quantity,
  ratioOf,
  rectangleArea,
  scaleQuantity,
  serializeQuantity,
  subtractQuantities,
  toMinutes,
} from '@/game/math/quantity'
import { fromDecimalString, fromInteger } from '@/game/math/rational'
import { createRng } from '@/game/random/rng'
import { developmentScoringPolicy } from '@/game/scoring/development-policy'
import { developmentDifficultyPolicy } from '@/game/difficulty/development-policy'
import { developmentProfilePolicy } from '@/game/profiles/development-policy'
import { emptyDimensions } from '@/game/profiles/policy'

const dependencies = createDevelopmentDependencies()

describe('progression stages', () => {
  it('orders the seven canonical stages', () => {
    expect(STAGE_ORDER).toHaveLength(7)
    expect(stageIndex('grade-7')).toBe(0)
    expect(stageIndex('graduation')).toBe(6)
    expect(nextStage('grade-7')).toBe('year-1')
    expect(nextStage('graduation')).toBeUndefined()
    expect(isStageId('year-3')).toBe(true)
    expect(isStageId('year-9')).toBe(false)
  })
})

describe('player stats', () => {
  it('clamps into the documented bounds', () => {
    expect(clampStat(-40)).toBe(0)
    expect(clampStat(400)).toBe(100)
    expect(clampStat(Number.NaN)).toBe(0)
    expect(clampStat(12.6)).toBe(13)
  })

  it('applies effects without mutating the original', () => {
    const base = initialStats()
    const next = applyStatEffects(base, [
      { stat: 'knowledge', delta: 10 },
      { stat: 'energy', delta: -200 },
    ])

    expect(readStat(next, 'knowledge')).toBe(60)
    expect(readStat(next, 'energy')).toBe(0)
    // The original object is untouched.
    expect(readStat(base, 'knowledge')).toBe(50)
    expect(isVisibleStat('team')).toBe(true)
    expect(isVisibleStat('luck')).toBe(false)
  })
})

describe('quantities and units', () => {
  it('keeps money in integer minor units', () => {
    expect(formatMoney(money(123_456))).toBe('1234.56')
    expect(formatMoney(money(5))).toBe('0.05')
    expect(serializeQuantity(money(250))).toEqual({
      amount: '250/1',
      unit: 'currency-minor',
    })
  })

  it('computes rectangle area and changes unit', () => {
    const area = rectangleArea(
      quantity(fromDecimalString('6'), 'metre'),
      quantity(fromDecimalString('2.4'), 'metre'),
    )
    expect(area.unit).toBe('square-metre')
    expect(formatQuantity(area, 2)).toBe('14.40')
  })

  it('refuses to combine incompatible units', () => {
    expect(() =>
      addQuantities(money(100), quantity(fromInteger(1), 'litre')),
    ).toThrow(EngineInvariantError)
    expect(() =>
      rectangleArea(money(100), quantity(fromInteger(1), 'metre')),
    ).toThrow(EngineInvariantError)
    expect(() => toMinutes(money(100))).toThrow(EngineInvariantError)
  })

  it('adds, subtracts, scales and compares like quantities', () => {
    const a = quantity(fromInteger(6), 'litre')
    const b = quantity(fromInteger(4), 'litre')

    expect(formatQuantity(addQuantities(a, b), 0)).toBe('10')
    expect(formatQuantity(subtractQuantities(a, b), 0)).toBe('2')
    expect(formatQuantity(scaleQuantity(a, fromInteger(3)), 0)).toBe('18')
    expect(compareQuantities(a, b)).toBe(1)
    expect(compareQuantities(b, a)).toBe(-1)
    expect(compareQuantities(a, a)).toBe(0)
  })

  it('converts hours to minutes and ratios between quantities', () => {
    expect(formatQuantity(toMinutes(quantity(fromInteger(2), 'hour')), 0)).toBe(
      '120',
    )
    const ratio = ratioOf(
      quantity(fromInteger(9), 'litre'),
      quantity(fromInteger(3), 'litre'),
    )
    expect(ratio.n).toBe(3n)
    expect(ratio.d).toBe(1n)
  })
})

describe('deterministic RNG guards', () => {
  it('rejects impossible requests instead of guessing', () => {
    const rng = createRng(dependencies.ruleset.contentVersion as never)

    expect(() => rng.nextInt(10, 5)).toThrow(EngineInvariantError)
    expect(() => rng.nextInt(1.5, 5)).toThrow(EngineInvariantError)
    expect(() => rng.pick([])).toThrow(EngineInvariantError)
    expect(() => rng.weightedPick([])).toThrow(EngineInvariantError)
    expect(() => rng.weightedPick([{ item: 'a', weight: 0 }])).toThrow(
      EngineInvariantError,
    )
    expect(() => rng.weightedPick([{ item: 'a', weight: -2 }])).toThrow(
      EngineInvariantError,
    )
    expect(() => rng.chance(1, 0)).toThrow(EngineInvariantError)
  })

  it('treats impossible and certain probabilities without drawing', () => {
    const rng = createRng('probability' as never)
    expect(rng.chance(0, 10)).toBe(false)
    expect(rng.chance(10, 10)).toBe(true)
  })
})

describe('ruleset construction', () => {
  const base = createDevelopmentRuleset()

  it('accepts the development ruleset but refuses to make it official', () => {
    expect(base.official).toBe(false)

    const official = createRuleset({
      id: toRulesetId('attempted-official'),
      version: '1.0.0',
      contentSetId: toContentSetId('development'),
      contentVersion: '1.0.0',
      stages: base.stages,
      scoring: developmentScoringPolicy,
      difficulty: developmentDifficultyPolicy,
      profile: developmentProfilePolicy,
      narrative: base.narrative,
      official: true,
    })

    expect(isErr(official)).toBe(true)
    if (official.ok) return
    expect(official.error.kind).toBe('invalid-ruleset')
    expect(describeRejection(official.error)).toContain('development policies')
  })

  it.each([
    ['no stages', { stages: [] }],
    [
      'a repeated stage',
      { stages: [base.stages[0], base.stages[0]].filter(Boolean) },
    ],
    [
      'stages out of school order',
      { stages: [base.stages[2], base.stages[1]].filter(Boolean) },
    ],
    [
      'a stage with no events',
      {
        stages: [{ ...base.stages[0], eventCount: 0 }].filter(Boolean),
      },
    ],
    [
      'a stage enabling no categories',
      {
        stages: [{ ...base.stages[0], categories: [] }].filter(Boolean),
      },
    ],
    [
      'a negative cooldown',
      { narrative: { cooldownEvents: -1, allowRepeats: false } },
    ],
  ])('rejects %s', (_label, override) => {
    const result = createRuleset({
      id: toRulesetId('broken'),
      version: '0.0.1',
      contentSetId: toContentSetId('development'),
      contentVersion: '0.0.1',
      stages: base.stages,
      scoring: developmentScoringPolicy,
      difficulty: developmentDifficultyPolicy,
      profile: developmentProfilePolicy,
      narrative: base.narrative,
      ...(override as Record<string, unknown>),
    })

    expect(isErr(result)).toBe(true)
    if (result.ok) return
    expect(result.error.kind).toBe('invalid-ruleset')
  })
})

describe('challenge registry', () => {
  it('exposes definitions in a stable order and filters by stage', () => {
    const registry = createDevelopmentChallengeRegistry()
    const ids = registry.definitions.map((definition) => definition.id)

    expect([...ids].sort()).toEqual(ids)
    expect(registry.get('dev.mural-coverage' as never)?.interaction).toBe(
      'decision-card',
    )
    expect(registry.get('nope' as never)).toBeUndefined()

    const grade7 = registry.forStage('grade-7')
    expect(grade7.length).toBeGreaterThan(0)
    for (const definition of grade7) {
      expect(definition.stages).toContain('grade-7')
    }

    const filtered = registry.forStage('grade-7', ['space-and-shape'])
    for (const definition of filtered) {
      expect(definition.categories).toContain('space-and-shape')
    }
  })

  it('refuses duplicate definitions', () => {
    const definition = createDevelopmentChallengeRegistry().definitions[0]
    if (definition === undefined) throw new Error('no definitions')

    expect(() => createChallengeRegistry([definition, definition])).toThrow(
      EngineInvariantError,
    )
  })
})

describe('storylet helpers', () => {
  it('recognises a purely narrative beat', () => {
    const welcome = dependencies.storylets.find(
      (storylet) => storylet.id === 'dev.welcome',
    )
    const mural = dependencies.storylets.find(
      (storylet) => storylet.id === 'dev.mural',
    )

    expect(welcome && isNarrativeOnly(welcome)).toBe(true)
    expect(mural && isNarrativeOnly(mural)).toBe(false)
  })
})

describe('selectors', () => {
  it('derives everything the UI needs without touching state internals', () => {
    const descriptor = developmentRunDescriptor('selectors', dependencies)
    const created = createRun(descriptor, dependencies)
    if (!created.ok) throw new Error('run creation failed')

    const start = created.value.state
    expect(isRunComplete(start)).toBe(false)
    expect(canContinue(start)).toBe(true)
    expect(canSubmitAnswer(start)).toBe(false)
    expect(scorePreview(start)).toBe(0)
    expect(pendingFeedback(start)).toBeUndefined()
    expect(currentStage(start, dependencies.ruleset)?.id).toBe('grade-7')
    expect(revealedInformation(start)).toEqual([])
    expect(activeInstanceId(start)).toBeUndefined()

    const progress = runProgress(start, dependencies.ruleset)
    expect(progress.stage).toBe('grade-7')
    expect(progress.stageIndex).toBe(0)
    expect(progress.stageCount).toBe(7)
    expect(progress.totalEvents).toBe(13)
    expect(progress.eventsResolved).toBe(0)

    const advanced = transition(start, { type: 'CONTINUE' }, dependencies)
    if (!advanced.ok) throw new Error('continue rejected')
    expect(canSubmitAnswer(advanced.value.state)).toBe(true)
    expect(activeInstanceId(advanced.value.state)).toBeTruthy()

    const finished = simulateRun(descriptor, dependencies)
    if (!finished.ok) throw new Error('simulation failed')
    expect(isRunComplete(finished.value.state)).toBe(true)
    expect(canContinue(finished.value.state)).toBe(false)
    expect(canSubmitAnswer(finished.value.state)).toBe(false)
  })
})

describe('snapshot corruption handling', () => {
  it.each([
    ['a non-object', 42],
    ['a missing state', { schemaVersion: 1 }],
    ['an unknown schema version', { schemaVersion: 99, state: {} }],
    [
      'an out-of-range stat',
      {
        schemaVersion: 1,
        state: { stats: { knowledge: 500, team: 0, initiative: 0, energy: 0 } },
      },
    ],
  ])('refuses %s', (_label, payload) => {
    const result = restoreSnapshot(payload, {
      gameVersion: '1.0.0',
      rulesetVersion: '0.1.0-dev',
      contentVersion: '0.1.0-dev',
    })

    expect(isErr(result)).toBe(true)
    if (result.ok) return
    expect(['corrupted-snapshot', 'unsupported-version']).toContain(
      result.error.kind,
    )
    expect(describeRejection(result.error).length).toBeGreaterThan(0)
  })
})

describe('difficulty adaptation', () => {
  it('steps up after strong play and down after weak play, inside the stage band', () => {
    const stage = dependencies.ruleset.stages[3]
    if (stage === undefined) throw new Error('missing stage')

    const stepUp = developmentDifficultyPolicy.next(
      { current: stage.targetDifficulty, recent: ['optimal', 'efficient'] },
      stage,
    )
    expect(stepUp.current).toBe(stage.targetDifficulty + 1)
    // The window resets so one streak cannot move difficulty twice.
    expect(stepUp.recent).toEqual([])

    const stepDown = developmentDifficultyPolicy.next(
      { current: stage.targetDifficulty, recent: ['invalid', 'functional'] },
      stage,
    )
    expect(stepDown.current).toBe(stage.targetDifficulty - 1)

    // Mixed results leave difficulty alone.
    const held = developmentDifficultyPolicy.next(
      { current: stage.targetDifficulty, recent: ['optimal', 'invalid'] },
      stage,
    )
    expect(held.current).toBe(stage.targetDifficulty)

    // Not enough evidence yet.
    const waiting = developmentDifficultyPolicy.next(
      { current: stage.targetDifficulty, recent: ['optimal'] },
      stage,
    )
    expect(waiting.current).toBe(stage.targetDifficulty)
  })

  it('never drifts more than one level from the stage target', () => {
    const stage = dependencies.ruleset.stages[0]
    if (stage === undefined) throw new Error('missing stage')

    let state = { current: stage.targetDifficulty, recent: [] as never[] }
    for (let round = 0; round < 8; round += 1) {
      state = developmentDifficultyPolicy.next(
        { current: state.current, recent: ['optimal', 'optimal'] },
        stage,
      ) as typeof state
      expect(state.current).toBeLessThanOrEqual(stage.targetDifficulty + 1)
      expect(state.current).toBeGreaterThanOrEqual(stage.targetDifficulty - 1)
    }
  })

  it('carries difficulty across a stage boundary but clamps to the new band', () => {
    const early = dependencies.ruleset.stages[0]
    const late = dependencies.ruleset.stages[5]
    if (early === undefined || late === undefined)
      throw new Error('missing stage')

    expect(developmentDifficultyPolicy.initialFor(early, undefined)).toBe(
      early.targetDifficulty,
    )
    // A run arriving at 5.º año on difficulty 1 is pulled up into its band.
    expect(
      developmentDifficultyPolicy.initialFor(late, { current: 1, recent: [] }),
    ).toBeGreaterThanOrEqual(late.targetDifficulty - 1)
  })
})

describe('profile classification', () => {
  it('produces a stable result for neutral evidence', () => {
    const result = developmentProfilePolicy.classify(
      emptyDimensions(),
      initialStats(),
    )

    expect(result.profileId).toBeTruthy()
    expect(result.runnerUpId).toBeTruthy()
    expect(result.runnerUpId).not.toBe(result.profileId)
  })

  it('picks the scientist for evidence-driven, precise, low-risk play', () => {
    const result = developmentProfilePolicy.classify(
      {
        efficiency: 0.5,
        precision: 1,
        risk: 0,
        collaboration: 0.2,
        initiative: 0.1,
        informationUse: 1,
        stability: 0.9,
      },
      initialStats(),
    )

    expect(result.profileId).toBe('scientist')
    expect(result.evidence.length).toBeGreaterThan(0)
  })

  it('picks the improviser for high-risk play that ignores the evidence', () => {
    // High risk with modest initiative: raising initiative would tip the same
    // evidence towards the entrepreneur, which is the intended distinction.
    const result = developmentProfilePolicy.classify(
      {
        efficiency: 0.1,
        precision: 0.2,
        risk: 1,
        collaboration: 0.1,
        initiative: 0.3,
        informationUse: 0,
        stability: 0.1,
      },
      initialStats(),
    )

    expect(result.profileId).toBe('improviser')
  })
})

describe('mass simulation harness', () => {
  it('summarises a small sweep without findings', () => {
    const summary = simulateMany(dependencies, {
      runs: 12,
      seedPrefix: 'unit-sweep',
      verifyEvery: 3,
    })

    expect(summary.runs).toBe(12)
    expect(summary.completed).toBe(12)
    expect(summary.findings).toEqual([])
    expect(summary.totalEvents).toBe(12 * 13)
    expect(summary.averageEvents).toBe(13)
    expect(summary.minScore).toBeGreaterThan(0)
    expect(summary.maxScore).toBeGreaterThanOrEqual(summary.minScore)
    expect(Object.keys(summary.qualityCounts).length).toBeGreaterThan(0)
    expect(Object.keys(summary.profileCounts).length).toBeGreaterThan(0)
  })
})
