# Implementación de la remediación matemática

- **Estado:** `EXECUTED` — 2026-09-17, sobre `main` en `326ab36`
- **Gate:** `MATHEMATICS REMEDIATION IMPLEMENTATION`
- **Contrato:** [especificación de remediación](mathematics-remediation-spec.md), canónica
- **Veredicto:** `MATHEMATICS REMEDIATION IMPLEMENTATION — BLOCKED`
  (`MATHEMATICS REMEDIATION BLOCKED — CONTRACT CONFLICT` en dos criterios)
- **Siguiente gate:** `Independent Mathematics Re-Audit`, **no habilitado** hasta
  que se resuelvan los dos puntos de decisión de la sección
  [H](#h-stop-registrados)
- **Naturaleza:** implementación. No es re-auditoría ni sign-off: ningún contenido
  pasa a `math_reviewed` y la revisión del Departamento de Matemática humano sigue
  diferida a Final Delivery / Pre-Release Acceptance (D-S08-095)

## A. Veredicto

`MATHEMATICS REMEDIATION IMPLEMENTATION — BLOCKED`.

De los catorce contratos, **doce se implementaron completos** y verificados por
test. Dos quedaron detenidos por la regla de STOP (2.11), porque un criterio es
imposible de cumplir sin violar otra regla del mismo contrato:

| STOP | Contrato | Criterio imposible | Regla con la que choca | Estado del paquete |
|---|---|---|---|---|
| 1 | RS-MAT-008 · `y5.stage-screen` | Puntos 4, 7, 8 y 9, y los techos K ≤ 70 · S ≤ 40 % | Regla 2.6: witness de los tres niveles no inválidos por variante (`tierWitnessIssues`) | **No implementado.** La Template queda como estaba, salvo un texto falso de feedback corregido por el inventario |
| 2 | RS-NEW-001 · `y5.course-project-final` | Criterio 3: «recortar» entre los planes óptimos | La escalera de la Template, que el mismo contrato prohíbe cambiar | Criterios 1, 2 y 4 y los techos, **cumplidos**; el 3, bloqueado |

Ningún techo se relajó. Los dos tests que corresponderían quedaron como `it.todo`
con el STOP nombrado, no como afirmaciones más débiles.

Lo que la implementación **sí** deja resuelto:

- la auditoría permanente de estrategia ciega, con la línea de base de la
  adjudicación reproducida exactamente;
- las dos claves únicas de 2.º —el Repaso del denominador, antes K 100 · S 100 %,
  y la encuesta, antes K 66,4 · S 56 %— y la regla de publicación visible;
- el colectivo con precios independientes del rango y las cuatro formas de pagar
  óptimas;
- la tabla del Intercurso con pendientes realizables, el gate de modelo del
  torneo y la semántica estricta de empate;
- la respuesta constante de la muestra final (K 92,5 → 56,8);
- el feedback falso de la notebook, de los seis Repasos numéricos y de seis textos
  más encontrados por el inventario;
- el reparto 2 L / 4 L del mural, la abstención del consejo escolar, el guardrail
  vocacional del año que viene y la consigna de la peña.

FairScore, escalera, dificultad, bandas, pacing, placement, clusters, arcos,
motor, action log, snapshot y ruleset de la carrera completa **no cambiaron**.

## B. Baseline

Medida antes de tocar contenido, en un worktree limpio de `326ab36` con su propia
instalación.

| Dato | Valor |
|---|---|
| Versiones | engine `10.0.0` · action log `7` · snapshot `8` · carrera completa `1.0.0-full-career` · contenido `5.1.0-grade-5` · catálogo `grade-5-dev-2` |
| Huellas | motor `4bcf054e` · ruleset de carrera `7d41fddb` · contenido de carrera `e2c61b62` |
| `pnpm verify` | exit 0 en 6 min 31 s |
| Vitest | 93 archivos · 1663 tests · cobertura 85,05 / 76,53 / 87,01 / 85,17 |
| Playwright | 146 E2E |
| Catálogos | 7.º 185 · 1.º 359 · 2.º 508 · 3.º 681 · 4.º 854 · 5.º 1025 · integridad ok |
| `game:simulate:deep` | 5000 / 5000 egresadas · 0 hallazgos |
| `game:score` | perfecta = 10 000 en todas las poblaciones |

## C. WP-AUDIT — auditoría permanente de estrategia ciega

- `tests/helpers/blind-strategy.ts` materializa cada variante aprobada con
  `materializeVariant` y evalúa **con el evaluador real** cada respuesta del
  espacio finito: opciones de tarjeta y línea de tiempo, clasificaciones de hasta
  50.000 respuestas —con la postura pública fija y un chequeo de que la postura
  nunca cambia Math— y entradas numéricas de hasta 5000 valores enteros.
- Calcula R, K y S por identificador o, cuando los identificadores cambian entre
  variantes, por posición, y los niveles alcanzables por variante.
- `tests/integration/blind-strategy-audit.test.ts` afirma los techos de la
  sección 3 sobre el catálogo vigente de carrera completa y que las posturas no
  filtran calidad (0 fugas en todas las Templates).
- `pnpm game:blind-audit` imprime la tabla; con `--keys`, también las respuestas
  K y S.

**Medición inicial.** Sobre `grade-5-dev-2` reprodujo los valores de referencia de
la adjudicación: transporte K 78,0 · R 56,3 · S 40 %; Repaso del denominador
K 100 · S 100 %; encuesta K 66,4 · S 56 %; tabla K 80,0 · S 56 %; pantalla K 75,0 ·
S 52 %; muestra final K 92,5 · S 91,7 %; año que viene K 76,5 · S 70,8 %; consejo
K 58,2; mural K 76,9 · S 61,5 %. No hubo STOP por herramienta.

La auditoría es **medición, no oráculo**: el re-audit debe repetir la enumeración
con herramientas propias.

## D. Estado por paquete de trabajo

| Orden | Paquete | Estado | Resumen |
|---|---|---|---|
| 1 | WP-AUDIT | DONE | Sección C |
| 2 | WP-TRANSPORT | DONE | Precios del mes y de la ciudad; forma `pocos-viajes`; generación dirigida por papel |
| 3 | WP-SURVEY | DONE | Regla de publicación como constante única; `year-prefers` por cota de peor caso; cuatro formas; Repaso con tres vectores |
| 4 | WP-SCREEN | **BLOCKED — STOP 1** | Sin cambios de regla; sólo el texto del lado del cartel |
| 5 | WP-FINAL | **PARTIAL — STOP 2** | Criterios 1, 2, 4 y techos; criterio 3 bloqueado |
| 6 | WP-NOTEBOOK | DONE | Feedback de acierto calculado |
| 7 | WP-STANDINGS | DONE | Realizabilidad, gate de modelo, empate estricto, discriminación |
| 8 | WP-NEXT | DONE | Horas con viaje incluido, viabilidad 25–75 % por escenario, motivos repartidos, «mié» |
| 9 | WP-REVIEWS | DONE | Seis Repasos con dirección por signo, incluido uno que el inventario agregó |
| 10 | WP-MURAL | DONE | Gate de balance por dirección; generador y evaluador sin cambios |
| 11 | WP-COUNCIL | DONE | Dos viables por variante; consecuencia sin presentación |
| 12 | WP-FUNDRAISER | DONE | Tres condiciones en orden, equilibrio explicado, supuesto de venta |
| 13 | WP-CATALOGS | DONE | Seis catálogos republicados una sola vez (sección J) |
| 14 | WP-DOCS | DONE | Ficha de 2.º reescrita contra el código y fichas afectadas (sección O) |

**Mecanismo común.** Varios contratos piden distribuciones sobre el catálogo —cada
opción óptima en al menos 3 variantes, ninguna clave en más del 35 %—, y el
pipeline aprueba las primeras direcciones que pasan los gates. Filtrar después
habría sido frágil, así que `generatedSource` aceptó un gate opcional por
dirección, `addressGates(params, index)`: cada dirección tiene un **papel** —qué
opción debe ser la óptima, qué vector de verdad o qué forma—, el generador busca de
forma determinista parámetros que lo jueguen y el gate de dirección lo comprueba.
Se usa en el colectivo, la encuesta, el Repaso del denominador, la tabla y la
muestra final. `y5.next-step-options` construye cada papel directamente. No es un
motor nuevo ni cambia la forma del catálogo: sólo decide qué direcciones se
aprueban.

## E. Matriz de evidencia por contrato

Tests en `tests/`. «Catálogo» = cada catálogo publicado que contiene la Template:
se comprobó que las variantes de cada Template son **idénticas** en todos ellos, así
que un criterio medido en uno vale para todos.

### RS-MAT-001 — `y3.transport-pass` · DONE

| Criterio | Evidencia | Medición |
|---|---|---|
| 1. Precios independientes del rango | `unit/grade-3-transport-pass` · «ningún precio depende de los viajes del mes»: 4000 direcciones agrupadas por ejes de precio | forma y precios en ejes separados; `PASS_TRIPS × tarifa` no lee `high` |
| 2. Mes de pocos viajes con el suelto óptimo | «existe un mes de pocos viajes…» | `pocos-viajes` en 8 de 25 |
| 3. Cada opción óptima en ≥ 3 y ≤ 40 % | «cada forma de pago es la óptima…» y auditoría | suelto 7 · recargable 6 · combo 6 · abono 6 |
| 4. ≥ 30 % con cambio a ≤ 3 viajes de `likely` | «en al menos el 30 %…» | 15 de 25 (60 %) |
| 5. Diferencia ≥ max($100; 2 %) | «la más barata le saca a la segunda…» | mínima $100 |
| 6. Regla en pantalla | «la pantalla dice que se decide con los viajes del mes pasado»; E2E 320 / 412 px | — |
| 7. Dirección del feedback `efficient` | «el feedback de una apuesta dice hacia dónde…», en toda opción `efficient` de toda variante | — |
| 8. Gates `LOCKED` | «LOCKED: la conveniencia cambia…», «la elección equivocada cuesta más…», oráculo | — |
| Techos K ≤ R + 10, S ≤ 40 % | `integration/blind-strategy-audit` | K 64,2 ≤ 66,3 · S 28 % |
| Reglas alternativas | «peor caso y costo medio nunca eligen la inválida» | peor caso: 8 óptima, 17 efficient · costo medio: 23 óptima, 2 efficient |

Formas publicadas: `mes-corto` 7, `pocos-viajes` 8, `arranque` 5, `con-salidas` 3,
`mes-completo` 2. La sexta forma del espacio no quedó entre las 25 primeras
aprobadas; el contrato no pide formas mínimas.

### RS-MAT-002 — `y2.data-claim-review` · DONE

| Criterio | Evidencia | Medición |
|---|---|---|
| 1–2. Tres vectores, TF 40–60 %, TT y FF ≥ 15 % | `unit/grade-2-survey` · «el catálogo trae los tres casos posibles…» | TF 13 (52 %) · TT 6 (24 %) · FF 6 (24 %) |
| 3. Nunca en la mitad exacta | «ninguna variante pone la cifra exactamente en la mitad» | — |
| 4–5. Control siempre falso; pantalla conservada | «aísla el concepto…» | tres afirmaciones, dos etiquetas |
| Oráculo y `functional` en TT | «las 8 clasificaciones coinciden con un oráculo independiente…» | `functional` alcanzable en las 6 TT |
| Techos K ≤ 75, S ≤ 60 % | auditoría | K 72,6 · S 52 % |

### RS-MAT-003 — `y2.course-project-survey`, criterio visible · DONE

| Criterio | Evidencia |
|---|---|
| 1. «Entre quienes contestaron» | «la afirmación del margen está acotada a quienes contestaron…» |
| 2. Regla declarada en pantalla | `PUBLICATION_RULE_TEXT`: «le saca más de 1 de cada 10 respuestas», en las instrucciones |
| 3. Misma constante en pantalla, evaluador y oráculo | «pantalla, evaluador y oráculo leen la misma regla» |
| 4. Ninguna variante a una respuesta del borde | «ninguna variante queda a una respuesta del borde»; gate en `surveyGates` |
| 5. Forma `margin` con líder sin la regla | «el contraste de denominador sigue… y la trampa del margen existe»; 5 variantes `margin` |
| 6. Tres trampas conservadas | formas `denominator`, `missing-data`, `margin` |
| Prohibido: vocabulario inferencial | «la consigna no usa vocabulario inferencial ni criterios ocultos» |

### RS-MAT-004 — `y2.course-project-survey`, variedad de claves · DONE

| Criterio | Evidencia | Medición |
|---|---|---|
| 1. `year-prefers` por cota de peor caso, sin igualdad | «“el nivel entero prefiere” se decide con la cota de peor caso…» | cierta en 5 de 25 |
| 2. `half-of-year` calculado | oráculo de las 64 clasificaciones | — |
| 3. ≥ 4 afirmaciones con los dos valores | «al menos cuatro afirmaciones varían…» | varían `half-of-answers` 15, `year-prefers` 5, `beats-runner-up` 20, `least-chosen` 13 |
| 4. ≥ 4 claves óptimas | ídem | 7 claves |
| 5. Ninguna forma con clave única | «ninguna forma semántica determina la clave» | cada forma, 2 o 3 claves |
| 6. Contraste de denominador ≥ 50 % | «el contraste de denominador sigue en al menos la mitad…» | 15 de 25 (60 %) |
| 7. La opción publicada es la más elegida | «la opción que el curso publica es siempre la más elegida…» | — |
| 8. ≥ 2 ciertas y ≥ 2 que no | ídem | — |
| Techos K ≤ 60, S ≤ 35 % | auditoría | K 52,8 · S 32 % |

### RS-MAT-005 — `y2.standings-claim` · DONE

| Criterio | Evidencia | Medición |
|---|---|---|
| 1. Pendientes realizables | `unit/grade-2-standings` · «los partidos que faltan se juegan entre estos cuatro cursos» | suma par, ningún curso con más que los otros tres |
| 2. Gate de modelo bajo todo fixture y resultado | «pensar cada curso por separado da lo mismo que el torneo entero, bajo todo fixture»: enumera fixtures y resultados con un oráculo de torneo propio | — |
| 3. Consigna | «la consigna dice contra quién se juega y que no hay empates de partido» | — |
| 4. Empate estricto y gate de lectura del empate | «terminar arriba es estricto, y ninguna tabla publicada depende de cómo se lea un empate», con casos límite construidos | — |
| 5. Ninguna afirmación con la misma categoría en > 70 % | «ninguna afirmación tiene la misma categoría en más del 70 %» | máximos: 17, 14, 15 y 12 de 25 |
| 6. Posturas, Aura y separación | «LOCKED · la postura no cambia la calidad matemática…», «Aura entra a FairScore por su propio canal…» | — |
| 7. Cotas por curso bastan | sin fixture en pantalla; el gate 2 lo garantiza | — |
| Techos K ≤ 65, S ≤ 35 % | auditoría | K 56,6 · S 20 % |

### RS-MAT-006 — `g7.mural-paint` · DONE

| Criterio | Evidencia | Medición |
|---|---|---|
| 1. 2 L y 4 L entre 45 % y 55 % en cada catálogo | `integration/mathematics-remediation` · RS-MAT-006, en `grade-7-dev-6` y en los cinco catálogos de 1.º a 5.º | 14 / 26 y 12 / 26 (53,8 % · 46,2 %) |
| 2. Por gate de catálogo | `validateMuralBalance` en los validadores de variantes; generador, precios, consigna y evaluador sin cambios | — |
| K reportado | auditoría | K 67,7 (≤ 73) · S 53,8 % |

`grade-7-dev-5` sigue publicado y sin cambios (test «grade-7-dev-5 queda publicado
tal como estaba»).

### RS-MAT-007 — `y4.represent-class` · DONE

| Criterio | Evidencia | Medición |
|---|---|---|
| 1. ≥ 2 viables por variante | RS-MAT-007 · «toda variante publicada tiene al menos dos propuestas viables» | 2 viables en 19, 3 en 5 |
| 2. Todo «No entra» nunca `efficient` | ídem y auditoría | siempre `functional` |
| 3. Consecuencia sin presentación | «…la consecuencia no narra una presentación» | — |
| 4. Gates y witness de Aura | gates existentes en verde | — |
| K | auditoría | 58,2 → 59,6; la mejor constante ya no es la abstención |

El consejo publica 24 variantes en vez de 25: el gate de dos viables rechaza
direcciones que antes se aprobaban.

### RS-MAT-008 — `y5.stage-screen` · BLOCKED

Ver [STOP 1](#stop-1-rs-mat-008-y5stage-screen). Ningún punto implementado; los
techos quedan como `it.todo`. Medición vigente: K 75,0 · S 52 %.

### RS-MAT-009 — `y5.next-step-options` · DONE

| Criterio | Evidencia | Medición |
|---|---|---|
| 1. Horas con viaje incluido, dicho en pantalla | RS-MAT-009 · «las horas incluyen el viaje…»; gate `horas × 60 ≥ días × (viaje + 60)` | — |
| 2. Cada escenario viable 25–75 % | «cada escenario entra en al menos el 25 %…» | facultad 13 · terciario 16 · trabajo 12 · oficio 15 · mixto 12, de 25 |
| 3. Opción de estudio viable ≥ 50 % | MAT-AJ-NEW-007 · «alguna opción de estudio…» | 22 de 25 (88 %) |
| 4. Ningún motivo > 60 % | «lo que deja afuera a cada opción de estudio se reparte…» | facultad 4 · 4 · 4; terciario 3 · 3 · 3 |
| 5. Gates de dos viables y dos motivos | gates conservados | — |
| 6. «mié» | «…no `mie`» | — |
| 7. Preferencia sin puntuar | «la preferencia sigue sin puntuar» | — |
| Techos K ≤ 65, S ≤ 35 % | auditoría | K 40,0 · S 16 % |

### RS-MAT-011 — `y4.course-project-fundraiser` · DONE

| Criterio | Evidencia |
|---|---|
| 1. Tres condiciones en orden | RS-MAT-011 · «nombra las tres condiciones en orden…» (índices crecientes en la consigna) |
| 2. Punto de equilibrio con significado | ídem: «que lo que dejan las bandejas vendidas alcance para pagar el costo fijo» |
| 3. Todo lo que se prepara se vende | ídem; E2E 320 / 412 px |
| 4. Sin contradicción | la instrucción del costo fijo habla de bandejas **vendidas** |
| Catálogo sin cambio en la peña | evaluador, parámetros y gates sin cambios; las entradas de la peña son las mismas direcciones |

### RS-NEW-001 — `y5.course-project-final` · PARTIAL (STOP 2)

| Criterio | Evidencia | Medición |
|---|---|---|
| 1. Repartir todo óptimo ≤ 30 % | RS-NEW-001 · «repartir todo es óptimo en a lo sumo el 30 %» | 0 de 25 |
| 2. Repartir parejo sobrecarga en la mayoría | «…le da a alguien más horas de las que tiene» | 25 de 25 |
| 3. Mantener, repartir y recortar entre óptimos | **BLOCKED** — `it.todo`; test de la imposibilidad | óptimos: {mantener, repartir}; válidos: las tres |
| 4. Gates actuales | witness de Math óptima con Equipo 3 y los demás gates en verde; `style-audit` y `full-career` en verde | — |
| Techos K ≤ 65, S ≤ 35 % | auditoría | K 56,8 · S 28 % |

### RS-NEW-002 — `g7.notebook-offer` · DONE

| Criterio | Evidencia |
|---|---|
| 1. Texto de acierto verdadero | RS-NEW-002 · en toda variante publicada de 7.º, el texto nombra el descuento que de verdad era mayor, calculado con `discountComparison` |
| 2. Resto del feedback en el inventario | [inventario](mathematics-remediation-feedback-inventory.md) |
| Sin cambios de decisión ni catálogo | población de la notebook igual en `grade-7-dev-6` |

### RS-NEW-003 — Repasos numéricos · DONE

| Criterio | Evidencia |
|---|---|
| 1. Dirección = signo de `respuesta − exacta` en todo el rango y toda variante | RS-NEW-003 · un test por Repaso: `y3.fixed-variable-review`, `y4.margin-review`, `y3.rate-capacity-review`, `y4.spatial-capacity-review`, `y5.proportion-capacity-review` y, por el inventario, `y5.multi-option-comparison-review` alrededor del total exacto y del error de sumar el micro una vez |
| 2. Error con nombre propio conservado | niveles y `violatedConstraint` sin cambios; tests de nivel existentes en verde |

### RS-NEW-006 — Ficha de 2.º · DONE

La tabla de implementación de la [ficha de 2.º](../01-game-design/grade-2-template-design.md#implementación-runtime)
se reescribió contra el código: formas reales de la encuesta, regla de
publicación, cálculo de `year-prefers`, las tres afirmaciones del Repaso, sus
vectores y niveles alcanzables, y la tabla con su gate de modelo. Validación del
workspace y sincronización de la especificación maestra en la sección N.

## F. Estrategia ciega antes y después

`pnpm game:blind-audit`. Antes: `grade-5-dev-2` · `5.1.0-grade-5`. Después:
`grade-5-dev-3` · `5.2.0-grade-5`. Todas las Templates enumerables.

| Template | Motor | Var. antes → después | R antes → después | K antes → después | S antes → después | Techo |
|---|---|---|---|---|---|---|
| `g7.bus-latest-departure` | numeric-input | 26 → 26 | 32,4 → 32,4 | 53,5 → 53,5 | 19,2 % → 19,2 % | — |
| `g7.bus-timing` | timeline (posición) | 26 → 26 | 48,6 → 48,6 | 84,6 → 84,6 | 57,7 % → 57,7 % | — (sección M) |
| `g7.bus-travel-review` | numeric-input | 26 → 26 | 13,4 → 13,4 | 29,6 → 29,6 | 11,5 % → 11,5 % | — |
| `g7.mural-paint` | decision-card | 26 → 26 | 43,8 → 45,4 | 76,9 → **67,7** | 61,5 % → 53,8 % | K ≤ 73 ✓ |
| `g7.notebook-offer` | decision-card | 26 → 26 | 55,0 → 55,0 | 58,5 → 58,5 | 53,8 % → 53,8 % | — |
| `y2.course-project-survey` | classification | 25 → 25 | 17,7 → 17,2 | 66,4 → **52,8** | 56,0 % → **32,0 %** | K ≤ 60 · S ≤ 35 % ✓ |
| `y2.data-claim-review` | classification | 25 → 25 | 29,4 → 30,3 | 100,0 → **72,6** | 100,0 % → **52,0 %** | K ≤ 75 · S ≤ 60 % ✓ |
| `y2.standings-claim` | classification | 25 → 25 | 20,4 → 19,6 | 80,0 → **56,6** | 56,0 % → **20,0 %** | K ≤ 65 · S ≤ 35 % ✓ |
| `y3.fixed-variable-review` | numeric-input | 25 → 25 | 11,9 → 11,9 | 24,4 → 24,4 | 16,0 % → 16,0 % | — |
| `y3.rate-capacity-review` | numeric-input | 25 → 25 | 11,8 → 11,8 | 40,8 → 40,8 | 20,0 % → 20,0 % | — |
| `y3.transport-pass` | decision-card | 25 → 25 | 56,3 → 56,3 | 78,0 → **64,2** | 40,0 % → **28,0 %** | K ≤ R + 10 · S ≤ 40 % ✓ |
| `y4.margin-review` | numeric-input | 25 → 25 | 12,4 → 12,4 | 49,8 → 49,8 | 40,0 % → 40,0 % | — |
| `y4.represent-class` | classification | 25 → 24 | 16,5 → 18,8 | 58,2 → 59,6 | 16,0 % → 29,2 % | abstención nunca ≥ efficient ✓ |
| `y4.spatial-capacity-review` | numeric-input | 25 → 25 | 12,8 → 12,8 | 41,4 → 41,4 | 20,0 % → 20,0 % | — |
| `y5.course-project-final` | classification | 24 → 25 | 17,5 → 14,0 | 92,5 → **56,8** | 91,7 % → **28,0 %** | K ≤ 65 · S ≤ 35 % ✓ |
| `y5.final-trip-or-event` | decision-card | 25 → 25 | 56,3 → 56,3 | 59,4 → 59,4 | 28,0 % → 28,0 % | — |
| `y5.next-step-options` | classification | 24 → 25 | 18,0 → 21,3 | 76,5 → **40,0** | 70,8 % → **16,0 %** | K ≤ 65 · S ≤ 35 % ✓ |
| `y5.proportion-capacity-review` | numeric-input | 23 → 23 | 11,8 → 11,8 | 34,1 → 34,1 | 13,0 % → 13,0 % | — |
| `y5.stage-screen` | decision-card | 25 → 25 | 40,8 → 40,8 | 75,0 → 75,0 | 52,0 % → 52,0 % | K ≤ 70 · S ≤ 40 % **BLOCKED** |

No enumerables: las Templates de construcción (`assignment-board`, `number-grid`,
`budget-builder`, `spatial-layout`, `quantity-builder`, `schedule-builder`,
`route-builder`) y `y5.multi-option-comparison-review`, cuyo rango numérico tiene
10.000.000 valores. Sus respuestas ingenuas quedan para el re-audit (sección 7 de
la especificación).

Las mejores respuestas constantes cambiaron de sentido: en la muestra final la K ya
no es «repartir todo»; en el año que viene es marcar todo «No entra», que rinde 40;
en el consejo, la abstención total dejó de ser la mejor constante.

## G. Inventario de feedback afirmativo

[Inventario completo](mathematics-remediation-feedback-inventory.md): 136
asignaciones extraídas del código con el AST; cada texto que afirma una
comparación, una dirección o una causa quedó **probado (A)** o **calculado (B)**.
Además de los contratos RS-NEW-002 y RS-NEW-003, el inventario encontró y corrigió
seis textos falsos:

| Template | Qué afirmaba mal |
|---|---|
| `y2.court-zones` | «lo más separadas que permite la cancha» en 17 de 25 variantes donde la cancha permitía más |
| `y4.school-event-flow` | que no entraba ninguna de las N personas, y la misma frase al repartir ayudantes que no hay |
| `y1.classroom-layout` | «cerró justo» con una celda de sobra |
| `y5.final-trip-or-event` | sólo «el micro» cuando faltaban el micro y las comidas |
| `y5.stage-screen` | «el recorte de arriba» con el cartel abajo |
| `g7.bus-timing` | «cualquier demora extra te dejaba afuera» con 1 a 4 min de margen, en 18 de 21 opciones funcionales |

Y extendió RS-NEW-003 a `y5.multi-option-comparison-review`, con el mismo patrón.

## H. STOP registrados

### STOP 1 — RS-MAT-008 · `y5.stage-screen`

`MATHEMATICS REMEDIATION BLOCKED — CONTRACT CONFLICT`

- **Paquete:** WP-SCREEN.
- **Contrato:** RS-MAT-008.
- **Criterios imposibles:** punto 4 (imagen entera óptima cuando ningún recorte
  vale), punto 7 (ninguna óptima en más del 40 %), punto 8 (ninguna opción salvo
  estirar con nivel constante) y punto 9 (heurística de lado ≤ 50 %), y con ellos
  los techos K ≤ 70 · S ≤ 40 % de la sección 3.
- **Regla con la que chocan:** regla 2.6, «witness por nivel
  (`tierWitnessIssues`)», que exige en **cada** variante un plan `optimal`, uno
  `efficient` y uno `functional`.

**Demostración.** Con la escalera del punto 4 y las seis opciones del punto 2:

1. Los tres recortes llenan el ancho y recortan lo que sobra del alto, así que
   muestran **el mismo rectángulo**: usan la misma pantalla. Si dos recortes son
   válidos, empatan en el óptimo y el gate de óptima única (punto 4) rechaza la
   variante. Toda variante aprobada tiene **cero o un** recorte válido.
2. **Sin recorte válido:** las válidas son «entera» y «sin agrandar» —estirar es
   siempre inválida—. Hay como mucho dos niveles no inválidos y
   `tierWitnessIssues` falla. Entonces la regla 2.6 **prohíbe toda variante con la
   imagen entera óptima**, que es justo lo que el punto 4 autoriza.
3. **Con un recorte válido:** las válidas son ese recorte (óptimo), «entera» y «sin
   agrandar». Para tener `efficient` y `functional`, como «entera» agranda hasta el
   borde y nunca usa menos pantalla que «sin agrandar», «entera» tiene que ser
   `efficient` y «sin agrandar» `functional` **en toda variante**. «Entera» queda con
   nivel constante: **viola el punto 8**.
4. **Heurística de lado.** Si el único recorte válido es de un lado X, recortar todo
   de X cabe en el aire de X y no cabe en el de Y: X tiene más aire, y la heurística
   «recortar todo del lado con más aire» acierta. Sólo falla cuando el óptimo es
   recortar por el medio. Como «entera» nunca es óptima (paso 2), la heurística
   acierta exactamente en las variantes de recorte de un lado. El punto 9 (≤ 50 %)
   exige entonces recorte por el medio óptimo en **al menos el 50 %**, y el punto 7
   exige **a lo sumo el 40 %**. Contradicción.

**Evidencia medida.** Se construyó un prototipo completo —dos elementos protegidos
con alto y aire propios, seis opciones con el lado del recorte en la etiqueta,
validez exacta con fracciones, escalera del punto 4, papeles en un ciclo de diez
con la óptima y el nivel de «entera»— y se barrió con el generador:

| Medición | Valor |
|---|---|
| Variantes candidatas con «entera» óptima | 854 |
| De ellas, con los tres niveles no inválidos | **0** |
| Aprobaciones del prototipo con el ciclo de papeles del contrato | 0: el witness de niveles rechaza todo papel con «entera» óptima |

**Prototipos intentados.** El prototipo completo del contrato, con el ciclo de
papeles que incluye «entera» óptima: 0 aprobaciones. Quitar esos papeles no se
prototipó porque los pasos 3 y 4 de la demostración ya muestran que viola los
puntos 7, 8 y 9 para cualquier parámetro: no depende de los números, sino de que
los tres recortes usan la misma pantalla y de la escalera fijada.

**Qué se dejó.** `src/content/grade-5/challenges/stage-screen.ts` volvió al estado
de `326ab36`, con una sola diferencia: el texto de la restricción violada nombra
el lado real del cartel (inventario). Catálogo, pantalla, evaluador y E2E de la
pantalla sin cambios. En la auditoría quedó
`it.todo('y5.stage-screen: K ≤ 70 y S ≤ 40 % — BLOQUEADO por el STOP de RS-MAT-008')`.

**Punto de decisión mínimo.** Una de dos, a decidir por quien emitió el contrato:

- **(a)** Eximir a `y5.stage-screen` del witness de tres niveles **sólo** en las
  variantes donde ningún recorte es válido, que tendrían «entera» óptima,
  «sin agrandar» en `efficient` o `functional` y estirar inválida. Es coherente con
  D-S08-099 —no se fabrica un nivel donde el espacio no lo tiene— y con el propio
  punto 4. Con esa excepción ninguno de los pasos 2 a 4 aplica, pero **la
  factibilidad de los puntos 7 a 10 no está demostrada**: habría que medirla antes
  de implementar.
- **(b)** Conservar la regla 2.6 y reescribir los puntos 7, 8 y 9 —y los techos—
  para un espacio donde «entera» nunca es óptima.

Esta implementación no elige: cualquiera de las dos cambia una regla del contrato.

### STOP 2 — RS-NEW-001 criterio 3 · `y5.course-project-final`

`MATHEMATICS REMEDIATION BLOCKED — CONTRACT CONFLICT`

- **Paquete:** WP-FINAL.
- **Contrato:** RS-NEW-001.
- **Criterio imposible:** 3, «en el conjunto de planes óptimos del catálogo
  aparecen las tres disposiciones: mantener, repartir y recortar».
- **Regla con la que choca:** la escalera de la Template —`optimal` = «sobrevive
  todo lo no esencial»; recortar algo esencial es `invalid`— que el mismo contrato
  prohíbe cambiar («cambiar Equipo, Aura, Estilo o la escalera»; «volver recortable
  una tarea esencial»).

**Demostración.** Recortar una tarea esencial hace el plan inválido. Recortar una
no esencial hace que no sobreviva todo lo no esencial, así que el plan no es
óptimo. Ningún plan óptimo contiene «recortar», en ninguna variante posible.

**Evidencia.** `tests/integration/mathematics-remediation.test.ts` enumera todos
los planes de las 25 variantes publicadas: los planes óptimos usan
{mantener, repartir}; los válidos, las tres disposiciones; ningún plan con
«recortar» es óptimo. El criterio quedó como
`it.todo('RS-NEW-001 criterio 3: las tres disposiciones entre los planes óptimos — BLOQUEADO por STOP')`.

**Prototipos intentados.** Ninguno cambia el resultado sin tocar la escalera: el
criterio no depende de parámetros, sino de la definición de `optimal`.

**Lo que sí se cumple.** Criterios 1, 2 y 4 y los techos K 56,8 ≤ 65 y
S 28 % ≤ 35 %. «Recortar» aparece en planes válidos y la mejor respuesta constante
lo usa en dos tareas.

**Punto de decisión mínimo.** Reformular el criterio 3 sobre planes **válidos**
(o `efficient` o mejores), donde ya se cumple, o autorizar un cambio de escalera
que el contrato hoy prohíbe. Se recomienda lo primero: el propósito del criterio
—que «recortar» no sea una disposición muerta— se cumple así.

## I. Qué no se cambió

- `fair-score-dev-2@2.0.0-post-tg1-candidate`, 85 / 10 / 5, escalera 100 / 75 /
  40 / 10: sin cambios; `pnpm game:score` sigue dando 10 000 para la carrera
  perfecta.
- Perfil cognitivo, banda, pacing, placement, cluster y arco de toda Template: sin
  cambios.
- Motor `10.0.0`, action log `7`, snapshot `8`, huella de motor `4bcf054e`,
  ruleset de carrera completa `1.0.0-full-career` con huella `7d41fddb`: sin
  cambios.
- Templates, motores de interacción, `official`, Prestige, rareza, epílogo,
  composición: sin cambios. Ningún contenido pasa a `math_reviewed`.
- Decisiones `ACCEPT_AS_DESIGNED` y riesgos aceptados de la sección 5 de la
  especificación: sin tocar.

## J. Catálogos y versiones

Convención: un catálogo publicado no se edita. De 1.º a 5.º se sigue la de
D-S08-088: el artefacto pasa a la siguiente `-dev-N` y el contenido sube una
versión menor, con sus rulesets de práctica parcial y demo. 7.º conserva **todos**
sus catálogos históricos: `grade-7-dev-6` se agrega junto a `grade-7-dev-5`.

| Identidad | Antes | Después | Por qué |
|---|---|---|---|
| Contenido 7.º | `0.9.0-grade-7` | `0.10.0-grade-7` | Feedback de la notebook y de `bus-timing`; gate de balance del mural |
| Catálogo 7.º | `grade-7-dev-5` (185) | `grade-7-dev-6` (185); dev-5 sigue publicado | Nueva población del mural |
| Ruleset 7.º | `0.4.0-grade-7` | sin cambios | Ninguna política cambió |
| Contenido · rulesets · catálogo 1.º | `1.0.0` · `grade-1-dev-1` (359) | `1.1.0` · `grade-1-dev-2` (359) | Re-aprueba 7.º; texto de la franja |
| 2.º | `2.1.0` · `grade-2-dev-2` (508) | `2.2.0` · `grade-2-dev-3` (508) | Encuesta, Repaso, tabla, postas |
| 3.º | `3.1.0` · `grade-3-dev-2` (681) | `3.2.0` · `grade-3-dev-3` (681) | Colectivo y dos Repasos |
| 4.º | `4.1.0` · `grade-4-dev-2` (854) | `4.2.0` · `grade-4-dev-3` (853) | Consejo (una variante menos), peña, dos Repasos, cola |
| 5.º | `5.1.0` · `grade-5-dev-2` (1025) | `5.2.0` · `grade-5-dev-3` (1026) | Muestra final, año que viene, Repasos, viaje, pantalla (texto) |
| Huella de contenido de la carrera completa | `e2c61b62` | `72435ee3` | Consecuencia de lo anterior |
| Carrera completa · motor · action log · snapshot | `1.0.0-full-career` · `10.0.0` · `7` · `8` | sin cambios | — |

Generadores que suben a versión `2` porque su espacio cambió:
`y3.transport-pass.threshold`, `y2.course-project-survey.denominator-claims`,
`y2.data-claim-review.denominator`, `y2.standings-claim.bounds`,
`y5.course-project-final.contingency` y `y5.next-step-options.scenarios`. El mural
y el consejo no cambian de generador: la corrección es un gate.

`authoring.ts` ganó `addressGates` en `generatedSource`: opcional y sin efecto en
las Templates que no lo declaran.

La reconstrucción final de los seis catálogos no produjo diferencias contra los
artefactos versionados (sha256 idénticos) y `pnpm game:variants check` dio
integridad `ok` en los seis.

## K. Replay, servidor y FairScore

- Replay, reanudación y recomputación de servidor se cubren con los tests
  existentes de cada año, que corren sobre los catálogos nuevos y en verde.
- Una run registrada con los catálogos anteriores de 1.º a 5.º **no** se reanuda
  sobre las versiones nuevas: el harness la rechaza como checkpoint incompatible,
  que es el comportamiento documentado de un cambio de versión de contenido (los
  E2E lo mostraron hasta reconstruir el build). Todas esas superficies son
  `official: false`.
- La carrera perfecta llega a 10 000 en `pnpm game:score`, y `style-audit` y
  `full-career` siguen en verde: los papeles nuevos conservan los witnesses de Math
  óptima con Equipo 3 y de Aura máxima.

## L. Accesibilidad

- E2E nuevos a 320 y 412 px, en desktop y mobile: `Grade 3: pagar el colectivo`
  —regla de estimación visible, cuatro opciones, teclado, axe, reflow antes y
  después de contestar— y `Grade 4: la peña` —las tres condiciones y el supuesto de
  venta visibles, entrada numérica por teclado, axe, reflow—.
- Los textos nuevos de la encuesta, la tabla y el año que viene corren dentro de
  los E2E existentes de cada año.
- Se corrigió un desborde a 320 px en `DecisionBlock` (sección M): el `fieldset`
  del bloque de decisión llevaba el ancho mínimo de su contenido.
- Notación es-AR en los números nuevos (`mil` en pesos y personas).

## M. Hallazgos de la implementación

1. **`g7.bus-timing` por posición.** Elegir siempre la primera salida de la línea
   de tiempo rinde K 84,6 y es óptima en el 57,7 %. Ningún contrato la cubre y no se
   corrigió; se reporta para el re-audit.
2. **Seis textos de feedback falsos** fuera de los contratos, corregidos por la
   regla 2.9 (sección G).
3. **Una forma del colectivo no publicada.** El espacio tiene seis formas de mes;
   el catálogo publica cinco —falta `mes-cargado`—. No es un criterio del contrato.
4. **La auditoría de 7.º** perdió una comparación frágil: el test de selección
   estable excluye ahora las entradas generadas del mural, cuya población cambió a
   propósito, y su umbral pasó de 100 a 80 comparaciones con el motivo escrito.
5. **Desborde real a 320 px en `DecisionBlock`.** Al cambiar el catálogo, la
   carrera de la seed `browser-career` cayó en otra variante de
   `g7.bus-latest-departure` y la página desbordó a 339 px. La causa no era el
   contenido: un `<fieldset>` arranca en `min-inline-size: min-content`, así que
   el bloque a sangre se ensanchaba con la entrada numérica y su unidad al lado.
   Se agregó `min-w-0` —que los demás `fieldset` de interacción ya tenían— y los
   nueve beats de esa carrera vuelven a entrar en 320 px. Es un defecto de
   maquetado que existía antes y que ninguna seed había expuesto.
6. **Un E2E asumía qué Templates compone una seed.** «Una carrera con
   recuperaciones» fallaba a propósito los beats de 1.º porque *esa* seed traía
   uno con ruta de Repaso; con el catálogo nuevo le tocó
   `y1.student-day-challenge-wheel`, que declara `none`, y la carrera terminaba
   con 0 recuperaciones. Ahora la lista de beats a fallar sale de
   `recoveryContent.reviews` del propio contenido: la prueba pasó a depender de
   lo que el contenido declara y no de qué le toca a una seed. Dos
   recuperaciones, egreso igual.

## N. Verificación

Con Node 24.19.0.

| Gate | Resultado |
|---|---|
| `pnpm game:validate-content` | exit 0 · 0 errores · 0 warnings |
| `pnpm game:variants check` (7.º y 1.º a 5.º) | exit 0 · integridad `ok` en los seis |
| Reconstrucción de catálogos | 0 diferencias |
| Auditoría de estrategia ciega | techos en verde salvo el `todo` del STOP 1 · 0 fugas de postura |
| `pnpm game:simulate:deep` | 5000 / 5000 egresadas · 0 hallazgos |
| `pnpm game:score` | perfecta 10 000 en todas las formas de plan · 0 empates de redondeo |
| `pnpm test:e2e:only` | 154 E2E en desktop y mobile, 0 fallas |
| `pnpm verify` | **exit 0**: toolchain, workspace, sync del master spec, secretos, formato, lint, typecheck, tokens del sistema de diseño, 95 archivos y 1723 tests de Vitest más 2 `todo`, cobertura 85,01 / 76,78 / 86,93 / 85,13, validación de contenido y catálogos de los seis años, cinco simulaciones deterministas, build de producción y los 154 E2E |
| `node scripts/validate-agent-workspace.mjs` | 6 skills, 236 archivos documentados, enlaces y JSON OK |
| `node scripts/sync-master-spec.mjs --check` | 116 fuentes sincronizadas |
| `git diff --check` | sin espacios en blanco erróneos |

La primera corrida completa dio **exit 1** con tres fallas de E2E en
`tests/e2e/full-career.spec.ts`, ambas causadas por el cambio de catálogo y
corregidas (sección M); la segunda dio exit 0. Baseline: 93 archivos y 1663
tests; ahora 95 y 1723.

## O. Documentación actualizada

- Este informe y el [inventario de feedback](mathematics-remediation-feedback-inventory.md).
- [Ficha de 2.º](../01-game-design/grade-2-template-design.md) (RS-NEW-006),
  [3.º](../01-game-design/grade-3-template-design.md),
  [4.º](../01-game-design/grade-4-template-design.md) y
  [5.º](../01-game-design/grade-5-template-design.md): tablas de implementación y
  catálogos.
- [Validación y auditoría de variantes](variant-validation-and-audit.md): auditoría
  de estrategia ciega, gate de balance del mural y generación por papel.
- [Registro de decisiones](../07-reference/decision-register.md) D-S08-104 a
  D-S08-111, [preguntas abiertas](../07-reference/open-questions.md) 66 y 67,
  [etapa actual](../06-delivery/current-stage.md),
  [roadmap](../06-delivery/implementation-sequence.md),
  [trazabilidad](../02-functional/traceability-matrix.md), índice y manifiesto.

## P. Git

Commits en `main`, sin push, sin reescribir historia. El worktree temporal de la
línea de base se eliminó con `git worktree remove`.

## Q. Entradas para el re-audit

Cuando se resuelvan los dos puntos de decisión, el re-audit recibe:

1. la tabla R / K / S de la sección F;
2. la evidencia por criterio de la sección E;
3. el [inventario de feedback](mathematics-remediation-feedback-inventory.md);
4. las versiones de la sección J;
5. los dos STOP de la sección H, con su demostración y sus mediciones.

Y además debe, por la sección 7 de la especificación: repetir la enumeración sin
usar `tests/helpers/blind-strategy.ts` como única fuente, probar respuestas
ingenuas en las Templates de construcción y confirmar que ninguna decisión
`ACCEPT_AS_DESIGNED` cambió.

## R. Estado de gobernanza

```text
Mathematics Remediation Implementation   BLOCKED · 12 de 14 contratos DONE · 2 STOP
Independent Mathematics Re-Audit         PENDING · requiere decidir STOP 1 y STOP 2
AI Mathematics Dept. Provisional Sign-Off PENDING
Human Mathematics Department Review      DEFERRED · Final Delivery / Pre-Release
Real-player pacing validation            PENDING
STAGE-08                                 IN_PROGRESS
```
