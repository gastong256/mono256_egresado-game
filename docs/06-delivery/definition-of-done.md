# Definition of Done

## Feature de gameplay

- comportamiento documentado;
- responsive mobile/desktop;
- keyboard path si aplica;
- tests del engine;
- analytics event si corresponde;
- feedback de error definido;
- no introduce dependencia de red dentro del loop sin ADR.

## Challenge/content

- schema válido;
- objetivo comprensible;
- solución verificada;
- unidades correctas;
- edge cases revisados;
- feedback explica consecuencia;
- dificultad etiquetada;
- math review;
- procedural invariants pasan;
- no contiene PII/marca/tema sensible no aprobado.

## API

- schema request/response;
- validación server-side;
- error codes;
- auth/session policy;
- rate limit considerado;
- integration test;
- logs sin secretos.

## DB migration

- migration versionada;
- rollback/forward plan;
- índices revisados;
- RLS/permisos revisados si aplica;
- staging ejecutado.

## Release feria

- CI verde;
- golden seeds verdes;
- E2E mobile/desktop;
- replay consistente;
- runbook probado;
- fallback probado;
- content/ruleset version congelados.

## Candidata a demo docente de 7.º

Cierra la Fase A del [ciclo de entrega real](../00-product/real-delivery-lifecycle.md), antes del Teacher Gate 1.

- sistema de diseño aprobado aplicado al slice real;
- modelo de carrera migrado, sin rastros de las stats visibles viejas;
- variación determinista suficiente para que una segunda run se note;
- ninguna variante inválida en el pool de la demo;
- el recorrido completo de 7.º termina;
- el resumen de año funciona;
- la propuesta de score se puede demostrar;
- móvil, teclado y accesibilidad en verde;
- material de revisión docente listo, con la lista explícita de decisiones abiertas.

## Candidata a feria

Cierra la Fase F, antes del release público.

- todos los años completos;
- catálogo oficial de variantes versionado y validado;
- score de competencia aprobado y congelado;
- el servidor calcula el resultado oficial;
- leaderboard con personal best transaccionalmente correcto;
- el replay verifica los envíos oficiales;
- límites de tasa y herramientas de moderación existentes;
- hardening de carga, red y móvil aprobado;
- runbook y plan de fallback ensayados;
- versiones de contenido, reglas y score congeladas.
