import type { PublicRunSummary } from '@/lib/competition/run-summary'
import { cn } from '@/lib/ui/cn'
import { YEAR_MARKER_LABEL } from '@/lib/presentation/ending-model'
import { AchievementMark } from './achievement-mark'
import { MathMark, TeamMark, AuraMark } from './home-marks'

const componentLabels = {
  math: 'Matemática',
  team: 'Equipo',
  aura: 'Aura',
} as const
const componentMarks = {
  math: MathMark,
  team: TeamMark,
  aura: AuraMark,
} as const
const number = (value: number) => value.toLocaleString('es-AR')

export function RankingRunMetrics({
  summary,
  compact = false,
  condensedOnPhone = false,
}: {
  readonly summary: PublicRunSummary
  readonly compact?: boolean
  readonly condensedOnPhone?: boolean
}) {
  const { promedio, equipo, aura } = summary.career
  return (
    <dl
      className="text-caption flex flex-wrap items-center gap-x-4 gap-y-2 tabular-nums"
      aria-label="Resultados de la partida"
    >
      {[
        {
          label: 'Promedio',
          value: promedio?.toLocaleString('es-AR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }),
          max: 10,
          Mark: MathMark,
        },
        {
          label: 'Equipo',
          value: equipo === null ? undefined : number(equipo),
          max: 100,
          Mark: TeamMark,
        },
      ].map(({ label, value, max, Mark }) =>
        value === undefined ? null : (
          <div
            key={label}
            className={cn(
              'border-rule-soft',
              compact
                ? 'flex items-baseline gap-1'
                : condensedOnPhone
                  ? 'flex items-baseline gap-1 sm:block sm:border-r sm:pr-4'
                  : 'border-r pr-4',
            )}
          >
            <dt className="text-ink-label flex items-center gap-2">
              {compact ? null : (
                <span
                  className={cn(
                    'text-green [&_svg]:size-4',
                    condensedOnPhone && 'hidden sm:inline-flex',
                  )}
                >
                  <Mark />
                </span>
              )}
              {label}
            </dt>
            <dd
              className={cn(
                'font-display text-ink font-bold',
                compact
                  ? 'text-caption'
                  : condensedOnPhone
                    ? 'text-caption sm:text-title sm:pl-6'
                    : 'text-title pl-6',
              )}
            >
              {value}
              <span className="text-caption text-ink-secondary font-normal">
                /{max}
              </span>
            </dd>
          </div>
        ),
      )}
      {aura === null ? null : (
        <div className="bg-aura-surface text-aura-gain flex items-center gap-2 px-2 py-1">
          <dt className="flex items-center gap-1">
            <span className="[&_svg]:size-3">
              <AuraMark />
            </span>
            Aura
          </dt>
          <dd className="font-display font-bold">
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
  rank = 1,
  fairScore,
}: {
  readonly summary: PublicRunSummary
  readonly nickname: string
  readonly rank?: number
  readonly fairScore?: number
}) {
  // Persisted mathematical evidence excludes narrative scenes and recovery.
  const challengesPlayed = summary.components.find(
    (part) => part.component === 'math',
  )?.opportunities
  const highlights = summary.achievements
    .filter((item) => item.id !== 'milestone.graduated')
    .slice(0, rank <= 2 ? 2 : rank === 3 ? 1 : 0)
  const remaining = summary.achievements.length - highlights.length
  return (
    <details className="group min-w-0">
      <summary
        className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-2 [&::-webkit-details-marker]:hidden"
        aria-label={`Ver partida de ${nickname}`}
      >
        {highlights.length ? (
          <span
            className="flex min-w-0 flex-wrap items-center gap-2"
            aria-label={`Reconocimientos de ${nickname}`}
          >
            {highlights.map((item) => (
              <span
                key={item.id}
                className="border-rule-soft bg-canvas text-chip text-ink inline-flex items-center gap-2 border px-2 py-1 font-semibold"
              >
                <span className="text-green shrink-0 [&_svg]:size-4">
                  <AchievementMark id={item.id} />
                </span>
                {item.label}
              </span>
            ))}
            {remaining > 0 ? (
              <span className="text-caption text-ink-label tabular-nums">
                +{remaining}
                <span className="sr-only"> reconocimientos más</span>
              </span>
            ) : null}
          </span>
        ) : null}
        <span className="text-caption text-green-deep ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold group-hover:underline">
          <span className="group-open:hidden">Ver partida</span>
          <span className="hidden group-open:inline">Cerrar detalle</span>
          <svg
            className="size-4 group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            aria-hidden="true"
          >
            <path d="m7 10 5 5 5-5" />
          </svg>
        </span>
      </summary>
      <div className="border-rule grid gap-6 border-t py-6 md:grid-cols-2">
        <section>
          <h4 className="text-title font-display text-ink mb-3">
            Aportes al puntaje
          </h4>
          <p className="text-caption text-ink-secondary mb-4">
            Estos aportes forman el puntaje de esta partida.
          </p>
          <dl className="divide-rule-soft text-body divide-y tabular-nums">
            {summary.components
              .filter((part) => part.opportunities > 0)
              .map((part) => {
                const Mark = componentMarks[part.component]
                return (
                  <div
                    className="flex items-center justify-between gap-3 py-3"
                    key={part.component}
                  >
                    <dt className="flex items-center gap-2">
                      <span className="text-green [&_svg]:size-5">
                        <Mark />
                      </span>
                      {componentLabels[part.component]}
                    </dt>
                    <dd className="text-title font-display text-ink">
                      {number(part.contribution)}{' '}
                      <span className="text-caption font-normal">puntos</span>
                    </dd>
                  </div>
                )
              })}
            {fairScore === undefined ? null : (
              <div className="text-green-deep flex items-center justify-between gap-3 py-3">
                <dt>Total de la partida</dt>
                <dd className="text-title font-display">
                  {number(fairScore)}{' '}
                  <span className="text-caption font-normal">puntos</span>
                </dd>
              </div>
            )}
          </dl>
          <div className="bg-canvas mt-4 flex flex-col gap-2 p-3">
            <p className="text-caption text-ink-secondary tabular-nums">
              {challengesPlayed === undefined ? null : (
                <>
                  {number(challengesPlayed)}{' '}
                  {challengesPlayed === 1
                    ? 'desafío resuelto'
                    : 'desafíos resueltos'}{' '}
                  ·{' '}
                </>
              )}
              {number(summary.optimalCount)}{' '}
              {summary.optimalCount === 1
                ? 'resolución óptima'
                : 'resoluciones óptimas'}
            </p>
            {summary.recoveries > 0 ? (
              <p className="text-caption text-ink-secondary tabular-nums">
                {number(summary.recoveries)}{' '}
                {summary.recoveries === 1
                  ? 'repaso realizado'
                  : 'repasos realizados'}
              </p>
            ) : null}
          </div>
          <p className="text-caption text-ink-secondary mt-3">
            El promedio y Equipo /100 describen el recorrido; no son puntos para
            sumar al total.
          </p>
        </section>
        <section>
          <h4 className="text-title font-display text-ink mb-4">
            Reconocimientos{' '}
            <span className="text-caption text-ink-label font-normal">
              · {summary.achievements.length}
            </span>
          </h4>
          <ul className="flex flex-col gap-4">
            {summary.achievements.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="bg-green-tint text-green-deep grid size-8 shrink-0 place-items-center [&_svg]:size-5">
                  <AchievementMark id={item.id} />
                </span>
                <div>
                  <p className="text-meta text-ink mb-1 font-semibold">
                    {item.label}
                  </p>
                  <p className="text-caption text-ink-secondary">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="border-rule border-t pt-5 md:col-span-2">
          <h4 className="text-title font-display text-ink mb-4">
            Su recorrido
          </h4>
          <ol className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
            {summary.years
              .filter((year) => year.played)
              .map((year) => (
                <li
                  className={cn(
                    'border-l-2 pl-3',
                    year.marker === 'perfect' ? 'border-green' : 'border-rule',
                  )}
                  key={year.stage}
                >
                  <p className="text-title font-display text-ink mb-1">
                    {year.numeral}
                  </p>
                  <p className="text-caption text-ink-label">{year.theme}</p>
                  <p
                    className={cn(
                      'text-caption',
                      year.marker === 'perfect'
                        ? 'text-green-deep font-semibold'
                        : 'text-ink-secondary',
                    )}
                  >
                    {year.marker === 'perfect' ? '✓ ' : ''}
                    {YEAR_MARKER_LABEL[year.marker]}
                  </p>
                  {year.highlight ? (
                    <p className="text-caption text-ink-secondary mt-2">
                      {year.highlight}
                    </p>
                  ) : null}
                </li>
              ))}
          </ol>
        </section>
        <section className="border-rule-soft flex flex-col gap-2 border-t pt-4 sm:flex-row sm:gap-5 md:col-span-2">
          <h4 className="text-meta font-display text-green-deep shrink-0 font-bold">
            {summary.playStyle.label}
          </h4>
          <div>
            <p className="text-caption text-ink-secondary">
              {summary.playStyle.detail}
            </p>
            {summary.estilo === null ? null : (
              <p className="text-caption text-ink-label mt-1 tabular-nums">
                Aplicado {number(summary.estilo.aplicado)} % · Estratega{' '}
                {number(summary.estilo.estratega)} % · Improvisador{' '}
                {number(summary.estilo.improvisador)} %
              </p>
            )}
          </div>
        </section>
      </div>
    </details>
  )
}
