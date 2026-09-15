/**
 * Authoring for 1.º.
 *
 * The mechanics every grade shares live in `@/content/authoring`; this module
 * re-exports them so the Templates of 1.º keep importing one place, and adds
 * the only piece that belongs to this year alone.
 */
export * from '@/content/authoring'

/**
 * Candidate calibration of Grade-1 strategy evidence.
 *
 * Narrative/Career only: it never reaches FairScore, Prestige or a competitive
 * opportunity. `reserve*` is the share of a capacity that reads as a deliberate
 * reserve — a description of a plan, not a threshold a plan is judged against.
 */
export const grade1StylePolicy = {
  id: 'grade-1-strategy-evidence',
  version: '1-candidate',
  official: false,
  evidence: 6,
  reserveNumerator: 1,
  reserveDenominator: 4,
} as const
