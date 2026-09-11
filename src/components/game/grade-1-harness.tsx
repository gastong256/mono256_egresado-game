'use client'

import { useMemo, useState } from 'react'
import {
  createGrade1Dependencies,
  createGrade1RunDescriptor,
} from '@/content/grade-1'
import {
  canonicalize,
  parseActionLog,
  replayRun,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
  type RunDescriptor,
} from '@/game'
import { Button, Callout } from '@/components/ui'
import {
  createGameController,
  type GameController,
  type ResumedSession,
} from './controller'
import { GameCanvas } from './game-shell'
import { RunView } from './run-view'
import { useControllerSelector } from './use-game-run'
import type { EngineDependencies } from '@/game'

/** Isolated local practice surface. Never touches the /jugar Grade-7 checkpoint. */
export function Grade1Harness({
  seed,
  demo,
}: {
  readonly seed: string
  readonly demo: boolean
}) {
  const dependencies = useMemo(() => createGrade1Dependencies(demo), [demo])
  const [controller, setController] = useState<GameController>()
  const [message, setMessage] = useState('')
  const key = `egresado.grade1.harness.v1.${demo ? 'demo' : 'partial'}.${seed}`

  function start(resume: boolean) {
    const built = createGrade1RunDescriptor(seed, demo)
    if (!built.ok) {
      setMessage(`No se pudo componer: ${built.error.detail}`)
      return
    }
    const descriptor: RunDescriptor = built.value
    let resumed: ResumedSession | undefined
    if (resume) {
      try {
        const raw = localStorage.getItem(key)
        if (raw === null) {
          setMessage(
            'No hay un checkpoint guardado para este recorrido y seed.',
          )
          return
        }
        const saved: unknown = JSON.parse(raw)
        if (
          typeof saved !== 'object' ||
          saved === null ||
          !('snapshot' in saved) ||
          !('log' in saved)
        )
          throw new Error('checkpoint inválido')
        const snapshot = restoreSnapshot(saved.snapshot, descriptor)
        const log = parseActionLog(saved.log)
        if (
          !snapshot.ok ||
          !log.ok ||
          canonicalize(log.value.descriptor) !== canonicalize(descriptor)
        )
          throw new Error('versiones incompatibles')
        const replayed = replayRun(log.value, dependencies)
        if (
          !replayed.ok ||
          canonicalize(serializeSnapshot(replayed.value.state)) !==
            canonicalize(serializeSnapshot(snapshot.value))
        )
          throw new Error('snapshot y acciones no coinciden')
        resumed = { state: snapshot.value, log: log.value }
      } catch {
        setMessage(
          'No se pudo reanudar: el checkpoint no es compatible o no coincide con sus acciones. Podés iniciar un recorrido nuevo.',
        )
        return
      }
    }
    const holder: { current?: GameController } = {}
    const next = createGameController(
      descriptor,
      dependencies,
      {
        onSnapshot: (snapshot) => {
          const current = holder.current
          if (current === undefined) return
          try {
            localStorage.setItem(
              key,
              JSON.stringify({
                snapshot,
                log: serializeActionLog(current.getState().log),
              }),
            )
          } catch {
            setMessage(
              'No se pudo guardar en este navegador. Podés seguir jugando, pero una recarga perderá el avance.',
            )
          }
        },
      },
      resumed,
    )
    holder.current = next
    // Explicit new-run checkpoint, including before the first answer.
    if (!resume) {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            snapshot: serializeSnapshot(next.getState().run),
            log: serializeActionLog(next.getState().log),
          }),
        )
        setMessage('')
      } catch {
        setMessage(
          'El almacenamiento está bloqueado: este recorrido no podrá reanudarse.',
        )
      }
    } else setMessage('Reanudado desde la última decisión confirmada.')
    setController(next)
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="max-w-viewport px-gutter mx-auto flex w-full flex-col gap-3 pt-4">
        <Callout
          title={
            demo
              ? 'Demo de contenido · 7.º → 1.º'
              : 'Recorrido compuesto · 7.º → 1.º'
          }
          tone="accent"
        >
          Práctica local de desarrollo.{' '}
          {demo
            ? 'Muestra las cinco situaciones de primero; no respeta el presupuesto de una run normal.'
            : 'Cuatro situaciones ordinarias en dos años, con Repaso fuera del presupuesto.'}{' '}
          No es una carrera completa ni habilita ranking oficial. Seed: {seed}.
        </Callout>
        {message !== '' && (
          <p role="status" className="text-meta text-ink-secondary">
            {message}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => start(false)}>
            {controller === undefined
              ? 'Comenzar recorrido'
              : 'Reiniciar recorrido'}
          </Button>
          {controller === undefined && (
            <Button variant="secondary" onClick={() => start(true)}>
              Reanudar última decisión
            </Button>
          )}
        </div>
      </div>
      {controller !== undefined && (
        <main>
          <GameCanvas>
            <Grade1Run controller={controller} dependencies={dependencies} />
          </GameCanvas>
        </main>
      )}
    </div>
  )
}

function Grade1Run({
  controller,
  dependencies,
}: {
  readonly controller: GameController
  readonly dependencies: EngineDependencies
}) {
  const completed = useControllerSelector(
    controller,
    (current) => current.run.status === 'completed',
  )
  return completed ? (
    <Callout title="Recorrido de desarrollo completado" tone="accent">
      Cerraste los años de este recorrido. La carrera completa y el ranking
      oficial todavía no están habilitados.
    </Callout>
  ) : (
    <RunView controller={controller} dependencies={dependencies} />
  )
}
