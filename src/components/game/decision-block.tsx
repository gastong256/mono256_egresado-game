'use client'

import { useId, type ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

/**
 * El bloque de decisión.
 *
 * La única superficie oscura del juego además de Aura, y existe por una razón
 * concreta: **el foco cae donde hay que elegir**. Lo que v0.1 hacía con un canvas
 * negro entero, v0.2 lo hace en un bloque de 200 px — se conserva la mejor
 * propiedad del oscuro y se pierde la huella de juego de carrera deportiva.
 *
 * Ese cambio de superficie *es* la transición de estado: la decisión pasa en
 * oscuro y el resultado vuelve al papel, antes de que el color entre a jugar.
 *
 * Sangra hasta los bordes del shell con márgenes negativos. No es un truco de
 * maquetación: un bloque oscuro con papel a los costados se leería como una
 * tarjeta más, y lo que tiene que leerse es «la pantalla cambió de modo».
 *
 * El grupo es un `<fieldset>` nombrado con `aria-labelledby` en lugar de con un
 * `<legend>`. Un legend se renderiza sobre el borde del fieldset —fuera del
 * relleno—, así que sobre un bloque oscuro a sangre la consigna quedaba
 * flotando medio afuera. El nombre accesible es el mismo; las flechas entre
 * opciones las siguen dando los radios nativos de adentro.
 */
export function DecisionBlock({
  goal,
  children,
  action,
  className,
}: {
  /** La pregunta. Siempre arriba de las opciones. */
  readonly goal: string
  readonly children: ReactNode
  /**
   * El primario, sólo mientras la decisión está pendiente.
   *
   * Al resolver, el bloque suelta el botón y el primario reaparece al final del
   * shell, debajo del panel de resultado. Nunca hay dos primarios montados, y
   * nunca hay que scrollear para atrás para continuar.
   */
  readonly action?: ReactNode
  readonly className?: string
}) {
  const goalId = useId()

  return (
    <fieldset
      aria-labelledby={goalId}
      data-surface="decision"
      data-testid="decision-block"
      className={cn(
        'bg-decision -mx-4 mt-0.5 -mb-[18px] flex flex-col gap-[11px] px-4 pt-4 pb-[18px]',
        className,
      )}
    >
      <p id={goalId} className="text-goal font-display text-on-decision">
        {goal}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
      {action}
    </fieldset>
  )
}
