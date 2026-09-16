# Paquete de revisión — Departamento de Matemática

- **Para:** el Departamento de Matemática que tiene que revisar y aprobar el
  contenido matemático de Egresado
- **Fecha de preparación:** 16 de septiembre de 2026
- **Estado del gate:** `PENDIENTE`. Este paquete organiza la evidencia; la
  decisión es del Departamento

Este documento se puede usar **sin leer una sola línea de código**. Todo lo que
hace falta para revisar está acá o se abre desde el juego.

## Parte A — Contexto

### Qué es Egresado

Un juego de decisiones escolares donde la matemática es necesaria para decidir
bien. El jugador recorre seis años —7.º grado y 1.º a 5.º año— y en cada uno
resuelve situaciones: cuánto colectivo conviene pagar, cómo repartir turnos, qué
se puede afirmar con una encuesta, cómo entra el escenario en el salón. La
partida termina con el egreso.

No es un libro de texto ni una evaluación. No hay ejercicios sueltos: hay
situaciones donde la cuenta cambia la decisión, y la decisión tiene consecuencia.

### Qué se les pide revisar

Que la matemática sea **correcta**, **honesta** y **enseñable**. Concretamente:

- que las cuentas estén bien;
- que las consignas no sean ambiguas;
- que lo que el juego declara correcto sea efectivamente correcto;
- que no se refuercen errores conceptuales frecuentes;
- que el feedback no enseñe reglas falsas;
- que las tareas sean apropiadas para chicos de 12 a 17 años;
- que los Repasos trabajen el concepto que dicen trabajar.

### Qué NO se les pide

- **No** se les pide que el juego se parezca al programa de su año. No es un
  curso: es un juego que un chico de 7.º y un adulto tienen que poder jugar.
- **No** se les pide validar el puntaje competitivo ni el ranking.
- **No** se les pide aprobar la narrativa, el diseño visual ni el lenguaje
  coloquial, salvo donde compliquen entender la matemática.
- **No** se les pide leer código, catálogos ni documentos técnicos.

### Vocabulario del juego

**CORE / STANDARD / STRETCH.** Es cuánta cabeza pide una situación, no de qué año
es el tema. Una situación CORE tiene pocos pasos y pocas restricciones a la vez;
una STRETCH tiene varias restricciones que se afectan entre sí, hay que elegir
qué datos usar y hay que optimizar. Una situación puede ser STRETCH usando sólo
sumas y restas.

**Los cuatro niveles de resultado.** Cada respuesta cae en uno:

| Nivel | Qué significa | Vale |
|---|---|---|
| `OPTIMAL` | La mejor respuesta posible | 100 |
| `EFFICIENT` | Buena: resuelve bien, pero había algo mejor | 75 |
| `FUNCTIONAL` | Alcanza: cumple lo mínimo, con comprensión parcial | 40 |
| `INVALID` | No cumple alguna condición del problema | 10 |

**Repaso.** Cuando alguien falla una situación, el año le ofrece **una** vuelta
corta sobre el concepto que falló, más simple y aislado. El Repaso **no suma
puntos** y no borra la falla: sirve para cerrar el año entendiendo algo, no para
recuperar nota. Hay como máximo un Repaso por año.

**Piso matemático universal.** El proyecto decidió que toda la carrera sea
jugable desde aproximadamente 7.º. La dificultad sube por cantidad de
restricciones y de decisiones, no por temas más avanzados. Por eso **el año
narrativo no es un año de currículum**: que una situación esté en 5.º no
significa que use matemática de 5.º año.

Esto es deliberado y no está en discusión en este gate. Lo que sí está en
discusión es si cada situación es **resoluble con lo que la propia pantalla
entrega**, sin teoría previa que nadie explicó.

## Parte B — Cómo revisar

### Abrir el juego

1. En una terminal, dentro del proyecto: `pnpm dev`.
2. En el navegador: `http://localhost:3000/dev/game-engine?content=full-career`.
3. Botón **Empezar**. Se juega una carrera completa de nueve situaciones.

Para ver un año suelto, cambiar el final de la dirección por
`?content=grade-2-demo` (o `grade-1`, `grade-3`, `grade-4`, `grade-5`). El modo
`-demo` muestra **todas** las situaciones de ese año seguidas, que es lo cómodo
para revisar.

Para repetir exactamente la misma partida, agregar `&seed=loquesea`: la misma
palabra da siempre los mismos números. Eso permite volver a una situación
concreta y mostrársela a otra persona.

### Cómo leer una situación

Cada pantalla tiene tres partes:

1. **La situación**: qué está pasando y qué hay que lograr.
2. **Los datos**: los números con los que hay que razonar. Si un número hace
   falta para decidir, tiene que estar acá y no escondido en el texto.
3. **La respuesta**: elegir, construir, repartir o clasificar.

Al confirmar aparece el **resultado**: el nivel alcanzado, la cuenta real y la
comparación con la mejor respuesta.

### Cómo registrar un hallazgo

Usar la ficha de la [Parte G](#parte-g-planilla-de-sign-off). Lo importante es
que sea **reproducible**: anotar la dirección con `seed` para que otra persona
vea exactamente la misma pantalla.

### Distinguir un error de una decisión de diseño

| Es un **error** | Es una **decisión de diseño** |
|---|---|
| La cuenta da mal | La situación es más fácil o más difícil de lo que esperaría para ese año |
| Hay dos lecturas razonables y el juego acepta una sola | El juego usa lenguaje coloquial |
| Falta un dato para poder decidir | No se formaliza con símbolos ni fórmulas |
| El feedback afirma algo falso | El contexto es narrativo y no escolar |
| Una respuesta correcta se marca inválida | El año narrativo no coincide con el año curricular del tema |

Si algo entra en la segunda columna pero igual les preocupa, anotarlo como
**OBSERVACIÓN**: no bloquea, y queda registrado.

## Parte C — Checklist global

Para responder una vez, al final del recorrido. Marcar
`PASS` / `OBSERVACIÓN` / `CAMBIO REQUERIDO` / `BLOQUEANTE`.

| # | Pregunta | Veredicto |
|---|---|---|
| 1 | ¿La matemática es correcta en todo lo que revisaron? | |
| 2 | ¿Las consignas dicen sin ambigüedad qué hay que lograr? | |
| 3 | ¿Están todos los datos necesarios en pantalla? | |
| 4 | ¿Alguna situación exige teoría que nadie presentó? | |
| 5 | ¿Los cuatro niveles representan comprensiones distintas? | |
| 6 | ¿El feedback explica el criterio y es correcto? | |
| 7 | ¿Los Repasos trabajan el concepto que fallaron? | |
| 8 | ¿Se refuerza algún error conceptual frecuente? | |
| 9 | ¿El lenguaje es apropiado para 12 a 17 años? | |
| 10 | ¿La dificultad crece por estructura y no por números más feos? | |
| 11 | ¿La cobertura de dominios es razonable para el propósito del juego? | |
| 12 | ¿Hay algo que **no** publicarían con su nombre? | |

## Parte D — Ficha por situación

Las 32 situaciones puntuables, por año. Los diez Repasos están en la
[Parte E](#parte-e-ficha-por-repaso).

La columna **revisar a mano** es lo que la pre-revisión automática **no** puede
decidir y necesita ojo docente.

### 7.º grado

| Situación | Qué pasa | Qué matemática | Qué hace el jugador | Nivel | Revisar a mano |
|---|---|---|---|---|---|
| El colectivo, hora de salida | Hay que llegar a horario | Tiempos y margen | Elige el horario en una línea de tiempo | STANDARD | Si «llegar con margen» se entiende sin explicación |
| El colectivo, última salida | Cuál es el último que sirve | Resta de tiempos con restricción | Escribe un horario | STANDARD | — |
| El mural | Pintar una pared | Cobertura por litro y compra por envase | Elige qué lata comprar | STANDARD | **La lata de 1 L nunca alcanza y el nivel intermedio no existe** |
| La oferta de la notebook | Dos descuentos sobre el mismo precio | Porcentaje contra descuento fijo | Elige una oferta | STANDARD | **Sólo hay acertar o errar: un error cuesta 90 puntos** |
| El stand de la feria | Comprar insumos con un presupuesto | Reparto con demanda | Arma la compra | STRETCH | — |
| Las tareas del grupo | Repartir un trabajo | Asignación con disponibilidad | Asigna personas a tareas | STRETCH | — |
| El acto del 25 de Mayo | Elegir números en una grilla | Clasificación bajo una regla | Marca celdas | CORE | — |

### 1.º año

| Situación | Qué pasa | Qué matemática | Qué hace el jugador | Nivel | Revisar a mano |
|---|---|---|---|---|---|
| La rueda del Día del Estudiante | Armar una rueda de desafíos | Distribución sobre posiciones iguales, con una regla en fracción, porcentaje, «1 de cada k» o probabilidad | Reparte posiciones | CORE | **Si las cuatro notaciones se leen como lo mismo.** Es la única situación con sign-off manual pendiente |
| Los datos del celular | No quedarse sin datos | Consumo por unidad contra un tope | Reparte el consumo | CORE | — |
| La agenda del ensayo | Llegar al ensayo con todo hecho | Encadenar tiempos con traslado | Ubica actividades en la tarde | STANDARD | — |
| El aula para la expo | Que entre todo y se circule | Escala, despejes y circulación | Ubica objetos en el plano | STRETCH | Si la escala del plano se entiende |
| Proyecto del Curso: la expo | Repartir roles | Asignación con preferencias | Asigna personas | STANDARD | — |

### 2.º año

| Situación | Qué pasa | Qué matemática | Qué hace el jugador | Nivel | Revisar a mano |
|---|---|---|---|---|---|
| La encuesta del Proyecto | Publicar resultados de una encuesta | **Proporción sobre la muestra contra proporción sobre el nivel entero** | Decide qué afirmación se puede publicar y cuál no | STANDARD | **P0. Ver abajo** |
| La tabla del Intercurso | Qué puede publicar el curso | Máximo alcanzable contra mínimo asegurado | Clasifica en «asegurado / puede pasar / ya no» y elige qué publica | STANDARD | **P0. Ver abajo** |
| Las zonas de la cancha | Repartir el espacio | Distancias y reparto | Ubica zonas | STRETCH | — |
| El plan del Intercurso | Organizar la participación | Asignación con tiempos | Asigna personas | STANDARD | — |
| El pedido de pecheras | Comprar por talles | Cantidades con mínimo por lote | Arma el pedido | CORE | — |

**P0 — La encuesta del Proyecto.** Es la situación estadísticamente más
delicada del juego y la que más conviene mirar. Tres preguntas concretas:

1. Una de las afirmaciones dice que una opción «le ganó a otra **con
   claridad**». El juego decide que es cierto cuando la diferencia supera el
   10 % de las respuestas. Ese criterio **no está escrito en la pantalla**.
   ¿Es razonable pedirle a un estudiante que lo infiera? ¿Es defendible llamar
   «claridad» a 25 contra 18 sobre 48 respuestas?
2. Las afirmaciones sobre el nivel entero son **siempre** «no se puede afirmar»
   en todas las variantes. ¿Está bien, o convendría que a veces sí se pueda
   —por ejemplo cuando el recuento supera la mitad del nivel—?
3. ¿El lenguaje de las afirmaciones expresa suficiente incertidumbre, o suena
   demasiado tajante para lo que una muestra permite decir?

**P0 — La tabla del Intercurso.** La pantalla muestra cuatro cursos —2.º A, B, C
y D— con sus puntos y cuántos partidos les faltan. El juego calcula el máximo y
el mínimo de cada equipo por separado. Dos preguntas:

1. Si los cuatro juegan entre sí, no pueden ganar todos sus partidos pendientes:
   ¿la cuenta independiente es aceptable para este nivel, o induce a error?
2. En varias variantes los partidos que faltan suman un número impar, que sería
   imposible en un torneo entre esos cuatro. ¿Conviene aclarar en la consigna
   que juegan contra otros años?

### 3.º año

| Situación | Qué pasa | Qué matemática | Qué hace el jugador | Nivel | Revisar a mano |
|---|---|---|---|---|---|
| El abono del colectivo | Cuatro formas de pagar el mismo colectivo | **Costo fijo contra costo variable y el umbral de usos** | Elige una forma de pago | CORE | **P0. Ver abajo** |
| Proyecto del Curso: la feria de tecnología | Armar el stand | Varios recursos apretando a la vez | Decide cuánto hacer de cada cosa | STANDARD | — |
| El Día del Amigo | Organizar el día | Agenda con traslados y ventanas | Ubica actividades | STANDARD | — |
| La semana | Organizar la semana propia | Franjas fijas y actividades móviles | Arma la semana | STANDARD | Si la vista semanal se entiende de un vistazo |
| El recorrido del barrio | Hacer mandados | Distancias y horarios de atención: **el orden cambia si se puede o no** | Ordena las paradas | STRETCH | Si se entiende que el orden importa |

**P0 — El abono del colectivo.** La situación ofrece boleto suelto, tarjeta
recargable, combo mensual y abono libre, y la idea declarada es que **ninguna
conviene siempre**. En la práctica, el boleto suelto **nunca** es el más barato
dentro del rango de viajes posibles, en ninguna de las 25 variantes. Elegir
siempre «abono libre» sin hacer ninguna cuenta da 78 puntos sobre 100 de
promedio.

Preguntas: ¿está bien que la opción «pago por uso» nunca convenga? ¿No enseña
eso la regla contraria a la que se busca —que depende de cuánto se use—?
¿Alcanza con que el Repaso aísle el umbral?

### 4.º año

| Situación | Qué pasa | Qué matemática | Qué hace el jugador | Nivel | Revisar a mano |
|---|---|---|---|---|---|
| La cola del evento | La fila sale a la vereda | **Cuello de botella: el ritmo lo marca el puesto más lento** | Reparte ayudantes entre puestos | STANDARD | Si «cuello de botella» se entiende sin nombrarlo |
| Proyecto del Curso: la peña | Recaudar para el proyecto | Costo fijo, margen, punto de equilibrio y objetivo como condiciones **distintas** | Arma la producción | STANDARD | Si conviene nombrar el punto de equilibrio |
| El salón del evento | Que entre todo y se circule | Área, capacidad y circulación | Ubica mesas y barra | STRETCH | — |
| Los turnos | Cubrir los puestos | Cobertura con continuidad y descansos | Asigna personas a bloques | CORE | — |
| El consejo escolar | Llevar una propuesta | Viabilidad bajo tres límites, más una postura pública aparte | Clasifica propuestas y elige postura | STANDARD | **En 13 de 25 variantes el nivel intermedio no existe** |

### 5.º año

| Situación | Qué pasa | Qué matemática | Qué hace el jugador | Nivel | Revisar a mano |
|---|---|---|---|---|---|
| El viaje | En qué gastar lo juntado | Comparación con fondo, días y lugares | Elige destino | STRETCH | — |
| Proyecto del Curso: la muestra final | Se cae algo a tres días | Reasignación bajo contingencia | Reasigna tareas y elige qué dice el curso | STANDARD | — |
| La pantalla del acto | La imagen y la pantalla no tienen la misma forma | **Razón de aspecto, escala y recorte** | Elige cómo proyectar | STRETCH | **Elegir «entera» da 75 sobre 100 siempre, sin calcular** |
| El anuario | Más material que páginas | Reparto de un total exacto | Reparte páginas | STANDARD | — |
| El año que viene | Qué hacer al terminar | Viabilidad contra el tiempo disponible | Marca qué entra y qué no | CORE | La preferencia personal **no** se puntúa: confirmar que la pantalla lo deja claro |

## Parte E — Ficha por Repaso

Un Repaso aparece cuando alguien falla. Aísla **un** concepto, es más simple y no
suma puntos.

| Repaso | Viene de fallar | Concepto que aísla | Cómo lo simplifica | Debrief |
|---|---|---|---|---|
| Viaje en colectivo | Las situaciones del colectivo | Tiempo de viaje | Una sola cadena de tiempos | Explica qué se pasó por alto |
| Agenda | La agenda del ensayo | Encadenar tiempos con traslado | Dos actividades y un viaje | Ídem |
| Escala y encaje | El aula para la expo | Escala | Un solo objeto en el plano | Ídem |
| Denominador | La encuesta | **Sobre cuánta gente se calcula** | Una afirmación por denominador | Ídem |
| Fijo y variable | El abono del colectivo | **El umbral de usos** | Un costo fijo y uno por viaje | Ídem |
| Tasa y capacidad | La feria de tecnología | Tasa contra capacidad | Un solo recurso | Ídem |
| Margen | La peña | **Punto de equilibrio** | Costo fijo contra lo que deja cada bandeja | Ídem |
| Capacidad del salón | El salón del evento | Capacidad neta | Salón menos lo reservado | Ídem |
| Comparación | El viaje | Comparar opciones | Dos opciones | Ídem |
| Proporción y capacidad | La pantalla o el anuario | Proporción | Una razón | Ídem |

**Punto de atención P0 — el Repaso del denominador.** En las 25 variantes
aprobadas hay **una sola** respuesta correcta, y es siempre la misma: «lo que es
sobre los que contestaron se puede afirmar, lo que es sobre el nivel entero no».
Un estudiante que lo ve por segunda vez puede cerrarlo sin mirar los números.

Pregunta para el Departamento: ¿un Repaso con una única respuesta sigue siendo
una segunda oportunidad de entender, o se vuelve un trámite?

## Parte F — Casos concretos para revisar a mano

No hace falta mirar mil variantes. Estas son las pantallas elegidas: normales,
de borde y de riesgo. Abrir con
`http://localhost:3000/dev/game-engine?content=<set>&seed=<seed>`.

| # | Situación | Tipo | Por qué esta | Cómo llegar |
|---|---|---|---|---|
| 1 | La encuesta del Proyecto | **Riesgo alto** | 25 contra 18 sobre 48 respuestas: el juego afirma que «le ganó con claridad» | `grade-2-demo`, buscar la encuesta |
| 2 | La encuesta del Proyecto | Borde | Diferencia de **una sola** respuesta entre las dos primeras opciones | `grade-2-demo`, variante con 24 y 23 |
| 3 | La tabla del Intercurso | **Riesgo alto** | Partidos pendientes 2/2/2/1: suman impar | `grade-2-demo` |
| 4 | El abono del colectivo | **Riesgo alto** | Comparar las cuatro formas y ver si el boleto suelto puede convenir alguna vez | `grade-3-demo` |
| 5 | El abono del colectivo | Normal | Mes corto, pocos viajes: el caso donde uno esperaría que convenga el suelto | `grade-3-demo`, mes corto |
| 6 | La pantalla del acto | **Riesgo alto** | Probar «entera» y ver qué nivel da sin calcular nada | `grade-5-demo` |
| 7 | El mural | Ambigua | Ver si existe un resultado intermedio entre acertar y errar | `full-career` o 7.º |
| 8 | El consejo escolar | Borde | Buscar una variante donde no exista el nivel intermedio | `grade-4-demo` |
| 9 | La rueda del Día del Estudiante | **Sign-off pendiente** | Las cuatro notaciones de la misma regla | `grade-1-demo` |
| 10 | El recorrido del barrio | Normal | Confirmar que el orden de las paradas cambia la factibilidad | `grade-3-demo` |
| 11 | La muestra final | Normal | Ejemplo de situación con muchas respuestas óptimas distintas | `grade-5-demo` |
| 12 | El viaje | Normal | Ejemplo de comparación bien repartida entre las cuatro opciones | `grade-5-demo` |

Los casos 11 y 12 están para **contraste**: son las dos situaciones que la
pre-revisión considera mejor construidas. Sirven de vara para juzgar las demás.

## Parte G — Planilla de sign-off

Una ficha por situación revisada. No firmar por otra persona.

```text
Revisor/a:
Rol:
Fecha:

Situación:
Dirección con seed:

Veredicto:   PASS / OBSERVACIÓN / CAMBIO REQUERIDO / BLOQUEANTE

Hallazgo:


Severidad:   BLOQUEANTE / ALTA / MEDIA / BAJA / OBSERVACIÓN

Acción requerida:


Comentarios:

```

### Veredicto global del Departamento

```text
Departamento de Matemática — Institución:
Fecha de la revisión:
Participantes (nombre y rol):

Situaciones revisadas:        ___ de 42

Veredicto global:
  [ ] APROBADO
  [ ] APROBADO CON OBSERVACIONES
  [ ] CAMBIOS REQUERIDOS ANTES DE APROBAR
  [ ] NO APROBADO

Hallazgos bloqueantes:        ___
Cambios requeridos:           ___
Observaciones:                ___

Firma del coordinador/a:
```

## Qué hizo la pre-revisión automática, y qué no

Antes de este paquete se corrió una
[pre-revisión asistida por IA](mathematics-department-pre-review.md) que
verificó las cuentas de los evaluadores, enumeró todas las respuestas posibles
donde el espacio es finito, revisó la notación de las 1025 variantes y contrastó
el contenido con los NAP y con bibliografía de educación matemática. Encontró
trece puntos, ninguno bloqueante, y **no corrigió ninguno**: el juego que van a
revisar es el mismo que se auditó.

Lo que esa pre-revisión **no puede** decidir es justamente lo que se les pide:
si un chico entiende la consigna, si la tarea vale la pena, si el error que el
juego castiga es el error que importa, y si esto se puede poner delante de un
curso.
