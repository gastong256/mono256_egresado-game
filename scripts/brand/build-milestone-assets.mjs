/**
 * Deriva las láminas narrativas desde los originales de image_gen.
 * node scripts/brand/build-milestone-assets.mjs <directorio-de-originales>
 * Los PNG no se sirven ni se versionan; prompts y hashes quedan en resources.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const nextDirectory = path.dirname(require.resolve('next/package.json'))
const sharp = require(require.resolve('sharp', { paths: [nextDirectory] }))
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sourceDirectory = process.argv[2]
if (!sourceDirectory) {
  throw new Error(
    'Uso: node scripts/brand/build-milestone-assets.mjs <originales>',
  )
}
const manifest = JSON.parse(
  await readFile(path.join(root, 'resources/milestones/prompts.json'), 'utf8'),
)
const output = path.join(root, 'public/assets/milestones')
await mkdir(output, { recursive: true })
for (const { id, sourceSha256 } of manifest.assets) {
  const source = await readFile(path.join(sourceDirectory, `${id}.png`))
  if (createHash('sha256').update(source).digest('hex') !== sourceSha256) {
    throw new Error(`El original de ${id} no coincide con su hash registrado`)
  }
  const image = await sharp(source)
    .resize(1200, 675, { fit: 'cover', kernel: 'lanczos3' })
    .webp({ quality: 85, effort: 6, smartSubsample: true })
    .toBuffer()
  if (image.length > 150_000) throw new Error(`${id} supera 150 KB`)
  await writeFile(path.join(output, `${id}.webp`), image)
  process.stdout.write(`${id}: 1200×675, ${image.length} bytes\n`)
}
