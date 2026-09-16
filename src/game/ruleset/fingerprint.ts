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

import type { ContentCatalog } from '../challenges/content-catalog'
import { ENGINE_VERSION } from '../core/versioning'
import { cognitiveLoad } from '../difficulty/cognitive'
import type { Storylet } from '../narrative/storylet'
import { RNG_ALGORITHM } from '../random/rng'
import { ACTION_LOG_VERSION } from '../runs/action-log'
import { SNAPSHOT_SCHEMA_VERSION } from '../runs/snapshot'
import type { Ruleset } from './ruleset'
import { canonicalize } from '../core/canonical'
import type { RecoveryContent } from '../runs/transition'

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
/**
 * The composition policy, flattened.
 *
 * Every number in it changes which beats a seed composes, so every number is in
 * the digest. Naming only the policy id would let a recalibration ship silently
 * under the same ruleset version, which is the exact hole this file exists to
 * close.
 */
/** A template's scoring profile, flattened to what changes a score. */
function scoringShape(template: {
  readonly scoring: {
    readonly math: unknown
    readonly team: unknown
    readonly aura: unknown
  }
}): string {
  const shape = (signal: unknown): string =>
    typeof signal === 'function' ? 'measured' : String(signal)

  return [
    `m=${shape(template.scoring.math)}`,
    `t=${shape(template.scoring.team)}`,
    `a=${shape(template.scoring.aura)}`,
  ].join(',')
}

function composition(ruleset: Ruleset): string {
  const policy = ruleset.composition
  if (policy === undefined) {
    return 'none'
  }

  const stages = policy.stages
    .map((stage) =>
      [
        stage.stageId,
        `${String(stage.ordinaryBeats.min)}-${String(stage.ordinaryBeats.max)}`,
        [...stage.secondaryRoles].sort().join(','),
        `${String(stage.difficulty.target)}±${String(stage.difficulty.tolerance)}`,
        String(stage.narrativeBeats),
        `repeats:${String(stage.allowTemplateRepeats ?? false)}`,
        [...(stage.hostableTemplates ?? [])].sort().join(','),
      ].join(':'),
    )
    .join('|')

  const costs = Object.entries(policy.costPolicy.costs)
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([band, cost]) => `${band}=${String(cost)}`)
    .join(',')

  return [
    `${policy.id}@${policy.version}:${String(policy.official)}`,
    `costs:${policy.costPolicy.id}@${policy.costPolicy.version}:${costs}`,
    `objectives:${policy.objectives.join('>')}`,
    `stages:${stages}`,
    ...(policy.career === undefined
      ? []
      : [`career:${canonicalize(policy.career)}`]),
  ].join(';')
}

/**
 * The recovery policy, flattened.
 *
 * Which results owe remediation changes how a run progresses, so the triggers
 * are in the digest. The structural maximum remains there too as an inspectable
 * literal, even though a valid policy cannot tune it away from one. A trigger
 * recalibration without a version change would otherwise alter replay silently.
 */
function recovery(ruleset: Ruleset): string {
  const policy = ruleset.recovery
  if (policy === undefined) {
    return 'none'
  }

  const triggers = Object.entries(policy.triggers)
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([quality, reason]) => `${quality}=${reason}`)
    .join(',')

  return [
    `${policy.id}@${policy.version}:${String(policy.official)}`,
    `triggers:${triggers}`,
    `max:${String(policy.maxRecoveriesPerStage)}`,
  ].join(';')
}

/**
 * La calibración de rareza, aplanada.
 *
 * Cambiar una probabilidad o un techo cambia qué carreras existen bajo la misma
 * seed, así que entra al digest. Una ruleset que no sortea rareza dice `none`,
 * y eso también es una afirmación.
 */
function rare(ruleset: Ruleset): string {
  const policy = ruleset.rare
  if (policy === undefined) {
    return 'none'
  }
  const chances = Object.entries(policy.chancePerMille)
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([band, chance]) => `${band}=${String(chance)}`)
    .join(',')
  return [
    `${policy.id}@${policy.version}:${String(policy.official)}`,
    `chance:${chances}`,
    `budget:${String(policy.budget.events)}/${String(policy.budget.scoring)}/${String(policy.budget.veryRare)}`,
  ].join(';')
}

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
      `composition:${composition(ruleset)}`,
      `recovery:${recovery(ruleset)}`,
      `rare:${rare(ruleset)}`,
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
  catalog: ContentCatalog,
  storylets: readonly Storylet[],
  recoveryContent?: RecoveryContent,
): string {
  const families = catalog.families
    .map((family) => [family.id, family.labelKey].join(':'))
    .join('|')

  const definitions = catalog.templates
    .map((template) =>
      [
        template.id,
        template.family,
        template.placement,
        // Variant order is content identity: selection draws an index from this
        // list, so reordering it changes which case a stored seed produces.
        template.variants.join(','),
        // The generator decides what every candidate address contains, so its
        // identity and version are content identity too.
        `${String(template.variantSource.generatorId ?? 'authored')}@${String(template.variantSource.generatorVersion ?? '-')}:${String(template.variantSource.candidateSpace)}`,
        template.interaction,
        String(template.baseDifficulty),
        // The cognitive profile is content that decides scheduling: change a
        // trait and the composer may put a different beat in a year. Leaving it
        // out would let a reclassification move a composed run without moving
        // any version, which is the hole this digest exists to close.
        template.band,
        String(cognitiveLoad(template.cognitive)),
        // How the template turns its result into competitive evidence is
        // content too: changing the act from its F1 to the four discrete steps
        // would change what a run is worth without any policy moving, and the
        // content version is where that has to become visible.
        scoringShape(template),
        [...template.stages].sort().join(','),
        [...template.categories].sort().join(','),
        [...template.tools].sort().join(','),
        ...(template.composition === undefined
          ? []
          : [`composition:${canonicalize(template.composition)}`]),
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

  return digest(
    `families:${families}||templates:${definitions}||storylets:${events}${recoveryContent === undefined ? '' : `||recovery:${canonicalize(recoveryContent)}`}`,
  )
}
