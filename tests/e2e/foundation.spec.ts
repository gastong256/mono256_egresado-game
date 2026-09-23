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
  // Este servidor no tiene competencia configurada, así que la portada lo dice
  // en lugar de ofrecer un botón que no llevaría a ninguna parte. La portada
  // con competencia abierta se prueba en `competition.spec.ts`.
  await expect(page.getByText(/Todavía no hay una competencia/u)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ranking' })).toBeVisible()
  // es-AR y no es: el juego escribe coma decimal, punto de miles y hora de
  // 24 h, y un lector de pantalla tiene que leerlos con esas reglas.
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-AR')
  expect(response?.headers()['x-content-type-options']).toBe('nosniff')
  expect(response?.headers()['referrer-policy']).toBe(
    'strict-origin-when-cross-origin',
  )
  const permissions = response?.headers()['permissions-policy'] ?? ''
  for (const feature of ['camera', 'geolocation', 'microphone', 'payment']) {
    expect(permissions).toContain(`${feature}=()`)
  }
  expect(response?.headers()['x-frame-options']).toBe('DENY')

  /*
   * La política de contenido del documento, con su nonce.
   *
   * Se comprueba por directiva y no como cadena exacta porque el nonce cambia
   * en cada pedido — que es precisamente lo que lo hace servir para algo. Lo
   * que importa es que `script-src` admita por nonce y no por `unsafe-inline`:
   * un CSP que abriera los scripts en línea estaría presente en la respuesta y
   * no protegería de nada, y ésa es exactamente la forma en que esto se rompe
   * sin que nadie lo note.
   */
  const csp = response?.headers()['content-security-policy'] ?? ''
  expect(csp).toContain("default-src 'self'")
  expect(csp).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9]+'/u)
  expect(csp).toContain("'strict-dynamic'")
  expect(csp).not.toContain("script-src 'self' 'unsafe-inline'")
  expect(csp).toContain("connect-src 'self'")
  expect(csp).toContain("frame-ancestors 'none'")
  expect(csp).toContain("object-src 'none'")

  // Y la prueba de que la política no rompe la página: sin esto, un CSP mal
  // escrito bloquearía la hidratación y el test anterior seguiría en verde
  // porque el HTML servido ya trae el encabezado correcto.
  expect(browserErrors).toEqual([])
})

test('declara favicon, íconos, imagen social y hero, y todos se sirven', async ({
  page,
  request,
}) => {
  await page.goto('/')
  const icons = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        rel: node.getAttribute('rel') ?? '',
        href: node.getAttribute('href') ?? '',
        type: node.getAttribute('type') ?? '',
      })),
    )
  // Los tres caminos: el `.ico` para el navegador que no lee SVG, el SVG
  // para el que sí, y el de Apple para la pantalla de inicio.
  expect(icons.some((icon) => icon.href.includes('favicon.ico'))).toBe(true)
  expect(icons.some((icon) => icon.type === 'image/svg+xml')).toBe(true)
  expect(icons.some((icon) => icon.rel === 'apple-touch-icon')).toBe(true)
  for (const icon of icons) {
    const response = await request.get(icon.href)
    expect(response.ok(), icon.href).toBe(true)
    expect(response.headers()['content-type'], icon.href).toMatch(/^image\//u)
  }

  // La imagen social: Open Graph la declara con URL absoluta desde
  // `metadataBase`, X/Twitter la hereda con la tarjeta grande, y el archivo
  // se sirve como imagen.
  const social = await page
    .locator(
      'meta[property="og:image"], meta[name="twitter:card"], meta[name="twitter:image"], meta[property="og:image:alt"], meta[property="og:site_name"]',
    )
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((node) => [
          node.getAttribute('property') ?? node.getAttribute('name') ?? '',
          node.getAttribute('content') ?? '',
        ]),
      ),
    )
  expect(social['og:image']).toMatch(/^https?:\/\/.+opengraph-image/u)
  expect(social['og:image:alt']).toContain('Egresado')
  expect(social['og:site_name']).toBe('Egresado')
  expect(social['twitter:card']).toBe('summary_large_image')
  expect(social['twitter:image']).toMatch(/opengraph-image/u)
  const ogImage = await request.get(new URL(social['og:image'] ?? '').pathname)
  expect(ogImage.ok()).toBe(true)
  expect(ogImage.headers()['content-type']).toBe('image/jpeg')

  // El hero de la portada: dos WebP en `srcset`, el que corresponda cargado.
  const hero = page.getByTestId('home-hero').locator('img')
  await expect(hero).toBeVisible()
  await expect
    .poll(() =>
      hero.evaluate((node) => (node as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0)
  expect(await hero.getAttribute('alt')).toBe('')
  expect(
    await hero.evaluate((node) => (node as HTMLImageElement).currentSrc),
  ).toMatch(/egresado-hero-(?:800|1200)\.webp$/u)

  const manifest = await request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  const body = (await manifest.json()) as {
    icons: readonly { src: string; sizes: string }[]
  }
  expect(body.icons.map((icon) => icon.sizes)).toContain('512x512')
  for (const src of new Set(body.icons.map((icon) => icon.src))) {
    expect((await request.get(src)).ok(), src).toBe(true)
  }
})

test('stamps the content-security-policy nonce on every script it serves', async ({
  page,
}) => {
  await page.goto('/')
  const scripts = await page.locator('script').evaluateAll((nodes) =>
    nodes.map((node) => ({
      nonce: node.getAttribute('nonce'),
      src: node.getAttribute('src'),
    })),
  )
  expect(scripts.length).toBeGreaterThan(0)
  // Un solo script sin nonce es una página que el navegador bloquea a medias.
  expect(scripts.filter((script) => script.nonce === null)).toEqual([])
})

test('exposes liveness with the release identity and nothing else', async ({
  request,
}) => {
  const response = await request.get('/api/health')

  expect(response.ok()).toBe(true)
  expect(response.headers()['cache-control']).toBe('no-store')

  const body = (await response.json()) as {
    status: string
    service: string
    release: Record<string, string>
    checks: { name: string }[]
  }
  expect(body.status).toBe('ok')
  expect(body.service).toBe('egresado-web')
  // La identidad del release es la respuesta a «¿qué está desplegado?», que es
  // la primera pregunta de cualquier incidente. Tiene que contestarse con curl.
  expect(body.release['releaseId']).toBe('egresado-fair-edition-v1')
  expect(body.release['releaseVersion']).toMatch(/^\d+\.\d+\.\d+/u)
  expect(body.release['releaseFingerprint']).toMatch(/^[0-9a-f]{64}$/u)
  // La vida es barata: no toca la base.
  expect(body.checks.map((check) => check.name)).toEqual(['release-manifest'])

  const serialized = JSON.stringify(body).toLowerCase()
  for (const secret of ['sb_secret', 'postgres://', 'scrypt:', 'password']) {
    expect(serialized).not.toContain(secret)
  }
})

test('readiness reports the database and the edition, and stays quiet about how', async ({
  request,
}) => {
  const response = await request.get('/api/health?ready=1')
  const body = (await response.json()) as {
    status: string
    checks: { name: string; state: string; detail?: string }[]
  }

  expect(body.checks.map((check) => check.name)).toEqual([
    'release-manifest',
    'competition-config',
    'database',
    'competition',
  ])
  // Este servidor no tiene competencia configurada, así que está listo y lo
  // dice sin enumerar variables de entorno ni cadenas de conexión.
  expect(response.status()).toBe(200)
  expect(body.status).not.toBe('error')
  expect(JSON.stringify(body)).not.toContain('SUPABASE')
})
