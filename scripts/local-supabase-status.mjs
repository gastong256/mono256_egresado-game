import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { inspectLocalSupabasePortBindings } from './local-docker-network.mjs'
import { runPnpmSync } from './run-pnpm.mjs'

export function readLocalSupabaseStatus() {
  const result = runPnpmSync(
    ['exec', 'supabase', 'status', '--output', 'json'],
    {
      encoding: 'utf8',
    },
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }

  const status = JSON.parse(result.stdout)
  const required = ['API_URL', 'PUBLISHABLE_KEY', 'SECRET_KEY']

  for (const key of required) {
    if (typeof status[key] !== 'string' || status[key].length === 0) {
      throw new Error(`Supabase status is missing ${key}`)
    }
  }

  new URL(status.API_URL)

  if (!status.PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
    throw new Error(
      'Supabase status returned an unexpected publishable key format',
    )
  }

  if (!status.SECRET_KEY.startsWith('sb_secret_')) {
    throw new Error('Supabase status returned an unexpected secret key format')
  }

  return status
}

const entryPoint = process.argv[1]

if (entryPoint && import.meta.url === pathToFileURL(resolve(entryPoint)).href) {
  const status = readLocalSupabaseStatus()
  const apiUrl = new URL(status.API_URL)
  const bindings = inspectLocalSupabasePortBindings()

  process.stdout.write(
    `${JSON.stringify({
      running: true,
      apiOrigin: apiUrl.origin,
      publishableKeyConfigured: true,
      secretKeyConfigured: true,
      loopbackOnly: bindings.loopbackOnly,
    })}\n`,
  )

  if (!bindings.loopbackOnly) {
    process.stderr.write(
      'WARNING: local Supabase is published outside loopback. Stop it or use it only on a trusted network with a host firewall.\n',
    )
  }
}
