# Checklist del Release Candidate — Egresado Fair Edition v1

Binario. Cada línea está `PASSED`, `READY FOR STAGE-10 REHEARSAL` o `FAILED`.

**`READY FOR STAGE-10 REHEARSAL` no es `PASSED`.** Marca lo que necesita
infraestructura real y que este repositorio no puede afirmar sin mentir.

```text
release   egresado-fair-edition-v1 · 1.0.0-rc.2
huella    0ea3c1de866aa0a25fb9e236baa122e935fcd37280c443ef4d42011680379cd0
```

Las tablas de producto conservan evidencia del freeze RC.1. La validación nueva de RC.2 y las excepciones de entorno se registran en [STAGE-10A](stage-10a-deployment-adaptation.md). El [handoff A–I](../05-operations/vercel-supabase-production-deployment.md) es el procedimiento vigente.

## Producto congelado

| Item | Estado | Evidencia |
|---|---|---|
| GAME FROZEN | `PASSED` | motor `10.0.0`, action log `7`, snapshot `8` en el manifiesto y comprobados |
| MATH FROZEN | `PASSED` | `game:score` sin spread, `game:blind-audit` sin cambios, `game:simulate:deep` 5000/5000 |
| CONTENT FROZEN | `PASSED` | cinco catálogos fijados por versión y SHA-256, recomputados |
| SCORE OFFICIAL | `PASSED` | `fair-score-v1@1.0.0-fair-edition-v1`, `official: true`, equivalencia probada |
| PRESTIGE V1 EXPLICIT | `PASSED` | techo ofrecido 0, recomputado; fuera del podio público |
| RANKING FROZEN | `PASSED` | `ranking-release-regression.test.ts` |
| PODIUM FROZEN | `PASSED` | tres puestos, empate entero |
| ATTEMPTS FROZEN | `PASSED` | ilimitados, uno activo, mejor verificado, tolerancia |
| SEED POLICY FROZEN | `PASSED` | `shared-per-edition`, valor en la edición |
| SCHEMA FROZEN | `PASSED` | cabeza `20260921000000`, huella `faf128c4…` |

## Identidad del release

| Item | Estado | Evidencia |
|---|---|---|
| RELEASE MANIFEST | `PASSED` | `src/release/fair-edition-v1.ts` |
| RELEASE FINGERPRINT | `PASSED` | SHA-256 canónico, candado comprometido |
| `pnpm release:verify` | `PASSED` | 57 comprobaciones |
| IMMUTABILITY GUARD | `PASSED` | mover cualquier versión congelada rompe el candado |
| PACKAGE VERSION ALIGNED | `PASSED` | `package.json` = `releaseVersion` |

## Competencia

| Item | Estado | Evidencia |
|---|---|---|
| FROZEN FIELDS IMMUTABLE | `PASSED` | el puerto acepta cuatro columnas operativas |
| OPEN REQUIRES RELEASE MATCH | `PASSED` | siete desvíos probados, uno por campo |
| STAGE-09 UPGRADE PATH | `PASSED` | edición vieja verifica; no reabre |
| SERVER AUTHORITY GREEN | `PASSED` | matriz de ataque de STAGE-09 + ensayo RC |
| PUBLIC ROUTES CLEAN | `PASSED` | `/dev/*` 404 con competencia configurada |

## Base de datos

| Item | Estado | Evidencia |
|---|---|---|
| FRESH MIGRATION | `PASSED` | ambas migraciones en una base descartable vacía; resets del agente anterior conservados como evidencia histórica |
| UPGRADE FROM STAGE-09 | `PASSED` | replay histórico probado; restauración de 6.087 intentos sobre esquema nuevo |
| CONSTRAINTS REVIEWED | `PASSED` | suite de contrato contra memoria y Postgres |
| RLS / GRANTS TESTED | `PASSED` | con la clave publicable real, con control positivo |
| INDEXES REVIEWED | `PASSED` | ranking 15 ms sobre 500 × 3 |
| NO DESTRUCTIVE MIGRATION | `PASSED` | esta versión no borra ni renombra |

## Seguridad y configuración

| Item | Estado | Evidencia |
|---|---|---|
| PRODUCTION CONFIG FAIL-FAST | `PASSED` | `src/config/production.ts` + arranque |
| NO SECRETS COMMITTED | `PASSED` | `pnpm secrets:check` en `verify` |
| CLIENT CANNOT IMPORT SERVER SECRETS | `PASSED` | `server-only` + fronteras de arquitectura |
| SESSION COOKIES | `PASSED` | `HttpOnly`, `Secure`, `SameSite=Lax`, expiración |
| ORGANIZER AUTH | `PASSED` | scrypt `N = 2¹⁷`, costo verificado en preflight |
| RATE LIMIT HANDLES NAT | `PASSED` | 24 registros de una IP pasan; el abuso se corta |
| SECURITY HEADERS | `PASSED` | CSP con nonce verificado contra el servidor real |
| ERRORS SANITIZED | `PASSED` | sin stack, SQL, host ni configuración |
| DEPENDENCY GATE | `PASSED` | `release:check` con Next.js 16.3.5 |
| DEPENDENCY VULNERABILITIES | `PASSED` | `security:audit` sin hallazgos |

## Privacidad

| Item | Estado | Evidencia |
|---|---|---|
| PUBLIC / PRIVATE BOUNDARY | `PASSED` | `PublicSafe<…>` + tests de fuga |
| RAW DNI NOT PERSISTED | `PASSED` | HMAC por competencia + últimos 4 |
| PUBLIC PII LEAK TESTS | `PASSED` | DTO, HTML, JSON, logs, health, manifiesto |
| PRIVACY CONFIG SCHEMA FROZEN | `PASSED` | nombres en el manifiesto, valores en el despliegue |
| RETENTION / PURGE | `PASSED` | probado sobre datos sintéticos |

## Operación

| Item | Estado | Evidencia |
|---|---|---|
| HEALTH / READINESS | `PASSED` | `/api/health` y `?ready=1` |
| RELEASE ID VISIBLE | `PASSED` | health, arranque y cada línea de log |
| STRUCTURED LOGS | `PASSED` | una línea JSON por evento |
| LOG REDACTION | `PASSED` | probado sobre lo serializado |
| BACKUP PROCEDURE | `PASSED` localmente | RC.2: 16,2 KiB esquema + 4717,9 KiB datos de `public`, permisos 0600 |
| RESTORE PROCEDURE | `PASSED` localmente | RC.2: 58 competencias / 2600 participantes / 7616 intentos y versiones cotejadas; destino local descartable eliminado |
| RUNBOOK | `PASSED` | [runbook de operación](../05-operations/fair-operations-runbook.md) |
| ROLLBACK PROCEDURE | `READY FOR STAGE-10 REHEARSAL` | escrito; no ensayado contra una plataforma |
| REMOTE BACKUP / RESTORE | `READY FOR STAGE-10 REHEARSAL` | las herramientas apuntan a remoto; no se ejecutó |

## Calidad

| Item | Estado | Evidencia |
|---|---|---|
| BUILD GREEN | `PASSED` | sin una sola advertencia |
| VERIFY GREEN | `PASSED` | RC.2: corrida completa tras corregir la precedencia real de vite-node |
| VITEST | `PASSED` | 122 archivos · 2.345 tests |
| COVERAGE | `PASSED` | 85,67 / 77,58 / 87,68 / 85,90 |
| E2E | `PASSED` | 222 tests en cuatro proyectos |
| ACCESSIBILITY | `PASSED` | axe, teclado, 360 px, sin desborde |
| BUNDLE MEASURED | `PASSED` | 188,5 KiB gzip iniciales en standalone (baseline anterior: 189,0) |
| PERFORMANCE BASELINE | `PASSED` | registro, emisión, verificación, ranking, exportación |
| SYNTHETIC COMPETITION | `PASSED` | jornada entera contra Postgres real |
| REMOTE LOAD TEST | `READY FOR STAGE-10 REHEARSAL` | — |
| LOCAL REHEARSAL / CLOUD SMOKE | `READY FOR STAGE-10 REHEARSAL` | ensayo equivalente a staging local; smoke obligatorio en la producción real, sin proyecto cloud extra |
| CLOUD FULL DRY RUN | `READY FOR STAGE-10 REHEARSAL` | opcional en slug sintético separado; ensayo local completo obligatorio |

## Gobernanza

| Item | Estado | Evidencia |
|---|---|---|
| BROAD HUMAN REVIEW NOT BLOCKING | `PASSED` | [ADR-027](../03-architecture/adr/ADR-027-release-freeze-and-v1-governance.md) |
| TARGETED HUMAN WINDOWS DOCUMENTED | `PASSED` | mismo ADR |
| NEXT STAGE IS STAGE-10 | `PASSED` | [roadmap](implementation-sequence.md) |

## Preparación del despliegue STAGE-10A

- [x] Región `gru1` y Git main-only en `vercel.json` (incluidas ramas con `/`).
- [x] Plantilla sin secretos, institución y calendario aprobados, retención de 30 días.
- [x] Loader explícito con precedencia y permisos privados.
- [x] RLS/grants existentes conservados; sin runtime PostgreSQL directo.
- [x] Runbook de migración, bootstrap, scopes, smoke, rollback y restore cloud→local.
- [x] Evidencia final de RC.2 registrada en STAGE-10A; `verify` y build verdes.

## Entradas y acciones manuales restantes

```text
proyecto Supabase Free sa-east-1, project-ref y Secret key nueva
origen HTTPS disponible (preferido o fallback)
PARTICIPANT_IDENTITY_SECRET generado y respaldado fuera de la DB
contraseña privada de organizador y digest scrypt
variables exclusivamente Production; Corepack=1
migraciones remotas, deploy, bootstrap, cloud smoke y ensayos del handoff
```

Institución/contacto/domicilio, ventana, años, ausencia de divisiones y retención
están aprobados. El arranque rechaza configuración incompleta; verificarla con
`pnpm release:preflight -- --env-file=.env.production.local` antes de operar.
