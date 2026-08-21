import { describe, expect, it } from 'vitest'

import { validateContent, type Storylet } from '@/game'
import {
  createDevelopmentChallengeRegistry,
  createDevelopmentRuleset,
  developmentStorylets,
} from '@/game/testing'
import { toChallengeId, toStoryletId } from '@/game'

const ruleset = createDevelopmentRuleset()
const challenges = createDevelopmentChallengeRegistry()

function validate(storylets: readonly Storylet[], seeds = 12) {
  return validateContent({
    ruleset,
    challenges,
    storylets,
    seedsPerChallenge: seeds,
  })
}

describe('content validation', () => {
  it('accepts the development content set', () => {
    const report = validate(developmentStorylets, 40)
    const errors = report.issues.filter((issue) => issue.severity === 'error')

    expect(errors).toEqual([])
    expect(report.ok).toBe(true)
  })

  it('generates every challenge without violating its own invariants', () => {
    const report = validate(developmentStorylets, 40)

    for (const stats of report.generation) {
      expect(stats.seedsChecked).toBeGreaterThan(0)
      expect(stats.failures).toBe(0)
      // Procedural variety: a template that always produces the same numbers
      // would be a broken generator.
      expect(stats.distinctPresentations).toBeGreaterThan(1)
    }
  })

  it('detects a storylet pool a later stage cannot reach under greedy selection', () => {
    // Both year-5 exclusives are removed, so the stage would have to rely on
    // storylets that earlier stages are free to consume first. A count-based
    // check passes here; only the greedy-reachability check catches it.
    const starved = developmentStorylets.filter(
      (storylet) =>
        storylet.id !== toStoryletId('dev.final-project') &&
        storylet.id !== toStoryletId('dev.orientation'),
    )

    const report = validate(starved)
    const codes = report.issues.map((issue) => issue.code)

    expect(report.ok).toBe(false)
    expect(codes).toContain('stage.greedy-unreachable')
  })

  it('detects a stage with fewer storylets than events', () => {
    const starved = developmentStorylets.filter(
      (storylet) => !storylet.stages.includes('graduation'),
    )

    const report = validate(starved)
    const codes = report.issues.map((issue) => issue.code)

    expect(report.ok).toBe(false)
    expect(codes).toContain('stage.insufficient-storylets')
  })

  it('rejects a storylet referencing an unregistered challenge', () => {
    const broken: Storylet[] = [
      ...developmentStorylets,
      {
        id: toStoryletId('dev.broken'),
        kind: 'one-shot',
        stages: ['year-1'],
        weight: 5,
        priority: 0,
        requires: { kind: 'always' },
        tags: [],
        title: 'Roto',
        text: 'Referencia contenido inexistente.',
        challengePool: [toChallengeId('dev.does-not-exist')],
        effects: [],
        followUps: [],
      },
    ]

    const report = validate(broken)
    expect(report.ok).toBe(false)
    expect(report.issues.map((issue) => issue.code)).toContain(
      'storylet.unknown-challenge',
    )
  })

  it('rejects a challenge offered in a stage it does not declare', () => {
    const mismatched: Storylet[] = [
      ...developmentStorylets,
      {
        id: toStoryletId('dev.mismatch'),
        kind: 'one-shot',
        stages: ['grade-7'],
        weight: 5,
        priority: 0,
        requires: { kind: 'always' },
        tags: [],
        title: 'Desalineado',
        text: 'Ofrece un desafío de 5.º año en séptimo grado.',
        // The survey challenge only declares year-4 and year-5.
        challengePool: [toChallengeId('dev.survey-confidence')],
        effects: [],
        followUps: [],
      },
    ]

    const report = validate(mismatched)
    expect(report.ok).toBe(false)
    expect(report.issues.map((issue) => issue.code)).toContain(
      'storylet.challenge-stage-mismatch',
    )
  })

  it('rejects invalid weights and unreachable conditions', () => {
    const broken: Storylet[] = [
      ...developmentStorylets,
      {
        id: toStoryletId('dev.zero-weight'),
        kind: 'one-shot',
        stages: ['year-1'],
        weight: 0,
        priority: 0,
        requires: { kind: 'any', conditions: [] },
        tags: [],
        title: 'Imposible',
        text: 'Peso cero y condición vacía.',
        challengePool: [],
        effects: [{ kind: 'stat-add', stat: 'energy', delta: 90 }],
        followUps: [],
      },
    ]

    const report = validate(broken)
    const codes = report.issues.map((issue) => issue.code)

    expect(report.ok).toBe(false)
    expect(codes).toContain('storylet.invalid-weight')
    expect(codes).toContain('storylet.invalid-condition')
    expect(codes).toContain('storylet.invalid-effect')
  })
})
