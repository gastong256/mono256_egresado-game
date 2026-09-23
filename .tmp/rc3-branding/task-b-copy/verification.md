# Verificación — TASK-B

Fecha: 2026-09-23. Base: `main` / `7ea70d7`. Node 24.19.0 · pnpm 11.22.0 ·
Next 16.3.5; lockfile y dependencias intactos (ninguna dependencia nueva).

## Entorno

`.env.production.local` sigue en el checkout y Next lo prioriza con
`NODE_ENV=production`. Build, `next start`, Playwright y `pnpm verify` se
ejecutaron con un wrapper temporal fuera del repo que carga `.env.local` en
`process.env` y aborta si Supabase no es loopback (mismo procedimiento que
TASK-A y práctica). No se editaron archivos de entorno ni se imprimieron
valores. Supabase local ya operativo; no se ejecutó `db:reset`.

## Comandos y resultados

| Comando | Resultado |
|---|---|
| `git status` / `git log` | branch `main`, árbol limpio al inicio, 5 commits locales previos sin push preservados |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 warnings) |
| `pnpm format:check` | PASS |
| `git diff --check` | PASS |
| `pnpm design:check` | PASS (tokens y contraste) |
| `pnpm game:validate-content` | PASS · errors 0 · warnings 0 |
| `pnpm release:verify` | PASS · **57 comprobaciones**, huella RC.2 `0ea3c1de…` intacta, catálogo `grade-5-dev-6` intacto |
| `node scripts/sync-master-spec.mjs --check` | PASS · 137 fuentes sincronizadas |
| `pnpm build` (entorno local) | PASS |
| `pnpm test` (vitest completo) | **131 archivos · 2.439 tests PASS**, 0 skips (2.428 previos + 11 nuevos) |
| `pnpm test:e2e` (build + 5 proyectos Playwright) | **254 PASS**, 0 skips, 2,9 min |
| `pnpm verify` (gate canónico, entorno local) | **PASS, exit 0** · 131 archivos / 2.439 tests · cobertura: sentencias 86,81 %, branches 79,55 %, funciones 89,29 %, líneas 87,02 % · validación y catálogos de los seis años · simulaciones deterministas · freeze 57 comprobaciones · build · 254 E2E |

Tests nuevos:

- `tests/unit/progression-copy.test.ts` (6): la intención de cada pantalla de
  dos carreras reales (óptima y con Repasos) se compara contra lo que el motor
  hizo tras el `CONTINUE`; labels; numeral; hito determinista.
- `tests/component/year-milestone.test.tsx` (4): `RunView` real con el
  controlador de la aplicación: apertura «Empezar 7.º», cierre de 7.º con hito
  y «Pasar a 1.º» → «Empezar 1.º», «Ir al Repaso» + notas del Repaso + hito
  «lo cerraste igual», cierre de 5.º con «Ver mi egreso» y sin «Pasar a 6».

Tests ajustados por copy (semántica conservada, comprobada caso por caso):
`competition-ui` (podio vacío, mejor partida anterior), `home-event.spec`
(podio vacío), `competition.spec` (mejor partida anterior), `grade-7-ui` y
`grade-7-slice` (la apertura del año ahora dice «Empezar 7.º»), `gameplay.ts`
(el helper avanza por `data-testid="continue"`, no por el label).

## Hallazgos durante la verificación

1. Primera corrida E2E: 4 fallos, todos expectativas del copy anterior
   (`El podio está por escribirse`, `Tu mejor partida anterior`). Se
   actualizaron los tests, no el copy. Además el `next start` de las capturas
   seguía arriba: se apagó por puerto y se repitió la corrida.
2. Segunda corrida: 253 PASS + 1 fallo en `post-g1-accessibility-audit`
   «reflow 1280 zoom 2» (chromium-mobile): un control medido en 23 px, que es
   el botón «Ver estilo» de 46 px leído antes de que aplicara `zoom = 2` bajo
   carga de 4 workers. Aislado pasa (11 s). Tercera corrida completa: 254 PASS.
3. `dom-accessibility-api` recorta el espacio inicial de un span: el nombre
   accesible del hito salía «7.ºcompletado». Se resolvió con el numeral
   `aria-hidden` y la frase completa en `sr-only`.
4. Dos cifras en prosa contradecían los datos aprobados (`course-project-tech`:
   «una hora de laboratorio» vs 8–16 min; `route-plan`: «a las dos» vs límite
   13:00–13:40). Se retiró la cifra de la prosa; los datos no cambian.

## Revisión deliberada del diff numérico

`git diff -U0 -- src/content` (30 archivos, 191 inserciones / 120
eliminaciones en total): todas las líneas cambiadas en `src/content` son
`title`, `setup`, `eyebrow`, `text` o comentarios. Las únicas cifras en líneas
cambiadas son las de prosa retiradas («una hora», «las dos», «21 de
septiembre» redundante con el eyebrow) y el «60» del colectivo, más los
numerales «7.º»…«5.º» en eyebrows. Ningún dato de grilla, opción, umbral,
precio, horario, medida ni parámetro de variante cambió. Catálogos JSON sin
tocar; huellas verificadas por `release:verify`.

## Playthrough humano (navegador real, build de producción local)

Técnica: carrera jugada en el motor con `grade5Answer` y reanudada en el
harness `/dev/game-engine?content=full-career` desde `localStorage` (misma que
`full-career.spec.ts`); portada, identificación y práctica navegadas en `/` y
`/test`. Anchos 320 / 360 / 390 / 412 y 1280; reduced motion activo.
Capturas en `evidence/`.

| Momento | Pregunta | Resultado |
|---|---|---|
| Apertura 7.º | ¿sé qué pasa al apretar? | «Empezar 7.º» bajo «Arranca séptimo» |
| Último resultado de 7.º | ¿se siente que pasó algo? | «Año completado · 7.º ✓ · Ya sabés cómo funciona la escuela.» sobre «Pasar a 1.º», sin pantalla extra |
| Apertura 1.º–5.º | ¿sé dónde estoy? | «1.º AÑO» arriba, eyebrow, título propio, «Empezar N» |
| Insuficiente en 7.º | ¿sé qué sigue? | «Ir al Repaso» |
| Repaso | ¿sé qué hacer? | «Repaso: Duración del viaje · Quedó algo dando vueltas este año. Lo cerrás acá…» + situación corta |
| Salida del Repaso | ¿volví al recorrido? | hito «…y lo cerraste igual» + «Pasar a 1.º» |
| 4.º → 5.º | — | «Pasar a 5.º» / «El último marzo · El último año» |
| Fin de 5.º | ¿es distinto? | «Fin de la secundaria · 5.º ✓ · Terminaste la secundaria.» + «Ver mi egreso» |
| Egreso | — | Milestone «Egresado / Egresaste» (TASK-C profundiza) |
| Portada 320 / 1280 | — | eyebrow, estado abierto, mejor puntaje, ranking, práctica; sin overflow |
| Identificación 320 | — | «Elegí cómo aparecer en el ranking» + campos intactos |
| Práctica 320 | — | «Es el mismo juego…» + «Empezar práctica» |

Sin scroll horizontal en ningún ancho (los E2E lo reafirman con `reflow`).
Un solo primario por pantalla, también con el hito (test de componente y E2E
`data-primary`).

## Límites

- No se ejecutaron `db:reset`, `db:lint`, `db:types` ni gates de contenedores:
  no hay cambios de schema, migraciones ni infraestructura.
- No se afirma prueba humana con NVDA/VoiceOver ni con estudiantes; se
  verificó semántica (nombre accesible del hito, `h2`, `sr-only`), teclado y
  axe en los E2E existentes.
- No deploy manual, no tag, no corte de RC3; runtime sigue en `1.0.0-rc.2`.
- Diferidos: ver README (orden de `yN.closing`, «Jugar de nuevo» duplicado,
  comentario de cabecera de `course-project-tech`).

## Gate canónico

`pnpm verify` (entorno local): **PASS, exit 0** (2026-09-23). Coverage por
encima de los umbrales; ninguna aserción relajada, ningún golden ni catálogo
regenerado.
