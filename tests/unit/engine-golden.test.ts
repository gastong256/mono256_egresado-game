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
 * Los valores actuales corresponden al pipeline de variantes (`ENGINE_VERSION`
 * 4.0.0, contenido `0.4.0-dev`). Otra vez: el recorrido, el score, el perfil y
 * la cantidad de comandos quedaron **iguales**. Lo único que se movió es el
 * hash del estado, porque el descriptor puede llevar ahora la versión del
 * catálogo de variantes del que salió la run. Vale la pena mirar qué cambió y qué no: el
 * trace, el score, el perfil y la cantidad de comandos de las dos runs quedaron
 * **iguales** — la secuencia de juego no se movió, y las plantillas de
 * desarrollo generan exactamente los mismos números porque cada una declara una
 * sola variante y por lo tanto no gasta ningún sorteo eligiéndola. Lo único que
 * cambió es el hash del estado final, porque una instancia se direcciona ahora
 * por familia, plantilla y variante en lugar de por un id de definición suelto.
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
    hash: '2b38de925beff57185e6efb00ecb4b3da8869974fe484821f29043fe20c122b8',
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
    hash: '4350020e01aac6355c62541f03ee5296dfef9df06ec902fd37f1e6eab607cc9d',
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
    expect(dependencies.ruleset.contentVersion).toBe('0.4.0-dev')
    expect(dependencies.ruleset.official).toBe(false)
  })
})
