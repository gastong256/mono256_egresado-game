import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  createGrade5Dependencies,
  createGrade5RunDescriptor,
} from '../../src/content/grade-5'
import {
  appendAction,
  emptyActionLog,
  serializeActionLog,
  serializeSnapshot,
} from '../../src/game'
import { playGrade5 } from '../helpers/grade-5-play'

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

async function reflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  expect(layout.scroll, label).toBeLessThanOrEqual(layout.viewport)
  await noEscapingText(page, label)
}

/** Resumes the harness exactly at the screen of `templateId`. */
async function openAt(page: Page, seed: string, templateId: string) {
  const deps = createGrade5Dependencies(true)
  const built = createGrade5RunDescriptor(seed, true)
  if (!built.ok) throw new Error('descriptor failed')
  const run = playGrade5(built.value, deps)
  const index = run.states.findIndex(
    (state) =>
      state.phase === 'challenge' &&
      state.activeEvent?.challenge?.templateId === templateId,
  )
  expect(index, templateId).toBeGreaterThan(-1)
  let log = emptyActionLog(built.value)
  for (const command of run.commands.slice(0, index))
    log = appendAction(log, command)

  await page.goto(`/dev/game-engine?content=grade-5-demo&seed=${seed}`)
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value)
    },
    {
      key: `egresado.grade5.harness.v1.demo.${seed}`,
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
  test(`Grade 5: rehacer la muestra final a ${String(width)} px, teclado y accesibilidad`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openAt(page, 'browser-g5-muestra', 'y5.course-project-final')

    const selects = page.getByRole('combobox')
    await expect(selects.first()).toBeVisible()
    await reflow(page, `project-final · empty · ${String(width)}`)

    // Seis tareas y la postura del curso: siete controles, todos por teclado.
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(7)
    for (let index = 0; index < count; index++) {
      const control = selects.nth(index)
      await tabTo(page, control)
      await page.keyboard.press('ArrowDown')
      await expect(control).not.toHaveValue('')
    }
    await reflow(page, `project-final · answered · ${String(width)}`)
    const controls = await targetsAreBigEnough(page)
    await noAxeViolations(page)

    const submit = page.getByTestId('submit-answer')
    await tabTo(page, submit)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-heading')).toBeFocused()
    await reflow(page, `project-final · result · ${String(width)}`)
    await testInfo.attach('grade-5-project-final-controls', {
      body: JSON.stringify({ width, controls }),
      contentType: 'application/json',
    })
  })
}

for (const width of [320, 412]) {
  test(`Grade 5: proyectar la pantalla del acto a ${String(width)} px, con las seis formas`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openAt(page, 'browser-g5-pantalla', 'y5.stage-screen')

    // RS-MAT-008: seis formas de proyectar, y los dos elementos protegidos a la
    // vista con su aire.
    const options = page.getByRole('radio')
    await expect(options).toHaveCount(6)
    await expect(
      page.getByText('Cartel del curso', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Fecha del acto', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('sin cortar el cartel ni la fecha', { exact: false }),
    ).toBeVisible()
    await reflow(page, `stage-screen · empty · ${String(width)}`)

    await tabTo(page, options.first())
    await page.keyboard.press('Space')
    await expect(options.first()).toBeChecked()
    await reflow(page, `stage-screen · answered · ${String(width)}`)
    await noAxeViolations(page)

    const submit = page.getByTestId('submit-answer')
    await tabTo(page, submit)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-heading')).toBeFocused()
    await reflow(page, `stage-screen · result · ${String(width)}`)
  })
}

for (const width of [320, 412]) {
  test(`Grade 5: elegir el año que viene a ${String(width)} px, sin puntuar la preferencia`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openAt(page, 'browser-g5-futuro', 'y5.next-step-options')

    const selects = page.getByRole('combobox')
    await expect(selects.first()).toBeVisible()
    await reflow(page, `next-step · empty · ${String(width)}`)

    // La pregunta de preferencia dice en la pantalla que no se puntúa.
    await expect(page.getByText('no se puntúa')).toBeVisible()

    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(6)
    for (let index = 0; index < count; index++) {
      const control = selects.nth(index)
      await tabTo(page, control)
      await page.keyboard.press('ArrowDown')
      await expect(control).not.toHaveValue('')
    }
    await reflow(page, `next-step · answered · ${String(width)}`)
    await targetsAreBigEnough(page)
    await noAxeViolations(page)

    const submit = page.getByTestId('submit-answer')
    await tabTo(page, submit)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('feedback-heading')).toBeFocused()
    await reflow(page, `next-step · result · ${String(width)}`)
  })
}
