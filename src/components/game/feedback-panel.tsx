'use client'

/**
 * Feedback panel.
 *
 * The design rules are explicit: feedback must show the numbers that explain the
 * consequence, not a verdict. Everything rendered here comes from the engine's
 * structured feedback — the panel formats, it never computes.
 *
 * Outcome is announced to assistive technology and is never conveyed by colour
 * alone; the quality is always spelled out in text.
 */

import { useEffect, useRef } from 'react'

import type { PendingFeedback, SolutionQuality } from '@/game'

const QUALITY_LABEL: Readonly<Record<SolutionQuality, string>> = {
  invalid: 'No alcanzó',
  functional: 'Funcionó',
  efficient: 'Eficiente',
  optimal: 'Óptimo',
}

export interface FeedbackPanelProps {
  readonly feedback: PendingFeedback
  readonly onContinue: () => void
}

export function FeedbackPanel({ feedback, onContinue }: FeedbackPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // Moving focus to the outcome is what makes the consequence reachable for
    // keyboard and screen-reader users before the continue action.
    headingRef.current?.focus()
  }, [feedback.instanceId])

  return (
    <section
      aria-labelledby="feedback-title"
      className="flex flex-col gap-4 rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800"
    >
      <h2
        id="feedback-title"
        ref={headingRef}
        tabIndex={-1}
        // `alert` announces the outcome as soon as it is rendered.
        role="alert"
        className="text-lg font-semibold outline-none"
        data-quality={feedback.quality}
        data-testid="feedback-heading"
      >
        {QUALITY_LABEL[feedback.quality]}
      </h2>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {feedback.feedback.facts.map((fact) => (
          <div key={fact.label} className="contents">
            <dt className="text-slate-600 dark:text-slate-400">{fact.label}</dt>
            <dd className="font-medium tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {feedback.feedback.violatedConstraint === undefined ? null : (
        <p className="text-sm">
          Restricción que no se cumplió:{' '}
          <strong>{feedback.feedback.violatedConstraint}</strong>
        </p>
      )}

      {feedback.feedback.optimalComparison === undefined ? null : (
        <p className="text-sm text-pretty">
          {feedback.feedback.optimalComparison}
        </p>
      )}

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Puntos del evento:{' '}
        <span className="font-medium tabular-nums">
          {feedback.score.totalPoints}
        </span>{' '}
        (base {feedback.score.basePoints} × calidad{' '}
        {feedback.score.qualityFactor} × dificultad{' '}
        {feedback.score.difficultyFactor})
      </p>

      <button
        type="button"
        onClick={onContinue}
        data-testid="continue"
        className="min-h-11 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:focus-visible:outline-slate-100"
      >
        Continuar
      </button>
    </section>
  )
}
