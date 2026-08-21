# Entorno de desarrollo

Fecha de baseline: **20 de agosto de 2026**.

Este documento describe la base técnica ejecutable del repositorio. No define comportamiento de producto ni habilita por sí solo gameplay, Auth, persistencia de participantes o un release público.

## Estado de la base

La raíz contiene una única aplicación Next.js. La decisión está formalizada en [ADR-010](../03-architecture/adr/ADR-010-reproducible-node-pnpm-container-toolchain.md): Node.js 24 LTS, pnpm como único package manager, lockfile congelado, desarrollo nativo como camino rápido, Compose para paridad y una imagen standalone portable. Vercel sigue siendo la [topología canónica](../03-architecture/deployment-and-environments.md) prevista para producción.

La aplicación actual ofrece:

- shell responsive y manifest web;
- liveness check `GET /api/health` sin dependencia de base de datos;
- configuración de ambiente validada con Zod;
- adapters Supabase separados para browser, servidor y privilegios;
- tests, lint de fronteras, build y CI;
- base local de Supabase sin tablas de juego;
- Docker de desarrollo y artefacto standalone no-root.

Quedan fuera deliberadamente gameplay, Auth, schema de dominio, datos de participantes, ranking, service worker/PWA avanzada, analytics y deploy público.

## Versiones fijadas

`package.json` y `pnpm-lock.yaml` gobiernan las APIs reales. Las versiones relevantes de esta baseline son:

| Herramienta | Versión exacta | Motivo operativo |
|---|---:|---|
| Node.js | `24.19.0` | runtime LTS fijado en `.node-version`, `.nvmrc`, CI y Docker |
| pnpm | `11.22.0` | único package manager, fijado en `packageManager` y Docker |
| Next.js | `16.3.1` | App Router y Turbopack por defecto; bloqueado para release hasta `16.3.2+` |
| React / React DOM | `19.2.8` | par compatible fijado |
| TypeScript | `6.0.2` | versión estable compatible con el ecosistema instalado |
| ESLint | `9.39.5` | excepción temporal de compatibilidad con Next.js/typescript-eslint |
| Tailwind CSS | `4.3.3` | pipeline PostCSS actual |
| Vitest | `4.1.11` | tests y cobertura V8 |
| Playwright | `1.62.1` | smoke E2E desktop y mobile |
| Supabase CLI | `2.115.0` | stack, migraciones, lint y tipos locales |
| Supabase JS | `2.112.3` | adapters tipados, todavía sin uso de dominio |
| Next DevTools MCP | `0.4.0` | introspección local del dev server |

Las dependencias están fijadas de forma exacta; no reemplazar pnpm por npm/yarn ni instalar con un lockfile mutable.

### Decisiones de compatibilidad pendientes de actualización

- TypeScript 7 no se adoptó: la versión evaluada no exponía el compiler API JavaScript requerido por el tooling y quedaba fuera del rango peer del stack typescript-eslint instalado. TypeScript `6.0.2` es la línea estable compatible.
- ESLint 10 no se adoptó: dependencias transitivas de la configuración Next.js aún declaran compatibilidad con ESLint 9. `9.39.5` es una excepción de tooling, no una preferencia permanente; el registry la reporta fuera de mantenimiento. Dependabot y las revisiones de actualización deben retirarla apenas el grafo peer permita ESLint 10.
- No se agregó Zustand: no existe todavía estado interactivo que justifique esa dependencia.
- No se adoptó `@supabase/ssr`: Auth no forma parte de esta base y el paquete continúa marcado Beta.
- React Compiler permanece desactivado: es opt-in y no hay UI de producto sobre la cual demostrar beneficio frente a su costo de build.

Después de actualizar dependencias, verificar peers, docs versionadas y el pipeline completo:

```bash
pnpm toolchain:check
pnpm peers check
pnpm verify
```

## Bloqueo de release de Next.js

Next.js `16.3.1` es la versión fijada, pero no se considera apta para publicación. El 20 de agosto de 2026 upstream anunció un parche crítico en `16.3.2`, programado para el 26 de agosto. El detalle permanecía embargado al crear esta baseline.

`pnpm release:check` comprueba mecánicamente que la versión fijada sea `16.3.2` o superior y falla hoy de forma intencional. Ese resultado no invalida el desarrollo local, pero sí prohíbe preview externo, staging público o producción.

Para levantar el bloqueo cuando exista la versión corregida:

1. actualizar `next` y `eslint-config-next` en conjunto y con versiones exactas;
2. regenerar `pnpm-lock.yaml`;
3. releer `node_modules/next/dist/docs/` y las notas de seguridad de la versión;
4. ejecutar `pnpm peers check`, `pnpm security:audit` y `pnpm verify`;
5. ejecutar `pnpm release:check` y registrar evidencia antes de habilitar cualquier deploy.

El check de versión no reemplaza la auditoría ni la verificación funcional.

## Requisitos locales

- Git.
- Node.js `24.19.0`; se recomienda un version manager compatible con `.nvmrc`/`.node-version`.
- Corepack y pnpm `11.22.0`.
- Docker Engine con Compose v2 para Supabase local y workflows contenedorizados.
- Chromium administrado por Playwright para E2E.

Preparación reproducible:

```bash
nvm use
corepack enable
corepack install --global pnpm@11.22.0
pnpm install --frozen-lockfile
pnpm toolchain:check
pnpm exec playwright install chromium
```

`engine-strict`, peers estrictos y el package manager fijado hacen fallar temprano una instalación incompatible. `pnpm toolchain:check` comprueba que `.node-version`, `.nvmrc`, `engines`, `packageManager`, el proceso activo y Docker estén alineados. Debe ejecutarse mediante el pnpm fijado. `pnpm-workspace.yaml` existe para declarar builds de dependencias permitidos; el repositorio no es un monorepo.

## Desarrollo nativo

El camino rápido no requiere Supabase:

```bash
pnpm dev
```

- aplicación: `http://localhost:3000`;
- health: `http://localhost:3000/api/health`;
- detener: `Ctrl+C`.

Next.js usa Turbopack por defecto. Durante tareas Next.js, leer primero la guía correspondiente dentro de `node_modules/next/dist/docs/`; corresponde a la versión fijada y prevalece sobre recuerdos de otras versiones.

`next dev` mantiene un bloque al final de `AGENTS.md`. No borrarlo ni insertar reglas de Egresado dentro de sus marcadores.

## Variables de ambiente

La aplicación valida configuración server-side durante el build y al arrancar. Supabase es opcional, pero los pares parciales fallan explícitamente. Las URLs aceptan sólo HTTP(S), sin userinfo (`usuario:password`) ni fragmentos; los errores nombran campos sin repetir valores.

| Variable | Exposición | Regla |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | browser y server | URL; default local `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | browser y server | opcional; exige publishable key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser y server | opcional; exige URL y prefijo `sb_publishable_` |
| `SUPABASE_INTERNAL_URL` | sólo server | URL opcional para acceso desde contenedor/red interna |
| `SUPABASE_SECRET_KEY` | sólo server | opcional; exige alguna URL y prefijo `sb_secret_` |

Reglas de seguridad:

- partir de `.env.example`; nunca agregar valores reales allí;
- mantener secretos en `.env.local`, que está ignorado por Git;
- no usar `NEXT_PUBLIC_` para un secreto;
- UI y Route Handlers no importan persistencia directamente;
- fuera de la capa de configuración, sólo `src/server/persistence/supabase/privileged-client.ts` consume la secret key para construir un cliente;
- no imprimir configuración completa en logs ni adjuntar outputs del CLI de Supabase.

El shell funciona sin `.env.local`. Cuando Supabase local está activo, generar el archivo en vez de copiar claves a mano:

```bash
pnpm db:env
```

El script valida formatos, escribe de manera atómica y sólo confirma el resultado con valores redactados. En POSIX aplica modo `0600`; Windows no implementa esos bits y conserva la ACL heredada, así que usar un checkout dentro del perfil del desarrollador, no un directorio compartido, y ajustar la ACL del host si fuera necesario.

## Supabase local

La CLI está fijada como devDependency; ejecutar siempre mediante scripts pnpm. Docker debe estar disponible.

```bash
pnpm db:start
pnpm db:status
pnpm db:env
```

`pnpm db:status` es el wrapper seguro: informa sólo origen API y presencia de claves. No sustituirlo en logs compartidos por `pnpm exec supabase status`, cuya salida incluye credenciales locales.

`db:start` oculta la salida que contiene claves y solicita para la red Docker `egresado-supabase-local` un binding en `127.0.0.1`. Después inspecciona los `HostIp` efectivos. Si Docker publica en `0.0.0.0` o `::`, detiene el stack y falla: Docker Desktop puede ignorar la opción de la red aunque la conserve en su metadata.

En una máquina protegida por firewall y conectada sólo a una red confiable se puede aceptar conscientemente esa limitación con `pnpm db:start --allow-non-loopback`; el warning permanece visible. La variable `EGRESADO_ALLOW_NON_LOOPBACK_SUPABASE=true` ofrece el mismo opt-in para automatización local. No persistir la excepción ni usarla en una red no confiable.

El opt-in se evalúa en cada operación que usa el stack. En ese entorno hay que repetirlo como `pnpm db:reset --allow-non-loopback` y `pnpm docker:up --allow-non-loopback`; haberlo aceptado durante `db:start` no reduce silenciosamente los controles posteriores.

La base ejecuta Postgres, PostgREST, Kong y el servicio Auth que Supabase CLI `2.115.0` necesita activo para informar las claves locales modernas. Data API expone sólo el schema `public`; GraphQL no está habilitado. Signup general y por email están deshabilitados, y la aplicación no implementa sesiones, adapters Auth ni UI de login. Realtime, Storage, Studio, SMTP, Edge Runtime y analytics siguen deshabilitados. La CLI local no tiene TLS ni hardening de producción.

Workflow de schema:

```bash
pnpm db:migration nombre_descriptivo
pnpm db:reset
pnpm db:lint
pnpm db:types
pnpm format
```

- Las migraciones viven en `supabase/migrations/` y se versionan.
- `db:reset` borra y reconstruye únicamente la base local; revisar el target antes de ejecutarlo.
- `db:lint` falla ante errores del schema local.
- `db:types` reemplaza atómicamente `src/lib/supabase/database.types.ts` a partir del schema `public` local; no editar ese archivo a mano.
- Regenerar tipos y tests en el mismo cambio que una migración.

La migración y el seed iniciales son deliberadamente no-op. No existen tablas de juego, políticas RLS, usuarios de aplicación ni flujo Auth. Diseñarlos exige una tarea de dominio, revisión de privacidad y los ADR/contratos correspondientes.

Detener el stack al finalizar:

```bash
pnpm db:stop
```

## Docker

### Desarrollo con Compose

Con Supabase opcional ya iniciado y `.env.local` generado cuando corresponda:

```bash
pnpm docker:up
```

Si `db:status` informa `loopbackOnly: false` y ya se aceptó el riesgo local bajo las condiciones anteriores, usar `pnpm docker:up --allow-non-loopback` para esta invocación.

Compose:

- construye el stage `development`;
- monta el checkout en `/app`;
- aísla `node_modules` en un volumen anónimo;
- conserva `.next` en el volumen `egresado_next`;
- publica el puerto `3000`;
- habilita polling para file watching;
- se conecta a la red externa `egresado-supabase-local`, sometida a la verificación de binding de los wrappers, y usa `http://kong:8000` para tráfico server→Supabase;
- verifica `/api/health`.

El browser continúa usando `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`; sólo el código server usa el override `SUPABASE_INTERNAL_URL` dentro del contenedor.

Detener y retirar los recursos activos del proyecto:

```bash
pnpm docker:down
```

El volumen de cache `.next` se conserva. Para resetear también ese cache local, ejecutar de forma explícita `docker compose down --volumes --remove-orphans`; este comando elimina volúmenes del proyecto Compose.

### Imagen de producción portable

```bash
pnpm docker:build
docker run --rm --name egresado-local -p 127.0.0.1:3000:3000 egresado:local
```

La imagen usa stages separados, instalación con lockfile congelado, output standalone, base por digest y usuario final `node` sin privilegios. `.env*`, fuentes de desarrollo y secretos no se copian al stage final.

Next.js congela las variables `NEXT_PUBLIC_*` al construir el bundle. Una imagen que habilite acceso público a Supabase debe crearse para ese ambiente pasando exclusivamente valores públicos:

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://app.example \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://project.example.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REEMPLAZAR \
  --tag egresado:environment .
```

Esos argumentos son públicos y quedan asociados al artefacto; nunca pasar `SUPABASE_SECRET_KEY` ni `SUPABASE_INTERNAL_URL` durante el build. Cambiar `NEXT_PUBLIC_*` exige reconstruir la imagen: `docker run -e` no reescribe el bundle del browser. Los valores server-only se inyectan recién al proceso runtime mediante el secret manager del ambiente y no forman parte de la imagen.

Este artefacto permite validar paridad y portabilidad. No reemplaza Vercel ni autoriza hosting alternativo o público.

## Fronteras de código

La arquitectura es un monolito modular con BFF:

| Frontera | Responsabilidad | Dependencias permitidas relevantes |
|---|---|---|
| `src/app` | routing, composición y entrada BFF | components, game, casos de uso server, lib, config; no internals de persistencia |
| `src/components` | UI y adapters de interacción | components, game, lib; no server, config server-only ni Supabase |
| `src/game` | futuro motor determinista puro | sólo game; sin framework ni infraestructura |
| `src/content` | contenido versionado como datos | content, game y lib; no componentes ad hoc |
| `src/server` | casos de uso autoritativos y persistencia | server, game, content, lib y config |
| `src/lib` | adapters/utilidades compartidos | lib y config |
| `src/config` | schema y acceso controlado al ambiente | config |

Las reglas viven en `eslint.config.mjs`. Además, `tsconfig.game.json` compila el motor sin tipos DOM ni Node, y lint prohíbe React/Next/Supabase, browser globals, `fetch`, `Math.random()`, `Date.now()` y construcción de fecha global en `src/game`.

Supabase sólo se importa desde adapters aprobados. El browser es no confiable: una futura UI puede previsualizar, pero creación/validación de runs, replay, score oficial y persistencia pertenecen al servidor según la [arquitectura general](../03-architecture/architecture-overview.md).

## Tests y quality gates

Comandos focalizados:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:e2e
```

Vitest cubre suites unitarias, de componentes, integración y property-based. Los thresholds globales actuales son 85% para líneas, statements y funciones, y 75% para branches.

`pnpm test:e2e` genera una build y ejecuta Playwright contra `pnpm start` en puerto `3100`, con Chromium desktop y Pixel 7. `pnpm test:e2e:only` presupone una build existente; se usa en CI y dentro del gate después de `pnpm build`.

El gate completo es:

```bash
pnpm verify
```

En orden ejecuta:

1. alineación del toolchain fijado;
2. validación del workspace agentivo;
3. check del master documental generado;
4. formato;
5. lint y fronteras arquitectónicas;
6. TypeScript general y game core aislado;
7. tests con cobertura;
8. build de producción;
9. smoke E2E.

Requiere Node.js `24.19.0`, pnpm `11.22.0` y Chromium previamente instalado. No arranca Supabase ni Docker porque el shell y sus tests no dependen de servicios externos.

## CI, actualizaciones y seguridad

`.github/workflows/quality.yml` ejecuta tres jobs con permisos mínimos y Actions fijadas por SHA:

- `Quality and build`: install congelado, toolchain, documentación/agentes, formato, lint, tipos, cobertura y build;
- `Browser smoke tests`: install congelado, Chromium con dependencias, build, Playwright y artifact de reporte;
- `Production container smoke`: construye el target `runner` con valores públicos sintéticos, publica el contenedor sólo en `127.0.0.1`, verifica `/`, `/api/health`, `Config.User=node` y ausencia de `SUPABASE_SECRET_KEY`, y siempre retira únicamente su contenedor nombrado.

Dependabot revisa semanalmente npm, GitHub Actions y Docker. Una actualización no se acepta sólo porque compile: debe conservar peers, fronteras, docs instaladas, build standalone y tests.

Checks locales adicionales:

```bash
pnpm security:audit
pnpm secrets:check
pnpm release:check
```

`security:audit` examina dependencias productivas, de desarrollo y tooling agentivo, y falla desde severidad alta. El override fijado de `@modelcontextprotocol/sdk` `1.26.0` corrige un advisory transitivo de `next-devtools-mcp` `0.4.0`; retirarlo cuando upstream adopte una versión corregida exige lockfile nuevo, auditoría y smoke real del MCP.

`secrets:check` inspecciona archivos tracked y untracked no ignorados para formatos de credenciales de alta señal sin imprimir el valor encontrado. No reemplaza un scanner con entropía/historial: habilitar Secret Scanning y push protection en GitHub antes de aceptar contribuciones o un release público. Esa configuración del repositorio remoto queda fuera del alcance local y debe verificarse operacionalmente.

`release:check` está separado del CI de calidad porque expresa autorización de publicación y hoy debe fallar. Esta base no contiene workflow de deploy.

No se instalaron hooks Git: son fáciles de omitir, agregan otra herramienta de bootstrap y suelen degradar el flujo cross-platform. El guardrail autoritativo es CI; antes de entregar o enviar cambios se ejecuta `pnpm verify`, mientras `pnpm format`, `pnpm lint` y tests estrechos permiten iterar rápido sin volver cada commit un gate E2E.

## Editor y agentes

`.vscode/` recomienda ESLint, Prettier, Tailwind, Docker y Playwright, y configura format-on-save. La configuración compartida no reemplaza preferencias de usuario ajenas al proyecto.

Codex descubre `AGENTS.md`, las skills bajo `.agents/skills/` y el MCP project-scoped bajo `.codex/config.toml`. El onboarding, trust y troubleshooting del servidor están en [mcp-strategy.md](mcp-strategy.md); la arquitectura completa del workspace está en [agent-setup.md](agent-setup.md).

## Troubleshooting breve

### El install rechaza Node o pnpm

Confirmar `node --version` = `v24.19.0` y `pnpm --version` = `11.22.0`, luego ejecutar `pnpm install --frozen-lockfile`. No desactivar `engine-strict` ni peers estrictos para ocultar drift.

### La aplicación falla por ambiente inválido

Eliminar el par parcial o regenerar `.env.local` con Supabase activo mediante `pnpm db:env`. Nunca inventar una secret key vacía/default.

### El contenedor no alcanza Supabase

Confirmar `pnpm db:status`, que `.env.local` existe, que la red `egresado-supabase-local` está creada por los wrappers y que Compose conserva `SUPABASE_INTERNAL_URL=http://kong:8000`. Si `loopbackOnly` es falso, detener el stack o aplicar únicamente el opt-in local documentado después de verificar firewall/red, repitiendo `--allow-non-loopback` también en `docker:up`. No cambiar la URL pública `127.0.0.1` por un hostname interno inaccesible para el browser.

### Playwright no encuentra navegador

```bash
pnpm exec playwright install chromium
```

En Linux sin librerías del sistema, usar la instalación con dependencias apropiada para la máquina o reproducir el job CI con `pnpm exec playwright install --with-deps chromium`.

### El MCP no aparece

Confiar el checkout, instalar dependencias y abrir una sesión nueva de Codex. Luego comprobar `codex mcp list` con `pnpm dev` activo. Ver [estrategia MCP](mcp-strategy.md) para el caveat de `args` observado en `next-devtools-mcp` `0.4.0`.
