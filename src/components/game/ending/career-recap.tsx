import { cn } from '@/lib/ui/cn'

import { YEAR_MARKER_LABEL, type YearRecap } from './ending-model'

/**
 * El recorrido, de 7.º a 5.º.
 *
 * Un renglón por año, siempre vertical: numeral, tema del arco y lo que ese
 * año dejó escrito. No repite el juego —ni una pregunta, ni un puntaje
 * parcial— y no inventa nada: el marcador sale del historial y de la
 * progresión, y la escena de cada año de los recuerdos que el motor ya
 * derivó. Un año Óptimo se distingue por la palabra, no por un color.
 */
export function CareerRecap({
  years,
}: {
  readonly years: readonly YearRecap[]
}) {
  return (
    <section
      aria-labelledby="career-recap-title"
      data-testid="career-recap"
      className="border-ink flex flex-col gap-3 border-t-2 pt-3"
    >
      <h2
        id="career-recap-title"
        className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase"
      >
        Tu recorrido
      </h2>
      <ol className="divide-rule-soft m-0 list-none divide-y p-0">
        {years.map((year) => (
          <li
            key={year.stage}
            data-testid="recap-year"
            data-stage={year.stage}
            data-marker={year.marker}
            className="grid grid-cols-[3rem_1fr] gap-x-3 py-2"
          >
            <span
              data-numeric
              className={cn(
                'text-data-lg font-display self-start',
                year.played ? 'text-ink' : 'text-ink-label',
              )}
            >
              {year.numeral}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-option font-display text-ink">
                {year.theme}
                <span className="text-ink-secondary font-normal">
                  {' · '}
                  {YEAR_MARKER_LABEL[year.marker]}
                </span>
              </span>
              {year.highlight === undefined ? null : (
                <span className="text-caption text-ink-secondary text-pretty">
                  {year.highlight}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
