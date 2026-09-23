'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import type { RunDescriptor } from '@/game'
import type { PlacementSnapshot } from '@/components/game/ending/ending-model'
import type {
  CompetitionErrorBody,
  IdentityFormConfig,
  IssuedAttemptPayload,
  PublicCompetitionState,
  SubmissionResponse,
} from '@/lib/competition'
import { BrandLogo, Button, Callout, Eyebrow } from '@/components/ui'
import { IdentityForm } from './identity-form'
import { Leaderboard } from './leaderboard'
import { EventCountdown, eventDeadline } from './event-countdown'
import { useAccessStatus } from './use-access-status'
import { GameModeSummary } from './game-mode-summary'
import { HomeHero } from './home-hero'
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
      /** El puesto y el podio tal como estaban al emitir: evidencia del cierre. */
      readonly before: PlacementSnapshot
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
  const accessStatus = useAccessStatus(state.competition)
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
    // Lo que el ranking decía de esta persona antes de jugar. El cierre lo
    // compara con lo que el servidor devuelva después: es lo que le permite
    // decir «subiste al 1.º puesto» sólo cuando pasó, y nunca inferirlo.
    const before: PlacementSnapshot = {
      rank: state.you?.rank,
      bestFairScore: state.you?.bestFairScore,
      topScore: state.leaderboard.find((entry) => entry.rank === 1)?.fairScore,
    }
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
        before,
      })
    } catch {
      setError('No pudimos conectarnos. Probá de nuevo.')
    } finally {
      setPending(false)
    }
  }, [refresh, state.leaderboard, state.you])

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
        before={screen.before}
        {...(state.you === undefined ? {} : { nickname: state.you.nickname })}
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
  const accessCompetition = { ...competition, status: accessStatus }
  const open = accessStatus === 'open'
  const hasCountdown = eventDeadline(accessCompetition) !== undefined

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
                  <BrandLogo size="lg" />
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
              {/*
                Marca y presentación comparten una fila. El bloque de acceso pone
                primero la acción; el reloj acompaña y conserva sus cifras.
              */}
              <div className="flex flex-col gap-6 pb-6 sm:gap-8 sm:pb-8">
                <header
                  className="grid items-center gap-6 md:grid-cols-2 md:gap-8"
                  data-testid="home-introduction"
                >
                  <div className="@container flex min-w-0 flex-col items-start gap-4">
                    <Eyebrow>
                      {competition.status === 'not-configured'
                        ? 'Un juego sobre decidir en la escuela'
                        : competition.name}
                    </Eyebrow>
                    <h1>
                      <BrandLogo size="event" />
                    </h1>
                  </div>
                  {/*
                    La promesa tiene dos tamaños. En un teléfono es una sola
                    línea debajo de la marca: en tres renglones de 25 px más
                    un párrafo, el estado de la competencia y el botón de
                    jugar quedaban debajo del pliegue de una pantalla de
                    360 × 740, y lo primero que alguien busca al abrir el
                    enlace en la feria es si puede jugar ahora. Desde tablet
                    hay ancho para la versión completa al lado de la marca.
                  */}
                  <div className="flex min-w-0 flex-col gap-3">
                    <p
                      className="text-goal font-display text-ink text-pretty md:hidden"
                      data-testid="home-promise-compact"
                    >
                      Tu secundaria. Tus decisiones.{' '}
                      <span className="text-green">Tu propia historia.</span>
                    </p>
                    <p className="text-section font-display text-ink hidden text-balance md:block">
                      Tu secundaria.
                      <br />
                      <span className="text-ink-secondary">
                        Tus decisiones.
                      </span>
                      <br />
                      <span className="text-green">Tu propia historia.</span>
                    </p>
                    <p className="text-body-lg text-ink-secondary max-w-viewport hidden text-pretty md:block">
                      Del primer día a la graduación. Resolvé situaciones, hacé
                      equipo y descubrí hasta dónde podés llegar.
                    </p>
                  </div>
                </header>
                <section
                  className={cn(
                    'grid min-w-0 gap-5',
                    open &&
                      'border-rule border-t-green bg-surface border border-t-[3px] p-3 sm:p-6',
                    hasCountdown && 'lg:grid-cols-2 lg:gap-x-6',
                  )}
                  aria-label="Estado y acceso a la competencia"
                  data-testid="home-access"
                >
                  <div className="flex min-w-0 flex-col gap-4">
                    <CompetitionStatusNote status={accessStatus} />
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
                            ? 'Todavía no tenés un puntaje en el ranking.'
                            : `Tu mejor puntaje: ${you.bestFairScore.toLocaleString('es-AR')}. Es el que cuenta en el ranking.`}
                        </p>
                      </div>
                    )}
                    {open ? (
                      <Button
                        // El único lima de la portada entra con el pop de
                        // resolución: es la acción de la pantalla y se nota.
                        className="group motion-resolve text-data-lg sm:text-section min-h-18 justify-between gap-3 px-3 text-left sm:min-h-20 sm:px-5"
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
                          className="text-display shrink-0 group-hover:translate-x-1 motion-reduce:transform-none"
                        >
                          →
                        </span>
                      </Button>
                    ) : null}
                  </div>
                  {hasCountdown ? (
                    <div className="flex min-w-0 flex-col">
                      <EventCountdown
                        competition={accessCompetition}
                        onElapsed={refresh}
                      />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      'flex min-w-0 flex-col gap-3',
                      hasCountdown && 'lg:col-span-2',
                    )}
                  >
                    {/*
                    Sin competencia abierta, practicar es lo único que se puede
                    jugar: toma el lugar del primario. Abierta, vuelve a ser un
                    botón secundario debajo del lima. Cerrada, los resultados ya
                    están en la página y un enlace lleva hasta ellos.
                  */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href="/test"
                        prefetch={false}
                        {...(open ? {} : { 'data-primary': 'true' })}
                        className={
                          open
                            ? 'text-action font-display border-ink text-ink hover:bg-canvas-sunken motion-select inline-flex min-h-11 items-center justify-center self-start border-[1.5px] px-5 uppercase'
                            : 'text-action bg-action text-on-action hover:bg-action-hover motion-resolve inline-flex min-h-[50px] w-full items-center justify-center px-6 uppercase'
                        }
                      >
                        Practicar
                      </Link>
                      {open ? (
                        <p className="text-caption text-ink-secondary">
                          Para conocer el juego.
                        </p>
                      ) : null}
                    </div>
                    {accessStatus === 'closed' ? (
                      <a
                        href="#ranking-heading"
                        className="text-action border-ink text-ink hover:bg-canvas-sunken inline-flex min-h-[46px] w-full items-center justify-center border-[1.5px] px-5 uppercase"
                      >
                        Ver resultados
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
                  </div>
                </section>
                <HomeHero />
              </div>
              {competition.status === 'closed' ? (
                <>
                  <Leaderboard
                    entries={state.leaderboard}
                    you={you}
                    total={state.totalRanked}
                    status={competition.status}
                    closesAt={competition.closesAt}
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
                    closesAt={competition.closesAt}
                  />
                </>
              )}
            </>
          )}
        </main>
        {screen.kind === 'landing' ? footer : null}
      </div>
    </div>
  )
}

function CompetitionStatusNote({
  status,
}: {
  readonly status: PublicCompetitionState['competition']['status']
}) {
  if (status === 'not-configured')
    return (
      <Callout title="Todavía no hay una competencia">
        El juego está listo, pero ningún organizador abrió una edición. Mientras
        tanto podés practicar; cuando se anuncie la próxima competencia, jugás
        acá.
      </Callout>
    )
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        status !== 'open' && 'border-ink border-t-2 pt-3',
      )}
    >
      <p
        className={cn(
          'text-label font-display uppercase',
          status === 'open' ? 'text-green' : 'text-ink-label',
        )}
      >
        {status === 'open' ? (
          <>
            <span className="text-green" aria-hidden="true">
              ●
            </span>{' '}
            Competencia abierta
          </>
        ) : status === 'upcoming' ? (
          '◷ Próximamente'
        ) : (
          '■ Competencia cerrada'
        )}
      </p>
      <h2
        className={cn(
          'font-display text-ink',
          status === 'open' ? 'text-display' : 'text-title',
        )}
      >
        {status === 'open'
          ? 'Ya podés jugar'
          : status === 'upcoming'
            ? 'Preparate para jugar'
            : 'Así terminó la competencia'}
      </h2>
      <p className="text-body text-ink-secondary">
        {status === 'open'
          ? 'Jugá todas las veces que quieras. Tu mejor puntaje es el que cuenta.'
          : status === 'upcoming'
            ? 'Cuando abra vas a poder jugar desde acá. Mientras tanto, podés practicar.'
            : 'El ranking queda publicado. Ya no se pueden empezar partidas nuevas.'}
      </p>
    </div>
  )
}
