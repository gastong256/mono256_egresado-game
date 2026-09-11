// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { materializeVariant } from '@/game/testing'
import {
  toVariantId,
  type InteractionAnswer,
  type ChallengeDefinition,
  type PublicChallengeView,
} from '@/game'
import {
  createGrade1Dependencies,
  grade1VariantCatalog,
} from '@/content/grade-1'
import {
  classroomLayout,
  scaleFitReview,
} from '@/content/grade-1/challenges/classroom-layout'
import {
  rehearsalSchedule,
  scheduleReview,
} from '@/content/grade-1/challenges/rehearsal-schedule'
import { courseProjectExpo } from '@/content/grade-1/challenges/course-project-expo'
import {
  InteractionControls,
  isDraftSubmittable,
  missingRequirement,
} from '@/components/game/interaction-area'
import { grade1Answer } from '../helpers/grade-1-play'

const deps = createGrade1Dependencies(true)

it.each([
  rehearsalSchedule,
  scheduleReview,
  classroomLayout,
  scaleFitReview,
  courseProjectExpo,
])(
  '$id: semantic, non-drag construction and atomic confirmation',
  async (template: ChallengeDefinition) => {
    const user = userEvent.setup()
    const entry = grade1VariantCatalog.entries.find(
      (candidate) => candidate.templateId === template.id,
    )
    if (entry === undefined) throw new Error('no approved variant')
    const instance = materializeVariant(template, {
      variantId: toVariantId(String(entry.variantId)),
      seed: 'ui-constructive',
    })
    const p = instance.present([])
    const view: PublicChallengeView = {
      ref: instance.ref,
      narrative: instance.narrative,
      interaction: p,
      tools: instance.tools,
    }
    const answer = grade1Answer(view, deps)
    function Harness() {
      const [draft, setDraft] = useState<InteractionAnswer>(),
        [result, setResult] = useState('')
      return (
        <>
          <InteractionControls
            presentation={p}
            draft={draft}
            disabled={result !== ''}
            onDraftChange={setDraft}
            onRequestInformation={() => {}}
            instanceId="constructive-ui"
          />
          <p data-testid="missing">{missingRequirement(p, draft)}</p>
          <button
            disabled={!isDraftSubmittable(p, draft)}
            onClick={() => {
              if (draft !== undefined) {
                const evaluated = instance.evaluate(draft, [])
                setResult(
                  evaluated.ok ? evaluated.value.quality : evaluated.error.kind,
                )
              }
            }}
          >
            Confirmar
          </button>
          <output aria-label="Resultado">{result}</output>
        </>
      )
    }
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
    expect(screen.getByTestId('missing')).not.toBeEmptyDOMElement()

    if (p.kind === 'schedule-builder' && answer.kind === p.kind) {
      expect(screen.getByTestId('afternoon-view')).toBeInTheDocument()
      for (const placement of answer.placements)
        await user.selectOptions(
          screen.getByRole('combobox', {
            name: p.activities.find((a) => a.id === placement.activityId)!
              .label,
          }),
          String(placement.startMinute),
        )
      const agenda = screen.getByRole('list', { name: 'Agenda elegida' })
      expect(within(agenda).getAllByRole('listitem')).toHaveLength(
        answer.placements.length,
      )
      // The drawn afternoon shows blocks, never the trips the player must add.
      expect(screen.getByTestId('afternoon-view')).toHaveTextContent(
        /no se dibujan/u,
      )
    } else if (p.kind === 'spatial-layout' && answer.kind === p.kind) {
      expect(
        screen.getByRole('region', { name: 'Plano por coordenadas' }),
      ).toHaveAttribute('tabindex', '0')
      expect(screen.getByTestId('plan-legend')).toHaveTextContent(
        p.objects[0]!.label,
      )
      for (const placed of answer.placements) {
        const object = p.objects.find((o) => o.id === placed.objectId)!
        const group = screen.getByRole('group', { name: object.label })
        const box = within(group).getByRole('checkbox')
        box.focus()
        await user.keyboard(' ')
        await user.selectOptions(
          screen.getByRole('combobox', { name: `${object.label} · X` }),
          String(placed.x),
        )
        if (p.height > 1)
          await user.selectOptions(
            screen.getByRole('combobox', { name: `${object.label} · Y` }),
            String(placed.y),
          )
        if (object.rotatable)
          await user.selectOptions(
            screen.getByRole('combobox', {
              name: `${object.label} · Orientación`,
            }),
            String(placed.rotation),
          )
        expect(
          screen.getByTestId(`cell-${String(placed.x)}-${String(placed.y)}`),
        ).toHaveTextContent(object.code)
      }
    } else if (p.kind === 'assignment-board' && answer.kind === p.kind) {
      for (const assigned of answer.assignments) {
        const task = p.tasks.find((t) => t.id === assigned.taskId)!
        await user.selectOptions(
          screen.getByRole('combobox', {
            name: `${task.label} ${task.detail}`,
          }),
          assigned.agentId,
        )
      }
      const optional = p.tasks.find((t) => t.optional)
      if (optional === undefined) throw new Error('missing optional task')
      const field = screen.getByRole('combobox', {
        name: `${optional.label} ${optional.detail}`,
      })
      const chosen = (field as HTMLSelectElement).value
      await user.selectOptions(field, '')
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeEnabled()
      await user.selectOptions(field, chosen)
    } else {
      throw new Error('unexpected contract')
    }
    expect(screen.getByLabelText('Resultado')).toBeEmptyDOMElement()
    screen.getByRole('button', { name: 'Confirmar' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByLabelText('Resultado')).toHaveTextContent('optimal')
    for (const select of screen.queryAllByRole('combobox'))
      expect(select).toBeDisabled()
  },
)
