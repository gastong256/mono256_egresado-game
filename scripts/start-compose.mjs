import { runDockerComposeUp } from './local-docker-network.mjs'

runDockerComposeUp({
  allowNonLoopback:
    process.argv.includes('--allow-non-loopback') ||
    process.env['EGRESADO_ALLOW_NON_LOOPBACK_SUPABASE'] === 'true',
})
