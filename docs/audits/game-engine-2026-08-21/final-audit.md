# Auditoría final

Segunda pasada tras la remediación. Base: [findings.md](findings.md), [remediation-plan.md](remediation-plan.md).

## Estado de los hallazgos

| ID | Sev | Estado | Evidencia |
|---|---|---|---|
| ENG-DET-001 | P1 | **Verificado** | El fuente no contiene bytes de control; los separadores son escapes `' '` / `''`. `tests/unit/rng-addressing.test.ts` fija 5 vectores de codificación, 4 casos de no-colisión, 3 seeds derivados y una secuencia de tiradas, y falla si vuelven los bytes crudos. Los golden replays pasaron **sin regenerarse**, que es la prueba de que la salida no se movió |
| ENG-STATE-001 | P1 | **Verificado** | `runStateIssues` verifica correlación fase↔payload, coherencia de `status`, contigüidad del historial, `scorePreview` como suma de puntos, calidades, racha y storylets vistos. `restoreSnapshot` rechaza con `corrupted-snapshot`. Las 5 mutaciones de la tabla original, más 3 nuevas, son rechazadas; un snapshot legítimo sigue restaurándose |
| ENG-SEC-001 | P2 | **Verificado** | `OPAQUE_ID_PATTERN` e `IDENTIFIER_PATTERN` aplicados en `parseActionLog`, `parseCommand` y `restoreSnapshot`. Espacio, `U+0000`, `U+0001`, emoji, vacío y 200 caracteres: rechazados en las tres fronteras. `e2e-alpha`, `Feria-2026`, `sim-0`, `dev.run:1`: aceptados |
| ENG-VER-001 | P2 | **Verificado** | `engineFingerprint`, `rulesetFingerprint` y `contentFingerprint` fijados en `tests/unit/engine-fingerprint.test.ts` contra la versión declarada. Cambiar el id de una política o recortar el content set sin mover la versión rompe el test; el docstring dice qué versión subir |
| ENG-MATH-001 | P2 | **Verificado** | `toNumber` conserva la conversión directa donde ya era correcta —property test contra la fórmula anterior— y recupera el cociente por bigint cuando ambos términos exceden el rango double. `10^400/(3·10^400+1)` devuelve ≈0.333 en lugar de `NaN`; `clamp01` ya no lanza |
| ENG-SRV-001 | P2 | **Verificado** | `src/server/game/validate-run.ts` reproduce una submission no confiable y devuelve score/perfil recalculados. 12 tests: resultado legítimo, score reclamado por el cliente ignorado, acción insertada, secuencia rota, run truncada, ruleset incompatible, seed hostil y 5 payloads malformados |
| ENG-TEST-001 | P2 | **Verificado** | El E2E exige que el browser reproduzca los valores que Node calcula para `seed=e2e-alpha`: storylets, id de instancia `year-1:2:dev.notebook-discount` y el parámetro generado. Pasa en desktop y mobile |
| ENG-DOC-001 | P3 | **Verificado** | ADR-012 y el comentario del test describen los separadores reales y por qué son escapes |
| ENG-DEAD-001 | P3 | **Verificado** | Eliminados `SequenceNumber`, `toSequenceNumber`, `emptyBreakdown`, `developmentQualityFactor`, `requiredLitresFor`, `ONE`, `DIFFICULTY_LEVELS`. `applyEffect` y `currentStageIndex` pasaron a internos. `RNG_ALGORITHM` ahora forma parte del fingerprint del motor |
| ENG-UI-001 | P3 | **Verificado** | La tarjeta final sólo se dibuja con un `completion` real; ya no sustituye por `0` / `'sin perfil'` |

P0 abiertos: 0. P1 abiertos: 0. P2 abiertos: 0. P3 abiertos: 0.

## Segunda pasada por categorías

Repetida sobre el código remediado.

| Categoría | Resultado |
|---|---|
| Nondeterminismo prohibido en el core | 0 ocurrencias reales |
| Bytes de control en el fuente | 0 |
| Ciclos de import | 0, incluyendo aristas type-only |
| `any` / `as unknown as` | 0 / 0 |
| `TODO`/`FIXME`/`HACK`/`NotImplemented` | 0 |
| Tests skipped | 0 |
| Fronteras React/Next/server | ningún componente calcula reglas; `use client` sólo en `src/components`; guardas `server-only` intactas |
| Contaminación del bundle | fixtures sólo en el chunk de `/dev/game-engine` |
| Exports sin uso en `src/game` | 0 no justificados |
| Vulnerabilidades de dependencias | ninguna conocida |
| Dependencias nuevas | ninguna |

## Regresiones introducidas por la remediación

Ninguna detectada. Concretamente:

- los golden replays pasan **sin regenerarse**, así que la salida determinista no se movió pese a tocar el direccionamiento de RNG y `toNumber`;
- la simulación masiva completa todas las runs sin hallazgos;
- el charset más estricto no rechaza ningún identificador que el sistema produzca —fixtures, simulación, property tests y E2E siguen pasando—;
- las invariantes de restauración no rechazan ningún estado alcanzable jugando, verificado con property test sobre runs reales.

## Validación posterior

| Gate | Resultado |
|---|---|
| `pnpm format:check` | pass |
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm test:coverage` | pass — **292 tests / 21 archivos** (baseline: 232 / 17) |
| `pnpm game:validate-content` | pass — 0 errores, 0 warnings |
| `pnpm game:simulate` | pass — 500 runs, 0 hallazgos |
| `pnpm game:simulate:deep` | pass — 5 000 runs, 13.00 eventos por run, 0 hallazgos. Score min/promedio/máximo **idéntico** al baseline (4410 / 8252 / 12479), lo que confirma que la salida determinista no se movió |
| `pnpm build` | pass |
| `pnpm test:e2e:only` | pass — 14 tests, desktop y mobile |
| `pnpm verify` | pass |
| `pnpm security:audit` | pass |
| `docker build` + smoke | pass — healthy, no-root, `/` y `/api/health` 200. El motor se renderiza server-side dentro del contenedor y produce los mismos valores que Node para `seed=e2e-alpha` |
| `pnpm release:check` | fail **esperado** — bloqueo documentado de Next.js `16.3.2` |

Cobertura: statements 89.14 %, branches 78.83 %, functions 95.02 %, lines 88.91 % (umbrales 85/75/85/85). El baseline era 89.20 / 78.68 / 94.26 / 88.94 sobre una base menor.

## Clasificación de lo que queda

### Decisión de producto pendiente

- Constantes finales de scoring (pregunta abierta 24) y política de dificultad (pregunta 5). El motor expone ambas como políticas; `createRuleset({ official: true })` falla mientras sean de desarrollo. No es deuda técnica.
- Señal temporal autoritativa (pregunta 27). El scoring no usa tiempo por decisión explícita.

### Feature futura

- Familias `spatial-grid`, `sequence/trend` y `special minigame`: no contratadas.
- Persistencia de checkpoint: el motor pide el snapshot y el controller expone el sink; nadie escribe todavía.
- Endpoints de runs, sesión, rate limiting y ranking. La frontera de validación autoritativa ya existe y está probada.

### Evolución arquitectónica documentada

- `phase` como unión discriminada que lleve su payload. Haría irrepresentables los estados que hoy se rechazan por validación. Cambia el formato persistido; el defecto ya está cerrado en su frontera.

### Deuda técnica

Ninguna P0, P1 ni P2. Ninguna P3 foundacional.

## Limitaciones de esta auditoría

- El fingerprint cubre identidad y configuración de políticas, no el cuerpo de cada función. Cambiar una constante *dentro* de `development-scoring-v1` sin cambiar su `id` no mueve el fingerprint del ruleset —pero sí rompe los golden replays, que es la segunda barrera. La regla operativa es que un cambio de comportamiento cambia el `id` de la política.
- La distribución de perfiles que reporta la simulación describe juego aleatorio del agente sintético, no juego humano. No sirve para balancear.
- No se ejecutó mutation testing. Se valoró y se descartó: el oráculo independiente sobre los evaluadores y las property tests de determinismo/replay dan una señal más directa por menos costo de mantenimiento.
