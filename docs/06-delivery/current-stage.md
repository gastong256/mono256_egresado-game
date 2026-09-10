# Etapa actual

Vista corta del estado de ejecución. El contrato completo y el protocolo de
actualización están en el [roadmap](implementation-sequence.md).

## STAGE-08 — Contenido incremental de 1.º a 5.º

**Estado:** `IN_PROGRESS` · **etapa actual**.

```text
STAGE-07                                      DONE
STAGE-08                                      IN_PROGRESS · CURRENT
├── PHASE 0 — FULL-CAREER CONTENT DESIGN       DONE
│   ├── Envelope, matriz y diseños 1.º–5.º     COMPLETE · diseño
│   ├── Full-Career Product Audit             RECONCILED
│   ├── Rare Events / Prestige / Epilogue v1   COMPLETE · diseño
│   ├── Technical Conformance Audit           PASS WITH MINOR CONTRACT DELTAS
│   └── Canonical reconciliation              COMPLETE
└── PHASE 1 — IMPLEMENT GRADE 1                READY · NEXT · NOT STARTED
    └── Post-G1 scalability audit              REQUIRED · NOT EXECUTED
```

Phase 0 está `DONE`: la [integración del Product Audit](../07-reference/full-career-product-audit-integration.md)
reconcilia decisiones y supersesiones; la [conformidad técnica](../04-quality/full-career-technical-conformance.md)
no encontró BLOCKER sin resolver. Sus deltas entendidos quedan en
[ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md), para
implementación futura. **No significa que STAGE-08 esté terminada ni que exista
contenido real de 1.º–5.º.** Los 25 diseños siguen `DESIGN-CANDIDATE-APPROVED`,
no variantes aprobadas ni contenido desplegado.

## Baseline autoritativa

STAGE-07 cerró el 2 de septiembre de 2026 y permanece `DONE`. Toda run válida
completada alcanza el egreso; [ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md)
garantiza como máximo un Repaso por etapa, fuera del presupuesto ordinario y de
FairScore, con cierre de todas las obligaciones y sin recursión. El hardening
posterior fijó `RecoveryPolicy.maxRecoveriesPerStage` al literal `1`.

La carrera sintética de seis años prueba estructura, no contenido real ni el
target UX. El motor actual selecciona y cierra obligaciones; todavía no representa
el debrief explícito del resto exigido por el Product Pass.

- Entrada histórica: 20.000 carreras sintéticas egresadas, 0 hallazgos; peor caso, 6 repasos.
- Baseline post-hardening: 908 tests en 50 archivos y 70 E2E; no reejecutados por esta integración.
- Conformidad técnica del 9 de septiembre: 308 tests en 16 archivos PASS, alcance exacto en su reporte.
- Versiones preservadas: engine `6.0.0`, snapshot `7`, action log `4`, ruleset `0.4.0-grade-7`, contenido `0.9.0-grade-7`, catálogo `grade-7-dev-5`.
- Huellas preservadas: motor `a0ed168d`, ruleset `5b9b0bc5`, contenido `dbaf5094`.

## Siguiente tarea canónica

```text
STAGE-08
PHASE 0 — DONE

Next:
PHASE 1 — IMPLEMENT GRADE 1
```

El [plan de Phase 1](implementation-sequence.md#phase-1-implementar-1º-real)
ordena contratos mínimos, implementación incremental de los cinco Templates de
1.º y dos rutas de Repaso, variantes, composición y verificación. Las fuentes de
producto son la [matriz](../01-game-design/full-career-content-matrix.md),
el [diseño de 1.º](../01-game-design/grade-1-template-design.md) y la
[guía de autoría](../01-game-design/content-authoring-guide.md).

Al terminar 1.º: **STOP** y [auditoría de escalabilidad post-G1](../04-quality/post-grade-1-scalability-audit.md).
Debe forzar `classroom-layout INVALID` y `rehearsal-schedule INVALID` en una etapa:
selección determinista de un Repaso, debrief del resto, cierre conjunto, egreso y
neutralidad competitiva. La semántica está decidida; el gate empírico no pasó.

## Scope OUT y gates restantes

Esta reconciliación no implementa runtime, UI, contenido, schemas, catálogos,
tests, configuraciones ni versiones. Phase 1 no habilita producir 2.º–5.º antes
del PASS post-G1, duplicar sistemas fundamentales ni implementar servidor/ranking
de STAGE-09. Las calibraciones recomendadas y Teacher Gate no se vuelven constantes
inmutables ni configuración oficial.

Después del PASS post-G1: implementar 2.º → 3.º → 4.º → 5.º, completar capacidades
narrativas/Prestige previstas y auditar la carrera real. El exit gate de STAGE-08
sigue siendo recorrer `7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESADO`
con contenido auditado, sin duplicar sistemas y verificando el target de pacing.

## Última reconciliación

10 de septiembre de 2026: integración documental del Full-Career Product Audit del
9 de septiembre y su conformidad técnica. Checkpoints #1 (`1dea7e5`) y #2
(`147df60`) preservados como antecedentes. Sin implementación ni push.
