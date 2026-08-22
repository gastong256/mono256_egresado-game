/**
 * OKLCH → sRGB y contraste WCAG.
 *
 * El sistema de diseño define su paleta en OKLCH porque es perceptualmente
 * uniforme: una rampa con la misma diferencia de L se ve igual de escalonada en
 * verde que en rojo. Pero WCAG mide contraste sobre luminancia relativa de sRGB,
 * así que hay que convertir de verdad en lugar de estimar a ojo.
 *
 * Las fórmulas son las de Björn Ottosson (Oklab) y las de WCAG 2.2 para
 * luminancia relativa y ratio de contraste.
 */

/** @typedef {{ l: number, c: number, h: number }} Oklch */

/** Parsea `oklch(62% 0.13 152)` o `oklch(0.62 0.13 152)`. */
export function parseOklch(value) {
  const match = /oklch\(\s*([0-9.]+)(%?)\s+([0-9.]+)\s+([0-9.]+)\s*\)/iu.exec(
    value,
  )
  if (match === null) return undefined

  const [, rawL = '0', percent = '', rawC = '0', rawH = '0'] = match
  const l = Number(rawL) / (percent === '%' ? 100 : 1)
  return { l, c: Number(rawC), h: Number(rawH) }
}

/** OKLCH → sRGB lineal, sin recortar: los negativos delatan fuera de gamut. */
export function oklchToLinearRgb({ l, c, h }) {
  const radians = (h * Math.PI) / 180
  const a = c * Math.cos(radians)
  const b = c * Math.sin(radians)

  const lCone = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sCone = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

  return {
    r: 4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    g: -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    b: -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  }
}

const clamp01 = (value) => Math.min(1, Math.max(0, value))

/** Un color fuera de gamut se recorta al mostrarlo; hay que saber cuándo pasa. */
export function isOutOfGamut(oklch, tolerance = 0.001) {
  const { r, g, b } = oklchToLinearRgb(oklch)
  return [r, g, b].some(
    (channel) => channel < -tolerance || channel > 1 + tolerance,
  )
}

function encodeGamma(channel) {
  const value = clamp01(channel)
  return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055
}

export function oklchToHex(oklch) {
  const { r, g, b } = oklchToLinearRgb(oklch)
  const toByte = (channel) =>
    Math.round(encodeGamma(channel) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}

/** Luminancia relativa WCAG, calculada sobre el color efectivamente mostrado. */
export function relativeLuminance(oklch) {
  const { r, g, b } = oklchToLinearRgb(oklch)
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b)
}

export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}
