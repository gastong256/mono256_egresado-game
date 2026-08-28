import type { ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Aviso.
 *
 * Un bloque hundido con un filete de 3 px del color del tono a la izquierda. Es
 * el mismo gesto que la línea de consecuencia del panel de resultado, y por eso
 * el sistema no necesita un segundo lenguaje para «acá pasa algo».
 *
 * No es el panel de resultado: la consecuencia de una decisión tiene su propio
 * componente porque tiene su propio vocabulario.
 *
 * Ningún tono depende del color: el texto siempre dice lo que el aviso significa.
 */
export function Callout({
  tone = 'neutral',
  title,
  children,
  className,
}: {
  readonly tone?: 'neutral' | 'accent'
  readonly title?: string
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'bg-canvas-sunken border-l-[3px] px-4 py-[14px]',
        tone === 'accent' ? 'border-red' : 'border-ink',
        className,
      )}
    >
      {title === undefined ? null : (
        <p className="text-goal font-display text-ink mb-1">{title}</p>
      )}
      <div className="text-meta text-ink-secondary text-pretty">{children}</div>
    </div>
  )
}
