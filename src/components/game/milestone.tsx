import type { ReactNode } from 'react'

import { MilestoneTick, RecordRow, Stamp } from '@/components/ui'
import { cn } from '@/lib/ui/cn'

import { Confetti } from './confetti'

/**
 * Cierre de etapa.
 *
 * El único momento del juego donde la marca puede subir el volumen, y por eso el
 * único que usa el numeral de 66 px, el tilde grande, el sello rotado y el
 * confeti. Si esa gramática apareciera en una pantalla de desafío, dejaría de
 * significar «terminaste un año».
 *
 * La estructura viene del boletín: numeral y tilde sobre un filete de 2 px,
 * después los renglones de registro, y recién al final el arquetipo con el sello.
 * El fondo sigue siendo la hoja cuadriculada — cerrar un año no cambia de mundo.
 *
 * Sirve para «7.º» hoy y para «Egresado» cuando exista, sin cambiar de forma.
 */
export function Milestone({
  eyebrow,
  numeral,
  children,
  className,
}: {
  readonly eyebrow: string
  /** El año que cerró: «7.º». Es un numeral, no un título. */
  readonly numeral: string
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <section
      aria-labelledby="milestone-title"
      data-testid="milestone"
      className={cn('relative flex flex-col gap-3.5', className)}
    >
      <Confetti className="h-96" />

      <span className="font-display text-ink-label text-eyebrow tracking-[0.18em] uppercase">
        {eyebrow}
      </span>

      <div className="border-ink flex items-end gap-3 border-b-2 pb-2.5">
        <h2
          id="milestone-title"
          className="text-milestone font-display text-ink"
        >
          {numeral}
        </h2>
        <MilestoneTick className="mb-1.5" />
      </div>

      {children}
    </section>
  )
}

export { RecordRow }

/**
 * El arquetipo y el sello.
 *
 * «Vas camino a» y no «sos»: 7.º es el primero de seis años, y un veredicto
 * cerrado sobre alguien de doce años sería exactamente el lenguaje clínico que el
 * GDD prohíbe.
 *
 * El sello va rotado −2°. Es el gesto del legajo, y es lo que hace que el cierre
 * se lea como un documento y no como una pantalla de victoria.
 */
export function ArchetypeStamp({
  archetype,
  stampLine,
  className,
}: {
  readonly archetype: string
  /** La línea chica del sello: «DIC · 7.º». */
  readonly stampLine: string
  readonly className?: string
}) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3', className)}
      data-testid="archetype"
    >
      <div className="flex flex-col gap-1">
        <span className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase">
          Vas camino a
        </span>
        <span className="font-display text-green text-[19px] font-extrabold tracking-[-0.02em]">
          {archetype}
        </span>
      </div>
      <Stamp className="-rotate-2 text-center">
        <span className="flex flex-col gap-0.5">
          <span className="text-[13px] tracking-[0.14em]">Aprobado</span>
          <span
            data-numeric
            className="text-[8.5px] font-semibold tracking-[0.1em]"
          >
            {stampLine}
          </span>
        </span>
      </Stamp>
    </div>
  )
}

/** «Lo más memorable del año». Una frase, no una lista. */
export function MemorablePanel({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'border-rule-soft flex flex-col gap-1.5 border-t pt-3',
        className,
      )}
    >
      <span className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase">
        Lo más memorable del año
      </span>
      <p className="text-body text-ink text-pretty">{children}</p>
    </div>
  )
}
