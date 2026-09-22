'use client'

/**
 * Marco de un desafío.
 *
 * Compone la situación sobre papel, el bloque oscuro de decisión y —una vez
 * resuelto— la marca de corrección sobre la opción elegida.
 *
 * No contiene reglas de juego ni estado: el borrador lo sostiene la vista de la
 * run, porque el primario puede vivir en dos lugares y los dos tienen que poder
 * enviarlo. Acá no se evalúa nada, ni siquiera para previsualizar.
 *
 * **El primario vive adentro del bloque oscuro mientras se decide.** Al resolver,
 * el bloque lo suelta y reaparece al final del shell, debajo del panel de
 * resultado: nunca hay dos primarios montados y nunca hay que scrollear para
 * atrás para continuar.
 *
 * La escena sale del registro de presentación por id de Template: una situación
 * con ilustración la monta debajo del título; una sin ilustración —o un
 * Repaso— se ve como siempre. La imagen no cambia nada de lo que se juega.
 */

import type { ReactNode } from 'react'

import type { OutcomeTone } from '@/components/ui'
import type { InteractionAnswer, PublicChallengeView } from '@/game'

import { DecisionBlock } from './decision-block'
import {
  interactionData,
  InteractionControls,
  missingRequirement,
  usesDecisionBlock,
} from './interaction-area'
import { SceneMedia } from './scene-media'
import { sceneForChallenge } from './scene-registry'
import { SituationCard } from './situation-card'

export interface ChallengeFrameProps {
  readonly view: PublicChallengeView
  /** El momento del año. Es el eyebrow rojo de la situación. */
  readonly eyebrow: string
  readonly draft: InteractionAnswer | undefined
  readonly disabled: boolean
  /**
   * Presente cuando el desafío ya se resolvió.
   *
   * Antes de esto no existe: es lo que hace estructuralmente imposible que una
   * opción tome color de resultado mientras se está decidiendo.
   */
  readonly resolution?: {
    readonly chosenId: string | undefined
    readonly tone: OutcomeTone
  }
  /** El primario, sólo si a este desafío le toca montarlo en el bloque oscuro. */
  readonly action?: ReactNode
  readonly onDraftChange: (answer: InteractionAnswer | undefined) => void
  readonly onRequestInformation: (key: string) => void
}

export function ChallengeFrame({
  view,
  eyebrow,
  draft,
  disabled,
  resolution,
  action,
  onDraftChange,
  onRequestInformation,
}: ChallengeFrameProps) {
  const resolved = resolution !== undefined
  const missing = missingRequirement(view.interaction, draft)
  const inDecisionBlock = usesDecisionBlock(view.interaction)
  const scene = sceneForChallenge(view)

  const controls = (
    <InteractionControls
      presentation={view.interaction}
      draft={draft}
      disabled={disabled || resolved}
      {...(resolution === undefined ? {} : { resolution })}
      onDraftChange={onDraftChange}
      onRequestInformation={onRequestInformation}
      instanceId={view.ref.instanceId}
    />
  )

  return (
    <SituationCard
      eyebrow={eyebrow}
      title={view.narrative.title}
      setup={view.narrative.setup}
      data={interactionData(view.interaction)}
      {...(scene === undefined
        ? {}
        : { media: <SceneMedia src={scene.src} /> })}
    >
      {inDecisionBlock ? (
        <DecisionBlock
          goal={view.narrative.goal}
          {...(action === undefined
            ? {}
            : {
                action: (
                  <>
                    {action}
                    {/* El deshabilitado nunca es la única explicación: si el
                        primario está apagado, esta línea dice por qué. */}
                    {missing === undefined ? null : (
                      <p className="text-caption text-on-decision-muted mt-2">
                        {missing}
                      </p>
                    )}
                  </>
                ),
              })}
        >
          {controls}
        </DecisionBlock>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-goal font-display text-ink">
            {view.narrative.goal}
          </p>
          {controls}
          {resolved || missing === undefined ? null : (
            <p className="text-caption text-ink-secondary">{missing}</p>
          )}
        </div>
      )}
    </SituationCard>
  )
}

/**
 * Si el bloque oscuro de este desafío monta el primario.
 *
 * La vista de la run la consulta para saber si tiene que montar el suyo. Es la
 * garantía de que nunca hay dos: si el bloque oscuro tiene el botón, el slot de
 * acción queda vacío.
 */
export function challengeOwnsPrimary(
  view: PublicChallengeView,
  resolved: boolean,
): boolean {
  return !resolved && usesDecisionBlock(view.interaction)
}
