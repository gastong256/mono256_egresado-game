# Verificación del discovery

Conclusión: **PASS del alcance documental TASK-01**. Verificación de aplicación **selectiva**, sin afirmar `pnpm verify` completo ni readiness de un release nuevo. Sólo se añadieron artefactos bajo `.tmp/rc3-branding/task-01-discovery/`; no se modificaron archivos versionados del producto, lockfile, configuración, contenido ni DB.

## Comandos ejecutados

Todos desde la raíz del repositorio con Node 24.19.0 y pnpm 11.22.0. Las evidencias son locales, no intentos de producción.

| Comando | Resultado y alcance |
|---|---|
| `git status --short`; `git branch --show-current`; `git rev-parse HEAD` | Baseline limpio en main, HEAD cfcde1e1fe0f52d2554134efa9c4f28d72c8b833. Al cierre sólo `.tmp/` sin tracking; listado expandido restringido al handoff. |
| `pnpm toolchain:check` | PASS; versiones de Node/pnpm alineadas. |
| `pnpm install --frozen-lockfile --offline --ignore-scripts` | PASS, Already up to date. Instalación congelada offline con scripts desactivados; no equivale a ejecutar scripts de instalación. Lockfile intacto. |
| `pnpm exec vite-node --config .tmp/rc3-branding/task-01-discovery/evidence/discovery.config.mjs .tmp/rc3-branding/task-01-discovery/evidence/extract.ts` | PASS: 42 Templates materializadas, 1.031 IDs aprobados registrados, 128/128 runs egresadas sin rechazo; 38 Templates públicas, 44 storylets y cuatro raros observados. [Log](evidence/extraction.log), [catálogo](evidence/catalog.json), [witnesses](evidence/reachability.json). |
| `pnpm design:check` | PASS: 79 archivos, cinco reglas, cero hallazgos; 26 pigmentos, 50 roles, 41 pares de contraste en verde. No se añadieron estilos de producto. |
| `node scripts/validate-agent-workspace.mjs` | PASS: seis skills, 256 archivos documentados, links/JSON válidos. El gate del repo no sustituye la validación adicional de esta carpeta temporal. |
| `node scripts/sync-master-spec.mjs --check` | PASS: master coincide con 136 fuentes autoritativas. No se regeneró ni editó. |
| `pnpm release:check` | PASS: dependency gate, Next 16.3.5. No valida deployment remoto. |
| `pnpm exec vite-node --config .tmp/rc3-branding/task-01-discovery/evidence/discovery.config.mjs scripts/release/verify.ts` | PASS: 57 comprobaciones en verde. [Log](evidence/release-verification.log). Mismo script del verificador, ejecutado con configuración de inspección sin carga de `.env`; **no se presenta como ejecución literal de `pnpm release:verify`**. Sin update-lock ni cambios de huellas. |
| `python3 .tmp/rc3-branding/task-01-discovery/evidence/validate-handoff.py` | PASS: entregables, JSON, enlaces locales, fuentes concretas, conteos, cobertura Template→asset, prompts, prioridades y confinamiento de cambios. [Resultado](evidence/handoff-validation.json). |
| `git diff --check`; `git diff --stat`; `git diff`; `git diff --cached`; `git status --short --untracked-files=all` | Sin errores de whitespace ni cambios tracked/staged; nuevos archivos únicamente en la carpeta autorizada. Los archivos nuevos también se inspeccionaron y validaron porque `git diff` no los incluye. |

`discovery.config.mjs` desactiva carga de entorno (`envDir: false`) y usa aliases locales para `@` y el stub de `server-only` existente de tests. No reemplaza configuración del producto. Los scripts `build-*.py` escriben tablas y prompts en esta carpeta a partir de evidencia extraída y briefs curatoriales; no son generadores de contenido matemático ni de imágenes.

## Gate de entrega

| Requisito del pedido | Evidencia |
|---|---|
| Documentación, roadmap y freeze entendidos | `00`, `08`, 39 documentos con secciones declaradas. |
| Código contrastado y seis años cubiertos | `01`, catálogo y witnesses por seed. |
| Family/Template/Variant separados | 22 / 42 / 1.031; agrupación visual independiente. |
| UI y copy inventariados | `02`, `03`; 36 unidades UI, once interaction kinds, 36 registros copy, seis clases. |
| Assets existentes y candidatos completos | `11`, `04`; ocho binarios y primitivas de código; 36 contratos candidatos. |
| Reutilización y P0/P1/P2 | Mapping de las 42 Templates, diez Repasos sin arte extra; 8/16/12. |
| Tres direcciones y recomendación | `05`; Trayectoria en papel, Lugares que cuentan, Sello de recorrido. |
| Master style y prompts accionables | `asset-generation-prompts`; 36 fichas con método y campos; waves, pilotos y nombres exactos. |
| TASK-02→06 y guardrails | `06`, `07`; ingesta y gates por tarea, H01–H13. |
| Handoff navegable y reporte | `README`, `08`, `final-report.txt`, enlaces locales validados. |
| Producto inalterado | Diff tracked/staged vacío; untracked sólo bajo el destino autorizado. |

## Checks omitidos y límites

- `pnpm verify` completo, lint/typecheck/coverage/build/Playwright: no hubo cambio en código de aplicación. No se atribuye a este relevamiento el resultado de suites históricas.
- QA visual de runtime, mobile real, teclado, VoiceOver/NVDA, red lenta y CLS: pendientes de implementación. Se inspeccionaron ramas y estilos; una captura histórica del colectivo se vio como referencia, no como prueba del estado actual.
- Validación exhaustiva de 1.031 variantes y simulación profunda de balance: no es el objetivo. Se materializó una variante aprobada por Template y se probó alcanzabilidad, sin aprobar matemática nueva.
- DB/reset/lint/types, Supabase, Docker, carga y proveedores: fuera de alcance y sin operaciones. No se leyeron `.env` ni credenciales.
- Producción y seed de feria: no verificadas remotamente. El usuario informa un deployment activo; docs locales conservan GO pendiente. Ninguna de esas procedencias se reemplazó por una inferencia.
- Generación de imágenes, implementación de UI/copy, commits, tags, push y deploy: no ejecutados por el scope explícito de TASK-01.

Las hipótesis visuales, posibles casos de empate y decisiones editoriales están marcadas como tales. No se convirtió una observación estática en bug confirmado ni una recomendación estética en decisión aceptada.
