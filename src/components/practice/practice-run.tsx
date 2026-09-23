'use client'

import { useEffect, useMemo, useState } from 'react'
import { canonicalize, serializeActionLog, type RunDescriptor } from '@/game'
import {
  closeCareer,
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { createGameController } from '@/components/game/controller'
import { useControllerSelector } from '@/components/game/use-game-run'
import { RunView } from '@/components/game/run-view'
import {
  CareerEpilogueView,
  type EndingResult,
} from '@/components/game/career-epilogue'
import { GameCanvas } from '@/components/game/game-shell'
import { Callout } from '@/components/ui'
import {
  practiceErrorMessage,
  practiceResultSchema,
  type PracticeResult,
} from '@/lib/practice/contracts'
import { savePracticeCheckpoint, type PracticeCheckpoint } from './storage'

type Submission =
  | { readonly phase: 'waiting' | 'verifying' }
  | { readonly phase: 'done'; readonly result: PracticeResult }
  | { readonly phase: 'failed'; readonly message: string }

export function PracticeRun({
  descriptor,
  checkpoint,
  onPlayAgain,
  onInvalid,
  pending,
}: {
  readonly descriptor: RunDescriptor
  readonly checkpoint?: PracticeCheckpoint
  readonly onPlayAgain: () => void
  readonly onInvalid: (message: string) => void
  readonly pending: boolean
}) {
  const dependencies = useMemo(() => createFullCareerDependencies(), [])
  const controller = useMemo(() => {
    // Check current versions/content even when a snapshot is present. No silent migration.
    try {
      if (checkpoint !== undefined) {
        const current = createFullCareerRunDescriptor(descriptor.seed, {
          runId: descriptor.runId,
          mode: 'practice',
        })
        if (
          !current.ok ||
          canonicalize(current.value) !== canonicalize(descriptor)
        )
          return undefined
      }
      return createGameController(descriptor, dependencies, {}, checkpoint)
    } catch {
      return undefined
    }
  }, [descriptor, dependencies, checkpoint])

  useEffect(() => {
    if (controller === undefined)
      onInvalid('La versión de esta práctica cambió. Empezá una nueva.')
  }, [controller, onInvalid])

  if (controller === undefined)
    return (
      <p role="status" className="text-body text-ink p-4">
        No pudimos recuperar la práctica.
      </p>
    )
  return (
    <ActivePractice
      controller={controller}
      dependencies={dependencies}
      onPlayAgain={onPlayAgain}
      pending={pending}
    />
  )
}

function ActivePractice({
  controller,
  dependencies,
  onPlayAgain,
  pending,
}: {
  readonly controller: ReturnType<typeof createGameController>
  readonly dependencies: ReturnType<typeof createFullCareerDependencies>
  readonly onPlayAgain: () => void
  readonly pending: boolean
}) {
  const run = useControllerSelector(controller, (current) => current.run)
  const log = useControllerSelector(controller, (current) => current.log)
  const [saveFailed, setSaveFailed] = useState(false)
  const [submission, setSubmission] = useState<Submission>({ phase: 'waiting' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const save = () => {
      const current = controller.getState()
      setSaveFailed(!savePracticeCheckpoint(current.run, current.log))
    }
    // Subscribe synchronously for each accepted command, including CONTINUE.
    const unsubscribe = controller.subscribe(save)
    const initial = setTimeout(save, 0)
    return () => {
      clearTimeout(initial)
      unsubscribe()
    }
  }, [controller])

  useEffect(() => {
    if (run.status !== 'completed') return
    const abort = new AbortController()
    async function verify() {
      setSubmission({ phase: 'verifying' })
      try {
        const response = await fetch('/api/practice/runs/verify', {
          method: 'POST',
          credentials: 'omit',
          signal: abort.signal,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ actionLog: serializeActionLog(log) }),
        })
        const body: unknown = await response.json()
        if (abort.signal.aborted) return
        if (!response.ok) {
          setSubmission({
            phase: 'failed',
            message: practiceErrorMessage(body),
          })
          return
        }
        const result = practiceResultSchema.safeParse(
          typeof body === 'object' && body !== null && 'result' in body
            ? body.result
            : undefined,
        )
        if (!result.success || result.data.runId !== log.descriptor.runId)
          throw new Error('invalid practice result')
        setSubmission({ phase: 'done', result: result.data })
      } catch {
        if (!abort.signal.aborted)
          setSubmission({
            phase: 'failed',
            message:
              'No pudimos conectar para calcular el puntaje. Tu avance se conserva; reintentá cuando tengas conexión.',
          })
      }
    }
    void verify()
    return () => abort.abort()
  }, [log, run.status, retry])

  const closed = useMemo(
    () => (run.status === 'completed' ? closeCareer(run) : undefined),
    [run],
  )

  const result: EndingResult =
    submission.phase === 'done'
      ? {
          kind: 'practice',
          phase: 'done',
          fairScore: submission.result.fairScore,
        }
      : submission.phase === 'failed'
        ? {
            kind: 'practice',
            phase: 'failed',
            message: submission.message,
            onRetry: () => setRetry((value) => value + 1),
          }
        : { kind: 'practice', phase: 'verifying' }

  return (
    <main>
      {saveFailed ? (
        <div className="max-w-viewport px-gutter mx-auto pt-4">
          <Callout title="No se puede guardar el avance">
            Podés seguir jugando, pero si recargás vas a perder el avance.
          </Callout>
        </div>
      ) : null}
      {closed === undefined ? (
        <GameCanvas>
          <RunView controller={controller} dependencies={dependencies} />
        </GameCanvas>
      ) : (
        <>
          <GameCanvas>
            <CareerEpilogueView
              ending={{
                state: run,
                epilogue: closed.epilogue,
                milestones: closed.milestones,
                memories: closed.memories,
              }}
              result={result}
              playAgainDisabled={pending}
              onPlayAgain={() => {
                if (!pending) onPlayAgain()
              }}
            />
          </GameCanvas>
          {pending ? (
            <p
              role="status"
              className="text-meta text-ink-secondary max-w-viewport px-gutter mx-auto pb-8"
            >
              Preparando otra práctica…
            </p>
          ) : null}
        </>
      )}
    </main>
  )
}
