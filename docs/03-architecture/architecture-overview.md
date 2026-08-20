# Arquitectura general

## Estilo

**Modular monolith web + Backend for Frontend**, con motor de juego compartido como paquete TypeScript puro.

## Stack baseline

- Next.js 16.x / App Router.
- React.
- TypeScript estricto.
- Tailwind CSS.
- Zustand para estado interactivo local.
- Zod para schemas/validación en límites.
- PostgreSQL gestionado por Supabase.
- Vercel para web y Route Handlers/Functions.
- Vitest para unidad/property tests.
- Playwright para E2E.
- Sentry u observabilidad equivalente cuando el MVP público lo justifique.

La versión exacta se fija por lockfile. Las actualizaciones de seguridad no requieren ADR salvo que cambien comportamiento/arquitectura.

## Context diagram

```mermaid
flowchart LR
    U[Jugador] --> W[Egresado Web]
    O[Organizador] --> W
    P[Pantalla pública] --> W
    W --> API[Next.js BFF / Route Handlers]
    API --> DB[(PostgreSQL / Supabase)]
    API --> OBS[Logs / Error tracking]
    DB -. opcional .-> RT[Supabase Realtime]
    RT -. leaderboard .-> P
```

## Container view

```mermaid
flowchart TD
    subgraph Browser
      UI[React UI]
      STORE[Zustand / Session]
      ENGINE[Game Engine TS]
      CACHE[Checkpoint local]
      UI --> ENGINE
      ENGINE --> STORE
      STORE --> CACHE
    end

    subgraph Vercel
      WEB[Next.js]
      ROUTES[Route Handlers]
      VERIFY[Run verifier / scoring]
      WEB --> ROUTES
      ROUTES --> VERIFY
    end

    DB[(Supabase Postgres)]
    Browser --> WEB
    ROUTES --> DB
    VERIFY --> DB
```

## Principio de ejecución

El juego activo se ejecuta localmente para minimizar latencia y dependencia de red. El servidor:
- crea runs oficiales;
- proporciona configuración/seed;
- valida finalización;
- reproduce score;
- persiste resultados;
- sirve ranking.

## Fronteras

### `game-core`
Sin React, DOM, fetch ni DB.

### `game-content`
Definiciones de templates, pools y versiones.

### `game-ui`
Componentes y adapters de interacción.

### `server`
Casos de uso autoritativos y persistencia.

## Topología de despliegue

- CDN/edge para assets estáticos.
- Next.js/Vercel Functions para endpoints.
- Región de funciones cercana al Postgres cuando se configure producción.
- Postgres como source of truth de runs oficiales.

## Escalabilidad

Para feria escolar, esta arquitectura tiene margen amplio. No introducir microservicios, colas o Kubernetes sin evidencia de necesidad.

Posibles extracciones futuras:
- servicio de generación/análisis matemático intensivo;
- worker de analytics;
- content service/editor;
- leaderboard especializado si escala masivamente.
