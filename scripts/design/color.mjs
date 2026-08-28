/**
 * sRGB y contraste WCAG.
 *
 * El sistema de diseño v0.2 define su paleta en hexadecimal: no es una rampa
 * generada sino un set corto de pigmentos elegidos y medidos uno por uno, y
 * convertirlos a un espacio perceptual sólo agregaría dígitos que nadie eligió.
 *
 * WCAG mide contraste sobre luminancia relativa de sRGB, así que hay que
 * calcularla de verdad en lugar de estimar a ojo. Las fórmulas son las de
 * WCAG 2.2 para luminancia relativa y ratio de contraste.
 */

/** @typedef {{ r: number, g: number, b: number }} Rgb */

/** Parsea `#RGB`, `#RRGGBB` o `#RRGGBBAA` a canales de 0 a 1. */
export function parseHex(value) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/iu.exec(value.trim())
  if (match === null) return undefined

  const digits = match[1] ?? ''
  const expanded =
    digits.length === 3
      ? [...digits].map((digit) => digit + digit).join('')
      : digits.slice(0, 6)

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16) / 255,
    g: Number.parseInt(expanded.slice(2, 4), 16) / 255,
    b: Number.parseInt(expanded.slice(4, 6), 16) / 255,
  }
}

export function toHex({ r, g, b }) {
  const toByte = (channel) =>
    Math.round(Math.min(1, Math.max(0, channel)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`
}

/** Un canal sRGB codificado con gamma, devuelto a lineal. */
function decodeGamma(channel) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

/** Luminancia relativa WCAG. */
export function relativeLuminance({ r, g, b }) {
  return (
    0.2126 * decodeGamma(r) + 0.7152 * decodeGamma(g) + 0.0722 * decodeGamma(b)
  )
}

export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}
