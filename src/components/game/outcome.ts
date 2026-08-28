/**
 * Cómo se llama y cómo se ve cada calidad de resultado.
 *
 * El motor habla el vocabulario del GDD —`invalid · functional · efficient ·
 * optimal`, con sus factores de score documentados— y el jugador lee el
 * vocabulario del sistema de diseño v0.2: **Insuficiente · Parcial · Resuelto ·
 * Óptimo**. La correspondencia es posicional y total, así que traducir acá no
 * pierde ni inventa nada, y el motor no se toca: cambiar el nombre de una
 * calidad en el dominio habría movido factores de score, tests golden y la
 * huella del ruleset por una decisión de rótulo.
 *
 * Ninguno de los cuatro se distingue sólo por color: cada uno lleva
 * **glifo + palabra + borde superior**, tres canales de los cuales ninguno es
 * cromático por sí solo. Todo el set se lee en escala de grises.
 */

import type { SolutionQuality } from '@/game'
import type { OutcomeTone } from '@/components/ui'

export interface OutcomePresentation {
  readonly tone: OutcomeTone
  /** La palabra. Siempre está escrita; el color sólo refuerza. */
  readonly label: string
  /** Qué significa, en una frase y sin retar a nadie. */
  readonly meaning: string
}

export const OUTCOME: Readonly<Record<SolutionQuality, OutcomePresentation>> = {
  optimal: {
    tone: 'optimal',
    label: 'Óptimo',
    meaning: 'Alcanzó y era la mejor opción disponible.',
  },
  efficient: {
    tone: 'resolved',
    label: 'Resuelto',
    meaning: 'Alcanzó, pero gastando más de lo necesario.',
  },
  functional: {
    tone: 'partial',
    label: 'Parcial',
    meaning: 'Resolvió una parte. La historia sigue igual.',
  },
  invalid: {
    tone: 'insufficient',
    label: 'Insuficiente',
    meaning: 'No alcanzó. Tiene consecuencia, no bloquea.',
  },
}
