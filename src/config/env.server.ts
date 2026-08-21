import 'server-only'

import { parseServerEnvironment } from './env-schema'

export function getServerEnvironment() {
  return parseServerEnvironment({
    NODE_ENV: process.env['NODE_ENV'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
    SUPABASE_INTERNAL_URL: process.env['SUPABASE_INTERNAL_URL'],
    SUPABASE_SECRET_KEY: process.env['SUPABASE_SECRET_KEY'],
    EGRESADO_DEV_HARNESS: process.env['EGRESADO_DEV_HARNESS'],
  })
}
