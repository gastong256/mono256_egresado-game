import { cn } from '@/lib/ui/cn'

/**
 * Regla.
 *
 * Existe para que no haya doce variantes de `border-t` sueltas. Es decorativa:
 * la separación real de significado la hacen el espaciado y los encabezados, así
 * que se esconde del árbol de accesibilidad.
 *
 * `section` es el filete de 2 px de tinta que separa bloques mayores; `rule` es
 * la regla fina de 1 px.
 */
export function Separator({
  weight = 'rule',
  className,
}: {
  readonly weight?: 'rule' | 'section'
  readonly className?: string
}) {
  return (
    <hr
      role="presentation"
      className={cn(
        weight === 'section' ? 'border-ink border-t-2' : 'border-rule border-t',
        className,
      )}
    />
  )
}
