'use client'

/**
 * Consecuencia de una decisión.
 *
 * El vocabulario es el del motor —óptimo, eficiente, funcionó, no alcanzó— y no
 * el de un examen. Acá no hay «correcto» ni «incorrecto»: hay una decisión y lo
 * que pasó por haberla tomado.
 *
 * Cada resultado se distingue por tres cosas a la vez: un nombre escrito, un
 * ícono con forma propia y un tono de color. Nunca por el color solo. Alguien
 * que no distingue rojo de verde lee «No alcanzó» junto a un triángulo y entiende
 * exactamente lo mismo.
 *
 * Todo lo que muestra sale del feedback estructurado del motor. Formatea; no
 * calcula.
 */

import { cva } from 'class-variance-authority'
import { Award, Check, CircleCheck, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, type ComponentType } from 'react'

import { Button } from '@/components/ui'
import type { PendingFeedback, SolutionQuality } from '@/game'
import { cn } from '@/lib/ui/cn'

import { MetricRows } from './data-metric'

interface QualityPresentation {
  readonly label: string
  /** Qué significa ese resultado, en una frase y sin retar a nadie. */
  readonly meaning: string
  readonly Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

const QUALITY: Readonly<Record<SolutionQuality, QualityPresentation>> = {
  optimal: {
    label: 'Óptimo',
    meaning: 'La mejor de las opciones que había.',
    Icon: Award,
  },
  efficient: {
    label: 'Eficiente',
    meaning: 'Resolvió bien, con margen de sobra.',
    Icon: CircleCheck,
  },
  functional: {
    label: 'Funcionó',
    meaning: 'Alcanzó, aunque justo.',
    Icon: Check,
  },
  invalid: {
    label: 'No alcanzó',
    meaning: 'Esta vez no dio para lo que hacía falta.',
    Icon: TriangleAlert,
  },
}

const panel = cva('rounded-card border-2 p-5 flex flex-col gap-4', {
  variants: {
    quality: {
      optimal: 'border-optimal-line bg-optimal-surface',
      efficient: 'border-efficient-line bg-efficient-surface',
      functional: 'border-functional-line bg-functional-surface',
      invalid: 'border-invalid-line bg-invalid-surface',
    },
  },
})

const ink = cva('', {
  variants: {
    quality: {
      optimal: 'text-optimal-foreground',
      efficient: 'text-efficient-foreground',
      functional: 'text-functional-foreground',
      invalid: 'text-invalid-foreground',
    },
  },
})

export interface FeedbackPanelProps {
  readonly feedback: PendingFeedback
  readonly onContinue: () => void
}

export function FeedbackPanel({ feedback, onContinue }: FeedbackPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { label, meaning, Icon } = QUALITY[feedback.quality]

  useEffect(() => {
    // Mover el foco al resultado es lo que lo hace alcanzable con teclado y con
    // lector de pantalla antes de llegar al botón de continuar.
    headingRef.current?.focus()
  }, [feedback.instanceId])

  return (
    <section
      aria-labelledby="feedback-title"
      className={panel({ quality: feedback.quality })}
    >
      <div className="flex items-start gap-3">
        <Icon
          aria-hidden
          className={cn(
            'mt-0.5 size-7 shrink-0',
            ink({ quality: feedback.quality }),
          )}
        />
        <div className="min-w-0">
          <h2
            id="feedback-title"
            ref={headingRef}
            tabIndex={-1}
            // `alert` anuncia el resultado apenas se dibuja.
            role="alert"
            className={cn(
              'text-title outline-none',
              ink({ quality: feedback.quality }),
            )}
            data-quality={feedback.quality}
            data-testid="feedback-heading"
          >
            {label}
          </h2>
          <p
            className={cn(
              'text-body-sm mt-0.5',
              ink({ quality: feedback.quality }),
            )}
          >
            {meaning}
          </p>
        </div>
      </div>

      <MetricRows items={feedback.feedback.facts} />

      {feedback.feedback.violatedConstraint === undefined ? null : (
        <p className="text-body-sm text-foreground text-pretty">
          Lo que no se cumplió:{' '}
          <strong className="font-semibold">
            {feedback.feedback.violatedConstraint}
          </strong>
        </p>
      )}

      {feedback.feedback.optimalComparison === undefined ? null : (
        <p className="text-body-sm text-foreground text-pretty">
          {feedback.feedback.optimalComparison}
        </p>
      )}

      <p className="text-caption text-foreground-muted" data-numeric>
        Puntos del evento:{' '}
        <span className="text-foreground font-semibold">
          {feedback.score.totalPoints}
        </span>
      </p>

      <Button onClick={onContinue} data-testid="continue" size="lg" block>
        Continuar
      </Button>
    </section>
  )
}
