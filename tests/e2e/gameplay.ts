import { expect, type Page } from '@playwright/test'

/**
 * Cómo se juega una partida desde un browser, para los tests que necesitan
 * llegar a algún lado y no están probando el camino en sí.
 *
 * Vive aparte de los specs porque tres archivos necesitan lo mismo: avanzar el
 * año sin saber de antemano qué interacción va a aparecer. Desde que el slot
 * del colectivo tiene dos plantillas, el seed decide si la primera situación se
 * responde eligiendo o escribiendo, y un helper que asuma una de las dos
 * convierte cualquier test que lo use en una moneda al aire.
 */

/** El campo de una respuesta escrita, que ninguna otra interacción presenta. */
export function numericAnswerField(page: Page) {
  return page.getByLabel(/^Tu respuesta en/u)
}

/** Responde la situación en pantalla. `pick` elige entre las opciones. */
export async function answerChallenge(
  page: Page,
  pick: 'primera' | 'ultima',
): Promise<void> {
  const radios = page.getByRole('radio')
  const grids = page.getByTestId('number-grid')
  const gridCount = await grids.count()
  const numeric = numericAnswerField(page)

  if (gridCount > 0) {
    // La grilla del acto: se marca una celda por paso, que es lo mínimo que el
    // juego pide para poder confirmar. Cuál se marca es lo que separa una
    // partida buena de una mala; que el año siga es lo que estos tests miran.
    for (let index = 0; index < gridCount; index += 1) {
      const boxes = grids.nth(index).getByRole('checkbox')
      const count = await boxes.count()
      await (pick === 'primera' ? boxes.first() : boxes.nth(count - 1)).check()
    }
  } else if ((await radios.count()) > 0) {
    await (pick === 'primera' ? radios.first() : radios.last()).check()
  } else if ((await numeric.count()) > 0) {
    // Respuesta escrita: no hay nada que elegir y el número lo produce el
    // jugador. Ninguno de los dos valores es necesariamente el correcto, y no
    // importa: lo que se mira acá es que el año siga.
    await numeric.fill(pick === 'primera' ? '30' : '75')
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

/**
 * Avanza hasta una situación que se resuelva **eligiendo entre opciones**.
 *
 * Para los tests sobre cómo se ve una opción elegida. El año siempre tiene
 * varias —el mural y el cuaderno son tarjetas de decisión—, así que basta con
 * seguir jugando; cuál sea la primera depende del seed y no importa.
 *
 * `onStep` corre después de cada avance, para los tests que además tienen algo
 * que comprobar en cada pantalla del camino.
 */
export async function reachOptionChallenge(
  page: Page,
  onStep?: () => Promise<void>,
): Promise<void> {
  for (let step = 0; step < 12; step += 1) {
    if ((await page.getByRole('radio').count()) > 0) {
      return
    }

    const advance = page.getByTestId('continue')
    if ((await advance.count()) > 0) {
      await advance.first().click()
      await onStep?.()
      continue
    }

    if ((await page.getByRole('button', { name: 'Confirmar' }).count()) === 0) {
      break
    }

    await answerChallenge(page, 'primera')
    await onStep?.()
  }

  await expect(page.getByRole('radio').first()).toBeVisible()
}
