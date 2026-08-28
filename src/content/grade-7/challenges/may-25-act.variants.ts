/**
 * Variantes del acto del 25 de Mayo.
 *
 * **Generada, con la coreografía fija.** Los pasos —pañuelo blanco, pañuelo
 * celeste, zapateo— y sus reglas son la escena y no se tocan: son lo que hace
 * que la matemática ocurra en público. Lo que se genera son los números.
 *
 * Y es la parte que más lo necesita. Tres grillas de ocho números fijas son el
 * contenido más memorizable del juego: la segunda vez que un chico juega el
 * acto, ya sabe qué celdas marcar. Generar los números sin tocar la escena es
 * exactamente lo que la variabilidad tiene que resolver.
 *
 * ## Generación por restricción
 *
 * Se elige primero **cuántos objetivos** tiene que tener la ronda, y recién
 * después se buscan números que cumplan. Entre tres y cinco de ocho: con menos,
 * marcar una celda evidente ya resuelve la ronda; con más, marcar la grilla
 * entera casi acierta. Las dos degeneraciones están cerradas por construcción.
 *
 * ## Oráculo independiente
 *
 * La clasificación se recomprueba con implementaciones propias de paridad,
 * divisibilidad y primalidad: la primalidad, por división por tentativa. El
 * motor tiene las suyas, y el sentido de esta validación es no repetir el mismo
 * error dos veces.
 */

import {
  paramsValidator,
  variantDiagnostic,
  type CandidateContext,
  type VariantSourceSpec,
} from '@/game'

/** Las tres reglas del acto, en el orden de la coreografía. */
export const ACT_RULES = ['even', 'multiple-of-three', 'prime'] as const

export type ActRule = (typeof ACT_RULES)[number]

export interface May25Params {
  /** Ocho números por ronda, en el orden de la coreografía. */
  readonly rounds: readonly (readonly number[])[]
}

/** Celdas de una ronda. Cuatro columnas por dos filas. */
export const CELLS_PER_ROUND = 8

/** El número más grande que se puede clasificar de cabeza en un escenario. */
export const MAX_CELL = 30

/** Objetivos por ronda: ni tan pocos que marcar uno alcance, ni tantos que marcar todo sirva. */
export const MIN_TARGETS = 3
export const MAX_TARGETS = 4

/**
 * Objetivos de toda la coreografía, y de dónde sale el número.
 *
 * El acto promete que **marcar la grilla entera no sirve**: es cobertura
 * perfecta con precisión de la mitad, y el F1 tiene que castigarlo. Esa promesa
 * no es una propiedad de una ronda sino del acto completo, porque el F1 se
 * micro-agrega sobre las tres.
 *
 * Marcando las 24 celdas hay `T` aciertos y `24 − T` marcas de más, así que
 * `F1 = 2T / (T + 24)`. Para que quede debajo del umbral de «Parcial», que es
 * 7/10:
 *
 *     20·T < 7·(T + 24)   ⟺   13·T < 168   ⟺   T ≤ 12
 *
 * De ahí salen los dos números: doce objetivos como techo del acto, y cuatro
 * por ronda como techo constructivo que lo respeta con tres rondas.
 *
 * El umbral vive acá como par de enteros y no importado del desafío —eso sería
 * un ciclo—; hay un test de contenido que comprueba que sigan siendo el mismo.
 */
export const MAX_TOTAL_TARGETS = 12
export const FUNCTIONAL_THRESHOLD = { numerator: 7n, denominator: 10n } as const

/** Primalidad por división por tentativa. Independiente de la del motor. */
export function isPrimeByTrialDivision(value: number): boolean {
  if (!Number.isInteger(value) || value < 2) return false
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return false
  }
  return true
}

/** Clasificación independiente: no usa el clasificador del desafío. */
export function matchesActRule(rule: ActRule, value: number): boolean {
  switch (rule) {
    case 'even':
      return value % 2 === 0
    case 'multiple-of-three':
      return value % 3 === 0
    case 'prime':
      return isPrimeByTrialDivision(value)
  }
}

const ALL_CELLS = Array.from({ length: MAX_CELL }, (_, index) => index + 1)

function generateRound(
  rule: ActRule,
  targetCount: number,
  rng: {
    nextInt(min: number, max: number): number
    shuffle<T>(items: readonly T[]): T[]
  },
): readonly number[] {
  const targets = ALL_CELLS.filter((value) => matchesActRule(rule, value))
  const others = ALL_CELLS.filter((value) => !matchesActRule(rule, value))

  const chosenTargets = rng.shuffle(targets).slice(0, targetCount)
  const chosenOthers = rng
    .shuffle(others)
    .slice(0, CELLS_PER_ROUND - targetCount)

  return rng.shuffle([...chosenTargets, ...chosenOthers])
}

/**
 * Cuántos objetivos lleva cada ronda.
 *
 * Se construye desde el techo del acto y no al revés: tres objetivos por ronda
 * como piso, y los que sobran hasta `MAX_TOTAL_TARGETS` se reparten de a uno
 * entre rondas distintas. Sortear cada ronda por separado y comprobar el total
 * después sería descartar y volver a intentar, que es exactamente lo que la
 * generación por restricción evita.
 */
function targetCounts(rng: {
  nextInt(min: number, max: number): number
  shuffle<T>(items: readonly T[]): T[]
}): readonly number[] {
  const rounds = ACT_RULES.length
  const floor = MIN_TARGETS * rounds
  const extra = rng.nextInt(0, Math.min(MAX_TOTAL_TARGETS - floor, rounds))
  const favoured = new Set(
    rng.shuffle(ACT_RULES.map((_, index) => index)).slice(0, extra),
  )

  return ACT_RULES.map((_, index) =>
    favoured.has(index) ? MIN_TARGETS + 1 : MIN_TARGETS,
  )
}

function generateAct({ rng }: CandidateContext): May25Params {
  const counts = targetCounts(rng.derive('target-counts'))

  return {
    rounds: ACT_RULES.map((rule, index) =>
      generateRound(
        rule,
        counts[index] ?? MIN_TARGETS,
        rng.derive('round', index),
      ),
    ),
  }
}

const validateAct = paramsValidator<May25Params>((params, ref) => {
  const diagnostics = []
  let totalTargets = 0

  if (params.rounds.length !== ACT_RULES.length) {
    diagnostics.push(
      variantDiagnostic(
        'template-invariant',
        ref,
        `el acto tiene ${String(params.rounds.length)} pasos y la coreografía son ${String(ACT_RULES.length)}`,
      ),
    )
    return diagnostics
  }

  for (const [index, numbers] of params.rounds.entries()) {
    const rule = ACT_RULES[index]
    if (rule === undefined) continue
    const label = `paso ${String(index + 1)}`

    if (numbers.length !== CELLS_PER_ROUND) {
      diagnostics.push(
        variantDiagnostic(
          'option-count',
          ref,
          `${label}: ${String(numbers.length)} celdas`,
        ),
      )
      continue
    }
    if (new Set(numbers).size !== numbers.length) {
      diagnostics.push(
        variantDiagnostic(
          'duplicate-option',
          ref,
          `${label}: repite un número`,
        ),
      )
    }
    if (
      numbers.some(
        (value) =>
          !Number.isSafeInteger(value) || value < 1 || value > MAX_CELL,
      )
    ) {
      diagnostics.push(
        variantDiagnostic(
          'unreasonable-value',
          ref,
          `${label}: hay un número fuera de 1..${String(MAX_CELL)}`,
        ),
      )
      continue
    }

    const targets = numbers.filter((value) => matchesActRule(rule, value))
    if (targets.length < MIN_TARGETS) {
      diagnostics.push(
        variantDiagnostic(
          'trivial-decision',
          ref,
          `${label}: ${String(targets.length)} objetivos, marcar uno ya casi resuelve`,
        ),
      )
    }
    if (targets.length > MAX_TARGETS) {
      diagnostics.push(
        variantDiagnostic(
          'trivial-decision',
          ref,
          `${label}: ${String(targets.length)} objetivos, marcar todo casi acierta`,
        ),
      )
    }

    totalTargets += targets.length
  }

  /*
   * La estrategia degenerada, comprobada sobre el acto entero.
   *
   * Se recalcula el F1 de marcar las 24 celdas con aritmética entera —sin pasar
   * por los racionales del desafío ni por su evaluador— y se exige que quede
   * **estrictamente** debajo del umbral de «Parcial». Un acto donde marcar todo
   * zafa contradice lo que el evento existe para enseñar.
   */
  const marked = CELLS_PER_ROUND * ACT_RULES.length
  const { numerator, denominator } = FUNCTIONAL_THRESHOLD
  const f1Numerator = BigInt(2 * totalTargets)
  const f1Denominator = BigInt(totalTargets + marked)
  if (f1Numerator * denominator >= numerator * f1Denominator) {
    diagnostics.push(
      variantDiagnostic(
        'trivial-decision',
        ref,
        `${String(totalTargets)} objetivos en total: marcar las ${String(marked)} celdas alcanzaría para zafar`,
      ),
    )
  }

  return diagnostics
})

const AUTHORED_ROUNDS: readonly {
  readonly id: string
  readonly rounds: readonly (readonly number[])[]
}[] = [
  {
    id: 'coreografia-a',
    rounds: [
      [7, 12, 15, 8, 21, 30, 9, 24],
      [11, 12, 15, 17, 8, 21, 22, 14],
      [9, 2, 15, 7, 1, 13, 21, 6],
    ],
  },
  {
    id: 'coreografia-b',
    rounds: [
      [13, 6, 9, 20, 25, 14, 11, 18],
      [10, 9, 16, 24, 7, 13, 27, 20],
      [4, 11, 9, 5, 25, 3, 12, 1],
    ],
  },
  {
    id: 'coreografia-c',
    rounds: [
      [5, 16, 23, 10, 19, 22, 7, 4],
      [14, 18, 5, 12, 20, 30, 11, 8],
      [15, 17, 8, 23, 1, 9, 19, 21],
    ],
  },
]

export const may25ActVariants: VariantSourceSpec<May25Params> = {
  authored: AUTHORED_ROUNDS,
  generator: {
    id: 'may-25.grid.constraint-first',
    // 2: los objetivos pasaron a construirse desde el techo del acto, así que
    // la misma dirección produce otra coreografía. Subirla es lo que dice en
    // voz alta que `grade-7-dev-1` y `grade-7-dev-2` no comparten contenido acá.
    version: '2',
    candidateSpace: 20_000,
    generate: generateAct,
  },
  validators: [validateAct],
  canonical: (params) => ({
    rounds: params.rounds.map((numbers) => [...numbers]),
  }),
}
