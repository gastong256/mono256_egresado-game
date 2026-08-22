'use client'

/**
 * Challenge frame.
 *
 * Composes the narrative, the interaction and the submit control for one
 * challenge. It owns exactly one piece of local state — the answer draft — and
 * clears it only when the challenge instance changes, so a re-render never
 * discards what the player typed.
 *
 * It contains no game rules: the draft is handed to the engine and the verdict
 * comes back from there.
 */

import { useCallback, useState } from 'react'

import type { InteractionAnswer, PublicChallengeView, ToolId } from '@/game'
import { InteractionArea, isDraftSubmittable } from './interaction-area'

/**
 * Nombre de cada herramienta en castellano.
 *
 * El motor las identifica con un id estable; el jugador lee una palabra. Sin
 * esto la pantalla mostraría `calculator` en medio de un texto en castellano.
 */
const TOOL_LABEL: Readonly<Record<ToolId, string>> = {
  calculator: 'calculadora',
  notepad: 'anotador',
  table: 'tabla',
  ruler: 'regla',
}

function toolLabel(tool: ToolId): string {
  return TOOL_LABEL[tool] ?? tool
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
  // Keying the draft to the instance id resets it when — and only when — a new
  // challenge is presented.
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
    // Guarding here as well as on the button prevents a double submission from
    // a fast double-tap; the engine refuses the second one regardless.
    if (!isDraftSubmittable(view.interaction, draft)) {
      return
    }
    onSubmit(draft)
  }, [draft, onSubmit, view.interaction])

  return (
    <article className="flex flex-col gap-4" aria-labelledby="challenge-title">
      <header className="flex flex-col gap-1">
        <h2 id="challenge-title" className="text-xl font-semibold text-balance">
          {view.narrative.title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {storyletTitle}: {storyletText}
        </p>
        <p className="text-pretty">{view.narrative.setup}</p>
        <p className="font-medium text-pretty">{view.narrative.goal}</p>
      </header>

      <InteractionArea
        presentation={view.interaction}
        draft={draft}
        disabled={disabled}
        onDraftChange={setDraft}
        onRequestInformation={onRequestInformation}
        instanceId={view.ref.instanceId}
      />

      {view.tools.length > 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Podés usar: {view.tools.map(toolLabel).join(', ')}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!submittable}
        onClick={handleSubmit}
        data-testid="submit-answer"
        className="min-h-11 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:focus-visible:outline-slate-100"
      >
        Confirmar
      </button>
    </article>
  )
}
