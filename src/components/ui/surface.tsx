import { cva, type VariantProps } from 'class-variance-authority'
import type { ElementType, ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Superficie.
 *
 * La caja estructural del sistema: fondo, borde y radio. No sabe nada del
 * dominio —no es una tarjeta de situación ni un panel de feedback— y por eso
 * sirve para componer los dos.
 *
 * La jerarquía sale del fondo y del borde antes que de la sombra: una tarjeta
 * de juego no tiene por qué flotar como si fuera un modal.
 */

const surface = cva('rounded-surface', {
  variants: {
    tone: {
      default: 'bg-surface border border-line',
      muted: 'bg-surface-muted border border-line',
      raised: 'bg-surface border border-line shadow-raised',
      plain: 'bg-transparent',
    },
    padding: {
      none: '',
      compact: 'p-3',
      default: 'p-4',
      roomy: 'p-5',
    },
  },
  defaultVariants: { tone: 'default', padding: 'default' },
})

export interface SurfaceProps<T extends ElementType> extends VariantProps<
  typeof surface
> {
  readonly as?: T
  readonly className?: string
  readonly children?: ReactNode
}

export function Surface<T extends ElementType = 'div'>({
  as,
  tone,
  padding,
  className,
  ...rest
}: SurfaceProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof SurfaceProps<T>>) {
  const Component = (as ?? 'div') as ElementType

  return (
    <Component
      className={cn(surface({ tone, padding }), className)}
      {...rest}
    />
  )
}
