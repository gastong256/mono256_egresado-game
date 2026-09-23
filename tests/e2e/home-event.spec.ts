import { publicRunSummary } from '../helpers/ranking-summary'
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
      const column = node.parentElement!.getBoundingClientRect()
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
      opensAt:
        status === 'upcoming' ? '2026-10-02T12:00:00Z' : '2026-09-30T12:00:00Z',
      closesAt: '2026-10-03T12:00:00Z',
    },
    leaderboard: [
      {
        rank: 1,
        nickname: 'PrimerPuesto',
        fairScore: 9800,
        isYou: false,
        summary: publicRunSummary,
      },
      { rank: 2, nickname: 'SegundoPuesto', fairScore: 9600, isYou: false },
      {
        rank: 3,
        nickname: 'AliasLargoDePruebaABC',
        sharedCount: 1,
        fairScore: 9500,
        isYou: false,
      },
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
      .getByText('Ya podés jugar')
      .or(page.getByText('Preparate para jugar'))
      .or(page.getByText('Así terminó la competencia')),
  ).toBeVisible()
  await page.clock.runFor(1000)
}

for (const width of [320, 360, 390, 412, 768, 1024, 1280, 1920]) {
  test(`home a ${width}px: CTA, reloj, empates, puesto propio y footer sin overflow`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 })
    await showState(page, fixture())
    await expectTitleWithinColumn(page)
    await expect(page.getByTestId('play')).toHaveText(/Jugar de nuevo/u)
    await expect(page.getByTestId('countdown-digits')).toBeVisible()
    // La ilustración conserva su ancho; el acceso prioriza jugar antes del reloj.
    const hero = await page.getByTestId('home-hero').boundingBox()
    const main = await page.getByRole('main').boundingBox()
    expect(hero!.width / main!.width).toBeGreaterThan(0.78)
    const countdown = await page.getByTestId('event-countdown').boundingBox()
    const play = await page.getByTestId('play').boundingBox()
    if (width < 1024) {
      expect(play!.y + play!.height).toBeLessThanOrEqual(countdown!.y)
    } else {
      expect(play!.x + play!.width).toBeLessThanOrEqual(countdown!.x)
    }
    // Layout height excludes the brief entrance transform.
    expect(
      await page
        .getByTestId('play')
        .evaluate((node) => (node as HTMLButtonElement).offsetHeight),
    ).toBeGreaterThanOrEqual(width < 640 ? 72 : 80)
    await expect(page.getByText('Tiempo que queda para jugar')).toBeVisible()
    const practice = await page
      .getByRole('link', { name: 'Practicar' })
      .boundingBox()
    expect(countdown!.y + countdown!.height).toBeLessThanOrEqual(practice!.y)
    expect(
      await page
        .getByTestId('home-access')
        .evaluate((element) =>
          [...element.querySelectorAll<HTMLElement>('*')].every(
            (node) => node.scrollWidth <= node.clientWidth + 1,
          ),
        ),
    ).toBe(true)
    const introduction = await page
      .getByTestId('home-introduction')
      .boundingBox()
    const access = await page.getByTestId('home-access').boundingBox()
    expect(introduction!.y + introduction!.height).toBeLessThanOrEqual(
      access!.y,
    )
    await expect(page.getByTestId('ranking-deadline-notice')).toContainText(
      '¡Mejorá tu marca!',
    )
    const reminder = await page
      .getByTestId('ranking-deadline-notice')
      .boundingBox()
    const count = await page
      .getByText('17 participantes en el ranking')
      .boundingBox()
    expect(reminder!.y + reminder!.height).toBeLessThanOrEqual(count!.y)
    const practiceBorder = await page
      .getByRole('link', { name: 'Practicar' })
      .evaluate((node) => parseFloat(getComputedStyle(node).borderTopWidth))
    expect(practiceBorder).toBeGreaterThan(0)
    await expect(page.getByTestId('leaderboard-entry')).toHaveCount(3)
    await expect(page.getByText('Compartido con 1 más')).toBeVisible()
    await expect(page.getByTestId('own-rank')).toContainText('17')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    await expect(page.getByRole('contentinfo').getByRole('img')).toHaveCount(2)
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
      page.getByRole('link', {
        name: 'Política de privacidad y uso de datos',
        exact: true,
      }),
    ).toHaveAttribute('href', '/privacidad')
    const footer = page.getByRole('contentinfo')
    const footerBox = (await footer.boundingBox())!
    const marks = (await page.getByTestId('institutional-marks').boundingBox())!
    const privacy = (await footer
      .getByRole('link', { name: 'Política de privacidad y uso de datos' })
      .boundingBox())!
    const dev = (await footer
      .getByRole('link', { name: /developed by/u })
      .boundingBox())!
    const school = (await footer
      .getByRole('img', { name: 'Colegio Integral Piacentini' })
      .boundingBox())!
    const fair = (await footer
      .getByRole('img', { name: /36° Feria/u })
      .boundingBox())!
    expect(school.height).toBe(fair.height)
    expect(school.height).toBeGreaterThan(80)
    await expect(
      footer.getByRole('link', { name: /Repositorio en GitHub/u }),
    ).toHaveAttribute(
      'href',
      'https://github.com/gastong256/mono256_egresado-game',
    )
    expect(footerBox.height).toBeLessThanOrEqual(width < 768 ? 304 : 176)
    expect(
      Math.abs(marks.x + marks.width / 2 - (footerBox.x + footerBox.width / 2)),
    ).toBeLessThanOrEqual(1)
    if (width >= 768) {
      expect(privacy.x + privacy.width).toBeLessThanOrEqual(marks.x)
      expect(marks.x + marks.width).toBeLessThanOrEqual(dev.x)
    } else {
      expect(marks.y + marks.height).toBeLessThanOrEqual(privacy.y)
      const points = (await footer
        .getByRole('link', { name: 'Cómo se calculan los puntos' })
        .boundingBox())!
      expect(points.y).toBeGreaterThanOrEqual(privacy.y + privacy.height)
      expect(points.y + points.height).toBeLessThanOrEqual(dev.y)
      expect(dev.x + dev.width).toBeLessThanOrEqual(
        footerBox.x + footerBox.width,
      )
    }
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

test('en un teléfono la promesa es una línea y el ranking se pliega; en escritorio no', async ({
  page,
}) => {
  const twelve = Array.from({ length: 12 }, (_, index) => ({
    rank: index + 1,
    nickname: `Alias${String(index + 1)}`,
    fairScore: 10000 - index * 100,
    isYou: index === 9,
    summary: publicRunSummary,
  }))
  const state = {
    ...fixture(),
    leaderboard: twelve,
    totalRanked: 40,
    you: { ...fixture().you!, nickname: 'Alias10', rank: 10 },
  }
  await page.setViewportSize({ width: 360, height: 740 })
  await showState(page, state)
  await expect(page.getByTestId('home-promise-compact')).toBeVisible()
  await expect(
    page.getByText('Del primer día a la graduación', { exact: false }),
  ).toBeHidden()
  // Podio, dos puestos más y la vecindad propia (9, 10 y 11): ocho filas.
  await expect(
    page.locator('[data-testid="leaderboard-entry"]:visible'),
  ).toHaveCount(8)
  const expand = page.getByTestId('leaderboard-expand')
  await expect(expand).toHaveText('Ver 4 puestos más')
  await expand.click()
  await expect(
    page.locator('[data-testid="leaderboard-entry"]:visible'),
  ).toHaveCount(12)
  await expect(expand).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.getByTestId('home-promise-compact')).toBeHidden()
  await expect(
    page.getByText('Del primer día a la graduación', { exact: false }),
  ).toBeVisible()
  await expect(
    page.locator('[data-testid="leaderboard-entry"]:visible'),
  ).toHaveCount(12)
  await expect(page.getByTestId('leaderboard-expand')).toHaveCount(0)
})

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

test('el acceso sólo anuncia abierto dentro del horario, con CTA visible antes de scrollear', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 })
  const state = {
    ...fixture(),
    you: undefined,
    competition: { ...fixture().competition, opensAt: '2026-10-01T12:01:00Z' },
  }
  await showState(page, state)
  await expect(page.getByTestId('play')).toHaveCount(0)
  await expect(page.getByText(/^Empieza en/u)).toBeVisible()
  await page.clock.runFor(40_000)
  await expect(page.getByText('Ya podés jugar')).toBeVisible()
  const play = page.getByTestId('play')
  await expect(play).toHaveText(/Jugar ahora/u)
  const box = (await play.boundingBox())!
  expect(box.y + box.height).toBeLessThanOrEqual(740)
  await expect(page.getByTestId('countdown-digits')).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('teclado, foco visible, contador siempre visible y movimiento reducido', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const state = { ...fixture(), you: undefined }
  await showState(page, state)
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Ocultar contador' }),
  ).toHaveCount(0)
  const motion = await page
    .getByTestId('countdown-digits')
    .locator('span')
    .first()
    .evaluate((node) => getComputedStyle(node).animationName)
  expect(motion).toBe('none')
  await expect(page.getByTestId('countdown-digits')).toBeVisible()
  await expect(page.getByText(/hora argentina/u)).toBeVisible()
  await expect(page.getByTestId('play')).toBeFocused()
  const focus = await page
    .getByTestId('play')
    .evaluate((node) => getComputedStyle(node).outlineWidth)
  expect(parseFloat(focus)).toBeGreaterThanOrEqual(2)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Practicar' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
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

test('el detalle de una partida se abre con teclado y conserva contraste', async ({
  page,
}) => {
  const state = fixture()
  await showState(page, {
    ...state,
    leaderboard: state.leaderboard.map((entry, index) =>
      index === 0
        ? {
            ...entry,
            summary: { ...publicRunSummary, eventsPlayed: 22, recoveries: 2 },
          }
        : entry,
    ),
  })
  const summary = page
    .locator('summary')
    .filter({ hasText: 'Ver partida' })
    .first()
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Aportes al puntaje')).toBeVisible()
  await expect(page.getByText('Todo Óptimo en 2.º.')).toBeVisible()
  await expect(
    page.getByText('9 desafíos resueltos · 7 resoluciones óptimas'),
  ).toBeVisible()
  await expect(page.getByText(/situaciones jugadas/u)).toHaveCount(0)
  await expect(page.getByText('2 repasos realizados')).toBeVisible()
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    const scan = await new AxeBuilder({ page })
      .include('[data-testid="leaderboard"]')
      .analyze()
    expect(scan.violations).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
})

test('el podio escala, las filas comunes conservan tamaño y el detalle sigue accesible', async ({
  page,
}) => {
  const state = fixture()
  await showState(page, {
    ...state,
    leaderboard: [1, 2, 3, 4, 5].map((rank) => ({
      rank,
      nickname: ['Meli', 'Gaston', 'Cami', 'Valen', 'Sofi'][rank - 1]!,
      fairScore: 9900 - rank * 100,
      isYou: rank === 5,
      summary: publicRunSummary,
    })),
    you: { ...state.you!, nickname: 'Sofi', rank: 5 },
  })
  const rows = page.getByTestId('leaderboard-entry')
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    const heights = await rows.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    )
    expect(heights[0]!).toBeGreaterThan(heights[1]!)
    expect(heights[1]!).toBeGreaterThan(heights[2]!)
    expect(heights[2]!).toBeGreaterThan(heights[3]!)
    expect(Math.abs(heights[3]! - heights[4]!)).toBeLessThanOrEqual(1)
    await expect(rows.nth(4)).toContainText('Tu mejor partida')
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-testid="leaderboard"]')
          .analyze()
      ).violations,
    ).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
  const disclosure = rows.nth(4).locator('summary')
  await disclosure.focus()
  await page.keyboard.press('Enter')
  await expect(rows.nth(4).getByText('Aportes al puntaje')).toBeVisible()
  await expect(rows.nth(4).getByText('Todo Óptimo en 2.º.')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(rows.nth(4).getByText('Aportes al puntaje')).not.toBeVisible()
})
