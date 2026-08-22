import type { ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Momento narrativo.
 *
 * Tiene que leerse como historia y no como problema, sin que haga falta un
 * cartel que diga «NARRATIVA». La diferencia la hacen la forma y la tipografía,
 * no una estética aparte: sin tarjeta blanca, con una regla roja al costado y el
 * texto más grande y más aireado que en una situación matemática.
 *
 * El rojo es acento de marca —tensión, algo que pasa— y acá no significa error.
 */
export function NarrativeCard({
  title,
  children,
  actions,
  className,
}: {
  readonly title: string
  readonly children: ReactNode
  readonly actions?: ReactNode
  readonly className?: string
}) {
  return (
    <section
      aria-labelledby="narrative-title"
      data-testid="narrative-card"
      className={cn('flex flex-col gap-4', className)}
    >
      <div className="border-accent border-l-4 pl-4">
        <h2
          id="narrative-title"
          className="text-title text-foreground text-balance"
        >
          {title}
        </h2>
        <div className="text-body text-foreground mt-2 text-pretty">
          {children}
        </div>
      </div>
      {actions === undefined ? null : <div>{actions}</div>}
    </section>
  )
}
