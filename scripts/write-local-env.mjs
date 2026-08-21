import { chmod, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { readLocalSupabaseStatus } from './local-supabase-status.mjs'

const outputPath = resolve('.env.local')
const temporaryPath = resolve(dirname(outputPath), '.env.local.tmp')
const status = readLocalSupabaseStatus()

const contents = [
  '# Generated from the local Supabase stack by `pnpm db:env`. Do not commit.',
  'NEXT_PUBLIC_APP_URL=http://localhost:3000',
  `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}`,
  `SUPABASE_INTERNAL_URL=${status.API_URL}`,
  `SUPABASE_SECRET_KEY=${status.SECRET_KEY}`,
  '',
].join('\n')

try {
  await writeFile(temporaryPath, contents, { encoding: 'utf8', mode: 0o600 })
  await rename(temporaryPath, outputPath)
  await chmod(outputPath, 0o600)
} finally {
  await rm(temporaryPath, { force: true })
}

process.stdout.write(
  'Wrote .env.local with local-only Supabase credentials (values redacted).\n',
)
