# Etapa actual

Vista corta del estado de ejecución. El contrato completo y el protocolo de
actualización están en el [roadmap](implementation-sequence.md).

## STAGE-08 — Contenido incremental de 1.º a 5.º

**Estado:** `IN_PROGRESS` · **etapa actual**.

```text
STAGE-07                                      DONE
STAGE-08                                      IN_PROGRESS · CURRENT
├── PHASE 0 — FULL-CAREER CONTENT DESIGN       DONE
├── PHASE 1 — IMPLEMENT GRADE 1                DONE
│   ├── Contratos de ADR-025 que usa 1.º       IMPLEMENTED
│   ├── 5 Templates + 2 Repasos                RUNTIME · catálogo grade-1-dev-1
│   └── Práctica 7.º → 1.º                     PARTIAL DEVELOPMENT · no oficial
├── POST-G1 SCALABILITY AUDIT                  READY · PENDING · NOT EXECUTED
└── 2.º–5.º                                    BLOCKED ON post-G1 gate
```

Phase 1 cerró el 11 de septiembre de 2026. Las cinco Templates de 1.º
—rueda del Día del Estudiante, Proyecto del Curso I, datos móviles, agenda del
ensayo y aula para la expo— y sus dos Repasos corren sobre el catálogo aprobado
`grade-1-dev-1`, con oráculos independientes, witness óptimo por variante,
evidencia Math/Equipo/Estilo separada, replay, reanudación y recomputación en
servidor. Detalle en la [implementación de 1.º](../01-game-design/grade-1-template-design.md#implementación-runtime-phase-1)
y en [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md#implementación-de-phase-1-2026-09-11).

**No significa que STAGE-08 esté terminada ni que exista una carrera oficial.**
`7.º → 1.º` es práctica local de desarrollo (`official: false`,
`partial-development`); 2.º–5.º no tienen contenido ejecutable. El contenido de 1.º
está en estado `draft`: falta la revisión del Departamento de Matemática, el
sign-off manual de la rueda y el pacing empírico, gates de producción de STAGE-08.

## Baseline autoritativa

STAGE-07 sigue `DONE`: toda run válida completada egresa, con un Repaso máximo
por etapa fuera del presupuesto ordinario y de FairScore.

- Versiones: engine `6.0.0 → 7.0.0`, action log `4 → 5`, snapshot `7` (sin
  campos nuevos). 7.º conserva ruleset `0.4.0-grade-7`, contenido
  `0.9.0-grade-7` y catálogo `grade-7-dev-5`. `7.º → 1.º`: rulesets
  `1.0.0-grade-1-partial` y `1.0.0-grade-1-demo`, contenido `1.0.0-grade-1`,
  catálogo `grade-1-dev-1`. Score `fair-score-dev-2@2.0.0-post-tg1-candidate`
  sin cambios.
- Huellas: motor `7e7e61eb`; ruleset `5b9b0bc5` y contenido `dbaf5094` del
  fixture de desarrollo intactos.
- Tests: 62 archivos y 1339 tests de Vitest; 80 E2E de Playwright en desktop y
  mobile, incluidos cinco recorridos de 1.º.
- Simulación: 5000 runs de 7.º, 5000 de `7.º → 1.º` y 2000 del demo amplio
  egresadas, 0 hallazgos, peor caso un Repaso por etapa.
- Composición: 2000 seeds de `7.º → 1.º` dan 2000 planes distintos, 0 inválidos
  y 0 diferencias al recomponer.

## Siguiente tarea canónica

```text
STAGE-08
PHASE 1 — DONE

Next:
Post-Grade-1 Scalability Audit — READY / PENDING
```

El [audit posterior a 1.º](../04-quality/post-grade-1-scalability-audit.md) fuerza
`classroom-layout INVALID` y `rehearsal-schedule INVALID` en una etapa y decide si
un Repaso seleccionado, el debrief del otro concepto y el cierre conjunto son
pedagógica y técnicamente adecuados. El mecanismo y el harness existen; el
veredicto no se da por ejecutado.

## Scope OUT y gates restantes

No producir 2.º–5.º antes del PASS post-G1, no duplicar sistemas fundamentales y
no implementar servidor/ranking de STAGE-09. Las calibraciones recomendadas y
Teacher Gate no se vuelven constantes inmutables ni configuración oficial.

Después del PASS post-G1: implementar 2.º → 3.º → 4.º → 5.º, completar
capacidades narrativas/Prestige previstas y auditar la carrera real. El exit gate
de STAGE-08 sigue siendo recorrer `7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESADO`
con contenido auditado, sin duplicar sistemas y verificando el target de pacing.

## Última reconciliación

11 de septiembre de 2026: cierre de STAGE-08 / Phase 1 con implementación,
tests, documentación y verificación completa. Sin push.
