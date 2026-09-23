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
