# Adjudicación de los hallazgos posteriores a la re-auditoría

- **Estado:** `EXECUTED` — 2026-09-18, sobre `main` en `0a1f6ba`
- **Gate:** `POST-RE-AUDIT MATHEMATICS FINDINGS ADJUDICATION`
- **Rol:** Chair / Head of Mathematics Department provisional, con el equipo
  técnico, matemático y didáctico
- **Entrada:** los diez hallazgos de la
  [re-auditoría matemática independiente](independent-mathematics-reaudit.md),
  que cerró en `FAILED — REMEDIATION REQUIRED`
- **Veredicto:** `POST-RE-AUDIT MATHEMATICS FINDINGS ADJUDICATION — COMPLETE ·
  TARGETED REMEDIATION REQUIRED`
- **Contrato que emite:** [especificación de remediación dirigida](post-reaudit-mathematics-remediation-spec.md)

## A. Veredicto

```text
POST-RE-AUDIT MATHEMATICS FINDINGS ADJUDICATION — COMPLETE
TARGETED REMEDIATION REQUIRED
```

Los diez hallazgos quedan adjudicados. **Tres bloquean** el sign-off provisional y
**cuatro** requieren corrección en la ronda dirigida; el resto se acepta con riesgo
documentado, se difiere o ya está resuelto.

Nada de producto se tocó en este gate: `src/`, catálogos publicados, scorer, motor y
evaluadores siguen intactos. Lo que se entrega son **decisiones y contratos**.

La adjudicación confirmó la evidencia primaria de los tres bloqueantes y, en los dos
casos de respuesta constante, encontró una **causa raíz más profunda que la
reportada**. Eso cambia la forma de la remediación: no alcanza con mover el vector
dominante.

| Hallazgo | Causa reportada por el re-audit | Causa real, establecida acá |
|---|---|---|
| MAT-RA-002 | «los máximos son constantes y los objetivos son estrechos» | El generador **sólo puede emitir seis objetivos**, cuyo supremo componente a componente es `(5, 4, 6)`, muy dentro de los máximos ofrecidos `(10, 10, 12)`. Un vector ≥ `(5,4,6)` cumple **todos** los objetivos que el espacio puede producir, en **cualquier** catálogo que se sortee de él. Sólo los topes de recurso pueden frenarlo, y casi nunca aprietan |
| MAT-RA-003 | «los máximos son constantes y el colchón es bajo» | El **orden de los ítems por margen por minuto de cocina es idéntico en 25 de 25 variantes** (`bebidas > panchos > tortas`). El razonamiento económico correcto da **siempre la misma respuesta**, así que el atajo no es ignorar la matemática: es hacerla **una vez** y reusarla |

Esa segunda línea es el hallazgo más importante de esta adjudicación. El exploit de
la peña **es la heurística correcta congelada en un vector fijo**. Por eso la
remediación tiene que cambiar *qué construcción es buena*, no cuánta libertad hay.

## B. Baseline reconfirmada

Medida, no heredada.

| Dato | Valor |
|---|---|
| Rama · HEAD al empezar | `main` · `0a1f6ba` · worktree limpio |
| Node | 24.19.0 exacto |
| Motor · action log · snapshot | `10.0.0` · `7` · `8` |
| Templates | **42** · entradas en `grade-5-dev-4` **1026** · generadores 41 |
| Contenido de 5.º | `5.3.0-grade-5` |
| Catálogos de las Templates adjudicadas | `g7.bus-travel-review` 26 · `y3.course-project-tech` 24 · `y4.course-project-fundraiser` 25 · `y1.scale-fit-review` 24 · `g7.bus-timing` 26 |
| Verificación de materialización | huellas SHA-256 recalculadas de forma independiente: **125 / 125** sobre las cinco Templates adjudicadas |

## C. Erratum canónico de la re-auditoría

La re-auditoría contiene una **contradicción textual interna** que esta
adjudicación resuelve.

**Lo que dice su sección A:**

> «Los catorce contratos de la remediación se verificaron de forma independiente y
> los catorce se sostienen»

**Lo que concluye su sección E:**

> «Resultado: 13 de 14 PASS, 1 FAIL (RS-NEW-003).»

### Resolución

```text
La matriz contractual (sección E) es la CORRECTA.

Independent Mathematics Re-Audit — resultado contractual:
13 / 14 PASS
RS-NEW-003 — FAIL
```

**Fundamento.** El alcance de `RS-NEW-003` no es la lista de cinco Repasos que
nombra: el propio contrato lo extiende, en su línea de **Alcance**, a «cualquier
otro Repaso donde el inventario encuentre el mismo patrón» (regla transversal 2.9).
`g7.bus-travel-review` **es** un Repaso, **tiene** el patrón —un texto fijo que
afirma una dirección y una causa— y el inventario **lo miró y lo clasificó mal**.
Por lo tanto está dentro del alcance y el contrato queda incumplido. La frase de la
sección A es un error de redacción del resumen, no una conclusión sostenible.

La historia **no se borra**: la sección A de la re-auditoría queda como está, con una
nota de erratum que remite acá. Quien lea cualquiera de los dos documentos llega al
mismo estado.

**Además, y por separado:** el veredicto global `FAILED` no depende de este erratum.
Se sostiene por MAT-RA-002 y MAT-RA-003, que son hallazgos **nuevos, fuera de los
catorce contratos originales**, y que ningún contrato previo cubría. Aun si
`RS-NEW-003` hubiera pasado, el gate habría fallado igual.

## D. Matriz de los diez hallazgos

| ID | Severidad | Decisión | Prio | ¿Bloquea sign-off? | Fase destino | Contrato |
|---|---|---|---|---|---|---|
| MAT-RA-001 `g7.bus-travel-review` | HIGH | `REQUIRED_CORRECTION` | **P0** | **SÍ** | Remediación dirigida | **RS-RA-001** |
| MAT-RA-002 `y3.course-project-tech` | BLOCKER | `REQUIRED_CORRECTION` | **P0** | **SÍ** | Remediación dirigida | **RS-RA-002** |
| MAT-RA-003 `y4.course-project-fundraiser` | BLOCKER | `REQUIRED_CORRECTION` | **P0** | **SÍ** | Remediación dirigida | **RS-RA-003** |
| MAT-RA-006 alcance de la auditoría permanente | LOW→**HIGH** | `REQUIRED_CORRECTION` | **P0** | **SÍ** | Remediación dirigida, **primero** | **RS-RA-AUDIT-001** |
| MAT-RA-004 `y1.scale-fit-review` | MEDIUM | `DEFER_TO_FINAL_HUMAN_REVIEW` | P2 | no | Revisión humana diferida | — · bandera humana H-7 |
| MAT-RA-005 `g7.bus-timing` | MEDIUM | `ACCEPT_WITH_DOCUMENTED_RISK` | P2 | no | Revisión humana diferida | — · bandera humana H-6 |
| MAT-RA-007 «N=25 minimiza el techo» | OBSERVATION | `RESOLVED — DOCUMENTATION ONLY` | P2 | no | **este gate** | — |
| MAT-RA-008 flake de `architecture-lint` | OBSERVATION→MEDIUM | `REQUIRED_CORRECTION` | P1 | no | Remediación dirigida, WP técnico | **RS-RA-TEST-001** |
| MAT-RA-009 replay de catálogos de 1.º–5.º | OBSERVATION | `DEFER_TO_STAGE_09` | P0 **para STAGE-09** | no | STAGE-09 · aclaración documental acá | requisito R-S09-CAT |
| MAT-RA-010 conteos desactualizados | OBSERVATION | `RESOLVED — ALREADY FIXED` | NONE | no | — | — |

**Dos severidades se movieron, con fundamento:**

- **MAT-RA-006 sube de LOW a HIGH y pasa a P0.** El re-audit la clasificó LOW por ser
  «sólo» alcance de herramienta. Pero es la **causa raíz** de MAT-RA-002, MAT-RA-003 y
  MAT-RA-004, y sobre todo: sin ella, la ronda 2 **no puede demostrar que arregló
  nada**. Una remediación que no se puede medir no es una remediación. Va primero en el
  orden de trabajo.
- **MAT-RA-008 sube de OBSERVATION a MEDIUM, P1.** No es un problema matemático, pero
  **impide un `pnpm verify` reproducible**, y la ronda 2 tiene que apoyar su evidencia
  en esa corrida. La regla del gate anterior era no convertirlo en bloqueante
  matemático «salvo evidencia de que impide un verify reproducible»; esa evidencia
  existe y está medida (sección J).

## E. MAT-RA-001 — `g7.bus-travel-review`

### Decisión

```text
REQUIRED_CORRECTION · severidad HIGH · P0 · BLOQUEA el sign-off provisional
Contrato: RS-RA-001
```

### Evidencia primaria revalidada

`src/content/grade-7/challenges/bus-travel-review.ts`:

```ts
const gap = Math.abs(toNumber(subtract(submitted, fromInteger(model.travelMinutes))))
const answeredExtra = gap === model.scheduledMinutes
```

**Derivación independiente.** La concepción errónea que la pantalla existe para
nombrar es «contestar la demora sola, sin sumar el viaje normal», es decir
`submitted = extraMinutes = travel − scheduled`. La condición escrita, en cambio,
resuelve `|submitted − travel| = scheduled`, que tiene **dos raíces**:

```text
submitted = travel − scheduled = extra      ← la concepción errónea, POR DEBAJO
submitted = travel + scheduled              ← contó el viaje normal DOS VECES, POR ENCIMA
```

Reproducido sobre las 26 variantes aprobadas: las dos raíces existen en **26 / 26**, y
el valor gemelo cae dentro del rango presentado `[0, 120]` en **26 / 26** (42, 108,
90, 99, 80, 72, 81, 72, 96, 90, 66, 84, 55, 43, 100, 63, 45, 86, 84, 77, 44, 60, 48,
70, 63, 75). Confirmado en runtime contra el evaluador real:

| | `submitted = extra` (por debajo) | `submitted = travel + scheduled` (por encima) |
|---|---|---|
| Nivel | `functional` (40) | **`functional` (40)**, debería ser `invalid` (10) |
| Texto | «Faltaba sumarle el viaje normal.» ✔ verdadero | «Faltaba sumarle el viaje normal.» ✘ **falso** |
| Frecuencia | 26 / 26 | **26 / 26** |

La dirección afirmada es la **opuesta** al signo de `respuesta − exacta`, y la causa
afirmada es falsa: quien contestó `travel + scheduled` no omitió el viaje normal, lo
contó de más.

### Agravante: el inventario lo miró y lo clasificó mal

El [inventario de feedback](mathematics-remediation-feedback-inventory.md) contiene:

| Template | Texto | Clase | Justificación registrada |
|---|---|---|---|
| `g7.bus-travel-review` | `consequence` · «Faltaba sumarle el viaje normal» | **A** | «se muestra sólo si la respuesta es la demora sola» |

Esa premisa es **falsa**. No fue una omisión de alcance: fue una clasificación hecha
sobre la **intención** del código en vez de sobre su **condición de rama**. De ahí sale
el criterio 6 de `RS-RA-001`, que es la lección generalizable de todo este hallazgo.

### Atenuantes, registrados con honestidad

- Es un Repaso: `placement: 'recovery'`, puntaje 0, fuera de FairScore. **No hay
  exploit competitivo.**
- Es **preexistente** (commit `ad7852a`), muy anterior a la remediación, que nunca
  tocó el archivo. **No es una regresión.**

No alcanzan para bajar la prioridad: la afirmación es matemáticamente falsa, se
muestra a un estudiante en el momento pedagógicamente más sensible —la recuperación—
y además paga 40 puntos por una respuesta más lejana que muchas inválidas.

### Prototipo de la corrección (scratch, no aplicado)

La condición con signo `submitted === model.extraMinutes`:

- dispara exactamente sobre la concepción errónea real;
- **nunca** dispara en o por encima de la respuesta exacta: 0 casos sobre las 3146
  respuestas de las 26 variantes;
- coincide con «la condición vieja **y** además por debajo» en 3146 / 3146.

La remediación decide la forma final; el prototipo sólo establece que la corrección
es simple y no requiere tocar la escalera.

## F. MAT-RA-002 — `y3.course-project-tech`

### Decisión

```text
REQUIRED_CORRECTION · severidad BLOCKER · P0 · BLOQUEA el sign-off provisional
Contrato: RS-RA-002
```

### Reproducción exhaustiva

Espacio de vectores constantes: `11 × 11 × 13 = 1573`, recorrido entero.

```text
mejor vector constante : video 4 · entrevistas 4 · láminas 6
K = 95,83     óptima en 20 / 24 = 83 %     S = 83 %
histograma    : optimal 20 · efficient 4
un plan óptimo existe en 24 / 24 variantes
```

`placement: 'anchor'`, `math: 'discrete-quality'`: **puntuable**.

### Causa raíz real

La escalera pide `optimal` cuando las tres entregas llegan a su `target`, y **no pone
techo superior**. Así que lo único que puede invalidar un vector grande son los topes
de recurso. Y el espacio de objetivos está **acotado por arriba**:

```text
MINIMUMS × TARGET_STEPS  →  sólo SEIS objetivos posibles en TODO el espacio:
   (3,3,5) (3,4,4) (4,2,6) (4,3,4) (4,4,3) (5,2,5)

supremo componente a componente : (5, 4, 6)
máximos que la UI ofrece        : (10, 10, 12)
```

Cualquier vector `≥ (5,4,6)` cumple **todos** los objetivos que el generador puede
emitir — en el catálogo publicado y en cualquier otro que se sortee del mismo espacio.
El propio `(5,4,6)` rinde `K = 81,25` (19 óptimas, 5 inválidas por tope). El
`(4,4,6)` rinde más porque cambia esas 5 inválidas por 4 `efficient`.

**Conclusión: el exploit es estructural del generador, no una casualidad de la
selección de catálogo.** Republicar el catálogo no lo arregla.

### Estudio de factibilidad

Prototipo en scratch, 24 variantes por diseño, espacio constante recorrido entero.
Dos palancas: ampliar el conjunto de objetivos y apretar los topes de recurso
respecto del costo del plan objetivo.

| Diseño | K | Mejor constante | Óptima | S |
|---|---|---|---|---|
| como hoy: objetivos acotados, topes flojos | **100,00** | (5,4,6) | 24/24 | 100 % |
| objetivos de hoy + topes con holgura 8 / 4 | 83,33 | (3,4,6) | 8/24 | 33 % |
| objetivos de hoy + topes con holgura 3 / 1 | 77,50 | (3,4,5) | 8/24 | 33 % |
| objetivos **amplios** + topes flojos | 88,33 | (5,7,8) | 18/24 | 75 % |
| objetivos **amplios** + holgura 8 / 4 | **57,50** | (3,6,6) | 4/24 | 17 % |
| objetivos **amplios** + holgura 3 / 1 | 46,25 | (3,4,5) | 4/24 | 17 % |
| objetivos amplios + holgura 0 / 0 | 36,67 | (2,5,5) | 0/24 | 8 % |

**Hallazgo central del estudio: ninguna palanca sola alcanza.** Ampliar objetivos sin
apretar topes deja `K = 88,33`; apretar topes sin ampliar objetivos deja `K = 83,33`.
Las dos juntas bajan a `57,50`.

La fila de holgura `0 / 0` se descarta: vuelve el plan objetivo **el único** plan
válido y elimina la decisión, que es justamente el constructo. `RS-RA-002` lo prohíbe
explícitamente.

### Techo elegido, y por qué no es arbitrario

```text
K ≤ 65     S ≤ 35 %
```

Cuatro razones, ninguna por analogía con `y5.stage-screen`:

1. **Es factible con margen.** El prototipo llega a `57,50` con un diseño no
   degenerado, y a `46,25` apretando más. Quedan 7,5 puntos de aire sobre el techo.
2. **No es cosmético: fuerza el arreglo de clase.** Las tres correcciones de una sola
   palanca —83,33, 88,33 y 77,50— **fallan** este techo. Sólo lo pasa la corrección
   combinada. Un techo que se pudiera cumplir moviendo el vector dominante no serviría
   (regla del §34 del gate).
3. **Coincide con el precedente más cercano ya vigente.** `RS-NEW-001`
   (`y5.course-project-final`) fija `K ≤ 65 · S ≤ 35 %` y mide 56,80 / 28 %. Es la
   misma familia (`course-project`, Project Arc), la misma clase de constructo
   —construir un plan bajo restricciones, con escalera de supervivientes— y banda
   comparable. Usar el mismo techo es consistencia, no copia: se verificó que es
   factible **en este espacio**.
4. **No hay piso estructural que lo haga imposible.** A diferencia de
   `y5.stage-screen`, acá no existe una opción siempre válida por debajo del óptimo: el
   plan vacío no llega al mínimo y es `invalid`. El prototipo llegando a 36,67 lo
   confirma. No hace falta una prueba de mínimo global.

### Constructo que hay que preservar

`LOCKED`: tres recursos compartidos que se leen de la pantalla (minutos de notebook,
MB de pendrive, minutos de laboratorio con su tasa de subida), mínimos de la feria y
objetivos prometidos, Equipo como lectura **separada** de los mismos números por dueño,
Repaso `y3.rate-capacity-review`, banda STANDARD y pacing MEDIUM, arco PROJECT.

## G. MAT-RA-003 — `y4.course-project-fundraiser`

### Decisión

```text
REQUIRED_CORRECTION · severidad BLOCKER · P0 · BLOQUEA el sign-off provisional
Contrato: RS-RA-003
```

### Reproducción exhaustiva

Espacio constante `9 × 7 × 10 = 630`, recorrido entero.

```text
mejor vector constante : panchos 3 · tortas 0 · bebidas 9
K = 92,80     óptima en 23 / 25 = 92 %     S = 92 %
histograma    : optimal 23 · invalid 2
un plan óptimo existe en 25 / 25 variantes
```

`placement: 'anchor'`: **puntuable**.

### Causa raíz real — más profunda que la reportada

El re-audit apuntó a los máximos constantes y al colchón bajo. Las dos cosas
contribuyen, pero la causa dominante es otra:

```text
orden de los ítems por MARGEN POR MINUTO de cocina:
   bebidas > panchos > tortas      en 25 de 25 variantes (100 %)
```

En las 25 variantes el mejor ítem por minuto de cocina es **siempre** `bebidas`, y el
orden completo **nunca** cambia. El razonamiento económico correcto —margen de
contribución por unidad del recurso escaso— produce entonces **siempre la misma
respuesta**. Y `(3, 0, 9)` es exactamente eso: bebidas al máximo, tortas en cero,
panchos con lo que queda de cocina.

**El exploit no es ignorar la matemática: es hacerla una vez y reusar el resultado.**

Lo agrava el colchón: `optimal` sólo pide `ganancia ≥ objetivo + reserva`, sin techo, y
la ganancia alcanzable supera esa necesidad por un margen amplio —mínimo 5000, mediana
**18 000**, máximo 35 000—, así que casi cualquier producción grande pasa el listón
donde la cocina lo permite. La cocina aprieta en sólo 2 de 25.

### Estudio de factibilidad

| Diseño | K | Mejor constante | Óptima | S |
|---|---|---|---|---|
| como hoy: orden fijo, colchón amplio | 79,60 | (3,0,9) | 13/25 | 52 % |
| orden fijo + colchón 8000 | 71,20 | (3,0,9) | 13/25 | 52 % |
| orden fijo + colchón 2000 | 65,20 | (3,0,9) | 7/25 | 28 % |
| **orden rotado** + colchón amplio | 49,80 | (4,2,0) | 2/25 | 36 % |
| **orden rotado** + colchón 8000 | **40,00** | (2,1,1) | 0/25 | 20 % |
| **orden rotado** + colchón 4000 | **40,00** | (2,1,1) | 0/25 | 20 % |
| orden rotado + colchón 2000 | 40,00 | (2,1,1) | 0/25 | 12 % |

**La palanca decisiva es rotar el orden por margen por minuto.** Con el orden fijo, el
colchón más agresivo que probamos todavía deja `K = 65,20`. Rotando el orden, `K` cae a
`49,80` sin tocar el colchón y a `40,00` combinándolo, con un plan óptimo todavía
alcanzable en 25 / 25 y las tres ordenaciones presentes en el catálogo.

### Techo elegido

```text
K ≤ 65     S ≤ 35 %
```

1. **Factible con mucho aire:** el prototipo llega a 40,00–49,80, entre 15 y 25 puntos
   por debajo del techo.
2. **Fuerza el arreglo de clase:** las correcciones que sólo bajan el colchón dan
   79,60 · 71,20 · 65,20 — las tres **fallan o apenas tocan** el techo. Sólo lo pasa
   con holgura la rotación del orden económico.
3. **Mismo precedente que RS-RA-002** y misma familia `course-project`, verificado
   factible en este espacio.
4. No hay piso estructural: el prototipo baja a 40,00.

### Constructo que hay que preservar

`LOCKED`: las tres condiciones en orden —no perder plata (cubrir costos), llegar al
objetivo, llegar con el colchón—, la semántica de punto de equilibrio glosada en
palabras, el supuesto de que todo lo preparado se vende, el arco PROJECT, banda
STANDARD y pacing MEDIUM, el comportamiento de Estilo y el Repaso `y4.margin-review`.

**`RS-MAT-011` no se deforma.** Era y sigue siendo un contrato de claridad textual, y
el re-audit lo confirmó PASS en su alcance. `RS-RA-003` es un contrato **nuevo y
separado** que añade resistencia a estrategia ciega. Lo único que queda corregido de
`RS-MAT-011` es su línea «Mediciones. Ninguna de estrategia ciega», que la medición
falsó: se registra como erratum en la sección J.

## H. MAT-RA-006 — alcance de la auditoría permanente

### Decisión

```text
REQUIRED_CORRECTION · severidad HIGH (subida desde LOW) · P0
BLOQUEA el sign-off provisional
Contrato: RS-RA-AUDIT-001 — y va PRIMERO en el orden de trabajo
```

### Evidencia

`tests/helpers/blind-strategy.ts` despacha **por nombre de motor** y termina en:

```ts
return { answers: [], reason: `motor ${view.kind} no enumerable` }
```

Resultado medido: **22 de 42 Templates** (52 % del catálogo) salen sin R, K ni S —7
`quantity-builder`, 4 `assignment-board`, 5 `spatial-layout`, 4 `schedule-builder`,
1 `route-builder`, 1 `number-grid`—, más `y5.multi-option-comparison-review` por su
rango de 10 000 000 de valores.

Para las de cantidades ese «no enumerable» es **falso**: su espacio de vectores
constantes tiene entre **125 y 1573** elementos y se recorre entero en segundos. Ahí
vivían MAT-RA-002, MAT-RA-003 y MAT-RA-004.

### Por qué sube a P0 y va primero

Tres razones:

1. Es la **causa raíz** de los otros tres hallazgos.
2. Sin ella, la ronda 2 **no puede demostrar que arregló nada**: el criterio de éxito
   de RS-RA-002 y RS-RA-003 es una medición que hoy no existe en el repositorio.
3. El gate exige que la cobertura esté disponible **antes** de las correcciones, para
   reproducir el hallazgo primero y medir después — no agregada al final para
   confirmar lo que ya se hizo.

### Distinción metodológica que el contrato debe respetar

```text
La auditoría REPORTA.        Los contratos DECIDEN qué falla.
```

No se crea ningún techo universal. Un `K ≤ 78` o `S ≤ 40 %` global sería
metodológicamente incorrecto: cada techo sale del constructo, de la geometría de
respuesta y de la semántica de calidad de **su** Template. La auditoría ampliada mide
las 42; sólo las Templates con contrato tienen umbral que las haga fallar.

## I. MAT-RA-004 y MAT-RA-005 — decisiones de producto y didáctica

### MAT-RA-004 — `y1.scale-fit-review`

```text
DEFER_TO_FINAL_HUMAN_REVIEW · severidad MEDIUM · P2 · NO bloquea
Bandera humana H-7
```

**Hechos revalidados.** Las 24 variantes son una tira de `1 × W` con `blocked: []`,
`aisle: []`, `doors: []` y tres objetos no rotables de una celda de profundidad. El
sobrante es de **0 o 1 celdas**, así que el encaje es **ajustado** — la matemática real
es «¿entra la suma de anchos en el ancho disponible?»— pero colocar de izquierda a
derecha es `optimal` en **24 / 24**. Y la presentación entrega el paso convertido:

```ts
widthCells: object.widthCm / p.cellCm,
heightCells: object.depthCm / p.cellCm,
```

mientras la consigna dice «Pasá cada medida a celdas antes de ubicar».

**Por qué no se ordena corregir ahora.** La adjudicación encontró una tensión real que
no puede resolver sin criterio humano:

- El motor `spatial-layout` **responde en celdas**: `SpatialPlacement` es `{objectId, x,
  y, rotation}` con `x`/`y` en coordenadas de celda. Pedirle al jugador que ubique en
  celdas y ocultarle el tamaño en celdas es incoherente.
- La grilla **dibuja** la huella del objeto. Aunque se quitara el campo del payload, la
  conversión seguiría siendo visible contando celdas. Ocultarla exigiría no dibujar la
  huella, lo que rompe la interacción y la accesibilidad.
- Volver el encaje no trivial pide obstáculos o una segunda fila, es decir **subir** la
  dificultad de un Repaso — contra [ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md),
  que exige que la recuperación sea **más simple** que lo que repara.

La pregunta que decide todo es didáctica, no técnica: **¿la conversión cm → celdas es el
constructo de este Repaso, o es andamiaje?** Si es andamiaje, no hay defecto y sólo
sobra una frase en la consigna. Si es el constructo, el Repaso necesita otra
interacción, y eso es rediseño, no remediación.

Esa pregunta es exactamente para el Departamento de Matemática humano. Se difiere con
el riesgo escrito, y **no bloquea**: es un Repaso, puntaje 0, fuera de FairScore, sin
afirmación falsa y sin exploit competitivo.

La auditoría ampliada (RS-RA-AUDIT-001) debe seguir **reportando** su métrica de
política ingenua, para que el riesgo quede a la vista y no pueda empeorar en silencio.

### MAT-RA-005 — `g7.bus-timing`

```text
ACCEPT_WITH_DOCUMENTED_RISK · severidad MEDIUM · P2 · NO bloquea
Bandera humana H-6
```

**Hechos.** `K = 84,62` · `S = 58 %` · mejor constante: la **primera salida**. Es el `K`
y el `S` más altos de las 19 Templates enumerables. La razón es estructural: la salida
más temprana deja el mayor margen, el gate exige que exista al menos un margen seguro,
y por lo tanto la más temprana **nunca** llega tarde ni queda por debajo del margen
seguro. Sus únicos niveles posibles son `optimal` y `efficient`, así que
`K = 75 + 25·w` con `w = 10/26`. La única contrapartida de madrugar —9,1 minutos
perdidos de promedio— vive en **Estilo**, que no entra al score competitivo.

**Por qué se acepta y no se corrige.** Tres diferencias de fondo con MAT-RA-002/003:

1. **La matemática es correcta y nada se enseña mal.** No hay afirmación falsa.
2. **La estrategia es defendible, no ignorante.** «Salir temprano para llegar seguro»
   es un razonamiento legítimo que una persona matemáticamente competente puede
   elegir. La escalera le da `efficient` **a propósito**: llegar temprano no es un
   error de cálculo. En cambio «producir 4 videos, 4 entrevistas y 6 láminas siempre»
   no expresa ningún entendimiento.
3. **Bajarlo exige tocar semántica `LOCKED`.** Los únicos remedios disponibles son
   cambiar la escalera para que desperdiciar tiempo sea `functional`, o agregar una
   restricción nueva —un tope de espera en la escuela— que cambia el constructo. El
   §3 de este gate prohíbe reabrir la escalera, y con razón: es una decisión de
   producto y pedagogía, no la corrección de un defecto.

Es, en sus propios términos, un hallazgo de **validez de evaluación** —¿el puntaje mide
el constructo que dice medir?— y no un **exploit** —¿se puede ganar sin entender?—. La
distinción es la que justifica no bloquear.

**Riesgo que queda escrito:** una carrera puede tomar 84,6 % de la escala de esta
Template sin calcular nunca el porcentaje de demora, que es su constructo completo, y
sin ninguna contrapartida competitiva. Si la revisión humana decide que eso es
inaceptable, el remedio es una decisión de escalera y entra por un gate de diseño.

## J. Correcciones documentales y de gobernanza

### MAT-RA-007 — «N = 25 minimiza el techo»

```text
RESOLVED — DOCUMENTATION ONLY · P2 · NO bloquea
```

La [adjudicación final del techo](rs-mat-008-blind-ceiling-final-adjudication.md)
afirmaba que «25 es el tamaño que minimiza el techo». Es **falso**. Reproducido de forma
independiente:

```text
K_min(N) = 75 + 25·⌈N/10⌉ / N

N = 24 → 78,125     (la cifra que el documento da, correcta)
N = 25 → 78,000     ← el catálogo publicado
N = 26 → 77,885
N múltiplo de 10 → 77,500     (mínimo global sobre N ∈ [5, 60])
```

**No afecta al contrato.** El techo `K ≤ 78` se cumple y **78 es exactamente el mínimo
en `N = 25`**, que es el tamaño publicado. La frase corregida es un exceso
argumentativo, no un error de resultado. Se corrige con erratum en su documento, sin
borrar el razonamiento original.

**No se reabre nada:** `RS-MAT-008`, `OQ-66`, `OQ-67` y el techo `K ≤ 78` a `N = 25`
siguen cerrados y vigentes.

### MAT-RA-008 — flake de `architecture-lint`

```text
REQUIRED_CORRECTION · severidad MEDIUM (subida) · P1 · NO bloquea la matemática
Contrato: RS-RA-TEST-001 — work package TÉCNICO, separado de la remediación matemática
```

**Diagnóstico medido en esta adjudicación**, no heredado:

| Contexto | Duración del caso |
|---|---|
| Aislado, corrida 1 | 1651 ms |
| Aislado, corrida 2 | 958 ms |
| Aislado, corrida 3 | 948 ms |
| **Cada caso posterior del mismo archivo** | **6–7 ms** |
| Dentro de `pnpm verify` (suite completo + cobertura) | **5575 ms → timeout de 5000 ms** |

La causa es precisa: **el primer `eslint.lintText()` paga la resolución de configuración
de ESLint por única vez, y ese costo está dentro de un caso cronometrado.** Los casos
siguientes cuestan 6 ms. Bajo cobertura e instrumentación en paralelo, ese costo único
se multiplica por más de tres y cruza el presupuesto por defecto de 5000 ms.

**Por eso no se arregla subiendo el timeout global.** El contrato pide mover el
calentamiento único fuera del caso cronometrado —un `beforeAll` con su propio
presupuesto— y **dejar `testTimeout` como está**. Tampoco se toca ningún umbral de
cobertura.

Sube a P1 porque la ronda 2 apoya su evidencia en `pnpm verify`, y un verify que falla
de forma intermitente no puede sostener un gate. No es un bloqueante **matemático**: la
política de lint que el test afirma está intacta, verificado en aislamiento.

### MAT-RA-009 — replay de los catálogos de 1.º a 5.º

```text
DEFER_TO_STAGE_09 · P0 para la preparación oficial de STAGE-09 · NO bloquea acá
Requisito: R-S09-CAT · aclaración documental aplicada en este gate
```

**Hechos.** 7.º conserva `dev-1` a `dev-6`. Los de 1.º a 5.º se **renombran** a la
versión siguiente, así que una run que declarara `grade-5-dev-2` no resuelve hoy.

**Y es una decisión registrada, no un descuido:** `D-S08-109` dice literalmente que
«1.º a 5.º siguen D-S08-088» —republicar renombrando— mientras «7.º conserva todos sus
catálogos». La convención es anterior a la remediación (el renombre `dev-1 → dev-2` es
de `9233160`).

**Lo que sí hay que aclarar.** [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md)
§4 enuncia el principio en términos generales —«Una run que declaró `dev-1` puede
resolverse contra el conjunto que realmente jugó»—, y leído así parecería universal.
Esa ambigüedad es lo que el re-audit detectó. Se corrige acá, documentalmente: la
garantía de retención rige para los catálogos que una run **oficial** puede declarar, y
1.º a 5.º están en `draft` con `official: false`, donde la convención es
renombrar-republicar. El sistema **falla cerrado** —la compatibilidad de versiones es
igualdad exacta en las tres—, así que no hay resolución incorrecta silenciosa.

**Requisito R-S09-CAT, para STAGE-09.** Antes de que exista una edición oficial, todo
descriptor de catálogo que una run oficial pueda declarar tiene que seguir siendo
resoluble según la política de retención de replay, y esa política tiene que estar
escrita explícitamente por año. No se arregla en este task ni en la ronda 2.

### MAT-RA-010 — conteos desactualizados

```text
RESOLVED — ALREADY FIXED · NONE · NO bloquea
```

Confirmado: `current-stage.md` ya dice «95 archivos y **1739 tests**, **0 `todo`**;
**158 E2E**», corregido por la propia re-auditoría. Verificado contra el repositorio.
Sin acción.

## K. Lo que queda CERRADO y no se reabre

Esta adjudicación **no** es una tercera re-auditoría. Lo siguiente sobrevivió una
re-derivación independiente y queda firme:

| Cerrado | Estado |
|---|---|
| `RS-MAT-008` · `y5.stage-screen` | **PASS.** Techo `K ≤ 78`, re-probado por deducción y por enumeración entera exhaustiva |
| `K = 78` a `N = 25` | **Mínimo factible demostrado.** Corregida sólo la frase sobre otros `N` (MAT-RA-007) |
| Excepción estrecha de witness de `y5.stage-screen` | **Vigente.** Alcance verificado: 1 de 22 llamadas, condicionada a cero recortes válidos |
| `OQ-66` | **Cerrada** (D-S08-116) |
| `OQ-67` | **Cerrada** (D-S08-113) |
| FairScore `fair-score-dev-2@2.0.0-post-tg1-candidate`, 85 / 10 / 5 | **Sin cambios.** Ninguna remediación de la ronda 2 lo toca |
| Escalera 100 / 75 / 40 / 10 | **Sin cambios** |
| Los otros 12 contratos verificados PASS | **Sin reabrir** |
| MAT-010, MAT-012, MAT-013, partes aceptadas de MAT-006 y MAT-007 | **Preservados**, verificado por el re-audit |

Ningún contrato de la ronda 2 puede cumplirse tocando el scorer, la escalera, el motor,
el action log ni el snapshot.

## L. Banderas para la revisión humana final

Se agregan o actualizan, sin que ninguna adjudicación de IA marque contenido como
`math_reviewed`:

| Bandera | Pregunta para el Departamento de Matemática humano |
|---|---|
| **H-6** | `g7.bus-timing`: ¿es aceptable que «salir en la primera salida» rinda 84,6 % sin calcular la demora? ¿Debería «demasiado temprano» ser un error matemático, o es correcto que la escalera lo trate como decisión conservadora legítima? |
| **H-7** | `y1.scale-fit-review`: ¿la conversión cm → celdas es el **constructo** del Repaso o **andamiaje**? De la respuesta depende si hay defecto que corregir o sólo una frase que ajustar en la consigna |
| **H-8** | `y3.course-project-tech` tras RS-RA-002: ¿los nuevos objetivos y topes de recurso siguen siendo **verosímiles** para una feria escolar, o la dispersión que exige la resistencia a estrategia ciega produjo números que un curso real no reconocería? |
| **H-9** | `y4.course-project-fundraiser` tras RS-RA-003: ¿la rotación del orden por margen por minuto produce economías **creíbles** —precios, costos y tiempos de cocina que un curso real podría tener— o se nota construida para romper la memorización? |
| **H-10** | ¿Los techos `K ≤ 65 · S ≤ 35 %` son pedagógicamente apropiados para estas dos Templates, o el objetivo debería ser más exigente incluso a costa de más dispersión paramétrica? |

Las banderas H-8 y H-9 son deliberadas: la remediación de la ronda 2 va a mover números
que **sí** afectan la verosimilitud narrativa, y esa es una evaluación humana.

## M. Próximo gate

```text
TARGETED POST-REAUDIT MATHEMATICS REMEDIATION
```

Contrato completo y ejecutable en la
[especificación de remediación dirigida](post-reaudit-mathematics-remediation-spec.md),
con seis paquetes de trabajo, sus contratos normativos, su superficie de versión, sus
tests y sus reglas de STOP.

Después de esa ronda:

```text
INDEPENDENT MATHEMATICS RE-AUDIT ROUND 2
AI MATHEMATICS DEPARTMENT PROVISIONAL SIGN-OFF
```

El sign-off provisional sigue **bloqueado** hasta que los cuatro contratos P0 cierren y
una re-auditoría independiente lo confirme.
