# Integración del Full-Career Product Audit — STAGE-08 Phase 0

## Procedencia, alcance y dictamen

Paquete recibido: `egresado_full_career_product_audit_2026-09-09`.
Audit de producto: `PASS_WITH_REQUIRED_DESIGN_CORRECTIONS`; estado original
`PRODUCT-PREDESIGN-CLOSED-PENDING-TECHNICAL-CONFORMANCE`.
Reconciliación canónica: **10 de septiembre de 2026**, sobre `147df60`.

La [conformidad técnica del 9 de septiembre](../04-quality/full-career-technical-conformance.md)
devolvió `PASS WITH MINOR CONTRACT DELTAS`: equivale a PASS con deltas menores
entendidos, no a ausencia de trabajo futuro. No quedó BLOCKER sin resolver.
[ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md) registra
composición global, respuestas, debrief, hechos/Prestige, RNG y emisión oficial
como evolución futura, sin implementar ni cambiar contratos ejecutables.

**Resultado:** correcciones aceptadas integradas, **Phase 0 DONE**.
[Phase 1 — implementar 1.º](../06-delivery/implementation-sequence.md#phase-1-implementar-1º-real)
está READY, no iniciada; STAGE-08 sigue IN_PROGRESS. El gate post-G1 sigue requerido
y no ejecutado. Este registro conserva procedencia y destinos; las reglas viven
en cada documento especializado y su madurez en el registro único de decisiones.

## Método y límites de la evidencia

Se contrastaron 7.º existente y los 25 diseños de 1.º–5.º: cobertura/piso matemático,
profundidad y aprendizaje; solapamiento semántico e interacciones; independencia
Math/Team/Aura/Estilo; composición, clusters/arco y pacing; recuperación;
replayabilidad/variantes; callbacks/saliencia, rareza, Prestige y epílogo;
accesibilidad/móvil, equidad competitiva, exposición pública y autoría/versionado.

Es un audit de diseño más una inspección técnica de baseline, no un playtest ni
una implementación. Los 25 Templates se conservan como
`DESIGN-CANDIDATE-APPROVED`; no se inventan variantes desplegadas, resultados de
pacing ni validaciones pedagógicas. La bibliografía del paquete se absorbió con
[atribución y limitaciones](research-basis.md#15-referencias-aportadas-por-el-full-career-product-audit);
R6/R17 no se presentan como verificación normativa o científica nueva.

## Supersesiones explícitas

| Candidato anterior | Decisión que lo reemplaza | Autoridad actual |
|---|---|---|
| Track STYLE competitivo; cuatro tracks de 25 | Estilo sólo Career/Narrative; Prestige 40 Career Arc / 40 Special / 20 Rare | [Prestige](../01-game-design/rare-events-and-prestige.md) |
| Tiempo como eventual desempate | FairScore → Prestige → shared rank, sin criterio temporal ni clave oculta | [score/ranking](../01-game-design/competitive-scoring-and-ranking.md) |
| Máximo 2 del Proyecto candidato | Máximo 2 puntuables `LOCKED` v1; target/no consecutividad conservan su madurez | [composición](../01-game-design/full-career-content-matrix.md) |
| 6–12 como cantidad final aún abierta | Normal/Fair v1 exactamente 9 ordinarios; 6–12 sigue capacidad genérica, Demo separado | [matriz](../01-game-design/full-career-content-matrix.md) |
| Etiquetas de interacción como primitivas nuevas | Cinco motores reutilizables; etiquetas específicas son modos | [interacciones](../01-game-design/challenge-system.md) |
| Copy/trigger de recovery abiertos; semántica múltiple pendiente | Repaso, INVALID; uno interactivo determinista, debrief del resto, cierre conjunto | [fail-forward](../01-game-design/graduation-and-fail-forward.md) |
| Aproximadamente 3–5 recuerdos, algoritmo diferido | Narrative Salience v1 determinista: 3–5 y cobertura temporal | [narrativa](../01-game-design/narrative-system.md) |
| Seed común opcional / pool individual de Fair | Una Competition Seed compartida emitida por servidor por edición | [modo feria](../05-operations/fair-mode-and-competition-freeze.md) |

No se reescribe la evidencia histórica de TG1 ni paquetes congelados de
`docs/sources/`. Las referencias históricas se leen con esta supersesión; no son
alternativas actuales. Los factores de FairScore, probabilidades raras y targets
editoriales mantienen su madurez versionada; cerrar producto no los oficializa.

## Trazabilidad de todos los hallazgos

IDs FC pertenecen al paquete; D remite al
[registro único](decision-register.md). “Resuelto” significa resuelto en producto,
no implementado. FC-016 conserva validación post-G1 pendiente; FC-022 es mitigado,
no eliminado; FC-019/024 son calibración/targets, no constantes de motor.

| Hallazgo | Contenido absorbido | Decisión canónica | Fuente mantenible |
|---|---|---|---|
| FC-001 | Cinco motores; modos no multiplican frameworks | D-S08-028 | [interacciones](../01-game-design/challenge-system.md) |
| FC-002–004 | Cuotas temporal/económica/datos sin reemplazar Templates | D-S08-005 | [composición](../01-game-design/full-career-content-matrix.md) |
| FC-005 | Intrinsic Math Gate | D-S08-034 | [autoría](../01-game-design/content-authoring-guide.md) |
| FC-006 | STYLE competitivo superseded; Prestige independiente | D-012 / D-S08-008 | [Prestige](../01-game-design/rare-events-and-prestige.md) |
| FC-007 | Shared rank, sin tiempo | D-013 | [score/ranking](../01-game-design/competitive-scoring-and-ranking.md) |
| FC-008 | Competition Seed compartida; Practice separado | D-S08-031 | [modo feria](../05-operations/fair-mode-and-competition-freeze.md) |
| FC-009–011 | Nueve beats, bandas y pacing; duración por validar | D-S08-005 | [matriz](../01-game-design/full-career-content-matrix.md) |
| FC-012–013 | Máximo Project 2 locked y máximo uno por cluster | D-S08-018 / D-S08-019 | [composición](../01-game-design/full-career-content-matrix.md) |
| FC-014 | Estilo sólo con evidencia estratégica significativa | D-S08-036 | [autoría](../01-game-design/content-authoring-guide.md) |
| FC-015–016 | Repaso INVALID; selección/debrief/cierre | D-S08-029 / D-S08-030 | [recovery](../01-game-design/graduation-and-fail-forward.md) y [gate post-G1](../04-quality/post-grade-1-scalability-audit.md) |
| FC-017 | Saliencia determinista y epílogo autorado | D-S08-009 / D-S08-023 | [narrativa](../01-game-design/narrative-system.md) |
| FC-018–020 | Rareza fija en Fair, defaults y evidencia no duplicada | D-S08-007 / D-S08-008 / D-S08-032 | [raros/Prestige](../01-game-design/rare-events-and-prestige.md) |
| FC-021 | Top 3 público y puesto propio privado | D-S08-033 | [leaderboard](../05-operations/leaderboard-and-moderation.md) |
| FC-022 | Riesgo residual sin playtest; mitigaciones sin falsa validación | D-S08-041 | [validación](../04-quality/content-validation.md) y [base teórica](research-basis.md) |
| FC-023–024 | Formas semánticas distintas de cantidad numérica; targets | D-S08-035 | [autoría](../01-game-design/content-authoring-guide.md) |
| FC-025 | Sin LLM runtime competitivo ni epílogo canónico | D-S08-038 | [autoría](../01-game-design/content-authoring-guide.md) |
| FC-026 | Montos ficticios/relativos, sin juicios de poder adquisitivo | D-S08-042 | [marco matemático](../01-game-design/math-design-framework.md) y [autoría](../01-game-design/content-authoring-guide.md) |
| FC-027–028 | Conservar 25 diseños; Teacher Demo separado | D-S08-040 | [matriz](../01-game-design/full-career-content-matrix.md) y [roadmap](../06-delivery/implementation-sequence.md) |
| FC-029 | Tiempo exclusivamente diagnóstico | D-013 | [score/ranking](../01-game-design/competitive-scoring-and-ranking.md) |
| FC-030 | Conformidad → integración → G1 | D-S08-026 / D-S08-039 | [etapa actual](../06-delivery/current-stage.md) y ADR-025 |

Las preguntas resueltas se marcaron como tales en [open-questions](open-questions.md);
las calibraciones, autoría específica, validación institucional y trabajo futuro
conservan dueño/gate. No hay una segunda planilla de decisiones editable.

## Inventario de insumos y destinos

Los 17 SHA-256 declarados por `manifest.json` se cotejaron con los bytes recibidos:
**17/17 coinciden**. El manifest es el archivo número 18. Los nombres de esta
tabla son procedencia textual, no links operativos ni dependencias del build.

| Insumo | SHA-256 recibido/verificado | Absorción / tratamiento |
|---|---|---|
| `00_EXECUTIVE_VERDICT.md` | `a53e1069940f79fac23d64b154c10efc5e1d58905cb62cc3d326f8d8d8739a95` | Dictamen y condiciones de cierre: este registro, current-stage y roadmap. |
| `01_RESEARCH_BASIS_AND_METHOD.md` | `6adfe564782e645ed6e1d02e3374ba0cccd557703d15e7c3874f89ba296f2606` | Método/límites: este registro; bibliografía: research-basis. |
| `02_MATH_COVERAGE_AND_PEDAGOGY_AUDIT.md` | `68647ef2ad7f7f8bc31c085ca2c8bc15deb0b52ff48ad670bb0f1cd084ff2337` | Marco matemático, matriz, fichas G1–G5, Intrinsic Math Gate y high-risk gates en autoría/validación. |
| `03_SEMANTIC_OVERLAP_AND_INTERACTION_AUDIT.md` | `f1f6c02eb567b1c9723b0593f0a3242b1ed248c8610aa6e92290b64e2ef6bea8` | Cinco motores en challenge-system; linajes semánticos y cuotas en matriz/fichas. |
| `04_SCORING_STYLE_RECOVERY_AUDIT.md` | `7f8814f8932246fe2f01905382dc12aef597dc5e095f533253a17e7c3540969d` | Score/ranking, Prestige, reglas, Repaso, autoría y post-G1. |
| `05_COMPOSITION_PACING_REPLAYABILITY_AUDIT.md` | `e1fd351bd6144583b5f4fec5d4d3d6aa8dff91d1f0e3ca5e0bee6807d12a1470` | Matriz/composición, pacing en UX y separación Fair/Practice en operaciones. |
| `06_NARRATIVE_RARE_PRESTIGE_EPILOGUE_AUDIT.md` | `4c5dbc18a40adeefcf20d53c2d9d577a1d92919395a2798adb7ce750c587e4c7` | Narrativa/epílogo y rare-events-and-prestige. |
| `07_ACCESSIBILITY_FAIRNESS_LEADERBOARD_AND_MINORS.md` | `dbf24f5efd65049add8550cd794575651aa87f68823bde2b9f75134f3787f509` | UX/NFR, leaderboard/moderación, fair mode y validación. |
| `08_FINDINGS_DECISIONS_AND_CORRECTIONS.md` | `dc925906fc4134b87fda7ebf571bf6442ee207ba459de914a0f78ec0982724e8` | FC-001–030 en tabla de trazabilidad; decision-register y open-questions. |
| `09_PHASE0_PRODUCT_CLOSURE_SPEC.md` | `37ac87c6479ef5bb1ea4eccfa9fe1bf97fddb447618d710e1cfb36beaa816e63` | Fuentes especializadas; current-stage/roadmap. No se convierte en segunda spec. |
| `10_IMPLEMENTATION_READINESS_AND_AUTHORING_GATES.md` | `2fae1d43f1a122e443130007080602c566c01fc3658db199b4c33bc87570b7ae` | DoR/variantes/gates en autoría y content-validation; Phase 1 en roadmap. |
| `MASTER_FULL_CAREER_CROSS_CONTENT_AUDIT.md` | `126d9a2a700158f14f3b5b58196501550fc56d6c740d3ccc74413cd61e6d73f5` | Compilación de capítulos, sin fuente de verdad adicional. |
| `PROMPT_RECONCILE_PRODUCT_AUDIT_INTO_REPO.md` | `7d331405ea9db72f8130c847885191585e7ea8228e33f9b5b97a4d3d72649c47` | Protocolo de esta integración: docs-only, un commit, no push, limpieza. |
| `PROMPT_REPOSITORY_FEASIBILITY_AUDIT.md` | `779ffd6ff924afecc20add7fe0bbeafc5b5a3aa5fdbd5893f8b1a35fba7f5ef5` | Auditoría técnica canónica y ADR-025; no orden pendiente sobre el insumo. |
| `SOURCES_AND_REFERENCES.md` | `5bbab6852fe29d57b7724f52d8ae4c88614f767a7272e5f9e4a1604d16e34563` | research-basis: deduplicación R1/R3/R4/R8/R9 y procedencia/límites de R2/R5–R7/R10–R17. |
| `decisions.json` | `c3101c367f02a438f7faf35d1bef4baeabb4a866f93f266041dc87ad135c4f77` | Parámetros de producto absorbidos por fuentes especializadas; no se agrega config runtime. |
| `findings.csv` | `5b00df57588bfa8ad34d8765acbc643ea2ad933a0e63433173f2218056ab0bb5` | Hallazgos FC-001–030 absorbidos por trazabilidad y fuentes especializadas. |
| `manifest.json` | Manifest de los 17 hashes anteriores | Identidad, fecha, dictamen e inventario conservados aquí. |

Se verificó que el master del paquete compila los capítulos sin decisiones
adicionales. Prompts son instrucciones de trabajo, no fuentes de producto.
`decisions.json` y `findings.csv` se cotejaron con políticas y FC-001–030, sin
convertirlos en schemas/configuración ni duplicarlos en otra carpeta.

## Verificación y limpieza

La revisión coteja cada insumo con su destino, los ocho reemplazos con sus fuentes,
y el reporte técnico con ADR-025/roadmap. Índices, links, manifest y master generado
se validan con los checks documentales del repositorio. El diff queda limitado a
documentación; runtime, tests, schemas, catálogos, configuración y versiones se
preservan. Los resultados de pruebas técnicas del 9 de septiembre permanecen
atribuidos al reporte original, no se presentan como reejecutados hoy.

Checks ejecutados el 10 de septiembre:

| Check | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS: Node 24.19.0 / pnpm 11.22.0 alineados. |
| `node scripts/validate-agent-workspace.mjs` | PASS: 226 archivos documentados, índices, links/anchors y JSON válidos. |
| `node scripts/sync-master-spec.mjs --check` | PASS: master sincronizado desde 106 fuentes mediante `--write`. |
| `pnpm format:check` | PASS; respeta la exclusión preexistente de `docs/` en Prettier. |
| `git diff --check` y revisión del diff | PASS: sin whitespace errors; sólo Markdown y manifest de docs. |
| Cotejo de alcance e insumos | 324 archivos trackeados fuera de docs idénticos byte a byte; 17/17 hashes, 30/30 FC y referencias a decisiones válidas. |

No se ejecutaron install, tests funcionales, coverage, build, Playwright ni
`pnpm verify` completo en esta tarea docs-only. No se afirma un nuevo gate runtime.

Después de verificar integración y ausencia de referencias operativas, se retira
la carpeta transitoria de 18 archivos, incluidos sus dos prompts, a la papelera
recuperable del sistema. No había ZIP
ni prompt separado en la raíz. No se elimina documentación canónica, paquetes
congelados, adjuntos externos al repositorio ni archivos preexistentes.

Un único commit documental registra la reconciliación; el hash se consulta en
Git para evitar autorreferencia. Worktree limpio al cierre y **sin push**.
