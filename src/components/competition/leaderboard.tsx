import type {
  PublicLeaderboardEntry,
  PublicSelfSummary,
} from '@/lib/competition'
import { cn } from '@/lib/ui/cn'

/**
 * El ranking público.
 *
 * Es una lista ordenada de verdad —`<ol>`— y no una grilla de `div`: un lector
 * de pantalla anuncia «elemento 1 de 3» sin que nadie escriba un `aria-label`,
 * y el puesto sigue siendo legible con las hojas de estilo apagadas.
 *
 * El puesto se dibuja como número y no sólo por posición, porque un empate
 * comparte puesto: dos filas seguidas pueden decir las dos «1», y sin el número
 * la segunda parecería un segundo lugar. Nada acá depende del color.
 *
 * Se muestran los tres primeros **puestos**, no las tres primeras personas.
 * Un empate legítimo en el podio entra entero; cortar en tres filas dejaría
 * afuera a alguien que empató, que es precisamente lo que la regla de puesto
 * compartido existe para evitar.
 */
export function Leaderboard({
  entries,
  you,
  total,
}: {
  readonly entries: readonly PublicLeaderboardEntry[]
  readonly you: PublicSelfSummary | undefined
  readonly total: number
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-goal font-display text-ink">Ranking</h2>
        <p className="text-meta text-ink-secondary text-pretty">
          Todavía no hay partidas verificadas. El primer puesto está libre.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-goal font-display text-ink">Ranking</h2>
        <p className="text-caption text-ink-secondary">
          {total === 1
            ? '1 participante con partida verificada'
            : `${String(total)} participantes con partida verificada`}
        </p>
      </div>

      <ol className="flex flex-col gap-1.5" data-testid="leaderboard">
        {entries.map((entry, index) => (
          <li
            key={`${String(entry.rank)}-${entry.nickname}-${String(index)}`}
            className={cn(
              'border-rule flex items-center gap-3 border-b px-1 py-2 last:border-b-0',
              entry.isYou && 'bg-canvas-sunken',
            )}
            data-testid="leaderboard-entry"
          >
            <span className="text-data font-display text-ink w-8 shrink-0 tabular-nums">
              {entry.rank}
            </span>
            <span className="text-option font-display text-ink min-w-0 flex-1 break-words">
              {entry.nickname}
              {entry.isYou ? (
                <span className="text-caption text-ink-secondary ml-2">
                  (vos)
                </span>
              ) : null}
            </span>
            <span className="text-data font-display text-ink shrink-0 tabular-nums">
              {entry.fairScore.toLocaleString('es-AR')}
            </span>
          </li>
        ))}
      </ol>

      {you !== undefined &&
      you.rank !== undefined &&
      you.rank > entries.length ? (
        <p className="text-meta text-ink-secondary text-pretty">
          Tu puesto: <strong className="text-ink">{you.rank}</strong> con{' '}
          {(you.bestFairScore ?? 0).toLocaleString('es-AR')} puntos.
        </p>
      ) : null}
    </div>
  )
}
