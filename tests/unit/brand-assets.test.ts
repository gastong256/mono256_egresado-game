import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { BRAND_HEX } from '@/lib/ui/brand'
import {
  BRAND_ICON_SPEC,
  BRAND_MARK_BOX,
  brandIconSvg,
  brandMarkSvg,
} from '@/lib/ui/brand-mark'

/**
 * Los archivos de marca.
 *
 * La geometría del isotipo vive en un solo módulo y `pnpm brand:build` deriva
 * de ahí los SVG, el favicon y los íconos. Estas pruebas cuidan que lo
 * versionado siga siendo exactamente lo que ese módulo produce, que ningún
 * SVG lleve nada ejecutable y que cada raster tenga el tamaño que declara.
 * La geometría en sí no se afirma acá: se revisa mirándola.
 */

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relative}`, import.meta.url)))

describe('los SVG de marca', () => {
  it.each([
    ['public/assets/brand/egresado-mark.svg', 'default'],
    ['public/assets/brand/egresado-mark-mono.svg', 'mono'],
    ['public/assets/brand/egresado-mark-reverse.svg', 'reverse'],
  ] as const)('%s es lo que produce la geometría', (file, variant) => {
    expect(read(file).toString('utf8')).toBe(brandMarkSvg(variant))
  })

  it('el icon.svg es la construcción pequeña sobre papel', () => {
    expect(read('src/app/icon.svg').toString('utf8')).toBe(
      brandIconSvg(BRAND_ICON_SPEC.svg),
    )
  })

  it.each([
    'public/assets/brand/egresado-mark.svg',
    'public/assets/brand/egresado-mark-mono.svg',
    'public/assets/brand/egresado-mark-reverse.svg',
    'src/app/icon.svg',
  ])('%s es estático y chico', (file) => {
    const svg = read(file).toString('utf8')
    for (const forbidden of [
      '<script',
      'foreignObject',
      'href',
      '<style',
      'data:',
    ])
      expect(svg).not.toContain(forbidden)
    expect(svg.length).toBeLessThan(1024)
    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+">/u,
    )
  })

  it('el símbolo canónico ocupa su caja entera', () => {
    // La caja es la del símbolo, sin margen: un consumidor que lo ponga en
    // un lockup o en un ícono decide su propio aire.
    const svg = brandMarkSvg('default')
    expect(svg).toContain(
      `viewBox="0 0 ${String(BRAND_MARK_BOX.width)} ${String(BRAND_MARK_BOX.height)}"`,
    )
    expect(svg).toContain('M100 0 200 40 100 80 0 40Z')
    expect(svg).toContain('V240')
  })

  it('pinta con los mismos hexadecimales que el manifiesto', () => {
    // La tinta y el verde del rombo en la principal; sólo tinta en la mono;
    // sólo papel en la reversa. Ningún otro color entra a un archivo suelto.
    const fills = (svg: string) =>
      new Set([...svg.matchAll(/fill="(#[0-9a-f]{6})"/gu)].map((m) => m[1]))
    expect(fills(brandMarkSvg('default'))).toEqual(
      new Set([BRAND_HEX.ink, BRAND_HEX.green]),
    )
    expect(fills(brandMarkSvg('mono'))).toEqual(new Set([BRAND_HEX.ink]))
    expect(fills(brandMarkSvg('reverse'))).toEqual(new Set([BRAND_HEX.canvas]))
  })
})

/** Ancho y alto del IHDR, que es lo primero después de la firma PNG. */
function pngSize(png: Buffer): { width: number; height: number } {
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
}

/** Ancho y alto de un WebP: VP8X (canvas), VP8L (bits empaquetados) o VP8. */
function webpSize(webp: Buffer): { width: number; height: number } {
  expect(webp.toString('ascii', 0, 4)).toBe('RIFF')
  expect(webp.toString('ascii', 8, 12)).toBe('WEBP')
  const chunk = webp.toString('ascii', 12, 16)
  if (chunk === 'VP8X')
    return {
      width: webp.readUIntLE(24, 3) + 1,
      height: webp.readUIntLE(27, 3) + 1,
    }
  if (chunk === 'VP8L') {
    const bits = webp.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  expect(chunk).toBe('VP8 ')
  return {
    width: webp.readUInt16LE(26) & 0x3fff,
    height: webp.readUInt16LE(28) & 0x3fff,
  }
}

/** Ancho y alto del primer SOF de un JPEG. */
function jpegSize(jpeg: Buffer): { width: number; height: number } {
  expect(jpeg.readUInt16BE(0)).toBe(0xffd8)
  let at = 2
  while (at < jpeg.length) {
    expect(jpeg.readUInt8(at)).toBe(0xff)
    const marker = jpeg.readUInt8(at + 1)
    const length = jpeg.readUInt16BE(at + 2)
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    )
      return {
        height: jpeg.readUInt16BE(at + 5),
        width: jpeg.readUInt16BE(at + 7),
      }
    at += 2 + length
  }
  throw new Error('sin SOF')
}

describe('el hero y la imagen social', () => {
  it.each([
    ['public/assets/brand/egresado-hero-800.webp', 800, 450],
    ['public/assets/brand/egresado-hero-1200.webp', 1200, 675],
  ])('%s es un WebP 16:9 de %i px', (file, width, height) => {
    // Dos anchos y no uno: el `srcset` de la portada elige por DPR y tamaño
    // real del contenedor, y ninguna pantalla pide más de 1200.
    expect(webpSize(read(file))).toEqual({ width, height })
    expect(read(file).length).toBeLessThan(180 * 1024)
  })

  it('la imagen social mide 1200 × 630 y tiene texto alternativo', () => {
    expect(jpegSize(read('src/app/opengraph-image.jpg'))).toEqual({
      width: 1200,
      height: 630,
    })
    expect(read('src/app/opengraph-image.jpg').length).toBeLessThan(400 * 1024)
    const alt = read('src/app/opengraph-image.alt.txt').toString('utf8').trim()
    expect(alt).toContain('Egresado')
    expect(alt.length).toBeGreaterThan(40)
  })
})

describe('los íconos raster', () => {
  it.each([
    ['public/assets/brand/egresado-icon-192.png', 192],
    ['public/assets/brand/egresado-icon-512.png', 512],
    ['src/app/apple-icon.png', BRAND_ICON_SPEC.apple.size],
  ])('%s mide %i px de lado', (file, size) => {
    expect(pngSize(read(file))).toEqual({ width: size, height: size })
  })

  it('el favicon.ico trae 16, 32 y 48 como PNG', () => {
    const icon = read('src/app/favicon.ico')
    expect(icon.readUInt16LE(2)).toBe(1)
    const count = icon.readUInt16LE(4)
    expect(count).toBe(BRAND_ICON_SPEC.favicon.sizes.length)
    const sizes = []
    for (let index = 0; index < count; index++) {
      const at = 6 + index * 16
      const size = icon.readUInt8(at)
      const length = icon.readUInt32LE(at + 8)
      const offset = icon.readUInt32LE(at + 12)
      expect(pngSize(icon.subarray(offset, offset + length))).toEqual({
        width: size,
        height: size,
      })
      sizes.push(size)
    }
    expect(sizes).toEqual([...BRAND_ICON_SPEC.favicon.sizes])
  })
})
