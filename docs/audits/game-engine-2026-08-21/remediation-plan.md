# Plan de remediación

Base: [findings.md](findings.md). Ordenado por dependencia, no por severidad: ENG-DET-001 fija el contrato de direccionamiento del que dependen ENG-SEC-001 y ENG-VER-001.

Principio rector: cerrar el defecto real en su frontera. No se rehace la arquitectura del motor —es correcta y está probada— y no se convierte una alternativa deseable en bloqueo.

## Wave 1 — corrección arquitectónica

### 1.1 ENG-DET-001 · separadores explícitos y contrato fijado

Cambio: sustituir los bytes crudos por escapes `' '` (junta seed↔path) y `''` (junta entre segmentos); documentar por qué esos caracteres y no un separador imprimible; añadir vectores de prueba.

Riesgo de compatibilidad: **ninguno si la salida no se mueve**. Los escapes producen exactamente los mismos bytes, así que las direcciones derivadas y los golden replays deben permanecer idénticos. Que los goldens sigan pasando sin regenerarse es la prueba de que el cambio es puramente de representación.

Tests: vectores `(seed, path) -> dirección` y `-> seed derivado`; test que falla si el fuente vuelve a contener bytes de control.

Acceptance: fuente sin caracteres de control; golden replays intactos; ADR-012 corregido.

### 1.2 ENG-MATH-001 · `toNumber` robusto

Cambio: convertir por división escalada sobre `bigint` en lugar de `Number(n)/Number(d)`. Extraer el cociente entero y una parte fraccionaria con precisión fija, recomponer en double, y saturar a ±Infinity sólo cuando el valor realmente excede el rango double.

Riesgo: `toNumber` alimenta métricas que entran en el score. Un cambio de valor movería la salida determinista. Mitigación: la nueva implementación debe coincidir bit a bit con la anterior en el rango donde la anterior era correcta; los golden replays lo verifican.

Tests: property test sobre magnitudes extremas (10^±400) sin excepción y siempre finito; equivalencia con la fórmula ingenua en el rango seguro.

Acceptance: sin NaN/Infinity para racionales finitos; goldens intactos.

### 1.3 ENG-SEC-001 · parseo real de identificadores

Cambio: añadir `parseRunSeed` / `parseChallengeId` / … que devuelvan `Result` y validen charset, y aplicarlos en `parseActionLog` y `restoreSnapshot`. Los constructores `toXxx` quedan como conversión interna para valores ya probados, documentados como tales.

Riesgo: rechazar seeds que hoy se aceptan. El charset ya cubre lo que produce el propio sistema (`dev-run-…`, `sim-0`, `e2e-alpha`); se verifica que fixtures, simulación y E2E siguen pasando.

Tests: seed/identificador fuera de charset rechazado en ambas fronteras; el camino legítimo intacto.

Acceptance: `isSeed`/`isIdentifier` con consumidores de producción; entradas hostiles rechazadas con tipo.

### 1.4 ENG-STATE-001 · invariantes estructurales en la restauración

Cambio: función `runStateIssues(state): readonly string[]` en el dominio, que comprueba la correlación fase↔payload y la coherencia de índices e historia. `restoreSnapshot` la ejecuta y rechaza con `corrupted-snapshot`.

Alternativa considerada y descartada en esta ola: unión discriminada sobre `phase`. Haría los estados imposibles irrepresentables, pero cambia el formato persistido y toca transición, selectores y UI; el defecto real vive en una sola frontera. Se documenta como evolución futura.

Tests: cada mutación de la tabla de ENG-STATE-001 rechazada; property test de que todo estado alcanzable jugando satisface las invariantes.

Acceptance: snapshot corrupto rechazado; snapshot legítimo intacto.

## Wave 2 — versionado

### 2.1 ENG-VER-001 · fingerprint de ruleset y contenido

Cambio: `rulesetFingerprint(ruleset)` y `contentFingerprint(registry, storylets)` deterministas sobre la forma canónica de lo que afecta la salida (identidades de política, etapas, pacing, ids/etapas/dificultad/pools de contenido). Un test fija el par versión↔fingerprint.

`RNG_ALGORITHM` entra en el fingerprint del motor, con lo que deja de ser un export muerto y pasa a tener función real.

Tests: cambiar una constante de política o el content set rompe el test con un mensaje que nombra la versión a subir.

Acceptance: la regla de versionado deja de depender de la disciplina humana.

## Wave 3 — integración

### 3.1 ENG-SRV-001 · validación autoritativa server-side

Cambio: caso de uso `server-only` que recibe descriptor + action log no confiables, los parsea, ejecuta replay y devuelve estado final, score y perfil validados, o un rechazo tipado. Sin endpoints, sin persistencia: sólo la frontera que ADR-004 exige.

Tests: run legítima validada; action log con score inflado, acción de más, secuencia rota, versión incompatible o seed hostil, rechazados.

Acceptance: la propiedad "el servidor recalcula, no confía" es ejecutable.

### 3.2 ENG-UI-001 · estado imposible en la tarjeta final

Cambio: dejar de sustituir `completion` ausente por `0` / `'sin perfil'`. Si el motor dice run completa, `completion` existe; ante su ausencia la UI no inventa un resultado.

Tests: componente que no renderiza un resultado falso.

## Wave 4 — infraestructura de calidad

### 4.1 ENG-TEST-001 · determinismo cross-runtime

Fijar en el E2E los valores calculados en Node para `seed=e2e-alpha`, de modo que el browser deba reproducirlos.

### 4.2 ENG-DEAD-001 · limpieza

Eliminar `SequenceNumber`, `toSequenceNumber`, `emptyBreakdown`, `developmentQualityFactor`, `requiredLitresFor`, `ONE`, `DIFFICULTY_LEVELS`. Reducir a internos `encodeRngPath`, `applyEffect`, `currentStageIndex`. `RNG_ALGORITHM` se conserva porque 2.1 le da uso.

### 4.3 CI

Los tests nuevos entran por las suites ya cableadas (`pnpm test` → `pnpm verify` → CI). No se añaden pasos nuevos ni se alarga el pipeline.

## Wave 5 — documentación

- ADR-012: corregir los separadores y describir el contrato real.
- `game-engine.md`: invariantes de estado, fingerprint de versión, frontera de validación server-side.
- `game-engine-development.md`: qué hacer cuando el test de fingerprint falla.
- Comentario del test de `engine-core` sobre separadores.
- Cerrar los hallazgos en [final-audit.md](final-audit.md).

## Fuera de alcance

- Unión discriminada de `phase` (documentada como evolución).
- Endpoints de runs, persistencia y ranking.
- Valores finales de scoring, dificultad y perfil: preguntas abiertas 5 y 24, decisión de producto.
- Nuevas familias de interacción.

## Dependencias

```text
1.1 ── 1.3 ── 1.4
  └──── 2.1
1.2 (independiente)
3.1 depende de 1.3 y 1.4
4.1 depende de 1.1 y 1.2 (la salida no debe moverse)
```

Sin dependencias nuevas de runtime en ninguna ola.
