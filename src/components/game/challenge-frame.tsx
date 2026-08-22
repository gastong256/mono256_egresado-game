'use client'

/**
 * Marco de un desafío.
 *
 * Compone la situación, la interacción y el control de envío. Tiene exactamente
 * un estado local —el borrador de la respuesta— y lo limpia sólo cuando cambia
 * la instancia del desafío, así que un re-render nunca descarta lo que el
 * jugador venía armando.
 *
 * No contiene reglas de juego: el borrador se le entrega al motor y el veredicto
 * vuelve de ahí.
 */

import { Calculator, NotebookPen, Ruler, Table2 } from 'lucide-react'
import { useCallback, useState, type ComponentType } from 'react'

import { Button } from '@/components/ui'
import type { InteractionAnswer, PublicChallengeView, ToolId } from '@/game'

import { InteractionArea, isDraftSubmittable } from './interaction-area'
import { SituationCard } from './situation-card'

/**
 * Herramientas, en castellano y con ícono.
 *
 * El motor las identifica con un id estable; el jugador lee una palabra. El
 * ícono acompaña, nunca reemplaza: el nombre siempre está escrito.
 */
const TOOL: Readonly<
  Record<ToolId, { label: string; Icon: ComponentType<{ className?: string }> }>
> = {
  calculator: { label: 'calculadora', Icon: Calculator },
  notepad: { label: 'anotador', Icon: NotebookPen },
  table: { label: 'tabla', Icon: Table2 },
  ruler: { label: 'regla', Icon: Ruler },
}

export interface ChallengeFrameProps {
  readonly view: PublicChallengeView
  readonly storyletTitle: string
  readonly storyletText: string
  readonly disabled: boolean
  readonly onSubmit: (answer: InteractionAnswer) => void
  readonly onRequestInformation: (key: string) => void
}

export function ChallengeFrame({
  view,
  storyletTitle,
  storyletText,
  disabled,
  onSubmit,
  onRequestInformation,
}: ChallengeFrameProps) {
  const [draft, setDraft] = useState<InteractionAnswer | undefined>(undefined)
  // Atar el borrador al id de la instancia lo reinicia cuando —y sólo cuando—
  // se presenta un desafío nuevo.
  const [draftFor, setDraftFor] = useState<string>(view.ref.instanceId)

  if (draftFor !== view.ref.instanceId) {
    setDraftFor(view.ref.instanceId)
    setDraft(undefined)
  }

  const submittable = !disabled && isDraftSubmittable(view.interaction, draft)

  const handleSubmit = useCallback(() => {
    if (draft === undefined) {
      return
    }
    // Chequear también acá, y no sólo en el botón, evita un doble envío por un
    // doble toque rápido; el motor rechaza el segundo de todos modos.
    if (!isDraftSubmittable(view.interaction, draft)) {
      return
    }
    onSubmit(draft)
  }, [draft, onSubmit, view.interaction])

  return (
    <SituationCard
      title={view.narrative.title}
      context={`${storyletTitle}: ${storyletText}`}
      setup={view.narrative.setup}
      goal={view.narrative.goal}
      footnote={
        view.tools.length === 0 ? undefined : (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Podés usar:</span>
            {view.tools.map((tool) => {
              const { label, Icon } = TOOL[tool]
              return (
                <span key={tool} className="inline-flex items-center gap-1.5">
                  <Icon className="size-4" />
                  {label}
                </span>
              )
            })}
          </p>
        )
      }
      actions={
        <Button
          size="lg"
          block
          disabled={!submittable}
          onClick={handleSubmit}
          data-testid="submit-answer"
        >
          Confirmar
        </Button>
      }
    >
      <InteractionArea
        presentation={view.interaction}
        draft={draft}
        disabled={disabled}
        onDraftChange={setDraft}
        onRequestInformation={onRequestInformation}
        instanceId={view.ref.instanceId}
      />
    </SituationCard>
  )
}
