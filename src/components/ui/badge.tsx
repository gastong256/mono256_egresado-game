import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Etiqueta corta.
 *
 * Para nombrar una etapa, un estado o un momento: «7.º GRADO», «ÓPTIMO».
 *
 * Ninguna variante se distingue sólo por color: todas llevan borde propio y el
 * texto siempre dice lo que la etiqueta significa. Un lector de pantalla y una
 * persona con daltonismo leen exactamente lo mismo que el resto.
 */

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-label uppercase',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted border-line-strong text-foreground-muted',
        brand:
          'bg-primary-subtle border-primary text-primary-subtle-foreground',
        accent: 'bg-accent-subtle border-accent text-accent-subtle-foreground',
        outline: 'bg-transparent border-line-interactive text-foreground-muted',
        inverse:
          'bg-surface-inverse border-transparent text-foreground-inverse',
      },
    },
    defaultVariants: { tone: 'neutral' },
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
    <span className={cn(badge({ tone }), className)} {...rest}>
      {children}
    </span>
  )
}
