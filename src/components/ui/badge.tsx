import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Chip.
 *
 * Para decir en dos palabras qué se movió: «Promedio 8,0 → 8,4», «Estratega ↑».
 * Radio 0, tabular, y **siempre con signo o flecha**: ninguno de los cuatro
 * tonos se distingue sólo por color, así que en escala de grises un chip que
 * subió y uno que bajó siguen siendo distintos.
 *
 * - `up` / `down` — una dimensión visible se movió, lleno y con signo.
 * - `outline` — tendencia de Estilo, contorno de tinta.
 * - `soft` — secundario: acompaña, no anuncia.
 */

const badge = cva(
  'text-chip font-display inline-flex items-center gap-1 px-[9px] py-[5px]',
  {
    variants: {
      tone: {
        up: 'bg-green text-white',
        down: 'bg-red text-white',
        outline: 'border-ink text-ink border-[1.5px]',
        soft: 'bg-canvas-sunken border-rule text-ink-secondary border',
      },
    },
    defaultVariants: { tone: 'soft' },
  },
)

export interface BadgeProps
  extends
    Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'children'>,
    VariantProps<typeof badge> {
  readonly className?: string
  readonly children: ReactNode
}

export function Badge({ tone, className, children, ...rest }: BadgeProps) {
  return (
    <span data-numeric className={cn(badge({ tone }), className)} {...rest}>
      {children}
    </span>
  )
}

/**
 * Eyebrow: la línea roja de arriba del título.
 *
 * El rojo acá es tensión narrativa —«Segunda semana», «Feria escolar»—, nunca un
 * error. Es una de las tres cosas que hacen que una pantalla se lea como
 * Egresado y no como un formulario.
 */
export function Eyebrow({
  children,
  tone = 'accent',
  className,
}: {
  readonly children: ReactNode
  readonly tone?: 'accent' | 'muted'
  readonly className?: string
}) {
  return (
    <span
      className={cn(
        'text-eyebrow font-display uppercase',
        tone === 'accent' ? 'text-red' : 'text-ink-label',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Etiqueta en versalitas.
 *
 * Las mayúsculas quedan para esto y sólo para esto: 9–11 px. El uppercase en
 * títulos era la mitad de la huella deportiva de v0.1.
 */
export function Label({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <span
      className={cn(
        'text-label font-display text-ink-label uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}
