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
  it('ofrece políticas de cantidades deterministas y sin nombres repetidos', () => {
    const first = responseSpaceOf(quantityView([2, 3, 4]))!
    // Sin datos ni detalle numérico no hay capacidades impresas que leer, así
    // que no hay familias relativas: quedan las fracciones del máximo y los
    // órdenes fijos, que sólo necesitan los topes de cada casilla.
    expect(new Set(first.policies.map((policy) => policy.family))).toEqual(
      new Set([
        'NORMALIZED',
        'FIXED_PRIORITY',
        'SIMPLE_GREEDY',
        'DOMAIN_NAIVE',
      ]),
    )
    expect(new Set(first.policies.map((policy) => policy.name)).size).toBe(
      first.policies.length,
    )
    expect(first.policies).toEqual(
      responseSpaceOf(quantityView([2, 3, 4]))?.policies,
    )
  })

  it('lee la pantalla para las familias relativas, y sólo la pantalla', () => {
    const view: Extract<InteractionPresentation, { kind: 'quantity-builder' }> =
      {
        kind: 'quantity-builder',
        instructions: 'Construí',
        data: [
          { label: 'Cocina', value: '150', unit: 'minutos', constraint: true },
          { label: 'Ítem', value: '3', unit: 'pide' },
        ],
        items: [
          {
            id: 'uno',
            label: 'Ítem',
            detail: 'cuesta $1.200 · ocupa 10 min',
            maxQuantity: 8,
          },
          {
            id: 'dos',
            label: 'Ítem',
            detail: 'cuesta $900 · ocupa 25 min',
            maxQuantity: 6,
          },
        ],
      }
    const families = new Set(
      responseSpaceOf(view)?.policies.map((policy) => policy.family) ?? [],
    )
    for (const family of [
      'NORMALIZED',
      'VISIBLE_COPY',
      'TARGET_RELATIVE',
      'RESOURCE_RELATIVE',
      'FIXED_PRIORITY',
      'SIMPLE_GREEDY',
      'DOMAIN_NAIVE',
    ])
      expect(families).toContain(family)
    // Ninguna política puede exceder los máximos presentados: lo que el motor
    // rechazaría no es una estrategia, es una respuesta malformada.
    for (const policy of responseSpaceOf(view)?.policies ?? []) {
      if (policy.answer.kind !== 'quantity-builder') continue
      for (const line of policy.answer.lines) {
        const item = view.items.find((entry) => entry.id === line.itemId)!
        expect(line.quantity).toBeGreaterThanOrEqual(0)
        expect(line.quantity).toBeLessThanOrEqual(item.maxQuantity)
      }
    }
  })

  it('una capacidad con tasa impresa se convierte a la unidad de arriba', () => {
    const view: Extract<InteractionPresentation, { kind: 'quantity-builder' }> =
      {
        kind: 'quantity-builder',
        instructions: 'Construí',
        data: [
          {
            label: 'Laboratorio',
            value: '10',
            unit: 'minutos',
            constraint: true,
          },
          { label: 'La conexión sube', value: '180', unit: 'MB por minuto' },
        ],
        items: [
          { id: 'uno', label: 'A', detail: '300 MB cada una', maxQuantity: 10 },
          { id: 'dos', label: 'B', detail: '60 MB cada una', maxQuantity: 10 },
        ],
      }
    const names = (responseSpaceOf(view)?.policies ?? []).map(
      (policy) => policy.name,
    )
    // 10 min × 180 MB/min = 1800 MB de tope: la política existe y lo nombra.
    expect(names.some((name) => name.includes('Laboratorio a mb'))).toBe(true)
  })
})
