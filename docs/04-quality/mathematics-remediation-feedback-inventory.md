# Inventario de feedback afirmativo

- **Estado:** `EXECUTED` — 2026-09-17, dentro de la
  [implementación de la remediación matemática](mathematics-remediation-implementation.md)
- **Regla que lo exige:** [especificación de remediación, regla 2.9](mathematics-remediation-spec.md#2-reglas-transversales)
- **Alcance:** las 42 Templates del catálogo de carrera completa —`grade-5-dev-3` al ejecutarlo, `grade-5-dev-4` desde la reescritura de la pantalla del acto— —no sólo las de la
  especificación—, sobre los tres campos de texto fijo del feedback:
  `consequence`, `optimalComparison` y `violatedConstraint`
- **Consumidor:** `Independent Mathematics Re-Audit`

## Método

1. Se extrajeron del código, con el AST de TypeScript, **las 136 asignaciones** de
   esos tres campos en los 33 archivos de `src/content/` que los escriben.
2. Se descartaron los textos que no afirman una comparación, una dirección o una
   causa: narración de consecuencia social («el acto sigue sin vos»), nombres de
   restricción («hora de entrada») y cierres sin contenido matemático («Queda
   anotado, y el año sigue»).
3. Cada texto que sí afirma algo quedó en uno de dos estados:
   - **A — probado:** es verdadero en toda variante aprobada donde se muestra,
     porque la escalera o un gate lo garantizan, y se dice cuál;
   - **B — calculado:** se arma desde los parámetros o la respuesta de la
     variante, así que no puede afirmar algo que la variante no tiene.
4. Donde la garantía no era evidente se midió sobre el catálogo publicado y, si
   el texto resultó falso, **se corrigió** y quedó un test.

Ningún texto queda en estado «falso»: los que lo eran se corrigieron en esta
implementación (sección [Correcciones](#correcciones)).

## Correcciones

| Template | Texto anterior | Por qué era falso | Ahora | Test |
|---|---|---|---|---|
| `g7.notebook-offer` | «El descuento en porcentaje era mayor que el descuento fijo, aunque sonara al revés.», fijo en el acierto | En 14 de 26 variantes el descuento fijo era el mayor (MAT-AJ-NEW-002) | B: nombra los dos descuentos en pesos y cuál era mayor | `mathematics-remediation.test.ts` · RS-NEW-002 |
| `y3.fixed-variable-review`, `y4.margin-review`, `y3.rate-capacity-review`, `y4.spatial-capacity-review`, `y5.proportion-capacity-review` | Una sola frase de dirección para todo lo que no era exacto —por ejemplo «El abono rinde un viaje más adelante de lo que dijiste», «Contar de más deja gente parada»— | La dirección era falsa del otro lado del valor exacto (MAT-AJ-NEW-003) | B: frase según el signo de `respuesta − exacta`; el error con nombre propio conserva su explicación | RS-NEW-003, enumeración del rango en cada variante |
| `y5.multi-option-comparison-review` | «Comparar precios que no incluyen lo mismo es lo que hace que después falte plata.» para toda respuesta no exacta | Afirmaba que faltaba parte del micro también cuando la respuesta sumaba de más; encontrado por el inventario | B: por signo | RS-NEW-003 |
| `y2.court-zones` | Óptimo: «Las postas quedan lo más separadas que permite la cancha…» | El óptimo es `separación ≥ pedido + 2`; en 17 de 25 variantes la cancha permitía más | A: «quedan con dos celdas o más de separación sobre lo pedido» | inventario · `court-zones` |
| `y4.school-event-flow` | Inválido: «La cola sale a la vereda y N personas no entran a tiempo.» | Afirmaba que no entraba **nadie** de las N, y también se mostraba al repartir ayudantes que no hay, donde no hay cola que medir | B: distingue ayudantes que no hay de ritmo insuficiente, con la cantidad de personas | inventario · `school-event-flow` |
| `y1.classroom-layout` (franja) | Óptimo: «Entran las tres cosas: la cuenta en celdas cerró justo.» | En variantes con una celda de sobra no cerraba justo | B: «cerró justo» sólo si el ancho es exacto; si no, «sobra una celda» | la rama compara el ancho con la suma de los objetos |
| `y5.final-trip-or-event` | Funcional: nombraba sólo el primer faltante | Con micro y comidas afuera decía sólo «el micro» | B: «el micro y las comidas» cuando faltan las dos | inventario · `final-trip` |
| `y5.stage-screen` | Inválido: «El recorte de arriba se come el cartel del curso.» | El cartel está arriba o abajo según la variante: con el cartel abajo nombraba el lado equivocado | B: «El recorte de {lado} se come el cartel del curso.» | inventario · `stage-screen` |
| `g7.bus-timing` | Funcional: «sin ningún colchón: cualquier demora extra te dejaba afuera» | En 18 de las 21 opciones funcionales publicadas había 1 a 4 min de margen | B: con margen 0 lo dice; si no, «una demora de más de N min te dejaba afuera» | inventario · `bus-timing` |

## Inventario por Template

### 7.º

| Template | Campo · nivel | Afirma | Estado | Garantía |
|---|---|---|---|---|
| `g7.bus-timing` | `optimalComparison` · functional | margen y demora que deja afuera | B | margen de la opción elegida |
| `g7.bus-timing` | `optimalComparison` · optimal «sin madrugar de más» | no había un margen suficiente más chico | A | óptimo = `margen === mejorMargen` |
| `g7.bus-timing` | `optimalComparison` · efficient | con `best` min alcanzaba | B | `bestMargin(model)` |
| `g7.bus-latest-departure` | `optimalComparison` · invalid, efficient, functional | minutos necesarios y de más | B | `model.requiredMinutes`, holgura calculada |
| `g7.bus-latest-departure` | `optimalComparison` · optimal «el número que hacía falta» | exactitud | A | óptimo = respuesta exacta |
| `g7.bus-latest-departure` | `consequence` · invalid | tarde por la entrada o sin el margen pedido | B | rama por `arrival > entrada` |
| `g7.bus-travel-review` | `optimalComparison` · cuatro niveles | minutos de la demora y del viaje | B | `model.extraMinutes`, `model.travelMinutes` |
| `g7.bus-travel-review` | `consequence` · «Faltaba sumarle el viaje normal» | causa del error | **C** (era A) | **Clasificación corregida el 2026-09-18, D-S08-125.** La justificación registrada —«se muestra sólo si la respuesta es la demora sola»— es **falsa**: la rama decide con `Math.abs(respuesta − viajeDeHoy) === viajeNormal`, y un valor absoluto tiene dos raíces, así que también dispara en `viajeDeHoy + viajeNormal`, donde el jugador se **pasó**. Falso en 26 de 26 variantes. Ver [MAT-RA-001](independent-mathematics-reaudit.md#mat-ra-001-high-bloqueante-g7bus-travel-review) y [RS-RA-001](post-reaudit-mathematics-remediation-spec.md#4-rs-ra-001-g7bus-travel-review) |
| `g7.mural-paint` | `optimalComparison` · optimal «el envase más barato entre los que alcanzaban» | mínimo entre suficientes | A | óptimo = `smallestSufficientTin` más barato |
| `g7.mural-paint` | `optimalComparison` · functional | con el envase de $X alcanzaba | B | precio del más barato suficiente |
| `g7.notebook-offer` | `optimalComparison` · optimal | qué descuento era mayor | B | `discountComparison` |
| `g7.notebook-offer` | `optimalComparison` · invalid | precio de la otra oferta | B | `cheapest` |
| `g7.stand-supplies` | `optimalComparison` · optimal «ninguna combinación cubría por menos» | mínimo de costo | A | óptimo = costo mínimo enumerado |
| `g7.stand-supplies` | `optimalComparison` · efficient | costo de la mejor combinación | B | `model.optimalCostMinor` |
| `g7.group-tasks` | `optimalComparison` · optimal «cada parte en manos de quien mejor la hacía» | asignación por mejor afinidad | A | las dos variantes son autoradas; su único óptimo suma 12 = 4 × 3 estrellas, así que cada tarea queda con una afinidad máxima |
| `g7.group-tasks` | `optimalComparison` · efficient, functional | afinidad sumada contra la mejor | B | `model.bestSkill` |
| `g7.may-25-act` | `optimalComparison` · cuatro niveles | qué regla se siguió o no | B/A | `missedRule` calculado; el óptimo es seguir todas |

### 1.º

| Template | Campo · nivel | Afirma | Estado | Garantía |
|---|---|---|---|---|
| `y1.student-day-challenge-wheel` | `violatedConstraint`, `consequence` | posiciones, regla, tipos, veces esperadas | B | parámetros y reparto |
| `y1.course-project-expo` | `consequence` · efficient | nadie libre puede presentar si falta quien presenta | B/A | nombre calculado; efficient = sin plan B |
| `y1.mobile-data` | `violatedConstraint`, `optimalComparison`, `consequence` | días sin material, MB usados, alternativa | B | `decoyText`, `used`, `capacity` |
| `y1.rehearsal-schedule` | `consequence` · efficient, optimal | margen logrado contra el pedido | B | `result.margin`, `p.margin` |
| `y1.schedule-review` | `optimalComparison` | cuenta hacia atrás desde el límite | B | `backwards` |
| `y1.schedule-review` | `consequence` · functional «sin ningún minuto de margen» | margen cero | A | efficient es `margen > 0` y un margen negativo es violación: functional sólo con margen 0 |
| `y1.classroom-layout` | `consequence` · functional | lugares logrados contra el ideal | B | `found.seats`, `p.targetSeats` |
| `y1.classroom-layout` | `consequence` · franja optimal | cuenta justa o con una celda de sobra | B | ancho contra suma de objetos |
| `y1.scale-fit-review` | `violatedConstraint` | violaciones | B | `found.violations` |

### 2.º

| Template | Campo · nivel | Afirma | Estado | Garantía |
|---|---|---|---|---|
| `y2.course-project-survey` | `violatedConstraint` · invalid | qué afirmación no se sostiene y con qué datos | B | primera publicada falsa |
| `y2.course-project-survey` | `optimalComparison` · efficient, functional | qué más se podía afirmar | B | primera cierta retenida |
| `y2.course-project-survey` | `consequence` · optimal «dice exactamente lo que la encuesta sostiene» | exactitud | A | óptimo = cero publicadas falsas y cero ciertas retenidas |
| `y2.course-project-survey` | `consequence` · efficient, functional «se guarda cosas que sí permitían decir» | hubo ciertas retenidas | A | efficient/functional = al menos una cierta retenida |
| `y2.data-claim-review` | `optimalComparison` «la misma cifra cambia según sobre cuánta gente» | contraste de denominador | A | gate: `answered < population` en toda variante |
| `y2.standings-claim` | `violatedConstraint` · invalid «todavía no está asegurado» | categoría | A | invalid = marcar seguro lo que no es seguro |
| `y2.standings-claim` | `consequence` · postura «campeones» | si los números lo respaldan | B | `champion` calculado |
| `y2.team-kit-order` | `optimalComparison` | reparto proporcional por equipo | B | `target` |
| `y2.team-kit-order` | `consequence` · efficient, functional | repuestos no quedan donde hay más gente | A | niveles definidos por distancia al reparto por restos mayores |
| `y2.court-zones` | `violatedConstraint` · invalid | margen, celda repetida, techo, separación lograda | B | rama por falla y `spread` |
| `y2.court-zones` | `optimalComparison` · optimal, efficient | con pedido + 2 celdas las colas quedan sueltas | A | `tierOf`: óptimo = `spread ≥ apart + 2` |
| `y2.court-zones` | `consequence` · optimal | dos celdas o más sobre lo pedido | A | `tierOf` |
| `y2.court-zones` | `consequence` · efficient, functional «más juntas de lo que la cancha permitía» | había una ubicación mejor | A | witness de nivel `optimal` por variante |
| `y2.intercurso-plan` | `violatedConstraint`, `consequence` | qué actividad falta, Equipo | B | cobertura y `read.team` |

### 3.º

| Template | Campo · nivel | Afirma | Estado | Garantía |
|---|---|---|---|---|
| `y3.transport-pass` | `violatedConstraint` · invalid «más caro que otra forma, viajes cualquiera» | dominada en todo el rango | A | invalid = más cara que la óptima en todo el rango (gate `LOCKED`) |
| `y3.transport-pass` | `consequence` · optimal «ninguna otra te sale menos» | mínimo en `likely` | A | óptimo = más barata en `likely`, única, sin empates (gates) |
| `y3.transport-pass` | `consequence` · efficient | viajes a partir de los cuales conviene, y hacia dónde | B | `efficientConsequence`, test de dirección en toda variante |
| `y3.transport-pass` | `consequence` · functional «siempre hay otra que te sale menos» | nunca gana | A | functional = no es la más barata en ningún viaje del rango y no hay empates |
| `y3.fixed-variable-review` | `violatedConstraint` · functional | boletos de `exacta − 1` todavía menos | B | `exact`, `p.ticket` |
| `y3.fixed-variable-review` | `consequence` · resto | dirección del error | B | signo, test RS-NEW-003 |
| `y3.course-project-tech` | `violatedConstraint` · invalid | qué recurso no alcanza | B | `read.over` |
| `y3.course-project-tech` | `consequence` · optimal «entró todo lo prometido» | completo | A | óptimo = lo prometido entero |
| `y3.rate-capacity-review` | `violatedConstraint`, `consequence` | uno más no entra; dirección | B | `whole`, signo |
| `y3.friend-day` | `violatedConstraint`, `consequence` | quién falta; Equipo | B | `missing`, `read.team` |
| `y3.week-planner` | `violatedConstraint` | tipo de falla | B | `read.failure` |
| `y3.week-planner` | `consequence` · optimal «encima lo que querías» | opcionales dentro | A | óptimo = los dos opcionales |
| `y3.route-plan` | `violatedConstraint` | qué quedó sin hacer o cerrado | B | `read.missing`, `read.failure` |
| `y3.route-plan` | `consequence` · optimal «las dos vueltas de más» | opcionales dentro | A | óptimo = los dos opcionales |

### 4.º

| Template | Campo · nivel | Afirma | Estado | Garantía |
|---|---|---|---|---|
| `y4.course-project-fundraiser` | `violatedConstraint` · invalid | cocina o pérdida | B | `read.minutes` contra cocina |
| `y4.course-project-fundraiser` | `consequence` · por nivel | cubre, llega, colchón | A | escalera: functional cubre, efficient objetivo, optimal colchón |
| `y4.margin-review` | `violatedConstraint` · functional | precio contra lo que deja | B | `p.price − p.cost` |
| `y4.margin-review` | `consequence` · resto | dirección del error | B | signo, test RS-NEW-003 |
| `y4.school-event-flow` | `violatedConstraint`, `consequence` · invalid | ayudantes que no hay o ritmo del cuello de botella | B | `read.overstaffed`, `read.rate` |
| `y4.school-event-flow` | `consequence` · efficient «con aire de sobra» | llega a la mitad del margen posible | A | efficient = mitad del margen posible |
| `y4.school-event-flow` | `consequence` · optimal «el mejor ritmo que se puede sostener» | máximo | A | óptimo = mejor ritmo alcanzable |
| `y4.event-floor-plan` | `violatedConstraint` | tipo de falla, asientos contra invitados | B | `read.failure`, `read.seats` |
| `y4.event-floor-plan` | `consequence` · optimal «entraron las dos zonas de más» | completo | A | óptimo = mesa más y barra |
| `y4.spatial-capacity-review` | `violatedConstraint` · functional | celdas reservadas | B | `p.reserved` |
| `y4.spatial-capacity-review` | `consequence` · resto | dirección del error | B | signo, test RS-NEW-003 |
| `y4.represent-class` | `violatedConstraint` · invalid | qué límite deja afuera la propuesta | B | `blockedBy` |
| `y4.represent-class` | `consequence` · ninguna marcada | no llevó propuesta aunque había viables | B/A | rama calculada; gate de dos viables por variante |
| `y4.represent-class` | `consequence` · postura | a quién afectaba | B | `p.stakes` |
| `y4.shift-coverage` | `violatedConstraint` | puesto y bloque vacío | B | `empty` |
| `y4.shift-coverage` | `consequence` · por nivel | descanso y cambios de manos | A | escalera por descanso y cambios |

### 5.º

| Template | Campo · nivel | Afirma | Estado | Garantía |
|---|---|---|---|---|
| `y5.final-trip-or-event` | `violatedConstraint` · invalid | fondo, días o lugares | B | `reason` |
| `y5.final-trip-or-event` | `consequence` · functional | qué falta | B | `offer.micro`, `offer.comidas` |
| `y5.final-trip-or-event` | `consequence` · efficient, optimal | fondo al límite o con reserva | A | escalera por reserva |
| `y5.multi-option-comparison-review` | `violatedConstraint` · functional | micro por persona y cantidad | B | `p.perPerson`, `p.people` |
| `y5.multi-option-comparison-review` | `consequence` · resto | dirección del error | B | signo, test RS-NEW-003 |
| `y5.course-project-final` | `violatedConstraint` · invalid | esencial, ausente u horas | B | `read.failure` |
| `y5.course-project-final` | `consequence` · postura | si el cambio se notó | B | `p.visible` |
| `y5.stage-screen` | `violatedConstraint` · invalid | deforma, o qué elemento protegido se come el recorte | B | recorte de cada lado contra su aire |
| `y5.stage-screen` | `consequence` · efficient «bandas a los costados» | bandas laterales | A | con test: sólo «entera» llega a efficient, y su alto es el de la pantalla |
| `y5.stage-screen` | `consequence` · functional «chica en el medio» | usa menos de tres cuartos | A | con test: el nivel functional es exactamente «usa menos de 3/4 de la pantalla» |
| `y5.yearbook` | `violatedConstraint` | total, mínimo o tope | B | `read.failure` |
| `y5.yearbook` | `consequence` · efficient, functional «algo del material quedó afuera» | incompleto | A | escalera por secciones completas |
| `y5.proportion-capacity-review` | `violatedConstraint` · functional | páginas de `exacta − 1` no alcanzan | B | `exact`, `p.perPage` |
| `y5.proportion-capacity-review` | `consequence` · resto | dirección del error | B | signo, test RS-NEW-003 |
| `y5.next-step-options` | `violatedConstraint` · invalid | qué dato deja afuera el escenario | B | `blockedBy` |

## Lo que el inventario no cubre

- Textos de **pantalla** (`present`, `narrate`): los revisan los contratos que los
  nombran —regla del colectivo, regla de publicación de la encuesta, consigna de
  la peña, horas con viaje—, no este inventario.
- `facts`: son números de la variante, no afirmaciones.
- Storylets y epílogo: no dan feedback matemático.
