/**
 * Lo que un jugador **ve**, leído como números.
 *
 * Las políticas de atajo de la auditoría permanente sólo pueden usar la
 * presentación renderizada: etiquetas, valores, unidades y los detalles de cada
 * ítem u opción. Este módulo convierte ese texto en cifras con unidad, y nada
 * más. No conoce parámetros, ni la respuesta esperada, ni identificadores de
 * Template: si un número no está impreso en la pantalla, acá no existe
 * (RS-CLO-AUDIT-001, frontera de información).
 *
 * Las cifras se escriben como se escriben en el juego —`1.250`, `$10.000`—, así
 * que el punto es separador de miles y nunca decimal.
 */
import type {
  PresentedDatum,
  PresentedOption,
  PresentedQuantityItem,
} from '@/game'

/** Una cifra impresa, con la unidad que la acompaña. */
export interface Figure {
  readonly amount: number
  /** Unidad normalizada (`min`, `mb`, `$`, `h`…), o `''` si no se imprimió. */
  readonly unit: string
  /**
   * El recurso que la pantalla nombra **después** de la unidad, si lo nombra.
   *
   * «1 min **de notebook**» dice que ese minuto es de la notebook y no del
   * laboratorio. Sin esto, dos capacidades impresas en la misma unidad se
   * confunden y una restricción ajena se ata a un costo que no le corresponde
   * (MAT-FC-001). Vacío cuando la pantalla no lo dice.
   */
  readonly of: string
}

/**
 * La identidad **semántica** de una magnitud: unidad y recurso.
 *
 * Es la coordenada con la que la auditoría compara costos y presupuestos. Dos
 * magnitudes con la misma unidad y distinto recurso son magnitudes distintas,
 * por más que se rendericen igual.
 */
export interface Dimension {
  readonly unit: string
  readonly of: string
}

/** Clave estable de una dimensión. Determinista y sin ambigüedad de string suelto. */
export function dimensionKey(dimension: Dimension): string {
  return dimension.of === ''
    ? dimension.unit
    : `${dimension.unit}@${dimension.of}`
}

export function dimensionOf(figure: Figure): Dimension {
  return { unit: figure.unit, of: figure.of }
}

/** Cómo se nombra una dimensión en un informe. Legible, y todavía sin ambigüedad. */
export function dimensionLabel(dimension: Dimension): string {
  return dimension.of === ''
    ? dimension.unit
    : `${dimension.unit} de ${dimension.of}`
}

/**
 * Si una etiqueta impresa nombra el recurso de una dimensión.
 *
 * «Notebook prestada» nombra `notebook`; «Laboratorio», no. Es una comparación
 * por palabra entera sobre el texto plegado, para que `lab` no case dentro de
 * `laboratorio` por accidente.
 */
export function labelNames(label: string, resource: string): boolean {
  if (resource === '') return true
  return fold(label)
    .split(/[^\p{L}\p{N}]+/u)
    .includes(resource)
}

/**
 * Unidades que el contenido escribe de más de una forma.
 *
 * Es una tabla de sinónimos de lectura, no un diccionario del dominio: sirve
 * para que «25 min» de un ítem y «150 minutos» de una restricción se reconozcan
 * como la misma magnitud, que es exactamente lo que hace un jugador.
 */
const UNIT_SYNONYMS: Readonly<Record<string, string>> = {
  min: 'min',
  mins: 'min',
  minuto: 'min',
  minutos: 'min',
  h: 'h',
  hs: 'h',
  hora: 'h',
  horas: 'h',
  mb: 'mb',
  megas: 'mb',
  gb: 'gb',
  peso: '$',
  pesos: '$',
  km: 'km',
  m: 'm',
  cm: 'cm',
  l: 'l',
  litro: 'l',
  litros: 'l',
}

/** Quita acentos y mayúsculas: `Minutos` y `minutos` son la misma unidad. */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/gu, '').toLowerCase()
}

export function normalizeUnit(raw: string | undefined): string {
  if (raw === undefined) return ''
  const folded = fold(raw).trim()
  if (folded.startsWith('$')) return '$'
  const word = /^[a-z]+/u.exec(folded)?.[0] ?? ''
  return UNIT_SYNONYMS[word] ?? word
}

/**
 * Una unidad compuesta `«A por B»`, que es una tasa de conversión.
 *
 * `MB por minuto` dice cuántos MB entran en un minuto: convierte un presupuesto
 * en minutos en un presupuesto en MB. Es la relación que el jugador tiene que
 * usar, y está impresa.
 */
export interface RateUnit {
  readonly produced: string
  readonly per: string
}

export function parseRateUnit(raw: string | undefined): RateUnit | undefined {
  if (raw === undefined) return undefined
  const match = /^([a-z$]+)\s+por\s+([a-z]+)$/u.exec(fold(raw).trim())
  if (match === undefined || match === null) return undefined
  const produced = normalizeUnit(match[1])
  const per = normalizeUnit(match[2])
  return produced === '' || per === '' || produced === per
    ? undefined
    : { produced, per }
}

/**
 * Las cifras de un texto, en orden de lectura.
 *
 * `$4.000` es una cifra en pesos; `25 min`, una en minutos; `1.250 MB`, una en
 * MB. Un número sin unidad queda con unidad vacía y sólo se usa donde la
 * política declara de dónde lo saca.
 */
const FIGURE_PATTERN =
  /(\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:\s*([\p{L}$]+))?(?:\s+de\s+([\p{L}]+))?/gu

export function figuresIn(text: string, fallbackUnit = ''): readonly Figure[] {
  const figures: Figure[] = []
  for (const match of text.matchAll(FIGURE_PATTERN)) {
    const amount = Number((match[2] ?? '').replace(/\./gu, ''))
    if (!Number.isSafeInteger(amount)) continue
    const suffix = normalizeUnit(match[3])
    const unit =
      match[1] === undefined ? (suffix === '' ? fallbackUnit : suffix) : '$'
    // El recurso sólo cuenta cuando viene pegado a una unidad escrita: en
    // «250 MB cada una» no hay `de`, y en «5 min de viaje» sí lo hay.
    const of = suffix === '' ? '' : fold(match[4] ?? '').trim()
    figures.push({ amount, unit, of })
  }
  return figures
}

/** Las cifras de un dato presentado, con su unidad declarada como respaldo. */
export function figuresOfDatum(datum: PresentedDatum): readonly Figure[] {
  return figuresIn(datum.value, normalizeUnit(datum.unit))
}

/** Las cifras del detalle de un ítem de cantidades. */
export function figuresOfItem(item: PresentedQuantityItem): readonly Figure[] {
  return figuresIn(item.detail)
}

/** Las cifras del detalle de una opción, vacías si la opción no trae detalle. */
export function figuresOfOption(option: PresentedOption): readonly Figure[] {
  return option.detail === undefined ? [] : figuresIn(option.detail)
}

/** Las cifras de una unidad, en orden de lectura. */
export function figuresOfUnit(
  figures: readonly Figure[],
  unit: string,
): readonly number[] {
  return figures
    .filter((figure) => figure.unit === unit)
    .map((figure) => figure.amount)
}

/** Las cifras de una dimensión semántica, en orden de lectura. */
export function figuresOfDimension(
  figures: readonly Figure[],
  dimension: Dimension,
): readonly number[] {
  const wanted = dimensionKey(dimension)
  return figures
    .filter((figure) => dimensionKey(dimensionOf(figure)) === wanted)
    .map((figure) => figure.amount)
}

/** Las unidades presentes, en orden de primera aparición. */
export function unitsOf(figures: readonly Figure[]): readonly string[] {
  return [...new Set(figures.map((figure) => figure.unit))].filter(
    (unit) => unit !== '',
  )
}

/** Las dimensiones presentes, en orden de primera aparición. */
export function dimensionsOf(figures: readonly Figure[]): readonly Dimension[] {
  const seen = new Map<string, Dimension>()
  for (const figure of figures) {
    if (figure.unit === '') continue
    const dimension = dimensionOf(figure)
    const key = dimensionKey(dimension)
    if (!seen.has(key)) seen.set(key, dimension)
  }
  return [...seen.values()]
}
