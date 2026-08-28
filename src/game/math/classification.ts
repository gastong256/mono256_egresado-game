/**
 * Reglas de clasificación de números enteros.
 *
 * Un desafío de grilla le pide al jugador que separe los números que cumplen una
 * regla de los que no. La regla es contenido —la elige quien autora— pero
 * *decidir si un número la cumple* es matemática, y la matemática vive acá: en
 * un módulo puro, sin React, sin DOM y sin estado, que se puede testear número
 * por número.
 *
 * Que exista un solo lugar donde se decide qué es un número primo no es
 * prolijidad: es lo que impide que la pantalla pinte una celda de verde según una
 * regla y el motor la evalúe con otra.
 *
 * Las tres reglas son las que un curso de 7.º ya trabajó: paridad, múltiplos y
 * primos. No hay una cuarta hasta que un contenido la necesite.
 */

import { assertNever } from '../core/exhaustive'

export const NUMBER_RULES = ['even', 'multiple-of-three', 'prime'] as const

export type NumberRule = (typeof NUMBER_RULES)[number]

export function isNumberRule(value: string): value is NumberRule {
  return (NUMBER_RULES as readonly string[]).includes(value)
}

/**
 * Par: entero divisible por 2.
 *
 * El cero es par. Un no entero no es ni par ni impar, así que la pregunta se
 * responde `false` en lugar de romper.
 */
export function isEven(value: number): boolean {
  return Number.isSafeInteger(value) && value % 2 === 0
}

/** Múltiplo de 3: entero divisible por 3. El cero es múltiplo de todos. */
export function isMultipleOfThree(value: number): boolean {
  return Number.isSafeInteger(value) && value % 3 === 0
}

/**
 * Primo: entero mayor que 1 con exactamente dos divisores positivos, 1 y él
 * mismo.
 *
 * De la definición se siguen los tres casos que siempre se discuten en un aula y
 * que siempre hay que testear: **0 no es primo**, **1 no es primo** —tiene un
 * solo divisor— y **2 sí lo es**, el único primo par.
 *
 * La división de prueba llega hasta la raíz: si `n = a × b` con `a ≤ b`, entonces
 * `a ≤ √n`, así que un divisor mayor que la raíz ya habría aparecido antes como
 * el otro factor.
 */
export function isPrime(value: number): boolean {
  if (!Number.isSafeInteger(value) || value < 2) {
    return false
  }
  if (value < 4) {
    // 2 y 3.
    return true
  }
  if (value % 2 === 0) {
    return false
  }
  for (let divisor = 3; divisor * divisor <= value; divisor += 2) {
    if (value % divisor === 0) {
      return false
    }
  }
  return true
}

/** Si un número cumple la regla. El único punto de decisión del sistema. */
export function matchesRule(rule: NumberRule, value: number): boolean {
  switch (rule) {
    case 'even':
      return isEven(value)
    case 'multiple-of-three':
      return isMultipleOfThree(value)
    case 'prime':
      return isPrime(value)
    default:
      return assertNever(rule)
  }
}

/** Los números de la grilla que cumplen la regla, en el orden en que aparecen. */
export function targetsFor(
  rule: NumberRule,
  numbers: readonly number[],
): readonly number[] {
  return numbers.filter((value) => matchesRule(rule, value))
}

/**
 * Cómo quedó una celda una vez corregida la grilla.
 *
 * Las cuatro combinaciones de «cumplía la regla» × «la marcó», nombradas, para
 * que ni el motor ni la UI tengan que volver a razonarlas:
 *
 * | | marcada | sin marcar |
 * |---|---|---|
 * | **cumple** | `hit` | `missed` |
 * | **no cumple** | `extra` | `clear` |
 */
export type CellClassification = 'hit' | 'extra' | 'missed' | 'clear'

export function classifyCell(
  rule: NumberRule,
  value: number,
  selected: boolean,
): CellClassification {
  if (matchesRule(rule, value)) {
    return selected ? 'hit' : 'missed'
  }
  return selected ? 'extra' : 'clear'
}
