/**
 * Nombre de cada etapa en castellano.
 *
 * El motor identifica las etapas con `StageId`; el jugador las conoce por su
 * nombre escolar. La traducción vive acá, en un solo lugar, para que agregar un
 * año no obligue a buscar cadenas sueltas por las pantallas.
 */

import type { StageConfig, StageId } from '@/game'

const STAGE_LABEL: Readonly<Record<StageId, string>> = {
  'grade-7': '7.º grado',
  'year-1': '1.º año',
  'year-2': '2.º año',
  'year-3': '3.º año',
  'year-4': '4.º año',
  'year-5': '5.º año',
  graduation: 'Egreso',
}

export function stageLabel(stage: StageId | string): string {
  return (
    (STAGE_LABEL as Readonly<Record<string, string | undefined>>)[stage] ??
    String(stage)
  )
}

/**
 * El numeral de una etapa, sin la palabra: «7.º», no «7.º grado».
 *
 * Es lo que va en un botón —«Pasar a 3.º»— y en el hito de cierre, donde la
 * palabra la pone el contexto. El egreso no tiene numeral y se nombra entero.
 */
export function stageNumeral(stage: StageId | string): string {
  const [numeral] = stageLabel(stage).split(' ')
  return numeral ?? stageLabel(stage)
}

/** La primera etapa que juega un content set, para nombrarla antes de empezar. */
export function firstStageLabel(stages: readonly StageConfig[]): string {
  const first = stages[0]
  return first === undefined ? 'la secundaria' : stageLabel(first.id)
}
