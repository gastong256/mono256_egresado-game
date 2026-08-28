/**
 * Interaction contracts.
 *
 * ADR-007 separates *what a challenge is about* from *how the player touches
 * it*. A mathematical category such as geometry is not a widget: the same
 * geometry problem could be presented as a decision card today and as a spatial
 * grid later. This module therefore models interactions independently of the
 * mathematics, as two parallel discriminated unions:
 *
 * - {@link InteractionPresentation} — everything the UI needs to draw, already
 *   formatted, and deliberately free of the solution.
 * - {@link InteractionAnswer} — the typed payload a player submits.
 *
 * Adding a member to `InteractionKind` intentionally breaks every exhaustive
 * consumer, including the renderer registry, until the new kind is handled.
 *
 * The families described in `docs/01-game-design/challenge-system.md` that are
 * not contracted yet — sequence/trend and the remaining special minigames — are
 * added by extending these unions; see the engine documentation for the steps.
 */

import type { NumberRule } from '../math/classification'

/** Interaction families contracted by this build. */
export type InteractionKind =
  | 'decision-card'
  | 'numeric-input'
  | 'budget-builder'
  | 'timeline'
  | 'chart-interpretation'
  | 'assignment-board'
  | 'information-request'
  | 'number-grid'

/** A single selectable option. `detail` carries the numbers the player compares. */
export interface PresentedOption {
  readonly id: string
  readonly label: string
  readonly detail?: string
}

export interface PresentedDatum {
  readonly label: string
  readonly value: string
  /** Unidad, debajo de la cifra. `28` / `minutos`. */
  readonly unit?: string
  /**
   * Este dato **es** la restricción de la situación.
   *
   * Lo declara quien autora el contenido, no la UI: cuál de los números aprieta
   * es una afirmación sobre el problema, y adivinarla desde la presentación
   * sería inventarla. La capa visual le pone el subrayado rojo sobre la cifra.
   */
  readonly constraint?: boolean
  /** Ocupa las dos columnas de la grilla. Para el dato del que trata la pantalla. */
  readonly span?: 1 | 2
}

export interface PresentedBudgetItem {
  readonly id: string
  readonly label: string
  readonly unitPrice: string
  readonly maxQuantity: number
}

export interface PresentedChartPoint {
  readonly label: string
  readonly value: number
  readonly display: string
}

export interface PresentedAgent {
  readonly id: string
  readonly label: string
  readonly detail: string
}

export interface PresentedTask {
  readonly id: string
  readonly label: string
  readonly detail: string
}

/** A datum the player may reveal before deciding. */
export interface RequestableInformation {
  readonly key: string
  readonly label: string
}

/**
 * Una ronda de clasificación sobre una grilla de números.
 *
 * La regla viaja dos veces a propósito. `ruleLabel` es la frase que el jugador
 * lee —«Múltiplos de 3»— y es obligatoria: la consigna nunca puede depender de
 * un color ni de una convención visual. `rule` es la misma regla en forma
 * legible por máquina, para que un cliente sepa qué está pidiendo sin parsear
 * castellano.
 *
 * `rule` **no es la solución**. La solución de esta familia es lo que el jugador
 * calcula con la regla y los números que ya tiene delante: los dos datos son
 * públicos por diseño, igual que los minutos de viaje en el desafío del
 * colectivo. Lo que nunca sale del motor es el evaluador, y ninguna capa fuera
 * de él decide si una celda estuvo bien.
 */
export interface PresentedGridRound {
  readonly id: string
  /** El paso de la coreografía al que corresponde: «Pañuelo blanco». */
  readonly cue: string
  /** La regla, escrita. Siempre presente, siempre en texto. */
  readonly ruleLabel: string
  readonly rule: NumberRule
  readonly numbers: readonly number[]
}

export type InteractionPresentation =
  | {
      readonly kind: 'decision-card'
      readonly data: readonly PresentedDatum[]
      readonly options: readonly PresentedOption[]
    }
  | {
      readonly kind: 'numeric-input'
      readonly data: readonly PresentedDatum[]
      readonly unitLabel: string
      readonly min: string
      readonly max: string
      readonly step: string
    }
  | {
      readonly kind: 'budget-builder'
      readonly data: readonly PresentedDatum[]
      readonly budgetLabel: string
      readonly items: readonly PresentedBudgetItem[]
    }
  | {
      readonly kind: 'timeline'
      readonly data: readonly PresentedDatum[]
      readonly unitLabel: string
      readonly options: readonly PresentedOption[]
    }
  | {
      readonly kind: 'chart-interpretation'
      readonly series: readonly PresentedChartPoint[]
      readonly axisLabel: string
      readonly options: readonly PresentedOption[]
    }
  | {
      readonly kind: 'assignment-board'
      readonly agents: readonly PresentedAgent[]
      readonly tasks: readonly PresentedTask[]
    }
  | {
      readonly kind: 'information-request'
      readonly data: readonly PresentedDatum[]
      readonly available: readonly RequestableInformation[]
      readonly revealed: readonly PresentedDatum[]
      readonly options: readonly PresentedOption[]
    }
  | {
      readonly kind: 'number-grid'
      readonly data: readonly PresentedDatum[]
      readonly rounds: readonly PresentedGridRound[]
      /** Columnas de la grilla. Las mismas para todas las rondas. */
      readonly columns: number
    }

export interface BudgetLine {
  readonly itemId: string
  readonly quantity: number
}

export interface AgentAssignment {
  readonly agentId: string
  readonly taskId: string
}

/**
 * Lo que el jugador marcó en una ronda.
 *
 * Son los números marcados, no índices de celda: un log de acciones tiene que
 * poder leerse sin la presentación al lado, y una ronda no repite números.
 * Marcar nada es una respuesta válida —el motor la evalúa como cualquier otra—,
 * así que una ronda vacía viaja igual y no se omite.
 */
export interface GridRoundSelection {
  readonly roundId: string
  readonly numbers: readonly number[]
}

export type InteractionAnswer =
  | { readonly kind: 'decision-card'; readonly optionId: string }
  /** Decimal literal as a string so no answer passes through a binary float. */
  | { readonly kind: 'numeric-input'; readonly value: string }
  | { readonly kind: 'budget-builder'; readonly lines: readonly BudgetLine[] }
  | { readonly kind: 'timeline'; readonly optionId: string }
  | { readonly kind: 'chart-interpretation'; readonly optionId: string }
  | {
      readonly kind: 'assignment-board'
      readonly assignments: readonly AgentAssignment[]
    }
  | { readonly kind: 'information-request'; readonly optionId: string }
  | {
      readonly kind: 'number-grid'
      readonly rounds: readonly GridRoundSelection[]
    }

/** Tools a challenge may enable, per FR-008. */
export type ToolId = 'calculator' | 'notepad' | 'table' | 'ruler'
