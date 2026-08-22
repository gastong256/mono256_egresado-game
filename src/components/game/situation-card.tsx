import type { ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Situación matemática.
 *
 * Impone el orden en que se entiende un desafío: contexto, después datos,
 * después qué hay que decidir, después la acción. La jerarquía es tipográfica —
 * el contexto va chico y gris, la consigna va destacada— para que se pueda
 * captar de un vistazo sin leer todo.
 *
 * No decora: un desafío ya exige atención y cada borde de más se la resta.
 */
export function SituationCard({
  title,
  context,
  setup,
  goal,
  children,
  footnote,
  actions,
  className,
}: {
  readonly title: string
  /** De dónde viene la situación en la historia del año. */
  readonly context?: string
  readonly setup: string
  /** Qué se le pide decidir al jugador. */
  readonly goal: string
  readonly children: ReactNode
  readonly footnote?: ReactNode
  readonly actions?: ReactNode
  readonly className?: string
}) {
  return (
    <article
      aria-labelledby="challenge-title"
      className={cn('flex flex-col gap-5', className)}
    >
      <header className="flex flex-col gap-2">
        {context === undefined ? null : (
          <p className="text-caption text-foreground-muted text-pretty">
            {context}
          </p>
        )}
        <h2
          id="challenge-title"
          className="text-title text-foreground text-balance"
        >
          {title}
        </h2>
        <p className="text-body text-foreground text-pretty">{setup}</p>
        <p className="text-subheading text-foreground text-pretty">{goal}</p>
      </header>

      {children}

      {footnote === undefined ? null : (
        <div className="text-caption text-foreground-muted">{footnote}</div>
      )}

      {actions === undefined ? null : <div>{actions}</div>}
    </article>
  )
}
