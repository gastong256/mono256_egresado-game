import { readFileSync } from 'node:fs'

const nodeVersion = readFileSync('.node-version', 'utf8').trim()
const nvmVersion = readFileSync('.nvmrc', 'utf8').trim()
const dockerfile = readFileSync('Dockerfile', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const pnpmVersion = packageJson.packageManager?.replace(/^pnpm@/, '')
const nodeMajor = Number(nodeVersion.split('.')[0])
const expectedNodeRange = `>=${nodeVersion} <${nodeMajor + 1}`
const errors = []

if (nvmVersion !== nodeVersion) {
  errors.push('.nvmrc must match .node-version')
}
if (packageJson.engines?.node !== expectedNodeRange) {
  errors.push(`package.json engines.node must be ${expectedNodeRange}`)
}
if (packageJson.engines?.pnpm !== pnpmVersion) {
  errors.push('package.json engines.pnpm must match packageManager')
}
if (!dockerfile.includes(`node:${nodeVersion}-slim@sha256:`)) {
  errors.push('Dockerfile Node image must match .node-version and use a digest')
}
if (!dockerfile.includes(`corepack install --global pnpm@${pnpmVersion}`)) {
  errors.push('Dockerfile pnpm install must match packageManager')
}
for (const publicBuildVariable of [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
]) {
  if (!dockerfile.includes(`ARG ${publicBuildVariable}=`)) {
    errors.push(
      `Dockerfile must accept public build arg ${publicBuildVariable}`,
    )
  }
}
if (/^ARG (?:SUPABASE_SECRET_KEY|SUPABASE_INTERNAL_URL)=?/m.test(dockerfile)) {
  errors.push('Dockerfile must never accept server-only values as build args')
}
if (process.versions.node !== nodeVersion) {
  errors.push(`expected Node.js ${nodeVersion}; received ${process.version}`)
}

const packageManager = process.env['npm_config_user_agent']?.split(' ')[0]
if (packageManager !== `pnpm/${pnpmVersion}`) {
  errors.push(`run this gate through pnpm ${pnpmVersion}`)
}

if (errors.length > 0) {
  throw new Error(`Toolchain check failed:\n- ${errors.join('\n- ')}`)
}

process.stdout.write(
  `Toolchain aligned: Node.js ${nodeVersion}, pnpm ${pnpmVersion}\n`,
)
