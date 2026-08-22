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
 * el estado no depende de que el borde se vea rojo.
 */

const controlClasses = cn(
  'w-full rounded-control border border-line-interactive bg-surface',
  'text-foreground placeholder:text-foreground-subtle',
  'motion-fast transition-[border-color]',
  'disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled-foreground',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:border-2',
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
      <label htmlFor={htmlFor} className="text-subheading text-foreground">
        {label}
      </label>
      {children}
      {error === undefined ? (
        hint === undefined ? null : (
          <p id={describedBy} className="text-caption text-foreground-muted">
            {hint}
          </p>
        )
      ) : (
        <p
          id={describedBy}
          role="alert"
          className="text-caption text-danger font-semibold"
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
        className={cn(controlClasses, 'text-heading h-12 px-4')}
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
          className={cn(controlClasses, 'text-data h-12 px-4 tabular-nums')}
          {...rest}
        />
        {unit === undefined ? null : (
          <span
            id={unitId}
            className="text-body-sm text-foreground-muted shrink-0"
          >
            {unit}
          </span>
        )}
      </div>
    </FieldShell>
  )
}
