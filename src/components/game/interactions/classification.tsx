'use client'

/**
 * Clasificar enunciados: el modo Grid / Select / Classify.
 *
 * Cada enunciado recibe una etiqueta con un `select` nativo: teclado y tap
 * producen exactamente la misma respuesta y nada exige arrastrar. La lista es
 * una columna de filas, no una grilla ancha, así que entra a 320 px sin que la
 * página scrollee.
 *
 * La acción pública, cuando existe, vive en su propio bloque y con su propia
 * consigna. Eso es deliberado: clasificar es la acción matemática y la postura
 * es otra decisión, y el evaluador las lee de dos campos distintos.
 */

import { useId } from 'react'

import type { ClassificationEntry, InteractionPresentation } from '@/game'

type ClassificationPresentation = Extract<
  InteractionPresentation,
  { kind: 'classification' }
>

export interface ClassificationProps {
  readonly presentation: ClassificationPresentation
  readonly entries: readonly ClassificationEntry[]
  readonly stance: string | undefined
  readonly disabled: boolean
  readonly onChange: (value: {
    readonly entries: readonly ClassificationEntry[]
    readonly stance?: string
  }) => void
}

export function Classification({
  presentation: p,
  entries,
  stance,
  disabled,
  onChange,
}: ClassificationProps) {
  const prefix = useId()
  const chosenStance = p.stance?.options.find((option) => option.id === stance)

  const setLabel = (statementId: string, labelId: string) => {
    const next = [
      ...entries.filter((entry) => entry.statementId !== statementId),
      { statementId, labelId },
    ]
    onChange(
      stance === undefined ? { entries: next } : { entries: next, stance },
    )
  }

  return (
    <fieldset
      disabled={disabled}
      className="flex min-w-0 flex-col gap-3 border-0 p-0"
    >
      <legend className="sr-only">Clasificá cada afirmación</legend>
      <p className="text-body text-ink-secondary">{p.instructions}</p>

      <ul className="flex list-none flex-col gap-3 p-0">
        {p.statements.map((statement) => {
          const id = `${prefix}-${statement.id}`
          const value = entries.find(
            (entry) => entry.statementId === statement.id,
          )?.labelId
          return (
            <li
              key={statement.id}
              className="border-rule bg-surface flex min-w-0 flex-col gap-2 border p-3"
            >
              <label htmlFor={id} className="text-meta text-ink">
                {statement.label}
              </label>
              {statement.detail === undefined ? null : (
                <p className="text-caption text-ink-secondary tabular-nums">
                  {statement.detail}
                </p>
              )}
              <select
                id={id}
                value={value ?? ''}
                onChange={(event) => {
                  setLabel(statement.id, event.target.value)
                }}
                className="border-ink bg-surface text-ink text-option font-display block h-11 w-full border px-2"
              >
                <option value="" disabled>
                  Elegí una opción
                </option>
                {p.labels.map((label) => (
                  <option key={label.id} value={label.id}>
                    {label.label}
                  </option>
                ))}
              </select>
            </li>
          )
        })}
      </ul>

      {p.stance === undefined ? null : (
        <div className="border-ink bg-canvas-sunken flex min-w-0 flex-col gap-2 border-l-[3px] p-3">
          <label
            htmlFor={`${prefix}-stance`}
            className="text-meta text-ink font-bold"
          >
            {p.stance.prompt}
          </label>
          <select
            id={`${prefix}-stance`}
            value={stance ?? ''}
            onChange={(event) => {
              onChange({ entries, stance: event.target.value })
            }}
            className="border-ink bg-surface text-ink text-option font-display block h-11 w-full border px-2"
          >
            <option value="" disabled>
              Elegí qué hace el curso
            </option>
            {p.stance.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {/*
            Un `select` nativo recorta con puntos suspensivos lo que no entra
            en su ancho, y las posturas del curso son frases enteras: en un
            teléfono se leía «Publicar la tabla y lo que falta ju…». La
            elección se repite escrita debajo, completa, así lo que se va a
            confirmar nunca depende de abrir el desplegable de nuevo.
          */}
          {chosenStance === undefined ? null : (
            <p
              className="text-caption text-ink-secondary text-pretty"
              data-testid="stance-echo"
            >
              Elegiste: {chosenStance.label}
            </p>
          )}
        </div>
      )}
    </fieldset>
  )
}
