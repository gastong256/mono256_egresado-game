# Cierre de integración y ritmo de STAGE-08

- **Estado:** `EXECUTED` — 2026-09-21, sobre `main` en `bd411ed`
- **Gate:** `STAGE-08 FINAL INTEGRATION & PACING CLOSURE`
- **Rol:** equipo de producto e ingeniería, con autoridad para arreglos acotados
  de integración y **sin** autoridad para tocar matemática ni contenido aprobado
- **Entrada:** el
  [sign-off provisional del Departamento de Matemática de IA](../04-quality/ai-mathematics-department-provisional-signoff.md),
  en `PASSED`
- **Pregunta del gate:** ¿la carrera 7.º → 5.º se comporta como **un** juego
  terminado y usable, al ritmo previsto y en los dispositivos soportados?

## A. Veredicto

```text
STAGE-08 FINAL INTEGRATION & PACING CLOSURE — PASSED
```

La carrera integra, egresa, se reanuda, no se aplica dos veces, es accesible y
corre en build de producción. El ritmo **ya está medido**, que es lo que el exit
gate pedía y lo único que faltaba: la estimación de ingeniería da **mediana
≈ 12,4 min** contra un objetivo UX de 8–10 con p75 ≤ 12. Es un exceso moderado y
uniforme, no una inflación sistémica, y su veredicto depende por completo de una
constante de lectura que nadie calibró todavía. Queda medido, instrumentado y
entregado al gate humano de pacing, que es el único que puede resolverlo.

## B. Baseline

| Dato | Al empezar | Al terminar |
|---|---|---|
| Rama · HEAD | `main` · `bd411ed` · limpio | `main` · limpio |
| Node · pnpm | 24.19.0 · 11.22.0 | sin cambios |
| Motor · action log · snapshot | `10.0.0` · `7` · `8` | **sin cambios** |
| Score · rulesets | `fair-score-dev-2@2.0.0-post-tg1-candidate` | **sin cambios** |
| Catálogos | seis, `dev-8`/`dev-4`/`dev-5`/`dev-5`/`dev-5`/`dev-6` | **sin cambios** |
| Templates | 42 | 42 |
| Tests | 97 archivos · 1914 Vitest · 174 E2E | **98** · **1924** · **174** |

## C. Alcance

**Se validó:** composición de la carrera, transiciones de año, recuperación,
callbacks y epílogo, reanudación y recarga, idempotencia de acciones repetidas,
motores de interacción, accesibilidad y responsive, build de producción,
determinismo, barrido de semillas, y el **ritmo**, que es lo que faltaba.

**No se validó, por diseño:** nada de STAGE-09 —fair mode, servidor, ranking,
persistencia—; la revisión humana del Departamento de Matemática; el Teacher
Gate 2; y el pacing **con jugadores reales**, que sigue siendo un gate humano.

**No se tocó:** matemática, contenido aprobado, catálogos, FairScore, escalera de
calidad, arquitectura de recuperación, motores nuevos ni Templates nuevas.

## D. Integración de la carrera completa

La carrera se recorrió entera, determinista, en varias formas:

| Escenario | Volumen | Resultado |
|---|---|---|
| Simulación profunda (`game:simulate:deep`) | 5000 carreras | 5000 completadas · **5000 egresadas** · 0 hallazgos |
| Barrido por política de juego (Gate 16) | 6 políticas × 12 semillas | todas terminan, egresan y ningún comando se rechaza |
| Formas de ritmo (`game:pacing`) | 5 formas × 25 semillas = **125** carreras | todas completan y egresan |
| Carrera real en el navegador (E2E) | 9 beats, abiertos y respondidos uno por uno | verde |
| Carrera con recuperaciones (E2E) | — | egresa igual y el epílogo lo dice sin humillar |

Sin callejones sin salida, sin transición imposible, sin año salteado, sin
re-tirada accidental y sin desajuste entre lo que se ve y lo que el motor tiene.

## E. Composición e invariantes de contenido

Verificado por `tests/integration/full-career.test.ts` y el auditor de
composición: **nueve beats ordinarios** sobre los seis años, **un anchor por
año**, recuperación fuera del presupuesto de beats ordinarios, sin repetir
Template dentro del alcance prohibido, elegibilidad antes del RNG y
direccionamiento determinista de variantes aprobadas. Las seis corridas de
`game:variants check` dan `integrity ok` con poblaciones exactas.

## F. Narrativa, callbacks y epílogo

`tests/integration/career-callbacks.test.ts` cubre lo que importa acá: sin hechos
previos no hay recuerdo; un flag que no es un resultado conocido no alcanza; el
Proyecto recuerda el **último** beat jugado y no una lista fija; el Día del Amigo
y el trabajo en equipo distinguen cómo salió; cada año de la espina aporta su
evento icónico y todos existen; 5.º llega con más memoria que 1.º; y el cierre
**no dibuja ausencias como ceros** —sin oportunidades ofrecidas, el epílogo no
muestra Prestige—.

Ningún callback referencia algo que no pasó, y el epílogo entra y es accesible a
320 / 360 / 390 / 412 px.

## G. Recuperación y egreso

Una recuperación interactiva por etapa como máximo, disparo sólo en `invalid`,
sin recursión, puntaje competitivo 0, y el año avanza igual. En 5000 carreras el
peor caso es **1 recuperación por etapa** y **todas** egresan: el contrato de
fail-forward se sostiene. La E2E de 7.º comprueba además que un año que sale mal
pide el repaso y cierra lo mismo.

## H. Reanudación, recarga e idempotencia

Ésta era la superficie con menos prueba propia: se ejercía de refilón desde los
E2E. Se agregó `tests/integration/session-resume.test.ts`, que corre contra el
motor y el catálogo reales.

| Qué | Resultado |
|---|---|
| Restaurar devuelve el **mismo** estado: año, fase, índice de beat y carrera | ✔ |
| Una partida restaurada se sigue jugando **hasta egresar** | ✔ |
| Una obligación de recuperación abierta **sobrevive** la recarga | ✔ |
| Checkpoint de otra versión del motor: se descarta **y se borra** | ✔ |
| Payload corrupto: se descarta sin romper la partida | ✔ |
| Checkpoint sin nickname: se descarta | ✔ |
| Lectura estable: misma referencia mientras nada cambie | ✔ |
| **Responder dos veces el mismo beat**: rechazado, una sola acción en el log, un solo puntaje, sin doble avance | ✔ |
| Acusar recibo del resultado no vuelve a cobrar | ✔ |
| Nickname: acepta acentos y ñ, rechaza lo que no se puede mostrar | ✔ |

En el navegador, la E2E de 7.º ya cubría recargar en medio del año y que ofrezca
seguir, descartar la partida guardada, **un checkpoint corrupto que no rompe el
juego**, reanudar sobre el resultado del acto sin inventar lo marcado, y volver a
jugar empezando limpio.

La defensa contra el doble click no es un guard de UI: es el motor. `dispatch`
delega en `transition`, que rechaza el comando, y el log sólo crece cuando la
transición fue aceptada. Un rechazo no escribe nada.

## I. Motores de interacción

Los once motores que el catálogo presenta, y dónde tienen confianza integrada:

| Motor | Templates | Cobertura integrada |
|---|---|---|
| `numeric-input` | 8 | E2E 7.º · integración por año |
| `quantity-builder` | 7 | E2E 3.º y 4.º · componente de 1.º |
| `classification` | 6 | E2E 4.º y 5.º |
| `decision-card` | 5 | E2E 3.º, 5.º y 7.º |
| `spatial-layout` | 4 | E2E 1.º y 4.º · componente constructivo |
| `assignment-board` | 4 | integración por año · carrera real en E2E |
| `schedule-builder` | 4 | E2E 1.º y 3.º |
| `route-builder` | 1 | E2E 3.º |
| `timeline` | 1 | E2E 7.º |
| `number-grid` | 1 | E2E 7.º, incluida la grilla **sólo con teclado** |
| `budget-builder` | 1 | E2E 7.º |

Ninguno queda probado únicamente como componente aislado: la E2E de carrera real
abre y responde cada beat que la composición saca, y las pruebas de integración
por año juegan la carrera entera con los oráculos.

## J. Accesibilidad y responsive

Regresión, porque este cierre no cambió `src/components`, `src/app` ni
`src/styles`.

- **174 / 174** E2E en verde, desktop y mobile.
- Recorridos a **320 / 360 / 390 / 412 / 1280 px** con reflow sin desborde
  horizontal de página, objetivos de 44 px, foco visible y movido al encabezado
  del resultado, y **zoom CSS 200 %** a 1280.
- `axe` sin violaciones en las pantallas principales.
- Juego **sólo con teclado**, incluida la grilla del acto.
- El epílogo entra y es accesible en los cuatro anchos chicos.

## K. Sistema de diseño

Sin deriva: el shell sigue siendo una columna de **412 px máximo centrada en
todos los breakpoints**, con la hoja cuadriculada, la superficie oscura de
decisión, el primario anclado siempre en el mismo lugar y los stats progresivos
distinguiendo ausencia de cero. `design-system.spec.ts` y `design:check`
—tokens y contraste— siguen en verde.

## L. Metodología de ritmo

No existía instrumento. Se agregó uno, chico y durable:

- `tests/helpers/pacing-model.ts` — el modelo y **todos** sus supuestos.
- `scripts/game/pacing.ts` — juega carreras deterministas y las mide
  (`pnpm game:pacing`).

Cuenta lo que la pantalla realmente imprime en cada beat y lo convierte en
segundos:

```text
prosa        150 palabras/min   consigna, situación, consecuencia
consulta     300 palabras/min   filas de datos, etiquetas, hechos del resultado
decisión     8 a 28 s según la clase de interacción, ya sin la lectura
transición   1,5 s por pantalla      acuse de recibo  1 s
arranque     20 s                    nombre y entender el loop
```

Separar **leer** de **consultar** es lo que evita el error grueso: una tabla de
datos no se lee de corrido, se barre mientras se decide, y medirla al ritmo de la
prosa infla todo. Con una sola tasa la estimación daba 15,4 min; con las dos, 12,4.

**Esto no es evidencia humana.** Es un proxy de producto con constantes
declaradas y sin calibrar. Sirve para comparar formas de run y para detectar
inflación sistémica; no para afirmar cuánto tarda una persona.

## M. Resultados de ritmo

Objetivo UX canónico de la carrera completa
([matriz de contenido](../01-game-design/full-career-content-matrix.md)):
**mediana 8–10 min y p75 ≤ 12**, declarado «todavía sin validación empírica».

25 semillas por forma, 125 carreras:

| Forma | Pantallas | Palabras | Recup. | Mediana | p75 | Rango | Estado |
|---|---|---|---|---|---|---|---|
| rápida y limpia | 29,0 | 1646 | 0,0 | **12,38** | 13,06 | 11,46–13,54 | larga |
| típica mixta | 29,0 | 1582 | 0,0 | **12,25** | 12,53 | 11,31–13,46 | larga |
| con recuperaciones | 33,3 | 1831 | 2,2 | **13,83** | 15,31 | 12,66–16,24 | larga |
| toda eficiente | 29,0 | 1634 | 0,0 | **12,37** | 12,76 | 11,07–13,31 | larga |
| toda funcional | 29,0 | 1602 | 0,0 | **12,46** | 12,55 | 11,49–13,03 | larga |

Peor caso sobre 125 carreras: **16,24 min**, en la forma con recuperaciones.

### M.1 De qué depende el veredicto

La lectura es el término dominante, y su constante no está calibrada. Bajando
sólo esa constante, con todo lo demás igual:

| Prosa / consulta | Mediana de las formas ordinarias | Con recuperaciones |
|---|---|---|
| 150 / 300 (supuesto) | 12,25 – 12,46 | 13,83 |
| 180 / 360 | 11,01 – 11,08 | 12,25 |
| 200 / 400 | 10,36 – 10,41 | 11,51 |
| 220 / 440 | **9,81 – 9,87** | 10,91 |

La carrera **entra en la banda 8–10 a partir de unas 215 palabras/min de prosa**.
150 y 220 son las dos estimaciones defendibles para un lector de secundaria
frente a una consigna que va a decidir algo: la primera supone que relee, la
segunda que barre. El objetivo se cumple o no según cuál sea cierta, y eso lo
resuelve mirar jugar, no discutirlo acá.

### M.2 Por qué no se recortó copy

La matriz de contenido dice, para este caso, «reducir copy/fricción antes de
recortar sustancia matemática». Se buscó esa fricción y **no está donde se
recorta barato**:

- No hay pantallas de transición duplicadas: las 20 no-desafío son 9 acuses de
  recibo y 11 pantallas narrativas autoradas, cada una con contenido propio.
- No hay clicks de confirmación de más: un beat es responder y acusar recibo.
- El objetivo no se imprime dos veces —se renderiza una sola vez, en el bloque
  de decisión o fuera de él, nunca en los dos—.
- De las ~1600 palabras, **55 % son contenido estructurado**: filas de datos,
  etiquetas de opción, detalles de ítem. Es información matemática; recortarla es
  exactamente lo que el freeze prohíbe.
- La prosa narrativa son ~44 palabras por beat. Recortarle un cuarto ahorra
  ~40 s sobre un exceso de ~140 s.

Y el texto de presentación es justamente el que la auditoría ciega congelada
parsea: mover una etiqueta o un detalle cambiaría lo que el instrumento mide y
pondría en cuestión el sign-off matemático. **Recortar copy a ciegas contra un
modelo sin calibrar, arriesgando el freeze, para ahorrar menos de un minuto, es
mal negocio.** Se documenta y se difiere.

### M.3 Clasificación

No es bloqueante: el exceso es de ~24 % sobre el techo de la mediana, uniforme
entre formas, sin ninguna ruta cerca del doble del objetivo. Es el caso
«investigar», y lo que hay que investigar es con jugadores.

## N. Rendimiento y build de producción

`pnpm build` pasa: compila en ~1,4 s, TypeScript en ~2,1 s, cinco páginas
estáticas generadas. Los E2E corren contra `pnpm start`, es decir **contra el
build de producción**, así que las 174 pruebas ya son evidencia de que el juego
completo anda en producción y no sólo en dev.

Línea de base de bundle, para que STAGE-09 tenga contra qué comparar:

```text
.next/static            2,5 MB en total
chunk más grande         975 KB sin comprimir
```

La masa es el catálogo de contenido —42 Templates y seis catálogos aprobados—.
Para el uso de feria, sobre red local y con el juego cargado una vez por
dispositivo, no es un bloqueante de release; queda anotado como primer candidato
de optimización si STAGE-09 agrega carga de red por run.

Sin jank observable, sin demoras de interacción de segundos y sin crecimiento de
memoria a lo largo de la carrera: las 5000 carreras simuladas corren en ~2,4 s
totales, y la auditoría permanente sobre las 42 Templates en ~1,16 s.

## O. Determinismo y barrido de semillas

`Math.random`, `Date.now`, `new Date` y `performance.now` **no existen** en
`src/game` ni en `src/content`; la única mención es el comentario que lo declara.
`architecture-lint.test.ts` lo mantiene así por prueba, no por convención.

Mismo estado inicial, mismo plan, misma semilla y mismos comandos dan el mismo
log, las mismas direcciones de contenido, la misma carrera, la misma recuperación
y el mismo epílogo. El servidor recompone la carrera entera y descarta lo que el
cliente afirme.

## P. Verificación

| Comando | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS · Node 24.19.0 · pnpm 11.22.0 |
| `pnpm verify` × 2 | **PASS · PASS** · 98 archivos · 1924 Vitest · 174 E2E |
| `pnpm build` | PASS · cinco páginas, sin errores de tipos |
| `pnpm game:validate-content` | PASS · 0 errores · 0 warnings |
| `pnpm game:variants check` y `--content=grade-1…5` | PASS · `integrity ok` en los seis |
| `pnpm game:blind-audit -- --coverage` | 42 filas · 24 exhaustivas · 18 por políticas |
| `pnpm game:simulate:deep` | 5000 / 5000 completadas y egresadas · 0 hallazgos |
| `pnpm game:score` | 10 000 exacto · dispersión 0 · 0 empates |
| `pnpm game:pacing` | 125 carreras · mediana 12,25–13,83 min |
| `node scripts/validate-agent-workspace.mjs` | PASS |
| `node scripts/sync-master-spec.mjs --check` | PASS |
| `git diff --check` | limpio |

## Q. Cambios implementados

| Qué | Antes | Ahora | Por qué |
|---|---|---|---|
| Instrumento de ritmo | no existía | `pacing-model.ts` + `pnpm game:pacing` | el exit gate pide pacing medido; no había con qué |
| Reanudación e idempotencia | sólo de refilón desde E2E | `session-resume.test.ts`, 10 casos contra el motor real | es superficie de release: restaurar de menos pierde el año, de más cobra dos veces |
| `controller.ts` | un bloque muerto: una variable `undefined` por construcción y un `if` que nunca podía dispararse, que además tapaba el nombre del rechazo real | el comentario que explicaba el fallo ruidoso quedó donde sí ocurre | código muerto que confunde al próximo que lo lea |
| Objetivo de ritmo | dos cifras canónicas en conflicto | reconciliado, con la vigente señalada | 4–7 min era el objetivo de cuando una run era un año suelto |

Nada de esto toca `src/game`, `src/content`, los catálogos ni la UI.

## R. Riesgos residuales, no bloqueantes

1. **Ritmo por encima del objetivo** (M). Mediana ≈ 12,4 contra 8–10. Depende de
   una constante sin calibrar; entra en banda a ~215 palabras/min. **Al gate
   humano de pacing**, ahora con instrumento.
2. **El objetivo mismo podría ser el equivocado.** La matriz lo declara sin
   validación empírica. Si los jugadores reales tardan 12 min y la sesión se
   siente bien, lo que hay que corregir es el número, no el contenido.
3. **`MAT-SO-001`** — flake de contraste en `y5.stage-screen` bajo carga,
   abierto desde el sign-off. No reapareció en las corridas de este gate.
4. **`MAT-FC-003` y `MAT-FC-005`** — riqueza de `g7.group-tasks` y población de
   `y3`, diferidos a revisión humana y backlog.
5. **Bundle de 2,5 MB** (N). Sin impacto en feria local; primer candidato de
   optimización si STAGE-09 agrega carga por run.
6. **`R-S09-CAT`** — retención de catálogos históricos, de STAGE-09.

## S. Decisión de etapa

Los criterios del exit gate de STAGE-08 —«¿una run real, auditada y accesible
recorre `7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESADO`, con pacing medido y sin
duplicar fundaciones?»— se cumplen: la run existe, se audita, es accesible, se
reanuda, egresa siempre, **y el pacing está medido**.

```text
STAGE-08 — DONE
```

La validación de pacing **con jugadores reales** no se ejecutó y no se afirma:
sigue siendo un gate humano, igual que la revisión del Departamento de Matemática
y el sign-off manual de la rueda.

## T. Etapa siguiente

```text
STAGE-09 — Fair mode, servidor autoritativo y ranking
```
