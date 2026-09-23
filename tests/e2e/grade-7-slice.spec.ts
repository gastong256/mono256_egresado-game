import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { answerChallenge, numericAnswerField } from './gameplay'

/**
 * El slice jugable de 7.º grado, en un browser real.
 *
 * Recorre lo mismo que recorrería un estudiante: entra, elige un nombre, juega
 * las seis situaciones y llega al resumen del año. Los selectores son los que
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
  await page.goto('/dev/grade-7')
  await page.getByLabel('¿Cómo te decimos?').fill(nickname)
  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()
  await expect(page.getByRole('button', { name: 'Empezar 7.º' })).toBeVisible()
}

/** Juega el año entero y devuelve cuántas situaciones se respondieron. */
async function playYear(
  page: Page,
  pick: 'primera' | 'ultima',
): Promise<number> {
  let answered = 0

  for (let step = 0; step < 20; step += 1) {
    if ((await page.getByTestId('milestone').count()) > 0) {
      break
    }

    const advance = page.getByTestId('continue')
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

  // El recorrido de 7.º es superficie de desarrollo desde STAGE-09: el producto
  // público es la competencia, y una segunda puerta que también dijera «jugar»
  // sería una forma de jugar distinta de la que se está puntuando.
  await page.goto('/dev/grade-7')

  // Nombre: lo único que se le pide antes de empezar.
  await expect(page.getByLabel('¿Cómo te decimos?')).toBeVisible()
  await page.getByLabel('¿Cómo te decimos?').fill('Sofi')
  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()

  // Apertura del año.
  await expect(
    page.getByRole('heading', { name: 'Arranca séptimo' }),
  ).toBeVisible()
  // El progreso se dice con palabras además de con celdas.
  await expect(page.getByText('Evento 1 de 8')).toBeVisible()
  // La tira de carrera arranca ausente: `null` no es 0.
  await expect(page.getByTestId('career-strip')).toHaveCount(0)
  await page.getByRole('button', { name: 'Empezar 7.º' }).click()

  /*
   * Primera situación: el colectivo.
   *
   * La familia tiene dos plantillas y el seed de la partida elige cuál sale, así
   * que el test no puede asumir la pregunta. Sí puede asumir lo que las dos
   * comparten: los datos a la vista, el primario deshabilitado con una razón
   * escrita, y un feedback con números. La rama es por interacción, no por
   * apariencia, y las dos terminan en el mismo lugar.
   */
  await expect(page.getByText('Viaje normal').first()).toBeVisible()
  await expect(page.getByText('Entrada')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar' })).toBeDisabled()

  const eligeSalida =
    (await page
      .getByRole('heading', { name: 'El colectivo de siempre' })
      .count()) > 0

  if (eligeSalida) {
    // El deshabilitado nunca es la única explicación.
    await expect(
      page.getByText('Elegí una opción para confirmar.'),
    ).toBeVisible()
    await page.getByRole('radio').first().check()
  } else {
    await expect(
      page.getByRole('heading', { name: 'La pregunta del grupo' }),
    ).toBeVisible()
    await expect(
      page.getByText('Escribí un número para confirmar.'),
    ).toBeVisible()
    await expect(page.getByText('Margen que pide el grupo')).toBeVisible()
    await numericAnswerField(page).fill('45')
  }

  await expect(page.getByRole('button', { name: 'Confirmar' })).toBeEnabled()
  await page.getByRole('button', { name: 'Confirmar' }).click()

  // El feedback explica la consecuencia con los números, no con un veredicto.
  const feedback = page
    .getByRole('alert')
    .filter({ hasText: /Óptimo|Resuelto|Parcial|Insuficiente/u })
  await expect(feedback.first()).toBeVisible()
  await expect(page.getByText('Viaje de hoy')).toBeVisible()
  await expect(page.getByTestId('ledger').getByText('Llegás')).toBeVisible()
  // Y al resolver hay exactamente un primario en pantalla.
  await expect(page.getByRole('button', { name: 'Confirmar' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Seguir' })).toHaveCount(1)

  const answered = await playYear(page, 'primera')
  // Cinco situaciones más la primera. Si alguna salió mal, el año agrega un
  // repaso antes de cerrar: contenido condicional, fuera del presupuesto.
  expect(answered).toBeGreaterThanOrEqual(5)
  expect(answered).toBeLessThanOrEqual(6)

  // Cierre del año.
  await expect(page.getByTestId('milestone')).toBeVisible()
  await expect(page.getByTestId('year-record')).toContainText('Promedio')
  await expect(page.getByTestId('archetype')).toContainText('Vas camino a')
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

  // Seis situaciones respondidas eligiendo siempre la última opción, más el
  // repaso que el año pide cuando alguna quedó sin resolver.
  expect(answered).toBeGreaterThanOrEqual(6)
  expect(answered).toBeLessThanOrEqual(7)
  await expect(page.getByTestId('milestone')).toBeVisible()
  // El año termina igual: un error nunca es game over.
  await expect(page.getByTestId('year-record')).toBeVisible()

  expect(problems).toEqual([])
})

test('un año que sale mal pide un repaso y cierra igual', async ({ page }) => {
  const problems = watchConsole(page)
  await startRun(page, 'Nico')

  const answered = await playYear(page, 'ultima')

  /*
   * Eligiendo siempre la última opción, casi todo sale mal y el año pide su
   * repaso. Casi: qué variante toca lo decide el sorteo, y en alguna la última
   * opción puede ser la buena. El rango es honesto sobre eso en vez de fingir
   * una certeza que el contenido no da.
   */
  expect(answered).toBeGreaterThanOrEqual(6)
  expect(answered).toBeLessThanOrEqual(7)

  // Y se anuncia con palabras de escuela, no con un cartel de fracaso.
  await expect(page.getByText(/perdiste|game over|fracasaste/iu)).toHaveCount(0)

  // El año cierra igual. No hay forma de quedar afuera.
  await expect(page.getByTestId('milestone')).toBeVisible()
  await expect(page.getByTestId('year-record')).toBeVisible()

  expect(problems).toEqual([])
})

/**
 * Avanza hasta la pantalla del acto del 25 de Mayo.
 *
 * Es el tercer evento del año: apertura, colectivo y acto. Llegar jugando —y no
 * por una ruta de demo— es justamente lo que estos tests tienen que probar.
 */
async function reachTheAct(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Empezar 7.º' }).click()
  // Primera situación: el colectivo.
  await answerChallenge(page, 'primera')
  await page.getByRole('button', { name: 'Seguir' }).click()

  await expect(page.getByRole('heading', { name: '25 de Mayo' })).toBeVisible()
}

/** Marca en cada paso los números que cumplen su regla, leyendo la consigna. */
async function danceTheAct(page: Page): Promise<void> {
  const rules: Record<string, (value: number) => boolean> = {
    'Números pares': (value) => value % 2 === 0,
    'Múltiplos de 3': (value) => value % 3 === 0,
    'Números primos': (value) => {
      if (value < 2) return false
      for (let d = 2; d * d <= value; d += 1) if (value % d === 0) return false
      return true
    },
  }

  const grids = page.getByTestId('number-grid')
  const gridCount = await grids.count()

  for (let index = 0; index < gridCount; index += 1) {
    const grid = grids.nth(index)
    const heading = (await grid.locator('[id$="-rule"]').innerText()).trim()
    const rule = Object.entries(rules).find(([label]) =>
      heading.includes(label),
    )?.[1]
    if (rule === undefined) throw new Error(`regla desconocida: ${heading}`)

    const cells = grid.locator('[data-value]')
    const count = await cells.count()
    for (let index2 = 0; index2 < count; index2 += 1) {
      const cell = cells.nth(index2)
      const value = Number(await cell.getAttribute('data-value'))
      if (rule(value)) {
        await cell.getByRole('checkbox').check()
      }
    }
  }
}

test('el acto del 25 de Mayo introduce Aura durante la partida', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await startRun(page, 'Mili')

  // Antes del acto Aura no existe. `null` no es 0: la celda no se dibuja.
  await expect(page.getByTestId('career-strip')).toHaveCount(0)
  await reachTheAct(page)
  await expect(page.getByText('Aura')).toHaveCount(0)

  // La consigna de cada paso está escrita: la regla nunca es sólo un color.
  await expect(page.getByText('Números pares')).toBeVisible()
  await expect(page.getByText('Múltiplos de 3')).toBeVisible()
  await expect(page.getByText('Números primos')).toBeVisible()

  // El deshabilitado explica qué falta, no se queda gris y mudo.
  await expect(page.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  await expect(page.getByText(/Falta marcar el paso/u)).toBeVisible()

  await danceTheAct(page)

  // Marcado no es correcto: antes de confirmar ninguna celda dice si acertó.
  const marked = page.locator('[data-selected="true"][data-resolution]')
  expect(await marked.count()).toBeGreaterThan(0)
  for (const cell of await marked.all()) {
    await expect(cell).toHaveAttribute('data-resolution', 'pending')
  }

  await page.getByRole('button', { name: 'Confirmar' }).click()

  // El resultado explica la coreografía con los números.
  await expect(
    page.getByRole('alert').filter({ hasText: 'Óptimo' }),
  ).toBeVisible()
  await expect(
    page.getByTestId('ledger').getByText('Coreografía'),
  ).toBeVisible()

  // Recién ahora las celdas dicen cómo quedaron.
  expect(await page.locator('[data-resolution="hit"]').count()).toBeGreaterThan(
    0,
  )

  // Y Aura aparece: el bloque negro con el signo explícito.
  const aura = page.getByTestId('aura-block')
  await expect(aura).toBeVisible()
  await expect(aura).toContainText('+')

  // La partida sigue, y a partir de acá la tira lleva la celda de Aura.
  await page.getByRole('button', { name: 'Seguir' }).click()
  await expect(page.getByTestId('career-strip')).toContainText('Aura')

  await playYear(page, 'primera')
  await expect(page.getByTestId('milestone')).toBeVisible()

  expect(problems).toEqual([])
})

test('un acto que se cae deja Aura negativa y la partida sigue', async ({
  page,
}) => {
  const problems = watchConsole(page)
  await startRun(page, 'Beni')
  await reachTheAct(page)

  // Se marca la grilla entera de cada paso: cobertura perfecta y precisión a la
  // mitad, que es exactamente la degeneración que el F1 tiene que castigar.
  const grids = page.getByTestId('number-grid')
  for (let index = 0; index < (await grids.count()); index += 1) {
    const boxes = grids.nth(index).getByRole('checkbox')
    for (const box of await boxes.all()) {
      await box.check()
    }
  }

  await page.getByRole('button', { name: 'Confirmar' }).click()

  await expect(
    page.getByRole('alert').filter({ hasText: 'Insuficiente' }),
  ).toBeVisible()
  // El signo menos tipográfico, no un color: se lee sin distinguir verde de rojo.
  await expect(page.getByTestId('aura-block')).toContainText('−')
  // Nunca hay game over: se sigue jugando y el año termina.
  await page.getByRole('button', { name: 'Seguir' }).click()
  await playYear(page, 'primera')
  await expect(page.getByTestId('milestone')).toBeVisible()

  expect(problems).toEqual([])
})

test('la grilla del acto se juega sólo con el teclado', async ({ page }) => {
  await startRun(page, 'Ciro')
  await reachTheAct(page)

  const grid = page.getByTestId('number-grid').first()
  const boxes = grid.getByRole('checkbox')

  // Tab entra a la grilla y Espacio marca, que es lo que un grupo de casillas
  // hace de forma nativa.
  await boxes.first().focus()
  await expect(boxes.first()).toBeFocused()
  await page.keyboard.press('Space')
  await expect(boxes.first()).toBeChecked()

  // Tab sigue el orden de la grilla.
  await page.keyboard.press('Tab')
  await expect(boxes.nth(1)).toBeFocused()
  await page.keyboard.press('Space')
  await expect(boxes.nth(1)).toBeChecked()

  // Los otros dos pasos también, para poder confirmar.
  const grids = page.getByTestId('number-grid')
  for (let index = 1; index < (await grids.count()); index += 1) {
    const box = grids.nth(index).getByRole('checkbox').first()
    await box.focus()
    await page.keyboard.press('Space')
    await expect(box).toBeChecked()
  }

  const submit = page.getByRole('button', { name: 'Confirmar' })
  await expect(submit).toBeEnabled()
  await submit.focus()
  await page.keyboard.press('Enter')

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /Óptimo|Resuelto|Parcial|Insuficiente/u }),
  ).toBeVisible()
})

/**
 * La grilla del acto en los anchos que el sistema tiene que sostener.
 *
 * Tres teléfonos reales, una tablet en vertical y un desktop. Lo que se mide no
 * es estética: es que la hoja nunca scrollee de costado y que la celda siga
 * teniendo el objetivo táctil que el sistema exige, porque una grilla de cuatro
 * columnas es lo primero que se rompe cuando la pantalla se angosta.
 */
test.describe('la grilla del acto entra en cualquier pantalla', () => {
  const VIEWPORTS = [
    { label: '320 · el piso', width: 320, height: 740 },
    { label: '360 · phone chico', width: 360, height: 740 },
    { label: '390 · iPhone', width: 390, height: 844 },
    { label: '430 · phone grande', width: 430, height: 932 },
    { label: 'tablet vertical', width: 768, height: 1024 },
    { label: 'desktop', width: 1280, height: 900 },
  ] as const

  for (const viewport of VIEWPORTS) {
    test(viewport.label, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await startRun(page, 'Vale')
      await reachTheAct(page)

      // La hoja nunca scrollea de costado.
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
        ),
      ).toBe(false)

      // Y la celda conserva el objetivo táctil de 56 px del sistema.
      const cell = page
        .getByTestId('number-grid')
        .first()
        .locator('[data-value]')
        .first()
      const box = await cell.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)

      await danceTheAct(page)
      await page.getByRole('button', { name: 'Confirmar' }).click()
      await expect(page.getByTestId('aura-block')).toBeVisible()

      // Corregida tampoco desborda: los glifos caen dentro de la celda.
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
        ),
      ).toBe(false)
    })
  }
})

test('reanudar sobre el resultado del acto no inventa lo que se marcó', async ({
  page,
}) => {
  await startRun(page, 'Juli')
  await reachTheAct(page)
  await danceTheAct(page)
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByTestId('aura-block')).toBeVisible()

  // El checkpoint se escribe con el resultado a la vista.
  await page.reload()
  await page.getByRole('button', { name: 'Seguir jugando' }).click()

  // Vuelve al resultado del acto, con Aura ya establecida en la tira.
  await expect(page.getByTestId('career-strip')).toContainText('Aura')

  // La grilla ya no puede saber qué marcó el jugador, así que no lo afirma:
  // ninguna celda queda corregida y no aparece la nota de los punteados.
  const corrected = page.locator(
    '[data-resolution="hit"], [data-resolution="missed"], [data-resolution="extra"], [data-resolution="clear"]',
  )
  expect(await corrected.count()).toBe(0)
  await expect(page.getByText(/Los punteados cumplían/u)).toHaveCount(0)

  // Y el ledger sigue explicando la cuenta, que es lo que no se pierde.
  await expect(
    page.getByTestId('ledger').getByText('Coreografía'),
  ).toBeVisible()
})

test('volver a jugar empieza una partida nueva', async ({ page }) => {
  await startRun(page, 'Nadia')
  await playYear(page, 'primera')

  await expect(page.getByTestId('milestone')).toBeVisible()
  await page.getByRole('button', { name: 'Jugar de nuevo' }).click()

  // Arranca de cero, no en el resumen anterior.
  await expect(
    page.getByRole('heading', { name: 'Arranca séptimo' }),
  ).toBeVisible()
  await expect(page.getByText('Evento 1 de 8')).toBeVisible()
})

test('recargar en medio del año ofrece seguir la partida', async ({ page }) => {
  await startRun(page, 'Ivo')

  // Se avanzan un par de eventos para que exista un checkpoint.
  await page.getByRole('button', { name: 'Empezar 7.º' }).click()
  await answerChallenge(page, 'primera')
  await page.getByRole('button', { name: 'Seguir' }).click()

  await page.reload()

  await expect(
    page.getByRole('heading', { name: 'Volvés a séptimo' }),
  ).toBeVisible()
  await expect(page.getByText('Ivo')).toBeVisible()

  await page.getByRole('button', { name: 'Seguir jugando' }).click()

  // Vuelve donde estaba, no al principio.
  await expect(page.getByText('Evento 1 de 8')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '7.º grado',
  )
})

test('descartar la partida guardada empieza de nuevo', async ({ page }) => {
  await startRun(page, 'Cami')
  await page.getByRole('button', { name: 'Empezar 7.º' }).click()
  await answerChallenge(page, 'primera')
  await page.getByRole('button', { name: 'Seguir' }).click()

  await page.reload()
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click()

  await expect(page.getByLabel('¿Cómo te decimos?')).toBeVisible()
})

test('un checkpoint corrupto no rompe el juego', async ({ page }) => {
  const problems = watchConsole(page)

  await page.goto('/dev/grade-7')
  await page.evaluate(() => {
    globalThis.localStorage.setItem('egresado.checkpoint.v1', '{no es json')
  })
  await page.reload()

  // Se descarta en silencio y se ofrece empezar limpio.
  await expect(page.getByLabel('¿Cómo te decimos?')).toBeVisible()
  expect(problems).toEqual([])
})

test('el nombre se valida antes de empezar', async ({ page }) => {
  await page.goto('/dev/grade-7')

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
  await page.goto('/dev/grade-7')

  const field = page.getByLabel('¿Cómo te decimos?')
  await field.focus()
  await page.keyboard.type('Ana')
  await page.keyboard.press('Enter')

  await expect(
    page.getByRole('heading', { name: 'Arranca séptimo' }),
  ).toBeVisible()

  const advance = page.getByRole('button', { name: 'Empezar 7.º' })
  await advance.focus()
  await expect(advance).toBeFocused()
  await page.keyboard.press('Enter')

  // Responder con el teclado habilita confirmar. Cuál de las dos plantillas
  // del colectivo salió lo decidió el seed, así que el test prueba la que
  // tenga delante: Espacio sobre la opción, o tipear el número.
  const radios = page.getByRole('radio')
  if ((await radios.count()) > 0) {
    await radios.first().focus()
    await page.keyboard.press('Space')
  } else {
    const field = numericAnswerField(page)
    await field.focus()
    await expect(field).toBeFocused()
    await page.keyboard.type('45')
  }

  const submit = page.getByRole('button', { name: 'Confirmar' })
  await expect(submit).toBeEnabled()
  await submit.focus()
  await page.keyboard.press('Enter')

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /Óptimo|Resuelto|Parcial|Insuficiente/u }),
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

  await page.getByRole('button', { name: 'Empezar 7.º' }).click()
  expect(await overflow()).toBe(false)

  await answerChallenge(page, 'primera')
  expect(await overflow()).toBe(false)

  await playYear(page, 'primera')
  await expect(page.getByTestId('milestone')).toBeVisible()
  expect(await overflow()).toBe(false)
})

test('las pantallas principales no tienen violaciones de accesibilidad', async ({
  page,
}) => {
  const scan = async (label: string): Promise<void> => {
    // axe mide el color efectivo, y la opacidad cuenta: escanear en medio de la
    // entrada de 200 ms reporta como falla de contraste algo que en reposo
    // cumple de sobra.
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      )
    })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    expect(
      results.violations.map((violation) => ({
        pantalla: label,
        regla: violation.id,
        impacto: violation.impact,
        nodos: violation.nodes.map((node) => node.html.slice(0, 160)),
      })),
    ).toEqual([])
  }

  await page.goto('/')
  await scan('inicio')

  await page.goto('/dev/grade-7')
  await scan('nombre')

  await page.getByLabel('¿Cómo te decimos?').fill('Sofi')
  await page.getByRole('button', { name: 'Empezar 7.º grado' }).click()
  await scan('apertura')

  await page.getByRole('button', { name: 'Empezar 7.º' }).click()
  await scan('situación')

  await answerChallenge(page, 'primera')
  await scan('feedback')

  // El acto del 25 de Mayo: la grilla sin corregir, y después corregida con el
  // bloque de Aura. Son las dos pantallas nuevas del año.
  await page.getByRole('button', { name: 'Seguir' }).click()
  await expect(page.getByRole('heading', { name: '25 de Mayo' })).toBeVisible()
  await scan('acto · grilla')

  await danceTheAct(page)
  await scan('acto · marcado')

  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByTestId('aura-block')).toBeVisible()
  await scan('acto · corregido')

  await playYear(page, 'primera')
  await expect(page.getByTestId('milestone')).toBeVisible()
  await scan('resumen')
})
