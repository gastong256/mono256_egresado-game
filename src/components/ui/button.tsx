import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Botón.
 *
 * Es un `<button>` de verdad: nada de `div` con `role`. Eso ya trae teclado,
 * envío de formulario y estado deshabilitado sin escribir una línea.
 *
 * `primary` es la lima, y la lima es **sólo** un botón: es el único saturado que
 * pisa el papel, y el momento en que aparece en cualquier otra cosa deja de
 * significar «acá se sigue». Existe exactamente un primario montado por
 * pantalla, y siempre es el último elemento del shell — salvo mientras se está
 * decidiendo, donde vive dentro del bloque oscuro junto a las opciones.
 *
 * `surface` no es una variante estética: el deshabilitado de papel (`#E6E4DC`
 * sobre tinta) desaparece contra la pizarra del bloque de decisión, así que el
 * botón necesita saber sobre qué está apoyado para elegir su propio gris.
 *
 * No lleva `use client`: es presentación pura. El cliente lo aporta quien le
 * pasa un `onClick`.
 */

const button = cva(
  cn(
    'inline-flex items-center justify-center gap-2 border-0 text-center',
    // Sin `motion-select`: el botón cambia de color de golpe. Un fundido de
    // deshabilitado a lima se puede ver a mitad de camino —un escaneo de
    // contraste lo mide gris sobre pizarra un instante después de habilitarse—
    // y no aporta nada: la lima aparece cuando la respuesta está completa, y
    // ese momento tiene que leerse como un cambio de estado, no como una
    // transición.
    'font-display cursor-pointer',
    'disabled:cursor-not-allowed',
  ),
  {
    variants: {
      variant: {
        primary: cn(
          'text-action w-full uppercase',
          'bg-action text-on-action hover:bg-action-hover',
          'active:scale-[0.99]',
        ),
        secondary: cn(
          'text-action border-ink text-ink border-[1.5px] bg-transparent uppercase',
          'hover:bg-canvas-sunken',
        ),
        // El ghost es texto subrayado: una salida, no una acción de la pantalla.
        ghost: cn(
          'text-ink-secondary bg-transparent text-[0.8125rem] font-bold underline',
          'hover:text-ink',
        ),
      },
      surface: { paper: '', decision: '' },
      size: {
        // 50 px el primario, 46 el secundario: los dos por encima del objetivo
        // táctil de 44.
        lg: 'min-h-[50px] px-6',
        md: 'min-h-[46px] px-5',
        sm: 'min-h-11 px-4',
      },
    },
    compoundVariants: [
      {
        variant: 'primary',
        surface: 'paper',
        class:
          'disabled:bg-action-disabled disabled:text-on-action-disabled disabled:active:scale-100',
      },
      {
        variant: 'primary',
        surface: 'decision',
        class:
          'disabled:bg-action-disabled-dark disabled:text-on-action-disabled-dark disabled:active:scale-100',
      },
      {
        variant: 'secondary',
        surface: 'decision',
        class: 'border-on-decision text-on-decision hover:bg-decision-raised',
      },
      {
        variant: 'ghost',
        surface: 'decision',
        class: 'text-on-decision-muted hover:text-on-decision',
      },
      {
        variant: 'secondary',
        surface: 'paper',
        class: 'disabled:border-rule disabled:text-disabled-ink',
      },
    ],
    defaultVariants: { variant: 'primary', size: 'lg', surface: 'paper' },
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
  surface,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      // Un `<button>` dentro de un formulario envía por defecto; explicitarlo
      // evita envíos accidentales cuando el botón sólo abre un panel.
      type={type}
      // Marca el primario para que «existe exactamente uno montado a la vez»
      // sea una invariante que un test pueda contar. Contarlos por color no
      // sirve: el primario deshabilitado no es lima, y seguiría siendo el
      // primario de la pantalla.
      {...(variant === 'primary' || variant === undefined || variant === null
        ? { 'data-primary': 'true' }
        : {})}
      className={cn(button({ variant, size, surface }), className)}
      {...rest}
    />
  )
}
