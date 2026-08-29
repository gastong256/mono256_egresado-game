# Etapa actual

Vista corta del estado de ejecución. El detalle completo, los contratos de todas las etapas y el protocolo de actualización están en el [roadmap de implementación](implementation-sequence.md), que es la autoridad.

---

## STAGE-06 — ScorePolicy competitiva

**Estado:** `READY`. Es la etapa actual; su dependencia está `DONE` y la implementación todavía no empezó.

## Por qué está activa

STAGE-05 está `DONE` con evidencia reforzada: el contenido de una partida se compone una sola vez, dentro de un presupuesto de dificultad, y el motor lo ejecuta sin volver a sortear nada. 20.000 seeds de la partida normal de 7.º producen 1.404 planes distintos con carga total idéntica; todos pasan validación independiente, round-trip y recomposición. Además, 10.000 carreras sintéticas prueban las seis etapas académicas y un test explícito prueba el plan válido de un solo `anchor`. Ver [ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md).

Eso deja las runs comparables **antes** de puntuarlas, que era la condición para que un score competitivo signifique algo. Lo que falta ahora es qué vale lo que el jugador hizo con ese contenido: hoy el score es una política de desarrollo que el motor se niega a declarar oficial, sin componentes normalizados, sin topes y sin orden de desempate.

Hay una separación que esta etapa hereda y no debe romper: el `difficultyCost` con el que el compositor agenda **no es** el multiplicador de score. El primero necesita ser fuerte para poder equilibrar una run; el segundo, chico, para que el sorteo no le gane a la habilidad.

## Objetivo

Que la misma run con la misma policy dé siempre el mismo desglose y el mismo score.

## Scope IN

- `MathPerformance`, `TeamPerformance` y `AuraPerformance` normalizados.
- `ScorePolicy` versionada, con pesos, topes y orden de desempate declarados como configuración.
- `FairScore` y su desglose explicable.
- `scoreVersion` en la identidad de una run.
- Golden de score y reporte de distribución por perfil sintético.

## Scope OUT

**Nada de esto se implementa en esta etapa.**

- Ranking, endpoints, persistencia y fair mode → STAGE-09.
- Egreso, recuperaciones, contenido de 1.º–5.º → STAGE-07 y STAGE-08.
- Recalibrar bandas, costos o presupuestos de dificultad: son de STAGE-05 y su calibración final es del Teacher Gate.
- Contenido nuevo: plantillas, variantes curadas o años.
- Congelar el catálogo oficial de la feria: es una decisión de evento.
- Migrar la pantalla del juego a partidas compuestas: es una decisión de producto que tiene sentido con los años 1.º a 5.º.
- Cualquier cambio al sistema de diseño o a los tokens.

## Criterios de aceptación

- [ ] `ScorePolicy` está versionada y ninguna constante de peso vive dispersa en el código.
- [ ] La misma run con la misma policy produce exactamente el mismo desglose y el mismo score.
- [ ] El desglose explica componentes, multiplicadores, topes y versión de policy.
- [ ] En la policy candidata, la matemática domina el resultado, verificado por simulación.
- [ ] La contribución de Aura está acotada por un tope explícito.
- [ ] **Estilo no aporta score directo**, verificado por test.
- [ ] Promedio no se suma aparte de `MathPerformance` sin justificación escrita.
- [ ] Se pueden cargar y testear varias policies en paralelo.
- [ ] Golden tests de score fijan la salida de policies conocidas.
- [ ] La simulación reporta la distribución de score por perfil sintético.

## Lectura requerida antes de tocar código

1. `AGENTS.md` de la raíz.
2. Este documento y el [contrato de STAGE-06](implementation-sequence.md).
3. [Score competitivo y ranking](../01-game-design/competitive-scoring-and-ranking.md) y [reglas, scoring y progresión](../01-game-design/rules-scoring-and-progression.md).
4. [Fórmulas y algoritmos](../07-reference/formulas-and-algorithms.md), [ejemplo de política](../07-reference/score-policy.example.json) y [ejemplo de desglose](../07-reference/score-breakdown.example.json).
5. [ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md) — por qué el costo de scheduling y el multiplicador de score son dos números distintos.
6. [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md) — Promedio, Equipo, Aura y Estilo, y por qué Estilo no puntúa.
7. El código: `src/game/scoring/`, `src/game/profiles/`, `src/game/runs/state.ts`.

## Validación requerida

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm game:simulate:deep` · `pnpm verify`.

Con Node `24.19.0`, la versión que `pnpm toolchain:check` exige exacta.

## Bloqueos

Ninguno. La etapa puede empezar.

## Decisiones abiertas o de Teacher Gate relevantes ahora

- `RECOMENDADA` (D-010): `FairScore` separado de las stats de carrera. `RECOMENDADA` (D-012): Estilo no puntúa directamente.
- `TEACHER GATE` (D-011, [preguntas 38 y 39](../07-reference/open-questions.md)): pesos exactos y calibración de calidades.
- `TEACHER GATE` ([pregunta 44](../07-reference/open-questions.md)): calibración de bandas y costos de dificultad. **No se cierra acá**, pero el multiplicador de score se discute contra ella.
- `LOCKED`: el navegador no es autoridad de score.

## Evidencia ya disponible

- Modelo de dificultad y compositor de runs — [ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md); `difficultyCost` ya existe y está separado del multiplicador de score.
- Runs comparables antes de puntuar — `pnpm game:compose -- --content=grade-7 --runs=20000`: 20.000 planes válidos, 1.404 distintos, carga total idéntica; `--content=synthetic-six-stage --runs=10000`: 10.000 carreras de seis etapas, cero fallos.
- Catálogo aprobado dentro del juego — [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md); catálogos `grade-7-dev-1`, `dev-2` y `dev-3`, inmutables.
- Pipeline de variantes — [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md).
- Modelo de contenido — [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md).
- Career Model v2 — [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md).
- Sistema de diseño v0.2 — [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md).
- Verificación autoritativa por replay — `src/server/game/validate-run.ts`, que ya recompone y valida el plan de una run compuesta.
- Estabilidad del juego — golden con mismo recorrido, score, perfil y comandos; runs simuladas sin hallazgos.
- Versionado — `ENGINE_VERSION 5.0.0`, `SNAPSHOT_SCHEMA_VERSION 5`, `ACTION_LOG_VERSION 3`, contenido `0.7.0-grade-7` y `0.5.0-dev`.

## Siguiente etapa

STAGE-04 ya está `DONE`; completar STAGE-06 habilita el **Teacher Gate 1**, el primer gate externo. En paralelo, STAGE-07 depende de ese gate.

## Última reconciliación

29 de agosto de 2026, al cerrar STAGE-05, con `pnpm verify` en verde.
