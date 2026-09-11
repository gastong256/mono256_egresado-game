import { cn } from '@/lib/ui/cn'

/**
 * Progreso: celdas de la cuadrícula, no una barra.
 *
 * Una barra segmentada arriba de la pantalla era una de las cuatro decisiones
 * que hacían que v0.1 se leyera como un juego de carrera deportiva. Estas son
 * celdas de 16 px alineadas a la misma grilla que el fondo, y los tres estados
 * se distinguen por **forma** antes que por color:
 *
 * - hecho — relleno;
 * - actual — contorno de 2 px;
 * - pendiente — regla de 1 px.
 *
 * En escala de grises los tres siguen siendo distintos, que es la prueba.
 *
 * Las celdas son decorativas: el texto accesible dice lo mismo, así que nadie
 * tiene que contar cuadraditos con un lector de pantalla.
 */
export function StageProgress({
  resolved,
  total,
  className,
}: {
  /** Eventos ya cerrados. La celda `resolved` es la que se está jugando. */
  readonly resolved: number
  readonly total: number
  readonly className?: string
}) {
  const cells = Array.from({ length: Math.max(0, total) }, (_, index) => index)

  return (
    <div
      // Cells shrink before they overflow: a long year narrows its squares
      // instead of pushing the sheet past a 360 px screen.
      className={cn('flex min-w-0 items-center gap-1', className)}
      data-testid="stage-progress"
    >
      <span className="sr-only">
        Evento {Math.min(resolved + 1, total)} de {total}
      </span>
      {cells.map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            'motion-progress block h-4 w-4 min-w-1 shrink',
            index < resolved && 'bg-progress-done',
            index === resolved && 'border-progress-current border-2',
            index > resolved && 'border-progress-pending border',
          )}
        />
      ))}
    </div>
  )
}
