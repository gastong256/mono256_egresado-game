import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import {
  createGrade1Dependencies,
  createGrade1RunDescriptor,
} from '../../src/content/grade-1'
import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  serializeActionLog,
  serializeSnapshot,
  transition,
  type InteractionAnswer,
  type PublicChallengeView,
} from '../../src/game'
import { grade1Answer } from '../helpers/grade-1-play'

/** A constructive answer that breaks an essential rule of its Template. */
function invalidConstructiveAnswer(
  view: PublicChallengeView,
): InteractionAnswer {
  const p = view.interaction
  switch (p.kind) {
    case 'quantity-builder':
      return {
        kind: p.kind,
        lines: p.items.map((item) => ({
          itemId: item.id,
          quantity: item.maxQuantity,
        })),
      }
    case 'schedule-builder':
      return {
        kind: p.kind,
        placements: p.activities.map((a) => ({
          activityId: a.id,
          startMinute: a.startMinutes[0]!,
        })),
      }
    case 'spatial-layout':
      return {
        kind: p.kind,
        placements: p.objects.map((o) => ({
          objectId: o.id,
          x: 0,
          y: 0,
          rotation: 0,
        })),
      }
    case 'assignment-board':
      return {
        kind: p.kind,
        assignments: p.tasks.map((t) => ({
          taskId: t.id,
          agentId: p.agents[0]!.id,
        })),
      }
    default:
      throw new Error('test only requests a Grade-1 constructive failure')
  }
}

/** Native selects support a full keyboard path, not a synthetic drag shortcut. */
async function choose(page: Page, label: string, value: string) {
  const control = page.getByRole('combobox', { name: label, exact: true })
  await control.focus()
  await expect(control).toBeFocused()
  const values = await control
    .locator('option')
    .evaluateAll((options) => options.map((o) => o.getAttribute('value')))
  const index = values.indexOf(value)
  expect(index).toBeGreaterThanOrEqual(0)
  await page.keyboard.press('Home')
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Tab')
  await expect(control).toHaveValue(value)
}

async function fillAnswer(
  page: Page,
  view: PublicChallengeView,
  answer: InteractionAnswer,
) {
  const p = view.interaction
  if (answer.kind === 'quantity-builder' || answer.kind === 'budget-builder') {
    if (p.kind !== 'quantity-builder' && p.kind !== 'budget-builder')
      throw new Error('wrong public contract')
    for (const line of answer.lines) {
      const item = p.items.find((entry) => entry.id === line.itemId)!
      const field = page.getByRole('spinbutton', {
        name: `Cantidad de ${item.label}`,
      })
      await field.focus()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.type(String(line.quantity))
      await page.keyboard.press('Tab')
    }
  } else if (
    answer.kind === 'schedule-builder' &&
    p.kind === 'schedule-builder'
  ) {
    for (const placement of answer.placements)
      await choose(
        page,
        p.activities.find((a) => a.id === placement.activityId)!.label,
        String(placement.startMinute),
      )
  } else if (answer.kind === 'spatial-layout' && p.kind === 'spatial-layout') {
    for (const placement of answer.placements) {
      const object = p.objects.find((o) => o.id === placement.objectId)!
      const checkbox = page
        .getByRole('group', { name: object.label, exact: true })
        .getByRole('checkbox')
      await checkbox.focus()
      await page.keyboard.press('Space')
      await choose(page, `${object.label} · X`, String(placement.x))
      if (p.height > 1)
        await choose(page, `${object.label} · Y`, String(placement.y))
      if (object.rotatable)
        await choose(
          page,
          `${object.label} · Orientación`,
          String(placement.rotation),
        )
    }
  } else if (
    answer.kind === 'assignment-board' &&
    p.kind === 'assignment-board'
  ) {
    for (const assignment of answer.assignments) {
      const task = p.tasks.find((t) => t.id === assignment.taskId)!
      await choose(page, `${task.label} ${task.detail}`, assignment.agentId)
    }
  } else if (answer.kind === 'number-grid' && p.kind === 'number-grid') {
    for (const [i, round] of answer.rounds.entries())
      for (const number of round.numbers)
        await page
          .getByTestId('number-grid')
          .nth(i)
          .getByRole('checkbox', { name: String(number), exact: true })
          .check()
  } else if (answer.kind === 'numeric-input')
    await page.getByLabel(/^Tu respuesta en/u).fill(answer.value)
  else if ('optionId' in answer && 'options' in p) {
    const index = p.options.findIndex((o) => o.id === answer.optionId)
    await page.getByRole('radio').nth(index).check()
  } else throw new Error('missing browser interaction driver')
}

const SCENARIOS = {
  optimal: { failed: [] as readonly string[], width: undefined },
  'schedule-invalid': {
    failed: ['y1.rehearsal-schedule', 'y1.schedule-review'],
    width: undefined,
  },
  'layout-invalid': {
    failed: ['y1.classroom-layout', 'y1.scale-fit-review'],
    width: 360,
  },
  'both-invalid': {
    failed: ['y1.classroom-layout', 'y1.rehearsal-schedule'],
    width: 390,
  },
} as const

for (const [scenario, { failed, width }] of Object.entries(SCENARIOS)) {
  test(`Grade 1 real: ${scenario}, keyboard, accessibility and replay`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
    if (width !== undefined) await page.setViewportSize({ width, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (e) => {
      if (e.type() === 'error') errors.push(e.text())
    })
    const seed = `browser-g1-${scenario}`,
      deps = createGrade1Dependencies(true)
    const descriptor = createGrade1RunDescriptor(seed, true)
    if (!descriptor.ok) throw new Error('missing descriptor')
    const created = createRun(descriptor.value, deps)
    if (!created.ok) throw new Error('missing run')
    let state = created.value.state,
      log = emptyActionLog(descriptor.value)
    let resumed = false
    const seen = new Set<string>()
    await page.goto(`/dev/game-engine?content=grade-1-demo&seed=${seed}`)
    await page.getByRole('button', { name: 'Comenzar recorrido' }).click()
    while (state.status === 'active') {
      if (state.phase !== 'challenge') {
        await page.getByTestId('continue').click()
        const command = { type: 'CONTINUE' } as const
        const next = transition(state, command, deps)
        if (!next.ok) throw new Error(next.error.kind)
        state = next.value.state
        log = appendAction(log, command)
        continue
      }
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined) throw new Error('missing view')
      const v = view.value,
        id = v.ref.templateId
      const g1 = id.startsWith('y1.')
      if (g1) {
        seen.add(id)
        await expect(
          page.getByRole('heading', { name: v.narrative.title, exact: true }),
        ).toBeVisible()
        if (v.review !== undefined) {
          const notes = page.getByTestId('review-notes')
          await expect(notes).toBeVisible()
          for (const note of v.review.practised)
            await expect(notes).toContainText(note.title)
          await expect(page.getByTestId('review-debrief')).toHaveCount(
            v.review.debriefed.length,
          )
        }
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(axe.violations).toEqual([])
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true)
      }
      const answer = (failed as readonly string[]).includes(id)
        ? invalidConstructiveAnswer(v)
        : grade1Answer(v, deps)
      await fillAnswer(page, v, answer)
      const submit = page.getByTestId('submit-answer')
      await expect(submit).toBeEnabled()
      await submit.focus()
      await page.keyboard.press('Enter')
      const command = {
        type: 'ANSWER',
        instanceId: v.ref.instanceId,
        answer,
      } as const
      const next = transition(state, command, deps)
      if (!next.ok) throw new Error(next.error.kind)
      state = next.value.state
      log = appendAction(log, command)
      await expect(page.getByTestId('feedback-heading')).toHaveAttribute(
        'data-quality',
        state.pendingFeedback!.quality,
      )
      if (g1 && !resumed) {
        await page.context().setOffline(true)
        // Local navigation continues without fetching gameplay decisions.
        await expect(page.getByTestId('continue')).toBeEnabled()
        await page.context().setOffline(false)
        await page.reload()
        await page
          .getByRole('button', { name: 'Reanudar última decisión' })
          .click()
        await expect(page.getByTestId('feedback-heading')).toHaveAttribute(
          'data-quality',
          state.pendingFeedback!.quality,
        )
        resumed = true
      }
    }
    await expect(
      page.getByText('Recorrido de desarrollo completado', { exact: true }),
    ).toBeVisible()
    expect([...seen].filter((id) => !id.endsWith('-review'))).toHaveLength(5)
    expect([...seen].filter((id) => id.endsWith('-review'))).toHaveLength(
      scenario === 'optimal' ? 0 : 1,
    )
    expect(state.progression.graduated).toBe(true)
    const raw = await page.evaluate(
      (key) => localStorage.getItem(key),
      `egresado.grade1.harness.v1.demo.${seed}`,
    )
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual({
      snapshot: serializeSnapshot(state),
      log: serializeActionLog(log),
    })
    expect(errors).toEqual([])
  })
}

test('Grade 1 composed practice: 7.º → 1.º under the partial development policy', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const seed = 'browser-g1-partial'
  const deps = createGrade1Dependencies()
  const descriptor = createGrade1RunDescriptor(seed)
  if (!descriptor.ok) throw new Error('missing descriptor')
  const created = createRun(descriptor.value, deps)
  if (!created.ok) throw new Error('missing run')
  let state = created.value.state
  await page.goto(`/dev/game-engine?content=grade-1&seed=${seed}`)
  await expect(page.getByText(/No es una carrera completa/u)).toBeVisible()
  await page.getByRole('button', { name: 'Comenzar recorrido' }).click()
  while (state.status === 'active') {
    if (state.phase !== 'challenge') {
      await page.getByTestId('continue').click()
      const next = transition(state, { type: 'CONTINUE' }, deps)
      if (!next.ok) throw new Error(next.error.kind)
      state = next.value.state
      continue
    }
    const view = activeChallengeView(state, deps)
    if (!view.ok || view.value === undefined) throw new Error('missing view')
    const answer = grade1Answer(view.value, deps)
    await fillAnswer(page, view.value, answer)
    await page.getByTestId('submit-answer').click()
    const next = transition(
      state,
      { type: 'ANSWER', instanceId: view.value.ref.instanceId, answer },
      deps,
    )
    if (!next.ok) throw new Error(next.error.kind)
    state = next.value.state
  }
  await expect(
    page.getByText('Recorrido de desarrollo completado', { exact: true }),
  ).toBeVisible()
  expect(state.completion?.graduated).toBe(true)
  expect(state.plan?.stages.map((stage) => stage.stageId)).toEqual([
    'grade-7',
    'year-1',
  ])
})
