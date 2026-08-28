'use client'

/**
 * Vitrina del sistema de diseño.
 *
 * La referencia viva de Egresado v0.2: fundaciones, primitivas de UI, primitivas
 * de juego, modelo del jugador, resultados, interacciones y hitos. Es la fuente
 * visual a la que hay que mirar **antes** de inventar una primitiva nueva — si el
 * patrón ya está acá, se compone en lugar de escribirse de cero.
 *
 * Todo lo que se muestra usa contenido real de 7.º grado. Con Lorem Ipsum un
 * sistema siempre se ve bien: los que rompen la maqueta son «6 × 2,4 m»,
 * «$ 21.000», «Improvisador ↑» y una consecuencia de tres renglones en
 * castellano con acentos.
 *
 * Vive en `src/components/dev/` y no se importa desde ninguna pantalla del
 * juego: su ruta está detrás del opt-in del servidor.
 */

import { useState, type ReactNode } from 'react'

import {
  ESTILO_AXES,
  estiloAxisLabel,
  initialCareer,
  nudgeEstilo,
  type CareerChange,
  type CareerState,
  type PendingFeedback,
  type SolutionQuality,
} from '@/game'
import {
  Badge,
  Button,
  Callout,
  ChoiceCard,
  DataGrid,
  Label,
  Ledger,
  NumberField,
  NumberGrid,
  PartialMark,
  QuantityStepper,
  RecordRow,
  Separator,
  SlashMark,
  StageProgress,
  Stamp,
  Surface,
  TextField,
  TickMark,
  Wordmark,
  type OutcomeTone,
} from '@/components/ui'
import { AuraBlock, AuraCell, AuraChip } from '@/components/game/aura-display'
import { CareerChips } from '@/components/game/career-chips'
import { CareerStrip } from '@/components/game/career-strip'
import { DecisionBlock } from '@/components/game/decision-block'
import { EstiloLegend, EstiloTriangle } from '@/components/game/estilo-triangle'
import { FeedbackPanel } from '@/components/game/feedback-panel'
import {
  ActionSlot,
  GameSheet,
  SceneColumn,
  StageHeader,
} from '@/components/game/game-shell'
import {
  ArchetypeStamp,
  MemorablePanel,
  Milestone,
} from '@/components/game/milestone'
import { OUTCOME } from '@/components/game/outcome'
import { NarrativeCard, SituationCard } from '@/components/game/situation-card'
import { formatAura, formatPromedio } from '@/components/game/format'
import { cn } from '@/lib/ui/cn'

/* ------------------------------------------------------------------ layout */

/**
 * El orden de las secciones.
 *
 * La numeración sale de esta lista y no de un contador que se incremente al
 * renderizar: un contador de módulo mutado durante el render produce números
 * distintos según cuándo React vuelva a dibujar, que es justamente el tipo de
 * efecto que una vitrina no debería tener.
 */
const SECTION_ORDER = [
  'Color',
  'Tipografía',
  'Cuadrícula, geometría y el device',
  'Botones',
  'ChoiceCard · todos los estados',
  'NumberGrid · clasificación',
  'Resultados de desafío',
  'Modelo del jugador',
  'Datos y ledger',
  'Chips, progreso y campos',
  'Shell y escenas',
  'Panel de resultado',
  'Cierre de etapa',
  'Motion',
  'Arte',
  'Distancia de las referencias',
] as const

function Section({
  title,
  aside,
  children,
}: {
  readonly title: (typeof SECTION_ORDER)[number]
  readonly aside?: string
  readonly children: ReactNode
}) {
  const number = String(SECTION_ORDER.indexOf(title) + 1).padStart(2, '0')

  return (
    <section className="flex flex-col gap-5">
      <div className="border-ink flex items-baseline gap-3 border-t-2 pt-3">
        <span className="font-display text-green text-[13px] font-extrabold tracking-[0.1em]">
          {number}
        </span>
        <h2 className="text-section font-display text-ink">{title}</h2>
        {aside === undefined ? null : (
          <span className="text-caption text-ink-secondary ml-auto text-right">
            {aside}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function Note({ children }: { readonly children: ReactNode }) {
  return (
    <p className="text-meta text-ink-secondary max-w-[80ch] text-pretty">
      {children}
    </p>
  )
}

/** Una muestra con su nombre debajo, que es lo que la vuelve consultable. */
function Swatch({
  name,
  children,
  className,
}: {
  readonly name: string
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {children}
      <span className="text-ink-label font-display text-[10.5px]">{name}</span>
    </div>
  )
}

function Grid({
  min = 250,
  children,
  className,
}: {
  readonly min?: number
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={cn('grid gap-3.5', className)}
      style={{
        // `min()` con el 100 % es lo que evita que un mínimo de 360 px desborde
        // un viewport de 360: la columna se achica en vez de empujar la página.
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${String(min)}px, 100%), 1fr))`,
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------ datos reales */

const MURAL_DATA = [
  { label: 'Pared', value: '6 × 2,4', unit: 'metros' },
  { label: 'Rinde', value: '8', unit: 'm² por litro' },
] as const

const BUS_DATA = [
  { label: 'Viaje normal', value: '28', unit: 'minutos' },
  {
    label: 'Demora de hoy',
    value: '25 %',
    unit: 'más de viaje',
    constraint: true,
  },
  {
    label: 'Entrada',
    value: '07:45',
    unit: 'sin excepción',
    span: 2 as const,
  },
] as const

const MURAL_LEDGER = [
  { label: 'Superficie', value: '14,40 m²' },
  { label: 'Pintura necesaria', value: '1,80 L' },
  { label: 'Compraste', value: '2 L' },
  { label: 'Sobró', value: '0,20 L' },
] as const

function feedbackFixture(
  quality: SolutionQuality,
  change: CareerChange = {},
): PendingFeedback {
  return {
    instanceId: `demo-${quality}` as PendingFeedback['instanceId'],
    quality,
    feedback: {
      outcomeKey: `demo.${quality}`,
      facts: MURAL_LEDGER,
      optimalComparison:
        'Era el envase más barato entre los que alcanzaban para toda la pared.',
      consequence:
        'El mural queda listo y la profesora lo toma como parte del trabajo del trimestre.',
      stamp: quality === 'invalid' ? 'No alcanzó' : 'Alcanzó',
    },
    score: {
      basePoints: 100,
      qualityFactor: '1',
      difficultyFactor: '1',
      components: [],
      bonusPoints: 0,
      penaltyPoints: 0,
      totalPoints: 100,
    },
    careerChange: change,
  }
}

/** Una carrera de demostración, como quedaría a mitad de 7.º. */
function demoCareer(): CareerState {
  const base = initialCareer()
  return {
    ...base,
    grades: [8.4],
    equipo: 54,
    aura: 1000,
    estilo: nudgeEstilo(
      nudgeEstilo(base.estilo, { axis: 'estratega', amount: 10 }),
      { axis: 'aplicado', amount: 6 },
    ),
    estiloEvidence: 3,
  }
}

/* ---------------------------------------------------------------- vitrina */

export function DesignSystemShowcase() {
  const career = demoCareer()

  return (
    <main className="bg-canvas-sunken flex flex-col gap-11 overflow-x-hidden px-4 py-10 pb-24 sm:px-6 lg:px-8">
      <header className="flex max-w-[1180px] flex-col gap-4">
        <Label>Egresado · sistema de diseño</Label>
        <h1 className="text-milestone font-display text-ink">
          Design System v0.2
        </h1>
        <p className="text-body-lg text-ink-secondary max-w-[68ch] text-pretty">
          Hoja cuadriculada como canvas, tinta como información, y cuatro
          colores con cuatro trabajos. Este archivo reemplaza las fundaciones
          oscuras de v0.1 — no convive con ellas.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {['Papel primero', 'Radio 0', 'Sin sombras', 'Cuadrícula 16 px'].map(
            (claim, index) => (
              <span
                key={claim}
                className={cn(
                  'font-display px-2.5 py-1.5 text-[11px] font-bold tracking-[0.1em] uppercase',
                  index === 0
                    ? 'bg-ink text-canvas'
                    : 'border-ink text-ink border-[1.5px]',
                )}
              >
                {claim}
              </span>
            ),
          )}
        </div>
      </header>

      <div className="flex max-w-[1180px] flex-col gap-11">
        <ColorSection />
        <TypographySection />
        <GeometrySection />
        <ButtonSection />
        <ChoiceCardSection />
        <NumberGridSection />
        <OutcomeSection />
        <PlayerModelSection career={career} />
        <DataSection />
        <ControlsSection />
        <GameShellSection career={career} />
        <FeedbackSection />
        <MilestoneSection career={career} />
        <MotionSection />
        <ArtSection />
        <DistanceSection />
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ color */

const PALETTE = [
  { name: 'canvas', className: 'bg-canvas', hex: '#F6F5F0' },
  { name: 'canvas-grid', className: 'bg-canvas-grid', hex: '#E6E4DC' },
  { name: 'canvas-sunken', className: 'bg-canvas-sunken', hex: '#EFEDE6' },
  { name: 'surface', className: 'bg-surface', hex: '#FFFFFF' },
  { name: 'rule', className: 'bg-rule', hex: '#C9C6BE' },
  { name: 'ink', className: 'bg-ink', hex: '#16181A' },
  { name: 'ink-secondary', className: 'bg-ink-secondary', hex: '#45494A' },
  { name: 'ink-label', className: 'bg-ink-label', hex: '#5A5F5C' },
  { name: 'green', className: 'bg-green', hex: '#1B6B3A' },
  { name: 'green-deep', className: 'bg-green-deep', hex: '#14572F' },
  { name: 'green-tint', className: 'bg-green-tint', hex: '#E3EFE7' },
  { name: 'red', className: 'bg-red', hex: '#C0272D' },
  { name: 'red-tint', className: 'bg-red-tint', hex: '#FBEAEA' },
  { name: 'action', className: 'bg-action', hex: '#C6F24E' },
  { name: 'decision', className: 'bg-decision', hex: '#1C1E1B' },
  { name: 'aura-surface', className: 'bg-aura-surface', hex: '#0A0C0A' },
  { name: 'aura-gain', className: 'bg-aura-gain', hex: '#4AE88C' },
  { name: 'aura-loss', className: 'bg-aura-loss', hex: '#FF5C63' },
] as const

function ColorSection() {
  return (
    <Section title="Color" aside="cuatro colores, cuatro trabajos">
      <Grid min={120}>
        {PALETTE.map((entry) => (
          <Swatch key={entry.name} name={entry.name}>
            <div
              className={cn('border-rule h-16 border', entry.className)}
              // El hexadecimal se muestra como texto: es documentación, no un
              // color escrito a mano en una pantalla.
              title={entry.hex}
            />
            <span
              data-numeric
              className="text-ink-secondary font-mono text-[10px]"
            >
              {entry.hex}
            </span>
          </Swatch>
        ))}
      </Grid>
      <Note>
        Proporción objetivo por área en una pantalla de desafío típica:{' '}
        <strong>
          ~80 % papel y tinta · ~12 % verde · ~5 % rojo · ~3 % lima
        </strong>
        . El bloque negro de Aura aparece en 1 de cada 4 pantallas como máximo.
        <strong> Verde ≠ correcto. Rojo ≠ incorrecto.</strong> La calidad del
        resultado la lleva glifo + palabra + borde superior; el color sólo
        refuerza.
      </Note>
    </Section>
  )
}

/* ------------------------------------------------------------- tipografía */

const TYPE_ROLES = [
  {
    role: 'milestone',
    className: 'text-milestone font-display',
    sample: '7.º',
  },
  {
    role: 'display',
    className: 'text-display font-display',
    sample: 'El colectivo',
  },
  {
    role: 'section',
    className: 'text-section font-display',
    sample: 'Repartir el trabajo',
  },
  { role: 'aura', className: 'text-aura font-display', sample: '+1.000' },
  {
    role: 'data-lg',
    className: 'text-data-lg font-display',
    sample: '14,40 m²',
  },
  { role: 'title', className: 'text-title font-display', sample: 'Óptimo' },
  { role: 'option', className: 'text-option font-display', sample: '2 litros' },
  {
    role: 'goal',
    className: 'text-goal font-display',
    sample: '¿Qué comprás?',
  },
  {
    role: 'action',
    className: 'text-action font-display uppercase',
    sample: 'Confirmar',
  },
  {
    role: 'body-lg',
    className: 'text-body-lg',
    sample: 'Primer día. El aula huele a cuaderno nuevo.',
  },
  {
    role: 'body',
    className: 'text-body',
    sample: 'El 60 viene con demora otra vez.',
  },
  { role: 'ledger', className: 'text-ledger font-display', sample: '$ 21.000' },
  {
    role: 'meta',
    className: 'text-meta',
    sample: 'Entrás caminando, con tiempo de sobra.',
  },
  {
    role: 'chip',
    className: 'text-chip font-display',
    sample: 'Promedio 8,0 → 8,4',
  },
  {
    role: 'label',
    className: 'text-label font-display uppercase',
    sample: 'Promedio',
  },
  {
    role: 'eyebrow',
    className: 'text-eyebrow font-display uppercase',
    sample: 'Feria escolar',
  },
] as const

function TypographySection() {
  return (
    <Section title="Tipografía" aside="Schibsted Grotesk · Libre Franklin">
      <div className="bg-surface border-rule flex flex-col border">
        {TYPE_ROLES.map((entry) => (
          <div
            key={entry.role}
            className="border-rule-soft flex flex-wrap items-baseline gap-4 border-b px-4 py-3 last:border-b-0"
          >
            <span className="text-ink-label w-24 shrink-0 font-mono text-[11px]">
              {entry.role}
            </span>
            <span data-numeric className={cn('text-ink', entry.className)}>
              {entry.sample}
            </span>
          </div>
        ))}
      </div>
      <Note>
        <strong>Caja mixta en los títulos.</strong> Las mayúsculas quedan para
        etiquetas de 9–11 px; el uppercase en títulos era la mitad de la huella
        deportiva de v0.1.{' '}
        <strong>Todo valor cuantitativo lleva tabular-nums</strong>, no
        negociable: la coma decimal, el punto de miles y la hora de 24 h son
        es-AR.
      </Note>
      <Grid min={200}>
        {(
          [
            { label: 'Plata', sample: '$ 21.000' },
            { label: 'Promedio', sample: '8,4' },
            { label: 'Aura', sample: '+2.450 / −150' },
            { label: 'Medidas', sample: '6 × 2,4 m · 14,40 m²' },
            { label: 'Hora', sample: '07:45' },
          ] as const
        ).map(({ label, sample }) => (
          <Swatch key={label} name={label}>
            <div className="bg-surface border-ink border-[1.5px] px-3 py-2.5">
              <span data-numeric className="text-data-lg font-display text-ink">
                {sample}
              </span>
            </div>
          </Swatch>
        ))}
      </Grid>
    </Section>
  )
}

/* ------------------------------------------- cuadrícula, geometría, device */

function GeometrySection() {
  return (
    <Section title="Cuadrícula, geometría y el device">
      <Grid min={300}>
        <div className="eg-canvas border-rule flex flex-col gap-3 border p-4">
          <Label>La cuadrícula</Label>
          <DataGrid
            items={[
              { label: 'Pared', value: '6 × 2,4', unit: 'metros', span: 2 },
            ]}
          />
          <Note>
            Celda de 16 px; padding y alturas en múltiplos de 8. Las cajas de
            dato se apoyan <em>sobre</em> la cuadrícula con fondo liso: así el
            papel se ve alrededor y el dato se lee como objeto, no como párrafo.
          </Note>
        </div>

        <div className="bg-surface border-rule flex flex-col gap-3 border p-4">
          <Label>Geometría</Label>
          <div className="flex flex-col">
            {[
              ['Radio', '0 · siempre'],
              ['Regla', '1 px rule'],
              ['Caja de dato', '1,5 px ink'],
              ['Sección', '2 px ink'],
              ['Pestaña / módulo', '3 px superior'],
              ['Sombra', 'ninguna'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-canvas-grid flex justify-between border-b py-1.5 last:border-b-0"
              >
                <span className="text-meta text-ink">{label}</span>
                <span className="font-display text-ink-label text-[12px] font-bold">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border-rule flex flex-col gap-3.5 border p-4">
          <Label>El device · marca de corrección</Label>
          {[
            {
              mark: (
                <span className="bg-green flex size-8 items-center justify-center text-white">
                  <TickMark className="size-5" />
                </span>
              ),
              title: 'Tilde verde',
              note: 'Resultado conseguido.',
            },
            {
              mark: (
                <span className="text-red flex size-8 items-center justify-center">
                  <SlashMark className="size-6" />
                </span>
              ),
              title: 'Tachado rojo',
              note: 'Opción que no alcanzó.',
            },
            {
              mark: (
                <span className="flex size-8 items-end justify-center pb-1">
                  <span className="bg-red block h-[3px] w-6" />
                </span>
              ),
              title: 'Subrayado rojo',
              note: 'El dato que era la restricción.',
            },
            {
              mark: (
                <span className="border-ink-label text-ink-label flex size-8 items-center justify-center border-[1.5px]">
                  <PartialMark />
                </span>
              ),
              title: 'Cuadrado gris',
              note: 'Resolvió una parte.',
            },
          ].map((entry) => (
            <div key={entry.title} className="flex items-center gap-3.5">
              {entry.mark}
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-ink text-[13px] font-extrabold">
                  {entry.title}
                </span>
                <span className="text-meta text-ink-secondary">
                  {entry.note}
                </span>
              </div>
            </div>
          ))}
          <Note>
            La marca cae <strong>sobre</strong> el dato o la opción, nunca en un
            marco alrededor. Eso es lo que la diferencia de un frame deportivo.
          </Note>
        </div>
      </Grid>
    </Section>
  )
}

/* ---------------------------------------------------------------- botones */

function ButtonSection() {
  return (
    <Section title="Botones" aside="un solo primario por pantalla">
      <div className="eg-canvas border-rule grid gap-3.5 border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Swatch name="primario · default">
          <Button>Confirmar</Button>
        </Swatch>
        <Swatch name="primario · disabled">
          <Button disabled>Confirmar</Button>
        </Swatch>
        <Swatch name="secundario">
          <Button variant="secondary" size="md">
            Preguntar
          </Button>
        </Swatch>
        <Swatch name="ghost">
          <Button variant="ghost" size="md">
            Volver a empezar
          </Button>
        </Swatch>
      </div>
      <Surface tone="decision" padding="default">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Button surface="decision">Confirmar</Button>
            <span className="text-on-decision-muted font-display text-[10.5px]">
              primario en el bloque oscuro
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button surface="decision" disabled>
              Confirmar
            </Button>
            <span className="text-on-decision-muted font-display text-[10.5px]">
              disabled sobre pizarra
            </span>
          </div>
        </div>
      </Surface>
      <Note>
        Un solo primario por pantalla, 50 px de alto. El disabled{' '}
        <strong>nunca</strong> es la única explicación: la línea de consigna
        dice qué falta para habilitarlo. La lima es sólo un botón — nunca un
        estado, nunca un dato.
      </Note>
    </Section>
  )
}

/* ------------------------------------------------------------- ChoiceCard */

function ChoiceCardSection() {
  const [selected, setSelected] = useState('m2')

  return (
    <Section title="ChoiceCard · todos los estados" aside="el más importante">
      <Callout tone="neutral">
        <strong>Seleccionado es blanco, nunca verde.</strong> Elegir significa
        «esta es mi decisión», no «esta es la correcta». El color de resultado
        aparece recién después de Confirmar. Es la regla más importante del
        sistema.
      </Callout>

      <Surface tone="decision" padding="default">
        <ul className="flex list-none flex-col gap-1.5 p-0">
          {[
            { id: 'm1', label: '1 litro', detail: '$ 12.000' },
            { id: 'm2', label: '2 litros', detail: '$ 21.000' },
            { id: 'm3', label: '4 litros', detail: '$ 38.000' },
          ].map((option) => (
            <li key={option.id}>
              <ChoiceCard
                id={`demo-${option.id}`}
                name="demo-choice"
                value={option.id}
                label={option.label}
                detail={option.detail}
                selected={selected === option.id}
                onSelect={() => {
                  setSelected(option.id)
                }}
              />
            </li>
          ))}
        </ul>
        <p className="text-on-decision-muted text-caption mt-3">
          Interactivo: elegir no cambia el color a verde ni a rojo.
        </p>
      </Surface>

      <div className="eg-canvas border-rule grid gap-3.5 border p-4 lg:grid-cols-2">
        {(
          [
            ['optimal', '2 litros', '$ 21.000', 'resuelto · óptimo'],
            ['resolved', '4 litros', '$ 38.000', 'resuelto · alcanzó de más'],
            ['partial', '07:00', 'El de siempre', 'resuelto · parcial'],
            ['insufficient', '1 litro', '$ 12.000', 'resuelto · no alcanzó'],
          ] as const
        ).map(([tone, label, detail, name]) => (
          <Swatch key={tone} name={name}>
            <ChoiceCard
              id={`resolved-${tone}`}
              name={`resolved-${tone}`}
              value={tone}
              label={label}
              detail={detail}
              selected
              surface="paper"
              state={{ kind: 'chosen', tone: tone as OutcomeTone }}
              onSelect={() => undefined}
            />
          </Swatch>
        ))}
        <Swatch name="resuelto · no elegida">
          <ChoiceCard
            id="resolved-unchosen"
            name="resolved-unchosen"
            value="unchosen"
            label="4 litros"
            detail="$ 38.000"
            selected={false}
            surface="paper"
            state={{ kind: 'unchosen' }}
            onSelect={() => undefined}
          />
        </Swatch>
      </div>
      <Note>
        La decisión ocurre en oscuro; el resultado vuelve al papel. Ese cambio
        de superficie <em>es</em> la transición de estado — antes de que el
        color entre a jugar.
      </Note>
    </Section>
  )
}

/* ------------------------------------------------------------ number grid */

/**
 * La grilla de clasificación, con sus dos momentos.
 *
 * Es la misma pieza que juega el acto del 25 de Mayo. Las dos mitades de su
 * contrato se muestran una al lado de la otra porque es la única forma de ver lo
 * que la separa de un formulario: a la izquierda hay celdas marcadas y ninguna
 * dice si están bien; a la derecha aparecen los cuatro estados corregidos, cada
 * uno con relleno, trazo y glifo propios.
 */
function NumberGridSection() {
  const [marked, setMarked] = useState<readonly string[]>(['12', '21'])

  const numbers = [11, 12, 15, 17, 8, 21, 22, 14]

  const toggle = (id: string): void => {
    setMarked((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    )
  }

  return (
    <Section title="NumberGrid · clasificación" aside="marcado no es correcto">
      <Grid min={300}>
        <Swatch name="sin corregir · marcar es sólo elegir">
          <div className="eg-canvas border-rule border p-4">
            <NumberGrid
              cue="Pañuelo celeste"
              rule="Múltiplos de 3"
              cells={numbers.map((value) => ({
                id: String(value),
                value: String(value),
                selected: marked.includes(String(value)),
              }))}
              onToggle={toggle}
            />
          </div>
        </Swatch>
        <Swatch name="corregida · los cuatro estados">
          <div className="eg-canvas border-rule border p-4">
            <NumberGrid
              cue="Pañuelo celeste"
              rule="Múltiplos de 3"
              cells={numbers.map((value) => {
                const target = value % 3 === 0
                const chosen = [12, 21, 22].includes(value)
                return {
                  id: String(value),
                  value: String(value),
                  selected: chosen,
                  resolution: target
                    ? chosen
                      ? ('hit' as const)
                      : ('missed' as const)
                    : chosen
                      ? ('extra' as const)
                      : ('clear' as const),
                }
              })}
              onToggle={() => undefined}
              note="Los punteados cumplían «Múltiplos de 3» y no los marcaste."
            />
          </div>
        </Swatch>
      </Grid>

      <Note>
        Mientras se decide, la celda marcada es blanca con borde de tinta y
        tilde: nunca verde. El verde sólo existe después de corregir, igual que
        en la ChoiceCard. Los cuatro estados corregidos cambian relleno, trazo y
        glifo a la vez, así que la grilla se lee entera en escala de grises.
        Cada celda es una casilla nativa de 56 px: se recorre con Tab y se marca
        con Espacio.
      </Note>
    </Section>
  )
}

/* --------------------------------------------------------------- outcomes */

function OutcomeSection() {
  return (
    <Section title="Resultados de desafío" aside="nunca correcto / incorrecto">
      <Grid min={215}>
        {(['optimal', 'efficient', 'functional', 'invalid'] as const).map(
          (quality) => {
            const presentation = OUTCOME[quality]
            const border: Record<OutcomeTone, string> = {
              optimal: 'border-t-outcome-optimal',
              resolved: 'border-t-outcome-resolved',
              partial: 'border-t-outcome-partial',
              insufficient: 'border-t-outcome-insufficient',
            }
            const glyph: Record<OutcomeTone, ReactNode> = {
              optimal: (
                <span className="bg-outcome-optimal flex size-[26px] items-center justify-center text-white">
                  <TickMark className="size-[15px]" />
                </span>
              ),
              resolved: (
                <span className="border-outcome-resolved text-outcome-resolved flex size-[26px] items-center justify-center border-[1.5px]">
                  <TickMark className="size-[13px]" />
                </span>
              ),
              partial: (
                <span className="border-outcome-partial text-outcome-partial flex size-[26px] items-center justify-center border-[1.5px]">
                  <PartialMark />
                </span>
              ),
              insufficient: (
                <span className="text-outcome-insufficient flex size-[26px] items-center justify-center">
                  <SlashMark />
                </span>
              ),
            }

            return (
              <div
                key={quality}
                className={cn(
                  'bg-surface border-rule flex flex-col gap-2.5 border border-t-[3px] p-3.5',
                  border[presentation.tone],
                )}
              >
                <div className="flex items-center gap-2.5">
                  {glyph[presentation.tone]}
                  <span className="text-title font-display text-ink">
                    {presentation.label}
                  </span>
                </div>
                <span className="text-meta text-ink-secondary">
                  {presentation.meaning}
                </span>
                <span className="text-ink-label font-mono text-[10px]">
                  motor: {quality}
                </span>
              </div>
            )
          },
        )}
      </Grid>
      <Note>
        Cada estado lleva <strong>glifo + palabra + borde superior</strong>:
        tres canales, ninguno cromático por sí solo. Todo el set se lee en
        escala de grises. El motor habla el vocabulario del GDD; la
        correspondencia con los cuatro rótulos es posicional y total.
      </Note>
    </Section>
  )
}

/* --------------------------------------------------------- modelo jugador */

function PlayerModelSection({ career }: { readonly career: CareerState }) {
  return (
    <Section
      title="Modelo del jugador"
      aside="Promedio · Equipo · Aura · Estilo"
    >
      <Grid min={280}>
        <div className="eg-canvas border-rule flex flex-col gap-3 border p-4">
          <Label>La tira, con las cuatro establecidas</Label>
          <div className="bg-canvas border-rule border">
            <CareerStrip career={career} />
          </div>
        </div>
        <div className="eg-canvas border-rule flex flex-col gap-3 border p-4">
          <Label>Aparición progresiva</Label>
          <div className="bg-canvas border-rule border">
            <CareerStrip
              career={{
                ...career,
                equipo: null,
                aura: null,
                estiloEvidence: 0,
              }}
            />
          </div>
          <Note>
            La tira arranca <strong>vacía</strong> y cada celda aparece la
            primera vez que su dimensión se toca.{' '}
            <strong>`null` no es 0:</strong> mostrar «Promedio 0» antes de la
            primera nota le diría a alguien de doce años que va mal en una
            materia que todavía no empezó.
          </Note>
        </div>
      </Grid>

      <Grid min={240}>
        <Swatch name="Aura · chip">
          <div className="eg-canvas border-rule flex items-center justify-center border p-4">
            <AuraChip value={50} />
          </div>
        </Swatch>
        <Swatch name="Aura · nota">
          <AuraBlock value={250} size="note" />
        </Swatch>
        <Swatch name="Aura · hito">
          <AuraBlock value={1000} />
        </Swatch>
        <Swatch name="Aura · pérdida">
          <AuraBlock value={-150} />
        </Swatch>
        <Swatch name="Aura · celda del HUD">
          <div className="eg-canvas border-rule flex justify-center border p-3">
            <AuraCell value={2450} />
          </div>
        </Swatch>
      </Grid>
      <Note>
        Aura es capital narrativo, no corrección. Un cálculo correcto{' '}
        <strong>nunca</strong> produce Aura; sólo un momento memorable lo hace.
        Nunca es una barra y nunca es un porcentaje, y el verde brillante vive
        únicamente dentro del bloque negro — sobre papel fallaría contraste, así
        que la regla se auto-impone.
      </Note>

      <Grid min={280}>
        <div className="bg-surface border-rule flex items-center gap-4 border p-4">
          <div className="w-[110px] shrink-0">
            <EstiloTriangle estilo={career.estilo} />
          </div>
          <EstiloLegend estilo={career.estilo} className="flex-1" />
        </div>
        <div className="bg-surface border-rule flex flex-col gap-2 border p-4">
          <Label>Estilo</Label>
          <Note>
            Ternario y siempre suma 100. <strong>Ninguno es el malo:</strong> un
            Improvisador tiene que poder egresar, así que el polígono es el
            mismo verde hacia donde sea que se incline. Los ejes se distinguen
            por patrón de trazo —lleno, guionado, punteado—, no por tres colores
            inventados.
          </Note>
          <ul className="text-meta text-ink-secondary flex list-none flex-col gap-1 p-0">
            {ESTILO_AXES.map((axis) => (
              <li key={axis}>
                <strong className="text-ink">{estiloAxisLabel(axis)}</strong> —{' '}
                {career.estilo[axis]} %
              </li>
            ))}
          </ul>
        </div>
      </Grid>

      <div className="bg-surface border-rule flex flex-col gap-2 border p-4">
        <Label>Las contradicciones son la gracia</Label>
        {/*
          Una región que scrollea horizontalmente tiene que poder alcanzarse con
          el teclado: sin `tabIndex` nadie que no use un puntero llega a la mitad
          derecha de la tabla. El nombre accesible es lo que la vuelve navegable
          en vez de un contenedor anónimo enfocable.
        */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Tres carreras con los mismos cuatro valores"
          className="overflow-x-auto"
        >
          <table className="text-meta w-full min-w-[520px]">
            <thead>
              <tr className="border-rule border-b">
                {[
                  '',
                  'Promedio',
                  'Equipo',
                  'Aura',
                  'Estilo',
                  'Se lee como',
                ].map((head) => (
                  <th
                    key={head}
                    className="text-ink-label font-display py-2 text-left text-[10px] tracking-[0.1em] uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['A', 8.4, 72, 2450, '35 % Estratega', 'equilibrado'],
                [
                  'B',
                  9.4,
                  24,
                  -300,
                  '72 % Aplicado',
                  'mejores notas, nadie lo quiere en su grupo',
                ],
                [
                  'C',
                  6.3,
                  88,
                  4500,
                  '58 % Improvisador',
                  'zafa de todo y la escuela se acuerda',
                ],
              ].map((row) => (
                <tr key={String(row[0])} className="border-rule-soft border-b">
                  <td className="font-display text-ink py-2 font-bold">
                    {row[0]}
                  </td>
                  <td data-numeric className="text-ink py-2">
                    {formatPromedio(row[1] as number)}
                  </td>
                  <td data-numeric className="text-ink py-2">
                    {row[2]}
                  </td>
                  <td data-numeric className="text-ink py-2">
                    {formatAura(row[3] as number)}
                  </td>
                  <td className="text-ink py-2">{row[4]}</td>
                  <td className="text-ink-secondary py-2">{row[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          Sin medidores y sin «sobre 100» en Promedio ni Aura: nada sugiere que
          llenar todo sea el objetivo.
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CareerChips
          change={{
            promedio: { from: 8, to: 8.4 },
            equipo: { from: 50, to: 54, delta: 4 },
            estilo: { axis: 'estratega' },
          }}
        />
      </div>
      <Note>
        Un resultado muestra <strong>únicamente</strong> las dimensiones que se
        movieron. Nunca <code>Promedio +0</code>: la ausencia de una clave en el
        reporte del motor hace que el cero no sea representable.
      </Note>
    </Section>
  )
}

/* ------------------------------------------------------------------ datos */

function DataSection() {
  return (
    <Section title="Datos y ledger">
      <Grid min={300}>
        <div className="eg-canvas border-rule flex flex-col gap-3 border p-4">
          <Label>Grilla de datos · el colectivo</Label>
          <DataGrid items={[...BUS_DATA]} />
        </div>
        <div className="eg-canvas border-rule flex flex-col gap-3 border p-4">
          <Label>Ledger · el mural</Label>
          <Ledger items={[...MURAL_LEDGER]} />
        </div>
      </Grid>
      <Note>
        Todo número con el que haya que razonar va en la grilla; esconder un
        dato necesario en la prosa convierte un problema de matemática en uno de
        lectura. El ledger <strong>siempre</strong> muestra la aritmética real:
        el jugador tiene que poder ver el porqué, no sólo el veredicto.
      </Note>
    </Section>
  )
}

/* --------------------------------------------------------------- controls */

function ControlsSection() {
  const [quantity, setQuantity] = useState(2)

  return (
    <Section title="Chips, progreso y campos">
      <Grid min={260}>
        <Swatch name="chips">
          <div className="eg-canvas border-rule flex flex-wrap gap-2 border p-4">
            <Badge tone="up">Promedio 8,0 → 8,4</Badge>
            <Badge tone="down">Equipo −3</Badge>
            <Badge tone="outline">Estratega ↑</Badge>
            <Badge tone="soft">Improvisador ↑</Badge>
          </div>
        </Swatch>
        <Swatch name="progreso · celdas de la grilla">
          <div className="eg-canvas border-rule flex items-center justify-center border p-4">
            <StageProgress resolved={2} total={7} />
          </div>
        </Swatch>
        <Swatch name="sello">
          <div className="eg-canvas border-rule flex items-center justify-center gap-3 border p-4">
            <Stamp>Alcanzó</Stamp>
            <Stamp tone="red">No alcanzó</Stamp>
          </div>
        </Swatch>
      </Grid>

      <Grid min={280}>
        <div className="eg-canvas border-rule flex flex-col gap-4 border p-4">
          <TextField
            label="¿Cómo te decimos?"
            hint="Sólo se usa para la tarjeta del final."
            defaultValue="Sofi"
          />
          <NumberField
            label="Litros que comprás"
            unit="litros"
            defaultValue="2"
          />
          <NumberField
            label="Litros que comprás"
            unit="litros"
            defaultValue="99"
            error="Tiene que estar entre 1 y 4."
          />
        </div>
        <div className="eg-canvas border-rule flex flex-col gap-4 border p-4">
          <Label>Selector de cantidad</Label>
          <QuantityStepper
            id="demo-stepper"
            value={quantity}
            max={9}
            valueLabel="Cantidad de alfajor suelto"
            decreaseLabel="Quitar uno de alfajor suelto"
            increaseLabel="Agregar uno de alfajor suelto"
            onChange={setQuantity}
          />
          <Separator />
          <Callout tone="accent" title="Aviso">
            El filete de la izquierda toma el color del tono, pero el texto
            siempre dice lo que el aviso significa.
          </Callout>
        </div>
      </Grid>
    </Section>
  )
}

/* ------------------------------------------------------- shell y escenas */

function GameShellSection({ career }: { readonly career: CareerState }) {
  const [selected, setSelected] = useState<string | undefined>(undefined)

  return (
    <Section title="Shell y escenas" aside="412 px en todos los breakpoints">
      <Grid min={360}>
        <div className="max-w-viewport w-full">
          <GameSheet>
            <StageHeader stage="7.º grado" resolved={0} total={7} />
            <SceneColumn>
              <NarrativeCard eyebrow="Apertura" title="Arranca séptimo">
                Primer día. El aula huele a cuaderno nuevo, todavía nadie sabe
                los nombres de todos y en el pizarrón ya anunciaron la feria de
                fin de año.
              </NarrativeCard>
              <ActionSlot>
                <Button>Seguir</Button>
              </ActionSlot>
            </SceneColumn>
          </GameSheet>
        </div>

        <div className="max-w-viewport w-full">
          <GameSheet>
            <StageHeader stage="7.º grado" resolved={1} total={7} />
            <CareerStrip career={{ ...career, equipo: null, aura: null }} />
            <SceneColumn>
              <SituationCard
                eyebrow="Feria escolar"
                title="El mural"
                setup="Para la feria el curso va a pintar el mural de la pared del fondo. Falta comprar la pintura y la plata del curso no es infinita."
                data={[...MURAL_DATA]}
              >
                <DecisionBlock
                  goal="¿Qué comprás?"
                  action={
                    <Button
                      surface="decision"
                      disabled={selected === undefined}
                    >
                      Confirmar
                    </Button>
                  }
                >
                  <ul className="flex list-none flex-col gap-1.5 p-0">
                    {[
                      { id: 'm1', label: '1 litro', detail: '$ 12.000' },
                      { id: 'm2', label: '2 litros', detail: '$ 21.000' },
                      { id: 'm3', label: '4 litros', detail: '$ 38.000' },
                    ].map((option) => (
                      <li key={option.id}>
                        <ChoiceCard
                          id={`shell-${option.id}`}
                          name="shell-choice"
                          value={option.id}
                          label={option.label}
                          detail={option.detail}
                          selected={selected === option.id}
                          onSelect={() => {
                            setSelected(option.id)
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </DecisionBlock>
              </SituationCard>
            </SceneColumn>
          </GameSheet>
        </div>
      </Grid>
      <Note>
        <strong>Existe exactamente un primario montado a la vez.</strong>{' '}
        Mientras se decide vive dentro del bloque oscuro, junto a las opciones;
        al resolver salta al slot de acción, debajo del panel de resultado.
        Nunca hay que scrollear para atrás para continuar.
      </Note>
    </Section>
  )
}

/* --------------------------------------------------------------- feedback */

function FeedbackSection() {
  return (
    <Section title="Panel de resultado" aside="resultado → consecuencia">
      <Grid min={340}>
        <div className="eg-canvas border-rule border p-4">
          <FeedbackPanel
            feedback={feedbackFixture('optimal', {
              promedio: { from: 8, to: 8.4 },
              estilo: { axis: 'estratega' },
            })}
          />
        </div>
        <div className="eg-canvas border-rule border p-4">
          <FeedbackPanel
            feedback={feedbackFixture('functional', {
              estilo: { axis: 'improvisador' },
            })}
          />
        </div>
        <div className="eg-canvas border-rule border p-4">
          <FeedbackPanel
            feedback={feedbackFixture('invalid', {
              promedio: { from: 8.4, to: 7.9 },
              equipo: { from: 54, to: 51, delta: -3 },
            })}
          />
        </div>
        <div className="eg-canvas border-rule border p-4">
          <FeedbackPanel
            feedback={feedbackFixture('efficient', {
              aura: { delta: 1000, total: 1000 },
              estilo: { axis: 'aplicado' },
            })}
          />
        </div>
      </Grid>
      <Note>
        Los chips muestran sólo lo que se movió y el bloque de Aura aparece sólo
        si Aura cambió. Un <strong>Insuficiente</strong> nunca bloquea: tiene
        consecuencia y el juego sigue.
      </Note>
    </Section>
  )
}

/* ---------------------------------------------------------------- milestone */

function MilestoneSection({ career }: { readonly career: CareerState }) {
  return (
    <Section title="Cierre de etapa" aside="la única vez que sube el volumen">
      <div className="max-w-viewport w-full">
        <GameSheet>
          <StageHeader stage="7.º grado" resolved={7} total={7} />
          <CareerStrip career={career} />
          <SceneColumn>
            <Milestone eyebrow="Cierre de etapa" numeral="7.º">
              <div className="flex flex-col">
                <RecordRow label="Promedio" value="8,4" />
                <RecordRow label="Equipo" value="54" />
                <RecordRow label="Eventos" value="5" last />
              </div>
              <AuraBlock value={1000} />
              <div className="flex items-center gap-3.5 pt-0.5">
                <div className="w-[88px] shrink-0">
                  <EstiloTriangle estilo={career.estilo} />
                </div>
                <EstiloLegend estilo={career.estilo} className="flex-1" />
              </div>
              <MemorablePanel>
                Casi todo salió como lo pensaste. El curso te va a buscar el año
                que viene.
              </MemorablePanel>
              <ArchetypeStamp archetype="El Estratega" stampLine="DIC · 7.º" />
            </Milestone>
            <ActionSlot>
              <Button>Jugar de nuevo</Button>
            </ActionSlot>
          </SceneColumn>
        </GameSheet>
      </div>
      <Note>
        Fondo cuadriculado, numeral de 66 px con tilde sobre un filete de 2 px,
        renglones de registro, bloque negro de Aura, Estilo expandido, lo más
        memorable y el sello rotado −2°. El confeti son 18 tiras de CSS de 3×12
        px con posiciones deterministas: sin canvas, sin librería y sin un solo
        asset.
      </Note>
    </Section>
  )
}

/* ------------------------------------------------------------------ motion */

function MotionSection() {
  return (
    <Section title="Motion" aside="tres keyframes, sin librería">
      <Grid min={220}>
        {[
          [
            'select',
            '140 ms',
            'Elegir una opción. Nunca se anima el ancho del borde.',
          ],
          [
            'enter',
            '200 ms',
            'El bloque de contenido en cada cambio de escena.',
          ],
          [
            'resolve',
            '320 ms',
            'Un pop por resolución. Sólo el panel de resultado.',
          ],
          ['progress', '420 ms', 'Celda de progreso y transiciones numéricas.'],
          [
            'celebrate',
            '1400 ms',
            'Confeti. Sólo cierre de etapa, egreso y Aura +1.000.',
          ],
        ].map(([name, duration, note]) => (
          <div
            key={name}
            className="bg-surface border-rule flex flex-col gap-1.5 border p-3.5"
          >
            <span className="font-display text-ink text-[13px] font-extrabold">
              motion.{name}
            </span>
            <span
              data-numeric
              className="font-display text-green text-[15px] font-extrabold"
            >
              {duration}
            </span>
            <span className="text-meta text-ink-secondary">{note}</span>
          </div>
        ))}
      </Grid>
      <Note>
        Determinista, rápido y barato: sin librería de animación, sin Lottie,
        sin video. <code>prefers-reduced-motion</code> lleva las cinco
        duraciones a 1 ms de una sola vez, y{' '}
        <strong>ninguna información se transmite sólo por movimiento</strong>:
        los porcentajes de Estilo están impresos, el resultado está escrito y el
        progreso se distingue por forma.
      </Note>
    </Section>
  )
}

/* --------------------------------------------------------------------- arte */

function ArtSection() {
  return (
    <Section title="Arte" aside="UI primero">
      <Grid min={300}>
        <div className="eg-canvas border-rule flex flex-col gap-3 border p-4">
          <Label>Wordmark</Label>
          <Wordmark size="lg" />
          <Note>
            No es una imagen: es Schibsted Grotesk 800 con tracking −0,03em.
            Escala libre, recolorea por token, y sigue siendo texto
            seleccionable.
          </Note>
        </div>
        <div className="bg-surface border-rule flex flex-col gap-3 border p-4">
          <Label>SceneMedia</Label>
          <div className="border-rule text-ink-label flex aspect-3/2 items-center justify-center border border-dashed">
            <span className="text-caption">sin imagen</span>
          </div>
          <Note>
            16:9 (3:2 en mobile), <code>object-fit: cover</code>, borde de 1 px,
            radio 0, desaturado ~15 %.{' '}
            <strong>El pack raster está briefeado y no generado</strong>, y
            ninguna pantalla del slice de 7.º lo monta: todas corren con cero
            imágenes, que es exactamente la apuesta UI-first.
          </Note>
        </div>
      </Grid>
    </Section>
  )
}

/* ------------------------------------------------- distancia de referencias */

const CHECKLIST = [
  '¿Se ve la cuadrícula del papel alrededor de los bloques?',
  '¿Los títulos están en caja mixta, sin versalitas gritadas?',
  '¿La marca de corrección cae sobre el dato y no en un marco?',
  '¿El radio es 0 y no hay ninguna sombra?',
  '¿El verde brillante aparece únicamente dentro de un bloque negro de Aura?',
  '¿Seleccionar sigue siendo blanco, sin revelar el resultado?',
  '¿El progreso son celdas y no una barra segmentada arriba?',
  '¿El resultado muestra la cuenta real, y no sólo un veredicto?',
  '¿La pantalla seguiría siendo reconocible en escala de grises?',
]

function DistanceSection() {
  return (
    <Section
      title="Distancia de las referencias"
      aside="para cualquier pantalla nueva"
    >
      <ul className="bg-surface border-rule flex list-none flex-col border p-0">
        {CHECKLIST.map((question, index) => (
          <li
            key={question}
            className="border-rule-soft text-meta text-ink flex gap-3 border-b px-4 py-2.5 last:border-b-0"
          >
            <span
              data-numeric
              className="font-display text-ink-label w-5 shrink-0 font-bold"
            >
              {index + 1}
            </span>
            {question}
          </li>
        ))}
      </ul>
      <Note>
        Si alguna respuesta es «no», la pantalla se volvió genérica. Egresado
        hereda de sus referencias <em>principios de producto</em> —economía de
        información, velocidad, UI primero, jerarquía numérica fuerte— y no su
        expresión visual.
      </Note>
    </Section>
  )
}
