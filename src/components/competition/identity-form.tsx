'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'

import {
  describeDniProblem,
  describeFullNameProblem,
  describeNicknameProblem,
  validateDni,
  validateFullName,
  validateNickname,
  type IdentityFormConfig,
} from '@/lib/competition'
import { Button, Callout, SelectField, TextField } from '@/components/ui'

/**
 * Identificación del participante, en una sola pantalla.
 *
 * Es una tarjeta y no un asistente de cinco pasos. La investigación sobre
 * formularios de evento es consistente en esto —cada paso que separa a alguien
 * de empezar pierde gente—, y acá son cuatro campos: no hay nada que escalonar.
 * El mismo formulario sirve para anotarse y para volver desde otro teléfono,
 * porque desde el lado del estudiante es la misma acción.
 *
 * Decisiones de campo que importan:
 *
 * - El documento es `type="text"` con `inputMode="numeric"`. Con `type="number"`
 *   la rueda del mouse cambia el valor sin que nadie lo toque, los ceros a la
 *   izquierda desaparecen y los navegadores aceptan `e` y `+`. Lo que se quiere
 *   es el teclado numérico, y eso lo da `inputMode`.
 * - `autoComplete="off"` en el documento: sin eso, un gestor de contraseñas
 *   ofrece tarjetas de crédito en un campo numérico de nueve dígitos.
 * - La validación corre al salir del campo, no por tecla: corregir a alguien
 *   mientras escribe es ruido.
 * - El primer error recibe el foco al enviar, así que quien navega con teclado
 *   o lector de pantalla no tiene que buscar qué falló.
 */
export function IdentityForm({
  config,
  pending,
  serverError,
  onSubmit,
}: {
  readonly config: IdentityFormConfig
  readonly pending: boolean
  readonly serverError: string | undefined
  readonly onSubmit: (submission: {
    readonly nickname: string
    readonly fullName: string
    readonly dni: string
    readonly schoolYear: string
    readonly division?: string
  }) => void
}) {
  const headingId = useId()
  const acknowledgementId = useId()
  const formRef = useRef<HTMLFormElement>(null)

  const [nickname, setNickname] = useState('')
  const [fullName, setFullName] = useState('')
  const [dni, setDni] = useState('')
  const [schoolYear, setSchoolYear] = useState('')
  const [division, setDivision] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const needsDivision = config.schoolDivisions.length > 0

  const errors = {
    nickname: (() => {
      const problem = validateNickname(nickname)
      return problem === undefined
        ? undefined
        : describeNicknameProblem(problem)
    })(),
    fullName: (() => {
      const problem = validateFullName(fullName)
      return problem === undefined
        ? undefined
        : describeFullNameProblem(problem)
    })(),
    dni: (() => {
      const problem = validateDni(dni)
      return problem === undefined ? undefined : describeDniProblem(problem)
    })(),
    schoolYear: schoolYear === '' ? 'Elegí tu año o curso.' : undefined,
    division:
      needsDivision && division === '' ? 'Elegí tu división.' : undefined,
  }

  /**
   * Qué error se muestra.
   *
   * Un campo vacío está mal desde el primer render y decirlo entonces sería
   * regañar a alguien por no haber escrito todavía. El error aparece cuando el
   * campo se deja —`touched`— o cuando se intenta enviar.
   */
  const visible = Object.fromEntries(
    Object.entries(errors).map(([field, error]) => [
      field,
      submitted || touched[field] === true ? error : undefined,
    ]),
  ) as Record<keyof typeof errors, string | undefined>

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setSubmitted(true)
    if (Object.values(errors).some((error) => error !== undefined)) {
      const invalid = formRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      )
      invalid?.focus()
      return
    }
    onSubmit({
      nickname,
      fullName,
      dni,
      schoolYear,
      ...(needsDivision ? { division } : {}),
    })
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-section font-display text-ink">
          Elegí cómo aparecer en el ranking
        </h2>
        <p className="text-meta text-ink-secondary text-pretty">
          Después van unos datos para validar que sos vos. Si ya jugaste antes,
          completá los mismos y seguís con tu alias.
        </p>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <TextField
          label="Alias"
          value={nickname}
          onChange={(event) => {
            setNickname(event.currentTarget.value)
          }}
          onBlur={() => {
            setTouched((current) => ({ ...current, nickname: true }))
          }}
          hint="Es lo único que se ve en el ranking. No hace falta tu nombre real."
          autoComplete="nickname"
          maxLength={40}
          {...(visible.nickname === undefined
            ? {}
            : { error: visible.nickname })}
        />

        <fieldset className="flex flex-col gap-4 border-0 p-0">
          <legend className="text-caption text-ink-secondary mb-1 text-pretty">
            Para validar tu participación
          </legend>

          <TextField
            label="Nombre y apellido"
            value={fullName}
            onChange={(event) => {
              setFullName(event.currentTarget.value)
            }}
            onBlur={() => {
              setTouched((current) => ({ ...current, fullName: true }))
            }}
            autoComplete="name"
            maxLength={120}
            {...(visible.fullName === undefined
              ? {}
              : { error: visible.fullName })}
          />

          <TextField
            label="DNI"
            value={dni}
            onChange={(event) => {
              setDni(event.currentTarget.value)
            }}
            onBlur={() => {
              setTouched((current) => ({ ...current, dni: true }))
            }}
            inputMode="numeric"
            autoComplete="off"
            maxLength={16}
            hint="Sólo los números. No guardamos el documento completo."
            {...(visible.dni === undefined ? {} : { error: visible.dni })}
          />

          <div className={needsDivision ? 'flex flex-wrap gap-3' : undefined}>
            <SelectField
              label="Año o curso"
              {...(needsDivision ? { className: 'min-w-[9rem] flex-1' } : {})}
              options={config.schoolYears.map((year) => ({
                value: year,
                label: year,
              }))}
              value={schoolYear}
              onChange={(event) => {
                setSchoolYear(event.currentTarget.value)
                setTouched((current) => ({ ...current, schoolYear: true }))
              }}
              placeholder="Elegí tu año"
              {...(visible.schoolYear === undefined
                ? {}
                : { error: visible.schoolYear })}
            />

            {needsDivision ? (
              <SelectField
                label="División"
                className="min-w-[7rem] flex-1"
                options={config.schoolDivisions.map((value) => ({
                  value,
                  label: value,
                }))}
                value={division}
                onChange={(event) => {
                  setDivision(event.currentTarget.value)
                  setTouched((current) => ({ ...current, division: true }))
                }}
                placeholder="Elegí"
                {...(visible.division === undefined
                  ? {}
                  : { error: visible.division })}
              />
            ) : null}
          </div>
        </fieldset>

        {serverError === undefined ? null : (
          <Callout tone="accent" title="No pudimos continuar">
            {serverError}
          </Callout>
        )}

        <p
          id={acknowledgementId}
          className="text-meta text-ink-secondary text-pretty"
        >
          Al elegir «Aceptar y jugar», confirmás que leíste y aceptás el
          tratamiento de datos explicado en la{' '}
          <Link
            href="/privacidad"
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-4"
          >
            Política de Privacidad
            <span className="sr-only"> (abre en otra pestaña)</span>
          </Link>{' '}
          para participar en la competencia.
        </p>
        <Button
          type="submit"
          disabled={pending}
          aria-describedby={acknowledgementId}
          data-testid="identity-submit"
        >
          {pending ? 'Un momento…' : 'Aceptar y jugar'}
        </Button>
      </form>
    </section>
  )
}
