# Re-auditoría matemática independiente

- **Estado:** `EXECUTED` — 2026-09-18, sobre `main` en `03f706b`
- **Gate:** `INDEPENDENT MATHEMATICS RE-AUDIT`
- **Rol:** equipo de auditoría independiente + Chair del Mathematics Re-Audit
- **Entrada:** la remediación matemática completa —14 de 14 contratos en PASS según
  su propia evidencia— y su
  [especificación](mathematics-remediation-spec.md) como **único** insumo de contrato
- **Veredicto:** `INDEPENDENT MATHEMATICS RE-AUDIT — FAILED — REMEDIATION REQUIRED`

## A. Veredicto

```text
INDEPENDENT MATHEMATICS RE-AUDIT — FAILED — REMEDIATION REQUIRED
```

Los catorce contratos de la remediación **se verificaron de forma independiente y
los catorce se sostienen**, incluida la parte más difícil: el techo
`K = 78` de `y5.stage-screen` se volvió a probar desde cero, con una derivación
deductiva propia y dos enumeraciones nuevas, y **es correcto**.

El gate falla por otra razón. Atacando el producto desde **fuera** de los
supuestos de la remediación aparecieron tres defectos materiales que su
instrumentación no podía ver, porque la auditoría permanente de estrategia ciega
que el propio contrato definió (sección 3) mide **sólo** tres motores de
interacción —tarjeta de decisión, clasificación y entrada numérica— y deja fuera,
por construcción, las **veintidós** Templates de construcción:

| ID | Severidad | Template | Qué es |
|---|---|---|---|
| MAT-RA-001 | HIGH | `g7.bus-travel-review` | Un feedback fijo afirma una dirección y una causa **falsas** en 26 de 26 variantes aprobadas, y el inventario lo clasificó como probado verdadero |
| MAT-RA-002 | BLOCKER | `y3.course-project-tech` | Una respuesta **constante** rinde `K = 95,83` con `S = 83 %` en una Template puntuable |
| MAT-RA-003 | BLOCKER | `y4.course-project-fundraiser` | Una respuesta **constante** rinde `K = 92,80` con `S = 92 %` en una Template puntuable |

MAT-RA-002 y MAT-RA-003 superan **todos** los techos que la propia remediación
fijó —el más alto fue 78, y sólo después de una prueba formal de imposibilidad— y
son del mismo orden que el `K 92,5 · S 91,7 %` de `y5.course-project-final` que la
adjudicación había clasificado `REQUIRED_CORRECTION` P0.

Ninguno se corrigió: este gate es de sólo lectura sobre el producto.

## B. Baseline reconfirmada

Nada de esto se tomó del reporte anterior; todo se midió.

| Dato | Valor medido |
|---|---|
| Rama · HEAD | `main` · `03f706b` · worktree limpio al empezar |
| Node · pnpm | 24.19.0 exacto · 11.22.0 (`pnpm toolchain:check` en verde) |
| Motor · action log · snapshot | `10.0.0` · `7` · `8` — **idénticos** a `9ea3896` |
| Ruleset de carrera completa | `1.0.0-full-career` |
| Score | `fair-score-dev-2@2.0.0-post-tg1-candidate`, `official=false` |
| Templates | **42** distintas en el catálogo de carrera completa |
| Entradas aprobadas | **1026** en `grade-5-dev-4` (1025 en `grade-5-dev-2`) |
| Contenido de 5.º | `5.3.0-grade-5` · catálogo `grade-5-dev-4` |
| Catálogos | `grade-1-dev-2` 359 · `grade-2-dev-3` 508 · `grade-3-dev-3` 681 · `grade-4-dev-3` 853 · `grade-5-dev-4` 1026 · `grade-7-dev-6` 185 |
| Generadores | 41 registrados en `grade-5-dev-4`; 7 subieron `1 → 2`, 34 sin tocar |
| Vitest | **95 archivos · 1739 tests · 0 `todo`** |
| E2E | **158**, todos en verde |
| Simulación profunda | 5000 / 5000 runs, egreso 5000 / 5000, 0 hallazgos |
| Perfecto | 10 000 exacto, `spread` 0 sobre 23 000 planes |

> **Deriva documental.** `docs/06-delivery/current-stage.md` declaraba «1723 tests
> más 2 `todo`» y «154 E2E». Lo medido es **1739 tests, 0 `todo` y 158 E2E**. Se
> corrige en esta entrega (MAT-RA-010).

## C. Protocolo de independencia

Lo que **no** se usó como autoridad inicial, y cuándo se leyó:

| Artefacto | Uso |
|---|---|
| `mathematics-remediation-implementation.md` | **Leído recién en la fase E**, después de toda derivación propia |
| `mathematics-remediation-contract-conflict-adjudication.md` | ídem |
| `rs-mat-008-blind-ceiling-final-adjudication.md` | ídem |
| `mathematics-remediation-feedback-inventory.md` | ídem |
| `tests/integration/blind-strategy-audit.test.ts` · `pnpm game:blind-audit` | **No** fue la primera fuente de R/K/S; se corrió al final, sólo para comparar |
| `tests/helpers/blind-strategy.ts` | No se usó |
| Tests existentes | Evidencia de regresión, nunca prueba de una afirmación matemática |

De la especificación de remediación se leyó **sólo el contrato** (secciones 0–7),
que es lo que define qué tiene que ser verdadero.

Lo que se reconstruyó desde cero:

- el modelo geométrico completo de `y5.stage-screen`, en Python con racionales
  exactos, **sin transcribir** `tierOf`;
- el generador de `y5.stage-screen`, `y2.course-project-survey`,
  `y2.data-claim-review` y `y2.standings-claim`, con verificación por **huella
  SHA-256 publicada**;
- las seis afirmaciones de la encuesta, re-derivadas de su redacción en castellano;
- la enumeración de fixtures y de resultados del torneo de `y2.standings-claim`,
  con aritmética propia;
- el modelo de costos de `y3.transport-pass`, el de pintura del mural, el de
  descuentos de la notebook, el de viabilidad del año que viene y la escalera de
  la muestra final;
- un medidor de R/K/S propio, con su propia enumeración de espacios de respuesta
  y su propio mapeo por posición;
- la aritmética de FairScore, fuera del scorer de producción.

## D. Metodología

**Verificación de materialización por huella.** Antes de afirmar nada sobre un
catálogo, la reimplementación independiente del generador tuvo que reproducir las
huellas SHA-256 publicadas. Resultado: **150 / 150** en seis Templates
(`y5.stage-screen` 25/25, `y2.course-project-survey` 25/25,
`y2.data-claim-review` 25/25, `y2.standings-claim` 25/25, y los volcados de
parámetros de otras ocho Templates, 200/200). Eso convierte «creo que materialicé
la variante correcta» en un hecho comprobable.

**Enumeración exhaustiva.** 64 clasificaciones por variante de la encuesta, 8 del
Repaso del denominador, 81 de la tabla, 729 de la muestra final, 3^6 y 3^5 de las
clasificaciones, rangos numéricos completos de los Repasos, y —para las Templates
de cantidades— **todo** el vector constante posible (1573, 702, 630, 125).

**Búsqueda de contraejemplos.** Cada criterio se atacó con la hipótesis contraria
antes de aceptarlo. Dos ataques fallaron y eso es evidencia a favor de la
remediación (sección G). Tres tuvieron éxito y son los hallazgos de la sección O.

**Oráculos compartidos.** Se inspeccionaron los pares evaluador / «oráculo
independiente». Tres de ellos —`screenChoices`, `surveyPlans` y `standingsPlans`—
**no son independientes en el sentido fuerte**: no llaman al evaluador, pero leen
la misma función de verdad (`tierOf`, `surveyClaims`, `independentTruths`). Un
error en esa función sería invisible para el test que los compara. Por eso las
fórmulas de verdad se re-derivaron a mano, una por una.

**Herramientas de scratch.** Python con `fractions.Fraction` y aritmética entera
pura, y TypeScript sobre `vite-node` para materializar y evaluar. Todo fuera del
árbol versionado, y eliminado al cerrar.

## E. Matriz de los catorce contratos

| Contrato | Resultado independiente | Evidencia propia | Contraejemplos buscados |
|---|---|---|---|
| RS-MAT-001 `y3.transport-pass` | **PASS** | Modelo de costos propio: óptimas 7 · 6 · 6 · 6 (máx 28 %), cruce a ≤ 3 viajes en 15/25 (60 %), brecha mínima $100 y ≥ 2 %, `pocos-viajes` con suelto óptimo en 7 de 8 | Se buscó una variante donde el umbral del feedback `efficient` fuera falso en algún punto del rango: **ninguna**. Precios: los ejes de precio y los de rango son disjuntos en el generador |
| RS-MAT-002 `y2.data-claim-review` | **PASS** | `TF` 13/25 (52 %), `TT` 6 (24 %), `FF` 6 (24 %); ningún borde exacto; tercera afirmación falsa en 25/25; `functional` alcanzable en las 6 variantes `TT`; K 72,60 · S 52 % | Se buscó una clave ciega y un borde a una respuesta: ninguno |
| RS-MAT-003 `y2.course-project-survey` criterio visible | **PASS** | `PUBLICATION_RULE.oneIn = 10` es la única fuente: la lee el texto en `instructions`, el evaluador y el oráculo; 0 variantes a ≤ 1 respuesta del borde; 5 variantes `margin` con líder que no cumple la regla | Se re-derivaron las seis fórmulas de verdad desde su redacción; las seis son correctas |
| RS-MAT-004 `y2.course-project-survey` variedad | **PASS** | `year-prefers` cierta en 5/25 y nunca en igualdad; 4 de 6 afirmaciones toman los dos valores; 7 claves óptimas; cada forma con 2–3 claves; contraste de denominador 15/25 (60 %); K 52,80 · S 32 % | Ninguna forma semántica determina la clave |
| RS-MAT-005 `y2.standings-claim` | **PASS** | Enumeración **propia** de fixtures (49 en total, máx 6 por variante) y de todo resultado: la categoría por cotas coincide con la categoría conjunta en **todas** las variantes, todos los fixtures y todos los resultados. Empate estricto: 0 variantes cambian de categoría. Discriminación: máx 68 % ≤ 70 %. K 56,60 · S 20 % | Se buscó un fixture imposible, un empate oculto y una categoría que difiera conjunta vs independiente: ninguno |
| RS-MAT-006 `g7.mural-paint` | **PASS** | Aritmética de pintura propia: 2 L 14/26 (53,8 %) · 4 L 12/26 (46,2 %), ambos en 45–55 %; litros requeridos 1,008–3,840, así que **1 L nunca alcanza**; tres niveles, sin `efficient` artificial; evaluador sin tocar; K 67,69 | El piso alto es la heurística segura legítima —4 L siempre alcanza, nunca es inválida—, no un defecto de catálogo |
| RS-MAT-007 `y4.represent-class` | **PASS** | Todo «No entra» es `functional` en 24/24, nunca ≥ `efficient`; 2 propuestas viables en 19 variantes y 3 en 5; Math no depende de la postura; witness de Aura presente | Se probaron todo-No, todo-Sí, una sola viable y la primera propuesta |
| RS-MAT-008 `y5.stage-screen` | **PASS** | Sección G completa | Sección G |
| RS-MAT-009 `y5.next-step-options` | **PASS** | Viabilidad por escenario 52 % · 64 % · 48 % · 60 % · 48 %, todas con ≥ 25 % viable y ≥ 25 % no viable; estudio viable en 22/25 (88 %); motivos de exclusión máx 40 %; «mié» correcto; `team: 'none'`, `aura: 'none'`, sin Estilo, la preferencia sólo deja un flag; K 40,00 · S 16 % | Se probaron siempre-facultad, siempre-terciario, todo-viable, todo-no-viable y el primer escenario |
| RS-MAT-011 `y4.course-project-fundraiser` | **PASS** en su alcance de texto | Las tres condiciones en orden en `goal`; «punto de equilibrio» glosado en palabras; «todo lo que se prepara se vende» presente; la instrucción del costo fijo habla de bandejas **vendidas**, sin contradicción. Evaluador, parámetros y gates sin cambios | **Pero** ver MAT-RA-003: el contrato declaró «Mediciones. Ninguna de estrategia ciega», y esa declaración resulta falsada por medición |
| RS-NEW-001 `y5.course-project-final` | **PASS** | 729 planes por variante, enumerados: «repartir todo» es **inválido** en 25/25 (0 % óptimo); «mantener todo» inválido en 25/25; «recortar» alcanza `efficient` en 25/25 y nunca aparece en un plan óptimo, como la escalera `LOCKED` exige; los cinco gates de Equipo / Aura / Estilo se sostienen; K 56,80 · S 28 % | Se probaron repartir todo, mantener todo, recortar todo, recortar lo no esencial y recortar-no-esencial + repartir-esencial: la mejor rinde 38,80 |
| RS-NEW-002 `g7.notebook-offer` | **PASS** | Descuentos recalculados en pesos: gana el porcentaje en 12 variantes y el descuento fijo en **14**, con **0 empates**; el texto se calcula de los dos montos, así que es verdadero en las 26 | Se buscó una comparación invertida y un caso de igualdad: ninguno |
| RS-NEW-003 Repasos numéricos | **FAIL** | Los **cinco** Repasos del alcance explícito pasan: dirección correcta en **cada** respuesta del rango presentado (2450 + 2475 + 2475 + 10 000 + 2277 respuestas enumeradas). **Pero** el alcance del contrato se extiende a «cualquier otro Repaso donde el inventario encuentre el mismo patrón», y `g7.bus-travel-review` lo incumple en 26/26 variantes (MAT-RA-001) | Se enumeró el rango completo de siete Repasos, con la dirección afirmada por cada texto mapeada a mano |
| RS-NEW-006 Ficha de 2.º | **PASS** | Las formas semánticas (`denominator` 8 · `high-response` 5 · `missing-data` 7 · `margin` 5), la regla de publicación, el cálculo de `year-prefers`, los tres vectores del Repaso y los niveles alcanzables coinciden con el runtime. No describe capacidades que el código no tenga | Revisión cruzada ficha ↔ código |

**Resultado: 13 de 14 PASS, 1 FAIL (RS-NEW-003).**

## F. Tabla R / K / S independiente

Medida con un enumerador propio, **antes** de correr `pnpm game:blind-audit`.
Escala 100 / 75 / 40 / 10.

| Template | Motor | N | R | K | Mejor respuesta constante | S | Techo | ¿Cumple? |
|---|---|---|---|---|---|---|---|---|
| `g7.bus-timing` | timeline | 26 | 48,61 | **84,62** | primera salida | 58 % | — (reportado) | ver M |
| `y5.stage-screen` | decision-card | 25 | 39,77 | **78,00** | «entera» | 40 % | K ≤ 78 · S ≤ 40 % | ✓ (en el borde) |
| `y2.data-claim-review` | classification | 25 | 30,27 | 72,60 | `TTT` | 52 % | K ≤ 75 · S ≤ 60 % | ✓ |
| `g7.mural-paint` | decision-card | 26 | 45,38 | 67,69 | lata de 4 L | 54 % | K ≤ 73 esperado | ✓ |
| `y3.transport-pass` | decision-card | 25 | 56,25 | 64,20 | posición 1 | 28 % | K ≤ R+10 = 66,25 · S ≤ 40 % | ✓ |
| `y4.represent-class` | classification | 24 | 18,82 | 59,58 | `11101` | 29 % | abstención < `efficient` | ✓ |
| `y5.final-trip-or-event` | decision-card | 25 | 56,25 | 59,40 | posición 2 | 28 % | — | — |
| `g7.notebook-offer` | decision-card | 26 | 55,00 | 58,46 | posición 1 | 54 % | — | — |
| `y2.standings-claim` | classification | 25 | 19,62 | 56,60 | posible·imposible·imposible·posible | 20 % | K ≤ 65 · S ≤ 35 % | ✓ |
| `y5.course-project-final` | classification | 25 | 13,95 | 56,80 | 4 repartir + 2 recortar | 28 % | K ≤ 65 · S ≤ 35 % | ✓ |
| `g7.bus-latest-departure` | numeric-input | 26 | 32,38 | 53,46 | 64 min | 19 % | — | — |
| `y2.course-project-survey` | classification | 25 | 17,22 | 52,80 | `011101` | 32 % | K ≤ 60 · S ≤ 35 % | ✓ |
| `y4.margin-review` | numeric-input | 25 | 12,40 | 49,80 | 6 | 40 % | — | — |
| `y4.spatial-capacity-review` | numeric-input | 25 | 12,81 | 41,40 | 72 | 20 % | — | — |
| `y3.rate-capacity-review` | numeric-input | 25 | 11,85 | 40,80 | 4 | 20 % | — | — |
| `y5.next-step-options` | classification | 25 | 21,30 | 40,00 | todo viable | 16 % | K ≤ 65 · S ≤ 35 % | ✓ |
| `y5.proportion-capacity-review` | numeric-input | 23 | 11,85 | 34,13 | 6 | 13 % | — | — |
| `g7.bus-travel-review` | numeric-input | 26 | 13,39 | 29,62 | 44 min | 12 % | — | — |
| `y3.fixed-variable-review` | numeric-input | 25 | 11,87 | 24,40 | 22 | 16 % | — | — |

**Coincidencia con `pnpm game:blind-audit`: 19 / 19 exacta**, en R, K y S, hasta el
decimal que el reporte imprime. La herramienta de producción está bien; su
**alcance** es el problema.

### Las Templates que la auditoría permanente no mide

`pnpm game:blind-audit` marca «no enumerable» a 22 Templates y no les asigna R, K
ni S: 7 de `quantity-builder`, 4 de `assignment-board`, 5 de `spatial-layout`,
4 de `schedule-builder`, 1 de `route-builder` y 1 de `number-grid`, más
`y5.multi-option-comparison-review` por su rango de 10 000 000 de valores.

Para las de cantidades, «no enumerable» es falso: el vector de cantidades tiene un
espacio chico y **se puede recorrer entero**. Al hacerlo:

| Template | Puntuable | Espacio | Mejor respuesta **constante** | K | S |
|---|---|---|---|---|---|
| `y3.course-project-tech` | **sí** (`anchor`) | 1573 | video 4 · entrevistas 4 · láminas 6 | **95,83** | **83 %** |
| `y4.course-project-fundraiser` | **sí** (`anchor`) | 630 | panchos 3 · tortas 0 · bebidas 9 | **92,80** | **92 %** |
| `y4.school-event-flow` | sí | 125 | 2 · 2 · 1 | 54,38 | 13 % |
| `g7.stand-supplies` | sí | 702 | 0 · 0 · 4 | 29,81 | 15 % |
| `y1.mobile-data` · `y1.student-day-challenge-wheel` · `y2.team-kit-order` · `y5.yearbook` | sí | — | el vector de ítems/máximos **varía** entre variantes, así que no existe una respuesta constante única | — | — |

Esa última fila es la lección de diseño: las cuatro Templates protegidas son
justo las que **cambian sus ítems o sus máximos** entre variantes. Las dos
expuestas los tienen fijos en todo el catálogo.

## G. RS-MAT-008 — prueba independiente del techo

### G.1 Modelo reconstruido

Todo en centímetros enteros, sin jerga de relación de aspecto (invariante
`LOCKED`). Pantalla `sw × sh`; imagen `iw × ih`; arriba el cartel (`banner`) con
su aire `bannerAir`; abajo la fecha (`date`) con su aire `dateAir`. El schema
exige `bannerAir + banner + date + dateAir < ih` y `iw ≤ sw`, `ih ≤ sh`.

Sea `V = ih·sw − sh·iw` lo que sobra de alto al llenar el ancho (el gate exige
`V > 0`), y `A = bannerAir·sw`, `D = dateAir·sw`.

| Forma | Pantalla usada | Válida si |
|---|---|---|
| entera con bandas | `sh·iw / (ih·sw)` | siempre (no recorta) |
| recortar por el medio | `1` | `V ≤ 2A` **y** `V ≤ 2D` |
| recortar sólo de arriba | `1` | `V ≤ A` |
| recortar sólo de abajo | `1` | `V ≤ D` |
| sin agrandar | `iw·ih / (sw·sh)` | siempre (no recorta) |
| estirar | `1` | nunca (deforma) |

Todo se decidió con racionales exactos; el factor 2 del código cancela y las
comparaciones quedan entre enteros, como pide [ADR-013](../03-architecture/adr/ADR-013-exact-rational-arithmetic.md).

Dos identidades que salen del modelo y que la prueba usa:

```text
sin-agrandar / entera = (ih / sh)²  ≤  1     porque ih ≤ sh
entera = 1 − V / (ih·sw)           <  1     porque V > 0
```

### G.2 Verificación de la materialización

La reimplementación en Python del generador reproduce **las 25 huellas SHA-256
publicadas** de `y5.stage-screen` en `grade-5-dev-4`. La geometría que se audita
es, comprobadamente, la que se publicó.

### G.3 El teorema estructural

> **Teorema.** En toda variante admisible, «entera» es `optimal` —si ningún
> recorte es válido— o **exactamente** `efficient` —si algún recorte es válido—.
> Nunca `functional`, nunca `invalid`.

*Prueba.* «Entera» y «sin agrandar» no recortan, así que siempre son válidas;
«estirar» nunca lo es.

**Caso B, ningún recorte válido.** Las válidas son «entera» y «sin agrandar», y
`sin-agrandar ≤ entera`. El gate de óptima única obliga a `sin-agrandar < entera`,
de donde «entera» es la que más pantalla usa: es `optimal`.

**Caso A, algún recorte válido.** Dos recortes válidos usarían los dos el 100 % y
empatarían en la óptima, que el gate prohíbe: **hay exactamente uno**, y es la
óptima. Las otras válidas son «entera» y «sin agrandar», las dos por debajo del
100 %. El witness es `strict` en este caso —el código pasa
`allowOneMissingIntermediate` **sólo** cuando `crops.length === 0`—, así que tiene
que existir una `efficient`: una válida, no óptima, con al menos 3/4 de pantalla.
Las únicas candidatas son «entera» y «sin agrandar», y `sin-agrandar ≤ entera`.
Por lo tanto **`entera ≥ 3/4`**, y como no es la óptima, es `efficient`. ∎

El gate del punto 10 aprieta más: rechaza `entera ∈ (70 %, 80 %)`, así que en el
caso A «entera» usa al menos el 80 %.

**Esto es lo que se intentó falsar primero y no se pudo.** La hipótesis era que el
punto 10, al permitir explícitamente `entera ≤ 70 %`, dejaba construir un catálogo
con «entera» en `functional` y un `K` mucho más bajo —del orden de 47—. Es falsa:
el witness estricto lo cierra, porque con `entera < 3/4` no queda ninguna
`efficient` en el espacio de la variante.

Corroboración numérica, en dos barridos independientes:

| Barrido | Aire | Combinaciones | Admisibles | Violaciones |
|---|---|---|---|---|
| Espacio **alcanzable** por el generador | el que `airsFor` produce (papel × paridad) | 19 008 tuplas distintas | **7 605** | **0** |
| Espacio **más amplio** | libre dentro del schema | **8 256 786** | **392 751** | **0** |

En el barrido amplio: «entera» `optimal` en 151 821 y `efficient` en 240 930.
Nunca otra cosa.

### G.4 La cota inferior, en enteros

Del teorema, con `w` = proporción de variantes sin recorte válido:

```text
K  ≥  media(entera)  =  100·w + 75·(1 − w)  =  75 + 25·w
```

`K` es un **máximo** sobre respuestas constantes, así que esa desigualdad vale sin
importar qué hagan las otras cinco formas.

Con `N = 25`, sean `c`, `t`, `b`, `e` las variantes donde la óptima es el recorte
por el medio, el de arriba, el de abajo y «entera». Entonces `c + t + b + e = 25` y:

- **punto 7**: cada una ≤ 40 % → `c, t, b, e ≤ 10`; y al menos 3 no nulas;
- **punto 9**: la heurística «recortar todo del lado con más aire» acierta
  **exactamente** en las variantes de recorte de un solo lado —si el recorte de un
  lado entra en su aire y el del otro no, ese lado es el de más aire—, así que
  `t + b ≤ 12`.

De donde `e ≥ 25 − 10 − 12 = 3`, y:

```text
K  ≥  (3·100 + 22·75) / 25  =  1950 / 25  =  78,0
```

**Enumeración entera exhaustiva.** Se recorrieron **todos** los vectores
`(c, t, b, e)` que suman 25 y cumplen los puntos 7 y 8 y 9: **338** son factibles,
y el mínimo de `75 + 25·e/25` sobre ese conjunto es **exactamente 78,000**.
`K < 78` es **infactible**; `K = 78` es **factible**, con `e = 3`.

### G.5 El catálogo publicado

Recalculado desde cero, sin llamar a `tierOf` como oráculo:

| Respuesta constante | Suma | Media | Óptima en | Histograma |
|---|---|---|---|---|
| **entera** | **1950** | **78,00** | 3 | `efficient` 22 · `optimal` 3 |
| recortar por el medio | 1150 | 46,00 | 10 | `optimal` 10 · `invalid` 15 |
| sin agrandar | 1035 | 41,40 | 0 | `functional` 24 · `efficient` 1 |
| recortar sólo de arriba | 790 | 31,60 | 6 | `optimal` 6 · `invalid` 19 |
| recortar sólo de abajo | 790 | 31,60 | 6 | `optimal` 6 · `invalid` 19 |
| estirar | 250 | 10,00 | 0 | `invalid` 25 |

```text
K = 78,00   R = 39,77   S = 40 %
```

Y los once criterios, uno por uno: dos elementos protegidos ✓ · seis formas ✓ ·
validez exacta en enteros ✓ · escalera con óptima única en 25/25 ✓ · consigna
completa ✓ · **IM-1 en 25/25** ✓ · óptima repartida en **cuatro** formas, máximo
40 % ✓ · ningún nivel constante salvo estirar ✓ · **heurística de lado 12/25 =
48 %** ≤ 50 % ✓ · uso de «entera» entre 69,5 % y 86,5 %, **0 variantes** en
(70 %, 80 %) ✓ · el detalle no revela el recorte ✓.

### G.6 Conclusión

**`K = 78` es genuinamente el mínimo factible al tamaño del catálogo publicado, y
el catálogo lo alcanza.** La remediación sobrevivió el ataque.

Una precisión que corrige a la adjudicación previa: afirma que «25 es el tamaño
que minimiza el techo». Eso es **falso**. El mismo argumento da
`K_min = 75 + 25·⌈N/10⌉/N`, que vale **77,5** para todo `N` múltiplo de 10
—`N = 10, 20, 30, 40, 50, 60`— y 77,885 para `N = 26`. La cifra de `N = 24`
(78,125) sí se reproduce. Nada de esto afecta al contrato —el techo `K ≤ 78` se
cumple y 78 es exactamente el mínimo en `N = 25`—, pero la frase es un exceso
documental (MAT-RA-007).

## H. Auditoría del alcance de la excepción de witness

La excepción `allowOneMissingIntermediate` existe en `src/content/authoring.ts` y
relaja el witness a «una óptima **más** alguna válida por debajo».

**Alcance real, medido sobre todo el árbol:** `tierWitnessIssues` tiene **22
llamadas** en `src/content/`. **Veintiuna pasan el modo por defecto (`strict`).**
La única que pasa un modo es `stage-screen.ts:407`, y lo hace condicionado:

```ts
crops.length === 0 ? 'allowOneMissingIntermediate' : 'strict'
```

No hay propagación accidental a ninguna otra Template.

**Uso efectivo en el catálogo publicado:** exactamente **3** de 25 variantes
—índices 2, 10 y 18, las de cero recortes válidos—, y cada una le falta
**exactamente un** nivel intermedio:

| Variante | Niveles presentes | Falta |
|---|---|---|
| 2 (`sin-aire-grande`) | entera `optimal` · sin agrandar `efficient` · tres recortes y estirar `invalid` | `functional` |
| 10 (`sin-aire`) | entera `optimal` · sin agrandar `functional` · resto `invalid` | `efficient` |
| 18 (`sin-aire`) | entera `optimal` · sin agrandar `functional` · resto `invalid` | `efficient` |

Las 22 variantes con algún recorte válido conservan el witness completo. La
excepción es exactamente la que D-S08-114 autorizó, y el papel
`sin-aire-grande` existe para que «sin agrandar» no tenga nivel constante
(punto 8) — lo que mi medición confirma: varía entre `functional` (24) y
`efficient` (1).

## I. Inventario de feedback afirmativo, verificado de forma independiente

Se recorrieron **todas** las respuestas de **todas** las variantes de las 19
Templates enumerables y se recogieron los textos de `consequence`,
`optimalComparison` y `violatedConstraint` que realmente se producen: **1576
cadenas distintas**, de las cuales **35** son constantes autoradas que afirman una
comparación, una dirección o una causa y aparecen en al menos la mitad del
catálogo de su Template.

Clasificación independiente:

| Clase | Cantidad | Ejemplos |
|---|---|---|
| **A** — verdadera en toda variante donde se muestra | 34 | «Era el envase más barato entre los que alcanzaban para toda la pared» (el gate lo garantiza); «Entrás caminando, con tiempo de sobra» |
| **B** — calculada de la variante o de la respuesta | la mayoría de las 1541 restantes | «Con 50 min alcanzaba: pediste 16 de más»; `discountComparison`; las dos ramas direccionales de los cinco Repasos del alcance |
| **C** — falsa o no probada | **1** | `g7.bus-travel-review` · «Faltaba sumarle el viaje normal» → **MAT-RA-001** |

La dirección de cada texto direccional se mapeó **a mano** a la dirección que
afirma, y se comparó con el signo de `respuesta − exacta` en **cada** respuesta
del rango presentado:

| Repaso | Respuestas enumeradas | Afirmaciones direccionales | Falsas |
|---|---|---|---|
| `y3.fixed-variable-review` | 2450 | 2450 | 0 |
| `y4.margin-review` | 2475 | 2288 | 0 |
| `y3.rate-capacity-review` | 2475 | 2475 | 0 |
| `y4.spatial-capacity-review` | 10 000 | 10 000 | 0 |
| `y5.proportion-capacity-review` | 2277 | 2277 | 0 |
| `g7.bus-latest-departure` | 3120 | 1381 | 0 |
| **`g7.bus-travel-review`** | 3120 | 52 | **26** |

> **Nota metodológica.** Un primer pase con detección de dirección por expresiones
> regulares genéricas dio **dos** falsos positivos y varios falsos negativos: marcó
> como invertida «Entra más de lo que contaste» —que es correcta: el sujeto es la
> capacidad, no el número del jugador— y **no evaluó en absoluto** las dos ramas de
> `y3.fixed-variable-review`, porque ningún patrón las matcheaba. Se descartó el
> método y se rehízo con un mapeo explícito texto → signo afirmado. Sin ese
> segundo pase, el informe habría declarado «consistente» algo que no había medido.

## J. Auditoría de políticas ingenuas en las Templates de construcción

Nueve familias de política, aplicadas a las 22 Templates de construcción sobre
todas sus variantes aprobadas. Las más fuertes:

| Política | Template | Media | Óptima en |
|---|---|---|---|
| empaque fila a fila desde el origen | `y1.scale-fit-review` | **100,00** | **24 / 24** |
| la mitad de cada máximo | `y3.course-project-tech` | 81,25 | 19 / 24 |
| sólo el primer ítem, al máximo | `y4.course-project-fundraiser` | 54,20 | 3 / 25 |
| todo de a uno | `y4.school-event-flow` | 42,92 | 0 / 24 |
| orden presentado | `y3.route-plan` | 40,00 | 8 / 24 |
| reparto cíclico entre personas | `y1.course-project-expo` | 54,20 (como constante real) | 0 / 25 |

Las políticas triviales —no hacer nada, todo al máximo, todo al mínimo, todo a la
primera persona, más temprano posible, más tarde posible— rinden **10,00** en
casi todas: las Templates de construcción están, en general, bien protegidas
contra la respuesta vacía o saturada.

Dos excepciones son hallazgos: `y1.scale-fit-review` (MAT-RA-004) y, al pasar de
«política» a **respuesta constante exhaustiva**, `y3.course-project-tech` y
`y4.course-project-fundraiser` (MAT-RA-002 y MAT-RA-003, sección O).

`y1.course-project-expo` merece una aclaración: el reparto cíclico rinde 72,40
como *política* —porque se recalcula con los ids de cada variante— pero **54,20**
como respuesta **constante** real, y nunca es óptima. No es un hallazgo.

## K. Score · replay · servidor · catálogos

### FairScore

`fair-score-dev-2@2.0.0-post-tg1-candidate`, `official=false`, **sin cambios**:
pesos `math 8500 · team 1000 · aura 500` (85 / 10 / 5, suman 10 000), escalera
`10000 / 7500 / 4000 / 1000` (100 / 75 / 40 / 10), premio por banda
`core 1,00 · standard 1,08 · stretch 1,15`, topes 10 000. `src/game/` **no fue
tocado** por la remediación: el único cambio fuera de contenido y tests es un
`min-w-0` de reflow en `src/components/game/decision-block.tsx`.

**Recomputación fuera del scorer de producción.** Se reimplementó la agregación
con aritmética propia y se comparó contra `aggregate()` en ocho casos, incluidos
los bordes:

| Caso | Producción | Independiente |
|---|---|---|
| perfecto, 9 beats de bandas mezcladas | 10 000 | 10 000 |
| todo inválido, 9 beats | 1 000 | 1 000 |
| escalera mezclada, 6 beats | 6 676 | 6 676 |
| «entera» ciega: 22 `efficient` + 3 `optimal` | 7 800 | 7 800 |
| sólo Math, sin oportunidad de Equipo ni Aura | 8 750 | 8 750 |
| Equipo y Aura al máximo | 10 000 | 10 000 |
| Equipo presente pero en cero, Aura ausente | 8 947 | 8 947 |
| Equipo a un tercio, Aura completa | 8 471 | 8 471 |

**8 / 8 coinciden.** `pnpm game:score` sobre 23 000 planes: perfecto 10 000 exacto
con `spread` 0, piso 0, y neutralidad de oportunidad confirmada —perfecto con y
sin oportunidad de Equipo y de Aura da 10 000 en los cuatro casos—, 0 empates de
redondeo. Estilo no entra al score competitivo (`careerEffects.estilo` no es
componente). Los Repasos no puntúan: `placement: 'recovery'`, con el `rationale`
explícito en cada uno.

### Recuperación y egreso

Barrido adversarial propio, siete políticas sobre la carrera completa real:

| Política | Beats | Egresa | Repasos | Previas | Máx. Repasos por etapa |
|---|---|---|---|---|---|
| todo óptimo | 9 | sí | 0 | 0 | 0 |
| todo `efficient` | 9 | sí | 0 | 0 | 0 |
| todo `functional` | 9 | sí | 0 | 0 | 0 |
| **todo inválido** | 13 | **sí** | 4 | 4 | **1** |
| inválido alternado | 11 | sí | 2 | 1 | 1 |
| dos inválidos por etapa | 11 | sí | 2 | 1 | 1 |
| aleatoria | 11 | sí | 2 | 2 | 1 |

El Repaso se dispara **sólo** con INVALID —las tres políticas sin inválidos dan
0 Repasos—, **como máximo uno por etapa** en las siete políticas, sin recursión
(los beats quedan acotados) y **todas las carreras egresan**. `pnpm
game:simulate:deep`: 5000 / 5000 completadas, 5000 / 5000 egresadas, peor caso 1
Repaso por run, 0 hallazgos.

### Frontera de confianza del servidor

Intentos de manipulación reales sobre el log serializado de las siete carreras:

| Intento | Resultado |
|---|---|
| replay determinista del log exacto | **reproduce** el mismo estado y egreso, 7 / 7 |
| el servidor recomputa el puntaje | sí, 7 / 7, desde el replay |
| inyectar `officialScore: 999999` en el payload | **aceptado e ignorado**: el servidor devuelve el puntaje recomputado (13 104, 4 845, 8 851, 11 213, 9 050, 10 348, 5 278) |
| falsear `contentVersion: 9.9.9-forged` | **rechazado** · `unsupported-version` |
| falsear `planFingerprint: deadbeef` | **rechazado** · `unsupported-version` |

La compatibilidad de versiones es **igualdad exacta** en las tres
(`gameVersion`, `rulesetVersion`, `contentVersion`): la ambigüedad de versión
**falla cerrada**, no resuelve de más.

### Catálogos y versionado

`pnpm game:variants check` hace una comparación **byte a byte** contra el artefacto
comiteado, más verificación de integridad. Corrida sobre los seis:

| Catálogo | Intentadas | Aprobadas | Rechazadas | Duplicadas | Integridad | Rebuild byte-idéntico |
|---|---|---|---|---|---|---|
| `grade-1-dev-2` | 487 | 359 | 95 | 33 | ok | ✓ |
| `grade-2-dev-3` | 711 | 508 | 149 | 54 | ok | ✓ |
| `grade-3-dev-3` | 1140 | 681 | 400 | 59 | ok | ✓ |
| `grade-4-dev-3` | 1653 | 853 | 736 | 64 | ok | ✓ |
| `grade-5-dev-4` | 1873 | 1026 | 776 | 71 | ok | ✓ |
| `grade-7-dev-6` | 237 | 185 | 26 | 26 | ok | ✓ |

- Los **cinco catálogos históricos de 7.º** (`dev-1` a `dev-5`) son **byte-idénticos**
  a `9ea3896`.
- **7 generadores** subieron `1 → 2`, y cada uno con un cambio real de espacio:
  encuesta `144 → 6912`, Repaso del denominador `48 → 320`, tabla `90 → 2 097 152`,
  transporte `64 800 → 129 600`, muestra final `1296 → 15 552`, año que viene
  `972 → 58 320`. `y5.stage-screen` conserva la cardinalidad 1944 pero reescribió
  sus ejes por completo, así que el bump también corresponde. **34 generadores sin
  tocar**: ningún bump gratuito.
- Motor, action log y snapshot **sin subir**, como el contrato exige.
- Huellas: recalculadas de forma independiente para 350 entradas, **350 / 350**.

Dos observaciones de alcance, no defectos del contrato:

1. `pnpm game:variants check` **sin argumento** audita **sólo 7.º**. Los catálogos
   de 1.º a 5.º necesitan `--content=grade-N`, que la verificación de cierre de la
   remediación no nombra. Los seis se corrieron en esta re-auditoría.
2. Los catálogos viejos de 1.º a 5.º **no se conservan**: la convención del
   repositorio los **renombra** a la versión siguiente (`grade-5-dev-1 → dev-2 →
   dev-3 → dev-4`), mientras 7.º sí guarda todas sus versiones. Una run que
   declarara `grade-5-dev-2` no se puede resolver hoy. Es convención **preexistente**
   —el renombre `dev-1 → dev-2` es de `9233160`, muy anterior a la remediación—,
   el contenido de 1.º a 5.º está en `draft` y la edición es `official: false`, y el
   sistema **falla cerrado**. Queda registrado como MAT-RA-009 para cuando STAGE-09
   oficialice.

## L. Presentación matemática y accesibilidad

Los 158 E2E de Playwright están en verde, e incluyen las pantallas remediadas a
los anchos pedidos:

| Comprobación | Evidencia |
|---|---|
| Las **seis** formas de la pantalla del acto, legibles a 320 y 412 px | `grade-5.spec.ts`: `toHaveCount(6)`, los dos elementos protegidos visibles con su aire, la consigna «sin cortar el cartel ni la fecha» visible |
| Sin desborde horizontal de página | helper `reflow()` en estado vacío, respondido y de resultado, por ancho |
| Teclado | `tabTo` + `Space` + `Enter` hasta el envío, en las pantallas remediadas |
| Foco del resultado | `feedback-heading` recibe el foco tras responder |
| axe sin violaciones | `noAxeViolations()` en 9 de los 9 specs |
| Reflow y zoom del audit | 320 · 360 · 390 · 412 a zoom 1 y **1280 a zoom 2**, todos en verde |
| Regla del transporte, condiciones de la peña | specs de 3.º y 4.º, a 320 / 412 px |

El único cambio de UI de toda la remediación es un `min-w-0` en
`decision-block.tsx`, que arregla un desborde a 320 px en la entrada numérica con
unidad al lado. Es endurecimiento, no cambio semántico.

## M. D-S08-111 — `g7.bus-timing`

### Medición independiente

Confirmada **exactamente**: `K = 84,62`, y la estrategia es **«tomar siempre la
primera salida»**.

| Posición | Significado | Media | Óptima en | Histograma |
|---|---|---|---|---|
| 0 | la salida más temprana | **84,62** | 10 / 26 | `optimal` 10 · `efficient` 16 |
| 1 | la segunda | 75,96 | **15 / 26** | `optimal` 15 · `functional` 10 · `efficient` 1 |
| 2 | la tercera | 23,85 | 1 / 26 | `invalid` 16 · `functional` 9 · `optimal` 1 |
| 3 | la última | 10,00 | 0 | `invalid` 26 |

`R = 48,61`, `S = 58 %` (de la posición 1). Es el **K más alto y el S más alto de
las 19 Templates enumerables**.

### Por qué

La salida más temprana deja el **mayor** margen, así que nunca llega tarde
(`invalid`) y nunca queda por debajo del margen seguro de 5 min (`functional`).
Sus únicos niveles posibles son `optimal` —cuando además es el margen seguro más
chico— y `efficient`. El piso es **estructural**, y es la misma álgebra que
`y5.stage-screen`:

```text
K  ≥  75 + 25·w        w = 10/26 en el catálogo publicado
```

### Contrapartidas

No hay contrapartida **puntuada**. Los cuatro niveles dan **sólo Estilo**
(`improvisador` / `estratega` / `estratega` / `aplicado`, amount 8), y Estilo no
entra al score competitivo. El costo real de madrugar —9,1 min perdidos de
promedio, hasta 25— no se cobra en ninguna parte.

### Clasificación

```text
ASSESSMENT-VALIDITY FINDING — NON-BLOCKING
```

**Por qué no es BLOCKING.** La matemática de la Template es **correcta**: nada se
enseña mal. La escalera trata «seguro pero temprano» como `efficient` de forma
deliberada y defendible —llegar temprano no es un error de cálculo—, y bajar ese
piso exige **cambiar la escalera** (que «desperdiciar tiempo» pase a
`functional`), que es una decisión de producto y pedagogía, no una corrección de
un defecto. Ningún contrato de la remediación cubre esta Template: la sección 3
sólo pide **reportar** su R/K/S, y eso se hace.

**Por qué no es NO ISSUE ni ACCEPTABLE RISK.** La estrategia entrega el 84,6 % de
la escala sin hacer la cuenta del porcentaje de demora, que es el constructo
completo de la Template, y sin ninguna contrapartida competitiva. Es la exposición
más alta del catálogo y supera todos los techos que la remediación fijó. Llamarlo
«sin problema» sería exactamente el error que este gate existe para evitar.

Queda para revisión humana / de producto, con una nota: si alguna vez se le fija
un techo, la misma álgebra dice que el mínimo alcanzable sin tocar la escalera es
`75 + 25·⌈N·w_min⌉/N`, y que bajar de 75 **requiere** tocarla.

## N. Preservación de las decisiones aceptadas

| Hallazgo | Decisión | Estado independiente |
|---|---|---|
| MAT-010 | `ACCEPT_AS_DESIGNED` | **Intacto.** El diff de `notebook-offer.ts` es **sólo** el texto de acierto, ahora calculado. La decisión binaria, los dos niveles alcanzables y `notebook-offer.variants.ts` **no se tocaron**; la población es la misma en `grade-7-dev-6` |
| MAT-012 | `ACCEPT_WITH_DOCUMENTED_RISK` | **Intacto.** 42 Templates antes y 42 después: **ninguna** Template nueva, ni de probabilidad ni de funciones |
| MAT-013 | `ACCEPT_WITH_DOCUMENTED_RISK` | **Intacto.** Competition Seed, intentos y reintentos viven en `src/game/`, que no cambió |
| MAT-006 (parte aceptada) | aceptada | **Intacto.** `mural-paint.ts` **sin cambios**; tres niveles, sin `efficient`; litros requeridos 1,008–3,840, así que 1 L **nunca** alcanza. El balance 2 L / 4 L se logró con un gate de catálogo (`validateMuralBalance`), que es exactamente lo que el criterio 2 autoriza |
| MAT-007 (parte aceptada) | aceptada | **Intacto.** No se persiguió un cuarto nivel: la abstención total es `functional` en 24/24, como consecuencia y no como objetivo |

Ninguna decisión aceptada fue alterada. Tampoco apareció evidencia que las
contradiga.

## O. Hallazgos nuevos

### MAT-RA-001 · HIGH · BLOQUEANTE · `g7.bus-travel-review`

**Categoría:** feedback falso · dirección y causa · clasificación errónea del inventario.

**Reproducción.** En cualquier variante aprobada, responder
`respuesta_exacta + viaje_normal`. Por ejemplo `c00000`: viaje normal 20 min,
demora 10 %, viaje de hoy **22** min. Responder **42**.

**Resultado:** nivel `functional` (40 puntos) y el texto
**«Faltaba sumarle el viaje normal.»**

**Evidencia primaria.** `src/content/grade-7/challenges/bus-travel-review.ts`:

```ts
const gap = Math.abs(toNumber(subtract(submitted, fromInteger(model.travelMinutes))))
const answeredExtra = gap === model.scheduledMinutes
```

**Matemática independiente.** La prueba busca detectar que el jugador contestó
`extraMinutes` —la demora sola, olvidando sumar el viaje normal—, y en ese caso
`|extra − travel| = scheduled`. Pero `gap` es un **valor absoluto**, así que la
ecuación `|x − travel| = scheduled` tiene **dos** raíces:

```text
x = travel − scheduled = extra      ← la concepción errónea real (POR DEBAJO)
x = travel + scheduled              ← ni es la concepción errónea (POR ENCIMA)
```

En la segunda el jugador **se pasó** por exactamente el viaje normal —contó el
viaje normal dos veces— y el juego le dice que le **faltaba sumarlo**. La
dirección afirmada es la **opuesta** al signo de `respuesta − exacta`, y la causa
afirmada es falsa.

**Alcance:** **26 de 26** variantes aprobadas. El valor gemelo cae dentro del rango
presentado `[0, 120]` en todas: 42, 108, 90, 99, 80, 72, 81, 72, 96, 90, 66, 84,
55, 43, 100, 63, 45, 86, 84, 77, 44, 60, 48, 70, 63, 75.

**Impacto.** Incumple **RS-NEW-003 criterio 1**, cuyo alcance es explícitamente
«cualquier otro Repaso donde el inventario encuentre el mismo patrón», y la
**regla transversal 2.9**. Además otorga `functional` (40) en lugar de `invalid`
(10) a una respuesta más lejana que muchas inválidas.

**Lo que agrava el hallazgo.** El inventario **sí** examinó esta cadena y la
clasificó **A — probada verdadera**, con la justificación *«se muestra sólo si la
respuesta es la demora sola»*. Esa premisa es falsa: el código no la cumple. No
fue una omisión de alcance, fue una clasificación basada en la intención del
código y no en su condición de rama.

**Atenuantes honestos.** Es un Repaso: `placement: 'recovery'`, puntaje 0, fuera de
FairScore. No hay exploit competitivo. Y el defecto es **preexistente** —commit
`ad7852a`—: la remediación no lo introdujo, no tocó el archivo.

**Blocking:** **sí**, por §20 («cualquier C sobre una afirmación matemática
material ⇒ RE-AUDIT FAIL») y porque un contrato queda incumplido. Enseña
matemática al revés, en el momento pedagógicamente más sensible: la recuperación.

**Próximo gate:** remediación, dentro del alcance de RS-NEW-003.

---

### MAT-RA-002 · BLOCKER · BLOQUEANTE · `y3.course-project-tech`

**Categoría:** atajo de estrategia ciega · respuesta constante · Template puntuable.

**Reproducción.** Enviar siempre, en cualquier variante:
**video 4 · entrevistas 4 · láminas 6** (máximos 10 · 10 · 12, así que es un envío
válido).

**Matemática independiente.** Búsqueda **exhaustiva** sobre los **1573** vectores
constantes posibles:

```text
K = 95,83     óptima en 20 / 24 = 83 %     histograma: optimal 20 · efficient 4
```

La escalera es `optimal` si las tres entregas llegan a su `target`, `efficient`
con dos, `functional` con una o ninguna, e `invalid` si se pasa de minutos de
notebook, de megabytes, de minutos de laboratorio o no llega a algún `minimum`.

**Causa.** Los **máximos de los ítems son constantes en todo el catálogo**
(10 · 10 · 12), mientras los `target` por variante sólo recorren
`{3,4,5} × {2,3,4} × {3,4,5,6}`. Existe entonces un vector que **domina todos los
targets a la vez**, y los tres topes de recurso sólo lo invalidan en 4 de 24. El
gate comprueba que «todo al máximo» sea inválido, pero **nunca** comprueba que no
exista un vector constante ganador.

**Impacto.** `placement: 'anchor'`, `math: 'discrete-quality'`: es **puntuable**,
entra a FairScore. Un jugador que memoriza seis números obtiene el 95,8 % de la
escala sin leer ningún dato, contra un `R = 13,95` aproximado para la respuesta
aleatoria. Es **más alto que cualquier techo** que la remediación fijó (el máximo
fue 78, tras una prueba de imposibilidad) y del mismo orden que el
`K 92,5 · S 91,7 %` de `y5.course-project-final` que la adjudicación clasificó
`REQUIRED_CORRECTION` P0.

**Blocking:** **sí**. Exploit competitivo material que derrota el constructo
—leer tres presupuestos de recurso y acertar tres objetivos—.

**Próximo gate:** adjudicación y remediación nuevas, con techo y gate de respuesta
constante.

---

### MAT-RA-003 · BLOCKER · BLOQUEANTE · `y4.course-project-fundraiser`

**Categoría:** atajo de estrategia ciega · respuesta constante · Template puntuable.

**Reproducción.** Enviar siempre **panchos 3 · tortas 0 · bebidas 9**
(máximos 8 · 6 · 9).

**Matemática independiente.** Exhaustiva sobre **630** vectores constantes, y
además **verificada a mano** desde los parámetros crudos de las 25 variantes:

```text
K = 92,80     óptima en 23 / 25 = 92 %     histograma: optimal 23 · invalid 2
```

Recalculado a mano, `ganancia = ingreso − variable − costoFijo` queda **muy por
encima** de `target + reserve` en 23 variantes; las dos que fallan son las de tope
de cocina 150 min, donde el plan usa 210.

**Causa.** Los máximos de los ítems son constantes (8 · 6 · 9), precios y costos
varían poco, y `target + reserve` es chico frente a lo que rinde una producción
casi máxima. Sólo el tope de cocina muerde.

**Impacto.** `placement: 'anchor'`: **puntuable**. Y hay una ironía de contrato:
RS-MAT-011 declaró para esta Template **«Mediciones. Ninguna de estrategia
ciega.»** Esa declaración queda **falsada por medición**: tiene una de las peores
exposiciones del catálogo.

**Blocking:** **sí**, por las mismas razones que MAT-RA-002.

**Próximo gate:** adjudicación y remediación nuevas.

---

### MAT-RA-004 · MEDIUM · no bloqueante · `y1.scale-fit-review`

**Categoría:** validez de evaluación · Repaso trivializado · dato regalado en la presentación.

Una política ingenua —**empacar de izquierda a derecha desde el origen**— es
`optimal` en **24 de 24** variantes. Las variantes tienen `blocked: []`,
`aisle: []`, `doors: []`, `height: 1` y tres objetos de una celda de profundidad
con holgura sobrante: **siempre entran**.

Y el paso que el Repaso existe para practicar —«Pasá cada medida a celdas antes de
ubicar», dice su propia consigna— viene **pre-calculado** en la presentación:

```ts
widthCells: object.widthCm / p.cellCm,
heightCells: object.depthCm / p.cellCm,
```

**No bloqueante:** es un Repaso (`placement: 'recovery'`), puntaje 0, fuera de
FairScore, sin exploit competitivo y sin afirmación falsa. Pero es la misma clase
de defecto —`K` y `S` al 100 % en un Repaso— que la adjudicación trató como P0
para el Repaso del denominador (RS-MAT-002).

---

### MAT-RA-005 · MEDIUM · no bloqueante · `g7.bus-timing`

`K = 84,62 · S = 58 %`. Adjudicado en la sección M como
`ASSESSMENT-VALIDITY FINDING — NON-BLOCKING`.

---

### MAT-RA-006 · LOW · no bloqueante · alcance de la auditoría permanente

**Causa raíz común de MAT-RA-002, 003 y 004.** La sección 3 del contrato define la
auditoría permanente sobre las Templates «cuyo espacio de respuestas es finito:
tarjeta de decisión, clasificación con hasta 50.000 respuestas y entrada numérica
sobre el rango presentado». Las **22** Templates de construcción quedan fuera **por
construcción**, y `pnpm game:blind-audit` las imprime como «no enumerable».

Para las siete de cantidades eso es **falso**: el espacio de vectores constantes
tiene 125 a 1573 elementos y se recorre entero en segundos. La auditoría permanente
tiene un punto ciego del **52 %** del catálogo (22 de 42 Templates), y ahí viven las
dos peores exposiciones medidas.

**Recomendación:** extender la auditoría a una búsqueda exhaustiva de respuesta
constante donde el espacio lo permita, y a políticas ingenuas con oráculo donde no.

---

### MAT-RA-007 · OBSERVATION · exceso documental en la adjudicación del techo

`rs-mat-008-blind-ceiling-final-adjudication.md` afirma «25 es el tamaño que
minimiza el techo». Es falso: `K_min = 75 + 25·⌈N/10⌉/N` vale **77,5** para todo
`N` múltiplo de 10 y 77,885 para `N = 26`. La cifra de `N = 24` (78,125) sí se
reproduce. No afecta al contrato: el techo `K ≤ 78` se cumple y 78 **es**
exactamente el mínimo en `N = 25`, el tamaño publicado.

---

### MAT-RA-008 · OBSERVATION · flake de test por timeout bajo carga

`tests/unit/architecture-lint.test.ts` → «rejects implicit nondeterminism in
`export const value = Math.random()`» **falló una vez** dentro de `pnpm verify`:

```text
Error: Test timed out in 5000ms.
```

Duración medida: **5575 ms**, contra el `testTimeout` por defecto de 5000 ms. El
test levanta una instancia real de ESLint.

Tres corridas, para caracterizarlo en vez de descartarlo:

| Corrida | Resultado |
|---|---|
| `pnpm verify` (incluye `vitest run --coverage`) | **falla**, 5575 ms > 5000 ms |
| el archivo aislado (`vitest run tests/unit/architecture-lint.test.ts`) | **pasa**, 26 / 26 en 2,13 s |
| `pnpm test` completo, **sin** `--coverage` | **pasa**, 95 / 95 archivos y 1739 / 1739 tests, exit 0 |

- **Naturaleza:** no determinista, dependiente de carga y entorno, no de lógica.
  Aparece sólo con la instrumentación de cobertura encima.
- **Efecto sobre la validez de la auditoría:** ninguno. La política de lint que
  afirma está intacta —verificado por la corrida aislada— y ninguna conclusión
  matemática depende de ese test.
- **No se tocó** el `testTimeout` ni ningún umbral: corregirlo es trabajo de
  producto y este gate es de sólo lectura.

---

### MAT-RA-009 · OBSERVATION · alcance del replay de los catálogos de 1.º a 5.º

Los catálogos viejos de 1.º a 5.º se **renombran** en vez de conservarse, así que
una run que declarara `grade-5-dev-2` no resuelve hoy. 7.º sí conserva `dev-1` a
`dev-6`. Convención **preexistente** (`9233160`), contenido en `draft`, edición
`official: false`, y el sistema **falla cerrado**. A resolver antes de que
STAGE-09 oficialice.

---

### MAT-RA-010 · OBSERVATION · deriva de conteos en la etapa actual

`current-stage.md` declaraba 1723 tests + 2 `todo` y 154 E2E; lo medido es **1739
tests, 0 `todo` y 158 E2E**. Corregido en esta entrega.

---

### Resumen

| Severidad | Cantidad | Bloqueantes |
|---|---|---|
| BLOCKER | 2 | 2 |
| HIGH | 1 | 1 |
| MEDIUM | 2 | 0 |
| LOW | 1 | 0 |
| OBSERVATION | 4 | 0 |
| **Total** | **10** | **3** |

## P. Comparación con lo que la remediación afirmó

Leída **después** de toda la derivación independiente.

| Afirmación de la implementación | Resultado independiente | ¿Coincide? |
|---|---|---|
| Motor 10.0.0 · log 7 · snapshot 8 · ruleset `1.0.0-full-career` | idénticos | ✓ |
| FairScore sin cambios, 85/10/5, 100/75/40/10 | `src/game/` sin tocar; recomputado fuera del scorer, 8/8 | ✓ |
| 95 archivos · 1739 tests · 0 `todo` · 158 E2E | 95 · 1739 · 0 · 158 | ✓ |
| Perfecto 10 000 · simulación 5000/5000 | 10 000 `spread` 0 · 5000/5000, 0 hallazgos | ✓ |
| `grade-5-dev-4` · `5.3.0-grade-5` · 42 Templates | 1026 entradas, 42 Templates, rebuild byte-idéntico | ✓ |
| transporte K 64,2 · S 28 % · óptimas 7·6·6·6 · `pocos-viajes` 8 · cruce 15/25 | 64,20 · 28 % · 7·6·6·6 · 8 · 15/25 | ✓ |
| Repaso del denominador K 72,6 · S 52 % · `TF` 13 · `TT` 6 · `FF` 6 | 72,60 · 52 % · 13 · 6 · 6 | ✓ |
| encuesta K 52,8 · S 32 % · `year-prefers` 5/25 · 7 claves · contraste 15/25 | 52,80 · 32 % · 5 · 7 · 15/25 | ✓ |
| tabla K 56,6 · S 20 % · categorías máx 17·14·15·12 | 56,60 · 20 % · 17·14·15·12 | ✓ |
| mural 14/26 y 12/26 (53,8 % · 46,2 %) · K 67,7 | 14 · 12 · 53,8 % · 46,2 % · 67,69 | ✓ |
| consejo: 2 viables en 19, 3 en 5 · abstención siempre `functional` | 19 y 5 · `functional` 24/24 | ✓ |
| año que viene K 40,0 · S 16 % · viabilidad 13·16·12·15·12 · estudio 22/25 | 40,00 · 16 % · idénticos · 22/25 | ✓ |
| muestra final K 56,8 · S 28 % · repartir todo óptimo 0/25 · recortar `efficient` 25/25 | 56,80 · 28 % · 0/25 · 25/25 | ✓ |
| notebook: gana el fijo en 14 de 26, 0 empates | 12 porcentaje · **14** fijo · 0 empates | ✓ |
| **pantalla K 78,0 · S 40 %** · centro 10 · arriba 6 · abajo 6 · entera 3 | idénticos | ✓ |
| entera `efficient` 22 · `optimal` 3 · sin agrandar `functional` 24 · `efficient` 1 · estirar `invalid` 25 | idénticos | ✓ |
| heurística de lado 12/25 = 48 % · IM-1 25/25 · uso de entera 69,5–86,5 % | idénticos | ✓ |
| excepción de witness: 3 exentas, un solo nivel intermedio ausente cada una | índices 2, 10, 18; falta `functional`, `efficient`, `efficient` | ✓ |
| `K_min_feasible = 1950/25 = 78,0`, `K < 78` imposible | **re-probado** por deducción + enumeración entera exhaustiva (338 repartos factibles, mínimo 78,000) | ✓ |
| «en todas las admisibles entera es `optimal` o `efficient`» (116 045 variantes barridas) | **confirmado** y además **demostrado deductivamente**; mi barrido amplio: 392 751 admisibles de 8 256 786, **0 violaciones** | ✓ (conteos distintos, explicado abajo) |
| «N = 24 da K ≥ 78,125» | 78,125 | ✓ |
| «25 es el tamaño que minimiza el techo» | **falso**: 77,5 para todo `N` múltiplo de 10 | ✗ **MAT-RA-007** |
| RS-NEW-003: dirección correcta en los cinco Repasos del alcance | correcta en los cinco, enumerados enteros | ✓ |
| inventario: `g7.bus-travel-review` «Faltaba sumarle el viaje normal» = clase **A**, «se muestra sólo si la respuesta es la demora sola» | **falso**: la rama tiene dos raíces y dispara también en `travel + scheduled`, en 26/26 | ✗ **MAT-RA-001** |
| RS-MAT-011: «Mediciones. Ninguna de estrategia ciega» | **falsado por medición**: K 92,80 · S 92 % | ✗ **MAT-RA-003** |
| 14 de 14 contratos PASS | **13 de 14**; RS-NEW-003 FAIL | ✗ |

**Diferencias que hay que explicar:**

1. **116 045 vs 392 751 admisibles** en el barrido de `y5.stage-screen`. No es una
   contradicción: son universos distintos. La adjudicación barrió «siete pantallas
   del diseño» con elección libre de aire; el código vigente tiene **seis**
   pantallas (`SCREENS`), y mi barrido amplio recorre todo el aire válido del
   schema sobre esas seis (8 256 786 combinaciones → 392 751 admisibles), mientras
   mi barrido estrecho recorre sólo el aire que `airsFor` **realmente puede
   producir** (7 605 admisibles). Los tres coinciden en la propiedad que importa, y
   ahora además está **demostrada**, así que ningún conteo es la prueba.
2. **`S` del año que viene:** la adjudicación inicial citó 70,8 % y la
   implementación 71 %; medido hoy, post-remediación, es 16 %. Es la mejora
   esperada, no una discrepancia.

## Q. Verificación canónica

Corrida **después** del análisis independiente, para corroborarlo, no para
reemplazarlo.

| Comando | Resultado |
|---|---|
| `pnpm toolchain:check` | **OK** · Node 24.19.0, pnpm 11.22.0 |
| `pnpm game:validate-content` | **OK** · 8 challenges, 10 storylets, 200 seeds cada uno, **0 errores, 0 warnings** |
| `pnpm game:variants check` | **OK** · `grade-7-dev-6`, 237 intentadas / 185 aprobadas, integridad ok |
| `pnpm game:variants check --content=grade-1..5` | **OK** · los cinco, rebuild **byte a byte** e integridad ok (359 · 508 · 681 · 853 · 1026) |
| `pnpm game:blind-audit` | **OK** · **19 / 19 coincidencias exactas** con la medición independiente; 22 Templates «no enumerable» (MAT-RA-006) |
| `pnpm game:simulate:deep` | **OK** · 5000 / 5000 completadas, **egreso 5000 / 5000**, peor caso 1 Repaso por run, **0 hallazgos**, 2356 ms |
| `pnpm game:score` | **OK** · 23 000 planes · perfecto **10 000** exacto `spread` 0 · piso 0 · neutral a la oportunidad · 0 empates de redondeo |
| `pnpm test:e2e:only` | **OK** · **158 passed**, incluidos reflow 320/360/390/412 + 1280 a zoom 2 y axe |
| `pnpm verify` | **FALLA** por un único test: `architecture-lint`, timeout de 5000 ms bajo carga de cobertura (MAT-RA-008). Todo lo demás en verde: 95 archivos, **1738 de 1739** tests |
| `pnpm test` (sin cobertura) | **OK** · 95 / 95 archivos, **1739 / 1739** tests, exit 0 |
| `node scripts/validate-agent-workspace.mjs` | **OK** · 6 skills, 239 archivos documentados, links y JSON OK |
| `node scripts/sync-master-spec.mjs --check` | **OK** · coincide con 119 fuentes autoritativas |
| `git diff --check` | **OK** · sin errores de espacios |
| `pnpm format:check` | **OK** |

Ningún comando quedó sin correr.

## R. Límites de esta re-auditoría

Lo que **no** puede establecer una auditoría automatizada, por honestidad:

- **Validez pedagógica.** Que un `K` de 78 sea aceptable *para chicos de 17 años*
  es un juicio humano. Este gate midió la exposición; no puede decir si enseña.
- **Pacing real.** Nada acá sustituye jugadores reales con reloj.
- **Redacción.** Se verificó que los textos sean **verdaderos**, no que sean
  **claros** para un lector de 5.º año.
- **Currículum.** No se contrastó contra el diseño curricular jurisdiccional
  vigente; eso es trabajo del Departamento de Matemática humano.
- **`y5.multi-option-comparison-review`.** Su rango de 10 000 000 de valores no se
  enumeró entero: se acotó a ±600 alrededor de la respuesta exacta de cada
  variante, donde vive todo lo que no es `invalid`. La dirección resultó correcta
  en las 30 025 respuestas evaluadas.
- **Las 15 Templates de construcción sin respuesta constante única.** Se atacaron
  con nueve familias de política ingenua, no con búsqueda exhaustiva: su espacio
  no es finito de forma tratable. Una política más astuta podría existir.

## S. Recomendación de gate

```text
NOT READY — tres hallazgos bloqueantes: un feedback matemáticamente falso
alcanzable en 26 de 26 variantes y clasificado como probado verdadero
(MAT-RA-001), y dos respuestas constantes que rinden K 95,83 y K 92,80 en
Templates puntuables (MAT-RA-002, MAT-RA-003), por encima de todo techo que la
remediación fijó.
```

El `AI Mathematics Department Provisional Sign-Off` **no** puede ejecutarse. Lo que
corresponde es un ciclo nuevo de adjudicación y remediación cuyo alcance mínimo es:

1. **MAT-RA-001** — dentro de RS-NEW-003: la detección de la concepción errónea
   tiene que ser **con signo**, no con valor absoluto, y el inventario de la regla
   2.9 tiene que re-verificarse contra las **condiciones de rama** del código y no
   contra su intención.
2. **MAT-RA-002 y MAT-RA-003** — techos de estrategia ciega y gates de respuesta
   constante para las Templates de cantidades, con la lección de diseño ya
   identificada: **variar los ítems o los máximos entre variantes** es lo que
   protege a las otras cuatro.
3. **MAT-RA-006** — extender la auditoría permanente al 52 % del catálogo que hoy
   no mide.
4. **MAT-RA-004, 005** — decisión de producto y pedagogía.
5. **MAT-RA-007 a 010** — correcciones documentales y de infraestructura.

Lo que **sí** queda establecido, y no hace falta volver a probar: **los catorce
contratos de la remediación se sostienen bajo derivación independiente**, y el
techo `K = 78` de `y5.stage-screen` es correcto y mínimo. El trabajo hecho es
sólido; lo que falló es el **alcance** de su instrumentación.
