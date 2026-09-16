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
├── POST-G1 SCALABILITY AUDIT                  PASSED · hardening resuelto
├── PHASE 2 — IMPLEMENT GRADES 2–5             DONE
│   ├── 2.º Pertenencia                        DONE · catálogo grade-2-dev-1
│   ├── 3.º Autonomía                          DONE · catálogo grade-3-dev-1
│   ├── 4.º Responsabilidad                    DONE · catálogo grade-4-dev-1
│   └── 5.º Cierre y futuro                    DONE · catálogo grade-5-dev-1
├── INTEGRACIÓN DE CARRERA COMPLETA            DONE
│   ├── Carrera real 7.º–5.º de nueve beats    DONE · catálogo grade-5-dev-2
│   ├── Rareza, Prestige y epílogo             DONE · una sola vez
│   └── D-S08-056 con catálogo real            CLOSED · aceptada con evidencia
└── GATES DE PRODUCCIÓN                        IN_PROGRESS
    ├── AI MATHEMATICS DEPARTMENT (provisional)  IN_PROGRESS
    │   ├── Pre-Review                           DONE · 13 hallazgos, 0 bloqueantes
    │   ├── Independent Adjudication             DONE · REMEDIATION REQUIRED
    │   ├── Mathematics Remediation              NEXT · contrato canónico
    │   ├── Independent Re-Audit                 PENDING
    │   └── Provisional Sign-Off                 PENDING
    ├── Revisión del Depto. de Matemática      DEFERRED · a Final Delivery / Pre-Release
    ├── Sign-off manual de la rueda            PENDING · humana
    └── Pacing empírico con jugadores          PENDING · humana
```

Phase 1 cerró el 11 de septiembre de 2026. Las cinco Templates de 1.º
—rueda del Día del Estudiante, Proyecto del Curso I, datos móviles, agenda del
ensayo y aula para la expo— y sus dos Repasos corren sobre el catálogo aprobado
`grade-1-dev-1`, con oráculos independientes, witness óptimo por variante,
evidencia Math/Equipo/Estilo separada, replay, reanudación y recomputación en
servidor. Detalle en la [implementación de 1.º](../01-game-design/grade-1-template-design.md#implementación-runtime-phase-1)
y en [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md#implementación-de-phase-1-2026-09-11).

2.º cerró el 15 de septiembre de 2026 —pedido de pecheras, encuesta del
Proyecto II, plan del Intercurso, tabla y postas de la cancha, más el Repaso del
denominador— y 3.º el mismo día —colectivo, feria de tecnología, Día del Amigo,
semana y recorrido del barrio, más dos Repasos—. 4.º cerró el 16 de septiembre
—turnos, peña, cola del evento, salón y consejo escolar, más dos Repasos— y 5.º
el mismo día —viaje, muestra final, anuario, pantalla del acto y el año que
viene, más dos Repasos—. Detalle en
[2.º](../01-game-design/grade-2-template-design.md#implementación-runtime),
[3.º](../01-game-design/grade-3-template-design.md#implementación-runtime),
[4.º](../01-game-design/grade-4-template-design.md#implementación-runtime) y
[5.º](../01-game-design/grade-5-template-design.md#implementación-runtime).

La integración cerró el 16 de septiembre de 2026. La **carrera completa** es una
edición propia —ruleset `1.0.0-full-career`, catálogo `grade-5-dev-2`— que
compone los **nueve** beats del presupuesto sobre los seis años, con eventos
raros, Prestige, hitos, callbacks y epílogo implementados **una sola vez** ahí
(D-S08-067 y D-S08-072, ahora cerradas). La práctica parcial `7.º → 5.º` sigue
existiendo, con sus doce beats, como superficie de desarrollo.

**Sigue sin existir una carrera oficial.** La edición es `official: false`: la
oficialización, el ranking y el servidor competitivo son STAGE-09. El techo de
Prestige **ofrecido es 0** por decisión explícita (D-S08-084): la maquinaria
existe y el servidor la recomputa, pero autorar una oportunidad competitiva
exigiría inventar acciones de jugador que ninguna Template tiene. El contenido
de 1.º a 5.º está en estado `draft`: faltan la remediación matemática y su
sign-off provisional de IA, el sign-off manual de la rueda y el pacing empírico,
gates de producción de STAGE-08. La revisión del Departamento de Matemática
humano no se eliminó: está diferida a la entrega final (D-S08-095).

## Baseline autoritativa

STAGE-07 sigue `DONE`: toda run válida completada egresa, con un Repaso máximo
por etapa fuera del presupuesto ordinario y de FairScore.

- Versiones: engine `10.0.0`, action log `7`, snapshot `8`. 7.º conserva ruleset
  `0.4.0-grade-7`, contenido `0.9.0-grade-7` y catálogo `grade-7-dev-5`.
  `7.º → 1.º`: contenido `1.0.0-grade-1`, catálogo `grade-1-dev-1`.
  `7.º → 2.º`: contenido `2.1.0-grade-2`, catálogo `grade-2-dev-2`.
  `7.º → 3.º`: contenido `3.1.0-grade-3`, catálogo `grade-3-dev-2`.
  `7.º → 4.º`: contenido `4.1.0-grade-4`, catálogo `grade-4-dev-2`.
  `7.º → 5.º`: rulesets `5.1.0-grade-5-partial` y `5.1.0-grade-5-demo`, contenido
  `5.1.0-grade-5`, catálogo `grade-5-dev-2`. Carrera completa: ruleset
  `1.0.0-full-career` sobre ese mismo contenido y catálogo. Score
  `fair-score-dev-2@2.0.0-post-tg1-candidate` sin cambios.
- Huellas: motor `4bcf054e` —se movió con la respuesta de recorrido y con la
  política de rareza—; ruleset de la carrera completa `7d41fddb`.
- Tests: 93 archivos y 1662 tests de Vitest; 146 E2E de Playwright en desktop y
  mobile, incluidos los recorridos de 1.º a 5.º, la carrera completa y el
  barrido de accesibilidad del audit.
- Simulación: 5000 runs de 7.º, 5000 de `7.º → 1.º`, 2000 del demo amplio y 200
  de cada práctica parcial de 2.º a 5.º egresadas, 0 hallazgos, peor caso un
  Repaso por etapa. La carrera completa se barre con seis políticas de juego
  —óptima, eficiente, funcional, inválida pesada, mixta y aleatoria—: todas
  terminan, todas egresan y el servidor recompone el mismo puntaje.
- Composición: 2000 seeds de `7.º → 1.º` dan 2000 planes distintos, 0 inválidos
  y 0 diferencias al recomponer. La carrera completa compone nueve beats en las
  seis etapas; 300 carreras dan p50 **384 ms**, p95 **404 ms** y peor caso
  **434 ms**, 0 fallas, 0 planes inválidos y las 28 Templates elegibles
  aparecen (D-S08-056 y D-S08-082).

El 16 de septiembre se ejecutó además la
[pre-revisión de Matemática asistida por IA](../04-quality/mathematics-department-pre-review.md):
trece hallazgos —dos HIGH, seis MEDIUM, tres LOW y dos observaciones— y
**ninguna corrección aplicada**.

## Departamento de Matemática provisional

Por decisión del Product Owner (D-S08-095), la revisión del Departamento de
Matemática humano **se difiere a Final Delivery / Pre-Release Acceptance** y el
gate vigente es un proceso provisional asistido por IA: pre-revisión, adjudicación
independiente, remediación, re-auditoría independiente y sign-off provisional.
**Un sign-off provisional de IA no es aprobación humana**: no pasa contenido a
`math_reviewed` ni reemplaza los sign-offs manuales de la guía de autoría.

La [adjudicación independiente](../04-quality/mathematics-department-ai-adjudication.md)
se ejecutó el 16 de septiembre con tres revisores separados —matemática
([A](../04-quality/mathematics-department-ai-reviewer-a.md)), didáctica
([B](../04-quality/mathematics-department-ai-reviewer-b.md)) y validez de
evaluación ([C](../04-quality/mathematics-department-ai-reviewer-c.md))— y un
Chair que decidió sin mayoría: `ADJUDICATION COMPLETE — REMEDIATION REQUIRED`.
De los trece hallazgos, 9 `REQUIRED_CORRECTION`, 1 `REQUIRED_CLARIFICATION`,
1 `ACCEPT_AS_DESIGNED` y 2 `ACCEPT_WITH_DOCUMENTED_RISK`; se agregaron siete
hallazgos nuevos, todos a corregir, entre ellos una respuesta constante que
resuelve `y5.course-project-final` en 22 de 24 variantes y un feedback de
`g7.notebook-offer` que afirma la comparación al revés en 14 de 26. **Nada de
runtime, contenido, catálogos ni tests cambió en este gate.** El contrato de la
siguiente tarea es la
[especificación de remediación](../04-quality/mathematics-remediation-spec.md).

## Siguiente tarea canónica

```text
STAGE-08
PHASE 1 — DONE
POST-G1 SCALABILITY AUDIT — PASSED
2.º — DONE
3.º — DONE
4.º — DONE
5.º — DONE
INTEGRACIÓN DE CARRERA COMPLETA — DONE

AI Mathematics Department Pre-Review — DONE
AI Mathematics Department Independent Adjudication — DONE

Mathematics Remediation — NEXT
Independent Mathematics Re-Audit — PENDING
AI Mathematics Department Provisional Sign-Off — PENDING

Human Mathematics Department Review
— DEFERRED TO FINAL DELIVERY / PRE-RELEASE

Real-player pacing validation — PENDING

Next:
MATHEMATICS REMEDIATION IMPLEMENTATION, con
docs/04-quality/mathematics-remediation-spec.md como contrato canónico
```

La [auditoría de implementación de carrera completa](../04-quality/full-career-implementation-audit.md)
se ejecutó el 16 de septiembre de 2026 y dio
`PASS WITH REQUIRED HARDENING — RESOLVED`: cuatro defectos técnicos acotados
—el techo de FairScore inalcanzable por falta de witnesses de Equipo y Aura, la
rejugabilidad colapsada por los objetivos blandos, la política de rareza
descartada al construir el ruleset y un desborde de reflow a 320 px— se
corrigieron dentro del gate, sin mover score, dificultad ni oportunidades
competitivas.

El [audit posterior a 1.º](../04-quality/post-grade-1-scalability-audit.md#resultado-de-la-ejecución-2026-09-14)
se ejecutó el 14 de septiembre de 2026 y dio
`PASS WITH REQUIRED HARDENING — RESOLVED`: forzó `classroom-layout INVALID` y
`rehearsal-schedule INVALID` en la misma etapa y comprobó que un Repaso practica
una obligación, debriefea la otra y cierra ambas, sin recursión, sin tocar
FairScore y con replay, reanudación y servidor reproduciendo la distinción. Se
corrigieron tres defectos técnicos acotados —reflow a 360 px con el plano
construido, la medición del propio E2E y una deriva documental de reflow— sin
cambiar ninguna decisión de producto.

## Scope OUT y gates restantes

No duplicar sistemas fundamentales y no implementar servidor/ranking de STAGE-09.
Las calibraciones recomendadas y Teacher Gate no se vuelven constantes inmutables
ni configuración oficial.

El exit gate de implementación se cumplió: `7.º → 1.º → 2.º → 3.º → 4.º → 5.º →
EGRESADO` se recorre entero, con contenido auditado y sin duplicar sistemas. Lo
que queda de STAGE-08 son gates de producción: la remediación matemática
adjudicada, su re-auditoría y el sign-off provisional de IA; el sign-off manual de
la rueda del Día del Estudiante y el pacing empírico con jugadores reales —el
target de pacing sigue sin validarse con personas—. La revisión del Departamento
de Matemática humano sobre las 42 Templates queda diferida a la entrega final.
Hasta eso, el contenido permanece `draft` y la edición `official: false`.

## Última reconciliación

16 de septiembre de 2026: adjudicación independiente del Departamento de
Matemática provisional —tres revisores, Chair, trece hallazgos adjudicados, siete
nuevos y la especificación de remediación— y diferimiento de la revisión humana a
la entrega final (D-S08-095 a D-S08-103), sólo documentación; antes, la
pre-revisión de Matemática asistida por IA, con su registro de hallazgos y el
paquete para el Departamento humano; antes, la
integración de la carrera completa —composición de
nueve beats sobre el catálogo real, eventos raros, Prestige con techo ofrecido
0, hitos, callbacks y epílogo con su pantalla—, auditoría de Estilo, barrido por
políticas de juego y E2E de carrera. D-S08-056 cerrada con evidencia.
Verificación completa en verde. Sin push.
