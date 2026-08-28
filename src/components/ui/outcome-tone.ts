/**
 * Los cuatro tonos de resultado, como vocabulario visual.
 *
 * Vive en la capa de primitivas y no en la de juego a propósito: una ChoiceCard
 * resuelta necesita saber de qué color es la marca de corrección, pero no tiene
 * por qué saber qué es una `SolutionQuality`. La traducción del vocabulario del
 * motor a estos cuatro tonos la hace `components/game/outcome.ts`, en un solo
 * lugar.
 */

export type OutcomeTone = 'optimal' | 'resolved' | 'partial' | 'insufficient'

export const OUTCOME_TONES: readonly OutcomeTone[] = [
  'optimal',
  'resolved',
  'partial',
  'insufficient',
]
