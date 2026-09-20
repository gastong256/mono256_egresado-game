# Auditoría final de cierre matemático

- **Estado:** `EXECUTED` — 2026-09-20, sobre `main` en `9ce2917`
- **Gate:** `FINAL MATHEMATICS CLOSURE AUDIT`
- **Rol:** equipo de auditoría independiente, de **sólo lectura** sobre el producto
- **Entrada:** el [sprint de cierre matemático](stage-08-mathematics-final-closure-sprint.md)
  y la taxonomía congelada de ocho familias que ese sprint declara final
- **Postura:** toda métrica se re-derivó fuera de la instrumentación del
  implementador **antes** de leer su informe. La auditoría permanente se trató
  como objeto auditado, no como fuente

## A. Veredicto

```text
FINAL MATHEMATICS CLOSURE AUDIT — PASSED WITH NON-BLOCKING FINDINGS
```

Ninguna política dentro de las ocho familias congeladas cruza a la vez el
guardarraíl automático **y** el análisis de constructo. No hay matemática
incorrecta, no hay feedback matemático materialmente falso, FairScore es exacto,
el egreso y la recuperación se sostienen, el servidor recompone y falla cerrado, y
los seis catálogos vigentes reconstruyen byte a byte.

Se emiten cinco hallazgos nuevos, **ninguno bloqueante**. Dos de ellos —MAT-FC-001
y MAT-FC-002— son defectos del **instrumento**, no del producto: la auditoría
permanente subestima la exposición de `y3.course-project-tech` en unos 33 puntos y
no evalúa ninguna política derivada de atributos en los motores de construcción.
El producto aguanta la medición corregida; el instrumento, no del todo.

## B. Baseline reconstruida

Medida, no asumida.

| Dato | Valor verificado |
|---|---|
| Rama · HEAD | `main` · `9ce2917` · worktree limpio al empezar y al terminar |
| Node · pnpm | 24.19.0 · 11.22.0 (`pnpm toolchain:check` PASS) |
| Motor · action log · snapshot | `10.0.0` · `7` · `8` |
| Score | `fair-score-dev-2@2.0.0-post-tg1-candidate` · `official=false` |
| Ruleset de carrera | `full-career@1.0.0-full-career` |
| Templates | **42** · 8 de 7.º, 34 de 1.º–5.º |
| Tests | **96** archivos · **1898** Vitest · **174** E2E |
| Auditoría permanente | 42 filas · 24 `AUDITED_EXHAUSTIVELY` · 18 `AUDITED_BY_POLICIES` · 0 bloqueadas |

Catálogos vigentes, con su población comprobada contra el artefacto en disco:

| Año | Catálogo | Contenido | Entradas | Generadores | Integridad |
|---|---|---|---|---|---|
| 7.º | `grade-7-dev-8` | `0.12.0-grade-7` | 189 | 7 | `ok` |
| 1.º | `grade-1-dev-4` | `1.3.0-grade-1` | 363 | 14 | `ok` |
| 2.º | `grade-2-dev-5` | `2.4.0-grade-2` | 512 | 20 | `ok` |
| 3.º | `grade-3-dev-5` | `3.4.0-grade-3` | 686 | 27 | `ok` |
| 4.º | `grade-4-dev-5` | `4.4.0-grade-4` | 858 | 34 | `ok` |
| 5.º | `grade-5-dev-6` | `5.5.0-grade-5` | 1031 | 41 | `ok` |

El `git diff` del sprint contra `a065023` toca **sólo** `src/content/`:
`src/game`, `src/server`, `src/app`, `src/components` y `src/styles` están
vacíos en el diff. La afirmación de la sección C del sprint se comprobó y es
cierta.

## C. Protocolo de independencia

Lo que se derivó **antes** de leer la instrumentación del implementador:

1. **Materialización propia.** Herramientas fuera del árbol, en el scratchpad,
   materializan cada variante aprobada de los seis catálogos y vuelcan
   `present([])` y los parámetros. 42 Templates, todas las variantes.
2. **Evaluador independiente.** Para `y3.course-project-tech` se escribió un
   evaluador propio en Python desde la especificación, y se contrastó contra el
   evaluador de producción sobre **las 39 325 respuestas** del espacio completo
   (25 variantes × 11 × 11 × 13): **0 discrepancias**.
3. **Economía independiente.** Para `y4.course-project-fundraiser` se
   re-derivaron costo fijo, precio, costo variable, margen, minutos de cocina,
   margen por minuto, objetivo, reserva, capacidad, techo de beneficio y punto de
   equilibrio de las 25 variantes, leyendo **sólo la pantalla**.
4. **Motor de políticas propio y corregido.** Se implementó un generador
   genérico de las ocho familias sobre la presentación, con dos correcciones
   deliberadas sobre el permanente: **todo subconjunto** de las capacidades
   impresas es un ámbito de llenado, y **toda** familia puede arrancar desde el
   piso copiado, no sólo `FIXED_PRIORITY`. 89 622 respuestas de política,
   evaluadas después de construirse.
5. **Enumeración exhaustiva propia** de los espacios de opción y de asignación:
   `y5.stage-screen`, `y5.final-trip-or-event`, `g7.group-tasks`, `g7.bus-timing`,
   `y3.transport-pass`, `g7.mural-paint`, `g7.notebook-offer`.
6. **FairScore recomputado a mano**, fuera del scorer de producción, con
   aritmética racional exacta.
7. **Sonda de manipulación propia** contra `validateSubmittedRun`.

Recién después se leyeron los informes de la remediación dirigida, la
re-auditoría de ronda 2 y el sprint de cierre. La comparación está en la sección Q.

## D. Frontera congelada

Las ocho familias, tal como el sprint las declara finales:

```text
CONSTANT · NORMALIZED · VISIBLE_COPY · TARGET_RELATIVE
RESOURCE_RELATIVE · FIXED_PRIORITY · SIMPLE_GREEDY · DOMAIN_NAIVE
```

**No se agregó una novena familia.** Todo lo medido acá cae dentro de las ocho.

Guardarraíl aplicado sin modificarlo: una política bloquea si
`media ≥ 85` **o** `óptima ≥ 80 %` **y** además **desvía materialmente el
constructo**. En `media 70–84,99` u `óptima 50–79 %` se hace análisis de
constructo y no bloquea si la política **es** razonamiento matemático buscado.

## E. `y3.course-project-tech`

### E.1 Matemática re-derivada

Las 25 variantes, con su recurso que aprieta, sus tres tasas por pieza, su piso
de feria y su techo:

- `lo prometido = techo − 1` en **25 de 25** variantes. La relación que el sprint
  declara se cumple exactamente.
- Los tres recursos son reales y encadenados: el tope efectivo de MB es
  `min(pendrive, subida × minutos de laboratorio)`.
- Planes válidos por variante: 34 a 201. Vectores óptimos por variante: 5 a 23.

### E.2 Matriz de políticas, instrumento corregido

25 variantes, 2 912 políticas puntuadas en todas ellas.

| Familia | Mejor política | Media | Óptima |
|---|---|---|---|
| `CONSTANT` | `(3,2,4)` — enumeración entera de los 1 573 vectores | **56,60** | 4,0 % |
| `NORMALIZED` | un cuarto del máximo | 41,40 | 0,0 % |
| `VISIBLE_COPY` | copiar la fila «pide la feria» | 40,00 | 0,0 % |
| `TARGET_RELATIVE` | la fila de cada ítem, por el doble | 47,00 | 4,0 % |
| `RESOURCE_RELATIVE` | fracciones de una capacidad impresa | 25,60 | 0,0 % |
| `FIXED_PRIORITY` | llenar `2>1>3` desde el piso, sin pasarse de los tres topes | **79,40** | 40,0 % |
| `SIMPLE_GREEDY` | por menor «pide la feria», desde el piso | **81,80** | 44,0 % |
| `DOMAIN_NAIVE` | sólo un ítem, hasta donde entre | 63,80 | 28,0 % |

`S` máxima entre constantes: 16,0 % en `(2,8,2)`.

### E.3 Ataques de regresión pedidos

```text
copiar lo prometido en cada casilla      10,00 ·  0 %   (inválido en toda variante)
copiar la fila «pide la feria»           40,00 ·  0 %   nunca supera `functional`
copiar los máximos                       10,00 ·  0 %
la fila de cada ítem ×2                  47,00 ·  4 %
la fila de cada ítem +1 / ×1½            42,80 ·  0 %
«prometió» repartido en tres             58,80 ·  8 %
(«prometió» − 1) en tres                 57,60 ·  0 %
25/50/75/100 % de cada máximo            ≤ 41,40 · 0 %
mejor salida por minuto de notebook      72,60 · 24 %
mejor salida por MB                      59,20 ·  4 %
mejor salida por minuto de laboratorio   59,20 ·  4 %
prioridades fijas de ítem (las seis)     77,00–79,40 · 36–44 %
```

### E.4 Escalera de exposición y análisis de constructo

```text
al azar sobre las 39 325 respuestas          13,04
cualquier plan VÁLIDO (2 401 planes)         59,74 · óptimo en 12,1 %
la mejor política de atajo                   81,80 · óptima en 44,0 %
razonamiento buscado                         99,00 · óptima en 96,0 %
```

El razonamiento buscado —cubrir el piso de la feria, probar los seis órdenes de
prioridad respetando los tres topes y quedarse con el mejor— alcanza `optimal` en
**24 de 25** y `efficient` en la restante. La afirmación E.4 del sprint se
reprodujo exacta.

**Conclusión.** La mejor política de atajo cae en la franja `70–84,99` y exige el
análisis de constructo. La política hace la aritmética completa: lee las tres
capacidades, las dos tasas por pieza de cada ítem, **convierte el rato de
laboratorio en un tope de MB** —la dependencia encadenada que el Repaso
`y3.rate-capacity-review` repara— y comprueba la factibilidad pieza por pieza. Lo
único que no hace es comparar varios órdenes y quedarse con el mejor, que es
exactamente el paso de optimización que separa `efficient` de `optimal` en la
escalera del año. **No es un bypass del constructo: es el constructo sin su
último paso**, y la escalera ya lo cobra —11 de 25 variantes quedan en
`efficient`—. **NO BLOQUEA.**

`RS-RA-002` re-verificado de forma independiente: `K 56,60 ≤ 65`, `S 16,0 % ≤ 35 %`,
**183** vectores distintos son óptimos en alguna variante (≥ 5). **PASS.**

## F. `y4.course-project-fundraiser`

### F.1 Economía re-derivada

Las 25 variantes, calculadas desde la pantalla:

- **5** multisets `(margen, minutos)` distintos en el catálogo publicado
  —`RS-CLO-002` pide ≥ 5, y se cumple—. El informe del sprint dice 6; ver
  MAT-FC-004.
- **25 firmas de orden distintas** sobre los cinco criterios
  (margen/minuto, margen, minutos, precio, costo).
- La diversidad es **matemática, no una permutación de etiquetas**: el orden por
  margen por minuto coincide con el de menos minutos en 6/25, con el de menor
  costo en 6/25, con el de mayor precio en 3/25 y con el de precio por minuto en
  4/25. En **ninguna** variante coincide con el orden por margen por bandeja.
- Punto de equilibrio: 2 a 4 bandejas. Techo de beneficio: 13 000 a 21 000.

### F.2 Matriz de políticas, instrumento corregido

409 políticas puntuadas en las 25 variantes.

| Política | Familia | Media | Óptima | Clasificación |
|---|---|---|---|---|
| margen por minuto de cocina | `SIMPLE_GREEDY` | **100,00** | 100,0 % | **ACCEPTED STRATEGY — NON-BLOCKING** (F.3) |
| razón precio/costo (markup) | `SIMPLE_GREEDY` | 83,00 | 60,0 % | franja de análisis (F.4) |
| menos minutos primero | `SIMPLE_GREEDY` | **81,80** | 44,0 % | bajo techo (F.5) |
| menor costo primero | `SIMPLE_GREEDY` | 77,40 | 48,0 % | bajo techo |
| prioridades fijas de bandeja | `FIXED_PRIORITY` | 73,40 | 48,0 % | bajo techo |
| precio por minuto (el señuelo) | `SIMPLE_GREEDY` | 72,80 | 40,0 % | bajo techo |
| repartos fijos de la cocina | `RESOURCE_RELATIVE` | 48,80 | 0,0 % | bajo techo |
| fracciones del máximo | `NORMALIZED` | 39,60 | 0,0 % | bajo techo |
| constante enumerada `(2,2,2)` | `CONSTANT` | **57,80** | — | `RS-RA-003` |

`S` máxima entre las 630 constantes: **20,0 %** en `(0,0,7)`.

### F.3 Adjudicación del margen por minuto de cocina

Se adjudicó de forma independiente, contra las tres preguntas del encargo.

1. **¿Exige leer y calcular margen y tiempo?** Sí. Exige restar
   `precio − costo` por bandeja —la resta que `y4.margin-review` existe para
   reparar—, dividir por los minutos de cocina, ordenar y llenar. Son tres pasos
   de economía de 4.º, no un tecleo.
2. **¿Es parte de la economía buscada?** Sí. La ficha del año lo declara `LOCKED`
   y los gates lo protegen por los dos lados: el mejor margen **por bandeja**
   nunca puede ser el mejor por minuto, y repartir la cocina en partes iguales no
   puede alcanzar el objetivo con colchón.
3. **¿Desvía el costo fijo, el objetivo o la reserva?** No, y la razón es
   matemática: `beneficio = Σ margen − costo fijo`, así que el costo fijo es una
   **constante aditiva** y no mueve el argmax. El objetivo y la reserva definen
   los niveles de la escalera, no la decisión. «Ignorarlos» no es saltearse una
   restricción: es que la respuesta correcta a «maximizá lo que queda» no depende
   de ellos.

No es una fuga, es la cuenta del año. Queda declarado por nombre exacto en
`INTENDED_REASONING`, con una sola entrada y sin relajar ningún techo para el
resto de las políticas de la Template.

```text
ACCEPTED STRATEGY — NON-BLOCKING
```

### F.4 La franja de 83,00 · 60 %

Cuatro nombres para el mismo orden: la razón entre el precio y el costo de cada
bandeja, o equivalentemente el margen sobre el costo. Media 83,00 —bajo el techo
de 85— y óptima 60 %, dentro de la franja `50–79 %` que pide análisis.

Exige la resta `precio − costo` y una división: **es** la mitad económica del
constructo, aplicada al denominador equivocado —la plata en lugar de la capacidad
compartida—. Falla en 10 de 25 variantes y nunca cae en `invalid`. Es una
aplicación incompleta del razonamiento buscado, no un rodeo. **NO BLOQUEA.**

### F.5 «Menos minutos primero»

```text
ronda 2   100,00 · 100,0 %
cierre     81,80 ·  44,0 %
```

Ya **no** es sistémicamente óptima, y la cifra reproduce exacta la del sprint.
`RS-RA-003` re-verificado: `K 57,80 ≤ 65`, `S 20,0 % ≤ 35 %`, **67** vectores
distintos óptimos (≥ 5). **PASS.**

## G. Excepción `y1.mobile-data` — decisión final

Medida independiente: la mejor política reusable rinde **86,00 · 44,0 %**, que
reproduce exacta la cifra declarada y respeta el techo propio de la excepción
(`media < 87`, `óptima < 50 %`).

1. **¿Qué política exactamente?** Llenar el plan respetando «Datos disponibles»,
   empezando por el material del curso y siguiendo en el orden de la pantalla,
   hasta que la capacidad tope.
2. **¿Qué familia?** `FIXED_PRIORITY`, empatada con varias `SIMPLE_GREEDY` que
   aterrizan en la misma respuesta.
3. **¿Qué información pública usa?** La capacidad en MB, los días de clase y el
   consumo por uso de cada ítem. Todo impreso.
4. **¿Desvía el constructo?** No. Hace la relación consumo/capacidad, que **es**
   lo que la banda CORE enseña. Lo que no hace es resolver el **pedido** que
   separa `optimal` de `efficient` —y el pedido viaja en el objetivo narrado, no
   en la presentación—: falla en 14 de 25 variantes.
5. **¿De dónde sale la media alta?** De la **geometría de la escalera más un piso
   estructural de planes válidos**, no de un atajo. La escalera da `efficient`
   (75) a toda producción que cubra los días, entre en la capacidad y use algo
   opcional.
6. **¿Exige matemática por variante?** Sí: la capacidad y las tasas cambian, y
   sin hacer la cuenta el plan se pasa y cae en `invalid` (10).
7. **Las cuatro líneas de base, medidas sobre el catálogo publicado:**

```text
al azar sobre las 52 650 respuestas            10,85
al azar entre los 8 125 planes que cubren       15,48
cualquier plan VÁLIDO (630 planes)              80,71 · óptimo en 28,4 %
la política de orden fijo                       86,00 · óptima en 44,0 %
razonamiento buscado (leer y cumplir el pedido) 100,00 · óptima en 100,0 %
```

La política está **5,29 puntos** por encima de «producir cualquier plan válido» y
**14 puntos** por debajo del razonamiento buscado. El piso de 78–80 se gana
haciendo la cuenta, no salteándola.

```text
ACCEPTED — LEGITIMATE/STRUCTURAL — NON-BLOCKING
```

## H. `g7.group-tasks` y `y5.final-trip-or-event`

### H.1 `g7.group-tasks`

Enumeración independiente de las 256 asignaciones × 6 equipos.

```text
mejor constante          K 45,00 · S 33,3 %   (patrón `4123`)   — reproduce el sprint
cíclicas y posicionales  ≤ 45,00 · ≤ 33,3 %
todos a la misma tarea   10,00 · 0 %
```

La constante `2-3-4-1` que MAT-RA2-004 denunciaba ya **no** domina: los patrones
óptimos del catálogo son `4123` (dos equipos), `1423`, `3412`/`2413`, `2134` y
`1342`. La asignación sigue midiendo capacidad y afinidad: el evaluador exige que
cada persona tenga horas para su tarea y compara la suma de estrellas contra el
máximo factible. La evidencia de Equipo sigue separada (`efficiency` = afinidad,
`precision` = factibilidad).

Pero dos políticas de atributo **no medidas por la auditoría permanente** rinden
por encima del guardarraíl automático:

```text
más horas → tarea más pesada     [SIMPLE_GREEDY]  90,00 · 83,3 %   (5/6 óptimas, 1 functional)
cada quien su tarea de más ★     [SIMPLE_GREEDY]  85,00 · 83,3 %   (5/6 óptimas, 1 invalid)
```

Análisis de constructo, con la línea de base estructural:

```text
al azar sobre las 256 respuestas          10,47 · óptima  0,5 %
al azar sobre las 24 permutaciones        15,00 · óptima  4,9 %
al azar entre permutaciones FACTIBLES     82,00 · óptima 70,0 %   (10 planes en 6 equipos)
razonamiento buscado                     100,00 · óptima 100,0 %
```

La causa es estructural: de las 24 permutaciones, sólo **1 o 2 son factibles** en
cada equipo (2, 2, 2, 2, 1, 1), y en dos equipos la única factible es
necesariamente la óptima. Una vez filtrado por horas casi no queda optimización
que hacer.

- «Más horas → tarea más pesada» **hace** la mitad que discrimina —el filtro de
  capacidad— y queda 8,00 puntos sobre el piso de «acertar cualquier
  permutación factible». No desvía el constructo: lo ejerce.
- «Cada quien su tarea de más estrellas» sí se saltea el filtro de horas, pero
  queda **3,00 puntos** sobre ese mismo piso y cae en `invalid` (10) en cuanto
  diverge —que es lo que pasa en `equipo-d`, el equipo que el sprint agregó
  justamente para eso—.

**Ninguna de las dos desvía materialmente un constructo que, tal como está
publicado, casi no tiene espacio que desviar.** No bloquean. La causa raíz queda
como MAT-FC-003 y la ceguera del instrumento como MAT-FC-002.

`g7.group-tasks` sigue sin recorrido E2E propio. La forma de pantalla no cambió
—cuatro personas, cuatro tareas, el mismo tablero— y el motor se ejerce en el E2E
de carrera completa y en el de 7.º. Cobertura suficiente, no específica.

### H.2 `y5.final-trip-or-event`

Enumeración independiente de las 4 opciones × 25 variantes.

```text
mejor constante                 K 59,40 · S 28,0 %   (`ciudad`)
elegir el paquete con más lugares  66,00 · 24,0 %   — era 100,00 · 100 %
la opción más cara                 75,00 ·  0,0 %   — `efficient` en las 25, nunca óptima
el menor número de días            57,80 · 28,0 %
la primera / la última opción      52,00 / 55,40 · 20,0 / 28,0 %
```

Los lugares ya **no** delatan la respuesta: pasaron de depender del papel del
paquete a depender de la posición, que rota contra el papel. «Más lugares» cae de
100,00 a 66,00. `RS-CLO-003` **PASS**.

## I. Validación de la auditoría permanente

### I.1 Matriz de capacidad

42 filas, todas con modo y razón escrita; 0 bloqueadas, 0 sin soporte.
24 `AUDITED_EXHAUSTIVELY`, 18 `AUDITED_BY_POLICIES`. Ninguna fila queda «cubierta»
sin políticas ni enumeración. Verificado contra mi clasificación esperada por
motor: coincide en las 42.

Constantes re-enumeradas de forma independiente y **coincidentes al centésimo**:

| Template | K medida | S medida | Contrato |
|---|---|---|---|
| `y5.stage-screen` | 78,00 | 40,0 % | `RS-MAT-008` |
| `g7.bus-timing` | 84,62 | 57,7 % | riesgo aceptado H-6 |
| `g7.mural-paint` | 67,69 | 53,8 % | `RS-MAT-006` (K ≤ 73) |
| `y3.transport-pass` | 64,20 | 28,0 % | `RS-MAT-001` |
| `y5.final-trip-or-event` | 59,40 | 28,0 % | bajo techo |
| `g7.notebook-offer` | 58,46 | 53,8 % | franja de inspección |
| `y4.course-project-fundraiser` | 57,80 | 20,0 % | `RS-RA-003` |
| `y3.course-project-tech` | 56,60 | 16,0 % | `RS-RA-002` |
| `g7.group-tasks` | 45,00 | 33,3 % | MAT-RA2-004 |

### I.2 Fuga de oráculo

**No hay.** Los tres módulos de política —`blind-strategy-reading.ts`,
`blind-strategy-policies.ts`, `blind-strategy-space.ts`— importan únicamente
tipos de `@/game` y entre sí, y **no contienen una sola referencia** a `params`,
a un solucionador, a una respuesta esperada, a `.evaluate(` ni a ningún
`templateId`. El orquestador construye la respuesta primero y la evalúa después:
no existe realimentación de la calidad hacia la elección.

Determinismo: cinco corridas consecutivas producen las mismas 42 filas.

### I.3 Detección de la clase histórica

La auditoría actual **sí** detecta y nombra las clases viejas:

```text
y3 · «copiar el número de la fila de cada ítem»          [VISIBLE_COPY]   40,00 · 0 %
y4 · «llenar «Cocina» por menor min»                     [SIMPLE_GREEDY]  81,80 · 44 %
y4 · «llenar «Cocina» por mayor $ #2 − #1 por min»       [SIMPLE_GREEDY] 100,00 · 100 %
g7.group-tasks · constantes enumeradas enteras           [CONSTANT]       45,00 · 33,3 %
```

Ninguna de esas políticas está escrita contra una Template: todas salen del
parser genérico de la presentación.

### I.4 Dónde el instrumento falla

Dos defectos reales, documentados como MAT-FC-001 y MAT-FC-002 en la sección P.
El resumen: el instrumento es **conservador por debajo** —subestima, nunca
sobreestima—, así que un PASS suyo no prueba tanto como parece, pero tampoco
esconde un aprobado falso en el sentido contrario.

## J. Regresión de contratos históricos

| Contrato | Evidencia independiente | Resultado |
|---|---|---|
| `RS-MAT-001` `y3.transport-pass` | K 64,20 · S 28,0 % · enumeración propia de las 4 opciones × 25 | PASS |
| `RS-MAT-002/003/004` `y2.course-project-survey` | K 52,80 ≤ 60 · S 32,0 % ≤ 35 % (fila de la auditoría, motor `classification` enumerado entero) | PASS |
| `RS-MAT-005` `y2.standings-claim` | K 56,60 ≤ 65 · S 20,0 % ≤ 35 % | PASS |
| `RS-MAT-006` `g7.mural-paint` | K 67,69 ≤ 73 · enumeración propia · balance 2 L / 4 L | PASS |
| `RS-MAT-007` `y4.represent-class` | «todo No entra» 40,00 · nunca llega a `efficient` | PASS |
| `RS-MAT-008` `y5.stage-screen` | **K 78,00 · S 40,0 %** · numerador 1950/25 · sección L | PASS · **sin deriva** |
| `RS-MAT-009` `y5.next-step-options` | K 40,00 ≤ 65 · S 16,0 % ≤ 35 % | PASS |
| `RS-MAT-011` `y4.course-project-fundraiser` | consigna, punto de equilibrio (2–4 bandejas), reserva y supuesto de venta total re-derivados desde la pantalla | PASS |
| `RS-NEW-001` `y5.course-project-final` | K 56,80 ≤ 65 · S 28,0 % ≤ 35 % | PASS |
| `RS-NEW-002` `g7.notebook-offer` | comparación verdadera en pesos · enumeración propia de las 2 × 26 | PASS |
| `RS-NEW-003` Repasos direccionales | barrido de feedback por condición de rama | PASS |
| `RS-NEW-006` ficha de 2.º | contraste documental: las cuatro formas del schema (`denominator`, `missing-data`, `margin`, `high-response`) y la regla de publicación coinciden con la ficha | PASS (documental) |
| `RS-RA-AUDIT-001` | 42 filas con categoría y razón · 0 sin soporte · **sin fuga de oráculo** (I.2) | PASS |
| `RS-RA-001` `g7.bus-travel-review` | **3 146 respuestas enumeradas** (26 × 121): la rama de concepción errónea aparece **exactamente** donde `respuesta === demora sola`, en las 26 variantes, y en ninguna otra | PASS |
| `RS-RA-002` `y3.course-project-tech` | K 56,60 ≤ 65 · S 16,0 % ≤ 35 % · 183 vectores óptimos distintos ≥ 5 | PASS |
| `RS-RA-003` `y4.course-project-fundraiser` | K 57,80 ≤ 65 · S 20,0 % ≤ 35 % · 67 vectores óptimos distintos ≥ 5 | PASS |
| `RS-RA-TEST-001` | 2 `pnpm verify` consecutivos en verde, sin flake | PASS |
| `RS-CLO-AUDIT-001` | taxonomía declarada por Template · ninguna fila vacía · categoría A corre constante **y** políticas | PASS con salvedad (MAT-FC-002) |
| `RS-CLO-001` | ninguna política medida por el instrumento cruza los techos salvo lo declarado | PASS · ver MAT-FC-002 para su alcance |
| `RS-CLO-002` | `y3` `VISIBLE_COPY` nunca óptima (0/25) · `y4` menos-minutos 81,80 · 44 % · **5** economías distintas (≥ 5) | PASS |
| `RS-CLO-003` | `g7.group-tasks` 6 variantes, K 45,00 · S 33,3 % · `y5.final-trip` ya no se resuelve por lugares (66,00 · 24 %) | PASS |

## K. Congelamiento de `y5.stage-screen`

La prueba **no** se reabrió. Se verificó sólo la deriva, por enumeración propia
de las 6 opciones × 25 variantes:

```text
K = 78,00   la opción «que entre entera»: efficient en 22, optimal en 3
            numerador entero 22 × 75 + 3 × 100 = 1950 · 1950 / 25 = 78,00 exacto
S = 40,0 %  «llenar el ancho y recortar mitad y mitad»: optimal en 10 de 25
N = 25 variantes publicadas
```

El alcance de la excepción del witness no cambió. **Sin deriva.**

## L. Barrido final de verdad del feedback

Se enumeró el espacio de respuesta completo de las Templates tocadas y del Repaso
que `RS-RA-001` gobierna, y se contrastó **cada texto afirmativo** contra la
condición de su rama, con aritmética independiente:

| Template | Respuestas verificadas | Afirmaciones falsas |
|---|---|---|
| `y3.course-project-tech` | 39 325 | **0** |
| `y4.course-project-fundraiser` | 15 750 | **0** |
| `g7.bus-travel-review` | 3 146 | **0** |
| **Total** | **58 221** | **0** |

Cubre los cinco hechos numéricos de `y3` (notebook, pendrive, subida, piezas,
acuerdos), los cuatro de `y4` (costo fijo, cocina, queda, objetivo), las cuatro
restricciones violadas de `y3`, las dos de `y4`, y los cuatro niveles de
consecuencia de cada una. También se comprobó que la rama de concepción errónea
del Repaso del colectivo no aparece en ninguna respuesta que no sea la demora
sola.

**Ninguna afirmación matemática materialmente falsa.**

## M. FairScore, egreso y recuperación

### M.1 FairScore recomputado fuera del scorer

Con aritmética racional exacta, desde el contrato y no desde el código:

```text
pesos          math 8500 · team 1000 · aura 500 = 10 000 bp   →  85 / 10 / 5
escalera       optimal 10000 · efficient 7500 · functional 4000 · invalid 1000
dificultad     core 10000 · standard 10800 · stretch 11500   (sólo sobre Math)
topes          math 10000 · team 10000 · aura 10000
Estilo         no es componente: no existe en el agregado
```

Perfecto = **10 000 exacto** en las 16 formas probadas (banda × cantidad de beats
× con/sin oportunidad de Equipo × con/sin oportunidad de Aura). La
renormalización de oportunidad reparte el peso de los componentes ausentes, que es
lo que hace que 8 beats sin Equipo ni Aura también den 10 000.

Casos de control recomputados a mano y coincidentes: `efficient` con Equipo y Aura
perfectos = 7 875 = 0,85 × 7 500 + 0,10 × 10 000 + 0,05 × 10 000.

### M.2 El comando canónico corrobora

`pnpm game:score`: 23 000 planes, política
`fair-score-dev-2@2.0.0-post-tg1-candidate`.

```text
perfecto        min 10000 · media 10000 · max 10000 · dispersión 0 · distintos 1
por forma       1 beat / 2 beats / 8 beats / 12 beats → 10 000 en las cuatro
con y sin oportunidad de Equipo     10 000 en los dos casos
con y sin oportunidad de Aura       10 000 en los dos casos
empates de redondeo                 0
```

### M.3 Egreso y recuperación

`pnpm game:simulate:deep`: 5 000 runs, `--verify=5`.

```text
completadas     5000 / 5000
egresadas       5000 / 5000
eventos         42 149 · 8,43 por run
recuperaciones  2 149 en total · peor caso 1 por etapa
previas         2 033
hallazgos       0
```

`maxRecoveriesPerStage = 1` respetado en las 5 000, sin recursión; los Repasos
aportan puntaje competitivo 0. La graduación no depende del desempeño: el
contrato de fail-forward se sostiene.

## N. Replay, servidor, catálogos y versiones

Sonda de manipulación propia contra `validateSubmittedRun`, con una carrera
completa jugada en óptimo (`score 13254`, `fairScore 10000`, `graduated true`):

```text
sin tocar nada                        ACEPTADA · recomputada 13254 · fair 10000
contentVersion vieja (5.4.0)          RECHAZADA unsupported-version (contentVersion)
variantCatalogVersion vieja (dev-5)   RECHAZADA unsupported-version (variantCatalogVersion)
planFingerprint forjado               RECHAZADA unsupported-version (planFingerprint)
gameVersion inexistente (99.0.0)      RECHAZADA unsupported-version (gameVersion)
version de action log 6               RECHAZADA unsupported-version (actionLogVersion)
ruleset distinto                      RECHAZADA unsupported-version (rulesetVersion)
scoreVersion inexistente              RECHAZADA unsupported-version (scoreVersion)
semilla hostil                        RECHAZADA unsupported-version (planFingerprint)
run truncada                          RECHAZADA replay-mismatch
acción inyectada en el medio          RECHAZADA invalid-command
payload malformado                    RECHAZADA invalid-command
score declarado por el cliente        IGNORADO · el servidor recompone 13254 igual
```

El log del cliente lleva **sólo** `{version, descriptor, actions}`: no existe un
campo de puntaje que un cliente pueda mandar. Inyectar `score`, `officialScore` y
`descriptor.totalScore` en 999 999 no mueve nada. La semilla hostil se rechaza
porque el servidor **recompone el plan desde la semilla** y compara la huella.

Catálogos: los seis reconstruyen con `integrity ok` y su población aprobada
coincide con el artefacto (189 / 363 / 512 / 686 / 858 / 1031). Las direcciones
semánticas son únicas —los duplicados se rechazan en la aprobación, 26 a 80 por
año—.

Diff de catálogos, con su causa aguas arriba:

| Catálogo | Causa del cambio | Población |
|---|---|---|
| `grade-7-dev-8` | cuatro equipos autorados nuevos de `g7.group-tasks` (2 → 6) | 185 → 189 |
| `grade-1-dev-4` | generador `y1.mobile-data` 1 → 2, más la identidad de 7.º | 359 → 363 |
| `grade-2-dev-5` | identidad combinada aguas arriba | 508 → 512 |
| `grade-3-dev-5` | generador `y3.course-project-tech` 2 → 3 | 682 → 686 |
| `grade-4-dev-5` | generador `y4.course-project-fundraiser` 2 → 3 | 854 → 858 |
| `grade-5-dev-6` | generador `y5.final-trip.packages` 1 → 2 | 1027 → 1031 |

El `+4` es el mismo en los seis y se explica entero: son los cuatro equipos nuevos
de 7.º propagándose por los conjuntos acumulativos. Las regeneraciones de `y1`,
`y3`, `y4` y `y5` **reemplazan** variantes, no las suman. Cada bump de generador
corresponde a un cambio real del espacio de generación, verificado en el código.
Las siete versiones históricas de 7.º siguen en disco sin editar. La deuda
`R-S09-CAT` no empeoró y no se tocó.

## O. Accesibilidad

El sprint no tocó `src/components`, `src/app` ni `src/styles` —comprobado con
`git diff`—, así que esto es regresión.

- **174 / 174** E2E en verde en las dos corridas de `pnpm verify`.
- `y3.course-project-tech` recorrida a **320 / 360 / 390 / 412 / 1280 px** con
  reflow sin desborde horizontal de página, objetivos de 44 px, navegación por
  teclado, foco movido al encabezado del feedback y axe sin violaciones; a
  1280 px además con zoom CSS 200 %.
- `y4.course-project-fundraiser` a los mismos cinco anchos, con las tres
  condiciones y el punto de equilibrio, más zoom 200 %.
- `post-g1-accessibility-audit.spec.ts` a 320 / 360 / 390 / 412 / 1280 con zoom 1 y 2.
- `g7.group-tasks` sin recorrido propio; ver H.1.

Nada impide leer ni resolver la matemática. **Sin regresión.**

## P. Hallazgos

Ninguno bloqueante. Ninguno abre otro ciclo de remediación de IA.

### MAT-FC-001 · HIGH · la auditoría subestima `y3.course-project-tech`

`resourceModels` ata un vector de costos a **cualquier** capacidad impresa cuya
unidad **se llame** igual, sin comprobar que signifique lo mismo. En
`y3.course-project-tech` la pantalla imprime dos restricciones en minutos
—«Notebook prestada · 30 minutos» y «Laboratorio · 8 minutos»— y el detalle de
cada ítem imprime «N min de notebook». El lector normaliza las dos a `min`, así
que se construye un modelo espurio «Laboratorio ≤ 8 min» contra los costos en
minutos **de notebook**, que son de otra magnitud.

Efecto: el ámbito «sin pasarse de ningún límite» queda sobre-restringido y toda
política de llenado se corta cuatro veces antes de tiempo.

```text
lo que informa la auditoría permanente   47,00 ·  4 %
lo que mide el instrumento corregido     79,40 · 40 %   (FIXED_PRIORITY desde el piso)
                                         81,80 · 44 %   (SIMPLE_GREEDY por «pide la feria»)
```

Unos 33 puntos de subestimación en una Template `anchor` puntuable. Se revisaron
las **ocho** Templates de cantidades y presupuesto: `y3.course-project-tech` es la
**única** con esta colisión de unidades. El producto aguanta la medición corregida
(sección E.4), así que no bloquea; el instrumento necesita que un modelo de
recurso se ate a la magnitud, no al nombre.

### MAT-FC-002 · HIGH · la taxonomía no está implementada en los motores de construcción

Las ocho familias son genéricas sólo para `quantity-builder`/`budget-builder`, los
motores de opción y `numeric-input`. Para `assignment-board`, `schedule-builder`,
`spatial-layout` y `number-grid` las políticas son listas **escritas a mano** de
patrones posicionales e ingenuos —«nada asignado», «todo a la primera persona»,
«cíclica», «equilibrada», «fila a fila», «lo más temprano posible»— y **ninguna**
sale de los atributos que la pantalla imprime por agente, por tarea o por celda.
Sólo `route-builder` lleva una `SIMPLE_GREEDY` («vecino más cercano»).

Demostrado sobre `g7.group-tasks`: dos políticas de una sola razón visible rinden
**90,00 · 83,3 %** y **85,00 · 83,3 %**, por encima de los dos umbrales
automáticos del propio sprint, y la auditoría permanente **no las ve**. `RS-CLO-001`
pasa ahí de forma vacua.

Son 13 de las 42 Templates las que corren sobre motores de construcción. El
análisis de constructo de H.1 muestra que en `g7.group-tasks` no hay bypass
material, y las otras tres de `assignment-board` informan medias muy por debajo
del techo (72,40 · 0 %, 42,40 · 36 %, 15,42 · 0 %), pero eso es una conclusión
sobre las cifras que hay, no sobre las que el instrumento no sabe producir.

### MAT-FC-003 · MEDIUM · el conjunto factible de `g7.group-tasks` es degenerado

De las 24 permutaciones, sólo **1 o 2 son factibles** en cada uno de los seis
equipos (2, 2, 2, 2, 1, 1), y en `equipo-e` y `equipo-f` la única factible es por
fuerza la óptima. Acertar cualquier permutación factible ya promedia **82,00** con
**70 %** de óptimas.

La Template declara `optimization: 2` y `selection: 2` y se describe como «el más
exigente del año… buscando el mejor, no uno que funcione», pero una vez aplicado
el filtro de horas casi no queda búsqueda. Es la causa raíz de las dos cifras de
MAT-FC-002 y la razón por la que **no** son un bypass. No es matemática
incorrecta ni feedback falso: es calibración de contenido. **Revisión humana.**

### MAT-FC-004 · LOW · tres cifras del informe del sprint no reproducen

Ninguna toca un contrato.

| Informe | Medición independiente |
|---|---|
| §F.2: «6 multisets `(margen, minutos)` distintos» | **5**. La economía `[(1200,10), (5000,20), (6000,40)]` no está representada en el catálogo publicado. `RS-CLO-002` pide ≥ 5 y se cumple |
| §I.2: «cualquier plan válido 78,63 · óptimo en 19,9 %» | **80,71 · 28,4 %** sobre los 630 planes válidos. El 19,9 % sale de dividir por 900 en vez de por 630. La corrección **refuerza** la aceptación: la política queda 5,29 puntos sobre el piso, no 7,4 |
| §H.2: «el señuelo del precio rinde 77,60 · 48 %» | precio por minuto de cocina mide **72,80 · 40 %**; menor-costo-primero mide **77,40 · 48 %** |

### MAT-FC-005 · LOW · población desbalanceada en `y3.course-project-tech`

De las 25 variantes aprobadas, **18 son `notebook-corta`**, 4 `pendrive-corto` y 3
`laboratorio-corto`. El gate de dirección exige que cada dirección juegue su papel
y lo cumple, pero el filtro de aprobación deja los tres papeles muy desparejos.

Es determinista y canónico —no es un problema de integridad de catálogo—, y es
parte de por qué un solo orden de prioridad fijo llega a 40–44 % de óptimas: con
la notebook apretando en 18 de 25, «lo barato en minutos primero» acierta seguido.
**Backlog / hardening futuro.**

### Observación · `g7.group-tasks` sin E2E propio

Anotada ya por el sprint. La forma de pantalla no cambió y el motor se ejerce en
el E2E de carrera completa y el de 7.º. Cobertura suficiente, no específica.

## Q. Comparación con el informe del sprint

Sólo después de la derivación independiente.

**Coincide exacto:**

```text
y3.course-project-tech   K 56,60 · S 16,0 %              ✓
y4.course-project-fundraiser K 57,80 · S 20,0 %          ✓
y4 · menos minutos primero  81,80 · 44,0 %               ✓
y4 · margen/minuto         100,00 · 100,0 %              ✓
y1.mobile-data              86,00 · 44,0 %               ✓
g7.group-tasks           K 45,00 · S 33,3 %              ✓
y5.final-trip-or-event   K 59,40 · S 28,0 % · lugares 66,00 · 24,0 %  ✓
y5.stage-screen          K 78,00 · S 40,0 % · numerador 1950/25       ✓
g7.bus-timing            K 84,62 · S 57,7 %              ✓
g7.mural-paint           K 67,69 · S 53,8 %              ✓
y3.transport-pass        K 64,20 · S 28,0 %              ✓
razonamiento buscado de y3: optimal en 24/25             ✓
cobertura 42 filas · 24 exhaustivas · 18 por políticas   ✓
motor 10.0.0 · action log 7 · snapshot 8 · FairScore     ✓
96 archivos · 1898 Vitest · 174 E2E                      ✓
perfecto = 10 000 exacto · 5000/5000 egresadas           ✓
RS-RA-001 · 26 × 121 = 3146 respuestas                   ✓
```

**No coincide:**

```text
y3 · mejor política de atajo    informa 47,00 · 4 %   mide 81,80 · 44 %   → MAT-FC-001
y4 · economías distintas        informa 6             mide 5              → MAT-FC-004
y1 · piso de planes válidos     informa 78,63 · 19,9 %  mide 80,71 · 28,4 % → MAT-FC-004
y4 · señuelo del precio         informa 77,60 · 48 %  mide 72,80 · 40 %   → MAT-FC-004
g7.group-tasks · mejor política informa 10,00 · 0 %   mide 90,00 · 83,3 % → MAT-FC-002
```

Las cinco diferencias apuntan al mismo sitio: el instrumento, no el producto. Las
dos primeras filas de la lista son subestimaciones; ninguna es una sobreestimación
que hubiera escondido un aprobado falso.

## R. Rendimiento

Cinco corridas de `pnpm game:blind-audit -- --timing`, Node 24.19.0:

```text
1152,3 · 1157,7 · 1167,3 · 1171,0 · 1184,6 ms

min 1152,3   mediana 1167,3   max 1184,6   rango 32,3 ms
```

Contra la mediana de 1191,8 ms del sprint: deriva benigna de −24 ms, dentro del
ruido. Determinista —las 42 filas y sus cifras son idénticas en las cinco—.
Practicable en CI.

## S. Verificación

| Comando | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS · Node 24.19.0 · pnpm 11.22.0 |
| `pnpm verify` × 2 | **PASS · PASS** · 96 archivos · 1898 Vitest · 174 E2E en las dos · **sin flake** |
| `pnpm game:validate-content` | PASS · 8 challenges · 10 storylets · 200 semillas · 0 errores · 0 warnings |
| `pnpm game:variants check` y `--content=grade-1…5` | PASS · `integrity ok` en los seis · poblaciones 189/363/512/686/858/1031 |
| `pnpm game:blind-audit -- --coverage --keys` | 42 filas · 24 exhaustivas · 18 por políticas · 0 bloqueadas |
| `pnpm game:blind-audit -- --timing` × 5 | 1152,3–1184,6 ms · mediana 1167,3 ms |
| `pnpm game:simulate:deep` | 5000/5000 completadas y egresadas · 0 hallazgos · peor caso 1 recuperación |
| `pnpm game:score` | 23 000 planes · perfecto 10 000 exacto · dispersión 0 · 0 empates |
| `pnpm test:e2e:only` | 174 passed (dentro de cada verify) |
| `node scripts/validate-agent-workspace.mjs` | PASS · 6 skills · 244 archivos documentados |
| `node scripts/sync-master-spec.mjs --check` | PASS · 124 fuentes autoritativas |
| `git diff --check` | limpio |

Ningún gate se re-corrió para esconder una falla. Las dos corridas de `verify`
dieron el mismo resultado a la primera.

## T. Limitaciones

Lo que esta auditoría **no** cierra, y a dónde va:

1. **Los motores de construcción quedaron auditados por debajo.** MAT-FC-002. Mi
   propio ataque por atributos cubrió `assignment-board` con una codificación
   una-persona-una-tarea, que sirve para `g7.group-tasks` pero **no** representa
   el espacio real de `y1.course-project-expo`, `y2.intercurso-plan` ni
   `y4.shift-coverage` —tienen más tareas que agentes, tareas opcionales y
   asignación múltiple—. Sus cifras informadas están lejos del techo, pero no las
   re-derivé con una codificación correcta. `spatial-layout`, `schedule-builder` y
   `number-grid` tampoco se atacaron por atributos. **Hardening futuro.**
2. **Validez curricular y pedagógica.** Si las Templates enseñan lo que dicen
   enseñar, al nivel declarado, es una pregunta humana. **Revisión humana.**
3. **Pacing empírico.** Cuánto tarda una persona real, y si la franja
   `efficient` se siente justa, no se puede medir acá. **Jugadores reales.**
4. **La calibración de `g7.group-tasks`.** MAT-FC-003: el conjunto factible
   degenerado es una decisión de contenido, no un defecto de motor. **Revisión
   humana.**
5. **Franjas de inspección heredadas.** `y1.classroom-layout` (64,00 · 60 %),
   `g7.notebook-offer` (58,46 · 53,8 %), `g7.bus-timing` (H-6, 84,62 · 57,7 %) y
   `y1.scale-fit-review` (H-7) siguen documentados y sin deriva. **Sin reabrir.**
6. **Verosimilitud narrativa** (H-8 / H-9) y la retención histórica de catálogos
   (`R-S09-CAT`, STAGE-09). **Sin tocar.**

## U. Recomendación de gate

Ninguna Template puntuable admite hoy una política reutilizable de baja
complejidad que cruce el guardarraíl **y** desvíe materialmente el constructo. No
hay matemática incorrecta, feedback falso, falla de FairScore, de replay, de
servidor ni de integridad de catálogo. Ningún contrato `LOCKED` se violó.

```text
AI MATHEMATICS DEPARTMENT PROVISIONAL SIGN-OFF — READY
```

Con una recomendación explícita para quien ejecute ese sign-off: **MAT-FC-001 y
MAT-FC-002 deberían cerrarse antes de que la auditoría permanente se siga usando
como reja de regresión desatendida.** No bloquean este gate —el producto aguanta
la medición corregida—, pero el instrumento mide menos de lo que su informe dice
medir, y un PASS futuro suyo valdrá lo que valga su cobertura.

Esta auditoría **no** ejecutó el sign-off provisional, **no** ejecutó la revisión
humana, **no** marcó STAGE-08 como `DONE`, **no** remedió producto y **no** amplió
la taxonomía.

## Estado canónico resultante

```text
STAGE-08 — IN_PROGRESS

Round-1 Mathematics Remediation           — DONE
Independent Mathematics Re-Audit Round 1  — FAILED
Post-Re-Audit Findings Adjudication       — DONE
Targeted Mathematics Remediation Round 2  — DONE
Independent Mathematics Re-Audit Round 2  — FAILED
STAGE-08 Mathematics Final Closure Sprint — DONE
Final Mathematics Closure Audit           — PASSED

AI Mathematics Department Provisional Sign-Off — NEXT
Human Mathematics Department Review            — DEFERRED
Real-player pacing validation                  — PENDING
```
