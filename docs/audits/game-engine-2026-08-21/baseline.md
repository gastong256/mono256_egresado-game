# Baseline — auditoría del motor de juego

Estado del repositorio **antes** de cualquier remediación. Capturado el 2026-08-21.

## Repositorio

| Dato | Valor |
|---|---|
| HEAD | `9f9808fca76f093625dca2e73f3c951b5153bd7d` |
| Mensaje | `feat(engine): deterministic Egresado game engine and integration foundation` |
| Working tree | limpio |
| Instrucciones de agente | `AGENTS.md`, `docs/AGENTS.md`, 5 skills en `.agents/skills/`; sin `CLAUDE.md` |

## Toolchain

| Herramienta | Versión |
|---|---|
| Node.js | 24.19.0 |
| pnpm | 11.22.0 |
| Next.js | 16.3.1 |
| React | 19.2.8 |
| TypeScript | 6.0.2 |
| Vitest | 4.1.11 |
| fast-check | 4.9.0 |
| pure-rand | 8.4.2 |
| Zod | 4.4.3 |
| Playwright | 1.62.1 |
| ESLint | 9.39.5 |
| vite-node | 6.0.0 |

Dependencias de producción: 7 paquetes (`@supabase/supabase-js`, `next`, `pure-rand`, `react`, `react-dom`, `server-only`, `zod`).

## Tamaño del motor

| Área | Archivos | LOC |
|---|---:|---:|
| `src/game` | 53 | ~8 950 |
| `src/components/game` | 10 | ~1 545 |
| `tests` | 17 | ~3 780 |

## Resultado de los gates canónicos

Ejecutados exactamente como los define el repositorio, sin ajustes previos.

| Comando | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | pass |
| `pnpm format:check` | pass |
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm toolchain:check` | pass |
| `pnpm peers check` | pass |
| `pnpm security:audit` | pass — sin vulnerabilidades conocidas |
| `pnpm secrets:check` | pass |
| `pnpm test:coverage` | pass — **232 tests / 17 archivos** |
| `pnpm game:validate-content` | pass — 0 errores, 0 warnings |
| `pnpm game:simulate` | pass — 500 runs, 0 hallazgos, 282 ms |
| `pnpm build` | pass |
| `pnpm release:check` | **fail (esperado)** — bloqueo documentado de Next.js `16.3.2` |

### Cobertura

| Métrica | Valor | Umbral |
|---|---:|---:|
| Statements | 89.20 % | 85 % |
| Branches | 78.68 % | 75 % |
| Functions | 94.26 % | 85 % |
| Lines | 88.94 % | 85 % |

## Señales de deuda declarada

| Señal | Conteo |
|---|---:|
| `TODO` / `FIXME` / `HACK` / `XXX` en `src/` y `tests/` | 0 |
| Tests skipped | 0 |
| Usos de `any` en `src/` | 0 |
| Ciclos de import en `src/` (incluyendo type-only) | 0 |
| Exports nunca referenciados fuera de su módulo | 55 (mayoría legítimos: props de JSX, tipos generados, schemas) |

## Lectura del baseline

El baseline está **verde**. Eso no significa ausencia de defectos: significa que los defectos que existan no son detectables por los gates actuales. La auditoría se orientó, por lo tanto, a lo que los gates **no** miran: separadores del direccionamiento de RNG, correlación entre fase y payload en el estado restaurado, enlace entre versión y comportamiento, validación real de identificadores, límites numéricos y determinismo entre runtimes.

Los comandos y artefactos de diagnóstico usados están documentados en [findings.md](findings.md).
