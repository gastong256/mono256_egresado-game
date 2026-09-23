/**
 * Deriva todos los archivos de marca desde la geometría del isotipo.
 *
 *     pnpm brand:build
 *
 * Escribe los tres SVG de `public/assets/brand/`, el `icon.svg`, el
 * `favicon.ico` (16, 32 y 48 con la construcción pequeña) y los PNG de app y
 * de Apple, todos desde `src/lib/ui/brand-mark.ts`. Ningún raster se toca a
 * mano: si el símbolo cambia, se corre esto y se revisa el diff.
 *
 * Rasteriza con el `sharp` que Next trae como dependencia propia, resuelto
 * desde su carpeta: es el mismo que usaron las escenas y el pie, y evita
 * declarar una dependencia sólo para tres PNG y un ICO.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import {
  BRAND_ICON_SPEC,
  brandIconSvg,
  brandMarkSvg,
  type BrandMarkVariant,
} from '../../src/lib/ui/brand-mark'

interface SharpImage {
  png(options: { compressionLevel: number }): SharpImage
  toBuffer(): Promise<Buffer>
}
type SharpFactory = (input: Buffer) => SharpImage

const require = createRequire(import.meta.url)
const nextDirectory = path.dirname(require.resolve('next/package.json'))
const sharp = require(
  require.resolve('sharp', { paths: [nextDirectory] }),
) as SharpFactory

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../..',
)
const brandDirectory = path.join(root, 'public/assets/brand')
const appDirectory = path.join(root, 'src/app')

/** Un SVG cuadrado, rasterizado a su tamaño exacto en píxeles. */
async function rasterize(svg: string, size: number): Promise<Buffer> {
  const sized = svg.replace(
    '<svg ',
    `<svg width="${String(size)}" height="${String(size)}" `,
  )
  return sharp(Buffer.from(sized)).png({ compressionLevel: 9 }).toBuffer()
}

/**
 * Un `.ico` con entradas PNG.
 *
 * El formato admite PNG embebido desde Windows Vista y todos los navegadores
 * lo leen; escribirlo son seis bytes de cabecera y dieciséis por entrada.
 */
function ico(entries: readonly { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  const directory = Buffer.alloc(16 * entries.length)
  let offset = header.length + directory.length
  entries.forEach(({ size, png }, index) => {
    const at = index * 16
    directory.writeUInt8(size >= 256 ? 0 : size, at)
    directory.writeUInt8(size >= 256 ? 0 : size, at + 1)
    directory.writeUInt8(0, at + 2)
    directory.writeUInt8(0, at + 3)
    directory.writeUInt16LE(1, at + 4)
    directory.writeUInt16LE(32, at + 6)
    directory.writeUInt32LE(png.length, at + 8)
    directory.writeUInt32LE(offset, at + 12)
    offset += png.length
  })
  return Buffer.concat([header, directory, ...entries.map(({ png }) => png)])
}

function write(file: string, content: Buffer | string): void {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
  process.stdout.write(
    `  ${path.relative(root, file)}  ${String(Buffer.byteLength(content))} B\n`,
  )
}

process.stdout.write('Egresado · assets de marca\n')

for (const variant of ['default', 'mono', 'reverse'] as const) {
  const suffix: Record<BrandMarkVariant, string> = {
    default: '',
    mono: '-mono',
    reverse: '-reverse',
  }
  write(
    path.join(brandDirectory, `egresado-mark${suffix[variant]}.svg`),
    brandMarkSvg(variant),
  )
}

write(path.join(appDirectory, 'icon.svg'), brandIconSvg(BRAND_ICON_SPEC.svg))

const favicon = await Promise.all(
  BRAND_ICON_SPEC.favicon.sizes.map(async (size) => ({
    size,
    png: await rasterize(
      brandIconSvg({ size, ...BRAND_ICON_SPEC.favicon }),
      size,
    ),
  })),
)
write(path.join(appDirectory, 'favicon.ico'), ico(favicon))

write(
  path.join(appDirectory, 'apple-icon.png'),
  await rasterize(
    brandIconSvg(BRAND_ICON_SPEC.apple),
    BRAND_ICON_SPEC.apple.size,
  ),
)

for (const size of BRAND_ICON_SPEC.app.sizes) {
  write(
    path.join(brandDirectory, `egresado-icon-${String(size)}.png`),
    await rasterize(brandIconSvg({ size, ...BRAND_ICON_SPEC.app }), size),
  )
}
