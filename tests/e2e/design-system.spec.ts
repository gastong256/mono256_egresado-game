import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * El sistema de diseño, en un browser real.
 *
 * La vitrina es la referencia viva del sistema: si algo se rompe ahí, se rompe
 * en todas las pantallas que lo usan. Estos tests cubren lo que no se puede ver
 * en jsdom —color computado, desbordes, contraste— y la regla de UX más
 * importante del juego: elegir no puede parecerse a acertar.
 */

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/**
 * Espera a que el movimiento termine antes de medir.
 *
 * axe calcula contraste sobre el color efectivo, y la opacidad cuenta: escanear
 * en medio de la entrada de 200 ms mide un fotograma a media transparencia y
 * reporta como falla de contraste algo que en reposo cumple de sobra.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .map((animation) => animation.finished.catch(() => undefined)),
    )
  })
}

async function scan(page: Page, label: string): Promise<void> {
  await settle(page)
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()

  expect(
    results.violations.map((violation) => ({
      pantalla: label,
      regla: violation.id,
      impacto: violation.impact,
      // El HTML del nodo va en la aserción a propósito: sin él, una falla de
      // contraste dice "1 nodo" y hay que reproducirla a mano para saber cuál.
      nodos: violation.nodes.map((node) => node.html.slice(0, 160)),
    })),
  ).toEqual([])
}

test('la vitrina del sistema de diseño no tiene violaciones de accesibilidad', async ({
  page,
}) => {
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(error.message))

  await page.goto('/dev/design-system')
  await expect(
    page.getByRole('heading', { name: /Design System/u }),
  ).toBeVisible()

  await scan(page, 'design-system')
  expect(problems).toEqual([])
})

test('la vitrina no desborda a 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 })
  await page.goto('/dev/design-system')
  await expect(
    page.getByRole('heading', { name: /Design System/u }),
  ).toBeVisible()

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  )
  expect(overflow).toBe(false)
})

test('la paleta por defecto de Tailwind no genera utilidades', async ({
  page,
}) => {
  await page.goto('/dev/design-system')

  // Si `--color-*: initial` dejara de estar, `bg-blue-500` volvería a existir y
  // el sistema de diseño pasaría a ser una sugerencia.
  const painted = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.className = 'bg-blue-500'
    document.body.append(probe)
    const background = getComputedStyle(probe).backgroundColor
    probe.remove()
    return background
  })

  expect(painted).toBe('rgba(0, 0, 0, 0)')
})

test('las dos familias del sistema están efectivamente cargadas', async ({
  page,
}) => {
  await page.goto('/')

  // Libre Franklin para la prosa, Schibsted Grotesk para títulos y datos. Si el
  // build sirviera sólo el fallback, todo seguiría «funcionando» y la identidad
  // de Egresado se habría evaporado sin que fallara ningún test.
  //
  // `next/font/local` publica cada familia con un nombre generado y con hash, así
  // que se busca la raíz del nombre y no la cadena completa: el hash cambia en
  // cada build y afirmarlo sería un test que falla por nada.
  const body = await page.evaluate(
    () => getComputedStyle(document.body).fontFamily,
  )
  expect(body.toLowerCase()).toContain('franklin')

  // Se mide sobre el wordmark y no sobre el `<h1>` que lo contiene: la familia
  // display la declara el componente, y el encabezado hereda la del cuerpo.
  const wordmark = await page
    .getByText('Egresado', { exact: true })
    .first()
    .evaluate((node) => getComputedStyle(node).fontFamily)
  expect(wordmark.toLowerCase()).toContain('grotesk')

  // Y las dos llegaron de verdad: sin esto, el fallback pasaría los dos checks
  // de arriba con la familia declarada pero sin descargar nada.
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts]
      .filter((face) => face.status === 'loaded')
      .map((face) => face.family.toLowerCase())
      .join(' ')
  })
  expect(loaded).toContain('grotesk')
  expect(loaded).toContain('franklin')
})

test('el radio es 0 y no hay ninguna sombra en el juego', async ({ page }) => {
  await page.goto('/jugar')

  // Las dos invariantes de v0.2 que no son cuestión de gusto. Un `rounded-lg`
  // que se cuele no rompe ningún test de comportamiento, pero convierte la hoja
  // impresa en una app cualquiera.
  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((node) => {
        const style = getComputedStyle(node)
        const radius = Number.parseFloat(style.borderTopLeftRadius)
        return (
          (Number.isFinite(radius) && radius > 0) ||
          (style.boxShadow !== 'none' && style.boxShadow !== '')
        )
      })
      .map((node) => node.tagName + '.' + String(node.className).slice(0, 60)),
  )
  expect(offenders).toEqual([])
})

test('elegir una opción no revela si estaba bien', async ({ page }) => {
  // Sin movimiento los colores quedan asentados en el momento de leerlos: con
  // la transición corriendo se mide un fotograma intermedio y la comparación se
  // vuelve una carrera. Además es exactamente lo que ve quien pidió menos
  // animación.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/jugar')
  await page.getByLabel('¿Cómo te decimos?').fill('Sofi')
  await page.getByRole('button', { name: /^Empezar/ }).click()
  await page.getByRole('button', { name: 'Seguir' }).click()

  // Y encima se apagan las transiciones: con 8 workers en paralelo, leer un
  // color mientras todavía interpola devuelve un fotograma intermedio y la
  // comparación se convierte en una carrera contra el compositor.
  await page.addStyleTag({
    content:
      '*,*::before,*::after{transition:none !important;animation:none !important}',
  })

  const radios = page.getByRole('radio')
  const count = await radios.count()
  expect(count).toBeGreaterThan(1)

  /** Colores del control y de su tarjeta cuando esa opción está elegida. */
  const styleOfSelected = async (index: number) => {
    await radios.nth(index).check()
    await expect(radios.nth(index)).toBeChecked()
    return radios.nth(index).evaluate((node) => {
      const control = getComputedStyle(node)
      const card = getComputedStyle(node.closest('label') as HTMLElement)
      return {
        controlBorder: control.borderColor,
        controlWidth: control.borderTopWidth,
        cardBorder: card.borderColor,
        cardBackground: card.backgroundColor,
      }
    })
  }

  const first = await styleOfSelected(0)
  const last = await styleOfSelected(count - 1)

  // Una de estas opciones resuelve el problema y la otra no. Si el color de la
  // selección dependiera de eso, el jugador sabría el resultado antes de
  // confirmar y la decisión dejaría de existir.
  expect(last).toEqual(first)

  // Y además la selección no puede ser verde ni roja: la casilla elegida es
  // blanca, y el color de resultado aparece recién después de Confirmar.
  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    return {
      green: root.getPropertyValue('--green').trim(),
      red: root.getPropertyValue('--red').trim(),
    }
  })
  expect(palette.green.length).toBeGreaterThan(0)
  expect(palette.red.length).toBeGreaterThan(0)
  for (const value of Object.values(first)) {
    expect(value).not.toContain(palette.green)
    expect(value).not.toContain(palette.red)
  }
})

test('nunca hay dos primarios montados a la vez', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/jugar')
  await page.getByLabel('¿Cómo te decimos?').fill('Sofi')
  await page.getByRole('button', { name: /^Empezar/ }).click()

  // Contar por color no serviría: el primario deshabilitado no es lima y sigue
  // siendo el primario de la pantalla.
  const primaries = async (): Promise<number> =>
    page.locator('button[data-primary="true"]').count()

  expect(await primaries()).toBe(1)

  await page.getByRole('button', { name: 'Seguir' }).click()
  // Decidiendo: el primario vive dentro del bloque oscuro.
  expect(await primaries()).toBe(1)

  await page.getByRole('radio').first().check()
  expect(await primaries()).toBe(1)

  await page.getByRole('button', { name: 'Confirmar' }).click()
  // Resuelto: el bloque lo soltó y reapareció al final del shell.
  expect(await primaries()).toBe(1)
})

test('el foco se ve sobre cualquier superficie', async ({ page }) => {
  await page.goto('/jugar')

  const field = page.getByLabel('¿Cómo te decimos?')
  await field.focus()

  const ring = await field.evaluate((node) => {
    const style = getComputedStyle(node)
    return {
      width: style.outlineWidth,
      style: style.outlineStyle,
      offset: style.outlineOffset,
      color: style.outlineColor,
    }
  })

  // Una sola regla de foco en todo el producto: 2 px de tinta, separada 2 px.
  // Negra y no verde, así nunca se confunde con un color de estado.
  expect(ring.style).toBe('solid')
  expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(2)
  expect(Number.parseFloat(ring.offset)).toBeGreaterThanOrEqual(2)

  const ink = await page.evaluate(() => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--focus-ring')
      .trim()
    const probe = document.createElement('span')
    probe.style.color = value
    document.body.append(probe)
    const resolved = getComputedStyle(probe).color
    probe.remove()
    return resolved
  })
  expect(ring.color).toBe(ink)
})
