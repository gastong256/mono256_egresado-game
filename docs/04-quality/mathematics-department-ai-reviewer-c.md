# Revisor C — Validez de evaluación, medición y diseño de juegos educativos

- **Estado:** `FROZEN` — cerrado el 2026-09-16, después de congelados los
  informes A y B. No se reescribe para alinearse con ellos
- **Proceso:** AI Mathematics Department — Independent Adjudication
- **Naturaleza:** opinión independiente asistida por IA. **No** es la decisión
  canónica —ésa es del Chair, en la
  [adjudicación](mathematics-department-ai-adjudication.md)— y **no** es una
  revisión del Departamento de Matemática humano
- **Objeto:** `main` en `9ea3896`, catálogo aprobado `grade-5-dev-2`

**Pregunta central.** ¿El comportamiento observado del jugador constituye
evidencia válida del razonamiento matemático que la Template dice medir?

## Independencia y límites

- Mismo agente, aislamiento **lógico**: este informe no usa A ni B como fuente,
  no los cita y no toma sus decisiones como premisa. La evidencia se re-derivó
  del motor, los evaluadores, el catálogo aprobado y los documentos de producto.
- La métrica de estrategia ciega es **evidencia, no ley**. No existe un umbral
  universal de rechazo y este informe no inventa uno: cada decisión compara la
  métrica con lo que la Template dice medir y con las Templates del propio juego
  que no tienen el problema.
- Sólo se midieron las Templates cuyo espacio de respuestas es finito y chico.
  Las de construcción —presupuesto, agenda, plano, recorrido, asignación— no se
  barrieron con respuestas constantes.

## Marco

Messick (1995) distingue dos amenazas a la validez: **subrepresentación del
constructo** —la tarea deja afuera algo que el constructo exige— y **varianza
irrelevante al constructo**, que puede ser dificultad irrelevante o **facilidad
irrelevante**: rasgos de la tarea ajenos al constructo que la vuelven más fácil
de lo que el constructo justifica. Una estrategia ciega que rinde mucho es
facilidad irrelevante medible. En entornos de aprendizaje con feedback, explotar
regularidades del sistema para avanzar sin razonar —*gaming the system*— se
asocia a menor aprendizaje (Baker y otros, 2004). Y en diseño de ítems, variar la
ubicación de la respuesta, evitar pistas y hacer plausibles los distractores son
pautas con consenso (Haladyna, Downing y Rodriguez, 2002).

**El contexto competitivo del producto importa.** En Fair v1, cada edición usa
una Competition Seed compartida: **mismo plan y mismas variantes en todos los
intentos**, con intentos ilimitados y mejor resultado verificado
([modo feria](../05-operations/fair-mode-and-competition-freeze.md), `LOCKED`).
Consecuencias para leer las métricas:

1. **Memorizar la variante exacta es posible por diseño** en cualquier Template,
   sin importar cuántas claves tenga el catálogo. La concentración de claves del
   catálogo **no** es el exploit dentro de una edición.
2. Lo que sí importa es el **atajo transferible**: una regla que no mira los
   números y rinde en cualquier seed —en la primera partida, en Practice, en otra
   edición, o compartida entre compañeros—. Eso es lo que mide la mejor respuesta
   constante sobre todo el catálogo.
3. Fuera de la competencia, en Practice y en el Repaso, el atajo transferible es
   además el que el feedback termina entrenando.

## Métricas re-derivadas

Por Template, sobre las variantes aprobadas:

- **R** — puntaje esperado de Math al responder al azar uniforme en cada
  variante.
- **K** — puntaje esperado de la **mejor respuesta constante**: la misma
  respuesta completa aplicada a todas las variantes.
- **S** — mayor proporción de variantes en que una misma respuesta es óptima.
- Oráculo: 100 alcanzable en todas las variantes medidas.

| Template | Motor | Var. | R | K | S | Niveles inalcanzables |
|---|---|---|---|---|---|---|
| `y2.data-claim-review` (Repaso) | clasificación | 25 | 29,4 | **100** | **100 %** | `functional` 25 / 25 |
| `y5.course-project-final` | clasificación | 24 | 17,5 | **92,5** | **91,7 %** | — |
| `y2.standings-claim` | clasificación | 25 | 20,4 | **80,0** | 56 % | — |
| `y3.transport-pass` | tarjeta | 25 | 56,3 | **78,0** | 40 % | — |
| `g7.mural-paint` | tarjeta | 26 | 43,8 | **76,9** | 62 % | `efficient` 26 / 26 |
| `y5.next-step-options` | clasificación | 24 | 18,0 | **76,5** | 71 % | — |
| `y5.stage-screen` | tarjeta | 25 | 40,8 | **75,0** | 52 % | — |
| `y2.course-project-survey` | clasificación | 25 | 17,7 | 66,4 | 56 % | — |
| `y5.final-trip-or-event` | tarjeta | 25 | 56,3 | 59,4 | 28 % | — |
| `g7.notebook-offer` | tarjeta | 26 | 55,0 | 58,5 | 54 % | `efficient` y `functional` 26 / 26 |
| `y4.represent-class` | clasificación | 25 | 16,5 | 58,2 | 16 % | `functional` 13 / 25 |
| `g7.bus-latest-departure` | numérica | 26 | 32,4 | 53,5 | 19 % | — |
| `y4.margin-review` (Repaso) | numérica | 25 | 12,4 | 49,8 | 40 % | — |
| `y4.spatial-capacity-review` (Repaso) | numérica | 25 | 12,8 | 41,4 | 20 % | — |
| `y3.rate-capacity-review` (Repaso) | numérica | 25 | 11,8 | 40,8 | 20 % | — |
| `y5.proportion-capacity-review` (Repaso) | numérica | 23 | 11,8 | 34,1 | 13 % | — |
| `g7.bus-travel-review` (Repaso) | numérica | 26 | 13,4 | 29,6 | 12 % | — |
| `y3.fixed-variable-review` (Repaso) | numérica | 25 | 11,9 | 24,4 | 16 % | — |

**La referencia interna.** `y5.final-trip-or-event` es la vara: cuatro opciones,
K a 3 puntos de R, ninguna opción óptima en más del 28 %. Muestra que en este
motor y con esta escalera es posible que no haya atajo.

**Nota sobre el pre-review.** Su tabla de «acierto memorizando» mide S. Para
Templates con muchas respuestas óptimas por variante, S subestima el problema:
en `y5.course-project-final` el pre-review reporta 4 % y la presenta como modelo
a imitar; la respuesta constante «repartir todo» es óptima en 22 de 24 variantes.
K es la métrica que corresponde para un atajo transferible.

**El piso de la escalera asimétrica.** En las clasificaciones donde afirmar algo
falso es `invalid` pero omitir algo cierto baja gradualmente, retener todo nunca
es `invalid`: es 40 como mínimo. Es una decisión de diseño defendible —publicar
falso es el error grave— y explica parte de K en esas Templates. No es un defecto
por sí mismo.

## Decisiones de C

| Hallazgo | C-DECISION | Confianza |
|---|---|---|
| MAT-001 | `REQUIRED_CORRECTION` | HIGH |
| MAT-002 | `REQUIRED_CORRECTION` | HIGH |
| MAT-003 | `REQUIRED_CORRECTION` | MEDIUM |
| MAT-004 | `REQUIRED_CORRECTION` | HIGH |
| MAT-005 | `REQUIRED_CLARIFICATION` | MEDIUM |
| MAT-006 | `REQUIRED_CORRECTION` | MEDIUM |
| MAT-007 | `REQUIRED_CORRECTION` | MEDIUM |
| MAT-008 | `REQUIRED_CORRECTION` | HIGH |
| MAT-009 | `REQUIRED_CORRECTION` | HIGH |
| MAT-010 | `ACCEPT_AS_DESIGNED` | HIGH |
| MAT-011 | `REQUIRED_CLARIFICATION` | MEDIUM |
| MAT-012 | `ACCEPT_AS_DESIGNED` | MEDIUM |
| MAT-013 | `ACCEPT_WITH_DOCUMENTED_RISK` | HIGH |

## Análisis por hallazgo

### MAT-001 — `y3.transport-pass`

**C-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

- **Mejor acción ciega:** «abono» siempre, K = 78,0. **Azar:** 56,3.
  **Óptimo:** 100.
- **Opción muerta:** «boleto suelto», 18,4 de promedio; nunca óptima ni eficiente.
- **Desbalance de clave:** óptimas abono 7, tarjeta 10, combo 8, suelto 0.
- **Por qué no es sólo memorización:** «siempre abono» no requiere haber visto la
  variante; transfiere a cualquier seed. Es facilidad irrelevante al constructo
  «el umbral decide».
- **Discriminación de niveles:** el abono es `efficient` en 16 variantes porque
  gana en el extremo alto del rango; la escalera, que es razonable, paga 75 a un
  atajo.
- **Casos de filo:** en 3 variantes la diferencia de costo entre la óptima y la
  segunda es menor al 2 %; el nivel pasa a depender de precisión aritmética.

**Criterio que C considera necesario para aceptar la corrección:** cada opción
óptima en una fracción no trivial del catálogo, K cerca de R —como en
`y5.final-trip-or-event`— y ningún caso de filo.

### MAT-002 — `y2.data-claim-review`

**C-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

K = 100 y S = 100 %: la respuesta no contiene información sobre la comprensión.
El Repaso no puntúa, así que no hay daño competitivo; el daño es a la evidencia
que el sistema usa para cerrar la obligación. `resolved != mastered` es la
política canónica, y con una sola clave «resuelto» no distingue entender el
denominador de recordar el patrón. Además, retener todo es `efficient` en todas
las variantes.

### MAT-003 — «con claridad»

**C-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** MEDIUM

Un criterio oculto es varianza irrelevante: el jugador que razona bien sobre la
muestra pero no adivina el umbral del autor queda por debajo. El catálogo nunca
pone la diferencia cerca del umbral —1 respuesta en `margin`, 7 o más en el
resto—, así que hoy el jugador infiere «diferencia grande = claridad» desde el
feedback: el sistema entrena la heurística visual en vez del criterio. Confianza
MEDIUM porque el impacto en el puntaje es acotado; la corrección es necesaria
porque el feedback enseña el atajo.

### MAT-004 — dos claves en la encuesta

**C-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

- K = 66,4 con R = 17,7; S = 56 %.
- La clave está **determinada por la forma**, y la forma `margin` se reconoce a
  simple vista: dos números consecutivos. Clasificar se reduce a detectar la forma
  y aplicar una de dos claves.
- Cuatro de seis afirmaciones tienen verdad constante: no discriminan nada.

### MAT-005 — el modelo del torneo

**C-DECISION:** `REQUIRED_CLARIFICATION` · **Confianza:** MEDIUM

El modelo no declarado no cambia la clave en ninguna variante realizable. Es un
problema de credibilidad y de lectura, no de validez del puntaje. **Pero** la
misma Template tiene un problema de validez mayor, que C registra aparte en
C-NEW-2.

### MAT-006 — `g7.mural-paint`

**C-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** MEDIUM

- K = 76,9 con «4 L siempre»; R = 43,8; S = 62 %.
- **Heurística razonable o exploit.** Las dos cosas, separables. «Comprar el
  grande por las dudas» es una heurística razonable, y la escalera la cobra con
  justicia: 40 cuando sobraba. Lo que no es razonable es que el catálogo haga del
  grande la respuesta correcta en 16 de 26 variantes cuando el generador sortea
  2 L y 4 L por igual: es un desbalance de muestreo. Con 13 y 13, «4 L siempre»
  rinde 70.
- **El piso de 70 es estructural.** Mientras la lata de 1 L sea siempre
  insuficiente y comprar de más sea `functional`, la opción segura rinde al menos
  70 en un catálogo balanceado. Bajarlo exige que 1 L alcance en algunas
  variantes, lo que cambia la promesa de la Template aceptada en Teacher Gate 1.
  C no lo exige.
- `efficient` inalcanzable: no es un defecto de validez. Crédito parcial sin
  referente sería inventado.

### MAT-007 — `y4.represent-class`

**C-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** MEDIUM

Retener todo rinde K = 58,2 sin mirar una propuesta: es `efficient` en las 13
variantes con una sola viable. Crédito de 75 por cero evidencia no es
defendible. La ausencia de `functional` en esas variantes no es el problema; el
problema es que la abstención total queda en el segundo nivel.

### MAT-008 — `y5.stage-screen`

**C-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

- «Entera» siempre: **75 garantizados**, con varianza cero entre variantes.
- «Recortar del lado opuesto al cartel»: **100 en 25 de 25**. Es una política
  ciega a los números: usa un solo dato categórico, el lado del cartel.
- Cuatro de seis opciones tienen nivel constante en todo el catálogo.
- La Template STRETCH de escala y recorte mide, en la práctica, la lectura de un
  rótulo. Es subrepresentación del constructo en su forma más pura.

### MAT-009 — `y5.next-step-options`

**C-DECISION:** `REQUIRED_CORRECTION` · **Confianza:** HIGH

- K = 76,5 con la clave «no, no, sí, sí, no»; S = 71 %.
- Está entre las cinco K más altas de las Templates puntuables, a 1,5 puntos de
  MAT-001 (HIGH): la severidad LOW del pre-review no corresponde a esa evidencia.
- La escalera asimétrica agrega un piso: marcar todo «No entra» es `functional`
  en todas las variantes.

### MAT-010 — `g7.notebook-offer`

**C-DECISION:** `ACCEPT_AS_DESIGNED` · **Confianza:** HIGH

K = 58,5 con R = 55,0; S = 54 %. Dos opciones, una decisión binaria, sin atajo
material. Un error cuesta 90 puntos porque la decisión es binaria: fabricar un
nivel intermedio para suavizarlo sería crédito parcial sin evidencia.

### MAT-011 — `y4.course-project-fundraiser`

**C-DECISION:** `REQUIRED_CLARIFICATION` · **Confianza:** MEDIUM

No es enumerable; C no mide atajo. Sí ve un criterio oculto: el óptimo exige el
colchón, que figura como dato pero no en el objetivo. Es la misma clase de
varianza irrelevante que MAT-003, con menor impacto porque el dato está a la
vista.

### MAT-012 — cobertura de carrera

**C-DECISION:** `ACCEPT_AS_DESIGNED` · **Confianza:** MEDIUM

No es un problema de validez: el puntaje no afirma cubrir el currículum, afirma
medir el razonamiento de las situaciones que ofrece. La cobertura curricular es
un problema de alcance, no de medición.

### MAT-013 — demanda con juego repetido

**C-DECISION:** `ACCEPT_WITH_DOCUMENTED_RISK` · **Confianza:** HIGH

**Reencuadre.** En Fair v1 los reintentos repiten las mismas variantes por
diseño `LOCKED`, así que una partida repetida se vuelve memorización en
**cualquier** Template, con o sin claves concentradas. Esto no se corrige con
catálogo y no es materia de este gate: es una propiedad del formato competitivo
que el Departamento humano y la operación de la feria tienen que conocer. Lo que
sí se corrige con catálogo —atajos transferibles— está cubierto por MAT-001,
MAT-002, MAT-004, MAT-006, MAT-008, MAT-009 y los hallazgos nuevos.

**Control permanente que C recomienda.** Publicar R, K y S por Template
enumerable como medición reproducible del repositorio, para que un catálogo
futuro no reintroduzca un atajo sin que nadie lo vea.

## Hallazgos nuevos que C detectó

Los identificadores son propios de este informe. La numeración canónica
`MAT-AJ-NEW-XXX` la asigna el Chair.

| ID de C | Template | Hallazgo | C-DECISION |
|---|---|---|---|
| C-NEW-1 | `y5.course-project-final` | «Repartir» en las seis tareas es óptimo en 22 de 24 variantes: K = 92,5, la más alta entre las Templates puntuables. Math pesa 85 % de FairScore; el Equipo que la respuesta constante pierde —2 de 3 acuerdos— no compensa. El pre-review la presentó como modelo a imitar | `REQUIRED_CORRECTION` |
| C-NEW-2 | `y2.standings-claim` | K = 80 con una clave sin «seguro», que nunca es `invalid`. «2.º D termina primero» es «imposible» en 25 de 25 variantes y «2.º B termina arriba de 2.º C» es «posible» en 24 de 25: dos de cuatro afirmaciones no discriminan | `REQUIRED_CORRECTION` |
| C-NEW-3 | `g7.notebook-offer` | El feedback de acierto afirma que el porcentaje descontaba más también cuando ganaba el fijo (14 / 26). No afecta el puntaje; sí el ciclo de feedback, que entrena la comparación equivocada | `REQUIRED_CORRECTION` |
| C-NEW-4 | 5 Repasos numéricos | La consecuencia no óptima describe un solo sentido de error. No afecta ningún puntaje; degrada la calidad del diagnóstico | `REQUIRED_CLARIFICATION` |

## Fuentes

- Messick, S. (1995). Validity of psychological assessment: Validation of inferences from persons' responses and performances as scientific inquiry into score meaning. *American Psychologist*, 50(9), 741–749. Texto verificado sobre su versión de informe de investigación de ETS ([ERIC ED380496](https://files.eric.ed.gov/fulltext/ED380496.pdf)): «construct-irrelevant difficulty» y «construct-irrelevant easiness» como las dos formas de varianza irrelevante; subrepresentación del constructo.
- Baker, R. S., Corbett, A. T., Koedinger, K. R. y Wagner, A. Z. (2004). [Off-task behavior in the cognitive tutor classroom: When students «game the system»](https://dl.acm.org/doi/10.1145/985692.985741). *Proceedings of CHI 2004*, 383–390. Verificado a nivel de resumen: aprovechar regularidades del feedback para avanzar se asocia con menor aprendizaje.
- Haladyna, T. M., Downing, S. M. y Rodriguez, M. C. (2002). [A review of multiple-choice item-writing guidelines for classroom assessment](https://eric.ed.gov/?id=EJ660246). *Applied Measurement in Education*, 15(3), 309–333. Texto verificado: pauta 20 «Vary the location of the right answer according to the number of choices», pauta 28 «Avoid giving clues to the right answer», pauta 29 «Make all distractors plausible».
- Mislevy, R. J., Almond, R. G. y Lukas, J. F. (2003). [A brief introduction to evidence-centered design](https://onlinelibrary.wiley.com/doi/10.1002/j.2333-8504.2003.tb01908.x). *ETS Research Report Series*. Marco del argumento de evidencia: qué comportamiento observable cuenta como evidencia de qué constructo. Verificado a nivel de resumen.
