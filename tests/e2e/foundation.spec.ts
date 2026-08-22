import { expect, test } from '@playwright/test'

test('renders the landing page without browser errors', async ({ page }) => {
  const browserErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    browserErrors.push(error.message)
  })

  const response = await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Egresado' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Jugar' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  expect(response?.headers()['x-content-type-options']).toBe('nosniff')
  expect(response?.headers()['referrer-policy']).toBe(
    'strict-origin-when-cross-origin',
  )
  expect(response?.headers()['permissions-policy']).toBe(
    'camera=(), geolocation=(), microphone=()',
  )
  expect(response?.headers()['content-security-policy']).toBe(
    "frame-ancestors 'none'",
  )
  expect(response?.headers()['x-frame-options']).toBe('DENY')
  expect(browserErrors).toEqual([])
})

test('exposes a minimal health response', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.ok()).toBe(true)
  expect(response.headers()['cache-control']).toBe('no-store')
  await expect(response.json()).resolves.toEqual({
    status: 'ok',
    service: 'egresado-web',
  })
})
