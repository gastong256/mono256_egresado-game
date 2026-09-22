import { describe, expect, it } from 'vitest'

import { parseServerEnvironment } from '@/config/env-schema'
import {
  assertProductionConfiguration,
  deploymentEnvironment,
  enforcesProductionConfiguration,
  ProductionConfigurationError,
  productionConfigurationIssues,
} from '@/config/production'

/**
 * El contrato de configuración de producción.
 *
 * Todo lo que este archivo comprueba tiene la misma forma: una configuración
 * que el esquema acepta y que, aun así, no puede sostener una feria. Un
 * `http://localhost:3000` es una URL válida; un secreto de treinta y dos letras
 * iguales tiene treinta y dos caracteres; «Escuela de ejemplo» es un nombre de
 * más de dos letras. Los tres pasan el esquema y los tres son la razón por la
 * que un despliegue falla el sábado a la mañana.
 *
 * Ningún caso de prueba usa un secreto real, y ninguno se parece a uno: los
 * valores de acá son lo bastante largos para pasar y lo bastante obvios para
 * que nadie los confunda con una credencial.
 */

const VALID = {
  NODE_ENV: 'production',
  EGRESADO_ENVIRONMENT: 'production',
  NEXT_PUBLIC_APP_URL: 'https://egresado.escuela-real.edu.ar',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghij.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_qwertyuiop',
  SUPABASE_INTERNAL_URL: 'https://abcdefghij.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_qwertyuiopasdfghjkl',
  EGRESADO_COMPETITION_SLUG: 'feria-2026',
  PARTICIPANT_IDENTITY_SECRET: 'zQ7vK2mX9pL4wR8nT5jB3yH6cF1dG0sA',
  EGRESADO_PRIVACY_CONTROLLER_NAME: 'Escuela Secundaria N.º 12',
  EGRESADO_PRIVACY_CONTROLLER_CONTACT: 'privacidad@es12.edu.ar',
  EGRESADO_PRIVACY_CONTROLLER_ADDRESS: 'Av. San Martín 1234, Rosario',
  EGRESADO_PRIVACY_NOTICE_VERSION: '1',
  EGRESADO_PRIVACY_RETENTION_DAYS: '120',
  EGRESADO_ORGANIZER_USERNAME: 'coordinacion',
  EGRESADO_ORGANIZER_PASSWORD_HASH: `scrypt:131072:8:1:${'a'.repeat(32)}:${'b'.repeat(64)}`,
} as const

function environment(overrides: Record<string, string | undefined> = {}) {
  return parseServerEnvironment({ ...VALID, ...overrides })
}

function variablesWithIssues(
  overrides: Record<string, string | undefined> = {},
): readonly string[] {
  return productionConfigurationIssues(environment(overrides)).map(
    (issue) => issue.variable,
  )
}

describe('una configuración completa pasa', () => {
  it('no reporta un solo problema', () => {
    expect(productionConfigurationIssues(environment())).toEqual([])
    expect(() => assertProductionConfiguration(environment())).not.toThrow()
  })
})

describe('el entorno se declara, no se adivina', () => {
  it('lo declarado gana', () => {
    expect(
      deploymentEnvironment(environment({ EGRESADO_ENVIRONMENT: 'local' })),
    ).toBe('local')
    expect(
      deploymentEnvironment(environment({ EGRESADO_ENVIRONMENT: 'staging' })),
    ).toBe('staging')
  })

  it('sin declarar, `NODE_ENV=production` vale producción', () => {
    // El default seguro: un despliegue real que se olvide de declararlo queda
    // con las comprobaciones puestas, no sin ellas.
    const undeclared = environment({ EGRESADO_ENVIRONMENT: undefined })
    expect(deploymentEnvironment(undeclared)).toBe('production')
    expect(enforcesProductionConfiguration(undeclared)).toBe(true)
  })

  it('un build de producción declarado `local` no exige nada', () => {
    expect(
      enforcesProductionConfiguration(
        environment({ EGRESADO_ENVIRONMENT: 'local' }),
      ),
    ).toBe(false)
  })

  it('staging exige lo mismo que producción', () => {
    expect(
      enforcesProductionConfiguration(
        environment({ EGRESADO_ENVIRONMENT: 'staging' }),
      ),
    ).toBe(true)
  })
})

describe('el origen canónico', () => {
  it('rechaza http', () => {
    expect(
      variablesWithIssues({ NEXT_PUBLIC_APP_URL: 'http://egresado.edu.ar' }),
    ).toContain('NEXT_PUBLIC_APP_URL')
  })

  it.each([
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://egresado.local',
    'https://[::1]:3000',
    'https://example.com',
    'https://egresado.edu.ar/otra-ruta',
    'https://egresado.edu.ar/?x=1',
  ])('rechaza %s', (url) => {
    expect(variablesWithIssues({ NEXT_PUBLIC_APP_URL: url })).toContain(
      'NEXT_PUBLIC_APP_URL',
    )
  })
})

describe('la base de datos', () => {
  it('exige la clave secreta: sin ella la feria correría en memoria', () => {
    const issues = productionConfigurationIssues(
      environment({ SUPABASE_SECRET_KEY: undefined }),
    )
    expect(issues.map((issue) => issue.variable)).toContain(
      'SUPABASE_SECRET_KEY',
    )
    expect(
      issues.find((issue) => issue.variable === 'SUPABASE_SECRET_KEY')?.problem,
    ).toContain('memoria')
  })

  it('exige una URL de proyecto', () => {
    expect(
      variablesWithIssues({
        SUPABASE_INTERNAL_URL: undefined,
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
        SUPABASE_SECRET_KEY: undefined,
      }),
    ).toContain('SUPABASE_INTERNAL_URL')
  })
})

describe('el secreto de identidad', () => {
  it('rechaza uno corto', () => {
    expect(
      variablesWithIssues({ PARTICIPANT_IDENTITY_SECRET: undefined }),
    ).toContain('PARTICIPANT_IDENTITY_SECRET')
  })

  it('rechaza uno largo sin variedad', () => {
    // Pasa `min(32)` del esquema y no protege nada: la clave derivada cubre un
    // espacio de 10⁸ documentos, y el secreto es lo único que impide recorrerlo.
    const issues = productionConfigurationIssues(
      environment({ PARTICIPANT_IDENTITY_SECRET: 'a'.repeat(64) }),
    )
    expect(issues.map((issue) => issue.variable)).toContain(
      'PARTICIPANT_IDENTITY_SECRET',
    )
  })
})

describe('la credencial del organizador', () => {
  it.each(['65537:8:1', '131072:0:1', '131072:8:0', '1048576:8:1'])(
    'rechaza parámetros que no puede verificar: %s',
    (parameters) => {
      expect(
        variablesWithIssues({
          EGRESADO_ORGANIZER_PASSWORD_HASH: `scrypt:${parameters}:${'a'.repeat(32)}:${'b'.repeat(64)}`,
        }),
      ).toContain('EGRESADO_ORGANIZER_PASSWORD_HASH')
    },
  )

  it('rechaza un digest con costo de scrypt insuficiente', () => {
    const issues = productionConfigurationIssues(
      environment({
        EGRESADO_ORGANIZER_PASSWORD_HASH: `scrypt:16384:8:1:${'a'.repeat(32)}:${'b'.repeat(64)}`,
      }),
    )
    expect(
      issues.find(
        (issue) => issue.variable === 'EGRESADO_ORGANIZER_PASSWORD_HASH',
      )?.problem,
    ).toContain('65536')
  })

  it('exige usuario y digest juntos', () => {
    expect(() =>
      environment({
        EGRESADO_ORGANIZER_USERNAME: undefined,
      }),
    ).toThrow()
  })
})

describe('el responsable de los datos', () => {
  it.each([
    'EGRESADO_PRIVACY_CONTROLLER_NAME',
    'EGRESADO_PRIVACY_CONTROLLER_CONTACT',
    'EGRESADO_PRIVACY_CONTROLLER_ADDRESS',
    'EGRESADO_PRIVACY_NOTICE_VERSION',
    'EGRESADO_PRIVACY_RETENTION_DAYS',
  ])('exige %s', (variable) => {
    expect(variablesWithIssues({ [variable]: undefined })).toContain(variable)
  })

  it.each([
    ['EGRESADO_PRIVACY_CONTROLLER_NAME', 'Escuela de ejemplo.com'],
    ['EGRESADO_PRIVACY_CONTROLLER_CONTACT', 'privacidad@example.com'],
    ['EGRESADO_PRIVACY_CONTROLLER_ADDRESS', 'TODO'],
  ])('rechaza un placeholder en %s', (variable, value) => {
    const issues = productionConfigurationIssues(
      environment({ [variable]: value }),
    )
    expect(
      issues.find((issue) => issue.variable === variable)?.problem,
    ).toContain('ejemplo')
  })

  it('acepta una institución real cuyo nombre no es un placeholder', () => {
    expect(
      variablesWithIssues({
        EGRESADO_PRIVACY_CONTROLLER_NAME: 'Instituto Politécnico Superior',
      }),
    ).toEqual([])
  })
})

describe('la compuerta de desarrollo', () => {
  it('no puede quedar encendida en producción', () => {
    expect(variablesWithIssues({ EGRESADO_DEV_HARNESS: 'true' })).toContain(
      'EGRESADO_DEV_HARNESS',
    )
    expect(variablesWithIssues({ EGRESADO_DEV_HARNESS: 'false' })).toEqual([])
  })
})

describe('el error de configuración', () => {
  it('nombra cada variable y ninguno de sus valores', () => {
    let thrown: unknown
    try {
      assertProductionConfiguration(
        environment({
          NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
          PARTICIPANT_IDENTITY_SECRET: 'z'.repeat(64),
        }),
      )
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ProductionConfigurationError)
    const message = String((thrown as Error).message)
    expect(message).toContain('NEXT_PUBLIC_APP_URL')
    expect(message).toContain('PARTICIPANT_IDENTITY_SECRET')
    // El valor no aparece. Un log de arranque termina en un panel que mira más
    // gente de la que debería ver un secreto.
    expect(message).not.toContain('z'.repeat(64))
    expect(message).not.toContain('localhost:3000')
  })

  it('reporta todos los problemas en una pasada', () => {
    const issues = productionConfigurationIssues(
      environment({
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        SUPABASE_SECRET_KEY: undefined,
        EGRESADO_PRIVACY_CONTROLLER_NAME: 'placeholder',
      }),
    )
    expect(
      new Set(issues.map((issue) => issue.variable)).size,
    ).toBeGreaterThanOrEqual(3)
  })
})
