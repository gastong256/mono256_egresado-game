# Verificación

## Entorno y alcance

Node 24.19.0 / pnpm 11.22.0. `toolchain:check` e instalación frozen PASS. DB local
ya operativa. `.env.production.local` existe: para no conectarse al proveedor,
los comandos build/Playwright/verify se ejecutan con un wrapper temporal que carga
`.env.local` al proceso antes de Next y exige hostname loopback. No se editan env
ni se imprimen valores; ningún test usa DB remota.

## Checks

| Comando | Resultado |
|---|---|
| `pnpm toolchain:check` | PASS; Node 24.19.0 / pnpm 11.22.0 |
| `pnpm install --frozen-lockfile` | PASS; lockfile intacto |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm design:check` | PASS |
| `pnpm test tests/integration/practice-api.test.ts` | 28 PASS; DB real, cero skips |
| `pnpm test tests/component/practice.test.tsx tests/unit/architecture-lint.test.ts tests/unit/competition-privacy.test.ts` | 58 PASS |
| `pnpm test tests/component/practice-run.test.tsx` | 4 PASS |
| `pnpm test:coverage` dentro de verify | 129 archivos, 2.428 PASS; cero skips |
| Cobertura | Sentencias 85,79 %; branches 78,43 %; funciones 87,78 %; líneas 86,02 % |
| `pnpm security:audit` | PASS; sin vulnerabilidades conocidas |
| `pnpm db:lint` | PASS; sin errores de schema |
| `pnpm db:types` | PASS; archivo generado idéntico |
| `pnpm build` + Playwright focal de práctica | PASS; 10 E2E |
| `pnpm verify` completo | PASS; 2.428 tests y 254 E2E (cero skips); release 57 comprobaciones PASS |
| `git diff --check`, workspace y master sync | PASS |

Build/E2E/verify: `node /tmp/egresado-task-a/run-local.mjs <script pnpm>` aplica
el entorno local descrito arriba. Focal navegador:
`test:e2e:only tests/e2e/practice.spec.ts --project=practice --no-deps --workers=2`.
El gate completo usa todos los proyectos y sus dependencias; ninguna aserción
competitiva fue relajada para habilitar `/test`.

## Hallazgos resueltos

- El codec normaliza `recovery: false` al restaurar: el test compara snapshots
  canónicos, manteniendo descriptor/log/estado efectivo y aislamiento de claves.
- Next puede reconstruir `request.url` con hostname interno. La validación de
  origen usa Host y protocolo del proxy confiable; prueba de mismo origen externo,
  origen ajeno y protocolo incorrecto, más el recorrido real de producción.

- Primer gate completo: 2.424 tests PASS, pero sentencias 84,83 % < 85 %:
  gate FAIL por cobertura, sin bajar el umbral. Se agregaron cuatro pruebas con
  controller/vistas reales: guardado por comando, cierre/retry/puntaje servidor,
  incompatibilidad y rechazo HTTP. Detectaron que `createRun` por sí solo no
  comprobaba toda la tupla al reanudar; se recompone el descriptor completo actual
  y se compara antes de adoptar el checkpoint. Las cuatro pasan.

## Performance y revisión visual

Capturas revisadas en `evidence/`: intro 320/1280, juego real 360, resultado y
escala CSS 200 %. Sin overflow ni solapamientos de texto. Axe/teclado/reduced motion
se prueban en Chromium; no se afirma prueba humana de lector de pantalla ni Safari.
El recorrido completo usa el helper del motor existente y checkpoint del browser,
sin endpoint o backdoor de test, como la suite competitiva.

`evidence/bundle.json` registra respuestas de un production build, contextos nuevos
y gzip individual por JS/CSS. Home: 164.699 B JS / 9.371 B CSS; baseline TASK-A:
161.474 / 9.343 B, delta +3.225 B (~2 %) / +28 B. Intro `/test`: 246.371 B JS;
después de iniciar: 586.486 B. Cuatro chunks de gameplay se descargan sólo al
iniciar, ninguno en Home. No son métricas de Core Web Vitals de campo.

## Límites

No simulaciones profundas históricas: sólo las estándar del gate. No migrations,
DB schema, nuevos secretos/env, versiones de engine/contenido/score/codecs o freeze.
No deploy manual, corte RC3 ni nueva certificación humana. El estado de push y CI
se reporta por separado de los checks locales.

No se ejecutó `db:reset` ni `db:stop`: se conserva el stack local solicitado para
probar y no hay cambios de schema. Integración real, lint SQL y regeneración de
tipos cubren el adaptador de contador existente. No gates de contenedores ni
operaciones cloud porque no se modificó su configuración.
