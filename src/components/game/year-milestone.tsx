import { MilestoneTick } from '@/components/ui'
import { cn } from '@/lib/ui/cn'

import type { YearMilestoneCopy } from './progression-copy'

/**
 * El cierre de un año, en la misma pantalla.
 *
 * Aparece una sola vez por año, debajo del último resultado y arriba del
 * botón que pasa de etapa, para que «terminé este año» se lea antes de
 * «pasar a 3.º» sin agregar una pantalla ni una acción. No es un modal y no
 * frena la partida: el jugador lo lee y aprieta el mismo botón de siempre.
 *
 * Toma prestada la gramática del boletín —filete de 2 px, numeral y tilde—
 * pero a escala de sección y sin confeti. El volumen máximo queda reservado
 * para el egreso: si cada año sonara como el final, el final dejaría de sonar
 * como nada.
 *
 * Presentación pura: todo lo que dice sale de lo que el año dejó escrito.
 */
export function YearMilestone({
  copy,
  className,
}: {
  readonly copy: YearMilestoneCopy
  readonly className?: string
}) {
  return (
    <section
      aria-labelledby="year-milestone-title"
      data-testid="year-milestone"
      data-final={copy.final ? 'true' : undefined}
      className={cn(
        'motion-enter border-ink flex flex-col gap-2 border-t-2 pt-3',
        className,
      )}
    >
      <span className="font-display text-ink-label text-eyebrow tracking-[0.18em] uppercase">
        {copy.eyebrow}
      </span>
      {/* El lector recibe la frase entera; el numeral y el tilde son la
          versión visual de lo mismo, y por eso quedan fuera del nombre. */}
      <h2
        id="year-milestone-title"
        className="text-section font-display text-ink flex items-center gap-2.5"
      >
        <span aria-hidden="true" data-numeric>
          {copy.numeral}
        </span>
        <MilestoneTick className="size-6" />
        <span className="sr-only">{`${copy.numeral} completado`}</span>
      </h2>
      <p className="text-body text-ink-secondary text-pretty [overflow-wrap:anywhere]">
        {copy.line}
      </p>
    </section>
  )
}
