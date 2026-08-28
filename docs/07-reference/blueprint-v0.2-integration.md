# Integración del Project Blueprint v0.2.0

Qué entró, dónde quedó, qué se descartó y qué conflictos hubo. Este documento existe para que dentro de seis meses nadie tenga que adivinar por qué un documento dice lo que dice.

- **Paquete:** EGRESADO Project Blueprint & Technical Handoff v0.2.0 — 79 archivos, verificados contra su `MANIFEST.json`.
- **Fuente congelada:** [`docs/sources/egresado-project-blueprint-v0.2.0/`](../sources/README.md).
- **Fecha de integración:** 28 de agosto de 2026.
- **Decisión de gobernanza:** [ADR-018](../03-architecture/adr/ADR-018-blueprint-v0-2-decision-authority.md).
- **Alcance de la integración:** documentación únicamente. No se modificó comportamiento de producto, motor, frontend, sistema de diseño, tokens, contenido ejecutable, persistencia ni configuración de runtime.

## Cómo leer las acciones

| Acción | Significado |
|---|---|
| **NUEVO** | no existía documento equivalente; se creó uno canónico |
| **FUSIÓN** | el contenido se incorporó a un documento existente |
| **REFERENCIA** | el repositorio ya lo cubría; se dejó enlace, no copia |
| **SUPERADO POR EL REPO** | el repositorio tiene una versión más nueva o ya implementada; el paquete queda como historia |
| **DEFIERE A DISEÑO** | es material visual; manda el sistema de diseño implementado |

## Mapa por documento del paquete

### 00-governance

| Origen | Acción | Destino |
|---|---|---|
| `decision-register.md` | FUSIÓN | [registro de decisiones](decision-register.md) |
| `decision-status.md` | FUSIÓN | [registro de decisiones](decision-register.md) y [ADR-018](../03-architecture/adr/ADR-018-blueprint-v0-2-decision-authority.md) |
| `glossary.md` | FUSIÓN | [glosario](glossary.md) |
| `source-of-truth.md` | FUSIÓN | [ADR-018](../03-architecture/adr/ADR-018-blueprint-v0-2-decision-authority.md) y el README de `docs/` |

### 01-product

| Origen | Acción | Destino |
|---|---|---|
| `real-delivery-lifecycle.md` | NUEVO | [ciclo de entrega real](../00-product/real-delivery-lifecycle.md) |
| `product-vision.md` | FUSIÓN | [visión de producto](../00-product/product-vision.md) |
| `full-project-scope.md` | FUSIÓN | [alcance y roadmap](../00-product/scope-and-roadmap.md) |
| `scope-demo-7mo.md` | FUSIÓN | [vertical slice de 7.º](../06-delivery/vertical-slice-grade-7.md) |
| `personas-and-contexts.md` | FUSIÓN | [personas y contextos](../00-product/personas-and-contexts.md) |
| `risks-and-assumptions.md` | FUSIÓN | [riesgos y supuestos](../00-product/risks-and-assumptions.md) |
| `success-metrics.md` | FUSIÓN | [métricas de éxito](../00-product/success-metrics.md) |

### 02-functional

| Origen | Acción | Destino |
|---|---|---|
| `functional-specification.md` | REFERENCIA | [especificación funcional](../02-functional/functional-specification.md); F-001…F-013 mapean a FR-001…FR-020 |
| `traceability-matrix.md` | FUSIÓN | [matriz de trazabilidad](../02-functional/traceability-matrix.md) |
| `user-flows.md` | FUSIÓN | [flujos](../02-functional/user-flows.md) |
| `user-stories.md` | FUSIÓN | [historias de usuario](../02-functional/user-stories.md) |

### 02-game-design

| Origen | Acción | Destino |
|---|---|---|
| `challenge-families-and-variants.md` | NUEVO | [familias, plantillas y variantes](../01-game-design/challenge-families-and-variants.md) |
| `difficulty-and-universal-playability.md` | NUEVO | [dificultad y jugabilidad universal](../01-game-design/difficulty-and-playability.md) |
| `competitive-scoring-and-ranking.md` | NUEVO | [score competitivo y ranking](../01-game-design/competitive-scoring-and-ranking.md) |
| `graduation-and-fail-forward.md` | NUEVO | [egreso y fail-forward](../01-game-design/graduation-and-fail-forward.md) |
| `content-authoring-guide.md` | FUSIÓN | [guía de autoría](../01-game-design/content-authoring-guide.md) |
| `narrative-and-storylets.md` | FUSIÓN | [sistema narrativo](../01-game-design/narrative-system.md) |
| `full-content-roadmap.md` | FUSIÓN | [alcance y roadmap](../00-product/scope-and-roadmap.md) |
| `core-loop-and-progression.md` | REFERENCIA | [GDD](../01-game-design/game-design-document.md) |
| `grade7-challenge-catalog.md` | REFERENCIA | [catálogo de desafíos](../01-game-design/challenge-catalog.md) |
| `player-career-model.md` | SUPERADO POR EL REPO | [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md), ya implementado |
| `grid-classification-scoring.md` | SUPERADO POR EL REPO | [catálogo de desafíos](../01-game-design/challenge-catalog.md), ya implementado con F1 |

### 03-pedagogy

| Origen | Acción | Destino |
|---|---|---|
| `math-design-framework.md` | FUSIÓN | [marco matemático](../01-game-design/math-design-framework.md) |
| `teacher-review-framework.md` | FUSIÓN | [gates docentes](../06-delivery/teacher-gates.md) |
| `theory-basis.md` | FUSIÓN | [base teórica](research-basis.md) |

### 04-design

Los tres documentos son **DEFIERE A DISEÑO**. El sistema de diseño implementado y el handoff de Claude Design v0.2 son la autoridad visual; el paquete sólo aportó contexto de producto, y ese contexto se cita sin repetir valores.

| Origen | Dónde manda de verdad |
|---|---|
| `ui-art-foundation.md` | [sistema de diseño](../09-design-system/README.md), [colores](../09-design-system/colors.md), [tipografía](../09-design-system/typography.md), [fundamentos](../09-design-system/foundations.md), [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md) |
| `accessibility-and-interaction.md` | [accesibilidad del sistema de diseño](../09-design-system/accessibility.md), [UX e interacción](../01-game-design/ux-interaction-design.md) |
| `assets-motion-audio.md` | [assets](../09-design-system/assets.md), [fundamentos](../09-design-system/foundations.md) |

### 05-engine

| Origen | Acción | Destino |
|---|---|---|
| `target-engine-architecture.md` | NUEVO | [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md) |
| `variant-generation-engine.md` | FUSIÓN | [familias y variantes](../01-game-design/challenge-families-and-variants.md) y arquitectura objetivo |
| `difficulty-budget-scheduler.md` | FUSIÓN | [dificultad](../01-game-design/difficulty-and-playability.md) y arquitectura objetivo |
| `scoring-replay-and-ranking.md` | FUSIÓN | [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md) |
| `server-authoritative-fair-mode.md` | FUSIÓN | arquitectura objetivo; [ADR-004](../03-architecture/adr/ADR-004-server-authoritative-scoring.md) y [ADR-006](../03-architecture/adr/ADR-006-local-first-gameplay.md) ya lo decidían |
| `score-policy-configuration.md` | FUSIÓN | [score competitivo](../01-game-design/competitive-scoring-and-ranking.md) y [score-policy.example.json](score-policy.example.json) |
| `content-and-rules-versioning.md` | FUSIÓN | arquitectura objetivo, eje por eje |
| `api-contracts.md` | REFERENCIA | [contratos API](../03-architecture/api-contracts.md); su contrato concreto sigue abierto |
| `data-model.md` | REFERENCIA | [modelo de datos](../03-architecture/data-model.md) |
| `run-state-machine.md` | REFERENCIA | [game engine](../03-architecture/game-engine.md) |
| `persistence-and-resume.md` | REFERENCIA | [game engine](../03-architecture/game-engine.md) |
| `career-state-migration.md` | SUPERADO POR EL REPO | migración ya hecha: [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md), `ENGINE_VERSION 2.0.0` |

### 06-quality

| Origen | Acción | Destino |
|---|---|---|
| `variant-validation-invariants.md` | NUEVO | [validación y auditoría de variantes](../04-quality/variant-validation-and-audit.md) |
| `statistical-variant-audit.md` | NUEVO | ídem |
| `scoring-fairness-audit.md` | NUEVO | [auditoría de equidad competitiva](../04-quality/competition-fairness-audit.md) |
| `teacherless-preflight-risk-compensation.md` | FUSIÓN | [ciclo de entrega real](../00-product/real-delivery-lifecycle.md) |
| `testing-and-simulation.md` | FUSIÓN | [estrategia de testing](../04-quality/testing-strategy.md) |
| `manual-qa-matrix.md` | FUSIÓN | [estrategia de testing](../04-quality/testing-strategy.md) |
| `security-threat-model.md` | FUSIÓN | [threat model](../04-quality/threat-model.md) |
| `non-functional-requirements.md` | REFERENCIA | [NFR](../04-quality/non-functional-requirements.md) |

### 07-operations

| Origen | Acción | Destino |
|---|---|---|
| `fair-mode-and-ranking.md` | NUEVO | [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md) |
| `competition-freeze-and-change-control.md` | NUEVO | ídem |
| `load-and-network-test-plan.md` | FUSIÓN | ídem |
| `privacy-and-minors.md` | FUSIÓN | ídem y [seguridad y privacidad](../03-architecture/security-privacy.md) |
| `ranking-moderation-and-prizes.md` | FUSIÓN | [leaderboard y moderación](../05-operations/leaderboard-and-moderation.md) |
| `incident-runbook.md` | FUSIÓN | [fallback e incidentes](../05-operations/fallback-and-incident-plan.md) |
| `telemetry-and-observability.md` | FUSIÓN | [analytics y observabilidad](../03-architecture/analytics-observability.md) |
| `deployment-and-environments.md` | FUSIÓN | [deploy y ambientes](../03-architecture/deployment-and-environments.md) |

### 08-delivery

| Origen | Acción | Destino |
|---|---|---|
| `implementation-sequence.md` | NUEVO | [secuencia de implementación](../06-delivery/implementation-sequence.md) |
| `teacher-gate-1-checklist.md` | NUEVO | [gates docentes](../06-delivery/teacher-gates.md) |
| `teacher-gate-2-checklist.md` | NUEVO | ídem |
| `product-freeze-checklist.md` | FUSIÓN | ídem |
| `demo-presentation-guide.md` | FUSIÓN | ídem |
| `content-matrix-template.md` | FUSIÓN | [secuencia de implementación](../06-delivery/implementation-sequence.md) |
| `agent-handoff.md` | FUSIÓN | secuencia de implementación y `AGENTS.md` |
| `definition-of-done.md` | FUSIÓN | [Definition of Done](../06-delivery/definition-of-done.md) |
| `open-decisions.md` | FUSIÓN | [preguntas abiertas](open-questions.md) |

### 09-reference

| Origen | Acción | Destino |
|---|---|---|
| `formulas-and-algorithms.md` | NUEVO | [fórmulas y algoritmos](formulas-and-algorithms.md) |
| `research-basis.md` | FUSIÓN | [base teórica](research-basis.md) |
| `examples/*` | COPIA | los `*.example.*` de este directorio |

## Conflictos y cómo se resolvieron

Cinco discrepancias reales entre el paquete y el repositorio. Ninguna se resolvió en silencio.

### 1 · Migración del modelo de jugador

- **Paquete:** pide migrar `knowledge/team/initiative/energy` a Promedio · Equipo · Aura · Estilo.
- **Repositorio:** ya migrado en `src/game/progression/career.ts`, `ENGINE_VERSION 2.0.0`.
- **Autoridad:** el código y [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md) son más nuevos.
- **Resolución:** el capítulo de migración queda como historia. La arquitectura objetivo lo marca **implementado** para que nadie replanifique trabajo hecho.

### 2 · Scoring de la grilla de clasificación

- **Paquete:** propone `0,6 × precisión + 0,4 × cobertura`, y sugiere F1 como generalización.
- **Repositorio:** el acto del 25 de Mayo ya usa F1 micro-agregado sobre las tres rondas, con los tres casos de denominador cero decididos y umbrales calibrados.
- **Autoridad:** el repositorio, que es más nuevo y está implementado y testeado.
- **Resolución:** superado. El razonamiento del paquete se conservó en [fórmulas y algoritmos](formulas-and-algorithms.md) porque explica *por qué* F1 y no un promedio ponderado.

### 3 · Playtest con estudiantes antes de la feria

- **Paquete:** declara que probablemente no habrá playtest con estudiantes antes de la release de feria; es una restricción externa.
- **Repositorio:** varios documentos asumían testers y playtest como criterio de salida.
- **Autoridad:** el paquete, que describe el contexto real y es posterior.
- **Resolución:** los documentos prospectivos se corrigieron hacia el ciclo real y la limitación quedó declarada. Los criterios de playtest que sí se pueden ejecutar —prueba proxy con adultos, revisión heurística— se conservaron como tales, sin llamarlos validación con jugadores. Ver [ciclo de entrega real](../00-product/real-delivery-lifecycle.md).

### 4 · La palabra «familia»

- **Paquete:** `ScenarioFamily` es un dominio narrativo: Colectivo, Mural, Stand.
- **Repositorio:** el [sistema de desafíos](../01-game-design/challenge-system.md) llama «familias» a los patrones de interacción: Decision Card, Timeline, Number Grid.
- **Resolución:** ambos términos se conservan y se desambiguan explícitamente. Ninguno se renombró: renombrar habría tocado código y contenido, que están fuera del alcance de esta integración. La correspondencia está en [familias, plantillas y variantes](../01-game-design/challenge-families-and-variants.md) y en el [glosario](glossary.md).

### 5 · Nombres de las calidades de resolución

- **Paquete:** `optimal / resolved / partial / insufficient`.
- **Repositorio:** `optimal / efficient / functional / invalid`, implementado como `SolutionQuality`.
- **Resolución:** manda el repositorio. La correspondencia está en el [glosario](glossary.md), y el score competitivo la usa explícitamente para que la calibración candidata `1,00 / 0,75 / 0,40 / 0,10` se lea contra las etiquetas correctas.

### Y una que **no** se resolvió

El paquete resume decisiones visuales —paleta, tipografías, geometría, isla de Aura— que ya están implementadas por el sistema de diseño. Cualquier diferencia entre ese resumen y lo implementado **se resuelve a favor de Claude Design v0.2 y del sistema implementado**, y no se reconcilia editando lo visual. Los documentos de producto enlazan al sistema de diseño; no repiten valores de token.

## Trazabilidad

De requisito de producto a estado de implementación. La columna de estado es una lectura del 28 de agosto de 2026 y se verifica contra el código antes de planificar.

| Requisito de producto | Regla de game design | Capacidad de motor | Estado actual | Fase futura |
|---|---|---|---|---|
| Escenarios que no se memorizan | [familias, plantillas y variantes](../01-game-design/challenge-families-and-variants.md) | `ScenarioFamily`/`Template`/`Variant`, generador por restricción | variantes autoradas por desafío, seeded y verificadas | paso 2 de la [secuencia](../06-delivery/implementation-sequence.md) |
| Competencia sin variantes defectuosas | [validación y auditoría de variantes](../04-quality/variant-validation-and-audit.md) | validador transversal + catálogo desplegado | invariantes por desafío; sin catálogo | pasos 2 y 9 |
| Identidad de carrera legible | [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md) | `CareerState` v0.2 | **implementado** | — |
| Runs comparables entre sí | [dificultad](../01-game-design/difficulty-and-playability.md) | bandas + scheduler por presupuesto | `DifficultyLevel` 1–5, sin presupuesto | paso 2 |
| Ranking dominado por matemática | [score competitivo](../01-game-design/competitive-scoring-and-ranking.md) | `ScorePolicy` + `ScoringEngine` competitivo | score por evento de desarrollo | paso 3, tras Teacher Gate 1 |
| Premiar mejora y no volumen | [modo feria](../05-operations/fair-mode-and-competition-freeze.md) | comparador versionado + personal best | no implementado | paso 8 |
| El navegador no decide el premio | [ADR-004](../03-architecture/adr/ADR-004-server-authoritative-scoring.md) | verificación por replay en servidor | base en `src/server/game/validate-run.ts` | paso 8 |
| Reproducibilidad y auditoría de una run | [ADR-003](../03-architecture/adr/ADR-003-deterministic-seeded-engine.md) | seed + tripleta de versiones + action log | **implementado** | `scoreVersion` y `variantCatalogVersion` en paso 8 |
| El error no expulsa al jugador | [egreso y fail-forward](../01-game-design/graduation-and-fail-forward.md) | invariante de egreso + recuperación comprimida | sin contenido de recuperación | pasos 6 y 7 |
| Datos mínimos de menores | [ADR-008](../03-architecture/adr/ADR-008-anonymous-identity.md) | identidad pseudónima | **implementado** en la base | retención abierta, paso 9 |

## Qué NO hizo esta integración

- No implementó ninguna capacidad marcada TARGET.
- No cerró ninguna pregunta abierta ni ninguna decisión de Teacher Gate.
- No promovió una recomendación a regla: la ponderación 80/15/5, la política de intentos y la calibración de calidades siguen siendo candidatas.
- No tocó el sistema de diseño, sus tokens, su CSS, sus componentes ni sus capturas.
- No modificó código, contenido ejecutable, esquemas de estado, persistencia, snapshots, replay ni configuración de runtime.
- No agregó ni actualizó dependencias.
