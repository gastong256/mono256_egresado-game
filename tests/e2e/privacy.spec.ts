import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('política pública completa, responsive, con nonce y sin recopilar datos', async ({
  page,
  context,
}) => {
  const response = await page.goto('/privacidad')
  expect(response?.status()).toBe(200)
  expect(response?.headers()['content-security-policy']).toContain('nonce-')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Política de Privacidad',
  )
  await expect(page.getByText('Versión del aviso: 1')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(6)
  await expect(page.getByText(/Responsable de los datos:/u)).toBeAttached()
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.locator('details')).toHaveCount(0)
  expect(await context.cookies()).toEqual([])
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2'
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Volver al inicio' }),
  ).toBeFocused()
})

test('Home centraliza el aviso en un solo enlace del footer', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText('Tus datos', { exact: true })).toHaveCount(0)
  await expect(page.locator('#privacy')).toHaveCount(0)
  const link = page.getByRole('link', {
    name: 'Política de privacidad y uso de datos',
    exact: true,
  })
  await expect(link).toHaveCount(1)
  await expect(
    page
      .getByRole('contentinfo')
      .getByRole('link', { name: 'Política de privacidad y uso de datos' }),
  ).toBeAttached()
  await link.click()
  await expect(page).toHaveURL(/\/privacidad$/u)
  await expect(page.getByText(/Versión del aviso:/u)).toBeVisible()
})

test('el texto legal completo se puede leer sin JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    const response = await page.goto(`${baseURL}/privacidad`)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(6)
    await expect(page.getByText(/Responsable de los datos:/u)).toBeAttached()
    await expect(
      page.getByRole('link', { name: 'Volver al inicio' }),
    ).toHaveAttribute('href', '/')
  } finally {
    await context.close()
  }
})

test('la API sigue rechazando reconocimiento ausente, falso o versión desactualizada', async ({
  request,
}) => {
  const body = {
    nickname: 'AvisoPrueba',
    fullName: 'Persona De Prueba',
    dni: '45123456',
    schoolYear: '3.º',
    privacyNoticeVersion: '1',
  }
  for (const data of [body, { ...body, privacyNoticeAcknowledged: false }]) {
    const response = await request.post('/api/competition/participants', {
      data,
    })
    expect(response.status()).toBe(400)
    expect((await response.json()).error.code).toBe('INVALID_REQUEST')
    expect(response.headers()['set-cookie']).toBeUndefined()
  }
  const stale = await request.post('/api/competition/participants', {
    data: {
      ...body,
      privacyNoticeAcknowledged: true,
      privacyNoticeVersion: 'old',
    },
  })
  expect(stale.ok()).toBe(false)
  expect((await stale.json()).error.code).toBe('PRIVACY_NOTICE_REQUIRED')
  expect(stale.headers()['set-cookie']).toBeUndefined()
})
