---
name: egresado-implementation
description: Implementar o modificar una feature acotada de Egresado siguiendo contexto, plan, codigo, tests, documentacion y review. Usar para trabajo de aplicacion ya autorizado; no usar para decidir nuevas reglas de producto ni para scaffolding no solicitado.
---

# Implementacion de Egresado

Segui [el workflow de desarrollo](../../../docs/08-engineering/ai-development-workflow.md).

1. Delimita el resultado solicitado y el gate de producto. Usa [el context map](../../../docs/08-engineering/context-map.md) antes de disenar.
2. Activa el Node declarado en `.node-version`, usa el pnpm fijado por `packageManager` y conserva `pnpm-lock.yaml`; nunca sustituyas el package manager ni hagas una instalacion no congelada sin una actualizacion de dependencias autorizada. Confirma alineacion con `pnpm toolchain:check`.
3. Inspecciona codigo, tests, consumidores, schemas, lockfile y scripts existentes. Preserva cambios ajenos.
4. Para Next.js, lee la guia relevante en `node_modules/next/dist/docs/` cuando esa ruta exista; si no, usa la documentacion oficial de la version instalada. Para otra libreria, verifica la API instalada.
5. Expone cualquier decision faltante. No fijes scoring, seed strategy, identidad/retencion, contrato persistente o frontera arquitectonica dentro del feature.
6. Planifica e implementa el cambio coherente mas pequeno respetando las fronteras ejecutables:
   - `src/game/**` es TypeScript puro, determinista y sin DOM, red, reloj global, RNG global, `process`, React, Next ni Supabase. Solo admite `zod` y `pure-rand`, declarados en la lista blanca de fronteras. Las reglas viven en `transition`; el estado persistido es JSON-compatible y el contenido es data, nunca callbacks. Antes de tocar el motor lee [game engine](../../../docs/03-architecture/game-engine.md) y [desarrollo del motor](../../../docs/08-engineering/game-engine-development.md);
   - `src/content/**` consume tipos del juego y no decide UI o persistencia;
   - `src/components/**` no accede a servidor o Supabase;
   - `src/app/**` orquesta UI/BFF pero no importa adaptadores de persistencia;
   - `src/server/**` contiene casos de uso y persistencia autoritativa;
   - Supabase solo entra por los adaptadores aprobados y los secretos solo por modulos `server-only`.
7. Agrega tests proporcionales: unit/property para core y contenido; integration para API/DB; componentes para UI aislada; Playwright/accesibilidad para flujos visibles. Un cambio en el motor suma property tests de determinismo/replay y, si cambia la salida determinista, golden replays regenerados junto con el bump de version correspondiente.
8. Ejecuta `pnpm format`, luego los scripts canonicos y gates de la [Definition of Done](../../../docs/06-delivery/definition-of-done.md). Usa `pnpm verify` antes de entregar un cambio transversal y diagnostica fallos antes de concluir.
9. Actualiza requisitos, trazabilidad, docs o ADR solo cuando el comportamiento/decision cambie. Si cambias fuentes consolidadas, sincroniza el master con el comando mantenido del repositorio.
10. Revisa el diff por determinismo, trust boundaries, privacidad de menores, replay/versionado, red dentro del loop y dependencias nuevas. Ejecuta `pnpm release:check` solo al evaluar desplegabilidad publica; un fallo por el piso de seguridad documentado de Next.js es un bloqueo real, no un gate para omitir.

Entrega archivos cambiados, conducta obtenida, decisiones documentales, comandos/resultados y cualquier gate omitido. No declares una verificacion que no ejecutaste.
