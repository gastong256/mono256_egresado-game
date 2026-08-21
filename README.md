# Egresado

Videojuego web de decisiones y desafíos matemáticos contextualizados en la vida escolar. Este repositorio ya contiene la base técnica reproducible de la aplicación: Next.js, TypeScript estricto, tests, Supabase local opcional, Docker, CI y configuración agentiva.

La pantalla actual es sólo un shell técnico. Todavía no implementa gameplay, Auth, datos de juego ni ranking.

> **Release público bloqueado:** el repositorio fija Next.js `16.3.1`, anterior al parche de seguridad anunciado para `16.3.2`. `pnpm release:check` falla deliberadamente hasta actualizar Next.js y su lockfile, y volver a ejecutar todos los gates. No desplegar esta revisión públicamente.

## Inicio rápido nativo

Requisitos: Node.js `24.19.0`, pnpm `11.22.0` y, para los tests E2E, Chromium de Playwright.

```bash
nvm use
corepack enable
corepack install --global pnpm@11.22.0
pnpm install --frozen-lockfile
pnpm dev
```

Abrir `http://localhost:3000`. El liveness check está en `http://localhost:3000/api/health`.

La aplicación arranca sin base de datos. Para habilitar el stack local opcional:

```bash
pnpm db:start
pnpm db:env
pnpm dev
```

`pnpm db:env` crea `.env.local` atómicamente y no muestra valores. Usa modo `0600` en POSIX; en Windows hereda la ACL del checkout, por lo que debe usarse un directorio de usuario no compartido. La salida directa del CLI de Supabase puede contener credenciales locales: no copiarla en issues, chats ni logs compartidos. Al terminar:

```bash
pnpm db:stop
```

## Comandos principales

| Objetivo                                              | Comando                |
| ----------------------------------------------------- | ---------------------- |
| Desarrollo nativo                                     | `pnpm dev`             |
| Desarrollo en contenedor                              | `pnpm docker:up`       |
| Detener y retirar Compose                             | `pnpm docker:down`     |
| Alineación Node/pnpm/Docker                           | `pnpm toolchain:check` |
| Tests unitarios/integración/property/componentes      | `pnpm test`            |
| Cobertura                                             | `pnpm test:coverage`   |
| E2E con build previa                                  | `pnpm test:e2e`        |
| Gate completo local                                   | `pnpm verify`          |
| Patrones de secretos en archivos versionables         | `pnpm secrets:check`   |
| Auditoría de dependencias ejecutables y de desarrollo | `pnpm security:audit`  |
| Gate explícito de release                             | `pnpm release:check`   |

Antes del primer E2E local, instalar el navegador fijado por Playwright:

```bash
pnpm exec playwright install chromium
```

## Arquitectura en una mirada

- `src/app`: composición Next.js, rutas y BFF; no accede a internals de persistencia.
- `src/components`: UI; no importa servidor ni Supabase directamente.
- `src/game`: futuro motor TypeScript puro, determinista y sin React, DOM, red, DB, hora global ni `Math.random()`.
- `src/content`: frontera reservada para contenido como datos; se creará cuando exista contenido ejecutable autorizado.
- `src/server`: casos de uso autoritativos y adapters de persistencia.
- `src/lib`: utilidades y adapters compartidos explícitamente aprobados.
- `src/config`: validación tipada de ambiente público y server-only.
- `supabase`: configuración, migraciones y seed locales; hoy no define tablas de juego.
- `tests`: unit, component, integration, property y E2E.

ESLint y un `tsconfig` aislado del game core hacen cumplir estas fronteras. El navegador sigue siendo no confiable y el score oficial futuro deberá reconstruirse en servidor.

## Documentación

- [Entorno de desarrollo y operaciones locales](docs/08-engineering/development-environment.md)
- [Índice y autoridad documental](docs/README.md)
- [Mapa de contexto para tareas](docs/08-engineering/context-map.md)
- [Flujo de desarrollo asistido](docs/08-engineering/ai-development-workflow.md)
- [Setup de agentes](docs/08-engineering/agent-setup.md)
- [Estrategia MCP](docs/08-engineering/mcp-strategy.md)
- [ADR-010: toolchain reproducible y Docker portable](docs/03-architecture/adr/ADR-010-reproducible-node-pnpm-container-toolchain.md)

Vercel continúa siendo la topología canónica prevista para producción; la imagen Docker es un artefacto portable y de paridad, no una decisión de proveedor alternativa. Ningún despliegue público está habilitado en esta base.
