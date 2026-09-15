'use client'

import { useId, useState } from 'react'

import { isEstiloEstablished, promedio, type CareerState } from '@/game'
import { cn } from '@/lib/ui/cn'

import { AuraCell } from './aura-display'
import { describeEstilo, EstiloLegend, EstiloTriangle } from './estilo-triangle'
import { formatEquipo, formatPromedio } from './format'

/**
 * La tira de carrera. El HUD.
 *
 * **Arranca vacía.** Cada celda aparece la primera vez que su dimensión se toca:
 * Promedio tras el primer evento con nota, Equipo tras el primer evento
 * colaborativo, Aura tras el primer momento memorable, Estilo cuando hay
 * suficientes decisiones para que el triángulo signifique algo.
 *
 * Eso no es una animación de entrada: es la diferencia entre `null` y 0. Mostrar
 * `Promedio 0` antes de la primera nota le diría a alguien de doce años que va
 * mal en una materia que todavía no empezó.
 *
 * Durante el desafío se ven **Promedio · Equipo · Aura** y el glifo de Estilo.
 * Estilo cambia demasiado lento para justificar píxeles en pleno desafío, y un
 * triángulo compite con las cajas de dato por el instinto de «leer las formas».
 * El panel expandido está a un toque.
 */

function PaperCell({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="bg-canvas border-ink flex min-h-[46px] flex-1 flex-col justify-center gap-0.5 border-[1.5px] px-[10px] py-2">
      <span className="font-display text-ink-label text-[9px] font-bold tracking-[0.13em] uppercase">
        {label}
      </span>
      <span
        data-numeric
        className="font-display text-ink text-[20px] leading-none font-extrabold tracking-[-0.03em]"
      >
        {value}
      </span>
    </div>
  )
}

export function CareerStrip({
  career,
  className,
}: {
  readonly career: CareerState
  readonly className?: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  const average = promedio(career)
  const showEstilo = isEstiloEstablished(career)
  const anything =
    average !== null ||
    career.equipo !== null ||
    career.aura !== null ||
    showEstilo

  // Nada que mostrar todavía: la tira no existe, en lugar de existir vacía.
  if (!anything) {
    return null
  }

  return (
    <div className={cn('flex flex-col', className)} data-testid="career-strip">
      {/*
        La tira refluye: por debajo de ~360 px las celdas no entran en una línea
        y pasan a dos, en vez de recortarse o empujar la página. Nada se pierde
        y ningún objetivo táctil baja de 44 px.
      */}
      <div className="border-rule flex flex-wrap items-stretch gap-1.5 border-b px-4 py-3">
        {average === null ? null : (
          <PaperCell label="Promedio" value={formatPromedio(average)} />
        )}
        {career.equipo === null ? null : (
          <PaperCell label="Equipo" value={formatEquipo(career.equipo)} />
        )}
        {career.aura === null ? null : <AuraCell value={career.aura} />}
        {showEstilo ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => {
              setOpen((current) => !current)
            }}
            // El nombre accesible lleva los tres porcentajes: quien no ve el
            // glifo no tiene que abrir el panel para saber qué dice.
            aria-label={`${open ? 'Ocultar' : 'Ver'} estilo. ${describeEstilo(career.estilo)}`}
            className={cn(
              'bg-canvas border-ink motion-select flex size-[46px] shrink-0 items-center justify-center border-[1.5px]',
              'hover:bg-canvas-grid cursor-pointer',
            )}
          >
            <span aria-hidden="true" className="block w-[22px]">
              <EstiloTriangle estilo={career.estilo} />
            </span>
          </button>
        ) : null}
      </div>

      {open && showEstilo ? (
        <div
          id={panelId}
          className="bg-surface border-rule motion-enter flex items-center gap-4 border-b px-4 py-3.5"
        >
          <div className="w-[92px] shrink-0">
            <EstiloTriangle estilo={career.estilo} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="font-display text-ink-label text-[10px] font-bold tracking-[0.14em] uppercase">
              Estilo
            </span>
            <EstiloLegend estilo={career.estilo} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
