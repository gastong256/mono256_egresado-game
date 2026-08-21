import { spawnSync } from 'node:child_process'

export const LOCAL_DOCKER_NETWORK = 'egresado-supabase-local'
export const LOCAL_SUPABASE_PROJECT_ID = 'mono256_egresado-game'
const bindingOption = 'com.docker.network.bridge.host_binding_ipv4'

function runDocker(args, options = {}) {
  return spawnSync('docker', args, {
    encoding: 'utf8',
    env: process.env,
    ...options,
  })
}

export function ensureLocalDockerNetwork() {
  const inspection = runDocker([
    'network',
    'inspect',
    LOCAL_DOCKER_NETWORK,
    '--format',
    `{{ index .Options "${bindingOption}" }}`,
  ])

  if (inspection.status === 0) {
    if (inspection.stdout.trim() !== '127.0.0.1') {
      throw new Error(
        `Docker network ${LOCAL_DOCKER_NETWORK} exists without loopback-only port binding`,
      )
    }
    return
  }

  const creation = runDocker([
    'network',
    'create',
    '--driver',
    'bridge',
    '--opt',
    `${bindingOption}=127.0.0.1`,
    LOCAL_DOCKER_NETWORK,
  ])

  if (creation.error) {
    throw creation.error
  }
  if (creation.status !== 0) {
    process.stderr.write(creation.stderr)
    throw new Error(`Could not create Docker network ${LOCAL_DOCKER_NETWORK}`)
  }

  process.stdout.write(
    `Created loopback-only Docker network ${LOCAL_DOCKER_NETWORK}\n`,
  )
}

export function inspectLocalSupabasePortBindings() {
  const containers = runDocker([
    'ps',
    '--filter',
    `label=com.supabase.cli.project=${LOCAL_SUPABASE_PROJECT_ID}`,
    '--format',
    '{{.ID}}',
  ])

  if (containers.error) {
    throw containers.error
  }
  if (containers.status !== 0) {
    process.stderr.write(containers.stderr)
    throw new Error('Could not inspect local Supabase containers')
  }

  const containerIds = containers.stdout.trim().split(/\s+/u).filter(Boolean)
  if (containerIds.length === 0) {
    return { running: false, loopbackOnly: true, exposedBindings: [] }
  }

  const inspection = runDocker(['inspect', ...containerIds])
  if (inspection.error) {
    throw inspection.error
  }
  if (inspection.status !== 0) {
    process.stderr.write(inspection.stderr)
    throw new Error('Could not inspect local Supabase port bindings')
  }

  const inspectedContainers = JSON.parse(inspection.stdout)
  const exposedBindings = []

  for (const container of inspectedContainers) {
    const containerName = String(container.Name ?? '').replace(/^\//u, '')
    const ports = container.NetworkSettings?.Ports ?? {}

    for (const bindings of Object.values(ports)) {
      if (!Array.isArray(bindings)) {
        continue
      }

      for (const binding of bindings) {
        const hostIp = binding?.HostIp
        if (hostIp && hostIp !== '127.0.0.1' && hostIp !== '::1') {
          const displayedHostIp = hostIp.includes(':') ? `[${hostIp}]` : hostIp
          exposedBindings.push(
            `${containerName}:${displayedHostIp}:${String(binding.HostPort ?? '')}`,
          )
        }
      }
    }
  }

  return {
    running: true,
    loopbackOnly: exposedBindings.length === 0,
    exposedBindings,
  }
}

export function enforceLocalSupabasePortBindings({
  allowNonLoopback = false,
} = {}) {
  const inspection = inspectLocalSupabasePortBindings()

  if (!inspection.running) {
    throw new Error('The local Supabase stack is not running')
  }
  if (inspection.loopbackOnly) {
    return inspection
  }

  const summary = inspection.exposedBindings.join(', ')
  if (allowNonLoopback) {
    process.stderr.write(
      `WARNING: local Supabase ports are not loopback-only (${summary}). Continue only on a trusted network with a host firewall.\n`,
    )
    return inspection
  }

  throw new Error(
    `Docker published local Supabase outside loopback (${summary}). The stack will be stopped. Retry with --allow-non-loopback only on a trusted network with a host firewall.`,
  )
}

export function runDockerComposeUp({ allowNonLoopback = false } = {}) {
  ensureLocalDockerNetwork()
  const supabaseBindings = inspectLocalSupabasePortBindings()
  if (supabaseBindings.running) {
    enforceLocalSupabasePortBindings({ allowNonLoopback })
  }
  const result = runDocker(
    ['compose', 'up', '--build', '--renew-anon-volumes'],
    { stdio: 'inherit', encoding: undefined },
  )

  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
