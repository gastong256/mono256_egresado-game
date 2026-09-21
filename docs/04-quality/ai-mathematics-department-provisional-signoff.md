# Sign-off provisional del Departamento de Matemática de IA

- **Estado:** `EXECUTED` — 2026-09-21, sobre `main` en `2f58827`
- **Gate:** `AI MATHEMATICS DEPARTMENT PROVISIONAL SIGN-OFF`
- **Rol:** síntesis y gobernanza, con autoridad para endurecer instrumentación y
  documentación, y **sin** autoridad para tocar producto ni reabrir decisiones
  cerradas
- **Base probatoria:** la
  [auditoría final de cierre matemático](final-mathematics-closure-audit.md)
- **Salida:** el gate siguiente es `STAGE-09`, con la revisión humana diferida

## A. Veredicto

```text
AI MATHEMATICS DEPARTMENT PROVISIONAL SIGN-OFF — PASSED
```

La auditoría final de cierre pasó con hallazgos no bloqueantes. Este gate cerró
los tres que eran acotados y de instrumento o documentación, comprobó que
ninguno cambia el producto, y volvió a correr la verificación entera. La
conclusión de la auditoría **se sostiene tal cual**: ninguna Template puntuable
admite una política de las ocho familias congeladas que cruce el guardarraíl
**y** desvíe materialmente el constructo.

## B. Alcance

Lo que este sign-off **sí** dice:

- el Departamento de Matemática de IA considera la matemática y el contenido de
  STAGE-08 **provisionalmente aceptados** para continuar la hoja de ruta;
- la evidencia acumulada es suficiente, consistente y reproducible desde el repo;
- no queda ningún hallazgo matemático bloqueante abierto.

Lo que **no** dice:

- no es aprobación del Departamento de Matemática humano;
- no es certificación curricular ni didáctica;
- no es validación de pacing con jugadores reales;
- no es aprobación final de release;
- no cierra STAGE-08.

## C. Cadena de evidencia

Las fallas quedan, porque son la evidencia de que el proceso midió de verdad.

| # | Gate | Veredicto | Qué dejó |
|---|---|---|---|
| 1 | [Pre-Review](mathematics-department-pre-review.md) | DONE | 13 hallazgos, 0 bloqueantes |
| 2 | [Adjudicación independiente](mathematics-department-ai-adjudication.md) | REMEDIATION REQUIRED | contrato de remediación |
| 3 | [Remediación ronda 1](mathematics-remediation-implementation.md) | DONE | 14/14 contratos PASS |
| 4 | [Conflictos de contrato](mathematics-remediation-contract-conflict-adjudication.md) · [RS-MAT-008](rs-mat-008-blind-ceiling-final-adjudication.md) | DONE | OQ-66 y OQ-67 cerradas |
| 5 | [Re-auditoría ronda 1](independent-mathematics-reaudit.md) | **FAILED** | 13/14 + 3 hallazgos nuevos |
| 6 | [Adjudicación post-re-audit](post-reaudit-mathematics-findings-adjudication.md) | DONE | 10 hallazgos, 4 P0 |
| 7 | [Remediación ronda 2](targeted-post-reaudit-mathematics-remediation.md) | DONE | 5 contratos verificados |
| 8 | [Re-auditoría ronda 2](independent-mathematics-reaudit-round-2.md) | **FAILED** | 5/5 PASS y 3 bloqueantes nuevos: la clase de atajo seguía viva |
| 9 | [Sprint de cierre](stage-08-mathematics-final-closure-sprint.md) | DONE | taxonomía finita de ocho familias sobre las 42 Templates |
| 10 | [Auditoría final de cierre](final-mathematics-closure-audit.md) | **PASSED WITH NON-BLOCKING FINDINGS** | 5 hallazgos `MAT-FC`, ninguno bloqueante |
| 11 | Sign-off provisional | **PASSED** | este documento |

## D. Veredicto de la auditoría final, textual

```text
FINAL MATHEMATICS CLOSURE AUDIT — PASSED WITH NON-BLOCKING FINDINGS
```

Sus cifras canónicas, re-derivadas fuera de la instrumentación del implementador
antes de leer ningún informe:

```text
evaluador propio vs producción en y3      39 325 respuestas · 0 discrepancias
razonamiento buscado de y3                99,00 · óptimo en 24/25
piso de planes válidos de y1.mobile-data  80,71 · óptimo en 28,4 %
RS-MAT-008 · y5.stage-screen              K 78,00 · S 40,0 % · numerador 1950/25
verdad del feedback                       58 221 respuestas · 0 afirmaciones falsas
FairScore perfecto                        10 000 exacto en las 16 formas
egreso                                    5000 / 5000
servidor                                  puntaje del cliente ignorado; versiones forjadas rechazadas
```

## E. Hallazgos bloqueantes

```text
0 hallazgos matemáticos bloqueantes abiertos
```

Los tres bloqueantes de la ronda 2 —MAT-RA2-001, MAT-RA2-002 y MAT-RA2-004—
quedaron cerrados por el sprint de cierre y re-verificados de forma independiente
por la auditoría final.

## F. Hallazgos no bloqueantes y su disposición

| ID | Severidad | Superficie | Disposición en este gate |
|---|---|---|---|
| **MAT-FC-001** | HIGH | instrumento | **RESUELTO.** Identidad semántica de magnitudes (G.1) |
| **MAT-FC-002** | HIGH | instrumento | **ENDURECIDO.** Profundidad declarada y políticas por atributo (G.2) |
| **MAT-FC-003** | MEDIUM | producto · pedagogía | **DIFERIDO a revisión humana**, con métrica y excepción declarada (G.3) |
| **MAT-FC-004** | LOW | documentación | **RESUELTO.** Erratas con procedencia (G.4) |
| **MAT-FC-005** | LOW | contenido | **DIFERIDO.** Rebalancear población cambiaría el catálogo (G.5) |
| **MAT-SO-001** | LOW | accesibilidad · pruebas | **NUEVO en este gate.** Flake de contraste en `y5.stage-screen` bajo carga (K.1). Diferido |
| Observación | — | pruebas | `g7.group-tasks` sigue sin E2E propio; cobertura suficiente, no específica |

## G. Endurecimiento ejecutado

Todo en `tests/`. **`src/` quedó intacto**, comprobado con `git status --porcelain -- src/`.

### G.1 MAT-FC-001 · las magnitudes se identifican por semántica

**Causa raíz.** `resourceModels` ataba un vector de costos a cualquier capacidad
impresa cuya **unidad se llamara igual**. `y3.course-project-tech` imprime dos
restricciones en minutos —«Notebook prestada · 30 minutos» y «Laboratorio ·
8 minutos»— y el detalle de cada ítem dice «N min de notebook». El lector
normalizaba las dos a `min` y construía un tope espurio de 8 minutos contra
costos en minutos **de notebook**.

**Corrección.** Se introdujo una identidad tipada:

```ts
interface Dimension { readonly unit: string; readonly of: string }
dimensionKey({ unit: 'min', of: 'notebook' })  // 'min@notebook'
dimensionKey({ unit: 'min', of: '' })          // 'min'
```

`figuresIn` captura el recurso que la pantalla nombra después de la unidad
(`5 min de viaje` → `min@viaje`), los costos se agrupan por **dimensión** y no
por unidad, y una capacidad sólo se ata a una dimensión con recurso nombrado si
su etiqueta lo nombra, por palabra entera. Es conservador por diseño: si
**ninguna** etiqueta nombra el recurso, la pantalla no dice de quién es y se
vuelve al comportamiento por unidad, así que la corrección nunca puede **perder**
una restricción real.

**Antes y después**, sobre el catálogo publicado:

| | informaba | mide ahora | medición independiente de la auditoría |
|---|---|---|---|
| `y3` · mejor llenado | 41,40 · 0 % | **79,40 · 40 %** | 79,40 · 40 % |
| `y3` · mejor política | 47,00 · 4 % | **79,40 · 40 %** | 79,40–81,80 · 40–44 % |
| modelos de recurso | 5, uno espurio | **4, todos reales** | — |

El tope espurio «Laboratorio ≤ 8 min» desapareció; la conversión encadenada
correcta —«Laboratorio a mb», el rato de laboratorio por lo que sube la
conexión— se conserva, que es la dependencia que el beat enseña.

**Radio de impacto: una Template.** Se revisaron las ocho de cantidades y
presupuesto: `y3.course-project-tech` es la única cuya pantalla nombra un recurso
junto a la unidad. Las otras siete miden exactamente lo mismo que antes, y el
nombre exacto que `INTENDED_REASONING` declara para la peña
—`llenar «Cocina» por mayor $ #2 − #1 por min de «Cocina»`— no cambió.

**Pruebas.** `tests/unit/blind-strategy-dimensions.test.ts`, siete casos sobre
**claves semánticas** y no sobre el texto que hoy se renderiza: dos recursos en
la misma unidad son dos magnitudes, una etiqueta nombra por palabra entera
—`lab` no casa dentro de `laboratorio`—, la capacidad ajena no se modela, sin
recurso impreso se conserva el comportamiento por unidad, y si ninguna etiqueta
nombra el recurso no se pierde la restricción. Más dos regresiones de medición
en la suite de contrato.

### G.2 MAT-FC-002 · la cobertura declara su profundidad

**Causa raíz.** Las ocho familias eran genéricas sólo para
`quantity-builder`/`budget-builder`, los motores de opción y `numeric-input`. Los
motores de construcción llevaban listas escritas a mano de patrones
posicionales, así que `42/42` era cierto por fila y exagerado por profundidad.

**Corrección, en dos partes.**

**(a) Profundidad declarada.** Cada política declara de dónde sale:

```ts
type PolicyDerivation = 'attribute' | 'positional'
```

y cada fila deriva de eso su profundidad, en un solo lugar y sobre lo que
**efectivamente** midió:

```text
EXHAUSTIVE_AND_ATTRIBUTE     10
EXHAUSTIVE_ONLY              14
ATTRIBUTE_POLICIES           14
POSITIONAL_POLICIES_ONLY      4
LIMITED_POLICY_COVERAGE       0
```

Las cuatro filas posicionales —`g7.may-25-act`, `y2.intercurso-plan`,
`y4.shift-coverage` y `y5.multi-option-comparison-review`— quedan **declaradas
como tales**. Sus pantallas no imprimen una cifra comparable por tarea, y
fabricar una política de atributo ahí sería inventar cobertura: decir el límite
es preferible.

**(b) Políticas por atributo donde la pantalla las ofrece.**

- `assignment-board` — emparejar por la cifra de cada fila en los cuatro
  cruces, la primera persona a la que le alcanza, y cada tarea a quien mejor o
  peor la hace según la marca impresa junto al nombre de la tarea.
- `schedule-builder` — la más corta primero y la más larga primero, por la
  duración impresa.
- `spatial-layout` — huella máxima, que faltaba al lado de huella mínima.

**El efecto que importa.** El instrumento ahora **ve** lo que la auditoría final
había medido por su cuenta y el instrumento no:

| Template | política | antes | ahora |
|---|---|---|---|
| `g7.group-tasks` | la persona de mayor cifra a la tarea de mayor cifra | no se medía | **90,00 · 83,3 %** |
| `g7.group-tasks` | cada tarea a quien mejor la hace | no se medía | **85,00 · 83,3 %** |

Eso hizo fallar `RS-CLO-001`, que es exactamente lo que tenía que pasar: el
contrato dejó de pasar de forma vacua. Cómo se resolvió está en G.3.

**Sin fuga de oráculo.** Las políticas nuevas leen `label` y `detail` de la
presentación y nada más. Los tres módulos siguen sin una sola referencia a
`params`, a un solucionador, a una respuesta esperada, a `.evaluate(` ni a ningún
`templateId`; la respuesta se construye primero y se evalúa después.

### G.3 MAT-FC-003 · `g7.group-tasks`, diferido con evidencia

La auditoría final ya había medido estas dos políticas y las había **adjudicado
no bloqueantes** con su análisis de constructo: de las 24 permutaciones sólo
entran 1 o 2 por equipo, así que acertar **cualquier** reparto factible ya rinde
82,00 con 70 % de óptimas. Emparejar por horas hace la mitad que discrimina —el
filtro de capacidad— y queda 8 puntos sobre ese piso; la de estrellas se saltea
las horas, queda 3, y cae en `invalid` en cuanto diverge.

Este gate **no re-adjudicó** eso. Lo que hizo fue volverlo ejecutable:

1. **Métrica nueva.** La auditoría mide sola el piso estructural de toda fila
   enumerada: cuántas respuestas entran en la variante más pobre y en la más
   rica, y qué rinde acertar una cualquiera. Para `g7.group-tasks` reporta
   `1–2 entran · 82,0 · 70,0 %`, que es la cifra que la auditoría final había
   calculado a mano.
2. **Excepción declarada con evidencia, no con techo suelto.** `ACCEPTED_EXPOSURE`
   gana un campo `floor` **obligatorio** cuando la exposición supera los dos ejes
   del guardarraíl global. El contrato ahora exige, además de la razón escrita,
   que la auditoría **vuelva a medir** al menos ese piso por su cuenta y que la
   cota aceptada quede pegada a él —a lo sumo +10 de media y +0,20 de proporción—.
   La regla vieja para excepciones de un solo eje —tiene que ser más estricta que
   el global en el eje que no sobrepasa— se conserva intacta, y `y1.mobile-data`
   pasa sin cambios.

El resultado es un contrato **con más dientes**, no con menos: antes una
excepción se justificaba con prosa; ahora tiene que declarar un piso que el
instrumento corrobora en cada corrida.

La causa raíz —que el espacio factible sea casi un punto y que `optimization: 2`
apenas se ejerza— **no se tocó**. Rediseñar la Template cambiaría contenido
después de la auditoría final. Queda como bandera explícita para revisión humana.

### G.4 MAT-FC-004 · documentación reconciliada con procedencia

Tres cifras del informe del sprint no reproducían. Se corrigieron **sin borrar el
original**: el informe conserva lo que dijo y una errata al pie dice qué midió la
auditoría y cuál es la cifra canónica.

| Informe dijo | Canónico |
|---|---|
| 6 multisets `(margen, minutos)` distintos | **5** · `RS-CLO-002` pide ≥ 5 y se cumple con margen cero |
| piso de planes válidos 78,63 · 19,9 % | **80,71 · 28,4 %** sobre 630 planes; refuerza la aceptación |
| señuelo del precio 77,60 · 48 % | **72,80 · 40 %** por minuto de cocina; 77,40 · 48 % es «la más barata primero» |

### G.5 MAT-FC-005 · población de `y3`, diferido

18 de 25 variantes aprietan la notebook, 4 el pendrive y 3 el laboratorio.
Rebalancear la población **republicaría el catálogo**, es decir cambiaría el
producto después de la auditoría que lo aprobó. No se toca acá. No hay métrica
barata que lo vigile desde la auditoría ciega sin romper su frontera de
información —el papel de la variante es un parámetro, no algo que la pantalla
imprima—, así que queda documentado y diferido, sin diagnóstico nuevo.

## H. Matriz de evidencia

| Área | Evidencia canónica | Estado | Bloqueante | Riesgo residual | Revisión humana |
|---|---|---|---|---|---|
| Matemática correcta | evaluador independiente vs producción, 39 325 respuestas | PASS | no | — | no |
| Verdad del feedback | 58 221 respuestas barridas, 0 falsas | PASS | no | — | no |
| Validez de constructo | análisis por Template en la auditoría final | PASS | no | franjas de inspección documentadas | **sí** |
| Resistencia a atajos | ocho familias congeladas, instrumento corregido | PASS | no | 4 filas posicionales declaradas | **sí** |
| Dificultad y bandas | `core`/`standard`/`stretch` sin cambios | PASS | no | — | no |
| FairScore | recomputado con racionales exactos; 23 000 planes | PASS | no | — | no |
| Equipo y Aura separados · Estilo fuera | `SCORE_COMPONENTS` sin Estilo | PASS | no | — | no |
| Recuperación | 1 por etapa, sólo `invalid`, sin recursión | PASS | no | — | no |
| Egreso | 5000 / 5000 | PASS | no | — | no |
| Integridad de catálogos | 6 × `integrity ok`, poblaciones exactas | PASS | no | `R-S09-CAT` diferida | no |
| Determinismo | 42 filas idénticas en 5 corridas | PASS | no | — | no |
| Replay | fail-closed contra toda versión forjada | PASS | no | — | no |
| Confianza de servidor | puntaje del cliente ignorado; recomputa 13 254 | PASS | no | endpoints y persistencia en STAGE-09 | no |
| Accesibilidad | 174 E2E; y3 e y4 a 320–1280 px con axe y zoom | PASS | no | `g7.group-tasks` sin E2E propio | no |
| Rendimiento | auditoría 1 149,8–1 184,3 ms | PASS | no | — | no |
| Consistencia documental | erratas con procedencia; master spec sincronizada | PASS | no | — | no |
| Riqueza pedagógica de `g7.group-tasks` | MAT-FC-003 | ABIERTO | no | espacio factible degenerado | **sí** |
| Población de `y3` | MAT-FC-005 | ABIERTO | no | 18/4/3 entre papeles | **sí** |
| Pacing real | — | PENDIENTE | no | sin datos de jugadores | **sí** |

## I. Banderas para la revisión humana

Ninguna se resuelve por decisión de IA.

1. **`g7.group-tasks`** — el espacio factible es casi un punto (1–2 repartos de
   24). La Template declara `optimization: 2` y apenas lo ejerce. ¿Se rediseña
   la población de equipos, se rebaja el perfil cognitivo declarado, o se acepta?
2. **`y1.mobile-data`** — la escalera da 75 a toda producción válida, así que el
   piso estructural es 80,71. ¿Es la escalera correcta para una banda CORE?
3. **`y3.course-project-tech`** — 18 de 25 variantes aprietan el mismo recurso.
   ¿Se rebalancea la población publicada?
4. **`y5.stage-screen`** — `K = 78` es un piso estructural aceptado y probado
   (RS-MAT-008, OQ-66). Confirmación humana del criterio, no del cálculo.
5. **Franjas de inspección** — `y1.classroom-layout` (60 % óptima),
   `g7.notebook-offer` (53,8 %) y `g7.bus-timing` (H-6, 84,62 · 57,7 %).
6. **`y1.scale-fit-review`** (H-7) — una política rinde 100 en 24/24. Es
   `recovery`, no aporta evidencia competitiva.
7. **Adecuación curricular y redacción** — si cada Template enseña lo que dice
   enseñar, al nivel declarado, y si las consignas se entienden.
8. **MAT-SO-001** — el flake de contraste de `y5.stage-screen` bajo carga (K.1).
   Es para el Accessibility Engineer, no para la revisión matemática, pero queda
   listado acá para que no se pierda.

## J. Pacing y límites de jugadores reales

Nada de lo medido acá dice cuánto tarda una persona, si la franja `efficient` se
siente justa, o si el arco de nueve beats cansa. La simulación juega políticas,
no personas. **Pendiente, humano.**

## K. Verificación

| Comando | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS · Node 24.19.0 · pnpm 11.22.0 |
| `pnpm verify` × 2 | corrida A: Vitest **97 archivos · 1914** en verde; E2E **173 / 174** con un flake de contraste (MAT-SO-001). Corrida B: **PASS entero** · 97 · 1914 · 174 |
| `pnpm test:e2e:only` suelto | **174 / 174** en verde |
| `pnpm game:validate-content` | PASS · 0 errores · 0 warnings |
| `pnpm game:variants check` y `--content=grade-1…5` | PASS · `integrity ok` en los seis |
| `pnpm game:blind-audit -- --coverage` | 42 filas · 24 exhaustivas · 18 por políticas · 0 bloqueadas |
| `pnpm game:blind-audit -- --timing` × 5 | 1 149,8–1 184,3 ms · mediana 1 162,0 ms |
| `pnpm game:simulate:deep` | 5000 / 5000 · 0 hallazgos |
| `pnpm game:score` | 10 000 exacto · dispersión 0 · 0 empates |
| `node scripts/validate-agent-workspace.mjs` | PASS |
| `node scripts/sync-master-spec.mjs --check` | PASS |
| `git diff --check` | limpio |

### K.1 MAT-SO-001 · un flake de contraste, dicho y no escondido

En la **corrida A** de `pnpm verify`, con la máquina cargada, el recorrido
`Grade 5: proyectar la pantalla del acto a 320 px` falló en `axe` con 58
violaciones de `color-contrast` —`#8e938c` sobre `#33372f`, 3,87 contra el 4,5:1
que pide WCAG 2 AA—. Vitest pasó entero en esa misma corrida.

Qué se hizo, en orden, sin re-correr hasta que diera verde:

```text
1 · el mismo test, solo, sobre el mismo build      4 / 4 en verde
2 · la suite E2E entera, sola                    174 / 174 en verde
3 · pnpm verify corrida B, completa              174 / 174 en verde
```

No lo causó este gate: los cambios están todos en `tests/helpers/blind-strategy*`
y en dos archivos de test, y `src/components`, `src/styles`, `src/app` y los
`.spec.ts` de E2E no se tocaron. Tampoco es una falta de CSS —los colores del
informe son tokens reales del sistema de diseño, no el negro sobre blanco de una
hoja sin estilos—, así que la hipótesis viva es que `axe` midió una región antes
de que el estado visual terminara de asentarse.

**Queda abierto y anotado**, no cerrado por haber dado verde tres veces
seguidas. Es el mismo tipo de hallazgo que `MAT-RA-008` —un flake bajo carga que
terminó en `RS-RA-TEST-001`—, y se deriva al Accessibility Engineer con la
evidencia guardada. No es un hallazgo matemático y no toca ningún contrato de
este gate.

**Rendimiento.** La corrección semántica quita un modelo espurio y las políticas
nuevas son un puñado por Template, así que el costo no se movió:

```text
antes del endurecimiento   1 152,3 · 1 157,7 · 1 167,3 · 1 171,0 · 1 184,6 ms   mediana 1 167,3
después                    1 149,8 · 1 153,2 · 1 162,0 · 1 164,7 · 1 184,3 ms   mediana 1 162,0
```

## L. El producto no se movió

```text
git status --porcelain -- src/     vacío
```

Motor `10.0.0`, action log `7`, snapshot `8`, los siete rulesets, FairScore
`fair-score-dev-2@2.0.0-post-tg1-candidate` y los seis catálogos: **sin cambios**.
Ningún generador, evaluador, escalera de calidad, semántica de catálogo, de
score, de replay o de servidor fue tocado. Lo único que cambió es cómo la
auditoría **mide** y cómo los informes **cuentan** lo medido.

Por eso las conclusiones de la auditoría final siguen en pie: se verificaron
contra un instrumento mejor y dieron lo mismo, o dieron lo que la auditoría ya
había medido a mano.

## M. Aceptación provisional

> El Departamento de Matemática de IA **acepta provisionalmente** la
> implementación matemática y de contenido de STAGE-08 para la continuación de
> la hoja de ruta.
>
> Esto **no** es una aprobación del Departamento de Matemática humano, ni una
> certificación curricular, ni una validación de pacing con jugadores reales, ni
> una aprobación final de release.

## N. Gate siguiente

Según la hoja de ruta vigente, con el Departamento de Matemática de IA cerrado
quedan abiertos los gates humanos de STAGE-08 —sign-off manual de la rueda del
Día del Estudiante y playtests de pacing— y el trabajo de producto continúa en
**STAGE-09 · fair mode, servidor autoritativo y ranking**. La revisión del
Departamento de Matemática humano sobre las 42 Templates ocurre en Final
Delivery / Pre-Release Acceptance.

## Estado canónico resultante

```text
STAGE-08 — IN_PROGRESS

STAGE-08 Mathematics Final Closure Sprint      — DONE
Final Mathematics Closure Audit                — PASSED WITH NON-BLOCKING FINDINGS
AI Mathematics Department Provisional Sign-Off — PASSED

Human Mathematics Department Review            — DEFERRED
Real-player pacing validation                  — PENDING
Sign-off manual de la rueda                    — PENDING
STAGE-09 · fair mode y ranking                 — NEXT
```
