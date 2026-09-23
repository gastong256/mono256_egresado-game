# Verificación — TASK-C

Fecha: 2026-09-23. Base: `main` / `afe9fd8` (TASK-B). Node 24.19.0 · pnpm
11.22.0 · Next 16.3.5; lockfile intacto, ninguna dependencia nueva.

## Entorno

Mismo procedimiento que TASK-A/B: `.env.production.local` existe en el
checkout y Next lo prioriza en producción, así que build, `next start`,
Playwright y `pnpm verify` corren con un wrapper temporal fuera del repo que
carga `.env.local` en `process.env` y aborta si Supabase no es loopback. No se
editaron archivos de entorno. Supabase local operativo con la edición «Feria
local» abierta y participantes sintéticos previos (10.000 en el podio), lo que
permitió capturar un 1.º compartido real y un puesto fuera del podio real.

## Comandos y resultados

| Comando | Resultado |
|---|---|
| `git status` / `git log` | branch `main`; árbol limpio al inicio; 7 commits locales previos preservados (push pendiente por credenciales SSH) |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 warnings) |
| `pnpm format:check` | PASS |
| `git diff --check` | PASS |
| `pnpm design:check` | PASS |
| `pnpm build` (entorno local) | PASS |
| Suites focales (vitest) | `ending-model` 39 · `career-ending` 13 · `competition-ui` 47 · `practice-run` 4 · `practice` · `game-primitives` · `grade-7-ui` · `game-shell` · `prestige-and-epilogue` · `full-career` (integración) · `progression-copy` · `year-milestone`: **PASS** |
| `pnpm verify` (gate canónico: master sync, formato, lint, fronteras, typecheck, coverage, validación y catálogos de los seis años, simulaciones deterministas, freeze, build, E2E) | **PASS, exit 0** · 2.472 tests (0 skips) · cobertura: sentencias 86,90 %, branches 79,65 %, funciones 89,29 %, líneas 87,12 % · freeze 57 comprobaciones, huella RC.2 intacta · build · **254 E2E** |

Tests nuevos:

- `tests/unit/ending-model.test.ts` (39): límites de las cinco franjas;
  estilos por eje dominante, empate, sin evidencia, Equipo/Aura con prioridad;
  determinismo; hitos presentes/ausentes/inventados (Abanderado, Escolta,
  Capitán nunca); hitos de flag; lista vacía; recap ordenado con temas y
  marcadores verdaderos; año no jugado; puesto 1.º solo / compartido / 2.º /
  3.º / 7.º / sin puesto; «nuevo 1.º» y «récord» sólo con evidencia (rank 1
  solo **no** produce récord; empate no produce récord; podio vacío no produce
  récord); mejor puntaje personal primera/mejora/no mejora.
- `tests/component/career-ending.test.tsx` (13): egreso como `h1` y antes del
  resultado; 1.º sin récord; récord y subida con snapshot; 1.º compartido;
  fuera del podio; sin puesto; partida pobre (egresa, «Safaste», revancha, sin
  palabras humillantes, Repaso dicho como Repaso); verificando sin número ni
  acciones; red caída con reintento; rechazado sin puntaje ni puesto;
  competencia cerrada sin «Jugar de nuevo»; práctica sin nada competitivo;
  recorrido de desarrollo con un solo primario.
- E2E extendidos: `practice.spec.ts` (carrera toda Insuficiente → franja baja,
  sin puesto/podio/récord/«fracas», seis años, estilo) y
  `competition.spec.ts` (carrera óptima → franja `exceptional`; el puesto
  mostrado es exactamente `you.rank` del servidor; claim sólo si ≤ 3; hitos y
  recorrido presentes). `full-career.spec.ts` apunta a `play-style`,
  `epilogue-record` y `recap-year` × 6.

## QA visual (build de producción local, Chromium)

Script de capturas que reproduce el flujo real: `/test` con checkpoint jugado
en el motor y verificación por servidor (falla de red simulada primero, luego
reintento), y `/` con identificación, emisión, checkpoint y reanudación hasta
el resultado verificado contra la DB local. Anchos 320 / 390 / 412 / 1280 y
zoom 200 % sobre 1280; reduced motion activo. En todas: sin scroll horizontal
(`scrollWidth ≤ clientWidth`), **un** primario, `h1` = «Egresado».

| Caso | Evidencia | Observado |
|---|---|---|
| Competencia, carrera óptima | `competition-top-{320,390,1280,zoom200}.png` | 10.000 · «Un recorrido de los que se cuentan.» · puesto 1 de N · «Compartís el 1.º puesto.» (verde, texto) · «Es tu mejor partida hasta ahora» · estilo «Motor del equipo» · Promedio 8,8 · Equipo 56 · Aura +1.000 · seis hitos · seis años «Todo Óptimo» · Jugar de nuevo + Volver al ranking |
| Competencia, carrera toda Insuficiente | `competition-low-{320,412}.png` | 1.725 · «Safaste: el diploma está…» · puesto 65 de 65 sin claim · «Aura del curso» (el acto salió impecable por el fallback del oráculo) · hitos reales (Volviste, Egresado, Acto impecable, El curso te recuerda) · años con «Repaso con lo justo» / «Completado» · cierre «…pide revancha» |
| Práctica, baja | `practice-low-{320,412}.png` | Puntaje de práctica 1.000 · «Safaste…» · «no modifica el ranking» · sin puesto ni podio · Todo terreno · Promedio/Equipo «—» (no establecidos, no ceros) · Practicar de nuevo |
| Práctica, alta | `practice-high-390.png` | 10.000 · franja alta · sin claims competitivos |
| Práctica, red caída | `practice-failed-320.png` | «El puntaje todavía no está calculado» + Reintentar cálculo; recorrido y estilo visibles; sin franja |

Hallazgos corregidos durante la QA:

1. En el podio, la línea neutra repetía el claim («Compartís el 1.º puesto»
   dos veces) y fuera del podio repetía la cifra en prosa. Ahora la prosa
   neutra sólo existe cuando no hay puesto que dibujar.
2. A 320 px, «Egresado» a 66 px llena la hoja y el tilde decorativo no
   entraba (defecto heredado del epílogo anterior). El tilde se oculta por
   debajo de 360 px sólo en el egreso; la palabra y el nombre accesible no
   cambian.

## Revisión de invariantes

`git diff --name-only`: ningún archivo bajo `src/game/`, `src/server/`,
`supabase/`, `src/lib/competition/`, `src/release/`, `src/content/grade-*`,
`package.json` ni `pnpm-lock.yaml`. El único cambio en `src/content` es
`full-career.ts`: `closeCareer` devuelve además `memories`, calculadas con
`careerMemories` (función pura del motor ya existente). Ninguna migración,
env, API, dependencia ni persistencia nueva. FairScore, Prestige, comparador
de ranking, empates, RunPlan, recovery, identidad y privacidad: sin tocar.

## Límites

- El récord se demuestra contra el podio visible al emitir el intento y exige
  1.º sin compartir después; no contra un historial completo (no existe).
- Empate fuera del podio: desconocido por diseño del DTO; no se afirma.
- No se ejecutaron `db:*` ni gates de contenedores: sin cambios en esas
  superficies.
- Sin prueba humana con lector de pantalla; se verificó estructura (`h1`,
  `h2` por sección, `aria-labelledby`, `role="status"`), teclado y axe en los
  E2E existentes.
- No deploy, no tag, no corte de RC3.

## Gate canónico

`pnpm verify` (entorno local): **PASS, exit 0** (2026-09-23). Primera corrida
detenida por el master spec desincronizado tras anotar
`narrative-system.md`; se regeneró con `node scripts/sync-master-spec.mjs
--write` (137 fuentes) y la segunda corrida pasó entera. Ningún umbral
relajado, ningún golden ni catálogo regenerado.
