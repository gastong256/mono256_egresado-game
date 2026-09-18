# Matriz de trazabilidad

| Objetivo | Feature | Requisitos | Historias | ADR relacionado |
|---|---|---|---|---|
| Entrada rápida | identidad anónima | FR-001 | US-001 | ADR-008 |
| Run reproducible | seed/versiones | FR-002, FR-003, FR-017, FR-018 | US-022, US-051 | ADR-003 |
| Matemática como gameplay | challenges parametrizados | FR-005, FR-006, FR-007 | US-002, US-003 | ADR-007 |
| Resiliencia | local-first/checkpoints | FR-009, FR-010, FR-016 | US-030, US-031 | ADR-006 |
| Ranking justo | score servidor | FR-011, FR-012, FR-018 | US-020, US-022 | ADR-004, ADR-009 |
| Escalar contenido | content-as-data | FR-003, FR-005 | US-050 | ADR-007 |
| Web universal | responsive/PWA-ready | NFR | US-001 | ADR-001 |
| Operación de feria | eventos + pantalla | FR-014, FR-020 | US-040 | ADR-009 |
| Privacidad | minimización | FR-001 | US-001 | ADR-008 |
| Moderación | ocultar entradas | FR-015 | US-041 | ADR-009 |

## Regla de mantenimiento

Toda feature nueva debe:
1. referenciar un objetivo o justificar uno nuevo;
2. agregar/modificar requisito funcional;
3. tener historia o tarea técnica;
4. crear ADR si cambia una decisión arquitectónica significativa;
5. actualizar tests/NFR si aplica.

## Dirección del blueprint v0.2 hasta el código

De requisito de producto a capacidad de motor y a estado real. Esta tabla cubre lo que **todavía no** está cubierto por los FR de arriba, y su columna de estado es una lectura del 29 de agosto de 2026: se verifica contra el código antes de planificar. El mapa completo está en [la integración del blueprint](../07-reference/blueprint-v0.2-integration.md).

| Requisito de producto | Regla de game design | Capacidad de motor | Estado | Fase |
|---|---|---|---|---|
| Escenarios que no se memorizan | [familias y variantes](../01-game-design/challenge-families-and-variants.md) | `ScenarioFamily`/`Template`/`Variant` + fuentes híbridas | primera variación cognitiva de producción **implementada** en `bus`; profundidad del resto del catálogo abierta | STAGE-04 / STAGE-08 |
| Competencia sin variantes defectuosas | [validación de variantes](../04-quality/variant-validation-and-audit.md) | validador transversal + catálogo aprobado | **implementado para desarrollo y consumido por gameplay** en `grade-7-dev-4`; catálogo justo oficial pendiente | FREEZE |
| Runs comparables entre sí | [dificultad](../01-game-design/difficulty-and-playability.md) | bandas + scheduler por presupuesto | mecanismo implementado; bandas aceptadas en TG1, equivalencia empírica pendiente | STAGE-05 (`DONE`) / STAGE-08 |
| Ranking dominado por matemática | [score competitivo](../01-game-design/competitive-scoring-and-ranking.md) | `ScorePolicy` competitiva versionada | `fair-score-dev-2` 85/10/5 implementada y auditada; ranking pendiente | STAGE-06 (`DONE`) / STAGE-09 |
| Premiar mejora y no volumen de intentos | [modo feria](../05-operations/fair-mode-and-competition-freeze.md) | emisión autoritativa + mejor resultado verificado | dirección TG1 aceptada; persistencia no implementada | STAGE-09 |
| El error no expulsa al jugador | [fail-forward](../01-game-design/graduation-and-fail-forward.md) | invariante de egreso + recuperación | **implementado**: 20.000 carreras de seis años, 20.000 egresadas; label REPASO cerrado en Product Pass, aplicación UI pendiente | STAGE-07 (`DONE`) |
| Identidad de carrera legible | [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md) | `CareerState` v0.2 | **implementado** | — |
| Auditoría de una run oficial | [ADR-003](../03-architecture/adr/ADR-003-deterministic-seeded-engine.md) | seed + versiones + action log | `variantCatalogVersion` y `scoreVersion` implementadas; falta emisión oficial | STAGE-06 y STAGE-09 |

Las etapas son las del [roadmap de implementación](../06-delivery/implementation-sequence.md); el estado vigente de cada una está en [la etapa actual](../06-delivery/current-stage.md).

## Cierre de STAGE-08 / Phase 0 — Product Pass

Diseño reconciliado el 10 de septiembre de 2026. [Integración y FC-001…030](../07-reference/full-career-product-audit-integration.md)
y [audit técnico](../04-quality/full-career-technical-conformance.md) sostienen el
cierre; ninguna fila declara producción de 1.º–5.º.

| Requisitos / objetivo | Fuente única | Implementación / evidencia siguiente |
|---|---|---|
| FR-003: nueve beats, cuotas, clusters y Project | [matriz](../01-game-design/full-career-content-matrix.md#políticas-de-composición) | mecanismo global implementado en Phase 1 (ADR-025); carrera oficial pendiente de 2.º–5.º |
| FR-005/006: cinco motores y matemática intrínseca | [desafíos](../01-game-design/challenge-system.md), [autoría](../01-game-design/content-authoring-guide.md) | modos constructivos y contenido de 1.º implementados; `tests/unit/grade-1-*.test.ts` |
| FR-006/012: evidencia separada, Style no competitivo, Prestige | [score](../01-game-design/competitive-scoring-and-ranking.md), [Prestige](../01-game-design/rare-events-and-prestige.md) | FairScore actual preservado; Prestige futuro ADR-025 |
| FR-T06/007: Repaso uno + debrief + cierre | [fail-forward](../01-game-design/graduation-and-fail-forward.md) | base ADR-024; debrief implementado y stress gate post-G1 `PASSED` (2026-09-14) |
| FR-003/011: callbacks, saliencia y epílogo | [narrativa](../01-game-design/narrative-system.md) | selector/evidencia futuros ADR-025 |
| FR-002/013/014/018: seed común, reintentos, replay | [modo feria](../05-operations/fair-mode-and-competition-freeze.md) | servidor/edición STAGE-09 |
| FR-012/020: puesto compartido y Top 3 pseudónimo | [ranking](../05-operations/leaderboard-and-moderation.md) | comparador/persistencia STAGE-09 |
| FR-005, NFR-06: teclado/tap, no-drag, reduced motion, sin tiempo | [UX](../01-game-design/ux-interaction-design.md) | tests por motor y walkthroughs, no certificación actual |

Orden y tareas técnicas: [Phase 1 en roadmap](../06-delivery/implementation-sequence.md#phase-1-implementar-1º-real).
La implementación de G1 empieza después de este cierre documental; el gate post-G1
sigue bloqueando producción amplia de 2.º–5.º hasta PASS.

## STAGE-08 / Gobernanza matemática provisional

Trazabilidad de la cadena `hallazgo → opiniones independientes → decisión del Chair
→ contrato de remediación → implementación → re-auditoría → sign-off provisional →
revisión humana final`. Adjudicado el 16 de septiembre de 2026; implementado el 17
con veredicto `BLOCKED` (D-S08-104) y, ese mismo día, con los dos conflictos de
contrato adjudicados: la pregunta 67 cerrada por enmienda (D-S08-113) y la 66
cerrada el 18 con el techo probado de `y5.stage-screen` (D-S08-116). Los catorce
contratos quedan en PASS. La re-auditoría todavía no existe.

| Hallazgos | Decisión canónica | Contrato | Implementación | Verificación |
|---|---|---|---|---|
| MAT-001 | `REQUIRED_CORRECTION` P0 | [RS-MAT-001](../04-quality/mathematics-remediation-spec.md) | DONE · colectivo por papel | `unit/grade-3-transport-pass`, auditoría de estrategia ciega |
| MAT-002 · MAT-003 · MAT-004 · MAT-AJ-NEW-006 | `REQUIRED_CORRECTION` P0 / P0 / P1 / P2 | RS-MAT-002, RS-MAT-003, RS-MAT-004, RS-NEW-006 | DONE · encuesta, Repaso y ficha de 2.º | `unit/grade-2-survey`, auditoría |
| MAT-005 · MAT-AJ-NEW-004 · MAT-AJ-NEW-005 | `REQUIRED_CORRECTION` P1 / P1 / P2 | RS-MAT-005 | DONE · gate de modelo del torneo, empate estricto | `unit/grade-2-standings`, auditoría |
| MAT-006 | `REQUIRED_CORRECTION` P2 | RS-MAT-006 | DONE · `grade-7-dev-6` | `integration/mathematics-remediation`, auditoría |
| MAT-007 | `REQUIRED_CORRECTION` P2 | RS-MAT-007 | DONE | `integration/mathematics-remediation`, auditoría |
| MAT-008 | `REQUIRED_CORRECTION` P0 | RS-MAT-008 (techo enmendado a `K ≤ 78`, D-S08-116) | **DONE** · dos elementos protegidos, seis formas, geometría exacta y catálogo `grade-5-dev-4` | `unit/grade-5-screen-yearbook-next`, `integration/mathematics-remediation` · RS-MAT-008, auditoría de estrategia ciega, E2E a 320 px |
| MAT-009 · MAT-AJ-NEW-007 | `REQUIRED_CORRECTION` P1 | RS-MAT-009 | DONE | `integration/mathematics-remediation`, auditoría |
| MAT-010 | `ACCEPT_AS_DESIGNED` | — | Sin cambio | Revisión humana final |
| MAT-011 | `REQUIRED_CLARIFICATION` P2 | RS-MAT-011 | DONE · consigna de la peña | `integration/mathematics-remediation`, E2E 320 px |
| MAT-012 · MAT-013 | `ACCEPT_WITH_DOCUMENTED_RISK` | — | Sin cambio | Banderas para la revisión humana final |
| MAT-AJ-NEW-001 | `REQUIRED_CORRECTION` P0 | RS-NEW-001 (criterio 3 enmendado, D-S08-113) | **DONE** | `integration/mathematics-remediation` · «criterio 3 enmendado», auditoría |
| MAT-AJ-NEW-002 | `REQUIRED_CORRECTION` P0 | RS-NEW-002 | DONE | `integration/mathematics-remediation` |
| MAT-AJ-NEW-003 | `REQUIRED_CORRECTION` P1 | RS-NEW-003 | DONE · seis Repasos | `integration/mathematics-remediation` |
| Regla 2.9 | Inventario de feedback afirmativo | — | DONE · seis textos falsos más corregidos (D-S08-110) | [inventario](../04-quality/mathematics-remediation-feedback-inventory.md) |

Fuentes: [adjudicación](../04-quality/mathematics-department-ai-adjudication.md),
[revisor A](../04-quality/mathematics-department-ai-reviewer-a.md),
[revisor B](../04-quality/mathematics-department-ai-reviewer-b.md),
[revisor C](../04-quality/mathematics-department-ai-reviewer-c.md),
[implementación](../04-quality/mathematics-remediation-implementation.md),
[adjudicación de conflictos de contrato](../04-quality/mathematics-remediation-contract-conflict-adjudication.md),
[adjudicación final del techo](../04-quality/rs-mat-008-blind-ceiling-final-adjudication.md) y
[decisiones D-S08-095 a D-S08-116](../07-reference/decision-register.md).
