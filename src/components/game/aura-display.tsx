import type { ReactNode } from 'react'

import { cn } from '@/lib/ui/cn'

import { formatAura } from './format'

/**
 * Aura: la única isla negra del sistema.
 *
 * Aura es capital narrativo —momentos memorables, no cálculos correctos—, y por
 * eso se lleva con **escala, brackets y luz** en vez de con un quinto color de
 * marca. El verde brillante `--aura-gain` sólo existe acá dentro: sobre papel
 * fallaría contraste, así que la regla se auto-impone.
 *
 * Nunca es una barra y nunca es un porcentaje. El signo va siempre explícito, así
 * que subir y bajar no dependen de distinguir verde de rojo.
 *
 * Cuatro magnitudes, todas sobre negro y todas con brackets:
 *
 * | Magnitud | Tratamiento |
 * |---|---|
 * | `chip`   | contorno, 13 px — sube y se desvanece |
 * | `note`   | borde verde y resplandor corto, 18 px |
 * | `feature`| la cifra grande con resplandor de 24 px |
 * | pérdida  | contorno rojo, sin resplandor. **Sin shake** — pica por callado |
 */

/** Los corchetes. Decorativos: la cifra ya está escrita al lado. */
function Brackets({ weight }: { readonly weight: 1.5 | 2 }) {
  const side = weight === 2 ? 'w-[13px]' : 'w-[6px]'
  const inset =
    weight === 2 ? 'top-[7px] bottom-[7px]' : 'top-[5px] bottom-[5px]'
  const border = weight === 2 ? 'border-2' : 'border-[1.5px]'

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'border-aura-bracket absolute left-1 border-r-0',
          side,
          inset,
          border,
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'border-aura-bracket absolute right-1 border-l-0',
          side,
          inset,
          border,
        )}
      />
    </>
  )
}

export function AuraBlock({
  value,
  size = 'feature',
  label = 'Aura',
  className,
}: {
  /** Con signo. Un delta en el panel de resultado, el total en el cierre. */
  readonly value: number
  readonly size?: 'feature' | 'note'
  readonly label?: string
  readonly className?: string
}) {
  const negative = value < 0

  return (
    <div
      data-surface="aura"
      data-testid="aura-block"
      className={cn(
        'bg-aura-surface relative text-center',
        size === 'feature' ? 'px-7 py-4' : 'px-5 py-3',
        className,
      )}
    >
      <Brackets weight={2} />
      <span
        data-numeric
        className={cn(
          'font-display block',
          size === 'feature' ? 'text-aura' : 'text-data-lg',
          negative
            ? 'text-aura-loss'
            : cn(
                'text-aura-gain',
                size === 'feature' ? 'text-shadow-aura' : 'text-shadow-aura-sm',
              ),
        )}
      >
        {formatAura(value)}
      </span>
      <span className="font-display text-aura-label mt-1 block text-[9.5px] font-bold tracking-[0.32em] uppercase">
        {label}
      </span>
    </div>
  )
}

/**
 * La celda de Aura del HUD.
 *
 * Sigue siendo un bloque negro con brackets incluso a 46 px de alto: ésa es su
 * firma a cualquier tamaño, y es lo que la separa de las cajas de papel de
 * Promedio y Equipo que tiene al lado.
 */
export function AuraCell({
  value,
  className,
}: {
  readonly value: number
  readonly className?: string
}) {
  const negative = value < 0

  return (
    <div
      data-surface="aura"
      className={cn(
        'bg-aura-surface relative flex min-h-[46px] shrink-0 flex-col justify-center gap-0.5 px-[17px] py-2',
        className,
      )}
    >
      <Brackets weight={1.5} />
      <span className="font-display text-aura-label text-[9px] font-bold tracking-[0.13em] uppercase">
        Aura
      </span>
      <span
        data-numeric
        className={cn(
          'font-display text-[20px] leading-none font-extrabold tracking-[-0.03em]',
          negative ? 'text-aura-loss' : 'text-aura-gain',
        )}
      >
        {formatAura(value)}
      </span>
    </div>
  )
}

/**
 * Aura chica, dentro del flujo del papel.
 *
 * Para un `+50` que no merece un bloque entero: contorno, 13 px, y aun así sobre
 * negro. Nunca sobre papel.
 */
export function AuraChip({
  value,
  children,
  className,
}: {
  readonly value: number
  readonly children?: ReactNode
  readonly className?: string
}) {
  return (
    <span
      data-surface="aura"
      className={cn(
        'bg-aura-surface font-display inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-bold',
        className,
      )}
    >
      <span
        data-numeric
        className={value < 0 ? 'text-aura-loss' : 'text-aura-gain'}
      >
        {formatAura(value)}
      </span>
      <span className="text-aura-label text-[9.5px] tracking-[0.2em] uppercase">
        {children ?? 'Aura'}
      </span>
    </span>
  )
}
