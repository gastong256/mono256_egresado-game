// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  DataMetric,
  MetricGroup,
  MetricRows,
} from '@/components/game/data-metric'
import { FeedbackPanel } from '@/components/game/feedback-panel'
import { Milestone } from '@/components/game/milestone'
import { NarrativeCard } from '@/components/game/narrative-card'
import { SituationCard } from '@/components/game/situation-card'
import { StageHeader, StageProgress } from '@/components/game/stage-header'
import { StatRow } from '@/components/game/stat-indicator'
import type { PendingFeedback, SolutionQuality } from '@/game'
import { toChallengeInstanceId } from '@/game'

/**
 * Primitivas de juego.
 *
 * Lo que se verifica es la estructura semántica —qué es encabezado, qué es
 * lista, qué se anuncia— y la regla de accesibilidad que atraviesa todo el
 * producto: ningún estado se distingue sólo por color.
 */

function feedbackFor(quality: SolutionQuality): PendingFeedback {
  return {
    instanceId: toChallengeInstanceId(`grade-7:0:${quality}`),
    quality,
    feedback: {
      outcomeKey: `bus.${quality}`,
      facts: [
        { label: 'Viaje normal', value: '28 min' },
        { label: 'Margen', value: '18 min' },
      ],
      ...(quality === 'invalid'
        ? { violatedConstraint: 'llegar antes de las 07:45' }
        : {}),
    },
    score: {
      basePoints: 1035,
      // Los factores viajan como cadenas decimales canónicas: el motor calcula
      // con racionales exactos y no con `number`.
      qualityFactor: '1.00',
      difficultyFactor: '1.15',
      components: [],
      bonusPoints: 0,
      penaltyPoints: 0,
      totalPoints: 1190,
    },
  }
}

describe('DataMetric', () => {
  it('separa la etiqueta del valor', () => {
    render(<DataMetric label="Pared" value="6 m × 2,4 m" />)
    expect(screen.getByText('Pared')).toBeInTheDocument()
    expect(screen.getByText('6 m × 2,4 m')).toBeInTheDocument()
  })

  it('alinea los números para poder compararlos', () => {
    const { container } = render(<DataMetric label="Entrada" value="07:45" />)
    // `data-numeric` es lo que activa `tabular-nums` desde la capa base.
    expect(container.querySelector('[data-numeric]')?.textContent).toContain(
      '07:45',
    )
  })

  it('agrupa varios datos sin perder ninguno', () => {
    render(
      <MetricGroup
        items={[
          { label: 'Porciones necesarias', value: '24' },
          { label: 'Plata del curso', value: '$ 24.000' },
          { label: 'Entrada', value: '07:45' },
        ]}
      />,
    )
    expect(screen.getByText('Porciones necesarias')).toBeInTheDocument()
    expect(screen.getByText('$ 24.000')).toBeInTheDocument()
    expect(screen.getByText('07:45')).toBeInTheDocument()
  })

  it('no dibuja nada cuando no hay datos', () => {
    const { container } = render(<MetricGroup items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('las filas de hechos son una lista de definiciones', () => {
    const { container } = render(
      <MetricRows items={[{ label: 'Margen', value: '18 min' }]} />,
    )
    expect(container.querySelector('dl')).not.toBeNull()
    expect(container.querySelector('dt')?.textContent).toBe('Margen')
    expect(container.querySelector('dd')?.textContent).toBe('18 min')
  })
})

describe('StageHeader y StageProgress', () => {
  it('nombra la etapa y a quien juega', () => {
    render(<StageHeader stage="7.º grado" playerName="Sofi" />)
    expect(screen.getByTestId('stage-label')).toHaveTextContent('7.º grado')
    expect(screen.getByText('Sofi')).toBeInTheDocument()
  })

  it('dice el avance con palabras además de con la barra', () => {
    render(<StageProgress resolved={3} total={7} />)

    // Quien no puede percibir la longitud de la barra lee lo mismo.
    expect(screen.getByText(/Evento 3 de 7/u)).toBeInTheDocument()
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('value', '3')
    expect(progress).toHaveAttribute('max', '7')
  })

  it('no asume una cantidad fija de eventos', () => {
    render(<StageProgress resolved={9} total={12} />)
    expect(screen.getByText(/Evento 9 de 12/u)).toBeInTheDocument()
  })
})

describe('StatRow', () => {
  it('escribe el número al lado de cada barra', () => {
    render(
      <StatRow
        stats={[
          { label: 'Conocimiento', value: 57 },
          { label: 'Energía', value: 66 },
        ]}
      />,
    )
    expect(screen.getByText('Conocimiento')).toBeInTheDocument()
    expect(screen.getByText('57')).toBeInTheDocument()
    expect(screen.getByText('66')).toBeInTheDocument()
  })
})

describe('SituationCard y NarrativeCard', () => {
  it('la situación ordena contexto, consigna e interacción', () => {
    render(
      <SituationCard
        title="El mural del curso"
        context="Empieza el proyecto."
        setup="Falta comprar la pintura."
        goal="Elegí el envase que alcance."
        actions={<button type="button">Confirmar</button>}
      >
        <p>interacción</p>
      </SituationCard>,
    )

    const article = screen.getByRole('article')
    expect(
      within(article).getByRole('heading', { name: 'El mural del curso' }),
    ).toBeInTheDocument()
    expect(
      within(article).getByText('Empieza el proyecto.'),
    ).toBeInTheDocument()
    expect(within(article).getByText('interacción')).toBeInTheDocument()
    expect(
      within(article).getByRole('button', { name: 'Confirmar' }),
    ).toBeInTheDocument()
  })

  it('el momento narrativo es una región con su propio encabezado', () => {
    render(
      <NarrativeCard title="Falta el equipo">
        La notebook dejó de andar.
      </NarrativeCard>,
    )

    const section = screen.getByTestId('narrative-card')
    expect(
      within(section).getByRole('heading', { name: 'Falta el equipo' }),
    ).toBeInTheDocument()
    expect(
      within(section).getByText('La notebook dejó de andar.'),
    ).toBeInTheDocument()
  })
})

describe('Milestone', () => {
  it('anuncia el hito con texto, no sólo con una animación', () => {
    render(
      <Milestone eyebrow="Sofi · año terminado" title="Tu 7.º grado">
        Llegaste al final.
      </Milestone>,
    )
    expect(screen.getByText('Sofi · año terminado')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Tu 7.º grado' }),
    ).toBeInTheDocument()
  })
})

describe('FeedbackPanel', () => {
  it.each([
    ['optimal', 'Óptimo'],
    ['efficient', 'Eficiente'],
    ['functional', 'Funcionó'],
    ['invalid', 'No alcanzó'],
  ] as const)('nombra el resultado %s por escrito', (quality, label) => {
    render(
      <FeedbackPanel feedback={feedbackFor(quality)} onContinue={vi.fn()} />,
    )

    const heading = screen.getByTestId('feedback-heading')
    expect(heading).toHaveTextContent(label)
    expect(heading).toHaveAttribute('data-quality', quality)
  })

  it('anuncia el resultado apenas aparece', () => {
    render(
      <FeedbackPanel feedback={feedbackFor('optimal')} onContinue={vi.fn()} />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Óptimo')
  })

  it('acompaña cada resultado con un ícono de forma propia', () => {
    const { container, unmount } = render(
      <FeedbackPanel feedback={feedbackFor('invalid')} onContinue={vi.fn()} />,
    )
    // El ícono es decorativo porque el nombre ya está escrito, pero tiene que
    // estar: color y palabra solos no diferencian a la distancia.
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(
      1,
    )
    unmount()
  })

  it('nunca usa el vocabulario de un examen', () => {
    render(
      <FeedbackPanel feedback={feedbackFor('invalid')} onContinue={vi.fn()} />,
    )
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/incorrect|correcto|error|mal\b|perdiste/iu)
    expect(text).not.toMatch(/game over/iu)
  })

  it('muestra los números que explican la consecuencia', () => {
    render(
      <FeedbackPanel feedback={feedbackFor('optimal')} onContinue={vi.fn()} />,
    )
    expect(screen.getByText('Viaje normal')).toBeInTheDocument()
    expect(screen.getByText('28 min')).toBeInTheDocument()
  })

  it('explica la restricción que no se cumplió', () => {
    render(
      <FeedbackPanel feedback={feedbackFor('invalid')} onContinue={vi.fn()} />,
    )
    expect(screen.getByText(/llegar antes de las 07:45/u)).toBeInTheDocument()
  })
})
