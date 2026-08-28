import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { canonicalize } from '@/game'
import {
  createDevelopmentDependencies,
  developmentRunDescriptor,
  simulateRun,
} from '@/game/testing'

/**
 * Golden deterministic protocol tests.
 *
 * These lock the exact output of the engine for a fixed seed, ruleset and
 * content set. They are not a substitute for behavioural tests: their only job
 * is to make an *accidental* change to deterministic output impossible to merge
 * unnoticed.
 *
 * When a change is intentional, these values must be regenerated **and** the
 * matching version bumped, following the rule in `core/versioning.ts`:
 *
 * - the transition function, RNG consumption order, seed derivation or the
 *   generation of an existing challenge changed  → bump `ENGINE_VERSION`;
 * - a scoring, difficulty or profile policy changed → bump the ruleset version;
 * - challenge or storylet data changed             → bump the content version.
 *
 * Regenerating these numbers without a version bump silently invalidates every
 * stored replay, which is exactly what this file exists to prevent.
 *
 * Los valores actuales corresponden a la migración del modelo de jugador
 * (`ENGINE_VERSION` 2.0.0). Vale la pena mirar qué cambió y qué no: el trace, el
 * score, el perfil y la cantidad de comandos de las dos runs quedaron **iguales**
 * — la secuencia de juego no se movió. Lo único que cambió es el hash del estado
 * final, porque el estado ahora lleva `career` en lugar de `stats`.
 */

const dependencies = createDevelopmentDependencies()

interface Golden {
  readonly seed: string
  readonly score: number
  readonly profile: string
  readonly events: number
  readonly commands: number
  readonly trace: readonly string[]
  readonly hash: string
}

const GOLDEN_RUNS: readonly Golden[] = [
  {
    seed: 'golden-alpha',
    score: 6707,
    profile: 'competitor',
    events: 13,
    commands: 28,
    trace: [
      'grade-7|dev.welcome|-|-|0',
      'grade-7|dev.mural|dev.mural-coverage|functional|843',
      'year-1|dev.study-week|dev.study-timeline|invalid|345',
      'year-1|dev.bus|dev.bus-departure|invalid|345',
      'year-2|dev.group-work|dev.group-assignment|efficient|1144',
      'year-2|dev.trip|dev.trip-budget|invalid|345',
      'year-3|dev.recycling|dev.recycling-chart|invalid|390',
      'year-3|dev.buffet|dev.trip-budget|invalid|390',
      'year-4|dev.campaign|dev.recycling-chart|invalid|390',
      'year-4|dev.survey|dev.survey-confidence|invalid|450',
      'year-5|dev.final-project|dev.trip-budget|invalid|435',
      'year-5|dev.orientation|dev.survey-confidence|optimal|1630',
      'graduation|dev.graduation|-|-|0',
    ],
    hash: 'd4c094439ce918a811b5b6a3675bc86493ce5e99f1fd252339b759d2adb01ead',
  },
  {
    seed: 'golden-beta',
    score: 6427,
    profile: 'competitor',
    events: 13,
    commands: 26,
    trace: [
      'grade-7|dev.welcome|-|-|0',
      'grade-7|dev.mural|dev.mural-coverage|invalid|345',
      'year-1|dev.notebook|dev.notebook-discount|functional|923',
      'year-1|dev.study-week|dev.study-timeline|invalid|345',
      'year-2|dev.group-work|dev.group-assignment|functional|851',
      'year-2|dev.recycling|dev.recycling-chart|functional|853',
      'year-3|dev.trip|dev.trip-budget|invalid|390',
      'year-3|dev.stand-schedule|dev.group-assignment|functional|1010',
      'year-4|dev.survey|dev.survey-confidence|invalid|390',
      'year-4|dev.campaign|dev.recycling-chart|invalid|390',
      'year-5|dev.final-project|dev.trip-budget|invalid|435',
      'year-5|dev.orientation|dev.survey-confidence|invalid|495',
      'graduation|dev.graduation|-|-|0',
    ],
    hash: '2d32735fa74f72eba9c6ab8b8c38a800a73ca6bfa059120afd114a4a942a1ac4',
  },
]

describe('golden deterministic protocol', () => {
  it.each(GOLDEN_RUNS)(
    'reproduces the recorded run for seed $seed',
    (golden: Golden) => {
      const descriptor = developmentRunDescriptor(golden.seed, dependencies)
      const outcome = simulateRun(descriptor, dependencies)

      if (!outcome.ok) throw new Error('simulation failed')
      const { state } = outcome.value

      const trace = state.history.map(
        (entry) =>
          `${entry.stage}|${entry.storyletId}|${entry.challengeId ?? '-'}|${entry.quality ?? '-'}|${String(entry.points)}`,
      )

      expect(trace).toEqual(golden.trace)
      expect(state.history).toHaveLength(golden.events)
      expect(outcome.value.commands).toBe(golden.commands)
      expect(state.scorePreview).toBe(golden.score)
      expect(state.completion?.profile.profileId).toBe(golden.profile)

      const hash = createHash('sha256')
        .update(canonicalize(state))
        .digest('hex')
      expect(hash).toBe(golden.hash)
    },
  )

  it('pins the versions the golden values belong to', () => {
    // A version bump must be accompanied by regenerated golden values, so the
    // two are asserted together.
    expect(dependencies.ruleset.version).toBe('0.2.0-dev')
    expect(dependencies.ruleset.contentVersion).toBe('0.2.0-dev')
    expect(dependencies.ruleset.official).toBe(false)
  })
})
