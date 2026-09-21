// @vitest-environment jsdom

/**
 * Reanudar una partida, y no aplicar dos veces lo mismo.
 *
 * El checkpoint del navegador es superficie de release: si restaura mal, el
 * jugador pierde el año; si restaura de más, cobra dos veces. Hasta el cierre
 * de STAGE-08 esta capa se ejercía sólo de refilón desde los E2E, así que un
 * fallo de borde —otra versión del motor, un payload roto, una lectura
 * repetida— no tenía prueba propia.
 *
 * Todo lo de acá corre contra el motor real y el catálogo real: no hay dobles.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  activeChallengeView,
  createRun,
  ENGINE_VERSION,
  serializeSnapshot,
  transition,
  type GameCommand,
} from '@/game'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { createGameController } from '@/components/game/controller'
import {
  clearCheckpoint,
  loadCheckpoint,
  readCheckpoint,
  saveCheckpoint,
  validateNickname,
} from '@/components/game/session'
import { grade5Answer } from '../helpers/grade-5-play'

const dependencies = createFullCareerDependencies()
const CHECKPOINT_KEY = 'egresado.checkpoint.v1'

function descriptorFor(seed: string) {
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error(`compose: ${JSON.stringify(built.error)}`)
  return built.value
}

const expected = {
  gameVersion: ENGINE_VERSION,
  rulesetVersion: dependencies.ruleset.version,
  contentVersion: dependencies.ruleset.contentVersion,
}

/** El log serializado de una run recién creada, que es lo que guarda la sesión. */
function emptyLogFor(seed: string): unknown {
  const descriptor = descriptorFor(seed)
  return { version: 7, descriptor, actions: [] }
}

/** Juega `beats` desafíos con la calidad pedida y devuelve dónde quedó. */
function playTo(
  seed: string,
  beats: number,
  quality: 'optimal' | 'invalid' = 'optimal',
) {
  const descriptor = descriptorFor(seed)
  const created = createRun(descriptor, dependencies)
  if (!created.ok) throw new Error('create')
  let state = created.value.state
  let answered = 0

  for (let step = 0; step < 240 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      if (answered >= beats) break
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('view')
      let answer
      try {
        answer = grade5Answer(view.value, dependencies, quality, descriptor)
      } catch {
        answer = grade5Answer(view.value, dependencies, 'optimal', descriptor)
      }
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
      answered += 1
    }
    const next = transition(state, command, dependencies)
    if (!next.ok) throw new Error(`transition: ${JSON.stringify(next.error)}`)
    state = next.value.state
  }
  return { descriptor, state }
}

beforeEach(() => {
  clearCheckpoint()
})

describe('reanudar la partida guardada', () => {
  it(
    'restaura el mismo estado exacto que se guardó',
    { timeout: 60_000 },
    () => {
      const { state } = playTo('resume-mid', 3)
      saveCheckpoint(
        'Sofi',
        serializeSnapshot(state),
        emptyLogFor('resume-mid'),
      )

      const restored = loadCheckpoint(expected)
      expect(restored).toBeDefined()
      expect(restored?.nickname).toBe('Sofi')
      expect(restored?.state.stage).toBe(state.stage)
      expect(restored?.state.phase).toBe(state.phase)
      expect(restored?.state.eventIndex).toBe(state.eventIndex)
      expect(restored?.state.career).toEqual(state.career)
    },
  )

  it(
    'una partida restaurada sigue jugándose hasta egresar',
    { timeout: 120_000 },
    () => {
      const { descriptor, state } = playTo('resume-continues', 4)
      saveCheckpoint(
        'Sofi',
        serializeSnapshot(state),
        emptyLogFor('resume-continues'),
      )
      const restored = loadCheckpoint(expected)
      expect(restored).toBeDefined()
      if (restored === undefined) return

      const controller = createGameController(
        descriptor,
        dependencies,
        {},
        {
          state: restored.state,
          log: restored.actionLog,
        },
      )

      for (let step = 0; step < 240; step++) {
        const current = controller.getState()
        if (current.run.status !== 'active') break
        if (current.run.phase === 'challenge') {
          const view = current.view
          if (view === undefined) throw new Error('sin vista tras reanudar')
          controller.dispatch({
            type: 'ANSWER',
            instanceId: view.ref.instanceId,
            answer: grade5Answer(view, dependencies, 'optimal', descriptor),
          })
          continue
        }
        controller.dispatch({ type: 'CONTINUE' })
      }

      const final = controller.getState().run
      expect(final.status).toBe('completed')
      expect(final.completion?.graduated).toBe(true)
    },
  )

  it(
    'conserva la obligación de recuperación que había abierta',
    { timeout: 60_000 },
    () => {
      const { state } = playTo('resume-recovery', 3, 'invalid')
      saveCheckpoint(
        'Sofi',
        serializeSnapshot(state),
        emptyLogFor('resume-recovery'),
      )
      const restored = loadCheckpoint(expected)
      expect(restored).toBeDefined()
      expect(restored?.state.progression).toEqual(state.progression)
      expect(state.progression.pending.length).toBeGreaterThan(0)
    },
  )
})

describe('el checkpoint falla cerrado', () => {
  it(
    'descarta lo escrito por otra versión del motor, y lo borra',
    { timeout: 60_000 },
    () => {
      const { state } = playTo('resume-version', 2)
      saveCheckpoint(
        'Sofi',
        serializeSnapshot(state),
        emptyLogFor('resume-version'),
      )
      expect(
        loadCheckpoint({ ...expected, gameVersion: '99.0.0' }),
      ).toBeUndefined()
      expect(loadCheckpoint(expected)).toBeUndefined()
    },
  )

  it('descarta un payload corrupto sin romper la partida', () => {
    globalThis.localStorage.setItem(CHECKPOINT_KEY, '{roto')
    expect(loadCheckpoint(expected)).toBeUndefined()
    expect(globalThis.localStorage.getItem(CHECKPOINT_KEY)).toBeNull()
  })

  it('descarta un checkpoint sin nickname', { timeout: 60_000 }, () => {
    const { state } = playTo('resume-partial', 2)
    globalThis.localStorage.setItem(
      CHECKPOINT_KEY,
      JSON.stringify({
        version: 1,
        snapshot: serializeSnapshot(state),
        actionLog: emptyLogFor('resume-partial'),
      }),
    )
    expect(loadCheckpoint(expected)).toBeUndefined()
  })

  it(
    'la lectura estable devuelve la misma referencia mientras nada cambie',
    { timeout: 60_000 },
    () => {
      const { state } = playTo('resume-cache', 2)
      saveCheckpoint(
        'Sofi',
        serializeSnapshot(state),
        emptyLogFor('resume-cache'),
      )

      const first = readCheckpoint(expected)
      expect(first).toBeDefined()
      expect(readCheckpoint(expected)).toBe(first)

      clearCheckpoint()
      expect(readCheckpoint(expected)).toBeUndefined()
    },
  )
})

describe('una acción repetida no se aplica dos veces', () => {
  it(
    'responder dos veces el mismo beat deja una sola acción y un solo puntaje',
    { timeout: 60_000 },
    () => {
      const descriptor = descriptorFor('idempotent-answer')
      const controller = createGameController(descriptor, dependencies)

      for (let step = 0; step < 20; step++) {
        if (controller.getState().run.phase === 'challenge') break
        controller.dispatch({ type: 'CONTINUE' })
      }

      const view = controller.getState().view
      expect(view).toBeDefined()
      if (view === undefined) return
      const command: GameCommand = {
        type: 'ANSWER',
        instanceId: view.ref.instanceId,
        answer: grade5Answer(view, dependencies, 'optimal', descriptor),
      }

      expect(controller.dispatch(command)).toBeUndefined()
      const afterFirst = controller.getState()
      const score = afterFirst.run.scorePreview
      const actions = afterFirst.log.actions.length

      // El doble click manda el mismo comando otra vez.
      const rejection = controller.dispatch(command)
      const afterSecond = controller.getState()

      expect(rejection).toBeDefined()
      expect(afterSecond.log.actions.length).toBe(actions)
      expect(afterSecond.run.scorePreview).toBe(score)
      expect(afterSecond.run.eventIndex).toBe(afterFirst.run.eventIndex)
    },
  )

  it('el resultado se acusa una sola vez', { timeout: 60_000 }, () => {
    const descriptor = descriptorFor('idempotent-continue')
    const controller = createGameController(descriptor, dependencies)

    for (let step = 0; step < 20; step++) {
      const current = controller.getState()
      if (current.run.phase === 'feedback') break
      if (current.run.phase === 'challenge') {
        const view = current.view
        if (view === undefined) throw new Error('sin vista')
        controller.dispatch({
          type: 'ANSWER',
          instanceId: view.ref.instanceId,
          answer: grade5Answer(view, dependencies, 'optimal', descriptor),
        })
        continue
      }
      controller.dispatch({ type: 'CONTINUE' })
    }

    expect(controller.getState().run.phase).toBe('feedback')
    const before = controller.getState().run.scorePreview
    controller.dispatch({ type: 'CONTINUE' })

    const after = controller.getState().run
    expect(after.phase).not.toBe('feedback')
    expect(after.pendingFeedback).toBeUndefined()
    // Acusar recibo no vuelve a cobrar: el puntaje lo fijó la respuesta.
    expect(after.scorePreview).toBe(before)
  })
})

describe('el nickname del jugador', () => {
  it('acepta nombres reales y rechaza lo que no se puede mostrar', () => {
    expect(validateNickname('Sofi')).toBeUndefined()
    expect(validateNickname('José-Ñ 2')).toBeUndefined()
    expect(validateNickname('   ')).toBe('vacio')
    expect(validateNickname('a')).toBe('muy-corto')
    expect(validateNickname('x'.repeat(17))).toBe('muy-largo')
    expect(validateNickname('mal\u0000nombre')).toBe('caracteres-invalidos')
  })
})
