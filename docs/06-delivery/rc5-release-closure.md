# RC5 — cierre del acceso del Home

Fecha: 23 de septiembre de 2026. Estado: **CLOSED LOCALLY — READY TO PUBLISH**.
Publicación manual por el operador; el cierre local no acredita un deploy ni GO remoto.

## Identidad y alcance

| Campo | Valor |
|---|---|
| Release | `egresado-fair-edition-v1` |
| Versión | `1.0.0-rc.5` |
| Tag anotado | `v1.0.0-rc.5` |
| Rama | `main` |
| Base del corte | `685ea32` |
| Predecesor inmutable | `v1.0.0-rc.4` → `6de4a30` |
| Huella | `ac1307fabcbcbcdb8ee8c224b016583f0b46801d5813aa968085416d4d69ce30` |

RC5 incorpora el ajuste autorizado del bloque de acceso del Home (`685ea32`):

- «Competencia abierta» y «Ya podés jugar», acción principal más grande,
  contador completo rotulado «Tiempo que queda para jugar» y práctica secundaria.
- Botón antes del reloj en móvil/tablet vertical; dos columnas desde 1024 px.
  Cuatro unidades visibles desde 320 px, sin controles para ocultarlas ni parpadeos.
- Verde escolar para disponibilidad y rojo para la última hora; lima sólo para
  la acción primaria. No agrega dependencias.
- Presentación local de apertura/cierre dentro del bloque, revisada en los límites
  y al volver a la pestaña, sin renderizar todo el Home cada segundo. UPCOMING
  sigue requiriendo confirmación del servidor; la emisión valida estado y horario.
- Versión, candado, documentación de estado y runbooks actualizados al nuevo corte.

Fuentes: [FR-001](../02-functional/functional-specification.md),
[trazabilidad](../02-functional/traceability-matrix.md) y
[fundamentos visuales](../09-design-system/foundations.md).
El corte aplica ADR-027/028; no introduce una decisión arquitectónica nueva.

## Compatibilidad y despliegue

Motor `10.0.0`, action log `7`, snapshot `8`, ruleset `1.0.0-full-career`,
contenido `5.5.0-grade-5`, catálogo `grade-5-dev-6` y score
`fair-score-v1@1.0.0-fair-edition-v1` siguen iguales a RC4.
En el manifiesto sólo cambia `releaseVersion`; el candado se regenera con el
comando mantenido y se verifica después sin actualizarlo.

**Sin migraciones, dependencias ni variables nuevas.** Cabeza del esquema:
`20260921000000_competition_fair_mode.sql`. Sobre producción ya migrada para
RC2/RC3/RC4, basta desplegar el código: no reset, seed, bootstrap ni backfill por RC5.
Se conservan edición, horarios, seed, identidad y resultados. No se inspeccionó
ni modificó Supabase remoto.

## Validación y procedencia

El árbol de UI, tests, configuración y dependencias de `685ea32` se conserva
exactamente en este corte; los únicos cambios ejecutables son las identidades
de package/manifiesto/candado. Por eso se reutiliza su evidencia:

- `pnpm test tests/component/home-event.test.tsx tests/component/event-countdown.test.tsx tests/component/competition-ui.test.tsx`: **77 tests PASS**.
- `pnpm test:e2e:only tests/e2e/home-event.spec.ts --project=competition-desktop --project=competition-mobile --workers=3`: **28 casos PASS**, con dos fallos de espaciado de «HORAS» a 320 px. Corregido el espaciado, los **dos casos de 320 px PASS** al repetirlos con `--grep 'home a 320px' --workers=2`. Total: 30 casos cubiertos, no una corrida única de 30 verdes.
- Lint, ambos typechecks, formato, contraste/tokens y build: PASS después de las correcciones.
- Inspección del bloque a 320, 390, 768, 1024 y 1280 px: sin desbordes internos;
  Playwright además cubre 360/412/1920 px, zoom, teclado, axe y reduced motion.

### Controles del corte RC5

| Comando / alcance | Resultado |
|---|---|
| `pnpm toolchain:check`, `pnpm install --frozen-lockfile` | PASS; Node 24.19.0, pnpm 11.22.0, lockfile sin cambios |
| `pnpm release:verify -- --update-lock` | PASS; 54 controles y candado RC5 generado |
| `pnpm release:verify` | PASS; 57 controles, sin actualizar candado |
| `pnpm release:check` | PASS; Next.js 16.3.5 |
| `pnpm release:preflight -- --env-file=.env.production.local` | PASS; contrato local, sin conexión al proveedor |
| `pnpm security:audit` | PASS; sin vulnerabilidades conocidas |
| `pnpm test` con cinco suites de release | PASS; 69 tests |
| `pnpm build` | PASS; artefacto RC5 y TypeScript de Next |
| Artefacto servido localmente: `/api/health`, `/api/health?ready=1` | PASS; HTTP 200, versión/huella RC5 y todos los checks `ok` |
| `pnpm format:check`, `pnpm secrets:check`, `git diff --check` | PASS |
| Workspace documental y master, también desde export limpio de Git | PASS |

Las cinco suites del corte son `release-manifest.test.ts`,
`release-readiness.test.ts`, `deployment-readiness.test.ts`, `health-route.test.ts`
y `competition-freeze.test.ts`. Test, build y servidor local precargan `.env.local`
y exigen una URL Supabase loopback; no usan credenciales productivas.

No se repite `pnpm verify`, cobertura completa, simulación de balance ni checks
de DB/contenedores: no cambiaron esas fronteras. El verify histórico de RC3 y
las comprobaciones de RC4 permanecen en sus respectivos reportes; no se atribuyen
al árbol actual. El preflight local no prueba variables ni servicios remotos.

## Publicación manual

1. Publicar main y el tag juntos:
   ```bash
   git push --atomic origin main v1.0.0-rc.5
   ```
2. Revisar CI y deployment Production de Vercel para el mismo commit.
3. Comprobar `/api/health` y `/api/health?ready=1`: HTTP 200, versión
   `1.0.0-rc.5`, huella de este reporte y checks `ok`.
4. Revisar el acceso del Home en teléfono/tablet y confirmar estado y horarios
   desde organizador. El [handoff](../05-operations/vercel-supabase-production-deployment.md)
   conserva los ensayos remotos pendientes antes de GO.

No se mueve RC4 ni otro tag anterior. Push y deploy quedan a cargo del operador.
