# Verificación TASK-A

Fecha: 2026-09-22. Base: `main` / `a1a6469`. Scope B07–B10.
Node 24.19.0, pnpm 11.22.0, Next 16.3.5; lockfile y dependencias intactos.
**Verificación local: PASS.** Publicación: ver reporte final de la sesión.

## Entorno reproducible

Los comandos de build/navegador/verify se ejecutan con las variables de
`.env.local` precargadas en el proceso, comprobando que Supabase sea loopback.
Esta máquina también contiene `.env.production.local`, que Next prioriza al
ejecutar producción: no alcanza con asumir que `next start` toma la DB local.
No se modificaron archivos de entorno. Wrapper temporal fuera del repositorio:

```js
import { spawnSync } from 'node:child_process'
process.loadEnvFile('.env.local')
const host = new URL(
  process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
).hostname
if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) {
  throw new Error('La verificación requiere Supabase local')
}
const result = spawnSync('pnpm', process.argv.slice(2), {
  env: process.env,
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
```

Los fixtures visuales interceptan únicamente lecturas del estado público; no
editan fechas/estado de competencia en DB. Las pruebas existentes de partida
usan el Supabase local ya configurado. Las capturas contienen alias sintéticos.

## Comandos y resultados

- `pnpm install --frozen-lockfile` y `pnpm toolchain:check`: PASS.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm design:check`: PASS.
- `pnpm build` (entorno local explícito): PASS.
- Tests relevantes iniciales: 7 archivos / 119 tests PASS; tras ajuste de copy
  cerrado, 3 archivos / 71 tests PASS.
- `pnpm verify` (entorno local explícito): **PASS, exit 0** en la corrida final.
  Cobertura: 126 archivos, **2.380 tests**, sin saltos. Statements 85,80 %,
  branches 78,15 %, functions 87,92 %, lines 86,03 %. Validación/catálogos de
  todos los años y simulaciones estándar: PASS; freeze RC2: 57 comprobaciones
  PASS; build de producción PASS; navegador: **244 PASS, sin saltos, 2,8 min**.
- `pnpm test:e2e:only tests/e2e/home-event.spec.ts` tras el ajuste final de zoom:
  **22 PASS**, escritorio y móvil.
- `node scripts/sync-master-spec.mjs --write` y `--check`: sincronizado.
- `git diff --check`, `git diff --cached --check` y revisión del diff completo:
  PASS. Ningún cambio fuera de TASK-A en el commit de implementación.

## QA visual y accesibilidad

Playwright cubre 320/360/390/412/768/1280/1920 CSS px, zoom CSS al 200 % y reflow
a 640 px, estados OPEN/UPCOMING/CLOSED, vacío, empates, alias largo, puesto propio,
CTA/formulario, navegación por teclado, foco, reduced motion, privacidad, logos
cargados y axe WCAG 2.2. Las pruebas existentes ejercitan sesiones, partida real,
reanudación, segundo intento, verificación y autoridad de servidor.

Se inspeccionaron las capturas de desktop, mobile y zoom. El podio móvil se apila;
primero/segundo/tercero tienen jerarquía por escala/filete, sin depender del color.
Las cifras no son live regions: el lector recibe la fecha absoluta y su zona.
La prueba de hidratación usa relojes de servidor/cliente distintos.

Evidencia: [desktop](evidence/home-1280.png), [320 px](evidence/home-320.png),
[zoom 200 %](evidence/home-zoom-200.png),
[payload antes/después](evidence/performance.json). No son snapshots que deban
aprobarse automáticamente por diferencia de píxeles.

No se ejecutó una sesión humana con NVDA/VoiceOver ni zoom nativo de un navegador
de escritorio; se verificó semántica, árbol accesible, teclado, escalado CSS y
reflow. No se declara certificación WCAG ni métricas de campo de Core Web Vitals.

## Hallazgos resueltos

1. Una primera prueba de navegador tomó el entorno de producción y no el local;
   se corrigió la precedencia mediante el wrapper anterior. El estado remoto
   upcoming provocaba saltos de pruebas de partida. Las corridas válidas usan
   exclusivamente la DB local y no necesitan esos saltos.
2. La primera corrida completa terminó con 243 PASS / 1 FAIL: una aserción leía
   `naturalWidth` antes de terminar la carga lazy del logo. Se usa espera
   observable (`expect.poll`), no demora fija. Repetición completa: 244 PASS.
3. La captura al 200 % reveló solapamiento del título sin scroll horizontal.
   Se cambió la escala del título a unidades de contenedor y se añadió una
   comprobación de sus límites en cada ancho y al ampliar.

## Límites y alcance preservado

- Reloj local desajustado puede desfasar el countdown orientativo; el backend
  mantiene la autoridad. No se introdujo `serverNow` ni un contrato paralelo.
- No cambios en motor, matemática, catálogos, FairScore, Prestige, comparador,
  DTO público, API, RLS, migraciones, identidad, seed, replay o lifecycle.
- No nuevas dependencias. Los tres logos runtime pesan 49.544 B; sus masters
  originales se preservan, incluido el Piacentini JPG realmente entregado.
- `db:reset/lint/types`, contenedores y auditoría profunda de seguridad no se
  ejecutaron: no hay cambios en esas superficies. El gate sí conserva sus
  tests de privacidad/autoridad, secret scan y release dependency check.
- No simulación matemática profunda adicional. Se ejecutan sólo las
  validaciones y simulaciones estándar incluidas en `pnpm verify`.
- Runtime/freeze continúa en RC2; sin tag RC3 ni deployment manual. Branding,
  ending y copy integral quedan diferidos. Próximo: TASK-B.

## Git y publicación

Los materiales preexistentes de discovery/handoff y `resources/footer` se
conservan sin modificaciones en `650ca30`, separados del commit de implementación
`feat(home): elevate fair event experience`. El resultado del push y el HEAD final
se informan en el reporte de cierre; la sesión detectó inicialmente SSH sin clave
desbloqueada (`Permission denied (publickey)`). Los commits anteriores de
ilustraciones se preservan; no se reescribe historia ni se usa force push.
