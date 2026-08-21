# ADR-010 — Toolchain reproducible y artefacto contenedorizado portable

- Estado: Aceptado
- Fecha: 2026-08-20

## Contexto

La aplicacion web vive en el mismo repositorio que la documentacion y necesita un entorno reproducible para desarrollo local, CI y builds de produccion. La eleccion de runtime, package manager, ubicacion de la aplicacion y estrategia de imagen afecta scripts, lockfile, cache, pipelines, onboarding y despliegue.

ADR-001 fija Next.js/TypeScript como plataforma y ADR-002 fija un monolito modular con BFF. La topologia de produccion aceptada sigue siendo Next.js desplegado en Vercel, con PostgreSQL gestionado por Supabase.

## Decision

- Usar Node.js 24 LTS como major de runtime. El repositorio fija una version 24.x soportada y segura mediante sus archivos de toolchain; una actualizacion compatible de patch no requiere modificar este ADR.
- Usar pnpm como unico package manager y declarar su version en `package.json`. `pnpm-lock.yaml` es la fuente reproducible de resolucion de dependencias.
- Mantener una unica aplicacion Next.js en la raiz del repositorio. No introducir workspaces, monorepo, Turborepo ni una aplicacion anidada sin una decision posterior.
- Usar instalaciones con lockfile congelado en CI y en builds contenedorizados.
- Producir una imagen multi-stage basada en la salida standalone de Next.js como artefacto portable y verificable.
- Usar Compose para el workflow local contenedorizado y la paridad de entorno. El desarrollo nativo con pnpm sigue siendo el camino rapido local.
- Mantener Vercel como topologia canonica de despliegue. La imagen Docker no selecciona por si sola un proveedor alternativo ni reemplaza Vercel; cambiar esa topologia requiere una decision arquitectonica posterior.

## Consecuencias

### Positivas

- instalaciones y builds repetibles entre maquinas, CI y contenedores;
- una superficie de comandos unica para humanos y agentes;
- menor complejidad que un workspace o monorepo prematuro;
- artefacto portable para pruebas de paridad y una eventual alternativa de hosting;
- separacion explicita entre empaquetado contenedorizado y proveedor de produccion.

### Negativas

- Node.js y pnpm deben mantenerse coordinados en metadata, CI, Docker y documentacion;
- el workflow contenedorizado agrega tiempo de build y mantenimiento adicional al camino nativo;
- la salida standalone debe verificarse despues de upgrades relevantes de Next.js;
- cambiar package manager, major de runtime o topologia canonica exige una migracion transversal.

## Alternativas descartadas

- Crear una aplicacion o workspace anidado: agrega rutas, tooling y limites de paquete sin necesidad para un unico producto.
- Mantener instalaciones no congeladas: permite drift entre desarrollo, CI e imagen.
- Tratar Docker como reemplazo implicito de Vercel: cambiaría la topologia aceptada sin evaluar operacion, observabilidad ni migracion.
