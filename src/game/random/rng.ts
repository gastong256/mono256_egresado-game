/**
 * Deterministic random source.
 *
 * The engine never calls `Math.random`. Every draw comes from a generator
 * addressed by a seed and a namespace path, so a run is reproducible from its
 * descriptor alone.
 *
 * `pure-rand` supplies the underlying xoroshiro128+ generator. It is wrapped
 * here so the rest of the engine depends on Egresado's own interface: the
 * library type never escapes this module, and replacing the algorithm is a
 * versioned decision rather than a refactor across the codebase.
 *
 * The generator instance is mutable, which is why it is always created locally
 * from a derived seed and never stored in run state. Determinism comes from the
 * address of the substream, not from carrying a cursor around.
 */

import { uniformInt } from 'pure-rand/distribution/uniformInt'
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus'

import type { RunSeed } from '../core/branded'
import { EngineInvariantError } from '../core/invariant'
import { deriveSeedValue, type RngPath, type RngPathSegment } from './seed'

/** Algorithm identity. Changing this value changes replay semantics. */
export const RNG_ALGORITHM = 'xoroshiro128plus' as const

export interface WeightedEntry<T> {
  readonly item: T
  /** Non-negative integer weight. Zero makes the entry unreachable. */
  readonly weight: number
}

export interface Rng {
  /** Uniform integer in the inclusive range [min, max]. */
  nextInt(min: number, max: number): number
  /** Uniform double in [0, 1). Presentation and jitter only. */
  nextFloat(): number
  /** True with probability `numerator / denominator`, computed on integers. */
  chance(numerator: number, denominator: number): boolean
  /** Uniform choice. Throws when the collection is empty. */
  pick<T>(items: readonly T[]): T
  /** Fisher-Yates shuffle returning a new array. */
  shuffle<T>(items: readonly T[]): T[]
  /** Weighted choice over non-negative integer weights. */
  weightedPick<T>(entries: readonly WeightedEntry<T>[]): T
  /** Opens a nested substream that cannot disturb this one. */
  derive(...segments: readonly RngPathSegment[]): Rng
}

const FLOAT_RESOLUTION = 0x20000000

/**
 * Creates the random source addressed by `path` under `seed`.
 *
 * Two calls with the same seed and path always produce the same sequence, and
 * draws taken from one path never affect another.
 */
export function createRng(seed: RunSeed, path: RngPath = []): Rng {
  const generator = xoroshiro128plus(deriveSeedValue(seed, path))

  const rng: Rng = {
    nextInt(min: number, max: number): number {
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
        throw new EngineInvariantError('RNG bounds must be safe integers')
      }
      if (min > max) {
        throw new EngineInvariantError(
          `RNG range is inverted: ${String(min)} > ${String(max)}`,
        )
      }
      return uniformInt(generator, min, max)
    },

    nextFloat(): number {
      return uniformInt(generator, 0, FLOAT_RESOLUTION - 1) / FLOAT_RESOLUTION
    },

    chance(numerator: number, denominator: number): boolean {
      if (
        !Number.isSafeInteger(numerator) ||
        !Number.isSafeInteger(denominator)
      ) {
        throw new EngineInvariantError('probability terms must be integers')
      }
      if (denominator <= 0) {
        throw new EngineInvariantError(
          'probability denominator must be positive',
        )
      }
      if (numerator <= 0) {
        return false
      }
      if (numerator >= denominator) {
        return true
      }
      return uniformInt(generator, 1, denominator) <= numerator
    },

    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new EngineInvariantError('cannot pick from an empty collection')
      }
      const index = uniformInt(generator, 0, items.length - 1)
      const chosen = items[index]
      if (chosen === undefined) {
        throw new EngineInvariantError('RNG produced an out-of-range index')
      }
      return chosen
    },

    shuffle<T>(items: readonly T[]): T[] {
      const result = [...items]
      for (let index = result.length - 1; index > 0; index -= 1) {
        const swapWith = uniformInt(generator, 0, index)
        const left = result[index]
        const right = result[swapWith]
        if (left === undefined || right === undefined) {
          throw new EngineInvariantError('shuffle index out of range')
        }
        result[index] = right
        result[swapWith] = left
      }
      return result
    },

    weightedPick<T>(entries: readonly WeightedEntry<T>[]): T {
      let total = 0
      for (const entry of entries) {
        if (!Number.isSafeInteger(entry.weight) || entry.weight < 0) {
          throw new EngineInvariantError(
            `weights must be non-negative integers, received ${String(entry.weight)}`,
          )
        }
        total += entry.weight
      }

      if (total <= 0) {
        throw new EngineInvariantError(
          'weighted selection requires at least one positive weight',
        )
      }

      let roll = uniformInt(generator, 1, total)
      for (const entry of entries) {
        roll -= entry.weight
        if (roll <= 0) {
          return entry.item
        }
      }

      throw new EngineInvariantError('weighted selection fell through')
    },

    derive(...segments: readonly RngPathSegment[]): Rng {
      return createRng(seed, [...path, ...segments])
    },
  }

  return rng
}
