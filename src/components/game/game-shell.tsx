'use client'

/**
 * Shell de juego.
 *
 * Es la capa estructural estable alrededor de una run: ancho de la zona de
 * juego, encabezado de etapa, progreso, el contenido y las acciones. No sabe
 * nada de ningún desafío en particular; qué se dibuja adentro lo decide la fase
 * que devolvió el motor.
 *
 * Sigue las reglas de UX: columna única mobile-first, legible a 360 px, una sola
 * acción visible por vez, y nada cuyo significado dependa del color.
 */

import { useCallback, useState } from 'react'

import { Button, Separator, Surface } from '@/components/ui'
import type {
  EngineDependencies,
  InteractionAnswer,
  RunDescriptor,
} from '@/game'
import { cn } from '@/lib/ui/cn'

import { ChallengeFrame } from './challenge-frame'
import type { GameController } from './controller'
import { DebugPanel } from './debug-panel'
import { FeedbackPanel } from './feedback-panel'
import { NarrativeCard } from './narrative-card'
import { StageHeader, StageProgress } from './stage-header'
import { stageLabel } from './stage-label'
import { StatRow } from './stat-indicator'
import { useGameRun } from './use-game-run'

export interface GameShellProps {
  readonly controller: GameController
  readonly dependencies: EngineDependencies
  /** Muestra el panel de diagnóstico. Nunca se habilita en producción. */
  readonly showDebug?: boolean
  readonly onRestart?: () => RunDescriptor
  /** Se muestra en el encabezado para que la run se sienta del jugador. */
  readonly playerName?: string
}

/**
 * Geometría de la zona de juego.
 *
 * Un ancho máximo acotado en desktop: la lectura de un enunciado y la
 * comparación de cuatro opciones no mejoran por estirarse a 1200 px.
 */
export function GameCanvas({
  children,
  className,
}: {
  readonly children: React.ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-game px-gutter pb-safe mx-auto flex w-full flex-col gap-6 py-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function GameShell({
  controller,
  dependencies,
  showDebug = false,
  onRestart,
  playerName,
}: GameShellProps) {
  const run = useGameRun(controller, dependencies)
  const [debugOpen, setDebugOpen] = useState(false)
  const { state, dispatch } = run
  const active = state.run.activeEvent

  const submitAnswer = useCallback(
    (answer: InteractionAnswer) => {
      const instanceId = active?.challenge?.instanceId
      if (instanceId === undefined) {
        return
      }
      dispatch({ type: 'ANSWER', instanceId, answer })
    },
    [active?.challenge?.instanceId, dispatch],
  )

  const requestInformation = useCallback(
    (key: string) => {
      const instanceId = active?.challenge?.instanceId
      if (instanceId === undefined) {
        return
      }
      dispatch({ type: 'REQUEST_INFO', instanceId, key })
    },
    [active?.challenge?.instanceId, dispatch],
  )

  const advance = useCallback(() => {
    dispatch({ type: 'CONTINUE' })
  }, [dispatch])

  return (
    <GameCanvas>
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <StageHeader
            stage={stageLabel(state.run.stage)}
            {...(playerName === undefined ? {} : { playerName })}
          />
          <p
            data-numeric
            data-testid="score-preview"
            className="text-caption text-foreground-muted"
          >
            Puntaje{' '}
            <span className="text-foreground font-semibold">{run.score}</span>
          </p>
        </div>

        <StageProgress
          resolved={run.progress.eventsResolved}
          total={run.progress.totalEvents}
        />

        <Separator />

        <StatRow
          stats={[
            { label: 'Conocimiento', value: state.run.stats.knowledge },
            { label: 'Equipo', value: state.run.stats.team },
            { label: 'Iniciativa', value: state.run.stats.initiative },
            { label: 'Energía', value: state.run.stats.energy },
          ]}
        />
      </header>

      <div className="flex flex-col gap-4">
        {run.complete && state.run.completion !== undefined ? (
          <Surface
            as="section"
            tone="raised"
            padding="roomy"
            aria-labelledby="run-complete"
            className="flex flex-col gap-3"
            data-testid="run-complete"
          >
            <h2 id="run-complete" className="text-title">
              Carrera terminada
            </h2>
            {/* El motor garantiza que una run terminada trae su resultado, y el
                códec de snapshots rechaza un estado que diga lo contrario, así
                que estos valores nunca se sustituyen por un placeholder. */}
            <p data-numeric className="text-body">
              Puntaje estimado:{' '}
              <strong>{state.run.completion.totalScore}</strong>
            </p>
            <p className="text-body">
              Perfil de egreso:{' '}
              <strong data-testid="profile">
                {state.run.completion.profile.profileId}
              </strong>
            </p>
            <p className="text-caption text-foreground-muted">
              El puntaje oficial lo calcula el servidor reproduciendo la
              partida. Este número es una estimación local.
            </p>
            {onRestart === undefined ? null : (
              <Button
                onClick={() => {
                  controller.restart(onRestart())
                }}
              >
                Jugar otra vez
              </Button>
            )}
          </Surface>
        ) : state.run.phase === 'feedback' && state.run.pendingFeedback ? (
          <FeedbackPanel
            feedback={state.run.pendingFeedback}
            onContinue={advance}
          />
        ) : state.run.phase === 'challenge' && state.view && active ? (
          <ChallengeFrame
            view={state.view}
            storyletTitle={active.title}
            storyletText={active.text}
            disabled={!run.canAnswer}
            onSubmit={submitAnswer}
            onRequestInformation={requestInformation}
          />
        ) : active ? (
          <NarrativeCard
            title={active.title}
            actions={
              <Button size="lg" block onClick={advance} data-testid="continue">
                Continuar
              </Button>
            }
          >
            {active.text}
          </NarrativeCard>
        ) : null}

        {state.lastRejection === undefined ? null : (
          <p
            role="status"
            className="text-body-sm text-danger"
            data-testid="rejection"
          >
            El motor rechazó la acción: {state.lastRejection.kind}
          </p>
        )}
      </div>

      {showDebug ? (
        <footer>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDebugOpen((open) => !open)
            }}
            aria-expanded={debugOpen}
            aria-controls="debug-panel"
          >
            {debugOpen ? 'Ocultar' : 'Mostrar'} diagnóstico
          </Button>
          {debugOpen ? <DebugPanel state={state} /> : null}
        </footer>
      ) : null}
    </GameCanvas>
  )
}
