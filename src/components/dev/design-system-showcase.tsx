'use client'

/**
 * Vitrina del sistema de diseño.
 *
 * Muestra cada token y cada primitiva con contenido real de Egresado —«PARED
 * 6 m × 2,4 m», «$ 800.000», «7.º grado»— y no con texto de relleno. El relleno
 * esconde justamente los problemas que importan: cómo se parte un número largo,
 * qué pasa con una etiqueta en castellano, si una tarjeta entra en 360 px.
 *
 * No toca el motor. Los ejemplos son datos literales: la vitrina tiene que poder
 * abrirse aunque el juego esté roto.
 */

import { useState, type ReactNode } from 'react'

import {
  DataMetric,
  MetricGroup,
  MetricRows,
} from '@/components/game/data-metric'
import { Milestone } from '@/components/game/milestone'
import { NarrativeCard } from '@/components/game/narrative-card'
import { SituationCard } from '@/components/game/situation-card'
import { StageHeader, StageProgress } from '@/components/game/stage-header'
import { StatRow } from '@/components/game/stat-indicator'
import {
  Badge,
  Button,
  Callout,
  ChoiceCard,
  NumberField,
  Progress,
  QuantityStepper,
  Separator,
  Surface,
  TextField,
  Wordmark,
} from '@/components/ui'
import { cn } from '@/lib/ui/cn'

/*
  Los nombres de clase se escriben completos a propósito: Tailwind escanea el
  código como texto y una clase armada por interpolación —`bg-${family}-${step}`—
  simplemente no se genera.
*/
const PALETTE: Readonly<
  Record<'green' | 'red' | 'gray', readonly (readonly [string, string])[]>
> = {
  green: [
    ['50', 'bg-green-50'],
    ['100', 'bg-green-100'],
    ['200', 'bg-green-200'],
    ['300', 'bg-green-300'],
    ['400', 'bg-green-400'],
    ['500', 'bg-green-500'],
    ['600', 'bg-green-600'],
    ['700', 'bg-green-700'],
    ['800', 'bg-green-800'],
    ['900', 'bg-green-900'],
    ['950', 'bg-green-950'],
  ],
  red: [
    ['50', 'bg-red-50'],
    ['100', 'bg-red-100'],
    ['200', 'bg-red-200'],
    ['300', 'bg-red-300'],
    ['400', 'bg-red-400'],
    ['500', 'bg-red-500'],
    ['600', 'bg-red-600'],
    ['700', 'bg-red-700'],
    ['800', 'bg-red-800'],
    ['900', 'bg-red-900'],
    ['950', 'bg-red-950'],
  ],
  gray: [
    ['50', 'bg-gray-50'],
    ['100', 'bg-gray-100'],
    ['200', 'bg-gray-200'],
    ['300', 'bg-gray-300'],
    ['400', 'bg-gray-400'],
    ['500', 'bg-gray-500'],
    ['600', 'bg-gray-600'],
    ['700', 'bg-gray-700'],
    ['800', 'bg-gray-800'],
    ['900', 'bg-gray-900'],
    ['950', 'bg-gray-950'],
  ],
}

const SEMANTIC_SWATCHES = [
  ['canvas', 'bg-canvas'],
  ['surface', 'bg-surface'],
  ['surface-muted', 'bg-surface-muted'],
  ['surface-inverse', 'bg-surface-inverse'],
  ['primary', 'bg-primary'],
  ['primary-hover', 'bg-primary-hover'],
  ['primary-subtle', 'bg-primary-subtle'],
  ['accent', 'bg-accent'],
  ['accent-hover', 'bg-accent-hover'],
  ['accent-subtle', 'bg-accent-subtle'],
  ['danger', 'bg-danger'],
  ['line', 'bg-line'],
  ['line-interactive', 'bg-line-interactive'],
  ['line-selected', 'bg-line-selected'],
  ['focus', 'bg-focus'],
  ['selected-surface', 'bg-selected-surface'],
  ['disabled-surface', 'bg-disabled-surface'],
  ['optimal-surface', 'bg-optimal-surface'],
  ['efficient-surface', 'bg-efficient-surface'],
  ['functional-surface', 'bg-functional-surface'],
  ['invalid-surface', 'bg-invalid-surface'],
] as const

const TYPE_ROLES = [
  ['display', 'text-display', 'Tu 7.º grado'],
  ['title', 'text-title', 'El colectivo de siempre'],
  ['heading', 'text-heading', 'Cómo te fue'],
  ['subheading', 'text-subheading', 'Elegí en qué colectivo te subís'],
  [
    'body',
    'text-body',
    'El 60 viene con demora otra vez y todos calculan a qué hora salir.',
  ],
  [
    'body-sm',
    'text-body-sm',
    'Segunda semana: todavía estás aprendiendo cuánto tarda el viaje.',
  ],
  ['caption', 'text-caption', 'Podés usar: calculadora, anotador'],
  ['label', 'text-label', 'PORCIONES NECESARIAS'],
  ['data', 'text-data', '6 m × 2,4 m'],
  ['data-lg', 'text-data-lg', '$ 800.000'],
  ['data-xl', 'text-data-xl', '07:45'],
] as const

function Section({
  id,
  title,
  description,
  children,
}: {
  readonly id: string
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-title">
          {title}
        </h2>
        {description === undefined ? null : (
          <p className="text-body-sm text-foreground-muted text-pretty">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

/** Encuadra un componente al ancho real de un teléfono. */
function Viewport({
  width,
  children,
}: {
  readonly width: 360 | 390 | 430
  readonly children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-label text-foreground-muted">{width} px</p>
      <div
        className="border-line-strong rounded-surface bg-canvas shrink-0 overflow-hidden border border-dashed p-4"
        style={{ width: `${String(width)}px` }}
      >
        {children}
      </div>
    </div>
  )
}

function Row({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

export function DesignSystemShowcase() {
  const [choice, setChoice] = useState('salir-0645')
  const [quantity, setQuantity] = useState(2)

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-5 py-10">
      <header className="flex flex-col gap-3">
        <Badge tone="accent">Herramienta de desarrollo</Badge>
        <h1 className="text-display">
          <Wordmark size="lg" /> Design System v0.1
        </h1>
        <p className="text-body text-foreground-muted text-pretty">
          Referencia viva de tokens, primitivas de UI y primitivas de juego. Si
          un patrón está acá, se compone; no se vuelve a escribir. La
          documentación del porqué está en <code>docs/design-system/</code>.
        </p>
      </header>

      <Section
        id="paleta"
        title="Paleta primitiva"
        description="Verde, rojo y gris comparten la misma rampa de luminosidad en OKLCH. Los componentes de producto no la usan directamente: consumen los tokens semánticos."
      >
        {(['green', 'red', 'gray'] as const).map((family) => (
          <div key={family} className="flex flex-col gap-1.5">
            <p className="text-label text-foreground-muted">{family}</p>
            <div className="flex flex-wrap gap-1">
              {PALETTE[family].map(([step, className]) => (
                <div key={step} className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      'border-line rounded-control size-12 border',
                      className,
                    )}
                  />
                  <span className="text-caption text-foreground-muted tabular-nums">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section
        id="semanticos"
        title="Tokens semánticos"
        description="Lo que consumen los componentes. Cambiar un tema es redefinir esta capa, no reescribir las pantallas."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SEMANTIC_SWATCHES.map(([name, className]) => (
            <div
              key={name}
              className="border-line rounded-surface flex items-center gap-2 border p-2"
            >
              <span
                className={cn(
                  'border-line rounded-control size-8 shrink-0 border',
                  className,
                )}
              />
              <code className="text-caption min-w-0 truncate">{name}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="tipografia"
        title="Tipografía"
        description="Roles, no tamaños. Las escalas por defecto de Tailwind están apagadas: text-xs o text-2xl no existen en este proyecto."
      >
        <div className="flex flex-col gap-4">
          {TYPE_ROLES.map(([role, className, sample]) => (
            <div key={role} className="flex flex-col gap-1">
              <code className="text-caption text-foreground-muted">
                {className}
              </code>
              <p className={cn(className, 'text-pretty')}>{sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="forma"
        title="Radio, elevación y movimiento"
        description="Cuatro radios con nombre, tres niveles de elevación y tres duraciones. Nada más."
      >
        <Row>
          {(
            [
              ['control', 'rounded-control'],
              ['surface', 'rounded-surface'],
              ['card', 'rounded-card'],
              ['pill', 'rounded-pill'],
            ] as const
          ).map(([radius, className]) => (
            <div key={radius} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'bg-surface-muted border-line size-16 border',
                  className,
                )}
              />
              <code className="text-caption">{radius}</code>
            </div>
          ))}
        </Row>
        <Row>
          {(
            [
              ['surface', 'shadow-surface'],
              ['raised', 'shadow-raised'],
              ['overlay', 'shadow-overlay'],
            ] as const
          ).map(([level, className]) => (
            <div key={level} className="flex flex-col items-center gap-1.5">
              <span
                className={cn('bg-surface rounded-surface size-16', className)}
              />
              <code className="text-caption">{level}</code>
            </div>
          ))}
        </Row>
        <Row>
          {(
            ['motion-fast', 'motion-standard', 'motion-emphasized'] as const
          ).map((motion) => (
            <span
              key={motion}
              className={cn(
                'bg-surface-muted hover:bg-primary hover:text-primary-foreground rounded-control text-caption px-4 py-3 transition-colors',
                motion,
              )}
            >
              {motion} (pasá el mouse)
            </span>
          ))}
        </Row>
      </Section>

      <Section
        id="botones"
        title="Button"
        description="Las variantes describen jerarquía, no color. Una pantalla tiene una sola acción primaria."
      >
        <Row>
          <Button>Confirmar</Button>
          <Button variant="secondary">Empezar de nuevo</Button>
          <Button variant="ghost">Mostrar diagnóstico</Button>
          <Button variant="danger">Borrar la partida</Button>
        </Row>
        <Row>
          <Button size="sm">Chico</Button>
          <Button size="md">Mediano</Button>
          <Button size="lg">Grande</Button>
        </Row>
        <Row>
          <Button disabled>Confirmar</Button>
          <Button variant="secondary" disabled>
            Seguir jugando
          </Button>
        </Row>
        <Button block size="lg">
          Ancho completo, como en el juego
        </Button>
      </Section>

      <Section id="superficies" title="Surface, Badge, Separator y Callout">
        <div className="grid gap-3 sm:grid-cols-3">
          <Surface>Superficie por defecto</Surface>
          <Surface tone="muted">Superficie apagada</Surface>
          <Surface tone="raised">Superficie elevada</Surface>
        </div>
        <Row>
          <Badge tone="brand">7.º grado</Badge>
          <Badge tone="neutral">Evento 3 de 7</Badge>
          <Badge tone="accent">Feria</Badge>
          <Badge tone="outline">Práctica</Badge>
          <Badge tone="inverse">Beta</Badge>
        </Row>
        <Separator />
        <Callout title="Sin conexión">
          El resultado quedó guardado en el dispositivo y se sincroniza cuando
          vuelva la señal.
        </Callout>
        <Callout tone="warning" title="Herramienta de desarrollo">
          Contenido de prueba, no es el juego Egresado.
        </Callout>
      </Section>

      <Section
        id="campos"
        title="Campos"
        description="La etiqueta siempre es visible: el placeholder no hace de etiqueta. El error se anuncia y además marca aria-invalid."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="¿Cómo te decimos?"
            defaultValue="Sofi"
            hint="Sólo se usa para la tarjeta del final."
          />
          <TextField
            label="¿Cómo te decimos?"
            defaultValue="a"
            error="Poné al menos 2 caracteres."
          />
          <NumberField label="Tu respuesta" unit="litros" defaultValue="1.8" />
          <NumberField
            label="Tu respuesta"
            unit="litros"
            defaultValue="0"
            disabled
          />
        </div>
        <div className="flex items-center gap-4">
          <QuantityStepper
            id="showcase-stepper"
            value={quantity}
            max={12}
            valueLabel="Cantidad de alfajores"
            decreaseLabel="Quitar un alfajor"
            increaseLabel="Agregar un alfajor"
            onChange={setQuantity}
          />
          <p className="text-body-sm text-foreground-muted">
            QuantityStepper — botones de 44 px
          </p>
        </div>
      </Section>

      <Section
        id="eleccion"
        title="ChoiceCard"
        description="Elegir no es acertar: el estado seleccionado es neutro y nunca verde. Antes de confirmar, el color no puede revelar el resultado."
      >
        <fieldset className="flex flex-col gap-2.5 border-0 p-0">
          <legend className="sr-only">Elegí en qué colectivo te subís</legend>
          {[
            ['salir-0645', 'Salir 06:45'],
            ['salir-0700', 'Salir 07:00'],
            ['salir-0710', 'Salir 07:10'],
          ].map(([id, label]) => (
            <ChoiceCard
              key={id}
              id={`showcase-${String(id)}`}
              name="showcase-choice"
              value={String(id)}
              label={String(label)}
              selected={choice === id}
              disabled={false}
              onSelect={() => {
                setChoice(String(id))
              }}
            />
          ))}
          <ChoiceCard
            id="showcase-disabled"
            name="showcase-choice-disabled"
            value="disabled"
            label="Salir 07:20"
            detail="Opción deshabilitada"
            selected={false}
            disabled
            onSelect={() => undefined}
          />
        </fieldset>
      </Section>

      <Section
        id="datos"
        title="DataMetric"
        description="El dato le tiene que ganar a la prosa por tamaño, peso y tinta. Nunca por color."
      >
        <MetricGroup
          items={[
            { label: 'Pared', value: '6 m × 2,4 m' },
            { label: 'Rinde', value: '8 m² por litro' },
            { label: 'Precio de lista', value: '$ 800.000' },
            { label: 'Entrada', value: '07:45' },
          ]}
        />
        <DataMetric label="Puntaje del año" value="3415" prominent />
        <Surface tone="muted">
          <MetricRows
            items={[
              { label: 'Viaje normal', value: '28 min' },
              { label: 'Demora', value: '7 min' },
              { label: 'Margen', value: '25 min' },
            ]}
          />
        </Surface>
      </Section>

      <Section id="progreso" title="Progreso y estadísticas">
        <Progress value={3} max={7} label="Progreso del año" />
        <StageHeader stage="7.º grado" playerName="Sofi" />
        <StageProgress resolved={3} total={7} />
        <StatRow
          stats={[
            { label: 'Conocimiento', value: 57 },
            { label: 'Equipo', value: 52 },
            { label: 'Iniciativa', value: 56 },
            { label: 'Energía', value: 66 },
          ]}
        />
      </Section>

      <Section
        id="juego"
        title="Primitivas de juego"
        description="Una situación matemática y un momento narrativo se distinguen por forma y tipografía, no por una estética aparte."
      >
        <Surface tone="plain" padding="none" className="flex flex-col gap-8">
          <SituationCard
            title="El mural del curso"
            context="Empieza el proyecto: el curso eligió qué presentar en la feria."
            setup="Para la feria el curso va a pintar un mural en la pared del fondo. Falta comprar la pintura y la plata del curso no es infinita."
            goal="Elegí el envase que alcance para toda la pared."
            footnote="Podés usar: calculadora"
            actions={
              <Button size="lg" block>
                Confirmar
              </Button>
            }
          >
            <MetricGroup
              items={[
                { label: 'Pared', value: '6 m × 2,4 m' },
                { label: 'Rinde', value: '8 m² por litro' },
              ]}
            />
          </SituationCard>

          <NarrativeCard
            title="Falta el equipo"
            actions={
              <Button size="lg" block>
                Continuar
              </Button>
            }
          >
            Para mostrar el proyecto hace falta una notebook y la que había dejó
            de andar en mayo.
          </NarrativeCard>

          <Milestone eyebrow="Sofi · año terminado" title="Tu 7.º grado">
            Resolviste todo lo que se te puso adelante, algunas cosas con más
            margen que otras.
          </Milestone>
        </Surface>
      </Section>

      <Section
        id="resultados"
        title="Resultado de una decisión"
        description="Cuatro estados del motor, cada uno con nombre escrito, ícono de forma propia y tono. Nunca sólo color."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              [
                'optimal',
                'Óptimo',
                'border-optimal-line bg-optimal-surface text-optimal-foreground',
              ],
              [
                'efficient',
                'Eficiente',
                'border-efficient-line bg-efficient-surface text-efficient-foreground',
              ],
              [
                'functional',
                'Funcionó',
                'border-functional-line bg-functional-surface text-functional-foreground',
              ],
              [
                'invalid',
                'No alcanzó',
                'border-invalid-line bg-invalid-surface text-invalid-foreground',
              ],
            ] as const
          ).map(([quality, label, tone]) => (
            <div
              key={quality}
              className={cn('rounded-card border-2 p-4', tone)}
            >
              <p className="text-heading">{label}</p>
              <code className="text-caption">{quality}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="viewports"
        title="Anchos reales"
        description="Los mismos componentes al ancho de un teléfono. Es donde aparecen los desbordes."
      >
        {/*
          Los previews tienen un ancho fijo mayor que un teléfono, así que
          desbordan por definición. La regla del sistema es que el contenido
          ancho scrollee en su propia caja y nunca el documento.
        */}
        <div className="-mx-5 flex items-start gap-6 overflow-x-auto px-5 pb-2">
          {([360, 390, 430] as const).map((width) => (
            <Viewport key={width} width={width}>
              <div className="flex flex-col gap-4">
                <StageHeader stage="7.º grado" playerName="Sofi" />
                <StageProgress resolved={3} total={7} />
                <MetricGroup
                  items={[
                    { label: 'Porciones necesarias', value: '24' },
                    { label: 'Plata del curso', value: '$ 24.000' },
                  ]}
                />
                <Button block size="lg">
                  Confirmar
                </Button>
              </div>
            </Viewport>
          ))}
        </div>
      </Section>
    </main>
  )
}
