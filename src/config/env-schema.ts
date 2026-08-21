import { z } from 'zod'

const emptyStringToUndefined = (value: unknown) =>
  value === '' ? undefined : value

const httpUrl = z
  .url()
  .refine(
    (value) => {
      const protocol = new URL(value).protocol
      return protocol === 'http:' || protocol === 'https:'
    },
    { message: 'Expected an HTTP(S) URL' },
  )
  .refine(
    (value) => {
      const url = new URL(value)
      return url.username.length === 0 && url.password.length === 0
    },
    { message: 'URL credentials are not allowed' },
  )
  .refine((value) => new URL(value).hash.length === 0, {
    message: 'URL fragments are not allowed',
  })
const optionalUrl = z.preprocess(emptyStringToUndefined, httpUrl.optional())
const optionalPublishableKey = z.preprocess(
  emptyStringToUndefined,
  z.string().startsWith('sb_publishable_').optional(),
)
const optionalSecretKey = z.preprocess(
  emptyStringToUndefined,
  z.string().startsWith('sb_secret_').optional(),
)

const publicShape = {
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyStringToUndefined,
    httpUrl.default('http://localhost:3000'),
  ),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalPublishableKey,
}

function requirePair(
  values: Readonly<Record<string, unknown>>,
  firstKey: string,
  secondKey: string,
  context: z.RefinementCtx,
) {
  if (Boolean(values[firstKey]) === Boolean(values[secondKey])) {
    return
  }

  context.addIssue({
    code: 'custom',
    message: `${firstKey} and ${secondKey} must be configured together`,
    path: [values[firstKey] ? secondKey : firstKey],
  })
}

export const publicEnvironmentSchema = z
  .object(publicShape)
  .superRefine((values, context) => {
    requirePair(
      values,
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      context,
    )
  })

export const serverEnvironmentSchema = z
  .object({
    ...publicShape,
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    SUPABASE_INTERNAL_URL: optionalUrl,
    SUPABASE_SECRET_KEY: optionalSecretKey,
    /**
     * Enables the development engine harness route.
     *
     * Server-only and opt-in, so the harness can be exercised against a
     * production build during end-to-end tests without ever being reachable on
     * a real deployment. It is deliberately not a NEXT_PUBLIC_ value.
     */
    EGRESADO_DEV_HARNESS: z.preprocess(
      emptyStringToUndefined,
      z.enum(['true', 'false']).optional(),
    ),
  })
  .superRefine((values, context) => {
    requirePair(
      values,
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      context,
    )
    if (
      values.SUPABASE_SECRET_KEY &&
      !values.SUPABASE_INTERNAL_URL &&
      !values.NEXT_PUBLIC_SUPABASE_URL
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'A Supabase URL is required when SUPABASE_SECRET_KEY is configured',
        path: ['SUPABASE_INTERNAL_URL'],
      })
    }
  })

export type PublicEnvironment = z.output<typeof publicEnvironmentSchema>
export type ServerEnvironment = z.output<typeof serverEnvironmentSchema>

export class EnvironmentValidationError extends Error {
  constructor(scope: 'public' | 'server', error: z.ZodError) {
    const fields = [
      ...new Set(
        error.issues.map((issue) => issue.path.join('.') || 'environment'),
      ),
    ]
    super(`Invalid ${scope} environment configuration: ${fields.join(', ')}`)
    this.name = 'EnvironmentValidationError'
  }
}

export function parsePublicEnvironment(
  source: Readonly<Record<string, unknown>>,
) {
  const result = publicEnvironmentSchema.safeParse(source)
  if (!result.success) {
    throw new EnvironmentValidationError('public', result.error)
  }

  return result.data
}

export function parseServerEnvironment(
  source: Readonly<Record<string, unknown>>,
) {
  const result = serverEnvironmentSchema.safeParse(source)
  if (!result.success) {
    throw new EnvironmentValidationError('server', result.error)
  }

  return result.data
}
