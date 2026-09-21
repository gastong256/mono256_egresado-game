# Etapa actual

Vista corta del estado de ejecución. El contrato completo y el protocolo de
actualización están en el [roadmap](implementation-sequence.md).

## STAGE-08 — Contenido incremental de 1.º a 5.º

**Estado:** `DONE` — 21 de septiembre de 2026. **Etapa actual: STAGE-09.**

Los gates que siguen abiertos son **humanos** y están fuera del alcance de
STAGE-08: pacing con jugadores reales, revisión del Departamento de Matemática y
sign-off manual de la rueda.

```text
STAGE-07                                      DONE
STAGE-08                                      DONE
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
    │   ├── Mathematics Remediation              DONE · 14/14 contratos PASS
    │   ├── Contract Conflict Adjudication       DONE · OQ-67 cerrada
    │   ├── RS-MAT-008 Blind Ceiling Adjudication DONE · OQ-66 cerrada
    │   ├── Remediación Ronda 1                  DONE · 14 contratos
    │   ├── Re-Auditoría Ronda 1                  FAILED · 13/14 + 3 hallazgos nuevos
    │   ├── Adjudicación post-re-audit            DONE · 10 hallazgos, 4 P0
    │   ├── Remediación Ronda 2 (dirigida)        DONE · cinco contratos verificados
    │   ├── Re-Auditoría Ronda 2                  FAILED · 5/5 contratos PASS, 3 hallazgos bloqueantes
    │   ├── Sprint de Cierre Matemático            DONE · MAT-RA2-001…005 cerrados
    │   ├── Final Mathematics Closure Audit        PASSED · con hallazgos no bloqueantes
    │   └── Provisional Sign-Off                  PASSED · MAT-FC-001/002/004 cerrados
    ├── Cierre de integración y ritmo          PASSED · ritmo medido, mediana ≈12,4 min
    ├── Revisión del Depto. de Matemática      DEFERRED · a Final Delivery / Pre-Release
    ├── Sign-off manual de la rueda            PENDING · humana
    └── Pacing empírico con jugadores          PENDING · humana

STAGE-09 · fair mode, servidor y ranking      NEXT
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
de 1.º a 5.º está en estado `draft`: faltan la auditoría final de cierre y su
sign-off provisional de IA, el sign-off manual de la rueda y el pacing empírico,
gates de producción de STAGE-08. La remediación matemática cerró sus catorce
contratos el 18 de septiembre —**ronda 1**—, y la **re-auditoría independiente** del
mismo día confirmó **trece de los catorce** —incluido el techo `K = 78` de la pantalla
del acto— pero **falló el gate** por tres hallazgos bloqueantes propios (D-S08-117).
La [adjudicación posterior](../04-quality/post-reaudit-mathematics-findings-adjudication.md)
cerró los diez hallazgos el mismo día y emitió el contrato de la **ronda 2**
(D-S08-122 a D-S08-126). La revisión del Departamento de Matemática humano no se
eliminó: está diferida a la entrega final (D-S08-095).

## Baseline autoritativa

STAGE-07 sigue `DONE`: toda run válida completada egresa, con un Repaso máximo
por etapa fuera del presupuesto ordinario y de FairScore.

- Versiones: engine `10.0.0`, action log `7`, snapshot `8`. 7.º conserva ruleset
  `0.4.0-grade-7`; contenido `0.12.0-grade-7` y catálogo `grade-7-dev-8` con 189
  entradas, con `dev-1` a `dev-7` publicados sin cambios.
  `7.º → 1.º`: contenido `1.3.0-grade-1`, catálogo `grade-1-dev-4` (363).
  `7.º → 2.º`: contenido `2.4.0-grade-2`, catálogo `grade-2-dev-5` (512).
  `7.º → 3.º`: contenido `3.4.0-grade-3`, catálogo `grade-3-dev-5` (686).
  `7.º → 4.º`: contenido `4.4.0-grade-4`, catálogo `grade-4-dev-5` (858).
  `7.º → 5.º`: rulesets `5.3.0-grade-5-partial` y `5.3.0-grade-5-demo`, contenido
  `5.5.0-grade-5`, catálogo `grade-5-dev-6` (1031). Carrera completa: ruleset
  `1.0.0-full-career` sobre ese mismo contenido y catálogo. Score
  `fair-score-dev-2@2.0.0-post-tg1-candidate` sin cambios. Los catálogos y
  contenidos subieron con el sprint de cierre; los rulesets permanecen iguales.
- Tests: 96 archivos y **1898 tests** de Vitest, **0 `todo`**; **174 E2E** de
  Playwright en desktop y mobile, incluidos los recorridos de 1.º a 5.º, la
  carrera completa y el barrido de accesibilidad del audit. Conteos medidos en
  tres `pnpm verify` consecutivos del sprint de cierre; la baseline de ronda 2 fue
  1883 tests y 174 E2E, y la histórica del re-audit, 1739 y 158.
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

La [implementación de la remediación](../04-quality/mathematics-remediation-implementation.md)
se ejecutó el 17 de septiembre y dio `MATHEMATICS REMEDIATION IMPLEMENTATION —
BLOCKED`. Doce de los catorce contratos quedaron implementados y verificados por
test: la auditoría permanente de estrategia ciega, el colectivo, la encuesta y su
Repaso, la tabla del Intercurso, la notebook, el año que viene, los Repasos
numéricos, el mural, el consejo, la peña y la ficha de 2.º. La muestra final bajó
de K 92,5 a 56,8 y ya no se resuelve repartiendo todo. Un
[inventario de feedback afirmativo](../04-quality/mathematics-remediation-feedback-inventory.md)
sobre las 42 Templates corrigió además seis textos falsos. Dos criterios quedaron
detenidos por STOP, porque contradicen otra regla del mismo contrato: toda la
pantalla del acto (RS-MAT-008, D-S08-105) y «recortar entre los planes óptimos» de
la muestra final (RS-NEW-001, D-S08-106). Ningún techo se relajó.

La [adjudicación de esos conflictos](../04-quality/mathematics-remediation-contract-conflict-adjudication.md) se ejecutó el mismo día.
Cerró la pregunta 67: el criterio 3 se reformuló sobre planes matemáticamente
válidos —«recortar» aparece en planes válidos y alcanza `efficient` en 25 de 25
variantes, y los óptimos siguen usando mantener y repartir—, sin tocar la escalera
y sin cambiar contenido, así que **RS-NEW-001 quedó PASS**. No cerró la 66: el
prototipo completo de la excepción de witness autorizada resuelve la contradicción
que la motivó, pero deja ver otra —«entera» nunca baja de `efficient` donde algún
recorte vale, así que `K = 75 + 25·w` y el piso demostrado es 78 contra un techo de
70—, de modo que RS-MAT-008 siguió detenido sin relajar el techo
(D-S08-113 y D-S08-114).

La [re-auditoría independiente](../04-quality/independent-mathematics-reaudit.md)
se ejecutó el 18 de septiembre y dio `INDEPENDENT MATHEMATICS RE-AUDIT — FAILED —
REMEDIATION REQUIRED`. Re-derivó la evidencia desde cero —reimplementó los
generadores y validó la materialización contra las **huellas SHA-256 publicadas**,
350 de 350— y **trece de los catorce contratos se sostienen**. El techo
`K = 78` de `y5.stage-screen` quedó **re-probado**, ahora con una demostración
deductiva: el witness estricto obliga a que «entera» use al menos tres cuartos de
pantalla donde algún recorte vale, así que `K = 75 + 25·w`, y la enumeración entera
de los 338 repartos factibles da mínimo exacto 78,000. La hipótesis contraria
—que el punto 10 permitiera dejar «entera» en `functional` y bajar el techo— se
probó **falsa** sobre 392 751 variantes admisibles.

El gate falló por lo que la instrumentación de la remediación **no podía ver**: su
auditoría permanente mide sólo tarjeta de decisión, clasificación y entrada
numérica, y deja fuera las **22** Templates de construcción, el 52 % del catálogo.
Ahí aparecieron `y3.course-project-tech` con una respuesta **constante** de
`K 95,83 · S 83 %` y `y4.course-project-fundraiser` con `K 92,80 · S 92 %`, las dos
puntuables, por encima de todo techo que la remediación fijó. El tercero es
`g7.bus-travel-review`: su detección de la concepción errónea usa un valor
absoluto, así que dispara también en el valor gemelo y le dice «faltaba sumarle el
viaje normal» a quien se pasó, en 26 de 26 variantes — y el inventario de feedback
lo había clasificado como probado verdadero. Diez hallazgos en total, tres
bloqueantes. **Nada de runtime, contenido, catálogos ni tests cambió en este
gate.**

La [adjudicación final del techo](../04-quality/rs-mat-008-blind-ceiling-final-adjudication.md) la cerró el 18 de septiembre:
el techo de la pantalla del acto pasó a ser ese mínimo probado, `K ≤ 78`, con la
excepción estrecha del witness conservada y sin tocar la escalera, FairScore ni la
validez geométrica. `y5.stage-screen` se reescribió con los dos elementos
protegidos y el catálogo de 5.º se republicó como `grade-5-dev-4`. Medido: K 78,0
· S 40 % · óptima repartida en cuatro formas · heurística de lado 48 %
(D-S08-116). **La remediación matemática quedó completa: 14 de 14 contratos.** FairScore, escalera, dificultad,
motor, action log, snapshot y ruleset de carrera no cambiaron; los catálogos se
republicaron una sola vez (D-S08-109).

## Adjudicación posterior a la re-auditoría

La [adjudicación de los hallazgos](../04-quality/post-reaudit-mathematics-findings-adjudication.md)
se ejecutó el 18 de septiembre y dio `COMPLETE · TARGETED REMEDIATION REQUIRED`. Los
diez hallazgos `MAT-RA` quedaron decididos: **cuatro bloquean** el sign-off provisional
—MAT-RA-001, 002, 003 y 006—, uno es técnico P1, dos se difieren a la revisión humana,
uno a STAGE-09 y dos se resolvieron documentalmente.

Revalidó la evidencia primaria de los tres bloqueantes y, en los dos atajos constantes,
encontró una **causa raíz más profunda** que la reportada, lo que cambia la forma de la
corrección:

- `y3.course-project-tech`: el generador sólo puede emitir **seis** objetivos, cuyo
  supremo `(5, 4, 6)` está muy dentro de los máximos `(10, 10, 12)`, así que un vector
  ≥ ese supremo cumple **todos** los objetivos posibles en **cualquier** catálogo del
  espacio. El exploit es estructural del generador: republicar no lo arregla.
- `y4.course-project-fundraiser`: el orden de los ítems por **margen por minuto de
  cocina** es idéntico en **25 de 25** variantes, así que el razonamiento económico
  correcto da siempre la misma respuesta. El atajo **es la heurística correcta
  congelada**, no ignorancia de la matemática.

Los techos se fijaron con **estudios de factibilidad**, no por analogía: `K ≤ 65 ·
S ≤ 35 %` para las dos, elegidos de modo que **ninguna corrección de una sola palanca
los cumpla** —en 3.º, ampliar objetivos da 88,33 y apretar topes da 83,33, pero juntas
dan 57,50; en 4.º, bajar el colchón deja 65,20 y rotar el orden da 40,00—. **No se creó
ningún techo universal:** la auditoría reporta, los contratos deciden.

MAT-RA-006 **subió de LOW a P0 y va primero**: sin la auditoría ampliada la ronda 2 no
puede demostrar que arregló nada, y el contrato exige reproducir los dos hallazgos sobre
el catálogo vigente **antes** de tocar contenido. El contrato completo está en la
[especificación de la ronda 2](../04-quality/post-reaudit-mathematics-remediation-spec.md).
**Nada de runtime, contenido, catálogos ni tests cambió en este gate.**

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

Mathematics Remediation Implementation — DONE
  14 de 14 contratos PASS
  STOP 1: RS-MAT-008 — RESUELTO: techo probado K ≤ 78 (D-S08-114, D-S08-116)
  STOP 2: RS-NEW-001 criterio 3 — RESUELTO por enmienda (D-S08-113)
Contract Conflict Adjudication — DONE
RS-MAT-008 Blind Ceiling Final Adjudication — DONE
Mathematics Remediation Round 1 — DONE (14 contratos)
Independent Mathematics Re-Audit Round 1 — FAILED — REMEDIATION REQUIRED
  13 de 14 contratos PASS · RS-NEW-003 FAIL (erratum D-S08-122)
  K = 78 de y5.stage-screen re-probado y correcto
  MAT-RA-001 HIGH   g7.bus-travel-review, feedback falso en 26/26
  MAT-RA-002 BLOCKER y3.course-project-tech, constante K 95,83 · S 83 %
  MAT-RA-003 BLOCKER y4.course-project-fundraiser, constante K 92,80 · S 92 %
Post-Re-Audit Findings Adjudication — DONE
  10 hallazgos adjudicados · 4 P0 bloqueantes
  RS-RA-AUDIT-001 · RS-RA-001 · RS-RA-002 · RS-RA-003 · RS-RA-TEST-001
Targeted Mathematics Remediation Round 2 — DONE (5 contratos, los 5 PASS)
AI Mathematics Department Provisional Sign-Off — PENDING

Human Mathematics Department Review
— DEFERRED TO FINAL DELIVERY / PRE-RELEASE

Real-player pacing validation — PENDING

Independent Mathematics Re-Audit Round 2 — FAILED — REMEDIATION REQUIRED
  los 5 contratos escritos verificados de forma independiente y en verde
  MAT-RA2-001 BLOCKER y3.course-project-tech, copiar el objetivo: K 100 / S 100 %
  MAT-RA2-002 BLOCKER y4.course-project-fundraiser, «menos minutos primero»: K 100 / S 100 %
  MAT-RA2-003 HIGH    la auditoría permanente no puede ver esa clase de estrategia
STAGE-08 Mathematics Final Closure Sprint — DONE
  RS-CLO-AUDIT-001 · RS-CLO-001 · RS-CLO-002 · RS-CLO-003
  taxonomía finita de ocho familias sobre las 42 Templates
  y3.course-project-tech  100/100 % → 47,00 / 4 %
  y4.course-project-fundraiser 100/100 % → 81,80 / 44 %
  g7.group-tasks K 100/100 % → K 45,00 / S 33,3 %
  y5.final-trip-or-event 100/100 % → 66,00 / 24 %
  y1.mobile-data 89,00/56 % → 86,00 / 44 %, aceptado con razón y techo propio
Final Mathematics Closure Audit — PASSED WITH NON-BLOCKING FINDINGS
  ninguna política de las ocho familias cruza el guardarraíl y desvía el constructo
  y3 · el atajo real es 81,80 / 44 %, no 47,00 / 4 %: constructo sin su último paso
  y4 · margen por minuto de cocina 100/100 % ACEPTADO, es la cuenta del año
  y1.mobile-data 86,00 / 44 % ACEPTADO, estructural: cualquier plan válido ya da 80,71
  MAT-FC-001/002 HIGH · defectos del instrumento, no del producto
  MAT-FC-003 MEDIUM · g7.group-tasks: 1–2 permutaciones factibles de 24
  MAT-FC-004/005 LOW · cifras del informe y población desbalanceada

AI Mathematics Department Provisional Sign-Off — PASSED
  MAT-FC-001 RESUELTO · identidad semántica de magnitudes en la auditoría
  y3.course-project-tech: el instrumento informaba 47,00 / 4 %; mide 79,40 / 40 %
  MAT-FC-002 ENDURECIDO · profundidad declarada y políticas por atributo
  10 EXHAUSTIVE_AND_ATTRIBUTE · 14 EXHAUSTIVE_ONLY · 14 ATTRIBUTE · 4 POSITIONAL
  g7.group-tasks: 90,00 / 83,3 % ahora se mide, y queda aceptado con piso medido
  MAT-FC-004 RESUELTO · tres cifras del sprint reconciliadas con errata
  MAT-FC-003 y MAT-FC-005 DIFERIDOS · revisión humana y backlog
  producto intacto: `git status --porcelain -- src/` vacío

STAGE-08 Final Integration & Pacing Closure — PASSED
  5000 carreras completadas y egresadas · 125 carreras medidas de punta a punta
  reanudación, recuperación pendiente y doble acción probadas contra el motor real
  once motores de interacción con confianza integrada · build de producción en verde
  ritmo medido por primera vez: mediana ≈12,4 min contra un objetivo de 8–10
  entra en banda a ~215 palabras/min: lo decide mirar jugar, no el modelo

Next:
STAGE-09 · fair mode, servidor autoritativo y ranking
(y los gates humanos de STAGE-08 que siguen abiertos)
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

## Sprint de cierre matemático

El [sprint de cierre](../04-quality/stage-08-mathematics-final-closure-sprint.md)
se ejecutó el 19 de septiembre y dio `DONE`. La ronda 2 había eliminado un
**vector**; este sprint elimina la **clase**. La auditoría permanente incorpora una
familia finita de ocho políticas de baja complejidad —constante, normalizada, copia
de pantalla, relativa al objetivo, relativa al recurso, prioridad fija, greedy
simple e ingenua de dominio—, genérica sobre la presentación, sin un solo
`templateId`, corrida sobre las **42** Templates en 1155–1306 ms.

`y3.course-project-tech` se rediseñó: lo prometido pasa de vector por ítem a
**total**, las tasas pasan a ser parámetro de la variante y los presupuestos dejan
de derivarse del costo de ninguna respuesta. Copiar la pantalla ya nunca supera
`functional`; el mejor atajo rinde 47,00 con 1 óptima de 25, y el razonamiento
buscado llega a `optimal` en 24 de 25.

`y4.course-project-fundraiser` se rediseñó por economía, no por etiqueta: seis
multisets `(margen, minutos)` distintos en vez de uno, objetivo calibrado contra el
**techo real** de la cocina —la causa raíz que la ronda 2 no vio, y por la que
repartir la cocina en partes iguales rendía 98,00 · 92 %— y gates de reparto ciego y
de selectividad. «Menos minutos primero» baja de 100/100 % a 81,80 · 44 %.

La auditoría ampliada hizo visibles tres atajos más, todos cerrados dentro del
sprint: `g7.group-tasks` pasó de dos equipos autorados a seis (K 100 → 45,00),
`y5.final-trip-or-event` ató los lugares de más a la posición y no al papel
(100/100 % → 66,00 · 24 %) y `y1.mobile-data` corrigió un paso de recorrido que
congelaba ejes (89,00 · 56 % → 86,00 · 44 %, aceptado con razón escrita y techo
propio más estricto que el global).

Seis catálogos republicados. Motor `10.0.0`, action log `7`, snapshot `8`,
rulesets y FairScore **sin cambios**; perfecto = 10 000 exacto; 5000 / 5000
egresadas; replay y servidor fail-closed contra las versiones nuevas. Tres
`pnpm verify` consecutivos en verde con 1898 tests y 174 E2E.

## Última reconciliación

21 de septiembre de 2026, al cierre: **cierre de integración y ritmo de
STAGE-08**. Veredicto `PASSED`, y con él **STAGE-08 queda `DONE`**. La carrera se
validó como un producto integrado y no como Templates sueltas: 5000 carreras
simuladas completan y egresan, 125 carreras se recorrieron de punta a punta para
medirlas, los once motores de interacción tienen confianza integrada, la
accesibilidad va de 320 a 1280 px con zoom 200 %, y los E2E corren contra el
build de producción. Se cubrió la superficie que estaba más floja: reanudar
devuelve el estado exacto, una obligación de recuperación sobrevive la recarga,
un checkpoint de otra versión o corrupto se descarta y se borra, y **responder
dos veces el mismo beat se rechaza sin duplicar acción, puntaje ni avance**. Y se
midió el **ritmo**, que era lo único que el exit gate pedía y nadie había hecho:
mediana ≈12,4 min contra el objetivo de 8–10 con p75 ≤12. El exceso es moderado y
uniforme; el veredicto depende de una constante de lectura sin calibrar —la
carrera entra en banda a ~215 palabras/min—, así que se entrega medido e
instrumentado (`pnpm game:pacing`) al gate humano de pacing, sin recortar copy a
ciegas contra un modelo y sin fabricar evidencia de jugadores. Se reconciliaron
además los dos objetivos de ritmo en conflicto: el 4–7 min es de cuando una run
era un año suelto. Producto matemático intacto. Siguiente etapa: **STAGE-09**.
Detalle en el
[cierre de integración y ritmo](stage-08-final-integration-pacing-closure.md).
Sin push.

21 de septiembre de 2026: **sign-off provisional del Departamento de Matemática
de IA**. Veredicto `PASSED`. Cerró los tres hallazgos acotados que la auditoría
final dejó abiertos, todos de instrumento o documentación y ninguno de producto.
**MAT-FC-001**: las magnitudes de la auditoría se identifican ahora por clave
semántica tipada —`min de notebook` no es `min de laboratorio`— y el tope espurio
que subestimaba `y3.course-project-tech` desapareció: el instrumento informaba
47,00 / 4 % y mide 79,40 / 40 %, la misma cifra que la auditoría había derivado
por su cuenta; radio de impacto, una sola Template. **MAT-FC-002**: cada política
declara si sale de las cifras de la variante o de la forma de la pantalla, cada
fila declara su profundidad —10 exhaustivas con atributo, 14 exhaustivas, 14 por
atributo, 4 posicionales dichas como tales— y los tableros de asignación, las
agendas y los planos ganaron políticas derivadas de lo que imprimen; con eso el
instrumento ve las dos políticas de `g7.group-tasks` que la auditoría había
medido sola, y `RS-CLO-001` dejó de pasar de forma vacua. Esa exposición quedó
declarada con el **piso estructural que el propio instrumento vuelve a medir**
—1 o 2 repartos factibles de 24, piso 82,00 · 70 %—, así que el contrato quedó
con más dientes, no con menos. **MAT-FC-004**: tres cifras del informe del sprint
reconciliadas con errata al pie, sin borrar lo que dijo. **MAT-FC-003** y
**MAT-FC-005** diferidos: tocarlos cambiaría contenido después de la auditoría
que lo aprobó. `src/` intacto; 97 archivos y **1914** Vitest en verde en las dos
corridas de `pnpm verify`, con 174 E2E en la segunda y 173 / 174 en la primera
por un flake de contraste bajo carga que quedó anotado como **MAT-SO-001** —no
lo causó este gate y volvió a verde solo, en la suite entera y en la corrida
completa—; auditoría 1 149,8–1 184,3 ms. Siguiente gate:
**STAGE-09**, con la revisión humana diferida. Detalle en el
[sign-off provisional](../04-quality/ai-mathematics-department-provisional-signoff.md).
Sin push.

20 de septiembre de 2026: **auditoría final de cierre matemático**. Veredicto
`PASSED WITH NON-BLOCKING FINDINGS`. Toda métrica se re-derivó fuera de la
instrumentación del implementador: evaluador propio contrastado contra producción
en 39 325 respuestas sin una sola discrepancia, economía de la peña recalculada
desde la pantalla, 89 622 respuestas de política sobre un motor corregido,
enumeración exhaustiva propia de los espacios de opción y asignación, FairScore
recomputado con racionales exactos y sonda de manipulación propia contra el
servidor. Ninguna Template puntuable admite una política de las ocho familias
congeladas que cruce el guardarraíl **y** desvíe materialmente el constructo;
`RS-MAT-008` sigue en `K 78,00 · S 40,0 %` con numerador 1950/25; 58 221 respuestas
de feedback verificadas sin una afirmación falsa; perfecto = 10 000 exacto;
5000/5000 egresadas; el servidor ignora el puntaje del cliente y rechaza cerrado
toda versión forjada. Cinco hallazgos nuevos, **ninguno bloqueante**: dos de ellos
—MAT-FC-001 y MAT-FC-002— son defectos del **instrumento**, que subestima
`y3.course-project-tech` en ~33 puntos y no evalúa políticas por atributo en los
motores de construcción. Producto intacto: no se remedió nada. Siguiente gate:
`AI MATHEMATICS DEPARTMENT PROVISIONAL SIGN-OFF`. Detalle en la
[auditoría final de cierre](../04-quality/final-mathematics-closure-audit.md).
Sin push.

19 de septiembre de 2026, al cierre: **sprint de cierre matemático de STAGE-08**.
Veredicto `DONE`. MAT-RA2-001 a MAT-RA2-005 cerrados; MAT-RA2-004 reclasificado
hacia arriba y arreglado. Ninguna Template puntuable admite hoy un atajo
reutilizable de baja complejidad con media ≥ 85 u `optimal` ≥ 80 %, salvo el
razonamiento buscado de la peña —declarado— y `y1.mobile-data` —aceptado con
evidencia y techo propio—. Siguiente gate: `FINAL MATHEMATICS CLOSURE AUDIT`, de
sólo lectura. Sin push.

19 de septiembre de 2026: **re-auditoría matemática independiente de la ronda 2**.
Veredicto `FAILED — REMEDIATION REQUIRED`. Los cinco contratos escritos se verificaron
desde afuera y **los cinco pasan** —RA-001 con las 3146 respuestas enumeradas, RA-002 en
K 35,8 / S 20 %, RA-003 en K 62,4 / S 28 %, la auditoría con 42 filas y la detección
genérica de la clase vieja probada sobre el catálogo anterior—. El gate falla igual: dos
Templates `anchor` puntuables admiten una estrategia reutilizable **más simple** que la
que la ronda 2 eliminó, con K 100 y S 100 % cada una, y la auditoría permanente no puede
detectar esa clase. Tres hallazgos bloqueantes nuevos, MAT-RA2-001 a MAT-RA2-003.
Producto intacto; siguiente gate, adjudicación. Detalle en la
[re-auditoría de ronda 2](../04-quality/independent-mathematics-reaudit-round-2.md).
Sin push.

18 de septiembre de 2026: ronda 2 dirigida DONE (D-S08-127/128), cinco contratos
verificados, seis catálogos republicados y tres verify consecutivos verdes.
Re-auditoría independiente ronda 2 NEXT; STAGE-08 IN_PROGRESS. Sin push.

18 de septiembre de 2026, al cierre: **adjudicación de los hallazgos posteriores a la
re-auditoría**. Veredicto `COMPLETE · TARGETED REMEDIATION REQUIRED`. Los diez
hallazgos decididos, cuatro bloqueantes con contrato ejecutable, causa raíz real de los
dos atajos constantes establecida y sus techos fijados por estudio de factibilidad.
Erratum canónico: el resultado contractual de la re-auditoría es **13 / 14**, no 14 / 14.
Cuatro errata más aplicadas —techo a `N = 25`, «ninguna medición de estrategia ciega» de
RS-MAT-011, la clase del inventario de feedback y la política de retención de catálogos
de ADR-021—. Sólo documentación: ningún archivo de producto cambió. Sin push.

18 de septiembre de 2026, más tarde: **re-auditoría matemática independiente**.
Veredicto `FAILED — REMEDIATION REQUIRED`. Trece de los catorce contratos
verificados de forma independiente; `K = 78` de la pantalla del acto re-probado y
correcto, y mínimo al tamaño del catálogo publicado. Tres hallazgos bloqueantes
—MAT-RA-001 en `g7.bus-travel-review`, MAT-RA-002 en `y3.course-project-tech` y
MAT-RA-003 en `y4.course-project-fundraiser`— más siete no bloqueantes, entre
ellos la clasificación de `g7.bus-timing` (`K 84,62`) como hallazgo de validez de
evaluación no bloqueante y el punto ciego del 52 % del catálogo en la auditoría
permanente. Sólo documentación: ningún archivo de producto cambió. Sin push.

18 de septiembre de 2026: adjudicación final del techo de estrategia ciega de
`y5.stage-screen` y cierre de la remediación matemática en **14 de 14 contratos**.
El techo `K ≤ 70` era imposible; el mínimo factible, probado por enumeración
exhaustiva y alcanzado por el catálogo publicado, es `K ≤ 78`. La Template se
reescribió con dos elementos protegidos, seis formas y geometría exacta en
enteros, y 5.º se republicó como `grade-5-dev-4` / `5.3.0-grade-5` (D-S08-116).
Sin push.

17 de septiembre de 2026, más tarde: adjudicación de los dos conflictos de
contrato. La pregunta 67 se cerró reformulando el criterio 3 de RS-NEW-001 sobre
planes válidos —el catálogo vigente ya lo cumple— y RS-NEW-001 quedó PASS. La
pregunta 66 no se cerró ese día: el prototipo de la excepción de witness
autorizada —2.826.450 direcciones barridas— probó que resuelve la contradicción del
witness pero deja el techo `K ≤ 70` inalcanzable, con piso demostrado de 78
(D-S08-113, D-S08-114). Sin push.

17 de septiembre de 2026: implementación de la remediación matemática —doce de
catorce contratos, auditoría permanente de estrategia ciega, inventario de
feedback afirmativo y republicación de los seis catálogos— con veredicto
`BLOCKED` por dos STOP que requieren decisión (D-S08-104 a D-S08-111). Sin push.

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

## Remediación dirigida de ronda 2 · verificación de cierre

Los cinco contratos están implementados y los tres `pnpm verify` consecutivos
exigidos por RS-RA-TEST-001 terminaron en PASS. La evidencia y la matriz de 42 Templates
están en el [informe](../04-quality/targeted-post-reaudit-mathematics-remediation.md).
Las decisiones de riesgo H-6/H-7, OQ-66/67 cerradas y R-S09-CAT siguen vigentes.
