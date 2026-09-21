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

    /*
     * Competencia y privacidad (STAGE-09).
     *
     * Nada de esto es NEXT_PUBLIC_: el secreto de identidad no puede llegar al
     * navegador, y los datos del responsable se renderizan desde el servidor.
     * Todos son opcionales en el esquema porque un entorno de desarrollo sin
     * competencia configurada tiene que arrancar igual; la exigencia real la
     * aplica `requireCompetitionConfiguration`, que falla con un error de
     * configuración en lugar de dibujar un aviso de privacidad incompleto.
     */
    EGRESADO_COMPETITION_SLUG: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .regex(
          /^[a-z0-9][a-z0-9-]{0,62}$/u,
          'Expected a lowercase competition slug',
        )
        .optional(),
    ),
    /**
     * Secreto del HMAC de identidad de participante.
     *
     * Su longitud mínima no es decorativa: la clave derivada protege un dato de
     * baja entropía, así que el secreto es lo único que impide recorrer el
     * espacio entero de documentos.
     */
    PARTICIPANT_IDENTITY_SECRET: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .min(32, 'Expected at least 32 characters of entropy')
        .optional(),
    ),
    EGRESADO_PRIVACY_CONTROLLER_NAME: z.preprocess(
      emptyStringToUndefined,
      z.string().min(2).max(160).optional(),
    ),
    EGRESADO_PRIVACY_CONTROLLER_CONTACT: z.preprocess(
      emptyStringToUndefined,
      z.string().min(3).max(160).optional(),
    ),
    EGRESADO_PRIVACY_CONTROLLER_ADDRESS: z.preprocess(
      emptyStringToUndefined,
      z.string().min(3).max(240).optional(),
    ),
    EGRESADO_PRIVACY_NOTICE_VERSION: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).max(32).optional(),
    ),
    EGRESADO_PRIVACY_RETENTION_DAYS: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().min(1).max(3650).optional(),
    ),
    /** Años/cursos elegibles. Lista separada por comas, en orden de presentación. */
    EGRESADO_SCHOOL_YEARS: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).max(240).optional(),
    ),
    /** Divisiones, si la escuela las necesita para distinguir estudiantes. */
    EGRESADO_SCHOOL_DIVISIONS: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).max(120).optional(),
    ),
    EGRESADO_ORGANIZER_USERNAME: z.preprocess(
      emptyStringToUndefined,
      z.string().min(3).max(64).optional(),
    ),
    /** `scrypt:N:r:p:saltHex:hashHex`. Nunca la contraseña en claro. */
    EGRESADO_ORGANIZER_PASSWORD_HASH: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .regex(
          /^scrypt:\d+:\d+:\d+:[0-9a-f]{32,}:[0-9a-f]{64,}$/u,
          'Expected a scrypt digest produced by `pnpm competition:organizer:hash`',
        )
        .optional(),
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
    requirePair(
      values,
      'EGRESADO_ORGANIZER_USERNAME',
      'EGRESADO_ORGANIZER_PASSWORD_HASH',
      context,
    )
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
