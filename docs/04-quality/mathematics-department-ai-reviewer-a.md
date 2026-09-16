# Revisor A — Matemática, modelización y corrección formal

- **Estado:** `FROZEN` — cerrado el 2026-09-16, antes de redactar los informes
  B y C. No se reescribe para alinearse con ellos
- **Proceso:** AI Mathematics Department — Independent Adjudication
- **Naturaleza:** opinión independiente asistida por IA. **No** es la decisión
  canónica —ésa es del Chair, en la
  [adjudicación](mathematics-department-ai-adjudication.md)— y **no** es una
  revisión del Departamento de Matemática humano
- **Objeto:** `main` en `9ea3896`, catálogo aprobado `grade-5-dev-2` (1025
  variantes), contenido `5.1.0-grade-5`, ruleset `1.0.0-full-career`

**Pregunta central.** ¿La matemática y el modelo formal son correctos,
consistentes y capaces de sostener el constructo que cada Template declara?

Este revisor no prioriza engagement, narrativa, preferencias curriculares ni
estética del puntaje. Cuando un hallazgo es sobre todo didáctico o de validez de
evaluación, lo dice y no finge una certeza matemática que no tiene.

## Independencia y límites

- La ejecución la hizo un único agente. El aislamiento entre revisores es
  **lógico, no físico**: este informe se escribió y congeló primero, sin
  conclusiones de B ni de C, que todavía no existían.
- Las fuentes fueron primarias: código de `src/content/`, evaluadores, oráculos,
  gates, catálogo aprobado, tests, documentos de diseño y el
  [pre-review](mathematics-department-pre-review.md) como registro de hallazgos,
  no como conclusión a confirmar.
- Los números salen de **enumeración sobre el catálogo aprobado real**:
  materializar cada variante aprobada con el catálogo de carrera completa y
  evaluar con el evaluador real todas las respuestas del espacio finito. Los
  scripts fueron temporales, fuera del árbol versionado, y se borraron; el
  procedimiento está en la
  [adjudicación](mathematics-department-ai-adjudication.md) para reproducirlo.

## Evidencia re-derivada que usa este informe

| Medida | Resultado |
|---|---|
| `y3.transport-pass`: opción más barata en algún número de viajes del rango | boleto suelto **0 / 25** variantes |
| `y3.transport-pass`: espacio de candidatas aprobadas por los gates | 29.803 de 64.800; suelto óptimo en **75** (0,25 %); abono óptimo o eficiente en **26.864** (90,1 %) |
| `y3.transport-pass`: la regla de peor caso (minimax de costo) elige otra opción que la clave | **17 / 25** variantes; el costo medio sobre el rango, **6 / 25** |
| `y3.transport-pass`: diferencia entre la más barata y la segunda en `likely` | mínimo **$10 (0,1 %)**; 3 / 25 variantes debajo del 2 % |
| `y2.data-claim-review`: vector de verdad en el espacio completo del generador | **48 / 48** candidatas con `TFF` |
| `y2.course-project-survey`: `(primera − segunda) ≤ no contestaron` | **25 / 25** variantes |
| `y2.course-project-survey`: afirmaciones con verdad constante en el catálogo | 4 de 6; `year-prefers` es `false` escrito a mano |
| `y2.standings-claim`: suma de partidos pendientes impar | **13 / 25** |
| `y2.standings-claim`: con suma par, clasificación conjunta bajo **todo** fixture y todo resultado contra la clasificación por cotas independientes | **idéntica en 12 / 12** |
| `y2.standings-claim`: empates decisivos para la regla estricta | **0** en el catálogo; la regla del código es asimétrica |
| `y5.stage-screen`: la óptima es «recortar del lado opuesto al cartel» | **25 / 25** |
| `y5.stage-screen`: la óptima cambia al mover el aire del cartel entre 0 y 100 cm | **nunca** (25 / 25) |
| `y5.stage-screen`: con el evaluador actual, un recorte centrado que respeta el cartel | empata **siempre** con el recorte opuesto (0 óptimos únicos en 7.163 perturbaciones) |
| `y5.course-project-final`: «repartir todo» es plan óptimo | **22 / 24** variantes; 568 de 664 candidatas aprobadas |
| `g7.notebook-offer`: la oferta fija es la óptima | **14 / 26** variantes |
| `y5.next-step-options`: contar el viaje dentro de las horas libres cambia la clasificación | **4 / 24** variantes |

## Decisiones de A

| Hallazgo | A-DECISION | Confianza |
|---|---|---|
| MAT-001 | `REQUIRED_CORRECTION` | HIGH |
| MAT-002 | `REQUIRED_CORRECTION` | HIGH |
| MAT-003 | `REQUIRED_CORRECTION` | HIGH |
| MAT-004 | `REQUIRED_CORRECTION` | MEDIUM |
| MAT-005 | `REQUIRED_CORRECTION` | HIGH |
| MAT-006 | `ACCEPT_WITH_DOCUMENTED_RISK` | MEDIUM |
| MAT-007 | `REQUIRED_CLARIFICATION` | MEDIUM |
| MAT-008 | `REQUIRED_CORRECTION` | HIGH |
| MAT-009 | `REQUIRED_CLARIFICATION` | MEDIUM |
| MAT-010 | `ACCEPT_AS_DESIGNED` | HIGH |
| MAT-011 | `REQUIRED_CLARIFICATION` | HIGH |
| MAT-012 | `ACCEPT_WITH_DOCUMENTED_RISK` | MEDIUM |
| MAT-013 | `INSUFFICIENT_EVIDENCE` | HIGH |

## Análisis por hallazgo

### MAT-001 — `y3.transport-pass`

**A-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**Problema matemático exacto.** El generador fija el precio del abono como
`pass = high × fare × factor`, con `factor ∈ {0,72; 0,84; 0,96; 1,08}`: el precio
de un producto de la ciudad depende de cuántos viajes va a hacer **este**
jugador. Eso hace que el abono quede siempre cerca del costo de la tarjeta en el
extremo alto del rango y gane allí casi siempre: es óptimo o eficiente en el
90,1 % del espacio aprobado. Del otro lado, ninguna forma de mes baja de 12
viajes y el boleto suelto sólo gana hasta 1–21 viajes; en el catálogo publicado
no gana en ningún punto del rango. El umbral fijo/variable existe —la
conveniencia cambia dentro del rango en las 25 variantes, como exige el gate
`LOCKED`—, pero sólo entre tarjeta, combo y abono.

**Supuesto de modelo no declarado.** La clave toma como óptima la opción más
barata para `likely`, «viajes del mes pasado». La consigna pide gastar menos
«este mes», y la pantalla dice que este mes puede tener entre `low` y `high`.
Sin una regla de decisión explícita, el problema bajo incertidumbre no tiene un
óptimo único: la regla de peor caso elige otra opción en 17 de 25 variantes y
el costo medio sobre el rango, en 6 de 25. La escalera actual trata esas
elecciones como `efficient` («una apuesta»), lo cual es coherente **si** la regla
«este mes como el pasado» está dicha; hoy no lo está.

**Casos de borde.** En tres variantes la diferencia entre la más barata y la
segunda en `likely` es de $10, $30 y $130, es decir 0,1 %, 0,4 % y 1 % del
costo óptimo: el nivel depende de una diferencia que es precisión de cuenta, no
comprensión del umbral.

**Reproducción.** `passChoices(p)` sobre las 25 variantes aprobadas;
`cheapestAt(p, n)` para cada `n` del rango; barrido de
`generatePass(i)` + `passGates` sobre `PASS_SPACE`.

**Remediación mínima matemáticamente válida.**

1. Desacoplar el precio del abono del rango de viajes del jugador: el precio es
   un dato del mes o de la ciudad.
2. Incluir perfiles de uso donde el pago por uso sea el más barato en `likely`,
   y perfiles donde lo sea cada una de las otras tres.
3. Declarar en pantalla la regla con la que se decide: calcular con los viajes
   del mes pasado, y el rango como información para ver si la conveniencia se
   da vuelta.
4. Exigir una diferencia mínima visible entre la óptima y la segunda en
   `likely`.

**No cambiar.** Las cuatro opciones, el rango de viajes, el gate `LOCKED` del
umbral dentro del rango, la semántica de la escalera
(`efficient` = gana en otra cantidad posible del mes) ni la evaluación del
Repaso de umbral, que es correcta; su feedback es otro asunto (A-NEW-3).

**Evidencia externa.** NAP, ciclo básico, álgebra y funciones: «modelizar
variaciones uniformes y expresarlas eligiendo la representación más adecuada a
la situación». Un costo fijo más uno por unidad es una variación uniforme con
ordenada distinta de cero; su comparación sólo tiene sentido si ambos lados del
cruce existen.

### MAT-002 — `y2.data-claim-review`

**A-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**Problema exacto.** No es un accidente de muestreo: las 48 candidatas del
generador producen el mismo vector de verdad `TFF`, porque el generador fija
`chose = ⌊answered/2⌋ + 1 + k` y el gate rechaza `chose × 2 > population`. La
tercera afirmación («Sabemos qué eligió quien no contestó») es falsa por
construcción. Con una sola afirmación cierta, «dos o más errores sin publicar
algo falso» es imposible: `functional` no existe y retener todo es `efficient`.

**Alternativas matemáticamente válidas.** Sobre los mismos tres datos hay tres
vectores posibles para las dos primeras afirmaciones: `TF` (el contraste del
denominador), `TT` (la cifra supera la mitad del nivel, lo que exige que haya
contestado más de la mitad) y `FF` (la cifra no llega a la mitad de las
respuestas). `FT` es imposible: si `chose > population/2`, también
`chose > answered/2`. La tercera afirmación puede quedar como control fijo.

**Remediación mínima.** Permitir los tres vectores posibles en el catálogo, con
`TF` como forma mayoritaria. Corregir la ficha de diseño, que hoy describe
«una sola afirmación por pantalla» y cuatro niveles.

**No cambiar.** Los datos en pantalla, la cantidad de afirmaciones, la etiqueta
«Se puede afirmar / No se puede afirmar», el rol de recuperación ni su exclusión
de FairScore.

### MAT-003 — `y2.course-project-survey`, «con claridad»

**A-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**Problema exacto.** Hay dos defectos formales, y el segundo es más grave que el
que describe el pre-review.

1. «Le ganó con claridad» no tiene significado matemático sin un criterio
   declarado. El evaluador usa `(primera − segunda) × 10 > respuestas`, que no
   aparece en pantalla.
2. La afirmación es la única sobre las respuestas que **no** está acotada a
   «entre quienes contestaron». Leída sobre el nivel, que es la lectura natural
   de un informe publicado, el propio modelo del juego la declara imposible de
   afirmar: la Template sostiene que no se puede afirmar «El nivel entero
   prefiere…» porque no se sabe qué eligió quien no contestó, y en **25 de 25**
   variantes la gente que no contestó alcanza para dar vuelta la diferencia entre
   las dos primeras. Con esa lectura, la clave es incorrecta en las 14 variantes
   donde «con claridad» se da como afirmable, y el feedback `efficient` le dice
   al jugador consistente que «también se podía afirmar».

**Sobre el argumento del error estándar.** El pre-review estima un error
estándar de unos 13 puntos para 25 contra 18 sobre 48. Ese cálculo supone
muestreo aleatorio, y una encuesta con respuesta voluntaria no lo es: el
problema no es que la diferencia no sea «significativa», es que la no respuesta
no es ignorable y ningún número sobre el nivel se sigue de los datos. Como
contraste descriptivo, en 5 de las 14 variantes con «claridad» afirmable el
cociente diferencia / error estándar queda debajo de 1,96.

**Remediación mínima.** Acotar la afirmación a quienes contestaron y reemplazar
«con claridad» por un criterio verificable escrito en pantalla, o quitar el
calificativo. No introducir pruebas de significación: el modelo de muestra no las
justifica.

**No cambiar.** Las tres trampas de la Template —denominador, no respuesta y
diferencia chica—, la asimetría «publicar algo falso es peor que retener algo
cierto» ni la aritmética entera sin porcentajes redondeados.

**Evidencia externa.** NAP, 2.º/3.º: «evaluar la razonabilidad de una inferencia
elaborada considerando datos estadísticos obtenidos a partir de una muestra».
Makar y Rubin (2009) ubican la generalización más allá de los datos y el lenguaje
probabilístico como principios de la inferencia informal: el juego tiene que
distinguir con palabras qué se dice de la muestra y qué del nivel.

### MAT-004 — `y2.course-project-survey`, dos claves

**A-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** MEDIUM

**Problema exacto.** Cuatro de seis afirmaciones tienen verdad constante en el
catálogo, y la clave queda determinada por la forma: `TTFFTT` en las formas
`denominator` y `missing-data`, `TFFFFT` en `margin`. Además, `year-prefers` no
se calcula: se escribe `supported: false`. Hoy es correcto porque los rangos del
generador impiden el caso contrario, pero ningún gate lo garantiza; si la
diferencia entre la primera opción y cada una de las otras supera a toda la
gente que no contestó, «El nivel entero prefiere…» **sí** es afirmable por cota
de peor caso, y el oráculo lo marcaría mal.

**Remediación mínima.** Derivar `year-prefers` de los datos con la cota de peor
caso y dejar que las afirmaciones sobre el nivel sean afirmables en algunas
variantes con respuesta alta. La confianza es MEDIUM porque cuánta variedad hace
falta es sobre todo una pregunta de validez, no de corrección.

### MAT-005 — `y2.standings-claim`, modelo del torneo

**A-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**Problema exacto.** Las cotas `min = puntos`, `max = puntos + faltan × porVictoria`
son exactas sólo si los partidos pendientes de cada curso son independientes.
La pantalla muestra cuatro cursos y nada más; bajo la lectura natural —juegan
entre ellos— 13 de 25 variantes son **irrealizables**: la suma de pendientes es
impar.

**Lo que la enumeración agrega al pre-review.** Para las 12 variantes con suma
par se enumeraron todos los fixtures posibles entre los cuatro cursos y todos
los resultados de cada uno. La clasificación conjunta coincide con la de cotas
independientes en las 12. Es decir: donde el mundo es realizable, la clave es
correcta bajo las dos lecturas. El defecto es de modelo del mundo y de
ambigüedad, no de respuesta equivocada. En general no es así: decidir si un
equipo todavía puede ganar un torneo exige razonar conjuntamente, y Schwartz
(1966) lo resuelve con flujo máximo. Que coincidan acá es una propiedad de estas
variantes, no del método.

**Defecto latente de empates.** `seguro` exige `min propio > max ajeno`, es
decir, no cuenta un empate como terminar arriba. `imposible` exige
`min ajeno > max propio`, así que cuando el máximo de un curso **iguala** el
mínimo de otro —lo mejor que puede lograr es empatar— el código dice «posible»
para «termina arriba» y «termina primero»: ahí sí cuenta el empate como terminar
arriba. Las dos reglas leen el empate al revés. En el catálogo no hay ningún
empate decisivo, así que hoy no cambia ninguna clave.

**Remediación mínima.**

1. Generar pendientes realizables entre los cuatro cursos (suma par, ningún curso
   con más pendientes que la suma de los otros).
2. Gate: la clasificación por cotas independientes coincide con la conjunta bajo
   todo fixture y todo resultado. Eso mantiene la dificultad —las cotas por curso
   alcanzan— y hace correcta la lectura del torneo.
3. Decir en pantalla que los partidos que faltan se juegan entre estos cursos.
4. Una regla de empate coherente, o un gate que rechace empates decisivos.

**No cambiar.** La separación Math / Aura, las tres categorías ni la aritmética
entera.

**Por qué no la opción «contra otros años».** Hace exactas las cotas, pero vuelve
ambiguo «termina primero»: si hay rivales fuera de la tabla, también compiten.

### MAT-006 — `g7.mural-paint`

**A-DECISION:** `ACCEPT_WITH_DOCUMENTED_RISK` · **Confianza:** MEDIUM

**Matemática.** Correcta: área en centésimas, litros exactos, suficiencia por
comparación entera. La escalera de tres niveles es honesta: con un solo envase
entre 1, 2 y 4 L y la promesa de que 1 L nunca alcanza, no existe un estado
matemático intermedio entre «el más barato que alcanza» y «alcanza pero cuesta
más». La lata de 1 L siempre insuficiente es la promesa escrita del generador,
no un error.

**Observación formal.** El mensaje de `verify` «todos los envases alcanzan, así
que la decisión no importa» es inexacto: si alcanzan todos, el precio sigue
decidiendo. No cambia ninguna variante aprobada.

**Riesgo.** Que 4 L sea la respuesta en 16 de 26 variantes es un efecto de
muestreo: el generador sortea 2 L y 4 L con igual probabilidad. No es un defecto
matemático; su efecto sobre la validez lo juzga otro dominio.

### MAT-007 — `y4.represent-class`

**A-DECISION:** `REQUIRED_CLARIFICATION` · **Confianza:** MEDIUM

**Matemática.** Con una sola propuesta viable —13 de 25 variantes— «dos o más
viables afuera» no puede ocurrir. La ausencia de `functional` es honesta.

**Inconsistencia de feedback.** Si el jugador marca todas como «No entra»,
obtiene `efficient` y una consecuencia que afirma que el curso «habló por algo»
ante el consejo, cuando no llevó nada. La narrativa contradice el modelo, que
es uno de los criterios de ambigüedad del
[marco matemático](../01-game-design/math-design-framework.md).

**Remediación mínima.** Que la consecuencia no afirme una presentación que no
existió. Si otro dominio exige además que la abstención total no alcance
`efficient`, la vía matemáticamente limpia es pedir al menos dos propuestas
viables por variante, como ya hace `y5.next-step-options`.

### MAT-008 — `y5.stage-screen`

**A-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

**Problema exacto, con demostración.** Sea `E > 0` el alto sobrante al llenar el
ancho. Con el cartel de un solo lado, «recortar todo del lado opuesto» deja
recorte cero del lado del cartel, así que `keepsBanner` es verdadero para
cualquier aire, cualquier cartel y cualquier escala, y la pantalla queda llena.
Esa opción es óptima siempre que `E > 0`, y el generador garantiza `E > 0`. El
recorte centrado es inválido por gate y el recorte del lado del cartel también,
porque `E` supera al recorte centrado, que ya supera al aire escalado. **Ninguna
de las opciones cuyo nivel depende de la cuenta de escala puede ser óptima.**
El aire del cartel no cambia la óptima en ninguna de las 25 variantes: el
Intrinsic Math Gate IM-1 falla en todas.

**Consecuencia estructural.** Con un solo elemento protegido, un recorte
centrado válido empata con el recorte opuesto, y el gate de óptimo único lo
rechaza. Para que la cuenta de escala decida, hace falta una restricción del
otro lado: un segundo elemento protegido con su propio margen, o equivalente.
Con dos, cada recorte —arriba, abajo, centrado— es válido o no según `E`, la
escala y los dos márgenes, y si ninguno lo es, la imagen entera con bandas es la
mejor proyección posible.

**Objetivo oculto.** La consigna dice «sin comerte el cartel del curso»; la
escalera premia además llenar la pantalla. Tiene que estar dicho.

**No cambiar.** El invariante `LOCKED`: toda la geometría en centímetros, sin
jerga de relación de aspecto. Estirar sigue siendo inválido siempre.

### MAT-009 — `y5.next-step-options`

**A-DECISION:** `REQUIRED_CLARIFICATION` · **Confianza:** MEDIUM

**Supuesto de modelo.** «Horas libres por semana» y «minutos de viaje por día» se
tratan como restricciones separadas: el viaje no consume horas. Contarlo dentro
de las horas —lectura razonable de «entra en mi semana»— cambia la clasificación
en 4 de 24 variantes. Por la asimetría de la escalera, esa lectura no da
`invalid`, pero baja a `efficient` o `functional` a un razonamiento correcto bajo
otro modelo.

**Notación.** El día tomado se muestra como «los mie», sin tilde.

La concentración de claves (4 claves en 24 variantes) no es un defecto
matemático; A no la juzga.

### MAT-010 — `g7.notebook-offer`

**A-DECISION:** `ACCEPT_AS_DESIGNED` · **Confianza:** HIGH

Dos ofertas y un presupuesto a mitad de camino entre sus totales: exactamente una
entra. No existe un estado matemático intermedio, y fabricar crédito parcial
sería falso. **Pero ver A-NEW-2, abajo**: el feedback óptimo de esta Template es
falso en 14 de 26 variantes.

### MAT-011 — `y4.course-project-fundraiser`

**A-DECISION:** `REQUIRED_CLARIFICATION` · **Confianza:** HIGH

El evaluador separa bien tres condiciones: ganancia no negativa (cubrir costos,
punto de equilibrio), ganancia ≥ objetivo, y ganancia ≥ objetivo + colchón. Dos
supuestos quedan implícitos:

1. **Se vende todo lo que se prepara.** La ganancia es precio × cantidad
   preparada; la instrucción misma dice que el costo fijo se paga «se venda o no»,
   que sugiere lo contrario.
2. **El óptimo exige el colchón**, y la consigna sólo nombra «cubrir los costos»
   y «llegar a lo que el curso necesita juntar».

Nombrar el punto de equilibrio es útil; no es necesario para la corrección.

### MAT-012 — cobertura de carrera

**A-DECISION:** `ACCEPT_WITH_DOCUMENTED_RISK` · **Confianza:** MEDIUM

Precisión que el mapa de cobertura no hace: las Templates etiquetadas
`probability-and-uncertainty` no cuantifican azar. La tabla del Intercurso usa
cotas deterministas —«posible» es posibilidad lógica— y la encuesta usa
proporciones descriptivas. La rueda de 1.º usa notación de probabilidad sobre
posiciones equiprobables. Ninguna Template pide comparar probabilidades de
sucesos. Tampoco hay representación explícita de una función. No es un error del
juego —su marco dice que el año no es barrera curricular—, pero la cobertura tiene
que describirse así, sin sobrestimarla.

### MAT-013 — demanda cognitiva con juego repetido

**A-DECISION:** `INSUFFICIENT_EVIDENCE` · **Confianza:** HIGH

Si la demanda decae con la repetición es una pregunta empírica y didáctica. Nada
en el modelo formal la decide.

## Hallazgos nuevos que A detectó

Los identificadores son propios de este informe. La numeración canónica
`MAT-AJ-NEW-XXX` la asigna el Chair.

| ID de A | Template | Hallazgo | A-DECISION |
|---|---|---|---|
| A-NEW-1 | `y5.course-project-final` | «Repartir todo» es óptimo en 22 de 24 variantes: con `ceil(horas/3)` por persona, la carga total cabe en la disponibilidad salvo en parte de la forma `menos-horas`. La viabilidad bajo contingencia que el diseño `LOCKED` promete medir se satisface con un plan constante | `REQUIRED_CORRECTION` |
| A-NEW-2 | `g7.notebook-offer` | El feedback óptimo afirma «El descuento en porcentaje era mayor que el descuento fijo, aunque sonara al revés» también cuando gana la oferta fija: falso en 14 de 26 variantes, y contradice los datos que muestra al lado | `REQUIRED_CORRECTION` |
| A-NEW-3 | 5 Repasos numéricos | La consecuencia no óptima describe un solo sentido de error: en `y3.fixed-variable-review` dice «El abono rinde un viaje más adelante de lo que dijiste» también a quien dijo uno de más; análogo en `y4.margin-review`, `y3.rate-capacity-review`, `y4.spatial-capacity-review` y `y5.proportion-capacity-review` | `REQUIRED_CORRECTION` |
| A-NEW-4 | `y2.standings-claim` | Regla de empate asimétrica, latente: 0 empates decisivos hoy | `REQUIRED_CORRECTION` |
| A-NEW-5 | ficha de 2.º | La ficha describe formas `majority`, `margin`, `least-chosen` y un Repaso de una afirmación con cuatro niveles; el código tiene `denominator`, `missing-data`, `margin` y tres afirmaciones sin `functional` | `REQUIRED_CORRECTION` (sólo documentación) |

## Fuentes

- Ministerio de Educación de la Nación, [NAP Matemática, Ciclo Básico de Educación Secundaria](https://bnm.educacion.gob.ar/digital/documentos/EL004315.pdf), 2.ª ed. 2011. Texto verificado: «modelizar variaciones uniformes y expresarlas eligiendo la representación más adecuada a la situación»; «evaluar la razonabilidad de una inferencia elaborada considerando datos estadísticos obtenidos a partir de una muestra».
- Schwartz, B. L. (1966). «Possible winners in partially completed tournaments». *SIAM Review*, 8(3), 302–308. Referencia bibliográfica verificada; que la eliminación se decide con un cálculo de flujo máximo —no con cotas por equipo— se verificó en la literatura que lo cita, por ejemplo [Thresholds for Sports Elimination Numbers](https://link.springer.com/chapter/10.1007/3-540-48447-7_33). Fuente secundaria para ese enunciado.
- Makar, K. y Rubin, A. (2009). [A framework for thinking about informal statistical inference](https://iase-pub.org/ojs/SERJ/article/view/457). *Statistics Education Research Journal*, 8(1), 82–105. Verificado a nivel de resumen: tres principios —generalizar más allá de los datos, lenguaje probabilístico, datos como evidencia—.
