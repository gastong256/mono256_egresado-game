---
name: egresado-quality-gate
description: Verificar un cambio terminado de codigo, contenido, documentacion o infraestructura agentica de Egresado con los checks definidos por el repositorio, diagnosticar fallos y reportar evidencia exacta. Usar antes de declarar completa una tarea, no como sustituto de implementarla.
---

# Quality gate de Egresado

1. Inspecciona `git status`, el diff y el tipo de cambio. Preserva fallos preexistentes y separalos de regresiones nuevas con evidencia.
2. Lee la [Definition of Done](../../../docs/06-delivery/definition-of-done.md), [testing strategy](../../../docs/04-quality/testing-strategy.md) y la fuente de la feature.
3. Confirma el runtime/package manager fijados con `pnpm toolchain:check` y un install congelado desde `pnpm-lock.yaml`. Usa los scripts de `package.json`; no inventes comandos ni sustituyas el package manager.
4. Ejecuta el conjunto minimo que cubre el riesgo y amplia ante fallos o cambios transversales.

## Gate canonico

Desde la raiz:

```bash
pnpm install --frozen-lockfile
pnpm verify
git diff --check
```

`pnpm verify` cubre infraestructura agentica y master, formato, lint/fronteras, TypeScript, coverage, validacion de contenido, simulacion determinista de 200 runs, build y smoke E2E. No reemplaza gates que requieren Supabase/Docker ni una simulacion profunda de balance.

## Gates selectivos

Suma segun el cambio:

- engine/scoring/RNG: `pnpm test`, `pnpm game:simulate -- --runs=2000 --verify=10`, los golden replays de `tests/unit/engine-golden.test.ts` y los fingerprints de `tests/unit/engine-fingerprint.test.ts`. Un cambio de salida determinista exige subir `ENGINE_VERSION`, version de ruleset o de contenido segun la tabla de [game engine](../../../docs/03-architecture/game-engine.md#compatibilidad-y-versionado); regenerar goldens o fingerprints sin ese bump es un fallo, no un ajuste;
- replay autoritativo: `tests/integration/server-run-validation.test.ts` cubre la frontera server-only de ADR-004. Un cambio que permita al cliente influir en score o perfil es un bloqueo;
- contenido procedural: `pnpm game:validate-content -- --seeds=300 --stats`, invariantes del generador, distribucion de opciones y revision UI;
- API/DB: `pnpm db:start`, `pnpm db:reset`, `pnpm db:lint`, `pnpm db:types`, integration, idempotencia, migracion, indices y permisos/RLS; termina con `pnpm db:stop`;
- UI: viewport mobile/desktop, teclado, focus, reduced motion y errores de red;
- contenedores/deploy: `pnpm docker:build`, health check del runner no-root, `pnpm docker:up`, conectividad app→Supabase y `pnpm docker:down`;
- feria: E2E, carga, pending sync, fallback, runbook y version freeze;
- seguridad/privacidad: `pnpm secrets:check`, `pnpm security:audit`, threat cases y logs sin PII;
- release publico: `pnpm release:check`; si falla, la conclusion de release es `fail` aunque los checks de desarrollo pasen;
- skills: valida cada `SKILL.md` cambiado con el `quick_validate.py` oficial disponible en el entorno.

Para un cambio pequeno podes ejecutar primero `pnpm format:check`, `pnpm lint`, `pnpm typecheck` o el archivo de test relevante, pero el reporte debe distinguir esa evidencia del gate completo. Valida JSON/YAML/TOML u otros artefactos tocados con su parser real cuando este disponible.

No instales tooling solo para hacer pasar un gate salvo que la tarea lo autorice. No corrijas problemas fuera de scope sin distinguirlos.

## Reporte

Lista cada comando y resultado, fallos con diagnostico, checks no ejecutados y motivo, y conclusion `pass`, `fail` o `partial`. `Partial` nunca equivale a “todo validado”.
