import { Badge, Progress } from '@/components/ui'
import { cn } from '@/lib/ui/cn'

/**
 * Encabezado de etapa.
 *
 * Dice en qué año está el jugador, de quién es la partida y cuánto falta. Nada
 * más: cada elemento que se agregue acá le compite atención a la matemática que
 * hay abajo.
 *
 * El nombre de la etapa es el `<h1>` de la pantalla de juego. Se ve como una
 * etiqueta chica, pero estructuralmente es el encabezado principal: una página
 * sin `h1` deja a quien navega por encabezados sin punto de entrada.
 *
 * El nombre de la etapa lo decide `stage-label.ts`, así que 1.º año no necesita
 * tocar este componente.
 */
export function StageHeader({
  stage,
  playerName,
  className,
}: {
  readonly stage: string
  readonly playerName?: string
  readonly className?: string
}) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}
    >
      <h1>
        <Badge tone="brand" data-testid="stage-label">
          {stage}
        </Badge>
      </h1>
      {playerName === undefined ? null : (
        <p className="text-body-sm text-foreground-muted min-w-0 truncate">
          {playerName}
        </p>
      )}
    </div>
  )
}

/**
 * Progreso de la etapa.
 *
 * La barra y el texto dicen lo mismo, que es justamente el punto: el avance no
 * puede depender de percibir una longitud. El total sale del estado del motor,
 * así que una etapa de siete eventos y una de doce usan esto igual.
 */
export function StageProgress({
  resolved,
  total,
  className,
}: {
  readonly resolved: number
  readonly total: number
  readonly className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Progress
        value={resolved}
        max={total}
        label={`Progreso del año: ${String(resolved)} de ${String(total)} eventos`}
      />
      <p className="text-caption text-foreground-muted" data-numeric>
        Evento {resolved} de {total}
      </p>
    </div>
  )
}
