'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  createFullCareerDependencies,
  closeCareer,
} from '@/content/full-career'
import { serializeActionLog, type RunDescriptor } from '@/game'
import { Callout } from '@/components/ui'
import {
  CareerEpilogueView,
  type EndingResult,
} from '@/components/game/career-epilogue'
import type { PlacementSnapshot } from '@/components/game/ending/ending-model'
import { GameCanvas } from '@/components/game/game-shell'
import { RunView } from '@/components/game/run-view'
import {
  createGameController,
  type GameController,
} from '@/components/game/controller'
import { useControllerSelector } from '@/components/game/use-game-run'
import type {
  SubmissionResponse,
  VerifiedAttemptPayload,
} from '@/lib/competition'
import {
  clearAttemptCheckpoint,
  readAttemptCheckpoint,
  saveAttemptCheckpoint,
} from './attempt-storage'

/**
 * Una partida de competencia, de la emisión al resultado verificado.
 *
 * El componente juega y envía; no puntúa. Cuando la carrera termina, manda el
 * log de acciones y espera lo que el servidor diga. Es deliberado que el número
 * grande no aparezca antes de esa respuesta: mostrar un puntaje local y después
 * corregirlo enseñaría que el puntaje es negociable, y acá no lo es.
 *
 * El epílogo sí se muestra enseguida, porque no es un puntaje: es el cierre
 * narrativo de la carrera, se deriva del mismo estado final que el servidor va
 * a recomponer, y hacerlo esperar a la red convertiría un momento del juego en
 * una pantalla de carga.
 */

type Submission =
  | { readonly phase: 'idle' }
  | { readonly phase: 'verifying' }
  | {
      readonly phase: 'verified'
      readonly result: VerifiedAttemptPayload
      /** El estado público que llegó con el resultado: de ahí sale el puesto. */
      readonly state: SubmissionResponse['state']
    }
  | { readonly phase: 'failed'; readonly message: string }

export function AttemptRun({
  attemptId,
  descriptor,
  before,
  onVerified,
  onPlayAgain,
  onBackToRanking,
}: {
  readonly attemptId: string
  readonly descriptor: RunDescriptor
  /**
   * Lo que la portada sabía de este participante al emitir el intento.
   *
   * Es la única evidencia con la que el cierre puede decir «subiste al 1.º
   * puesto» o «récord»: compara ese antes con el después que devuelve el
   * servidor. Sin snapshot, esas dos afirmaciones no aparecen.
   */
  readonly before?: PlacementSnapshot
  readonly onVerified: (response: SubmissionResponse) => void
  readonly onPlayAgain: () => void
  readonly onBackToRanking: () => void
}) {
  const dependencies = useMemo(() => createFullCareerDependencies(), [])
  /**
   * Si una escritura del checkpoint falló **después** de una decisión.
   *
   * Se separa del primer guardado porque llegan de lugares distintos: éste sale
   * del sink del motor, que es un callback de evento y puede cambiar estado sin
   * problemas; el primero ocurre al construir la sesión y se deriva durante el
   * render en vez de setearse.
   */
  const [saveFailed, setSaveFailed] = useState(false)
  const [submission, setSubmission] = useState<Submission>({ phase: 'idle' })
  /**
   * Cuántas veces se pidió enviar.
   *
   * El efecto de envío depende de este número, así que reintentar es sumarle
   * uno. La alternativa —llamar a `fetch` desde el manejador del botón—
   * duplicaría el camino de envío, y el primero ya corre solo al terminar la
   * carrera.
   */
  const [attempts, setAttempts] = useState(0)
  const sentFor = useRef<number | undefined>(undefined)

  const session = useMemo(() => {
    const holder: { current?: GameController } = {}
    const resumed = readAttemptCheckpoint(attemptId, descriptor)
    const created = createGameController(
      descriptor,
      dependencies,
      {
        // El motor pide el checkpoint; escribirlo es de la aplicación. El
        // guardado de la partida terminada también se hace, porque el log sigue
        // haciendo falta para enviar: borrarlo acá dejaría una carrera
        // completa sin forma de reintentar el envío.
        onSnapshot: () => {
          const active = holder.current
          if (active === undefined) return
          const state = active.getState()
          if (!saveAttemptCheckpoint(attemptId, state.run, state.log)) {
            setSaveFailed(true)
          }
        },
      },
      resumed,
    )
    holder.current = created

    /*
     * El primer checkpoint, antes de la primera respuesta.
     *
     * Se escribe acá y su resultado viaja con la sesión en vez de anunciarse
     * con `setState`: avisar desde el render sería pedirle a React que se
     * re-renderice a sí mismo, y avisar desde un efecto haría dos renders para
     * decir algo que ya se sabe al construir.
     */
    const initialSave =
      resumed !== undefined ||
      saveAttemptCheckpoint(
        attemptId,
        created.getState().run,
        created.getState().log,
      )

    return { controller: created, initialSave }
  }, [attemptId, dependencies, descriptor])

  const { controller } = session
  const storageWarning = saveFailed || !session.initialSave

  const run = useControllerSelector(controller, (current) => current.run)
  const log = useControllerSelector(controller, (current) => current.log)

  const closed = useMemo(
    () => (run.status === 'completed' ? closeCareer(run) : undefined),
    [run],
  )

  useEffect(() => {
    if (run.status !== 'completed') return
    if (sentFor.current === attempts) return
    sentFor.current = attempts

    let cancelled = false
    const send = async () => {
      setSubmission({ phase: 'verifying' })
      try {
        const response = await fetch(
          `/api/competition/attempts/${attemptId}/submit`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ actionLog: serializeActionLog(log) }),
          },
        )
        const body: unknown = await response.json()
        if (cancelled) return

        if (!response.ok) {
          const message =
            typeof body === 'object' &&
            body !== null &&
            'error' in body &&
            typeof (body as { error?: { message?: unknown } }).error
              ?.message === 'string'
              ? String((body as { error: { message: string } }).error.message)
              : 'No pudimos verificar esta partida.'
          setSubmission({ phase: 'failed', message })
          return
        }

        const payload = body as SubmissionResponse
        clearAttemptCheckpoint(attemptId)
        setSubmission({
          phase: 'verified',
          result: payload.result,
          state: payload.state,
        })
        onVerified(payload)
      } catch {
        if (!cancelled) {
          setSubmission({
            phase: 'failed',
            message:
              'No pudimos conectarnos para verificar la partida. Probá de nuevo.',
          })
        }
      }
    }

    void send()
    return () => {
      cancelled = true
    }
  }, [attemptId, attempts, log, onVerified, run.status])

  /**
   * Reintenta el envío.
   *
   * Reenviar el mismo log es seguro y ésa es la razón por la que el botón
   * existe: el servidor reconoce la huella de la submission y devuelve el
   * resultado que ya guardó en lugar de crear otro. Sin idempotencia, un botón
   * de reintentar sería una forma de puntuar dos veces la misma partida.
   */
  function retry() {
    setAttempts((current) => current + 1)
  }

  if (run.status !== 'completed') {
    return (
      <div className="flex flex-col gap-3">
        {storageWarning ? (
          <div className="max-w-viewport px-gutter mx-auto w-full pt-4">
            <Callout tone="accent" title="No se puede guardar el avance">
              Este navegador tiene el almacenamiento bloqueado. Podés seguir
              jugando, pero si recargás la página vas a perder el avance.
            </Callout>
          </div>
        ) : null}
        <main>
          <GameCanvas>
            <RunView controller={controller} dependencies={dependencies} />
          </GameCanvas>
        </main>
      </div>
    )
  }

  if (closed === undefined) throw new Error('missing career closing')

  const result: EndingResult =
    submission.phase === 'verified'
      ? {
          kind: 'competition',
          phase: 'verified',
          result: submission.result,
          competition: submission.state,
          ...(before === undefined ? {} : { before }),
        }
      : submission.phase === 'failed'
        ? {
            kind: 'competition',
            phase: 'failed',
            message: submission.message,
            onRetry: retry,
          }
        : { kind: 'competition', phase: 'verifying' }

  return (
    <main className="flex flex-col gap-4">
      <GameCanvas>
        <CareerEpilogueView
          ending={{
            state: run,
            epilogue: closed.epilogue,
            milestones: closed.milestones,
            memories: closed.memories,
          }}
          result={result}
          onPlayAgain={onPlayAgain}
          onBackToRanking={onBackToRanking}
        />
      </GameCanvas>
    </main>
  )
}
