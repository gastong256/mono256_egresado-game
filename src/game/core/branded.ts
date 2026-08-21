/**
 * Opaque identifier types for the deterministic core.
 *
 * Branding is applied only where mixing two identifiers would be a silent
 * category error during a run or a replay. Values stay plain strings/numbers at
 * runtime so every branded value remains JSON serializable.
 */

import type { EngineRejection } from './errors'
import { err, ok, type Result } from './result'

declare const brand: unique symbol

type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand }

export type RunId = Brand<string, 'RunId'>
export type RunSeed = Brand<string, 'RunSeed'>
export type ChallengeId = Brand<string, 'ChallengeId'>
export type ChallengeInstanceId = Brand<string, 'ChallengeInstanceId'>
export type StoryletId = Brand<string, 'StoryletId'>
export type RulesetId = Brand<string, 'RulesetId'>
export type ContentSetId = Brand<string, 'ContentSetId'>

/**
 * Authored content identifiers: lowercase, so an id is stable across systems
 * that treat case differently.
 */
export const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/u

/**
 * Opaque identifiers chosen outside the engine — run ids, challenge instance
 * ids and seeds. Case is preserved because a server may hand out a mixed-case
 * token, but the charset stays restricted.
 *
 * The exclusions matter: the RNG address encoding separates a seed from its
 * path with control characters, so a value able to contain one could make two
 * different substreams resolve to the same address. Keeping those characters
 * out of every identifier is what makes that impossible.
 */
export const OPAQUE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/u

export function isIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value)
}

export function isSeed(value: string): boolean {
  return OPAQUE_ID_PATTERN.test(value)
}

/**
 * Converts a value that is already known to be well formed.
 *
 * These are *not* validators. Use them for values the engine produced itself or
 * that a boundary has already parsed. Untrusted input must go through the
 * `parse*` functions below, which is what the action-log and snapshot codecs do.
 */
export function toRunId(value: string): RunId {
  return value as RunId
}

export function toRunSeed(value: string): RunSeed {
  return value as RunSeed
}

export function toChallengeId(value: string): ChallengeId {
  return value as ChallengeId
}

export function toChallengeInstanceId(value: string): ChallengeInstanceId {
  return value as ChallengeInstanceId
}

export function toStoryletId(value: string): StoryletId {
  return value as StoryletId
}

export function toRulesetId(value: string): RulesetId {
  return value as RulesetId
}

export function toContentSetId(value: string): ContentSetId {
  return value as ContentSetId
}

/**
 * Parses an untrusted opaque identifier — a run id, an instance id or a seed.
 *
 * Returns a rejection rather than throwing: a malformed identifier arriving from
 * a client is an expected refusal, not a broken invariant.
 */
export function parseOpaqueId(
  field: string,
  value: string,
): Result<string, EngineRejection> {
  if (!OPAQUE_ID_PATTERN.test(value)) {
    return err({
      kind: 'invalid-command',
      detail: `${field} must match ${OPAQUE_ID_PATTERN.source}`,
    })
  }
  return ok(value)
}

/** Parses an untrusted authored content identifier. */
export function parseContentId(
  field: string,
  value: string,
): Result<string, EngineRejection> {
  if (!IDENTIFIER_PATTERN.test(value)) {
    return err({
      kind: 'invalid-content',
      issues: [`${field} must match ${IDENTIFIER_PATTERN.source}`],
    })
  }
  return ok(value)
}
