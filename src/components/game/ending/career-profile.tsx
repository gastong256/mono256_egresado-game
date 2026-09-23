import { RecordRow } from '@/components/ui'

import { AuraBlock } from '../aura-display'
import { EstiloLegend, EstiloTriangle } from '../estilo-triangle'
import { formatEquipo, formatPromedio, NOT_ESTABLISHED } from '../format'
import type { CareerNumbers, PlayStyle } from './ending-model'
import type { Estilo } from '@/game'

/**
 * Cómo jugaste: el estilo y los números.
 *
 * El estilo es una lectura, no una estadística: no suma, no ordena y no se
 * guarda. Los números son las tres dimensiones visibles de la carrera, con
 * Promedio primero porque la matemática es lo que manda en el puntaje. Una
 * dimensión que la carrera no estableció se escribe con un guion, nunca con
 * cero.
 */
export function CareerProfile({
  style,
  numbers,
  estilo,
  estiloEstablished,
}: {
  readonly style: PlayStyle
  readonly numbers: CareerNumbers
  readonly estilo: Estilo
  readonly estiloEstablished: boolean
}) {
  return (
    <section
      aria-labelledby="career-profile-title"
      data-testid="career-profile"
      className="border-ink flex flex-col gap-3 border-t-2 pt-3"
    >
      <h2
        id="career-profile-title"
        className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase"
      >
        Tu estilo
      </h2>
      <div className="flex flex-col gap-1" data-testid="play-style">
        <p
          className="text-section font-display text-ink text-balance"
          data-style={style.id}
        >
          {style.label}
        </p>
        <p className="text-body text-ink-secondary text-pretty">
          {style.detail}
        </p>
      </div>

      {estiloEstablished ? (
        <div className="flex items-center gap-3.5 pt-0.5">
          <div className="w-[88px] shrink-0">
            <EstiloTriangle estilo={estilo} />
          </div>
          <EstiloLegend estilo={estilo} className="flex-1" />
        </div>
      ) : null}

      <div className="flex flex-col" data-testid="epilogue-record">
        <RecordRow
          label="Promedio"
          value={
            numbers.promedio === null
              ? NOT_ESTABLISHED
              : formatPromedio(numbers.promedio)
          }
        />
        <RecordRow
          label="Equipo"
          value={
            numbers.equipo === null
              ? NOT_ESTABLISHED
              : formatEquipo(numbers.equipo)
          }
          last={numbers.aura === null}
        />
      </div>
      {numbers.aura === null ? null : <AuraBlock value={numbers.aura} />}
    </section>
  )
}
