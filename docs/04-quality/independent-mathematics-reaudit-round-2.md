# Re-auditoría matemática independiente · ronda 2

- **Estado:** `EXECUTED` — 2026-09-19, sobre `main` en `d7834a3`
- **Gate:** `INDEPENDENT MATHEMATICS RE-AUDIT — ROUND 2`
- **Rol:** equipo independiente de auditoría técnica, matemática y didáctica
- **Entrada:** la [remediación dirigida de ronda 2](targeted-post-reaudit-mathematics-remediation.md),
  contra el [contrato canónico](post-reaudit-mathematics-remediation-spec.md) y la
  [adjudicación](post-reaudit-mathematics-findings-adjudication.md) que lo emitió
- **Postura:** no se confía en el implementador. Toda métrica se re-derivó fuera de
  su instrumentación antes de leer su informe

## A. Veredicto

```text
INDEPENDENT MATHEMATICS RE-AUDIT — ROUND 2 — FAILED — REMEDIATION REQUIRED
```

Los cinco contratos escritos de la ronda 2 **se cumplen**, y se verificaron de forma
independiente: los números del implementador son correctos hasta el último decimal.
El gate falla igual, y por la razón que su propia sección 35 anticipa.

La ronda 2 eliminó **el vector constante**. No eliminó **la clase de atajo**.

| Template | Atajo que la ronda 2 cerró | Atajo que sobrevive | K | S |
|---|---|---|---|---|
| `y3.course-project-tech` | constante `4-4-6` · K 95,83 | **copiar el número «prometió» de la pantalla** | **100,00** | **100 %** |
| `y4.course-project-fundraiser` | constante `3-0-9` · K 92,80 | **llenar la cocina empezando por la bandeja de menos minutos** | **100,00** | **100 %** |

Las dos son Templates `anchor`, **puntuables**, y las dos estrategias son más simples
que la que la ronda 2 eliminó: la primera no requiere **ninguna** operación
aritmética. Medidas contra el evaluador real sobre el catálogo publicado, rinden
`optimal` en **25 de 25** variantes cada una.

El criterio de PASS del gate —«no simple replacement strategy materially defeats
RA-002 / RA-003»— no se cumple.

## B. Baseline reconstruida

Medida desde el repositorio, no heredada del informe.

| Dato | Valor |
|---|---|
| Rama · HEAD al empezar y al terminar el análisis | `main` · `d7834a3` · worktree limpio |
| Node · pnpm | 24.19.0 · 11.22.0 (`pnpm toolchain:check` PASS) |
| Motor · action log · snapshot | `10.0.0` · `7` · `8` — **sin cambios** |
| Score | `fair-score-dev-2@2.0.0-post-tg1-candidate` · 85 / 10 / 5 · escalera 100 / 75 / 40 / 10 |
| Templates | **42** · entradas en `grade-5-dev-5` **1027** |
| Catálogos | `grade-1-dev-3` 359 · `grade-2-dev-4` 508 · `grade-3-dev-4` 682 · `grade-4-dev-4` 854 · `grade-5-dev-5` 1027 · `grade-7-dev-7` 185 |
| Contenidos | 7.º `0.11.0` · 1.º `1.2.0` · 2.º `2.3.0` · 3.º `3.3.0` · 4.º `4.3.0` · 5.º `5.4.0` |
| Generadores que subieron | `y3.course-project-tech` 1→2 · `y4.course-project-fundraiser` 1→2 |
| Tests | 96 archivos · **1883** tests · **174** E2E |
| Superficie de motor tocada | **ninguna**: `git diff 0a1f6ba..HEAD -- src/game src/server src/app src/lib` está vacío |

Poblaciones de las Templates auditadas: `g7.bus-travel-review` 26 ·
`y3.course-project-tech` 25 · `y4.course-project-fundraiser` 25 · `y5.stage-screen` 25 ·
`g7.bus-timing` 26 · `y1.scale-fit-review` 24.

## C. Protocolo de independencia

Qué **no** se usó como autoridad, y con qué se lo reemplazó.

| Fuente del implementador | Reemplazo independiente |
|---|---|
| `pnpm game:blind-audit` y sus techos | Motor de enumeración propio en Python, escrito desde la lectura del código fuente, sin importar nada del repositorio |
| El evaluador de producción como oráculo | Re-implementación independiente de `readTech`, `readFundraiser` y del `evaluate` del Repaso; recién después se contrastó contra el evaluador real |
| El informe de ronda 2 | Leído **después** de cerrar toda la derivación independiente (sección P) |
| La afirmación «la auditoría detecta la clase» | El auditor de ronda 2 se ejecutó **verbatim** contra el árbol pre-ronda-2, extraído con `git archive 0a1f6ba` a un directorio fuera del repositorio |
| Los conteos de catálogo | Diff entrada por entrada y huella por huella entre cada par de versiones consecutivas |
| «El servidor recomputa» | Sonda de manipulación propia contra `validateSubmittedRun` |

Los parámetros de cada variante se materializaron con la maquinaria de direcciones del
propio repositorio —que es el objeto auditado, no un oráculo— y **toda** la matemática
posterior se calculó fuera de él. Donde mi modelo independiente y el evaluador real se
compararon, coincidieron en **3146 / 3146** respuestas (RA-001) y en **50 / 50** planes
de política (RA-002 y RA-003).

Todo el tooling temporal vivió fuera del árbol versionado y no se commitea.

## D. Matriz de contratos de la ronda 2

| Contrato | Criterio | Medición independiente | Resultado |
|---|---|---|---|
| `RS-RA-AUDIT-001` | 42 filas con categoría y razón; 0 sin categoría | 42 filas · 24 `AUDITED_EXHAUSTIVELY` · 18 `AUDITED_BY_POLICIES` · 0 bloqueadas · 0 no aplicables | **PASS** |
| `RS-RA-AUDIT-001` §6 | detectar la clase vieja sobre el catálogo vigente de entonces | Auditor de ronda 2 sobre `grade-5-dev-4`: `y3` K **95,83** / S **83,3 %** / `4-4-6`; `y4` K **92,80** / S **92,0 %** / `3-0-9` | **PASS** |
| `RS-RA-AUDIT-001` §7 | regla anti-oráculo-compartido documentada | `screenChoices`, `surveyPlans`, `standingsPlans` declarados como witnesses, no oráculos | **PASS** |
| `RS-RA-001` | rama de concepción errónea **sii** `respuesta === extraMinutes` | 26 variantes × 121 respuestas = **3146**; la rama dispara exactamente una vez por variante, exactamente en `extraMinutes`; **0** violaciones de dirección | **PASS** |
| `RS-RA-001` §4 | `exacta + viajeNormal` deja de ser `functional` | `invalid` en **26 / 26** | **PASS** |
| `RS-RA-002` §1 | K ≤ 65 · S ≤ 35 % por enumeración entera | 1573 vectores × 25 variantes: K **35,80** · S **20,0 %** · mejor `2-7-4` | **PASS** |
| `RS-RA-002` §2 | supremo de objetivos no admisible | supremo `(6,7,8)` → `invalid` en **25 / 25** | **PASS** |
| `RS-RA-002` §4 | ≥ 2 planes válidos con niveles distintos | los cuatro niveles alcanzables en **25 / 25**; 55–111 planes válidos por variante | **PASS** |
| `RS-RA-002` §6 | ≥ 5 vectores óptimos distintos | **116** | **PASS** |
| `RS-RA-003` §1 | K ≤ 65 · S ≤ 35 % | 630 vectores × 25 variantes: K **62,40** · S **28,0 %** · mejor `2-2-2` | **PASS** |
| `RS-RA-003` §2 | ≥ 3 ordenaciones por margen/minuto, ninguna > 50 % | **6** ordenaciones · máximo **20 %** | **PASS (letra)** · ver F |
| `RS-RA-003` §3 | el colchón aprieta | techo con cocina libre − objetivo − reserva = **1000** en 25 / 25 | **PASS** |
| `RS-RA-003` §4 | las tres condiciones alcanzables por separado | verificado en **25 / 25** | **PASS** |
| `RS-RA-003` §6 | ≥ 5 vectores óptimos distintos | **283** | **PASS** |
| `RS-RA-TEST-001` | calentamiento fuera del caso cronometrado; 3 verify verdes | `beforeAll` con presupuesto propio de 15 s; `testTimeout` global intacto; umbrales de cobertura intactos; 3 / 3 verify en verde | **PASS** |

**Los quince criterios escritos pasan.** El gate falla por la sección 31 del propio
task, no por la sección 11 del contrato.

## E. RA-001 · `g7.bus-travel-review` — verificación exhaustiva

Derivación independiente desde los parámetros crudos, sin leer la condición de rama:

```text
extra  = scheduledMinutes × delayPercent / 100
travel = scheduledMinutes + extra
```

Rango presentado medido en la presentación real: `min 0 · max 120 · step 1` → 121
respuestas por variante, 26 variantes, **3146** respuestas.

| Comprobación | Resultado |
|---|---|
| Mi modelo independiente vs. evaluador real | **3146 / 3146** idénticos, 0 discrepancias |
| `bus-review.extra-only` dispara sólo en `extraMinutes` | **26 / 26** variantes, conjunto de disparo exactamente `{extra}` |
| Respuestas por encima de la exacta que reciben texto de «por debajo» | **0** |
| Segunda raíz `travel + scheduled` dentro de `[0, 120]` | 26 / 26, y todas `invalid` |
| Niveles por `outcomeKey` | `exact`→optimal · `extra-only`→functional · `close`→efficient · `off`→invalid, sin mezcla |
| Histograma total | optimal 26 · efficient 104 · functional 26 · invalid 2990 |

**Biconditional probado.** `extra` y `travel` no pueden coincidir (`scheduled > 0`) y
`|extra − travel| = scheduled ≥ 20 > 2`, así que ni `gap == 0` ni `gap <= 2` pueden
sombrear la rama, y la rama no puede alcanzar una respuesta distinta de `extra`. Los
otros tres textos no afirman dirección ni causa: son descripciones factuales de la
variante.

`RS-NEW-003` en regresión: los Repasos numéricos direccionales siguen midiéndose y el
inventario de feedback quedó re-verificado por condición de rama. La re-verificación
encontró además dos textos falsos preexistentes —la consecuencia inválida de
`y2.court-zones` y el «justo» de `y4.school-event-flow`— y los corrigió; ambos cambios
caen dentro del mandato explícito de `RS-RA-001` §6 y se verificaron como sólo
textuales.

## F. RA-002 · `y3.course-project-tech`

### F.1 Espacio constante, enumerado entero

Máximos de la pantalla `10 / 10 / 12` → **1573** vectores, × 25 variantes = 39 325
evaluaciones, recorridas enteras en un motor propio.

```text
K = 35,80        mejor constante = 2-7-4
S = 20,0 %       histograma o5 · e3 · f0 · i17
óptimo alcanzable en 25 / 25 · 116 vectores óptimos distintos
```

Coincide exactamente con lo reportado. **El contrato pasa.**

### F.2 Búsqueda de estrategias de reemplazo — donde falla

Se probaron 26 políticas reutilizables. Las de mayor rendimiento:

| K | S | Estrategia |
|---|---|---|
| **100,00** | **100 %** | **copiar el segundo número de la fila «pide / prometió»** |
| 100,00 | 100 % | lo mismo, y después rellenar con lo barato |
| 100,00 | 100 % | lo mismo, bajando hasta que entre |
| 75,00 | 0 % | mínimo + 1 en cada ítem |
| 75,00 | 0 % | punto medio entre «pide» y «prometió» |
| 70,20 | 64 % | objetivo con el ítem escaso en 0 |
| 59,80 | 12 % | máximo por ítem en orden entrevistas > video > láminas |
| 40,00 | 0 % | copiar el primer número de la fila («pide») |
| 35,80 | 20 % | *la mejor constante — el techo del contrato* |

**Confirmado contra el evaluador real**, leyendo únicamente la presentación renderizada:

```text
25 variantes · 25 optimal · 0 efficient · 0 functional · 0 invalid
K = 100,0     S = 100 %     Equipo 3/3 en 14 de 25
```

La pantalla imprime, por ítem, una fila `«5 / 7» · pide / prometió`. Tipear el segundo
número en las tres casillas da `optimal` **siempre**.

### F.3 Por qué es estructural, no una casualidad del catálogo

La remediación ató los presupuestos al costo del plan objetivo:

```text
notebookMinutes = notebookCost(target) + 4 u 8
megabytes       = ceil((megabyteCost(target) + 150 o 600) / 50) × 50
labMinutes      = ceil((megabyteCost(target) + 150) / uploadRate) + 0 o 6
minimum         = target − drop,  con drop ≥ 0
```

Las tres holguras son **estrictamente no negativas por construcción**, y `minimum ≤
target` siempre. Por lo tanto el vector `target` es válido y cumple los tres objetivos
en **toda variante que el generador pueda emitir** — no sólo en las 25 publicadas.
Verificado: `readTech(p, p.target) === 'optimal'` en 25 / 25.

Es la misma forma lógica que la adjudicación identificó como causa raíz de MAT-RA-002
—«un vector ≥ supremo cumple todos los objetivos… en cualquier catálogo que se sortee
del mismo espacio»— con la constante sustituida por una lectura de pantalla. La ronda 2
convirtió en **garantía estructural** algo que antes era una coincidencia de los gates:
en el árbol pre-ronda-2 los presupuestos salían de listas fijas y el plan objetivo era
admisible por casualidad en 24 / 24; ahora lo es por definición.

### F.4 Validez de evaluación

La ficha de 3.º declara el `LOCKED`: «cada variante utiliza más de un recurso o
dependencia; **no puede resolverse como un único cálculo de tasa**». El atajo la resuelve
con **cero** cálculos. Quien lo usa nunca computa `4a + b + 3c`, ni los MB, ni la
división entera contra la tasa de subida — que es el constructo completo de la Template
y lo que su propio Repaso, `y3.rate-capacity-review`, existe para reparar.

### F.5 Diversidad estructural

La diversificación es **real**, no de etiquetas: 11 objetivos distintos en 25 variantes,
3 cuellos de botella repartidos 9 / 8 / 8, notebook 23–53 min, pendrive 1050–3200 MB,
laboratorio 5–29 min, 116 vectores óptimos. El problema no es la dispersión: es que la
respuesta sigue impresa en la pantalla.

### F.6 Contratos preservados

Placement `anchor`, banda STANDARD, pacing MEDIUM, arco PROJECT, motor
`quantity-builder`, Repaso `y3.rate-capacity-review`, gates de Equipo por dueño y
witness de Math óptima con Equipo máximo: todos intactos y verificados.

## G. RA-003 · `y4.course-project-fundraiser`

### G.1 Espacio constante, enumerado entero

Máximos `8 / 6 / 9` → **630** vectores × 25 variantes.

```text
K = 62,40        mejor constante = 2-2-2 (panchos-tortas-bebidas)
S = 28,0 %       histograma o0 · e16 · f9 · i0
óptimo alcanzable en 25 / 25 · 283 vectores óptimos distintos
```

Coincide exactamente. **El contrato pasa**, con 2,6 puntos de margen sobre el techo.

### G.2 Ordenaciones por margen por minuto

Seis ordenaciones presentes, la más frecuente en 20 % de las variantes. **La letra del
criterio 2 se cumple.**

### G.3 La economía no varía: sólo varían las etiquetas

Re-derivando margen y minutos de cada bandeja en las 25 variantes:

```text
multiset {(margen, minutos)} = {(3000, 10), (4000, 25), (5000, 40)}
en 25 de 25 variantes — un único multiset en todo el catálogo publicado
```

El generador construye `price = cost + MARGINS[fila][rank]` y `minutes = MINUTES[rank]`
con `MARGINS` y `MINUTES` ambos ascendentes, así que **el rank 0 siempre tiene 10
minutos y margen 3000**. Consecuencia medida:

```text
orden ascendente por minutos  ==  orden descendente por margen/minuto
en 25 / 25 variantes (orden completo, no sólo el primero)
margen por minuto = 300 · 160 · 125, idéntico en las 25
```

Lo que rota es **qué producto ocupa cada papel**, no la economía. El criterio 2 se
cumple contando permutaciones de etiquetas; su propósito declarado —que «el razonamiento
económico correcto» deje de dar siempre la misma respuesta— no se cumple: la regla
sigue siendo una sola y se reusa verbatim en todo el catálogo.

### G.4 Búsqueda de estrategias de reemplazo — donde falla

| K | S | Estrategia |
|---|---|---|
| **100,00** | **100 %** | **llenar la cocina empezando por la bandeja de menos minutos** |
| 100,00 | 100 % | greedy por margen/minuto *(el razonamiento correcto)* |
| 100,00 | 100 % | equilibrio y después mejor margen/minuto |
| 100,00 | 100 % | *optimización completa (referencia)* |
| 79,00 | 44 % | greedy por menor costo |
| 68,20 | 12 % | greedy por mayor precio |
| 62,40 | 0 % | *la mejor constante — el techo del contrato* |
| 61,60 | 8 % | greedy por mayor margen por bandeja *(el señuelo declarado)* |
| 56,60 | 16 % | sólo el de menos minutos, al tope |

**Confirmado contra el evaluador real**, leyendo sólo `ocupa N min` del texto de cada
ítem y los minutos de cocina de la pantalla: **25 / 25 optimal**, K 100,0.

El gate de contenido defiende el señuelo correcto —«el mejor margen por bandeja no puede
ser el mejor por minuto», y en efecto rinde 61,60— pero deja abierto un señuelo que
nadie declaró: **«el que ocupa menos cocina»**, que coincide con la respuesta correcta
siempre y no requiere calcular ningún margen, ninguna contribución ni ningún punto de
equilibrio.

### G.5 Comparación con la baseline

| | pre-ronda-2 | post-ronda-2 |
|---|---|---|
| mejor constante | K 92,80 · S 92 % | K 62,40 · S 28 % |
| «menos minutos primero» | K **100,0** · S **100 %** | K **100,0** · S **100 %** |
| multisets `(margen, minutos)` distintos | **11** | **1** |

La ronda 2 bajó el techo constante 30 puntos y, en el mismo movimiento, **redujo la
diversidad económica de once configuraciones a una**. La mejor estrategia reutilizable
no se movió.

### G.6 `RS-MAT-011` y el resto del constructo

Las tres condiciones en orden, el punto de equilibrio glosado en palabras, el supuesto
de venta total, el gate de Estilo y el Repaso `y4.margin-review` siguen en pie y
verificados. El texto que `RS-MAT-011` fijó no cambió salvo donde un número nuevo lo
exigía. Sin regresión.

## H. Auditoría de la auditoría permanente

### H.1 Cobertura

42 filas, reproducidas de forma independiente y byte a byte iguales a las del informe:
**24** exhaustivas, **18** por políticas, **0** bloqueadas, **0** no aplicables. Ninguna
fila sin categoría ni razón.

### H.2 Corrección de la enumeración exhaustiva

Verificado contra mi propio conteo: `quantity-builder` usa `maxQuantity + 1` por eje
—máximos inclusive, sin off-by-one—, 11 × 11 × 13 = 1573 y 9 × 7 × 10 = 630 coinciden;
`numeric-input` da `max − min + 1` = 121, que coincide con mi rango `[0, 120]`; el
mapeo dígito → ítem respeta el orden de presentación; no hay poda por nivel esperado;
una respuesta enumerada que el motor rechace lanza en vez de silenciarse.

### H.3 Fuga de oráculo

**No hay.** Se inspeccionaron las seis familias de política y las cuatro de espacio:
ninguna consulta el evaluador para elegir una respuesta, ninguna llama a un solucionador
óptimo, ninguna conoce un identificador de Template. Las greedy de geometría y de
recorrido usan sólo la geometría presentada. La clasificación por capacidad se deriva
de la presentación renderizada.

### H.4 Detección genérica de la clase vieja — probada

El auditor de ronda 2 se copió **sin modificar** al árbol pre-ronda-2 y se ejecutó
contra `grade-5-dev-4`:

```text
y3.course-project-tech        K 95,83   S 83,3 %   mejor 4-4-6
y4.course-project-fundraiser  K 92,80   S 92,0 %   mejor 3-0-9
```

Reproduce los dos hallazgos con los números exactos de la adjudicación, **sin ningún
caso especial por `templateId`**: las únicas menciones de identificadores en el helper
son los techos contractuales, que sólo se imprimen. `RS-RA-AUDIT-001` §6 queda probado
desde afuera.

### H.5 El punto ciego que queda — MAT-RA2-003

La ronda 2 cerró el punto ciego por **nombre de motor**. Queda abierto uno por **clase
de estrategia**.

Las cinco políticas mínimas que el contrato fija para cantidades y presupuesto —todo al
mínimo, todo al máximo, mitad del máximo, primer ítem al máximo, proporciones iguales—
son todas **absolutas**: ninguna es relativa al objetivo, al recurso ni al costo
impresos en la pantalla. Y la enumeración exhaustiva sólo recorre vectores **constantes**.
Por lo tanto:

- para las cuatro Templates de categoría A de cantidades, la clase de F.2 y G.4 es
  invisible por construcción;
- para las cuatro de categoría C —`y1.mobile-data`, `y1.student-day-challenge-wheel`,
  `y2.team-kit-order`, `y5.yearbook`— esas cinco políticas son la **única** medición que
  existe.

El implementador implementó exactamente el mínimo que el contrato pide. El defecto es
del contrato, no de su ejecución: la auditoría permanente **no puede detectar hoy la
clase de atajo que derrota a las dos Templates que la ronda 2 existía para arreglar**, y
es por eso que la ronda se pudo cerrar en verde.

Barrido propio sobre las ocho Templates de cantidades con políticas relativas a pantalla:
la política «copiar el objetivo» sólo es aplicable en `y3.course-project-tech` —es la
única que imprime una fila `pide / prometió` por ítem—, así que el alcance de MAT-RA2-001
es exactamente una Template.

### H.6 Presupuesto y veracidad de la cobertura

`EVALUATION_BUDGET = 60 000` está justificado por medición: el caso publicado más caro
cuesta 54 675 (729 × 25 × 3 posturas). Las filas de categoría B declaran su cardinal y
su costo. Ninguna Template marcada exhaustiva fue muestreada; ninguna marcada por
políticas tiene el conjunto vacío.

## I. RA-008 · infraestructura de test

| Criterio | Verificación |
|---|---|
| Calentamiento fuera del caso cronometrado | `beforeAll` con presupuesto propio de 15 s |
| `testTimeout` global sin subir | `vitest.config.ts` sin cambios; sin clave `testTimeout` |
| Umbrales de cobertura sin bajar | 75 / 85 / 85 / 85 sin cambios |
| Política de lint sin cambios | los mismos casos, las mismas aserciones |
| Sin `.skip`, `.only` ni reintentos | verificado |
| Verify reproducible | **3 / 3** en verde (sección O) |

Sin flake observado en ninguna de las tres corridas.

## J. Hallazgos aceptados y diferidos — preservación

| Hallazgo | Decisión adjudicada | Medición independiente ahora | Estado |
|---|---|---|---|
| MAT-RA-004 `y1.scale-fit-review` | revisión humana · H-7 | política «fila a fila» 100,0 · óptima 24 / 24, idéntica a la baseline; sigue reportada | **preservado** |
| MAT-RA-005 `g7.bus-timing` | riesgo aceptado · H-6 | K **84,6** · S **57,7 %**, idéntico antes y después | **sin deriva** |
| MAT-RA-007 | documentación | erratum de `K_min(N)` aplicado sin borrar el razonamiento | **resuelto** |
| MAT-RA-009 | STAGE-09 · R-S09-CAT | 7.º conserva 7 catálogos; 1.º–5.º conservan 1 cada uno, como D-S08-088/109. **No empeoró** | **contenido** |
| MAT-RA-010 | ya corregido | conteos al día: 1883 tests, 174 E2E, medidos | **resuelto** |

Ningún comportamiento de juego cambió en silencio en ninguna de ellas.

## K. Regresión de los contratos previos

| Contrato | Comprobación material | Resultado |
|---|---|---|
| `RS-MAT-001` `y3.transport-pass` | K 64,2 ≤ R + 10 · S 28,0 % ≤ 40 % · cada opción óptima ≥ 3 variantes | PASS |
| `RS-MAT-002` / `003` / `004` `y2.course-project-survey` | K 52,8 ≤ 60 · S 32,0 % ≤ 35 % | PASS |
| `RS-MAT-005` `y2.standings-claim` | K 56,6 ≤ 65 · S 20,0 % ≤ 35 % | PASS |
| `RS-MAT-006` `g7.mural-paint` | K 67,7 ≤ 73 · balance 2 L / 4 L | PASS |
| `RS-MAT-007` `y4.represent-class` | «todo No entra» nunca llega a efficient | PASS |
| `RS-MAT-008` `y5.stage-screen` | **K 78,0 · S 40,0 %**, numerador entero 1950 / 25 — exactamente el mínimo probado | PASS · **sin deriva** |
| `RS-MAT-009` `y5.next-step-options` | K 40,0 ≤ 65 · S 16,0 % ≤ 35 % | PASS |
| `RS-MAT-011` `y4.course-project-fundraiser` | consigna, punto de equilibrio, reserva y supuesto de venta intactos | PASS |
| `RS-NEW-001` `y5.course-project-final` | K 56,8 ≤ 65 · S 28,0 % ≤ 35 % | PASS |
| `RS-NEW-002` `g7.notebook-offer` | comparación verdadera en pesos | PASS |
| `RS-NEW-003` Repasos direccionales | re-verificado por condición de rama; **ahora también `g7.bus-travel-review`** | PASS |
| `RS-NEW-006` | ficha de 2.º | PASS (documental) |
| `RS-RA-AUDIT-001` … `RS-RA-TEST-001` | sección D | PASS |

Catorce contratos de ronda 1 en verde, incluido el que la ronda 1 había dejado FAIL.

`RS-MAT-008` en detalle: la constante `#0` («que entre entera») es válida en las 25
variantes, `optimal` en 3 y `efficient` en 22, así que `K = (3·100 + 22·75)/25 = 78,0`
exacto, con `S = 40 %`. Idéntico antes y después de la ronda 2, y el archivo de 5.º sólo
cambió un comentario. La excepción estrecha de witness sigue condicionada a cero
recortes válidos.

## L. Score, recuperación, replay, servidor y catálogos

**FairScore.** `fair-score-dev-2@2.0.0-post-tg1-candidate`: pesos 8500 / 1000 / 500 en
puntos básicos —85 / 10 / 5—, escalera 10000 / 7500 / 4000 / 1000 —100 / 75 / 40 / 10— y
factores de dificultad core 1,00 · standard 1,08 · stretch 1,15. Sin cambios.
`pnpm game:score`: 23 000 planes, **perfecto = 10 000 exacto**, dispersión 0, distintos 1,
en planes de 1, 2, 8 y 12 beats; renormalización de oportunidad verificada —con y sin
oportunidad de Equipo y de Aura, 10 000 en los cuatro casos—; piso 0; 0 empates de
redondeo. Estilo excluido del score; los Repasos excluidos por `placement === 'recovery'`.

**Recuperación y egreso.** `maxRecoveriesPerStage = 1`, disparo sólo en `invalid`, sin
recursión. `pnpm game:simulate:deep`: **5000 / 5000** runs completadas, **5000 / 5000**
egresadas, peor caso 1 recuperación, 0 hallazgos. La ruta que RA-001 tocó queda cubierta:
el Repaso sigue `placement: 'recovery'` con puntaje competitivo 0, y `travel + scheduled`
pasa de `functional` a `invalid` sin abrir una segunda recuperación.

**Servidor y replay.** Sonda de manipulación independiente contra `validateSubmittedRun`:

```text
el cliente NO envía puntaje: el log es {version, descriptor, actions}
descriptor.gameVersion / contentVersion / rulesetVersion alterados → REJECTED unsupported-version
version del action log 6 u 8                                       → REJECTED unsupported-version
variantCatalogVersion o planFingerprint forjados                   → REJECTED unsupported-version
acción ANSWER inyectada                                            → REJECTED replay-mismatch
hueco en la secuencia                                              → REJECTED action-log-sequence-gap
opción inexistente en una respuesta                                → REJECTED replay-mismatch
respuesta legal distinta                                           → ACEPTADA y RECOMPUTADA (0→7885, 50→8449, 93→8345, tin-4l→9085)
replay repetido                                                    → idéntico
```

Falla cerrado por igualdad exacta en las tres versiones. Nada que forjar del lado del
cliente, porque el puntaje nunca viaja.

**Catálogos.** Diff independiente entrada por entrada:

| Año | Versión | Entradas | + / − / ~ | Causa |
|---|---|---|---|---|
| 1.º | dev-2 → dev-3 | 359 → 359 | 0 / 0 / 0 | identidad de contenido combinada: 7.º cambió |
| 2.º | dev-3 → dev-4 | 508 → 508 | 0 / 0 / 0 | texto de `y2.court-zones` (RS-RA-001 §6) |
| 3.º | dev-3 → dev-4 | 681 → 682 | 21 / 20 / 4 | sólo `y3.course-project-tech`; generador 1 → 2 |
| 4.º | dev-3 → dev-4 | 853 → 854 | 41 / 40 / 9 | sólo los dos proyectos; dos generadores 1 → 2 |
| 5.º | dev-4 → dev-5 | 1026 → 1027 | 41 / 40 / 9 | ídem |
| 7.º | dev-6 → dev-7 | 185 → 185 | 0 / 0 / 0 | `bus-travel-review`; **sin cambio de población**, como exigía `RS-RA-001` |

**Sin deriva gratuita de versiones.** Cada bump es explicable y ninguna entrada se movió
fuera de las dos Templates remediadas. Rebuild byte a byte e integridad: PASS en los seis
catálogos, en las tres corridas de verify.

## M. Accesibilidad

La ronda 2 no tocó UI ni sistema de diseño —`src/components`, `src/app` y `src/styles`
sin cambios—; lo que cambió son números y dos textos. La evidencia corrida:

- recorridos nuevos de `y3.course-project-tech` y `y4.course-project-fundraiser` a
  **320 / 360 / 390 / 412 / 1280 px**, con reflow, foco, teclado, controles de 44 px y
  zoom CSS 200 % a desktop;
- corrección real encontrada por el implementador: el test medía la casilla de 20 px e
  ignoraba su etiqueta clicable de 44 px;
- `post-g1-accessibility-audit.spec.ts` en 320 / 360 / 390 / 412 y 1280 con zoom 2;
- axe sin violaciones; **174 / 174** E2E en verde en las tres corridas;
- sin desbordes horizontales.

`g7.bus-travel-review` no tiene recorrido E2E propio: su feedback no cambió de forma ni
de texto —sólo de condición de rama— y el Repaso se ejerce en el E2E de carrera completa
a 320 px. Lo registro como cobertura suficiente pero no específica.

## N. Rendimiento de la auditoría permanente

Cinco corridas de `pnpm game:blind-audit -- --timing` en Node 24.19.0:

```text
min 951,3 ms · mediana 963,5 ms · máximo 982,8 ms
peor Template: y3.course-project-tech 282,2 ms · y5.course-project-final 279,0 ms
```

Coherente con los 938 ms reportados. El costo es `cardinal × variantes`, acotado por el
presupuesto de 60 000 evaluaciones por Template: **no hay explosión cuadrática ni
cúbica** con los tamaños de catálogo actuales. Practicable en CI y en desarrollo.

## O. Verificación canónica

| Comando | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS · Node 24.19.0 · pnpm 11.22.0 |
| `pnpm verify` × 3 | **PASS · PASS · PASS** · 96 archivos · 1883 tests · 174 E2E en cada una |
| `pnpm game:validate-content` (los seis años) | PASS dentro de verify |
| `pnpm game:variants check` y `--content=grade-1…5` | PASS · rebuild byte a byte e integridad, en cada verify |
| `pnpm game:blind-audit -- --coverage --keys` | 42 filas · 24 / 18 / 0 / 0 · techos contractuales en verde |
| `pnpm game:simulate:deep` | 5000 / 5000 completadas y egresadas · 0 hallazgos |
| `pnpm game:score` | 10 000 exacto · dispersión 0 |
| `pnpm test:e2e:only` | 174 passed, dentro de cada verify |
| `node scripts/validate-agent-workspace.mjs` · `sync-master-spec --check` · `git diff --check` | PASS dentro de verify |

Ningún gate se re-corrió para esconder una falla; no hubo fallas.

## P. Comparación con lo que el implementador afirmó

Leído **después** de cerrar la derivación independiente.

| Afirmación de ronda 2 | Medición independiente | Veredicto |
|---|---|---|
| 42 Templates · 1883 tests · 174 E2E | 42 · 1883 · 174 | **exacta** |
| 3146 respuestas verificadas en RA-001 | 3146, con 0 discrepancias contra mi modelo | **exacta** |
| RA-002: K 95,83 / S 83,33 % → K 35,8 / S 20 % | reproducidas las cuatro cifras | **exacta** |
| RA-003: K 92,8 / S 92 % → K 62,4 / S 28 % | reproducidas las cuatro cifras | **exacta** |
| 116 y 283 vectores óptimos distintos | 116 y 283 | **exacta** |
| 6 ordenaciones, máximo 20 % | 6 y 20 % | **exacta** |
| 42 cubiertas · 24 exhaustivas · 18 políticas · 0 sin soporte | idéntico, fila por fila | **exacta** |
| Auditoría ~938 ms | 951–983 ms en cinco corridas propias | **coherente** |
| Tres verify consecutivos en verde | tres propias en verde | **confirmada** |
| Motor, action log, snapshot y scorer sin tocar | `git diff` vacío en `src/game`, `src/server`, `src/app`, `src/lib` | **confirmada** |
| «Sólo cambia la identidad del contenido» | diff de catálogos entrada por entrada lo confirma | **confirmada** |

**No se encontró ninguna afirmación falsa en el informe de ronda 2.** El informe es
honesto y sus mediciones son correctas. Lo que falta no es veracidad: es alcance. El
informe nunca afirma resistencia a estrategias de reemplazo, porque ningún contrato se
la pidió. La sección 35 del gate de re-auditoría sí.

La única diferencia numérica: el informe reporta «19 exhaustivas» como baseline de la
ronda 1; el auditor de ronda 2 aplicado a la baseline da 24. Es una comparación entre
dos herramientas distintas, no un error.

## Q. Hallazgos nuevos

| ID | Template / área | Severidad | ¿Bloquea? |
|---|---|---|---|
| **MAT-RA2-001** | `y3.course-project-tech` · copiar el objetivo de pantalla rinde K 100 / S 100 % | **BLOCKER** | **SÍ** |
| **MAT-RA2-002** | `y4.course-project-fundraiser` · «menos minutos primero» rinde K 100 / S 100 %; economía idéntica en 25/25 | **BLOCKER** | **SÍ** |
| **MAT-RA2-003** | auditoría permanente · las familias de política son absolutas; la clase de 001 y 002 es indetectable por construcción | **HIGH** | **SÍ** (causa de que el gate cerrara en verde) |
| **MAT-RA2-004** | `g7.group-tasks` · constante `2-3-4-1` rinde K 100 / S 100 % sobre 2 variantes, `anchor` puntuable, sin contrato | MEDIUM | no |
| **MAT-RA2-005** | `y4.course-project-fundraiser` · el catálogo publicado recorre 30 de 1296 direcciones y congela 3 de los 6 ejes del generador en su primer valor | LOW | no |

### MAT-RA2-001 — reproducción

1. Abrir cualquier variante de `y3.course-project-tech`.
2. Leer el segundo número de cada fila «pide / prometió».
3. Tipearlo en las tres casillas.
4. Resultado: `optimal` — en las 25 variantes publicadas, y en cualquier catálogo que el
   generador pueda emitir, porque los tres presupuestos se derivan del costo del plan
   objetivo con holgura no negativa.

**Impacto.** Template `anchor` puntuable: 100 % de la escala de Math sin ninguna
operación aritmética. Viola el `LOCKED` de la ficha de 3.º y el Intrinsic Math Gate.

### MAT-RA2-002 — reproducción

1. Abrir cualquier variante de `y4.course-project-fundraiser`.
2. Leer «ocupa N min» de cada bandeja y los minutos de cocina.
3. Llenar la cocina empezando por la bandeja de menos minutos, después la siguiente.
4. Resultado: `optimal` en 25 / 25, sin calcular un solo margen.

**Impacto.** Template `anchor` puntuable: 100 % de la escala de Math sin tocar el
constructo —margen de contribución por unidad del recurso escaso—. La causa es que
`MARGINS` y `MINUTES` son ambos ascendentes sobre el mismo `rank`, así que el orden por
minutos **es** el orden por margen/minuto en toda variante que el generador pueda emitir.

### MAT-RA2-004 y MAT-RA2-005

`g7.group-tasks` mide idéntico antes y después de la ronda 2: es preexistente, está fuera
de todo contrato de ronda 2 y no es una regresión. Se registra porque la auditoría
ampliada ahora lo hace visible y ningún techo lo cubre; con N = 2 la métrica además es
estadísticamente poco informativa. MAT-RA2-005 es una observación de amplitud de catálogo
que contribuye a MAT-RA2-002 y merece decisión al re-remediar.

## R. Limitaciones

- No se evaluó **verosimilitud narrativa**: H-8 y H-9 siguen siendo preguntas humanas.
- No se evaluó **pacing real con jugadores**; sigue PENDING.
- La búsqueda de estrategias de reemplazo es **exhaustiva en el espacio constante** y
  **sistemática pero no exhaustiva** en el espacio de políticas: probé 26 políticas en
  RA-002 y 17 en RA-003. Que no haya encontrado más atajos no prueba que no existan.
- Las Templates de categorías B, C y D no tienen medición exhaustiva; para ellas mi
  análisis hereda la misma limitación que la auditoría permanente.
- Ninguna afirmación de esta re-auditoría pasa contenido a `math_reviewed`.

## S. Recomendación de gate

```text
NOT READY — AI MATHEMATICS DEPARTMENT PROVISIONAL SIGN-OFF permanece BLOQUEADO
```

Razón exacta: dos Templates `anchor` puntuables admiten una estrategia reutilizable de
complejidad menor que la que la ronda 2 eliminó, con **K 100 y S 100 %** cada una, y la
auditoría permanente no puede detectar esa clase.

El gate siguiente **no** es una tercera remediación directa: es una adjudicación, porque
lo que falta no es ejecución sino contrato. Las tres preguntas que sólo el Chair puede
decidir:

1. **¿La respuesta puede seguir impresa en la pantalla?** Si `optimal` se define como
   «alcanzar el objetivo» y el objetivo se muestra, el único arreglo es cambiar qué hace
   óptimo a un plan, o dejar de garantizar que el plan objetivo entra. Las dos tocan
   constructo `LOCKED`.
2. **¿Basta rotar etiquetas para que la economía «varíe»?** El criterio 2 de `RS-RA-003`
   se cumple hoy con un único multiset `(margen, minutos)`. Si su intención era que el
   razonamiento correcto dejara de dar siempre la misma respuesta, el criterio necesita
   reescribirse sobre la economía, no sobre las permutaciones.
3. **¿Qué familias de política pasan a ser obligatorias?** Como mínimo, relativas al
   objetivo, al recurso y al costo impresos, para que la auditoría permanente pueda ver
   la clase que hoy no ve. Sin eso, una ronda 3 tampoco podría demostrar que arregló algo
   — que es exactamente el argumento con el que MAT-RA-006 subió a P0.

## T. Estado canónico resultante

```text
STAGE-08 — IN_PROGRESS

Mathematics Remediation Round 1          — DONE   (14 contratos)
Independent Mathematics Re-Audit Round 1 — FAILED (13/14 + 3 hallazgos nuevos)
Post-Re-Audit Findings Adjudication      — DONE
Targeted Mathematics Remediation Round 2 — DONE   (5 contratos, los 5 PASS)
Independent Mathematics Re-Audit Round 2 — FAILED — REMEDIATION REQUIRED
                                           5/5 contratos PASS · 5 hallazgos nuevos · 3 bloqueantes

AI Mathematics Department Provisional Sign-Off — NOT READY / BLOCKED
Human Mathematics Department Review            — DEFERRED
Real-player pacing validation                  — PENDING
```

Nada de producto se tocó en este gate: `src/`, catálogos publicados, scorer, motor,
evaluadores y tests quedan exactamente como estaban. Lo que se entrega es evidencia.
