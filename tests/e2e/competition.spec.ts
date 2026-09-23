import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import {
  serializeSnapshot,
  type RunDescriptor,
  type RunState,
} from '../../src/game'
import { playCareer } from '../helpers/play-career'

/**
 * La competencia, desde el producto público y nada más.
 *
 * Todo lo de este archivo entra por `/`. No hay `/dev`, no hay seed en la
 * query y no hay ruta de prueba: se completa el formulario real, el servidor
 * emite el intento real y el puntaje lo devuelve el servidor después de volver
 * a jugar el log.
 *
 * Los nueve beats de la carrera se resuelven con el motor real a partir del
 * descriptor **que el servidor emitió**, y el avance se deja donde el juego lo
 * deja: en el checkpoint del navegador. Después el producto lo reanuda solo y
 * envía. La alternativa —clic por clic sobre las 28 Templates— exigiría un
 * solucionador de interfaz para cada motor de interacción, que es una segunda
 * implementación de los witnesses de autoría y se rompe cada vez que una
 * pantalla cambia. Lo que se gana haciéndolo así es además una prueba de la
 * reanudación, que es requisito propio de esta etapa.
 *
 * Que el juego se **juegue** dentro de la cáscara de competencia se prueba
 * aparte, con clics de verdad, y las suites de STAGE-08 ya recorren este mismo
 * contenido beat por beat en el navegador.
 *
 * La suite se saltea sola cuando el despliegue no tiene competencia
 * configurada, y lo dice, en vez de pasar en verde sin haber probado nada.
 */

/** Un documento y un alias distintos en cada corrida: la base conserva filas. */
let unique = 0
function uniqueDni(): string {
  unique += 1
  return String(40_000_000 + ((Date.now() + unique * 7919) % 9_000_000))
}
function uniqueNickname(label: string): string {
  unique += 1
  return `${label}${String(Date.now()).slice(-6)}${String(unique)}`
}

interface PublicState {
  competition: { status: string; name: string }
  leaderboard: { rank: number; nickname: string; fairScore: number }[]
  totalRanked: number
  you: {
    nickname: string
    bestFairScore: number | null
    rank: number | null
    attempts: number
    activeAttempt: string | null
  } | null
}

/**
 * Lee el estado público **desde la página**, no desde el cliente de red.
 *
 * La cookie de sesión es `Secure`, y el servidor de pruebas corre sobre HTTP en
 * `127.0.0.1`: el navegador la acepta porque trata loopback como origen
 * confiable, pero el cliente de red de Playwright no aplica esa excepción y la
 * omitiría. Pedirlo con el `fetch` de la página usa el mismo frasco de cookies
 * que el producto, que además es lo que el producto hace.
 */
async function competitionState(page: Page): Promise<PublicState> {
  // Una ruta relativa necesita un documento del que colgar; si el test todavía
  // no navegó, se entra por la portada, que es por donde entra un jugador.
  if (!page.url().startsWith('http')) await page.goto('/')
  return page.evaluate(async () => {
    const response = await fetch('/api/competition/state', {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`estado ${String(response.status)}`)
    return (await response.json()) as unknown
  }) as Promise<PublicState>
}

async function requireOpenCompetition(page: Page): Promise<PublicState> {
  const state = await competitionState(page)
  test.skip(
    state.competition.status !== 'open',
    `La competencia no está abierta (${state.competition.status}). ` +
      'Configurá el despliegue y corré `pnpm competition:bootstrap` para ejercitar esta suite.',
  )
  return state
}

/** Completa el formulario de identificación y espera la emisión del intento. */
async function identify(
  page: Page,
  options: {
    nickname: string
    fullName: string
    dni: string
    year?: string
  },
): Promise<{ attemptId: string; descriptor: RunDescriptor }> {
  await page.getByTestId('play').click()
  await page.getByLabel('Alias').fill(options.nickname)
  await page.getByLabel('Nombre y apellido').fill(options.fullName)
  await page.getByLabel('DNI').fill(options.dni)
  await page.getByLabel('Año o curso').selectOption(options.year ?? '3.º')

  const registered = page.waitForResponse(
    (response) =>
      response.url().includes('/api/competition/participants') &&
      response.request().method() === 'POST',
  )
  const issued = page.waitForResponse(
    (response) =>
      response.url().includes('/api/competition/attempts') &&
      response.request().method() === 'POST',
  )
  await page.getByTestId('identity-submit').click()

  // Se mira primero el registro: si falló, el error dice el código HTTP en vez
  // de esperar en vano una emisión que nunca va a llegar. No se lee el cuerpo:
  // la página ya lo consumió, y pedirlo de nuevo se queda colgado.
  const identity = await registered
  expect(identity.status(), 'el registro no devolvió 200').toBe(200)

  return (await (await issued).json()) as {
    attemptId: string
    descriptor: RunDescriptor
  }
}

/** Pide al servidor una partida nueva desde la pantalla de ranking. */
async function playAgain(page: Page): Promise<{
  attemptId: string
  descriptor: RunDescriptor
}> {
  const issued = page.waitForResponse(
    (response) =>
      response.url().includes('/api/competition/attempts') &&
      response.request().method() === 'POST',
  )
  await page.getByTestId('play').click()
  return (await (await issued).json()) as {
    attemptId: string
    descriptor: RunDescriptor
  }
}

/** Deja el avance donde el juego lo deja: el checkpoint del navegador. */
async function writeCheckpoint(
  page: Page,
  attemptId: string,
  played: { state: RunState; log: unknown },
): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value)
    },
    {
      key: `egresado.competition.v1.${attemptId}`,
      value: JSON.stringify({
        snapshot: serializeSnapshot(played.state),
        log: played.log,
      }),
    },
  )
}

function parseScore(text: string): number {
  return Number(text.replaceAll('.', '').replaceAll(',', '').trim())
}

/** Reanuda la partida activa desde la portada y espera el resultado verificado. */
async function resumeAndVerify(page: Page): Promise<number> {
  await page.goto('/')
  await playAgain(page)
  // Con alias, el egreso lo nombra: «Egresaste, Sofi.»
  await expect(page.getByTestId('graduated')).toContainText('Egresaste', {
    timeout: 60_000,
  })
  await expect(page.getByTestId('verification-verified')).toBeVisible({
    timeout: 60_000,
  })
  return parseScore(await page.getByTestId('verified-fair-score').innerText())
}

test.describe('competencia', () => {
  test.describe.configure({ mode: 'serial' })

  test('la portada muestra la competencia y el ranking sin pedir nada', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const state = await competitionState(page)
    if (state.competition.status === 'open') {
      await expect(page.getByTestId('play')).toBeVisible()
    }
    // El ranking vive en la portada: no hace falta una segunda ruta pública.
    await expect(page.getByRole('heading', { name: 'Ranking' })).toBeVisible()
  })

  test('el camino completo: identificarse, jugar, verificar y aparecer en el ranking', async ({
    page,
  }) => {
    test.setTimeout(300_000)
    await requireOpenCompetition(page)

    const nickname = uniqueNickname('Sofi')
    const dni = uniqueDni()
    const fullName = 'Sofía Test Rodríguez'

    await page.goto('/')
    const issued = await identify(page, { nickname, fullName, dni })

    // El servidor emitió la seed de la edición, no una que el cliente eligió.
    expect(issued.descriptor.mode).toBe('fair')
    expect(issued.descriptor.difficulty).toBe('fixed')
    expect(issued.descriptor.planFingerprint).toBeTruthy()

    // La partida arranca de verdad dentro del producto.
    await expect(page.getByTestId('stage-label')).toBeVisible()

    await writeCheckpoint(
      page,
      issued.attemptId,
      playCareer(issued.descriptor, 'optimal'),
    )
    const verified = await resumeAndVerify(page)

    expect(verified).toBeGreaterThan(0)
    await expect(page.getByTestId('personal-best')).toContainText(
      'Es tu mejor partida',
    )
    // Una carrera óptima es la franja más alta, y el puesto que se muestra es
    // el que el servidor publicó, no uno deducido del puntaje.
    await expect(page.getByTestId('performance-headline')).toHaveAttribute(
      'data-band',
      'exceptional',
    )
    const placement = page.getByTestId('placement')
    await expect(placement).toBeVisible()
    const shown = Number(await placement.getAttribute('data-rank'))
    const published = await competitionState(page)
    expect(shown).toBe(published.you?.rank)
    if (shown <= 3)
      await expect(placement.getByTestId('placement-claim')).toBeVisible()
    else await expect(placement.getByTestId('placement-claim')).toHaveCount(0)
    await expect(page.getByTestId('recap-year')).toHaveCount(6)
    await expect(page.getByTestId('achievements')).toBeVisible()

    await page.getByRole('button', { name: 'Volver al ranking' }).click()
    await expect(page.getByTestId('greeting')).toContainText(nickname)

    const state = await competitionState(page)
    expect(state.you?.nickname).toBe(nickname)
    expect(state.you?.bestFairScore).toBe(verified)
    expect(state.you?.attempts).toBe(1)

    // El alias aparece en el ranking público.
    await expect(page.getByTestId('leaderboard')).toContainText(nickname)

    // Nada privado viajó al navegador. El año del estudiante se comprueba
    // aparte de la lista de años: la lista es configuración de la escuela, la
    // misma para todos, y no dice nada de nadie; lo que no puede aparecer es
    // el año **de esta persona**, y la forma de decirlo es que el ranking no
    // lleve ningún año junto a un alias.
    const html = await page.content()
    for (const secret of [fullName, 'Rodríguez', dni]) {
      expect(html).not.toContain(secret)
    }
    const board = await page.getByTestId('leaderboard').innerText()
    for (const year of ['7.º', '1.º', '2.º', '3.º', '4.º', '5.º']) {
      expect(board).not.toContain(year)
    }

    const raw = JSON.stringify(state)
    expect(raw).not.toContain(fullName)
    expect(raw).not.toContain(dni)
  })

  test('un segundo intento no reemplaza al mejor', async ({ page }) => {
    test.setTimeout(300_000)
    await requireOpenCompetition(page)

    const nickname = uniqueNickname('Tomi')
    await page.goto('/')
    const first = await identify(page, {
      nickname,
      fullName: 'Tomás Test Álvarez',
      dni: uniqueDni(),
    })
    await writeCheckpoint(
      page,
      first.attemptId,
      playCareer(first.descriptor, 'optimal'),
    )
    const best = await resumeAndVerify(page)

    await page.getByRole('button', { name: 'Volver al ranking' }).click()
    const second = await playAgain(page)
    // El runId es propio del intento; la seed y el plan son los de la edición.
    expect(second.attemptId).not.toBe(first.attemptId)
    expect(second.descriptor.seed).toBe(first.descriptor.seed)
    expect(second.descriptor.planFingerprint).toBe(
      first.descriptor.planFingerprint,
    )
    expect(second.descriptor.runId).not.toBe(first.descriptor.runId)

    await writeCheckpoint(
      page,
      second.attemptId,
      playCareer(second.descriptor, 'functional'),
    )
    const worse = await resumeAndVerify(page)

    expect(worse).toBeLessThan(best)
    await expect(page.getByTestId('personal-best')).toContainText(
      'sigue contando la anterior',
    )

    const state = await competitionState(page)
    expect(state.you?.attempts).toBe(2)
    expect(state.you?.bestFairScore).toBe(best)
    // Dos intentos, una sola fila: el ranking no acumula.
    expect(
      state.leaderboard.filter((entry) => entry.nickname === nickname).length,
    ).toBeLessThanOrEqual(1)
  })

  test('la partida se juega dentro del producto y se reanuda donde quedó', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await requireOpenCompetition(page)

    await page.goto('/')
    const issued = await identify(page, {
      nickname: uniqueNickname('Juli'),
      fullName: 'Julieta Test Moreno',
      dni: uniqueDni(),
    })

    // Primero: el juego está vivo dentro de la cáscara de competencia. Se
    // avanza con clics reales y la escena cambia.
    const advance = page.getByTestId('continue')
    await expect(advance.first()).toBeVisible({ timeout: 20_000 })
    const opening = await page.evaluate(
      () => document.querySelector('main h2')?.textContent ?? '',
    )
    await advance.first().click()
    await expect
      .poll(async () =>
        page.evaluate(
          () => document.querySelector('main h2')?.textContent ?? '',
        ),
      )
      .not.toBe(opening)

    /*
     * Después: la reanudación, desde donde el motor **pide** un checkpoint.
     *
     * El motor guarda al resolver una situación, no al pasar un beat narrativo
     * —un beat sin decisión no tiene avance que perder—, así que el punto de
     * reanudación honesto es una carrera con situaciones ya respondidas
     * detenida en la siguiente.
     */
    const midRun = playCareer(issued.descriptor, 'optimal', 3)
    await writeCheckpoint(page, issued.attemptId, midRun)

    await page.reload()
    await playAgain(page)

    const submit = page.getByTestId('submit-answer')
    await expect(submit.first()).toBeVisible({ timeout: 30_000 })
    const resumed = await page.evaluate(() => ({
      stage:
        document.querySelector('[data-testid="stage-label"]')?.textContent ??
        '',
      title: document.querySelector('main h2')?.textContent ?? '',
      progress: document.querySelector('main')?.textContent?.includes('Evento'),
    }))
    expect(resumed.title.length).toBeGreaterThan(0)
    expect(resumed.progress).toBe(true)

    // Es la cuarta situación de la carrera, no la primera: el avance volvió.
    const restored = await page.evaluate(
      () =>
        document
          .querySelector('main')
          ?.textContent?.match(/Evento (\d+) de (\d+)/u)?.[0] ?? '',
    )
    expect(restored).not.toBe('Evento 1 de 3')

    // Y sigue siendo la misma partida: recargar no abre una paralela.
    const state = await competitionState(page)
    expect(state.you?.attempts).toBe(1)
    expect(state.you?.activeAttempt).toBe(issued.attemptId)
  })

  test('volver desde otro navegador reconoce a la misma persona', async ({
    page,
    context,
  }) => {
    test.setTimeout(180_000)
    await requireOpenCompetition(page)

    const nickname = uniqueNickname('Vale')
    const dni = uniqueDni()

    await page.goto('/')
    await identify(page, {
      nickname,
      fullName: 'Valentina Test Suárez',
      dni,
    })

    // Se descartan las cookies, como quien abre el juego en otro teléfono.
    await context.clearCookies()
    await page.goto('/')
    await expect(page.getByTestId('play')).toBeVisible()

    await identify(page, {
      // Otro alias, el nombre sin tilde y el documento con puntos: sigue siendo
      // la misma persona, y el alias que conserva es el primero.
      nickname: uniqueNickname('OtroAlias'),
      fullName: 'Valentina Test Suarez',
      dni: `${dni.slice(0, 2)}.${dni.slice(2, 5)}.${dni.slice(5)}`,
    })

    const state = await competitionState(page)
    expect(state.you?.nickname).toBe(nickname)
    expect(state.you?.attempts).toBe(1)
  })

  test('«no soy yo» corta la sesión de este navegador', async ({ page }) => {
    test.setTimeout(120_000)
    await requireOpenCompetition(page)

    await page.goto('/')
    await identify(page, {
      nickname: uniqueNickname('Nico'),
      fullName: 'Nicolás Test Bravo',
      dni: uniqueDni(),
    })

    await page.goto('/')
    await expect(page.getByTestId('greeting')).toBeVisible()
    await page.getByTestId('not-me').click()
    await expect(page.getByTestId('greeting')).toHaveCount(0)
    await expect(page.getByTestId('play')).toBeVisible()
  })
})

test.describe('la autoridad es del servidor', () => {
  test('un envío sin sesión no entra', async ({ request }) => {
    const response = await request.post(
      '/api/competition/attempts/00000000-0000-4000-8000-000000000001/submit',
      { data: { actionLog: {} } },
    )
    expect(response.status()).toBe(401)
    expect((await response.json()).error.code).toBe(
      'PARTICIPANT_SESSION_REQUIRED',
    )
  })

  test('no se puede emitir un intento sin sesión', async ({ request }) => {
    const response = await request.post('/api/competition/attempts', {
      data: {},
    })
    expect(response.status()).toBe(401)
  })

  test('el tablero del organizador exige sesión de organizador', async ({
    request,
  }) => {
    const response = await request.get('/api/organizer/dashboard')
    expect(response.status()).toBe(401)
    expect((await response.json()).error.code).toBe('ORGANIZER_AUTH_REQUIRED')
  })

  test('la exportación privada exige sesión de organizador', async ({
    request,
  }) => {
    const response = await request.get('/api/organizer/export')
    expect(response.status()).toBe(401)
    // Y no filtra ni una fila mientras rechaza.
    expect(await response.text()).not.toContain('nombre_y_apellido')
  })

  test('una acción de organizador sin sesión no hace nada', async ({
    request,
  }) => {
    const response = await request.post('/api/organizer/actions', {
      data: {
        action: 'competition.status',
        status: 'CLOSED',
        reason: 'intento sin permiso',
      },
    })
    expect(response.status()).toBe(401)

    const state = await request.get('/api/competition/state')
    expect((await state.json()).competition.status).not.toBe('closed')
  })

  test('el cuerpo de identificación rechaza campos que no existen', async ({
    request,
  }) => {
    const response = await request.post('/api/competition/participants', {
      data: {
        nickname: 'Intruso',
        fullName: 'Nombre Falso',
        dni: '12345678',
        schoolYear: '3.º',
        privacyNoticeVersion: '1',
        privacyNoticeAcknowledged: true,
        // El participante no elige la competencia ni su propio id.
        competitionId: 'otra',
        participantId: 'elegido-por-mi',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('el estado público nunca se cachea en un intermediario compartido', async ({
    request,
  }) => {
    const response = await request.get('/api/competition/state')
    expect(response.headers()['cache-control']).toContain('no-store')
  })

  test('el ranking público no expone campos privados', async ({ request }) => {
    const response = await request.get('/api/competition/state')
    const body = (await response.json()) as PublicState
    const raw = JSON.stringify(body)
    for (const forbidden of [
      'participantId',
      'attemptId',
      'identityHmac',
      'dniLast4',
      'fullName',
      'schoolYear',
      'seed',
      'runPlanFingerprint',
      'actionLog',
    ]) {
      expect(raw).not.toContain(forbidden)
    }
    for (const entry of body.leaderboard) {
      // Public whitelist includes the bounded authoritative run projection.
      expect(
        Object.keys(entry).every((key) =>
          [
            'fairScore',
            'isYou',
            'nickname',
            'rank',
            'sharedCount',
            'gapBefore',
            'summary',
          ].includes(key),
        ),
      ).toBe(true)
    }
  })
})

test.describe('accesibilidad del recorrido público', () => {
  test('la portada y el formulario son accesibles y entran en un teléfono', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    await page.goto('/')

    const landing = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(landing.violations).toEqual([])

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    expect(layout.scroll).toBeLessThanOrEqual(layout.viewport)

    const state = await competitionState(page)
    if (state.competition.status !== 'open') return

    await page.getByTestId('play').click()
    await expect(page.getByLabel('Alias')).toBeVisible()

    const form = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(form.violations).toEqual([])

    const formLayout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    expect(formLayout.scroll).toBeLessThanOrEqual(formLayout.viewport)
  })

  test('se llega al formulario con el teclado, sin foco programático', async ({
    page,
  }) => {
    await page.goto('/')
    const state = await competitionState(page)
    test.skip(state.competition.status !== 'open', 'competencia cerrada')

    await page.getByTestId('play').click()
    const alias = page.getByLabel('Alias')
    await expect(alias).toBeVisible()

    for (let step = 0; step < 40; step += 1) {
      if (await alias.evaluate((element) => element === document.activeElement))
        break
      await page.keyboard.press('Tab')
    }
    expect(
      await alias.evaluate((element) => element === document.activeElement),
    ).toBe(true)
  })

  test('el error de un campo queda asociado al campo y se anuncia', async ({
    page,
  }) => {
    await page.goto('/')
    const state = await competitionState(page)
    test.skip(state.competition.status !== 'open', 'competencia cerrada')

    await page.getByTestId('play').click()
    const field = page.getByLabel('DNI')
    await field.fill('12')
    await field.blur()

    await expect(field).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await field.getAttribute('aria-describedby')
    expect(describedBy).not.toBeNull()
    await expect(page.locator(`#${String(describedBy)}`)).toHaveAttribute(
      'role',
      'alert',
    )
  })

  test('la política se puede revisar sin enviar datos ni perder el formulario', async ({
    page,
  }) => {
    await page.goto('/')
    const state = await competitionState(page)
    test.skip(state.competition.status !== 'open', 'competencia cerrada')
    await page.getByTestId('play').click()
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    await expect(page.getByTestId('identity-submit')).toHaveText(
      'Aceptar y jugar',
    )
    await page.getByLabel('Alias').fill('Revisando')
    await page.getByLabel('DNI').fill('45123456')
    const registrations: string[] = []
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().includes('/api/competition/participants')
      )
        registrations.push(request.url())
    })
    const popup = page.waitForEvent('popup')
    await page
      .getByRole('link', {
        name: 'Política de Privacidad (abre en otra pestaña)',
      })
      .click()
    const policy = await popup
    await expect(policy).toHaveURL(/\/privacidad$/u)
    await expect(
      policy.getByRole('heading', {
        name: 'Política de Privacidad',
        exact: true,
      }),
    ).toBeVisible()
    await expect(policy.getByText(/Responsable de los datos:/u)).toBeAttached()
    await expect(policy.getByText('Versión del aviso: 1')).toBeAttached()
    expect(registrations).toEqual([])
    await policy.close()
    await expect(page.getByLabel('DNI')).toHaveValue('45123456')
    await expect(page.getByLabel('Alias')).toHaveValue('Revisando')
    expect(
      await page.evaluate(() => JSON.stringify(Object.entries(localStorage))),
    ).not.toContain('45123456')
  })
})

test.describe('superficies retiradas', () => {
  test('el producto público no enlaza ninguna ruta de desarrollo', async ({
    page,
  }) => {
    await page.goto('/')
    const links = await page
      .locator('a[href]')
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('href') ?? ''),
      )
    for (const href of links) {
      expect(href).not.toContain('/dev')
      expect(href).not.toContain('seed=')
    }
  })

  test('la vieja ruta de juego ya no existe como producto público', async ({
    page,
  }) => {
    // `/jugar` era el producto cuando el juego era una partida local de un año.
    // Con la competencia, la única puerta pública es `/`.
    const response = await page.goto('/jugar')
    expect(response?.status()).toBe(404)
  })

  test('no hay una ruta pública de ranking aparte', async ({ page }) => {
    const response = await page.goto('/ranking')
    expect(response?.status()).toBe(404)
  })

  test('un despliegue con competencia no tiene superficie de desarrollo', async ({
    page,
  }) => {
    // Es la propiedad que hace que el producto público sea una sola cosa: con
    // una competencia configurada, `/dev` no abre ni con el opt-in puesto.
    for (const path of [
      '/dev/game-engine',
      '/dev/game-engine?content=full-career&seed=lo-que-sea',
      '/dev/grade-7',
      '/dev/teacher-gate',
      '/dev/design-system',
    ]) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(404)
    }
  })
})
