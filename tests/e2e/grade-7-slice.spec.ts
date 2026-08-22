import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * El slice jugable de 7.º grado, en un browser real.
 *
 * Recorre lo mismo que recorrería un estudiante: entra, elige un nombre, juega
 * las cinco situaciones y llega al resumen del año. Los selectores son los que
 * usa una persona —roles, etiquetas, textos— y no clases de CSS.
 */

/** Falla el test si la consola escupe errores o excepciones. */
function watchConsole(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      problems.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    problems.push(`excepción: ${error.message}`)
  })
  return problems
}

async function startRun(page: Page, nickname: string): Promise<void> {
  await page.goto('/jugar')
  await page.getByLabel('¿Cómo te decimos?').fill(nickname)
  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible()
}

/** Responde la situación en pantalla. `pick` elige entre las opciones. */
async function answerChallenge(
  page: Page,
  pick: 'primera' | 'ultima',
): Promise<void> {
  const radios = page.getByRole('radio')
  if ((await radios.count()) > 0) {
    await (pick === 'primera' ? radios.first() : radios.last()).check()
  } else {
    const selects = page.getByRole('combobox')
    const selectCount = await selects.count()
    for (let index = 0; index < selectCount; index += 1) {
      const values = (
        await Promise.all(
          (await selects.nth(index).locator('option').all()).map((option) =>
            option.getAttribute('value'),
          ),
        )
      ).filter((value): value is string => value !== null && value !== '')
      const chosen =
        pick === 'primera' ? values[index] : values[values.length - 1 - index]
      if (chosen !== undefined) {
        await selects.nth(index).selectOption(chosen)
      }
    }

    const spinners = page.getByRole('spinbutton')
    const spinnerCount = await spinners.count()
    for (let index = 0; index < spinnerCount; index += 1) {
      await spinners.nth(index).fill(pick === 'primera' ? '2' : '1')
    }
  }

  const submit = page.getByRole('button', { name: 'Confirmar' })
  await expect(submit).toBeEnabled()
  await submit.click()
}

/** Juega el año entero y devuelve cuántas situaciones se respondieron. */
async function playYear(
  page: Page,
  pick: 'primera' | 'ultima',
): Promise<number> {
  let answered = 0

  for (let step = 0; step < 20; step += 1) {
    if (
      (await page.getByRole('heading', { name: 'Tu 7.º grado' }).count()) > 0
    ) {
      break
    }

    const advance = page.getByRole('button', { name: 'Continuar' })
    if ((await advance.count()) > 0) {
      await advance.first().click()
      continue
    }

    if ((await page.getByRole('button', { name: 'Confirmar' }).count()) === 0) {
      break
    }

    await answerChallenge(page, pick)
    answered += 1
  }

  return answered
}

test('un estudiante juega 7.º grado de principio a fin', async ({ page }) => {
  const problems = watchConsole(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Egresado' })).toBeVisible()
  await page.getByRole('link', { name: 'Jugar' }).click()

  // Nombre: lo único que se le pide antes de empezar.
  await expect(page.getByLabel('¿Cómo te decimos?')).toBeVisible()
  await page.getByLabel('¿Cómo te decimos?').fill('Sofi')
  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()

  // Apertura del año.
  await expect(
    page.getByRole('heading', { name: 'Arranca séptimo' }),
  ).toBeVisible()
  await expect(page.getByText('Evento 0 de 7')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Primera situación: el colectivo. Los datos tienen que estar a la vista.
  await expect(
    page.getByRole('heading', { name: 'El colectivo de siempre' }),
  ).toBeVisible()
  await expect(page.getByText('Viaje sin demora')).toBeVisible()
  await expect(page.getByText('Entrada')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar' })).toBeDisabled()

  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Confirmar' }).click()

  // El feedback explica la consecuencia con los números, no con un veredicto.
  const feedback = page
    .getByRole('alert')
    .filter({ hasText: /Óptimo|Eficiente|Resuelto|No alcanzó/u })
  await expect(feedback.first()).toBeVisible()
  await expect(page.getByText('Viaje de hoy')).toBeVisible()
  await expect(page.getByText('Llegás')).toBeVisible()

  const answered = await playYear(page, 'primera')
  expect(answered).toBe(4)

  // Cierre del año.
  await expect(
    page.getByRole('heading', { name: 'Tu 7.º grado' }),
  ).toBeVisible()
  await expect(page.getByText('Sofi')).toBeVisible()
  await expect(page.getByText('Situaciones resueltas')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Jugar de nuevo' }),
  ).toBeVisible()

  // No se le miente al jugador con un perfil de egreso que no existe todavía.
  await expect(page.getByText(/perfil final de egresado/iu)).toHaveCount(0)

  expect(problems).toEqual([])
})

test('decidir mal no corta la partida', async ({ page }) => {
  const problems = watchConsole(page)
  await startRun(page, 'Tomi')

  const answered = await playYear(page, 'ultima')

  // Cinco situaciones respondidas eligiendo siempre la última opción.
  expect(answered).toBe(5)
  await expect(
    page.getByRole('heading', { name: 'Tu 7.º grado' }),
  ).toBeVisible()
  // El año termina igual: un error nunca es game over.
  await expect(page.getByText('Situaciones resueltas')).toBeVisible()

  expect(problems).toEqual([])
})

test('volver a jugar empieza una partida nueva', async ({ page }) => {
  await startRun(page, 'Nadia')
  await playYear(page, 'primera')

  await expect(
    page.getByRole('heading', { name: 'Tu 7.º grado' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Jugar de nuevo' }).click()

  // Arranca de cero, no en el resumen anterior.
  await expect(
    page.getByRole('heading', { name: 'Arranca séptimo' }),
  ).toBeVisible()
  await expect(page.getByText('Evento 0 de 7')).toBeVisible()
})

test('recargar en medio del año ofrece seguir la partida', async ({ page }) => {
  await startRun(page, 'Ivo')

  // Se avanzan un par de eventos para que exista un checkpoint.
  await page.getByRole('button', { name: 'Continuar' }).click()
  await answerChallenge(page, 'primera')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.reload()

  await expect(
    page.getByRole('heading', { name: 'Tenés una partida empezada' }),
  ).toBeVisible()
  await expect(page.getByText('Ivo')).toBeVisible()

  await page.getByRole('button', { name: 'Seguir jugando' }).click()

  // Vuelve donde estaba, no al principio.
  await expect(page.getByText('Evento 0 de 7')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '7.º grado',
  )
})

test('descartar la partida guardada empieza de nuevo', async ({ page }) => {
  await startRun(page, 'Cami')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await answerChallenge(page, 'primera')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.reload()
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click()

  await expect(page.getByLabel('¿Cómo te decimos?')).toBeVisible()
})

test('un checkpoint corrupto no rompe el juego', async ({ page }) => {
  const problems = watchConsole(page)

  await page.goto('/jugar')
  await page.evaluate(() => {
    globalThis.localStorage.setItem('egresado.checkpoint.v1', '{no es json')
  })
  await page.reload()

  // Se descarta en silencio y se ofrece empezar limpio.
  await expect(page.getByLabel('¿Cómo te decimos?')).toBeVisible()
  expect(problems).toEqual([])
})

test('el nombre se valida antes de empezar', async ({ page }) => {
  await page.goto('/jugar')

  // El error vive dentro del formulario; el otro role="alert" de la página es el
  // anunciador de rutas de Next, que no tiene nada que ver con el nombre.
  const fieldError = page.locator('form').getByRole('alert')

  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()
  await expect(fieldError).toContainText('Escribí un nombre')

  await page.getByLabel('¿Cómo te decimos?').fill('a')
  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()
  await expect(fieldError).toContainText('al menos 2')

  await page.getByLabel('¿Cómo te decimos?').fill('Sofi')
  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()
  await expect(
    page.getByRole('heading', { name: 'Arranca séptimo' }),
  ).toBeVisible()
})

test('se puede jugar sólo con el teclado', async ({ page }) => {
  await page.goto('/jugar')

  const field = page.getByLabel('¿Cómo te decimos?')
  await field.focus()
  await page.keyboard.type('Ana')
  await page.keyboard.press('Enter')

  await expect(
    page.getByRole('heading', { name: 'Arranca séptimo' }),
  ).toBeVisible()

  const advance = page.getByRole('button', { name: 'Continuar' })
  await advance.focus()
  await expect(advance).toBeFocused()
  await page.keyboard.press('Enter')

  // Elegir una opción con el teclado habilita confirmar.
  const first = page.getByRole('radio').first()
  await first.focus()
  await page.keyboard.press('Space')

  const submit = page.getByRole('button', { name: 'Confirmar' })
  await expect(submit).toBeEnabled()
  await submit.focus()
  await page.keyboard.press('Enter')

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /Óptimo|Eficiente|Resuelto|No alcanzó/u }),
  ).toBeVisible()
})

test('no hay desbordes horizontales en pantallas chicas', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await startRun(page, 'Lu')

  const overflow = async (): Promise<boolean> =>
    page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    )

  expect(await overflow()).toBe(false)

  await page.getByRole('button', { name: 'Continuar' }).click()
  expect(await overflow()).toBe(false)

  await answerChallenge(page, 'primera')
  expect(await overflow()).toBe(false)

  await playYear(page, 'primera')
  await expect(
    page.getByRole('heading', { name: 'Tu 7.º grado' }),
  ).toBeVisible()
  expect(await overflow()).toBe(false)
})

test('las pantallas principales no tienen violaciones de accesibilidad', async ({
  page,
}) => {
  const scan = async (label: string): Promise<void> => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    expect(
      results.violations.map((violation) => ({
        pantalla: label,
        regla: violation.id,
        impacto: violation.impact,
        nodos: violation.nodes.length,
      })),
    ).toEqual([])
  }

  await page.goto('/')
  await scan('inicio')

  await page.goto('/jugar')
  await scan('nombre')

  await page.getByLabel('¿Cómo te decimos?').fill('Sofi')
  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()
  await scan('apertura')

  await page.getByRole('button', { name: 'Continuar' }).click()
  await scan('situación')

  await answerChallenge(page, 'primera')
  await scan('feedback')

  await playYear(page, 'primera')
  await expect(
    page.getByRole('heading', { name: 'Tu 7.º grado' }),
  ).toBeVisible()
  await scan('resumen')
})
