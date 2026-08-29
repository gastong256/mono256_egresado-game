/**
 * Verifying a competitive score claim.
 *
 * The browser is not an authority ([ADR-004](../../../docs/03-architecture/adr/ADR-004-server-authoritative-scoring.md)),
 * and a claimed score is the most obviously worth lying about of everything a
 * client can send. This module answers one question: given the authoritative
 * history and a named policy, is the claim what the rules actually produce?
 *
 * It does **not** compare against a number the client also sent as the truth. It
 * recomputes from the run's own evidence and then checks the claim against that
 * — the same discipline the variant pipeline uses between a generator and its
 * validator, and the run composer between itself and its plan validator. A
 * verifier that trusted any part of the claim would be a formatter.
 *
 * Every field is checked, not only the total: a breakdown whose parts were
 * edited to tell a different story about a matching total is still a false
 * breakdown, and the page that renders it is the one a teacher would read.
 */

import { ok, type Result } from '../core/result'
import type { ContentCatalog } from '../challenges/content-catalog'
import { scoreRun, type FairScoreResult, type ScoredEvent } from './fair-score'
import type { ScoringFailure } from './fair-score'
import type { CompetitiveScorePolicy } from './competitive-policy'
import type { ScoreClaim } from './score-codec'

export const SCORE_CLAIM_ISSUES = [
  /** The claim names a policy this verifier was not given. */
  'unknown-score-policy',
  /** The claim's total is not what the rules produce. */
  'fair-score-mismatch',
  /** A component's performance, weight or contribution was altered. */
  'component-mismatch',
  /** The audited mathematical sums do not match. */
  'math-total-mismatch',
  /** The claim reports a different number of scored beats. */
  'beat-count-mismatch',
  /** The claim says a development policy is official, or the reverse. */
  'maturity-mismatch',
] as const

export type ScoreClaimIssueCode = (typeof SCORE_CLAIM_ISSUES)[number]

export interface ScoreClaimIssue {
  readonly code: ScoreClaimIssueCode
  readonly subject: string
  readonly claimed: string
  readonly actual: string
}

export interface ScoreVerification {
  /** What the rules produce for this run. The only number worth keeping. */
  readonly canonical: FairScoreResult
  /** Empty when the claim told the truth about every field. */
  readonly issues: readonly ScoreClaimIssue[]
}

function issue(
  code: ScoreClaimIssueCode,
  subject: string,
  claimed: number | string | boolean,
  actual: number | string | boolean,
): ScoreClaimIssue {
  return {
    code,
    subject,
    claimed: String(claimed),
    actual: String(actual),
  }
}

/**
 * Recomputes the score and reports every way the claim differs from it.
 *
 * Returns the canonical result even when the claim was wrong: rejecting a
 * submission is not the same as being unable to score it, and a caller usually
 * wants both facts.
 */
export function verifyScoreClaim(
  claim: ScoreClaim,
  events: readonly ScoredEvent[],
  catalog: ContentCatalog,
  policy: CompetitiveScorePolicy,
): Result<ScoreVerification, ScoringFailure> {
  if (
    claim.scorePolicyId !== policy.id ||
    claim.scorePolicyVersion !== policy.version
  ) {
    // Recomputing under a policy the claim did not name would answer a
    // different question than the one asked, so this is refused rather than
    // reported as a mismatch of numbers.
    return ok({
      canonical: {
        scorePolicyId: policy.id,
        scorePolicyVersion: policy.version,
        official: policy.official,
        fairScore: 0,
        components: [],
        mathRaw: 0,
        mathMax: 0,
        scoredBeats: 0,
        optimalCount: 0,
        evidence: [],
      },
      issues: [
        issue(
          'unknown-score-policy',
          'policy',
          `${claim.scorePolicyId}@${claim.scorePolicyVersion}`,
          `${policy.id}@${policy.version}`,
        ),
      ],
    })
  }

  const scored = scoreRun(events, catalog, policy)
  if (!scored.ok) {
    return scored
  }
  const canonical = scored.value
  const issues: ScoreClaimIssue[] = []

  if (claim.fairScore !== canonical.fairScore) {
    issues.push(
      issue(
        'fair-score-mismatch',
        'fairScore',
        claim.fairScore,
        canonical.fairScore,
      ),
    )
  }
  if (claim.official !== canonical.official) {
    issues.push(
      issue(
        'maturity-mismatch',
        'official',
        claim.official,
        canonical.official,
      ),
    )
  }
  if (claim.mathRaw !== canonical.mathRaw) {
    issues.push(
      issue('math-total-mismatch', 'mathRaw', claim.mathRaw, canonical.mathRaw),
    )
  }
  if (claim.mathMax !== canonical.mathMax) {
    issues.push(
      issue('math-total-mismatch', 'mathMax', claim.mathMax, canonical.mathMax),
    )
  }
  if (claim.scoredBeats !== canonical.scoredBeats) {
    issues.push(
      issue(
        'beat-count-mismatch',
        'scoredBeats',
        claim.scoredBeats,
        canonical.scoredBeats,
      ),
    )
  }
  if (claim.optimalCount !== canonical.optimalCount) {
    issues.push(
      issue(
        'beat-count-mismatch',
        'optimalCount',
        claim.optimalCount,
        canonical.optimalCount,
      ),
    )
  }

  for (const actual of canonical.components) {
    const claimed = claim.components.find(
      (component) => component.component === actual.component,
    )
    if (claimed === undefined) {
      issues.push(
        issue('component-mismatch', actual.component, 'absent', 'present'),
      )
      continue
    }
    for (const field of [
      'performance',
      'declaredWeight',
      'effectiveWeight',
      'contribution',
      'opportunities',
    ] as const) {
      if (claimed[field] !== actual[field]) {
        issues.push(
          issue(
            'component-mismatch',
            `${actual.component}.${field}`,
            claimed[field],
            actual[field],
          ),
        )
      }
    }
  }

  return ok({ canonical, issues })
}
