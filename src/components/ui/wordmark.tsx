import { cn } from '@/lib/ui/cn'

/**
 * Wordmark.
 *
 * No es una imagen: es Schibsted Grotesk 800 con tracking −0,03em. Escala libre,
 * recolorea por token, sin pipeline de assets, y sigue siendo texto
 * seleccionable y buscable.
 *
 * Es la mitad tipográfica de la marca. La otra mitad, el isotipo, vive en
 * `BrandMark`, y `BrandLogo` compone las dos; ahí la palabra entra con
 * `size="inherit"` y toma tamaño y color del lockup.
 */
export function Wordmark({
  className,
  size = 'md',
}: {
  readonly className?: string
  readonly size?: 'sm' | 'md' | 'lg' | 'inherit'
}) {
  return (
    <span
      className={cn(
        'font-display inline-block',
        size !== 'inherit' && 'text-ink',
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
