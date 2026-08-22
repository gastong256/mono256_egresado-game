import { cn } from '@/lib/ui/cn'

/**
 * Estadísticas del jugador.
 *
 * Van deliberadamente calladas: son contexto, no la tarea. Mientras alguien
 * resuelve una cuenta, cuatro números grandes arriba de la pantalla sólo gastan
 * memoria de trabajo.
 *
 * La barrita es decorativa y está oculta a lectores de pantalla; el número
 * siempre está escrito al lado, así que nada depende de percibir un ancho.
 *
 * Va en gris y no en verde a propósito: cuatro barras verdes arriba de la
 * pantalla le compiten atención al progreso y al botón de acción, que son los
 * dos lugares donde el verde sí significa algo.
 */
export function StatIndicator({
  label,
  value,
  className,
}: {
  readonly label: string
  readonly value: number
  readonly className?: string
}) {
  const percent = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-label text-foreground-muted truncate">
          {label}
        </span>
        <span
          data-numeric
          className="text-caption text-foreground font-semibold"
        >
          {value}
        </span>
      </div>
      <span
        aria-hidden="true"
        className="bg-progress-track rounded-pill block h-1 w-full overflow-hidden"
      >
        <span
          className="bg-line-interactive motion-standard block h-full transition-[width]"
          style={{ width: `${String(percent)}%` }}
        />
      </span>
    </div>
  )
}

export function StatRow({
  stats,
  className,
}: {
  readonly stats: readonly { label: string; value: number }[]
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4',
        className,
      )}
    >
      {stats.map((stat) => (
        <StatIndicator key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  )
}
