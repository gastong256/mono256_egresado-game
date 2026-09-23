import type { PublicRunSummary } from '@/lib/competition/run-summary'
import { Badge } from '@/components/ui/badge'
import { YEAR_MARKER_LABEL } from '@/lib/presentation/ending-model'

const componentLabels = {
  math: 'Matemática',
  team: 'Equipo',
  aura: 'Aura',
} as const
const number = (value: number) => value.toLocaleString('es-AR')

export function RankingRunMetrics({
  summary,
}: {
  readonly summary: PublicRunSummary
}) {
  const { promedio, equipo, aura } = summary.career
  return (
    <dl
      className="text-caption flex flex-wrap items-center gap-x-5 gap-y-2 tabular-nums"
      aria-label="Resultados de la partida"
    >
      {promedio === null ? null : (
        <div className="flex items-baseline gap-2">
          <dt className="text-green-deep">Promedio</dt>
          <dd className="font-display text-ink">
            {promedio.toLocaleString('es-AR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            <span className="text-ink-secondary">/10</span>
          </dd>
        </div>
      )}
      {equipo === null ? null : (
        <div className="flex items-baseline gap-2">
          <dt className="text-green-deep">Equipo</dt>
          <dd className="font-display text-ink">
            {number(equipo)}
            <span className="text-ink-secondary">/100</span>
          </dd>
        </div>
      )}
      {aura === null ? null : (
        <div className="bg-aura-surface text-aura-gain flex items-baseline gap-2 px-2 py-1">
          <dt>
            <span aria-hidden="true">✦ </span>Aura
          </dt>
          <dd className="font-display">
            {aura > 0 ? '+' : ''}
            {number(aura)}
          </dd>
        </div>
      )}
    </dl>
  )
}

export function RankingRunDetails({
  summary,
  nickname,
}: {
  readonly summary: PublicRunSummary
  readonly nickname: string
}) {
  const highlights = summary.achievements
    .filter((item) => item.id !== 'milestone.graduated')
    .slice(0, 2)
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {highlights.length ? (
        <ul
          className="flex flex-wrap gap-2"
          aria-label={`Reconocimientos de ${nickname}`}
        >
          {highlights.map((item) => (
            <li key={item.id}>
              <Badge tone="soft">
                <span aria-hidden="true">✧</span>
                {item.label}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <details className="group">
        <summary className="text-caption text-ink-secondary hover:text-ink flex min-h-11 w-fit cursor-pointer items-center gap-2 py-2 font-medium">
          <span aria-hidden="true" className="group-open:rotate-90">
            ▸
          </span>
          Ver partida<span className="sr-only"> de {nickname}</span>
        </summary>
        <div className="border-rule mt-2 grid gap-5 border-t py-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h4 className="text-option font-display text-ink">
              {summary.playStyle.label}
            </h4>
            <p className="text-caption text-ink-secondary">
              {summary.playStyle.detail}
            </p>
            {summary.estilo === null ? null : (
              <p className="text-caption text-ink-secondary tabular-nums">
                Aplicado {number(summary.estilo.aplicado)} % · Estratega{' '}
                {number(summary.estilo.estratega)} % · Improvisador{' '}
                {number(summary.estilo.improvisador)} %
              </p>
            )}
            <p className="text-caption text-ink-secondary tabular-nums">
              {number(summary.optimalCount)} resoluciones óptimas ·{' '}
              {number(summary.eventsPlayed)} situaciones jugadas
            </p>
            <h4 className="text-label font-display text-ink-label uppercase">
              Aportes al puntaje
            </h4>
            <dl className="text-caption text-ink flex flex-col gap-2 tabular-nums">
              {summary.components
                .filter((part) => part.opportunities > 0)
                .map((part) => (
                  <div
                    className="flex justify-between gap-3"
                    key={part.component}
                  >
                    <dt>{componentLabels[part.component]}</dt>
                    <dd>{number(part.contribution)} puntos</dd>
                  </div>
                ))}
            </dl>
            <p className="text-caption text-ink-secondary">
              Son puntos de esta partida. El promedio y las demás métricas
              describen tu recorrido dentro del juego.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-label font-display text-ink-label uppercase">
              Reconocimientos
            </h4>
            <ul className="flex flex-col gap-3">
              {summary.achievements.map((item) => (
                <li key={item.id}>
                  <p className="text-caption font-display text-ink">
                    <span aria-hidden="true">✧ </span>
                    {item.label}
                  </p>
                  <p className="text-caption text-ink-secondary">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <h4 className="text-label font-display text-ink-label mb-3 uppercase">
              Su recorrido
            </h4>
            <ol className="grid gap-3 sm:grid-cols-3">
              {summary.years
                .filter((year) => year.played)
                .map((year) => (
                  <li className="border-rule border-l-2 pl-3" key={year.stage}>
                    <p className="text-caption font-display text-ink">
                      {year.numeral} · {year.theme}
                    </p>
                    <p className="text-caption text-ink-secondary">
                      {YEAR_MARKER_LABEL[year.marker]}
                    </p>
                    {year.highlight ? (
                      <p className="text-caption text-ink-secondary">
                        {year.highlight}
                      </p>
                    ) : null}
                  </li>
                ))}
            </ol>
          </div>
        </div>
      </details>
    </div>
  )
}
