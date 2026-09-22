# Scope y baseline

Fecha del relevamiento: 2026-09-22 UTC. Encargo: **TASK-01 — Discovery visual + inventario + asset plan**, futuro sprint RC3. Alcance B01, B02, B03, B14, briefs conceptuales B04/B05/B06 y definición B15. Ésta es documentación local de propuesta, no un release RC3 ni aprobación de implementación.

| Baseline | Valor verificado |
|---|---|
| Branch | `main` |
| HEAD | `cfcde1e1fe0f52d2554134efa9c4f28d72c8b833` |
| Inicio | Worktree limpio |
| Release local | `Egresado Fair Edition v1`, `1.0.0-rc.2` en package y manifiesto |
| Huella declarada RC.2 | `0ea3c1de866aa0a25fb9e236baa122e935fcd37280c443ef4d42011680379cd0` |
| Runtime | Node 24.19.0, pnpm 11.22.0, Next 16.3.5, Tailwind 4.3.3; lockfile v9 |
| Producción externa | El usuario informa deployment funcional. Este checkout documenta STAGE-10 en curso, GO pendiente. No se inspeccionó proveedor ni deployment; se conservan ambas procedencias. |
| Salida | Sólo `.tmp/rc3-branding/task-01-discovery/`; `.tmp` no está ignorado en este checkout |

## Lectura y método

Se consultaron contexto/autoridad, roadmap y cierres, ADRs aplicables, sistema de diseño, motor, registros, catálogos, componentes, rutas, assets y tests. Las secciones concretas revisadas y las discrepancias están en `08-source-map.md`; no se afirma haber leído cada línea del master generado ni de todos los catálogos históricos.

La evidencia combina lectura estática con extracción ejecutable sin red ni carga de archivos de entorno: se importó `createFullCareerDependencies`, se materializó una variante aprobada por cada una de las 42 Templates y se conservaron los 1.031 IDs aprobados; después se ejecutaron 128 carreras sintéticas en modo fair con seeds locales `rc3-discovery-0…127`. No representan intentos oficiales ni consultan la seed real de una competencia. Sus witnesses prueban alcanzabilidad de todas las Templates públicas, no cobertura exhaustiva de matemática, feedback o variantes.

Las referencias visuales son capturas históricas del sistema. No se levantó Next ni se navegó producción: los hallazgos de densidad/layout son hipótesis sustentadas por ramas de render, pendientes de QA visual durante implementación. No se inspeccionaron `.env`, secretos, participantes, sesiones reales ni archivos privados ignorados.

## Roadmap entendido y límite RC3

| Etapa | Aporte que RC3 debe preservar | Estado en checkout |
|---|---|---|
| STAGE-00 | Auditoría funcional y brechas | DONE |
| STAGE-01 | Descriptor, seed y compatibilidad de runs | DONE |
| STAGE-02 | Family → Template → Variant | DONE |
| STAGE-03 | Generación, validación y catálogo aprobado | DONE |
| STAGE-04 | Slice amplio de 7.º; distinto del año compuesto | DONE |
| STAGE-05 | Dificultad estructural y Run Composer | DONE |
| STAGE-06 | ScorePolicy; separación de carrera y competencia | DONE |
| STAGE-07 | Egreso, recuperación comprimida, fail-forward | DONE |
| STAGE-08 | Contenido de seis años, composición de 9 beats, cierre | DONE; pacing humano no acreditado |
| STAGE-09 | Identificación, emisión, replay, mejor intento, ranking | DONE |
| Production v1 Freeze | Manifiesto, catálogos, tupla, reglas y huellas congeladas | DONE; ADR-027 |
| RC | `1.0.0-rc.2`, score oficial sin recalibrar | Declarado en código; controles disponibles |
| STAGE-10A | Adaptación de despliegue y handoff | DONE |
| STAGE-10 | Proveedor, ensayos y GO | IN_PROGRESS en docs; usuario informa deployment posterior |

TASK-01 no completa STAGE-10 ni cambia el roadmap. Su scope es explícito y acotado aunque la etapa de hardening excluya nuevas features. Countdown es sólo una oportunidad de presentación para una tarea futura, no una nueva autoridad temporal.

## Invariantes congeladas

- Motor `10.0.0`, log `7`, snapshot `8`; ruleset `1.0.0-full-career`, contenido `5.5.0-grade-5`, catálogo `grade-5-dev-6`.
- FairScore `fair-score-v1@1.0.0-fair-edition-v1`, perfecto 10.000; política 85/10/5, sin recalibrar ni reinterpretar oportunidad ausente. Ruleset `official: false` no vuelve el score no oficial: son capas distintas.
- Nueve beats ordinarios, seis anchors y tres secundarios; una o dos decisiones por año. Los repasos son condicionales y quedan fuera del score. La UI no recompone plan ni decide egreso.
- Ranking: mejor intento verificado, FairScore → Prestige → puesto compartido; sin velocidad. Prestige ofrecido 0 y no visible como columna. Tres puestos pueden contener más de tres personas.
- Cliente local-first después de emisión; servidor reproduce acciones y decide score oficial. Assets no se convierten en dependencia de red para poder responder.
- Privacidad vigente: ADR-026, alias público y campos privados de validación; DNI derivado, no completo en persistencia. No alterar reingreso, aviso, retención, sesión ni permisos.
- No cambios a DB, migraciones, APIs, seguridad, lifecycle, release infrastructure ni deployment.

## Supuestos abiertos y decisiones de este handoff

“Trayectoria en papel”, agrupaciones de assets, prioridad, tamaño recomendado y waves son **propuestas editoriales**, no nuevas políticas del motor. El catálogo de candidatos no implica integrar todas las imágenes. Se conserva el presupuesto inicial de 6–9 raster y se sugiere un primer pack de 8 o menos.

No se corrigen contradicciones en `docs/` porque el encargo limita la salida a `.tmp`. Se registran en `07`/`08` para que la próxima tarea autorizada reconcilie la fuente canónica. No se creó ADR, componente, imagen, dependencia, commit, tag, push ni deployment.
