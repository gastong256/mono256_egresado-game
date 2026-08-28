import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Bloque insertado.
 *
 * La regla de fondo del sistema: el papel cuadriculado es el fondo de **toda**
 * pantalla, y el fondo liso queda reservado para bloques insertados —caja de
 * dato, ledger, sello, Aura, superficie de decisión—. Así el papel se ve
 * alrededor y el bloque se lee como un objeto apoyado encima, no como un
 * párrafo.
 *
 * Sin radio y sin sombra: la profundidad la da el peso del borde y el contraste
 * de fondo, igual que un impreso.
 */

const surface = cva('', {
  variants: {
    tone: {
      /** Papel liso con regla fina: lo que rodea, no lo que se lee. */
      paper: 'bg-surface border-rule border',
      /** Caja de dato: borde de tinta de 1,5 px. */
      data: 'bg-surface border-ink border-[1.5px]',
      /** Hundido: una nota al costado del flujo. */
      sunken: 'bg-canvas-sunken border-rule border',
      /** Superficie de decisión. El foco cae donde hay que elegir. */
      decision: 'bg-decision text-on-decision',
      /** La única isla negra del sistema. */
      aura: 'bg-aura-surface',
    },
    padding: {
      none: '',
      compact: 'p-[10px]',
      default: 'p-4',
      roomy: 'p-5',
    },
  },
  defaultVariants: { tone: 'paper', padding: 'default' },
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
      // El anillo de foco se invierte sobre las dos superficies oscuras; lo
      // declara el contenedor y no cada control de adentro.
      {...(tone === 'decision'
        ? { 'data-surface': 'decision' }
        : tone === 'aura'
          ? { 'data-surface': 'aura' }
          : {})}
      className={cn(surface({ tone, padding }), className)}
      {...rest}
    />
  )
}

/**
 * Sello.
 *
 * Rotado −3°, con borde de 2 px en el color del estado. Es lenguaje de legajo:
 * dice el veredicto en una palabra —«Alcanzó», «Llegaste tarde»— al lado del
 * resultado, sin repetir la cuenta.
 */
export function Stamp({
  children,
  tone = 'green',
  className,
}: {
  readonly children: ReactNode
  readonly tone?: 'green' | 'red'
  readonly className?: string
}) {
  return (
    <span
      className={cn(
        'text-label font-display shrink-0 -rotate-3 border-2 px-[10px] py-[5px] uppercase',
        tone === 'green' ? 'border-green text-green' : 'border-red text-red',
        className,
      )}
    >
      {children}
    </span>
  )
}
