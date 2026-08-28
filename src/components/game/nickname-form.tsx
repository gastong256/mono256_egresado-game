'use client'

/**
 * Elegir nombre.
 *
 * Lo único que se le pide al jugador antes de empezar. No hay email, edad,
 * escuela ni cuenta: el juego no necesita saber quién es para funcionar, y pedir
 * menos es la política de datos del proyecto.
 *
 * El nombre vive en la sesión, no en el motor: no entra en ningún cálculo
 * matemático ni en el replay.
 */

import { useState } from 'react'

import { Button, TextField } from '@/components/ui'

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
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  return (
    <form
      className="flex w-full flex-col gap-5"
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
      <TextField
        label="¿Cómo te decimos?"
        name="nickname"
        value={value}
        autoComplete="off"
        autoCapitalize="words"
        enterKeyHint="go"
        maxLength={NICKNAME_MAX_LENGTH}
        hint="Sólo se usa para la tarjeta del final. No se guarda en ningún lado."
        {...(error === undefined ? {} : { error })}
        onChange={(event) => {
          setValue(event.target.value)
          if (error !== undefined) {
            setError(undefined)
          }
        }}
      />

      <Button type="submit">Empezar {stage}</Button>
    </form>
  )
}
