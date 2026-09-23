import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { serializeSnapshot, type RunDescriptor } from '@/game'
import { playCareer } from '../helpers/play-career'

const key = 'egresado.practice.v1.active'
async function start(page: Page): Promise<RunDescriptor> {
  const issued = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/practice/runs') &&
      response.request().method() === 'POST',
  )
  await page.getByTestId('practice-start').click()
  const response = await issued
  expect(response.status()).toBe(200)
  const { descriptor } = (await response.json()) as {
    descriptor: RunDescriptor
  }
  await expect
    .poll(() =>
      page.evaluate((storageKey) => {
        const saved = localStorage.getItem(storageKey)
        return saved === null
          ? undefined
          : (JSON.parse(saved) as { log: { descriptor: { runId: string } } })
              .log.descriptor.runId
      }, key),
    )
    .toBe(descriptor.runId)
  return descriptor
}

async function checkpoint(
  page: Page,
  descriptor: RunDescriptor,
  answers?: number,
) {
  const played = playCareer(descriptor, 'invalid', answers)
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key,
    value: JSON.stringify({
      version: 1,
      snapshot: serializeSnapshot(played.state),
      log: played.log,
    }),
  })
  return played
}

async function state(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/competition/state', {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`state ${response.status}`)
    return response.json() as Promise<unknown>
  })
}

for (const width of [320, 360, 390, 412, 768, 1280]) {
  test(`práctica pública a ${width}px, sin PII ni overflow y con teclado`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 })
    const response = await page.goto('/test')
    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-security-policy']).toContain('nonce-')
    await expect(page.getByTestId('practice-start')).toBeEnabled()
    await expect(page.getByText('Modo práctica', { exact: true })).toBeVisible()
    await expect(page.getByRole('textbox')).toHaveCount(0)
    await expect(page.getByRole('combobox')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Practicá a tu ritmo.' }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('link', { name: 'Volver al inicio' }),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('practice-start')).toBeFocused()
    expect(
      await page
        .getByTestId('practice-start')
        .evaluate((node) => parseFloat(getComputedStyle(node).outlineWidth)),
    ).toBeGreaterThanOrEqual(2)
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([])
    if (width === 320 || width === 1280)
      await page.screenshot({
        path: info.outputPath(`practice-intro-${width}.png`),
        fullPage: true,
      })
  })
}

test('zoom 200 % y reduced motion en la entrada y juego real', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/test')
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2'
  })
  await expect(page.getByTestId('practice-start')).toBeEnabled()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: info.outputPath('practice-zoom-200.png'),
    fullPage: true,
  })
  await page.evaluate(() => {
    document.documentElement.style.zoom = ''
  })
  await page.setViewportSize({ width: 360, height: 800 })
  await start(page)
  await expect(page.getByText('Modo práctica', { exact: true })).toBeVisible()
  const button = page.getByTestId('continue')
  if (await button.isVisible()) await button.click()
  await expect(page.locator('[data-primary]')).toHaveCount(1)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: info.outputPath('practice-game-360.png'),
    fullPage: true,
  })
})

test('carrera completa, tres desafíos, reload, retry de red y otra seed sin nuevas sesiones', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90_000)
  let emissions = 0
  const competitivePosts: string[] = []
  page.on('request', (request) => {
    if (request.method() !== 'POST') return
    if (request.url().endsWith('/api/practice/runs')) emissions++
    if (request.url().includes('/api/competition/'))
      competitivePosts.push(request.url())
  })
  await page.goto('/test?seed=official&template=dev')
  const beforeCookies = await context.cookies()
  const descriptor = await start(page)
  expect(descriptor.seed).toMatch(/^practice-v1-/u)
  expect(descriptor.seed).not.toBe('official')
  const partial = await checkpoint(page, descriptor, 3)
  await page.reload()
  await page.getByTestId('practice-resume').click()
  await expect(page.getByText('Modo práctica', { exact: true })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        (storageKey) =>
          JSON.parse(localStorage.getItem(storageKey) ?? '{}').log?.actions
            .length as unknown,
        key,
      ),
    )
    .toBe((partial.log as { actions: unknown[] }).actions.length)
  expect(emissions).toBe(1)
  await checkpoint(page, descriptor)
  await page.route('**/api/practice/runs/verify', (route) =>
    route.abort('internetdisconnected'),
  )
  await page.reload()
  await page.getByTestId('practice-resume').click()
  await expect(page.getByTestId('graduated')).toHaveText('Egresaste')
  await expect(
    page.getByRole('button', { name: 'Reintentar cálculo' }),
  ).toBeVisible()
  await page.unroute('**/api/practice/runs/verify')
  await page.getByRole('button', { name: 'Reintentar cálculo' }).click()
  await expect(page.getByTestId('practice-score')).toHaveText(/[0-9]/u)
  await expect(
    page.getByText('Este puntaje es de práctica y no modifica el ranking.'),
  ).toBeVisible()
  await expect(page.getByTestId('leaderboard')).toHaveCount(0)
  // Todo Insuficiente: egresa igual, la franja lo dice sin humillar y pide
  // revancha; y en práctica no hay puesto, podio ni récord.
  await expect(page.getByTestId('performance-headline')).toHaveAttribute(
    'data-band',
    /struggling|weak/u,
  )
  await expect(page.getByTestId('performance-closing')).toBeVisible()
  await expect(page.getByTestId('placement')).toHaveCount(0)
  for (const forbidden of [/podio/iu, /récord/iu, /puesto/iu, /fracas/iu])
    await expect(page.locator('main')).not.toContainText(forbidden)
  await expect(page.getByTestId('recap-year')).toHaveCount(6)
  await expect(page.getByTestId('play-style')).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({
    path: info.outputPath('practice-result.png'),
    fullPage: true,
  })
  const nextResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/practice/runs'),
  )
  await page.getByTestId('play-again').click()
  const next = (await (await nextResponse).json()) as {
    descriptor: RunDescriptor
  }
  expect(next.descriptor.seed).not.toBe(descriptor.seed)
  expect(next.descriptor.runId).not.toBe(descriptor.runId)
  expect(emissions).toBe(2)
  expect(competitivePosts).toEqual([])
  expect(await context.cookies()).toEqual(beforeCookies)
})

test('una práctica conserva exactamente el ranking, mejor intento, cookie y checkpoint oficiales', async ({
  page,
  context,
}) => {
  test.setTimeout(90_000)
  // This project's dependency order ensures no other suite writes the public ranking.
  await expect
    .poll(async () => {
      const response = await page.request.get('/api/competition/state')
      const body = (await response.json()) as {
        competition: { status: string }
      }
      return body.competition.status
    })
    .toBe('open')
  await page.goto('/')
  await page.getByTestId('play').click()
  await page.getByLabel('Alias').fill(`Practica${String(Date.now()).slice(-8)}`)
  await page.getByLabel('Nombre y apellido').fill('Persona De Prueba')
  await page
    .getByLabel('DNI')
    .fill(String(40_000_000 + (Date.now() % 9_000_000)))
  await page.getByLabel('Año o curso').selectOption('3.º')
  const issued = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/competition/attempts') &&
      response.request().method() === 'POST',
  )
  await page.getByTestId('identity-submit').click()
  const official = (await (await issued).json()) as {
    attemptId: string
    descriptor: RunDescriptor
  }
  const career = playCareer(official.descriptor, 'optimal')
  const status = await page.evaluate(
    async ({ attemptId, log }) =>
      (
        await fetch(`/api/competition/attempts/${attemptId}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ actionLog: log }),
        })
      ).status,
    { attemptId: official.attemptId, log: career.log },
  )
  expect(status).toBe(200)
  const before = await state(page)
  expect(before).toMatchObject({ you: { bestFairScore: 10000, attempts: 1 } })
  const cookies = await context.cookies()
  const officialStorage = await page.evaluate(() =>
    Object.entries(localStorage).filter(([key]) =>
      key.startsWith('egresado.competition.'),
    ),
  )
  await page.goto('/test')
  const practice = await start(page)
  expect(practice.seed).not.toBe(official.descriptor.seed)
  await checkpoint(page, practice)
  await page.reload()
  await page.getByTestId('practice-resume').click()
  await expect(page.getByTestId('practice-score')).toHaveText(/[0-9]/u)
  expect(await state(page)).toEqual(before)
  expect(await context.cookies()).toEqual(cookies)
  expect(
    await page.evaluate(() =>
      Object.entries(localStorage).filter(([key]) =>
        key.startsWith('egresado.competition.'),
      ),
    ),
  ).toEqual(officialStorage)
})

test('home enlaza práctica y las rutas de desarrollo siguen cerradas', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Practicar' }).click()
  await expect(page).toHaveURL(/\/test$/u)
  await expect(page.getByText('Modo práctica', { exact: true })).toBeVisible()
  for (const path of [
    '/dev/game-engine',
    '/dev/teacher-gate',
    '/dev/design-system',
    '/demo',
    '/debug',
  ]) {
    expect((await page.goto(path))?.status()).toBe(404)
  }
})
