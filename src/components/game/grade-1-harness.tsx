'use client'

import { useMemo, useState } from 'react'
import {
  createGrade1Dependencies,
  createGrade1RunDescriptor,
} from '@/content/grade-1'
import {
  createGrade2Dependencies,
  createGrade2RunDescriptor,
} from '@/content/grade-2'
import {
  createGrade3Dependencies,
  createGrade3RunDescriptor,
} from '@/content/grade-3'
import {
  createGrade4Dependencies,
  createGrade4RunDescriptor,
} from '@/content/grade-4'
import {
  createGrade5Dependencies,
  createGrade5RunDescriptor,
} from '@/content/grade-5'
import {
  closeCareer,
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
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
import { CareerEpilogueView } from './career-epilogue'
import { GameCanvas } from './game-shell'
import { RunView } from './run-view'
import { useControllerSelector } from './use-game-run'
import type { EngineDependencies } from '@/game'

/** Which career content set this harness plays. One entry per implemented year. */
export type HarnessContent =
  'grade-1' | 'grade-2' | 'grade-3' | 'grade-4' | 'grade-5' | 'full-career'

const SETS = {
  'grade-1': {
    dependencies: createGrade1Dependencies,
    descriptor: createGrade1RunDescriptor,
    storage: 'grade1',
    title: '7.º → 1.º',
    demoDetail:
      'Muestra las cinco situaciones de primero; no respeta el presupuesto de una run normal.',
    partialDetail:
      'Cuatro situaciones ordinarias en dos años, con Repaso fuera del presupuesto.',
  },
  'grade-2': {
    dependencies: createGrade2Dependencies,
    descriptor: createGrade2RunDescriptor,
    storage: 'grade2',
    title: '7.º → 2.º',
    demoDetail:
      'Muestra las situaciones de primero y segundo; no respeta el presupuesto de una run normal.',
    partialDetail:
      'Seis situaciones ordinarias en tres años, con Repaso fuera del presupuesto.',
  },
  'grade-3': {
    dependencies: createGrade3Dependencies,
    descriptor: createGrade3RunDescriptor,
    storage: 'grade3',
    title: '7.º → 3.º',
    demoDetail:
      'Muestra las situaciones de primero, segundo y tercero; no respeta el presupuesto de una run normal.',
    partialDetail:
      'Ocho situaciones ordinarias en cuatro años, con Repaso fuera del presupuesto.',
  },
  'grade-4': {
    dependencies: createGrade4Dependencies,
    descriptor: createGrade4RunDescriptor,
    storage: 'grade4',
    title: '7.º → 4.º',
    demoDetail:
      'Muestra las situaciones de primero a cuarto; no respeta el presupuesto de una run normal.',
    partialDetail:
      'Diez situaciones ordinarias en cinco años, con Repaso fuera del presupuesto.',
  },
  'grade-5': {
    dependencies: createGrade5Dependencies,
    descriptor: createGrade5RunDescriptor,
    storage: 'grade5',
    title: '7.º → 5.º',
    demoDetail:
      'Muestra las situaciones de los seis años; no respeta el presupuesto de una run normal.',
    partialDetail:
      'Doce situaciones ordinarias en los seis años, con Repaso fuera del presupuesto.',
  },
  'full-career': {
    // La carrera real no tiene modo demo: su gracia es justamente respetar el
    // presupuesto de nueve beats que la composición impone.
    dependencies: () => createFullCareerDependencies(),
    descriptor: (seed: string) => createFullCareerRunDescriptor(seed),
    storage: 'career',
    title: 'Carrera completa 7.º → 5.º',
    demoDetail:
      'Nueve situaciones puntuables repartidas por los seis años, como en una run normal.',
    partialDetail:
      'Nueve situaciones puntuables repartidas por los seis años, como en una run normal.',
  },
} as const

/** Isolated local practice surface. Never touches the /jugar Grade-7 checkpoint. */
export function Grade1Harness({
  seed,
  demo,
  content = 'grade-1',
}: {
  readonly seed: string
  readonly demo: boolean
  readonly content?: HarnessContent
}) {
  const set = SETS[content]
  const dependencies = useMemo(() => set.dependencies(demo), [set, demo])
  const [controller, setController] = useState<GameController>()
  const [message, setMessage] = useState('')
  const key = `egresado.${set.storage}.harness.v1.${demo ? 'demo' : 'partial'}.${seed}`

  function start(resume: boolean) {
    const built = set.descriptor(seed, demo)
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
          title={`${demo ? 'Demo de contenido' : 'Recorrido compuesto'} · ${set.title}`}
          tone="accent"
        >
          Práctica local de desarrollo.{' '}
          {demo ? set.demoDetail : set.partialDetail} No es una carrera completa
          ni habilita ranking oficial. Seed: {seed}.
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
            <Grade1Run
              controller={controller}
              dependencies={dependencies}
              career={content === 'full-career'}
              onPlayAgain={() => start(false)}
            />
          </GameCanvas>
        </main>
      )}
    </div>
  )
}

function Grade1Run({
  controller,
  dependencies,
  career,
  onPlayAgain,
}: {
  readonly controller: GameController
  readonly dependencies: EngineDependencies
  /** Sólo la carrera completa egresa; los recorridos parciales cierran años. */
  readonly career: boolean
  readonly onPlayAgain: () => void
}) {
  const run = useControllerSelector(controller, (current) => current.run)
  // El cierre se deriva del estado final, igual que lo recompone el servidor
  // desde el log: la pantalla no guarda nada propio. Se memoiza porque
  // derivarlo reconstruye el content set entero.
  const closed = useMemo(
    () => (career && run.status === 'completed' ? closeCareer(run) : undefined),
    [career, run],
  )
  if (run.status !== 'completed')
    return <RunView controller={controller} dependencies={dependencies} />
  if (!career)
    return (
      <Callout title="Recorrido de desarrollo completado" tone="accent">
        Cerraste los años de este recorrido. La carrera completa y el ranking
        oficial todavía no están habilitados.
      </Callout>
    )
  if (closed === undefined) throw new Error('missing career closing')
  return (
    <CareerEpilogueView epilogue={closed.epilogue} onPlayAgain={onPlayAgain} />
  )
}
