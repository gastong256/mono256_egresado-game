import { runPnpmSync } from './run-pnpm.mjs'

function run(args) {
  const result = runPnpmSync(args, { stdio: 'inherit' })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run(['build'])
run(['test:e2e:only'])
