import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { getServerEnvironment } from '@/config/env.server'
import type { Database } from '@/lib/supabase/database.types'

const nonPersistentAuth = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
} as const

export function createServerSupabaseClient() {
  const environment = getServerEnvironment()
  const url =
    environment.SUPABASE_INTERNAL_URL ?? environment.NEXT_PUBLIC_SUPABASE_URL
  const key = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Server Supabase access is not configured')
  }

  return createClient<Database>(url, key, { auth: nonPersistentAuth })
}
