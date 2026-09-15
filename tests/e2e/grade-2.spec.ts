import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  createGrade2Dependencies,
  createGrade2RunDescriptor,
} from '../../src/content/grade-2'
import {
  appendAction,
  emptyActionLog,
  serializeActionLog,
  serializeSnapshot,
} from '../../src/game'
import { playGrade2 } from '../helpers/grade-2-play'

/** Tab traversal, never HTMLElement.focus: the keyboard path is the contract. */
async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 160; step++) {
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

for (const width of [320, 360, 390, 412]) {
  test(`Grade 2: clasificar afirmaciones a ${String(width)} px, teclado y accesibilidad`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const seed = 'browser-g2'
    const deps = createGrade2Dependencies(true)
    const built = createGrade2RunDescriptor(seed, true)
    if (!built.ok) throw new Error('descriptor failed')
    const run = playGrade2(built.value, deps)

    // The first classification screen of 2.º, reached through its own log.
    const index = run.states.findIndex(
      (state) =>
        state.phase === 'challenge' &&
        state.activeEvent?.challenge?.templateId === 'y2.course-project-survey',
    )
    expect(index).toBeGreaterThan(-1)
    let log = emptyActionLog(built.value)
    for (const command of run.commands.slice(0, index))
      log = appendAction(log, command)

    await page.goto(`/dev/game-engine?content=grade-2-demo&seed=${seed}`)
    await page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, value)
      },
      {
        key: `egresado.grade2.harness.v1.demo.${seed}`,
        value: JSON.stringify({
          snapshot: serializeSnapshot(run.states[index]!),
          log: serializeActionLog(log),
        }),
      },
    )
    await page.reload()
    const resume = page.getByRole('button', {
      name: 'Reanudar última decisión',
    })
    await tabTo(page, resume)
    await page.keyboard.press('Enter')

    const selects = page.getByRole('combobox')
    await expect(selects.first()).toBeVisible()
    await reflow(page, `survey · empty · ${String(width)}`)

    // Every statement is labelled with the keyboard alone.
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(5)
    for (let index = 0; index < count; index++) {
      const control = selects.nth(index)
      await tabTo(page, control)
      await page.keyboard.press('ArrowDown')
      await expect(control).not.toHaveValue('')
    }
    await reflow(page, `survey · answered · ${String(width)}`)

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

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(axe.violations).toEqual([])

    const submit = page.getByTestId('submit-answer')
    await tabTo(page, submit)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-heading')).toBeFocused()
    await reflow(page, `survey · result · ${String(width)}`)
    await testInfo.attach('grade-2-controls', {
      body: JSON.stringify({ width, controls: controls.length }),
      contentType: 'application/json',
    })
  })
}
