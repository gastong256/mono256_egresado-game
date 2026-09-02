# Etapa actual

Vista corta del estado de ejecución. El contrato completo y el protocolo de actualización están en el [roadmap](implementation-sequence.md).

---

## STAGE-07 — Invariante de egreso, fail-forward y recuperaciones

**Estado:** `READY` · **etapa actual**. No está iniciada ni implementada.

## Por qué está lista

Teacher Gate 1 fue ejecutado el 1 de septiembre de 2026 y cerró como `PASSED_WITH_REQUIRED_ADJUSTMENTS`. La [evidencia docente](teacher-gate-1/11-evidencia-docente-2026-09-01.md), el [acta](teacher-gate-1/09-acta.md) y la [integración de producto](teacher-gate-1/12-integracion-post-gate.md) distinguen respuesta original, interpretación y requisito futuro. Los ajustes bloqueantes ya están integrados o asignados a una etapa posterior.

## Baseline autoritativa post-TG1

- Toda run válida completada debe terminar en `GRADUATED`; el motor todavía no lo implementa.
- Recuperación significa fail-forward, no game over, repetición completa de año ni exclusión.
- El vocabulario concreto de recuperación sigue abierto y se calibra en esta etapa; TG1 no aportó palabras.
- La matemática mantiene un piso de prerrequisitos accesible desde aproximadamente 7.º en toda la carrera. El año académico expresa crecimiento narrativo y contextual, no una barrera curricular.
- `AcademicStage` y `DifficultyBand` son ejes independientes. Cada año puede contener `CORE`, `STANDARD` y `STRETCH`; el techo sube por estructura del razonamiento.
- Identidad de carrera y `FairScore` siguen separados. La política de desarrollo actual es `fair-score-dev-2@2.0.0-post-tg1-candidate`, 85/10/5 y `official: false`.
- La duración de 8–10 minutos es un objetivo UX de la carrera completa, no timeout, bonus ni criterio de desempate.

## Scope IN

- estado terminal `GRADUATED` y transición explícita;
- separación de desempeño y progresión;
- recuperaciones deterministas, comprimidas y convergentes;
- estructura oculta de materias pendientes y callbacks;
- lenguaje y feedback de recuperación;
- pruebas de propiedad de convergencia, replay y serialización.

## Scope OUT

- contenido de 1.º–5.º, enriquecimiento del acto, deportes/competencias e Hitos → STAGE-08;
- intentos, emisión autoritativa, personal best, tie-break, ranking y leaderboard → STAGE-09;
- congelar `fair-score-dev-2` como oficial → Teacher Gate 2 / FREEZE;
- cambiar score, catálogo, composer o inventario de contenido.

## Exit gate

¿Toda secuencia válida completa converge en `GRADUATED`, con consecuencias y recuperaciones deterministas pero sin callejones sin salida?

## Evidencia de entrada

- GATE-TG1: `PASSED_WITH_REQUIRED_ADJUSTMENTS`.
- STAGE-04 y STAGE-06: `DONE`.
- Auditoría post-Gate: 23.000 planes totales, incluidos 20.000 planes reales compuestos de 7.º; máximo perfecto 10.000 y spread 0 bajo `fair-score-dev-2`.
- Versiones sin cambio salvo la nueva identidad de ScorePolicy: engine `5.1.0`, ruleset `0.3.0-grade-7`, contenido `0.8.0-grade-7`, catálogo `grade-7-dev-4`, snapshot `6`, action log `4`.

## Última reconciliación

2 de septiembre de 2026, integración formal post-Teacher-Gate-1.
