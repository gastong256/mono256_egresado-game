import { spawnSync } from 'node:child_process'

export function runPnpmSync(args, options = {}) {
  const pnpmCli = process.env['npm_execpath']

  if (!pnpmCli) {
    throw new Error('Run this command through a package.json pnpm script')
  }

  return spawnSync(process.execPath, [pnpmCli, ...args], {
    env: process.env,
    ...options,
  })
}
