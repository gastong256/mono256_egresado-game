# Egresado

Videojuego web de decisiones y desafíos matemáticos contextualizados en la vida escolar. Este repositorio contiene la base técnica reproducible —Next.js, TypeScript estricto, tests, Supabase local opcional, Docker, CI y configuración agentiva— y el **motor de juego determinista**.

El motor ejecuta una run completa de punta a punta: progresión por etapas, selección de storylets, generación procedural de desafíos, evaluación exacta, feedback estructurado, scoring, perfil de egreso, snapshots y replay. Lo hace con **contenido de desarrollo** explícitamente marcado como tal.

Desde STAGE-09 ese juego está envuelto en una **competencia con servidor autoritativo**: el producto público vive en `/`, el servidor emite cada intento, vuelve a jugar lo enviado para recomputar el puntaje y publica un ranking por mejor intento verificado donde lo único que se ve de una persona es su alias. La identificación del participante sigue [ADR-026](docs/03-architecture/adr/ADR-026-participant-identity-and-minor-privacy.md): el documento no se guarda, se deriva.

Todavía no hay contenido de juego definitivo. Las políticas de scoring, dificultad y perfil siguen siendo de desarrollo: `createRuleset({ official: true })` falla a propósito mientras existan, y oficializar la configuración de competencia es FREEZE, no esta etapa.

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

La aplicación arranca sin base de datos: la portada dice que no hay competencia
configurada y el juego queda disponible bajo `/dev`. Para habilitar el stack
local:

```bash
pnpm db:start
pnpm db:env
pnpm dev
```

`pnpm db:env` crea `.env.local` atómicamente y no muestra valores. Usa modo `0600` en POSIX; en Windows hereda la ACL del checkout, por lo que debe usarse un directorio de usuario no compartido. La salida directa del CLI de Supabase puede contener credenciales locales: no copiarla en issues, chats ni logs compartidos. Al terminar:

```bash
pnpm db:stop
```

### Levantar una competencia local

```bash
pnpm competition:organizer:hash -- "<contraseña de al menos 12 caracteres>"
```

Agregar a `.env.local` el digest impreso más `EGRESADO_COMPETITION_SLUG`,
`PARTICIPANT_IDENTITY_SECRET`, los tres campos del responsable de los datos,
`EGRESADO_PRIVACY_NOTICE_VERSION` y `EGRESADO_ORGANIZER_USERNAME`
—`.env.example` los documenta uno por uno—. Después:

```bash
pnpm db:reset
pnpm competition:bootstrap -- --name="Feria local" --status=OPEN
```

Sin el responsable de los datos configurado, la aplicación **no atiende** la
competencia: falla con un error de configuración en vez de mostrar un aviso de
privacidad incompleto. La operación completa está en el
[runbook de feria](docs/05-operations/fair-runbook.md#operación-de-la-competencia-implementada).

## Comandos principales

| Objetivo                                              | Comando                      |
| ----------------------------------------------------- | ---------------------------- |
| Desarrollo nativo                                     | `pnpm dev`                   |
| Desarrollo en contenedor                              | `pnpm docker:up`             |
| Detener y retirar Compose                             | `pnpm docker:down`           |
| Alineación Node/pnpm/Docker                           | `pnpm toolchain:check`       |
| Tests unitarios/integración/property/componentes      | `pnpm test`                  |
| Cobertura                                             | `pnpm test:coverage`         |
| E2E con build previa                                  | `pnpm test:e2e`              |
| Validación de contenido del juego                     | `pnpm game:validate-content` |
| Simulación determinista de runs                       | `pnpm game:simulate`         |
| Gate completo local                                   | `pnpm verify`                |
| Patrones de secretos en archivos versionables         | `pnpm secrets:check`         |
| Auditoría de dependencias ejecutables y de desarrollo | `pnpm security:audit`        |
| Gate explícito de release                             | `pnpm release:check`         |

Antes del primer E2E local, instalar el navegador fijado por Playwright:

```bash
pnpm exec playwright install chromium
```

## Arquitectura en una mirada

- `src/app`: composición Next.js, rutas y BFF; no accede a internals de persistencia.
- `src/components`: UI; no importa servidor ni Supabase directamente.
- `src/game`: motor TypeScript puro, determinista y sin React, DOM, red, DB, `process`, hora global ni `Math.random()`. Sólo admite `zod` y `pure-rand`, declarados en una lista blanca de fronteras. Ver [game engine](docs/03-architecture/game-engine.md).
- `src/components/game`: adaptador entre React y el motor. Recoge respuestas y despacha comandos; nunca evalúa una respuesta.
- `src/content`: frontera reservada para contenido como datos; se creará cuando exista contenido ejecutable autorizado. Las fixtures de desarrollo viven aisladas en `src/game/testing`.
- `src/server`: casos de uso autoritativos y adapters de persistencia.
- `src/lib`: utilidades y adapters compartidos explícitamente aprobados.
- `src/config`: validación tipada de ambiente público y server-only.
- `supabase`: configuración, migraciones y seed locales; hoy no define tablas de juego.
- `tests`: unit, component, integration, property y E2E.

ESLint y un `tsconfig` aislado del game core hacen cumplir estas fronteras. El navegador sigue siendo no confiable y el score oficial futuro deberá reconstruirse en servidor.

## Documentación

- [Entorno de desarrollo y operaciones locales](docs/08-engineering/development-environment.md)
- [Arquitectura del motor de juego](docs/03-architecture/game-engine.md)
- [Desarrollo sobre el motor: comandos, harness y extensión](docs/08-engineering/game-engine-development.md)
- [Índice y autoridad documental](docs/README.md)
- [Mapa de contexto para tareas](docs/08-engineering/context-map.md)
- [Flujo de desarrollo asistido](docs/08-engineering/ai-development-workflow.md)
- [Setup de agentes](docs/08-engineering/agent-setup.md)
- [Estrategia MCP](docs/08-engineering/mcp-strategy.md)
- [ADR-010: toolchain reproducible y Docker portable](docs/03-architecture/adr/ADR-010-reproducible-node-pnpm-container-toolchain.md)
- [ADR-011: núcleo funcional con función de transición](docs/03-architecture/adr/ADR-011-functional-core-transition-engine.md)
- [ADR-012: PRNG seeded y substreams](docs/03-architecture/adr/ADR-012-seeded-prng-and-substreams.md)
- [ADR-013: aritmética racional exacta](docs/03-architecture/adr/ADR-013-exact-rational-arithmetic.md)

Vercel continúa siendo la topología canónica prevista para producción; la imagen Docker es un artefacto portable y de paridad, no una decisión de proveedor alternativa. Ningún despliegue público está habilitado en esta base.

## Estado de la remediación matemática

La [ronda 2](docs/04-quality/targeted-post-reaudit-mathematics-remediation.md)
está DONE con tres `pnpm verify` consecutivos en verde. STAGE-08 sigue IN_PROGRESS;
el siguiente gate es Independent Mathematics Re-Audit Round 2. No constituye
sign-off provisional ni revisión humana. Estado completo en
[la etapa actual](docs/06-delivery/current-stage.md).
