import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type {
  PublicCompetitionState,
  PublicCompetitionStatus,
} from '@/lib/competition'

const now = new Date('2026-10-01T12:00:00Z')

async function expectTitleWithinColumn(page: Page) {
  const titleFits = await page
    .getByRole('heading', { level: 1 })
    .evaluate((node) => {
      const title = node.getBoundingClientRect()
      const column = node.closest('header')!.getBoundingClientRect()
      return title.left >= column.left && title.right <= column.right + 1
    })
  expect(titleFits).toBe(true)
}

function fixture(
  status: PublicCompetitionStatus = 'open',
): PublicCompetitionState {
  return {
    competition: {
      name: 'Feria de prueba',
      status,
      opensAt: '2026-10-02T12:00:00Z',
      closesAt: '2026-10-03T12:00:00Z',
    },
    leaderboard: [
      { rank: 1, nickname: 'PrimerPuesto', fairScore: 9800, isYou: false },
      { rank: 2, nickname: 'SegundoPuesto', fairScore: 9600, isYou: false },
      {
        rank: 3,
        nickname: 'AliasLargoDePruebaABC',
        fairScore: 9500,
        isYou: false,
      },
      { rank: 3, nickname: 'EmpateCompleto', fairScore: 9500, isYou: false },
    ],
    totalRanked: 17,
    you: {
      nickname: 'TuAlias',
      rank: 17,
      bestFairScore: 8100,
      bestPrestigeScore: 0,
      attempts: 2,
      activeAttempt: undefined,
    },
  }
}

/** Exercise the real / and its existing refresh, without changing any event in DB. */
async function showState(page: Page, state: PublicCompetitionState) {
  await expect
    .poll(async () => {
      const response = await page.request.get('/api/competition/state')
      return ((await response.json()) as PublicCompetitionState).competition
        .status
    })
    .toBe('open')
  await page.clock.install({ time: now })
  await page.route('**/api/competition/state', async (route) => {
    await route.fulfill({ json: state })
  })
  await page.goto('/')
  // The configured local competition is OPEN; its poll supplies this UI fixture.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.clock.runFor(20_000)
  await expect(
    page
      .getByText('Feria de prueba está abierta')
      .or(page.getByText('Feria de prueba todavía no empezó'))
      .or(page.getByText('Feria de prueba cerró')),
  ).toBeVisible()
  await page.clock.runFor(1000)
}

for (const width of [320, 360, 390, 412, 768, 1280, 1920]) {
  test(`home a ${width}px: CTA, reloj, empates, puesto propio y footer sin overflow`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 })
    await showState(page, fixture())
    await expectTitleWithinColumn(page)
    await expect(page.getByTestId('play')).toHaveText(/Jugar de nuevo/u)
    await expect(page.getByTestId('countdown-digits')).toBeVisible()
    await expect(page.getByTestId('leaderboard-entry')).toHaveCount(4)
    await expect(
      page.getByTestId('podium-rank-3').getByTestId('leaderboard-entry'),
    ).toHaveCount(2)
    await expect(page.getByTestId('own-rank')).toContainText('17')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    await expect(page.getByRole('contentinfo').getByRole('img')).toHaveCount(3)
    for (const img of await page
      .getByRole('contentinfo')
      .getByRole('img')
      .all()) {
      await expect(img).toBeVisible()
      await expect
        .poll(() =>
          img.evaluate((node) => (node as HTMLImageElement).naturalWidth > 0),
        )
        .toBe(true)
    }
    await expect(
      page.getByRole('link', { name: 'Política de Privacidad', exact: true }),
    ).toHaveAttribute('href', '/privacidad')
    await expect(page.locator('#privacy')).toHaveCount(0)
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(accessibility.violations).toEqual([])
    if (width === 320 || width === 1280)
      await page.screenshot({
        path: info.outputPath(`home-${width}.png`),
        fullPage: true,
      })
  })
}

test('UPCOMING no ofrece jugar; CLOSED publica resultados sin contador ni CTA', async ({
  page,
}) => {
  await showState(page, fixture('upcoming'))
  await expect(page.getByText('Empieza en')).toBeVisible()
  await expect(page.getByTestId('play')).toHaveCount(0)
  await page.route('**/api/competition/state', async (route) => {
    await route.fulfill({ json: fixture('closed') })
  })
  await page.clock.runFor(20_000)
  await expect(
    page.getByRole('heading', { name: 'Resultados del evento' }),
  ).toBeVisible()
  await expect(page.getByTestId('event-countdown')).toHaveCount(0)
  await expect(page.getByTestId('play')).toHaveCount(0)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('teclado, foco visible, contador ocultable y movimiento reducido', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const state = { ...fixture(), you: undefined }
  await showState(page, state)
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('play')).toBeFocused()
  const focus = await page
    .getByTestId('play')
    .evaluate((node) => getComputedStyle(node).outlineWidth)
  expect(parseFloat(focus)).toBeGreaterThanOrEqual(2)
  const motion = await page
    .getByTestId('countdown-digits')
    .locator('span')
    .first()
    .evaluate((node) => getComputedStyle(node).animationName)
  expect(motion).toBe('none')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Probar sin competir' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Ocultar contador' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('countdown-digits')).toHaveCount(0)
  await expect(page.getByText(/hora argentina/u)).toBeVisible()
  await page.getByTestId('play').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Alias')).toBeVisible()
  await expect(page.locator('[data-primary]')).toHaveCount(1)
})

test('200 % de zoom, texto largo y podio completo', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await showState(page, fixture())
  // CSS zoom exercises actual layout scaling; a 640px viewport also checks reflow.
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2'
  })
  await expectTitleWithinColumn(page)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await expect(page.getByTestId('play')).toBeVisible()
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
  await expect(page.getByRole('link', { name: /developed by/u })).toBeVisible()
  await page.screenshot({
    path: info.outputPath('home-zoom-200.png'),
    fullPage: true,
  })
  await page.evaluate(() => {
    document.documentElement.style.zoom = ''
  })
  await page.setViewportSize({ width: 640, height: 450 })
  await expectTitleWithinColumn(page)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('podio vacío anticipa partidas, sin ganadores de relleno', async ({
  page,
}) => {
  await showState(page, {
    ...fixture(),
    leaderboard: [],
    totalRanked: 0,
    you: undefined,
  })
  await expect(page.getByTestId('ranking-empty')).toContainText(
    'Todavía no hay puestos',
  )
  await expect(page.getByTestId('leaderboard-entry')).toHaveCount(0)
  await expect(page.getByTestId('play')).toHaveText(/Jugar ahora/u)
})
