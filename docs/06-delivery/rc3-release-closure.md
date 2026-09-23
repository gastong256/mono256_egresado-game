# RC3 — cierre de versión y entrega local

Fecha: 23 de septiembre de 2026. Estado: **RC3 CLOSED LOCALLY — READY TO PUBLISH**.
No equivale al GO del evento. Push y publicación quedan a cargo del operador.

## Identidad

| Campo | Valor |
|---|---|
| Release | `egresado-fair-edition-v1` |
| Versión de aplicación/manifiesto | `1.0.0-rc.3` |
| Canal | `release-candidate` |
| Tag anotado | `v1.0.0-rc.3` |
| Rama de entrega | `main` |
| Huella del manifiesto | `a039dc32dfce527bf3a537249c0f2d7cceca9bcbe44d5cd031a9d05a20c29e46` |
| Base integrada antes del corte | `0772796` |
| Predecesor | `v1.0.0-rc.2`; se conserva sin mover |

El corte cambia `package.json`, la versión del manifiesto y su candado mediante
`pnpm release:verify -- --update-lock`. Sigue el mecanismo de ADR-027/028;
no introduce una decisión arquitectónica nueva. La huella identifica el
manifiesto; el tag de Git identifica además todos los componentes, contenido,
scripts y documentación del artefacto. No se retaggea RC2 ni se altera su historia.

## Qué entrega RC3

| Área | Entrega |
|---|---|
| Identidad y recursos | Marca, favicon, hero, imagen social y escenas optimizadas; integración en las superficies del juego. |
| Home y footer | Feria del Libro 2026, jerarquía visual, iconos y medallas, CTA principal, práctica secundaria, contador siempre visible y aviso de cierre en ranking. Footer responsive con instituciones, créditos y enlaces públicos. |
| Textos y cierre de partida | Lenguaje de juego, progresión y feedback; resumen de egreso, reconocimientos y detalle del recorrido. |
| Práctica pública | `/test`, sin identidad ni resultado competitivo; reanudación y verificación aisladas del ranking (ADR-029). |
| Privacidad | `/privacidad` y aceptación al enviar el formulario, aviso configurado y frontera entre datos públicos y privados (ADR-030). |
| Ranking | Resumen autoritativo guardado al verificar, ventana máxima de doce filas, empates completos representados, contexto propio, métricas e hitos; lecturas sin reconstruir partidas (ADR-031). |
| Explicación pública | `/puntajes`, tono de la página de privacidad, enlace debajo de ella en footer y documentación técnica en GitHub. |
| Promedio | Corrección del otro agente, `8ba9df4`: las 32 situaciones ordinarias registran 10/8/6/4 según calidad; los diez Repasos no agregan nota. Se conserva su implementación y autorización D-RC3-P-004. |
| Higiene del repositorio | `.tmp/` ignorado y fuera del índice; los reportes necesarios para operar el release se consolidan aquí, sin depender de archivos temporales. |

Las fuentes de comportamiento siguen siendo [FR-001/012/021](../02-functional/functional-specification.md),
[ADR-029](../03-architecture/adr/ADR-029-public-practice-mode.md),
[ADR-030](../03-architecture/adr/ADR-030-privacy-page-and-action-acknowledgement.md),
[ADR-031](../03-architecture/adr/ADR-031-persisted-run-summary-ranking-window.md)
y la [enmienda de Promedio](../03-architecture/adr/ADR-016-career-player-model.md#2-promedio-se-deriva-de-notas-reales).

## Compatibilidad y Supabase

Se mantienen motor `10.0.0`, action log `7`, snapshot `8`, ruleset
`1.0.0-full-career`, contenido `5.5.0-grade-5`, catálogo `grade-5-dev-6` y score
`fair-score-v1@1.0.0-fair-edition-v1`. FairScore, comparador, reglas de empate,
catálogos y migraciones coinciden con el manifiesto congelado. La corrección de
Promedio es la excepción documentada D-RC3-P-004: sí cambia ese dato de carrera
en partidas nuevas; no cambia FairScore y conserva los resúmenes ya guardados.
No se presenta como una ausencia total de cambios de contenido durante RC3.

**Cero migraciones SQL nuevas.** Cabeza:
`20260921000000_competition_fair_mode.sql`; huella del esquema
`faf128c4491bb0f406b520b05094e2b2345324f1e2fc049cc762232005ae214f`.
El ranking usa `verified_summary.ranking` dentro del JSONB existente y no cambia
RLS, tablas o índices. Las partidas nuevas guardan el resumen automáticamente.

El PO confirma en esta sesión que producción ya tiene las migraciones RC2 y aún
no tuvo partidas. Por lo tanto, no corresponde `db:reset`, seed ni completar
resúmenes históricos. Esto es una confirmación del operador, no una inspección
remota efectuada en el cierre. No se ejecutaron mutaciones de producción.

Para otros entornos con partidas anteriores queda disponible
`competition:summaries` (primero dry-run); no es parte del despliegue actual.

## Procedencia del verify reutilizado

El PO solicitó aprovechar el `verify` verde del otro agente. Se conserva aquí
la evidencia relevante de su reporte local `promedio-fix/verification.md`, cuyo
SHA-256 es `8ad129f092f2da21cff75a79227471921f99b2a198e6ca076a28d37defe3227b`.
El reporte original vive en `.tmp`, por eso esta documentación no lo enlaza como
un recurso necesario para un clon limpio.

| Gate registrado por el otro agente | Resultado documentado |
|---|---|
| `pnpm verify` | PASS, exit 0 |
| Vitest | 140 archivos, 2542 tests PASS |
| Cobertura | sentencias 86,92 %; ramas 79,91 %; funciones 89,36 %; líneas 87,15 % |
| Contenido, catálogos y simulaciones | PASS |
| Build | PASS |
| Playwright | 270 E2E PASS |
| Release | 57 checks PASS con identidad RC2 |

Se contrastó el estado guardado por ese agente con `0772796`: árbol de trabajo
`7b4573de08288028b431088a44f098fdb582da85` más sus dos archivos nuevos en
`4f93adc5c95c8257e663e49a250b5c9ed97dab2d`. Los archivos coinciden salvo tres
líneas de una aserción adicional en `ranking-summary.test.ts`. Esa aserción
comprueba Promedio 10 en la proyección y pasó al integrar. Los commits locales
que conservan el código son `a914112`, `8ba9df4` y el merge `0772796`; no se
necesita publicar ni aplicar el stash para obtenerlo.

La integración conservó byte a byte los 41 archivos exclusivos del otro agente,
combinó las dos fuentes documentales compartidas y pasó 262 tests dirigidos,
seis recorridos de navegador, build, TypeScript, lint y los 57 controles de release.

**No se repitió `pnpm verify` en el corte.** Se reutilizó su evidencia sobre el
código funcional, complementada por los controles siguientes sobre la nueva
identidad. No se afirma que el comando completo se haya corrido con etiqueta RC3.

## Validación del corte RC3

| Comando / comprobación ejecutada | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; dependencias y lockfile sin cambios |
| `pnpm toolchain:check` | PASS; Node 24.19.0 / pnpm 11.22.0 |
| `pnpm release:check` | PASS; Next.js 16.3.5 satisface el piso del repo |
| `pnpm release:verify -- --update-lock` | PASS; 54 comprobaciones antes de escribir el nuevo candado |
| `pnpm release:verify` | PASS; 57 comprobaciones contra el candado RC3 |
| `pnpm secrets:check` | PASS; sin patrones de secretos |
| `pnpm security:audit` | PASS; sin vulnerabilidades conocidas |
| `pnpm release:preflight -- --env-file=.env.production.local` | PASS; contrato del archivo privado local, sin conexión a proveedores |
| Suites dirigidas de identidad/release/health/freeze/ranking | PASS; ocho archivos, 123 tests |
| `pnpm build` | PASS; artefacto identificado como RC3 |
| `pnpm format:check` | PASS |
| Arranque `next start` con build RC3 y configuración local | PASS; log informa RC3 y huella esperada |
| `/api/health` y `/api/health?ready=1` | 200; versión/huella exactas y todos los checks `ok` |
| `/`, `/test`, `/privacidad`, `/puntajes`, `/organizer` | 200 y CSP con nonce en el servidor local de producción |
| `/dev/grade-7` con competencia configurada | 404 |

Las ocho suites son `release-manifest`, `release-readiness`,
`deployment-readiness`, `production-config`, `health-route`,
`competition-freeze`, `ranking-release-regression` y `ranking-summary`.
Build y tests precargaron las URLs/credenciales locales en el proceso con mayor
prioridad que los archivos de Next; el smoke utilizó únicamente Supabase local.
El preflight de producción sólo valida la configuración del archivo: no acredita
que Vercel tenga esas mismas variables ni que el proveedor esté operativo.

`node scripts/validate-agent-workspace.mjs` y
`node scripts/sync-master-spec.mjs --check`: PASS, también en una exportación
limpia de Git sin `.tmp`, `.env` ni `node_modules` (260 archivos documentados,
140 fuentes del master). La primera exportación detectó un enlace residual en
README a `.tmp`; se reemplazó y la segunda pasó. `git diff --check`: PASS.

DB reset/lint/types y contenedores no se repiten: este
corte no cambia esquema, adaptadores ni infraestructura. No se ejecutó release
en cloud ni se inspeccionaron cuotas, dominios o migraciones remotas.

## Publicación manual y pasos siguientes

1. Desde `main` limpio, publicar **main y el tag RC3**, no la rama temporal:
   ```bash
   git push --atomic origin main v1.0.0-rc.3
   ```
2. Comprobar CI y que Vercel use ese commit como Production. Si ya está conectado
   a `main`, el push puede iniciar el despliegue según su configuración vigente.
   El tag marca el artefacto; no crea por sí solo un GitHub Release.
3. Conservar el slug final, fechas, institución, secreto de identidad y acceso
   del organizador. Supabase RC2 existente se conserva: sin reset, seed ni backfill.
4. Consultar health y readiness en el dominio real; deben devolver RC3, la huella
   de este reporte y checks `ok`. Revisar Home, práctica, privacidad, puntajes y
   login de organizador; no introducir partidas sintéticas en el ranking final.
5. Completar respaldo/restore, ensayo de rollback y smoke del proveedor según el
   [handoff A–I](../05-operations/vercel-supabase-production-deployment.md). Un ensayo
   competitivo cloud usa un slug sintético separado. Registrar GO antes de abrir.

Los tags RC1/RC2, la rama temporal ya integrada y el stash del otro agente se
conservan. No se hace push desde este cierre.
