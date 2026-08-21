import type { NextConfig } from 'next'
import { parseServerEnvironment } from './src/config/env-schema'

parseServerEnvironment({
  NODE_ENV: process.env['NODE_ENV'],
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_INTERNAL_URL: process.env['SUPABASE_INTERNAL_URL'],
  SUPABASE_SECRET_KEY: process.env['SUPABASE_SECRET_KEY'],
  EGRESADO_DEV_HARNESS: process.env['EGRESADO_DEV_HARNESS'],
})

const standaloneOutput = process.env['NEXT_STANDALONE'] === 'true'

const nextConfig: NextConfig = {
  ...(standaloneOutput
    ? {
        output: 'standalone' as const,
        outputFileTracingIncludes: {
          '/*': ['./node_modules/@swc/helpers/**/*'],
        },
      }
    : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), microphone=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'",
          },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default nextConfig
