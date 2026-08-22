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

async function scan(page: Page, label: string): Promise<void> {
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

test('la tipografía del sistema está efectivamente cargada', async ({
  page,
}) => {
  await page.goto('/')

  const font = await page.evaluate(
    () => getComputedStyle(document.body).fontFamily,
  )
  expect(font).toContain('Geist')
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
  await page.getByRole('button', { name: 'Continuar' }).click()

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

  // Y además la selección no puede ser verde: el verde es la marca y el avance,
  // no «acertaste».
  const green = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim(),
  )
  expect(green.length).toBeGreaterThan(0)
  expect(first.cardBorder).not.toContain(green)
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
      shadow: style.boxShadow,
    }
  })

  expect(ring.style).toBe('solid')
  expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(2)
  // El halo blanco es lo que mantiene visible el anillo sobre un botón verde.
  expect(ring.shadow).not.toBe('none')
})
