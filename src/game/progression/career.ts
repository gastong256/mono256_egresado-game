/**
 * Career state — the four visible dimensions of a run.
 *
 * `Promedio · Equipo · Aura · Estilo`. Nothing else is permanent. Energy, money
 * and similar quantities may exist as *local resources* inside one interaction;
 * they are never career statistics.
 *
 * Three rules shape this module and none of them is cosmetic:
 *
 * 1. **`null` is not zero.** A dimension the run has not touched yet has no
 *    value, and the UI renders nothing rather than a zero. Starting Promedio at
 *    0 would tell a player they are failing before a single grade exists.
 * 2. **Promedio is derived, not accumulated.** It is the average of real grades,
 *    so an event that exercises arithmetic without being academic — deciding
 *    which bus to take — does not move it.
 * 3. **Estilo is ternary and always sums to 100.** No axis is the wrong one: an
 *    Improvisador has to be able to graduate.
 *
 * Mastery per mathematical category and the narrative flags are hidden systems.
 * They are recorded because difficulty adaptation and branching need them; they
 * are never rendered.
 */

import { assertNever } from '../core/exhaustive'
import type { MathCategory, SolutionQuality } from '../challenges/taxonomy'

/** The three ways of acting the game recognises. */
export const ESTILO_AXES = ['aplicado', 'estratega', 'improvisador'] as const

export type EstiloAxis = (typeof ESTILO_AXES)[number]

/** Three shares that always add up to exactly 100. */
export type Estilo = Readonly<Record<EstiloAxis, number>>

export interface CareerState {
  /**
   * Real grades, in the order they were earned. Hidden: the player sees the
   * average, and the ledger of grades is what makes that average honest.
   */
  readonly grades: readonly number[]
  /** 0–100. `null` until the first genuinely collaborative event. */
  readonly equipo: number | null
  /** Signed, uncapped. `null` until the first socially memorable moment. */
  readonly aura: number | null
  readonly estilo: Estilo
  /**
   * How many decisions have pushed Estilo.
   *
   * The triangle only means something once there is behaviour behind it, so the
   * HUD waits for evidence instead of showing an even split that says nothing.
   */
  readonly estiloEvidence: number
  /**
   * Mastery per mathematical category, 0–1. Hidden.
   *
   * A category appears only once the run has exercised it: an absent key means
   * "no evidence", which is a different statement from "mastery 0".
   */
  readonly mastery: Readonly<Partial<Record<MathCategory, number>>>
}

/** Grades run on the Argentine 1–10 scale, with one decimal. */
export const PROMEDIO_MIN = 1
export const PROMEDIO_MAX = 10

/** Equipo is a record of conduct towards the group, not a meter to fill. */
export const EQUIPO_MIN = 0
export const EQUIPO_MAX = 100

/** Decisions needed before the Estilo triangle is worth showing. */
export const ESTILO_EVIDENCE_THRESHOLD = 3

/** How far one event may move a dimension. Content that exceeds it is rejected. */
export const EQUIPO_DELTA_BUDGET = 25
export const AURA_DELTA_BUDGET = 5000
export const ESTILO_NUDGE_BUDGET = 25
export const MASTERY_DELTA_BUDGET = 0.5

export interface EstiloNudge {
  readonly axis: EstiloAxis
  /** Positive weight added to the axis before renormalising. */
  readonly amount: number
}

export interface MasteryGain {
  readonly category: MathCategory
  readonly delta: number
}

/**
 * What one event may do to a career.
 *
 * Every key is optional and an event declares **only** the dimensions it can
 * genuinely touch. Absence is meaningful: the UI renders one chip per key
 * present in the object, so an omitted key produces no chip at all and
 * `Promedio +0` cannot exist.
 */
export interface CareerEffects {
  /** The grade this event puts, 1,0–10,0. Only genuinely academic events. */
  readonly grade?: number
  /** Change in conduct towards the group. */
  readonly equipo?: number
  /** Reputation points, signed. Only socially memorable moments. */
  readonly aura?: number
  readonly estilo?: EstiloNudge
  /** Hidden. Feeds future adaptive difficulty; never rendered. */
  readonly mastery?: readonly MasteryGain[]
}

/**
 * What actually moved, ready to render.
 *
 * The engine reports this instead of leaving the UI to diff two career states,
 * because "did Promedio change" is a domain question: a grade of exactly the
 * current average moves nothing visible but is still an academic event.
 */
export interface CareerChange {
  readonly promedio?: { readonly from: number | null; readonly to: number }
  readonly equipo?: {
    readonly from: number | null
    readonly to: number
    /** El movimiento que declaró el evento, para el chip. */
    readonly delta: number
  }
  readonly aura?: { readonly delta: number; readonly total: number }
  readonly estilo?: { readonly axis: EstiloAxis }
}

export function initialCareer(): CareerState {
  return {
    grades: [],
    equipo: null,
    aura: null,
    // An even split is the only honest starting point, and it stays hidden
    // until `estiloEvidence` says the triangle means something.
    estilo: { aplicado: 34, estratega: 33, improvisador: 33 },
    estiloEvidence: 0,
    mastery: {},
  }
}

function roundToOneDecimal(value: number): number {
  // `Math.round` on a scaled value keeps the result exactly representable at one
  // decimal, which matters because this number is compared in tests and written
  // into snapshots.
  return Math.round(value * 10) / 10
}

export function clampGrade(value: number): number {
  if (!Number.isFinite(value)) {
    return PROMEDIO_MIN
  }
  return roundToOneDecimal(
    Math.min(PROMEDIO_MAX, Math.max(PROMEDIO_MIN, value)),
  )
}

export function clampEquipo(value: number): number {
  if (!Number.isFinite(value)) {
    return EQUIPO_MIN
  }
  return Math.round(Math.min(EQUIPO_MAX, Math.max(EQUIPO_MIN, value)))
}

/**
 * The visible average, or `null` when no grade exists yet.
 *
 * Rounded to one decimal because that is how a school report writes it, and
 * because a player comparing `8,4` with `8,42` is being asked to read noise.
 */
export function promedio(career: CareerState): number | null {
  if (career.grades.length === 0) {
    return null
  }
  const total = career.grades.reduce((sum, grade) => sum + grade, 0)
  return roundToOneDecimal(total / career.grades.length)
}

/** Whether the triangle has enough behaviour behind it to be worth showing. */
export function isEstiloEstablished(career: CareerState): boolean {
  return career.estiloEvidence >= ESTILO_EVIDENCE_THRESHOLD
}

/**
 * Renormalises three weights into shares that sum to exactly 100.
 *
 * Plain rounding does not: `33,3 · 33,3 · 33,3` rounds to 99. The largest
 * remainder goes to the axis that lost the most, which keeps the operation
 * deterministic — the same weights always produce the same three integers, in
 * any engine, on any device.
 */
function normaliseEstilo(
  weights: Readonly<Record<EstiloAxis, number>>,
): Estilo {
  const total = ESTILO_AXES.reduce((sum, axis) => sum + weights[axis], 0)
  if (total <= 0) {
    return { aplicado: 34, estratega: 33, improvisador: 33 }
  }

  const exact = ESTILO_AXES.map((axis) => ({
    axis,
    value: (weights[axis] / total) * 100,
  }))
  const floored = exact.map((entry) => ({
    ...entry,
    floor: Math.floor(entry.value),
    remainder: entry.value - Math.floor(entry.value),
  }))

  let remaining = 100 - floored.reduce((sum, entry) => sum + entry.floor, 0)

  // Ties break on the canonical axis order, so the result never depends on the
  // sort implementation.
  const ranked = [...floored].sort((left, right) => {
    if (left.remainder !== right.remainder) {
      return right.remainder - left.remainder
    }
    return ESTILO_AXES.indexOf(left.axis) - ESTILO_AXES.indexOf(right.axis)
  })

  const shares: Record<EstiloAxis, number> = {
    aplicado: 0,
    estratega: 0,
    improvisador: 0,
  }
  for (const entry of floored) {
    shares[entry.axis] = entry.floor
  }
  for (const entry of ranked) {
    if (remaining <= 0) {
      break
    }
    shares[entry.axis] += 1
    remaining -= 1
  }

  return shares
}

export function nudgeEstilo(estilo: Estilo, nudge: EstiloNudge): Estilo {
  const weights: Record<EstiloAxis, number> = {
    aplicado: estilo.aplicado,
    estratega: estilo.estratega,
    improvisador: estilo.improvisador,
  }
  weights[nudge.axis] += Math.max(0, nudge.amount)
  return normaliseEstilo(weights)
}

function clampMastery(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.min(1, Math.max(0, Math.round(value * 1000) / 1000))
}

/**
 * Applies one event's effects, returning a new career and what changed.
 *
 * The change report is produced here, next to the arithmetic that caused it, so
 * no other layer has to know that a grade equal to the running average is still
 * an academic event.
 */
export function applyCareerEffects(
  career: CareerState,
  effects: CareerEffects,
): { readonly career: CareerState; readonly change: CareerChange } {
  let next = career
  const change: {
    promedio?: { from: number | null; to: number }
    equipo?: { from: number | null; to: number; delta: number }
    aura?: { delta: number; total: number }
    estilo?: { axis: EstiloAxis }
  } = {}

  if (effects.grade !== undefined) {
    const before = promedio(next)
    next = { ...next, grades: [...next.grades, clampGrade(effects.grade)] }
    const after = promedio(next)
    if (after !== null) {
      change.promedio = { from: before, to: after }
    }
  }

  if (effects.equipo !== undefined && effects.equipo !== 0) {
    const before = next.equipo
    // The first collaborative event establishes the dimension at the midpoint
    // plus its own delta: it is a record starting from neutral conduct, not a
    // meter starting empty.
    const base = before ?? Math.round((EQUIPO_MIN + EQUIPO_MAX) / 2)
    const after = clampEquipo(base + effects.equipo)
    next = { ...next, equipo: after }
    // El delta que se informa es el real tras el recorte, no el que pidió el
    // contenido: un chip que dice «+8» sobre una dimensión que estaba en 97 y
    // quedó en 100 estaría mintiendo.
    change.equipo = { from: before, to: after, delta: after - base }
  }

  if (effects.aura !== undefined && effects.aura !== 0) {
    const delta = Math.round(effects.aura)
    const total = (next.aura ?? 0) + delta
    next = { ...next, aura: total }
    change.aura = { delta, total }
  }

  if (effects.estilo !== undefined && effects.estilo.amount > 0) {
    next = {
      ...next,
      estilo: nudgeEstilo(next.estilo, effects.estilo),
      estiloEvidence: next.estiloEvidence + 1,
    }
    change.estilo = { axis: effects.estilo.axis }
  }

  if (effects.mastery !== undefined && effects.mastery.length > 0) {
    const mastery: Partial<Record<MathCategory, number>> = { ...next.mastery }
    for (const gain of effects.mastery) {
      // An untouched category starts from the midpoint: the first piece of
      // evidence should move it, not define it outright.
      const current = mastery[gain.category] ?? 0.5
      mastery[gain.category] = clampMastery(current + gain.delta)
    }
    next = { ...next, mastery }
  }

  return { career: next, change }
}

/** Whether anything visible moved. Used to decide if a chip row exists at all. */
export function hasVisibleChange(change: CareerChange): boolean {
  return (
    change.promedio !== undefined ||
    change.equipo !== undefined ||
    change.aura !== undefined ||
    change.estilo !== undefined
  )
}

/** Content-time validation. A non-empty result blocks the definition. */
export function validateCareerEffects(
  effects: CareerEffects,
  path = 'effects',
): readonly string[] {
  const issues: string[] = []

  if (effects.grade !== undefined) {
    if (!Number.isFinite(effects.grade)) {
      issues.push(`${path}: grade must be finite`)
    } else if (effects.grade < PROMEDIO_MIN || effects.grade > PROMEDIO_MAX) {
      issues.push(
        `${path}: grade ${String(effects.grade)} is outside ${String(PROMEDIO_MIN)}–${String(PROMEDIO_MAX)}`,
      )
    }
  }

  if (effects.equipo !== undefined) {
    if (!Number.isFinite(effects.equipo)) {
      issues.push(`${path}: equipo delta must be finite`)
    } else if (Math.abs(effects.equipo) > EQUIPO_DELTA_BUDGET) {
      issues.push(
        `${path}: equipo delta ${String(effects.equipo)} exceeds the ±${String(EQUIPO_DELTA_BUDGET)} budget`,
      )
    }
  }

  if (effects.aura !== undefined) {
    if (!Number.isFinite(effects.aura)) {
      issues.push(`${path}: aura delta must be finite`)
    } else if (Math.abs(effects.aura) > AURA_DELTA_BUDGET) {
      issues.push(
        `${path}: aura delta ${String(effects.aura)} exceeds the ±${String(AURA_DELTA_BUDGET)} budget`,
      )
    }
  }

  if (effects.estilo !== undefined) {
    const { axis, amount } = effects.estilo
    if (!isEstiloAxis(axis)) {
      issues.push(`${path}: unknown Estilo axis ${String(axis)}`)
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      issues.push(`${path}: Estilo nudge must be a positive amount`)
    } else if (amount > ESTILO_NUDGE_BUDGET) {
      issues.push(
        `${path}: Estilo nudge ${String(amount)} exceeds the ${String(ESTILO_NUDGE_BUDGET)} budget`,
      )
    }
  }

  for (const gain of effects.mastery ?? []) {
    if (!Number.isFinite(gain.delta)) {
      issues.push(`${path}: mastery delta must be finite`)
    } else if (Math.abs(gain.delta) > MASTERY_DELTA_BUDGET) {
      issues.push(
        `${path}: mastery delta ${String(gain.delta)} exceeds the ±${String(MASTERY_DELTA_BUDGET)} budget`,
      )
    }
  }

  return issues
}

/**
 * How much evidence one answer gives about a mathematical category.
 *
 * Applied by the engine from the challenge's declared categories rather than by
 * content, so every family contributes on the same scale and an author cannot
 * accidentally make one topic weigh five times another.
 */
const MASTERY_STEP: Readonly<Record<SolutionQuality, number>> = {
  optimal: 0.08,
  efficient: 0.05,
  functional: 0.02,
  invalid: -0.05,
}

export function masteryGainsFor(
  quality: SolutionQuality,
  categories: readonly MathCategory[],
): readonly MasteryGain[] {
  const delta = MASTERY_STEP[quality]
  return categories.map((category) => ({ category, delta }))
}

export function isEstiloAxis(value: string): value is EstiloAxis {
  return (ESTILO_AXES as readonly string[]).includes(value)
}

/** The axis a career leans on. Ties break on the canonical order. */
export function leadingEstiloAxis(estilo: Estilo): EstiloAxis {
  let best: EstiloAxis = 'aplicado'
  for (const axis of ESTILO_AXES) {
    if (estilo[axis] > estilo[best]) {
      best = axis
    }
  }
  return best
}

/** Spanish name of an axis, for labels and accessible descriptions. */
export function estiloAxisLabel(axis: EstiloAxis): string {
  switch (axis) {
    case 'aplicado':
      return 'Aplicado'
    case 'estratega':
      return 'Estratega'
    case 'improvisador':
      return 'Improvisador'
    default:
      return assertNever(axis)
  }
}
