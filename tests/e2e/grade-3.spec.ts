import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  createGrade3Dependencies,
  createGrade3RunDescriptor,
} from '../../src/content/grade-3'
import {
  appendAction,
  emptyActionLog,
  serializeActionLog,
  serializeSnapshot,
} from '../../src/game'
import { playGrade3 } from '../helpers/grade-3-play'

/** Tab traversal, never HTMLElement.focus: the keyboard path is the contract. */
async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 200; step++) {
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
  throw new Error('control unreachable by Tab')
}

async function reflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  expect(layout.scroll, label).toBeLessThanOrEqual(layout.viewport)
}

/** Resumes the harness exactly at the screen of `templateId`. */
async function openAt(page: Page, seed: string, templateId: string) {
  const deps = createGrade3Dependencies(true)
  const built = createGrade3RunDescriptor(seed, true)
  if (!built.ok) throw new Error('descriptor failed')
  const run = playGrade3(built.value, deps)
  const index = run.states.findIndex(
    (state) =>
      state.phase === 'challenge' &&
      state.activeEvent?.challenge?.templateId === templateId,
  )
  expect(index, templateId).toBeGreaterThan(-1)
  let log = emptyActionLog(built.value)
  for (const command of run.commands.slice(0, index))
    log = appendAction(log, command)

  await page.goto(`/dev/game-engine?content=grade-3-demo&seed=${seed}`)
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value)
    },
    {
      key: `egresado.grade3.harness.v1.demo.${seed}`,
      value: JSON.stringify({
        snapshot: serializeSnapshot(run.states[index]!),
        log: serializeActionLog(log),
      }),
    },
  )
  await page.reload()
  const resume = page.getByRole('button', { name: 'Reanudar última decisión' })
  await tabTo(page, resume)
  await page.keyboard.press('Enter')
}

async function targetsAreBigEnough(page: Page) {
  const controls = await page
    .locator('main select:enabled, main button:enabled')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        height: element.getBoundingClientRect().height,
        width: element.getBoundingClientRect().width,
      })),
    )
  for (const control of controls) {
    expect(control.height).toBeGreaterThanOrEqual(44)
    expect(control.width).toBeGreaterThanOrEqual(44)
  }
  return controls.length
}

async function noAxeViolations(page: Page) {
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(axe.violations).toEqual([])
}

for (const width of [320, 360, 390, 412]) {
  test(`Grade 3: armar el recorrido a ${String(width)} px, teclado y accesibilidad`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openAt(page, 'browser-g3-route', 'y3.route-plan')

    const selects = page.getByRole('combobox')
    await expect(selects.first()).toBeVisible()
    await expect(page.getByTestId('route-map')).toBeVisible()
    await reflow(page, `route · empty · ${String(width)}`)

    // El orden se arma entero con el teclado: una parada por posición.
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(5)
    for (let index = 0; index < count; index++) {
      const control = selects.nth(index)
      await tabTo(page, control)
      await page.keyboard.press('ArrowDown')
      await expect(control).not.toHaveValue('')
    }
    await reflow(page, `route · answered · ${String(width)}`)
    const controls = await targetsAreBigEnough(page)
    await noAxeViolations(page)

    const submit = page.getByTestId('submit-answer')
    await tabTo(page, submit)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-heading')).toBeFocused()
    await reflow(page, `route · result · ${String(width)}`)
    await testInfo.attach('grade-3-route-controls', {
      body: JSON.stringify({ width, controls }),
      contentType: 'application/json',
    })
  })
}

for (const width of [320, 412]) {
  test(`Grade 3: armar la semana a ${String(width)} px, con días y vencimientos`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openAt(page, 'browser-g3-week', 'y3.week-planner')

    const selects = page.getByRole('combobox')
    await expect(selects.first()).toBeVisible()
    await expect(page.getByTestId('week-view')).toBeVisible()
    await reflow(page, `week · empty · ${String(width)}`)

    // Los horarios se leen con día y hora, que es lo que distingue este modo.
    const options = await selects.first().locator('option').allTextContents()
    expect(
      options.some((text) => /^(Lun|Mar|Mié|Jue) \d\d:\d\d$/u.test(text)),
    ).toBe(true)

    const count = await selects.count()
    for (let index = 0; index < count; index++) {
      const control = selects.nth(index)
      await tabTo(page, control)
      await page.keyboard.press('ArrowDown')
    }
    await reflow(page, `week · answered · ${String(width)}`)
    await targetsAreBigEnough(page)
    await noAxeViolations(page)

    const submit = page.getByTestId('submit-answer')
    await tabTo(page, submit)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-heading')).toBeFocused()
    await reflow(page, `week · result · ${String(width)}`)
  })
}
