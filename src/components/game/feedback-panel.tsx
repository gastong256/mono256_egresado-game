'use client'

/**
 * Consecuencia de una decisión.
 *
 * El vocabulario es el del sistema —Óptimo · Resuelto · Parcial · Insuficiente—
 * y no el de un examen. Acá no hay «correcto» ni «incorrecto»: hay una decisión y
 * lo que pasó por haberla tomado.
 *
 * Tres reglas que este componente existe para sostener:
 *
 * 1. **El ledger siempre muestra la cuenta real.** El jugador tiene que poder
 *    ver el porqué, no sólo el veredicto. Ésa es la diferencia entre un juego
 *    sobre decisiones con números y un examen con animaciones.
 * 2. **Los chips muestran sólo lo que se movió.** `Promedio +0` no existe.
 * 3. **El bloque de Aura aparece sólo si Aura cambió.** Un cálculo correcto nunca
 *    produce Aura; sólo un momento memorable lo hace.
 *
 * Un `Insuficiente` nunca bloquea: tiene consecuencia y el juego sigue.
 *
 * La calidad se distingue por **glifo + palabra + borde superior de 3 px**, tres
 * canales de los cuales ninguno es cromático por sí solo. Se lee en escala de
 * grises.
 *
 * Todo lo que muestra sale del feedback estructurado del motor. Formatea; no
 * calcula.
 */

import { useEffect, useRef } from 'react'

import type { PendingFeedback } from '@/game'
import {
  Ledger,
  PartialMark,
  SlashMark,
  Stamp,
  TickMark,
  type OutcomeTone,
} from '@/components/ui'
import { cn } from '@/lib/ui/cn'

import { AuraBlock } from './aura-display'
import { CareerChips } from './career-chips'
import { OUTCOME } from './outcome'

const TAB: Readonly<Record<OutcomeTone, string>> = {
  optimal: 'bg-outcome-optimal',
  resolved: 'bg-outcome-resolved',
  partial: 'bg-outcome-partial',
  insufficient: 'bg-outcome-insufficient',
}

const FRAME: Readonly<Record<OutcomeTone, string>> = {
  optimal: 'border-outcome-optimal border-t-[3px]',
  resolved: 'border-rule border-t-outcome-resolved border-t-[3px]',
  partial: 'border-rule border-t-outcome-partial border-t-[3px]',
  insufficient: 'border-outcome-insufficient border-t-[3px]',
}

const GLYPH_BOX: Readonly<Record<OutcomeTone, string>> = {
  optimal: 'bg-outcome-optimal text-white',
  resolved: 'border-outcome-resolved text-outcome-resolved border-[1.5px]',
  partial: 'border-outcome-partial text-outcome-partial border-[1.5px]',
  insufficient: 'text-outcome-insufficient',
}

function OutcomeGlyph({ tone }: { readonly tone: OutcomeTone }) {
  if (tone === 'insufficient') {
    return <SlashMark />
  }
  if (tone === 'partial') {
    return <PartialMark />
  }
  return <TickMark className="size-[15px]" />
}

export interface FeedbackPanelProps {
  readonly feedback: PendingFeedback
  readonly className?: string
}

export function FeedbackPanel({ feedback, className }: FeedbackPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { tone, label } = OUTCOME[feedback.quality]
  const aura = feedback.careerChange.aura
  const { consequence, stamp } = feedback.feedback

  useEffect(() => {
    // Mover el foco al resultado es lo que lo hace alcanzable con teclado y con
    // lector de pantalla antes de llegar al botón de continuar.
    headingRef.current?.focus()
  }, [feedback.instanceId])

  return (
    <section
      aria-labelledby="feedback-title"
      data-testid="feedback-panel"
      className={cn('motion-resolve flex flex-col', className)}
    >
      {/* La pestaña. Lenguaje de legajo: dice de qué es el bloque de abajo. */}
      <div className="flex pl-0.5">
        <span
          className={cn(
            'text-label font-display px-[11px] pt-1.5 pb-[5px] text-white uppercase',
            TAB[tone],
          )}
        >
          Resultado
        </span>
      </div>

      <div
        className={cn(
          'bg-canvas flex flex-col gap-3 border p-[15px]',
          FRAME[tone],
        )}
      >
        {/* A 320 px un sello de trece letras no entra al lado del título: la
            fila se parte y el sello baja de línea, alineado a la derecha. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center',
                GLYPH_BOX[tone],
              )}
            >
              <OutcomeGlyph tone={tone} />
            </span>
            <h2
              id="feedback-title"
              ref={headingRef}
              tabIndex={-1}
              // `alert` anuncia el resultado apenas se dibuja.
              role="alert"
              data-quality={feedback.quality}
              data-testid="feedback-heading"
              className="text-title font-display text-ink outline-none"
            >
              {label}
            </h2>
          </div>
          {stamp === undefined ? null : (
            // El sello toma el color del resultado, pero la palabra ya dice el
            // veredicto: en escala de grises sigue leyéndose igual.
            <Stamp tone={tone === 'insufficient' ? 'red' : 'green'}>
              {stamp}
            </Stamp>
          )}
        </div>

        <Ledger items={feedback.feedback.facts} />

        {feedback.feedback.optimalComparison === undefined ? null : (
          <p className="text-meta text-ink text-pretty">
            {feedback.feedback.optimalComparison}
          </p>
        )}

        {feedback.feedback.violatedConstraint === undefined ? null : (
          <p className="text-meta text-ink text-pretty">
            Lo que no se cumplió:{' '}
            <strong className="font-semibold">
              {feedback.feedback.violatedConstraint}
            </strong>
          </p>
        )}

        {consequence === undefined ? null : (
          <p className="text-meta border-red text-ink-secondary border-l-[3px] pl-3 text-pretty">
            {consequence}
          </p>
        )}

        <CareerChips change={feedback.careerChange} />

        {aura === undefined ? null : <AuraBlock value={aura.delta} />}
      </div>
    </section>
  )
}
