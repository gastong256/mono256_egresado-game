'use client'

import { useState } from 'react'

import type {
  PublicCompetitionStatus,
  PublicLeaderboardEntry,
  PublicSelfSummary,
} from '@/lib/competition'
import { cn } from '@/lib/ui/cn'
import { RankingEntry } from './ranking-entry'
import { RankingDeadlineNotice } from './ranking-deadline-notice'

/**
 * Cuántos puestos muestra un teléfono antes de pedir que se abra el resto.
 *
 * La ventana del servidor trae hasta doce filas, cada una con sus métricas y
 * sus reconocimientos: en 360 px son más de dos mil píxeles de lista. El
 * podio, los dos puestos siguientes y la fila propia con sus vecinas es lo
 * que alguien mira de verdad; lo demás se abre con un toque. Desde tablet la
 * lista se ve entera. Es sólo presentación: el DOM conserva las doce filas en
 * el orden del servidor, y ningún puesto se recalcula.
 */
export const LEADING_ROWS_ON_PHONE = 5

/** Filas que un teléfono muestra sin abrir la lista: podio y vecindad propia. */
export function foldedRows(
  entries: readonly PublicLeaderboardEntry[],
): ReadonlySet<number> {
  const shown = new Set<number>()
  for (let index = 0; index < entries.length; index++) {
    if (index < LEADING_ROWS_ON_PHONE) shown.add(index)
  }
  const own = entries.findIndex((entry) => entry.isYou)
  if (own >= 0) {
    for (const index of [own - 1, own, own + 1]) {
      if (index >= 0 && index < entries.length) shown.add(index)
    }
  }
  return shown
}

/** Render the bounded server window. Never recompute ranks or personal best. */
export function Leaderboard({
  entries,
  you,
  total,
  status = 'open',
  closesAt,
}: {
  readonly entries: readonly PublicLeaderboardEntry[]
  readonly you: PublicSelfSummary | undefined
  readonly total: number
  readonly status?: PublicCompetitionStatus
  readonly closesAt?: string | undefined
}) {
  const closed = status === 'closed'
  const outsidePodium =
    you?.rank !== undefined && !entries.some((entry) => entry.isYou)
  const [expanded, setExpanded] = useState(false)
  const folded = foldedRows(entries)
  const hiddenOnPhone = entries.length - folded.size

  return (
    <section
      className="border-ink flex flex-col gap-5 border-t-2 py-6"
      aria-labelledby="ranking-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-label font-display text-ink-label uppercase">
            {closed ? 'Competencia cerrada' : 'Así va la competencia'}
          </p>
          <h2
            id="ranking-heading"
            className="text-display font-display text-ink"
          >
            {closed ? 'Resultados del evento' : 'Ranking'}
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <RankingDeadlineNotice status={status} closesAt={closesAt} />
          <p className="text-caption text-ink-secondary tabular-nums">
            {total.toLocaleString('es-AR')}{' '}
            {total === 1
              ? 'participante en el ranking'
              : 'participantes en el ranking'}
          </p>
        </div>
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
            {closed ? 'Todavía no hay resultados' : 'Todavía no hay puestos.'}
          </h3>
          <p className="text-body text-ink-secondary text-pretty">
            {closed
              ? 'La competencia cerró sin resultados publicados.'
              : status !== 'open'
                ? 'Cuando abra la competencia, las mejores partidas van a estar acá.'
                : 'El ranking empieza con la primera partida. Jugá y dejá tu marca.'}
          </p>
        </div>
      ) : (
        <ol
          className="divide-rule border-rule divide-y border-y"
          aria-label="Ranking de mejores partidas"
          data-testid="leaderboard"
        >
          {entries.map((entry, index) => (
            <li
              key={`${entry.rank}-${entry.nickname}-${index}`}
              value={entry.rank}
              // Plegada en teléfono hasta que se abra; siempre visible desde
              // tablet. La fila sigue en el DOM en su lugar.
              className={cn(
                !expanded && !folded.has(index) && 'hidden md:block',
              )}
              data-folded={!expanded && !folded.has(index) ? 'true' : undefined}
            >
              {(entry.gapBefore ?? 0) > 0 ? (
                <p className="text-caption text-ink-secondary bg-canvas-sunken px-4 py-3 text-center tabular-nums">
                  <span aria-hidden="true">··· </span>
                  {entry.gapBefore?.toLocaleString('es-AR')} participantes entre
                  estos puestos<span aria-hidden="true"> ···</span>
                </p>
              ) : null}
              <RankingEntry entry={entry} />
            </li>
          ))}
        </ol>
      )}

      {hiddenOnPhone > 0 && !expanded ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(true)
          }}
          className="text-action font-display border-ink text-ink hover:bg-canvas-sunken inline-flex min-h-11 w-full items-center justify-center border-[1.5px] px-5 uppercase md:hidden"
          data-testid="leaderboard-expand"
        >
          Ver {hiddenOnPhone.toLocaleString('es-AR')}{' '}
          {hiddenOnPhone === 1 ? 'puesto más' : 'puestos más'}
        </button>
      ) : null}

      {outsidePodium && you !== undefined ? (
        <div
          className="border-green bg-green-tint flex flex-wrap items-center justify-between gap-4 border-l-4 p-4"
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
        Cuenta tu mejor puntaje. Si hay empate, se comparte el puesto: no gana
        quien llegó primero ni quien jugó más rápido.
      </p>
    </section>
  )
}
