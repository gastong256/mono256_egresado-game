import type {
  PublicCompetitionStatus,
  PublicLeaderboardEntry,
  PublicSelfSummary,
} from '@/lib/competition'
import { cn } from '@/lib/ui/cn'

/** Group the server's ranks for display. Never slice ties or recompute places. */
export function Leaderboard({
  entries,
  you,
  total,
  status = 'open',
}: {
  readonly entries: readonly PublicLeaderboardEntry[]
  readonly you: PublicSelfSummary | undefined
  readonly total: number
  readonly status?: PublicCompetitionStatus
}) {
  const groups = new Map<number, PublicLeaderboardEntry[]>()
  for (const entry of entries) {
    const group = groups.get(entry.rank) ?? []
    group.push(entry)
    groups.set(entry.rank, group)
  }
  const closed = status === 'closed'
  const outsidePodium =
    you?.rank !== undefined && !entries.some((entry) => entry.isYou)

  return (
    <section
      className="border-ink flex flex-col gap-5 border-t-2 py-6"
      aria-labelledby="ranking-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-label font-display text-ink-label uppercase">
            {closed ? 'Competencia cerrada' : 'Los puestos que cuentan'}
          </p>
          <h2
            id="ranking-heading"
            className="text-display font-display text-ink"
          >
            {closed ? 'Resultados del evento' : 'Ranking'}
          </h2>
        </div>
        <p className="text-caption text-ink-secondary tabular-nums">
          {total.toLocaleString('es-AR')}{' '}
          {total === 1
            ? 'participante con partida verificada'
            : 'participantes con partida verificada'}
        </p>
      </div>

      {entries.length === 0 ? (
        <div
          className="border-rule bg-canvas-sunken flex flex-col gap-3 border p-5 sm:p-8"
          data-testid="ranking-empty"
        >
          <span
            aria-hidden="true"
            className="text-milestone font-display text-ink tabular-nums"
          >
            —
          </span>
          <h3 className="text-section font-display text-ink">
            {closed ? 'Sin partidas verificadas' : 'Todavía no hay puestos.'}
          </h3>
          <p className="text-body text-ink-secondary text-pretty">
            {closed
              ? 'La competencia cerró sin resultados publicados.'
              : status !== 'open'
                ? 'Cuando abra la competencia, las mejores partidas van a estar acá.'
                : 'Nadie tiene todavía una partida verificada. Jugá una y tu puntaje aparece acá.'}
          </p>
        </div>
      ) : (
        <ol
          className={cn(
            'grid items-start gap-4',
            groups.size === 1
              ? 'sm:grid-cols-1'
              : groups.size === 2
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-3',
          )}
          aria-label="Podio por puesto"
          data-testid="leaderboard"
        >
          {[...groups].map(([rank, players]) => (
            <li
              key={rank}
              value={rank}
              className={cn(
                'border-rule bg-surface min-w-0 border p-4',
                rank === 1
                  ? 'border-t-ink border-t-4 sm:min-h-64'
                  : rank === 2
                    ? 'border-t-ink border-t-2 sm:mt-8 sm:min-h-56'
                    : 'sm:mt-16 sm:min-h-48',
              )}
              data-testid={`podium-rank-${String(rank)}`}
            >
              <h3 className="font-display text-ink flex items-baseline gap-3">
                <span
                  className={cn(
                    'tabular-nums',
                    rank === 1
                      ? 'text-milestone'
                      : rank === 2
                        ? 'text-display'
                        : 'text-section',
                  )}
                >
                  {rank}
                </span>
                <span className="text-label uppercase">
                  {players.length > 1 ? 'Puesto compartido' : 'Puesto'}
                </span>
              </h3>
              <ul
                className={cn(
                  'divide-rule mt-4 divide-y',
                  groups.size === 1 &&
                    players.length > 1 &&
                    'grid gap-x-6 sm:grid-cols-3',
                )}
                aria-label={`Participantes en el puesto ${String(rank)}`}
              >
                {players.map((entry, index) => (
                  <li
                    key={`${entry.nickname}-${String(index)}`}
                    className={cn(
                      'flex min-w-0 flex-col gap-2 py-3',
                      entry.isYou && 'border-l-ink border-l-2 pl-3',
                    )}
                    data-testid="leaderboard-entry"
                  >
                    <span className="sr-only">
                      Puesto <span>{entry.rank}</span>.
                    </span>
                    <p className="text-option font-display text-ink [overflow-wrap:anywhere]">
                      {entry.nickname}
                      {entry.isYou ? (
                        <span className="text-caption text-ink-secondary ml-2">
                          (vos)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-caption text-ink-secondary">
                      <span
                        className={cn(
                          'font-display text-ink tabular-nums',
                          rank === 1 ? 'text-section' : 'text-data-lg',
                        )}
                      >
                        {entry.fairScore.toLocaleString('es-AR')}
                      </span>{' '}
                      puntos
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {outsidePodium && you !== undefined ? (
        <div
          className="border-ink bg-canvas-sunken flex flex-wrap items-center justify-between gap-4 border-l-4 p-4"
          data-testid="own-rank"
        >
          <div className="min-w-0">
            <p className="text-meta text-ink-secondary">
              Tu puesto:{' '}
              <strong className="text-data-lg font-display text-ink tabular-nums">
                {you.rank?.toLocaleString('es-AR')}
              </strong>
            </p>
            <p className="text-option font-display text-ink mt-2 [overflow-wrap:anywhere]">
              {you.nickname} <span className="text-caption">(vos)</span>
            </p>
          </div>
          {you.bestFairScore === undefined ? null : (
            <p className="text-meta text-ink-secondary">
              <strong className="text-data-lg font-display text-ink tabular-nums">
                {you.bestFairScore.toLocaleString('es-AR')}
              </strong>{' '}
              puntos
            </p>
          )}
        </div>
      ) : null}
      <p className="text-caption text-ink-secondary text-pretty">
        Cuenta tu mejor partida verificada. Si hay empate, se comparte el
        puesto: no gana quien llegó primero ni quien jugó más rápido.
      </p>
    </section>
  )
}
