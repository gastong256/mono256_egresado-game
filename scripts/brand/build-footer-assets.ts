/** Resize supplied footer artwork without changing its content or proportions.
 * pnpm exec vite-node --config vitest.config.ts scripts/brand/build-footer-assets.ts
 */
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

interface SharpImage {
  resize(
    width: number,
    height: number,
    options: { fit: 'inside'; withoutEnlargement: boolean },
  ): SharpImage
  webp(options: { quality: number; effort: number }): SharpImage
  toFile(file: string): Promise<{ size: number }>
}
type SharpFactory = (input: string) => SharpImage
const require = createRequire(import.meta.url)
const nextDirectory = path.dirname(require.resolve('next/package.json'))
const sharp = require(
  require.resolve('sharp', { paths: [nextDirectory] }),
) as SharpFactory
const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../..',
)
const output = path.join(root, 'public/assets/footer')
mkdirSync(output, { recursive: true })
for (const [name, extension, width, height] of [
  ['piacentini', 'jpg', 240, 240],
  ['feria', 'png', 216, 270],
  ['dev', 'png', 80, 80],
] as const) {
  const result = await sharp(
    path.join(root, `resources/footer/logo-${name}.${extension}`),
  )
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(output, `logo-${name}.webp`))
  process.stdout.write(`logo-${name}.webp: ${String(result.size)} B\n`)
}
