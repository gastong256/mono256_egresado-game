import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { competitionFixture } from '../helpers/competition'
import { SupabaseCompetitionStore } from '@/server/persistence/competition/supabase-store'

/**
 * El modelo de acceso a la base, probado con la credencial que un navegador
 * puede tener.
 *
 * La migración de STAGE-09 declara la intención: RLS habilitada sin una sola
 * política, grants revocados a `anon` y `authenticated`, y acceso sólo para
 * `service_role`. Eso es lo que el archivo dice. Lo que este archivo prueba es
 * lo que la base **hace**, usando la clave publicable —la que viaja al
 * navegador— contra la API de datos real.
 *
 * La distinción no es teórica. Una política olvidada, un grant heredado del
 * rol `public`, una vista sin `security_invoker`: los tres se ven idénticos en
 * el SQL que los rodea y ninguno se nota hasta que alguien prueba con la
 * credencial equivocada. Acá se prueba con esa credencial.
 *
 * La suite se saltea, y lo dice, si no hay base local configurada.
 */

const url =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ??
  process.env['SUPABASE_INTERNAL_URL']
const publishableKey = process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
const secretKey = process.env['SUPABASE_SECRET_KEY']

const configured = Boolean(url) && Boolean(publishableKey) && Boolean(secretKey)

/** Las tablas que guardan algo que nadie de afuera puede ver. */
const PRIVATE_TABLES = [
  'competitions',
  'participants',
  'participant_sessions',
  'attempts',
  'organizer_sessions',
  'organizer_audit_log',
  'rate_limit_counters',
] as const

describe.skipIf(!configured)('acceso público a la base de datos', () => {
  const anon = createClient(url ?? '', publishableKey ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  it.each(PRIVATE_TABLES)('anon no puede leer %s', async (table) => {
    const { data, error } = await anon.from(table).select('*').limit(1)
    // Cualquiera de las dos respuestas es correcta y las dos significan lo
    // mismo: no hay fila que ver. PostgREST devuelve un error de permiso cuando
    // el grant está revocado, y un conjunto vacío cuando la RLS no deja pasar
    // nada. Aceptar las dos evita que este test se vuelva una prueba de qué
    // versión de PostgREST está corriendo.
    expect(error !== null || (data ?? []).length === 0).toBe(true)
  })

  it('anon no puede leer la vista del mejor intento', async () => {
    const { data, error } = await anon
      .from('competition_best_attempts')
      .select('*')
      .limit(1)
    expect(error !== null || (data ?? []).length === 0).toBe(true)
  })

  it('anon no puede insertar un participante', async () => {
    const { error } = await anon.from('participants').insert({
      competition_id: '00000000-0000-4000-8000-000000000000',
      public_nickname: 'Intruso',
      nickname_key: 'intruso',
      identity_hmac: 'a'.repeat(64),
      privacy_notice_version: '1',
    })
    expect(error).not.toBeNull()
  })

  it('anon no puede insertar ni modificar un intento', async () => {
    const insert = await anon.from('attempts').insert({
      competition_id: '00000000-0000-4000-8000-000000000000',
      participant_id: '00000000-0000-4000-8000-000000000000',
      attempt_number: 1,
      run_id: 'intruso',
      seed: 'intruso',
      run_plan_fingerprint: 'intruso',
      engine_version: '10.0.0',
      ruleset_version: '1.0.0-full-career',
      content_version: '5.5.0-grade-5',
      variant_catalog_version: 'grade-5-dev-6',
      score_version: '1.0.0-fair-edition-v1',
      action_log_version: 7,
      snapshot_version: 8,
    })
    expect(insert.error).not.toBeNull()

    // Y el camino que de verdad importaría: escribirse un puntaje.
    const update = await anon
      .from('attempts')
      .update({ verified_fair_score: 10_000, status: 'VERIFIED' })
      .neq('id', '00000000-0000-4000-8000-000000000000')
    expect(update.error).not.toBeNull()
  })

  it('anon no puede borrar nada', async () => {
    const { error } = await anon
      .from('attempts')
      .delete()
      .neq('id', '00000000-0000-4000-8000-000000000000')
    expect(error).not.toBeNull()
  })

  it('anon no puede ejecutar la función del contador de tasa', async () => {
    const { error } = await anon.rpc('competition_bump_rate_limit', {
      p_bucket: 'intruso',
      p_window_start: new Date().toISOString(),
    })
    expect(error).not.toBeNull()
  })

  it('no ve las filas que el servidor sí ve', async () => {
    // El control positivo. Sin él, los casos de arriba pasarían igual contra
    // una base vacía, y este archivo diría que la RLS funciona cuando lo único
    // que pasa es que no hay nada guardado.
    const store = new SupabaseCompetitionStore()
    const competition = await store.insertCompetition(
      competitionFixture({
        slug: `rls-${String(Date.now())}`,
        status: 'DRAFT',
      }),
    )
    expect(competition.id).toBeTruthy()

    const asServer = await store.findCompetitionBySlug(competition.slug)
    expect(asServer?.id).toBe(competition.id)

    const asAnon = await anon
      .from('competitions')
      .select('*')
      .eq('slug', competition.slug)
    expect(asAnon.error !== null || (asAnon.data ?? []).length === 0).toBe(true)
  })
})

describe('la credencial secreta no puede llegar al navegador', () => {
  it('no hay una variable pública que la lleve', () => {
    for (const [name, value] of Object.entries(process.env)) {
      if (!name.startsWith('NEXT_PUBLIC_')) continue
      expect(value ?? '').not.toContain('sb_secret_')
    }
  })

  it('el adaptador privilegiado es server-only', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(
        'src/server/persistence/supabase/privileged-client.ts',
        'utf8',
      ),
    )
    // `server-only` hace que importarlo desde un componente de cliente falle en
    // el build, que es la única barrera que un test no puede saltarse por
    // descuido.
    expect(source).toContain("import 'server-only'")
  })
})
