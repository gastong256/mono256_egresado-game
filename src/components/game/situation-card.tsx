import type { ReactNode } from 'react'

import { DataGrid, Eyebrow, type DataGridItem } from '@/components/ui'
import { cn } from '@/lib/ui/cn'

/**
 * Situación.
 *
 * Impone el orden en que se entiende un desafío y no lo deja a la maquetación:
 *
 *     título → escena → contexto → datos → consigna → interacción → resultado
 *
 * El eyebrow rojo ubica el momento del año, el título va en **caja mixta** —las
 * mayúsculas quedan para las etiquetas de 9–11 px— y todo número con el que haya
 * que razonar baja a la grilla de datos. Un dato necesario escondido en la prosa
 * es la forma más rápida de convertir un juego en un ejercicio de lectura.
 *
 * La escena, cuando la hay, va **entre el título y la prosa**, como la foto
 * debajo del titular de una nota: primero se nombra el evento, después se ve el
 * lugar, y recién entonces se lee lo que pasa. Ponerla después de la prosa la
 * metería entre lo que hay que leer y los datos con los que hay que razonar, y
 * el jugador tendría que saltarla para volver al problema. Prosa, datos y
 * decisión quedan contiguos.
 *
 * La consigna no vive acá: vive arriba de las opciones, dentro del bloque
 * oscuro, porque la pregunta y la elección tienen que leerse juntas.
 */
export function SituationCard({
  eyebrow,
  title,
  setup,
  data,
  media,
  children,
  className,
}: {
  readonly eyebrow: string
  readonly title: string
  readonly setup: string
  readonly data?: readonly DataGridItem[]
  /** La escena, cuando la hay. Un Repaso no la lleva. */
  readonly media?: ReactNode
  /** El bloque de decisión. */
  readonly children?: ReactNode
  readonly className?: string
}) {
  return (
    <article
      aria-labelledby="situation-title"
      className={cn('motion-enter flex flex-col gap-3.5', className)}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id="situation-title"
        className="text-display font-display text-ink text-balance"
      >
        {title}
      </h2>
      {media}
      <p className="text-body text-ink-secondary text-pretty">{setup}</p>
      {data === undefined || data.length === 0 ? null : (
        <DataGrid items={data} />
      )}
      {children}
    </article>
  )
}

/**
 * Momento narrativo.
 *
 * Tiene que leerse como historia y no como problema, sin que haga falta un
 * cartel que diga «NARRATIVA». La diferencia la hacen la forma y la tipografía:
 * sin grilla de datos, sin bloque oscuro, con la prosa un punto más grande y más
 * aireada que en una situación matemática.
 */
export function NarrativeCard({
  eyebrow,
  title,
  children,
  effects,
  media,
  className,
}: {
  readonly eyebrow: string
  readonly title: string
  readonly children: ReactNode
  /** Chips de lo que este beat movió, si movió algo. */
  readonly effects?: ReactNode
  readonly media?: ReactNode
  readonly className?: string
}) {
  return (
    <section
      aria-labelledby="narrative-title"
      data-testid="narrative-card"
      className={cn('motion-enter flex flex-col gap-3', className)}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id="narrative-title"
        className="text-display font-display text-ink text-balance"
      >
        {title}
      </h2>
      <div className="text-body-lg text-ink-secondary text-pretty">
        {children}
      </div>
      {media}
      {effects}
    </section>
  )
}
