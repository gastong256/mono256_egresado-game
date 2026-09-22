# ADR-028 — Despliegue de feria sin costo: Vercel Hobby y Supabase Free

- Estado: Aceptado · LOCKED para Feria del Libro 2026
- Fecha: 2026-09-22
- Autoridad: configuración y alcance aprobados por el Product Owner en STAGE-10A.
- Relacionado: [ADR-005](ADR-005-postgres-supabase.md), [ADR-010](ADR-010-reproducible-node-pnpm-container-toolchain.md), [ADR-026](ADR-026-participant-identity-and-minor-privacy.md), [ADR-027](ADR-027-release-freeze-and-v1-governance.md).

## Contexto

Una aplicación pública, unos diez jugadores simultáneos y 200 partidas en tres
días; presupuesto USD 0. La cuenta ya tiene otro proyecto Free de Supabase.
El RC usa el Data API HTTPS desde el BFF con un cliente privilegiado server-only.
No necesita conexiones PostgreSQL de aplicación ni servicios adicionales.

## Decisión

Vercel Hobby ejecuta Next.js/Node 24 en `gru1`; Supabase Free aloja el único
proyecto de producción en `sa-east-1`. `vercel.json` fija una sola región y
habilita despliegues automáticos únicamente de `main`. El dashboard debe
identificar `main` como Production. Las variables reales sólo se asignan a ese
scope. El ensayo equivalente a staging es local; no se exige otro proyecto cloud.

El patrón `**: false` cubre ramas con `/`; `main: true` gana por la regla de
coincidencias de Vercel. La política vive en cada revisión de Git, por lo que
las ramas antiguas deben incorporar esta configuración antes de conectar el
repositorio. No equivale a prohibir un despliegue manual autorizado en el proveedor.

Se conservan Node local `24.19.0`, engines `>=24.19.0 <25` y pnpm `11.22.0`.
Vercel selecciona la línea 24.x y administra sus parches. Se activa
`ENABLE_EXPERIMENTAL_COREPACK=1` para respetar `packageManager`; el lockfile v9
por sí solo no garantiza pnpm 11. Sin overrides de install/build/output.

La aplicación usa `SUPABASE_INTERNAL_URL=https://<project-ref>.supabase.co` y
`SUPABASE_SECRET_KEY=sb_secret_…`. No usa claves Supabase en el navegador,
`DATABASE_URL`, pooler ni contraseña PostgreSQL en Vercel. La CLI de migración y
respaldo tiene su conexión de base separada. RLS/grants existentes se preservan.

Las CLI de competencia aceptan `--env-file`, con precedencia proceso > archivo
explícito > `.env.local` > `.env`; un archivo explícito ausente o con permisos
abiertos en POSIX detiene el comando. El operador usa un shell sin overrides y
un archivo completo privado. No se ejecuta dotenv como código de shell. Se desactiva la precarga de entorno de
Vite (`envDir: false`) para que vite-node no convierta `.env.local` en falsos
overrides de proceso antes del loader; Vitest conserva su lectura explícita.

La institución, horarios y retención de 30 días son configuración de esta
edición, documentada en el [runbook del proveedor](../../05-operations/vercel-supabase-production-deployment.md).
No cambian los defaults ni la semántica congelada. Se permite la cuenta compartida
`organizador` para aproximadamente tres operadores; su auditoría identifica la
cuenta, no cuál de las tres personas actuó. La contraseña la elige la institución.

## Consecuencias y compatibilidad

Se crea RC.2 y se conserva el tag RC.1. La versión del manifiesto y su huella
cambian; la tupla competitiva, catálogos, matemática, ranking y migraciones no.
El fingerprint es del manifiesto; Git/tag identifica además scripts y deployment.
Un rollback se prueba entre dos despliegues del mismo RC y configuración. Después
de intentos reales se prefiere fix-forward; no se promueve código pre-freeze.

Free requiere respaldos lógicos manuales. El dump cloud se ensaya en una base
local descartable, sin ocupar un tercer proyecto. El secreto HMAC se conserva
por separado. No se agregan cron de keep-alive, pooler, Redis ni monitor externo.
La disponibilidad y las cuotas gratuitas se comprueban antes de abrir; esta
preparación no acredita un deploy ni el GO del evento.

## Evidencia

Contratos oficiales, fecha de consulta y handoff en el
[runbook](../../05-operations/vercel-supabase-production-deployment.md#contratos-oficiales-consultados).
Regresiones en `deployment-readiness.test.ts`, `competition-environment.test.ts`
y `operator-environment-cli.test.ts`; RLS real y fronteras en las suites existentes.
