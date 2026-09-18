# Especificación de remediación matemática

- **Estado:** `CANONICAL CONTRACT` — emitida el 2026-09-16 por la
  [adjudicación del Departamento de Matemática provisional](mathematics-department-ai-adjudication.md)
- **Enmiendas:** 2026-09-17, por la
  [adjudicación de conflictos de contrato](mathematics-remediation-contract-conflict-adjudication.md):
  criterio 3 de RS-NEW-001 reformulado sobre planes válidos (D-S08-113); RS-MAT-008
  detenido con su techo intacto y su punto de decisión abierto (D-S08-114). 2026-09-18,
  por la [adjudicación final del techo](rs-mat-008-blind-ceiling-final-adjudication.md): el techo de
  `y5.stage-screen` pasa a `K ≤ 78`, el mínimo factible demostrado (D-S08-116)
- **Gate que la consume:** `MATHEMATICS REMEDIATION IMPLEMENTATION`
- **Gate que la verifica:** `Independent Mathematics Re-Audit`
- **Base:** `main` en `9ea3896`; catálogo `grade-5-dev-2`; motor `10.0.0`;
  score `fair-score-dev-2` sin cambios

Este documento es **sólo contrato**. Las razones, la evidencia y los desacuerdos
están en la adjudicación; acá no se vuelven a discutir. Quien implementa no
redecide producto: si un criterio resulta imposible, aplica la regla de STOP
(sección 2.11).

## 0. Cómo usar este documento

1. Leer la sección 2 completa: las reglas transversales valen para todo contrato.
2. Construir primero la auditoría permanente de la sección 3: todos los contratos
   se miden con ella, antes y después.
3. Implementar por paquete de trabajo, en el orden de la sección 1.
4. Cerrar con la verificación de la sección 6 y dejar las entradas de la sección 7
   para el re-audit.

Vocabulario: **catálogo de una Template** = las entradas de esa Template en cada
catálogo aprobado que se publique; un criterio en porcentaje se cumple en
**cada** catálogo publicado que contenga la Template. **Variante** = entrada
aprobada. **Óptima en** = alcanza `optimal` con esa respuesta.

## 1. Paquetes de trabajo y orden

| Orden | Paquete | Contratos | Prioridad | Template(s) |
|---|---|---|---|---|
| 1 | WP-AUDIT | Sección 3 | — | todas las enumerables |
| 2 | WP-TRANSPORT | RS-MAT-001 | P0 | `y3.transport-pass` |
| 3 | WP-SURVEY | RS-MAT-002, RS-MAT-003, RS-MAT-004 | P0, P0, P1 | `y2.data-claim-review`, `y2.course-project-survey` |
| 4 | WP-SCREEN | RS-MAT-008 | P0 | `y5.stage-screen` |
| 5 | WP-FINAL | RS-NEW-001 | P0 | `y5.course-project-final` |
| 6 | WP-NOTEBOOK | RS-NEW-002 | P0 | `g7.notebook-offer` |
| 7 | WP-STANDINGS | RS-MAT-005 (incluye NEW-004 y NEW-005) | P1 | `y2.standings-claim` |
| 8 | WP-NEXT | RS-MAT-009 (incluye NEW-007) | P1 | `y5.next-step-options` |
| 9 | WP-REVIEWS | RS-NEW-003 | P1 | cinco Repasos numéricos |
| 10 | WP-MURAL | RS-MAT-006 | P2 | `g7.mural-paint` |
| 11 | WP-COUNCIL | RS-MAT-007 | P2 | `y4.represent-class` |
| 12 | WP-FUNDRAISER | RS-MAT-011 | P2 | `y4.course-project-fundraiser` |
| 13 | WP-CATALOGS | sección 2.5 | — | republicación de catálogos |
| 14 | WP-DOCS | RS-NEW-006 y docs de cada contrato | P2 | documentación |

El orden de catálogos (WP-CATALOGS) puede ir al final para republicar cada
catálogo **una sola vez**; lo obligatorio es el estado final, no los intermedios.

## 2. Reglas transversales

1. **Score.** `fair-score-dev-2@2.0.0-post-tg1-candidate`, 85 / 10 / 5, y la
   escalera 100 / 75 / 40 / 10 no cambian. Ningún contrato se cumple tocando el
   scorer.
2. **Invariantes.** Intrinsic Math Gate IM-1…IM-5; `Math action != Team evidence
   != Aura action`; Estilo sólo carrera; piso universal desde 7.º; todo `LOCKED`
   de las fichas de diseño.
3. **Dificultad.** Perfil cognitivo, banda derivada (`bandOf`), `pacingClass`,
   placement, cluster y arco de cada Template no cambian, salvo autorización
   escrita en su contrato.
4. **Evaluación exacta.** Toda comparación que decide un nivel usa enteros o
   racionales ([ADR-013](../03-architecture/adr/ADR-013-exact-rational-arithmetic.md)).
5. **Catálogos.** Un catálogo publicado no se edita: toda regeneración publica la
   siguiente versión `-dev-N` y sube la versión de contenido correspondiente, con
   la convención de `src/content/*/versions.ts` y D-S08-088. Si cambia contenido
   de 7.º, se republican todos los catálogos que re-aprueban 7.º. El generador cuyo
   espacio cambia sube su `version`.
6. **Witnesses y oráculos.** Se conservan y se pasan: witness por nivel
   (`tierWitnessIssues`), witness de Math óptima con Equipo máximo y de Aura
   máxima donde la Template los tiene, gate de Estilo, oráculo independiente que no
   llama al evaluador y que los tests comparan contra él.
7. **Replay y servidor.** Una run registrada con versiones anteriores se reproduce
   con esas versiones; las rutas nuevas quedan cubiertas por replay, reanudación y
   recomputación de servidor en los tests existentes de cada año.
8. **Accesibilidad y copy.** Reflow a 320 px, teclado y tap, `null ≠ 0`, notación
   es-AR (punto de miles, coma decimal) en todo texto nuevo. Textos cortos, según
   la [guía de autoría](../01-game-design/content-authoring-guide.md).
9. **Inventario de feedback afirmativo.** Para **toda** Template —no sólo las de
   este documento—, listar los textos fijos de feedback (`consequence`,
   `optimalComparison`, `violatedConstraint`) que afirmen una comparación, una
   dirección o una causa. Cada uno queda en uno de dos estados: probado verdadero
   en toda variante aprobada donde se muestra, o calculado desde la variante. El
   inventario se entrega como tabla al re-audit.
10. **Prohibido en esta remediación.** Nuevas Templates; nuevos motores de
    interacción; cambios de motor (`engine`, action log, snapshot) salvo que un
    contrato sea imposible sin ellos, en cuyo caso aplica STOP; `official: true`;
    cambios de Prestige, rareza, epílogo o composición; subir contenido a
    `math_reviewed`.
11. **STOP.** Si un criterio de aceptación resulta imposible sin violar otro
    criterio, una regla de esta sección o una decisión `LOCKED`, se detiene el
    paquete, se registra la evidencia —qué se probó y qué números dio— en la
    documentación del gate, y se consulta. **Ningún techo se relaja en silencio.**

## 3. Auditoría permanente de estrategia ciega (WP-AUDIT)

**Qué.** Un test permanente del repositorio —sugerido
`tests/integration/blind-strategy-audit.test.ts`— que, sobre el catálogo aprobado
vigente de carrera completa:

1. materializa cada variante aprobada de cada Template cuyo espacio de respuestas
   es finito: tarjeta de decisión, clasificación con hasta 50.000 respuestas y
   entrada numérica sobre el rango presentado;
2. evalúa con el evaluador real cada respuesta, con escala 100 / 75 / 40 / 10; en
   clasificaciones con postura pública, la postura no cambia Math y se fija una
   válida;
3. calcula:
   - **R**: promedio, sobre variantes, del puntaje medio de todas las respuestas;
   - **K**: máximo, sobre respuestas presentes con el mismo identificador en todas
     las variantes, del puntaje promedio. Si una Template cambia identificadores de
     afirmaciones entre variantes, K se calcula por posición;
   - **S**: máxima proporción de variantes en que una misma respuesta es `optimal`;
   - niveles alcanzables por variante;
4. afirma los techos de la tabla siguiente y **reporta** R, K y S de todas las
   demás Templates enumerables en la salida del test.

| Template | Techos exigidos |
|---|---|
| `y3.transport-pass` | K ≤ R + 10; S ≤ 40 %; cada opción óptima en ≥ 3 variantes |
| `y2.data-claim-review` | K ≤ 75; S ≤ 60 % |
| `y2.course-project-survey` | K ≤ 60; S ≤ 35 % |
| `y2.standings-claim` | K ≤ 65; S ≤ 35 % |
| `y5.stage-screen` | K ≤ 78 —el mínimo factible demostrado, D-S08-116—; S ≤ 40 % |
| `y5.course-project-final` | K ≤ 65; S ≤ 35 % |
| `y5.next-step-options` | K ≤ 65; S ≤ 35 % |
| `y4.represent-class` | abstención total nunca ≥ `efficient` |
| `g7.mural-paint` | K reportado, esperado ≤ 73 |

**Medición inicial obligatoria.** Antes de tocar contenido, correr la auditoría
sobre `grade-5-dev-2` y guardar la tabla. Valores de referencia de la
adjudicación: transporte K 78,0 · R 56,3 · S 40 %; Repaso del denominador K 100 ·
S 100 %; encuesta K 66,4 · S 56 %; tabla K 80,0 · S 56 %; pantalla K 75,0 ·
S 52 %; muestra final K 92,5 · S 91,7 %; año que viene K 76,5 · S 71 %; consejo
K 58,2; mural K 76,9 · S 62 %. Si la medición inicial no reproduce estos valores,
STOP: la herramienta o el catálogo no son los que se adjudicaron.

## 4. Contratos por hallazgo

### RS-MAT-001 — `y3.transport-pass`

- **Hallazgo:** MAT-001 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0

**Comportamiento requerido.**

1. Ningún precio (`ticket`, `card`, `fare`, `combo`, `extra`, `pass`) se calcula a
   partir de `low`, `likely` ni `high`. Los precios son datos del mes o de la
   ciudad.
2. Existe al menos una forma de mes de **pocos viajes** cuyo `likely` queda por
   debajo del cruce entre boleto suelto y las otras formas, para que el boleto
   suelto sea la más barata en `likely`. El schema puede bajar el mínimo de viajes
   por debajo de 10; los viajes siguen siendo enteros ≥ 1 y verosímiles para un mes.
3. Cada una de las cuatro opciones es óptima en al menos 3 variantes, y ninguna en
   más del 40 %.
4. En al menos el 30 % de las variantes, el cambio de opción más barata más
   cercano a `likely` está a 3 viajes o menos.
5. En `likely`, la diferencia entre la más barata y la segunda es
   ≥ max($100; 2 % del costo de la más barata).
6. La pantalla dice, en lenguaje llano, que se decide con los viajes del mes
   pasado como estimación, y que el rango muestra cuánto puede cambiar el mes.
   Redacción libre; la regla, obligatoria.
7. El feedback `efficient` nombra la dirección en que la opción elegida pasa a ser
   la más barata —más viajes o menos viajes—, calculada desde la variante. Ningún
   texto afirma una dirección falsa para la opción elegida.
8. Se conservan los gates `LOCKED`: la conveniencia cambia dentro del rango, sin
   empates en el rango, cruce dentro del rango, única óptima, la inválida es más
   cara que la óptima en todo el rango.

**Comportamiento prohibido.** Quitar el rango; agregar opciones; volver óptima una
opción con un precio inverosímil —el refine `fare < ticket` y `extra ≤ ticket`
sigue—; reglas de desempate ocultas; cambiar la semántica de la escalera
(`optimal` en `likely`, `efficient` gana en otra cantidad del rango, `invalid` la
más cara en `likely` y más cara que la óptima en todo el rango, `functional` el
resto); cambiar banda CORE, pacing QUICK o el scoring sin Equipo, Aura ni Estilo.

**Contenido afectado.** `src/content/grade-3/challenges/transport-pass.ts`
(generador, schema, gates, `present`, `narrate`, feedback de `evaluatePass`).

**Criterios de aceptación.** Los ocho puntos anteriores, verificados por test, y
los techos de la sección 3.

**Tests requeridos.** En `tests/unit/grade-3-transport-pass.test.ts`:
independencia de precios respecto del rango (propiedad: cambiar `low`, `likely` o
`high` con la misma dirección de candidata no cambia ningún precio); cada opción
óptima en ≥ 3 variantes del catálogo publicado; diferencia mínima en `likely`;
texto de la regla presente en la presentación; dirección del feedback `efficient`
verdadera para toda opción `efficient` de toda variante aprobada; los tests
`LOCKED` existentes siguen en verde.

**Chequeos de catálogo.** `pnpm game:variants check`; la auditoría de sección 3;
todas las variantes materializan.

**Mediciones.** R, K, S y conteo de óptimas por opción, antes y después; reglas
alternativas —peor caso y costo medio— comparadas con la clave.

**Superficie de versión esperada.** Versión del generador
`y3.transport-pass.threshold`; contenido de 3.º y posteriores; catálogos de 3.º,
4.º y 5.º republicados. Motor: sin cambio esperado.

**Docs a actualizar.** [Ficha de 3.º](../01-game-design/grade-3-template-design.md)
(tabla de implementación); [auditoría de variantes](variant-validation-and-audit.md).

### RS-MAT-002 — `y2.data-claim-review`

- **Hallazgo:** MAT-002 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0

**Comportamiento requerido.**

1. El catálogo del Repaso contiene los tres vectores posibles de las dos primeras
   afirmaciones: `TF` (más de la mitad de las respuestas, no del nivel), `TT` (más
   de la mitad del nivel, lo que exige que haya contestado más de la mitad) y `FF`
   (no llega a la mitad de las respuestas).
2. `TF` está entre el 40 % y el 60 % de las variantes; `TT` y `FF`, al menos 15 %
   cada uno.
3. Ninguna variante tiene la cifra exactamente en la mitad de las respuestas ni
   del nivel.
4. La tercera afirmación puede quedar como control siempre falso.
5. Los datos en pantalla, las tres afirmaciones, las dos etiquetas y la
   instrucción se conservan.

**Comportamiento prohibido.** Agregar datos, afirmaciones o etiquetas; volverlo
puntuable; cambiar su perfil cognitivo, banda o pacing QUICK; cambiar la escalera
del evaluador.

**Contenido afectado.** `generateReview`, `reviewGates` y, si hace falta,
`REVIEW_RADICES` en `src/content/grade-2/challenges/course-project-survey.ts`.

**Criterios de aceptación.** Puntos 1–3 y los techos de la sección 3.

**Tests requeridos.** En `tests/unit/grade-2-survey.test.ts`: distribución de los
tres vectores sobre el catálogo publicado; oráculo contra evaluador en las 8
clasificaciones de cada variante; `functional` alcanzable en las variantes `TT`.

**Chequeos de catálogo.** `pnpm game:variants check`; auditoría.

**Mediciones.** Distribución de vectores; R, K, S antes y después.

**Superficie de versión esperada.** Versión del generador
`y2.data-claim-review.denominator`; contenido de 2.º y posteriores; catálogos de
2.º a 5.º.

**Docs a actualizar.** Ficha de 2.º (con RS-NEW-006).

### RS-MAT-003 — `y2.course-project-survey`, criterio visible

- **Hallazgo:** MAT-003 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0

**Comportamiento requerido.**

1. La afirmación hoy `beats-runner-up` está acotada a quienes contestaron, con
   «entre quienes contestaron» o una fórmula igual de inequívoca.
2. «Con claridad» —o cualquier calificativo de fuerza— se reemplaza por un
   **criterio declarado en pantalla como regla de publicación del curso**, con
   palabras y números, decidible con aritmética entera sobre los datos visibles.
   Ejemplos de forma, no de valor: «al menos N respuestas más», «más de una de cada
   diez respuestas de diferencia».
3. El evaluador, el oráculo y el texto en pantalla usan **la misma constante**: un
   test lo prueba.
4. Ninguna variante queda a una respuesta o menos del borde del criterio.
5. Existe una forma —hoy `margin`— donde la opción líder es la más elegida entre
   quienes contestaron y **no** cumple el criterio.
6. Las tres trampas de la Template se conservan: denominador, no respuesta y
   diferencia chica.

**Comportamiento prohibido.** Pruebas de significación, errores estándar, márgenes
de error, niveles de confianza, «probablemente», «estadísticamente»; criterios no
mostrados; afirmar que una diferencia entre quienes contestaron prueba la
preferencia del nivel.

**Contenido afectado.** `surveyClaims`, `surveyGates`, `present` (afirmación o
instrucciones), `evaluateSurvey`.

**Criterios de aceptación.** Puntos 1–6.

**Tests requeridos.** Enumeración de las 64 clasificaciones por variante contra el
oráculo; test de fuente única del criterio; test de distancia mínima al borde;
test de presencia del acotamiento en el texto.

**Chequeos de catálogo.** Con RS-MAT-004.

**Mediciones.** Con RS-MAT-004.

**Superficie de versión esperada.** Con RS-MAT-004.

**Docs a actualizar.** Ficha de 2.º.

### RS-MAT-004 — `y2.course-project-survey`, variedad de claves

- **Hallazgo:** MAT-004 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P1

**Comportamiento requerido.**

1. `year-prefers` deja de ser `false` fijo: es afirmable sólo si la primera opción
   supera a **cada** una de las otras por más que toda la gente que no contestó.
   Ninguna variante con igualdad en ese borde.
2. `half-of-year` sigue calculado.
3. Al menos cuatro de las seis afirmaciones toman los dos valores de verdad en el
   catálogo.
4. Al menos cuatro claves óptimas distintas.
5. Ninguna forma semántica determina la clave: cada forma presente en el catálogo
   tiene al menos dos claves óptimas distintas entre sus variantes.
6. El contraste de denominador —mayoría entre respuestas y no del nivel— sigue
   presente en al menos la mitad de las variantes. Se **autoriza** relajar por
   variante el gate de la Template que hoy lo exige siempre; IM-1 se sigue
   cumpliendo por variante.
7. La opción que el curso quiere publicar sigue siendo la más elegida entre quienes
   contestaron; el orden entre las otras dos puede variar.
8. Siguen los gates de al menos dos afirmaciones ciertas y dos que no se sostienen.

**Comportamiento prohibido.** Agregar afirmaciones, etiquetas o motores; cambiar
la escalera asimétrica; afirmar algo sobre el nivel que dependa de suponer qué
eligió la gente que no contestó.

**Contenido afectado.** `generateSurvey`, `SPLITS`, formas, `surveyClaims`,
`surveyGates`, `surveyPlans`.

**Criterios de aceptación.** Puntos 1–8 y los techos de la sección 3.

**Tests requeridos.** Propiedad de `year-prefers` por cota de peor caso;
variación de afirmaciones y claves en el catálogo publicado; ninguna forma con
clave única.

**Chequeos de catálogo.** `pnpm game:variants check`; auditoría.

**Mediciones.** Tabla de vectores de verdad por forma; R, K, S antes y después.

**Superficie de versión esperada.** Versión del generador
`y2.course-project-survey.denominator-claims`; contenido de 2.º y posteriores;
catálogos de 2.º a 5.º.

**Docs a actualizar.** Ficha de 2.º; documentación de cobertura, describiendo la
incertidumbre como «datos y cotas, sin probabilidad cuantificada» (MAT-012).

### RS-MAT-005 — `y2.standings-claim`

- **Hallazgos:** MAT-005, MAT-AJ-NEW-004, MAT-AJ-NEW-005 · **Decisión:**
  `REQUIRED_CORRECTION` · **Prioridad:** P1 (NEW-005, P2)

**Comportamiento requerido.**

1. **Pendientes realizables.** En toda variante, la suma de partidos pendientes es
   par y ningún curso tiene más pendientes que la suma de los otros tres.
2. **Gate de modelo.** Para toda variante aprobada, la categoría de cada afirmación
   por cotas independientes es **idéntica** a la categoría conjunta bajo **todo**
   fixture posible entre los cuatro cursos y **todo** resultado, donde cada partido
   da `perWin` al ganador y 0 al perdedor.
3. **Consigna.** Dice que los partidos que faltan se juegan entre estos cursos y que
   cada partido lo gana uno de los dos.
4. **Empates (NEW-005).** «Termina primero» y «termina arriba de» significan
   estrictamente arriba, igual en evaluador y oráculo: `seguro` si el mínimo propio
   supera el máximo ajeno; `imposible` si el máximo propio **no supera** el mínimo
   ajeno; `posible` en otro caso. Además, un gate rechaza toda variante donde alguna
   categoría cambiaría si el empate se contara como terminar arriba.
5. **Discriminación (NEW-004).** En el catálogo, ninguna afirmación tiene la misma
   categoría en más del 70 % de las variantes. Los identificadores y el sujeto de
   las afirmaciones pueden cambiar si hace falta; si varían entre variantes, la
   auditoría calcula K por posición.
6. Las posturas públicas, `stanceRisk`, el Aura, el witness de Aura máxima y la
   separación `Math action != Aura action` no cambian.
7. El razonamiento por cotas de cada curso sigue alcanzando para la clave: no se
   muestra ni se exige el fixture.

**Comportamiento prohibido.** Declarar que los pendientes son contra otros años o
cursos fuera de la tabla; mostrar un fixture que obligue a razonar el torneo
conjunto; introducir empates de partido; cambiar el perfil cognitivo, la banda o
el pacing; cambiar el cluster `intercurso`.

**Contenido afectado.** `generateStandings`, `bounds` o `standingClaims`,
`standingsGates`, `standingsPlans`, `narrate`, `present`.

**Criterios de aceptación.** Puntos 1–7 y los techos de la sección 3.

**Tests requeridos.** En `tests/unit/grade-2-standings.test.ts`: realizabilidad;
gate de modelo por enumeración de fixtures y resultados en todo el catálogo
publicado; semántica estricta de empate con casos límite construidos; ningún
empate decisivo en el catálogo; distribución de categorías por afirmación; tests
existentes de separación Math / Aura en verde.

**Chequeos de catálogo.** `pnpm game:variants check`; auditoría.

**Mediciones.** Categorías por afirmación; R, K, S antes y después.

**Superficie de versión esperada.** Versión del generador
`y2.standings-claim.bounds`; contenido de 2.º y posteriores; catálogos de 2.º a
5.º; el action log sólo si cambian identificadores de afirmaciones, lo que se
resuelve con versión de contenido, no de motor.

**Docs a actualizar.** Ficha de 2.º.

### RS-MAT-006 — `g7.mural-paint`

- **Hallazgo:** MAT-006 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P2

**Comportamiento requerido.**

1. En cada catálogo publicado que contenga el mural, 2 L y 4 L son la respuesta
   óptima cada uno en entre el 45 % y el 55 % de las variantes del mural.
2. La corrección se hace por selección o gate de catálogo; el generador puede
   seguir sorteando igual.

**Comportamiento prohibido.** Crear un nivel `efficient`; hacer que la lata de 1 L
alcance; cambiar precios, envases, consigna, feedback, evaluador o efectos de
carrera; cambiar el perfil cognitivo.

**Contenido afectado.** Construcción o gates del catálogo de `g7.mural-paint`
(`mural-paint.variants.ts` o la configuración de `pnpm game:variants build` para
7.º).

**Criterios de aceptación.** Punto 1 y K reportado.

**Tests requeridos.** Distribución 2 L / 4 L en el catálogo publicado en
`tests/unit/grade-7-content.test.ts` o el test de catálogo de 7.º.

**Chequeos de catálogo.** `pnpm game:variants check` en 7.º y en todos los
catálogos que re-aprueban 7.º.

**Mediciones.** R, K, S antes y después; el piso estructural de 70 de la opción
segura se reporta, no se exige bajar.

**Superficie de versión esperada.** Catálogo de 7.º y todos los posteriores
republicados; contenido de 7.º según convención; ruleset de 7.º sólo si la
convención lo exige.

**Docs a actualizar.** [Auditoría de variantes](variant-validation-and-audit.md).

### RS-MAT-007 — `y4.represent-class`

- **Hallazgo:** MAT-007 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P2

**Comportamiento requerido.**

1. Toda variante aprobada tiene al menos dos propuestas viables.
2. Marcar todas como «No entra» nunca alcanza `efficient`.
3. Si ninguna propuesta se marcó viable, la consecuencia no narra que el curso
   presentó algo.
4. Se conservan el gate de «al menos dos límites deciden», el gate de posturas
   distintas, el de postura independiente de la clasificación y el witness de Aura
   máxima.

**Comportamiento prohibido.** Cambiar la escalera, el Aura, las posturas, el rol
`special`, la ausencia de Prestige o el perfil cognitivo.

**Contenido afectado.** `representGates`, generador si hace falta, consecuencia
en `evaluateRepresent`.

**Criterios de aceptación.** Puntos 1–4.

**Tests requeridos.** En `tests/unit/grade-4-represent-class.test.ts`: dos
viables por variante; abstención total `functional`; texto de consecuencia sin
presentación cuando no hubo propuestas.

**Chequeos de catálogo.** `pnpm game:variants check`; auditoría.

**Mediciones.** Viables por variante; K antes y después.

**Superficie de versión esperada.** Versión del generador si cambia su espacio;
contenido de 4.º y posteriores; catálogos de 4.º y 5.º.

**Docs a actualizar.** [Ficha de 4.º](../01-game-design/grade-4-template-design.md).

### RS-MAT-008 — `y5.stage-screen`

- **Hallazgo:** MAT-008 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0

**Comportamiento requerido.**

1. **Dos elementos protegidos.** La imagen tiene uno arriba y otro abajo —por
   ejemplo el cartel del curso y la fecha del acto—, cada uno con su alto y su aire
   en centímetros.
2. **Opciones.** Seis: entera con bandas; llenar el ancho y recortar centrado;
   llenar el ancho y recortar sólo de arriba; llenar el ancho y recortar sólo de
   abajo; sin agrandar; estirar. Etiquetas en lenguaje llano que digan de qué lado
   se recorta.
3. **Validez.** Una opción es `invalid` si deforma o si el recorte de algún lado
   supera el aire de ese lado agrandado por la misma escala. Comparaciones
   **exactas** en enteros o racionales.
4. **Escalera.** Entre las opciones válidas: `optimal` = la que más pantalla usa
   (única por gate); `efficient` = válida, no óptima, usa al menos el 75 % de la
   pantalla; `functional` = válida con menos del 75 %. Si ningún recorte es válido,
   la imagen entera puede ser la óptima: la adjudicación lo autoriza.
5. **Consigna.** Dice el objetivo completo: que se vea lo más grande posible, sin
   deformarla y sin cortar ninguno de los dos elementos.
6. **IM-1 por variante.** La validez de al menos una opción de recorte cambia si el
   aire escalado del lado que recorta varía ±15 %.
7. **Distribución.** La óptima se reparte en al menos tres opciones y ninguna es
   óptima en más del 40 % de las variantes.
8. **Sin niveles constantes.** Ninguna opción, salvo estirar, tiene el mismo nivel
   en todas las variantes.
9. **Heurística de lado.** «Recortar todo del lado con más aire» es óptima en
   ≤ 50 % de las variantes.
10. **Sin filo.** La pantalla que usa «entera» nunca está a menos de 5 puntos
    porcentuales del 75 %.
11. El detalle de cada opción puede decir el tamaño que queda en pantalla, pero no
    cuánto recorta de cada lado ni si un elemento protegido sobrevive.

> **Enmienda, 2026-09-18 (D-S08-116).** El techo de este contrato pasa de
> `K ≤ 70` a **`K ≤ 78`**, que es el **mínimo factible demostrado** y no una
> relajación de conveniencia: «entera» no recorta nada, así que es válida en toda
> variante y, donde algún recorte vale, la escalera la deja en `efficient`; por lo
> tanto `K = 75 + 25·w`, y los puntos 7 y 9 fuerzan `w ≥ 1/10`, de donde
> `K ≥ 1950 / 25 = 78`. La excepción estrecha del witness (D-S08-114) —sólo donde
> ningún recorte es válido— se conserva. Todos los demás criterios siguen
> vigentes y se cumplen. Prueba, catálogo testigo y mediciones en la
> [adjudicación final del techo](rs-mat-008-blind-ceiling-final-adjudication.md).
>
> Contexto: el techo original venía de la adjudicación de 2026-09-16; su
> imposibilidad se descubrió en la
> [implementación](mathematics-remediation-implementation.md#stop-1-rs-mat-008-y5stage-screen)
> (STOP, D-S08-105) y se acotó en la
> [adjudicación de conflictos](mathematics-remediation-contract-conflict-adjudication.md#d-oq-66-y5stage-screen)
> (D-S08-114).

**Comportamiento prohibido.** Jerga de relación de aspecto, formatos como 16:9 o
vocabulario audiovisual (invariante `LOCKED`); hacer válido estirar; cambiar el
motor de interacción `decision-card`; cambiar banda STRETCH, pacing QUICK o
cluster `egreso`; desempates ocultos.

**Contenido afectado.** `src/content/grade-5/challenges/stage-screen.ts` completo:
schema, `project`, validez, `tierOf`, generador, gates, `narrate`, `present`,
feedback.

**Criterios de aceptación.** Puntos 1–11 y los techos de la sección 3, con el
techo `K ≤ 78` de la enmienda D-S08-116.

**Tests requeridos.** En `tests/unit/grade-5-screen-yearbook-next.test.ts`:
validez exacta con casos límite construidos; escalera por variante contra un
oráculo independiente; IM-1 por perturbación; distribución de óptimas; ninguna
opción de nivel constante salvo estirar; heurística de lado; distancia al 75 %.
Actualizar `tests/helpers/grade-5-play.ts` y los E2E de 5.º y carrera completa que
eligen una opción de la pantalla.

**Chequeos de catálogo.** `pnpm game:variants check`; auditoría; reflow a 320 px
de la tarjeta con las seis etiquetas nuevas.

**Mediciones.** Óptimas por opción; niveles por opción; R, K, S antes y después.

**Superficie de versión esperada.** Versión del generador `y5.stage-screen.fit`;
contenido de 5.º; catálogo de 5.º. Motor: sin cambio esperado; si el schema de
presentación lo exigiera, STOP.

**Docs a actualizar.** [Ficha de 5.º](../01-game-design/grade-5-template-design.md)
(tabla de implementación e interacción de la pantalla).

### RS-MAT-009 — `y5.next-step-options`

- **Hallazgos:** MAT-009, MAT-AJ-NEW-007 · **Decisión:** `REQUIRED_CORRECTION` ·
  **Prioridad:** P1

**Comportamiento requerido.**

1. **Modelo de tiempo.** Las horas de cada escenario **incluyen** su viaje, y la
   pantalla lo dice. El viaje por día sigue siendo un límite aparte.
2. **Guardrail vocacional.** Cada uno de los cinco escenarios es viable en al menos
   el 25 % y no viable en al menos el 25 % de las variantes.
3. «Cursar en la facultad» o «Un terciario cerca» es viable en al menos la mitad
   de las variantes.
4. Lo que deja afuera a cada opción de estudio, cuando no entra, se reparte entre
   horas, viaje y día tomado: ningún motivo explica más del 60 % de sus exclusiones.
5. Se conserva el gate de al menos dos escenarios viables y el de al menos dos
   motivos de exclusión.
6. El día tomado se muestra con abreviatura correcta: «mié».
7. La preferencia sigue sin puntuar, sin Estilo, sin Equipo y sin Aura.

**Comportamiento prohibido.** Ordenar, recomendar o puntuar opciones de vida;
agregar datos por persona o económicos; construir una semana (`LOCKED` frente a
`y3.week-planner`); cambiar banda CORE o pacing.

**Contenido afectado.** Generador, `HOURS`, `TRAVELS`, `DAY_SETS`, gates y
`present` de `src/content/grade-5/challenges/next-step-options.ts`.

**Criterios de aceptación.** Puntos 1–7 y los techos de la sección 3.

**Tests requeridos.** Distribución de viabilidad por escenario; condición de
estudio; reparto de motivos; texto de horas con viaje incluido; abreviatura del
día; preferencia sin efectos, como hoy.

**Chequeos de catálogo.** `pnpm game:variants check`; auditoría.

**Mediciones.** Viabilidad por escenario y motivos; R, K, S antes y después.

**Superficie de versión esperada.** Versión del generador
`y5.next-step-options.scenarios`; contenido y catálogo de 5.º.

**Docs a actualizar.** Ficha de 5.º (sección de `next-step-options`).

### RS-MAT-011 — `y4.course-project-fundraiser`

- **Hallazgo:** MAT-011 · **Decisión:** `REQUIRED_CLARIFICATION` · **Prioridad:** P2

**Comportamiento requerido.**

1. La consigna o las instrucciones nombran las tres condiciones en orden: no perder
   plata —cubrir los costos—, llegar al objetivo, y llegar con el colchón.
2. Si aparece «punto de equilibrio», va acompañado de su significado en palabras:
   lo que dejan las bandejas vendidas alcanza para el costo fijo.
3. Dice que se supone que todo lo que se prepara se vende.
4. La instrucción sobre el costo fijo no contradice ese supuesto.

**Comportamiento prohibido.** Cambiar evaluador, oráculo, parámetros, gates,
catálogo, escalera, Estilo o el Repaso de margen salvo RS-NEW-003.

**Contenido afectado.** `narrate` y `present` de
`src/content/grade-4/challenges/course-project-fundraiser.ts`.

**Criterios de aceptación.** Puntos 1–4 verificados por test de texto; reflow a
320 px.

**Tests requeridos.** Presencia de las tres condiciones y del supuesto de venta en
la presentación.

**Chequeos de catálogo.** `pnpm game:variants check` sin diferencias en las
entradas de la peña.

**Mediciones.** Ninguna de estrategia ciega.

> **ERRATUM, 2026-09-18 (D-S08-124).** Esa línea quedó **falsada por medición**. La
> [re-auditoría independiente](independent-mathematics-reaudit.md#mat-ra-003-blocker-bloqueante-y4course-project-fundraiser)
> enumeró los 630 vectores constantes de la peña y encontró que
> `panchos 3 · tortas 0 · bebidas 9` rinde `K = 92,80` y es óptima en 23 de 25
> variantes. Esta Template **sí** necesitaba medición de estrategia ciega. El resto de
> RS-MAT-011 —un contrato de claridad textual— sigue **PASS** y no se deforma: la
> resistencia a estrategia ciega se contrata aparte, en
> [RS-RA-003](post-reaudit-mathematics-remediation-spec.md#6-rs-ra-003-y4course-project-fundraiser).

**Superficie de versión esperada.** Contenido de 4.º y posteriores según
convención; catálogo sin cambio de población esperado.

**Docs a actualizar.** Ficha de 4.º.

### RS-NEW-001 — `y5.course-project-final`

- **Hallazgo:** MAT-AJ-NEW-001 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0

**Comportamiento requerido.**

1. «Repartir» en las seis tareas es óptimo en ≤ 30 % de las variantes.
2. El generador produce contingencias donde repartir en partes iguales sobrecarga a
   alguien en la mayoría de las variantes —por ejemplo, disponibilidad desigual
   entre quienes quedan— sin agregar disposiciones.
3. **Enmendado el 2026-09-17 (D-S08-113).** Las tres disposiciones están vivas.
   En el catálogo aprobado, y en cada variante: mantener, repartir y recortar
   aparecen en planes matemáticamente válidos; «recortar» alcanza al menos el
   nivel `efficient` —aparece como intercambio legítimo, no sólo en planes
   inválidos—; y el conjunto de planes óptimos sigue siendo no trivial, con
   mantener y repartir, las dos disposiciones que la escalera permite que sean
   óptimas, presentes entre ellos. La escalera no cambia.

   El texto original —«en el conjunto de planes óptimos aparecen las tres
   disposiciones»— era imposible bajo la escalera `LOCKED`: recortar algo esencial
   es `invalid` y recortar algo no esencial impide que sobreviva todo lo no
   esencial, así que ningún plan óptimo puede recortar. Ver la
   [adjudicación de conflictos de contrato](mathematics-remediation-contract-conflict-adjudication.md#e-oq-67-y5course-project-final).
4. Se conservan todos los gates actuales: witness de Aura máxima, witness de Math
   óptima con Equipo 3, Equipos distintos entre óptimos, algún plan válido con
   Equipo ≤ 1, gate de Estilo, el plan anterior sin cambios es inválido, posturas
   distintas e independientes.

**Comportamiento prohibido.** Agregar disposiciones como «se la pasa a X»; cambiar
cómo se reparte una tarea; volver recortable una tarea esencial; cambiar Equipo,
Aura, Estilo o la escalera; cambiar banda STANDARD, pacing DEEP o arco PROJECT.

**Contenido afectado.** `generateFinal`, `AVAILABLE`, `HOURS` o formas en
`src/content/grade-5/challenges/course-project-final.ts`.

**Criterios de aceptación.** Puntos 1–4 y los techos de la sección 3.

**Tests requeridos.** En `tests/unit/grade-5-project-final.test.ts`: proporción de
«repartir todo» óptimo; disposiciones presentes entre óptimos; gates existentes.
`tests/integration/style-audit.test.ts` y `tests/integration/full-career.test.ts`
en verde: la carrera perfecta sigue llegando a 10 000.

**Chequeos de catálogo.** `pnpm game:variants check`; auditoría.

**Mediciones.** R, K, S antes y después; óptimos por variante.

**Superficie de versión esperada.** Versión del generador
`y5.course-project-final.contingency`; contenido y catálogo de 5.º.

**Docs a actualizar.** Ficha de 5.º.

### RS-NEW-002 — `g7.notebook-offer`

- **Hallazgo:** MAT-AJ-NEW-002 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0

**Comportamiento requerido.**

1. El texto de acierto es verdadero en toda variante: se calcula desde los dos
   descuentos —cuál descuenta más en pesos— o se reemplaza por una explicación que
   no afirme dirección.
2. El resto del feedback de la Template pasa el inventario de la regla 2.9.

**Comportamiento prohibido.** Cambiar la decisión binaria, el presupuesto, los
efectos de carrera, las variantes o el catálogo.

**Contenido afectado.** `evaluate` en
`src/content/grade-7/challenges/notebook-offer.ts`.

**Criterios de aceptación.** Punto 1 en las 26 variantes del catálogo vigente de
7.º y en toda variante futura.

**Tests requeridos.** Enumeración de las variantes aprobadas de la notebook: el
texto de acierto coincide con la comparación real de descuentos.

**Chequeos de catálogo.** Sin cambio de población.

**Mediciones.** Ninguna de estrategia ciega.

**Superficie de versión esperada.** Contenido de 7.º según convención; catálogo sin
cambio de población esperado.

**Docs a actualizar.** Ninguno específico; registrar en el decision register al
cerrar.

### RS-NEW-003 — Repasos numéricos

- **Hallazgo:** MAT-AJ-NEW-003 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P1

**Alcance.** `y3.fixed-variable-review`, `y4.margin-review`,
`y3.rate-capacity-review`, `y4.spatial-capacity-review`,
`y5.proportion-capacity-review`. Por la regla 2.9, también cualquier otro Repaso
donde el inventario encuentre el mismo patrón.

**Comportamiento requerido.**

1. Toda frase de feedback que describa hacia dónde se equivocó el jugador
   coincide con el signo de `respuesta − respuesta exacta`, para toda respuesta del
   rango presentado y toda variante aprobada.
2. El error con nombre propio —quedarse en la parte entera, dividir por el precio,
   contar el salón entero— conserva su explicación específica.

**Comportamiento prohibido.** Cambiar los niveles que asigna cada Repaso, sus
datos, sus variantes o su exclusión de FairScore.

**Contenido afectado.** `evaluateReview` en `transport-pass.ts`,
`evaluateMarginReview` en `course-project-fundraiser.ts`, `evaluateRateReview` en
`course-project-tech.ts`, `evaluateCapacityReview` en `event-floor-plan.ts`,
`evaluateProportionReview` en `yearbook.ts`.

**Criterios de aceptación.** Punto 1 probado por enumeración; punto 2 conservado.

**Tests requeridos.** Por Repaso: enumerar respuestas del rango en cada variante
aprobada y verificar la dirección del texto; mantener los tests de nivel
existentes.

**Chequeos de catálogo.** Sin cambio de población.

**Mediciones.** Ninguna de estrategia ciega.

**Superficie de versión esperada.** Contenido de 3.º, 4.º y 5.º según convención.

**Docs a actualizar.** Fichas de 3.º, 4.º y 5.º si describen el feedback.

### RS-NEW-006 — Ficha de 2.º

- **Hallazgo:** MAT-AJ-NEW-006 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P2

**Comportamiento requerido.** Después de RS-MAT-002, 003 y 004, la tabla de
implementación de la [ficha de 2.º](../01-game-design/grade-2-template-design.md)
describe las formas semánticas reales de la encuesta, su criterio de publicación,
el cálculo de `year-prefers`, las tres afirmaciones del Repaso, sus tres vectores
de verdad y los niveles alcanzables.

**Comportamiento prohibido.** Describir capacidades que el código no tiene.

**Criterios de aceptación.** Revisión cruzada de la tabla contra el código.
`node scripts/validate-agent-workspace.mjs` y
`node scripts/sync-master-spec.mjs --check` en verde.

**Superficie de versión esperada.** Ninguna.

## 5. Lo que no se cambia

| Hallazgo | Decisión | No tocar |
|---|---|---|
| MAT-010 | `ACCEPT_AS_DESIGNED` | Decisión binaria de la notebook, sus dos niveles alcanzables, sus variantes |
| MAT-012 | `ACCEPT_WITH_DOCUMENTED_RISK` | No crear Templates de probabilidad ni de funciones |
| MAT-013 | `ACCEPT_WITH_DOCUMENTED_RISK` | Competition Seed compartida, intentos ilimitados, reintentos sobre las mismas variantes |
| MAT-006 (parte) | aceptada | Escalera de tres niveles del mural; lata de 1 L siempre insuficiente |
| MAT-007 (parte) | aceptada | No perseguir cuatro niveles: `functional` aparece como consecuencia, no como objetivo |

## 6. Verificación de cierre de la implementación

Con Node 24.19.0 (`pnpm toolchain:check`), desde la raíz:

1. `pnpm game:validate-content`
2. `pnpm game:variants check`
3. El test de la sección 3, con la tabla antes / después
4. `pnpm game:simulate:deep`
5. `pnpm game:score`: techo de 10 000 alcanzable y recomputación determinista
6. `pnpm test:e2e:only`
7. `pnpm verify` completo
8. `node scripts/validate-agent-workspace.mjs` y `node scripts/sync-master-spec.mjs --check`
9. `git diff --check`

Un gate no corrido se reporta como no corrido.

## 7. Entradas para el Independent Mathematics Re-Audit

La implementación entrega, en su documentación de cierre:

1. La tabla R / K / S de **todas** las Templates enumerables, antes y después.
2. Para cada contrato, la evidencia de cada criterio de aceptación: test que lo
   prueba o medición.
3. El inventario de feedback afirmativo de la regla 2.9.
4. Las versiones nuevas de contenido, generadores y catálogos.
5. Todo STOP registrado, con su evidencia.

El re-audit, que es independiente de la implementación, verifica esos puntos contra
el código y además:

- repite la enumeración desde cero, sin usar las herramientas de la
  implementación como única fuente;
- prueba respuestas ingenuas en las Templates de construcción —repartir parejo,
  todo al máximo, todo al mínimo, no hacer nada— con sus oráculos;
- confirma que ninguna decisión `ACCEPT_AS_DESIGNED` fue modificada.

El **AI Mathematics Department Provisional Sign-Off** actualiza además el
[paquete de revisión humana](mathematics-department-human-review-packet.md) para
que describa el objeto corregido y lleve las preguntas de revisión humana final de
la adjudicación.
