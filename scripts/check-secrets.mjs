import { spawnSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'

const patterns = [
  {
    name: 'Supabase secret key',
    expression: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/gu,
  },
  {
    name: 'GitHub token',
    expression:
      /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/gu,
  },
  {
    name: 'AWS access key',
    expression: /\bAKIA[0-9A-Z]{16}\b/gu,
  },
  {
    name: 'Private key',
    expression:
      /-----BEGIN (?:EC |OPENSSH |PGP |RSA )?PRIVATE KEY(?: BLOCK)?-----/gu,
  },
]

const listedFiles = spawnSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { encoding: 'utf8' },
)

if (listedFiles.error) {
  throw listedFiles.error
}
if (listedFiles.status !== 0) {
  process.stderr.write(listedFiles.stderr)
  throw new Error('Could not enumerate repository files for secret scanning')
}

const findings = []
const filePaths = listedFiles.stdout.split('\0').filter(Boolean)

for (const filePath of filePaths) {
  // `git ls-files --cached` sigue listando un archivo borrado hasta que la
  // eliminación se prepara, así que un árbol de trabajo con borrados sin
  // preparar hacía explotar el gate en lugar de reportar hallazgos. Un archivo
  // que ya no está en disco no puede contener un secreto.
  const file = lstatSync(filePath, { throwIfNoEntry: false })
  if (file === undefined || !file.isFile() || file.isSymbolicLink()) {
    continue
  }

  const contents = readFileSync(filePath)
  if (contents.includes(0)) {
    continue
  }

  const source = contents.toString('utf8')
  for (const { name, expression } of patterns) {
    expression.lastIndex = 0
    for (const match of source.matchAll(expression)) {
      const line = source.slice(0, match.index).split('\n').length
      findings.push(`${filePath}:${line} (${name})`)
    }
  }
}

if (findings.length > 0) {
  throw new Error(
    `Potential committed secret material detected:\n- ${findings.join('\n- ')}`,
  )
}

process.stdout.write(
  `Secret patterns OK (${filePaths.length} tracked/unignored files scanned)\n`,
)
