import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Botón.
 *
 * Es un `<button>` de verdad: nada de `div` con `role`. Eso ya trae teclado,
 * envío de formulario y estado deshabilitado sin escribir una línea.
 *
 * Las variantes describen jerarquía, no color. `primary` es la acción de la
 * pantalla y usa el verde de marca; `danger` es destructiva y usa un rojo
 * distinto del acento de marca, para que borrar una partida y un momento
 * narrativo intenso no se vean igual.
 *
 * No lleva `use client`: es presentación pura. El cliente lo aporta quien le
 * pasa un `onClick`.
 */

const button = cva(
  cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-sans',
    'border border-transparent text-center whitespace-nowrap',
    'motion-fast transition-[background-color,border-color,color]',
    'disabled:cursor-not-allowed disabled:border-disabled-line',
    'disabled:bg-disabled-surface disabled:text-disabled-foreground',
  ),
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
        secondary: cn(
          'bg-surface text-foreground border-line-interactive',
          'hover:bg-surface-muted active:bg-surface-muted',
        ),
        ghost:
          'bg-transparent text-foreground hover:bg-surface-muted active:bg-surface-muted',
        danger:
          'bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-hover',
      },
      size: {
        // Los tres tamaños superan el objetivo táctil de 44 px de alto salvo
        // `sm`, que existe sólo para acciones secundarias en una fila densa.
        sm: 'min-h-9 px-3 text-body-sm',
        md: 'min-h-11 px-4 text-subheading',
        lg: 'min-h-14 px-6 text-heading',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
)

export interface ButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>,
    VariantProps<typeof button> {
  readonly className?: string
  readonly children: ReactNode
}

export function Button({
  variant,
  size,
  block,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      // Un `<button>` dentro de un formulario envía por defecto; explicitarlo
      // evita envíos accidentales cuando el botón sólo abre un panel.
      type={type}
      className={cn(button({ variant, size, block }), className)}
      {...rest}
    />
  )
}
