# Sprint de cierre matemático de STAGE-08

- **Estado:** `EXECUTED` — 2026-09-19, sobre `main` en `a065023`
- **Gate:** `STAGE-08 MATHEMATICS FINAL CLOSURE SPRINT`
- **Rol:** equipo de implementación multidisciplinario, con autoridad para decidir
  matemática de implementación y sin autoridad para reabrir decisiones LOCKED
- **Entrada:** la [re-auditoría de ronda 2](independent-mathematics-reaudit-round-2.md)
  y sus cinco hallazgos `MAT-RA2`
- **Salida:** el gate siguiente es `FINAL MATHEMATICS CLOSURE AUDIT`, de sólo lectura

## A. Veredicto

```text
STAGE-08 MATHEMATICS FINAL CLOSURE SPRINT — DONE
```

La ronda 2 eliminó un **vector**. Este sprint elimina la **clase**: una familia
finita de ocho políticas reutilizables de baja complejidad, implementada una vez,
genérica sobre la presentación y corrida sobre las 42 Templates del catálogo.

| Template | Atajo que la ronda 2 dejó vivo | Antes | Ahora | Mejor atajo que queda |
|---|---|---|---|---|
| `y3.course-project-tech` | copiar el número «prometió» de la pantalla | K 100,00 · S 100 % | **47,00 · 4 %** | «el número de la fila de cada ítem, por el doble» |
| `y4.course-project-fundraiser` | llenar la cocina por la bandeja de menos minutos | K 100,00 · S 100 % | **81,80 · 44 %** | esa misma política, ya sin dominar |

Y tres atajos más que **no** estaban en el encargo y que la auditoría ampliada
hizo visibles dentro del sprint:

| Template | Atajo hallado durante el sprint | Antes | Ahora |
|---|---|---|---|
| `y5.final-trip-or-event` | elegir el paquete con más lugares | 100,00 · 100 % | **66,00 · 24 %** |
| `g7.group-tasks` | el reparto constante `2-3-4-1` | K 100,00 · S 100 % | **K 45,00 · S 33,3 %** |
| `y1.mobile-data` | llenar el plan de datos en un orden fijo | 89,00 · 56 % | **86,00 · 44 %** · aceptado con razón |

Ninguna Template puntuable admite hoy una política reutilizable de baja
complejidad con media ≥ 85 o `optimal` ≥ 80 %, con **una** excepción declarada y
acotada —`y1.mobile-data`— y **una** aceptación explícita —el margen de
contribución por minuto de cocina de `y4.course-project-fundraiser`, que **es** el
constructo del año—. Las dos están en la sección I con su razón escrita.

## B. Baseline

Medida antes de tocar nada.

| Dato | Valor al empezar | Valor al terminar |
|---|---|---|
| Rama · HEAD | `main` · `a065023` · worktree limpio | `main` · worktree limpio |
| Node · pnpm | 24.19.0 · 11.22.0 | sin cambios |
| Motor · action log · snapshot | `10.0.0` · `7` · `8` | **sin cambios** |
| Score | `fair-score-dev-2@2.0.0-post-tg1-candidate` | **sin cambios** |
| Rulesets | 7.º `0.4.0`, 1.º–5.º `x.2.0`/`x.3.0`, carrera `1.0.0-full-career` | **sin cambios** |
| Templates | 42 | 42 |
| Tests | 96 archivos · 1883 Vitest · 174 E2E | 96 archivos · **1898** Vitest · **174** E2E |
| Auditoría permanente | 42 filas · ~950 ms | 42 filas · **1155–1306 ms** |

Reproducción de los bloqueantes desde `a065023`, contra el evaluador real y
leyendo sólo la presentación renderizada:

```text
y3.course-project-tech        copiar el 2.º número de «pide / prometió»   100,00 · 100 %  (o25 e0 f0 i0)
y4.course-project-fundraiser  llenar la cocina por menos minutos          100,00 · 100 %  (o25 e0 f0 i0)
y4.course-project-fundraiser  greedy por margen/minuto (el correcto)      100,00 · 100 %
y4.course-project-fundraiser  por más minutos == por mayor margen/bandeja  61,60 ·   8 %
```

Las dos cifras del encargo se reprodujeron **exactas**. La tercera línea
confirma la causa que la re-auditoría señaló: el orden por minutos y el orden por
margen por minuto eran el mismo orden.

## C. Decisiones congeladas

No se reabrieron, no se re-adjudicaron y se comprobaron en regresión:

```text
RS-MAT-008 · y5.stage-screen K = 78 al tamaño publicado   K 78,00 · S 40,0 % — idéntico
OQ-66 · OQ-67                                             cerradas, sin tocar
FairScore 85 / 10 / 5                                     sin cambios
escalera 100 / 75 / 40 / 10                               sin cambios
arquitectura de recuperación · egreso garantizado         sin cambios
Estilo no competitivo · Equipo y Aura separados           sin cambios
recomputación en servidor · replay fail-closed            sin cambios
motor · action log · snapshot · rulesets                  sin cambios
```

`git diff` sobre `src/game`, `src/server`, `src/app`, `src/components` y
`src/styles` está **vacío**: el sprint no tocó motor, servidor, UI ni sistema de
diseño. Lo que cambió es contenido, catálogos y la auditoría permanente.

## D. Disposición de los hallazgos MAT-RA2

| ID | Severidad de origen | Disposición en este sprint | Evidencia |
|---|---|---|---|
| **MAT-RA2-001** | BLOCKER | **CERRADO.** Rediseño matemático de `y3.course-project-tech`: lo prometido pasa de vector por ítem a **total**, y los presupuestos dejan de derivarse del costo de ninguna respuesta | E |
| **MAT-RA2-002** | BLOCKER | **CERRADO.** Rediseño económico de `y4.course-project-fundraiser`: seis economías reales, objetivo calibrado contra el techo real de la cocina y gate de reparto ciego | F |
| **MAT-RA2-003** | HIGH | **CERRADO.** Taxonomía finita de ocho familias, genérica sobre la presentación, corrida en las 42 Templates | G |
| **MAT-RA2-004** | MEDIUM | **CERRADO, reclasificado a bloqueante.** Es, por la letra del guardarraíl, un bypass puntuable de baja complejidad: `K 100 · S 100 %` sobre una Template `anchor`. Cuatro equipos autorados nuevos | H.4 |
| **MAT-RA2-005** | LOW | **CERRADO como causa raíz, no como observación.** El catálogo congelaba ejes por el paso de recorrido; se corrigió en `y4` y en `y1.mobile-data`, donde producía el mismo efecto | F, H.5 |

MAT-RA2-004 se reclasificó hacia arriba, no hacia abajo. La re-auditoría lo
registró como MEDIUM porque con `N = 2` la métrica es poco informativa; el
criterio de este sprint —media ≥ 85 **y** bypass material del constructo— lo
alcanza igual: repetir un patrón posicional sin leer las horas de nadie rendía el
máximo en las dos variantes publicadas, y las horas **son** la restricción del
beat. Se arregló.

## E. MAT-RA2-001 · `y3.course-project-tech`

### E.1 El atajo, y por qué era estructural

La ronda 2 ató los tres presupuestos al costo del plan objetivo con holgura no
negativa por construcción, y `minimum ≤ target` siempre. El vector `target` era
entonces admisible y cumplía los tres objetivos **en toda variante que el
generador pudiera emitir**. La respuesta estaba impresa en la consigna.

### E.2 La regla de producto

> Un dato visible puede ser insumo o restricción. No puede ser, por
> construcción, la respuesta óptima.

No se escondió nada. Lo que cambió es la **relación matemática**.

### E.3 El rediseño

| Antes | Ahora |
|---|---|
| La pantalla imprime `pide / prometió` por ítem | Imprime el **mínimo** por ítem y **un total prometido** |
| Las tasas —minutos de notebook, MB— son constantes del módulo | Son **parámetro de la variante**, repartidas por papel |
| `optimal` = cumplir los tres objetivos por ítem | `optimal` = llegar a las piezas prometidas en total |
| Los presupuestos se derivan del costo del objetivo | Salen de listas fijas; **lo prometido se deriva de ellos** |
| El cuello de botella rota entre tres formas | Idem, y ahora se **comprueba**: aflojar ese recurso, y sólo ése, sube el techo |

Lo prometido es `techo − 1`, donde el techo es cuántas piezas entran como máximo
respetando los tres recursos y los mínimos de la feria. El `−1` es deliberado:
prometer el máximo entero exacto convertiría el beat en «resolvé un programa
entero», por encima del perfil cognitivo declarado —dos pasos, una
optimización—. Con un punto de aire, el reparto bien pensado llega y el apurado
queda en `efficient`.

Las tres tasas de cada variante son **incomparables**: ninguna cosa gasta menos
que otra en las dos cosas a la vez, así que cuál conviene depende de qué recurso
aprieta acá. Eso es lo que impide que un orden de prioridad fijo resuelva el
catálogo, y es exactamente lo que el Repaso `y3.rate-capacity-review` repara.

### E.4 Validez: el constructo sigue siendo alcanzable

Probar «arreglado» sin probar «jugable» sería cambiar un defecto por otro. El
razonamiento buscado —cubrir el mínimo de la feria y después probar unos pocos
órdenes de prioridad razonables, respetando los tres topes— alcanza `optimal` en
**24 de 25** variantes y `efficient` en la restante. El constructo se resuelve con
matemática de 3.º.

### E.5 Resultado final

```text
K = 56,60   (techo RS-RA-002: 65)          S = 16,0 %  (techo: 35 %)
mejor política de atajo   47,00 · óptima en 1 de 25
copiar la pantalla        40,00 · óptima en 0 de 25   — nunca supera `functional`
familias evaluadas        las ocho
```

Contratos preservados y verificados: placement `anchor`, banda STANDARD, pacing
MEDIUM, arco PROJECT, motor `quantity-builder`, Repaso `y3.rate-capacity-review`,
gates de Equipo por dueño y witness de Math óptima con Equipo máximo.

## F. MAT-RA2-002 · `y4.course-project-fundraiser`

### F.1 El atajo, y la causa que la ronda 2 no vio

`MARGINS` y `MINUTES` estaban ambas indexadas de forma **ascendente por el mismo
rango**, así que el orden ascendente por minutos era el orden descendente por
margen/minuto en las 25 variantes. Rotar qué producto ocupaba cada papel cambiaba
la etiqueta, no la economía.

Pero al medir con la auditoría ampliada apareció algo más profundo, que ni el
informe ni la re-auditoría habían visto: **repartir la cocina en tres partes
iguales, sin calcular un solo margen, rendía 98,00 · 92 %** sobre el catálogo de
la ronda 2. La causa es la calibración del objetivo. Se fijaba contra el mejor
plan que deja tres cuartos de cocina **libre**, que queda muy por debajo de lo
que rinde llenarla: el 47 % de los planes válidos era `optimal`, y cualquier
reparto ciego caía adentro por volumen.

### F.2 El rediseño

```text
1 · seis economías (margen, minutos) de verdad distintas, no una permutada
2 · el objetivo se calibra contra el techo REAL de la cocina, no contra el de cocina libre
3 · gate: repartir la cocina en partes iguales no puede alcanzar el objetivo con colchón
4 · gate: a lo sumo un quinto de las producciones válidas puede ser `optimal`
5 · gate de dirección: cada dirección juega la economía que le toca
6 · costos con rango ancho, para que el precio no sea un proxy del margen
7 · generación por papel con búsqueda de magnitudes, y paso de recorrido coprimo
```

En dos de las seis economías la bandeja más rápida **sí** es la que más deja por
minuto: negarlo en todas las variantes sería falso, y además volvería aprendible
—y por lo tanto explotable— que nunca lo sea. En las otras cuatro no lo es, y en
dos es directamente la peor.

| | ronda 2 | cierre |
|---|---|---|
| multisets `(margen, minutos)` distintos | **1** | **5** [^erratum-economias] |
| «menos minutos primero» | 100,00 · 100 % | **81,80 · 44 %** |
| «repartir la cocina en partes iguales» | 98,00 · 92 % | **0 de 25 óptimas, por gate** |
| planes válidos que son `optimal` | ~47 % | ≤ 20 %, por gate |
| K constante · S | 62,40 · 28 % | **57,80 · 20 %** |

### F.3 Lo que se decidió aceptar, y por qué

El greedy por **margen de contribución por minuto de cocina** rinde 100,00 · 100 %.
Eso no es una fuga: es la cuenta del año, la que la ficha de 4.º declara LOCKED y
la que el Repaso `y4.margin-review` existe para reparar. Una Template que su
propio constructo no resolviera sería un defecto peor. Queda declarado en el test
permanente como razonamiento buscado, con nombre exacto, y el señuelo —decidir por
el precio sin restar lo que cuesta preparar— rinde 77,60 · 48 %.

### F.4 Iteración: por qué no se gateó cada señuelo por separado

Se probó. Prohibir por variante que «empezar por la más cara» alcance el objetivo
empujó la masa al polo opuesto: «empezar por la más barata» pasó de 80,80 a
**99,00 · 96 %**. Prohibir los dos sentidos del precio por minuto llevó «el menor
costo por minuto» a 100,00 · 100 %. Con tres bandejas y una sola capacidad hay
**seis** órdenes posibles y uno de ellos tiene que ser el bueno: prohibir algunos
hace a los demás más probables, no menos. La conclusión está en la sección P y es
lo que hace finito este cierre.

## G. La auditoría permanente ampliada

### G.1 La taxonomía

```text
CONSTANT           un vector fijo, enumerado entero donde el presupuesto alcanza
NORMALIZED         una fracción de los máximos presentados: 0, ¼, ½, ¾, 1
VISIBLE_COPY       tipear un número impreso, sin ninguna operación
TARGET_RELATIVE    una cuenta de un paso sobre un número impreso
RESOURCE_RELATIVE  una fracción o un reparto fijo de una capacidad impresa
FIXED_PRIORITY     un orden de ítems u opciones fijo
SIMPLE_GREEDY      una razón visible, un orden, llenar
DOMAIN_NAIVE       la conducta ingenua del motor: no hacer nada, lo más temprano, fila a fila
```

Es la familia **final** del cierre. No se agregan más dentro del sprint.

### G.2 Arquitectura

Tres módulos, ningún `templateId`:

- `tests/helpers/blind-strategy-reading.ts` — convierte la presentación en cifras
  con unidad. Normaliza sinónimos (`min`/`minutos`, `MB`/`megas`) y reconoce las
  unidades compuestas `«A por B»` como **tasas de conversión**, que es lo que
  permite leer «10 minutos de laboratorio a 180 MB por minuto» como un tope de
  1800 MB — la dependencia encadenada del beat de 3.º.
- `tests/helpers/blind-strategy-policies.ts` — las ocho familias, derivadas de lo
  que la pantalla imprime.
- `tests/helpers/blind-strategy-space.ts` / `blind-strategy.ts` — el registro por
  capacidad de la ronda 2, conservado, con las políticas conectadas.

**La ronda 2 no se tiró:** su clasificación por capacidad, sus cuatro categorías y
su presupuesto de evaluaciones siguen tal cual. Lo que se agregó son las familias
relativas, que es exactamente lo que MAT-RA2-003 pedía.

### G.3 Frontera de información

Las políticas leen `InteractionPresentation` y nada más. No ven parámetros, no
consultan el evaluador para **elegir** una respuesta, no llaman a un solucionador,
no conocen identificadores de Template y no inspeccionan la calidad mientras
construyen. Construyen una respuesta; la auditoría la evalúa después.

Una política sólo puntúa cuando **todas** las variantes la ofrecen: si una
pantalla no imprime la fila que otra sí imprime, «la misma regla» no existe en
todo el catálogo y promediar sobre un subconjunto inventaría un atajo que un
jugador no podría reusar.

### G.4 Cobertura y costo

```text
42 Templates · 24 AUDITED_EXHAUSTIVELY · 18 AUDITED_BY_POLICIES · 0 bloqueadas · 0 sin soporte
las 24 exhaustivas corren además las familias relativas: constante y política son clases distintas
ninguna fila queda «cubierta» sin políticas ni enumeración — lo comprueba RS-CLO-AUDIT-001
```

Cinco corridas de `pnpm game:blind-audit -- --timing` en Node 24.19.0:

```text
1305,6 · 1195,0 · 1162,9 · 1191,8 · 1154,8 ms      mediana 1191,8 ms
```

Contra ~950 ms de la ronda 2: **+240 ms** por todas las familias nuevas sobre las
42 Templates. Las respuestas repetidas se evalúan una sola vez por variante, lo
que mantiene el costo de las políticas muy por debajo del de la enumeración.
Practicable en CI y en desarrollo.

## H. Iteraciones internas: los atajos de reemplazo que aparecieron

El encargo pedía no detenerse al quitar la política conocida. Esto es lo que
apareció **después** de quitarla, en orden.

### H.1 `y4` · repartir la cocina en partes iguales — 95,00 · 80 %

Apareció apenas se diversificaron las economías. Causa raíz: el objetivo se
calibraba contra el techo con cocina libre. **Cerrado** recalibrando contra el
techo real y agregando el gate de selectividad (F.1, F.2).

### H.2 `y4` · decidir por el precio por minuto — 89,58 · 58 %

El error exacto que `y4.margin-review` repara: no restar lo que cuesta preparar.
**Cerrado** ensanchando el rango de costos, para que el precio deje de ser un
proxy del margen. Hoy rinde 77,60 · 48 % [^erratum-senuelo].

### H.3 `y4` · empezar por la más barata — 99,00 · 96 %

Apareció **como consecuencia de gatear el señuelo opuesto**. Es el hallazgo
metodológico del sprint y está en P. **Cerrado** quitando los gates de un solo
sentido y llevando la decorrelación al nivel del catálogo, donde corresponde.

### H.4 `g7.group-tasks` · el reparto constante `2-3-4-1` — K 100 · S 100 %

Con dos equipos autorados, los dos mejores repartos coincidían en la **posición**
—a cada quien su tarea de tres estrellas— porque las horas alcanzaban siempre.
**Cerrado** con cuatro equipos nuevos donde alguien no tiene horas para la tarea
que mejor le sale. Los patrones óptimos del catálogo son ahora `2-3-4-1` (dos
equipos), `1-3-4-2`, `3-1-4-2`/`3-4-1-2`, `2-1-3-4` y `1-4-2-3`.

### H.5 `y1.mobile-data` · llenar en un orden fijo — 89,00 · 56 %

No estaba en el encargo; la auditoría ampliada lo hizo visible. Causa raíz: el
paso de recorrido del generador dejaba el resto módulo 3 igual al índice módulo 3,
así que **toda** dirección de forma `either-or` caía en la mitad baja del espacio
y heredaba el mismo par de tasas y el mismo pedido. Las once variantes `either-or`
del catálogo eran, en los hechos, tres problemas repetidos. Es la misma clase que
MAT-RA2-005. **Corregido** con un paso coprimo que reparte los dígitos lentos, más
un punto de aire en el pedido que destrabó el gate de Estilo del lado que antes no
podía publicarse. Baja a 86,00 · 44 %; el resto está en I.2.

### H.6 `y5.final-trip-or-event` · elegir por lugares — 100,00 · 100 %

Tampoco estaba en el encargo. Los lugares de más los daba el **papel** del
paquete, así que el mejor paquete era siempre el que más lugares ofrecía: una
etiqueta que delataba la respuesta, la misma forma lógica que MAT-RA2-002.
**Cerrado** atándolos a la **posición**, que rota contra el papel. Baja a
66,00 · 24 %.

## I. Matriz final de exposición

Todas las Templates puntuables, ordenadas por la mejor política de atajo.
«Mejor constante» es la enumeración exhaustiva donde existe.

| Template | N | Mejor constante (K · S) | Mejor política de atajo | Media | Óptima | Clasificación |
|---|---|---|---|---|---|---|
| `y4.course-project-fundraiser` | 25 | 57,80 · 20,0 % | margen por minuto de cocina [SIMPLE_GREEDY] | 100,00 | 100,0 % | **razonamiento buscado** (I.1) |
| `y1.mobile-data` | 25 | — | orden fijo sobre los datos [FIXED_PRIORITY] | 86,00 | 44,0 % | **aceptado con razón** (I.2) |
| `g7.bus-timing` | 26 | 84,62 · 57,7 % | la primera opción [FIXED_PRIORITY] | 84,62 | 38,5 % | riesgo aceptado H-6, sin deriva |
| `y5.stage-screen` | 25 | 78,00 · 40,0 % | la opción con mayor «cm» [SIMPLE_GREEDY] | 78,00 | 12,0 % | RS-MAT-008, **idéntico** |
| `y5.final-trip-or-event` | 25 | 59,40 · 28,0 % | la opción más cara [SIMPLE_GREEDY] | 75,00 | 0,0 % | bajo techo |
| `y1.course-project-expo` | 25 | — | cíclica [FIXED_PRIORITY] | 72,40 | 0,0 % | bajo techo |
| `g7.mural-paint` | 26 | 67,69 · 53,8 % | la opción con mayor «$» [SIMPLE_GREEDY] | 67,69 | 46,2 % | RS-MAT-006 (K ≤ 73) |
| `y1.classroom-layout` | 25 | — | primer hueco [SIMPLE_GREEDY] | 64,00 | 60,0 % | franja de inspección (I.3) |
| `g7.notebook-offer` | 26 | 58,46 · 53,8 % | la última opción [FIXED_PRIORITY] | 58,46 | 53,8 % | franja de inspección (I.3) |
| `y2.standings-claim` | 25 | 56,60 · 20,0 % | todo «posible» [NORMALIZED] | 54,00 | 0,0 % | RS-MAT-005 |
| `g7.bus-latest-departure` | 26 | 53,46 · 19,2 % | el medio del rango [NORMALIZED] | 50,96 | 11,5 % | bajo techo |
| `y3.transport-pass` | 25 | 64,20 · 28,0 % | la última opción [FIXED_PRIORITY] | 50,80 | 24,0 % | RS-MAT-001 |
| `y3.course-project-tech` | 25 | 56,60 · 16,0 % | la fila de cada ítem, por el doble [TARGET_RELATIVE] | 47,00 | 4,0 % | RS-RA-002 · **cerrado** |
| `y4.school-event-flow` | 24 | 54,38 · 16,7 % | 25 % de «En», por consumo [RESOURCE_RELATIVE] | 42,92 | 0,0 % | bajo techo |
| `y2.intercurso-plan` | 25 | — | equilibrada [FIXED_PRIORITY] | 42,40 | 36,0 % | bajo techo |
| `y3.route-plan` | 24 | — | orden presentado [FIXED_PRIORITY] | 40,00 | 33,3 % | bajo techo |
| `y4.represent-class` | 24 | 59,58 · 29,2 % | todo «no entra» [NORMALIZED] | 40,00 | 0,0 % | RS-MAT-007 |
| `y2.course-project-survey` | 25 | 52,80 · 32,0 % | todo «hold» [NORMALIZED] | 40,00 | 0,0 % | RS-MAT-002/003/004 |
| `y5.next-step-options` | 25 | 40,00 · 16,0 % | todo «no entra» [NORMALIZED] | 40,00 | 0,0 % | RS-MAT-009 |
| `y4.event-floor-plan` | 25 | — | huella mínima [SIMPLE_GREEDY] | 31,60 | 24,0 % | bajo techo |
| `y5.course-project-final` | 25 | 56,80 · 28,0 % | primer patrón válido [FIXED_PRIORITY] | 30,80 | 0,0 % | RS-NEW-001 |
| `y3.friend-day` | 25 | — | repartido uniforme [DOMAIN_NAIVE] | 24,40 | 16,0 % | bajo techo |
| `y1.student-day-challenge-wheel` | 25 | — | sólo «Juegos», hasta donde entre [DOMAIN_NAIVE] | 23,20 | 0,0 % | bajo techo |
| `y5.yearbook` | 25 | — | «La imprenta entrega», por la mitad [TARGET_RELATIVE] | 23,00 | 0,0 % | bajo techo |
| `g7.stand-supplies` | 26 | 29,81 · 15,4 % | sólo «Pack x6», hasta donde entre [DOMAIN_NAIVE] | 22,31 | 0,0 % | bajo techo |
| `y3.week-planner` | 25 | — | sólo lo obligatorio, temprano [DOMAIN_NAIVE] | 19,60 | 0,0 % | bajo techo |
| `y2.team-kit-order` | 24 | — | «Anotados», por tres cuartos [TARGET_RELATIVE] | 18,13 | 0,0 % | bajo techo |
| `y4.shift-coverage` | 24 | — | cíclica [FIXED_PRIORITY] | 15,42 | 0,0 % | bajo techo |
| `y2.court-zones` | 25 | — | empaque desde el origen [DOMAIN_NAIVE] | 10,00 | 0,0 % | bajo techo |
| `g7.group-tasks` | 6 | 45,00 · 33,3 % | cíclica [FIXED_PRIORITY] | 10,00 | 0,0 % | MAT-RA2-004 · **cerrado** |
| `g7.may-25-act` | 27 | — | marcar todo [NORMALIZED] | 10,00 | 0,0 % | bajo techo |
| `y1.rehearsal-schedule` | 25 | — | agenda vacía [NORMALIZED] | 10,00 | 0,0 % | bajo techo |

Repasos, que no aportan evidencia competitiva (ADR-024):

| Template | N | Mejor constante | Mejor política | Media | Óptima |
|---|---|---|---|---|---|
| `y1.scale-fit-review` | 24 | — | fila a fila [DOMAIN_NAIVE] | 100,00 | 100,0 % |
| `y2.data-claim-review` | 25 | 72,60 · 52,0 % | todo «hold» [NORMALIZED] | 72,60 | 24,0 % |
| `y1.schedule-review` | 25 | — | repartido uniforme [DOMAIN_NAIVE] | 40,00 | 0,0 % |
| `g7.bus-travel-review` | 26 | 28,46 · 11,5 % | el medio del rango [NORMALIZED] | 13,46 | 3,8 % |
| resto de los Repasos | — | ≤ 49,80 | ≤ 10,00 | — | 0,0 % |

### I.1 Aceptación declarada · `y4.course-project-fundraiser`

El greedy por margen de contribución por minuto de cocina **es** el constructo,
no un bypass. Está declarado por nombre exacto en `INTENDED_REASONING` del test
permanente; cualquier otra política de esa Template sigue bajo el techo global.

### I.2 Excepción acotada · `y1.mobile-data`

1.º, banda CORE, `optimization: 0`: la Template pide **construir** un plan que
entre en los datos, no optimizarlo. Su escalera da `efficient` a toda producción
que respete la capacidad y use alguna cosa opcional, así que 75 es el piso de
haber hecho bien la cuenta, no el premio de saltearla. Medido sobre los 8125
planes del catálogo:

```text
responder al azar sobre todo el espacio     15,52
cualquier plan VÁLIDO                       78,63   · óptimo en 19,9 %   [^erratum-piso]
la política de orden fijo                   86,00   · óptima en 44,0 %
```

Los 78,63 de piso se ganan **haciendo** la relación consumo/capacidad, que es lo
que el año enseña. Lo que la política no hace es resolver el pedido que separa
`optimal` de `efficient`: falla en 14 de 25 variantes. No es un bypass material
del constructo, y por eso no bloquea. Queda con techo propio y **más estricto**
que el global —media < 87, óptima < 50 %— en `ACCEPTED_EXPOSURE`, así que
cualquier empeoramiento vuelve a fallar. Anotada para revisión humana y pacing.

### I.3 Franja de inspección

`y1.classroom-layout` (64,00 · 60 %) y `g7.notebook-offer` (58,46 · 53,8 %) tienen
media muy por debajo de 85 y proporción óptima en la franja 50–79 %. En las dos, la
política es parte del constructo: acomodar por el primer hueco libre **es** el
problema del plano, y comparar dos ofertas **es** el problema de la notebook —cuya
verdad en pesos ya quedó probada por `RS-NEW-002`—. Se documentan y no bloquean.

## J. Regresión de contratos previos

| Contrato | Comprobación | Resultado |
|---|---|---|
| `RS-MAT-001` `y3.transport-pass` | K 64,20 ≤ R + 10 · S 28,0 % · cada opción óptima ≥ 3 variantes | PASS |
| `RS-MAT-002/003/004` `y2.course-project-survey` | K 52,80 ≤ 60 · S 32,0 % ≤ 35 % | PASS |
| `RS-MAT-005` `y2.standings-claim` | K 56,60 ≤ 65 · S 20,0 % ≤ 35 % | PASS |
| `RS-MAT-006` `g7.mural-paint` | K 67,69 ≤ 73 · balance 2 L / 4 L | PASS |
| `RS-MAT-007` `y4.represent-class` | «todo No entra» nunca llega a `efficient` | PASS |
| `RS-MAT-008` `y5.stage-screen` | **K 78,00 · S 40,0 %** · numerador entero 1950 / 25 | PASS · **sin deriva** |
| `RS-MAT-009` `y5.next-step-options` | K 40,00 ≤ 65 · S 16,0 % ≤ 35 % | PASS |
| `RS-MAT-011` `y4.course-project-fundraiser` | consigna, punto de equilibrio, reserva y supuesto de venta total intactos | PASS |
| `RS-NEW-001` `y5.course-project-final` | K 56,80 ≤ 65 · S 28,0 % ≤ 35 % | PASS |
| `RS-NEW-002` `g7.notebook-offer` | comparación verdadera en pesos | PASS |
| `RS-NEW-003` Repasos direccionales | inventario de feedback re-verificado por condición de rama | PASS |
| `RS-NEW-006` | ficha de 2.º | PASS |
| `RS-RA-AUDIT-001` | 42 filas con categoría y razón · 0 sin soporte · sin fuga de oráculo | PASS |
| `RS-RA-001` `g7.bus-travel-review` | rama de concepción errónea **sii** `respuesta === extraMinutes`; 26 × 121 = **3146** respuestas | PASS |
| `RS-RA-002` `y3.course-project-tech` | K 56,60 ≤ 65 · S 16,0 % ≤ 35 % · ≥ 5 vectores óptimos | PASS |
| `RS-RA-003` `y4.course-project-fundraiser` | K 57,80 ≤ 65 · S 20,0 % ≤ 35 % · ≥ 5 vectores óptimos | PASS |
| `RS-RA-TEST-001` | calentamiento fuera del caso cronometrado · 3 `pnpm verify` en verde | PASS |

Contratos nuevos de este sprint:

| Contrato | Criterio | Resultado |
|---|---|---|
| `RS-CLO-AUDIT-001` | taxonomía finita declarada por Template; ninguna fila «cubierta» sin políticas ni enumeración; categoría A corre constante **y** políticas | PASS |
| `RS-CLO-001` | ninguna política reusable de una Template puntuable promedia ≥ 85 ni rinde óptimo en ≥ 80 %, salvo lo declarado en I.1 e I.2; toda excepción trae razón escrita y techo más estricto | PASS |
| `RS-CLO-002` | en `y3` ninguna política `VISIBLE_COPY` llega a óptimo; en `y4` «menos minutos primero» queda bajo 85 y bajo 50 %; el catálogo de `y4` tiene ≥ 5 economías distintas | PASS |
| `RS-CLO-003` | `g7.group-tasks` con ≥ 6 variantes, K y S bajo techo; `y5.final-trip-or-event` ya no se resuelve por lugares | PASS |

## K. Versiones y catálogos

| Artefacto | Antes | Después | Causa |
|---|---|---|---|
| Motor · action log · snapshot | 10.0.0 · 7 · 8 | **sin cambios** | no se tocó el motor |
| Rulesets (los siete) | — | **sin cambios** | ninguna política cambió |
| Score | `2.0.0-post-tg1-candidate` | **sin cambios** | FairScore intacto |
| 7.º contenido · catálogo | `0.11.0` · `dev-7` (185) | `0.12.0` · **`dev-8` (189)** | cuatro equipos de `g7.group-tasks` |
| 1.º contenido · catálogo | `1.2.0` · `dev-3` (359) | `1.3.0` · **`dev-4` (363)** | `y1.mobile-data` + identidad de 7.º |
| 2.º contenido · catálogo | `2.3.0` · `dev-4` (508) | `2.4.0` · **`dev-5` (512)** | identidad combinada |
| 3.º contenido · catálogo | `3.3.0` · `dev-4` (682) | `3.4.0` · **`dev-5` (686)** | `y3.course-project-tech` |
| 4.º contenido · catálogo | `4.3.0` · `dev-4` (854) | `4.4.0` · **`dev-5` (858)** | `y4.course-project-fundraiser` |
| 5.º contenido · catálogo | `5.4.0` · `dev-5` (1027) | `5.5.0` · **`dev-6` (1031)** | `y5.final-trip-or-event` |
| Generadores | — | `y1.mobile-data` 1→2 · `y3.course-project-tech` 2→3 · `y4.course-project-fundraiser` 2→3 · `y5.final-trip.packages` 1→2 | espacios de generación cambiados |

Las siete versiones de 7.º publicadas quedan en disco sin editar (`dev-1` a
`dev-7`). Los catálogos de 1.º a 5.º conservan uno cada uno, como D-S08-088/109;
la deuda histórica R-S09-CAT **no empeoró** y no se tocó, por estar fuera del
alcance canónico vigente.

Rebuild byte a byte e integridad: PASS en los seis catálogos, en las tres
corridas de verify.

## L. Score, egreso, recuperación, replay y servidor

**FairScore.** `pnpm game:score`: 23 000 planes, **perfecto = 10 000 exacto**,
dispersión 0, distintos 1, en planes de 1, 2, 8 y 12 beats; renormalización de
oportunidad verificada con y sin oportunidad de Equipo y de Aura —10 000 en los
cuatro casos—; 0 empates de redondeo. Pesos 85 / 10 / 5 y escalera
100 / 75 / 40 / 10 sin cambios.

**Recuperación y egreso.** `pnpm game:simulate:deep`: **5000 / 5000** runs
completadas, **5000 / 5000** egresadas, 42 149 eventos, peor caso **1** recuperación
por run, **0 hallazgos**. `maxRecoveriesPerStage = 1`, disparo sólo en `invalid`,
sin recursión, Repasos con puntaje competitivo 0.

**Replay y servidor.** Sonda de manipulación contra `validateSubmittedRun` con las
versiones nuevas:

```text
sin tocar nada                        ACEPTADA · recomputada 13104
contentVersion vieja (5.4.0)          RECHAZADA unsupported-version
variantCatalogVersion vieja (dev-5)   RECHAZADA unsupported-version
planFingerprint forjado               RECHAZADA unsupported-version
gameVersion inexistente               RECHAZADA unsupported-version
version de action log 6               RECHAZADA unsupported-version
score declarado por el cliente        IGNORADO  · el servidor recompone 13104 igual
```

Más los doce casos de `server-run-validation` —acción inyectada, hueco en la
secuencia, run truncada, ruleset distinto, semilla hostil, payloads malformados— y
el barrido de las seis políticas de juego, que recompone el mismo puntaje desde el
log en las seis. El cliente **no** envía puntaje: el log es
`{version, descriptor, actions}`.

## M. Accesibilidad

El sprint no tocó `src/components`, `src/app` ni `src/styles`. Lo que cambió es
contenido: números, una etiqueta de ítem —«Minutos de video» pasa a «Videos
cortos», porque ahora se cuentan piezas— y dos filas de datos.

- **174 / 174** E2E en verde en las tres corridas de verify, en desktop y mobile.
- Recorridos de `y3.course-project-tech` a **320 / 360 / 390 / 412 / 1280 px** con
  reflow, foco, teclado y controles de 44 px, todos en verde con la pantalla nueva.
- Recorridos de `y4.course-project-fundraiser` a los mismos cinco anchos, con las
  tres condiciones y el punto de equilibrio.
- `post-g1-accessibility-audit.spec.ts` en 320 / 360 / 390 / 412 y 1280 con zoom 2.
- axe sin violaciones; sin desbordes horizontales de página.

`g7.group-tasks` no tiene recorrido E2E propio: sus cuatro variantes nuevas no
cambian la forma de la pantalla —cuatro personas, cuatro tareas, el mismo tablero—
y el motor se ejerce en el E2E de carrera completa. Cobertura suficiente pero no
específica; queda anotado.

## N. Verificación

| Comando | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS · Node 24.19.0 · pnpm 11.22.0 |
| `pnpm verify` × 3 | **PASS · PASS · PASS** · 96 archivos · **1898** tests · **174** E2E en cada una |
| `pnpm game:validate-content` (los seis años) | PASS, dentro de verify |
| `pnpm game:variants check` y `--content=grade-1…5` | PASS · rebuild byte a byte e integridad `ok` en los seis |
| `pnpm game:blind-audit -- --coverage --keys` | 42 filas · 24 exhaustivas · 18 por políticas · 0 bloqueadas |
| `pnpm game:blind-audit -- --timing` × 5 | 1154,8–1305,6 ms · mediana 1191,8 ms |
| `pnpm game:simulate:deep` | 5000 / 5000 completadas y egresadas · 0 hallazgos |
| `pnpm game:score` | 10 000 exacto · dispersión 0 · 0 empates |
| `pnpm test:e2e:only` | 174 passed, dentro de cada verify |
| `node scripts/validate-agent-workspace.mjs` | PASS · 6 skills · 243 archivos documentados |
| `node scripts/sync-master-spec.mjs --check` | PASS |
| `git diff --check` | limpio |

Ningún gate se re-corrió para esconder una falla. No hubo flake en ninguna de las
tres corridas; el calentamiento fuera del caso cronometrado de `RS-RA-TEST-001`
sigue en pie y no se observó recurrencia.

## O. Riesgos aceptados y diferidos que siguen abiertos

| Riesgo | Estado |
|---|---|
| **H-6** `g7.bus-timing` K 84,62 · S 57,7 % | riesgo aceptado, **sin deriva**, sigue reportado |
| **H-7** `y1.scale-fit-review` política 100,00 en 24 / 24 | diferido a revisión humana. Es `recovery`: no aporta evidencia competitiva, no enseña matemática falsa y no invalida ningún contrato. Sigue reportado en cada corrida |
| **I.2** `y1.mobile-data` 86,00 · 44 % | aceptado con razón y techo propio; para revisión humana y pacing |
| **I.3** `y1.classroom-layout` 60 % · `g7.notebook-offer` 53,8 % | franja de inspección, parte del constructo, documentados |
| **R-S09-CAT** retención de catálogos históricos | STAGE-09, sin tocar, no empeoró |
| **H-8 / H-9** verosimilitud narrativa | preguntas humanas, sin evaluar acá |
| Pacing empírico con jugadores reales | PENDING, humano |

## P. La regla de cierre

El objetivo **no** es probar que ninguna estrategia imaginable puede tener éxito.
Ese estándar es infinito y, como mostró la sección F.4, perseguirlo con gates por
variante es contraproducente: con tres ítems y una capacidad hay seis órdenes y
uno tiene que ser el bueno, así que prohibir algunos hace a los demás más
probables. **La masa se mueve, no desaparece.**

Lo que sí es finito, y lo que este sprint cierra, es la familia canónica de
atajos reutilizables de **baja complejidad**:

```text
CONSTANT · NORMALIZED · VISIBLE_COPY · TARGET_RELATIVE
RESOURCE_RELATIVE · FIXED_PRIORITY · SIMPLE_GREEDY · DOMAIN_NAIVE
```

Implementadas, auditadas y pasando. **No se agregan más clases.** Lo que exija un
solucionador, varios pasos del razonamiento buscado o estrategia experta no es un
atajo: es jugar bien, y pertenece a la auditoría final de cierre, a la revisión
humana, al testeo con jugadores reales y al hardening futuro — no a otro ciclo de
implementación.

Las tres lecciones de método, para quien venga después:

1. **Un techo no se cumple moviendo el vector, sino eliminando la clase.** La
   ronda 2 bajó K treinta puntos y dejó la mejor estrategia intacta.
2. **Una etiqueta monótona en el papel delata la respuesta.** Pasó con los
   minutos de la peña, con los lugares del viaje y con los objetivos de la feria.
   La cura es atar el atributo a algo que rote **contra** el papel.
3. **Prohibir un señuelo de un solo sentido empuja la masa al sentido contrario.**
   La decorrelación pertenece al catálogo, no a la variante.

## Q. Handoff

```text
FINAL MATHEMATICS CLOSURE AUDIT — NEXT
```

De sólo lectura. Puede bloquear el avance **sólo** por:

```text
matemática incorrecta
feedback matemático materialmente falso
atajo de baja complejidad bloqueante en Template puntuable
falla de integridad de FairScore
falla de integridad de replay o servidor
violación de un contrato LOCKED
```

Todo lo demás —verosimilitud, pacing, preferencias de diseño, franjas de
inspección documentadas— pasa a revisión humana, pacing con jugadores reales,
backlog o hardening futuro, y **no** reabre otro ciclo de adjudicación y
remediación de IA.

Este sprint **no** ejecutó la auditoría final de cierre, **no** emitió el sign-off
provisional del Departamento de Matemática de IA, **no** ejecutó la revisión
humana y **no** marcó STAGE-08 como `DONE`.

## Estado canónico resultante

```text
STAGE-08 — IN_PROGRESS

Round-1 Mathematics Remediation           — DONE
Independent Mathematics Re-Audit Round 1  — FAILED
Post-Re-Audit Findings Adjudication       — DONE
Targeted Mathematics Remediation Round 2  — DONE
Independent Mathematics Re-Audit Round 2  — FAILED

STAGE-08 Mathematics Final Closure Sprint — DONE

Final Mathematics Closure Audit                — NEXT
AI Mathematics Department Provisional Sign-Off — PENDING
Human Mathematics Department Review            — DEFERRED
Real-player pacing validation                  — PENDING
```

## Erratas

Verificadas de forma independiente por la
[auditoría final de cierre](final-mathematics-closure-audit.md) (MAT-FC-004) y
reconciliadas durante el
[sign-off provisional](ai-mathematics-department-provisional-signoff.md). El
texto original se conserva: lo que sigue dice qué midió este informe y qué midió
la auditoría, y cuál es la cifra canónica.

[^erratum-economias]: **Este informe dijo 6; la cifra canónica es 5.** El
    generador declara seis economías, pero el catálogo publicado
    `grade-4-dev-5` sólo materializa cinco multisets `(margen, minutos)`
    distintos: la economía `[(1200, 10), (5000, 20), (6000, 40)]` no quedó
    representada en ninguna de las 25 variantes aprobadas. `RS-CLO-002` pide
    **≥ 5** y se cumple con margen cero, no con uno.

[^erratum-senuelo]: **Este informe dijo 77,60 · 48 %.** La auditoría final midió
    el señuelo del precio por minuto de cocina en **72,80 · 40 %**, y encontró
    que la política que sí rinde 77,40 · 48 % es «empezar por la bandeja más
    barata». Las dos quedan muy por debajo del techo, así que la conclusión del
    sprint no cambia; la cifra que hay que citar es la de la auditoría.

[^erratum-piso]: **Este informe dijo 78,63 · óptimo en 19,9 %.** La auditoría
    final midió el piso sobre los **630 planes válidos** del catálogo y obtuvo
    **80,71 · óptimo en 28,4 %**; el 19,9 % salía de dividir por 900 en vez de
    por 630. La corrección **refuerza** la aceptación de `y1.mobile-data`: la
    política de orden fijo queda 5,29 puntos por encima de «producir cualquier
    plan válido», no 7,37.
