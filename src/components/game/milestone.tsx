import { Flag } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Hito.
 *
 * Cerrar un año es el único momento del juego donde la marca puede subir el
 * volumen. Es también el único lugar con animación de entrada, y desaparece
 * entera con `prefers-reduced-motion`: el hito se entiende por lo que dice, no
 * por lo que se mueve.
 *
 * Sirve para «7.º grado terminado» hoy y para «Egresado» cuando exista, sin
 * cambiar de forma.
 */
export function Milestone({
  eyebrow,
  title,
  children,
  className,
}: {
  readonly eyebrow: string
  readonly title: string
  readonly children?: ReactNode
  readonly className?: string
}) {
  return (
    <header
      className={cn('flex flex-col gap-3', className)}
      data-testid="milestone"
    >
      <span className="bg-primary-subtle border-primary text-primary-subtle-foreground rounded-pill inline-flex w-fit items-center gap-2 border px-3 py-1">
        <Flag aria-hidden className="size-4" />
        <span className="text-label">{eyebrow}</span>
      </span>
      <h2 className="text-display text-foreground text-balance motion-safe:animate-[milestone-rise_320ms_var(--ease-emphasized)_both]">
        {title}
      </h2>
      {children === undefined ? null : (
        <div className="text-body text-foreground-muted text-pretty">
          {children}
        </div>
      )}
    </header>
  )
}
