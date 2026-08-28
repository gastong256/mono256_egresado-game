'use client'

/**
 * La run, dibujada.
 *
 * Es la única pieza que sabe cómo se arma una pantalla de juego completa:
 * encabezado, tira de carrera, escena, resultado y acción. Todo lo que muestra
 * sale del estado que devolvió el motor — formatea y compone; no calcula ninguna
 * regla, no evalúa ninguna respuesta y no decide cuándo termina un año.
 *
 * Sostiene dos cosas de estado local y ninguna es de dominio:
 *
 * - el **borrador** de la respuesta, que vive acá y no en el marco del desafío
 *   porque el primario puede estar en el bloque oscuro o en el slot de acción, y
 *   los dos tienen que poder enviarlo;
 * - nada más.
 *
 * **La invariante del primario** se resuelve en un solo lugar: `ownsPrimary`
 * decide quién lo monta, y el otro lado no monta nada. Es la garantía estructural
 * de que nunca hay dos botones lima en pantalla.
 */

import { useCallback, useState } from 'react'

import {
  canContinue,
  canSubmitAnswer,
  runProgress,
  type EngineDependencies,
  type InteractionAnswer,
} from '@/game'
import { Button } from '@/components/ui'

import { CareerChips } from './career-chips'
import { CareerStrip } from './career-strip'
import { ChallengeFrame, challengeOwnsPrimary } from './challenge-frame'
import type { GameController } from './controller'
import { FeedbackPanel } from './feedback-panel'
import { ActionSlot, GameSheet, SceneColumn, StageHeader } from './game-shell'
import { isDraftSubmittable } from './interaction-area'
import { NarrativeCard } from './situation-card'
import { OUTCOME } from './outcome'
import { stageLabel } from './stage-label'
import { useGameRun } from './use-game-run'

export interface RunViewProps {
  readonly controller: GameController
  readonly dependencies: EngineDependencies
}

export function RunView({ controller, dependencies }: RunViewProps) {
  const run = useGameRun(controller, dependencies)
  const { state, dispatch } = run
  const active = state.run.activeEvent
  const pending = state.run.pendingFeedback
  const view = state.view

  const [draft, setDraft] = useState<InteractionAnswer | undefined>(undefined)
  // Atar el borrador al id de la instancia lo reinicia cuando —y sólo cuando—
  // se presenta un desafío nuevo, así que un re-render nunca descarta lo que el
  // jugador venía armando.
  const instanceId = active?.challenge?.instanceId
  const [draftFor, setDraftFor] = useState<string | undefined>(instanceId)

  if (draftFor !== instanceId) {
    setDraftFor(instanceId)
    setDraft(undefined)
  }

  const submitAnswer = useCallback(() => {
    if (instanceId === undefined || draft === undefined) {
      return
    }
    dispatch({ type: 'ANSWER', instanceId, answer: draft })
  }, [dispatch, draft, instanceId])

  const requestInformation = useCallback(
    (key: string) => {
      if (instanceId === undefined) {
        return
      }
      dispatch({ type: 'REQUEST_INFO', instanceId, key })
    },
    [dispatch, instanceId],
  )

  const advance = useCallback(() => {
    dispatch({ type: 'CONTINUE' })
  }, [dispatch])

  /*
   * En una pantalla de desafío la prosa es el enunciado del desafío y no el
   * texto del storylet. Los dos están autorados, pero dicen lo mismo con otras
   * palabras —«todavía estás aprendiendo cuánto tarda el viaje» frente a «el 60
   * viene con demora otra vez»—, y apilarlos empuja la decisión abajo del
   * pliegue. El momento del año lo aporta el eyebrow, que es del storylet.
   */
  const progress = runProgress(state.run, dependencies.ruleset)
  const resolved = pending !== undefined

  // El id de la opción elegida sale del borrador, que es lo último que el
  // jugador confirmó: el motor guarda la evaluación, no la elección.
  const chosenId =
    draft !== undefined && 'optionId' in draft ? draft.optionId : undefined

  const resolution =
    resolved && view !== undefined
      ? { chosenId, tone: OUTCOME[pending.quality].tone }
      : undefined

  const ownsPrimary = view !== undefined && challengeOwnsPrimary(view, resolved)

  const submittable =
    view !== undefined &&
    canSubmitAnswer(state.run) &&
    isDraftSubmittable(view.interaction, draft)

  return (
    <GameSheet>
      <StageHeader
        stage={stageLabel(state.run.stage)}
        resolved={progress.eventsResolved}
        total={progress.totalEvents}
      />

      <CareerStrip career={state.run.career} />

      <SceneColumn>
        {view !== undefined && active !== undefined ? (
          <ChallengeFrame
            view={view}
            eyebrow={active.eyebrow}
            draft={draft}
            disabled={!canSubmitAnswer(state.run)}
            {...(resolution === undefined ? {} : { resolution })}
            {...(ownsPrimary
              ? {
                  action: (
                    <Button
                      surface="decision"
                      disabled={!submittable}
                      onClick={submitAnswer}
                      data-testid="submit-answer"
                    >
                      Confirmar
                    </Button>
                  ),
                }
              : {})}
            onDraftChange={setDraft}
            onRequestInformation={requestInformation}
          />
        ) : active !== undefined ? (
          <NarrativeCard
            eyebrow={active.eyebrow}
            title={active.title}
            effects={<CareerChips change={active.careerChange} />}
          >
            {active.text}
          </NarrativeCard>
        ) : null}

        {pending === undefined ? null : <FeedbackPanel feedback={pending} />}

        {ownsPrimary ? null : (
          <ActionSlot>
            {resolved || active?.challenge === undefined ? (
              <Button
                onClick={advance}
                disabled={!canContinue(state.run)}
                data-testid="continue"
              >
                Seguir
              </Button>
            ) : (
              <Button
                disabled={!submittable}
                onClick={submitAnswer}
                data-testid="submit-answer"
              >
                Confirmar
              </Button>
            )}
          </ActionSlot>
        )}

        {state.lastRejection === undefined ? null : (
          <p
            role="status"
            className="text-caption text-red"
            data-testid="rejection"
          >
            El motor rechazó la acción: {state.lastRejection.kind}
          </p>
        )}
      </SceneColumn>
    </GameSheet>
  )
}
