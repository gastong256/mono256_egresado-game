'use client'

/**
 * El juego.
 *
 * Une el recorrido completo: elegir nombre, jugar el año y ver el resumen.
 * Es la única frontera de cliente del juego; todo lo de adentro es presentación.
 *
 * No decide ninguna regla. Crea la run con el descriptor que arma la sesión,
 * despacha comandos al motor y dibuja lo que el motor devuelve. Cuándo termina
 * el año, qué desafío viene y cuánto suma cada decisión son respuestas del
 * motor, no de este componente.
 */

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'

import { createGrade7Dependencies } from '@/content/grade-7'
import {
  ENGINE_VERSION,
  isRunComplete,
  serializeActionLog,
  type EngineDependencies,
  type RunDescriptor,
} from '@/game'
import { Button, Eyebrow, Wordmark } from '@/components/ui'
import { createGameController, type GameController } from './controller'
import { GameCanvas, GameSheet, SceneColumn, ActionSlot } from './game-shell'
import { NicknameForm } from './nickname-form'
import { RunView } from './run-view'
import { firstStageLabel } from './stage-label'
import { useControllerSelector } from './use-game-run'
import {
  clearCheckpoint,
  createRunDescriptor,
  createSeedValue,
  readCheckpoint,
  saveCheckpoint,
  subscribeToCheckpoint,
  type StoredCheckpoint,
} from './session'
import { YearResult } from './year-result'

type Screen =
  | { readonly kind: 'reanudar'; readonly checkpoint: StoredCheckpoint }
  | { readonly kind: 'nombre' }
  | {
      readonly kind: 'jugando'
      readonly nickname: string
      readonly controller: GameController
    }

/**
 * Lectura del checkpoint.
 *
 * `localStorage` no existe en el servidor, así que el primer render no puede
 * saber si hay partida guardada. `useSyncExternalStore` es la forma sancionada
 * de leer una fuente externa: el servidor devuelve "todavía no sé" y el cliente
 * la respuesta real, sin desajustar la hidratación ni encadenar renders desde
 * un efecto.
 *
 * La estabilidad de la referencia la resuelve `readCheckpoint`; acá sólo se
 * envuelve en el par listo/no-listo que distingue "no hay partida guardada" de
 * "todavía no se pudo mirar".
 */
interface CheckpointProbe {
  readonly ready: boolean
  readonly checkpoint: StoredCheckpoint | undefined
}

const PENDING_PROBE: CheckpointProbe = { ready: false, checkpoint: undefined }

let probeCache: CheckpointProbe | undefined

function readProbe(versions: {
  gameVersion: string
  rulesetVersion: string
  contentVersion: string
}): CheckpointProbe {
  const checkpoint = readCheckpoint(versions)
  if (probeCache === undefined || probeCache.checkpoint !== checkpoint) {
    probeCache = { ready: true, checkpoint }
  }
  return probeCache
}

/**
 * Crea el controller y le conecta el guardado del checkpoint.
 *
 * El motor pide el snapshot; escribirlo es responsabilidad de la aplicación.
 * El controller se referencia a sí mismo para poder guardar también el log de
 * acciones, que es lo que permitiría revalidar la run más adelante.
 */
function buildController(
  nickname: string,
  descriptor: RunDescriptor,
  dependencies: EngineDependencies,
  resumed?: StoredCheckpoint,
): GameController {
  // El sink necesita el controller para leer el log, y el controller todavía no
  // existe cuando se lo construye. Un holder resuelve la referencia circular sin
  // exponerla fuera de esta función.
  const holder: { current?: GameController } = {}

  const controller = createGameController(
    descriptor,
    dependencies,
    {
      onSnapshot: (snapshot, reason) => {
        if (reason === 'run-completed') {
          // El año terminó: ya no hay nada que reanudar.
          clearCheckpoint()
          return
        }
        const active = holder.current
        if (active !== undefined) {
          saveCheckpoint(
            nickname,
            snapshot,
            serializeActionLog(active.getState().log),
          )
        }
      },
    },
    resumed === undefined
      ? undefined
      : { state: resumed.state, log: resumed.actionLog },
  )

  holder.current = controller
  return controller
}

export function GameContainer() {
  const dependencies = useMemo(() => createGrade7Dependencies(), [])
  const stage = useMemo(
    () => firstStageLabel(dependencies.ruleset.stages),
    [dependencies],
  )
  const versions = useMemo(
    () => ({
      gameVersion: ENGINE_VERSION,
      rulesetVersion: dependencies.ruleset.version,
      contentVersion: dependencies.ruleset.contentVersion,
    }),
    [dependencies],
  )

  const probe = useSyncExternalStore(
    subscribeToCheckpoint,
    useCallback(() => readProbe(versions), [versions]),
    () => PENDING_PROBE,
  )

  const [screen, setScreen] = useState<Screen | undefined>(undefined)

  const startRun = useCallback(
    (nickname: string) => {
      const descriptor = createRunDescriptor(
        createSeedValue(),
        dependencies.ruleset.version,
        dependencies.ruleset.contentVersion,
      )
      setScreen({
        kind: 'jugando',
        nickname,
        controller: buildController(nickname, descriptor, dependencies),
      })
    },
    [dependencies],
  )

  if (!probe.ready) {
    // El servidor no puede saber si hay partida guardada, así que la primera
    // pintura muestra el encabezado real y avisa que falta un instante. El
    // título es el mismo que en la pantalla siguiente para que nada salte.
    return (
      <main aria-busy="true">
        <GameCanvas>
          <GameSheet>
            <SceneColumn className="justify-center">
              <h1>
                <Wordmark size="lg" />
              </h1>
              <p className="text-body text-ink-secondary">
                Un segundo, estamos viendo si dejaste una partida empezada…
              </p>
            </SceneColumn>
          </GameSheet>
        </GameCanvas>
      </main>
    )
  }

  const current: Screen =
    screen ??
    (probe.checkpoint === undefined
      ? { kind: 'nombre' }
      : { kind: 'reanudar', checkpoint: probe.checkpoint })

  if (current.kind === 'reanudar') {
    const { checkpoint } = current

    return (
      <main>
        <GameCanvas>
          <GameSheet>
            <SceneColumn>
              <Eyebrow>Partida empezada</Eyebrow>
              <h1 className="text-display font-display text-ink text-balance">
                Volvés a séptimo
              </h1>
              <p className="text-body-lg text-ink-secondary text-pretty">
                {checkpoint.nickname}, dejaste {stage} por la mitad.
              </p>
              <ActionSlot>
                <Button
                  data-testid="resume-run"
                  onClick={() => {
                    setScreen({
                      kind: 'jugando',
                      nickname: checkpoint.nickname,
                      controller: buildController(
                        checkpoint.nickname,
                        checkpoint.state.descriptor,
                        dependencies,
                        checkpoint,
                      ),
                    })
                  }}
                >
                  Seguir jugando
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  data-testid="discard-run"
                  onClick={() => {
                    clearCheckpoint()
                    setScreen({ kind: 'nombre' })
                  }}
                >
                  Empezar de nuevo
                </Button>
              </ActionSlot>
            </SceneColumn>
          </GameSheet>
        </GameCanvas>
      </main>
    )
  }

  if (current.kind === 'nombre') {
    return (
      <main>
        <GameCanvas>
          <GameSheet>
            <SceneColumn>
              <header className="flex flex-col gap-3">
                <h1>
                  <Wordmark size="lg" />
                </h1>
                <p className="text-body-lg text-ink-secondary text-pretty">
                  Seis años de secundaria en unos minutos. Empezás en {stage} y
                  cada decisión que tomás deja una marca en el año.
                </p>
              </header>
              <NicknameForm onSubmit={startRun} stage={stage} />
            </SceneColumn>
          </GameSheet>
        </GameCanvas>
      </main>
    )
  }

  return (
    <PlayingScreen
      controller={current.controller}
      dependencies={dependencies}
      onPlayAgain={() => {
        clearCheckpoint()
        startRun(current.nickname)
      }}
    />
  )
}

/**
 * Mientras la run está activa dibuja el shell; cuando el motor la da por
 * terminada, el resumen del año. Qué mostrar lo decide el estado del motor, no
 * un contador local.
 */
function PlayingScreen({
  controller,
  dependencies,
  onPlayAgain,
}: {
  readonly controller: GameController
  readonly dependencies: EngineDependencies
  readonly onPlayAgain: () => void
}) {
  const run = useControllerSelector(
    controller,
    useCallback((state) => state.run, []),
  )

  if (isRunComplete(run)) {
    return (
      <main>
        <GameCanvas>
          <YearResult state={run} onPlayAgain={onPlayAgain} />
        </GameCanvas>
      </main>
    )
  }

  return (
    <main>
      <GameCanvas>
        <RunView controller={controller} dependencies={dependencies} />
      </GameCanvas>
    </main>
  )
}
