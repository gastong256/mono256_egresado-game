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
  | 'quantity-builder'
  | 'schedule-builder'
  | 'spatial-layout'

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

/** Counts or uses, without implying money. The unit/rate is authored text. */
export interface PresentedQuantityItem {
  readonly id: string
  readonly label: string
  readonly detail: string
  readonly maxQuantity: number
  /**
   * Short text code for the positions a distribution fills («Jue», «Desc»).
   *
   * Authored, because initials collide and a colour cannot be the only way to
   * tell two categories apart.
   */
  readonly code?: string
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
  /** Omission is an intentional decision, not an unfinished draft. */
  readonly optional?: boolean
}

export interface SchedulePlacement {
  readonly activityId: string
  /** Minutes since midnight, not a DOM coordinate or localized string. */
  readonly startMinute: number
}
/**
 * One block of a schedule, with the public numbers the player plans with.
 *
 * Duration, preparation and place are given data, not the solution: the plan
 * is which start the player picks for each block, and whether the chain of
 * durations, preparations and trips between places fits.
 */
export interface PresentedActivity {
  readonly id: string
  readonly label: string
  readonly detail: string
  /** Place label, e.g. «Escuela». Two blocks in different places need a trip. */
  readonly location: string
  readonly durationMinutes: number
  /** Preparation needed on site right before the block starts. */
  readonly setupMinutes: number
  /** Starts the player may pick, minutes since midnight, ascending. */
  readonly startMinutes: readonly number[]
  readonly optional: boolean
}
export interface SpatialPlacement {
  readonly objectId: string
  readonly x: number
  readonly y: number
  readonly rotation: 0 | 90
}
export interface GridCell {
  readonly x: number
  readonly y: number
}
export interface PresentedSpatialObject {
  readonly id: string
  readonly label: string
  /** Short text code drawn inside the cells the object occupies («A», «P»). */
  readonly code: string
  readonly widthCells: number
  readonly heightCells: number
  readonly detail: string
  readonly rotatable: boolean
  readonly optional: boolean
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
      readonly kind: 'schedule-builder'
      readonly data: readonly PresentedDatum[]
      readonly instructions: string
      readonly activities: readonly PresentedActivity[]
      /**
       * The public time axis: when the plan may start and the fixed limit it
       * has to meet, minutes since midnight.
       */
      readonly span: { readonly from: number; readonly to: number }
    }
  | {
      readonly kind: 'spatial-layout'
      readonly data: readonly PresentedDatum[]
      readonly instructions: string
      readonly width: number
      readonly height: number
      readonly cellCentimeters: number
      readonly blocked: readonly GridCell[]
      readonly clearance: readonly GridCell[]
      readonly entrances: readonly GridCell[]
      readonly objects: readonly PresentedSpatialObject[]
    }
  | {
      readonly kind: 'quantity-builder'
      readonly data: readonly PresentedDatum[]
      readonly items: readonly PresentedQuantityItem[]
      readonly instructions: string
      /**
       * Equiprobable positions the counts fill, when the plan is a
       * distribution (the Grid/Select/Classify counts mode of a wheel).
       *
       * Absent for a resource plan: there the running total *is* the
       * challenge, so the renderer must not add it up for the player.
       */
      readonly positions?: number
    }
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
  | {
      readonly kind: 'classification'
      readonly data: readonly PresentedDatum[]
      readonly instructions: string
      /** Lo que hay que clasificar: afirmaciones, escenarios, propuestas. */
      readonly statements: readonly PresentedStatement[]
      /** Las etiquetas disponibles, las mismas para todos los enunciados. */
      readonly labels: readonly PresentedLabel[]
      /**
       * La acción pública, cuando la plantilla declara una.
       *
       * Vive aparte de las etiquetas a propósito: clasificar es la acción
       * matemática y esto es lo que el curso dice después. Son dos decisiones,
       * y el evaluador las lee de dos campos distintos para que ninguna pueda
       * pagarse dos veces.
       */
      readonly stance?: {
        readonly prompt: string
        readonly options: readonly PresentedLabel[]
      }
    }

/** Un enunciado a clasificar, con el dato que lo sostiene. */
export interface PresentedStatement {
  readonly id: string
  readonly label: string
  readonly detail?: string
}

/** Una etiqueta disponible. El id viaja en la respuesta; el label se lee. */
export interface PresentedLabel {
  readonly id: string
  readonly label: string
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
  | {
      readonly kind: 'schedule-builder'
      readonly placements: readonly SchedulePlacement[]
    }
  | {
      readonly kind: 'spatial-layout'
      readonly placements: readonly SpatialPlacement[]
    }
  | { readonly kind: 'quantity-builder'; readonly lines: readonly BudgetLine[] }
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
  | {
      readonly kind: 'classification'
      readonly entries: readonly ClassificationEntry[]
      /** La acción pública, sólo cuando la presentación la ofrece. */
      readonly stance?: string
    }

/** La etiqueta que el jugador le puso a un enunciado. */
export interface ClassificationEntry {
  readonly statementId: string
  readonly labelId: string
}

/** Tools a challenge may enable, per FR-008. */
export type ToolId = 'calculator' | 'notepad' | 'table' | 'ruler'
