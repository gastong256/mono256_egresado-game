# Revisor B — Didáctica, matemática de secundaria y currículo

- **Estado:** `FROZEN` — cerrado el 2026-09-16, después de congelado el informe
  A y antes de redactar el C. No se reescribe para alinearse con ellos
- **Proceso:** AI Mathematics Department — Independent Adjudication
- **Naturaleza:** opinión independiente asistida por IA. **No** es la decisión
  canónica —ésa es del Chair, en la
  [adjudicación](mathematics-department-ai-adjudication.md)— y **no** es una
  revisión del Departamento de Matemática humano
- **Objeto:** `main` en `9ea3896`, catálogo aprobado `grade-5-dev-2`

**Pregunta central.** ¿La tarea induce el razonamiento que pretende enseñar, y
lo hace de forma apropiada para estudiantes de 12 a 17 años?

## Independencia y límites

- Mismo agente, aislamiento **lógico**: este informe no usa el informe A como
  fuente, no lo cita y no toma sus decisiones como premisa. Cada conclusión se
  re-derivó desde el código, la pantalla que ve el jugador, los documentos de
  diseño, el [pre-review](mathematics-department-pre-review.md) y bibliografía.
- La lente es la de un aula. Lo que se afirma sobre cómo lee un estudiante es
  **inferencia profesional** apoyada en literatura, no observación: no hubo
  estudiantes.
- Respeto el principio canónico del proyecto: el año narrativo no es un año de
  currículum ([marco matemático](../01-game-design/math-design-framework.md)).
  El currículum sirve de contraste, no de filtro.

## Lo que el jugador ve, re-derivado

| Template | Qué ve y qué aprende el patrón del catálogo |
|---|---|
| `y3.transport-pass` | Cuatro formas de pagar; el boleto suelto **nunca** es la más barata en ninguna cantidad de viajes posible (0 / 25). El abono es óptimo o «una apuesta» en 23 / 25. Tras equivocarse con el abono, el feedback dice «Te conviene si viajás bastante más o bastante menos que el mes pasado», aunque el abono sólo gana viajando **más** |
| `y2.data-claim-review` | Tres afirmaciones y siempre la misma respuesta correcta: sí / no / no (25 / 25) |
| `y2.course-project-survey` | Seis afirmaciones. «Le ganó con claridad» es la única sobre las respuestas sin «entre quienes contestaron», y su criterio no aparece. Las dos afirmaciones sobre el nivel entero son **siempre** «no se puede afirmar» |
| `y2.standings-claim` | Cuatro cursos y sus partidos pendientes; nada dice contra quién se juegan. En 13 / 25 la suma de pendientes es impar |
| `y5.stage-screen` | Seis formas de proyectar, cada una con su tamaño final ya calculado. La mejor es siempre recortar del lado donde no está el cartel |
| `y5.next-step-options` | «Cursar en la facultad» **no entra en ninguna** de las 24 variantes; «Un terciario cerca» entra en 3. «Trabajo de media jornada» y «Un curso de oficio» entran en 18 y 21 |
| `g7.notebook-offer` | Al acertar, el juego dice «El descuento en porcentaje era mayor que el descuento fijo, aunque sonara al revés», también en las 14 / 26 variantes donde el fijo era mayor |
| Repasos numéricos | Una única frase para toda respuesta no óptima: en el Repaso del abono, «El abono rinde un viaje más adelante de lo que dijiste», también a quien se pasó |

## Decisiones de B

| Hallazgo | B-DECISION | Confianza |
|---|---|---|
| MAT-001 | `REQUIRED_CORRECTION` | HIGH |
| MAT-002 | `REQUIRED_CORRECTION` | HIGH |
| MAT-003 | `REQUIRED_CORRECTION` | HIGH |
| MAT-004 | `REQUIRED_CORRECTION` | MEDIUM |
| MAT-005 | `REQUIRED_CLARIFICATION` | HIGH |
| MAT-006 | `ACCEPT_AS_DESIGNED` | HIGH |
| MAT-007 | `REQUIRED_CORRECTION` | MEDIUM |
| MAT-008 | `REQUIRED_CORRECTION` | HIGH |
| MAT-009 | `REQUIRED_CORRECTION` | HIGH |
| MAT-010 | `ACCEPT_AS_DESIGNED` | HIGH |
| MAT-011 | `REQUIRED_CLARIFICATION` | HIGH |
| MAT-012 | `DEFER_TO_FINAL_HUMAN_REVIEW` | MEDIUM |
| MAT-013 | `ACCEPT_WITH_DOCUMENTED_RISK` | MEDIUM |

`DEFER_TO_FINAL_HUMAN_REVIEW` no está en el enum de los revisores; B lo usa para
MAT-012 porque su juicio es exactamente ése, y lo señala para que el Chair lo
traduzca.

## Análisis por hallazgo

### MAT-001 — `y3.transport-pass`

**B-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**Interpretación probable del estudiante.** La Template quiere enseñar que la
conveniencia **depende del uso**. Un estudiante que juega varias veces aprende
otra cosa: que pagar por viaje nunca conviene y que el abono «por las dudas»
casi siempre rinde. Eso no es neutro: es exactamente el sesgo documentado de
tarifa plana, por el cual muchas personas eligen la tarifa plana aunque pagarían
menos por uso, con el «efecto seguro» entre sus causas (Lambrecht y Skiera,
2006). El juego reforzaría un error conceptual frecuente en la vida real en vez
de corregirlo.

**Mensaje contradictorio con su propio Repaso.** El Repaso aísla el umbral
«abono contra boleto» y lo trabaja bien. La Template que lo dispara nunca premia
el boleto. Un estudiante recibe dos reglas distintas en el mismo año.

**Feedback.** El texto de `efficient` es el mismo para toda opción: «Te conviene
si viajás bastante más o bastante menos que el mes pasado». Para el abono, que
sólo gana viajando más, «bastante menos» es falso. Un feedback correctivo útil
nombra la dirección (Shute, 2008: el feedback específico es el más efectivo para
corregir estrategias y errores).

**Regla de decisión.** «Viajes del mes pasado» funciona como estimación si está
dicho. Hoy un estudiante prudente elige lo que no sale caro en el peor mes, y
la escalera le dice que apostó. Con la regla escrita en lenguaje llano la tarea
sigue siendo CORE; sin ella, el estudiante adivina qué criterio usa el juego.

**Prerrequisito.** Multiplicar y comparar: accesible desde 7.º. No agregar
fórmulas, funciones escritas ni «punto de equilibrio» como jerga obligatoria.

**Remediación que B considera necesaria.** Variantes donde convenga cada una de
las cuatro formas —incluido el boleto suelto en meses de pocos viajes—, la regla
de estimación en pantalla, feedback `efficient` que diga hacia dónde gana esa
opción, y casos cercanos al cruce pero no a centavos del empate.

### MAT-002 — `y2.data-claim-review`

**B-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**Por qué importa más en un Repaso.** Es la segunda oportunidad de alguien que ya
se equivocó con el denominador. En aprendizaje para el dominio, la segunda
evaluación sirve para verificar si la corrección funcionó y dar otra oportunidad
real; si la respuesta es siempre la misma, no verifica nada. Una vez que el
estudiante vio el patrón sí / no / no, cierra el Repaso sin calcular: la tarea
baja al nivel de memorización de Stein y Smith, «reproducción exacta de material
visto antes».

**Qué variación es apropiada.** Mantener los tres datos y las tres afirmaciones,
y hacer que la respuesta dependa de las dos cuentas: variantes donde la cifra
supera la mitad del nivel (contestó mucha gente) y variantes donde ni siquiera
supera la mitad de las respuestas. La mayoría debe seguir siendo el contraste
típico —sí sobre respuestas, no sobre el nivel—, porque es el error que el Repaso
vino a reparar.

**Carga cognitiva.** No aumenta: los mismos datos, las mismas dos divisiones
mentales contra «la mitad». Sigue siendo QUICK.

### MAT-003 — «con claridad»

**B-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**Qué quiere medir la Template.** Qué se puede publicar a partir de una encuesta:
elegir el denominador, pesar a quienes no contestaron y no exagerar una
diferencia chica. Es alfabetización de datos, no estadística inferencial formal.

**Qué aprende hoy el estudiante.** Con 25 contra 18, el juego dice que se puede
publicar que una opción «le ganó con claridad». Sin criterio visible, el
estudiante infiere «si la diferencia se ve grande, hay claridad», que es la
creencia que la investigación encuentra en estudiantes de secundaria: la muestra
representa a la población sin importar su tamaño ni cómo se obtuvo (Watson y
Moritz, sobre insensibilidad al tamaño de muestra). Y lo aprende en la Template
cuyo propósito es enseñar prudencia con las muestras.

**Inconsistencia de lenguaje.** Las otras afirmaciones sobre respuestas dicen
«entre quienes contestaron». Ésta no. Un informe publicado que dice «el patio le
ganó a la biblioteca con claridad» se lee como la preferencia del nivel, y el
mismo juego enseña que sobre el nivel no se puede afirmar nada porque faltan
respuestas.

**Qué conviene.** B rechaza dos caminos: introducir significación estadística
—sobreformaliza y no es un requisito del piso universal— y dejar un umbral
oculto. Prefiere:

1. acotar la afirmación a quienes contestaron;
2. hacer visible el criterio como **regla de publicación del curso**, en palabras
   y con números, por ejemplo cuántas respuestas de diferencia hacen falta;
3. conservar la forma `margin` como el caso donde la diferencia no alcanza.

**Lenguaje que evita certeza no sustentada.** «Entre quienes contestaron…»,
«con esta encuesta no se puede saber qué prefiere todo el nivel». Nada de
«probablemente», «significativo» ni porcentajes de confianza.

**Evidencia curricular.** NAP, 2.º/3.º: «evaluar la razonabilidad de una
inferencia elaborada considerando datos estadísticos obtenidos a partir de una
muestra».

### MAT-004 — dos claves en la encuesta

**B-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** MEDIUM

**Error conceptual que se refuerza.** Si las afirmaciones sobre el nivel entero
son siempre «no se puede afirmar», el estudiante aprende «de una encuesta nunca
se puede decir nada sobre todos». Es el error opuesto al de la muestra
representativa, e igual de falso: si contestó casi todo el nivel, o si la
diferencia es mayor que toda la gente que falta, sí se puede afirmar. Los NAP
piden evaluar la **razonabilidad** de una inferencia, no rechazarla siempre.

**Confianza MEDIUM** porque cuántas claves hacen falta es menos un problema de
aula que de diseño de catálogo.

### MAT-005 — el modelo del torneo

**B-DECISION:** `REQUIRED_CLARIFICATION` · **Confianza:** HIGH

**Cómo razona un estudiante.** Con naturalidad: «si A pierde todo le quedan 12;
si B gana todo llega a 15». Es el razonamiento de «número mágico» de cualquier
tabla deportiva, accesible desde 7.º. Obligar a razonar el torneo conjunto
—quién juega contra quién, qué resultados son compatibles— sube la dificultad
por encima de lo que la Template STANDARD · QUICK promete.

**El problema es de lectura.** Un docente o un estudiante futbolero va a
preguntar contra quién se juegan esos partidos, y con 2/2/2/1 pendientes la
respuesta «entre ellos» es imposible. Hay que decirlo en la consigna.

**Lo que B no quiere.** Una corrección que obligue a razonar el fixture completo.
Si la aclaración exige cambiar datos para que el mundo sea coherente, que el
razonamiento por equipo siga alcanzando.

### MAT-006 — `g7.mural-paint`

**B-DECISION:** `ACCEPT_AS_DESIGNED` · **Confianza:** HIGH

**La escalera de tres niveles representa comprensiones distintas.** Comprar el
envase justo; comprar de más «por las dudas», que es una conducta real y
razonable a la que el juego responde bien —«Con el envase de $X alcanzaba
igual»—; y no alcanzar. No hay un cuarto estado didácticamente distinto.

**La lata de 1 L como distractor.** Captura el error típico de no pasar de metros
cuadrados a litros. Usar errores típicos de estudiantes como distractores es una
pauta establecida de escritura de ítems (Haladyna, Downing y Rodriguez, 2002,
pauta 30). Un distractor siempre incorrecto es lo esperable en un ítem.

**Teacher Gate 1** aceptó las situaciones y consignas de 7.º. B no encuentra
razón didáctica para reabrir el mural. Que 4 L sea la respuesta en más variantes
que 2 L no enseña ninguna regla falsa: comprar de más cuesta 60 puntos y el
feedback dice por qué.

### MAT-007 — `y4.represent-class`

**B-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** MEDIUM

**Qué aprende quien no se anima a nada.** Si marca todas las propuestas como «No
entra», obtiene «efficient» en 13 de 25 variantes: el juego le dice, en su
escala, que resolvió bien pero había algo mejor. Y la consecuencia narra que el
curso «habló por algo» en el consejo. Para una Template sobre representar al
curso, premiar la abstención total como casi buena es un mensaje equivocado, y la
consecuencia contradice lo que pasó.

**Corrección que B propone.** Que toda variante tenga al menos dos propuestas
viables, como `y5.next-step-options`, y que la consecuencia no narre una
presentación inexistente. No es fabricar un cuarto nivel: con dos viables,
retener todo cae naturalmente en «dejó varias viables afuera».

### MAT-008 — `y5.stage-screen`

**B-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**¿Induce razonamiento proporcional?** No. Cada opción ya dice de qué tamaño
queda la imagen, y la mejor es siempre «recortar del lado donde no está el
cartel», que es sentido común espacial. El estudiante nunca necesita calcular
cuánto se agranda la imagen ni cuánto sobra: la Template STRETCH de razón y
escala se resuelve leyendo de qué lado está el cartel.

**Objetivo.** La consigna pide «sin comerte el cartel». No dice que la mejor
proyección es la que llena la pantalla. Un estudiante que prefiere no recortar
nada de la foto del curso tiene una razón legítima y recibe 75 sin saber por qué.

**Lo que no hay que hacer.** Meter jerga de relación de aspecto: el invariante
`LOCKED` es que todo esté en centímetros, y está bien. La corrección tiene que
hacer necesaria la cuenta de escala y recorte, y decir el objetivo en la
consigna.

### MAT-009 — `y5.next-step-options`

**B-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

B considera este hallazgo **más grave** que el LOW del pre-review, por tres
razones.

1. **Guardrail vocacional.** La ficha de diseño es `LOCKED` en que la Template no
   es orientación vocacional y nunca sugiere que universidad, trabajo, curso u
   otra opción valga más. En el catálogo, «Cursar en la facultad» no entra en
   **ninguna** de las 24 variantes y «Un terciario cerca» entra en 3; trabajar
   y el curso de oficio entran casi siempre. En todo el espacio de candidatas
   aprobadas la facultad entra en 16 de 292. No es una afirmación explícita,
   pero es un currículum oculto: el año de cierre le muestra al estudiante, una y
   otra vez, que estudiar no le entra en la semana. Para estudiantes de contextos
   donde la universidad ya se percibe lejana, ese mensaje repetido es exactamente
   lo que el guardrail quiere evitar.
2. **Patrón memorizable.** 17 de 24 variantes tienen la misma respuesta.
3. **Lectura razonable no contemplada.** «Horas libres por semana» y «viaje por
   día» se evalúan por separado. Un estudiante que suma el viaje a las horas
   —«si tardo una hora en llegar, esa hora también la pierdo»— clasifica distinto
   en 4 variantes. Hay que decir si el viaje cuenta o no.

Menor: el día aparece como «los mie», sin tilde.

### MAT-010 — `g7.notebook-offer`

**B-DECISION:** `ACCEPT_AS_DESIGNED` · **Confianza:** HIGH

Comparar dos ofertas contra la plata que hay es una decisión binaria genuina.
Un nivel intermedio sería inventado. **Pero** ver B-NEW-1: la explicación que el
juego da al acertar es falsa en más de la mitad del catálogo.

### MAT-011 — `y4.course-project-fundraiser`

**B-DECISION:** `REQUIRED_CLARIFICATION` · **Confianza:** HIGH

**Nombrar el concepto sí ayuda**, con una condición: que el nombre acompañe al
significado y no lo reemplace. «Cubrir los costos —el punto de equilibrio—: que lo
que dejan las bandejas vendidas pague el alquiler» conecta la Template con su
Repaso de margen y con el lenguaje que un docente usa.

**Dos cosas más que el estudiante tiene que poder leer.** Que el máximo exige
llegar al objetivo **con** el colchón —hoy la consigna no lo nombra— y que se
supone que todo lo que se prepara se vende.

### MAT-012 — cobertura de carrera

**B-DECISION:** `DEFER_TO_FINAL_HUMAN_REVIEW` · **Confianza:** MEDIUM

**Contraste curricular.** Los NAP del ciclo básico piden, entre otras cosas,
«comparar las probabilidades de diferentes sucesos incluyendo casos que
involucren un conteo ordenado sin necesidad de usar fórmulas» y «modelizar
variaciones uniformes y expresarlas eligiendo la representación más adecuada a la
situación». La carrera no tiene una tarea de probabilidad de sucesos, y las
relaciones lineales aparecen como cuentas y no como representación.

**Por qué diferir.** El proyecto decidió que el currículum es contexto y no
barrera, y que el marco de contraste es nacional
([D-S08-091](../07-reference/decision-register.md)). Si el juego se usa dentro de
una institución que necesita esos ejes, es una decisión institucional sobre un
diseño curricular concreto. Pedir nuevas Templates ahora sería ordenar contenido
porque falta un eje, no porque falle un objetivo propio del juego.

### MAT-013 — demanda con juego repetido

**B-DECISION:** `ACCEPT_WITH_DOCUMENTED_RISK` · **Confianza:** MEDIUM

Stein y Smith describen la tarea de memorización como la que se resuelve por
reproducción exacta de lo visto antes. Con reintentos sobre la misma partida,
eso ocurre en cualquier juego. El riesgo didáctico real es otro y más acotado:
que un **atajo** aprendido en una partida sirva en todas —«siempre abono», «sí,
no, no»—. Esos atajos ya están nombrados en MAT-001, MAT-002, MAT-004, MAT-008 y
MAT-009. Lo que queda es un riesgo a observar en la feria.

## Hallazgos nuevos que B detectó

Los identificadores son propios de este informe. La numeración canónica
`MAT-AJ-NEW-XXX` la asigna el Chair.

| ID de B | Template | Hallazgo | B-DECISION |
|---|---|---|---|
| B-NEW-1 | `g7.notebook-offer` | El feedback de acierto afirma que el porcentaje descontaba más «aunque sonara al revés» también cuando el descuento fijo era mayor (14 / 26). Es feedback que enseña la comparación al revés, justo al estudiante que la hizo bien | `REQUIRED_CORRECTION` |
| B-NEW-2 | 5 Repasos numéricos | La frase para toda respuesta no óptima describe un solo sentido de error. En `y3.fixed-variable-review` quien se pasó por uno lee que se quedó corto; en `y4.margin-review` quien dijo de más lee que «cree que ya cubrió»; análogo en `y3.rate-capacity-review`, `y4.spatial-capacity-review` y `y5.proportion-capacity-review`. En un Repaso, un diagnóstico del error equivocado es peor que ninguno | `REQUIRED_CORRECTION` |
| B-NEW-3 | `y5.course-project-final` | Repartir todas las tareas entre los que quedan funciona en casi todas las variantes, así que la contingencia nunca obliga a priorizar ni a recortar: la Template enseña «repartí parejo» en vez de «rehacé el plan con lo que hay» | `REQUIRED_CORRECTION` |
| B-NEW-4 | `y5.next-step-options` | La facultad nunca entra (ver MAT-009). B lo registra aparte porque es un guardrail de producto, no un problema de claves | `REQUIRED_CORRECTION` |

## Fuentes

- Ministerio de Educación de la Nación, [NAP Matemática, Ciclo Básico de Educación Secundaria](https://bnm.educacion.gob.ar/digital/documentos/EL004315.pdf), 2.ª ed. 2011. Texto verificado para las tres citas usadas.
- Lambrecht, A. y Skiera, B. (2006). [Paying too much and being happy about it: Existence, causes, and consequences of tariff-choice biases](https://journals.sagepub.com/doi/10.1509/jmkr.43.2.212). *Journal of Marketing Research*, 43(2), 212–223. Verificado a nivel de resumen: sesgo de tarifa plana más frecuente y persistente que el de pago por uso; efecto seguro entre sus causas.
- Shute, V. J. (2008). [Focus on formative feedback](https://journals.sagepub.com/doi/10.3102/0034654307313795). *Review of Educational Research*, 78(1), 153–189. Texto verificado: el feedback puede corregir estrategias inapropiadas, errores de procedimiento o concepciones erróneas, y esa función correctiva es especialmente potente cuando el feedback es más específico.
- Smith, M. S. y Stein, M. K. (1998). Selecting and creating mathematical tasks: From research to practice. *Mathematics Teaching in the Middle School*, 3(5), 344–350. [Task Analysis Guide](https://mcp-coaching.osu.edu/files/2015/11/3-5-3-Smith_Stein_2011_Task_analysis_guide.pdf), texto verificado.
- Haladyna, T. M., Downing, S. M. y Rodriguez, M. C. (2002). [A review of multiple-choice item-writing guidelines for classroom assessment](https://eric.ed.gov/?id=EJ660246). *Applied Measurement in Education*, 15(3), 309–333. Texto verificado: pauta 29 «Make all distractors plausible», pauta 30 «Use typical errors of students to write your distractors».
- Watson, J. M. y Moritz, J. B. (2000). Developing concepts of sampling. *Journal for Research in Mathematics Education*, 31(1), 44–70. Verificado a través de [literatura que lo cita](https://link.springer.com/article/10.1007/s13138-022-00213-x): la insensibilidad al tamaño de muestra aparece en estudiantes escolares. Fuente secundaria para ese enunciado.
- Guskey, T. R. (2007). [Closing achievement gaps: Revisiting Benjamin S. Bloom's «Learning for Mastery»](https://eric.ed.gov/?id=EJ786608). *Journal of Advanced Academics*, 19(1), 8–31. La función de la segunda evaluación —verificar si los correctivos ayudaron y dar una segunda oportunidad— se verificó a través de una [revisión que lo cita](https://files.eric.ed.gov/fulltext/ED523991.pdf). Fuente secundaria.
