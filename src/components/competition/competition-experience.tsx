'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import type { RunDescriptor } from '@/game'
import type {
  CompetitionErrorBody,
  IdentityFormConfig,
  IssuedAttemptPayload,
  PublicCompetitionState,
  SubmissionResponse,
} from '@/lib/competition'
import { Button, Callout, Eyebrow, Wordmark } from '@/components/ui'
import { IdentityForm } from './identity-form'
import { Leaderboard } from './leaderboard'
import { EventCountdown } from './event-countdown'
import { GameModeSummary } from './game-mode-summary'
import { PrivacySummary } from './privacy-summary'
import { cn } from '@/lib/ui/cn'

/**
 * La partida se carga aparte de la portada.
 *
 * `AttemptRun` arrastra el motor y **el contenido de los seis años**: las
 * veintiocho Templates, sus generadores de variantes y el catálogo aprobado de
 * 1031 entradas. Todo eso tiene que llegar al navegador —el juego es
 * local-first por ADR-006, y una carrera no puede pedirle un beat al servidor
 * por decisión—, pero no tiene que llegar **antes de la portada**.
 *
 * La diferencia importa donde el producto se juega. Quien abre el enlace en un
 * Android modesto sobre el Wi-Fi de una escuela llena quiere ver el ranking y
 * el formulario; el contenido de 5.º año no le sirve hasta que toque «Jugar».
 * Medido sobre el build de producción, separarlo saca ~1,3 MiB sin comprimir
 * (~340 KiB con gzip) de la primera pantalla.
 *
 * Y para que esa separación no se pague como una espera al apretar el botón,
 * el `prefetch` de abajo empieza a bajarlo en cuanto el estudiante entra a
 * identificarse: mientras completa cuatro campos y el servidor emite el
 * intento, el chunk ya está. La carga sólo se ve si alguien pasa de la portada
 * a jugar más rápido que su propia conexión, y en ese caso ver «Preparando la
 * partida…» es mejor que haber hecho esperar a todos los demás.
 */
const AttemptRun = dynamic(
  async () => (await import('./attempt-run')).AttemptRun,
  {
    ssr: false,
    loading: () => (
      <main className="px-gutter pb-safe flex min-h-dvh w-full justify-center py-6">
        <div className="max-w-viewport flex w-full flex-col gap-3">
          <p className="text-body-lg text-ink-secondary" role="status">
            Preparando la partida…
          </p>
        </div>
      </main>
    ),
  },
)

/** Empieza a bajar la partida antes de que alguien la pida. */
function prefetchAttemptRun(): void {
  void import('./attempt-run').catch(() => undefined)
}

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
  footer,
}: {
  readonly footer?: ReactNode
  readonly initialState: PublicCompetitionState
  readonly formConfig: IdentityFormConfig | undefined
}) {
  const [state, setState] = useState(initialState)
  const [screen, setScreen] = useState<Screen>({ kind: 'landing' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

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
    if (
      state.competition.status !== 'open' &&
      state.competition.status !== 'upcoming'
    )
      return
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
    // Quien ya tiene sesión entra a jugar desde la portada sin pasar por el
    // formulario, así que acá es donde empieza su descarga. La emisión del
    // intento tarda lo suyo y las dos cosas corren en paralelo.
    prefetchAttemptRun()
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
    <div className="px-gutter pb-safe mx-auto min-h-dvh w-full py-4 sm:py-8">
      <div
        className={cn(
          'mx-auto flex w-full flex-col',
          screen.kind === 'identify' ? 'max-w-viewport' : 'max-w-event',
        )}
      >
        <main className="eg-canvas border-rule flex min-w-0 flex-col border px-4 py-5 sm:px-6 sm:py-6">
          {screen.kind === 'identify' && formConfig !== undefined ? (
            <>
              <header className="mb-6">
                <h1>
                  <Wordmark size="lg" />
                </h1>
              </header>
              <IdentityForm
                config={formConfig}
                pending={pending}
                serverError={error}
                onSubmit={(submission) => {
                  void identify(submission)
                }}
              />
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  setScreen({ kind: 'landing' })
                }}
              >
                Volver
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-6 pb-6 sm:grid-cols-2 sm:gap-8 sm:pb-8">
                <header className="@container flex min-w-0 flex-col items-start gap-4">
                  <Eyebrow>
                    {competition.status === 'not-configured'
                      ? 'Juego de matemática escolar'
                      : competition.name}
                  </Eyebrow>
                  <h1>
                    <Wordmark className="text-event-title" />
                  </h1>
                  <p className="text-section font-display text-ink text-balance">
                    Tu secundaria.
                    <br />
                    Tus decisiones.
                    <br />
                    Tu lugar en el ranking.
                  </p>
                  <p className="text-body-lg text-ink-secondary max-w-viewport text-pretty">
                    Del primer día a la graduación. Resolvé situaciones, hacé
                    equipo y descubrí hasta dónde podés llegar.
                  </p>
                  <p
                    className="text-label font-display text-ink-label border-rule mt-auto border-t pt-4 tabular-nums"
                    aria-label="De séptimo a quinto año y graduación"
                  >
                    7.º → 1.º → 2.º → 3.º → 4.º → 5.º → Egreso
                  </p>
                </header>
                <section
                  className="flex min-w-0 flex-col gap-4"
                  aria-label="Estado y acceso a la competencia"
                >
                  <CompetitionStatusNote
                    status={competition.status}
                    name={competition.name}
                  />
                  {error === undefined ? null : (
                    <Callout tone="accent" title="No pudimos continuar">
                      {error}
                    </Callout>
                  )}
                  {you === undefined ? null : (
                    <div className="flex min-w-0 flex-col gap-1">
                      <p
                        className="text-title font-display text-ink [overflow-wrap:anywhere]"
                        data-testid="greeting"
                      >
                        Hola, {you.nickname}
                      </p>
                      <p className="text-meta text-ink-secondary tabular-nums">
                        {you.bestFairScore === undefined
                          ? 'Todavía no tenés una partida verificada.'
                          : `Tu mejor puntaje: ${you.bestFairScore.toLocaleString('es-AR')}`}
                      </p>
                    </div>
                  )}
                  {open ? (
                    <Button
                      className="group min-h-16 justify-between px-5"
                      disabled={
                        pending ||
                        (you === undefined && formConfig === undefined)
                      }
                      onClick={() => {
                        if (you !== undefined) {
                          void startAttempt()
                          return
                        }
                        setError(undefined)
                        prefetchAttemptRun()
                        setScreen({ kind: 'identify' })
                      }}
                      data-testid="play"
                    >
                      {pending
                        ? 'Preparando partida…'
                        : you?.activeAttempt !== undefined
                          ? 'Continuar partida'
                          : you !== undefined && you.attempts > 0
                            ? 'Jugar de nuevo'
                            : 'Jugar ahora'}
                      <span
                        aria-hidden="true"
                        className="text-section group-hover:translate-x-1 motion-reduce:transform-none"
                      >
                        →
                      </span>
                    </Button>
                  ) : null}
                  <Link
                    href="/test"
                    prefetch={false}
                    className="text-meta text-ink inline-flex min-h-11 items-center underline underline-offset-4"
                  >
                    Probar sin competir
                  </Link>
                  <EventCountdown
                    competition={competition}
                    onElapsed={() => {
                      void refresh()
                    }}
                  />
                  {open && formConfig !== undefined ? (
                    <a
                      href="#privacy"
                      className="text-caption text-ink-secondary inline-flex min-h-11 items-center underline underline-offset-4"
                    >
                      Tus datos y privacidad, antes de jugar
                    </a>
                  ) : null}
                  {you === undefined ? null : (
                    <Button
                      variant="ghost"
                      className="self-start px-0"
                      onClick={() => {
                        void forget()
                      }}
                      data-testid="not-me"
                    >
                      No soy yo
                    </Button>
                  )}
                </section>
              </div>
              {competition.status === 'closed' ? (
                <>
                  <Leaderboard
                    entries={state.leaderboard}
                    you={you}
                    total={state.totalRanked}
                    status={competition.status}
                  />
                  <GameModeSummary closed />
                </>
              ) : (
                <>
                  <GameModeSummary />
                  <Leaderboard
                    entries={state.leaderboard}
                    you={you}
                    total={state.totalRanked}
                    status={competition.status}
                  />
                </>
              )}
              <section
                className="border-rule border-t pt-5"
                aria-label="Privacidad antes de jugar"
              >
                {formConfig === undefined ? (
                  <p id="privacy" className="text-meta text-ink-secondary">
                    El aviso de privacidad estará disponible cuando se configure
                    la competencia. Todavía no se solicitan datos.
                  </p>
                ) : (
                  <PrivacySummary
                    notice={formConfig.privacyNotice}
                    id="privacy"
                  />
                )}
              </section>
            </>
          )}
        </main>
        {footer}
      </div>
    </div>
  )
}

function CompetitionStatusNote({
  status,
  name,
}: {
  readonly status: PublicCompetitionState['competition']['status']
  readonly name: string
}) {
  if (status === 'not-configured')
    return (
      <Callout title="Todavía no hay una competencia">
        El juego está listo, pero ningún organizador abrió una edición. Volvé
        cuando se anuncie la próxima competencia.
      </Callout>
    )
  return (
    <div className="border-ink flex flex-col gap-2 border-t-2 pt-3">
      <p className="text-label font-display text-ink-label uppercase">
        {status === 'open'
          ? '● Competencia abierta'
          : status === 'upcoming'
            ? '◷ Próximamente'
            : '■ Competencia cerrada'}
      </p>
      <h2 className="text-title font-display text-ink">
        {name}{' '}
        {status === 'open'
          ? 'está abierta'
          : status === 'upcoming'
            ? 'todavía no empezó'
            : 'cerró'}
      </h2>
      <p className="text-body text-ink-secondary">
        {status === 'open'
          ? 'Jugá, mejorá tu puntaje y buscá tu lugar en el podio.'
          : status === 'upcoming'
            ? 'La próxima partida puede ser la tuya. Volvé cuando se abra la competencia.'
            : 'El ranking queda publicado. Ya no se pueden empezar partidas nuevas.'}
      </p>
    </div>
  )
}
