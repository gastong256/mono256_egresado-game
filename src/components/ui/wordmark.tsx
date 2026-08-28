import { cn } from '@/lib/ui/cn'

/**
 * Wordmark.
 *
 * No es una imagen: es Schibsted Grotesk 800 con tracking −0,03em. Escala libre,
 * recolorea por token, sin pipeline de assets, y sigue siendo texto
 * seleccionable y buscable.
 *
 * Egresado no tiene logo y éste no es el momento de inventarle uno. La marca es
 * el nombre bien compuesto sobre papel cuadriculado; el tilde verde vive en el
 * cierre de etapa, que es donde significa algo.
 */
export function Wordmark({
  className,
  size = 'md',
}: {
  readonly className?: string
  readonly size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <span
      className={cn(
        'font-display text-ink inline-block',
        size === 'sm' && 'text-[17px] font-extrabold tracking-[-0.03em]',
        size === 'md' && 'text-section',
        size === 'lg' && 'text-display',
        className,
      )}
    >
      Egresado
    </span>
  )
}
