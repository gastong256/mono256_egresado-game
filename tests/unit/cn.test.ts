import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/ui/cn'

/**
 * Composición de clases.
 *
 * Estos casos existen por un bug real: `tailwind-merge` no reconocía
 * `text-heading` como un tamaño, lo clasificaba como color y borraba
 * `text-primary-foreground`. El resultado eran botones primarios con tinta
 * oscura sobre verde, sin que fallara ningún test ni ningún tipo.
 *
 * Cada escala propia del sistema de diseño tiene que quedar cubierta acá: si
 * alguien agrega un rol tipográfico y se olvida de declararlo en `cn`, esto
 * falla en lugar de degradar el contraste en silencio.
 */
describe('cn', () => {
  it('no deja que un rol tipográfico pise un color', () => {
    expect(cn('text-primary-foreground', 'text-heading')).toBe(
      'text-primary-foreground text-heading',
    )
    expect(cn('text-data-foreground', 'text-data')).toBe(
      'text-data-foreground text-data',
    )
  })

  it('resuelve el conflicto entre dos roles tipográficos', () => {
    expect(cn('text-body', 'text-heading')).toBe('text-heading')
    expect(cn('text-data', 'text-data-lg')).toBe('text-data-lg')
    expect(cn('text-display', 'text-caption')).toBe('text-caption')
  })

  it('resuelve el conflicto entre dos colores', () => {
    expect(cn('text-foreground', 'text-primary-foreground')).toBe(
      'text-primary-foreground',
    )
    expect(cn('bg-surface', 'bg-primary')).toBe('bg-primary')
    expect(cn('border-line', 'border-line-selected')).toBe(
      'border-line-selected',
    )
  })

  it('resuelve las escalas propias de forma y movimiento', () => {
    expect(cn('rounded-surface', 'rounded-card')).toBe('rounded-card')
    expect(cn('shadow-surface', 'shadow-raised')).toBe('shadow-raised')
    expect(cn('motion-fast', 'motion-emphasized')).toBe('motion-emphasized')
    expect(cn('px-4', 'px-gutter')).toBe('px-gutter')
    expect(cn('pb-2', 'pb-safe')).toBe('pb-safe')
  })

  it('deja pasar condicionales y valores vacíos', () => {
    expect(cn('bg-surface', false, undefined, null, 'p-4')).toBe(
      'bg-surface p-4',
    )
  })
})
