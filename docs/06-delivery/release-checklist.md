# Checklist del Release Candidate — Egresado Fair Edition v1

Binario. Cada línea está `PASSED`, `READY FOR STAGE-10 REHEARSAL` o `FAILED`.

**`READY FOR STAGE-10 REHEARSAL` no es `PASSED`.** Marca lo que necesita
infraestructura real y que este repositorio no puede afirmar sin mentir.

```text
release   egresado-fair-edition-v1 · 1.0.0-rc.3
huella    a039dc32dfce527bf3a537249c0f2d7cceca9bcbe44d5cd031a9d05a20c29e46
```

La evidencia histórica de RC1/RC2 se conserva en sus reportes. La identidad,
excepciones autorizadas y validación vigente están en el [cierre de RC3](rc3-release-closure.md).
Se reutiliza el verify documentado por el otro agente y se verifican de nuevo
los cambios del corte; no se presenta como un nuevo verify completo.
El [handoff A–I](../05-operations/vercel-supabase-production-deployment.md) es el procedimiento vigente.

## Producto congelado

| Item | Estado | Evidencia |
|---|---|---|
| GAME FROZEN | `PASSED` | motor `10.0.0`, action log `7`, snapshot `8` en el manifiesto y comprobados |
| MATH FROZEN | `PASSED` | `game:score` sin spread, `game:blind-audit` sin cambios, `game:simulate:deep` 5000/5000 |
| CONTENT FROZEN | `PASSED` con excepción RC3 documentada | catálogos sin cambios; Promedio corregido por D-RC3-P-004 / `8ba9df4`, sin alterar FairScore |
| SCORE OFFICIAL | `PASSED` | `fair-score-v1@1.0.0-fair-edition-v1`, `official: true`, equivalencia probada |
| PRESTIGE V1 EXPLICIT | `PASSED` | techo ofrecido 0, recomputado; fuera del podio público |
| RANKING FROZEN | `PASSED` | `ranking-release-regression.test.ts` |
| PODIUM FROZEN | `PASSED` | tres puestos reales, empate entero; ventana pública de doce filas por ADR-031 |
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
| INDEXES REVIEWED | `PASSED` | índices sin cambios; ranking RC3: mediana 115 ms / peor 161 ms sobre 500 participantes × 3 intentos, medición local |
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
| VERIFY GREEN | `PASSED` (evidencia reutilizada) | reporte del fix de Promedio: exit 0; correspondencia de fuentes auditada en el cierre RC3 |
| VITEST | `PASSED` | verify previo: 140 archivos / 2542 tests; corte RC3: 123 tests dirigidos adicionales |
| COVERAGE | `PASSED` (reutilizada) | 86,92 / 79,91 / 89,36 / 87,15; no recalculada en el corte |
| E2E | `PASSED` (reutilizada) | 270 en el verify previo; seis recorridos dirigidos adicionales al integrar; smoke HTTP del artefacto RC3 |
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
deploy, bootstrap si faltara la edición, cloud smoke y ensayos del handoff
```

El PO confirma migraciones RC2 ya aplicadas en producción y ausencia de partidas.
RC3 no requiere SQL nuevo ni reconstrucción de resúmenes. Esta confirmación no
sustituye la comprobación operativa de readiness.

Institución/contacto/domicilio, ventana, años, ausencia de divisiones y retención
están aprobados. El arranque rechaza configuración incompleta; verificarla con
`pnpm release:preflight -- --env-file=.env.production.local` antes de operar.

## Superficie pública agregada durante RC3

`/test`, `POST /api/practice/runs` y `POST /api/practice/runs/verify` son públicos
por [ADR-029](../03-architecture/adr/ADR-029-public-practice-mode.md). No son un
harness ni participan de la competencia. `tests/e2e/practice.spec.ts` exige 200
con nonce en `/test` y 404 en rutas DEV del build competitivo. La entrega se incluye en RC3; los campos competitivos del manifiesto permanecen
intactos y el candado cambia únicamente por la identidad del release.

`/privacidad` también es pública por
[ADR-030](../03-architecture/adr/ADR-030-privacy-page-and-action-acknowledgement.md):
aviso v1 íntegro, SSR sin JavaScript y nonce CSP. `tests/e2e/privacy.spec.ts` cubre
lectura sin cookies, enlace del footer, accesibilidad y rechazo API de aceptación
ausente/falsa o versión desactualizada. No cambia el contrato legal congelado.

`/puntajes` explica las reglas con lenguaje simple y acceso desde el footer.
El ranking guarda los resultados de la mejor partida y publica una ventana
acotada por ADR-031. La corrección de Promedio del otro agente está preservada;
la proyección de una carrera óptima publica 10, probado en la integración.
