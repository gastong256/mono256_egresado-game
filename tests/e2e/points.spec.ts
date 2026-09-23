import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('el footer enlaza la explicación de puntos debajo de privacidad', async ({
  page,
}) => {
  for (const path of ['/', '/privacidad']) {
    await page.goto(path)
    if (path === '/') await expect(page).toHaveTitle('Egresado')
    const footer = page.getByRole('contentinfo')
    const privacy = footer.getByRole('link', {
      name: 'Política de privacidad y uso de datos',
    })
    const points = footer.getByRole('link', {
      name: 'Cómo se calculan los puntos',
    })
    await expect(points).toHaveAttribute('href', '/puntajes')
    const privacyBox = (await privacy.boundingBox())!
    const pointsBox = (await points.boundingBox())!
    expect(pointsBox.y).toBeGreaterThanOrEqual(privacyBox.y + privacyBox.height)
    await points.click()
    await expect(page).toHaveURL(/\/puntajes$/u)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Cómo se calculan los puntos',
    )
  }
})

test('la explicación es pública, accesible y legible con zoom y sin JavaScript', async ({
  page,
  context,
  browser,
  baseURL,
}) => {
  const response = await page.goto('/puntajes')
  expect(response?.status()).toBe(200)
  expect(response?.headers()['content-security-policy']).toContain('nonce-')
  await expect(page).toHaveTitle('Cómo se calculan los puntos | Egresado')
  await expect(page.getByRole('textbox')).toHaveCount(0)
  expect(await context.cookies()).toEqual([])
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Volver al inicio' }),
  ).toBeFocused()
  const documentation = page.getByRole('link', {
    name: /Leer la explicación técnica en GitHub/u,
  })
  await expect(documentation).toHaveAttribute(
    'href',
    'https://github.com/gastong256/mono256_egresado-game/blob/main/docs/06-delivery/production-v1-release-candidate.md#f-oficialización-de-fairscore',
  )
  await expect(documentation).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(documentation).toHaveAttribute('target', '_blank')
  for (const [width, zoom] of [
    [320, 1],
    [768, 1],
    [1280, 1],
    [1280, 2],
  ]) {
    await page.setViewportSize({ width: width!, height: 900 })
    await page.evaluate((value) => {
      document.documentElement.style.zoom = String(value)
    }, zoom)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false })
  try {
    const plain = await noScript.newPage()
    expect((await plain.goto(`${baseURL}/puntajes`))?.status()).toBe(200)
    await expect(
      plain.getByRole('heading', { name: 'Qué pasa si hay empate' }),
    ).toBeVisible()
    await expect(plain.getByText(/1.º, 1.º, 3.º/u)).toBeVisible()
    await expect(
      plain.getByText(
        /el Departamento de Matemática del establecimiento organizador define/u,
      ),
    ).toBeVisible()
    await plain.getByRole('link', { name: 'Volver al inicio' }).click()
    await expect(plain).toHaveURL(`${baseURL}/`)
  } finally {
    await noScript.close()
  }
})
