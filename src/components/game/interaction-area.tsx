'use client'

/**
 * Interaction renderer registry.
 *
 * This exhaustive switch *is* the registry. Because `InteractionPresentation` is
 * a discriminated union and the default branch calls `assertNever`, adding a
 * kind to the engine makes this file fail to compile until a renderer exists —
 * which is exactly the coverage guarantee a `Record<string, Component>` cannot
 * give. Each branch is also narrowed to its own presentation type, so no cast is
 * needed anywhere.
 *
 * Renderers collect a *draft* answer and nothing more. They never evaluate
 * correctness: no evaluator is imported here, and the only way an answer is
 * judged is by dispatching it to the engine.
 */

import { assertNever } from '@/game/core/exhaustive'
import type { InteractionAnswer, InteractionPresentation } from '@/game'

import { Button, Surface } from '@/components/ui'
import { MetricGroup } from './data-metric'
import { AssignmentBoard } from './interactions/assignment-board'
import { BudgetBuilder } from './interactions/budget-builder'
import { NumericAnswer } from './interactions/numeric-answer'
import { OptionGroup } from './interactions/option-group'

export interface InteractionAreaProps {
  readonly presentation: InteractionPresentation
  readonly draft: InteractionAnswer | undefined
  readonly disabled: boolean
  readonly onDraftChange: (answer: InteractionAnswer | undefined) => void
  readonly onRequestInformation: (key: string) => void
  /** Namespaces radio groups so two challenges on one page cannot collide. */
  readonly instanceId: string
}

/** Selected option id when the draft matches the expected kind. */
function selectedOption(
  draft: InteractionAnswer | undefined,
  kind: InteractionAnswer['kind'],
): string | undefined {
  if (draft?.kind !== kind) {
    return undefined
  }
  return 'optionId' in draft ? draft.optionId : undefined
}

export function InteractionArea({
  presentation,
  draft,
  disabled,
  onDraftChange,
  onRequestInformation,
  instanceId,
}: InteractionAreaProps) {
  switch (presentation.kind) {
    case 'decision-card':
      return (
        <div className="flex flex-col gap-4">
          <MetricGroup items={presentation.data} />
          <OptionGroup
            legend="Elegí una opción"
            name={`decision-${instanceId}`}
            options={presentation.options}
            value={selectedOption(draft, 'decision-card')}
            disabled={disabled}
            onSelect={(optionId) => {
              onDraftChange({ kind: 'decision-card', optionId })
            }}
          />
        </div>
      )

    case 'timeline':
      return (
        <div className="flex flex-col gap-4">
          <MetricGroup items={presentation.data} />
          <OptionGroup
            legend={`Elegí un bloque en ${presentation.unitLabel}`}
            name={`timeline-${instanceId}`}
            options={presentation.options}
            value={selectedOption(draft, 'timeline')}
            disabled={disabled}
            onSelect={(optionId) => {
              onDraftChange({ kind: 'timeline', optionId })
            }}
          />
        </div>
      )

    case 'chart-interpretation': {
      const largest = presentation.series.reduce(
        (max, point) => Math.max(max, point.value),
        0,
      )

      return (
        <div className="flex flex-col gap-4">
          {/* The chart is a labelled table rendered as bars: the numbers are
              always readable, so meaning never depends on the bar length or on
              colour, per the accessibility rules. */}
          <table className="text-body-sm w-full">
            <caption className="sr-only">{presentation.axisLabel}</caption>
            <tbody>
              {presentation.series.map((point) => (
                <tr key={point.label}>
                  <th
                    scope="row"
                    className="text-foreground-muted py-1 pr-3 text-left font-normal"
                  >
                    {point.label}
                  </th>
                  <td className="w-full py-1">
                    <span
                      aria-hidden="true"
                      className="bg-primary rounded-pill block h-3"
                      style={{
                        width: `${String(largest === 0 ? 0 : Math.round((point.value / largest) * 100))}%`,
                      }}
                    />
                  </td>
                  <td
                    data-numeric
                    className="text-data-foreground py-1 pl-3 text-right font-semibold"
                  >
                    {point.display}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <OptionGroup
            legend="Elegí una opción"
            name={`chart-${instanceId}`}
            options={presentation.options}
            value={selectedOption(draft, 'chart-interpretation')}
            disabled={disabled}
            onSelect={(optionId) => {
              onDraftChange({ kind: 'chart-interpretation', optionId })
            }}
          />
        </div>
      )
    }

    case 'information-request':
      return (
        <div className="flex flex-col gap-4">
          <MetricGroup items={presentation.data} />
          {presentation.revealed.length > 0 ? (
            <Surface tone="muted" padding="compact">
              <h3 className="text-subheading mb-2">Datos que pediste</h3>
              <MetricGroup items={presentation.revealed} />
            </Surface>
          ) : null}
          {presentation.available.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-subheading">Podés pedir más datos</h3>
              <ul className="flex list-none flex-col gap-2 p-0">
                {presentation.available.map((entry) => (
                  <li key={entry.key}>
                    <Button
                      variant="secondary"
                      size="md"
                      block
                      disabled={disabled}
                      onClick={() => {
                        onRequestInformation(entry.key)
                      }}
                      className="justify-start border-dashed"
                    >
                      {entry.label}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <OptionGroup
            legend="Elegí qué hacer"
            name={`info-${instanceId}`}
            options={presentation.options}
            value={selectedOption(draft, 'information-request')}
            disabled={disabled}
            onSelect={(optionId) => {
              onDraftChange({ kind: 'information-request', optionId })
            }}
          />
        </div>
      )

    case 'numeric-input':
      return (
        <div className="flex flex-col gap-4">
          <MetricGroup items={presentation.data} />
          <NumericAnswer
            unitLabel={presentation.unitLabel}
            min={presentation.min}
            max={presentation.max}
            step={presentation.step}
            value={draft?.kind === 'numeric-input' ? draft.value : ''}
            disabled={disabled}
            onChange={(value) => {
              onDraftChange(
                value === '' ? undefined : { kind: 'numeric-input', value },
              )
            }}
          />
        </div>
      )

    case 'budget-builder':
      return (
        <div className="flex flex-col gap-4">
          <MetricGroup items={presentation.data} />
          <BudgetBuilder
            items={presentation.items}
            lines={draft?.kind === 'budget-builder' ? draft.lines : []}
            disabled={disabled}
            onChange={(lines) => {
              onDraftChange({ kind: 'budget-builder', lines })
            }}
          />
        </div>
      )

    case 'assignment-board':
      return (
        <AssignmentBoard
          agents={presentation.agents}
          tasks={presentation.tasks}
          assignments={
            draft?.kind === 'assignment-board' ? draft.assignments : []
          }
          disabled={disabled}
          onChange={(assignments) => {
            onDraftChange({ kind: 'assignment-board', assignments })
          }}
        />
      )

    default:
      return assertNever(presentation)
  }
}

/**
 * Whether a draft is structurally complete enough to submit.
 *
 * This is a UX guard only. The engine re-validates every answer, so a client
 * that bypasses the disabled button gains nothing.
 */
export function isDraftSubmittable(
  presentation: InteractionPresentation,
  draft: InteractionAnswer | undefined,
): boolean {
  if (draft === undefined || draft.kind !== presentation.kind) {
    return false
  }

  switch (draft.kind) {
    case 'decision-card':
    case 'timeline':
    case 'chart-interpretation':
    case 'information-request':
      return draft.optionId.length > 0
    case 'numeric-input':
      return /^[+-]?\d+(?:\.\d+)?$/u.test(draft.value)
    case 'budget-builder':
      return draft.lines.some((line) => line.quantity > 0)
    case 'assignment-board':
      return (
        presentation.kind === 'assignment-board' &&
        draft.assignments.length === presentation.tasks.length
      )
    default:
      return assertNever(draft)
  }
}
