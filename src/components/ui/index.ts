/**
 * API pública de las primitivas de UI.
 *
 * Los componentes de juego importan desde acá y no desde los archivos internos.
 * Es un barrel chico y sin ciclos: sólo reexporta hojas del árbol, ninguna de
 * las cuales importa nada de `@/components/game`.
 *
 * Todo lo de esta carpeta es agnóstico del dominio. Una primitiva no sabe qué es
 * una `SolutionQuality` ni un `CareerState`: como mucho sabe que existen cuatro
 * tonos de resultado, que es vocabulario visual.
 */

export { Badge, Eyebrow, Label, type BadgeProps } from './badge'
export { Button, type ButtonProps } from './button'
export { Callout } from './callout'
export {
  ChoiceCard,
  type ChoiceCardProps,
  type ChoiceState,
} from './choice-card'
export {
  DataGrid,
  DataMetric,
  Ledger,
  RecordRow,
  type DataGridItem,
} from './data-metric'
export { NumberField, TextField } from './field'
export {
  MilestoneTick,
  PartialMark,
  SlashMark,
  TickMark,
  type MarkProps,
} from './marks'
export { OUTCOME_TONES, type OutcomeTone } from './outcome-tone'
export { StageProgress } from './progress'
export { QuantityStepper } from './quantity-stepper'
export { Separator } from './separator'
export { Stamp, Surface, type SurfaceProps } from './surface'
export { Wordmark } from './wordmark'
