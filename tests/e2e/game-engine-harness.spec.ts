import { expect, test, type ConsoleMessage, type Page } from '@playwright/test'

/**
 * Browser smoke test for the engine harness.
 *
 * Proves the deterministic core, the controller and the interaction renderers
 * work together in a real browser: a run starts, a challenge is answered,
 * structured feedback appears, and the same seed always produces the same run.
 */

const HARNESS = '/dev/game-engine?seed=e2e-alpha'

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    errors.push(error.message)
  })
  return errors
}

/**
 * Advances until a challenge is on screen.
 *
 * A run may open with several narrative beats in a row — a purely narrative
 * storylet is a documented event type — so the test advances until an
 * interaction appears rather than assuming the second event is a challenge.
 */
async function advanceToChallenge(page: Page): Promise<void> {
  const submit = page.getByTestId('submit-answer')

  for (let step = 0; step < 8; step += 1) {
    if ((await submit.count()) > 0) {
      return
    }
    const advance = page.getByTestId('continue')
    if ((await advance.count()) === 0) {
      break
    }
    await advance.click()
  }

  await expect(submit).toBeVisible()
}

/** Answers whichever interaction is currently presented. */
async function answerCurrentChallenge(page: Page): Promise<void> {
  const radios = page.getByRole('radio')
  if ((await radios.count()) > 0) {
    await radios.first().check()
    return
  }

  const spins = page.getByRole('spinbutton')
  const spinCount = await spins.count()
  for (let index = 0; index < spinCount; index += 1) {
    await spins.nth(index).fill('2')
  }

  const selects = page.getByRole('combobox')
  const selectCount = await selects.count()
  for (let index = 0; index < selectCount; index += 1) {
    const options = await selects.nth(index).locator('option').all()
    const values = (
      await Promise.all(options.map((option) => option.getAttribute('value')))
    ).filter((value): value is string => value !== null && value !== '')
    const chosen = values[index]
    if (chosen !== undefined) {
      await selects.nth(index).selectOption(chosen)
    }
  }
}

test('plays an engine run in the browser without console errors', async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)

  await page.goto(HARNESS)

  await expect(page.getByTestId('harness-notice')).toContainText(
    'Herramienta de desarrollo',
  )
  await expect(page.getByTestId('stage-label')).toHaveText('7.º grado')
  // La tira de carrera arranca ausente: ninguna dimensión se tocó todavía, y
  // el sistema no dibuja un cero donde no hay valor.
  await expect(page.getByTestId('career-strip')).toHaveCount(0)

  // Advance past the opening narrative beats to the first challenge.
  await advanceToChallenge(page)

  // A challenge is presented with a disabled submit until an answer exists.
  const submit = page.getByTestId('submit-answer')
  await expect(submit).toBeVisible()
  await expect(submit).toBeDisabled()

  await answerCurrentChallenge(page)
  await expect(submit).toBeEnabled()
  await submit.click()

  // Structured feedback appears and is announced.
  const feedback = page.getByTestId('feedback-heading')
  await expect(feedback).toBeVisible()
  await expect(feedback).toHaveAttribute('role', 'alert')
  await expect(feedback).toHaveAttribute(
    'data-quality',
    /invalid|functional|efficient|optimal/u,
  )

  expect(errors).toEqual([])
})

test('is reproducible: the same seed replays the same run', async ({
  page,
}) => {
  const read = async (): Promise<string> => {
    await page.goto(HARNESS)
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click()
    const panel = page.getByLabel('Diagnóstico de desarrollo')
    await expect(panel).toBeVisible()
    return (await panel.textContent()) ?? ''
  }

  const first = await read()
  const second = await read()

  expect(second).toBe(first)
  expect(first).toContain('e2e-alpha')
})

/**
 * Cross-runtime determinism.
 *
 * The engine claims to produce identical results in Node and in the browser.
 * Asserting the harness against itself only proves the browser is
 * self-consistent, so these values are the ones Node computes for the same
 * seed. If the two runtimes ever diverge — a numeric representation, a hash, a
 * locale-sensitive comparison — this is what catches it.
 *
 * Regenerate with `pnpm game:simulate` semantics only when the engine version
 * or the content version changes deliberately.
 */
test('reproduces the run Node computes for the same seed', async ({ page }) => {
  await page.goto(HARNESS)

  // Event 0: the opening narrative beat.
  await expect(page.getByTestId('stage-label')).toHaveText('7.º grado')
  await expect(page.getByRole('heading', { name: 'Primer día' })).toBeVisible()

  // Event 1: a second narrative beat, not a challenge.
  await page.getByTestId('continue').click()
  await expect(page.getByTestId('narrative-card')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'La foto del curso' }),
  ).toBeVisible()

  // Event 2: the first challenge, with the exact instance Node derives.
  await page.getByTestId('continue').click()
  await expect(page.getByTestId('submit-answer')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'La notebook' })).toBeVisible()

  await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click()
  const panel = page.getByLabel('Diagnóstico de desarrollo')
  await expect(panel).toContainText('dev.notebook-discount')
  await expect(panel).toContainText('year-1:2:dev.notebook-discount')

  // The generated parameters themselves must match, not just the identity.
  await expect(page.getByRole('radio').first()).toBeVisible()
  await expect(
    page.getByText('20 % de descuento', { exact: false }).first(),
  ).toBeVisible()
})

test('exposes the run identity needed to reproduce a bug', async ({ page }) => {
  await page.goto(HARNESS)
  await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click()

  const panel = page.getByLabel('Diagnóstico de desarrollo')
  await expect(panel).toContainText('e2e-alpha')
  await expect(panel).toContainText('0.2.0-dev')
  await expect(panel).toContainText('grade-7')
})

test('is operable with the keyboard alone', async ({ page }) => {
  await page.goto(HARNESS)

  // Focus the continue action of the opening beat and activate it by keyboard.
  const advance = page.getByTestId('continue')
  await advance.focus()
  await expect(advance).toBeFocused()
  await page.keyboard.press('Enter')

  await advanceToChallenge(page)
  await expect(page.getByTestId('submit-answer')).toBeVisible()

  const radios = page.getByRole('radio')
  if ((await radios.count()) > 0) {
    await radios.first().focus()
    await expect(radios.first()).toBeFocused()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('submit-answer')).toBeEnabled()
  }
})
