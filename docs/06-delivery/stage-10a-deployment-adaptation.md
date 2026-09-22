# STAGE-10A — adaptación Vercel Hobby + Supabase Free

Fecha: 2026-09-22. Alcance: preparar configuración, herramientas y operación del
RC para el despliegue manual. Sin push, login, cuentas, deploy ni mutaciones
remotas. El [handoff A–I](../05-operations/vercel-supabase-production-deployment.md)
contiene los pasos restantes y las fuentes oficiales consultadas.

## Veredicto

**VERCEL + SUPABASE DEPLOYMENT ADAPTATION — READY.** STAGE-10A `DONE`.
La configuración, las herramientas y el handoff están preparados y verificados
localmente. STAGE-10 sigue `IN_PROGRESS`: falta ejecutar el deployment y sus
ensayos de proveedor antes del GO del evento.

## Baseline y procedencia

- `main` limpio en `935569d73d69e0e91f9eed13e265ffa16b84a1d2`.
- Tag histórico `v1.0.0-rc.1`, release `egresado-fair-edition-v1` / `1.0.0-rc.1`.
- Huella histórica: `1affb2a82f4726a77cedbf4e20c82055f6c04a07d67e42674eb8e9e6da16007e`.
- `pnpm release:verify` de la baseline: 57 comprobaciones verdes.
- `origin/main` local coincide. `git ls-remote origin refs/heads/main refs/tags/v1.0.0-rc.1`
  falló por SSH `Permission denied (publickey)`: remoto vivo no verificado. No
  se cambió el remoto ni se reescribió historia.

## Arquitectura auditada y cambios

Browser → Vercel Next.js → Supabase Data API HTTPS. `createCompetitionStore`
selecciona el adapter Supabase, que crea el cliente privilegiado protegido por
`server-only`. Se usan tablas/vista/RPC por HTTPS. El adapter público legado
existe para pruebas/configuración local, pero la UI competitiva no lo consume.
No se agregó driver SQL, pooler, `DATABASE_URL` ni claves de navegador.

- `vercel.json`: Functions sólo `gru1`; Git `**: false`, `main: true`. El glob
  doble cubre barras en nombres de ramas; verdadero gana entre coincidencias.
- Plantilla pública con valores aprobados y placeholders; Corepack activado
  explícitamente para pnpm fijado. Se mantienen Node 24.19.0 local, engine
  `>=24.19.0 <25`, pnpm 11.22.0, Next 16.3.5 y lockfile.
- Loader compartido: proceso > `--env-file` > `.env.local` > `.env`, dotenv nativo
  sin interpolación, archivo explícito obligatorio y permisos POSIX privados.
  Bootstrap, purge, export y preflight aceptan la opción sin cambiar sus flags.
  `vitest.config.ts` desactiva `envDir` de Vite: su precarga convertía valores
  locales en variables de proceso antes del loader. Vitest conserva su loader
  literal existente para la suite; la regresión de CLI usa un proceso real.
- Regresiones de selección/precedencia, no salida de secretos, perfil aprobado,
  HTTPS sin variables públicas y bordes horarios de la feria.
- ADR-028, registro de decisiones, arquitectura y runbooks reconciliados:
  una Production, ensayo local, Secret keys nuevas, CLI migrations sin seed,
  rollback compatible y restore cloud→local sin tercer proyecto.
- RC.2 mediante versión de paquete/manifiesto y
  `pnpm release:verify -- --update-lock`.

## Release y compatibilidad

```text
releaseId       egresado-fair-edition-v1
releaseVersion  1.0.0-rc.2
fingerprint     0ea3c1de866aa0a25fb9e236baa122e935fcd37280c443ef4d42011680379cd0
tag local       v1.0.0-rc.2 (anotado sobre el commit final)
```

En el manifiesto cambia sólo `releaseVersion`. Semántica de juego, matemática,
contenido, pesos/tier, ranking, podio, intentos, seed policy y Prestige intactos.
Motor `10.0.0`, action log `7`, snapshot `8`, ruleset `1.0.0-full-career`, contenido
`5.5.0-grade-5`, catálogo `grade-5-dev-6` y score `1.0.0-fair-edition-v1` intactos.
Migración head `20260921000000_competition_fair_mode.sql`, checksum
`faf128c4491bb0f406b520b05094e2b2345324f1e2fc049cc762232005ae214f`, sin migración nueva.
La retención de **esta edición** es 30 días por configuración; los defaults del
manifiesto/base siguen siendo históricos y no se cambiaron.

## Auditoría de proveedores

Fuentes actuales oficiales en el [runbook](../05-operations/vercel-supabase-production-deployment.md#contratos-oficiales-consultados).
Vercel Hobby admite una región; Node 24.x y Corepack permiten conservar el
runtime. Supabase Free admite dos proyectos activos sujeto a los miembros de
la organización. São Paulo está disponible en ambos. No se constató una
incompatibilidad que requiera cambiar de proveedor.

La verificación del esquema Vercel se hizo sin login con Ajv y minimatch ya
instalados transitivamente por ESLint, sin agregar dependencias. El esquema
oficial descargado declara draft-04 pero contiene `exclusiveMinimum` numérico
en una opción no usada (`experimentalTriggers`). La validación íntegra del
meta-esquema falla por esa inconsistencia; se validaron **las propiedades
oficiales usadas** (`$schema`, `regions`, `git`) y los casos de ramas con
minimatch. El test permanente valida el contrato local con Zod. No se presenta
esto como un build de Vercel ni validación autenticada del proveedor.

## Base local y seguridad

Supabase ya estaba activo. Conteos originales: **58 competencias / 2600
participantes / 7616 intentos**. No se ejecutó `db:reset` sobre esa base ni se
modificó `.env.local`. Los bindings Docker preexistentes son `0.0.0.0`/`::`;
`db:start` intentaría detenerlos por la guarda de red. Por eso no se llamó
`db:start`, `db:stop` ni se habilitó el override de red.

En `egresado_stage10a_migrations`, una base vacía separada del mismo Postgres,
se aplicaron las dos migraciones con `psql --single-transaction --set
ON_ERROR_STOP=1`. Consulta de catálogo: siete tablas con RLS, y sin privilegios
SELECT/INSERT/UPDATE/DELETE para `anon` ni `authenticated` sobre las tablas y la
vista. Es evidencia equivalente de reconstrucción sin destruir datos ajenos;
no se reporta como `pnpm db:reset` ejecutado.

El dump con `pnpm ops:backup -- --out=<directorio-temporal-privado> --name=baseline`
produjo 16,2 KiB de esquema y 4717,9 KiB de datos. El restore atómico en `egresado_stage10a_restore` recuperó **58/2600/7616**.
Se cotejaron además todas las tuplas de versiones restauradas con las del
origen, sin publicar datos personales. La suite existente ejercita
Data API con clave publicable y control positivo privilegiado.

Se eliminaron las dos bases descartables y el directorio privado del dump del
ensayo. El stack original (DB, REST, Auth y Kong) permanece activo y sus datos
preexistentes se conservaron. Las pruebas agregan sus propios fixtures sintéticos;
no se presenta el entorno como una base vacía al finalizar.
Conteos de cierre: **86 competencias / 3630 participantes / 10650 intentos**.

## Verificación

| Comando / comprobación | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS · Node 24.19.0 / pnpm 11.22.0 |
| `pnpm install --frozen-lockfile` | PASS · sin cambio de dependencias |
| `pnpm release:check` | PASS · Next 16.3.5 |
| `pnpm release:verify -- --update-lock` | PASS · RC.2, 54 checks antes del candado |
| `pnpm release:verify` | PASS · 57 comprobaciones con el candado RC.2 |
| `pnpm release:preflight` | PASS local · cuatro observaciones esperadas: origen HTTP/local y dos textos de ejemplo; no acredita Production |
| `pnpm db:lint` | PASS · sin errores |
| `pnpm db:types` | PASS · sin diff |
| `pnpm security:audit` | PASS · sin vulnerabilidades conocidas |
| Tests nuevos | 16 de loader/deploy y 6 de CLI, PASS en corridas puntuales |
| `pnpm test:coverage` (dentro de `verify`) | PASS · 122 archivos, 2345 tests; incluye las 22 regresiones nuevas |
| `pnpm lint` / `pnpm typecheck` | PASS por separado y dentro de `verify` |
| `pnpm build` (dentro de `verify`) | PASS · Next 16.3.5, sin advertencias |
| `pnpm verify` | PASS · exit 0, gate completo sobre código final |
| `pnpm test:e2e:only` (dentro de `verify`) | PASS · 222 tests, cuatro proyectos, 2,4 min |
| `pnpm secrets:check` | PASS · incluidos archivos nuevos sin trackear |
| `node scripts/validate-agent-workspace.mjs` / `node scripts/sync-master-spec.mjs --check` | PASS · índices y master sincronizados |
| `git diff --check` y revisión completa del diff | PASS |

Cobertura (statements/branches/functions/lines): **85,67 / 77,58 / 87,68 /
85,90 %**. Contenido de los seis años, catálogos, simulaciones y freeze verdes.
El build no emitió advertencias. Playwright emitió avisos de `NO_COLOR` frente
a `FORCE_COLOR`, sin fallos ni reintentos fallidos.

Una prueba manual con archivo explícito detectó que vite-node precargaba el
archivo local y anulaba la selección. Se interrumpió una primera corrida de
`verify` durante coverage para corregir `envDir` y agregar la regresión real;
no cuenta como gate completado. La corrida posterior cubre la configuración final.

Los primeros intentos detectaron un tipo `parseEnv` nullable, un path de binario
de test y la incompatibilidad del meta-esquema Vercel indicada arriba. Se
corrigen y reejecutan los checks correspondientes; no se omitieron fallos.

No se ejecutan login, link remoto, db push, deployment, rollback cloud ni smoke
contra un proveedor. `db:start`/`db:reset` se sustituyen por inspección del stack
activo y migraciones en base vacía separada por preservación de datos/puertos.
No hay cambio de contenedores; Docker build/up/down no son parte de esta adaptación.
Los barridos profundos de balance quedan como evidencia histórica del freeze;
`verify` vuelve a correr los catálogos, simulación canónica y tests completos.

## Handoff y estado final

[Runbook A–I](../05-operations/vercel-supabase-production-deployment.md): GitHub;
Supabase Dashboard; Supabase CLI; secretos locales; Vercel Dashboard;
bootstrap; verificación cloud; backup/restore; apertura. No falta una decisión
de matemática ni una contraseña por defecto: falta ejecutar la operación manual
con secretos privados y seleccionar el hostname disponible.

Todos los cambios quedan en commits locales sobre `main`; el tag anotado
`v1.0.0-rc.2` identifica el commit final de documentación y su árbol completo.
Implementación y regresiones: `ffabb93` (`feat(deploy): prepare Vercel and explicit
operator environments`). Freeze: `291f079` (`chore(release): freeze
deployment-ready v1.0.0-rc.2`). El commit de documentación completa el handoff.
`v1.0.0-rc.1` conserva `935569d73d69e0e91f9eed13e265ffa16b84a1d2`.
Para reproducir la identidad final: `git rev-parse 'v1.0.0-rc.2^{commit}'`.
Sin push, login de proveedores, deployment ni mutación remota. La limpieza del
ensayo sólo quitó los recursos descartables creados por esta tarea.
