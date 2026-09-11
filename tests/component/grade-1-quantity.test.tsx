// @vitest-environment jsdom

import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { materializeVariant } from '@/game/testing'
import {
  toVariantId,
  type ChallengeDefinition,
  type InteractionAnswer,
  type PublicChallengeView,
} from '@/game'
import {
  createGrade1Dependencies,
  grade1VariantCatalog,
} from '@/content/grade-1'
import { mobileData } from '@/content/grade-1/challenges/mobile-data'
import { studentDayWheel } from '@/content/grade-1/challenges/student-day-challenge-wheel'
import {
  InteractionControls,
  isDraftSubmittable,
  missingRequirement,
} from '@/components/game/interaction-area'
import { grade1Answer } from '../helpers/grade-1-play'

const deps = createGrade1Dependencies(true)

function instanceOf(template: ChallengeDefinition) {
  const entry = grade1VariantCatalog.entries.find(
    (candidate) => candidate.templateId === template.id,
  )
  if (entry === undefined) throw new Error('no approved variant')
  return materializeVariant(template, {
    variantId: toVariantId(String(entry.variantId)),
    seed: 'ui-quantity',
  })
}

function Harness({ template }: { readonly template: ChallengeDefinition }) {
  const instance = instanceOf(template)
  const presentation = instance.present([])
  const [draft, setDraft] = useState<InteractionAnswer>()
  const [result, setResult] = useState('')
  return (
    <>
      <InteractionControls
        presentation={presentation}
        draft={draft}
        disabled={result !== ''}
        onDraftChange={setDraft}
        onRequestInformation={() => {}}
        instanceId="quantity-ui"
      />
      <p>{missingRequirement(presentation, draft)}</p>
      <button
        disabled={!isDraftSubmittable(presentation, draft)}
        onClick={() => {
          if (draft === undefined) return
          const evaluated = instance.evaluate(draft, [])
          setResult(
            evaluated.ok ? evaluated.value.quality : evaluated.error.kind,
          )
        }}
      >
        Confirmar
      </button>
      <output aria-label="Resultado">{result}</output>
    </>
  )
}

async function fill(template: ChallengeDefinition) {
  const user = userEvent.setup()
  const instance = instanceOf(template)
  const view: PublicChallengeView = {
    ref: instance.ref,
    narrative: instance.narrative,
    interaction: instance.present([]),
    tools: instance.tools,
  }
  const answer = grade1Answer(view, deps)
  if (
    answer.kind !== 'quantity-builder' ||
    view.interaction.kind !== 'quantity-builder'
  )
    throw new Error('wrong contract')
  for (const line of answer.lines) {
    const item = view.interaction.items.find(
      (entry) => entry.id === line.itemId,
    )!
    const field = screen.getByRole('spinbutton', {
      name: `Cantidad de ${item.label}`,
    })
    await user.click(field)
    await user.clear(field)
    await user.type(field, String(line.quantity))
  }
  return user
}

it('plan de datos: controles etiquetados, sin total corriente, confirmación atómica por teclado', async () => {
  render(<Harness template={mobileData} />)
  expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  expect(
    screen.getByText('Agregá al menos una cantidad para confirmar.'),
  ).toBeInTheDocument()
  // A resource plan never shows the positions view: its running total is the challenge.
  expect(screen.queryByTestId('positions')).toBeNull()
  const user = await fill(mobileData)
  expect(screen.getByLabelText('Resultado')).toBeEmptyDOMElement()
  screen.getByRole('button', { name: 'Confirmar' }).focus()
  await user.keyboard('{Enter}')
  expect(screen.getByLabelText('Resultado')).toHaveTextContent('optimal')
  for (const field of screen.getAllByRole('spinbutton'))
    expect(field).toBeDisabled()
})

it('rueda: la vista de posiciones dibuja el reparto con códigos escritos y no lo juzga', async () => {
  render(<Harness template={studentDayWheel} />)
  const positions = screen.getByTestId('positions')
  expect(
    within(positions).getByText(/Quedan \d+ sin asignar/u),
  ).toBeInTheDocument()
  const user = await fill(studentDayWheel)
  expect(within(positions).getByText(/Todas asignadas/u)).toBeInTheDocument()
  expect(positions.querySelectorAll('li').length).toBeGreaterThan(0)
  expect(positions.textContent).toMatch(/Jue|Gru|Preg|Prem|Desc/u)
  // Drawing the counts says nothing about the rule.
  expect(positions.textContent).not.toMatch(/cumple|correct|óptim/iu)
  screen.getByRole('button', { name: 'Confirmar' }).focus()
  await user.keyboard('{Enter}')
  expect(screen.getByLabelText('Resultado')).toHaveTextContent('optimal')
})
