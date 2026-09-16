import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  createGrade4Dependencies,
  createGrade4RunDescriptor,
} from '../../src/content/grade-4'
import {
  appendAction,
  emptyActionLog,
  serializeActionLog,
  serializeSnapshot,
} from '../../src/game'
import { playGrade4 } from '../helpers/grade-4-play'

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
  const deps = createGrade4Dependencies(true)
  const built = createGrade4RunDescriptor(seed, true)
  if (!built.ok) throw new Error('descriptor failed')
  const run = playGrade4(built.value, deps)
  const index = run.states.findIndex(
    (state) =>
      state.phase === 'challenge' &&
      state.activeEvent?.challenge?.templateId === templateId,
  )
  expect(index, templateId).toBeGreaterThan(-1)
  let log = emptyActionLog(built.value)
  for (const command of run.commands.slice(0, index))
    log = appendAction(log, command)

  await page.goto(`/dev/game-engine?content=grade-4-demo&seed=${seed}`)
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value)
    },
    {
      key: `egresado.grade4.harness.v1.demo.${seed}`,
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
  test(`Grade 4: representar al curso a ${String(width)} px, teclado y accesibilidad`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openAt(page, 'browser-g4-consejo', 'y4.represent-class')

    const selects = page.getByRole('combobox')
    await expect(selects.first()).toBeVisible()
    await reflow(page, `represent · empty · ${String(width)}`)

    // Cinco propuestas y la postura pública: seis controles, todos por teclado.
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(6)
    for (let index = 0; index < count; index++) {
      const control = selects.nth(index)
      await tabTo(page, control)
      await page.keyboard.press('ArrowDown')
      await expect(control).not.toHaveValue('')
    }
    await reflow(page, `represent · answered · ${String(width)}`)
    const controls = await targetsAreBigEnough(page)
    await noAxeViolations(page)

    const submit = page.getByTestId('submit-answer')
    await tabTo(page, submit)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-heading')).toBeFocused()
    await reflow(page, `represent · result · ${String(width)}`)
    await testInfo.attach('grade-4-represent-controls', {
      body: JSON.stringify({ width, controls }),
      contentType: 'application/json',
    })
  })
}

for (const width of [320, 412]) {
  test(`Grade 4: armar el salón a ${String(width)} px, con capacidad y circulación`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openAt(page, 'browser-g4-salon', 'y4.event-floor-plan')

    const include = page.locator('main input[type=checkbox]')
    await expect(include.first()).toBeVisible()
    await reflow(page, `floor · empty · ${String(width)}`)

    // El plano se completa con casillas e inputs de coordenadas: el scroll de
    // la grilla nunca es la única forma de contestar. Se incluyen las tres
    // primeras zonas —escenario y dos mesas— sólo con el teclado.
    const zones = Math.min(await include.count(), 3)
    for (let index = 0; index < zones; index++) {
      const control = include.nth(index)
      await tabTo(page, control)
      await page.keyboard.press('Space')
      await expect(control).toBeChecked()
    }
    const selects = page.getByRole('combobox')
    const count = Math.min(await selects.count(), 6)
    for (let index = 0; index < count; index++) {
      const control = selects.nth(index)
      await tabTo(page, control)
      await page.keyboard.press('ArrowDown')
    }
    await reflow(page, `floor · answered · ${String(width)}`)
    await targetsAreBigEnough(page)
    await noAxeViolations(page)

    const submit = page.getByTestId('submit-answer')
    await expect(submit).toBeEnabled()
    await tabTo(page, submit)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-heading')).toBeFocused()
    await reflow(page, `floor · result · ${String(width)}`)
  })
}
