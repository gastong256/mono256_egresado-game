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
  // La configuración de competencia se valida también en el build: un secreto
  // corto o un digest de organizador mal formado tienen que romper acá y no el
  // día de la feria.
  EGRESADO_COMPETITION_SLUG: process.env['EGRESADO_COMPETITION_SLUG'],
  PARTICIPANT_IDENTITY_SECRET: process.env['PARTICIPANT_IDENTITY_SECRET'],
  EGRESADO_PRIVACY_CONTROLLER_NAME:
    process.env['EGRESADO_PRIVACY_CONTROLLER_NAME'],
  EGRESADO_PRIVACY_CONTROLLER_CONTACT:
    process.env['EGRESADO_PRIVACY_CONTROLLER_CONTACT'],
  EGRESADO_PRIVACY_CONTROLLER_ADDRESS:
    process.env['EGRESADO_PRIVACY_CONTROLLER_ADDRESS'],
  EGRESADO_PRIVACY_NOTICE_VERSION:
    process.env['EGRESADO_PRIVACY_NOTICE_VERSION'],
  EGRESADO_PRIVACY_RETENTION_DAYS:
    process.env['EGRESADO_PRIVACY_RETENTION_DAYS'],
  EGRESADO_SCHOOL_YEARS: process.env['EGRESADO_SCHOOL_YEARS'],
  EGRESADO_SCHOOL_DIVISIONS: process.env['EGRESADO_SCHOOL_DIVISIONS'],
  EGRESADO_ORGANIZER_USERNAME: process.env['EGRESADO_ORGANIZER_USERNAME'],
  EGRESADO_ORGANIZER_PASSWORD_HASH:
    process.env['EGRESADO_ORGANIZER_PASSWORD_HASH'],
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
