import { describe, expect, it } from 'vitest'

import {
  addClassification,
  classificationScore,
  classifyCell,
  countClassification,
  EMPTY_CLASSIFICATION,
  isEven,
  isMultipleOfThree,
  isNumberRule,
  isPrime,
  matchesRule,
  NUMBER_RULES,
  targetsFor,
  toNumber,
  type ClassificationCounts,
  type NumberRule,
} from '@/game'

/**
 * Clasificación de enteros y su puntuación.
 *
 * Es el módulo donde el juego decide qué es un número primo y cuánto vale una
 * grilla marcada. Un error acá no se ve como un bug: se ve como un juego que le
 * dice a alguien de doce años que se equivocó cuando tenía razón.
 *
 * Los casos no son ejemplos ilustrativos. Son la definición: 0 y 1 no son
 * primos, 2 sí, y una selección se juzga por precisión **y** cobertura porque
 * cada una sola tiene su propia forma de mentir.
 */

describe('paridad', () => {
  it('acepta los pares, incluido el cero', () => {
    for (const value of [0, 2, 4, 8, 12, 24, 30]) {
      expect(isEven(value)).toBe(true)
    }
  })

  it('rechaza los impares', () => {
    for (const value of [1, 3, 7, 9, 15, 21, 25]) {
      expect(isEven(value)).toBe(false)
    }
  })

  it('no clasifica lo que no es entero', () => {
    for (const value of [2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(isEven(value)).toBe(false)
    }
  })
})

describe('múltiplos de 3', () => {
  it('acepta los múltiplos', () => {
    for (const value of [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]) {
      expect(isMultipleOfThree(value)).toBe(true)
    }
  })

  it('rechaza lo que no lo es', () => {
    for (const value of [
      1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 20, 22, 25,
    ]) {
      expect(isMultipleOfThree(value)).toBe(false)
    }
  })
})

describe('primos', () => {
  it('el 0 no es primo', () => {
    expect(isPrime(0)).toBe(false)
  })

  it('el 1 no es primo: tiene un solo divisor', () => {
    expect(isPrime(1)).toBe(false)
  })

  it('el 2 es primo, y es el único primo par', () => {
    expect(isPrime(2)).toBe(true)
    expect(isEven(2)).toBe(true)
    for (let value = 4; value <= 40; value += 2) {
      expect(isPrime(value)).toBe(false)
    }
  })

  it('acepta los primos conocidos hasta 30', () => {
    expect(
      [...Array.from({ length: 31 }, (_, value) => value)].filter(isPrime),
    ).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29])
  })

  it('rechaza los compuestos impares que se confunden con primos', () => {
    // Los cuatro que más se marcan de más a esta edad.
    for (const value of [9, 15, 21, 25]) {
      expect(isPrime(value)).toBe(false)
    }
  })

  it('rechaza negativos y no enteros', () => {
    for (const value of [-7, -1, 7.5, Number.NaN]) {
      expect(isPrime(value)).toBe(false)
    }
  })
})

describe('la regla como dato', () => {
  it('despacha las tres reglas contratadas', () => {
    expect(NUMBER_RULES).toEqual(['even', 'multiple-of-three', 'prime'])
    expect(matchesRule('even', 8)).toBe(true)
    expect(matchesRule('multiple-of-three', 21)).toBe(true)
    expect(matchesRule('prime', 13)).toBe(true)
    expect(matchesRule('prime', 1)).toBe(false)
  })

  it('reconoce una regla escrita y descarta cualquier otra', () => {
    expect(isNumberRule('prime')).toBe(true)
    expect(isNumberRule('fibonacci')).toBe(false)
  })

  it('devuelve los objetivos en el orden de la grilla', () => {
    expect(
      targetsFor('multiple-of-three', [11, 12, 15, 17, 8, 21, 22, 14]),
    ).toEqual([12, 15, 21])
    expect(targetsFor('prime', [9, 2, 15, 7, 1, 13, 21, 6])).toEqual([2, 7, 13])
    expect(targetsFor('even', [7, 12, 15, 8, 21, 30, 9, 24])).toEqual([
      12, 8, 30, 24,
    ])
  })
})

describe('el estado de una celda corregida', () => {
  it('nombra las cuatro combinaciones', () => {
    expect(classifyCell('even', 12, true)).toBe('hit')
    expect(classifyCell('even', 12, false)).toBe('missed')
    expect(classifyCell('even', 7, true)).toBe('extra')
    expect(classifyCell('even', 7, false)).toBe('clear')
  })

  it('trata el 1 marcado en una ronda de primos como marca de más', () => {
    expect(classifyCell('prime', 1, true)).toBe('extra')
  })
})

describe('el conteo de una selección', () => {
  it('separa aciertos, marcas de más y objetivos sin marcar', () => {
    expect(countClassification([2, 4, 6], [2, 4, 9])).toEqual({
      truePositives: 2,
      falsePositives: 1,
      falseNegatives: 1,
    })
  })

  it('colapsa duplicados en lugar de inflar los aciertos', () => {
    expect(countClassification([2, 4], [2, 2, 2, 2])).toEqual({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 1,
    })
  })

  it('suma rondas sumando sus confusiones', () => {
    const first = countClassification([2, 4], [2])
    const second = countClassification([3, 9], [3, 9, 5])

    expect(addClassification(first, second)).toEqual({
      truePositives: 3,
      falsePositives: 1,
      falseNegatives: 1,
    })
    expect(addClassification(EMPTY_CLASSIFICATION, first)).toEqual(first)
  })
})

/** Puntúa un conteo y lo devuelve como tres números, para poder compararlos. */
function scoreOf(counts: ClassificationCounts): {
  precision: number
  coverage: number
  f1: number
} {
  const score = classificationScore(counts)
  return {
    precision: toNumber(score.precision),
    coverage: toNumber(score.coverage),
    f1: toNumber(score.f1),
  }
}

describe('precisión, cobertura y F1', () => {
  it('la clasificación perfecta vale 1 en las tres', () => {
    expect(
      scoreOf({ truePositives: 4, falsePositives: 0, falseNegatives: 0 }),
    ).toEqual({ precision: 1, coverage: 1, f1: 1 })
  })

  it('cierra el atajo de marcar una sola celda evidente', () => {
    // Precisión perfecta y cobertura de un cuarto: el F1 lo deja en 0,4 y no en
    // 1. Es el caso que motiva usar dos métricas y no una.
    const score = scoreOf({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 3,
    })

    expect(score.precision).toBe(1)
    expect(score.coverage).toBe(0.25)
    expect(score.f1).toBeCloseTo(0.4, 10)
  })

  it('cierra el atajo de marcar la grilla entera', () => {
    // Cobertura perfecta, precisión a la mitad.
    const score = scoreOf({
      truePositives: 4,
      falsePositives: 4,
      falseNegatives: 0,
    })

    expect(score.precision).toBe(0.5)
    expect(score.coverage).toBe(1)
    expect(score.f1).toBeCloseTo(2 / 3, 10)
  })

  it('penaliza las marcas de más aunque estén todos los objetivos', () => {
    const clean = scoreOf({
      truePositives: 4,
      falsePositives: 0,
      falseNegatives: 0,
    })
    const noisy = scoreOf({
      truePositives: 4,
      falsePositives: 1,
      falseNegatives: 0,
    })

    expect(noisy.f1).toBeLessThan(clean.f1)
    expect(noisy.coverage).toBe(1)
  })

  it('penaliza la cobertura parcial aunque no haya marcas de más', () => {
    const score = scoreOf({
      truePositives: 2,
      falsePositives: 0,
      falseNegatives: 2,
    })

    expect(score.precision).toBe(1)
    expect(score.coverage).toBe(0.5)
    expect(score.f1).toBeCloseTo(2 / 3, 10)
  })

  it('no marcar nada no es acertar', () => {
    // Denominador cero en la precisión, y la decisión es explícita: 0, no 1.
    expect(
      scoreOf({ truePositives: 0, falsePositives: 0, falseNegatives: 4 }),
    ).toEqual({ precision: 0, coverage: 0, f1: 0 })
  })

  it('una ronda sin objetivos y sin marcas está resuelta', () => {
    expect(
      scoreOf({ truePositives: 0, falsePositives: 0, falseNegatives: 0 }),
    ).toEqual({ precision: 1, coverage: 1, f1: 1 })
  })

  it('una ronda sin objetivos donde se marcó algo no está resuelta', () => {
    expect(
      scoreOf({ truePositives: 0, falsePositives: 3, falseNegatives: 0 }),
    ).toEqual({ precision: 0, coverage: 1, f1: 0 })
  })

  it('marcar todo mal vale cero', () => {
    expect(
      scoreOf({ truePositives: 0, falsePositives: 4, falseNegatives: 4 }),
    ).toEqual({ precision: 0, coverage: 0, f1: 0 })
  })

  it('coincide con la media armónica cuando ésta está definida', () => {
    const cases: readonly ClassificationCounts[] = [
      { truePositives: 3, falsePositives: 1, falseNegatives: 1 },
      { truePositives: 7, falsePositives: 2, falseNegatives: 5 },
      { truePositives: 1, falsePositives: 9, falseNegatives: 1 },
      { truePositives: 12, falsePositives: 0, falseNegatives: 1 },
    ]

    for (const counts of cases) {
      const { precision, coverage, f1 } = scoreOf(counts)
      expect(f1).toBeCloseTo(
        (2 * precision * coverage) / (precision + coverage),
        10,
      )
    }
  })

  it('es exacto: el F1 sale como racional y no como flotante', () => {
    // 2·1 / (2·1 + 0 + 2) = 1/2, exacto en el numerador y el denominador.
    const score = classificationScore({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 2,
    })

    expect(score.f1).toEqual({ n: 1n, d: 2n })
    expect(score.coverage).toEqual({ n: 1n, d: 3n })
  })

  it('rechaza un conteo imposible en lugar de puntuarlo', () => {
    expect(() =>
      classificationScore({
        truePositives: -1,
        falsePositives: 0,
        falseNegatives: 0,
      }),
    ).toThrow(/non-negative/u)
    expect(() =>
      classificationScore({
        truePositives: 1.5,
        falsePositives: 0,
        falseNegatives: 0,
      }),
    ).toThrow(/integer/u)
  })
})

describe('las tres reglas juntas', () => {
  it('cada regla clasifica el mismo número de forma independiente', () => {
    const numbers = [1, 2, 3, 6, 9, 12]
    const byRule: Record<NumberRule, readonly number[]> = {
      even: targetsFor('even', numbers),
      'multiple-of-three': targetsFor('multiple-of-three', numbers),
      prime: targetsFor('prime', numbers),
    }

    expect(byRule.even).toEqual([2, 6, 12])
    expect(byRule['multiple-of-three']).toEqual([3, 6, 9, 12])
    // El 6 y el 12 cumplen dos reglas, el 1 no cumple ninguna: las reglas no
    // particionan la grilla, y eso es parte del ejercicio.
    expect(byRule.prime).toEqual([2, 3])
  })
})
