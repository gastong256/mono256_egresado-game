import { cn } from '@/lib/ui/cn'
import {
  BRAND_MARK_BOX,
  BRAND_MARK_DIAMOND,
  BRAND_MARK_INK,
} from '@/lib/ui/brand-mark'

import { Wordmark } from './wordmark'

/**
 * La marca.
 *
 * Dos piezas y una composición. `BrandMark` es el isotipo —la sumatoria con el
 * birrete y el listón—, inline y en `currentColor` como el resto de los glifos
 * del sistema, así que se recolorea por token y escala con la tipografía: mide
 * `1em` de alto y su ancho sale del viewBox. El rombo es lo único que lleva el
 * verde escolar; en `mono` cae a la tinta y sirve para invertir sobre un fondo
 * oscuro con un solo color.
 *
 * `BrandLogo` es el lockup horizontal: el isotipo apoyado en la línea base de
 * la palabra, que sigue siendo `Wordmark` —Schibsted Grotesk 800 en caja mixta,
 * texto seleccionable y buscable—. El símbolo va `aria-hidden` porque la
 * palabra ya dice quién es; el nombre accesible de un `<h1>` con el lockup es
 * «Egresado», igual que antes de que existiera el símbolo.
 *
 * No hay variante apilada: ninguna superficie la pide todavía. La geometría
 * vive en `src/lib/ui/brand-mark.ts`, que es también de donde salen los
 * archivos de `public/assets/brand/` y los íconos.
 */

export function BrandMark({
  className,
  mono = false,
}: {
  readonly className?: string
  /** Todo en `currentColor`, rombo incluido: para reversos y monocromo. */
  readonly mono?: boolean
}) {
  return (
    <svg
      viewBox={`0 0 ${String(BRAND_MARK_BOX.width)} ${String(BRAND_MARK_BOX.height)}`}
      aria-hidden="true"
      fill="currentColor"
      className={cn('h-[1em] w-auto shrink-0', className)}
      data-testid="brand-mark"
    >
      {Object.values(BRAND_MARK_INK).map((d) => (
        <path key={d} d={d} />
      ))}
      <path
        d={BRAND_MARK_DIAMOND}
        className={mono ? undefined : 'fill-green'}
      />
    </svg>
  )
}

/** El rol tipográfico de la palabra; el símbolo hereda el tamaño. */
const LOGO_SIZE = {
  sm: 'text-[17px] font-extrabold tracking-[-0.03em]',
  md: 'text-section',
  lg: 'text-display',
  event: 'text-event-title',
} as const

export function BrandLogo({
  size = 'md',
  mono = false,
  className,
}: {
  readonly size?: keyof typeof LOGO_SIZE
  readonly mono?: boolean
  readonly className?: string
}) {
  return (
    <span
      className={cn(
        'font-display text-ink inline-flex items-baseline gap-[0.28em]',
        LOGO_SIZE[size],
        className,
      )}
      data-testid="brand-logo"
    >
      <BrandMark mono={mono} />
      <Wordmark size="inherit" />
    </span>
  )
}
