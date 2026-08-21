import { parsePublicEnvironment } from './env-schema'

export function getPublicEnvironment() {
  return parsePublicEnvironment({
    // Next.js replaces only statically named NEXT_PUBLIC reads in browser bundles.
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
}
