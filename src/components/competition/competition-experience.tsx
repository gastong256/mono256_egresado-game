'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { RunDescriptor } from '@/game'
import type {
  CompetitionErrorBody,
  IdentityFormConfig,
  IssuedAttemptPayload,
  PublicCompetitionState,
  SubmissionResponse,
} from '@/lib/competition'
import { Button, Callout, Eyebrow, Wordmark } from '@/components/ui'
import { AttemptRun } from './attempt-run'
import { IdentityForm } from './identity-form'
import { Leaderboard } from './leaderboard'

/**
 * El producto público, entero.
 *
 * Un solo componente atraviesa los cinco momentos —portada, identificación,
 * listo, partida y resultado— porque para el estudiante son uno: entra, dice
 * quién es, juega y ve su puesto. No hay una URL por momento a propósito: una
 * partida no es una página, y darle dirección propia invitaría a compartirla, a
 * recargarla a la mitad y a volver con el botón de atrás en medio de una
 * decisión.
 *
 * El estado inicial llega renderizado desde el servidor, así que la portada y
 * el ranking se ven en la primera pintura sin esperar a ningún `fetch`.
 */

type Screen =
  | { readonly kind: 'landing' }
  | { readonly kind: 'identify' }
  | {
      readonly kind: 'playing'
      readonly attemptId: string
      readonly descriptor: RunDescriptor
    }

/** Cada cuánto se refresca el ranking mientras la competencia está abierta. */
const REFRESH_MS = 20_000

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as CompetitionErrorBody
    return body.error.message
  } catch {
    return 'Algo salió mal. Probá de nuevo.'
  }
}

export function CompetitionExperience({
  initialState,
  formConfig,
}: {
  readonly initialState: PublicCompetitionState
  readonly formConfig: IdentityFormConfig | undefined
}) {
  const [state, setState] = useState(initialState)
  const [screen, setScreen] = useState<Screen>({ kind: 'landing' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const statusRef = useRef<HTMLParagraphElement>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/competition/state', {
        cache: 'no-store',
      })
      if (!response.ok) return
      setState((await response.json()) as PublicCompetitionState)
    } catch {
      // Un refresco perdido no es un error del jugador: la próxima vuelta lo
      // resuelve y mostrar un cartel por cada bache de red sería ruido.
    }
  }, [])

  useEffect(() => {
    if (screen.kind === 'playing') return
    if (state.competition.status !== 'open') return
    const timer = setInterval(() => {
      void refresh()
    }, REFRESH_MS)
    return () => {
      clearInterval(timer)
    }
  }, [refresh, screen.kind, state.competition.status])

  const startAttempt = useCallback(async () => {
    setPending(true)
    setError(undefined)
    try {
      const response = await fetch('/api/competition/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
      if (!response.ok) {
        setError(await readError(response))
        await refresh()
        return
      }
      const payload = (await response.json()) as IssuedAttemptPayload
      setScreen({
        kind: 'playing',
        attemptId: payload.attemptId,
        // El descriptor viene del servidor y el motor lo valida al crear la
        // run: si estuviera alterado, `createRun` se negaría.
        descriptor: payload.descriptor as RunDescriptor,
      })
    } catch {
      setError('No pudimos conectarnos. Probá de nuevo.')
    } finally {
      setPending(false)
    }
  }, [refresh])

  const identify = useCallback(
    async (submission: {
      readonly nickname: string
      readonly fullName: string
      readonly dni: string
      readonly schoolYear: string
      readonly division?: string
    }) => {
      if (formConfig === undefined) return
      setPending(true)
      setError(undefined)
      try {
        const response = await fetch('/api/competition/participants', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ...submission,
            privacyNoticeVersion: formConfig.privacyNotice.version,
            privacyNoticeAcknowledged: true,
          }),
        })
        if (!response.ok) {
          setError(await readError(response))
          return
        }
        await refresh()
        setScreen({ kind: 'landing' })
        await startAttempt()
      } catch {
        setError('No pudimos conectarnos. Probá de nuevo.')
      } finally {
        setPending(false)
      }
    },
    [formConfig, refresh, startAttempt],
  )

  const forget = useCallback(async () => {
    await fetch('/api/competition/participants', { method: 'DELETE' })
    await refresh()
    setScreen({ kind: 'landing' })
  }, [refresh])

  const onVerified = useCallback((response: SubmissionResponse) => {
    setState(response.state)
  }, [])

  if (screen.kind === 'playing') {
    return (
      <AttemptRun
        attemptId={screen.attemptId}
        descriptor={screen.descriptor}
        onVerified={onVerified}
        onPlayAgain={() => {
          void startAttempt()
        }}
        onBackToRanking={() => {
          setScreen({ kind: 'landing' })
          void refresh()
        }}
      />
    )
  }

  const { competition, you } = state
  const open = competition.status === 'open'

  return (
    <main className="px-gutter pb-safe flex min-h-dvh w-full justify-center py-6">
      <div className="max-w-viewport flex w-full flex-col gap-3">
        <div className="eg-canvas border-rule flex min-h-[560px] flex-col gap-5 border px-4 py-[18px]">
          <header className="flex flex-col gap-3">
            <Eyebrow>Juego de matemática escolar</Eyebrow>
            <h1>
              <Wordmark size="lg" />
            </h1>
            <p className="text-section font-display text-ink text-balance">
              Seis años de secundaria en unos minutos.
            </p>
            <p className="text-body-lg text-ink-secondary text-pretty">
              Comprás la pintura del mural, decidís en qué colectivo te subís y
              repartís el trabajo grupal. Los números no son un ejercicio
              aparte: son lo que te deja decidir bien.
            </p>
          </header>

          <CompetitionStatusNote
            status={competition.status}
            name={competition.name}
            closesAt={competition.closesAt}
            opensAt={competition.opensAt}
          />

          {/*
            El error se dibuja una sola vez. Mientras el formulario está
            abierto, lo muestra el formulario —junto al campo que hay que
            corregir— y repetirlo acá arriba diría dos veces lo mismo.
          */}
          {error === undefined || screen.kind === 'identify' ? null : (
            <Callout tone="accent" title="No pudimos continuar">
              {error}
            </Callout>
          )}

          {screen.kind === 'identify' && formConfig !== undefined ? (
            <IdentityForm
              config={formConfig}
              pending={pending}
              serverError={error}
              onSubmit={(submission) => {
                void identify(submission)
              }}
            />
          ) : (
            <>
              {you === undefined ? null : (
                <section className="flex flex-col gap-2">
                  <p
                    ref={statusRef}
                    className="text-section font-display text-ink"
                    data-testid="greeting"
                  >
                    Hola, {you.nickname}
                  </p>
                  <p className="text-meta text-ink-secondary">
                    {you.bestFairScore === undefined
                      ? 'Todavía no tenés una partida verificada.'
                      : `Tu mejor puntaje: ${you.bestFairScore.toLocaleString('es-AR')}${
                          you.rank === undefined
                            ? ''
                            : ` · puesto ${String(you.rank)}`
                        }`}
                  </p>
                </section>
              )}

              <Leaderboard
                entries={state.leaderboard}
                you={you}
                total={state.totalRanked}
              />

              <RankingRule />
            </>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-4">
            {open && screen.kind === 'landing' ? (
              you === undefined ? (
                <Button
                  onClick={() => {
                    setError(undefined)
                    setScreen({ kind: 'identify' })
                  }}
                  data-testid="play"
                >
                  Jugar
                </Button>
              ) : (
                <Button
                  disabled={pending}
                  onClick={() => {
                    void startAttempt()
                  }}
                  data-testid="play"
                >
                  {you.attempts === 0 ? 'Jugar' : 'Jugar de nuevo'}
                </Button>
              )
            ) : null}

            {screen.kind === 'identify' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setScreen({ kind: 'landing' })
                }}
              >
                Volver
              </Button>
            ) : null}

            {you === undefined ? null : (
              <Button
                variant="secondary"
                onClick={() => {
                  void forget()
                }}
                data-testid="not-me"
              >
                No soy yo
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function formatDate(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toLocaleString('es-AR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
}

function CompetitionStatusNote({
  status,
  name,
  opensAt,
  closesAt,
}: {
  readonly status: PublicCompetitionState['competition']['status']
  readonly name: string
  readonly opensAt: string | undefined
  readonly closesAt: string | undefined
}) {
  if (status === 'not-configured') {
    return (
      <Callout title="Todavía no hay una competencia">
        El juego está listo, pero ningún organizador abrió una edición. Si sos
        docente, configurá la competencia antes de la feria.
      </Callout>
    )
  }

  if (status === 'upcoming') {
    const opens = formatDate(opensAt)
    return (
      <Callout title={`${name} todavía no empezó`}>
        {opens === undefined
          ? 'Volvé cuando el organizador la abra.'
          : `Abre el ${opens}.`}
      </Callout>
    )
  }

  if (status === 'closed') {
    return (
      <Callout title={`${name} cerró`}>
        El ranking queda publicado. Ya no se pueden empezar partidas nuevas.
      </Callout>
    )
  }

  const closes = formatDate(closesAt)
  return (
    <Callout title={`${name} está abierta`}>
      Jugás la carrera entera, de 7.º a 5.º año, y el servidor calcula tu
      puntaje. Podés jugar todas las veces que quieras: cuenta tu mejor partida.
      {closes === undefined ? '' : ` Cierra el ${closes}.`}
    </Callout>
  )
}

/**
 * La regla del ranking, dicha en una frase.
 *
 * Está a la vista y no escondida en un reglamento porque una competencia cuyo
 * criterio no se entiende se percibe como arbitraria, y eso es lo que un
 * ranking escolar no puede permitirse.
 */
function RankingRule() {
  return (
    <p className="text-caption text-ink-secondary text-pretty">
      Ordena el puntaje de la partida. Si dos personas empatan, comparten el
      puesto: no gana quien llegó primero ni quien jugó más rápido.
    </p>
  )
}
