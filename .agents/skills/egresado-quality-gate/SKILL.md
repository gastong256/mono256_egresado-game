---
name: egresado-quality-gate
description: Verificar un cambio terminado de codigo, contenido, documentacion o infraestructura agentica de Egresado con los checks definidos por el repositorio, diagnosticar fallos y reportar evidencia exacta. Usar antes de declarar completa una tarea, no como sustituto de implementarla.
---

# Quality gate de Egresado

1. Inspecciona `git status`, el diff y el tipo de cambio. Preserva fallos preexistentes y separalos de regresiones nuevas con evidencia.
2. Lee la [Definition of Done](../../../docs/06-delivery/definition-of-done.md), [testing strategy](../../../docs/04-quality/testing-strategy.md) y la fuente de la feature.
3. Descubre el package manager desde el lockfile y los comandos desde scripts/config del repositorio. No inventes `npm`, `pnpm` o nombres de scripts.
4. Ejecuta el conjunto minimo que cubre el riesgo y amplia ante fallos o cambios transversales.

## Gates disponibles antes del scaffold

Desde la raiz:

```bash
node scripts/validate-agent-workspace.mjs
node scripts/sync-master-spec.mjs --check
git diff --check
```

Valida ademas JSON u otros artefactos tocados con el parser real disponible.

## Gates despues del scaffold

Usa los scripts canonicos que materialicen install locked, lint, typecheck, unit/property, content validation, build y E2E relevante. Suma segun el cambio:

- engine/scoring/RNG: property tests, replay y golden seeds;
- contenido procedural: schema, solver/invariantes, simulacion de seeds y revision UI;
- API/DB: integration, idempotencia, migracion, indices y permisos/RLS;
- UI: viewport mobile/desktop, teclado, focus, reduced motion y errores de red;
- feria: E2E, carga, pending sync, fallback, runbook y version freeze;
- seguridad/privacidad: threat cases, secret/dependency scan y logs sin PII.

No instales tooling solo para hacer pasar un gate salvo que la tarea lo autorice. No corrijas problemas fuera de scope sin distinguirlos.

## Reporte

Lista cada comando y resultado, fallos con diagnostico, checks no ejecutados y motivo, y conclusion `pass`, `fail` o `partial`. `Partial` nunca equivale a “todo validado”.
