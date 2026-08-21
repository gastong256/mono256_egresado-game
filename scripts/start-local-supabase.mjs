import {
  enforceLocalSupabasePortBindings,
  ensureLocalDockerNetwork,
  LOCAL_DOCKER_NETWORK,
} from './local-docker-network.mjs'
import { readLocalSupabaseStatus } from './local-supabase-status.mjs'
import { runPnpmSync } from './run-pnpm.mjs'

ensureLocalDockerNetwork()
const allowNonLoopback =
  process.argv.includes('--allow-non-loopback') ||
  process.env['EGRESADO_ALLOW_NON_LOOPBACK_SUPABASE'] === 'true'

const result = runPnpmSync(
  ['exec', 'supabase', 'start', '--network-id', LOCAL_DOCKER_NETWORK],
  { encoding: 'utf8' },
)

if (result.error) {
  throw result.error
}
if (result.status !== 0) {
  process.stderr.write(result.stderr)
  throw new Error('Could not start the local Supabase stack')
}

let bindings
let status
try {
  bindings = enforceLocalSupabasePortBindings({ allowNonLoopback })
  status = readLocalSupabaseStatus()
} catch (error) {
  const stop = runPnpmSync(['exec', 'supabase', 'stop'], {
    encoding: 'utf8',
  })
  if (stop.status !== 0) {
    process.stderr.write(stop.stderr)
    process.stderr.write(
      'WARNING: the unsafe local Supabase stack could not be stopped automatically.\n',
    )
  }
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  )
  process.exit(1)
}

process.stdout.write(
  `Local Supabase stack ready at ${new URL(status.API_URL).origin} (credentials redacted; loopbackOnly=${String(bindings.loopbackOnly)}).\n`,
)
