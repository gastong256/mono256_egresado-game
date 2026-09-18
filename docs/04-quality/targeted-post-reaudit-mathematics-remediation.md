# Implementación de la remediación matemática dirigida · ronda 2

## A. Veredicto

**TARGETED POST-REAUDIT MATHEMATICS REMEDIATION — DONE**.
Los cinco contratos de ronda 2 están implementados y verificados.
La implementación no ejecuta la re-auditoría independiente ni el sign-off.

## B. Baseline y recuperación del trabajo

`main`, HEAD `748db1d4ed46e5943ce413b434ab2a8a2b8cdd47` (adjudicación),
37 commits locales por delante de origin. Se retomaron seis archivos modificados
y un helper nuevo del agente anterior, todos atribuibles a esta tarea; no se
sobrescribió trabajo ajeno. Su evidencia `baseline-audit.txt` reproducía los dos
hallazgos antes de sus correcciones. Se volvió a ejecutar la misma instrumentación
sobre un worktree aislado del HEAD base, sin aplicar allí cambios de contenido.

Baseline: motor `10.0.0`, action log `7`, snapshot `8`, 42 Templates,
41 generadores, 1026 entradas en `grade-5-dev-4`; 95 archivos de test,
1739 tests, 0 todo y 158 E2E según la baseline canónica.

## C. Autoridad consumida

Ambas fuentes del commit `748db1d` se conservaron sin enmiendas:

- [Adjudicación posterior](post-reaudit-mathematics-findings-adjudication.md).
- [Especificación de ronda 2](post-reaudit-mathematics-remediation-spec.md).

Se aplicaron sus techos, prioridades, alcance y decisiones; no se readjudicaron.
ADRs 013/020/021 y D-S08-088/109 gobiernan exactitud, catálogos y versiones.
Las fichas de 3.º y 4.º conservan STANDARD/MEDIUM/PROJECT, recovery y scorer.

## D. Paquetes y matriz contractual

| Finding | Decisión | Prioridad / bloqueo | Paquete / contrato | Before → after | Criterio | Versión |
|---|---|---|---|---|---|---|
| MAT-RA-006 | REQUIRED_CORRECTION | P0 / sí | WP-RA-AUDIT / RS-RA-AUDIT-001 | 19 exhaustivas, 23 sin medición completa → 24 exhaustivas y 18 con políticas | 42 filas con categoría/razón; reproducción previa | tooling |
| MAT-RA-001 | REQUIRED_CORRECTION | P0 / sí | WP-RA-001 / RS-RA-001 | 26 causas falsas → 0 en 3146 respuestas | rama iff demora sola; twin invalid | contenido 7.º y posteriores; textos 2.º/4.º |
| MAT-RA-002 | REQUIRED_CORRECTION | P0 / sí | WP-RA-002 / RS-RA-002 | K 95,8333 / S 83,3333 % → K 35,8 / S 20 % | K ≤65 / S ≤35 % | generador 2; contenido 3.º+ |
| MAT-RA-003 | REQUIRED_CORRECTION | P0 / sí | WP-RA-003 / RS-RA-003 | K 92,8 / S 92 % → K 62,4 / S 28 % | K ≤65 / S ≤35 %; ≥3 órdenes, ninguno >50 % | generador 2; contenido 4.º+ |
| MAT-RA-008 | REQUIRED_CORRECTION | P1 / no matemático | WP-RA-TEST / RS-RA-TEST-001 | arranque ESLint dentro de caso → beforeAll | tres verify consecutivos | sólo tests |

Orden ejecutado: instrumentación y reproducción → Repaso → proyecto 3.º →
proyecto 4.º → warmup → republicación y docs → verificación. Los intentos de diseño
se midieron sobre catálogos en memoria; sólo el resultado final se publicó.

Los cinco paquetes y WP-RA-CATALOGS/DOCS/VERIFY quedan **DONE / PASS**.
Pruebas directas: RS-RA-AUDIT-001 y techos RS-RA-002/003 en
`tests/integration/blind-strategy-audit.test.ts`; RS-RA-001 en
`tests/unit/grade-7-content.test.ts` y `tests/integration/mathematics-remediation.test.ts`;
oráculos RS-RA-002/003 en `tests/unit/grade-3-project-tech.test.ts` y
`tests/unit/grade-4-fundraiser.test.ts`; RS-RA-TEST-001 en
`tests/unit/architecture-lint.test.ts` y los tres `pnpm verify` de la sección M.

## E. Evidencia before → after

| Template | N antes / después | Espacio completo | Mejor constante antes → después | Histograma antes → después (o/e/f/i) | Óptimos distintos después |
|---|---|---|---|---|---|
| y3.course-project-tech | 24 / 25 | 1573 | 4-4-6 → 2-7-4 | 20/4/0/0 → 5/3/0/17 | 116 |
| y4.course-project-fundraiser | 25 / 25 | 630 | 3-0-9 → 2-2-2 | 23/0/0/2 → 0/16/9/0 | 283 |

S mide el mayor número de óptimas de cualquier constante, no necesariamente la
que maximiza K: en 4.º la constante de S es `7-2-0`, óptima en 7/25.
R antes (redondeado): 27,6 en 3.º y 30,0 en 4.º; después: 12,830769 y
21,591111. Todo es enumeración, sin sampling.

## F. Auditoría permanente

`tests/helpers/blind-strategy-space.ts` describe capacidades desde la presentación:
coordenadas estables, cardinal, firma y políticas. No conoce IDs de Templates ni
soluciones. Cantidades/presupuestos enumeran el producto cartesiano completo;
asignaciones estables también, incluida la omisión de tareas. Firmas que cambian
pasan a C; espacios por encima del presupuesto a B; geometría/agenda/recorrido
a D. Los estados bloqueados requieren razón; el catálogo actual no tiene ninguno.

Presupuesto técnico: **60.000 evaluaciones por Template**, contando posturas.
El mayor caso publicado cuesta 54.675 (729 × 25 × 3) y el proyecto tecnológico
39.325. El reporte `--timing` separa medición temporal de la salida determinista.
La medición final dio **831,3 ms** para el baseline y **938,3 ms** para el
catálogo corregido, con peor Template en **268,0 ms**. Bajo pruebas concurrentes
se observaron también 1,133 s y 2,045 s; el límite se expresa en evaluaciones. No es un
SLA de CI: es evidencia de tratabilidad y margen acotado, no millones sin medir.

Familias: mínimos/máximos/mitad/primero/proporciones; asignación primera/cíclica/
equilibrada/orden; agenda temprano/tarde/orden/uniforme; espacial origen/
orientación/primer hueco/filas/huella; ruta orden/inverso/vecino; grilla y
clasificación todo/nada/patrón. No consultan el evaluador para elegir una respuesta.
Las políticas rechazadas se cuentan explícitamente; para ordenar políticas reciben
el piso convencional 10, no un puntaje competitivo real. El histograma incluye
esos rechazos como invalid. Espacial y recorrido no declaran un cardinal parcial
que omita rotaciones o respuestas incompletas.

Los techos sólo existen donde hay contrato. `screenChoices` comparte `tierOf`,
`surveyPlans` comparte `surveyClaims` y `standingsPlans` comparte `independentTruths`:
esas comparaciones verifican agregación, no verdad independiente. Las pruebas
geométricas separadas de RS-MAT-008 conservan su alcance.

## G. RS-RA-001 e inventario

La demora sola es `normal × porcentaje / 100`; la duración exacta suma el normal.
Se compara con signo contra la demora, no contra `abs(respuesta − exacta)`.
Las 26 segundas raíces `exacta + normal` pasan de functional a invalid por la
escalera existente. Se prueban todos los valores enteros 0–120, los cuatro niveles,
la causa en ambas direcciones y la equivalencia de rama.

La re-verificación por condición real encontró además un texto falso preexistente
en la peña: **9876 de 15750 planes** de la baseline excedían cocina con ganancia
no negativa y aun así decían «termina costando plata». Ahora esa rama nombra la
capacidad insuficiente. Efficient dice «falta para el colchón» en lugar de «justo».
La misma re-verificación encontró la consecuencia inválida de las postas que
afirmaba superposición **y** pared sin que esa conjunción fuera condición de rama:
se reemplaza por una consecuencia general, conservando la restricción precisa.
En la cola, 251 de 532 planes funcionales publicados tenían margen positivo;
ahora «justo» se reserva para margen cero y el resto muestra el margen calculado.
Son correcciones textuales de RS-RA-001.6, sin alterar niveles ni parámetros.
Es aplicación de RS-RA-001.6; narrate/present fijados por RS-MAT-011 permanecen iguales.
No cambió la escalera, Estilo ni la recuperación. Ver el
[inventario actualizado](mathematics-remediation-feedback-inventory.md).

## H. RS-RA-002

Doce objetivos posibles de 2–6 minutos de video, 2–7 entrevistas y 3–8 láminas;
once están presentes en el catálogo. El mínimo se obtiene restando cantidades
pequeñas al objetivo. Notebook con 4 u 8 minutos de holgura sobre el costo objetivo;
pendrive y laboratorio con holguras distintas ligadas al costo y a la tasa.
El laboratorio corto se calcula desde los MB objetivo, no desde la capacidad del
pendrive (esa expresión heredada lo volvía redundante).

El supremo `(6,7,8)` cuesta 55 minutos de notebook y ninguna variante publicada
ofrece más de 53: no hay un plan admisible que domine todos los objetivos.
Gates preservan al menos dos recursos materiales, tres niveles válidos, diferencias
de Equipo entre óptimos y Math óptima con Equipo máximo. Notebook 23–53 min,
pendrive 1050–3200 MB, laboratorio 5–29 min; máximos UI 10/10/12 intactos.
Formas publicadas: pendrive 9, laboratorio 8, notebook 8. Oráculo independiente:
39.325 planes contra desigualdades enteras, sin reutilizar readTech/techPlans.

## I. RS-RA-003

Las formas semánticas ahora declaran qué producto rinde más por minuto:
`rinden-panchos`, `rinden-tortas`, `rinden-bebidas`. Cambia el enum de **contenido**,
no un schema de motor, de interacción, snapshot ni action log. Los máximos de UI
8/6/9 siguen fijos. Se rotan seis órdenes de margen/minuto con minutos 10/25/40 y
márgenes legibles; costos, fijo, objetivo y reserva siguen visibles.

El objetivo se deriva del techo de ganancia dejando más de un cuarto de cocina
libre, menos reserva y una holgura pequeña: aprieta sin eliminar la estrategia
improvisadora óptima ni el gate de Estilo. Las tres condiciones son alcanzables
por separado en las 25 variantes. No se recalibró calidad ni Estilo.

Órdenes publicados (ítems 0 panchos, 1 tortas, 2 bebidas): `1>2>0:5`, `2>0>1:5`,
`0>2>1:5`, `1>0>2:5`, `2>1>0:2`, `0>1>2:3`. Seis órdenes, máximo 20 %.
Antes: un orden al 100 %. Holgura `ganancia máxima − objetivo − reserva`:
antes 5000/18000/35000 (mínima/mediana/máxima), después **6000/9000/13000**.
Oráculo independiente: 15.750 planes; calidad, Estilo, tres condiciones y feedback.
La verosimilitud sigue sometida a H-9, sin declarar revisión humana.

## J. Corrección técnica y decisiones conservadas

ESLint se calienta en beforeAll con 15 s propios para resolver configuración;
el antecedente medido fue 5575 ms bajo cobertura. La reproducción aislada en
el worktree baseline midió 1790,14 ms en la primera llamada y 6,24 ms en la segunda. Ningún test individual ni
presupuesto global se amplió, no hay retries nuevos ni cobertura excluida.
La verificación adicional detectó un caso existente del Intercurso que enumeraba
todas las variantes en una sola prueba (5139 ms): ahora cada variante es un caso,
con exactamente las mismas aserciones. La regresión nueva de postas construye su
contraejemplo directamente, evitando una búsqueda óptima ajena a lo que prueba.

Las erratas de 13/14, K_min(N), RS-MAT-011, ADR-021 y R-S09-CAT ya estaban
aplicadas por `748db1d`: se conservaron, sin duplicarlas ni borrar historia.
H-6…H-10 ya están en el paquete humano y conservan sus preguntas.

## K. Versiones y catálogos

| Año | Contenido antes → después | Catálogo antes → después | Entradas después |
|---|---|---|---|
| 7.º | 0.10.0 → 0.11.0-grade-7 | grade-7-dev-6 → grade-7-dev-7 | 185 |
| 1.º | 1.1.0 → 1.2.0-grade-1 | grade-1-dev-2 → grade-1-dev-3 | 359 |
| 2.º | 2.2.0 → 2.3.0-grade-2 | grade-2-dev-3 → grade-2-dev-4 | 508 |
| 3.º | 3.2.0 → 3.3.0-grade-3 | grade-3-dev-3 → grade-3-dev-4 | 682 |
| 4.º | 4.2.0 → 4.3.0-grade-4 | grade-4-dev-3 → grade-4-dev-4 | 854 |
| 5.º | 5.3.0 → 5.4.0-grade-5 | grade-5-dev-4 → grade-5-dev-5 | 1027 |

Generadores de ambos proyectos: 1 → 2. Sin cambios de motor 10.0.0, action log 7,
snapshot 8, rulesets ni score `fair-score-dev-2@2.0.0-post-tg1-candidate` 85/10/5.
Huellas finales: motor `4bcf054e`, ruleset de carrera `7d41fddb`, contenido
`92b6edb6` (antes `72435ee3`). Sólo cambia la identidad del contenido.
7.º conserva dev-1…dev-6 byte a byte; dev-7 tiene exactamente las mismas entradas
que dev-6. Los catálogos draft 1.º–5.º se renombraron según D-S08-088/109.
No se afirma retención histórica que la arquitectura aún no implementa.

## L. Regresiones

La suite verifica carrera perfecta 10.000, egreso, Repaso con score competitivo 0,
reanudación, replay y recomputación del servidor. Nuevos recorridos de los proyectos
comprueban 320/360/390/412 px y desktop, teclado, foco del feedback, controles de
44 px y axe. A desktop se suma reflow con zoom CSS 200 %: no se presenta como
emulación de zoom nativo del navegador. La UI y el sistema de diseño no cambiaron.

## M. Verificación

Los tres `pnpm verify` consecutivos terminaron en exit 0 sobre el código final,
sin retries nuevos ni tests concurrentes externos. Cobertura del último pase:
statements 85,07 %, branches 76,84 %, functions 86,93 %, lines 85,19 %. Cada pase ejecutó 96 archivos,
**1883 tests** de Vitest, 0 todo, y **174 E2E**.

| Pase | Resultado | Duración total |
|---|---|---|
| 1 | PASS | 454.52 s |
| 2 | PASS | 460.33 s |
| 3 | PASS | 445.98 s |

Comandos ejecutados y alcance:

- `pnpm toolchain:check`: Node 24.19.0 / pnpm 11.22.0 alineados.
- `pnpm install --frozen-lockfile`: PASS, lockfile sin cambios.
- `pnpm game:validate-content -- --content=grade-5 --seeds=300 --stats`:
  las 42 Templates y 50 storylets, 0 errores y 0 warnings.
- `pnpm game:variants check` y `pnpm game:variants check --content=grade-1`,
  `--content=grade-2`, `--content=grade-3`, `--content=grade-4`, `--content=grade-5`:
  todos PASS en cada verify. La comprobación reconstruye cada catálogo y exige igualdad.
- `pnpm game:blind-audit -- --coverage --keys --timing`: 42 filas, 24 exhaustivas,
  18 políticas, 0 no aplicables y 0 bloqueadas; techos contractuales en verde.
- `pnpm game:simulate:deep`: 5000/5000 runs completadas y egresadas, 0 hallazgos;
  peor caso un Repaso. El verify añade simulaciones de cada práctica por año.
- `pnpm game:score`: 23000 planes, todas las carreras perfectas en 10000,
  dispersión 0, FairScore 85/10/5 intacto. La carrera real y el servidor se prueban
  además en la suite de integración.
- `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e:only`: PASS dentro de cada verify.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm design:check`,
  `pnpm secrets:check`: PASS dentro de cada verify.
- `node scripts/validate-agent-workspace.mjs`,
  `node scripts/sync-master-spec.mjs --check`, `git diff --check`: PASS;
  repetidos después de reconciliar esta evidencia documental.

Reproducción de baseline: worktree aislado en `748db1d`, copiando sólo los dos
helpers y el CLI de auditoría. Se ejecutó
`./node_modules/.bin/vite-node --config vitest.config.ts scripts/game/blind-audit.ts --coverage --keys --timing`.
El wrapper pnpm rechazó el node_modules enlazado (`ERR_PNPM_UNSAFE_MODULES_DIR`);
invocar el binario instalado evitó modificar dependencias o contenido del baseline.

Fallos de iteración diagnosticados: primera publicación parcial aún sin todos
los artefactos y presupuesto inicial 50000 que dejaba la clasificación final en
políticas; se completó la publicación y se midió el presupuesto final 60000.
El fixture nuevo de presentación omitía `detail` y no estrechaba la unión; se
corrigió. Al declarar cardinalidad desconocida para geometría/recorridos faltaba
admitir undefined explícito con exactOptionalPropertyTypes; corregido. Un gate
rechazó el orden del manifest y quedó ordenado. El E2E medía sólo la casilla de
20 px: ahora mide también su etiqueta clicable de 44 px; 48 casos focales PASS.
La cobertura detectó el caso monolítico del Intercurso (5139 ms) y la búsqueda
innecesaria de la nueva prueba de postas (7781 ms): se separaron variantes sin
quitar aserciones y se construyó el contraejemplo directamente. Tras esas
correcciones se inició la serie de tres gates, sin reintentos para esconder fallos.

DB, Docker y release público no ejecutados: no se modificaron esas superficies
ni se desplegó. No se ejecutó la re-auditoría independiente de ronda 2.


## N. Hallazgos aceptados o diferidos

MAT-RA-004: revisión humana H-7; MAT-RA-005: riesgo aceptado H-6,
K 84,6154 / S 57,6923 %; MAT-RA-009: STAGE-09, R-S09-CAT.
MAT-RA-007: documentación resuelta; MAT-RA-010: conteos históricos ya corregidos.
RS-MAT-008 sigue K=78 a N=25, S=40 %, excepción estrecha intacta;
OQ-66 y OQ-67 siguen cerradas. No se alteró el comportamiento de esas Templates.

## O. Handoff

`Independent Mathematics Re-Audit Round 2 — NEXT`.
Sign-off provisional bloqueado hasta su PASS; revisión humana diferida;
pacing real pendiente; STAGE-08 permanece IN_PROGRESS.

## P. Matriz de cobertura medida

| Template | Motor | N | Puntuable | Categoría | Estado | Cardinal | Mejor estrategia ciega | Métrica | Histograma o/e/f/i | Umbral contractual | Razón |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `g7.bus-latest-departure` | numeric-input | 26 | sí | A | AUDITED_EXHAUSTIVELY | 121 | constante `64` | K 53.5 · S 19.2 % | 2/10/10/4 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `g7.bus-timing` | timeline | 26 | sí | A | AUDITED_EXHAUSTIVELY | 4 | constante `#0` | K 84.6 · S 57.7 % | 10/16/0/0 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `g7.bus-travel-review` | numeric-input | 26 | no | A | AUDITED_EXHAUSTIVELY | 121 | constante `44` | K 28.5 · S 11.5 % | 1/6/0/19 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `g7.group-tasks` | assignment-board | 2 | sí | A | AUDITED_EXHAUSTIVELY | 625 | constante `2-3-4-1` | K 100.0 · S 100.0 % | 2/0/0/0 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `g7.may-25-act` | number-grid | 27 | sí | D | AUDITED_BY_POLICIES | 16777216 | marcar todo | política 10.0 · óptima en 0/27 · rechazadas 0 | 0/0/0/27 | sin techo; sólo medición | number-grid nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `g7.mural-paint` | decision-card | 26 | sí | A | AUDITED_EXHAUSTIVELY | 3 | constante `#2` | K 67.7 · S 53.8 % | 12/0/14/0 | K ≤ 73 | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `g7.notebook-offer` | decision-card | 26 | sí | A | AUDITED_EXHAUSTIVELY | 2 | constante `#1` | K 58.5 · S 53.8 % | 14/0/0/12 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `g7.stand-supplies` | budget-builder | 26 | sí | A | AUDITED_EXHAUSTIVELY | 702 | constante `0-0-4` | K 29.8 · S 15.4 % | 4/1/3/18 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y1.classroom-layout` | spatial-layout | 25 | sí | D | AUDITED_BY_POLICIES | — | primer hueco | política 64.0 · óptima en 15/25 · rechazadas 0 | 15/0/0/10 | sin techo; sólo medición | spatial-layout nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y1.course-project-expo` | assignment-board | 25 | sí | C | AUDITED_BY_POLICIES | 1024 | cíclica | política 72.4 · óptima en 0/25 · rechazadas 0 | 0/24/0/1 | sin techo; sólo medición | el espacio de respuesta cambia entre variantes (2 formas distintas): no hay respuesta constante comparable |
| `y1.mobile-data` | quantity-builder | 25 | sí | C | AUDITED_BY_POLICIES | 1625 | primer ítem al máximo | política 40.0 · óptima en 0/25 · rechazadas 0 | 0/0/25/0 | sin techo; sólo medición | el espacio de respuesta cambia entre variantes (4 formas distintas): no hay respuesta constante comparable |
| `y1.rehearsal-schedule` | schedule-builder | 25 | sí | D | AUDITED_BY_POLICIES | 34884 | agenda vacía | política 10.0 · óptima en 0/25 · rechazadas 0 | 0/0/0/25 | sin techo; sólo medición | schedule-builder nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y1.scale-fit-review` | spatial-layout | 24 | no | D | AUDITED_BY_POLICIES | — | fila a fila | política 100.0 · óptima en 24/24 · rechazadas 0 | 24/0/0/0 | sin techo; sólo medición | spatial-layout nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y1.schedule-review` | schedule-builder | 25 | no | D | AUDITED_BY_POLICIES | 72 | repartido uniforme | política 40.0 · óptima en 0/25 · rechazadas 0 | 0/0/25/0 | sin techo; sólo medición | schedule-builder nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y1.student-day-challenge-wheel` | quantity-builder | 25 | sí | C | AUDITED_BY_POLICIES | 4084101 | primer ítem al máximo | política 23.2 · óptima en 0/25 · rechazadas 0 | 0/0/11/14 | sin techo; sólo medición | el espacio de respuesta cambia entre variantes (8 formas distintas): no hay respuesta constante comparable |
| `y2.course-project-survey` | classification | 25 | sí | A | AUDITED_EXHAUSTIVELY | 64 | constante `011101` | K 52.8 · S 32.0 % | 2/10/8/5 | K ≤ 60; S ≤ 35 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y2.court-zones` | spatial-layout | 25 | sí | D | AUDITED_BY_POLICIES | — | empaque desde el origen | política 10.0 · óptima en 0/25 · rechazadas 0 | 0/0/0/25 | sin techo; sólo medición | spatial-layout nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y2.data-claim-review` | classification | 25 | no | A | AUDITED_EXHAUSTIVELY | 8 | constante `111` | K 72.6 · S 52.0 % | 6/13/6/0 | K ≤ 75; S ≤ 60 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y2.intercurso-plan` | assignment-board | 25 | sí | B | AUDITED_BY_POLICIES | 15625 | equilibrada | política 42.4 · óptima en 9/25 · rechazadas 0 | 9/0/0/16 | sin techo; sólo medición | espacio de 15625 respuestas por variante: 390625 evaluaciones exceden el presupuesto de 60000 |
| `y2.standings-claim` | classification | 25 | sí | A | AUDITED_EXHAUSTIVELY | 81 | constante `1221` | K 56.6 · S 20.0 % | 4/5/16/0 | K ≤ 65; S ≤ 35 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y2.team-kit-order` | quantity-builder | 24 | sí | C | AUDITED_BY_POLICIES | 2160 | mitad del máximo | política 10.0 · óptima en 0/24 · rechazadas 0 | 0/0/0/24 | sin techo; sólo medición | el espacio de respuesta cambia entre variantes (22 formas distintas): no hay respuesta constante comparable |
| `y3.course-project-tech` | quantity-builder | 25 | sí | A | AUDITED_EXHAUSTIVELY | 1573 | constante `2-7-4` | K 35.8 · S 20.0 % | 5/3/0/17 | RS-RA-002: K ≤ 65; S ≤ 35 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y3.fixed-variable-review` | numeric-input | 25 | no | A | AUDITED_EXHAUSTIVELY | 99 | constante `22` | K 24.4 · S 16.0 % | 4/0/0/21 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y3.friend-day` | schedule-builder | 25 | sí | D | AUDITED_BY_POLICIES | 20592 | repartido uniforme | política 24.4 · óptima en 4/25 · rechazadas 0 | 4/0/0/21 | sin techo; sólo medición | schedule-builder nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y3.rate-capacity-review` | numeric-input | 25 | no | A | AUDITED_EXHAUSTIVELY | 100 | constante `4` | K 40.8 · S 20.0 % | 5/4/2/14 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y3.route-plan` | route-builder | 24 | sí | D | AUDITED_BY_POLICIES | — | orden presentado | política 40.0 · óptima en 8/24 · rechazadas 0 | 8/0/0/16 | sin techo; sólo medición | route-builder nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y3.transport-pass` | decision-card | 25 | sí | A | AUDITED_EXHAUSTIVELY | 4 | constante `#1` | K 64.2 · S 28.0 % | 6/7/12/0 | K ≤ R + 10; S ≤ 40 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y3.week-planner` | schedule-builder | 25 | sí | D | AUDITED_BY_POLICIES | 82368 | sólo lo obligatorio, temprano | política 19.6 · óptima en 0/25 · rechazadas 0 | 0/0/8/17 | sin techo; sólo medición | schedule-builder nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y4.course-project-fundraiser` | quantity-builder | 25 | sí | A | AUDITED_EXHAUSTIVELY | 630 | constante `2-2-2` | K 62.4 · S 28.0 % | 0/16/9/0 | RS-RA-003: K ≤ 65; S ≤ 35 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y4.event-floor-plan` | spatial-layout | 25 | sí | D | AUDITED_BY_POLICIES | — | huella mínima | política 31.6 · óptima en 6/25 · rechazadas 0 | 6/0/0/19 | sin techo; sólo medición | spatial-layout nombra posiciones, personas u horarios de cada variante: no hay respuesta constante comparable |
| `y4.margin-review` | numeric-input | 25 | no | A | AUDITED_EXHAUSTIVELY | 100 | constante `6` | K 49.8 · S 40.0 % | 10/1/1/13 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y4.represent-class` | classification | 24 | sí | A | AUDITED_EXHAUSTIVELY | 32 | constante `11101` | K 59.6 · S 29.2 % | 0/16/5/3 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y4.school-event-flow` | quantity-builder | 24 | sí | A | AUDITED_EXHAUSTIVELY | 125 | constante `2-2-1` | K 54.4 · S 16.7 % | 3/9/7/5 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y4.shift-coverage` | assignment-board | 24 | sí | B | AUDITED_BY_POLICIES | 15625 | cíclica | política 15.4 · óptima en 0/24 · rechazadas 0 | 0/2/0/22 | sin techo; sólo medición | espacio de 15625 respuestas por variante: 375000 evaluaciones exceden el presupuesto de 60000 |
| `y4.spatial-capacity-review` | numeric-input | 25 | no | A | AUDITED_EXHAUSTIVELY | 401 | constante `72` | K 41.4 · S 20.0 % | 3/7/2/13 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y5.course-project-final` | classification | 25 | sí | A | AUDITED_EXHAUSTIVELY | 729 | constante `112121` | K 56.8 · S 28.0 % | 0/18/0/7 | K ≤ 65; S ≤ 35 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y5.final-trip-or-event` | decision-card | 25 | sí | A | AUDITED_EXHAUSTIVELY | 4 | constante `#2` | K 59.4 · S 28.0 % | 7/7/5/6 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y5.multi-option-comparison-review` | numeric-input | 25 | no | B | AUDITED_BY_POLICIES | 10000000 | el máximo del rango | política 10.0 · óptima en 0/25 · rechazadas 0 | 0/0/0/25 | sin techo; sólo medición | espacio de 10000000 respuestas por variante: 250000000 evaluaciones exceden el presupuesto de 60000 |
| `y5.next-step-options` | classification | 25 | sí | A | AUDITED_EXHAUSTIVELY | 32 | constante `11111` | K 40.0 · S 16.0 % | 0/0/25/0 | K ≤ 65; S ≤ 35 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y5.proportion-capacity-review` | numeric-input | 23 | no | A | AUDITED_EXHAUSTIVELY | 100 | constante `6` | K 34.1 · S 13.0 % | 3/3/3/14 | sin techo; sólo medición | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y5.stage-screen` | decision-card | 25 | sí | A | AUDITED_EXHAUSTIVELY | 6 | constante `#0` | K 78.0 · S 40.0 % | 3/22/0/0 | K ≤ 78; S ≤ 40 % | coordenadas semánticas estables; espacio completo dentro del presupuesto |
| `y5.yearbook` | quantity-builder | 25 | sí | C | AUDITED_BY_POLICIES | 28561 | mitad del máximo | política 23.0 · óptima en 0/25 · rechazadas 0 | 0/5/0/20 | sin techo; sólo medición | el espacio de respuesta cambia entre variantes (5 formas distintas): no hay respuesta constante comparable |

24 exhaustivas, 18 por políticas; 0 no aplicables, 0 bloqueadas. En categoría C,
el cardinal mostrado corresponde a la primera variante; la razón informa las
formas diferentes. El signo «—» indica cardinal no declarado, no un espacio vacío.
