/**
 * Version fingerprints.
 *
 * `game-engine.md` requires a version bump whenever deterministic output
 * changes. Until now that rule lived only as an instruction to humans: editing a
 * quality factor inside `development-scoring-v1` left the ruleset version
 * untouched, so `assertCompatibleVersions` would happily accept an older
 * snapshot and replay it against the new rules.
 *
 * A fingerprint closes that gap. It is a stable digest of everything that
 * decides deterministic output — engine identity, policy identities, stage
 * configuration, narrative pacing and the content set. A test pins the
 * fingerprint against the declared version, so changing behaviour without
 * changing the version fails loudly and names the decision that was skipped.
 *
 * The digest deliberately covers *identity and configuration*, not the source
 * of every policy function. A policy that changes its internal constants must
 * therefore also change its `id`, which is the visible act the rule is really
 * asking for.
 */

import type { ChallengeRegistry } from '../challenges/registry'
import { ENGINE_VERSION } from '../core/versioning'
import type { Storylet } from '../narrative/storylet'
import { RNG_ALGORITHM } from '../random/rng'
import { ACTION_LOG_VERSION } from '../runs/action-log'
import { SNAPSHOT_SCHEMA_VERSION } from '../runs/snapshot'
import type { Ruleset } from './ruleset'

/** FNV-1a over UTF-16 code units, rendered as eight hex digits. */
function digest(input: string): string {
  let hash = 0x811c9dc5

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Identity of the deterministic kernel itself.
 *
 * Covers the pieces whose change invalidates a stored replay regardless of
 * ruleset or content: the engine version, the RNG algorithm and the two wire
 * formats a stored run depends on.
 */
export function engineFingerprint(): string {
  return digest(
    [
      `engine:${ENGINE_VERSION}`,
      `rng:${RNG_ALGORITHM}`,
      `actionLog:${String(ACTION_LOG_VERSION)}`,
      `snapshot:${String(SNAPSHOT_SCHEMA_VERSION)}`,
    ].join('|'),
  )
}

/**
 * Identity of the rules a run is scored by.
 *
 * Stage order, event budgets, target difficulty, enabled categories, narrative
 * pacing and the three policy identities all change the result of a run.
 */
export function rulesetFingerprint(ruleset: Ruleset): string {
  const stages = ruleset.stages
    .map((stage) =>
      [
        stage.id,
        String(stage.eventCount),
        String(stage.targetDifficulty),
        [...stage.categories].sort().join(','),
      ].join(':'),
    )
    .join('|')

  return digest(
    [
      `id:${ruleset.id}`,
      `version:${ruleset.version}`,
      `scoring:${ruleset.scoring.id}:${String(ruleset.scoring.production)}`,
      `difficulty:${ruleset.difficulty.id}:${String(ruleset.difficulty.production)}`,
      `profile:${ruleset.profile.id}:${String(ruleset.profile.production)}`,
      `pacing:${String(ruleset.narrative.cooldownEvents)}:${String(ruleset.narrative.allowRepeats)}`,
      `official:${String(ruleset.official)}`,
      `stages:${stages}`,
    ].join('|'),
  )
}

/**
 * Identity of the playable content.
 *
 * Adding, removing or re-scoping a challenge or a storylet changes which events
 * a seed produces, so it changes the content version rather than the ruleset.
 */
export function contentFingerprint(
  challenges: ChallengeRegistry,
  storylets: readonly Storylet[],
): string {
  const definitions = challenges.definitions
    .map((definition) =>
      [
        definition.id,
        definition.interaction,
        String(definition.baseDifficulty),
        [...definition.stages].sort().join(','),
        [...definition.categories].sort().join(','),
        [...definition.tools].sort().join(','),
      ].join(':'),
    )
    .join('|')

  const events = [...storylets]
    .sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
    )
    .map((storylet) =>
      [
        storylet.id,
        storylet.kind,
        String(storylet.weight),
        String(storylet.priority),
        [...storylet.stages].sort().join(','),
        [...storylet.challengePool].sort().join(','),
        // The condition and effect trees are plain data, so their serialized
        // form is a faithful part of the content identity.
        JSON.stringify(storylet.requires),
        JSON.stringify(storylet.effects),
      ].join(':'),
    )
    .join('|')

  return digest(`challenges:${definitions}||storylets:${events}`)
}
