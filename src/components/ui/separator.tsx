import { cn } from '@/lib/ui/cn'

/**
 * Separador.
 *
 * Existe para que no haya doce variantes de `border-t` sueltas. Es decorativo:
 * la separación real de significado la hace el espaciado y los encabezados, así
 * que se esconde del árbol de accesibilidad.
 */
export function Separator({ className }: { readonly className?: string }) {
  return (
    <hr role="presentation" className={cn('border-line border-t', className)} />
  )
}
