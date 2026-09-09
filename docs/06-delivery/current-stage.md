# Etapa actual

Vista corta del estado de ejecución. El contrato completo y el protocolo de
actualización están en el [roadmap](implementation-sequence.md).

## STAGE-08 — Contenido incremental de 1.º a 5.º

**Estado:** `IN_PROGRESS` · **etapa actual**.

```text
STAGE-07                                      DONE

STAGE-08                                      IN_PROGRESS · CURRENT
└── Phase 0 — Full-Career Content Design      IN_PROGRESS
    ├── Product Design Envelope               COMPLETE
    ├── Full-Career Matrix v0.3               COMPLETE · diseño
    ├── Grade 1 Template Design Pass          COMPLETE
    ├── Grade 2 Template Design Pass          COMPLETE
    ├── Grade 3 Template Design Pass          COMPLETE
    ├── Grade 4 Template Design Pass          COMPLETE
    ├── Grade 5 Template Design Pass          COMPLETE
    ├── Documentation checkpoint #2           COMPLETE
    ├── Full-Career Cross-Content Audit       NEXT
    ├── Rare Events / Milestones / Prestige   PLANNED · pase detallado
    ├── Career Epilogue v1                    PLANNED · pase detallado
    └── Final Phase-0 reconciliation          PLANNED
```

Phase 0 no está terminada: faltan la auditoría cruzada, los pases detallados de
eventos raros/Hitos/Prestige y epílogo, y la reconciliación final. Los diseños de
1.º–5.º están `DESIGN-CANDIDATE-APPROVED`; su implementación no empezó ni fue
autorizada por este checkpoint. La auditoría inicial de la matriz v0.2 y el
checkpoint #1 siguen completos como antecedentes.

## Baseline autoritativa

STAGE-07 cerró el 2 de septiembre de 2026 y permanece `DONE`. El egreso es un
estado terminal que toda run válida completada alcanza, y la recuperación converge
por construcción según
[ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md):

- sólo un beat ordinario puede crear una obligación;
- un repaso cierra todas las obligaciones de la etapa y no puede crear otra;
- el techo estructural es exactamente un repaso por etapa;
- el repaso queda fuera del presupuesto ordinario y de numerador/denominador de `FairScore`;
- ruteo por Template y `none` explícito evitan remediaciones irrelevantes;
- el servidor/replay recalcula progresión y egreso.

El hardening posterior a STAGE-07 fijó `RecoveryPolicy.maxRecoveriesPerStage` al
literal `1`; validación y `createRuleset` rechazan `2` u otro valor, y progresión
usa `MAX_RECOVERIES_PER_STAGE`, no una calibración libre. No cambió engine,
ruleset, contenido ni catálogo.

La carrera sintética de seis años prueba que la estructura sostiene
`7.º · 1.º · 2.º · 3.º · 4.º · 5.º` sin casos especiales. No prueba que exista
contenido real de 1.º–5.º ni valida el target UX de 8–10 minutos.

## Resultado actual de Phase 0

- [Envolvente de diseño](../01-game-design/stage-08-product-design-envelope.md): `COMPLETE · ACCEPTED`.
- [Matriz de carrera v0.3](../01-game-design/full-career-content-matrix.md): 25 Templates `DESIGN-CANDIDATE-APPROVED`; 24/52/24 CORE/STANDARD/STRETCH, nueve rutas futuras y políticas de clusters/arco/callbacks.
- [Sistema narrativo](../01-game-design/narrative-system.md): arco, elenco relacional, callbacks, Proyecto del Curso y epílogo aceptados; runtime multianual no implementado.
- [Eventos raros y Prestige](../01-game-design/rare-events-and-prestige.md): semántica de producto aceptada, calibración candidata y arquitectura/runtime abiertos.
- [Diseño de 1.º](../01-game-design/grade-1-template-design.md): cinco Templates `DESIGN-CANDIDATE-APPROVED`; Equipo sólo en expo, Aura ordinaria ausente y dos rutas candidatas de recuperación.
- [Diseño de 2.º](../01-game-design/grade-2-template-design.md): pertenencia; cluster Intercurso, encuesta, distancias y comunicación pública independiente.
- [Diseño de 3.º](../01-game-design/grade-3-template-design.md): autonomía; mayor riqueza de Estilo, recursos compartidos, umbral de usos y recorridos.
- [Diseño de 4.º](../01-game-design/grade-4-template-design.md): responsabilidad; externalidad sin Equipo automático y reemplazo raro `represent-class` con triple evidencia.
- [Diseño de 5.º](../01-game-design/grade-5-template-design.md): convergencia; proyecto de contingencia y `next-step-options` con FairScore de viabilidad solamente.
- [Auditoría posterior a 1.º](../04-quality/post-grade-1-scalability-audit.md): contrato `REQUIRED · PLANNED`, todavía no ejecutado.

## Scope IN de la fase actual

- Full-Career Cross-Content Audit de 7.º existente y las 25 Templates futuras;
- pase detallado de Rare Events / Milestones / Prestige;
- pase de Career Epilogue v1 y selección de hechos narrativos significativos;
- reconciliación final de diseño de carrera;
- preservación explícita de calibraciones y preguntas abiertas.

## Siguiente tarea canónica

```text
STAGE-08 / Phase 0 / Full-Career Cross-Content Audit
```

El [alcance canónico de la auditoría](../04-quality/content-validation.md#full-career-cross-content-audit)
cubre matemática, duplicación, interacciones, señales sociales/Estilo, recovery,
clusters, Project Arc, neutralidad rara/Prestige, callbacks, pacing, primeras tres
runs, riesgos de autoría y convergencia de 5.º. No fue ejecutada en este checkpoint.

## Flujo posterior obligatorio

```text
Full-Career Cross-Content Audit
→ Rare Events / Milestones / Prestige detailed pass
→ Career Epilogue v1 pass
→ Final Phase-0 reconciliation
→ Phase 0 DONE
→ Phase 1: implementar 1.º real
→ STOP: auditoría de escalabilidad posterior a 1.º
→ PASS: implementar 2.º–5.º
→ auditoría de carrera completa
→ STAGE-08 DONE
```

La auditoría fuerza `classroom-layout` y `rehearsal-schedule` fallidas en una
misma etapa, dos obligaciones conceptuales y un único repaso. No existe una
solución preseleccionada.

## Scope OUT

- implementar Templates/Variants de 1.º–5.º durante Phase 0;
- afirmar que el audit posterior a 1.º ya pasó;
- rediseñar UI, Career Model, score, dificultad, compositor o progresión;
- implementar Prestige, RNG raro, ranking, intentos, personal best o servidor de competencia;
- congelar `fair-score-dev-2`, `recovery-dev-1` o calibraciones candidatas;
- validar 8–10 minutos antes de tener carrera real jugable.

## Exit gate de STAGE-08

¿Una run completa recorre
`7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESADO` con contenido real, auditado y
sin duplicar sistemas fundamentales?

## Evidencia de entrada preservada

- 20.000 carreras sintéticas de seis años: 20.000 egresadas, 0 hallazgos; peor caso, 6 repasos.
- Espacio de estados de progresión recorrido entero: único terminal, sin ciclos ni callejones.
- Baseline verificada tras hardening: 908 tests en 50 archivos y 70 E2E.
- Versiones sin cambios: engine `6.0.0`, snapshot `7`, action log `4`, ruleset `0.4.0-grade-7`, contenido `0.9.0-grade-7`, catálogo `grade-7-dev-5`.
- Huellas sin cambios: motor `a0ed168d`, ruleset `5b9b0bc5`, contenido `dbaf5094`.

## Última reconciliación

9 de septiembre de 2026, checkpoint documental #2 de STAGE-08 / Phase 0 después
de los cinco Template Design Passes. El checkpoint #1 del 8 de septiembre quedó
integrado en `1dea7e5`; esta reconciliación es incremental y sólo documental.
