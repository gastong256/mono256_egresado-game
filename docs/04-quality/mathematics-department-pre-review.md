# Pre-revisión de Matemática para el Departamento

- **Estado:** `EXECUTED` — ejecutada el 2026-09-16 sobre `1e88d46`, con el
  catálogo aprobado real y el contenido de 7.º a 5.º
- **Naturaleza:** pre-revisión asistida por IA. **No es** la revisión del
  Departamento de Matemática y no puede aprobarla
- **Veredicto:** `PRE-REVIEW READY FOR HUMAN MATHEMATICS DEPARTMENT REVIEW`
- **Adjudicado:** el 2026-09-16 por el
  [Departamento de Matemática provisional](mathematics-department-ai-adjudication.md),
  que decidió cada hallazgo, agregó siete nuevos y corrigió afirmaciones de este
  informe —ver su sección R—. Este documento se conserva como registro de lo
  ejecutado y **no se reescribe**. La revisión del Departamento humano quedó
  diferida a Final Delivery / Pre-Release Acceptance (D-S08-095)

## A. Veredicto ejecutivo

`PRE-REVIEW READY FOR HUMAN MATHEMATICS DEPARTMENT REVIEW`.

No se encontró matemática incorrecta: los evaluadores que se auditaron calculan
lo que dicen calcular, con aritmética entera y sin errores de unidades, de
redondeo ni de frontera. No se encontró ningún problema sin solución, ningún
nivel requerido inalcanzable que rompa el juego, ni feedback que enseñe una
regla falsa.

Sí se encontraron **trece hallazgos**, ninguno BLOCKER: dos HIGH, seis MEDIUM,
tres LOW y dos observaciones. El más importante es de **validez de evaluación**,
no de aritmética: en tres Templates una estrategia ciega —elegir siempre la
misma opción, sin hacer ninguna cuenta— rinde entre 75 y 78 puntos sobre 100.
Eso convive mal con el objetivo de producto de que el ranking esté «dominado por
la matemática» y con que la feria sea una competencia repetible.

Ninguna corrección fue aplicada. El objeto que el Departamento va a revisar es
exactamente el que está en `main`.

## B. Alcance

Revisado:

- las **42 Templates** del catálogo de carrera completa, una por una;
- los **10 Repasos**, con su concepto, su simplificación y su debrief;
- las **1025 variantes aprobadas**, con chequeos automáticos sobre el catálogo
  entero y enumeración exhaustiva del espacio de respuestas donde es finito;
- el texto visible al jugador: consigna, datos, etiquetas, unidades, resultado y
  feedback de los cuatro niveles;
- la progresión 7.º → 5.º como cobertura de dominios y demanda cognitiva;
- la separación de evidencia Math / Equipo / Aura / Estilo;
- la validez de FairScore, sin recalibrar nada.

No revisado, por estar fuera del alcance de una pre-revisión: la comprensión
real de estudiantes, el pacing con jugadores, la dinámica de aula y la
adecuación social local. Ver [limitaciones](#s-limitaciones).

## C. Baseline

| Dato | Valor |
|---|---|
| Branch | `main` |
| HEAD | `1e88d469e945b81e5fd3f6c0595e283345756375` |
| Motor | `10.0.0` · action log `7` · snapshot `8` |
| Ruleset de carrera | `1.0.0-full-career` (`official: false`) |
| Contenido | `5.1.0-grade-5` |
| Catálogo aprobado | `grade-5-dev-2` |
| Familias de escenario | 22 |
| Templates | **42** — 30 ordinarias, 10 Repasos, 2 especiales |
| Variantes aprobadas | **1025** |
| Escala de calidad | 100 / 75 / 40 / 10 (`optimal` / `efficient` / `functional` / `invalid`) |

Variantes aprobadas por año: 7.º 185 · 1.º 174 · 2.º 149 · 3.º 173 · 4.º 173 ·
5.º 171.

## D. Metodología

Cinco pasadas, en este orden:

1. **Trazado.** Para cada Template se siguió la cadena completa —intención de
   diseño → generador de variantes → gates de autoría → materialización →
   presentación → respuesta → evaluador → nivel → feedback → Repaso → test— y se
   anotó toda divergencia entre lo que la documentación declara y lo que el
   código hace.
2. **Enumeración exhaustiva.** Donde el espacio de respuestas es finito y chico
   —clasificación, entrada numérica y tarjeta de decisión, 18 Templates— se
   evaluaron **todas** las respuestas posibles de **todas** las variantes
   aprobadas. Eso decide la alcanzabilidad de cada nivel sin depender de ningún
   oráculo de autoría.
3. **Contraste oráculo/evaluador.** Para las 42 Templates se pidió al oráculo de
   autoría un testigo de cada nivel y se lo evaluó con el evaluador real.
4. **Chequeos adversariales de catálogo.** Concentración de claves de respuesta,
   opciones permanentemente dominadas, sesgo de posición, puntaje esperado de
   estrategias ciegas, realizabilidad del modelo y barrido de notación es-AR
   sobre todo el texto visible de las 1025 variantes.
5. **Contraste externo.** Currículum oficial argentino y bibliografía de
   educación matemática, para ubicar cada dominio y para juzgar los hallazgos
   con un marco que no sea el del propio proyecto.

Los scripts de investigación fueron temporales y se borraron; todos los números
de este informe se reproducen con los tests permanentes del repositorio y con el
procedimiento descrito en cada hallazgo.

## E. Base de evidencia y bibliografía

Se distingue siempre entre **hecho del repositorio** (verificable en el código),
**evidencia externa** (fuente citable) e **inferencia profesional** (juicio del
equipo revisor, señalado como tal).

| Fuente | Autor / institución | Año | Tipo | Qué sostiene |
|---|---|---|---|---|
| [NAP Matemática, Ciclo Básico de Educación Secundaria](https://bnm.educacion.gob.ar/digital/documentos/EL004315.pdf) | Ministerio de Educación de la Nación (Consejo Federal de Educación) | 2006, 2.ª ed. 2011 | Documento curricular oficial | Marco curricular nacional: qué saberes son esperables en el ciclo básico |
| [Núcleos de Aprendizajes Prioritarios](https://www.argentina.gob.ar/nucleos-de-aprendizaje-prioritarios) | Ministerio de Educación de la Nación | vigente | Portal oficial | Estatus federal de los NAP |
| [A Framework for Thinking About Informal Statistical Inference](https://www.stat.auckland.ac.nz/~iase/serj/SERJ8(1)_Makar_Rubin.pdf) | Makar, K. y Rubin, A. — *Statistics Education Research Journal* 8(1) | 2009 | Paper revisado por pares | Los tres principios de la inferencia estadística informal: generalizar más allá de los datos, usar datos como evidencia y **expresar la incertidumbre** |
| [Focus on Formative Feedback](https://myweb.fsu.edu/vshute/pdf/shute%202007_f.pdf) | Shute, V. J. — *Review of Educational Research* 78(1) | 2008 | Revisión sistemática | Criterios de feedback formativo: específico, oportuno, no evaluativo, creíble |
| [The Power of Feedback](https://www.sciencedirect.com/science/article/abs/pii/S0959475222001396) | Hattie, J. y Timperley, H. — *Review of Educational Research* 77(1); revisitado en *Learning and Instruction* | 2007; 2023 | Paper revisado por pares | El feedback útil se relaciona con el objetivo de aprendizaje, no sólo con el resultado |
| [Mathematical Tasks Framework / Task Analysis Guide](https://files.eric.ed.gov/fulltext/EJ1343176.pdf) | Stein, M. K. y Smith, M. S. (proyecto QUASAR) | 1998; síntesis 2022 | Marco de investigación | Cuatro niveles de demanda cognitiva: memorización, procedimientos sin conexión, procedimientos con conexión y *doing mathematics* |

Citas puntuales usadas en los hallazgos:

- NAP, ciclo básico: «**evaluar la razonabilidad de una inferencia elaborada
  considerando datos estadísticos obtenidos a partir de una muestra**» y
  «organizar datos para estudiar un fenómeno […] **analizando el proceso de
  relevamiento** de los mismos».
- NAP, probabilidad: «comparar las probabilidades de diferentes sucesos […]
  **sin necesidad de usar fórmulas**».
- NAP, álgebra y funciones: «interpretar relaciones entre variables en tablas,
  gráficos y fórmulas […] proporcionalidad directa e inversa» y «producir y
  comparar fórmulas para analizar las variaciones de perímetros, áreas y
  volúmenes».
- Makar y Rubin (2009): la inferencia informal «allows for qualitative instead
  of quantitative expressions of uncertainty».
- Stein y Smith: una tarea de alta demanda pierde su demanda cuando se vuelve
  reproducible de memoria.

**Jurisdicción.** El repositorio no declara una provincia: la guía de autoría
pide «lenguaje argentino neutral, comprensible fuera de una provincia
específica». Por eso el marco curricular usado es el **nacional (NAP)**. Un
mapeo a un diseño curricular provincial concreto —Chaco u otro— es posible pero
sería una decisión institucional, no un requisito del juego.

## F. Mapa de cobertura matemática

Dominios declarados por las Templates ordinarias y especiales (30 + 2), contando
cada Template una vez por cada categoría que declara:

| Dominio | Templates | Años |
|---|---|---|
| Optimización y restricciones | 14 | 7.º, 1.º, 2.º, 3.º, 4.º, 5.º |
| Tiempo y tasas | 13 | 7.º, 1.º, 2.º, 3.º, 4.º, 5.º |
| Cantidad | 13 | 7.º, 1.º, 2.º, 3.º, 4.º, 5.º |
| Proporciones y porcentajes | 12 | 7.º, 1.º, 2.º, 3.º, 4.º, 5.º |
| Espacio y forma | 6 | 7.º, 1.º, 2.º, 3.º, 4.º, 5.º |
| Probabilidad e incertidumbre | **3** | **1.º, 2.º** |
| Patrones y relaciones | **2** | **7.º, 2.º** |

Familias de razonamiento primario: `ALLOCATION` 8, `SPATIAL` 6,
`ECONOMIC_PROPORTIONAL` 6, `TEMPORAL` 5, `LOGIC_CLASSIFICATION` 4,
`DATA_UNCERTAINTY` 2, `SYSTEMS_OPTIMIZATION` 1.

## G. Análisis de progresión

**Lo que crece de verdad.** La demanda cognitiva sube por estructura y no por
tamaño de los números: la carga declarada va de 4–6 en 7.º y 1.º a 7–8 en 4.º y
5.º, y lo que la produce son restricciones simultáneas, construcción de la
respuesta y selección de información, no aritmética más pesada. Eso coincide con
lo que el propio marco de diseño promete y con el principio de Stein y Smith de
que la demanda está en la tarea, no en el cálculo.

**Cobertura bien servida.** Tiempo y tasas, optimización con restricciones,
cantidad y proporciones aparecen en los seis años, con formas distintas cada
vez: una agenda de 1.º y la semana de 3.º comparten motor pero no la misma
pregunta —una acomoda actividades en una tarde, la otra reparte una semana con
franjas fijas—.

**Gaps que conviene mirar con ojo docente.**

1. **Probabilidad e incertidumbre está servida por 3 Templates y ninguna después
   de 2.º.** La rueda de 1.º trabaja proporción conocida, no incertidumbre; la
   encuesta y la tabla de 2.º trabajan evidencia y certeza. De 3.º a 5.º la
   carrera no vuelve a tocar azar. Los NAP del ciclo básico piden explícitamente
   comparar probabilidades de sucesos y evaluar la razonabilidad de una
   inferencia a partir de una muestra; la carrera cubre lo segundo y casi nada
   de lo primero. *Inferencia profesional:* no es un defecto del juego, es una
   decisión de cobertura que el Departamento debería confirmar.
2. **Patrones y relaciones (pensamiento algebraico y funcional) aparece en 2
   Templates.** No hay ninguna tarea cuyo objeto sea una relación funcional
   explícita —tabla, gráfico, fórmula— aunque varias la usan implícitamente
   (costo fijo más variable en 3.º es una función lineal sin nombrarse). Los NAP
   piden «interpretar relaciones entre variables en tablas, gráficos y
   fórmulas». *Inferencia profesional:* el juego elige el registro numérico y
   evita el simbólico, lo cual es coherente con su piso de accesibilidad, pero
   deja el eje algebraico con presencia conceptual y sin representación.
3. **Geometría aparece en 6 Templates y siempre como medida y encaje** —área,
   capacidad, circulación, escala, recorte—, nunca como argumentación sobre
   propiedades de figuras, que es lo que más pesa en los NAP de geometría del
   ciclo básico. *Inferencia profesional:* es una elección defendible para un
   juego de decisiones, y conviene que quede dicha explícitamente.

**Redundancias.** Ver [sección K](#k-redundancia-entre-templates). No se
encontraron dos Templates que sean la misma actividad con otro skin, pero sí
tres pares con parentesco fuerte que conviene que un docente confirme.

## H. Revisión por Template

**Cómo leer la profundidad.** `EXHAUSTIVA` = se evaluaron todas las respuestas
posibles de todas las variantes aprobadas. `SISTEMÁTICA` = chequeos automáticos
sobre el catálogo completo más lectura del evaluador y de los gates.
`ESTRUCTURAL` = lectura del evaluador, de los gates y del oráculo, más contraste
de testigos por nivel. Decirlo importa: no todas las Templates recibieron el
mismo tipo de evidencia.

### 7.º — la base ya validada en Teacher Gate 1

| Template | Objeto matemático | Profundidad | Veredicto | Hallazgos |
|---|---|---|---|---|
| `g7.bus-timing` | Instante de salida contra hora de llegada, con margen | ESTRUCTURAL | PASS | — |
| `g7.bus-latest-departure` | Última salida posible: resta de tiempos con restricción | EXHAUSTIVA | PASS | 21 claves distintas en 26 variantes: bien distribuida |
| `g7.mural-paint` | Cobertura por litro y compra por envase | EXHAUSTIVA | OBSERVATION | MAT-006, MAT-010 |
| `g7.notebook-offer` | Descuento porcentual contra descuento fijo sobre el mismo precio | EXHAUSTIVA | OBSERVATION | MAT-010 |
| `g7.stand-supplies` | Reparto de un presupuesto entre insumos con demanda | ESTRUCTURAL | PASS | — |
| `g7.group-tasks` | Asignación de tareas a personas con disponibilidad | ESTRUCTURAL | PASS | — |
| `g7.may-25-act` | Clasificación de números en una grilla bajo una regla | ESTRUCTURAL | PASS | — |
| `g7.bus-travel-review` (Repaso) | Tiempo de viaje aislado | EXHAUSTIVA | PASS | 21 claves en 26 variantes |

### 1.º — consolidación

| Template | Objeto matemático | Profundidad | Veredicto | Hallazgos |
|---|---|---|---|---|
| `y1.student-day-challenge-wheel` | Construcción de una distribución sobre posiciones equiprobables bajo una regla proporcional, expresada en cuatro notaciones | ESTRUCTURAL | PASS | MAT-012 (observación de cobertura) |
| `y1.mobile-data` | Consumo por unidad contra un tope mensual | ESTRUCTURAL | PASS | — |
| `y1.rehearsal-schedule` | Agenda con traslado y margen sobre una tarde | ESTRUCTURAL | PASS | — |
| `y1.classroom-layout` | Encaje en un plano con escala, despejes y circulación | ESTRUCTURAL | PASS | — |
| `y1.course-project-expo` | Reparto de roles con disponibilidad y preferencias | ESTRUCTURAL | PASS | — |
| `y1.schedule-review` (Repaso) | Una sola cadena de tiempos | ESTRUCTURAL | PASS | — |
| `y1.scale-fit-review` (Repaso) | Un solo encaje con escala | ESTRUCTURAL | PASS | — |

La rueda es la única Template con sign-off manual pendiente declarado por el
propio proyecto, y este pre-review no lo levanta.

### 2.º — pertenencia · estadística y certeza

| Template | Objeto matemático | Profundidad | Veredicto | Hallazgos |
|---|---|---|---|---|
| `y2.course-project-survey` | Proporción muestral contra proporción poblacional: qué sostiene el denominador | EXHAUSTIVA | CHANGE SUGGESTED | MAT-003, MAT-004 |
| `y2.standings-claim` | Cotas enteras: máximo alcanzable contra mínimo asegurado | EXHAUSTIVA | CHANGE SUGGESTED | MAT-005 |
| `y2.court-zones` | Reparto de zonas en un espacio con distancias | ESTRUCTURAL | PASS | — |
| `y2.intercurso-plan` | Asignación con tiempos y preferencias | ESTRUCTURAL | PASS | — |
| `y2.team-kit-order` | Pedido por talles con mínimo por lote | ESTRUCTURAL | PASS | — |
| `y2.data-claim-review` (Repaso) | Denominador aislado | EXHAUSTIVA | CHANGE SUGGESTED | MAT-002 |

### 3.º — autonomía

| Template | Objeto matemático | Profundidad | Veredicto | Hallazgos |
|---|---|---|---|---|
| `y3.transport-pass` | Costo fijo contra costo variable y el umbral de usos que da vuelta la conveniencia | EXHAUSTIVA | CHANGE SUGGESTED | MAT-001 |
| `y3.course-project-tech` | Varios recursos apretando a la vez sobre una misma producción | ESTRUCTURAL | PASS | — |
| `y3.friend-day` | Agenda con traslados y ventanas | ESTRUCTURAL | PASS | — |
| `y3.week-planner` | Semana con franjas fijas y actividades móviles | ESTRUCTURAL | PASS | — |
| `y3.route-plan` | Recorrido con distancias y ventanas de atención: el orden cambia la factibilidad | ESTRUCTURAL | PASS | — |
| `y3.fixed-variable-review` (Repaso) | El umbral, aislado | EXHAUSTIVA | PASS | 8 claves en 25 variantes |
| `y3.rate-capacity-review` (Repaso) | Una tasa contra una capacidad | EXHAUSTIVA | PASS | 14 claves en 25 variantes |

### 4.º — responsabilidad

| Template | Objeto matemático | Profundidad | Veredicto | Hallazgos |
|---|---|---|---|---|
| `y4.school-event-flow` | Cuello de botella: el ritmo del sistema es el del puesto más lento | ESTRUCTURAL | PASS | — |
| `y4.course-project-fundraiser` | Costo fijo, margen unitario, punto de equilibrio y objetivo como condiciones distintas | ESTRUCTURAL | PASS | MAT-011 |
| `y4.event-floor-plan` | Área, capacidad y circulación interactuando | ESTRUCTURAL | PASS | — |
| `y4.shift-coverage` | Cobertura de turnos con continuidad y descansos | ESTRUCTURAL | PASS | — |
| `y4.represent-class` | Viabilidad bajo tres límites explícitos, más una postura pública separada | EXHAUSTIVA | OBSERVATION | MAT-007 |
| `y4.margin-review` (Repaso) | Punto de equilibrio aislado | EXHAUSTIVA | PASS | 6 claves en 25 variantes |
| `y4.spatial-capacity-review` (Repaso) | Capacidad descontando reservado | EXHAUSTIVA | PASS | 10 claves en 25 variantes |

### 5.º — cierre y futuro

| Template | Objeto matemático | Profundidad | Veredicto | Hallazgos |
|---|---|---|---|---|
| `y5.final-trip-or-event` | Comparación multidimensional con fondo, días y lugares | EXHAUSTIVA | PASS · **modelo a imitar** | — |
| `y5.course-project-final` | Reasignación bajo contingencia, más postura pública separada | EXHAUSTIVA | PASS · **modelo a imitar** | — |
| `y5.stage-screen` | Razón de aspecto, escala y recorte sobre región protegida | EXHAUSTIVA | CHANGE SUGGESTED | MAT-008 |
| `y5.yearbook` | Reparto de un total exacto entre secciones con cobertura máxima | ESTRUCTURAL | PASS | — |
| `y5.next-step-options` | Viabilidad de opciones contra una semana disponible | EXHAUSTIVA | OBSERVATION | MAT-009 |
| `y5.multi-option-comparison-review` (Repaso) | Comparación aislada | ESTRUCTURAL | PASS | — |
| `y5.proportion-capacity-review` (Repaso) | Proporción y capacidad aisladas | EXHAUSTIVA | PASS | 13 claves en 23 variantes |

**Las dos Templates modelo.** `y5.final-trip-or-event` reparte el nivel óptimo
entre sus cuatro opciones (7/7/6/5 de 25 variantes) y cada opción alcanza los
cuatro niveles según la variante; `y5.course-project-final` tiene 24 claves
óptimas distintas en 24 variantes y entre 9 y 96 respuestas óptimas por variante.
Son la referencia interna contra la cual se miden los hallazgos MAT-001, MAT-002
y MAT-008.

## I. Revisión de los Repasos

Los diez Repasos cumplen lo que el diseño les pide: aíslan **un** concepto, son
genuinamente más simples que la Template de origen y no repiten el mismo
problema con menos números. La cadena concepto → error → objetivo → debrief está
bien armada en todos.

| Repaso | Concepto aislado | Simplificación | Claves distintas |
|---|---|---|---|
| `g7.bus-travel-review` | Tiempo de viaje | Una sola cadena de tiempos | 21 / 26 |
| `y1.schedule-review` | Encadenar tiempos con traslado | Dos actividades y un viaje | ESTRUCTURAL |
| `y1.scale-fit-review` | Escala y encaje | Un solo objeto en el plano | ESTRUCTURAL |
| `y2.data-claim-review` | Denominador | Una afirmación por denominador | **1 / 25** |
| `y3.fixed-variable-review` | Umbral fijo/variable | Un costo fijo y uno por viaje | 8 / 25 |
| `y3.rate-capacity-review` | Tasa contra capacidad | Un recurso | 14 / 25 |
| `y4.margin-review` | Punto de equilibrio | Costo fijo contra margen unitario | 6 / 25 |
| `y4.spatial-capacity-review` | Capacidad neta | Salón menos reservado | 10 / 25 |
| `y5.multi-option-comparison-review` | Comparación | Dos opciones | ESTRUCTURAL |
| `y5.proportion-capacity-review` | Proporción y capacidad | Una razón | 13 / 23 |

El único con problema es `y2.data-claim-review` (MAT-002): **una sola clave de
respuesta en las 25 variantes aprobadas**. Un estudiante que lo juega por segunda
vez ya no necesita mirar los números.

La política canónica `resolved != mastered` se sostiene a nivel motor —el Repaso
queda fuera de FairScore y no borra la falla— pero MAT-002 la debilita en el
plano didáctico para ese Repaso concreto.

## J. Auditoría de variantes

Chequeos corridos sobre las 1025 variantes aprobadas:

| Chequeo | Resultado |
|---|---|
| Materialización de toda variante aprobada | 1025 / 1025 sin error |
| Niveles alcanzables (enumeración exhaustiva, 18 Templates) | Todos los niveles alcanzables salvo los casos de MAT-006, MAT-002 y MAT-007 |
| Contraste oráculo / evaluador (42 Templates) | Sin divergencia atribuible al contenido |
| Notación es-AR en todo el texto visible | **Sin decimales largos ni mezcla de convenciones** en 1025 variantes |
| Opciones permanentemente dominadas | 2 casos: MAT-001 y MAT-008 |
| Sesgo de posición de la opción óptima | 3 casos, siempre derivados de MAT-001 / MAT-006 / MAT-008 |
| Degeneración por respuesta constante | Ninguna respuesta constante alcanza `optimal` en Templates de construcción |

**Concentración de claves de respuesta.** Para cada Template enumerable se contó
cuántas respuestas óptimas distintas existen en todo el catálogo y qué rinde
quedarse siempre con la más frecuente:

| Template | Claves óptimas distintas | Acierto memorizando |
|---|---|---|
| `y2.data-claim-review` | 1 / 25 | **100 %** |
| `y5.next-step-options` | 4 / 24 | 71 % |
| `g7.mural-paint` | 2 / 26 | 62 % |
| `y2.course-project-survey` | 2 / 25 | 56 % |
| `y2.standings-claim` | 4 / 25 | 56 % |
| `g7.notebook-offer` | 2 / 26 | 54 % |
| `y5.stage-screen` | 2 / 25 | 52 % |
| `y3.transport-pass` | 3 / 25 | 40 % |
| `y4.margin-review` | 6 / 25 | 40 % |
| `y4.represent-class` | 10 / 25 | 16 % |
| `y5.course-project-final` | 24 / 24 | 4 % |

## K. Redundancia entre Templates

No hay dos Templates que sean la misma actividad matemática con distinta piel.
Hay tres parentescos que conviene que un docente confirme:

1. `y1.rehearsal-schedule` / `y3.friend-day` / `y3.week-planner` — las tres
   agendan actividades en el tiempo. Se diferencian por horizonte (una tarde,
   un día con traslados, una semana con franjas fijas) y por qué restringe.
   *Inferencia profesional:* son distintas, pero son tres de las trece Templates
   de tiempo y tasas y el motor visible es el mismo.
2. `y4.margin-review` / `y3.fixed-variable-review` — ambas aíslan un umbral de
   costo fijo contra variable. La primera pregunta por el punto de equilibrio en
   unidades vendidas, la segunda por el umbral de usos. Es la misma estructura
   algebraica con distinta lectura.
3. `y1.classroom-layout` / `y4.event-floor-plan` — ambas encajan objetos en un
   plano. La de 4.º agrega circulación y capacidad, que es una diferencia real.

## L. Math / Equipo / Aura / Estilo

La separación de evidencia se verificó y **se sostiene**:

- Equipo aparece sólo donde hay preferencias de otras personas que medir, y se
  lee de un plan distinto del que decide la corrección matemática.
- Aura se lee de un campo distinto de la respuesta —la postura pública— y no de
  las etiquetas que resuelven la matemática. En `y2.standings-claim` y en
  `y5.course-project-final` la clasificación y la postura viajan separadas, y el
  propio código lo documenta como regla.
- Estilo no es proxy de corrección: en todas las Templates con estilo hay al
  menos dos ejes disponibles con la matemática óptima, en todas sus variantes.
- No se encontró doble cobro: ningún hecho paga en dos dimensiones.

Asimetría registrada y **no corregida**: las Templates de 7.º son anteriores al
gate de autoría de Estilo y atan algunos ejes al nivel matemático. Está
documentado en la auditoría de implementación y no es materia de este gate.

## M. Validez de FairScore

Sin recalibrar nada, y con la ponderación 85 / 10 / 5 intacta:

- el máximo perfecto es alcanzable: una carrera óptima llega a 10 000 exactos;
- el Repaso queda fuera del puntaje;
- una oportunidad ausente no penaliza: los pesos se redistribuyen;
- un evento raro no mueve el puntaje;
- no hay atajos por id de contenido.

**Lo que sí hay que mirar** es MAT-001, MAT-006 y MAT-008: como el 85 % del
puntaje es matemática, una Template donde una estrategia ciega rinde 78 sobre
100 mete varianza que no viene del razonamiento. Es un problema de validez del
constructo, no de la fórmula.

## N. Lenguaje, notación y unidades

El barrido completo sobre las 1025 variantes no encontró decimales largos,
mezcla de convenciones ni unidades implícitas en el texto visible. La convención
es-AR —punto para miles, coma para decimales— se respeta.

El feedback cumple los criterios de Shute (2008): es específico, muestra la
aritmética real, nombra la restricción violada, compara con el óptimo y no
humilla. Ejemplo textual de `y2.course-project-survey`, nivel `invalid`:

> Los datos no sostienen «Más de la mitad del nivel eligió arreglar el patio.»
> (22 de 80 del nivel).

Eso es exactamente lo que Hattie y Timperley piden: feedback referido al
objetivo, no al resultado.

Ambigüedades encontradas: MAT-003 (el criterio de «con claridad» no está
definido en pantalla) y MAT-005 (el modelo de la tabla no dice contra quién se
juegan los partidos que faltan).

## O. Registro de hallazgos

| ID | Sev. | Año | Template | Categoría | Hallazgo | Evidencia | Requiere decisión de producto | Requiere validación humana |
|---|---|---|---|---|---|---|---|---|
| MAT-001 | **HIGH** | 3.º | `y3.transport-pass` | ASSESSMENT VALIDITY · DIDACTIC RISK | El boleto suelto nunca es la opción más barata dentro del rango declarado, en 25/25 variantes. Elegir siempre «abono libre» rinde 78/100 sin hacer ninguna cuenta | Enumeración exhaustiva del catálogo | Sí | Sí |
| MAT-002 | **HIGH** | 2.º | `y2.data-claim-review` | VARIANT DESIGN · RECOVERY | Una sola clave de respuesta en las 25 variantes aprobadas del Repaso: acierto memorizando 100 % | Enumeración exhaustiva | No | Sí |
| MAT-003 | MEDIUM | 2.º | `y2.course-project-survey` | AMBIGUITY · MISCONCEPTION | «Le ganó con claridad» se decide con un umbral autorado —diferencia × 10 > respuestas— que el jugador no ve. Con 25 contra 18 de 48 respuestas el juego afirma claridad donde el error de muestreo no la sostiene | `surveyClaims`, variante `c00006` | Sí | Sí |
| MAT-004 | MEDIUM | 2.º | `y2.course-project-survey` | ASSESSMENT VALIDITY | Sólo existen dos claves de respuesta en 25 variantes; las afirmaciones sobre el nivel entero son siempre «no se puede afirmar» | Enumeración exhaustiva | No | Sí |
| MAT-005 | MEDIUM | 2.º | `y2.standings-claim` | MATHEMATICAL MODELLING · AMBIGUITY | Las cotas se calculan por equipo de forma independiente. En 13/25 variantes la suma de partidos restantes es impar, imposible si los cuatro cursos jugaran entre sí | Paridad sobre el catálogo | Sí | Sí |
| MAT-006 | MEDIUM | 7.º | `g7.mural-paint` | QUALITY TIER | El nivel `efficient` es inalcanzable en las 26 variantes; la lata de 1 L es `invalid` siempre. Elegir siempre la de 4 L rinde 76,9/100 | Enumeración exhaustiva | Sí | Sí |
| MAT-007 | MEDIUM | 4.º | `y4.represent-class` | QUALITY TIER | En 13 de 25 variantes el nivel `functional` no existe: la escalera salta de `efficient` a `invalid` | Enumeración exhaustiva | No | Sí |
| MAT-008 | MEDIUM | 5.º | `y5.stage-screen` | ASSESSMENT VALIDITY | Cuatro de las seis opciones tienen nivel constante en las 25 variantes. Elegir siempre «entera» rinde 75/100 sin calcular; el óptimo se reduce a una binaria arriba/abajo | Enumeración exhaustiva | Sí | Sí |
| MAT-009 | LOW | 5.º | `y5.next-step-options` | VARIANT DESIGN | Cuatro claves de respuesta en 24 variantes: acierto memorizando 71 % | Enumeración exhaustiva | No | Sí |
| MAT-010 | LOW | 7.º | `g7.notebook-offer` | QUALITY TIER | Escalera binaria: sólo `optimal` e `invalid`. Un error de comparación cuesta 90 puntos de golpe | Enumeración exhaustiva | Sí | Sí |
| MAT-011 | LOW | 4.º | `y4.course-project-fundraiser` | LANGUAGE / NOTATION | «Cubrir costos» y «llegar al objetivo» son condiciones distintas y bien separadas en el evaluador, pero la consigna no nombra el punto de equilibrio: el concepto queda sin etiqueta | Lectura de consigna | No | Sí |
| MAT-012 | OBSERVATION | — | Carrera completa | CROSS-CAREER COVERAGE | Probabilidad e incertidumbre no aparece después de 2.º; pensamiento algebraico y funcional tiene presencia conceptual sin representación simbólica | Mapa de cobertura | Sí | Sí |
| MAT-013 | OBSERVATION | — | Carrera completa | COGNITIVE DEMAND | La demanda decae con la repetición en las Templates con pocas claves. Con el objetivo declarado de «competencia repetible» en la feria, la tarea puede bajar de *doing mathematics* a memorización | Stein y Smith; tabla de concentración | Sí | Sí |

### Hallazgos detallados

#### MAT-001 — El boleto suelto nunca conviene

**Template:** `y3.transport-pass` · **Variantes:** las 25 aprobadas.

**Problema.** La Template ofrece cuatro formas de pagar el colectivo y su propia
documentación declara: «Hay cuatro formas de pagar el mismo colectivo y
**ninguna es la mejor siempre**». La implementación contradice esa intención
para una de las cuatro: el boleto suelto no es la opción más barata en **ningún**
número de viajes dentro del rango declarado, en **25 de 25** variantes
aprobadas. Es `functional` en 7 y `invalid` en 18; nunca `optimal` ni
`efficient`.

**Evidencia de repositorio.** El boleto suelto deja de ser el más barato pasando
los 1 a 21 viajes según la variante, y el rango posible más bajo del catálogo
empieza en 12 con `likely` 16. Las cinco formas de mes —`mes-corto`, `arranque`,
`mes-completo`, `con-salidas`, `mes-cargado`— tienen `likely` entre 16 y 52, por
encima del cruce en todos los casos.

**Riesgo didáctico.** El objeto de la tarea es el umbral entre costo fijo y costo
variable: cuál conviene **depende** de cuánto se usa. Al no existir ninguna
variante donde convenga la opción sin costo fijo, la regla que el catálogo
enseña es «la opción por unidad nunca conviene», que es falsa en general y es la
inversa del concepto. El Repaso `y3.fixed-variable-review` aísla correctamente
el umbral, de modo que el Repaso enseña el concepto y la Template principal
enseña la heurística equivocada.

**Validez de evaluación.** Elegir siempre «abono libre» sin leer un solo número
rinde **78,0 sobre 100** de promedio, contra 56,3 del azar uniforme.

**Evidencia externa.** NAP, ciclo básico: «interpretar relaciones entre variables
en tablas, gráficos y fórmulas en diversos contextos (regularidades numéricas,
**proporcionalidad directa e inversa**)». Un modelo de costo fijo más variable es
el caso canónico donde la conveniencia se invierte en un punto.

**Corrección propuesta — NO aplicada.** Agregar al generador una forma de mes de
uso bajo, con rango por debajo del cruce (por ejemplo `low/likely/high` en el
entorno de 6/8/10), de modo que en parte del catálogo el boleto suelto sea
`optimal`. Complementariamente, agregar un gate de autoría que exija que cada
opción sea óptima en al menos una variante aprobada del catálogo.

**Requiere validación humana:** sí. El Departamento debe decidir si el umbral
debe ser visible dentro del rango o si alcanza con que el Repaso lo aísle.

#### MAT-002 — El Repaso del denominador tiene una sola respuesta

**Template:** `y2.data-claim-review` · **Variantes:** las 25 aprobadas.

**Problema.** El espacio de respuestas es finito y se enumeró completo: en las 25
variantes aprobadas existe **una única** combinación de etiquetas que alcanza
`optimal`, y es **la misma** en las 25. El patrón es siempre «lo que es sobre las
respuestas se puede afirmar, lo que es sobre el nivel entero no».

**Riesgo didáctico.** Es un Repaso, es decir, la segunda oportunidad de alguien
que ya falló el concepto. Un estudiante que lo ve por segunda vez —o que lo ve
después de que un compañero lo jugó— puede cerrarlo sin mirar los números. La
política canónica dice `resolved != mastered`; acá el sistema no puede
distinguir entre haber entendido el denominador y haber recordado el patrón.

**Evidencia externa.** Stein y Smith: una tarea baja al nivel de «memorización»
cuando puede resolverse reproduciendo un patrón sin conectar con el concepto.
Makar y Rubin (2009) sitúan el juicio sobre qué sostiene una muestra como el
núcleo de la inferencia informal, que es justamente lo que el patrón fijo
permite saltear.

**Corrección propuesta — NO aplicada.** Variar la dirección de la respuesta:
incluir variantes donde la afirmación sobre el nivel **sí** se sostenga —cuando
el recuento bruto supera la mitad del nivel, cosa matemáticamente correcta e
interesante— y variantes donde la afirmación sobre las respuestas no se
sostenga. Agregar un gate de autoría que exija al menos tres claves distintas en
el catálogo de un Repaso.

**Requiere validación humana:** sí, para confirmar que la variación propuesta no
vuelve el Repaso más difícil que la Template de origen.

#### MAT-003 — «Con claridad» no tiene criterio visible

**Template:** `y2.course-project-survey` · **Variante ejemplo:** `c00006`
(nivel 120, 48 respuestas, 25/18/5).

**Problema.** Una de las seis afirmaciones es «arreglar el patio le ganó a
renovar la biblioteca **con claridad**». El evaluador la considera sostenida
cuando `(primera − segunda) × 10 > respuestas`, es decir cuando la diferencia
supera el 10 % de las respuestas. Ese umbral no aparece en ninguna parte de la
pantalla: el jugador ve «25 contra 18 respuestas» y tiene que adivinar qué
cuenta como claridad.

**Problema matemático.** En `c00006` son 25 contra 18 sobre 48 respuestas: una
diferencia de 14,6 puntos porcentuales con n = 48. El error estándar de esa
diferencia ronda los 13 puntos, de modo que la diferencia está en el orden de
una desviación estándar. El juego afirma que hay claridad donde la teoría de
muestreo no la sostiene, y lo hace en una Template cuyo propósito declarado es
enseñar prudencia con las muestras.

**Atenuante de repositorio, verificado.** El catálogo nunca pone al jugador cerca
del umbral: en las formas `margin` la diferencia es siempre de 1 respuesta y en
las demás el producto va de 70 a 180 contra 43 a 59 respuestas. Es decir, no hay
ninguna variante aprobada donde la respuesta correcta sea discutible por estar
al filo. El riesgo es la regla que el estudiante infiere, no que se equivoque de
etiqueta.

**Evidencia externa.** Makar y Rubin (2009) exigen que la inferencia informal
«exprese la incertidumbre», y admiten expresiones cualitativas en vez de
cuantitativas. La forma actual usa una etiqueta binaria sobre una afirmación
absoluta, sin lenguaje de incertidumbre.

**Corrección propuesta — NO aplicada.** Dos opciones, a elección del
Departamento: (a) reformular la afirmación en términos verificables sin umbral
oculto —«le sacó más de diez respuestas de diferencia»—, o (b) conservar
«con claridad» y hacer visible el criterio en la consigna, con lenguaje de
incertidumbre («con esta cantidad de respuestas, una diferencia de una o dos no
alcanza para afirmar que una opción ganó»).

**Requiere validación humana:** sí. Es una decisión de producto y de didáctica.

#### MAT-005 — Las cotas de la tabla suponen partidos independientes

**Template:** `y2.standings-claim` · **Variantes:** 13 de 25.

**Problema.** El máximo y el mínimo de cada equipo se calculan por separado:
`min = puntos`, `max = puntos + faltan × porVictoria`. Eso es exactamente
correcto **si** los partidos que faltan son contra rivales no listados. Pero la
situación es el Intercurso entre 2.º A, B, C y D, y la pantalla muestra sólo esos
cuatro equipos con sus partidos pendientes. Bajo la lectura natural —que juegan
entre ellos— las cotas no son simultáneamente alcanzables: si A y B tienen un
partido pendiente entre sí, no pueden ganarlo los dos.

**Evidencia de repositorio.** En **13 de 25** variantes aprobadas la suma de
partidos restantes es impar —por ejemplo `2/2/2/1` = 7—, lo que es imposible en
un torneo donde cada partido pendiente involucra a dos de los cuatro equipos
listados. Afecta a las formas `eliminated` (8 variantes) y `open` (5).

**Riesgo didáctico.** Un docente de Matemática lo va a notar de inmediato, y con
razón: es el ejemplo clásico de por qué las cotas independientes sobreestiman lo
posible en un torneo. Un estudiante que razone bien el torneo puede llegar a una
respuesta distinta de la que el juego acepta.

**Corrección propuesta — NO aplicada.** Dos opciones: (a) decir en la consigna
que los partidos que faltan son contra otros años, lo que vuelve las cotas
exactas y el modelo honesto; o (b) generar `remaining` consistente con un
fixture entre los cuatro y calcular las cotas con esa restricción. La opción (a)
es de una línea de copy y no toca la matemática; la (b) es más fiel pero cambia
la dificultad.

**Requiere validación humana:** sí.

#### MAT-006 y MAT-008 — Escaleras con nivel constante

`g7.mural-paint`: el nivel `efficient` no se alcanza en ninguna de las 26
variantes y la lata de 1 L es `invalid` en las 26. Elegir siempre la de 4 L
rinde 76,9/100.

`y5.stage-screen`: cuatro de las seis opciones tienen el **mismo nivel en las 25
variantes** —«entera» siempre `efficient`, «sin agrandar» siempre `functional`,
«estirar» y «ancho al centro» siempre `invalid`—. Que estirar sea siempre
inválido es didácticamente correcto: deformar la imagen está mal siempre. Pero
la consecuencia es que elegir «entera» rinde **75/100 garantizados sin calcular
nada**, y el óptimo se reduce a una binaria entre recortar arriba o abajo, que es
una lectura espacial y no razonamiento proporcional.

**Corrección propuesta — NO aplicada.** Para `y5.stage-screen`, variar qué
opción es `efficient` según la variante —por ejemplo, variantes donde la imagen
entera desperdicie tanto que baje a `functional`—, de modo que el nivel de cada
opción dependa de los números. Para `g7.mural-paint`, decidir si la escalera debe
tener cuatro niveles o si es legítimamente de tres.

## P. Correcciones requeridas antes de la revisión humana

**Ninguna.** El objeto es revisable tal como está: la matemática es correcta, el
juego se puede jugar entero y los hallazgos son precisamente el tipo de cosa
sobre la que el Departamento debe pronunciarse. Corregirlos antes sería decidir
en su lugar.

## Q. Mejoras propuestas, no bloqueantes

1. Un gate de autoría que exija, para toda Template de opciones, que **cada
   opción sea óptima en al menos una variante** del catálogo aprobado
   (atacaría MAT-001 y MAT-008 de raíz).
2. Un gate que exija un **mínimo de claves de respuesta distintas** por catálogo,
   proporcional al tamaño del espacio (atacaría MAT-002, MAT-004 y MAT-009).
3. Una métrica publicada por Template: **puntaje esperado de la mejor estrategia
   ciega**, como control de validez permanente junto a los gates existentes.
4. Nombrar el punto de equilibrio en la consigna de `y4.course-project-fundraiser`
   (MAT-011).
5. Evaluar una Template de probabilidad después de 2.º y una de relación
   funcional explícita, si el Departamento considera que los NAP lo ameritan
   (MAT-012).

## R. Prioridad para la revisión humana

No es un ranking de calidad: es dónde conviene poner los ojos humanos primero.

**P0 — atención humana explícita**

- `y3.transport-pass` (MAT-001): ¿el umbral fijo/variable tiene que ser visible
  dentro del rango o alcanza con el Repaso?
- `y2.data-claim-review` (MAT-002): ¿un Repaso con una sola clave sigue siendo
  una segunda oportunidad?
- `y2.course-project-survey` (MAT-003, MAT-004): el criterio de «con claridad» y
  el lenguaje de incertidumbre.
- `y2.standings-claim` (MAT-005): el modelo del torneo.

**P1 — atención alta**

- `y5.stage-screen` (MAT-008) · `g7.mural-paint` (MAT-006) ·
  `y4.represent-class` (MAT-007) · cobertura de probabilidad y álgebra (MAT-012)
  · demanda cognitiva con juego repetido (MAT-013).

**P2 — revisión estándar**

- Las 30 Templates restantes, los 8 Repasos sin hallazgos y la progresión general.

## S. Limitaciones

Esta pre-revisión **no puede** establecer:

- si un estudiante de 12 a 17 años entiende la consigna sin ayuda verbal;
- qué estrategia usa espontáneamente frente a la pantalla;
- si el feedback se lee o se saltea;
- cuánto tarda de verdad cada beat ni si el pacing es tolerable;
- si la tarea engancha;
- si el registro coloquial funciona en un aula concreta;
- si la matemática es apropiada para el grupo real que va a jugar;
- la aprobación profesional, que es indelegable.

También hay un límite metodológico que conviene decir: para 24 Templates la
revisión fue estructural —lectura del evaluador, de los gates y del oráculo— y no
exhaustiva, porque su espacio de respuestas no es enumerable. En esas, un error
que el evaluador y su oráculo compartan no sería detectado por esta pre-revisión.
La [tabla por Template](#h-revisión-por-template) dice cuál recibió qué.

## T. Estado del gate humano

```text
Mathematics Department Review:
PENDING
NOT REPLACED BY THIS AI PRE-REVIEW
```

El paquete operativo para el Departamento está en
[paquete de revisión humana](mathematics-department-human-review-packet.md).
