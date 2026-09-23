# Verificación — TASK-D

Fecha: 2026-09-23. Base: `main` / `70759f8` (TASK-C). Node 24.19.0 · pnpm
11.22.0 · Next 16.3.5; lockfile intacto, ninguna dependencia nueva.

## Entorno

Mismo procedimiento que TASK-A/B/C: `.env.production.local` existe en el
checkout, así que build, `next start`, Playwright y `pnpm verify` corren con
un wrapper temporal fuera del repo que carga `.env.local` en `process.env` y
exige Supabase loopback. Supabase local operativo con «Feria local» abierta.

## Comandos y resultados

| Comando | Resultado |
|---|---|
| `git status` / `git log` | branch `main`; árbol limpio al inicio; 9 commits locales previos preservados |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 warnings; el `<a href="/">` de `error.tsx` se cambió por `<Link>` a pedido de la regla de Next) |
| `pnpm format:check` | PASS |
| `git diff --check` | PASS |
| `pnpm design:check` | PASS |
| `node scripts/sync-master-spec.mjs --check` | PASS (137 fuentes) |
| `pnpm build` (entorno local) | PASS |
| Suites focales (vitest) | `event-countdown` 15 · `competition-ui` 48 · `progression-copy` 7 · `career-ending` 14 · `year-milestone` · `home-event` · `practice` · `practice-run` · `game-shell` · `grade-1-quantity`: **PASS** |
| `pnpm verify` (gate canónico: master sync, formato, lint, fronteras, typecheck, coverage, contenido y catálogos de los seis años, simulaciones, freeze, build, E2E) | **PASS, exit 0** · 133 archivos / 2.476 tests (0 skips) · cobertura: sentencias 86,94 %, branches 79,81 %, funciones 89,30 %, líneas 87,16 % · freeze 57 comprobaciones, huella RC.2 intacta · build · **254 E2E** |

Tests nuevos o extendidos:

- `event-countdown.test.tsx`: escalones de urgencia por tiempo restante
  (bordes 24 h / 1 h / 10 min), rótulo «Últimos minutos» y `data-urgency`
  con relojes falsos; calma por encima de un día.
- `competition-ui.test.tsx`: en UPCOMING la práctica es el único primario.
- `progression-copy.test.ts`: el alias sólo en el cierre de 7.º y 5.º; vacío
  = neutro; alias con «HTML» permanece texto.
- `career-ending.test.tsx`: «Egresaste, {alias}.» y sin alias «Egresaste»;
  sin elementos inyectados.
- E2E `competition.spec.ts`: el egreso con alias se comprueba por contenido.

## QA visual y técnica (build de producción local, Chromium)

Barrida automatizada (`qa-sweep.ts`, fuera del repo): 9 estados de portada
(real + fixtures por `page.route`), identificación, práctica (intro, reanudar)
y 11 momentos de juego reanudados desde checkpoints reales, a 320 / 360 / 390 /
412 / 768 / 1280 / 1440 y zoom 200 %, con vigilancia de consola, `4xx/5xx` y
`requestfailed`, y medición de LCP/CLS por `PerformanceObserver`. Cierres de
carrera (competencia 1.º compartido y fuera del podio; práctica baja, alta y
red caída) con `ending-shots.ts`. Detalle en `surface-matrix.md`.

Primera pasada: 1 hallazgo (overflow de 9 px a 320 en la respuesta numérica).
Segunda pasada tras el polish: 0 overflow, 0 consola, 0 red, 1 primario en
cada pantalla (ver línea final de `surface-matrix.md`).

Playthrough humano sobre las capturas (preguntas del encargo §153):

| Pregunta | Respuesta |
|---|---|
| ¿Me invita a jugar? | El lima entra con pop, dice «Jugar ahora / de nuevo / Continuar partida» y es lo único saturado de la página. |
| ¿Entiendo el estado del evento? | Rótulo con símbolo + palabra («● Competencia abierta», «◷ Próximamente», «■ Competencia cerrada»), frase de estado y, cerrada, «Resultados del evento» primero. |
| ¿El countdown llama la atención? | Cuatro celdas tabulares; bajo un día filete de tinta; bajo una hora rótulo rojo con palabra; bajo diez minutos los segundos saltan. Ocultable. |
| ¿Veo rápido el CTA? | Arriba a la derecha en desktop, primero en móvil, antes del reloj. |
| ¿El ranking genera competencia? | Podio con numeral 66 px, empates compartidos, «(vos)» y tu puesto fuera del podio con tu puntaje. |
| ¿Sé cómo mejorar? | «Jugá las veces que quieras: cuenta tu mejor partida verificada», «Jugar de nuevo» tras el cierre, franja y línea de cierre según puntaje. |
| ¿El alias aporta cercanía? | Cuatro momentos: saludo, primer año cerrado, último año, egreso. |
| ¿Los hitos se sienten importantes? | Tarjetas de tinta con tilde que entran una a una; sólo hechos verificables. |
| ¿El ending tiene payoff? | «Egresado» 66 px + «Egresaste, Sofi.» → puntaje con pop → puesto y claim → estilo → hitos → recorrido → cierre + acción. |

## Invariantes

`git diff --name-only`: ningún archivo bajo `src/game/`, `src/server/`,
`supabase/`, `src/lib/competition/`, `src/release/`, `src/content/`,
`package.json` ni `pnpm-lock.yaml`. Cero migraciones, cero env, cero APIs,
cero dependencias. El alias se lee de `PublicSelfSummary.nickname`, que ya
viajaba a la portada; no se persiste nada nuevo.

## Límites

- Métricas de laboratorio en Chromium local, no Core Web Vitals de campo.
- Sin prueba humana con lector de pantalla; axe (WCAG 2.2 AA) corre en los
  E2E y pasó.
- No `db:*` ni contenedores: sin cambios en esas superficies.
- Sin deploy, sin tag, sin corte de RC3.

## Gate canónico

`pnpm verify` (entorno local): **PASS, exit 0** (2026-09-23), en una sola
corrida tras el polish. Ningún umbral relajado, ningún golden ni catálogo
regenerado.
