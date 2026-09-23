import { BRAND_HEX } from './brand'

/**
 * El isotipo de Egresado, como geometría.
 *
 * Una sumatoria con el birrete encima y el listón colgando a la derecha,
 * terminado en un rombo verde. Es la única fuente del símbolo: el componente
 * inline lo dibuja desde acá y `scripts/brand/build-brand-assets.ts` deriva de
 * acá los SVG de `public/assets/brand/` y todos los íconos raster, así que no
 * hay dos dibujos que puedan dejar de parecerse.
 *
 * La referencia aprobada por el Product Owner fue un raster; esto es una
 * reconstrucción, no un calco. Toda la marca sale de tres direcciones —la
 * horizontal, la diagonal del birrete (5:2, ≈22°) y la de la sumatoria
 * (5:6, ≈40°)— y de dos grosores: 24 para los trazos horizontales y ≈32 para
 * las diagonales, que en una Σ de palo seco van más pesadas. La caja es de
 * 200 × 240, con el símbolo pegado a sus cuatro lados.
 *
 * Cuatro decisiones ópticas que no están en el raster:
 * - el canal blanco entre el birrete y todo lo de abajo mide siempre 10;
 * - el borde izquierdo de la banda y el de la Σ coinciden (x = 25), y el
 *   extremo derecho de la barra inferior coincide con el listón (x = 178);
 * - el trazo superior de la Σ termina 7 antes de tocar la banda, donde el
 *   raster los dejaba rozándose;
 * - el listón cuelga del mismo canal de 10 que separa el birrete de la banda.
 */

export const BRAND_MARK_BOX = { width: 200, height: 240 } as const

/** Los trazos de tinta del símbolo canónico, en orden de dibujo. */
export const BRAND_MARK_INK = {
  /** El techo del birrete: un rombo de 200 × 80. */
  cap: 'M100 0 200 40 100 80 0 40Z',
  /** La base del birrete, en chevrón, paralela al techo y con cortes verticales. */
  band: 'M25 60 100 90 165 64V88L100 114 25 84Z',
  /** La sumatoria: trazo superior corto, dos diagonales y la barra inferior. */
  sigma: 'M25 108H67L112 162 67 216H178V240H25V216L70 162Z',
  /** El listón, que entra 8 en el rombo para no dejar una muesca. */
  cord: 'M178 58H186V116H178Z',
} as const

/** El rombo del listón: el único trazo que lleva el verde. */
export const BRAND_MARK_DIAMOND = 'M182 108 200 126 182 144 164 126Z'

/**
 * La variante óptica para 16–48 px.
 *
 * Mismo símbolo, misma caja: a esa escala el canal de 10 y el listón de 8 se
 * funden, así que la base del birrete pasa a ser el trazo superior de la Σ
 * —que gana su barra completa—, el techo se achata para cederle altura, el
 * canal crece a 20, el listón a 16 y el rombo a 52. Es la que usan el favicon
 * y el `icon.svg`.
 */
export const BRAND_MARK_SMALL_INK = {
  /** Más chato (10:3) para cederle altura a la Σ, que es lo que se lee. */
  cap: 'M100 0 200 30 100 60 0 30Z',
  sigma: 'M25 80H140V110H77L112 160 77 210H178V240H25V210L60 160 25 110Z',
  cord: 'M166 56H182V100H166Z',
} as const

export const BRAND_MARK_SMALL_DIAMOND = 'M174 94 200 120 174 146 148 120Z'

export type BrandMarkVariant = 'default' | 'mono' | 'reverse'

/** Con qué se pinta cada variante: la tinta de los trazos y la del rombo. */
export function brandMarkFills(variant: BrandMarkVariant): {
  readonly ink: string
  readonly diamond: string
} {
  switch (variant) {
    case 'default':
      return { ink: BRAND_HEX.ink, diamond: BRAND_HEX.green }
    case 'mono':
      return { ink: BRAND_HEX.ink, diamond: BRAND_HEX.ink }
    case 'reverse':
      return { ink: BRAND_HEX.canvas, diamond: BRAND_HEX.canvas }
  }
}

/** Los trazos de una de las dos construcciones, como un `<g>` sin transformar. */
export function brandMarkGroup(
  fills: { readonly ink: string; readonly diamond: string },
  small = false,
): string {
  const ink = small ? BRAND_MARK_SMALL_INK : BRAND_MARK_INK
  const diamond = small ? BRAND_MARK_SMALL_DIAMOND : BRAND_MARK_DIAMOND
  const paths = Object.values(ink)
    .map((d) => `<path d="${d}"/>`)
    .join('')
  return `<g fill="${fills.ink}">${paths}</g><path fill="${fills.diamond}" d="${diamond}"/>`
}

/**
 * Un SVG completo del símbolo, en su caja de 200 × 240.
 *
 * Es el archivo canónico y sus dos variantes: sin `<style>`, sin script, sin
 * referencias externas, con los colores escritos porque un archivo suelto no
 * tiene tokens de dónde leerlos.
 */
export function brandMarkSvg(variant: BrandMarkVariant): string {
  const { width, height } = BRAND_MARK_BOX
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}">${brandMarkGroup(brandMarkFills(variant))}</svg>\n`
}

/**
 * Un ícono cuadrado: el símbolo centrado sobre papel.
 *
 * `scale` es qué fracción del lado ocupa la altura del símbolo. Los íconos de
 * app dejan el margen que piden los lanzadores (el símbolo entra en el círculo
 * seguro de una máscara); el favicon deja menos, porque a 16 px cada píxel
 * cuenta.
 */
export function brandIconSvg(options: {
  readonly size: number
  readonly scale: number
  readonly small?: boolean
}): string {
  const { size, scale, small = false } = options
  const { width, height } = BRAND_MARK_BOX
  const k = (size * scale) / height
  const tx = (size - width * k) / 2
  const ty = (size - height * k) / 2
  const round = (value: number) => String(Math.round(value * 1000) / 1000)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(size)} ${String(size)}"><rect width="${String(size)}" height="${String(size)}" fill="${BRAND_HEX.canvas}"/><g transform="translate(${round(tx)} ${round(ty)}) scale(${round(k)})">${brandMarkGroup(brandMarkFills('default'), small)}</g></svg>\n`
}

/**
 * Qué íconos se derivan y cómo.
 *
 * Los tres tamaños del favicon y el `icon.svg` usan la construcción pequeña con
 * poco margen; los íconos de app y el de Apple usan la canónica con el margen
 * que piden los lanzadores. El script de assets y el test que vigila los
 * archivos leen la misma tabla.
 */
export const BRAND_ICON_SPEC = {
  favicon: { sizes: [16, 32, 48], scale: 0.86, small: true },
  svg: { size: 64, scale: 0.86, small: true },
  apple: { size: 180, scale: 0.64, small: false },
  app: { sizes: [192, 512], scale: 0.64, small: false },
} as const
