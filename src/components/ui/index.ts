/**
 * API pública de las primitivas de UI.
 *
 * Los componentes de juego importan desde acá y no desde los archivos internos.
 * Es un barrel chico y sin ciclos: sólo reexporta hojas del árbol, ninguna de
 * las cuales importa nada de `@/components/game`.
 */

export { Badge, type BadgeProps } from './badge'
export { Button, type ButtonProps } from './button'
export { Callout } from './callout'
export { ChoiceCard } from './choice-card'
export { NumberField, TextField } from './field'
export { Progress } from './progress'
export { QuantityStepper } from './quantity-stepper'
export { Separator } from './separator'
export { Surface } from './surface'
export { Wordmark } from './wordmark'
