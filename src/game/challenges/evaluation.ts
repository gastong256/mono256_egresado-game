/**
 * Shared evaluation helpers.
 *
 * Every challenge produces the same structured result shape, so scoring,
 * difficulty adaptation and the profile engine can consume any family without
 * knowing which one produced the answer.
 */

import { EngineInvariantError } from '../core/invariant'
import {
  compare,
  divide,
  fromInteger,
  rational,
  subtract,
  ZERO,
  type Rational,
} from '../math/rational'
import { absolute, isZero, toNumber } from '../math/rational'
import type { ReasoningMetrics } from './contracts'
import type { SolutionQuality } from './taxonomy'

/** Clamps a metric into the documented 0..1 range. */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new EngineInvariantError(
      `metric must be finite, received ${String(value)}`,
    )
  }
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

export interface MetricsInput {
  readonly efficiency?: number
  readonly precision?: number
  readonly risk?: number
  readonly informationUse?: number
}

export function metrics(input: MetricsInput): ReasoningMetrics {
  return {
    efficiency: clamp01(input.efficiency ?? 0),
    precision: clamp01(input.precision ?? 0),
    risk: clamp01(input.risk ?? 0),
    informationUse: clamp01(input.informationUse ?? 0),
  }
}

/**
 * Precision as a 0..1 score from the relative distance to a target.
 *
 * Computed on rationals and only converted to a number at the very end, where
 * the value is a soft metric rather than an authoritative comparison.
 */
export function precisionFromDistance(
  submitted: Rational,
  target: Rational,
): number {
  if (isZero(target)) {
    return compare(submitted, target) === 0 ? 1 : 0
  }

  const relative = divide(
    absolute(subtract(submitted, target)),
    absolute(target),
  )
  return clamp01(1 - toNumber(relative))
}

/**
 * Efficiency as a 0..1 score comparing consumed resources against the optimum.
 *
 * `optimal / used`, so using exactly the optimum scores 1 and overspending
 * degrades smoothly.
 */
export function efficiencyFromUsage(optimal: Rational, used: Rational): number {
  if (isZero(used)) {
    return 0
  }
  return clamp01(toNumber(divide(optimal, used)))
}

/** Ranks qualities so policies can compare outcomes without a lookup table. */
export function qualityRank(quality: SolutionQuality): 0 | 1 | 2 | 3 {
  switch (quality) {
    case 'invalid':
      return 0
    case 'functional':
      return 1
    case 'efficient':
      return 2
    case 'optimal':
      return 3
  }
}

/** Fraction of the offered optional information the player consulted. */
export function informationUseRatio(
  revealedCount: number,
  availableCount: number,
): number {
  if (availableCount <= 0) {
    return 0
  }
  return clamp01(revealedCount / availableCount)
}

/**
 * Conteo de una clasificación, en el vocabulario habitual.
 *
 * `TP` son los aciertos, `FP` lo que se marcó de más y `FN` lo que quedó sin
 * marcar. Los tres se cuentan por separado porque una sola cifra no distingue
 * dos errores opuestos: marcar todo y marcar una sola celda pueden dar la misma
 * cantidad de aciertos y son partidas completamente distintas.
 */
export interface ClassificationCounts {
  /** Objetivos efectivamente marcados. */
  readonly truePositives: number
  /** Marcados que no eran objetivo. */
  readonly falsePositives: number
  /** Objetivos que quedaron sin marcar. */
  readonly falseNegatives: number
}

export const EMPTY_CLASSIFICATION: ClassificationCounts = {
  truePositives: 0,
  falsePositives: 0,
  falseNegatives: 0,
}

function assertCount(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new EngineInvariantError(
      `${label} must be a non-negative integer, received ${String(value)}`,
    )
  }
}

/**
 * Cuenta una selección contra el conjunto de objetivos.
 *
 * Los duplicados se colapsan de los dos lados: una respuesta que llega con la
 * misma celda dos veces vale lo mismo que si la trajera una sola. Eso no es
 * tolerancia con un cliente descuidado, es cerrar la puerta a inflar `TP`
 * repitiendo un acierto.
 */
export function countClassification(
  targets: readonly number[],
  selected: readonly number[],
): ClassificationCounts {
  const targetSet = new Set(targets)
  const selectedSet = new Set(selected)

  let truePositives = 0
  let falsePositives = 0
  for (const value of selectedSet) {
    if (targetSet.has(value)) {
      truePositives += 1
    } else {
      falsePositives += 1
    }
  }

  let falseNegatives = 0
  for (const value of targetSet) {
    if (!selectedSet.has(value)) {
      falseNegatives += 1
    }
  }

  return { truePositives, falsePositives, falseNegatives }
}

/** Suma dos conteos. Varias rondas se agregan sumando sus confusiones. */
export function addClassification(
  left: ClassificationCounts,
  right: ClassificationCounts,
): ClassificationCounts {
  return {
    truePositives: left.truePositives + right.truePositives,
    falsePositives: left.falsePositives + right.falsePositives,
    falseNegatives: left.falseNegatives + right.falseNegatives,
  }
}

export interface ClassificationScore {
  /** De lo que marcaste, cuánto correspondía. */
  readonly precision: Rational
  /** De lo que correspondía, cuánto marcaste. */
  readonly coverage: Rational
  /** La media armónica de las dos. La cifra con la que se juzga. */
  readonly f1: Rational
}

/**
 * Precisión, cobertura y F1, exactas.
 *
 * **Por qué no alcanza con la precisión.** `TP / (TP + FP)` premia marcar poco:
 * quien encuentra un solo múltiplo de 3 evidente y no marca nada más saca 100 %
 * de precisión sin haber hecho la tarea. La cobertura sola tiene el defecto
 * simétrico: marcar la grilla entera la lleva al 100 %. Sólo juzgando las dos
 * juntas las dos degeneraciones quedan afuera.
 *
 * F1 se calcula por su forma cerrada `2·TP / (2·TP + FP + FN)`, que es igual a
 * la media armónica pero no divide dos veces: no hay un denominador intermedio
 * que pueda dar cero, y el resultado es un racional exacto sobre enteros, así que
 * comparar contra un umbral no depende de un float.
 *
 * Los tres casos de denominador cero se deciden acá y no en cada contenido:
 *
 * - **no marcó nada y había objetivos** → precisión 0. No marcar no es acertar.
 * - **no había objetivos y no marcó nada** → los tres valen 1: la ronda estaba
 *   resuelta de entrada y no hay nada que reprochar.
 * - **no había objetivos y marcó algo** → precisión 0, cobertura 1, F1 0.
 */
export function classificationScore(
  counts: ClassificationCounts,
): ClassificationScore {
  assertCount(counts.truePositives, 'truePositives')
  assertCount(counts.falsePositives, 'falsePositives')
  assertCount(counts.falseNegatives, 'falseNegatives')

  const selected = counts.truePositives + counts.falsePositives
  const targets = counts.truePositives + counts.falseNegatives
  const harmonic =
    2 * counts.truePositives + counts.falsePositives + counts.falseNegatives

  const one = fromInteger(1)

  return {
    precision:
      selected === 0
        ? targets === 0
          ? one
          : ZERO
        : rational(BigInt(counts.truePositives), BigInt(selected)),
    coverage:
      targets === 0
        ? one
        : rational(BigInt(counts.truePositives), BigInt(targets)),
    f1:
      harmonic === 0
        ? one
        : rational(BigInt(2 * counts.truePositives), BigInt(harmonic)),
  }
}
