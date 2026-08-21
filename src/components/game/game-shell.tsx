'use client'

/**
 * Game shell.
 *
 * The reusable structural layer around a run: header with stage and stats,
 * progress, the content viewport, and the actions. It is deliberately plain —
 * this is the skeleton the eventual visual identity will dress, not the visual
 * identity itself.
 *
 * Layout follows the UX rules: mobile-first single column, readable at 360 px,
 * a single visible action at a time, and no meaning carried by colour alone.
 */

import { useCallback, useState } from 'react'

import type {
  EngineDependencies,
  InteractionAnswer,
  RunDescriptor,
} from '@/game'
import { ChallengeFrame } from './challenge-frame'
import type { GameController } from './controller'
import { DebugPanel } from './debug-panel'
import { FeedbackPanel } from './feedback-panel'
import { useGameRun } from './use-game-run'

const STAGE_LABEL: Readonly<Record<string, string>> = {
  'grade-7': '7.º grado',
  'year-1': '1.º año',
  'year-2': '2.º año',
  'year-3': '3.º año',
  'year-4': '4.º año',
  'year-5': '5.º año',
  graduation: 'Egreso',
}

export interface GameShellProps {
  readonly controller: GameController
  readonly dependencies: EngineDependencies
  /** Shows the developer diagnostics panel. Never enabled in production. */
  readonly showDebug?: boolean
  readonly onRestart?: () => RunDescriptor
}

export function GameShell({
  controller,
  dependencies,
  showDebug = false,
  onRestart,
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold" data-testid="stage-label">
            {STAGE_LABEL[state.run.stage] ?? state.run.stage}
          </h1>
          <p className="text-sm tabular-nums" data-testid="score-preview">
            Score estimado: <strong>{run.score}</strong>
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <progress
            className="h-2 w-full"
            max={run.progress.totalEvents}
            value={run.progress.eventsResolved}
            aria-label="Progreso de la carrera"
          />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Evento {run.progress.eventsResolved} de {run.progress.totalEvents}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          {(
            [
              ['Conocimiento', state.run.stats.knowledge],
              ['Equipo', state.run.stats.team],
              ['Iniciativa', state.run.stats.initiative],
              ['Energía', state.run.stats.energy],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-slate-600 dark:text-slate-400">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <main className="flex flex-col gap-4">
        {run.complete ? (
          <section
            aria-labelledby="run-complete"
            className="flex flex-col gap-3 rounded-lg border border-slate-300 p-4 dark:border-slate-600"
            data-testid="run-complete"
          >
            <h2 id="run-complete" className="text-xl font-semibold">
              Carrera terminada
            </h2>
            <p className="tabular-nums">
              Score estimado:{' '}
              <strong>{state.run.completion?.totalScore ?? 0}</strong>
            </p>
            <p>
              Perfil de egreso:{' '}
              <strong data-testid="profile">
                {state.run.completion?.profile.profileId ?? 'sin perfil'}
              </strong>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              El score oficial lo calcula el servidor reproduciendo la partida.
              Este número es una estimación local.
            </p>
            {onRestart === undefined ? null : (
              <button
                type="button"
                onClick={() => {
                  controller.restart(onRestart())
                }}
                className="min-h-11 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900"
              >
                Jugar otra vez
              </button>
            )}
          </section>
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
          <section
            aria-labelledby="narrative-title"
            className="flex flex-col gap-3"
            data-testid="narrative-card"
          >
            <h2 id="narrative-title" className="text-xl font-semibold">
              {active.title}
            </h2>
            <p className="text-pretty">{active.text}</p>
            <button
              type="button"
              onClick={advance}
              data-testid="continue"
              className="min-h-11 self-start rounded-lg bg-slate-900 px-4 py-2 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900"
            >
              Continuar
            </button>
          </section>
        ) : null}

        {state.lastRejection === undefined ? null : (
          <p role="status" className="text-sm" data-testid="rejection">
            El motor rechazó la acción: {state.lastRejection.kind}
          </p>
        )}
      </main>

      {showDebug ? (
        <footer>
          <button
            type="button"
            onClick={() => {
              setDebugOpen((open) => !open)
            }}
            aria-expanded={debugOpen}
            aria-controls="debug-panel"
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600"
          >
            {debugOpen ? 'Ocultar' : 'Mostrar'} diagnóstico
          </button>
          {debugOpen ? <DebugPanel state={state} /> : null}
        </footer>
      ) : null}
    </div>
  )
}
