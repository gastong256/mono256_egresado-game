#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformMarkdownLinkTargets } from './markdown-links.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = path.join(repoRoot, 'docs')
const masterPath = path.join(docsRoot, 'EGRESADO-MASTER-SPEC.md')
const mode = process.argv[2] ?? '--check'

if (!['--check', '--write'].includes(mode) || process.argv.length > 3) {
  console.error('Usage: node scripts/sync-master-spec.mjs [--check|--write]')
  process.exit(2)
}

async function markdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await markdownFiles(entryPath)))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath)
    }
  }

  return files
}

function rebaseLinkTarget(rawTarget, sourcePath) {
  const wrapped = rawTarget.startsWith('<') && rawTarget.endsWith('>')
  const token = wrapped ? rawTarget.slice(1, -1) : rawTarget

  if (/^(?:[a-z][a-z\d+.-]*:|#|\/)/i.test(token)) return rawTarget

  const parts = token.match(/^([^?#]*)([?#][\s\S]*)?$/)
  if (!parts?.[1]) return rawTarget

  let decodedPath
  try {
    decodedPath = decodeURIComponent(
      parts[1].replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~])/g, '$1'),
    )
  } catch {
    return rawTarget
  }

  const absoluteTarget = path.resolve(path.dirname(sourcePath), decodedPath)
  const relativeTarget = path.relative(docsRoot, absoluteTarget).split(path.sep).join('/') || '.'
  const encodedTarget = relativeTarget
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  const rebasedToken = `${encodedTarget}${parts[2] ?? ''}`
  const renderedToken = wrapped ? `<${rebasedToken}>` : rebasedToken
  return renderedToken
}

const categoryEntries = await fs.readdir(docsRoot, { withFileTypes: true })
const productDirectories = categoryEntries
  .filter((entry) => entry.isDirectory() && /^0[0-7]-/.test(entry.name))
  .map((entry) => path.join(docsRoot, entry.name))
  .sort()

const sources = []
for (const directory of productDirectories) {
  sources.push(...(await markdownFiles(directory)))
}
sources.sort()
sources.push(
  path.join(docsRoot, 'DOCUMENTATION-CHECKLIST.md'),
  path.join(docsRoot, 'README.md'),
)

const blocks = []
for (const sourcePath of sources) {
  const relativePath = path.relative(docsRoot, sourcePath).split(path.sep).join('/')
  const content = transformMarkdownLinkTargets(
    (await fs.readFile(sourcePath, 'utf8')).replace(/\r\n/g, '\n').trimEnd(),
    (target) => rebaseLinkTarget(target, sourcePath),
  )
  blocks.push(`# FILE: ${relativePath}\n\n${content}`)
}

const expected = [
  '# EGRESADO — Master Specification',
  '',
  '> Documento generado como vista consolidada. Los archivos individuales son la fuente mantenible y conservan su autoridad según README.',
  '',
  '',
  '---',
  '',
  blocks.join('\n\n---\n\n'),
  '',
].join('\n')

let actual = null
let masterMode = 0o644
try {
  actual = (await fs.readFile(masterPath, 'utf8')).replace(/\r\n/g, '\n')
  masterMode = (await fs.stat(masterPath)).mode & 0o777
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

if (mode === '--write') {
  if (actual === expected) {
    console.log('Master specification already synchronized.')
  } else {
    const temporaryPath = `${masterPath}.tmp-${process.pid}`
    try {
      await fs.writeFile(temporaryPath, expected, { encoding: 'utf8', mode: masterMode })
      await fs.rename(temporaryPath, masterPath)
      console.log(`Synchronized ${path.relative(repoRoot, masterPath)} from ${sources.length} sources.`)
    } finally {
      await fs.unlink(temporaryPath).catch((error) => {
        if (error.code !== 'ENOENT') throw error
      })
    }
  }
} else if (actual !== expected) {
  console.error('Master specification is stale. Run: node scripts/sync-master-spec.mjs --write')
  process.exit(1)
} else {
  console.log(`Master specification matches ${sources.length} authoritative sources.`)
}
