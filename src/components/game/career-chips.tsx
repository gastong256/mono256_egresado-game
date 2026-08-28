import { estiloAxisLabel, type CareerChange, type EstiloAxis } from '@/game'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/ui/cn'

import { formatPromedio } from './format'

/**
 * Sólo lo que se movió.
 *
 * Un resultado muestra **únicamente** las dimensiones que cambiaron. Nunca
 * `Promedio +0`. El colectivo muestra un chip de Estilo y nada más, porque
 * decidir a qué hora salir no pone una nota ni cambia la conducta hacia el grupo.
 *
 * Eso no es una regla que este componente tenga que recordar: el motor informa
 * un `CareerChange` con una clave por dimensión que efectivamente se movió, así
 * que un cero sencillamente no es representable. La ausencia no es cero.
 *
 * Aura no aparece acá: tiene su propio bloque negro, y sale sólo si cambió.
 */

/** La flecha del chip de Estilo. Redundante con la palabra, nunca sola. */
function estiloChipLabel(axis: EstiloAxis): string {
  return `${estiloAxisLabel(axis)} ↑`
}

export function CareerChips({
  change,
  className,
}: {
  readonly change: CareerChange
  readonly className?: string
}) {
  const chips: readonly {
    key: string
    tone: 'up' | 'down' | 'outline'
    text: string
  }[] = [
    ...(change.promedio === undefined
      ? []
      : [
          {
            key: 'promedio',
            // La primera nota no tiene «desde»: se escribe sola, sin una
            // transición inventada desde un promedio que no existía.
            tone:
              change.promedio.from === null ||
              change.promedio.to >= change.promedio.from
                ? ('up' as const)
                : ('down' as const),
            text:
              change.promedio.from === null
                ? `Promedio ${formatPromedio(change.promedio.to)}`
                : `Promedio ${formatPromedio(change.promedio.from)} → ${formatPromedio(change.promedio.to)}`,
          },
        ]),
    ...(change.equipo === undefined
      ? []
      : [
          {
            key: 'equipo',
            tone:
              change.equipo.delta >= 0 ? ('up' as const) : ('down' as const),
            text: `Equipo ${change.equipo.delta >= 0 ? '+' : '−'}${String(Math.abs(change.equipo.delta))}`,
          },
        ]),
    ...(change.estilo === undefined
      ? []
      : [
          {
            key: 'estilo',
            tone: 'outline' as const,
            text: estiloChipLabel(change.estilo.axis),
          },
        ]),
  ]

  if (chips.length === 0) {
    return null
  }

  return (
    <div
      className={cn('flex flex-wrap gap-1.5', className)}
      data-testid="career-chips"
    >
      {chips.map((chip) => (
        <Badge key={chip.key} tone={chip.tone} data-testid={`chip-${chip.key}`}>
          {chip.text}
        </Badge>
      ))}
    </div>
  )
}
