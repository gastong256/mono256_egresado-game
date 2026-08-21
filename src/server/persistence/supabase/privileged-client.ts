import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { getServerEnvironment } from '@/config/env.server'
import type { Database } from '@/lib/supabase/database.types'

export function createPrivilegedSupabaseClient() {
  const environment = getServerEnvironment()
  const url =
    environment.SUPABASE_INTERNAL_URL ?? environment.NEXT_PUBLIC_SUPABASE_URL

  if (!url || !environment.SUPABASE_SECRET_KEY) {
    throw new Error('Privileged Supabase access is not configured')
  }

  return createClient<Database>(url, environment.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}
