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

De requisito de producto a capacidad de motor y a estado real. Esta tabla cubre lo que **todavía no** está cubierto por los FR de arriba, y su columna de estado es una lectura del 28 de agosto de 2026: se verifica contra el código antes de planificar. El mapa completo está en [la integración del blueprint](../07-reference/blueprint-v0.2-integration.md).

| Requisito de producto | Regla de game design | Capacidad de motor | Estado | Fase |
|---|---|---|---|---|
| Escenarios que no se memorizan | [familias y variantes](../01-game-design/challenge-families-and-variants.md) | `ScenarioFamily`/`Template`/`Variant` | variantes autoradas y seeded por desafío | STAGE-02 |
| Competencia sin variantes defectuosas | [validación de variantes](../04-quality/variant-validation-and-audit.md) | validador transversal + catálogo desplegado | invariantes por desafío, sin catálogo | STAGE-03 |
| Runs comparables entre sí | [dificultad](../01-game-design/difficulty-and-playability.md) | bandas + scheduler por presupuesto | `DifficultyLevel` 1–5 | STAGE-05 |
| Ranking dominado por matemática | [score competitivo](../01-game-design/competitive-scoring-and-ranking.md) | `ScorePolicy` competitiva versionada | score por evento de desarrollo | STAGE-06 |
| Premiar mejora y no volumen de intentos | [modo feria](../05-operations/fair-mode-and-competition-freeze.md) | comparador versionado + personal best | no implementado | STAGE-09 |
| El error no expulsa al jugador | [fail-forward](../01-game-design/graduation-and-fail-forward.md) | invariante de egreso + recuperación | sin contenido de recuperación | STAGE-07 |
| Identidad de carrera legible | [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md) | `CareerState` v0.2 | **implementado** | — |
| Auditoría de una run oficial | [ADR-003](../03-architecture/adr/ADR-003-deterministic-seeded-engine.md) | seed + versiones + action log | **implementado**; faltan `scoreVersion` y `variantCatalogVersion` | STAGE-03 y STAGE-06 |

Las etapas son las del [roadmap de implementación](../06-delivery/implementation-sequence.md); el estado vigente de cada una está en [la etapa actual](../06-delivery/current-stage.md).
