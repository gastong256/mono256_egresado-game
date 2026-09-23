# Matriz de trazabilidad

| Objetivo | Feature | Requisitos | Historias | ADR relacionado |
|---|---|---|---|---|
| Entrada rápida | identidad de participante | FR-001 | US-001 | ADR-008, ADR-026 |
| Run reproducible | seed/versiones | FR-002, FR-003, FR-017, FR-018 | US-022, US-051 | ADR-003 |
| Matemática como gameplay | challenges parametrizados | FR-005, FR-006, FR-007 | US-002, US-003 | ADR-007 |
| Resiliencia | local-first/checkpoints | FR-009, FR-010, FR-016 | US-030, US-031 | ADR-006 |
| Ranking justo | score servidor | FR-011, FR-012, FR-018 | US-020, US-022 | ADR-004, ADR-009 |
| Escalar contenido | content-as-data | FR-003, FR-005 | US-050 | ADR-007 |
| Web universal | responsive/PWA-ready | NFR | US-001 | ADR-001 |
| Operación de feria | eventos + pantalla | FR-014, FR-020 | US-040 | ADR-009 |
| Privacidad | minimización | FR-001 | US-001 | ADR-008, ADR-026 |
| Moderación | ocultar entradas | FR-015 | US-041 | ADR-009 |

## STAGE-09 — competencia

Dónde vive cada capacidad de la competencia implementada.

| Capacidad | Implementación | Evidencia |
|---|---|---|
| Producto público en una sola dirección | `src/app/page.tsx`, `src/components/competition/competition-experience.tsx` | `tests/e2e/competition.spec.ts` · «superficies retiradas» |
| Identidad de participante con HMAC por competencia | `src/server/competition/identity.ts`, `src/lib/competition/identity-rules.ts` | `tests/unit/competition-identity.test.ts` |
| Frontera pública/privada verificada por tipos | `src/server/competition/dto.ts` (`PublicSafe`, `IdentitySafe`) | `tests/unit/competition-privacy.test.ts` |
| Aviso de privacidad desde configuración | `src/server/competition/privacy-notice.ts`, `config.ts` | `tests/unit/competition-config.test.ts` |
| Emisión autoritativa con seed compartida | `src/server/competition/attempts.ts`, `editions.ts` | `tests/integration/competition-lifecycle.test.ts` |
| Verificación por replay | `src/server/game/validate-run.ts`, compuesto por `attempts.ts` | `tests/integration/competition-attack.test.ts` |
| Idempotencia y un intento activo | índices de `supabase/migrations/20260921000000_competition_fair_mode.sql` | `tests/integration/competition-store.test.ts` |
| Ranking por mejor intento y puesto compartido | vista `competition_best_attempts`, `src/lib/competition/ranking.ts` | `tests/unit/competition-ranking.test.ts` |
| Herramienta del organizador con auditoría | `src/server/competition/organizer.ts`, `src/app/organizer/` | `tests/integration/competition-organizer.test.ts` |
| Retención y purga | `src/server/competition/retention.ts`, `scripts/competition/purge.ts` | `tests/integration/competition-organizer.test.ts` |
| Límite de tasa persistente | `src/server/competition/rate-limit.ts` + `competition_bump_rate_limit` | `tests/integration/competition-store.test.ts` |

## Release Candidate v1 — ADR-027

| Capacidad | Implementación | Evidencia |
|---|---|---|
| Contratos congelados y huella | `src/release/`, `scripts/release/verify.ts` | `tests/unit/release-manifest.test.ts`, `pnpm release:verify` |
| FairScore oficial sin recalibración | `src/game/scoring/competitive-policy.ts` | `tests/unit/fair-score-officialisation.test.ts` |
| Apertura contra release exacto | `src/server/competition/freeze.ts` | `tests/integration/competition-freeze.test.ts` |
| Configuración, headers y logs | `src/config/production.ts`, `src/proxy.ts`, `src/server/competition/logging.ts` | tests `production-config`, `security-headers`, `observability-redaction` |
| Respaldo/restauración y operación | `scripts/operations/` | [reporte RC](../06-delivery/production-v1-release-candidate.md), [runbook](../05-operations/fair-operations-runbook.md) |

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
contratos de la **ronda 1** quedan en PASS.

La **re-auditoría independiente** se ejecutó el 18 de septiembre y dio
`FAILED — REMEDIATION REQUIRED` (D-S08-117): **13 de 14** contratos verificados de forma
independiente —`RS-NEW-003` en FAIL por `g7.bus-travel-review`, erratum D-S08-122— y el
techo `K = 78` de `y5.stage-screen` re-probado. Añadió diez hallazgos `MAT-RA`, tres
bloqueantes. La [adjudicación posterior](../04-quality/post-reaudit-mathematics-findings-adjudication.md)
los cerró el mismo día (D-S08-122 a D-S08-126) y emitió el
[contrato de la ronda 2](../04-quality/post-reaudit-mathematics-remediation-spec.md).

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
| MAT-011 | `REQUIRED_CLARIFICATION` P2 | RS-MAT-011 | DONE · consigna de la peña. **PASS en su alcance textual**; su línea «ninguna medición de estrategia ciega» quedó falsada por medición (erratum D-S08-124) → RS-RA-003 | `integration/mathematics-remediation`, E2E 320 px |
| MAT-012 · MAT-013 | `ACCEPT_WITH_DOCUMENTED_RISK` | — | Sin cambio | Banderas para la revisión humana final |
| MAT-AJ-NEW-001 | `REQUIRED_CORRECTION` P0 | RS-NEW-001 (criterio 3 enmendado, D-S08-113) | **DONE** | `integration/mathematics-remediation` · «criterio 3 enmendado», auditoría |
| MAT-AJ-NEW-002 | `REQUIRED_CORRECTION` P0 | RS-NEW-002 | DONE | `integration/mathematics-remediation` |
| MAT-AJ-NEW-003 | `REQUIRED_CORRECTION` P1 | RS-NEW-003 | **FAIL en la re-auditoría** · los cinco Repasos del alcance explícito pasan, pero el alcance transversal alcanza a `g7.bus-travel-review`, que lo incumple en 26/26 → **corregido en ronda 2 por RS-RA-001**, re-audit independiente pendiente | `integration/mathematics-remediation`; re-auditoría, sección I |
| Regla 2.9 | Inventario de feedback afirmativo | — | DONE · seis textos falsos más corregidos (D-S08-110) | [inventario](../04-quality/mathematics-remediation-feedback-inventory.md) |

### Ronda 2 · hallazgos de la re-auditoría independiente

Cadena `hallazgo del re-audit → adjudicación del Chair → contrato de la ronda 2 →
remediación dirigida → re-auditoría ronda 2 → sign-off provisional`. Adjudicados el 18
de septiembre de 2026 (D-S08-122 a D-S08-126). **Correcciones DONE: cinco contratos PASS y tres verify consecutivos.** Evidencia before/after y pruebas en el [informe de ronda 2](../04-quality/targeted-post-reaudit-mathematics-remediation.md).

| Hallazgo | Decisión canónica | Prio | ¿Bloquea? | Contrato | Verificación exigida |
|---|---|---|---|---|---|
| MAT-RA-006 · alcance de la auditoría permanente | `REQUIRED_CORRECTION` | **P0** | **sí** | [RS-RA-AUDIT-001](../04-quality/post-reaudit-mathematics-remediation-spec.md#3-rs-ra-audit-001-auditoría-permanente-por-capacidad) | PASS · 24 exhaustivas / 18 políticas; ambos atajos reproducidos antes de corregir |
| MAT-RA-001 · `g7.bus-travel-review` | `REQUIRED_CORRECTION` | **P0** | **sí** | [RS-RA-001](../04-quality/post-reaudit-mathematics-remediation-spec.md#4-rs-ra-001-g7bus-travel-review) | PASS · rango `[0,120]` × 26 variantes, iff demora sola y signo correcto |
| MAT-RA-002 · `y3.course-project-tech` | `REQUIRED_CORRECTION` | **P0** | **sí** | [RS-RA-002](../04-quality/post-reaudit-mathematics-remediation-spec.md#5-rs-ra-002-y3course-project-tech) | PASS · K 35,8 / S 20 %, bajo 65/35 %, enumeración completa |
| MAT-RA-003 · `y4.course-project-fundraiser` | `REQUIRED_CORRECTION` | **P0** | **sí** | [RS-RA-003](../04-quality/post-reaudit-mathematics-remediation-spec.md#6-rs-ra-003-y4course-project-fundraiser) | PASS · K 62,4 / S 28 %, seis órdenes, máximo 20 % |
| MAT-RA-008 · flake de `architecture-lint` | `REQUIRED_CORRECTION` | P1 | no | [RS-RA-TEST-001](../04-quality/post-reaudit-mathematics-remediation-spec.md#7-rs-ra-test-001-reproducibilidad-de-architecture-lint) | PASS · `pnpm verify` verde tres corridas seguidas |
| MAT-RA-005 · `g7.bus-timing` | `ACCEPT_WITH_DOCUMENTED_RISK` | P2 | no | — | Bandera humana H-6; la auditoría sigue reportando su `K` |
| MAT-RA-004 · `y1.scale-fit-review` | `DEFER_TO_FINAL_HUMAN_REVIEW` | P2 | no | — | Bandera humana H-7; la auditoría sigue reportando su política ingenua |
| MAT-RA-009 · replay de catálogos de 1.º–5.º | `DEFER_TO_STAGE_09` | P0 en STAGE-09 | no | R-S09-CAT | Política de retención escrita por año antes de la edición oficial |
| MAT-RA-007 · «N = 25 minimiza el techo» | `RESOLVED — DOCUMENTATION ONLY` | P2 | no | — | Erratum aplicado (D-S08-123) |
| MAT-RA-010 · conteos desactualizados | `RESOLVED — ALREADY FIXED` | NONE | no | — | Verificado: 1739 tests, 0 `todo`, 158 E2E |

### Hallazgos de la re-auditoría de ronda 2 y su cierre

Cadena `re-auditoría ronda 2 → sprint de cierre → auditoría final de cierre →
sign-off provisional`. La ronda 2 eliminó un vector y dejó la clase; el
[sprint de cierre](../04-quality/stage-08-mathematics-final-closure-sprint.md)
cierra la clase con una familia finita de ocho políticas sobre las 42 Templates.

| Hallazgo | Disposición del sprint | Prio | ¿Bloquea? | Contrato | Verificación |
|---|---|---|---|---|---|
| MAT-RA2-003 · la auditoría no ve la clase | `REQUIRED_CORRECTION` | **P0** | **sí** | `RS-CLO-AUDIT-001` | PASS · ocho familias declaradas por Template, 42 filas, 0 sin soporte, 1155–1306 ms |
| MAT-RA2-001 · `y3.course-project-tech` | `REQUIRED_CORRECTION` | **P0** | **sí** | `RS-CLO-001` · `RS-CLO-002` | PASS · lo prometido pasa a total y las tasas a parámetro; K 56,60 / S 16,0 %; mejor atajo 47,00 · 4 % |
| MAT-RA2-002 · `y4.course-project-fundraiser` | `REQUIRED_CORRECTION` | **P0** | **sí** | `RS-CLO-001` · `RS-CLO-002` | PASS · seis economías reales, objetivo contra el techo real; K 57,80 / S 20,0 %; «menos minutos» 81,80 · 44 % |
| MAT-RA2-004 · `g7.group-tasks` | `REQUIRED_CORRECTION` · **subido de MEDIUM** | **P0** | **sí** | `RS-CLO-003` | PASS · seis equipos autorados; K 45,00 / S 33,3 % |
| MAT-RA2-005 · amplitud del catálogo | `REQUIRED_CORRECTION` · causa raíz | P1 | no | `RS-CLO-002` | PASS · pasos de recorrido coprimos en `y4` y `y1.mobile-data`; seis economías publicadas |
| Hallado en el sprint · `y5.final-trip-or-event` | `REQUIRED_CORRECTION` | P1 | no | `RS-CLO-003` | PASS · lugares atados a la posición; 66,00 · 24 % |
| Hallado en el sprint · `y1.mobile-data` | `ACCEPT_WITH_DOCUMENTED_RISK` | P2 | no | `RS-CLO-001` | 86,00 · 44 %, con techo propio más estricto y evidencia de baseline |

Fuentes: [adjudicación](../04-quality/mathematics-department-ai-adjudication.md),
[revisor A](../04-quality/mathematics-department-ai-reviewer-a.md),
[revisor B](../04-quality/mathematics-department-ai-reviewer-b.md),
[revisor C](../04-quality/mathematics-department-ai-reviewer-c.md),
[implementación](../04-quality/mathematics-remediation-implementation.md),
[adjudicación de conflictos de contrato](../04-quality/mathematics-remediation-contract-conflict-adjudication.md),
[adjudicación final del techo](../04-quality/rs-mat-008-blind-ceiling-final-adjudication.md) y
[decisiones D-S08-095 a D-S08-116](../07-reference/decision-register.md).

## RC3 TASK-A — entrada pública y evento

| Requisito | Implementación | Evidencia |
|---|---|---|
| FR-001/014: aviso de plazo restante encima del total del ranking | `RankingDeadlineNotice`, `useEventSecondsRemaining` | `ranking-deadline-notice.test.tsx`: límites de días/horas/minutos, estados, vencimiento y cambio de fecha; `home-event.spec.ts`: posición del aviso |
| FR-001/014: CTA y estados del evento | `CompetitionExperience`, `EventCountdown` | `event-countdown.test.tsx`, `home-event.test.tsx`, `home-event.spec.ts` |
| FR-001: copy Feria del Libro, hero a todo el ancho, reloj visible y footer compacto | `HomeHero`, `CompetitionExperience`, `EventCountdown`, `text-countdown` | `home-event.spec.ts`: geometría responsive de cabecera/reloj/CTA/footer, zoom, teclado y axe; `cn.test.ts`: rol numérico |
| FR-001/012: acentos, iconos de aportes y medallas del Home | `GameModeSummary`, `home-marks`, `Leaderboard`, tokens `podium-*` | `home-event.test.tsx`, `home-event.spec.ts`, `design:check`: etiquetas, empates, numerales y contraste |
| FR-012/020: podio por puesto y posición propia | `Leaderboard`; DTO y comparador sin cambios | `competition-ui.test.tsx`, `home-event.test.tsx`, `ranking-release-regression.test.ts` |
| FR-001: aviso v1 completo en `/privacidad`, footer y aceptación al iniciar | `PrivacyPolicy`, `IdentityForm`, `InstitutionalFooter`, `app/privacidad/page.tsx` | `competition-ui.test.tsx`, `privacy-page.test.tsx`, `privacy.spec.ts`, `competition.spec.ts`; integridad del aviso, footer sólo en Home/privacidad, SSR sin JS, teclado/axe, campos conservados y rechazo API sin reconocimiento vigente |

Decisiones y evidencia de TASK-A en el [plan vivo](../../.tmp/rc3-branding/task-a-home/README.md).

## RC3 — práctica pública

| Requisito | Implementación | Evidencia |
|---|---|---|
| FR-021: carrera, seed propia, contenido y FairScore reales | `server/practice/service`, fábricas full-career existentes | `integration/practice-api.test.ts`, `e2e/practice.spec.ts` |
| FR-021: sin identidad ni persistencia competitiva | Runtime con puerto exclusivo de contador; endpoints propios | Prueba DB antes/después y sólo dos RPC de contador; lint de fronteras; ranking/best/cookie E2E |
| FR-016/017/021: guardado local, resume y reintento | `components/practice`, namespace v1 | `component/practice.test.tsx`, `component/practice-run.test.tsx`, recorrido E2E de tres desafíos y carrera completa |
| FR-001/021: enlace Home, aviso permanente, accesibilidad | `PracticeExperience`, `CompetitionExperience` | E2E 320/360/390/412/768/1280, teclado, zoom y axe |
