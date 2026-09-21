/**
 * Identidad semántica de las magnitudes que la auditoría compara (MAT-FC-001).
 *
 * La auditoría de cierre encontró que `resourceModels` ataba un vector de
 * costos a **cualquier** capacidad impresa cuya unidad se llamara igual. En
 * `y3.course-project-tech` la pantalla imprime dos restricciones en minutos
 * —la notebook prestada y el rato de laboratorio— y el detalle de cada ítem
 * imprime «N min de notebook»: se construía un tope espurio de 8 minutos contra
 * costos en minutos de notebook, y toda política de llenado se cortaba antes de
 * tiempo.
 *
 * Estas pruebas fijan la corrección por **clave semántica** y no por el texto
 * que hoy se renderiza: si mañana la etiqueta cambia, la prueba sigue midiendo
 * lo que importa —que dos magnitudes distintas no se confundan—.
 */
import { describe, expect, it } from 'vitest'
import type { InteractionPresentation } from '@/game'
import { responseSpaceOf } from '../helpers/blind-strategy-space'
import {
  dimensionKey,
  dimensionLabel,
  dimensionOf,
  dimensionsOf,
  figuresIn,
  labelNames,
} from '../helpers/blind-strategy-reading'

/** Dos capacidades en la misma unidad, y un costo que sólo pertenece a una. */
function twoMinuteBudgets(options: {
  readonly qualified: boolean
  readonly secondLabel: string
  readonly firstLabel?: string
}): Extract<InteractionPresentation, { kind: 'quantity-builder' }> {
  const suffix = options.qualified ? ' de notebook' : ''
  return {
    kind: 'quantity-builder',
    instructions: 'Construí',
    data: [
      {
        label: options.firstLabel ?? 'Notebook prestada',
        value: '30',
        unit: 'minutos',
        constraint: true,
      },
      {
        label: options.secondLabel,
        value: '8',
        unit: 'minutos',
        constraint: true,
      },
    ],
    items: [
      { id: 'a', label: 'A', detail: `1 min${suffix}`, maxQuantity: 10 },
      { id: 'b', label: 'B', detail: `2 min${suffix}`, maxQuantity: 10 },
    ],
  }
}

describe('MAT-FC-001 · las magnitudes se identifican por semántica, no por unidad', () => {
  it('una cifra con recurso nombrado no es la misma magnitud que una sin él', () => {
    const [plain] = figuresIn('5 min')
    const [owned] = figuresIn('5 min de notebook')
    expect(plain?.unit).toBe('min')
    expect(plain?.of).toBe('')
    expect(owned?.unit).toBe('min')
    expect(owned?.of).toBe('notebook')

    expect(plain).toBeDefined()
    expect(owned).toBeDefined()
    if (plain === undefined || owned === undefined) return
    // La clave es lo que la auditoría compara. Tienen que diferir.
    expect(dimensionKey(dimensionOf(plain))).not.toBe(
      dimensionKey(dimensionOf(owned)),
    )
  })

  it('dos recursos distintos en la misma unidad son dos magnitudes', () => {
    const notebook = figuresIn('4 min de notebook')
    const lab = figuresIn('4 min de laboratorio')
    const keys = [...notebook, ...lab].map((figure) =>
      dimensionKey(dimensionOf(figure)),
    )
    expect(new Set(keys).size).toBe(2)
    expect(dimensionsOf([...notebook, ...lab])).toHaveLength(2)
    // El mismo recurso, misma clave: la identidad es estable.
    expect(dimensionKey(dimensionOf(figuresIn('9 min de notebook')[0]!))).toBe(
      dimensionKey(dimensionOf(notebook[0]!)),
    )
  })

  it('una etiqueta nombra un recurso por palabra entera, no por prefijo', () => {
    expect(labelNames('Notebook prestada', 'notebook')).toBe(true)
    expect(labelNames('La NOTEBOOK del curso', 'notebook')).toBe(true)
    expect(labelNames('Laboratorio', 'notebook')).toBe(false)
    // `lab` no puede casar dentro de `laboratorio`.
    expect(labelNames('Laboratorio', 'lab')).toBe(false)
    // Sin recurso declarado, cualquier etiqueta sirve: no hay qué desambiguar.
    expect(labelNames('Lo que sea', '')).toBe(true)
  })

  it('el nombre legible de una magnitud dice de qué recurso es', () => {
    expect(dimensionLabel({ unit: 'min', of: '' })).toBe('min')
    expect(dimensionLabel({ unit: 'min', of: 'notebook' })).toBe(
      'min de notebook',
    )
  })

  /**
   * Qué capacidades quedaron **modeladas** como recurso.
   *
   * Copiar el número de una fila es otra familia y no dice nada del modelo: lo
   * que delata un tope es que existan políticas de fracción o de reparto de esa
   * capacidad, o que se pueda llenar sin pasarse de ella.
   */
  const modelled = (
    view: Extract<InteractionPresentation, { kind: 'quantity-builder' }>,
  ) => {
    const names = (responseSpaceOf(view)?.policies ?? []).map(
      (policy) => policy.name,
    )
    return (label: string) =>
      names.some(
        (name) =>
          name.includes(`de «${label}», repartido por consumo`) ||
          name.includes(`«${label}» en partes iguales`) ||
          name.startsWith(`llenar «${label}»`),
      )
  }

  it('una capacidad ajena no se ata a un costo que no le corresponde', () => {
    const has = modelled(
      twoMinuteBudgets({ qualified: true, secondLabel: 'Laboratorio' }),
    )
    // La capacidad que la pantalla sí nombra queda modelada…
    expect(has('Notebook prestada')).toBe(true)
    // …y la que no nombra ese recurso, no: ése era el tope espurio.
    expect(has('Laboratorio')).toBe(false)
  })

  it('sin recurso impreso el comportamiento por unidad se conserva', () => {
    const has = modelled(
      twoMinuteBudgets({ qualified: false, secondLabel: 'Laboratorio' }),
    )
    // La pantalla no dice de quién son esos minutos: se modelan las dos, que es
    // el comportamiento conservador de siempre.
    expect(has('Notebook prestada')).toBe(true)
    expect(has('Laboratorio')).toBe(true)
  })

  it('si ninguna etiqueta nombra el recurso, no se pierde la restricción', () => {
    // El costo dice «de notebook» y ninguna capacidad la nombra: la corrección
    // no puede dejar la Template sin ningún tope, así que vuelve a la unidad.
    const has = modelled(
      twoMinuteBudgets({
        qualified: true,
        firstLabel: 'Sala grande',
        secondLabel: 'Sala chica',
      }),
    )
    expect(has('Sala grande')).toBe(true)
    expect(has('Sala chica')).toBe(true)
  })
})
