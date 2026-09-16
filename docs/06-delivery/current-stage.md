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
└── INTEGRACIÓN DE CARRERA COMPLETA            NOT_STARTED
    ├── Catálogo real 7.º–5.º y composición    pendiente
    ├── Rareza, Prestige y epílogo             pendiente · una sola vez
    └── D-S08-056 con catálogo real            pendiente
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

**No significa que STAGE-08 esté terminada ni que exista una carrera oficial.**
`7.º → 5.º` tiene los seis años pero es práctica local de desarrollo
(`official: false`, `partial-development`): compone doce beats ordinarios, no
los nueve del presupuesto oficial. Falta la integración —catálogo y composición
oficiales, rareza, Prestige, callbacks de carrera y epílogo, que se implementan
una sola vez ahí (D-S08-067 y D-S08-072)— y cerrar D-S08-056 con el catálogo
real. El contenido de 1.º a 5.º está en estado `draft`: faltan la revisión del
Departamento de Matemática, el sign-off manual de la rueda y el pacing empírico,
gates de producción de STAGE-08.

## Baseline autoritativa

STAGE-07 sigue `DONE`: toda run válida completada egresa, con un Repaso máximo
por etapa fuera del presupuesto ordinario y de FairScore.

- Versiones: engine `9.0.0`, action log `7`, snapshot `7`. 7.º conserva ruleset
  `0.4.0-grade-7`, contenido `0.9.0-grade-7` y catálogo `grade-7-dev-5`.
  `7.º → 1.º`: contenido `1.0.0-grade-1`, catálogo `grade-1-dev-1`.
  `7.º → 2.º`: contenido `2.0.0-grade-2`, catálogo `grade-2-dev-1`.
  `7.º → 3.º`: contenido `3.0.0-grade-3`, catálogo `grade-3-dev-1`.
  `7.º → 4.º`: contenido `4.0.0-grade-4`, catálogo `grade-4-dev-1`.
  `7.º → 5.º`: rulesets `5.0.0-grade-5-partial` y `5.0.0-grade-5-demo`, contenido
  `5.0.0-grade-5`, catálogo `grade-5-dev-1`. Score
  `fair-score-dev-2@2.0.0-post-tg1-candidate` sin cambios.
- Huellas: motor `c542afb3` —se movió con las dos respuestas nuevas—; ruleset
  `5b9b0bc5` y contenido `dbaf5094` del fixture de desarrollo intactos.
- Tests: 87 archivos y 1599 tests de Vitest; 136 E2E de Playwright en desktop y
  mobile, incluidos los recorridos de 1.º a 5.º y el barrido de accesibilidad
  del audit.
- Simulación: 5000 runs de 7.º, 5000 de `7.º → 1.º`, 2000 del demo amplio y 200
  de cada práctica parcial de 2.º a 5.º egresadas, 0 hallazgos, peor caso un
  Repaso por etapa.
- Composición: 2000 seeds de `7.º → 1.º` dan 2000 planes distintos, 0 inválidos
  y 0 diferencias al recomponer; `7.º → 5.º` compone doce beats ordinarios en
  las seis etapas y el validador independiente los acepta.

## Siguiente tarea canónica

```text
STAGE-08
PHASE 1 — DONE
POST-G1 SCALABILITY AUDIT — PASSED
2.º — DONE
3.º — DONE
4.º — DONE
5.º — DONE

Next:
Integrar la carrera completa: catálogo y composición oficiales, rareza,
Prestige, callbacks y epílogo, y cerrar D-S08-056 con el catálogo real
```

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

Ahora corresponde implementar 2.º → 3.º → 4.º → 5.º usando 1.º como referencia
validada, con auditorías más livianas por año y una verificación final de carrera
completa, y completar las capacidades narrativas/Prestige previstas. Antes de
componer la carrera oficial hay que volver a medir el costo de composición global
con el catálogo real. El exit gate de STAGE-08 sigue siendo recorrer
`7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESADO` con contenido auditado, sin
duplicar sistemas y verificando el target de pacing.

## Última reconciliación

14 de septiembre de 2026: ejecución del Post-Grade-1 Scalability Audit con
hardening resuelto, verificación completa en verde y 2.º–5.º desbloqueados.
Sin push.
