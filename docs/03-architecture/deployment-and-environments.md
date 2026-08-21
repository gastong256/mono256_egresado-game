# Despliegue y ambientes

## Topología aceptada

Vercel es el destino canónico para la aplicación Next.js y sus Route Handlers; Supabase gestiona PostgreSQL cuando la persistencia está habilitada. La imagen Docker standalone definida por [ADR-010](adr/ADR-010-reproducible-node-pnpm-container-toolchain.md) es un artefacto portable para paridad y verificación, no un cambio de proveedor de producción.

La base actual es local y no contiene gameplay, autenticación ni tablas de producto. No debe desplegarse públicamente con Next.js `16.3.1`: el gate `pnpm release:check` exige actualizar a `>=16.3.2`, regenerar el lockfile y volver a ejecutar la verificación completa.

## Ambientes

| Ambiente | Propósito | Datos y persistencia |
|---|---|---|
| Local nativo | Camino rápido con `pnpm dev`; Supabase local es opcional. | `.env.local` ignorado por Git; DB local o proyecto de desarrollo aislado. |
| Local Compose | Paridad del runtime Linux y prueba del desarrollo contenedorizado. | El browser usa la URL pública del host y el proceso server usa la URL interna del contenedor. |
| Preview | Cada PR/despliegue de Vercel cuando se habilite. | Recursos aislados; nunca datos reales de producción. |
| Staging | Configuración cercana a feria para E2E, migraciones, carga y rehearsal. | Proyecto Supabase separado de producción. |
| Production | Evento real y juego público, después de cerrar todos los gates de release. | Secretos gestionados por el proveedor y datos bajo la política legal/retención que aún debe cerrarse. |

La política legal y de retención, los SLO operativos y los requisitos exactos de rehearsal permanecen abiertos en [preguntas 30 y 31](../07-reference/open-questions.md#operación-seguridad-y-privacidad).

## Configuración y URLs de Supabase

La configuración se valida al iniciar y puede quedar completamente ausente para ejecutar el shell:

- `NEXT_PUBLIC_APP_URL`: origen público de la aplicación; localmente tiene default `http://localhost:3000`.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: par público obligatorio en conjunto. La publishable key no es un secreto y sólo es segura junto con grants/RLS mínimos.
- `SUPABASE_INTERNAL_URL`: URL server-only opcional. En Compose usa por defecto `http://kong:8000`, alias interno del gateway en la red Docker local compartida.
- `SUPABASE_SECRET_KEY`: credencial privilegiada server-only, sin default y nunca prefijada con `NEXT_PUBLIC_`.

En desarrollo nativo, el server puede reutilizar `NEXT_PUBLIC_SUPABASE_URL`. En Compose, el browser conserva `http://127.0.0.1:54321` mientras el proceso server usa la red `egresado-supabase-local` y el alias interno `http://kong:8000`. La red compartida resuelve conectividad contenedor a contenedor, pero no garantiza por sí sola que los puertos publicados queden aislados de la LAN.

### Exposición de puertos en Docker Desktop

El wrapper solicita el binding oficial `com.docker.network.bridge.host_binding_ipv4=127.0.0.1` al crear la red. Esa opción expresa la intención de loopback, pero Docker Desktop puede conservarla en la red y aun publicar un contenedor con `HostIp` real `0.0.0.0` o `::`. Por eso la opción de red no se trata como evidencia suficiente.

Después de iniciar Supabase, el wrapper inspecciona los bindings efectivos de todos sus contenedores y sólo considera loopback a `127.0.0.1` o `::1`. `pnpm db:start` es fail-closed: ante cualquier otro `HostIp` —incluidos `0.0.0.0` y `::`— intenta detener el stack y falla. `pnpm db:reset` y `pnpm docker:up` también rechazan por defecto un stack existente que no sea loopback-only. `pnpm db:status` reporta `loopbackOnly` y emite una advertencia si detecta exposición.

Sólo para uso local en una red de confianza, con firewall del host verificado, los wrappers aceptan el flag explícito `--allow-non-loopback` o `EGRESADO_ALLOW_NON_LOOPBACK_SUPABASE=true` para automatización local. La excepción imprime una advertencia visible y no convierte el stack en apto para una red compartida, CI, staging ni producción. No crear un script alternativo ni persistir este override como default de proyecto.

`pnpm db:env` genera `.env.local` desde Supabase local sin imprimir valores secretos. El archivo no entra en la imagen final ni en Git. Los adaptadores server-only prefieren la URL interna y la configuración pública nunca incluye `SUPABASE_SECRET_KEY`.

## Caminos locales

El camino nativo es el ciclo rápido:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Supabase se inicia por separado sólo si la tarea necesita persistencia:

```bash
pnpm db:start
pnpm db:env
pnpm db:reset
pnpm db:types
```

Si Docker Desktop no respeta el binding solicitado, `pnpm db:start` falla e intenta dejar el stack detenido. Corregir la configuración de Docker/firewall es la opción preferida; la excepción `pnpm db:start --allow-non-loopback` queda limitada al escenario local de confianza descrito arriba. Como el permiso no persiste, repetir explícitamente `pnpm db:reset --allow-non-loopback` o `pnpm docker:up --allow-non-loopback` si ese workflow necesita continuar con el stack ya inspeccionado; la variable de opt-in ofrece el mismo comportamiento para automatización local.

El camino contenedorizado levanta la etapa `development` con bind mount del repositorio y volúmenes separados para `node_modules` y `.next`:

```bash
pnpm docker:up
pnpm docker:down
```

La guía completa de prerrequisitos, troubleshooting y limpieza está en [entorno de desarrollo](../08-engineering/development-environment.md).

## Imagen de producción portable

El `Dockerfile` multi-stage:

1. fija Node.js 24.19.0 por tag y digest e instala pnpm 11.22.0;
2. instala con `pnpm install --frozen-lockfile`;
3. activa `NEXT_STANDALONE=true` sólo en la etapa `builder`;
4. copia la salida standalone y assets al runtime mínimo;
5. ejecuta como usuario no root `node` e incluye un health check sobre `/api/health`.

El build normal de Vercel no activa salida standalone. Esta condición evita cambiar el contrato de despliegue canónico mientras permite verificar el artefacto Docker con `pnpm docker:build`.

Las variables `NEXT_PUBLIC_*` quedan congeladas por Next.js durante el build. El `Dockerfile` acepta sólo esos valores públicos como `--build-arg`; una imagen configurada para otro origen debe reconstruirse. `SUPABASE_SECRET_KEY` y `SUPABASE_INTERNAL_URL` no son build args: se inyectan al runtime server desde el ambiente/secret manager. Nunca reutilizar una imagen con configuración pública de un ambiente distinto sin reconstruirla.

## CI y gates de release

GitHub Actions usa Node desde `.node-version`, pnpm desde `packageManager` y dependencias congeladas. `pnpm toolchain:check` exige que `.node-version`, `.nvmrc`, `engines`, `packageManager` y el `Dockerfile` permanezcan alineados. Las actions están fijadas por SHA y los permisos del workflow son sólo de lectura.

El job `Quality and build` ejecuta coherencia del toolchain, validación documental/agentic, scanner de secretos, auditoría del árbol completo de dependencias, formato, lint/fronteras arquitectónicas, typecheck, cobertura y build. El job `Browser smoke tests` instala Chromium, construye la aplicación, ejecuta Playwright en desktop/mobile y conserva el reporte. El job `Production container smoke` prueba el runner standalone no-root y su health. Dependabot revisa semanalmente dependencias npm, GitHub Actions y Docker.

Antes de un release público también deben pasar:

- `pnpm release:check`; hoy falla de forma deliberada hasta instalar Next.js `>=16.3.2`;
- `pnpm security:audit` y revisión de advisories/transitivas;
- migraciones, RLS/permisos y pruebas de integración cuando exista schema de producto;
- golden replays, validación de contenido, rehearsal y fallback cuando exista gameplay/release de feria.

Un CI verde de la base técnica no reemplaza esos gates contextuales.

## Migraciones

- Los cambios viven como SQL versionado en `supabase/migrations/`.
- `pnpm db:reset` demuestra que el historial reconstruye la DB local; `pnpm db:lint` revisa el schema y `pnpm db:types` regenera los tipos consumidos por TypeScript.
- Toda migración de producto necesita revisión de índices y RLS/permisos, y se aplica a staging antes de producción.
- No editar el schema productivo manualmente sin registrar una migración.
- La migración inicial sólo valida el pipeline; no decide el modelo de runs, eventos o acciones.

## Región, rollback y PWA

- Configurar funciones cerca de la región de la base de datos antes de producción.
- Mantener disponible el deploy anterior y preferir migraciones backward-compatible.
- `game_version`, `ruleset_version` y `content_version` evitan reinterpretar runs incompatibles; el mecanismo de conservación histórica sigue abierto.
- La base incluye manifest responsive. Un service worker avanzado se difiere hasta estabilizar caching y versionado para no servir assets o reglas incompatibles.

Los feature flags futuros deben limitarse a necesidades verificadas; no crear una plataforma propia de flags para el MVP.
