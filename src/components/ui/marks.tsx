import { cn } from '@/lib/ui/cn'

/**
 * La marca de corrección.
 *
 * El tilde verde y el tachado rojo del docente, convertidos en sistema. Es el
 * device de Egresado: cae **sobre** el dato o la opción, nunca en un marco
 * alrededor. Eso es exactamente lo que lo separa de un frame deportivo.
 *
 * Los tres son SVG inline con `currentColor`, no un icon font ni un archivo: se
 * recolorean por token, escalan sin pipeline, y el trazo cuadrado (`linecap:
 * square`) los mantiene dentro de la geometría de radio 0 del resto del sistema.
 *
 * Van `aria-hidden` sin excepción. La marca acompaña una palabra —«Óptimo»,
 * «Insuficiente»— que ya dice lo mismo; anunciarla dos veces es ruido.
 */

export interface MarkProps {
  readonly className?: string
}

/** Resultado conseguido. */
export function TickMark({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn('size-4', className)}
    >
      <path
        d="M3 11 L7.5 15.5 L17 4"
        stroke="currentColor"
        strokeWidth={3}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  )
}

/** No alcanzó. */
export function SlashMark({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn('size-5', className)}
    >
      <path
        d="M2 16 L18 4"
        stroke="currentColor"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  )
}

/**
 * Resolvió una parte.
 *
 * Un cuadrado lleno, no un tilde a medias: la forma tiene que separarse del
 * tilde de un vistazo y en escala de grises.
 */
export function PartialMark({ className }: MarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('block size-[11px] bg-current', className)}
    />
  )
}

/**
 * El tilde grande del cierre de etapa.
 *
 * Mismo gesto que `TickMark` con el trazo más pesado, porque a 32 px un trazo de
 * 3 se ve fino al lado de un numeral de 66 px.
 */
export function MilestoneTick({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 34 34"
      aria-hidden="true"
      className={cn('text-green size-8', className)}
    >
      <path
        d="M4 18 L12 26 L30 6"
        stroke="currentColor"
        strokeWidth={5}
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  )
}
