# RC6 — ranking con jerarquía y detalle de partida

Fecha: 23 de septiembre de 2026. Estado: **CLOSED LOCALLY — READY TO PUBLISH**.
Publicación manual del operador; este cierre no acredita deploy ni GO remoto.

## Identidad y alcance

| Campo | Valor |
|---|---|
| Release | `egresado-fair-edition-v1` |
| Versión | `1.0.0-rc.6` |
| Tag anotado | `v1.0.0-rc.6` |
| Rama | `main` |
| Base y predecesor inmutable | `v1.0.0-rc.5` → `2f9d3c9` |
| Huella | `5d32953278e33a6139bf61be1cd204b6a4d93e5307262bde0d71765937c7e7f2` |

Implementa el mock aprobado por el PO, limitado a presentación del ranking:

- Primer puesto destacado; segundo y tercero progresivamente más compactos;
  filas comunes con la misma densidad. Altura fluida ante alias largos, empates,
  datos ausentes o zoom. El puesto proviene del servidor, incluso si es compartido.
- Puntaje oficial predominante, promedio y equipo agrupados con iconos; Aura
  conserva negro/neón. La partida propia tiene fondo, borde y texto persistentes.
- Reconocimientos existentes con iconos distintos; el podio anticipa hasta dos
  (uno en tercero). Todos los puestos conservan el detalle nativo por teclado/toque.
- Detalle agrupado en aportes al puntaje, reconocimientos, recorrido y estilo.
  El total mostrado es el oficial, no una suma de métricas de carrera.
- Conteo de desafíos desde `components.math.opportunities` persistido; escenas
  narrativas no se presentan como desafíos. Los repasos se muestran aparte.
  Se preserva `eventsPlayed` para compatibilidad y no se fija nueve en la UI.
- Ventana acotada, plegado móvil, reconocimientos reales, omisión de dimensiones
  ausentes y fallback de partidas sin resumen se conservan.

Fuentes: [FR-012](../02-functional/functional-specification.md),
[trazabilidad](../02-functional/traceability-matrix.md),
[operación del ranking](../05-operations/leaderboard-and-moderation.md) y
[fundamentos visuales](../09-design-system/foundations.md).
Autorización en el [registro de decisiones](../07-reference/decision-register.md).
Corte según ADR-027/028, sin decisión arquitectónica nueva ni dependencias.

## Compatibilidad y despliegue

Motor `10.0.0`, action log `7`, snapshot `8`, ruleset `1.0.0-full-career`,
contenido `5.5.0-grade-5`, catálogo `grade-5-dev-6` y score
`fair-score-v1@1.0.0-fair-edition-v1` siguen iguales a RC5.
Sólo cambia `releaseVersion` en el manifiesto; el candado se regenera y luego
se verifica sin actualizarlo. No cambia comparador, premios, API ni replay.

**Sin migraciones, backfill, seed ni variables nuevas.** Cabeza del esquema:
`20260921000000_competition_fair_mode.sql`. Producción ya migrada para RC2/RC3
sólo requiere el deploy de código. No resetear ni recrear la competencia;
se conservan edición, horarios, seed, identidad y resultados.
No se inspeccionó ni modificó Supabase remoto.

## Validación y procedencia

| Comando / alcance | Resultado |
|---|---|
| `pnpm toolchain:check`, `pnpm install --frozen-lockfile` | PASS; Node 24.19.0, pnpm 11.22.0, lockfile sin cambios |
| Vitest: presentación, Home, UI competitiva y resumen persistido | PASS; 74 tests en cuatro suites; 68 de UI repetidos tras el ajuste móvil final |
| Vitest: manifiesto, readiness, despliegue, health, freeze y ranking | PASS; 83 tests en seis suites |
| Playwright: `home-event.spec.ts` y `competition.spec.ts`, desktop y mobile | PASS; 76 casos antes del ajuste final de densidad del segundo puesto móvil |
| Playwright Home después del ajuste móvil final | 31/32 PASS; fallo intermitente de foco del CTA, seguido de 4/4 PASS aislados (dos por dispositivo) |
| `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm design:check` | PASS; roles existentes y pares de contraste explícitos |
| `pnpm release:verify -- --update-lock` | PASS; 54 controles, candado RC6 generado |
| `pnpm release:verify`, `pnpm release:check` | PASS; 57 controles y Next.js 16.3.5 |
| `pnpm release:preflight -- --env-file=.env.production.local` | PASS; contrato local, sin conexión remota |
| `pnpm security:audit` | PASS; sin vulnerabilidades conocidas |
| Artefacto local: `/api/health` y `/api/health?ready=1` | PASS; 200, versión/huella RC6 y checks `ok` |
| Formato, secretos, workspace, master y `git diff --check` | PASS |

La revisión final de Home falló una vez en `toBeFocused()` del botón Jugar,
con tres workers; la prueba había pasado en la corrida completa de 76.
Sin modificar el CTA ni relajar la aserción, se repitió únicamente ese caso
con `--grep 'teclado, foco' --workers=1 --repeat-each=2`: cuatro casos PASS.
Se registra como intermitencia pendiente de seguimiento; no se presenta la
corrida de 32 como una ejecución única completamente verde.

Las cuatro suites de UI/resumen son `ranking-run-details.test.tsx`,
`home-event.test.tsx`, `competition-ui.test.tsx` y `ranking-summary.test.ts`.
La primera corrida detectó una aserción ambigua al incorporar el total dentro
del detalle; la aserción identifica ahora el puntaje principal y las 74 pasan.
Las seis suites de release son `release-manifest.test.ts`,
`release-readiness.test.ts`, `deployment-readiness.test.ts`, `health-route.test.ts`,
`competition-freeze.test.ts` y `ranking-release-regression.test.ts`.

Playwright cubre 320/360/390/412/768/1024/1280/1920 px, zoom 200 %, alias largos,
empates, ranking vacío, resumen ausente, fila propia, plegado móvil, teclado,
reduced motion y axe. Agrega una comprobación de escala del podio, densidad
uniforme de filas comunes y acceso al detalle fuera del podio a 390/768/1280 px.
Los escenarios competitivos recorren identidad, mejor intento y replay existentes.
La inspección visual adicional usa datos ilustrativos en el navegador, sin sembrar
ni modificar partidas. Los mocks quedan en `.tmp/`, fuera del release.

Tests con DB, build y servidor del artefacto precargan `.env.local` y exigen
Supabase loopback. No usan las credenciales del preflight productivo.
No se repite `pnpm verify`, cobertura global, balance/contenido, migraciones ni
contenedores: esas fronteras no cambiaron. La evidencia histórica no se presenta
como una corrida nueva sobre RC6. El preflight no prueba la configuración remota.

## Publicación manual

```bash
git push --atomic origin main v1.0.0-rc.6
```

1. Revisar CI y deployment Production de Vercel para ese mismo commit.
2. Comprobar `/api/health` y `/api/health?ready=1`: HTTP 200, versión
   `1.0.0-rc.6`, huella de este reporte y checks `ok`.
3. Revisar Home/ranking en móvil y escritorio, expandir una partida y comprobar
   la fila propia. Continuar el [handoff](../05-operations/vercel-supabase-production-deployment.md)
   para las comprobaciones remotas pendientes antes del GO operativo.

Se confirmó por HTTPS de sólo lectura que `main` remoto aún apuntaba a
`2f9d3c9`; la consulta SSH no pudo autenticarse en el entorno del agente.
El trabajo se integra directamente sobre `main` local, sin reescribir historia.

RC1–RC5 permanecen inmutables. Push y deploy quedan a cargo del operador.
