/**
 * Cognitive difficulty of a challenge template.
 *
 * `difficulty-and-playability.md` is explicit about where difficulty may come
 * from, and the list is entirely structural: relations to combine, simultaneous
 * constraints, information to filter, planning depth, optimisation, uncertainty.
 * It is equally explicit about where it may **not** come from — bigger numbers,
 * uglier decimals, advanced formulas, speed pressure — because that produces an
 * exam in a costume and punishes whoever reasons well and computes slowly.
 *
 * So difficulty here is not a number an author picks. It is six declared traits
 * of the task's structure, and the band and the scheduling cost are derived from
 * them by a pure function. An author who wants a template to read as `stretch`
 * has to say which trait makes it so.
 *
 * ## Why six, and not thirty
 *
 * Because every one of them changes what the player has to hold in their head at
 * once, and because a trait nobody can classify consistently is worse than no
 * trait at all. This is engineering calibration, not psychometrics: it produces
 * a defensible ordering, and a teacher can move a template between bands at the
 * Gate without anything in the engine changing.
 *
 * ## What this is not
 *
 * It is not score. `difficulty-and-playability.md` keeps the scheduling cost and
 * the score multiplier apart on purpose: the scheduler needs a strong signal to
 * balance a run, and the score needs a weak one so the draw never beats skill.
 * Nothing in this module knows what a point is.
 */

import type { DifficultyLevel } from '../challenges/taxonomy'

/**
 * The structural traits that make a task demanding.
 *
 * Each is a small bounded integer, and each has a written meaning an author can
 * apply to a template they did not write.
 */
export interface CognitiveProfile {
  /**
   * Reasoning steps that must be chained before any answer exists.
   *
   * One means a single relation applied once. Four means a chain long enough
   * that losing an intermediate result loses the problem.
   */
  readonly steps: 1 | 2 | 3 | 4
  /**
   * Constraints that must hold **simultaneously** in a valid answer.
   *
   * A budget alone is one. A budget plus a minimum quantity is two, and it is
   * more than twice as hard, because neither can be satisfied in isolation.
   */
  readonly constraints: 0 | 1 | 2 | 3
  /**
   * How much of the work is deciding which data matters.
   *
   * Zero when every number on screen is needed. Three when the task presents
   * alternatives or irrelevant detail the player has to filter first.
   */
  readonly selection: 0 | 1 | 2 | 3
  /**
   * Whether a merely workable answer is enough.
   *
   * Zero: feasibility. One: the best of a presented set. Two: the best over a
   * space the player has to construct.
   */
  readonly optimization: 0 | 1 | 2
  /** Statistical reading, estimation or judgement under incomplete information. */
  readonly uncertainty: 0 | 1 | 2
  /**
   * Whether the answer must be **produced** rather than recognised.
   *
   * The clearest case in the game is the bus family: one template puts the
   * answer among four departures and the work is elimination; the other asks for
   * the number and there is nothing to eliminate.
   */
  readonly construction: 0 | 1
}

/**
 * Authoring band, from `difficulty-and-playability.md`.
 *
 * Never shown to a player. It exists so content authoring, run composition and a
 * future Teacher Gate can talk about the same thing.
 */
export const DIFFICULTY_BANDS = ['core', 'standard', 'stretch'] as const

export type DifficultyBand = (typeof DIFFICULTY_BANDS)[number]

export function isDifficultyBand(value: string): value is DifficultyBand {
  return (DIFFICULTY_BANDS as readonly string[]).includes(value)
}

/**
 * The load a profile represents.
 *
 * A plain sum, deliberately. Weighting the traits against each other would
 * claim a precision nobody has measured, and the ordering it produces is the
 * only thing the composer needs. The traits are already scaled so that the ones
 * that cost more attention have more room.
 */
export function cognitiveLoad(profile: CognitiveProfile): number {
  return (
    profile.steps +
    profile.constraints +
    profile.selection +
    profile.optimization +
    profile.uncertainty +
    profile.construction
  )
}

/** The lightest and heaviest profiles the type admits. */
export const MIN_COGNITIVE_LOAD = 1
export const MAX_COGNITIVE_LOAD = 15

/**
 * Where one band ends and the next begins.
 *
 * Read against the band descriptions in the design doc: `core` is one main
 * relation with minimal branching, `standard` is two relations or a short chain
 * with a comparison, `stretch` is several constraints, optimisation or
 * conflicting goals. A load of four cannot hold two relations *and* a
 * comparison; a load of eight cannot avoid holding several things at once.
 *
 * These two integers are the whole calibration surface. Moving one reclassifies
 * content without touching a line of composition logic, which is exactly what a
 * Teacher Gate needs to be able to do.
 */
export const BAND_THRESHOLDS = {
  /** Up to and including this load, a template is `core`. */
  core: 4,
  /** Up to and including this load, a template is `standard`. */
  standard: 7,
} as const

export function bandOf(profile: CognitiveProfile): DifficultyBand {
  const load = cognitiveLoad(profile)
  if (load <= BAND_THRESHOLDS.core) {
    return 'core'
  }
  if (load <= BAND_THRESHOLDS.standard) {
    return 'standard'
  }
  return 'stretch'
}

/**
 * The documentary correspondence with the engine's 1–5 scale.
 *
 * `difficulty-and-playability.md` calls this «una lectura documental, no una
 * migración», and that is exactly what it stays. `DifficultyLevel` is the knob
 * the runtime difficulty policy turns; the band is the structural classification
 * the composer schedules by. They answer different questions and they are
 * allowed to disagree — where they do, it is a calibration finding for the Gate,
 * recorded in the difficulty audit, not a bug for the engine to reconcile.
 */
export function documentedLevelsFor(
  band: DifficultyBand,
): readonly DifficultyLevel[] {
  switch (band) {
    case 'core':
      return [1, 2]
    case 'standard':
      return [3]
    case 'stretch':
      return [4, 5]
  }
}

/** True when a template's authored `baseDifficulty` matches its derived band. */
export function agreesWithDocumentedLevel(
  band: DifficultyBand,
  level: DifficultyLevel,
): boolean {
  return documentedLevelsFor(band).includes(level)
}
