import { ESTILO_AXES, estiloAxisLabel, type Estilo } from '@/game'
import { cn } from '@/lib/ui/cn'

import { formatPercent } from './format'

/**
 * Estilo, como triángulo.
 *
 * Tres ejes —Aplicado · Estratega · Improvisador— que suman 100. **Ninguno es el
 * malo:** un Improvisador tiene que poder egresar, así que el polígono es el
 * mismo verde hacia donde sea que se incline y no hay tres colores inventados
 * que sugieran cuál conviene.
 *
 * Es SVG inline y aritmética: sin librería de charting. Un radar de tres puntos
 * son cuatro polígonos y un círculo; importar 40 kB para eso sería pagar un
 * peaje por no escribir doce líneas.
 *
 * **El dibujo nunca es la única lectura.** El label accesible dice los tres
 * porcentajes, y el panel expandido los imprime al lado. Si la animación no
 * corre —o si nadie ve el SVG— la información sigue completa.
 */

interface Point {
  readonly x: number
  readonly y: number
}

/** El vértice de cada eje, en coordenadas normalizadas de 0 a 1. */
const VERTEX: Readonly<Record<(typeof ESTILO_AXES)[number], Point>> = {
  aplicado: { x: 0.5, y: 0.06 },
  improvisador: { x: 0.94, y: 0.9 },
  estratega: { x: 0.06, y: 0.9 },
}

/** Y del baricentro del triángulo de referencia: desde ahí se estiran los ejes. */
const ORIGIN_Y = 0.62

function format(point: Point, size: number): string {
  return `${(point.x * size).toFixed(1)},${(point.y * size).toFixed(1)}`
}

/**
 * Cuánto se estira un eje.
 *
 * Media vuelta (50 %) llega al vértice. El tope en 1 mantiene el polígono
 * **dentro** del triángulo de referencia, que es lo que el sistema especifica: un
 * eje que se disparara fuera del marco convertiría la figura en una mancha y ya
 * no se leería como «cuánto de cada cosa». Arriba de 50 % la diferencia la
 * siguen contando el punto del centroide y los porcentajes impresos.
 */
function reach(share: number): number {
  return Math.min(1, Math.max(0.08, share / 50))
}

function towards(axis: keyof Estilo, share: number): Point {
  const vertex = VERTEX[axis]
  const factor = reach(share)
  return {
    x: 0.5 + (vertex.x - 0.5) * factor,
    y: ORIGIN_Y + (vertex.y - ORIGIN_Y) * factor,
  }
}

/** Descripción textual, que es la lectura real para quien no ve el dibujo. */
export function describeEstilo(estilo: Estilo): string {
  const parts = ESTILO_AXES.map(
    (axis) => `${String(estilo[axis])} por ciento ${estiloAxisLabel(axis)}`,
  )
  return `Estilo: ${parts.join(', ')}`
}

export function EstiloTriangle({
  estilo,
  className,
}: {
  readonly estilo: Estilo
  readonly className?: string
}) {
  const size = 100
  const reference = [VERTEX.aplicado, VERTEX.improvisador, VERTEX.estratega]
    .map((point) => format(point, size))
    .join(' ')

  const shape = ESTILO_AXES.map((axis) =>
    format(towards(axis, estilo[axis]), size),
  ).join(' ')

  // El punto negro cae en el centroide ponderado: es la lectura de un vistazo,
  // y se mueve aunque el polígono esté topeado.
  const centroid = {
    x:
      ESTILO_AXES.reduce(
        (sum, axis) => sum + VERTEX[axis].x * estilo[axis],
        0,
      ) / 100,
    y:
      ESTILO_AXES.reduce(
        (sum, axis) => sum + VERTEX[axis].y * estilo[axis],
        0,
      ) / 100,
  }

  return (
    <svg
      viewBox={`0 0 ${String(size)} ${String(size * 0.96)}`}
      role="img"
      aria-label={describeEstilo(estilo)}
      className={cn('h-auto w-full', className)}
    >
      <polygon
        points={reference}
        fill="none"
        className="stroke-estilo-reference"
        strokeWidth={1}
      />
      <polygon
        points={shape}
        className="fill-estilo-axis/15 stroke-estilo-axis motion-estilo"
        strokeWidth={2}
      />
      <circle
        cx={centroid.x * size}
        cy={centroid.y * size}
        r={size * 0.042}
        className="fill-estilo-point motion-estilo"
      />
    </svg>
  )
}

/**
 * Los tres porcentajes, impresos.
 *
 * Los ejes se distinguen por **patrón de trazo** —lleno, guionado, punteado— y
 * no por tres colores inventados, así que la leyenda sigue funcionando en escala
 * de grises y no le pide a nadie recordar qué verde era cuál.
 */
export function EstiloLegend({
  estilo,
  className,
}: {
  readonly estilo: Estilo
  readonly className?: string
}) {
  const dash: Readonly<Record<(typeof ESTILO_AXES)[number], string>> = {
    aplicado: 'border-t-2 border-solid',
    estratega: 'border-t-2 border-dashed',
    improvisador: 'border-t-2 border-dotted',
  }

  return (
    <ul
      className={cn('font-display flex flex-col gap-[5px]', className)}
      // La lista repetiría lo que el label del triángulo ya dice.
      aria-hidden="true"
    >
      {ESTILO_AXES.map((axis) => (
        <li key={axis} className="flex items-center gap-2">
          <span className={cn('border-estilo-axis block w-4', dash[axis])} />
          <span className="text-ink flex-1 text-[11px] font-semibold">
            {estiloAxisLabel(axis)}
          </span>
          <span data-numeric className="text-ink text-[12.5px] font-extrabold">
            {formatPercent(estilo[axis])}
          </span>
        </li>
      ))}
    </ul>
  )
}
