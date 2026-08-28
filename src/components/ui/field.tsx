'use client'

import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * Campos de formulario.
 *
 * Un campo es una etiqueta visible, un control y —cuando corresponde— una ayuda
 * o un error asociados por `aria-describedby`. El placeholder nunca hace de
 * etiqueta: desaparece justo cuando el jugador escribe y necesita recordar qué
 * le estaban pidiendo.
 *
 * El error se anuncia con `role="alert"` y además marca `aria-invalid`, así que
 * el estado nunca depende de que el borde se vea rojo. La validación es al blur,
 * nunca por tecla: corregir a alguien mientras todavía está escribiendo el
 * número es ruido, no ayuda.
 */

const controlClasses = cn(
  'w-full border-ink bg-surface border-[1.5px]',
  'text-ink placeholder:text-ink-label',
  'motion-select',
  'disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled-ink',
  'aria-[invalid=true]:border-red',
)

interface FieldShellProps {
  readonly label: string
  readonly hint?: string
  readonly error?: string
  readonly htmlFor: string
  readonly describedBy: string
  readonly children: ReactNode
  readonly className?: string
}

function FieldShell({
  label,
  hint,
  error,
  htmlFor,
  describedBy,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="text-goal font-display text-ink">
        {label}
      </label>
      {children}
      {error === undefined ? (
        hint === undefined ? null : (
          <p id={describedBy} className="text-caption text-ink-secondary">
            {hint}
          </p>
        )
      ) : (
        <p
          id={describedBy}
          role="alert"
          className="text-caption font-display text-red"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'id' | 'type' | 'aria-invalid' | 'aria-describedby'
> {
  readonly label: string
  readonly hint?: string
  readonly error?: string
  readonly className?: string
}

export function TextField({
  label,
  hint,
  error,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId()
  const describedBy = `${id}-description`
  const described = error !== undefined || hint !== undefined

  return (
    <FieldShell
      label={label}
      {...(hint === undefined ? {} : { hint })}
      {...(error === undefined ? {} : { error })}
      htmlFor={id}
      describedBy={describedBy}
      {...(className === undefined ? {} : { className })}
    >
      <input
        id={id}
        type="text"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={described ? describedBy : undefined}
        className={cn(controlClasses, 'text-option font-display h-12 px-3')}
        {...rest}
      />
    </FieldShell>
  )
}

export interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'id' | 'type' | 'aria-invalid' | 'aria-describedby'
> {
  readonly label: string
  /** Unidad esperada. Se muestra junto al campo, no dentro del placeholder. */
  readonly unit?: string
  readonly hint?: string
  readonly error?: string
  readonly className?: string
}

export function NumberField({
  label,
  unit,
  hint,
  error,
  className,
  ...rest
}: NumberFieldProps) {
  const id = useId()
  const describedBy = `${id}-description`
  const unitId = `${id}-unit`
  const described = error !== undefined || hint !== undefined

  return (
    <FieldShell
      label={label}
      {...(hint === undefined ? {} : { hint })}
      {...(error === undefined ? {} : { error })}
      htmlFor={id}
      describedBy={describedBy}
      {...(className === undefined ? {} : { className })}
    >
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="number"
          // `decimal` abre el teclado numérico con coma en un teléfono; el
          // parseo exacto lo hace el motor, no este control.
          inputMode="decimal"
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={
            cn(
              described ? describedBy : '',
              unit === undefined ? '' : unitId,
            ).trim() || undefined
          }
          // Tabular y alineado a la derecha: es un número, y se compara con
          // otros números.
          className={cn(
            controlClasses,
            'text-data font-display h-12 px-3 text-right tabular-nums',
          )}
          {...rest}
        />
        {unit === undefined ? null : (
          <span id={unitId} className="text-meta text-ink-secondary shrink-0">
            {unit}
          </span>
        )}
      </div>
    </FieldShell>
  )
}
