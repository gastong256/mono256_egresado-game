import { cn } from '@/lib/ui/cn'

/**
 * Wordmark.
 *
 * Egresado no tiene logo todavía y este no es el momento de inventarle uno. La
 * marca es el nombre bien compuesto y un punto verde: repetido en la portada, en
 * la entrada y en el cierre del año, alcanza para que dos capturas se reconozcan
 * como el mismo producto.
 *
 * El punto es decorativo y está fuera del árbol de accesibilidad: el nombre ya
 * está escrito.
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
        'inline-flex items-baseline font-semibold tracking-tight',
        size === 'sm' && 'text-heading',
        size === 'md' && 'text-title',
        size === 'lg' && 'text-display',
        className,
      )}
    >
      Egresado
      <span
        aria-hidden="true"
        className={cn(
          'bg-primary ml-1 inline-block rounded-full',
          size === 'lg' ? 'size-2' : 'size-1.5',
        )}
      />
    </span>
  )
}
