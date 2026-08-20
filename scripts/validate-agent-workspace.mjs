#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  collectMarkdownLinkTargets,
  collectMarkdownReferences,
  transformMarkdownLinkTargets,
} from './markdown-links.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = path.join(repoRoot, 'docs')
const expectedSkills = [
  'egresado-architecture-review',
  'egresado-challenge-authoring',
  'egresado-context',
  'egresado-implementation',
  'egresado-quality-gate',
]
const errors = []

const markdownParserFixture = [
  '[title](docs/file.md "label")',
  '[paren](docs/file(one).md)',
  '[escaped](docs/file\\(two\\).md)',
  '[angle](<docs/file name.md>)',
  '[reference]: docs/reference.md "label"',
  '[reference use][reference]',
  '[collapsed][]',
  '[collapsed]: docs/collapsed.md',
  '\\[escaped label](ignored.md)',
  '[^1]: This is a footnote, not a link definition.',
  '`<!--` [after code](docs/after-code.md)',
  '`[inline code](ignored.md)`',
  '<!-- [comment](ignored.md) -->',
  '~~~md',
  '[fence](ignored.md)',
  '~~~',
].join('\n')
const expectedParserTargets = [
  'docs/file.md',
  'docs/file(one).md',
  'docs/file\\(two\\).md',
  '<docs/file name.md>',
  'docs/reference.md',
  'docs/collapsed.md',
  'docs/after-code.md',
]
const parserTargets = collectMarkdownLinkTargets(markdownParserFixture).map(({ target }) => target)
if (JSON.stringify(parserTargets) !== JSON.stringify(expectedParserTargets)) {
  errors.push('Internal Markdown link parser regression.')
}
const parserReferences = collectMarkdownReferences(markdownParserFixture)
if (
  JSON.stringify(parserReferences.definitions.map(({ label }) => label))
    !== JSON.stringify(['reference', 'collapsed'])
  || JSON.stringify(parserReferences.uses.map(({ label }) => label))
    !== JSON.stringify(['reference', 'collapsed'])
) {
  errors.push('Internal Markdown reference parser regression.')
}
const transformedFixture = transformMarkdownLinkTargets(
  markdownParserFixture,
  (target) => `checked:${target}`,
)
if (
  !transformedFixture.includes('checked:docs/file.md')
  || !transformedFixture.includes('`[inline code](ignored.md)`')
  || !transformedFixture.includes('[fence](ignored.md)')
) {
  errors.push('Internal Markdown link transformer regression.')
}

async function filesUnder(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(entryPath)))
    } else if (entry.isFile()) {
      files.push(entryPath)
    }
  }

  return files
}

async function exists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

function repoRelative(target) {
  return path.relative(repoRoot, target).split(path.sep).join('/')
}

function normalizeLf(content) {
  return content.replace(/\r\n/g, '\n')
}

function outsideRepository(target) {
  const relative = path.relative(repoRoot, target)
  return relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
}

const requiredFiles = [
  '.gitattributes',
  'AGENTS.md',
  'docs/AGENTS.md',
  'docs/08-engineering/context-map.md',
  'docs/08-engineering/ai-development-workflow.md',
  'docs/08-engineering/dependency-and-decision-policy.md',
  'docs/08-engineering/mcp-strategy.md',
  'docs/08-engineering/agent-setup.md',
  'scripts/markdown-links.mjs',
  'scripts/sync-master-spec.mjs',
  'scripts/validate-agent-workspace.mjs',
]

for (const relativePath of requiredFiles) {
  if (!(await exists(path.join(repoRoot, relativePath)))) {
    errors.push(`Missing required file: ${relativePath}`)
  }
}

const docsFiles = (await filesUnder(docsRoot)).map((file) => repoRelative(file).slice('docs/'.length)).sort()
const manifestPath = path.join(docsRoot, 'MANIFEST.txt')
const manifestEntries = (await fs.readFile(manifestPath, 'utf8'))
  .split(/\r?\n/)
  .filter(Boolean)

if (JSON.stringify(manifestEntries) !== JSON.stringify(docsFiles)) {
  const missing = docsFiles.filter((file) => !manifestEntries.includes(file))
  const stale = manifestEntries.filter((file) => !docsFiles.includes(file))
  if (missing.length) errors.push(`MANIFEST.txt is missing: ${missing.join(', ')}`)
  if (stale.length) errors.push(`MANIFEST.txt has stale entries: ${stale.join(', ')}`)
  if (!missing.length && !stale.length) errors.push('MANIFEST.txt entries are not sorted.')
}

const documentationMap = normalizeLf(await fs.readFile(path.join(docsRoot, 'README.md'), 'utf8'))
for (const category of [
  '00-product',
  '01-game-design',
  '02-functional',
  '03-architecture',
  '04-quality',
  '05-operations',
  '06-delivery',
  '07-reference',
  '08-engineering',
]) {
  const sectionStart = documentationMap.indexOf(`### ${category}\n`)
  if (sectionStart === -1) {
    errors.push(`docs/README.md is missing map section: ${category}`)
    continue
  }
  const afterHeading = sectionStart + `### ${category}\n`.length
  const nextHeadingOffset = documentationMap.slice(afterHeading).search(/\n##(?: |# )/)
  const nextSection = nextHeadingOffset === -1 ? -1 : afterHeading + nextHeadingOffset
  const section = documentationMap.slice(
    sectionStart,
    nextSection === -1 ? documentationMap.length : nextSection,
  )
  const mappedEntries = [...section.matchAll(/^- `([^`]+)`:/gm)].map((match) => match[1]).sort()
  const categoryFiles = docsFiles.filter((file) => file.startsWith(`${category}/`))
  const expectedEntries = [
    ...new Set(
      categoryFiles.map((file) => {
        const nestedPath = file.slice(category.length + 1)
        return nestedPath.startsWith('adr/') ? 'adr/' : path.posix.basename(nestedPath)
      }),
    ),
  ].sort()

  if (JSON.stringify(mappedEntries) !== JSON.stringify(expectedEntries)) {
    errors.push(
      `docs/README.md map mismatch for ${category}: expected ${expectedEntries.join(', ') || '(none)'}`,
    )
  }
}

const checklist = normalizeLf(
  await fs.readFile(path.join(docsRoot, 'DOCUMENTATION-CHECKLIST.md'), 'utf8'),
)
for (const heading of [
  '## Producto',
  '## Game design',
  '## Funcional',
  '## Arquitectura',
  '## Calidad',
  '## Operación',
  '## Delivery',
  '## Referencia',
  '## Ingeniería asistida',
]) {
  if (!checklist.split('\n').includes(heading)) {
    errors.push(`DOCUMENTATION-CHECKLIST.md is missing section: ${heading}`)
  }
}

for (const jsonPath of (await filesUnder(docsRoot)).filter((file) => file.endsWith('.json'))) {
  try {
    JSON.parse(await fs.readFile(jsonPath, 'utf8'))
  } catch (error) {
    errors.push(`Invalid JSON in ${repoRelative(jsonPath)}: ${error.message}`)
  }
}

const skillsRoot = path.join(repoRoot, '.agents', 'skills')
const skillDirectories = (await fs.readdir(skillsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

if (JSON.stringify(skillDirectories) !== JSON.stringify(expectedSkills)) {
  errors.push(`Unexpected skill set: ${skillDirectories.join(', ')}`)
}

for (const skillName of expectedSkills) {
  const skillPath = path.join(skillsRoot, skillName, 'SKILL.md')
  if (!(await exists(skillPath))) {
    errors.push(`Missing skill entrypoint: ${repoRelative(skillPath)}`)
    continue
  }

  const content = normalizeLf(await fs.readFile(skillPath, 'utf8'))
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (!frontmatter) {
    errors.push(`Missing YAML frontmatter: ${repoRelative(skillPath)}`)
    continue
  }

  const fields = new Map()
  for (const line of frontmatter[1].split('\n')) {
    const field = line.match(/^([a-z][a-z0-9_-]*):\s*(.*)$/)
    if (!field || fields.has(field[1])) {
      errors.push(`Invalid or duplicate skill frontmatter field in ${repoRelative(skillPath)}: ${line}`)
      continue
    }
    fields.set(field[1], field[2].trim())
  }

  const fieldNames = [...fields.keys()].sort()
  if (JSON.stringify(fieldNames) !== JSON.stringify(['description', 'name'])) {
    errors.push(`Skill frontmatter must contain only name and description: ${repoRelative(skillPath)}`)
  }

  const declaredName = fields.get('name')
  const description = fields.get('description')
  if (declaredName !== skillName) errors.push(`Skill name mismatch in ${repoRelative(skillPath)}`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(declaredName ?? '') || declaredName.length > 64) {
    errors.push(`Invalid skill name in ${repoRelative(skillPath)}`)
  }
  if (!description || description.length > 1024) {
    errors.push(`Missing or oversized skill description in ${repoRelative(skillPath)}`)
  }
  if (
    description
    && (
      !/^\p{L}/u.test(description)
      || /(?:^|\s)#/.test(description)
      || /:\s/.test(description)
      || /[<>]/.test(description)
      || /^(?:null|true|false)$/i.test(description)
    )
  ) {
    errors.push(`Skill description must use the supported plain YAML scalar form: ${repoRelative(skillPath)}`)
  }
}

const markdownFiles = [
  path.join(repoRoot, 'AGENTS.md'),
  path.join(repoRoot, 'README.md'),
  ...(await filesUnder(docsRoot)).filter((file) => file.endsWith('.md')),
  ...(await filesUnder(skillsRoot)).filter((file) => file.endsWith('.md')),
]

for (const markdownPath of markdownFiles) {
  const markdownContent = normalizeLf(await fs.readFile(markdownPath, 'utf8'))

  for (const { target: extractedTarget, line } of collectMarkdownLinkTargets(markdownContent)) {
    const rawTarget = extractedTarget.trim().replace(/^<|>$/g, '')
    if (/^[a-z]:[\\/]/i.test(rawTarget)) {
      errors.push(`${repoRelative(markdownPath)}:${line} has an absolute local link: ${rawTarget}`)
      continue
    }
    if (/^[a-z][a-z\d+.-]*:/i.test(rawTarget)) {
      if (/^file:/i.test(rawTarget)) {
        errors.push(`${repoRelative(markdownPath)}:${line} has a local file URI: ${rawTarget}`)
      }
      continue
    }

    const hashIndex = rawTarget.indexOf('#')
    const fragment = hashIndex === -1 ? '' : rawTarget.slice(hashIndex + 1)
    const beforeFragment = hashIndex === -1 ? rawTarget : rawTarget.slice(0, hashIndex)
    const queryIndex = beforeFragment.indexOf('?')
    const pathPart = queryIndex === -1 ? beforeFragment : beforeFragment.slice(0, queryIndex)
    let decodedPath
    try {
      decodedPath = decodeURIComponent(
        pathPart.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~])/g, '$1'),
      )
    } catch {
      errors.push(`${repoRelative(markdownPath)}:${line} has invalid URL encoding: ${rawTarget}`)
      continue
    }

    if (path.isAbsolute(decodedPath) || path.win32.isAbsolute(decodedPath)) {
      errors.push(`${repoRelative(markdownPath)}:${line} has an absolute local link: ${rawTarget}`)
      continue
    }

    const resolvedPath = decodedPath
      ? path.resolve(path.dirname(markdownPath), decodedPath)
      : markdownPath
    if (outsideRepository(resolvedPath)) {
      errors.push(`${repoRelative(markdownPath)}:${line} links outside the repository: ${rawTarget}`)
      continue
    }

    if (!(await exists(resolvedPath))) {
      errors.push(`${repoRelative(markdownPath)}:${line} has broken link: ${rawTarget}`)
      continue
    }

    const realTarget = await fs.realpath(resolvedPath)
    if (outsideRepository(realTarget)) {
      errors.push(`${repoRelative(markdownPath)}:${line} resolves outside the repository: ${rawTarget}`)
      continue
    }

    if (fragment && (await fs.stat(resolvedPath)).isFile() && resolvedPath.endsWith('.md')) {
      const targetContent = await fs.readFile(resolvedPath, 'utf8')
      let normalizedFragment
      try {
        normalizedFragment = decodeURIComponent(fragment).toLowerCase()
      } catch {
        errors.push(`${repoRelative(markdownPath)}:${line} has invalid anchor encoding: ${rawTarget}`)
        continue
      }
      const headings = targetContent
        .split(/\r?\n/)
        .filter((targetLine) => /^#{1,6}\s+/.test(targetLine))
        .map((targetLine) =>
          targetLine
            .replace(/^#{1,6}\s+/, '')
            .trim()
            .toLowerCase()
            .replace(/[`*_]/g, '')
            .replace(/[^\p{L}\p{N}\s-]/gu, '')
            .replace(/\s+/g, '-'),
        )
      if (!headings.includes(normalizedFragment)) {
        errors.push(`${repoRelative(markdownPath)}:${line} has unknown anchor: ${rawTarget}`)
      }
    }
  }

  const references = collectMarkdownReferences(markdownContent)
  const definedLabels = new Set(references.definitions.map(({ label }) => label))
  for (const reference of references.uses) {
    if (!definedLabels.has(reference.label)) {
      errors.push(
        `${repoRelative(markdownPath)}:${reference.line} uses undefined Markdown reference: ${reference.label}`,
      )
    }
  }
}

const portableFiles = [
  path.join(repoRoot, '.gitattributes'),
  path.join(repoRoot, 'AGENTS.md'),
  path.join(repoRoot, 'README.md'),
  ...(await filesUnder(docsRoot)).filter((file) => /\.(?:md|json|txt)$/.test(file)),
  ...(await filesUnder(skillsRoot)),
  ...(await filesUnder(path.join(repoRoot, 'scripts'))).filter((file) => file.endsWith('.mjs')),
]

const unixMachineRoots = ['home', 'Users', 'tmp', 'private', 'Volumes', 'mnt', 'opt'].join('|')
const machinePathPatterns = [
  new RegExp(`/(?:${unixMachineRoots})/[^/\\s]+`),
  new RegExp('\\b[A-Za-z]:[\\\\/][^\\s]+'),
]

for (const portablePath of portableFiles) {
  const content = await fs.readFile(portablePath, 'utf8')
  if (machinePathPatterns.some((pattern) => pattern.test(content))) {
    errors.push(`Machine-specific absolute path in ${repoRelative(portablePath)}`)
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`)
  process.exit(1)
}

console.log(`Agent workspace valid: ${expectedSkills.length} skills, ${docsFiles.length} documented files, links and JSON OK.`)
