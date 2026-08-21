import { createClient } from '@supabase/supabase-js'

import { getPublicEnvironment } from '@/config/env.client'
import type { Database } from './database.types'

export function createPublicSupabaseClient() {
  const environment = getPublicEnvironment()

  if (
    !environment.NEXT_PUBLIC_SUPABASE_URL ||
    !environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error('Public Supabase access is not configured')
  }

  return createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
