'use client'

/**
 * Elegir nombre.
 *
 * Lo único que se le pide al jugador antes de empezar. No hay email, edad,
 * escuela ni cuenta: el juego no necesita saber quién es para funcionar, y
 * pedir menos es la política de datos del proyecto.
 *
 * El nombre vive en la sesión, no en el motor: no entra en ningún cálculo
 * matemático ni en el replay.
 */

import { useId, useState } from 'react'

import {
  describeNicknameProblem,
  NICKNAME_MAX_LENGTH,
  normalizeNickname,
  validateNickname,
} from './session'

export function NicknameForm({
  onSubmit,
  stage,
}: {
  readonly onSubmit: (nickname: string) => void
  /** Cómo se llama la etapa que está por empezar, en castellano. */
  readonly stage: string
}) {
  const fieldId = useId()
  const errorId = `${fieldId}-error`
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  return (
    <form
      className="flex w-full flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const problem = validateNickname(value)
        if (problem !== undefined) {
          setError(describeNicknameProblem(problem))
          return
        }
        setError(undefined)
        onSubmit(normalizeNickname(value))
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId} className="text-base font-medium">
          ¿Cómo te decimos?
        </label>
        <input
          id={fieldId}
          name="nickname"
          type="text"
          value={value}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="go"
          maxLength={NICKNAME_MAX_LENGTH}
          aria-describedby={error === undefined ? undefined : errorId}
          aria-invalid={error === undefined ? undefined : true}
          onChange={(event) => {
            setValue(event.target.value)
            if (error !== undefined) {
              setError(undefined)
            }
          }}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:focus-visible:outline-slate-100"
        />
        {error === undefined ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sólo se usa para la tarjeta del final. No se guarda en ningún lado.
          </p>
        ) : (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-medium text-red-700 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="min-h-12 rounded-xl bg-slate-900 px-5 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:focus-visible:outline-slate-100"
      >
        Empezar {stage}
      </button>
    </form>
  )
}
