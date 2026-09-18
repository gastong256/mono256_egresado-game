import { describe, expect, it } from 'vitest'
import type { InteractionPresentation } from '@/game'
import { responseSpaceOf } from '../helpers/blind-strategy-space'

function quantityView(
  maxima: readonly number[],
): Extract<InteractionPresentation, { kind: 'quantity-builder' }> {
  return {
    kind: 'quantity-builder',
    instructions: 'Construí',
    data: [],
    items: maxima.map((maxQuantity, index) => ({
      id: `nuevo-${String(index)}`,
      label: 'Ítem',
      detail: 'Cantidad disponible',
      maxQuantity,
    })),
  }
}

describe('descubrimiento de respuestas constantes sin conocer la Template', () => {
  it('enumera el producto completo con IDs nuevos, incluidos los extremos', () => {
    const space = responseSpaceOf(quantityView([2, 3, 4]))!
    const keys = space.constantKeys!()
    expect(keys).toHaveLength(60)
    expect(new Set(keys).size).toBe(60)
    expect(space.resolve!('2-3-4')?.answer).toEqual({
      kind: 'quantity-builder',
      lines: [
        { itemId: 'nuevo-0', quantity: 2 },
        { itemId: 'nuevo-1', quantity: 3 },
        { itemId: 'nuevo-2', quantity: 4 },
      ],
    })
    expect(keys).toContain('0-0-0')
  })
  it('detecta cambios de máximos y de identidad, sin mirar la solución', () => {
    const original = quantityView([2, 3])
    const changed = quantityView([2, 4])
    const renamed = {
      ...original,
      items: original.items.map((item) => ({ ...item, id: `${item.id}-otro` })),
    }
    expect(responseSpaceOf(original)?.signature).not.toBe(
      responseSpaceOf(renamed)?.signature,
    )
    expect(responseSpaceOf(original)?.signature).not.toBe(
      responseSpaceOf(changed)?.signature,
    )
    expect(responseSpaceOf(original)?.signature).toBe(
      responseSpaceOf({ ...original, instructions: 'Otra historia' })
        ?.signature,
    )
  })
  it('ofrece las cinco políticas de cantidades, todas reproducibles', () => {
    const first = responseSpaceOf(quantityView([2, 3, 4]))!
    expect(first.policies.map((p) => p.name)).toEqual([
      'todo al mínimo',
      'todo al máximo',
      'mitad del máximo',
      'primer ítem al máximo',
      'proporciones iguales',
    ])
    expect(first.policies).toEqual(
      responseSpaceOf(quantityView([2, 3, 4]))?.policies,
    )
  })
})
