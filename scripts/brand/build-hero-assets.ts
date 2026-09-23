/**
 * Deriva el hero de la portada desde su source aprobado.
 *
 *     pnpm brand:hero resources/rc3-assets/brand/hero.png
 *
 * Escribe `public/assets/brand/egresado-hero-{800,1200}.webp`: 16:9 exacto,
 * sin alpha, sin metadatos, con los mismos ajustes que las escenas (WebP
 * q85, effort 6, chroma inteligente). Dos anchos y no uno porque la portada
 * lo muestra a 256–440 px CSS: 800 cubre DPR 2 en un teléfono y DPR 1 en
 * escritorio; 1200 cubre DPR 3 en un teléfono y DPR 2 en escritorio. No hay
 * pantalla que pida más, así que no se emite un 1600 que nadie bajaría.
 *
 * El source no se versiona (es staging de RC3, como los de las escenas); su
 * SHA-256 queda en el handoff. Este script existe para volver a derivar el
 * runtime si alguien tiene el source, y para que el pipeline sea legible.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

interface SharpImage {
  clone(): SharpImage
  metadata(): Promise<{ width?: number; height?: number }>
  resize(
    width: number,
    height: number,
    options: { fit: 'cover'; kernel: 'lanczos3' },
  ): SharpImage
  webp(options: {
    quality: number
    effort: number
    smartSubsample: boolean
  }): SharpImage
  raw(): SharpImage
  toBuffer(): Promise<Buffer>
}
type SharpFactory = (input: string | Buffer) => SharpImage

const require = createRequire(import.meta.url)
const nextDirectory = path.dirname(require.resolve('next/package.json'))
const sharp = require(
  require.resolve('sharp', { paths: [nextDirectory] }),
) as SharpFactory

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../..',
)
const source = process.argv[2]
if (source === undefined) {
  process.stderr.write('uso: pnpm brand:hero <source.png>\n')
  process.exit(2)
}

export const HERO_WIDTHS = [800, 1200] as const
const brandDirectory = path.join(root, 'public/assets/brand')
mkdirSync(brandDirectory, { recursive: true })

/** PSNR en RGB de 8 bits entre dos buffers crudos del mismo tamaño. */
function psnr(reference: Buffer, candidate: Buffer): number {
  let sum = 0
  for (let index = 0; index < reference.length; index++) {
    const delta = reference[index]! - candidate[index]!
    sum += delta * delta
  }
  const mse = sum / reference.length
  return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse)
}

const meta = await sharp(source).metadata()
process.stdout.write(
  `Egresado · hero desde ${path.relative(root, source)} (${String(meta.width)}×${String(meta.height)})\n`,
)

for (const width of HERO_WIDTHS) {
  const height = (width * 9) / 16
  const resized = sharp(source).resize(width, height, {
    fit: 'cover',
    kernel: 'lanczos3',
  })
  const webp = await resized
    .clone()
    .webp({ quality: 85, effort: 6, smartSubsample: true })
    .toBuffer()
  const reference = await resized.clone().raw().toBuffer()
  const decoded = await sharp(webp).raw().toBuffer()
  const file = path.join(brandDirectory, `egresado-hero-${String(width)}.webp`)
  writeFileSync(file, webp)
  process.stdout.write(
    `  ${path.relative(root, file)}  ${String(width)}×${String(height)}  ${String(webp.length)} B  PSNR ${psnr(reference, decoded).toFixed(2)} dB\n`,
  )
}
