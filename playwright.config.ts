import { defineConfig, devices } from '@playwright/test'

/**
 * Dos servidores, porque hay **dos formas de despliegue** y no pueden convivir.
 *
 * Un despliegue con competencia configurada no tiene `/dev`: la compuerta se
 * cierra sola, opt-in incluido, para que el producto público sea una sola cosa
 * el día de la feria. Eso hace que las dos superficies no se puedan ejercitar
 * contra el mismo proceso, y fingir lo contrario sería probar una configuración
 * que nadie va a desplegar.
 *
 * Así que la suite levanta las dos:
 *
 * - `:3100` — sin competencia, con el harness abierto. Es la máquina de quien
 *   desarrolla, y ahí corren las suites de contenido de STAGE-08.
 * - `:3101` — con la competencia configurada. Es la feria, y ahí corre la
 *   suite de STAGE-09, que entra por `/` y no tiene `/dev` que usar.
 *
 * Las variables de competencia salen de `.env.local`, que `next start` carga
 * solo; el servidor del harness las apaga explícitamente pasando cadenas
 * vacías, que el esquema de entorno interpreta como ausentes.
 */

const harnessPort = 3100
const competitionPort = 3101
const harnessURL = `http://127.0.0.1:${harnessPort}`
const competitionURL = `http://127.0.0.1:${competitionPort}`

const isCI = Boolean(process.env['CI'])
const reuseExistingServer =
  !isCI && process.env['PLAYWRIGHT_REUSE_SERVER'] === 'true'

/** Los specs que necesitan la competencia; el resto usa el harness. */
const competitionSpecs = ['**/competition.spec.ts']

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: isCI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: competitionSpecs,
      use: { ...devices['Desktop Chrome'], baseURL: harnessURL },
    },
    {
      name: 'chromium-mobile',
      testIgnore: competitionSpecs,
      use: { ...devices['Pixel 7'], baseURL: harnessURL },
    },
    {
      name: 'competition-desktop',
      testMatch: competitionSpecs,
      use: { ...devices['Desktop Chrome'], baseURL: competitionURL },
    },
    {
      name: 'competition-mobile',
      testMatch: competitionSpecs,
      use: { ...devices['Pixel 7'], baseURL: competitionURL },
    },
  ],
  webServer: [
    {
      command: `pnpm start --hostname 127.0.0.1 --port ${String(harnessPort)}`,
      url: `${harnessURL}/api/health`,
      reuseExistingServer,
      timeout: 120_000,
      env: {
        // El harness no existe en un build de producción salvo que alguien lo
        // pida; la suite lo pide explícitamente en vez de que la ruta sea
        // alcanzable por defecto.
        EGRESADO_DEV_HARNESS: 'true',
        // Y apaga la competencia: con una configurada, `/dev` no abre.
        EGRESADO_COMPETITION_SLUG: '',
        PARTICIPANT_IDENTITY_SECRET: '',
        EGRESADO_ORGANIZER_USERNAME: '',
        EGRESADO_ORGANIZER_PASSWORD_HASH: '',
      },
    },
    {
      command: `pnpm start --hostname 127.0.0.1 --port ${String(competitionPort)}`,
      url: `${competitionURL}/api/health`,
      reuseExistingServer,
      timeout: 120_000,
      env: {
        // Sin opt-in: éste es el despliegue de feria, y ahí `/dev` no existe.
        EGRESADO_DEV_HARNESS: 'false',
      },
    },
  ],
})
