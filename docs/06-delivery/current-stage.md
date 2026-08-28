# Etapa actual

Vista corta del estado de ejecución. El detalle completo, los contratos de todas las etapas y el protocolo de actualización están en el [roadmap de implementación](implementation-sequence.md), que es la autoridad.

---

## STAGE-05 — Modelo de dificultad y Run Composer

**Estado:** `NOT_STARTED`. Sin bloqueos: las dos etapas de las que depende están `DONE`.

## Por qué está activa

STAGE-04 está `DONE` con evidencia: el catálogo aprobado alimenta la partida real de 7.º, la familia colectivo tiene dos plantillas con razonamientos distintos, y el demo docente existe como artefacto separado de una run. Ver [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md).

Lo que falta ahora es **elegir ese contenido con criterio**. Hoy el storylet elige dentro de su pool y el seed elige dentro de lo aprobado; nadie mira dificultad, variedad, cobertura de dominios ni presupuesto. Mientras eso siga así, en una competencia el sorteo decide parte del resultado, y ése es exactamente el problema que esta etapa existe para cerrar.

Hay además una deuda concreta que le toca: **el año de 7.º juega seis beats ordinarios y el presupuesto de una run es de uno o dos**. STAGE-04 no lo tapó —formalizó el demo como artefacto aparte y dejó el techo intacto—, pero reconciliarlo de verdad es componer runs, y eso es acá.

## Objetivo

Que muchas runs distintas tengan dificultad total comparable, con evidencia de simulación.

## Scope IN

- Bandas `CORE / STANDARD / STRETCH` como metadata de autoría, con correspondencia declarada contra `DifficultyLevel` 1–5.
- `difficultyCost` **separado** de `scoreMultiplier`.
- `DifficultyBudget` por run, con tolerancia.
- Run Composer determinista que elige familia/plantilla/variante por variedad, presupuesto, no repetición, cobertura de dominios y coherencia narrativa.
- Reporte de distribución de dificultad sobre miles de runs simuladas.

## Scope OUT

**Nada de esto se implementa en esta etapa.**

- `FairScore`, `MathPerformance`, `ScorePolicy` competitiva, `scoreVersion` → STAGE-06.
- Egreso, recuperaciones, contenido de 1.º–5.º → STAGE-07 y STAGE-08.
- Ranking, endpoints, persistencia, fair mode → STAGE-09.
- Dificultad adaptativa en modo oficial.
- Contenido nuevo: plantillas, variantes curadas o años.
- Congelar el catálogo oficial de la feria: es una decisión de evento.
- Cerrar el inventario de escenarios o mover contenido de año: sigue **OPEN**.
- Cualquier cambio al sistema de diseño o a los tokens.

## Criterios de aceptación

- [ ] La dificultad de cada plantilla es explícita y justificable por estructura, no por tamaño de los números.
- [ ] `difficultyCost` y `scoreMultiplier` son campos distintos y están documentados como tales.
- [ ] El composer es determinista para un seed y una configuración dados.
- [ ] `abs(Σ difficultyCost − targetBudget) <= tolerance` como invariante testeada.
- [ ] Miles de runs simuladas sin diferencias groseras de dificultad total.
- [ ] La distribución de dificultad se reporta de forma legible.
- [ ] Presupuesto y multiplicadores son configuración, no constantes dispersas, para poder llevarlos a Teacher Gate.

## Lectura requerida antes de tocar código

1. `AGENTS.md` de la raíz.
2. Este documento y el [contrato de STAGE-05](implementation-sequence.md).
3. [Dificultad y jugabilidad universal](../01-game-design/difficulty-and-playability.md) y [marco matemático](../01-game-design/math-design-framework.md).
4. [Auditoría de equidad competitiva](../04-quality/competition-fairness-audit.md).
5. [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md) — `ContentCatalog` ≠ `RunPlan`, roles de colocación y el presupuesto de beats que el composer tiene que respetar.
6. [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md) — cómo llega hoy el contenido aprobado a la partida, y por qué el demo docente **no** es un plan de run.
7. El código: `src/game/content/run-plan.ts`, `src/game/narrative/selection.ts`, `src/game/difficulty/`, `src/content/grade-7/`.

## Validación requerida

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm game:simulate:deep` · `pnpm verify`.

Con Node `24.19.0`, la versión que `pnpm toolchain:check` exige exacta.

## Bloqueos

Ninguno. La etapa puede empezar.

## Decisiones abiertas o de Teacher Gate relevantes ahora

- `RECOMENDADA` (D-014): presupuesto de dificultad. `RECOMENDADA` (D-015): piso bajo y techo alto.
- `TEACHER GATE` ([pregunta 44](../07-reference/open-questions.md)): calibración de bandas y costos.
- `OPEN` ([pregunta 5](../07-reference/open-questions.md)): dificultad manual, adaptativa o híbrida.
- `OPEN` ([preguntas 46 y 46-bis](../07-reference/open-questions.md)): cuántas familias, plantillas y variantes tiene Egresado. **No se cierra acá**, pero el composer tiene que funcionar sin esa respuesta.

## Evidencia ya disponible

- Catálogo aprobado dentro del juego y demo docente — [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md).
- Catálogos `grade-7-dev-1` (133 variantes) y `grade-7-dev-2` (159), inmutables y verificados en `pnpm verify`.
- Pipeline de variantes — [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md); 36.064 candidatos con 0 rechazos sobre siete plantillas.
- Modelo de contenido — [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md); `RunPlan` y `validateStagePlan` ya definen qué plan es válido.
- Career Model v2 — [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md).
- Sistema de diseño v0.2 — [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md).
- Estabilidad del juego — golden con mismo recorrido, score, perfil y comandos; runs simuladas sin hallazgos.
- Versionado — `ENGINE_VERSION 4.1.0`, `ACTION_LOG_VERSION 2`, `SNAPSHOT_SCHEMA_VERSION 4`, contenido `0.4.0-dev` y `0.6.0-grade-7`, ruleset sin cambios.

## Siguiente etapa

STAGE-06 — ScorePolicy competitiva, que depende de esta. Completar STAGE-04 (ya `DONE`) y STAGE-06 habilita el **Teacher Gate 1**, el primer gate externo.

## Última reconciliación

28 de agosto de 2026, al cerrar STAGE-04, con `pnpm verify` en verde.
