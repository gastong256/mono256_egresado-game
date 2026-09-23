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
