// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { InteractionAnswer, InteractionPresentation } from '@/game'
import { InteractionControls } from '@/components/game/interaction-area'

/**
 * La postura del curso se elige en un `select` nativo, y un `select` recorta
 * con puntos suspensivos lo que no entra en su ancho. En un teléfono la frase
 * elegida se leía a medias; la pantalla la repite escrita debajo del control.
 */
const presentation: Extract<
  InteractionPresentation,
  { kind: 'classification' }
> = {
  kind: 'classification',
  data: [],
  instructions: 'Decidí qué puede publicar el curso.',
  statements: [
    { id: 'a', label: '2.º A termina primero.', detail: '8 puntos' },
    { id: 'b', label: '2.º D termina primero.', detail: '9 puntos' },
  ],
  labels: [
    { id: 'seguro', label: 'Ya está asegurado' },
    { id: 'puede', label: 'Puede pasar' },
  ],
  stance: {
    prompt: '¿Qué publica el curso hoy?',
    options: [
      { id: 'tabla', label: 'Publicar la tabla y lo que falta jugar' },
      { id: 'nada', label: 'No publicar nada todavía' },
    ],
  },
}

function Harness() {
  const [draft, setDraft] = useState<InteractionAnswer>()
  return (
    <InteractionControls
      presentation={presentation}
      draft={draft}
      disabled={false}
      onDraftChange={setDraft}
      onRequestInformation={() => {}}
      instanceId="classification-ui"
    />
  )
}

describe('Classification', () => {
  it('repite escrita la postura elegida, entera, debajo del select', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByTestId('stance-echo')).not.toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: '¿Qué publica el curso hoy?' }),
      'tabla',
    )
    expect(screen.getByTestId('stance-echo')).toHaveTextContent(
      'Elegiste: Publicar la tabla y lo que falta jugar',
    )
  })

  it('cada enunciado se clasifica con un select nombrado por su texto', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const control = screen.getByRole('combobox', {
      name: '2.º A termina primero.',
    })
    await user.selectOptions(control, 'puede')
    expect(control).toHaveValue('puede')
  })
})
