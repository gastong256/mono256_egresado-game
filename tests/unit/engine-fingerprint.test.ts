import { describe, expect, it } from 'vitest'

import { ENGINE_VERSION } from '@/game'
import {
  contentFingerprint,
  engineFingerprint,
  rulesetFingerprint,
} from '@/game/ruleset/fingerprint'
import { createDevelopmentDependencies } from '@/game/testing'

/**
 * Version fingerprints.
 *
 * These pin deterministic behaviour to the version that declares it. A run is
 * only replayable by an engine advertising the same version triple, so changing
 * what a version means — without changing the version — silently invalidates
 * every stored run.
 *
 * **If one of these fails, do not just paste the new value.** Decide which
 * version the change belongs to, bump it, regenerate the golden replays in
 * `engine-golden.test.ts`, and only then update the fingerprint here:
 *
 * - transition, RNG consumption or derivation, action-log or snapshot format
 *   → `ENGINE_VERSION`
 * - scoring, difficulty, profile policy, stage configuration, narrative pacing
 *   → ruleset version
 * - challenge or storylet data
 *   → content version
 */

const dependencies = createDevelopmentDependencies()

/*
 * Regenerados para la migración de carrera (`ENGINE_VERSION` 2.0.0, ruleset y
 * contenido `0.2.0-dev`). El recorrido, el score y el perfil de las runs golden
 * quedaron idénticos: lo que cambió es la forma del estado persistido, que es
 * exactamente el tipo de cambio que la versión de motor existe para declarar.
 */
const EXPECTED = {
  engine: 'b272785f',
  ruleset: 'd3319440',
  content: '0689336b',
} as const

describe('version fingerprints', () => {
  it('pins the deterministic kernel to its engine version', () => {
    expect(ENGINE_VERSION).toBe('2.0.0')
    expect(engineFingerprint()).toBe(EXPECTED.engine)
  })

  it('pins the scoring rules to the declared ruleset version', () => {
    expect(dependencies.ruleset.version).toBe('0.2.0-dev')
    expect(rulesetFingerprint(dependencies.ruleset)).toBe(EXPECTED.ruleset)
  })

  it('pins the playable content to the declared content version', () => {
    expect(dependencies.ruleset.contentVersion).toBe('0.2.0-dev')
    expect(
      contentFingerprint(dependencies.challenges, dependencies.storylets),
    ).toBe(EXPECTED.content)
  })

  it('separates the three concerns', () => {
    // A fingerprint must not be a digest of everything, otherwise every change
    // would point at every version and the rule would stop guiding anyone.
    const values = new Set([
      engineFingerprint(),
      rulesetFingerprint(dependencies.ruleset),
      contentFingerprint(dependencies.challenges, dependencies.storylets),
    ])
    expect(values.size).toBe(3)
  })

  it('reacts to a policy change that leaves the version untouched', () => {
    // The exact scenario the fingerprint exists to catch: same version string,
    // different rules.
    const tampered = {
      ...dependencies.ruleset,
      scoring: {
        ...dependencies.ruleset.scoring,
        id: 'development-scoring-v2',
      },
    }

    expect(rulesetFingerprint(tampered)).not.toBe(EXPECTED.ruleset)
    expect(tampered.version).toBe(dependencies.ruleset.version)
  })

  it('reacts to a content change that leaves the version untouched', () => {
    const trimmed = dependencies.storylets.slice(0, -1)

    expect(contentFingerprint(dependencies.challenges, trimmed)).not.toBe(
      EXPECTED.content,
    )
  })

  it('is stable across repeated computation', () => {
    expect(rulesetFingerprint(dependencies.ruleset)).toBe(
      rulesetFingerprint(dependencies.ruleset),
    )
    expect(
      contentFingerprint(dependencies.challenges, dependencies.storylets),
    ).toBe(contentFingerprint(dependencies.challenges, dependencies.storylets))
  })
})
