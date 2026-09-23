import type { PublicLeaderboardEntry } from '@/lib/competition'
import { cn } from '@/lib/ui/cn'
import { PodiumMedal } from './home-marks'
import { RankingRunDetails, RankingRunMetrics } from './ranking-run-details'

/** Rank comes from the server: shared places get the same visual prominence. */
export function RankingEntry({
  entry,
}: {
  readonly entry: PublicLeaderboardEntry
}) {
  const podium = entry.rank <= 3
  return (
    <article
      className={cn(
        'bg-surface relative min-w-0 px-3 sm:px-6',
        entry.rank === 1
          ? 'border-t-podium-gold border-t-[3px] pt-5 pb-2 sm:pt-6'
          : entry.rank === 2
            ? 'pt-3 pb-1 sm:pt-5'
            : 'pt-3',
        entry.isYou &&
          'bg-green-tint before:bg-green before:absolute before:inset-y-0 before:left-0 before:w-1',
      )}
      data-testid="leaderboard-entry"
      aria-label={`${entry.nickname}, puesto ${entry.rank}${entry.isYou ? ', tu mejor partida' : ''}`}
    >
      <div
        className={cn(
          'grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-x-5',
          !podium && 'lg:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1.5fr)_auto]',
        )}
      >
        <div className={cn('flex justify-center', !podium && 'pt-1')}>
          <span className="sr-only">Puesto </span>
          <span
            className={cn(
              'inline-flex',
              entry.rank === 1 &&
                'sm:[&>span>span]:text-section sm:[&>span]:h-20 sm:[&>span]:w-16 sm:[&>span]:pb-6',
              entry.rank === 2 &&
                '[&>span]:h-10 [&>span]:w-8 sm:[&>span]:h-12 sm:[&>span]:w-10',
              entry.rank === 3 && '[&>span]:h-10 [&>span]:w-8',
            )}
          >
            <PodiumMedal rank={entry.rank} compact />
          </span>
        </div>
        <div className="min-w-0">
          {entry.rank === 1 ? (
            <p className="text-label text-podium-gold font-display mb-1 uppercase">
              1.er puesto
            </p>
          ) : null}
          <h3
            className={cn(
              'font-display text-ink [overflow-wrap:anywhere]',
              entry.rank === 1 ? 'text-title sm:text-section' : 'text-option',
            )}
          >
            {entry.nickname}
            {entry.isYou ? (
              <span className="text-caption text-green-deep ml-2 font-normal">
                (vos)
              </span>
            ) : null}
          </h3>
          {!podium && entry.summary ? (
            <p
              className={cn(
                'text-caption mt-1',
                entry.isYou
                  ? 'text-green-deep font-semibold'
                  : 'text-ink-label',
              )}
            >
              {entry.isYou
                ? '↳ Tu mejor partida'
                : `${entry.summary.achievements.length} ${entry.summary.achievements.length === 1 ? 'reconocimiento' : 'reconocimientos'}`}
            </p>
          ) : null}
          {(entry.sharedCount ?? 0) > 0 ? (
            <p className="text-caption text-ink-secondary mt-1 tabular-nums">
              Compartido con {entry.sharedCount?.toLocaleString('es-AR')} más
            </p>
          ) : null}
        </div>
        <p
          className={cn(
            'text-caption text-ink-secondary col-start-3 row-start-1 text-right',
            !podium && 'lg:col-start-4',
          )}
        >
          <strong
            className={cn(
              'font-display text-ink block tabular-nums',
              entry.rank === 1
                ? 'text-section sm:text-display'
                : entry.rank === 2
                  ? 'text-data-lg sm:text-section'
                  : 'text-data-lg',
            )}
          >
            {entry.fairScore.toLocaleString('es-AR')}
          </strong>
          <span className="mt-1 block">
            puntos<span className="sr-only"> de la partida</span>
          </span>
        </p>
        {entry.summary ? (
          <div
            className={cn(
              'col-span-3 min-w-0',
              podium
                ? 'sm:col-span-2 sm:col-start-2'
                : 'col-span-2 col-start-2 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:self-center',
            )}
          >
            <RankingRunMetrics
              summary={entry.summary}
              compact={entry.rank >= 3}
              condensedOnPhone={entry.rank === 2}
            />
          </div>
        ) : null}
      </div>
      <div className={cn('mt-2 min-w-0 sm:ml-21', !podium && 'mt-0 ml-12')}>
        {entry.summary ? (
          <RankingRunDetails
            summary={entry.summary}
            nickname={entry.nickname}
            rank={entry.rank}
            fairScore={entry.fairScore}
          />
        ) : (
          <p className="text-caption text-ink-secondary min-h-11 py-3">
            Partida finalizada · detalle no disponible
          </p>
        )}
      </div>
    </article>
  )
}
