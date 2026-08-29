/**
 * Serialized form of a competitive score.
 *
 * A score crosses a boundary the moment it is submitted, stored or shown, and
 * on the other side it is data of unknown provenance. So it is parsed, never
 * cast — and parsing establishes shape only. Whether the numbers are *true* is
 * [`verifyScoreClaim`](./score-verification.ts), and a claim that parses
 * perfectly can still be a lie.
 */

import { z } from 'zod'

import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import { SCORE_COMPONENTS, SCORE_SCALE } from './competitive-policy'
import type { FairScoreResult } from './fair-score'

const basisPoints = z.int().min(0).max(SCORE_SCALE)

const componentSchema = z.object({
  component: z.enum(SCORE_COMPONENTS),
  opportunities: z.int().min(0).max(64),
  performance: basisPoints,
  declaredWeight: basisPoints,
  effectiveWeight: basisPoints,
  contribution: basisPoints,
})

/**
 * The claim, without the evidence.
 *
 * `evidence` is deliberately not part of the wire form: it is derived from the
 * authoritative history, so a submission carrying its own copy would only be
 * offering the verifier a version of the facts to compare against itself.
 */
const claimSchema = z.object({
  scorePolicyId: z.string().min(1).max(64),
  scorePolicyVersion: z.string().min(1).max(64),
  official: z.boolean(),
  fairScore: basisPoints,
  components: z.array(componentSchema).length(SCORE_COMPONENTS.length),
  mathRaw: z.int().min(0),
  mathMax: z.int().min(0),
  scoredBeats: z.int().min(0).max(64),
  optimalCount: z.int().min(0).max(64),
})

export type ScoreClaim = z.infer<typeof claimSchema>

/** The claim a result makes about itself, ready for JSON. */
export function serializeScoreClaim(result: FairScoreResult): ScoreClaim {
  return {
    scorePolicyId: result.scorePolicyId,
    scorePolicyVersion: result.scorePolicyVersion,
    official: result.official,
    fairScore: result.fairScore,
    components: result.components.map((component) => ({ ...component })),
    mathRaw: result.mathRaw,
    mathMax: result.mathMax,
    scoredBeats: result.scoredBeats,
    optimalCount: result.optimalCount,
  }
}

export function parseScoreClaim(
  value: unknown,
): Result<ScoreClaim, EngineRejection> {
  const parsed = claimSchema.safeParse(value)

  if (!parsed.success) {
    return err({
      kind: 'invalid-content',
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || 'score'}: ${issue.message}`,
      ),
    })
  }

  return ok(parsed.data)
}
