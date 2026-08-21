/**
 * Opaque identifier types for the deterministic core.
 *
 * Branding is applied only where mixing two identifiers would be a silent
 * category error during a run or a replay. Values stay plain strings/numbers at
 * runtime so every branded value remains JSON serializable.
 */

declare const brand: unique symbol

type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand }

export type RunId = Brand<string, 'RunId'>
export type RunSeed = Brand<string, 'RunSeed'>
export type ChallengeId = Brand<string, 'ChallengeId'>
export type ChallengeInstanceId = Brand<string, 'ChallengeInstanceId'>
export type StoryletId = Brand<string, 'StoryletId'>
export type RulesetId = Brand<string, 'RulesetId'>
export type ContentSetId = Brand<string, 'ContentSetId'>
export type SequenceNumber = Brand<number, 'SequenceNumber'>

/** Identifier segments accepted by every branded string identifier. */
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/u

/** Seeds are opaque to players; the engine only requires a stable byte string. */
const SEED_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/u

export function isIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value)
}

export function isSeed(value: string): boolean {
  return SEED_PATTERN.test(value)
}

/**
 * Parsers are the only sanctioned way to enter the branded space. They are used
 * at trust boundaries; inside the engine the branded type is already proven.
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

export function toSequenceNumber(value: number): SequenceNumber {
  return value as SequenceNumber
}
