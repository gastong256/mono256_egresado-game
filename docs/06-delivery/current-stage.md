# Etapa actual

Vista corta del estado de ejecución. El detalle completo, los contratos de todas las etapas y el protocolo de actualización están en el [roadmap de implementación](implementation-sequence.md), que es la autoridad.

---

## STAGE-04 — Enriquecimiento de 7.º y Demo Candidate

**Estado:** `PARTIAL` — Aura, el acto del 25 de Mayo y la migración estructural están `DONE`; el enriquecimiento de contenido y la preparación de la demo docente están pendientes y ya no tienen bloqueos.

## Por qué está activa

STAGE-03 está `DONE` con evidencia: existe un pipeline de variantes completo —generación por restricción, validación con oráculos independientes, huella SHA-256, deduplicación, auditoría estadística y catálogo aprobado versionado—, y la barrida profunda de 50.013 candidatos no produjo un solo rechazo. Ver [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md).

Lo que falta ahora es **usar toda esa maquinaria en contenido real**. El pipeline puede producir treinta mil problemas distintos, pero la partida de 7.º sigue jugando dos variantes curadas por desafío y una sola estructura cognitiva por familia. Convertir eso en una Demo Candidate que un docente pueda jugar dos veces y notar la diferencia es trabajo de contenido, no de arquitectura.

## Objetivo

Que 7.º sea una **Demo Candidate representativa del producto final**: que la segunda partida cambie los valores y, en alguna familia, cambie la pregunta.

## Scope IN

- Conectar el catálogo aprobado con la selección de contenido de una run, sin inventar el compositor completo.
- Sumar estructuras cognitivas donde aporten de verdad: una familia con dos plantillas distintas prueba lo que el modelo promete.
- Ampliar la variación de las familias existentes usando el catálogo, no escribiendo variantes a mano.
- Definir qué juega la demo docente y en qué se diferencia de una run normal.
- QA visual y funcional del recorrido completo; materiales de revisión docente.

## Scope OUT

**Nada de esto se implementa en esta etapa.**

- Bandas de dificultad, `difficultyCost`, presupuesto equiparado y Run Composer completo → STAGE-05.
- `FairScore`, `MathPerformance`, `ScorePolicy` competitiva, `scoreVersion` → STAGE-06.
- Egreso, recuperaciones, contenido de 1.º–5.º → STAGE-07 y STAGE-08.
- Ranking, endpoints, persistencia, fair mode → STAGE-09.
- Congelar el catálogo oficial de la feria: es una decisión de evento, no de contenido.
- Cerrar el inventario de escenarios ni mover contenido de año: sigue **OPEN**.
- Cualquier cambio al sistema de diseño o a los tokens.

## Criterios de aceptación

- [ ] Los seis desafíos actuales conservan su intención matemática; cualquier cambio es deliberado y está escrito.
- [x] El acto del 25 de Mayo está en el flujo real de la partida.
- [x] Aura pasa de `null` a un valor significativo durante la run y no se dibuja antes.
- [x] Clasificación y F1 probados, incluidos los tres casos de denominador cero.
- [x] Jugable con teclado y en 360/390/430 px.
- [x] El motor evalúa la matemática; React no.
- [x] Replay, snapshot y simulación correctos.
- [x] El cierre de año sigue funcionando.
- [ ] Una segunda partida muestra variación real, no reordenamiento de opciones.
- [ ] Al menos una familia aloja dos estructuras cognitivas distintas en contenido de producción.
- [ ] Está definido qué juega la demo docente y por qué.

## Lectura requerida antes de tocar código

1. `AGENTS.md` de la raíz.
2. Este documento y el [contrato de STAGE-04](implementation-sequence.md).
3. [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md) y [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md) — el modelo de contenido y su pipeline.
4. [Vertical slice de 7.º](vertical-slice-grade-7.md) — el alcance de la demo.
5. [Familias, plantillas y variantes](../01-game-design/challenge-families-and-variants.md) y [catálogo de desafíos](../01-game-design/challenge-catalog.md).
6. [Migración del modelo de contenido](../03-architecture/content-model-migration.md) — cómo se autora una plantilla hoy.
7. [Guía de autoría](../01-game-design/content-authoring-guide.md) y [marco matemático](../01-game-design/math-design-framework.md).
8. El código: `src/content/grade-7/`, `src/game/challenges/`, `src/game/content/`.

## Validación requerida

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm game:validate-content` · `pnpm game:variants check` · `pnpm game:simulate` · `pnpm verify`.

Cuando se toque un generador: `pnpm game:variants audit` y `pnpm game:variants build`.

Con Node `24.19.0`, la versión que `pnpm toolchain:check` exige exacta.

## Bloqueos

Ninguno. La etapa puede avanzar.

## Decisiones abiertas o de Teacher Gate relevantes ahora

- `OPEN` ([preguntas 46 y 46-bis](../07-reference/open-questions.md)): cuántas familias, plantillas y variantes tiene Egresado, y qué pasa con los seis escenarios actuales. **No se cierra acá.**
- `OPEN` ([pregunta 42](../07-reference/open-questions.md)): si el acto del 25 de Mayo entra a producción. Está implementado; falta la aprobación de contenido.
- `TEACHER GATE`: nivel matemático, terminología y duración objetivo de la demo. Se llevan al Gate 1, después de STAGE-06.

## Evidencia ya disponible

- Pipeline de variantes — [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md); 50.013 candidatos con 0 rechazos y 30.671 problemas distintos.
- Catálogo aprobado `grade-7-dev-1` — `src/content/grade-7/variant-catalog.json`, 133 variantes, verificado en `pnpm verify`.
- Modelo de contenido — [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md).
- Career Model v2 — [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md).
- Sistema de diseño v0.2 — [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md).
- Estabilidad del juego — golden con mismo recorrido, score, perfil y comandos; 5.000 runs simuladas sin hallazgos.
- Versionado — `ENGINE_VERSION 4.0.0`, `SNAPSHOT_SCHEMA_VERSION 4`, contenido `0.4.0-dev` y `0.5.0-grade-7`, ruleset sin cambios.

## Siguiente etapa

Completar STAGE-04 y STAGE-06 habilita el **Teacher Gate 1**, el primer gate externo. En paralelo, **STAGE-05 — dificultad y Run Composer** puede empezar en cuanto STAGE-04 defina qué contenido compone una demo.

## Última reconciliación

28 de agosto de 2026, al cerrar STAGE-03, con `pnpm verify` en verde.
