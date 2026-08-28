// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  Badge,
  Button,
  Callout,
  ChoiceCard,
  NumberField,
  QuantityStepper,
  StageProgress,
  Surface,
  TextField,
  Wordmark,
} from '@/components/ui'

/**
 * Primitivas de UI.
 *
 * Se prueba el comportamiento y la semántica, nunca la cadena de clases: si un
 * test se rompe porque cambió un `px-4`, el test estaba mirando el lugar
 * equivocado. Lo que sí importa es que un botón siga siendo un `<button>` y que
 * un error siga estando asociado a su campo.
 */

describe('Button', () => {
  it('es un button nativo y no un div con rol', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Confirmar</Button>)

    const button = screen.getByRole('button', { name: 'Confirmar' })
    expect(button.tagName).toBe('BUTTON')
    // Sin `type` explícito, un botón dentro de un formulario lo enviaría.
    expect(button).toHaveAttribute('type', 'button')

    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('se activa con teclado', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Continuar</Button>)

    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('deshabilitado no responde al clic', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Confirmar
      </Button>,
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('puede enviar un formulario cuando se lo pide', () => {
    render(
      <form aria-label="prueba">
        <Button type="submit">Empezar</Button>
      </form>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})

describe('ChoiceCard', () => {
  it('conserva la semántica de radio', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <ChoiceCard
        id="opt-a"
        name="grupo"
        value="a"
        label="Salir 06:45"
        detail="Llegás 07:27"
        selected={false}
        disabled={false}
        onSelect={onSelect}
      />,
    )

    const radio = screen.getByRole('radio', { name: /Salir 06:45/u })
    expect(radio).not.toBeChecked()

    await user.click(radio)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('se selecciona con el teclado', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <ChoiceCard
        id="opt-b"
        name="grupo"
        value="b"
        label="Salir 07:00"
        selected={false}
        disabled={false}
        onSelect={onSelect}
      />,
    )

    screen.getByRole('radio').focus()
    await user.keyboard(' ')
    expect(onSelect).toHaveBeenCalled()
  })

  it('expone el estado seleccionado a la tecnología asistiva', () => {
    render(
      <ChoiceCard
        id="opt-c"
        name="grupo"
        value="c"
        label="Salir 07:10"
        selected
        disabled={false}
        onSelect={vi.fn()}
      />,
    )

    // El estado no depende de ver un color: está en el propio control.
    expect(screen.getByRole('radio')).toBeChecked()
  })

  it('deshabilitado no se puede elegir', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <ChoiceCard
        id="opt-d"
        name="grupo"
        value="d"
        label="Salir 07:20"
        selected={false}
        disabled
        onSelect={onSelect}
      />,
    )

    expect(screen.getByRole('radio')).toBeDisabled()
    await user.click(screen.getByRole('radio'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('TextField', () => {
  it('asocia la etiqueta visible con el control', () => {
    render(<TextField label="¿Cómo te decimos?" />)
    expect(screen.getByLabelText('¿Cómo te decimos?')).toBeInTheDocument()
  })

  it('describe el campo con la ayuda mientras no hay error', () => {
    render(<TextField label="Nombre" hint="No se guarda en ningún lado." />)

    const field = screen.getByLabelText('Nombre')
    expect(field).not.toHaveAttribute('aria-invalid')
    const describedBy = field.getAttribute('aria-describedby')
    expect(describedBy).not.toBeNull()
    expect(document.getElementById(describedBy ?? '')?.textContent).toContain(
      'No se guarda',
    )
  })

  it('anuncia el error y marca el campo como inválido', () => {
    render(
      <TextField
        label="Nombre"
        hint="No se guarda en ningún lado."
        error="Poné al menos 2 caracteres."
      />,
    )

    const field = screen.getByLabelText('Nombre')
    expect(field).toHaveAttribute('aria-invalid', 'true')

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Poné al menos 2 caracteres.')
    expect(field.getAttribute('aria-describedby')).toBe(alert.id)
    // El error reemplaza a la ayuda: dos textos compitiendo confunden.
    expect(screen.queryByText('No se guarda en ningún lado.')).toBeNull()
  })
})

describe('NumberField', () => {
  it('abre teclado decimal y muestra la unidad fuera del placeholder', () => {
    render(<NumberField label="Tu respuesta" unit="litros" />)

    const field = screen.getByLabelText('Tu respuesta')
    expect(field).toHaveAttribute('type', 'number')
    expect(field).toHaveAttribute('inputmode', 'decimal')
    expect(screen.getByText('litros')).toBeInTheDocument()
    expect(field).not.toHaveAttribute('placeholder')
  })

  it('acepta decimales', async () => {
    const user = userEvent.setup()
    render(<NumberField label="Tu respuesta" unit="litros" />)

    const field = screen.getByLabelText('Tu respuesta')
    await user.type(field, '1.8')
    expect(field).toHaveValue(1.8)
  })
})

describe('QuantityStepper', () => {
  it('nombra los botones de ícono solo', () => {
    render(
      <QuantityStepper
        id="stepper"
        value={2}
        max={12}
        valueLabel="Cantidad de alfajores"
        decreaseLabel="Quitar un alfajor"
        increaseLabel="Agregar un alfajor"
        onChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Quitar un alfajor' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Agregar un alfajor' }),
    ).toBeInTheDocument()
    // Y el campo de cantidad también tiene nombre: un input numérico suelto sin
    // etiqueta es una violación crítica de accesibilidad.
    expect(
      screen.getByRole('spinbutton', { name: 'Cantidad de alfajores' }),
    ).toBeInTheDocument()
  })

  it('no baja del mínimo ni sube del máximo', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <QuantityStepper
        id="stepper"
        value={0}
        max={2}
        valueLabel="Cantidad"
        decreaseLabel="Quitar"
        increaseLabel="Agregar"
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('button', { name: 'Quitar' })).toBeDisabled()

    rerender(
      <QuantityStepper
        id="stepper"
        value={2}
        max={2}
        valueLabel="Cantidad"
        decreaseLabel="Quitar"
        increaseLabel="Agregar"
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })
})

describe('StageProgress', () => {
  it('dice el avance con palabras, no sólo con celdas', () => {
    render(<StageProgress resolved={3} total={7} />)

    // El progreso son celdas de la cuadrícula, no una barra: el texto es lo que
    // hace que no haya que contar cuadraditos con un lector de pantalla.
    expect(screen.getByText('Evento 4 de 7')).toBeInTheDocument()
  })
})

describe('Badge, Surface, Callout y Wordmark', () => {
  it('la etiqueta dice lo que significa, no sólo lo pinta', () => {
    render(<Badge tone="up">Promedio 8,0 → 8,4</Badge>)
    // El chip lleva siempre signo o flecha: en escala de grises uno que subió y
    // uno que bajó siguen siendo distintos.
    expect(screen.getByText('Promedio 8,0 → 8,4')).toBeInTheDocument()
  })

  it('Surface puede cambiar de elemento sin perder atributos', () => {
    render(
      <Surface as="section" aria-label="panel">
        contenido
      </Surface>,
    )
    const section = screen.getByRole('region', { name: 'panel' })
    expect(section.tagName).toBe('SECTION')
    expect(within(section).getByText('contenido')).toBeInTheDocument()
  })

  it('Callout dice el tono con palabras y no sólo con el filete', () => {
    render(
      <Callout tone="accent" title="Sin conexión">
        Se reintenta después.
      </Callout>,
    )
    expect(screen.getByText('Sin conexión')).toBeInTheDocument()
    expect(screen.getByText('Se reintenta después.')).toBeInTheDocument()
  })

  it('el wordmark se lee como el nombre del producto', () => {
    render(<Wordmark />)
    // Es texto compuesto, no una imagen: seleccionable y buscable.
    expect(screen.getByText('Egresado').textContent?.trim()).toBe('Egresado')
  })
})
