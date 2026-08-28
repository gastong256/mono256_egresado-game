/**
 * DEVELOPMENT PROFILE POLICY — not the official Egresado ruleset.
 *
 * Each profile declares a weight per dimension; the run scores against every
 * profile and the highest total wins. Weights are expressed in whole percent so
 * the comparison is integer arithmetic and cannot wobble.
 *
 * Tie-break, applied in order and fully documented because the GDD requires it:
 *
 * 1. highest weighted score;
 * 2. highest score on the profile's own strongest dimension;
 * 3. the profile that appears first in `PROFILE_IDS`.
 *
 * The last rule guarantees a total order, so classification is deterministic
 * even when two profiles are numerically identical.
 */

import { EngineInvariantError } from '../core/invariant'
import {
  PROFILE_IDS,
  type ProfileDimensions,
  type ProfileEvidenceEntry,
  type ProfileId,
  type ProfilePolicy,
  type ProfileResult,
} from './policy'

type DimensionKey = keyof ProfileDimensions

/** Weights in whole percent. Positive rewards a dimension, negative penalises. */
type ProfileWeights = Readonly<Record<DimensionKey, number>>

const WEIGHTS: Readonly<Record<ProfileId, ProfileWeights>> = {
  // Plans ahead: spends well and is accurate, without gambling.
  strategist: {
    efficiency: 40,
    precision: 30,
    risk: -15,
    collaboration: 5,
    initiative: 10,
    informationUse: 15,
    stability: 15,
  },
  // Decides fast on partial evidence and accepts the consequences.
  improviser: {
    efficiency: -10,
    precision: 5,
    risk: 45,
    collaboration: 5,
    initiative: 25,
    informationUse: -30,
    stability: -15,
  },
  // Looks at the data before deciding and is precise about it.
  scientist: {
    efficiency: 15,
    precision: 45,
    risk: -20,
    collaboration: 0,
    initiative: 5,
    informationUse: 45,
    stability: 20,
  },
  // Organises other people well.
  leader: {
    efficiency: 20,
    precision: 10,
    risk: 0,
    collaboration: 50,
    initiative: 25,
    informationUse: 10,
    stability: 15,
  },
  // Starts things and makes resources stretch.
  entrepreneur: {
    efficiency: 35,
    precision: 10,
    risk: 25,
    collaboration: 15,
    initiative: 45,
    informationUse: 5,
    stability: -5,
  },
  // Chases the best possible result on every single event.
  competitor: {
    efficiency: 30,
    precision: 35,
    risk: 20,
    collaboration: -5,
    initiative: 30,
    informationUse: 0,
    stability: 25,
  },
  // No dominant trait; steady across the board.
  balanced: {
    efficiency: 18,
    precision: 18,
    risk: 8,
    collaboration: 18,
    initiative: 18,
    informationUse: 18,
    stability: 30,
  },
  // Gets through it, recovering after setbacks.
  survivor: {
    efficiency: 5,
    precision: 5,
    risk: 10,
    collaboration: 20,
    initiative: 5,
    informationUse: 5,
    stability: -25,
  },
}

const DIMENSION_KEYS: readonly DimensionKey[] = [
  'efficiency',
  'precision',
  'risk',
  'collaboration',
  'initiative',
  'informationUse',
  'stability',
]

/** Scores in integer thousandths so no float comparison decides a profile. */
function scoreProfile(
  weights: ProfileWeights,
  dimensions: ProfileDimensions,
): number {
  let total = 0
  for (const key of DIMENSION_KEYS) {
    const value = dimensions[key]
    if (!Number.isFinite(value)) {
      throw new EngineInvariantError(`profile dimension ${key} is not finite`)
    }
    total += Math.round(value * 1000) * weights[key]
  }
  return total
}

function strongestDimension(weights: ProfileWeights): DimensionKey {
  let best: DimensionKey = 'efficiency'
  for (const key of DIMENSION_KEYS) {
    if (weights[key] > weights[best]) {
      best = key
    }
  }
  return best
}

function formatDimension(value: number): string {
  return `${String(Math.round(value * 100))} %`
}

export const developmentProfilePolicy: ProfilePolicy = {
  id: 'development-profile-v1',
  production: false,

  // The career is part of the contract for future policies; this one classifies
  // purely on the hidden reasoning dimensions, so it does not read it and the
  // parameter is omitted.
  classify(dimensions: ProfileDimensions): ProfileResult {
    const ranked = PROFILE_IDS.map((profileId, index) => ({
      profileId,
      index,
      score: scoreProfile(WEIGHTS[profileId], dimensions),
      tieBreaker: Math.round(
        dimensions[strongestDimension(WEIGHTS[profileId])] * 1000,
      ),
    })).sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score
      }
      if (left.tieBreaker !== right.tieBreaker) {
        return right.tieBreaker - left.tieBreaker
      }
      return left.index - right.index
    })

    const winner = ranked[0]
    if (winner === undefined) {
      throw new EngineInvariantError('profile ranking produced no winner')
    }

    const weights = WEIGHTS[winner.profileId]
    const evidence: ProfileEvidenceEntry[] = DIMENSION_KEYS.filter(
      (key) => weights[key] >= 25,
    ).map((key) => ({ key, value: formatDimension(dimensions[key]) }))

    return {
      profileId: winner.profileId,
      evidence,
      runnerUpId: ranked[1]?.profileId,
    }
  },
}
