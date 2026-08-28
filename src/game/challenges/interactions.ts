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
 * not contracted yet — spatial grid, sequence/trend and special minigames — are
 * added by extending these unions; see the engine documentation for the steps.
 */

/** Interaction families contracted by this build. */
export type InteractionKind =
  | 'decision-card'
  | 'numeric-input'
  | 'budget-builder'
  | 'timeline'
  | 'chart-interpretation'
  | 'assignment-board'
  | 'information-request'

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

export interface BudgetLine {
  readonly itemId: string
  readonly quantity: number
}

export interface AgentAssignment {
  readonly agentId: string
  readonly taskId: string
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

/** Tools a challenge may enable, per FR-008. */
export type ToolId = 'calculator' | 'notepad' | 'table' | 'ruler'
