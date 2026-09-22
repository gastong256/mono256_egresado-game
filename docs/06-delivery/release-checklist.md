# Checklist del Release Candidate — Egresado Fair Edition v1

Binario. Cada línea está `PASSED`, `READY FOR STAGE-10 REHEARSAL` o `FAILED`.

**`READY FOR STAGE-10 REHEARSAL` no es `PASSED`.** Marca lo que necesita
infraestructura real y que este repositorio no puede afirmar sin mentir.

```text
release   egresado-fair-edition-v1 · 1.0.0-rc.1
huella    1affb2a82f4726a77cedbf4e20c82055f6c04a07d67e42674eb8e9e6da16007e
```

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
| BACKUP PROCEDURE | `PASSED` localmente | 3,67 MiB de datos públicos exportados con permisos 0600 |
| RESTORE PROCEDURE | `PASSED` localmente | 6.087 intentos restaurados; rollback y rechazo de destino ocupado probados |
| RUNBOOK | `PASSED` | [runbook de operación](../05-operations/fair-operations-runbook.md) |
| ROLLBACK PROCEDURE | `READY FOR STAGE-10 REHEARSAL` | escrito; no ensayado contra una plataforma |
| REMOTE BACKUP / RESTORE | `READY FOR STAGE-10 REHEARSAL` | las herramientas apuntan a remoto; no se ejecutó |

## Calidad

| Item | Estado | Evidencia |
|---|---|---|
| BUILD GREEN | `PASSED` | sin una sola advertencia |
| VERIFY GREEN | `PASSED` | evidencia anterior + una corrida de continuación por instrucción del Product Owner |
| VITEST | `PASSED` | 119 archivos · 2.323 tests |
| COVERAGE | `PASSED` | 85,67 / 77,58 / 87,68 / 85,90 |
| E2E | `PASSED` | 222 tests en cuatro proyectos |
| ACCESSIBILITY | `PASSED` | axe, teclado, 360 px, sin desborde |
| BUNDLE MEASURED | `PASSED` | 188,5 KiB gzip iniciales en standalone (baseline anterior: 189,0) |
| PERFORMANCE BASELINE | `PASSED` | registro, emisión, verificación, ranking, exportación |
| SYNTHETIC COMPETITION | `PASSED` | jornada entera contra Postgres real |
| REMOTE LOAD TEST | `READY FOR STAGE-10 REHEARSAL` | — |
| STAGING VALIDATION | `READY FOR STAGE-10 REHEARSAL` | — |
| COMPETITION DRY RUN | `READY FOR STAGE-10 REHEARSAL` | — |

## Gobernanza

| Item | Estado | Evidencia |
|---|---|---|
| BROAD HUMAN REVIEW NOT BLOCKING | `PASSED` | [ADR-027](../03-architecture/adr/ADR-027-release-freeze-and-v1-governance.md) |
| TARGETED HUMAN WINDOWS DOCUMENTED | `PASSED` | mismo ADR |
| NEXT STAGE IS STAGE-10 | `PASSED` | [roadmap](implementation-sequence.md) |

## Entradas que faltan, y no son ingeniería

```text
proyecto y clave de producción
dominio https
PARTICIPANT_IDENTITY_SECRET de producción
credencial de organizador con dueño
nombre real de la institución responsable
contacto y domicilio reales
ventana real del evento
EGRESADO_ENVIRONMENT=production
```

El arranque se niega a atender si falta alguno, o si alguno sigue siendo un
valor de ejemplo. `pnpm release:preflight` los verifica sin imprimirlos.
