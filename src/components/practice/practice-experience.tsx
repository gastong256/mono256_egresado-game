'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ACTION_LOG_VERSION, parseActionLog, type RunDescriptor } from '@/game'
import { Button, Callout, Eyebrow, Wordmark } from '@/components/ui'
import { practiceErrorMessage } from '@/lib/practice/contracts'
import {
  readPracticeCheckpoint,
  type PracticeCheckpoint,
  type PracticeStorageRead,
} from './storage'

// The full content/interaction bundle is needed only after starting or resuming.
const PracticeRun = dynamic(
  () => import('./practice-run').then((module) => module.PracticeRun),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="text-body text-ink px-gutter mx-auto py-6">
        Preparando tu práctica…
      </p>
    ),
  },
)

interface Session {
  readonly descriptor: RunDescriptor
  readonly checkpoint?: PracticeCheckpoint
}

export function PracticeExperience() {
  const [stored, setStored] = useState<PracticeStorageRead>()
  const [session, setSession] = useState<Session>()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string>()
  const [confirmNew, setConfirmNew] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setStored(readPracticeCheckpoint()), 0)
    return () => clearTimeout(timer)
  }, [])

  async function start() {
    if (pending) return
    setPending(true)
    setMessage(undefined)
    try {
      const response = await fetch('/api/practice/runs', {
        method: 'POST',
        credentials: 'omit',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        setMessage(practiceErrorMessage(body))
        return
      }
      const descriptor =
        typeof body === 'object' && body !== null && 'descriptor' in body
          ? body.descriptor
          : undefined
      const parsed = parseActionLog({
        version: ACTION_LOG_VERSION,
        descriptor,
        actions: [],
      })
      if (!parsed.ok || parsed.value.descriptor.mode !== 'practice')
        throw new Error('invalid practice response')
      setConfirmNew(false)
      setSession({ descriptor: parsed.value.descriptor })
    } catch {
      setMessage(
        'No pudimos conectar. Tu práctica anterior se conserva; volvé a intentar.',
      )
    } finally {
      setPending(false)
    }
  }

  function returnToIntro(error?: string) {
    setSession(undefined)
    setStored(
      error === undefined ? readPracticeCheckpoint() : { kind: 'invalid' },
    )
    setMessage(error)
    setConfirmNew(false)
  }

  return (
    <div className="min-h-dvh">
      <header className="bg-canvas border-rule sticky top-0 z-10 border-b">
        <div className="max-w-viewport px-gutter mx-auto flex min-h-14 flex-wrap items-center justify-between gap-x-3 py-2">
          <div>
            <Eyebrow>Modo práctica</Eyebrow>
            <p className="text-caption text-ink-secondary">
              No participa del ranking.
            </p>
          </div>
          {session === undefined ? (
            <Link
              href="/"
              prefetch={false}
              className="text-caption text-ink inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Volver al inicio
            </Link>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => returnToIntro()}>
              Guardar y salir
            </Button>
          )}
        </div>
      </header>
      {message === undefined || session === undefined ? null : (
        <div className="max-w-viewport px-gutter mx-auto pt-4">
          <Callout title="No pudimos continuar">{message}</Callout>
        </div>
      )}
      {session !== undefined ? (
        <PracticeRun
          key={session.descriptor.runId}
          descriptor={session.descriptor}
          {...(session.checkpoint === undefined
            ? {}
            : { checkpoint: session.checkpoint })}
          pending={pending}
          onPlayAgain={() => {
            void start()
          }}
          onInvalid={returnToIntro}
        />
      ) : (
        <main className="max-w-viewport px-gutter mx-auto py-6">
          <section className="eg-canvas border-rule flex flex-col gap-5 border p-4">
            <Wordmark size="lg" />
            <h1 className="text-section font-display text-ink text-balance">
              Probá Egresado sin competir.
            </h1>
            <p className="text-body text-ink-secondary">
              Recorré la secundaria completa, de 7.º a 5.º. Tu puntaje se
              calcula con las mismas reglas, pero esta práctica no aparece en el
              ranking ni modifica tu resultado competitivo.
            </p>
            <p className="text-meta text-ink-secondary">
              No te pedimos nombre, DNI ni año real. El avance se guarda en este
              navegador para que puedas continuar después.
            </p>
            {stored?.kind === 'unavailable' ? (
              <Callout title="No se puede guardar el avance">
                Podés jugar, pero este navegador bloquea el almacenamiento: si
                recargás, perderás el avance.
              </Callout>
            ) : null}
            {stored?.kind === 'invalid' ? (
              <Callout title="No pudimos recuperar la práctica">
                El avance guardado está dañado o corresponde a otra versión.
                Podés empezar una práctica nueva.
              </Callout>
            ) : null}
            {message === undefined ? null : (
              <Callout title="No pudimos continuar">{message}</Callout>
            )}
            {confirmNew ? (
              <>
                <p className="text-body text-ink">
                  Una práctica nueva reemplazará el avance guardado en este
                  navegador.
                </p>
                <Button
                  disabled={pending}
                  onClick={() => {
                    void start()
                  }}
                >
                  Empezar otra práctica
                </Button>
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() => setConfirmNew(false)}
                >
                  Conservar mi práctica
                </Button>
              </>
            ) : stored?.kind === 'saved' ? (
              <>
                <Button
                  onClick={() =>
                    setSession({
                      descriptor: stored.checkpoint.log.descriptor,
                      checkpoint: stored.checkpoint,
                    })
                  }
                  data-testid="practice-resume"
                >
                  Continuar práctica
                </Button>
                <Button variant="secondary" onClick={() => setConfirmNew(true)}>
                  Empezar otra práctica
                </Button>
              </>
            ) : (
              <Button
                disabled={pending || stored === undefined}
                onClick={() => {
                  void start()
                }}
                data-testid="practice-start"
              >
                {pending ? 'Preparando práctica…' : 'Empezar práctica'}
              </Button>
            )}
          </section>
        </main>
      )}
    </div>
  )
}
