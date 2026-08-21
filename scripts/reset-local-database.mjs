import {
  enforceLocalSupabasePortBindings,
  ensureLocalDockerNetwork,
  LOCAL_DOCKER_NETWORK,
} from './local-docker-network.mjs'
import { runPnpmSync } from './run-pnpm.mjs'

ensureLocalDockerNetwork()
enforceLocalSupabasePortBindings({
  allowNonLoopback:
    process.argv.includes('--allow-non-loopback') ||
    process.env['EGRESADO_ALLOW_NON_LOOPBACK_SUPABASE'] === 'true',
})

const result = runPnpmSync(
  [
    'exec',
    'supabase',
    'db',
    'reset',
    '--local',
    '--network-id',
    LOCAL_DOCKER_NETWORK,
  ],
  { stdio: 'inherit' },
)

if (result.error) {
  throw result.error
}
if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
