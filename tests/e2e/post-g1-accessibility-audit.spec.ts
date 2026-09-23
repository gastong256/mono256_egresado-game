import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Locator } from '@playwright/test'
import {
  createGrade1Dependencies,
  createGrade1RunDescriptor,
} from '../../src/content/grade-1'
import {
  activeChallengeView,
  appendAction,
  emptyActionLog,
  serializeActionLog,
  serializeSnapshot,
  type InteractionAnswer,
  type PublicChallengeView,
} from '../../src/game'
import {
  grade1Answer,
  playGrade1,
  stressCaseQualities,
} from '../helpers/grade-1-play'

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
  await tabTo(page, control)
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
      await tabTo(page, field)
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
      await tabTo(page, checkbox)
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

/**
 * Ningún texto se sale de su propia caja.
 *
 * `scrollWidth` del documento no lo ve: una etiqueta comprimida a una columna
 * de una palabra por renglón, o una palabra que asoma por fuera de su fila,
 * no ensanchan la página. Se buscan elementos con texto propio cuyo contenido
 * sea más ancho que su caja sin que nada lo recorte.
 */
async function noEscapingText(page: Page, label: string) {
  const escaping = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('main *'))
      .filter((element) => {
        const style = getComputedStyle(element)
        if (style.overflowX !== 'visible' || style.display === 'none')
          return false
        if (element.closest('svg, [aria-hidden="true"]')) return false
        const ownText = Array.from(element.childNodes).some(
          (node) => node.nodeType === 3 && (node.textContent ?? '').trim(),
        )
        return (
          ownText &&
          element.clientWidth > 0 &&
          element.scrollWidth > element.clientWidth + 2
        )
      })
      .map((element) => ({
        tag: element.tagName,
        text: (element.textContent ?? '').trim().slice(0, 40),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      })),
  )
  expect(escaping, label).toEqual([])
}

/**
 * The document never scrolls horizontally, in any state of the challenge.
 *
 * Measured empty, with the answer built and on the result: a filled plan or a
 * long feedback line is what widens a page, not the first paint.
 */
async function reflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
    overflowing: Array.from(document.querySelectorAll('body *'))
      .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 0.5)
      .map((e) => ({
        tag: e.tagName,
        className: String(e.className),
        right: e.getBoundingClientRect().right,
        text: e.textContent?.slice(0, 60),
      })),
    // Boxes wider than the viewport: whoever is actually stretching the page.
    wide: Array.from(document.querySelectorAll('body *'))
      .filter((e) => e.getBoundingClientRect().width > window.innerWidth + 0.5)
      .map((e) => ({
        tag: e.tagName,
        className: String(e.className).slice(0, 70),
        width: Math.round(e.getBoundingClientRect().width),
        left: Math.round(e.getBoundingClientRect().left),
      })),
    // Elements whose content is wider than their box: when the document grows,
    // one of these is the ancestor that refused to shrink.
    tight: Array.from(document.querySelectorAll('body *'))
      .filter((e) => e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0)
      .map((e) => ({
        tag: e.tagName,
        className: String(e.className).slice(0, 70),
        clientWidth: e.clientWidth,
        scrollWidth: e.scrollWidth,
      })),
  }))
  if (layout.scroll > layout.viewport)
    console.log('OVERFLOW', label, JSON.stringify(layout))
  expect(layout.scroll, label).toBeLessThanOrEqual(layout.viewport)
  await noEscapingText(page, label)
}

/** Audit navigation uses actual Tab traversal, never HTMLElement.focus or mouse. */
async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 150; step++) {
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      const outline = await target.evaluate((element) => {
        const style = getComputedStyle(element)
        return { width: style.outlineWidth, style: style.outlineStyle }
      })
      expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2)
      expect(outline.style).not.toBe('none')
      return
    }
    await page.keyboard.press('Tab')
  }
  throw new Error(
    `Control unreachable by Tab: ${await target.getAttribute('id')}`,
  )
}

// The declared floor is 320: `html` carries `min-width: 320px` and the whole
// game is operable there. 412 is the shell maximum, and 1280 at zoom 2 is the
// reflow equivalent of a 640 px viewport.
for (const [width, zoom] of [
  [320, 1],
  [360, 1],
  [390, 1],
  [412, 1],
  [1280, 2],
] as const) {
  test(`post-G1 audit: native keyboard, focus, reflow ${width} zoom ${zoom}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const seed = 'post-g1-browser-audit'
    const deps = createGrade1Dependencies(true)
    const descriptor = createGrade1RunDescriptor(seed, true)
    if (!descriptor.ok) throw new Error('descriptor failed')
    const run = playGrade1(
      descriptor.value,
      deps,
      stressCaseQualities('optimal'),
    )
    const measurements: unknown[] = []
    await page.goto(`/dev/game-engine?content=grade-1-demo&seed=${seed}`)
    for (const [index, state] of run.states.entries()) {
      if (state.phase !== 'challenge') continue
      const result = activeChallengeView(state, deps)
      if (!result.ok || result.value === undefined)
        throw new Error('view failed')
      const view = result.value
      if (!view.ref.templateId.startsWith('y1.')) continue
      let log = emptyActionLog(descriptor.value)
      for (const command of run.commands.slice(0, index))
        log = appendAction(log, command)
      await page.evaluate(
        ({ key, value }) => localStorage.setItem(key, value),
        {
          key: `egresado.grade1.harness.v1.demo.${seed}`,
          value: JSON.stringify({
            snapshot: serializeSnapshot(state),
            log: serializeActionLog(log),
          }),
        },
      )
      await page.reload()
      await page.evaluate((value) => {
        document.documentElement.style.zoom = String(value)
      }, zoom)
      const resume = page.getByRole('button', {
        name: 'Reanudar última decisión',
      })
      await tabTo(page, resume)
      await page.keyboard.press('Enter')
      await expect(
        page.getByRole('heading', { name: view.narrative.title, exact: true }),
      ).toBeVisible()
      await reflow(page, `${view.ref.templateId} · empty`)
      await page.context().setOffline(true)
      const answer = ['y1.classroom-layout', 'y1.rehearsal-schedule'].includes(
        view.ref.templateId,
      )
        ? invalidConstructiveAnswer(view)
        : grade1Answer(view, deps)
      await fillAnswer(page, view, answer)
      const submit = page.getByTestId('submit-answer')
      await tabTo(page, submit)
      const controls = await page
        .locator(
          'main button:enabled, main select:enabled, main input[type="number"]:enabled',
        )
        .evaluateAll((elements) =>
          elements.map((e) => ({
            label: e.getAttribute('aria-label') ?? e.id ?? e.textContent,
            width: e.getBoundingClientRect().width,
            height: e.getBoundingClientRect().height,
          })),
        )
      for (const control of controls) {
        expect(control.height / zoom).toBeGreaterThanOrEqual(44)
        expect(control.width / zoom).toBeGreaterThanOrEqual(44)
      }
      await reflow(page, `${view.ref.templateId} · answered`)
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(axe.violations).toEqual([])
      if (view.review !== undefined) {
        await expect(page.getByTestId('review-debrief')).toHaveCount(1)
        expect(view.review.practised).toHaveLength(1)
      }
      await page.screenshot({
        path: testInfo.outputPath(`${view.ref.templateId}.png`),
        fullPage: true,
      })
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('feedback-heading')).toBeFocused()
      await expect(page.getByTestId('feedback-heading')).toHaveAttribute(
        'role',
        'alert',
      )
      await reflow(page, `${view.ref.templateId} · result`)
      await tabTo(page, page.getByTestId('continue'))
      await page.keyboard.press('Enter')
      await page.context().setOffline(false)
      measurements.push({ template: view.ref.templateId, controls })
    }
    expect(measurements).toHaveLength(6)
    await testInfo.attach('audit-measurements', {
      body: JSON.stringify({ width, zoom, measurements }),
      contentType: 'application/json',
    })
  })
}
