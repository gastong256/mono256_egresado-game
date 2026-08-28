// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AuraBlock, AuraCell } from '@/components/game/aura-display'
import { CareerChips } from '@/components/game/career-chips'
import { CareerStrip } from '@/components/game/career-strip'
import {
  describeEstilo,
  EstiloTriangle,
} from '@/components/game/estilo-triangle'
import { FeedbackPanel } from '@/components/game/feedback-panel'
import { formatAura, formatPromedio } from '@/components/game/format'
import {
  ArchetypeStamp,
  MemorablePanel,
  Milestone,
} from '@/components/game/milestone'
import { NarrativeCard, SituationCard } from '@/components/game/situation-card'
import { DataGrid, DataMetric, Ledger, StageProgress } from '@/components/ui'
import type { CareerState, PendingFeedback, SolutionQuality } from '@/game'
import { initialCareer, nudgeEstilo, toChallengeInstanceId } from '@/game'

/**
 * Primitivas de juego.
 *
 * Lo que se verifica es la estructura semántica —qué es encabezado, qué es
 * lista, qué se anuncia— y las reglas que atraviesan todo el producto: ningún
 * estado se distingue sólo por color, `null` nunca se dibuja como 0, y un
 * resultado muestra sólo lo que se movió.
 */

function feedbackFor(
  quality: SolutionQuality,
  careerChange: PendingFeedback['careerChange'] = {},
): PendingFeedback {
  return {
    instanceId: toChallengeInstanceId(`grade-7:0:${quality}`),
    quality,
    feedback: {
      outcomeKey: `bus.${quality}`,
      facts: [
        { label: 'Viaje normal', value: '28 min' },
        { label: 'Margen', value: '18 min' },
      ],
      consequence: 'Entrás caminando, con tiempo de sobra.',
      stamp: quality === 'invalid' ? 'Llegaste tarde' : 'Llegaste',
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
    careerChange,
  }
}

function careerWith(overrides: Partial<CareerState> = {}): CareerState {
  return { ...initialCareer(), ...overrides }
}

describe('DataMetric', () => {
  it('separa la etiqueta, el valor y la unidad', () => {
    render(<DataMetric label="Pared" value="6 × 2,4" unit="metros" />)
    expect(screen.getByText('Pared')).toBeInTheDocument()
    expect(screen.getByText('6 × 2,4')).toBeInTheDocument()
    expect(screen.getByText('metros')).toBeInTheDocument()
  })

  it('marca la restricción sobre la cifra y no alrededor de la celda', () => {
    render(
      <DataMetric label="Demora de hoy" value="25 %" unit="más" constraint />,
    )
    const value = screen.getByText('25 %')
    // El subrayado abraza el número: `self-start` es lo que impide que la marca
    // cruce la celda entera.
    expect(value.className).toContain('self-start')
    expect(value.className).toContain('border-red')
  })

  it('deja que un dato impar ocupe las dos columnas', () => {
    render(
      <DataGrid
        items={[
          { label: 'Viaje normal', value: '28' },
          { label: 'Demora', value: '25 %' },
          { label: 'Entrada', value: '07:45' },
        ]}
      />,
    )
    expect(screen.getByText('07:45').closest('div')?.className).toContain(
      'col-span-2',
    )
  })
})

describe('Ledger', () => {
  it('muestra la cuenta real como pares etiqueta/valor', () => {
    render(
      <Ledger
        items={[
          { label: 'Superficie', value: '14,40 m²' },
          { label: 'Sobró', value: '0,20 L' },
        ]}
      />,
    )
    const ledger = screen.getByTestId('ledger')
    expect(within(ledger).getAllByRole('definition')).toHaveLength(2)
    expect(within(ledger).getByText('14,40 m²')).toBeInTheDocument()
  })
})

describe('StageProgress', () => {
  it('dice dónde estás con texto además de con celdas', () => {
    render(<StageProgress resolved={2} total={7} />)
    expect(screen.getByText('Evento 3 de 7')).toBeInTheDocument()
  })

  it('distingue los tres estados por forma, no sólo por color', () => {
    const { container } = render(<StageProgress resolved={2} total={5} />)
    const cells = [...container.querySelectorAll('span[aria-hidden="true"]')]

    // hecho: relleno · actual: contorno de 2 px · pendiente: regla de 1 px
    expect(cells[0]?.className).toContain('bg-progress-done')
    expect(cells[2]?.className).toContain('border-2')
    expect(cells[4]?.className).toContain('border-progress-pending')
  })
})

describe('CareerStrip', () => {
  it('no existe hasta que alguna dimensión se estableció', () => {
    render(<CareerStrip career={careerWith()} />)
    expect(screen.queryByTestId('career-strip')).not.toBeInTheDocument()
  })

  it('muestra una celda por dimensión establecida y ninguna más', () => {
    render(<CareerStrip career={careerWith({ grades: [8.4] })} />)

    expect(screen.getByTestId('career-strip')).toBeInTheDocument()
    expect(screen.getByText('Promedio')).toBeInTheDocument()
    expect(screen.getByText('8,4')).toBeInTheDocument()
    // Equipo y Aura todavía no existen: no se dibujan en 0.
    expect(screen.queryByText('Equipo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('aura-block')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('abre el panel de Estilo sólo cuando hay evidencia suficiente', async () => {
    const user = userEvent.setup()
    const career = careerWith({ grades: [8.4], estiloEvidence: 3 })

    render(<CareerStrip career={career} />)

    const toggle = screen.getByRole('button', { name: /Ver estilo/u })
    // El nombre accesible lleva los tres porcentajes: no hace falta abrir el
    // panel para saber qué dice el triángulo.
    expect(toggle).toHaveAccessibleName(
      new RegExp(String(career.estilo.aplicado), 'u'),
    )
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Estilo')).toBeInTheDocument()
  })

  it('esconde el triángulo mientras no hay decisiones que lo sostengan', () => {
    render(<CareerStrip career={careerWith({ grades: [8.4] })} />)
    expect(
      screen.queryByRole('button', { name: /estilo/iu }),
    ).not.toBeInTheDocument()
  })
})

describe('EstiloTriangle', () => {
  it('describe los tres ejes por texto', () => {
    const estilo = nudgeEstilo(initialCareer().estilo, {
      axis: 'estratega',
      amount: 10,
    })
    render(<EstiloTriangle estilo={estilo} />)

    const figure = screen.getByRole('img')
    expect(figure).toHaveAccessibleName(describeEstilo(estilo))
    expect(figure).toHaveAccessibleName(/Aplicado/u)
    expect(figure).toHaveAccessibleName(/Estratega/u)
    expect(figure).toHaveAccessibleName(/Improvisador/u)
  })

  it('produce coordenadas válidas para cualquier reparto', () => {
    for (const estilo of [
      { aplicado: 100, estratega: 0, improvisador: 0 },
      { aplicado: 0, estratega: 0, improvisador: 100 },
      { aplicado: 34, estratega: 33, improvisador: 33 },
    ]) {
      const { container, unmount } = render(<EstiloTriangle estilo={estilo} />)
      for (const polygon of container.querySelectorAll('polygon')) {
        expect(polygon.getAttribute('points')).not.toMatch(/NaN|Infinity/u)
      }
      const circle = container.querySelector('circle')
      expect(Number(circle?.getAttribute('cx'))).toBeGreaterThanOrEqual(0)
      expect(Number(circle?.getAttribute('cy'))).toBeGreaterThanOrEqual(0)
      unmount()
    }
  })
})

describe('Aura', () => {
  it('escribe el signo, así que no depende de distinguir verde de rojo', () => {
    const { rerender } = render(<AuraBlock value={1000} />)
    expect(screen.getByText('+1.000')).toBeInTheDocument()

    rerender(<AuraBlock value={-150} />)
    expect(screen.getByText('−150')).toBeInTheDocument()
  })

  it('conserva los brackets incluso a la escala del HUD', () => {
    const { container } = render(<AuraCell value={2450} />)
    expect(screen.getByText('+2.450')).toBeInTheDocument()
    expect(
      container.querySelectorAll('span[aria-hidden="true"]').length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('formatea con punto de miles y el menos tipográfico', () => {
    expect(formatAura(2450)).toBe('+2.450')
    expect(formatAura(-150)).toBe('−150')
    expect(formatPromedio(8)).toBe('8,0')
  })
})

describe('CareerChips', () => {
  it('no dibuja nada cuando no se movió ninguna dimensión', () => {
    render(<CareerChips change={{}} />)
    expect(screen.queryByTestId('career-chips')).not.toBeInTheDocument()
  })

  it('muestra únicamente las dimensiones que cambiaron', () => {
    render(<CareerChips change={{ estilo: { axis: 'estratega' } }} />)
    expect(screen.getByTestId('chip-estilo')).toHaveTextContent('Estratega ↑')
    expect(screen.queryByTestId('chip-promedio')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chip-equipo')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\+0\b/u)
  })

  it('escribe la primera nota sin inventar un promedio anterior', () => {
    render(<CareerChips change={{ promedio: { from: null, to: 8.4 } }} />)
    expect(screen.getByTestId('chip-promedio')).toHaveTextContent(
      'Promedio 8,4',
    )
    expect(screen.getByTestId('chip-promedio')).not.toHaveTextContent('→')
  })

  it('muestra la transición cuando ya había promedio', () => {
    render(<CareerChips change={{ promedio: { from: 8, to: 8.4 } }} />)
    expect(screen.getByTestId('chip-promedio')).toHaveTextContent(
      'Promedio 8,0 → 8,4',
    )
  })
})

describe('SituationCard y NarrativeCard', () => {
  it('la situación ordena contexto, datos e interacción', () => {
    render(
      <SituationCard
        eyebrow="Feria escolar"
        title="El mural"
        setup="Falta comprar la pintura."
        data={[{ label: 'Pared', value: '6 × 2,4', unit: 'metros' }]}
      >
        <p>interacción</p>
      </SituationCard>,
    )

    const article = screen.getByRole('article')
    expect(
      within(article).getByRole('heading', { name: 'El mural' }),
    ).toBeInTheDocument()
    expect(within(article).getByText('Feria escolar')).toBeInTheDocument()
    expect(within(article).getByText('6 × 2,4')).toBeInTheDocument()
    expect(within(article).getByText('interacción')).toBeInTheDocument()
  })

  it('el momento narrativo es una región con su propio encabezado', () => {
    render(
      <NarrativeCard eyebrow="Proyecto" title="Falta el equipo">
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
  it('anuncia el cierre con texto, no sólo con una animación', () => {
    render(
      <Milestone eyebrow="Cierre de etapa" numeral="7.º">
        <MemorablePanel>Llegaste al final.</MemorablePanel>
        <ArchetypeStamp archetype="El Estratega" stampLine="DIC · 7.º" />
      </Milestone>,
    )
    expect(screen.getByText('Cierre de etapa')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '7.º' })).toBeInTheDocument()
    expect(screen.getByTestId('archetype')).toHaveTextContent('El Estratega')
    // «Vas camino a», no «sos»: 7.º es el primero de seis años.
    expect(screen.getByTestId('archetype')).toHaveTextContent(/Vas camino a/u)
  })
})

describe('FeedbackPanel', () => {
  it.each([
    ['optimal', 'Óptimo'],
    ['efficient', 'Resuelto'],
    ['functional', 'Parcial'],
    ['invalid', 'Insuficiente'],
  ] as const)('nombra el resultado %s por escrito', (quality, label) => {
    render(<FeedbackPanel feedback={feedbackFor(quality)} />)

    const heading = screen.getByTestId('feedback-heading')
    expect(heading).toHaveTextContent(label)
    expect(heading).toHaveAttribute('data-quality', quality)
  })

  it('anuncia el resultado apenas aparece', () => {
    render(<FeedbackPanel feedback={feedbackFor('optimal')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Óptimo')
  })

  it('acompaña cada resultado con un glifo de forma propia', () => {
    const { container } = render(
      <FeedbackPanel feedback={feedbackFor('invalid')} />,
    )
    // El glifo es decorativo porque el nombre ya está escrito, pero tiene que
    // estar: color y palabra solos no diferencian a la distancia.
    expect(
      container.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThan(0)
  })

  it('nunca usa el vocabulario de un examen', () => {
    render(<FeedbackPanel feedback={feedbackFor('invalid')} />)
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/incorrect|correcto|error|mal\b|perdiste/iu)
    expect(text).not.toMatch(/game over/iu)
  })

  it('muestra los números que explican la consecuencia', () => {
    render(<FeedbackPanel feedback={feedbackFor('optimal')} />)
    expect(screen.getByText('Viaje normal')).toBeInTheDocument()
    expect(screen.getByText('28 min')).toBeInTheDocument()
    expect(
      screen.getByText('Entrás caminando, con tiempo de sobra.'),
    ).toBeInTheDocument()
  })

  it('explica la restricción que no se cumplió', () => {
    render(<FeedbackPanel feedback={feedbackFor('invalid')} />)
    expect(screen.getByText(/llegar antes de las 07:45/u)).toBeInTheDocument()
  })

  it('sólo muestra el bloque de Aura si Aura cambió', () => {
    const { rerender } = render(
      <FeedbackPanel feedback={feedbackFor('optimal')} />,
    )
    expect(screen.queryByTestId('aura-block')).not.toBeInTheDocument()

    rerender(
      <FeedbackPanel
        feedback={feedbackFor('optimal', {
          aura: { delta: 1000, total: 1000 },
        })}
      />,
    )
    expect(screen.getByTestId('aura-block')).toHaveTextContent('+1.000')
  })
})
