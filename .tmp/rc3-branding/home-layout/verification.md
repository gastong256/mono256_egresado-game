# Ajuste de Home, ranking y footer — 23/09/2026

Resultado: PASS del subconjunto pertinente. No se ejecutó `pnpm verify`, coverage
completo, simulaciones de gameplay ni gates de DB/deploy, según el alcance UI y
la indicación del PO. No hubo push.

- Contador principal: mantiene diseño, cifras, animación y fecha; se retira sólo
  el control de ocultarlo. Lógica de reloj reutilizada para el aviso del ranking.
- Aviso escrito encima del total: horas/minutos con límite superior verdadero,
  últimos segundos y retiro al vencer. Sólo con estado abierto y cierre válido.
- Marca/promesa en una fila; reloj/acceso en otra. Móvil conserva lectura vertical.
- Se retira la secuencia de años de Home y tarjeta social.
- Practicar pasa a botón con borde secundario.
- Footer compacto, con mínimos de 128/176 px que admiten texto ampliado; marcas
  institucionales de 80 px, máscara circular de Piacentini y crédito de 24 px.
- WebP regenerados desde resources/footer sin alterar el contenido: 49.544 →
  17.194 bytes totales (65 % menos). Generador mantenible sin dependencias nuevas.

## Comandos y resultados

- `pnpm toolchain:check`: PASS; Node 24.19.0 / pnpm 11.22.0.
- `pnpm exec vite-node --config vitest.config.ts scripts/brand/build-footer-assets.ts`: PASS.
- `pnpm brand:og`: PASS.
- `pnpm test tests/component/event-countdown.test.tsx tests/component/ranking-deadline-notice.test.tsx tests/component/home-event.test.tsx tests/component/competition-ui.test.tsx`: 91 PASS.
- `pnpm typecheck`: PASS después de explicitar `undefined` en la prop opcional closesAt.
- `pnpm design:check`: PASS; cero hallazgos, 42 pares de contraste.
- `pnpm lint`: PASS.
- `pnpm format:check`: PASS.
- `node scripts/validate-agent-workspace.mjs`: PASS.
- `node scripts/sync-master-spec.mjs --write` y `--check`: PASS.
- `node /tmp/egresado-task-a/run-local.mjs build`: PASS.
- `node /tmp/egresado-task-a/run-local.mjs test:e2e:only tests/e2e/home-event.spec.ts tests/e2e/privacy.spec.ts tests/e2e/foundation.spec.ts --no-deps --workers=4`: 40 PASS.
- `git diff --check`: PASS; revisión de diff y estado realizada.

El wrapper de build/E2E carga `.env.local`, comprueba Supabase loopback y pasa
el entorno al proceso hijo; evita usar los valores remotos de `.env.production.local`.
Los E2E cubren 320/360/390/412/768/1280/1920, geometría de filas y pie, zoom 200 %,
teclado/foco, reduced motion, axe, navegación legal, SSR y estados del evento.
No se modificaron DB, API, reglas de ranking ni contenido jugable.

## Revisión visual y servidor

Capturas revisadas en `/tmp/egresado-home-layout/`: Home móvil/tablet/desktop,
footer móvil/desktop y aviso del ranking. Las capturas de E2E están en test-results.
Servidor de desarrollo existente conservado en `http://localhost:3000` con reloj
hidratado y aviso visible. Una comprobación manual por `127.0.0.1:3000` quedó en
SSR con error del WebSocket HMR; usar localhost. Los servidores de producción
local del E2E funcionaron en 127.0.0.1:3100/3101 y todos los casos pasaron.

## Ajuste posterior: marcas, crédito y presencia del footer

- Logos institucionales ampliados de 80 a 112 px (+40 %), conservando proporciones.
- Se retiró la imagen del desarrollador. El texto sigue enlazando a gastong256.dev;
  un icono GitHub independiente enlaza al repositorio solicitado.
- Footer sólo en Home (landing) y /privacidad. Ausente en identificación y runs
  competitivas; práctica ya carecía de footer y se comprobó en juego real.
- `pnpm test tests/component/home-event.test.tsx tests/component/privacy-page.test.tsx tests/component/competition-ui.test.tsx`: 60 PASS, incluida transición Home → identificación → run sin footer.
- ESLint dirigido a los siete archivos TS/TSX afectados y `pnpm typecheck`: PASS.
- `pnpm design:check`, formato dirigido, workspace, master y diff-check: PASS.
- `node /tmp/egresado-footer-review.mjs`: PASS en Home y privacidad a
  320/390/768/1280 px; imágenes, geometría, enlaces separados, axe y teclado.
  También PASS ausencia en identificación y práctica iniciada desde /test.
  El primer intento del script necesitó un contexto explícito de Playwright para
  axe; corregido el script, todas las comprobaciones pasaron.
- Capturas revisadas: `/tmp/egresado-home-layout/footer-larger-*.png`.
- Sin nuevo build ni suite E2E completa ni verify: cambio acotado de presentación,
  probado contra el servidor dev existente en localhost:3000. Sin push.

## Ajuste posterior: días en el aviso del ranking

El aviso usa días desde 12 horas restantes; por debajo conserva horas, minutos y
últimos segundos. Para 55 horas: «¡Mejorá tu marca! Quedan menos de 3 días».
Singular: «Queda menos de un día». Los límites superiores siguen siendo verdaderos.

- `pnpm test tests/component/ranking-deadline-notice.test.tsx`: 25 PASS; incluye
  los bordes de 12/24/48 horas y el ejemplo de 55 horas.
- Prettier y ESLint sobre los dos archivos afectados: PASS.
- Workspace, sincronización/check del master y `git diff --check`: PASS.
- Sin build, E2E ni verify adicionales: sólo cambia la selección de copy,
  cubierta por los tests específicos. Sin push.
