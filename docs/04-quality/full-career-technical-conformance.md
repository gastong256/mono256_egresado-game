# STAGE-08 Phase 0 — Auditoría de conformidad técnica

- Auditoría ejecutada: 2026-09-09; reporte incorporado documentalmente: 2026-09-10.
- Baseline: `main`, `147df6037ba20d04cc40a972f82d8cb1fc0754ad`.
- Dictamen: **PASS WITH MINOR CONTRACT DELTAS**; sin BLOCKER arquitectónico sin resolver.
- Alcance: lectura de código/tests/docs, sin modificaciones, instalación, commit ni push.

Este reporte preserva la auditoría entregada en la conversación, no simula una
nueva ejecución. Las decisiones de producto están en sus [fuentes canónicas](../07-reference/full-career-product-audit-integration.md).
Los deltas entendidos se gobiernan en [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md).

## Evidencia y hallazgos por impacto

| Hallazgo | Evidencia de baseline | Resultado / destino |
|---|---|---|
| Alto: cuotas globales no implementadas | [composer](../../src/game/plan/composer.ts), [política](../../src/game/plan/composition-policy.ts), [validador](../../src/game/plan/plan-validator.ts) | Una pasada por etapa; variedad blanda, sin nueve beats ni cuotas globales. Validador genérico no exige las seis etapas. Extensión acotada en ADR-025. |
| Medio: debrief no representado | [recovery](../../src/game/progression/recovery.ts), [transition](../../src/game/runs/transition.ts) | Obligaciones múltiples, selección determinista y cierre conjunto ya existen. Falta distinguir y mostrar el debrief de no seleccionadas. |
| Medio: fallback aprobado de recovery | `recoveryContentFor` en transition | Lookup presente pero vacío cae a variantes curadas. Contradice intención approved-only de ADR-024; hardening futuro antes de G1. No se observó activación con catálogo vigente. |
| Medio: modos UI constructivos incompletos | [interacciones](../../src/game/challenges/interactions.ts), [adapter](../../src/components/game/interaction-area.tsx) | Ocho kinds técnicos no son cinco motores de producto; timeline actual selecciona opciones, no agenda bloques. Extensiones explícitas, sin otro motor fundamental. |
| Alto documental: producto nuevo no reconciliado | Matriz, narrativa, Prestige, operaciones, preguntas y current-stage en `147df60` | Todavía constan 25×4/STYLE, tiempo, máximo Project candidato y audit NEXT. Resuelto documentalmente por la integración posterior; no se atribuye implementación. |
| Alto para oficialización: emisión no existe | [validate-run](../../src/server/game/validate-run.ts) | Reproduce/recompone/calcula, pero no acredita seed emitida ni vinculación a edición. STAGE-09, no bloqueo de Phase 0. |

## Conformidad por frontera

**Composición.** Roles, elegibilidad, catálogo aprobado, banda, costo y plan previo
ya existen. Familia de escenario no equivale a razonamiento primario; faltan
pacing, motor principal, cluster/arco y restricciones globales. La carrera
sintética de doce beats prueba estructura, no el plan de producto de nueve.

**FairScore.** [La policy](../../src/game/scoring/competitive-policy.ts) conserva
`fair-score-dev-2`, 85/10/5, `official: false`, factores 1,00/1,08/1,15.
[El agregador](../../src/game/scoring/fair-score.ts) normaliza evidencia alcanzada
contra disponible, excluye componentes ausentes y descarta recovery por rol.
Cuando toda evidencia disponible alcanza su máximo, el resultado es exactamente
10.000. Esto no prueba que todos los futuros templates permitan alcanzar a la vez
sus máximos Math/Team/Aura: se exige witness y tests en autoría.

**Career y Prestige.** FairScore no consume Promedio ni Style. Prestige no existe
en runtime; puede agregarse como observador puro separado. History conserva
resultado, métricas y direcciones de eventos, no todas las elecciones ni deltas
históricos de flags. Los hechos adicionales no derivables requieren registro
semántico; no se infieren logros de corrección o texto mostrado.

**Saliencia.** [RunState](../../src/game/runs/state.ts) y
[snapshot](../../src/game/runs/snapshot.ts) preservan history, flags, storylets
vistos, carrera y recuperación. Un selector puro puede derivar recuerdos por
segmento con metadata autorada; nuevas memorias persistidas son opcionales, no
una segunda copia obligatoria del historial. No hay epílogo multianual ejecutable.

**Rareza.** [RNG](../../src/game/random/rng.ts) admite probabilidades racionales y
substreams independientes. Faltan política de rareza y arbitraje de presupuesto.
La seed competitiva fija presencia, no el éxito ni Prestige por aparición.
Modificadores deben conservar identidad matemática aprobada y no desplazar
recuperación ni agregar beats. Flags actuales no autorizan ventajas ocultas.

**Replay/servidor.** [Replay](../../src/game/runs/replay.ts),
[action log](../../src/game/runs/action-log.ts) y
[fingerprint SHA-256 del plan](../../src/game/plan/plan-fingerprint.ts) sostienen
reconstrucción. El hash no acredita emisión. En Fair se requieren dificultad fija,
seed/variantes/políticas comunes, runId distinto por intento y validación de egreso
y plan completo. Ranking debe usar `competitiveScore.fairScore`, no el total
legacy llamado `officialScore`. No hay comparador/ranking implementado.

## Stress case G1 — viabilidad, no prueba ejecutada

Con mappings futuros correctos, jugar `classroom-layout INVALID` crea O1 y
`rehearsal-schedule INVALID` crea O2. Ambas guardan etapa, índice y variante fuente.
Después de los ordinarios, el motor toma la primera por orden canónico; si se
jugaron en ese orden, selecciona `scale-fit-review`. Un único `withRecovery`
registra `resolved: [O1, O2]` y cierra ambas, incluso con resultado bajo del Repaso.

Falta el debrief explícito de O2 y, si se exige persistencia de esa distinción,
identificar O1 como seleccionada. No se practicaron automáticamente dos conceptos
por cerrar dos IDs. `reviewPriority` es recomendación editorial; el orden actual
ya es determinista. El [gate post-G1](post-grade-1-scalability-audit.md) permanece
obligatorio: relevancia, debrief, no recursión, cierre, pacing y replay.

## UI: reutilización y deltas

| Motor de producto | Baseline / extensión |
|---|---|
| Choice / Compare | OptionList y confirmación reutilizables. |
| Allocate / Constrain | BudgetBuilder, steppers y AssignmentBoard; capacidades y recursos no comerciales requieren contratos explícitos. |
| Timeline / Schedule | Shell reutilizable; el kind timeline actual no construye agendas. |
| Spatial / Graph Canvas | Sin renderer espacial general; geometría discreta en core, presentación y controles accesibles fuera de core. |
| Grid / Select / Classify | NumberGridBoard reutilizable; categorías/conteos no equivalen al contrato numérico actual. |

`run-view` guarda borradores en React; no sobreviven como decisiones parciales
confirmadas. Una respuesta compuesta acotada permite separar acciones Math/Aura
sin multiplicar beats; persistir pasos intermedios exige contrato aparte.

## Versionado y secuencia

Baseline preservada: engine `6.0.0`, snapshot `7`, action log `4`, ruleset
`0.4.0-grade-7`, contenido `0.9.0-grade-7`, catálogo `grade-7-dev-5` y score
`2.0.0-post-tg1-candidate`. La matriz de bumps futuros vive sólo en ADR-025.

G1 necesita contratos de sus interacciones, metadata y Repaso. G2 necesita su
respuesta Math/Aura separada. Prestige completo y saliencia pueden llegar en G4/5,
pero los hechos se registran desde el año de origen. Servidor oficial, DB/auth y
ranking son STAGE-09. No se requiere rediseño ni dependencia nueva.

## Verificación ejecutada el 9 de septiembre

Resultado: **16 archivos, 308 tests PASS**. Comando:

```bash
pnpm test --configLoader runner --no-cache --no-experimental.fsModuleCache \
  tests/unit/run-composer.test.ts \
  tests/unit/progression.test.ts \
  tests/unit/progression-reachability.test.ts \
  tests/unit/competitive-score.test.ts \
  tests/unit/score-golden.test.ts \
  tests/unit/engine-golden.test.ts \
  tests/unit/engine-fingerprint.test.ts \
  tests/unit/rng-addressing.test.ts \
  tests/unit/variant-pipeline.test.ts \
  tests/integration/recovery-run.test.ts \
  tests/integration/server-run-validation.test.ts \
  tests/integration/competitive-run.test.ts \
  tests/integration/composed-run.test.ts \
  tests/property/competitive-score.property.test.ts \
  tests/property/progression.property.test.ts \
  tests/property/run-composition.property.test.ts
```

También pasaron `pnpm toolchain:check`, `node scripts/validate-agent-workspace.mjs`,
`node scripts/sync-master-spec.mjs --check` y `git diff --check`.
No se ejecutaron install, verify completo, build, coverage ni Playwright.
No se ejecutó el stress case real G1: ese contenido no existe.

Los hashes de 570 archivos fuera de `.git`/`node_modules` y el status final
coincidieron con la baseline. La única entrada untracked era el paquete del
Product Audit, preservado durante aquella tarea read-only. No hubo commit ni push.

## Recomendación de cierre

La auditoría aprobó viabilidad, pero no marcó Phase 0 DONE: faltaban integración
del Product Pass, reconciliación, decisiones técnicas documentadas, plan G1 y
limpieza autorizada. No exigía runtime para cerrar diseño. La
[reconciliación posterior](../07-reference/full-career-product-audit-integration.md)
satisface esas condiciones documentales; el [roadmap](../06-delivery/implementation-sequence.md)
es la autoridad de estado, no esta foto histórica.
