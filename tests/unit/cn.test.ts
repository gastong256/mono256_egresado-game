import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/ui/cn'

/**
 * Composición de clases.
 *
 * Estos casos existen por un bug real: `tailwind-merge` no reconocía un rol
 * tipográfico propio como un tamaño, lo clasificaba como color y borraba el
 * color del texto. El resultado eran botones primarios con la tinta heredada,
 * sin que fallara ningún test ni ningún tipo.
 *
 * Cada escala propia del sistema de diseño tiene que quedar cubierta acá: si
 * alguien agrega un rol tipográfico y se olvida de declararlo en `cn`, esto
 * falla en lugar de degradar el contraste en silencio.
 */
describe('cn', () => {
  it('no deja que un rol tipográfico pise un color', () => {
    expect(cn('text-ink', 'text-event-title')).toBe('text-ink text-event-title')
    expect(cn('text-display', 'text-event-title')).toBe('text-event-title')
    expect(cn('text-red', 'text-countdown')).toBe('text-red text-countdown')
    expect(cn('text-display', 'text-countdown')).toBe('text-countdown')
    expect(cn('text-on-action', 'text-action')).toBe(
      'text-on-action text-action',
    )
    expect(cn('text-ink', 'text-data-lg')).toBe('text-ink text-data-lg')
    expect(cn('text-ink-label', 'text-eyebrow')).toBe(
      'text-ink-label text-eyebrow',
    )
  })

  it('resuelve el conflicto entre dos roles tipográficos', () => {
    expect(cn('text-body', 'text-display')).toBe('text-display')
    expect(cn('text-data', 'text-data-lg')).toBe('text-data-lg')
    expect(cn('text-milestone', 'text-caption')).toBe('text-caption')
    expect(cn('text-goal', 'text-option')).toBe('text-option')
  })

  it('resuelve el conflicto entre dos colores', () => {
    expect(cn('text-ink', 'text-ink-secondary')).toBe('text-ink-secondary')
    expect(cn('bg-surface', 'bg-decision')).toBe('bg-decision')
    expect(cn('border-rule', 'border-ink')).toBe('border-ink')
  })

  it('distingue las dos familias del sistema', () => {
    expect(cn('font-body', 'font-display')).toBe('font-display')
  })

  it('resuelve las escalas propias de superficie y movimiento', () => {
    expect(cn('motion-select', 'motion-progress')).toBe('motion-progress')
    expect(cn('motion-enter', 'motion-resolve')).toBe('motion-resolve')
    expect(cn('text-shadow-aura', 'text-shadow-aura-sm')).toBe(
      'text-shadow-aura-sm',
    )
    expect(cn('px-4', 'px-gutter')).toBe('px-gutter')
    expect(cn('pb-2', 'pb-safe')).toBe('pb-safe')
  })

  it('no confunde el resplandor de Aura con un tamaño ni con un color', () => {
    // `text-shadow-aura` empieza con `text-`, así que sin declararlo tw-merge lo
    // clasificaría como tamaño o color y borraría el que viniera al lado.
    expect(cn('text-aura', 'text-shadow-aura')).toBe(
      'text-aura text-shadow-aura',
    )
    expect(cn('text-aura-gain', 'text-shadow-aura')).toBe(
      'text-aura-gain text-shadow-aura',
    )
  })

  it('deja pasar condicionales y valores vacíos', () => {
    expect(cn('bg-surface', false, undefined, null, 'p-4')).toBe(
      'bg-surface p-4',
    )
  })
})
