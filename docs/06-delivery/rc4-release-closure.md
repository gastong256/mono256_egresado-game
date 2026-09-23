# RC4 — cierre urgente de presentación

Fecha: 23 de septiembre de 2026. Estado: **CLOSED LOCALLY — READY TO PUBLISH**.
Publicación manual por el operador; este reporte no acredita un deploy ni GO remoto.

## Identidad y alcance

| Campo | Valor |
|---|---|
| Release | `egresado-fair-edition-v1` |
| Versión | `1.0.0-rc.4` |
| Tag anotado | `v1.0.0-rc.4` |
| Rama de entrega | `main` |
| Huella | `4b320b09693c4550b422cfbe21f0bc742b65f27b3761b30854d9edf4580a19a2` |
| Base del corte | `1d15d35` |
| Predecesor inmutable | `v1.0.0-rc.3` → `0cc182c` |

RC4 reúne los cambios posteriores al corte RC3:

- `b02f294`: siete láminas narrativas a lápiz sobre papel amarillo para los seis
  años y el egreso. WebP optimizados, carga decorativa sin bloquear el juego.
- `1d15d35`: ajuste móvil del otro agente, preservado íntegramente: opciones y
  cantidades legibles, controles nativos a 16 px, agenda y plano más usables,
  chips de carrera claros, Home compacto y ranking plegable en teléfono.
- Home con título de pestaña y Open Graph **Egresado**. La duplicación provenía
  de concatenar la marca al nombre de la edición, que también la podía incluir;
  no había una plantilla de título global duplicándola. La descripción conserva
  el nombre y estado del evento.
- `/puntajes` aclara que el Departamento de Matemática del establecimiento
  organizador define y resuelve cualquier desempate externo. Egresado no tiene
  esa función ni es responsable de esa decisión. El ranking conserva los puestos
  compartidos: esto no introduce un criterio nuevo ni modifica resultados.
- Identidad RC4, candado, documentación de estado y runbooks vigentes.

Fuentes: [FR-001/012](../02-functional/functional-specification.md),
[operación del ranking](../05-operations/leaderboard-and-moderation.md),
[assets](../09-design-system/assets.md) y [fundamentos móviles](../09-design-system/foundations.md).
La autorización del PO abarca este corte; aplica el mecanismo de ADR-027/028,
sin una decisión arquitectónica nueva.

## Compatibilidad y despliegue

Motor `10.0.0`, action log `7`, snapshot `8`, ruleset `1.0.0-full-career`,
contenido `5.5.0-grade-5`, catálogo `grade-5-dev-6` y score
`fair-score-v1@1.0.0-fair-edition-v1` permanecen iguales a RC3.
La diferencia del manifiesto es únicamente `releaseVersion`; el candado se
regenera mediante el comando mantenido y se comprueba después sin actualizarlo.

**Sin migraciones SQL, dependencias o variables nuevas.** Cabeza de esquema:
`20260921000000_competition_fair_mode.sql`. Sobre producción con RC2/RC3 ya
migrada, desplegar el código es suficiente: no reset, seed ni backfill por RC4.
Se conservan la edición, horarios, seed, identidad y resultados existentes.
No se consultó ni modificó Supabase remoto.

## Validación

Se respetó la instrucción de no repetir `pnpm verify` indiscriminadamente.
El [reporte RC3](rc3-release-closure.md) conserva el verify histórico de 2542
unit/component/integration/property tests y 270 E2E; **no se atribuye esa corrida
al código móvil posterior ni a RC4**. Este corte valida su alcance con checks
dirigidos sobre el árbol final, incluida la UI heredada de `1d15d35`.

| Comando / alcance | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS; Node 24.19.0 y pnpm 11.22.0 |
| `pnpm install --frozen-lockfile` | PASS; lockfile sin cambios |
| `pnpm release:check` | PASS; Next.js 16.3.5 |
| `pnpm release:verify -- --update-lock` | PASS; 54 checks y candado RC4 generado |
| `pnpm release:verify` | PASS; 57 checks con el nuevo candado |
| `pnpm release:preflight -- --env-file=.env.production.local` | PASS; sólo contrato del archivo local, sin conexión al proveedor |
| `pnpm test` con 15 suites dirigidas | PASS; 223 tests |
| `pnpm build` | PASS; build y TypeScript de Next |
| `pnpm lint`, `pnpm typecheck`, `pnpm design:check` | PASS |
| `pnpm security:audit` | PASS; sin vulnerabilidades conocidas |
| `pnpm format:check`, `pnpm secrets:check` | PASS; formato y 955 archivos revisados |
| `node scripts/validate-agent-workspace.mjs`, `node scripts/sync-master-spec.mjs --check` | PASS; 261 documentos y master de 141 fuentes |
| `git diff --check` | PASS |
| Build servido localmente: `/api/health` y `/api/health?ready=1` | PASS; HTTP 200, RC4, huella esperada y checks `ok` |
| `pnpm test:e2e:only` con los seis specs y cuatro proyectos indicados abajo, `--workers=3` | PASS; 78 tests, sin skips |

Las suites dirigidas cubren manifiesto, readiness, deployment, configuración,
health, freeze, ranking, clasificación, primitivas, Home, escenas, egreso y shell.
Playwright cubre `points`, `home-event`, `foundation`, `full-career`,
`post-g1-accessibility-audit` y `grade-5`, en los proyectos desktop/mobile
correspondientes: título, contenido sin JavaScript, teclado, axe, reflow, zoom,
interacciones, transiciones y egreso. Los comandos de build, test y navegador
precargan `.env.local` y comprueban que Supabase sea loopback; no utilizan
credenciales productivas para las pruebas.

No se repitieron cobertura completa, simulaciones de balance, DB reset/lint/types
ni contenedores: RC4 sólo cambia presentación e identidad de release. El preflight
no acredita que las variables de Vercel coincidan con el archivo local.

## Publicación manual

1. Desde `main` limpio, publicar la rama y el nuevo tag juntos:
   ```bash
   git push --atomic origin main v1.0.0-rc.4
   ```
2. Revisar CI y el deployment Production de Vercel para ese mismo commit.
3. En el dominio real comprobar `/api/health` y `/api/health?ready=1`: versión
   RC4, huella de este reporte y checks `ok`.
4. Revisar la pestaña del Home, el texto de `/puntajes`, `/test` y organizador;
   confirmar horarios y estado de la edición. El [handoff](../05-operations/vercel-supabase-production-deployment.md)
   conserva los ensayos operativos de respaldo/restore y rollback antes de GO.

No se mueve ningún tag anterior. No se hace push ni deploy desde este cierre.
