import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '../../src/content/full-career'
import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  serializeActionLog,
  serializeSnapshot,
  transition,
  type GameCommand,
  type RunState,
  type SolutionQuality,
} from '../../src/game'
import { grade5Answer } from '../helpers/grade-5-play'
import { MILESTONE_ARTWORK } from '../../src/components/game/milestone-artwork'

const SEED = 'browser-career'

/** Tab traversal, never HTMLElement.focus: the keyboard path is the contract. */
async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 200; step++) {
    if (await target.evaluate((element) => element === document.activeElement))
      return
    await page.keyboard.press('Tab')
  }
  throw new Error('control unreachable by Tab')
}

async function reflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  expect(layout.scroll, label).toBeLessThanOrEqual(layout.viewport)
}

/** Una carrera completa jugada en el motor, con todos sus estados y comandos. */
function playCareer(seed: string, quality: (id: string) => SolutionQuality) {
  const dependencies = createFullCareerDependencies()
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error('descriptor failed')
  const created = createRun(built.value, dependencies)
  if (!created.ok) throw new Error('create failed')
  let state = created.value.state
  const states: RunState[] = [state]
  const commands: GameCommand[] = []
  for (let step = 0; step < 240 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('no view')
      let answer
      try {
        answer = grade5Answer(
          view.value,
          dependencies,
          quality(view.value.ref.templateId),
          built.value,
        )
      } catch {
        answer = grade5Answer(view.value, dependencies, 'optimal', built.value)
      }
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
    }
    const next = transition(state, command, dependencies)
    if (!next.ok) throw new Error(JSON.stringify(next.error))
    state = next.value.state
    commands.push(command)
    states.push(state)
  }
  if (state.status !== 'completed') throw new Error('career did not finish')
  return { descriptor: built.value, states, commands, final: state }
}

/** Reanuda la carrera en el índice pedido de su propia secuencia de estados. */
async function openAt(
  page: Page,
  seed: string,
  run: ReturnType<typeof playCareer>,
  index: number,
) {
  let log = emptyActionLog(run.descriptor)
  for (const command of run.commands.slice(0, index))
    log = appendAction(log, command)

  await page.goto(`/dev/game-engine?content=full-career&seed=${seed}`)
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value)
    },
    {
      key: `egresado.career.harness.v1.partial.${seed}`,
      value: JSON.stringify({
        snapshot: serializeSnapshot(run.states[index]!),
        log: serializeActionLog(log),
      }),
    },
  )
  await page.reload()
  const resume = page.getByRole('button', { name: 'Reanudar última decisión' })
  await tabTo(page, resume)
  await page.keyboard.press('Enter')
}

test('las láminas acompañan los interludios y dejan avanzar aun sin imágenes', async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000)
  await page.setViewportSize({ width: 320, height: 720 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const run = playCareer(SEED, () => 'optimal')
  const narratives = run.states.flatMap((state, index) =>
    state.phase === 'narrative' && state.status === 'active'
      ? [{ state, index }]
      : [],
  )
  expect(new Set(narratives.map(({ state }) => state.stage)).size).toBe(6)
  for (const { state, index } of narratives) {
    await openAt(page, SEED, run, index)
    const image = page.getByTestId('narrative-card').locator('img')
    await expect(image).toBeVisible()
    await expect(image).toHaveAttribute('alt', '')
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true)
    expect(
      decodeURIComponent((await image.getAttribute('src')) ?? ''),
    ).toContain(MILESTONE_ARTWORK[state.stage])
    await expect(page.locator('[data-primary]')).toHaveCount(1)
    await reflow(page, `interludio ${state.stage}`)
    const advance = page.getByTestId('continue')
    await tabTo(page, advance)
    await page.keyboard.press('Enter')
  }

  await openAt(page, SEED, run, 0)
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 })
    await reflow(page, `apertura ${String(width)}`)
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(axe.violations).toEqual([])
    await page.screenshot({
      path: testInfo.outputPath(`opening-${String(width)}.png`),
      fullPage: true,
    })
  }
  await page.route('**/*milestones*', (route) => route.abort())
  await openAt(page, SEED, run, 0)
  await expect(page.getByTestId('narrative-card')).toContainText(
    'Arranca séptimo',
  )
  await tabTo(page, page.getByTestId('continue'))
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('submit-answer')).toBeVisible()
})

test('la carrera completa compone nueve beats en los seis años y cierra con el epílogo', async ({
  page,
}) => {
  test.setTimeout(240_000)
  await page.setViewportSize({ width: 390, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  const run = playCareer(SEED, () => 'optimal')
  const beats = run.final.history.filter(
    (entry) => entry.challengeId !== undefined,
  )
  expect(beats.length).toBeGreaterThanOrEqual(9)
  expect(new Set(run.final.history.map((entry) => entry.stage)).size).toBe(6)

  await openAt(page, SEED, run, run.commands.length)

  // 1 · EGRESASTE, siempre y primero.
  await expect(page.getByTestId('graduated')).toHaveText('Egresaste')
  // 2 · Perfil autorado. 3 · Estilo y registro. 4 · El recorrido, año por año.
  await expect(page.getByTestId('epilogue-profile')).toBeVisible()
  await expect(page.getByTestId('play-style')).toBeVisible()
  await expect(page.getByTestId('epilogue-record')).toBeVisible()
  await expect(page.getByTestId('recap-year')).toHaveCount(6)
  await expect(page.getByTestId('career-recap')).toContainText('Adaptación')
  await expect(page.getByTestId('career-recap')).toContainText('Cierre')
  // 6 · En práctica el cierre es personal, sin puesto.
  await expect(page.getByText('no entra en ningún ranking')).toBeVisible()
  await reflow(page, 'epílogo · 390')
})

test('una carrera con recuperaciones egresa igual y el epílogo lo dice sin humillar', async ({
  page,
}) => {
  test.setTimeout(240_000)
  await page.setViewportSize({ width: 320, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  // Falla dirigida sobre los beats que **declaran** ruta de Repaso: fallar donde
  // no hay ruta no probaría nada sobre recuperación, y qué Template le toca a
  // una seed depende del catálogo vigente, así que la lista sale del contenido.
  const routed = new Set(
    Object.entries(
      createFullCareerDependencies().recoveryContent?.reviews ?? {},
    )
      .filter(([, reviews]) => reviews.length > 0)
      .map(([templateId]) => templateId),
  )
  expect(routed.size).toBeGreaterThan(0)
  const run = playCareer('browser-career-repaso', (id) =>
    routed.has(id) ? 'invalid' : 'optimal',
  )
  expect(run.final.completion?.graduated).toBe(true)
  expect(run.final.completion?.recoveries).toBeGreaterThan(0)

  await openAt(page, 'browser-career-repaso', run, run.commands.length)
  await expect(page.getByTestId('graduated')).toHaveText('Egresaste')
  const text = await page.getByTestId('epilogue-profile').innerText()
  for (const forbidden of ['fracas', 'peor', 'mal alumno'])
    expect(text.toLowerCase()).not.toContain(forbidden)
  await reflow(page, 'epílogo con repaso · 320')
})

for (const width of [320, 412]) {
  test(`el epílogo entra y es accesible a ${String(width)} px`, async ({
    page,
  }) => {
    test.setTimeout(240_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const run = playCareer(SEED, () => 'optimal')
    await openAt(page, SEED, run, run.commands.length)
    await expect(page.getByTestId('graduated')).toBeVisible()
    const image = page.getByTestId('scene-media').locator('img')
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true)
    await reflow(page, `epílogo · ${String(width)}`)

    const controls = await page
      .locator('main button:enabled')
      .evaluateAll((elements) =>
        elements.map((element) => ({
          height: element.getBoundingClientRect().height,
          width: element.getBoundingClientRect().width,
        })),
      )
    for (const control of controls) {
      expect(control.height).toBeGreaterThanOrEqual(44)
      expect(control.width).toBeGreaterThanOrEqual(44)
    }

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(axe.violations).toEqual([])

    const again = page.getByTestId('play-again')
    await tabTo(page, again)
    await page.keyboard.press('Enter')
  })
}

test('cada beat de una carrera real se abre y se responde en el navegador', async ({
  page,
}) => {
  test.setTimeout(300_000)
  await page.setViewportSize({ width: 320, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  const run = playCareer(SEED, () => 'optimal')
  const beats = run.states.flatMap((state, index) =>
    state.phase === 'challenge' && state.activeEvent?.challenge !== undefined
      ? [{ index, templateId: state.activeEvent.challenge.templateId }]
      : [],
  )
  expect(beats.length).toBeGreaterThanOrEqual(9)

  for (const beat of beats) {
    await openAt(page, SEED, run, beat.index)
    // La situación se muestra y admite responder: es lo mínimo que hace
    // jugable un beat, y se comprueba en el ancho más angosto que soportamos.
    await expect(
      page.getByTestId('submit-answer'),
      beat.templateId,
    ).toBeVisible()
    await reflow(page, `${beat.templateId} · 320`)
  }
})
