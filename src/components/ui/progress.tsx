import { cn } from '@/lib/ui/cn'

/**
 * Progreso.
 *
 * Es un `<progress>` nativo: trae rol, valor y máximo sin ARIA a mano, y un
 * lector de pantalla lo anuncia como progreso aunque el CSS no cargue.
 *
 * Los pseudo-elementos de `::-webkit-progress-*` no aceptan clases de Tailwind,
 * así que la pista y el relleno se pintan con variantes arbitrarias apuntando a
 * tokens del sistema. Es una de las pocas excepciones legítimas a la regla de
 * no usar valores arbitrarios.
 */
export function Progress({
  value,
  max,
  label,
  className,
}: {
  readonly value: number
  readonly max: number
  readonly label: string
  readonly className?: string
}) {
  return (
    <progress
      value={value}
      max={max}
      aria-label={label}
      className={cn(
        'rounded-pill h-1.5 w-full appearance-none overflow-hidden',
        'bg-progress-track',
        '[&::-webkit-progress-bar]:bg-progress-track',
        '[&::-webkit-progress-value]:bg-progress-fill',
        '[&::-webkit-progress-value]:rounded-pill',
        '[&::-moz-progress-bar]:bg-progress-fill',
        className,
      )}
    />
  )
}
