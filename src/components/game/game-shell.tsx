import type { ReactNode } from 'react'

import { StageProgress } from '@/components/ui'
import { cn } from '@/lib/ui/cn'

/**
 * El shell.
 *
 * Una columna de **412 px máximo, centrada, en todos los breakpoints**. Tablet y
 * desktop centran contra la hoja; no ensanchan. Estirar el juego a 1200 px no
 * mejora ni leer un enunciado ni comparar cuatro opciones — sólo obliga a barrer
 * la cabeza de un lado al otro de la pantalla.
 *
 * `.eg-canvas` es el cambio de una línea que hace que todo se vea como Egresado:
 * la cuadrícula del papel alrededor de cada bloque insertado.
 *
 * El slot de acción se ancla con `margin-top: auto` sobre una columna de altura
 * mínima, así el primario cae **siempre en el mismo lugar**, esté la pantalla
 * llena o casi vacía. Que el botón no se mueva entre escenas es lo que permite
 * jugar sin volver a buscarlo cada vez.
 */

/** El fondo de la página: la hoja se centra sobre un papel apenas más oscuro. */
export function GameCanvas({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'px-gutter pb-safe flex min-h-dvh w-full justify-center py-6',
        className,
      )}
    >
      <div className="max-w-viewport flex w-full flex-col gap-3">
        {children}
      </div>
    </div>
  )
}

/**
 * La hoja.
 *
 * Cuadriculada, con una regla de 1 px alrededor. Todo lo del juego pasa adentro.
 */
export function GameSheet({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={cn('eg-canvas border-rule flex flex-col border', className)}
    >
      {children}
    </div>
  )
}

/**
 * Encabezado de etapa.
 *
 * El año a la izquierda y las celdas de progreso a la derecha. Nada más: cada
 * elemento que se agregue acá le compite atención a la matemática de abajo.
 *
 * El nombre de la etapa es el `<h1>` de la pantalla de juego. Se ve como una
 * etiqueta chica, pero estructuralmente es el encabezado principal: una página
 * sin `h1` deja a quien navega por encabezados sin punto de entrada.
 */
export function StageHeader({
  stage,
  resolved,
  total,
  className,
}: {
  readonly stage: string
  readonly resolved: number
  readonly total: number
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'border-rule flex items-center justify-between gap-3 border-b px-4 py-3.5',
        className,
      )}
    >
      <h1
        data-testid="stage-label"
        className="font-display text-ink text-[10px] font-bold tracking-[0.16em] uppercase"
      >
        {stage}
      </h1>
      <StageProgress resolved={resolved} total={total} />
    </div>
  )
}

/**
 * La columna de contenido.
 *
 * `min-height` sostiene la posición del primario; el `-18px` inferior del bloque
 * de decisión está calculado contra este padding, así que los dos se mueven
 * juntos o ninguno.
 */
export function SceneColumn({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[430px] flex-col gap-4 px-4 pt-[18px] pb-[18px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * El slot del primario.
 *
 * Existe exactamente **un** primario montado a la vez. Mientras se decide vive
 * dentro del bloque oscuro, junto a las opciones; al resolver salta acá, debajo
 * del panel de resultado. Nadie tiene que scrollear para atrás para continuar.
 */
export function ActionSlot({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div className={cn('mt-auto flex flex-col gap-2 pt-4', className)}>
      {children}
    </div>
  )
}
