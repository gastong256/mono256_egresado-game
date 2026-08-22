import { Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Aviso informativo.
 *
 * Para decirle algo al jugador *fuera* del bucle de juego: una advertencia de la
 * pantalla de inicio, un estado de sincronización. No es el panel de feedback:
 * el resultado de una decisión tiene su propio componente porque tiene su propio
 * vocabulario.
 *
 * El ícono acompaña al texto, nunca lo reemplaza, y va oculto para lectores de
 * pantalla porque el tono ya está dicho con palabras.
 */
export function Callout({
  tone = 'info',
  title,
  children,
  className,
}: {
  readonly tone?: 'info' | 'warning'
  readonly title?: string
  readonly children: ReactNode
  readonly className?: string
}) {
  const Icon = tone === 'warning' ? TriangleAlert : Info

  return (
    <div
      className={cn(
        'rounded-surface flex gap-3 border p-4',
        tone === 'warning'
          ? 'border-accent bg-accent-subtle text-accent-subtle-foreground'
          : 'border-line bg-surface-muted text-foreground',
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title === undefined ? null : (
          <p className="text-subheading">{title}</p>
        )}
        <div className="text-body-sm">{children}</div>
      </div>
    </div>
  )
}
