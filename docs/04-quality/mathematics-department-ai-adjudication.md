# Adjudicación del Departamento de Matemática provisional (IA)

- **Estado:** `EXECUTED` — 2026-09-16, sobre `main` en `9ea3896`
- **Proceso:** AI Mathematics Department — Independent Adjudication
- **Rol:** Chair / Head of Mathematics Department, después de congelados los
  revisores [A](mathematics-department-ai-reviewer-a.md),
  [B](mathematics-department-ai-reviewer-b.md) y
  [C](mathematics-department-ai-reviewer-c.md)
- **Naturaleza:** decisión provisional asistida por IA, con mandato del Product
  Owner. **No** es la revisión del Departamento de Matemática humano, que queda
  diferida a Final Delivery / Pre-Release Acceptance
- **Contrato operativo:** [especificación de remediación](mathematics-remediation-spec.md)
- **Veredicto:** `ADJUDICATION COMPLETE — REMEDIATION REQUIRED`

## A. Veredicto ejecutivo

`ADJUDICATION COMPLETE — REMEDIATION REQUIRED`.

De los trece hallazgos del [pre-review](mathematics-department-pre-review.md),
nueve exigen corrección antes del sign-off provisional, uno exige aclaración, uno
se acepta como diseñado y dos se aceptan con riesgo documentado. Ninguno quedó
diferido ni bloqueado.

La adjudicación encontró además **siete hallazgos nuevos**, y dos de ellos pesan
más que cualquiera del pre-review:

- **`y5.course-project-final` se resuelve con una respuesta constante.**
  «Repartir» las seis tareas es óptimo en 22 de 24 variantes y rinde 92,5 sobre
  100 sin mirar un número. El pre-review la había presentado como modelo a
  imitar: su métrica no podía verlo.
- **`g7.notebook-offer` enseña la comparación al revés.** Al acertar, el juego
  afirma que el descuento en porcentaje era mayor que el fijo en las 14 de 26
  variantes donde era menor. El pre-review afirmaba que no había feedback que
  enseñara una regla falsa; esa afirmación no se sostiene.

Lo que **no** cambia: la matemática de los evaluadores es aritméticamente
correcta, FairScore no se recalibra, la escalera 100/75/40/10 se conserva y no se
exige un cuarto nivel donde el espacio matemático no lo tiene.

## B. Baseline

| Dato | Valor |
|---|---|
| Branch · HEAD | `main` · `9ea38960b62547bd05b174c4b5121a9e31a0d738`, worktree limpio |
| Etapa | STAGE-08 `IN_PROGRESS`; implementación `DONE`; auditoría de carrera completa `PASSED`; pre-review IA `DONE` |
| Motor | `10.0.0` · action log `7` · snapshot `8` |
| Carrera completa | ruleset `1.0.0-full-career` (`official: false`), contenido `5.1.0-grade-5`, catálogo `grade-5-dev-2` |
| Score | `fair-score-dev-2@2.0.0-post-tg1-candidate`, 85 / 10 / 5, sin cambios |
| Catálogo | **1025** variantes aprobadas · **42** Templates (30 ordinarias, 10 Repasos, 2 especiales) · **22** familias · 6 años |
| Pre-review | `EXECUTED` sobre `1e88d46`; 13 hallazgos (2 HIGH, 6 MEDIUM, 3 LOW, 2 observaciones) |

Los 13 hallazgos se recuperaron del
[registro del pre-review](mathematics-department-pre-review.md#o-registro-de-hallazgos)
y del [paquete de revisión humana](mathematics-department-human-review-packet.md).
Ninguno tiene evidence appendix aparte.

## C. Gobernanza

**Decisión del Product Owner** (registrada como D-S08-095). La revisión del
Departamento de Matemática humano **no se elimina**: se difiere. El gate que
corresponde ahora es un proceso provisional asistido por IA:

```text
AI Mathematics Department Pre-Review ............ DONE (2026-09-16)
AI Mathematics Department Independent Adjudication DONE (2026-09-16) · este documento
Mathematics Remediation Implementation .......... NEXT
Independent Mathematics Re-Audit ................ PENDING
AI Mathematics Department Provisional Sign-Off .. PENDING
remaining STAGE-08 validation ................... PENDING
FINAL DELIVERY / PRE-RELEASE .................... PENDING
Human Mathematics Department Review ............. DEFERRED TO FINAL DELIVERY / PRE-RELEASE ACCEPTANCE
```

Reglas que acompañan la decisión:

1. **`AI provisional judgment != human final approval`.** El sign-off provisional
   no pasa ningún contenido a `math_reviewed` —estado que la
   [guía de autoría](../01-game-design/content-authoring-guide.md) reserva a la
   revisión del Departamento— ni cumple los sign-offs manuales explícitos que esa
   guía exige para doce Templates. El contenido sigue `draft`.
2. Ningún documento puede afirmar que el Departamento humano aprobó algo que no
   revisó.
3. El sign-off manual de la rueda y el pacing empírico con jugadores siguen siendo
   gates humanos de STAGE-08; esta decisión no los difiere. Cómo se relaciona la
   revisión humana diferida con Teacher Gate 2 queda como
   [pregunta abierta](../07-reference/open-questions.md).

## D. Metodología

**Separación de roles.** Cuatro roles secuenciales —A, B, C y Chair— ejecutados
por **un único agente**. La independencia fue **lógica, no física**: cada
revisor se escribió y se congeló antes del siguiente, sin citar ni usar como
premisa a los anteriores, re-derivando desde fuentes primarias. El Chair recién
leyó los tres informes al cerrarse el C. Esa limitación se declara: tres
revisores humanos distintos podrían discrepar más.

**Evidencia ejecutable.** Todo número sale de materializar las variantes del
catálogo aprobado real con las dependencias de carrera completa y evaluarlas con
el evaluador real. Scripts temporales en un scratch fuera del árbol versionado,
borrados al terminar. Procedimiento en la [sección S](#s-registro-de-evidencia-y-reproducción).

**Prototipos de factibilidad.** Antes de fijar criterios de aceptación, se
comprobó en scratch que cada techo exigido es alcanzable sin inventar
interacciones ni cambiar la escalera: son prototipos, no implementación.

**Jerarquía de evidencia.** Evidencia ejecutable del repositorio → decisiones
canónicas del producto → currículum oficial → literatura revisada por pares →
asociaciones profesionales → inferencia profesional. Cada ficha distingue
**hecho del repositorio**, **evidencia externa** e **inferencia profesional**.

**Fuentes externas.** Sólo las que sostienen una decisión concreta, cada una
verificada en su texto o, cuando no fue posible, marcada como verificada a nivel
de resumen o por fuente secundaria. Lista en la [sección T](#t-fuentes).

**Métrica de estrategia ciega.** Para cada Template con espacio de respuestas
finito: **R** (azar uniforme), **K** (mejor respuesta constante sobre todo el
catálogo) y **S** (mayor proporción de variantes donde una misma respuesta es
óptima). Es evidencia, no ley: no hay un umbral universal. Los techos de la
especificación son **por Template**, justificados contra la referencia interna
`y5.final-trip-or-event` (K 59,4 con R 56,3) y contra un prototipo factible.

## E. Revisor A — matemática y corrección formal

[Informe completo](mathematics-department-ai-reviewer-a.md). Lo que aporta y
ningún otro revisor dijo así:

- **Causa estructural de MAT-001:** el precio del abono se calcula con el tope de
  viajes del jugador; el abono es óptimo o eficiente en el 90 % de todo el
  espacio aprobado. Y la clave depende de una regla de decisión no declarada: la
  regla de peor caso elige otra opción en 17 de 25 variantes.
- **MAT-003 es más grave que un umbral oculto:** «le ganó con claridad» es la
  única afirmación sobre respuestas sin acotar, y leída sobre el nivel es
  inafirmable por el propio principio de no respuesta del juego en 25 de 25
  variantes. Además objeta el argumento del error estándar: una encuesta de
  respuesta voluntaria no es una muestra aleatoria.
- **MAT-005 no produce claves erróneas:** donde el torneo entre cuatro es
  realizable, la clasificación conjunta bajo todo fixture coincide con la de cotas
  independientes. El defecto es de mundo y de ambigüedad. Detecta una regla de
  empate asimétrica, latente.
- **MAT-008 con demostración:** con un solo elemento protegido, recortar del lado
  opuesto es óptimo para cualquier margen y escala; hace falta una restricción
  del otro lado para que la cuenta decida.
- Acepta el mural y la notebook como matemáticamente correctos, y declara
  `INSUFFICIENT_EVIDENCE` para MAT-013.

## F. Revisor B — didáctica y currículo

[Informe completo](mathematics-department-ai-reviewer-b.md). Lo propio:

- **MAT-001 refuerza un sesgo real:** el sesgo de tarifa plana (Lambrecht y
  Skiera, 2006). Y el feedback `efficient` le dice al que eligió abono que le
  conviene «si viajás bastante menos», lo cual es falso para el abono.
- **MAT-004 refuerza el error opuesto** al de la muestra representativa: «de una
  encuesta nunca se puede decir nada sobre todos».
- **MAT-005:** no quiere subir la dificultad; el razonamiento por cotas de cada
  equipo es el natural. Decide aclaración.
- **MAT-006:** acepta el mural sin cambios: la lata de 1 L es un distractor de
  error típico y comprar de más está bien tratado.
- **MAT-009 es un problema de guardrail:** «Cursar en la facultad» no entra en
  ninguna variante; la Template `LOCKED` como no vocacional muestra, una y otra
  vez, que estudiar no entra en la semana.
- Difiere MAT-012 a una decisión institucional.

## G. Revisor C — validez de evaluación y diseño de juegos

[Informe completo](mathematics-department-ai-reviewer-c.md). Lo propio:

- **La tabla R / K / S** de todas las Templates enumerables, y la observación de
  que la métrica de memorización del pre-review (S) subestima cuando hay muchas
  respuestas óptimas por variante.
- **Reencuadre de MAT-013 con el producto real:** en Fair v1 los reintentos
  repiten las mismas variantes por diseño `LOCKED`; lo corregible con catálogo es
  el **atajo transferible**, no la memorización dentro de una edición.
- **`y2.standings-claim` tiene un problema de validez mayor que el de modelo:**
  K = 80, con dos de cuatro afirmaciones que casi no cambian.
- **MAT-006:** exige balancear el catálogo, reconociendo un piso estructural de
  70 para la opción segura.
- Acepta MAT-012 como diseñado —no es un problema de medición— y trata el feedback
  direccional de los Repasos como aclaración.

## H. Matriz de acuerdo

Abreviaturas: RC `REQUIRED_CORRECTION` · RCL `REQUIRED_CLARIFICATION` · AAD
`ACCEPT_AS_DESIGNED` · AWDR `ACCEPT_WITH_DOCUMENTED_RISK` · DEF
`DEFER_TO_FINAL_HUMAN_REVIEW` · IE `INSUFFICIENT_EVIDENCE` · — no planteado.

| Hallazgo | Revisor A | Revisor B | Revisor C | **Chair** | Prioridad |
|---|---|---|---|---|---|
| MAT-001 | RC | RC | RC | **`REQUIRED_CORRECTION`** | P0 |
| MAT-002 | RC | RC | RC | **`REQUIRED_CORRECTION`** | P0 |
| MAT-003 | RC | RC | RC | **`REQUIRED_CORRECTION`** | P0 |
| MAT-004 | RC | RC | RC | **`REQUIRED_CORRECTION`** | P1 |
| MAT-005 | RC | RCL | RCL | **`REQUIRED_CORRECTION`** | P1 |
| MAT-006 | AWDR | AAD | RC | **`REQUIRED_CORRECTION`** | P2 |
| MAT-007 | RCL | RC | RC | **`REQUIRED_CORRECTION`** | P2 |
| MAT-008 | RC | RC | RC | **`REQUIRED_CORRECTION`** | P0 |
| MAT-009 | RCL | RC | RC | **`REQUIRED_CORRECTION`** | P1 |
| MAT-010 | AAD | AAD | AAD | **`ACCEPT_AS_DESIGNED`** | NONE |
| MAT-011 | RCL | RCL | RCL | **`REQUIRED_CLARIFICATION`** | P2 |
| MAT-012 | AWDR | DEF | AAD | **`ACCEPT_WITH_DOCUMENTED_RISK`** | NONE |
| MAT-013 | IE | AWDR | AWDR | **`ACCEPT_WITH_DOCUMENTED_RISK`** | NONE |
| MAT-AJ-NEW-001 | RC | RC | RC | **`REQUIRED_CORRECTION`** | P0 |
| MAT-AJ-NEW-002 | RC | RC | RC | **`REQUIRED_CORRECTION`** | P0 |
| MAT-AJ-NEW-003 | RC | RC | RCL | **`REQUIRED_CORRECTION`** | P1 |
| MAT-AJ-NEW-004 | — | — | RC | **`REQUIRED_CORRECTION`** | P1 |
| MAT-AJ-NEW-005 | RC | — | — | **`REQUIRED_CORRECTION`** | P2 |
| MAT-AJ-NEW-006 | RC | — | — | **`REQUIRED_CORRECTION`** | P2 |
| MAT-AJ-NEW-007 | — | RC | — | **`REQUIRED_CORRECTION`** | P1 |

**Conteo de las 13 decisiones canónicas:** `REQUIRED_CORRECTION` 9 ·
`REQUIRED_CLARIFICATION` 1 · `ACCEPT_AS_DESIGNED` 1 ·
`ACCEPT_WITH_DOCUMENTED_RISK` 2 · `DEFER_TO_FINAL_HUMAN_REVIEW` 0 ·
`BLOCKED — PRODUCT DECISION REQUIRED` 0.

**Prioridades.** Toda `REQUIRED_CORRECTION` y `REQUIRED_CLARIFICATION` se cumple
antes del AI Mathematics Department Provisional Sign-Off. La prioridad ordena el
trabajo y la severidad del riesgo: **P0** —la Template no mide su constructo o el
feedback afirma algo falso sobre la matemática—, **P1** —validez o modelo
comprometidos en parte—, **P2** —acotado, con corrección barata—. **NONE** no pide
cambios.

**Desacuerdos, y cómo se resolvieron.** No por mayoría:

- **MAT-005** (A corrección; B y C aclaración): la aclaración sola no alcanza,
  porque en 13 de 25 variantes el mundo que la aclaración describiría es
  imposible. La corrección elegida es la que satisface la objeción de B —no sube
  la dificultad— con la evidencia de A: exigir que las dos lecturas den la misma
  clave.
- **MAT-006** (A riesgo documentado; B aceptado; C corrección): gana la corrección,
  pero **sólo** en la parte que C demuestra que es artefacto de muestreo. Las
  posiciones de A y B se conservan en todo lo demás: la escalera y el distractor
  quedan como están.
- **MAT-007** (A aclaración; B y C corrección): la evidencia de C —75 por
  abstención total en 13 de 25— es un defecto de validez que la aclaración de A no
  cierra; la vía de corrección es la que A mismo señaló como limpia.
- **MAT-009** (A aclaración; B y C corrección): B aporta un hecho que A no miró
  —la facultad nunca entra— y C, una K de 76,5. La aclaración de A se incorpora.
- **MAT-012** (A riesgo; B diferir; C aceptado): se decide y no se difiere, porque
  existe base canónica suficiente: el marco del producto dice que el año no es
  barrera curricular. El riesgo se documenta para la institución.
- **MAT-013** (A evidencia insuficiente; B y C riesgo): la evidencia que A no tenía
  en su dominio la aporta el producto: el formato Fair v1.
- **MAT-AJ-NEW-003** (C aclaración): el Chair lo trata como corrección porque el
  texto es falso para una parte de las respuestas, no ambiguo.

## I. Adjudicación detallada

### MAT-001 — El boleto suelto nunca conviene

**Pre-review:** HIGH · ASSESSMENT VALIDITY · DIDACTIC RISK · `y3.transport-pass`

**Evidencia del repositorio.**

- El boleto suelto no es el más barato en ningún número de viajes del rango en
  25 / 25 variantes; en el espacio aprobado de candidatas es óptimo en 75 de
  29.803.
- El generador fija `pass = high × fare × factor`: el precio del abono depende del
  tope de viajes del jugador. El abono es óptimo o eficiente en 23 / 25 variantes
  y en el 90,1 % del espacio aprobado.
- K = 78,0 («abono» siempre), R = 56,3, S = 40 %.
- La clave usa `likely` («viajes del mes pasado») como estimación; la pantalla no
  lo dice. La regla de peor caso elige otra opción en 17 / 25.
- Diferencias de costo en `likely` de $10, $30 y $130 entre la óptima y la
  segunda en 3 variantes.
- El feedback `efficient` es el mismo para toda opción («bastante más o bastante
  menos»).

**Revisor A** — `REQUIRED_CORRECTION`, HIGH: desacople de precios, perfiles a
ambos lados del cruce, regla de estimación declarada, diferencia mínima.
**Revisor B** — `REQUIRED_CORRECTION`, HIGH: refuerza el sesgo de tarifa plana;
contradice su propio Repaso; feedback direccional falso.
**Revisor C** — `REQUIRED_CORRECTION`, HIGH: atajo transferible de 78 contra 56 de
azar; opción muerta; casos de filo.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** Los tres dominios coinciden y cada uno con evidencia
propia. El diseño `LOCKED` promete que el umbral de usos es estructuralmente
necesario, y la propia Template declara que «ninguna es la mejor siempre». La
implementación cumple el gate del umbral sólo entre tres de las cuatro opciones
y, por construcción del precio, entrena la regla contraria a la que enseña.
**Hecho del repositorio** + **evidencia externa** (NAP: modelizar variaciones
uniformes; sesgo de tarifa plana documentado).

**Constructo a preservar.** La conveniencia entre un costo fijo y uno por uso se
invierte en un umbral, y la cantidad de usos esperada decide cuál conviene.

**Remediación requerida.** Precios independientes del rango del jugador; cada una
de las cuatro formas es la óptima en una parte del catálogo, incluida una forma de
mes de pocos viajes; casos cerca del cruce pero sin filos de centavos; la regla de
estimación escrita en pantalla; feedback `efficient` que nombra la dirección en
que esa opción gana. Contrato: [RS-MAT-001](mathematics-remediation-spec.md).

**Alcance afectado.** Template, fuente de variantes, gates, feedback, catálogo,
tests, documentos de 3.º.

**No-objetivos.** No agregar opciones, no quitar el rango de viajes, no cambiar
la escalera ni su semántica, no tocar el Repaso de umbral salvo lo que exige
MAT-AJ-NEW-003, no cambiar banda CORE ni pacing QUICK.

**Criterios de aceptación.**

1. Ningún precio se deriva de `low`, `likely` ni `high`.
2. Cada una de las cuatro opciones es óptima en al menos 3 variantes aprobadas y
   ninguna en más del 40 %.
3. K ≤ R + 10 sobre el catálogo regenerado.
4. En `likely`, la óptima le saca a la segunda al menos max($100; 2 %).
5. La regla de estimación y la dirección del feedback `efficient` están en
   pantalla y son verdaderas en toda variante aprobada.

**Verificación adversarial.** Barrido de las cuatro constantes, del azar y de las
reglas alternativas (peor caso, costo medio) sobre el catálogo regenerado;
comprobación de que la regla alternativa, cuando difiere, cae en `efficient` con
feedback coherente.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES (generador,
contenido y catálogos versionados).

**Estrategia ciega.** Reportar R, K y S de las cuatro constantes antes y después.

**Revisión humana final.** Confirmar que la regla «calculá con el mes pasado» es
natural para 12–17 años, y que los precios del mes de pocos viajes son creíbles.

**Prioridad:** P0

### MAT-002 — El Repaso del denominador tiene una sola respuesta

**Pre-review:** HIGH · VARIANT DESIGN · RECOVERY · `y2.data-claim-review`

**Evidencia del repositorio.** Las 48 candidatas del generador producen el vector
`TFF`; K = 100 y S = 100 %. `functional` es inalcanzable y retener todo es
`efficient`. La ficha de 2.º describe otra cosa (MAT-AJ-NEW-006).

**Revisor A** — `REQUIRED_CORRECTION`, HIGH: los vectores `TT` y `FF` son
matemáticamente posibles; `FT` no.
**Revisor B** — `REQUIRED_CORRECTION`, HIGH: la segunda oportunidad tiene que
verificar comprensión; memorización según Stein y Smith; QUICK se conserva.
**Revisor C** — `REQUIRED_CORRECTION`, HIGH: «resuelto» no es evidencia de nada.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** Un Repaso es la vía de recuperación de un INVALID y la
política es `resolved != mastered`. Con una clave única, el cierre de la
obligación no se apoya en ninguna evidencia. **Hecho del repositorio**, con
**evidencia externa** de dominio (segunda evaluación en aprendizaje para el
dominio, Guskey 2007, por fuente secundaria).

**Constructo a preservar.** La misma cifra sostiene o no una afirmación según el
denominador; el error típico —el contraste `TF`— sigue siendo el caso mayoritario.

**Remediación requerida.** El catálogo contiene los tres vectores posibles con
`TF` mayoritario. Contrato: [RS-MAT-002](mathematics-remediation-spec.md).

**Alcance afectado.** Fuente de variantes, gates, catálogo, tests, ficha de 2.º.

**No-objetivos.** No agregar datos ni afirmaciones, no cambiar etiquetas, no
volverlo puntuable, no cambiar la banda ni el pacing.

**Criterios de aceptación.**

1. `TF` entre 40 % y 60 % del catálogo del Repaso; `TT` y `FF` al menos 15 % cada uno.
2. S ≤ 60 % y K ≤ 75.
3. Ninguna variante con la cifra exactamente en la mitad de las respuestas o del
   nivel.

**Verificación adversarial.** Enumeración de las 8 clasificaciones posibles en
cada variante; oráculo contra evaluador.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES.

**Estrategia ciega.** R, K y S antes y después.

**Revisión humana final.** Confirmar que las variantes `TT` y `FF` no vuelven el
Repaso más difícil que la encuesta de origen.

**Prioridad:** P0

### MAT-003 — «Con claridad» no tiene criterio visible

**Pre-review:** MEDIUM · AMBIGUITY · MISCONCEPTION · `y2.course-project-survey`

**Evidencia del repositorio.**

- Criterio del evaluador `(primera − segunda) × 10 > respuestas`, ausente de la
  pantalla.
- La afirmación es la única sobre respuestas sin «entre quienes contestaron».
- En 25 / 25 variantes la gente que no contestó alcanza para dar vuelta la
  diferencia: leída sobre el nivel, la afirmación es inafirmable por el propio
  principio que la Template aplica a «El nivel entero prefiere…».
- El catálogo nunca queda cerca del umbral: diferencia 1 en `margin`, 7 o más en
  las otras formas.

**Revisor A** — `REQUIRED_CORRECTION`, HIGH: dos marcos epistémicos en conflicto;
el error estándar no aplica a respuesta voluntaria.
**Revisor B** — `REQUIRED_CORRECTION`, HIGH: refuerza la creencia de que la
muestra representa sin importar cómo se obtuvo; prefiere una regla de publicación
visible y acotada.
**Revisor C** — `REQUIRED_CORRECTION`, MEDIUM: criterio oculto; el feedback
entrena la heurística visual.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** Coinciden los tres. El marco matemático prohíbe publicar
un desafío con «interpretaciones razonables no contempladas»; aquí hay dos, y la
que el juego castiga es la que su propio principio de no respuesta enseña.
**Decisión entre las opciones del pre-review:** ni la (a) sola —«le sacó más de
diez respuestas» es verificable pero no dice sobre quién— ni la (b) sola
—conservar «con claridad» con lenguaje de incertidumbre— alcanzan. El Chair adopta
la síntesis de A y B: **acotar a quienes contestaron + criterio declarado en
pantalla como regla de publicación del curso**. Se descarta cualquier
significación estadística: el modelo de muestra no la justifica (A) y
sobreformaliza el piso universal (B).

**Constructo a preservar.** Distinguir qué se puede decir de quienes contestaron
y qué del nivel; una diferencia chica no alcanza para afirmar que una opción ganó.

**Remediación requerida.** Contrato: [RS-MAT-003](mathematics-remediation-spec.md).

**Alcance afectado.** Texto de la afirmación, instrucciones, evaluador y oráculo
(mismo criterio), gates, tests, ficha.

**No-objetivos.** No agregar pruebas de significación, porcentajes de confianza,
«probablemente» ni márgenes de error. No quitar la forma `margin`.

**Criterios de aceptación.**

1. La afirmación dice «entre quienes contestaron» o equivalente inequívoco.
2. El criterio está escrito en pantalla con palabras y números, y el evaluador
   usa exactamente ese criterio.
3. Ninguna variante queda a una respuesta o menos del borde del criterio.
4. Existe una forma donde la opción líder es la más elegida y no cumple el
   criterio.

**Verificación adversarial.** Enumeración completa de las 64 clasificaciones por
variante; test de que el texto del criterio y el del evaluador salen de la misma
fuente.

**Regeneración de catálogo:** YES (junto con MAT-004). **Impacto serializado:** YES.

**Estrategia ciega.** Ver MAT-004.

**Revisión humana final.** Confirmar el lenguaje de la regla de publicación y que
no suena a certeza estadística.

**Prioridad:** P0

### MAT-004 — La encuesta tiene dos claves

**Pre-review:** MEDIUM · ASSESSMENT VALIDITY · `y2.course-project-survey`

**Evidencia del repositorio.** Claves `TTFFTT` (14) y `TFFFFT` (11), determinadas
por la forma. Cuatro de seis afirmaciones con verdad constante; `year-prefers`
escrito como `false`, sin gate que lo garantice. K = 66,4, R = 17,7, S = 56 %.

**Revisor A** — `REQUIRED_CORRECTION`, MEDIUM: calcular `year-prefers` con cota de
peor caso.
**Revisor B** — `REQUIRED_CORRECTION`, MEDIUM: refuerza el escepticismo absoluto,
que también es un error.
**Revisor C** — `REQUIRED_CORRECTION`, HIGH: la forma se reconoce a simple vista y
determina la clave.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** Una afirmación cuya verdad está escrita a mano no es
evidencia calculada: si el generador cambia, el oráculo puede mentir. Y NAP pide
evaluar la **razonabilidad** de una inferencia, no rechazarla siempre.
**Prototipo:** manteniendo la opción líder como la más elegida y dejando variar
el orden de las otras dos, un catálogo con al menos cuatro afirmaciones que varían
alcanza K = 40,0.

**Constructo a preservar.** El mismo del MAT-003, más: sobre el nivel sólo se
afirma lo que se sostiene aun en el peor caso de la gente que no contestó.

**Remediación requerida.** Contrato: [RS-MAT-004](mathematics-remediation-spec.md).
Se autoriza relajar por variante el gate de la Template «el denominador cambia la
respuesta», siempre que la mitad o más del catálogo lo conserve: IM-1 sigue
cumpliéndose por variante.

**Alcance afectado.** Evaluador, oráculo, generador, gates, catálogo, tests.

**No-objetivos.** No agregar afirmaciones ni motores; la opción líder sigue siendo
la más elegida.

**Criterios de aceptación.**

1. `year-prefers` se calcula: afirmable sólo si la primera supera a cada una de las
   otras por más que toda la gente que no contestó.
2. Al menos cuatro de las seis afirmaciones toman los dos valores en el catálogo.
3. Al menos cuatro claves óptimas distintas; ninguna forma semántica determina la
   clave.
4. S ≤ 35 % y K ≤ 60.
5. El contraste de denominador está en al menos la mitad del catálogo.

**Verificación adversarial.** R, K y S; prueba de que ninguna forma tiene una sola
clave.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES.

**Estrategia ciega.** Obligatoria, con los techos del criterio 4.

**Revisión humana final.** Confirmar que «aunque todos los que faltan eligieran
otra cosa» es una idea accesible en 2.º.

**Prioridad:** P1

### MAT-005 — Las cotas de la tabla suponen partidos independientes

**Pre-review:** MEDIUM · MATHEMATICAL MODELLING · AMBIGUITY · `y2.standings-claim`

**Evidencia del repositorio.** 13 / 25 variantes con suma de pendientes impar.
En las 12 realizables, la clasificación conjunta bajo todo fixture y todo
resultado es idéntica a la independiente. Regla de empate asimétrica, sin
empates decisivos hoy (MAT-AJ-NEW-005).

**Revisor A** — `REQUIRED_CORRECTION`, HIGH.
**Revisor B** — `REQUIRED_CLARIFICATION`, HIGH: no subir la dificultad.
**Revisor C** — `REQUIRED_CLARIFICATION`, MEDIUM: la clave no cambia.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** Una aclaración que diga «juegan entre ellos» describe un
mundo imposible en 13 variantes; una que diga «juegan contra otros» vuelve ambiguo
«termina primero». Por eso no alcanza la aclaración. El Chair adopta la corrección
que la evidencia de A hace posible y que respeta la objeción de B: datos
realizables entre los cuatro cursos **y** un gate que exige que la clave sea la
misma bajo cotas independientes y bajo razonamiento conjunto. Así el razonamiento
por equipo sigue alcanzando —no sube la dificultad— y el razonamiento del torneo
también es correcto. **Prototipo:** con ese gate, un catálogo balanceado alcanza
K = 49,4. **Evidencia externa:** en general las cotas independientes no alcanzan
(Schwartz, 1966); por eso se exige el gate y no se confía en la coincidencia.

**Constructo a preservar.** Máximo alcanzable contra mínimo asegurado, con enteros,
en tres categorías; `Math action != Aura action`.

**Remediación requerida.** Contrato: [RS-MAT-005](mathematics-remediation-spec.md),
implementado junto con MAT-AJ-NEW-004 y MAT-AJ-NEW-005.

**Alcance afectado.** Generador, gates, consigna, catálogo, tests.

**No-objetivos.** No mostrar ni exigir el fixture completo, no cambiar las
posturas públicas ni el cálculo de Aura, no agregar empates de partido.

**Criterios de aceptación.**

1. Pendientes realizables entre los cuatro cursos en toda variante aprobada.
2. Gate: clasificación independiente = conjunta bajo todo fixture y resultado.
3. La consigna dice que los partidos que faltan se juegan entre estos cursos y que
   cada partido lo gana uno de los dos.
4. Perfil cognitivo y banda sin cambios.

**Verificación adversarial.** Enumeración de fixtures y resultados por variante.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES.

**Estrategia ciega.** Ver MAT-AJ-NEW-004.

**Revisión humana final.** Confirmar que la consigna es natural para quien conoce
torneos escolares.

**Prioridad:** P1

### MAT-006 — El mural no tiene nivel `efficient`

**Pre-review:** MEDIUM · QUALITY TIER · `g7.mural-paint`

**Evidencia del repositorio.** `efficient` 0 / 26; 1 L `invalid` 26 / 26; K = 76,9
con «4 L siempre», R = 43,8. 4 L es la respuesta en 16 de 26 aunque el generador
sortea 2 L y 4 L con igual probabilidad.

**Revisor A** — `ACCEPT_WITH_DOCUMENTED_RISK`, MEDIUM: matemática correcta,
escalera de tres niveles honesta, desbalance de muestreo.
**Revisor B** — `ACCEPT_AS_DESIGNED`, HIGH: distractor de error típico; comprar de
más bien tratado; TG1 aceptó la situación.
**Revisor C** — `REQUIRED_CORRECTION`, MEDIUM: separar heurística razonable de
artefacto del catálogo; piso estructural de 70.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** Los tres tienen razón en partes separables, y el Chair
las separa. **Se acepta como diseñado:** la escalera de tres niveles —el espacio no
tiene un estado intermedio— y la lata de 1 L siempre insuficiente —es la promesa
del generador y un distractor legítimo—. **Se corrige:** el desbalance 16 / 10, que
no es una decisión de nadie sino el resultado de la muestra, y que sube la
estrategia ciega de 70 a 76,9. La corrección es barata y no toca nada que Teacher
Gate 1 haya aceptado. Resuelve además la parte del mural de D-S08-093.

**Constructo a preservar.** Área → litros → el envase más barato que alcanza.

**Remediación requerida.** Contrato: [RS-MAT-006](mathematics-remediation-spec.md).

**Alcance afectado.** Selección o gate del catálogo de 7.º, tests. Consigna,
evaluador y escalera **no**.

**No-objetivos.** No crear `efficient`, no hacer que 1 L alcance, no cambiar
precios ni consigna.

**Criterios de aceptación.**

1. 2 L y 4 L son la respuesta cada uno entre el 45 % y el 55 % de las variantes
   aprobadas del mural.
2. K reportado; esperado ≤ 73.

**Verificación adversarial.** Enumeración de las tres opciones por variante.

**Regeneración de catálogo:** YES (7.º y todos los catálogos posteriores).
**Impacto serializado:** YES.

**Estrategia ciega.** R, K y S antes y después; el piso de 70 se documenta como
estructural.

**Revisión humana final.** Decidir si la lata de 1 L debería alcanzar en algunas
paredes chicas, lo que bajaría el piso a 60 pero cambia la promesa aceptada en
TG1.

**Prioridad:** P2

### MAT-007 — `y4.represent-class` sin `functional` en 13 variantes

**Pre-review:** MEDIUM · QUALITY TIER · `y4.represent-class`

**Evidencia del repositorio.** Una sola propuesta viable en 13 / 25. Marcar todo
«No entra» da `efficient` en esas 13 y K = 58,2. La consecuencia narra que el
curso «habló por algo» aunque no llevó nada.

**Revisor A** — `REQUIRED_CLARIFICATION`, MEDIUM: ausencia honesta; feedback
incoherente.
**Revisor B** — `REQUIRED_CORRECTION`, MEDIUM: premia la abstención total.
**Revisor C** — `REQUIRED_CORRECTION`, MEDIUM: 75 por cero evidencia.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** El hallazgo del pre-review —falta `functional`— no es el
defecto: es honesto. El defecto es que la abstención total alcance el segundo
nivel y que el feedback contradiga el modelo. La corrección exige al menos dos
propuestas viables por variante, como ya hace `y5.next-step-options`; con eso
`functional` aparece naturalmente, pero **no** es el objetivo.

**Constructo a preservar.** Viabilidad bajo tres límites; `Math action != Aura
action != Prestige evidence`.

**Remediación requerida.** Contrato: [RS-MAT-007](mathematics-remediation-spec.md).

**Alcance afectado.** Gates, feedback, catálogo, tests.

**No-objetivos.** No cambiar la escalera, las posturas, el Aura ni la colocación
`special`.

**Criterios de aceptación.**

1. Al menos dos propuestas viables en toda variante aprobada.
2. Marcar todo «No entra» nunca alcanza `efficient`.
3. La consecuencia no narra una presentación cuando no se marcó ninguna viable.

**Verificación adversarial.** Enumeración de las 32 clasificaciones × 3 posturas.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES.

**Estrategia ciega.** K reportado.

**Revisión humana final.** Ninguna específica.

**Prioridad:** P2

### MAT-008 — La pantalla del acto se resuelve sin calcular

**Pre-review:** MEDIUM · ASSESSMENT VALIDITY · `y5.stage-screen`

**Evidencia del repositorio.**

- La óptima es «recortar del lado opuesto al cartel» en 25 / 25.
- Mover el aire del cartel entre 0 y 100 cm no cambia la óptima en ninguna
  variante: **IM-1 falla en 25 / 25**.
- «Entera» `efficient` 25 / 25; cuatro de seis opciones con nivel constante.
- Con un solo elemento protegido, un recorte centrado válido empata siempre con
  el opuesto.
- K = 75, R = 40,8. La consigna no dice que el objetivo es llenar la pantalla.
- El evaluador compara el recorte con el aire escalado en punto flotante
  (`p.margin * scale`), fuera de la aritmética exacta de
  [ADR-013](../03-architecture/adr/ADR-013-exact-rational-arithmetic.md). Sobre
  las 1728 candidatas aprobadas del espacio, la comparación exacta en enteros da
  el mismo resultado: sin efecto hoy, pero el rediseño no puede heredarlo.

**Revisor A** — `REQUIRED_CORRECTION`, HIGH: demostración de que ninguna opción
cuyo nivel depende de la cuenta puede ser óptima; hace falta una restricción del
otro lado.
**Revisor B** — `REQUIRED_CORRECTION`, HIGH: no induce razonamiento proporcional;
objetivo oculto; sin jerga.
**Revisor C** — `REQUIRED_CORRECTION`, HIGH: la Template mide la lectura de un
rótulo.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** Unanimidad, y el defecto viola un gate `LOCKED` —IM-1—
en todas las variantes. La severidad canónica sube a P0. El diseño de la
corrección no es preferencia del Chair: la demostración de A lo impone. Con un
solo elemento protegido, la cuenta de escala no puede decidir; con dos —uno
arriba y otro abajo, cada uno con su aire—, cada recorte es válido o no según el
sobrante, la escala y los dos márgenes, y si ningún recorte los respeta, la imagen
entera es la mejor proyección posible. **Prototipo:** con esa estructura y una
proporción de imágenes cuyo encaje entero desperdicia pantalla, la óptima se
reparte entre cuatro opciones y K = 68,1. El piso de «entera» es estructural:
nunca es inválida.

**Constructo a preservar.** Escala, sobrante y recorte sobre regiones protegidas,
con toda la geometría en centímetros (`LOCKED`).

**Remediación requerida.** Contrato: [RS-MAT-008](mathematics-remediation-spec.md).
Se autoriza que `optimal` signifique «la proyección válida que más pantalla usa»,
en vez de «llena la pantalla»: coincide con la definición canónica de OPTIMAL —la
mejor respuesta posible— y sólo difiere cuando ningún recorte es válido.

**Alcance afectado.** Parámetros de la Template, generador, evaluador, oráculo,
gates, consigna, feedback, catálogo, tests, ficha de 5.º.

**No-objetivos.** No agregar jerga de relación de aspecto, no cambiar el motor de
interacción, no hacer válido estirar, no cambiar la banda STRETCH.

**Criterios de aceptación.**

1. Dos elementos protegidos, uno de cada lado, con su aire en centímetros.
2. IM-1 por variante: la validez de al menos un recorte cambia si el aire escalado
   del lado que corta varía ±15 %.
3. La óptima se reparte en al menos tres opciones; ninguna en más del 40 %.
4. Ninguna opción, salvo estirar, tiene el mismo nivel en todo el catálogo.
5. La heurística «recortar todo del lado con más aire» es óptima en ≤ 50 %.
6. K ≤ 70; «entera» nunca queda a menos de 5 puntos porcentuales del borde del
   75 % de pantalla.
7. La consigna dice el objetivo completo.

**Verificación adversarial.** Barrido de las seis constantes y de las heurísticas
de lado.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES.

**Estrategia ciega.** Obligatoria, con los techos de los criterios 3, 5 y 6.

**Revisión humana final.** Confirmar que el segundo elemento protegido es creíble
en un acto escolar y que la regla «la que más pantalla usa sin cortar nada
importante» se entiende sin ayuda.

**Prioridad:** P0

### MAT-009 — `y5.next-step-options` tiene cuatro claves

**Pre-review:** LOW · VARIANT DESIGN · `y5.next-step-options`

**Evidencia del repositorio.** Clave `nnEEn` en 17 / 24; K = 76,5, S = 71 %.
Contar el viaje dentro de las horas cambia la clasificación en 4 / 24. «Los mie»
sin tilde. La facultad nunca entra (MAT-AJ-NEW-007).

**Revisor A** — `REQUIRED_CLARIFICATION`, MEDIUM: modelo de viaje y horas.
**Revisor B** — `REQUIRED_CORRECTION`, HIGH: guardrail vocacional, patrón
memorizable, lectura razonable no contemplada.
**Revisor C** — `REQUIRED_CORRECTION`, HIGH: K comparable a MAT-001.

**Chair:** `REQUIRED_CORRECTION`

**Fundamento canónico.** La severidad LOW del pre-review no corresponde a la
evidencia: K está a 1,5 puntos del hallazgo HIGH MAT-001. La aclaración de A se
incorpora como parte de la corrección. **Decisión de modelo:** las horas de cada
escenario **incluyen** su viaje, dicho en pantalla, y el viaje por día sigue
siendo un límite aparte. Es la opción que no cambia el evaluador ni la dificultad
y elimina la doble lectura.

**Constructo a preservar.** Viabilidad de escenarios ya escritos bajo tres datos;
preferencia no puntuada (`LOCKED`).

**Remediación requerida.** Contrato: [RS-MAT-009](mathematics-remediation-spec.md),
junto con MAT-AJ-NEW-007.

**Alcance afectado.** Generador, gates, texto de datos, catálogo, tests.

**No-objetivos.** No puntuar la preferencia, no ordenar opciones de vida, no
construir una semana.

**Criterios de aceptación.**

1. Las horas del escenario dicen que incluyen el viaje.
2. S ≤ 35 %, K ≤ 65.
3. Día con abreviatura correcta.

**Verificación adversarial.** Enumeración de las 32 clasificaciones.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES.

**Estrategia ciega.** Obligatoria.

**Revisión humana final.** Ver MAT-AJ-NEW-007.

**Prioridad:** P1

### MAT-010 — La notebook es binaria

**Pre-review:** LOW · QUALITY TIER · `g7.notebook-offer`

**Evidencia del repositorio.** Dos opciones, presupuesto estrictamente entre los
dos totales: exactamente una entra. K = 58,5, R = 55,0.

**Revisor A** — `ACCEPT_AS_DESIGNED`, HIGH. **Revisor B** — `ACCEPT_AS_DESIGNED`,
HIGH. **Revisor C** — `ACCEPT_AS_DESIGNED`, HIGH.

**Chair:** `ACCEPT_AS_DESIGNED`

**Fundamento canónico.** El espacio tiene dos estados matemáticamente
significativos. Un nivel intermedio sería crédito parcial inventado, y la
estrategia ciega queda a 3,5 puntos del azar. Resuelve la parte de la notebook de
D-S08-093. El defecto real de esta Template es otro: MAT-AJ-NEW-002.

**Constructo a preservar.** Llevar un porcentaje y un monto fijo a la misma unidad
contra la plata disponible.

**Remediación requerida.** Ninguna por este hallazgo.

**No-objetivos.** No agregar niveles, opciones ni crédito parcial.

**Criterios de aceptación.** No aplica.

**Regeneración de catálogo:** NO. **Impacto serializado:** NO.

**Estrategia ciega.** Sin techo; se reporta en la auditoría permanente.

**Revisión humana final.** Confirmar que una decisión binaria que cuesta 90 puntos
es aceptable en 7.º.

**Prioridad:** NONE

### MAT-011 — El punto de equilibrio no tiene nombre

**Pre-review:** LOW · LANGUAGE / NOTATION · `y4.course-project-fundraiser`

**Evidencia del repositorio.** El evaluador separa ganancia ≥ 0, ≥ objetivo y
≥ objetivo + colchón. La consigna no nombra el colchón y supone, sin decirlo, que
todo lo preparado se vende; la instrucción dice que el costo fijo se paga «se
venda o no».

**Revisor A** — `REQUIRED_CLARIFICATION`, HIGH. **Revisor B** —
`REQUIRED_CLARIFICATION`, HIGH: nombrar con glosa, no con jerga. **Revisor C** —
`REQUIRED_CLARIFICATION`, MEDIUM: el óptimo depende de un criterio fuera del
objetivo.

**Chair:** `REQUIRED_CLARIFICATION`

**Fundamento canónico.** Unanimidad. La matemática se mantiene; la consigna tiene
que decir las tres condiciones y el supuesto de venta.

**Constructo a preservar.** Cubrir costos y llegar al objetivo son condiciones
distintas (`LOCKED`).

**Remediación requerida.** Contrato: [RS-MAT-011](mathematics-remediation-spec.md).

**Alcance afectado.** Consigna, instrucciones, tests de texto.

**No-objetivos.** No cambiar evaluador, parámetros, catálogo ni escalera.

**Criterios de aceptación.**

1. La consigna nombra no perder plata, llegar al objetivo y el colchón.
2. «Punto de equilibrio», si aparece, va con su significado en palabras.
3. El supuesto de que se vende lo que se prepara está dicho.

**Regeneración de catálogo:** NO. **Impacto serializado:** TO BE DETERMINED BY
IMPLEMENTER (como mínimo, la versión de contenido según la convención del
repositorio).

**Estrategia ciega.** No aplica: Template de construcción.

**Revisión humana final.** Confirmar la glosa del punto de equilibrio.

**Prioridad:** P2

### MAT-012 — Cobertura de probabilidad y álgebra

**Pre-review:** OBSERVATION · CROSS-CAREER COVERAGE · carrera completa

**Evidencia del repositorio.** Ninguna Template cuantifica azar; las etiquetadas
`probability-and-uncertainty` usan cotas deterministas o proporciones
descriptivas. Ninguna representa explícitamente una función. **Evidencia
externa:** NAP ciclo básico pide comparar probabilidades de sucesos sin fórmulas y
modelizar variaciones uniformes.

**Revisor A** — `ACCEPT_WITH_DOCUMENTED_RISK`, MEDIUM: describir la cobertura sin
sobrestimarla.
**Revisor B** — `DEFER_TO_FINAL_HUMAN_REVIEW`, MEDIUM: decisión institucional.
**Revisor C** — `ACCEPT_AS_DESIGNED`, MEDIUM: no es un problema de medición.

**Chair:** `ACCEPT_WITH_DOCUMENTED_RISK`

**Fundamento canónico.** La pregunta correcta no es si el juego cubre el
currículum sino si el gap compromete sus objetivos propios. No los compromete: el
marco matemático fija que el año no es barrera curricular y el Product Pass cerró
la cobertura sin exigir nuevas familias. Hay base canónica para decidir, así que
no se difiere. Pero el riesgo existe para una institución que use el juego
curricularmente, y la descripción actual de cobertura lo sobrestima.

**Constructo a preservar.** No aplica.

**Remediación requerida.** Ninguna de contenido. Al actualizar la documentación
de cobertura después de la remediación, describir la incertidumbre como «datos y
cotas, sin probabilidad cuantificada».

**No-objetivos.** No crear Templates de probabilidad ni de funciones.

**Regeneración de catálogo:** NO. **Impacto serializado:** NO.

**Revisión humana final.** Decidir si la institución necesita probabilidad de
sucesos después de 2.º y representación explícita de funciones.

**Prioridad:** NONE

### MAT-013 — La demanda decae con la repetición

**Pre-review:** OBSERVATION · COGNITIVE DEMAND · carrera completa

**Evidencia del repositorio.** Fair v1: Competition Seed compartida, mismas
variantes en todos los intentos, intentos ilimitados
([modo feria](../05-operations/fair-mode-and-competition-freeze.md), `LOCKED`).

**Revisor A** — `INSUFFICIENT_EVIDENCE`, HIGH. **Revisor B** —
`ACCEPT_WITH_DOCUMENTED_RISK`, MEDIUM. **Revisor C** —
`ACCEPT_WITH_DOCUMENTED_RISK`, HIGH: reencuadre por Fair v1.

**Chair:** `ACCEPT_WITH_DOCUMENTED_RISK`

**Fundamento canónico.** El pre-review atribuía el riesgo a la concentración de
claves. Con el formato competitivo real, la memorización dentro de una edición es
posible en **toda** Template y es consecuencia de una decisión de producto
`LOCKED` que este gate no puede ni debe cambiar. Lo que sí es corregible con
catálogo —atajos transferibles entre seeds— queda cubierto por las correcciones de
MAT-001, 002, 004, 006, 008, 009 y de los hallazgos nuevos, y por la auditoría
permanente de estrategia ciega. Lo que queda es un riesgo a documentar.

**Remediación requerida.** Ninguna propia; la auditoría permanente es transversal
(regla O-4).

**Regeneración de catálogo:** NO. **Impacto serializado:** NO.

**Revisión humana final.** Que el Departamento sepa que, en la feria, un FairScore
alto después de muchos intentos mide también persistencia sobre una seed fija.

**Prioridad:** NONE

## J. Hallazgos nuevos

Numeración canónica. Ningún `MAT-001 … MAT-013` se renumeró.

| ID | Sev. | Template | Hallazgo | Origen |
|---|---|---|---|---|
| MAT-AJ-NEW-001 | HIGH | `y5.course-project-final` | Respuesta constante óptima en 22 / 24 | A-NEW-1, B-NEW-3, C-NEW-1 |
| MAT-AJ-NEW-002 | HIGH | `g7.notebook-offer` | Feedback óptimo falso en 14 / 26 | A-NEW-2, B-NEW-1, C-NEW-3 |
| MAT-AJ-NEW-003 | MEDIUM | 5 Repasos numéricos | Consecuencia con dirección de error fija | A-NEW-3, B-NEW-2, C-NEW-4 |
| MAT-AJ-NEW-004 | MEDIUM | `y2.standings-claim` | Afirmaciones que no discriminan; K = 80 | C-NEW-2 |
| MAT-AJ-NEW-005 | LOW | `y2.standings-claim` | Regla de empate asimétrica, latente | A-NEW-4 |
| MAT-AJ-NEW-006 | LOW | ficha de 2.º | Deriva documental de encuesta y Repaso | A-NEW-5 |
| MAT-AJ-NEW-007 | HIGH | `y5.next-step-options` | Estudiar casi nunca entra: guardrail vocacional | B-NEW-4 |

### MAT-AJ-NEW-001 — «Repartir todo» resuelve la muestra final

**Evidencia.** «Repartir» en las seis tareas es óptimo en 22 / 24 variantes y en
568 de 664 candidatas aprobadas; sólo parte de la forma `menos-horas` lo impide.
K = 92,5, S = 91,7 %, R = 17,5. Deja Equipo en 2 de 3, pero Math es el 85 % de
FairScore. La tabla de memorización del pre-review marcaba 4 % porque contaba
una clave canónica por variante.

**Revisores.** A, B y C: `REQUIRED_CORRECTION`.

**Chair:** `REQUIRED_CORRECTION` · **P0**

**Fundamento.** El diseño `LOCKED` promete «un plan final viable» bajo contingencia,
«no una asignación estática»; un plan constante lo satisface. **Prototipo:** basta
con que una de las personas que quedan tenga poca disponibilidad para que repartir
todo sobrecargue a alguien; con eso, K = 53,3 y S = 33 %, conservando todos los
gates de Equipo, Aura y Estilo. Contrato:
[RS-NEW-001](mathematics-remediation-spec.md).

**Criterios.** «Repartir todo» óptimo en ≤ 30 % del catálogo; S ≤ 35 %; K ≤ 65;
witnesses de Math óptima con Equipo máximo y de Aura máxima preservados.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES.

**Revisión humana final.** Confirmar que la disponibilidad desigual es creíble y
no estigmatiza a nadie.

### MAT-AJ-NEW-002 — La notebook explica al revés

**Evidencia.** `optimalComparison` es un texto fijo: «El descuento en porcentaje
era mayor que el descuento fijo, aunque sonara al revés». En 14 / 26 variantes gana
la oferta fija, y el mismo panel muestra, por ejemplo, 20 % de $2.300 = $460 junto
a un descuento fijo de $684. Las dos variantes autoradas que vio Teacher Gate 1
son de porcentaje ganador; el defecto entró con el catálogo generado.

**Revisores.** A, B y C: `REQUIRED_CORRECTION`.

**Chair:** `REQUIRED_CORRECTION` · **P0**

**Fundamento.** Feedback que afirma una comparación matemática falsa al estudiante
que la hizo bien. Contradice el marco matemático —«Correcto/óptimo: mostrar por qué
alcanza»— y la función correctiva del feedback (Shute, 2008). Refuta la afirmación
del pre-review de que ningún feedback enseñaba una regla falsa. Contrato:
[RS-NEW-002](mathematics-remediation-spec.md).

**Criterios.** El texto de acierto es verdadero en las 26 variantes; se calcula
desde los dos descuentos o se vuelve neutral a la dirección.

**Regeneración de catálogo:** NO. **Impacto serializado:** TO BE DETERMINED BY
IMPLEMENTER.

### MAT-AJ-NEW-003 — Los Repasos numéricos diagnostican un solo error

**Evidencia.** Consecuencia no óptima única en `y3.fixed-variable-review` («El
abono rinde un viaje más adelante de lo que dijiste»), `y4.margin-review` («el
curso cree que ya cubrió»), `y3.rate-capacity-review` («Contar uno de más…»),
`y4.spatial-capacity-review` («Contar de más…») y
`y5.proportion-capacity-review` («Contar una página de menos…»). En los cinco es
falsa para las respuestas que erraron en la otra dirección, incluidas las
`efficient`.

**Revisores.** A `REQUIRED_CORRECTION`, B `REQUIRED_CORRECTION`, C
`REQUIRED_CLARIFICATION`.

**Chair:** `REQUIRED_CORRECTION` · **P1**

**Fundamento.** No es ambigüedad: es una afirmación falsa para una parte
determinable de las respuestas, en el instrumento cuyo único fin es corregir el
error. Contrato: [RS-NEW-003](mathematics-remediation-spec.md).

**Criterios.** Toda frase direccional coincide con el signo de `respuesta − exacta`
para toda respuesta del rango presentado en toda variante aprobada. Escaleras de
los Repasos sin cambios.

**Regeneración de catálogo:** NO. **Impacto serializado:** TO BE DETERMINED BY
IMPLEMENTER.

### MAT-AJ-NEW-004 — La tabla tiene afirmaciones que no discriminan

**Evidencia.** «2.º D termina primero» es «imposible» en 25 / 25; «2.º B termina
arriba de 2.º C» es «posible» en 24 / 25. La clave «posible / imposible / posible /
imposible» nunca es `invalid` y rinde K = 80, con R = 20,4.

**Revisores.** C `REQUIRED_CORRECTION`; A y B no lo plantearon.

**Chair:** `REQUIRED_CORRECTION` · **P1**

**Fundamento.** Hecho del repositorio verificado por el Chair. Una afirmación con
la misma respuesta en todo el catálogo es un ítem sin información, y la K es la
segunda más alta entre las Templates puntuables. Se implementa con MAT-005.
**Prototipo:** K = 49,4. Contrato: [RS-MAT-005](mathematics-remediation-spec.md).

**Criterios.** Ninguna afirmación con la misma categoría en más del 70 % del
catálogo; S ≤ 35 %; K ≤ 65.

**Regeneración de catálogo:** YES. **Impacto serializado:** YES.

### MAT-AJ-NEW-005 — Empate asimétrico en la tabla

**Evidencia.** `seguro` no cuenta un empate como terminar arriba; `imposible` sí lo
cuenta. 0 empates decisivos en el catálogo actual.

**Revisores.** A `REQUIRED_CORRECTION`; B y C no lo plantearon.

**Chair:** `REQUIRED_CORRECTION` · **P2**

**Fundamento.** Latente, pero la regeneración que exige MAT-005 puede
activarlo. Se fija una semántica: «termina arriba» y «termina primero» significan
**estrictamente** arriba, en evaluador y oráculo, y un gate rechaza toda variante
cuya clave cambiaría si el empate se leyera al revés. Contrato:
[RS-MAT-005](mathematics-remediation-spec.md).

**Regeneración de catálogo:** YES (con MAT-005). **Impacto serializado:** YES.

### MAT-AJ-NEW-006 — Deriva documental en la ficha de 2.º

**Evidencia.** La ficha describe formas `majority`, `margin`, `least-chosen` y un
Repaso de «una sola afirmación por pantalla» con cuatro niveles. El código tiene
`denominator`, `missing-data`, `margin`, tres afirmaciones y `functional`
inalcanzable.

**Chair:** `REQUIRED_CORRECTION` · **P2** · sólo documentación, **después** de
implementar MAT-002, 003 y 004, para describir lo que quede. Catálogo NO,
serializado NO.

### MAT-AJ-NEW-007 — Estudiar casi nunca entra

**Evidencia.** «Cursar en la facultad» es viable en 0 / 24 variantes aprobadas y en
16 de 292 candidatas; «Un terciario cerca», en 3 / 24 y 36 de 292. El trabajo y el
curso de oficio, en 18 y 21 de 24.

**Revisores.** B `REQUIRED_CORRECTION`; A y C no lo plantearon.

**Chair:** `REQUIRED_CORRECTION` · **P1**

**Fundamento.** Hecho del repositorio verificado por el Chair contra un guardrail
`LOCKED` de la ficha de 5.º: la Template «nunca sugiere que universidad, trabajo,
curso u otra opción tenga superioridad moral» y no es orientación vocacional. Que
una opción de estudio no entre nunca no es una afirmación explícita, pero es un
mensaje repetido del juego en el año de egreso. Es **inferencia profesional** que
eso importa; el hecho no lo es. Contrato:
[RS-MAT-009](mathematics-remediation-spec.md).

**Criterios.** Cada escenario es viable en al menos el 25 % y no viable en al menos
el 25 % del catálogo; alguna opción de estudio entra en al menos la mitad de las
variantes; lo que deja afuera a cada opción de estudio se reparte entre los tres
datos.

**Regeneración de catálogo:** YES (con MAT-009). **Impacto serializado:** YES.

**Revisión humana final.** Revisar con criterio socioeducativo local la
distribución de viabilidad y los escenarios mismos.

## K. Correcciones requeridas

| Prioridad | Hallazgo | Acción, en una línea | Contrato |
|---|---|---|---|
| P0 | MAT-001 | Precios independientes del rango; las cuatro formas óptimas en parte del catálogo; regla de estimación y dirección del feedback en pantalla | RS-MAT-001 |
| P0 | MAT-002 | Tres vectores de verdad en el Repaso, `TF` mayoritario | RS-MAT-002 |
| P0 | MAT-003 | Afirmación acotada a quienes contestaron, con criterio visible como regla del curso | RS-MAT-003 |
| P0 | MAT-008 | Dos elementos protegidos; la cuenta de escala decide; objetivo en la consigna | RS-MAT-008 |
| P0 | MAT-AJ-NEW-001 | Disponibilidad que haga fallar el reparto parejo | RS-NEW-001 |
| P0 | MAT-AJ-NEW-002 | Explicación de acierto verdadera en toda variante | RS-NEW-002 |
| P1 | MAT-004 | `year-prefers` calculado; claves variadas | RS-MAT-004 |
| P1 | MAT-005 + NEW-004 | Pendientes realizables, gate de modelo, afirmaciones que discriminan | RS-MAT-005 |
| P1 | MAT-009 + NEW-007 | Viabilidad balanceada, estudio viable, horas con viaje incluido | RS-MAT-009 |
| P1 | MAT-AJ-NEW-003 | Diagnóstico direccional correcto en cinco Repasos | RS-NEW-003 |
| P2 | MAT-006 | Balance 2 L / 4 L | RS-MAT-006 |
| P2 | MAT-007 | Al menos dos viables; consecuencia coherente | RS-MAT-007 |
| P2 | MAT-AJ-NEW-005 | Semántica estricta de empate y gate | RS-MAT-005 |
| P2 | MAT-AJ-NEW-006 | Ficha de 2.º alineada con el código | RS-NEW-006 |

## L. Aclaraciones requeridas

| Prioridad | Hallazgo | Acción | Contrato |
|---|---|---|---|
| P2 | MAT-011 | Consigna con las tres condiciones, el colchón y el supuesto de venta | RS-MAT-011 |

## M. Aceptados como diseñados

- **MAT-010** — la notebook es binaria porque su espacio matemático tiene dos
  estados. No se agregan niveles.
- **Parte de MAT-006** — la escalera de tres niveles del mural y la lata de 1 L
  siempre insuficiente.
- **Parte de MAT-007** — la ausencia de `functional` cuando una sola propuesta es
  viable era honesta; lo corregido es la abstención premiada.

Con esto, D-S08-093 queda resuelta: **no se exige que cada Template tenga los
cuatro niveles**. Un nivel ausente se acepta cuando el espacio matemático no tiene
ese estado, y no se fabrica crédito parcial.

## N. Riesgos aceptados y banderas para la revisión humana final

| Riesgo | Por qué no se corrige ahora | Qué tiene que mirar el Departamento humano |
|---|---|---|
| MAT-012 · cobertura de probabilidad y funciones | El juego no es curricular por decisión canónica | Si la institución necesita esos ejes |
| MAT-013 · memorización dentro de una edición Fair | Consecuencia de Competition Seed compartida `LOCKED` | Qué mide un FairScore tras muchos intentos |
| Piso de 70 de la opción segura del mural | Estructural mientras 1 L nunca alcance | Si 1 L debería alcanzar en paredes chicas |
| Piso de la escalera asimétrica en clasificaciones | Decisión de diseño: publicar falso es el error grave | Si retener todo debe valer 40 |
| Templates de construcción sin barrido de respuestas ingenuas | Espacio no enumerable; el re-audit lo cubre en parte (regla O-8) | Muestras de borde en agenda, plano, recorrido y reparto |
| Independencia lógica, no física, de A, B y C | Un solo agente ejecutó los cuatro roles | Leer los desacuerdos con ese límite en mente |

## O. Reglas transversales para la remediación

Obligatorias para toda la implementación. El detalle está en la
[especificación](mathematics-remediation-spec.md).

1. **FairScore no se recalibra.** `fair-score-dev-2` 85 / 10 / 5 y la escalera
   100 / 75 / 40 / 10 quedan como están.
2. **Matemática intrínseca y `LOCKED` intactos.** IM-1 a IM-5, separación Math /
   Equipo / Aura, Estilo no competitivo, piso universal desde 7.º.
3. **Dificultad preservada.** Perfiles cognitivos, bandas y pacing no cambian,
   salvo lo que una ficha de este documento autorice expresamente.
4. **Auditoría permanente de estrategia ciega.** R, K y S por Template enumerable,
   como test del repositorio, con los techos de la especificación.
5. **Catálogos republicados, nunca editados.** Toda regeneración produce la
   siguiente versión `-dev-N` y sube la versión de contenido.
6. **Witnesses y oráculos.** Witness óptimo por variante, witnesses de Equipo y
   Aura máximos donde existen, oráculo independiente del evaluador.
7. **Inventario de feedback afirmativo.** Todo texto fijo de feedback que afirme
   una comparación, dirección o causa se prueba verdadero en toda variante donde
   se muestra, o se vuelve calculado. Dos defectos de este tipo aparecieron sin que
   nadie los buscara.
8. **Respuestas ingenuas en Templates de construcción.** El re-audit prueba al
   menos repartir parejo, todo al máximo, todo al mínimo y no hacer nada.
9. **Replay, reanudación y servidor.** Una run registrada con versiones anteriores
   se sigue reproduciendo con esas versiones; el servidor recompone el puntaje.
10. **Accesibilidad y notación.** Reflow a 320 px, teclado y tap, es-AR.
11. **STOP.** Si un criterio de aceptación resulta imposible sin violar otro, sin
    cambiar el motor de interacción o sin inventar una decisión de producto, se
    detiene esa Template, se registra la evidencia y se consulta. Ningún techo se
    relaja en silencio.

## P. Arrastre a la revisión humana de entrega final

El Departamento humano **tiene** que ver, además de su propio recorrido:

1. Las Templates corregidas por P0 en su forma final: `y3.transport-pass`,
   `y2.data-claim-review`, `y2.course-project-survey`, `y5.stage-screen`,
   `y5.course-project-final` y el feedback de `g7.notebook-offer`.
2. Las banderas de la [sección N](#n-riesgos-aceptados-y-banderas-para-la-revisión-humana-final).
3. Las preguntas de «revisión humana final» de cada ficha de las secciones I y J.
4. Las doce Templates con sign-off manual explícito exigido por la guía de autoría:
   la IA no lo reemplaza.
5. Los desacuerdos de la matriz H y cómo se resolvieron, para confirmarlos o
   revertirlos con autoridad humana.

El [paquete de revisión humana](mathematics-department-human-review-packet.md) se
actualiza en el AI Provisional Sign-Off para describir el objeto corregido; su
versión actual describe el objeto previo a la remediación.

## Q. Siguiente gate

```text
MATHEMATICS REMEDIATION IMPLEMENTATION
```

Con la [especificación de remediación](mathematics-remediation-spec.md) como
contrato canónico. Después, Independent Mathematics Re-Audit y AI Mathematics
Department Provisional Sign-Off.

## R. Correcciones al pre-review

La adjudicación no reescribe el [pre-review](mathematics-department-pre-review.md),
que queda como registro de lo que se ejecutó. Deja constancia de lo que ya no se
sostiene:

| Afirmación del pre-review | Qué se encontró |
|---|---|
| «No se encontró feedback que enseñe una regla falsa» | MAT-AJ-NEW-002 y MAT-AJ-NEW-003 |
| `y5.course-project-final` es «modelo a imitar», con 4 % de acierto memorizando | «Repartir todo» es óptimo en 22 / 24 (MAT-AJ-NEW-001). La tabla medía la clave más frecuente por variante, no la mejor respuesta constante |
| MAT-009 es LOW | K = 76,5, comparable a MAT-001, más un guardrail `LOCKED` comprometido |
| MAT-003: el error estándar muestra que no hay claridad | La encuesta es de respuesta voluntaria: el argumento correcto es la no respuesta, no el error de muestreo |
| MAT-013: el riesgo viene de la concentración de claves | En Fair v1 la memorización dentro de una edición es posible en toda Template |
| MAT-005 lleva a respuestas distintas de las que el juego acepta | No en el catálogo actual: donde el torneo es realizable, las dos lecturas dan la misma clave |

## S. Registro de evidencia y reproducción

Los scripts de esta adjudicación fueron temporales y se borraron. Cualquier número
se reproduce así, con Node 24 y desde la raíz:

1. **Materializar.** `createFullCareerDependencies()` da el catálogo de contenido;
   `grade5VariantCatalog.entries` da las 1025 direcciones aprobadas. Para cada
   una, `template.materialize(instanceRefFor(template, { variantId }), …)` con
   `createVariantRng({ familyId, templateId, variantId })`. Los parámetros salen
   de `template.variantSource.canonicalFor(variantId, variantRng)`.
2. **Enumerar.** `present([])` da el espacio: opciones de la tarjeta; etiquetas ^
   afirmaciones en clasificación; el rango de la entrada numérica, acotado a 400.
   Cada respuesta se evalúa con `evaluate(answer, [])`; puntaje 100 / 75 / 40 / 10.
3. **Métricas.** R = promedio por variante del puntaje de todas las respuestas;
   K = máximo, entre respuestas idénticas presentes en todas las variantes, del
   puntaje promedio; S = máxima proporción de variantes donde una misma respuesta
   es óptima.
4. **Espacios de candidatas.** Barrer `generateX(i)` + `xGates` sobre `X_SPACE`
   para `transport-pass`, `data-claim-review`, `course-project-final`,
   `next-step-options` y `standings-claim`.
5. **Torneo.** Para cada variante con suma de pendientes par, enumerar todo
   multigrafo de partidos entre los cuatro cursos con esos grados y todo resultado;
   comparar la categoría conjunta de cada afirmación con `standingClaims`.
6. **Pantalla.** Recalcular `screenChoices` con `margin` de 0 a 100 cm.

| Medición | Resultado |
|---|---|
| R / K / S por Template enumerable | [tabla del Revisor C](mathematics-department-ai-reviewer-c.md) |
| Espacio de `y3.transport-pass` | 29.803 aprobadas de 64.800; suelto óptimo 75; abono óptimo o eficiente 26.864 |
| Espacio de `y2.data-claim-review` | 48 / 48 con `TFF` |
| Espacio de `y5.course-project-final` | 664 aprobadas; «repartir todo» óptimo en 568 |
| Espacio de `y5.next-step-options` | 292 aprobadas; facultad viable 16, terciario 36 |
| Torneo | 13 impares; 12 pares idénticos bajo todo fixture; 0 empates decisivos |
| Pantalla | 25 / 25 óptima opuesta al cartel; margen irrelevante 25 / 25 |
| Notebook | fija óptima 14 / 26 |

**Prototipos de factibilidad** (scratch, no son diseño canónico de parámetros):
colectivo con precio desacoplado y mes de pocos viajes, K 61,0 con R 56,3;
pantalla con dos elementos protegidos, K 68,1; muestra final con disponibilidad
desigual, K 53,3 y S 33 %; tabla con pendientes realizables y gate de modelo,
K 49,4; encuesta con `year-prefers` calculado y la opción líder conservada, K 40,0.

## T. Fuentes

Sólo las que sostienen una decisión. Las de cada revisor están en su informe.

| Fuente | Tipo | Verificación | Decisión que sostiene |
|---|---|---|---|
| Ministerio de Educación de la Nación, [NAP Matemática, Ciclo Básico](https://bnm.educacion.gob.ar/digital/documentos/EL004315.pdf), 2.ª ed. 2011 | Currículum oficial | Texto | MAT-001, MAT-003, MAT-004, MAT-012 |
| Messick, S. (1995). Validity of psychological assessment. *American Psychologist*, 50(9), 741–749 ([ERIC ED380496](https://files.eric.ed.gov/fulltext/ED380496.pdf)) | Revisado por pares | Texto | Facilidad irrelevante al constructo: MAT-001, MAT-008, MAT-AJ-NEW-001 |
| Haladyna, Downing y Rodriguez (2002). [Multiple-choice item-writing guidelines](https://eric.ed.gov/?id=EJ660246). *Applied Measurement in Education*, 15(3) | Revisado por pares | Texto | Distractores plausibles y de error típico: MAT-006; ubicación de la respuesta: MAT-001 |
| Smith y Stein (1998), [Task Analysis Guide](https://mcp-coaching.osu.edu/files/2015/11/3-5-3-Smith_Stein_2011_Task_analysis_guide.pdf) | Marco de investigación | Texto | Memorización por reproducción exacta: MAT-002, MAT-013 |
| Shute, V. J. (2008). [Focus on formative feedback](https://journals.sagepub.com/doi/10.3102/0034654307313795). *Review of Educational Research*, 78(1) | Revisión | Texto | Feedback específico y correctivo: MAT-AJ-NEW-002, MAT-AJ-NEW-003, MAT-001 |
| Lambrecht y Skiera (2006). [Tariff-choice biases](https://journals.sagepub.com/doi/10.1509/jmkr.43.2.212). *Journal of Marketing Research*, 43(2) | Revisado por pares | Resumen | Sesgo de tarifa plana: MAT-001 |
| Makar y Rubin (2009). [Informal statistical inference](https://iase-pub.org/ojs/SERJ/article/view/457). *SERJ*, 8(1) | Revisado por pares | Resumen | Distinguir datos y generalización: MAT-003 |
| Schwartz (1966). Possible winners in partially completed tournaments. *SIAM Review*, 8(3) | Revisado por pares | Secundaria | Las cotas independientes no alcanzan en general: MAT-005 |
| Baker, Corbett, Koedinger y Wagner (2004). [Gaming the system](https://dl.acm.org/doi/10.1145/985692.985741). *CHI 2004* | Revisado por pares | Resumen | Atajos que explotan el feedback y aprendizaje: MAT-013, regla O-4 |
| Guskey (2007). [Revisiting «Learning for Mastery»](https://eric.ed.gov/?id=EJ786608). *Journal of Advanced Academics*, 19(1) | Revisado por pares | Secundaria | Segunda evaluación como verificación: MAT-002 |
| Watson y Moritz (2000). Developing concepts of sampling. *JRME*, 31(1) | Revisado por pares | Secundaria | Insensibilidad al tamaño de muestra: MAT-003 |
