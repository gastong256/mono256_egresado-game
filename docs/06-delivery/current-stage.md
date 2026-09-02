# Etapa actual

Vista corta del estado de ejecución. El contrato completo y el protocolo de actualización están en el [roadmap](implementation-sequence.md).

---

## STAGE-08 — Contenido incremental de 1.º a 5.º

**Estado:** `READY` · **etapa actual**. No está iniciada ni implementada.

## Por qué está lista

STAGE-07 cerró el 2 de septiembre de 2026. El egreso dejó de ser una promesa del roadmap: es un estado terminal que toda run válida completada alcanza, y la recuperación converge **por construcción** —sólo un beat ordinario deja algo por cerrar, y un repaso siempre cierra lo que el año debía—, no por una configuración que alguien podría poner mal. La decisión está en [ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md).

La consecuencia para esta etapa es concreta: **ningún año nuevo tiene que inventar su sistema de fracaso y promoción.** Declara sus plantillas, su elegibilidad por etapa y, si corresponde, su contenido de repaso. La carrera sintética de seis años (`src/game/testing/fixtures/six-stage-progression.ts`) prueba que `7.º · 1.º · 2.º · 3.º · 4.º · 5.º` se juega entera con el mismo código y sin un solo caso especial por año.

## Baseline autoritativa

- Toda run válida completada termina en `GRADUATED`. **Implementado y medido:** 20.000 carreras de seis años, 20.000 egresadas, 0 hallazgos.
- El techo de recuperación es un repaso por año. En 20.000 carreras, el peor caso fueron exactamente 6 — y no existe una que juegue 19 beats.
- Un repaso **no** puntúa: ni numerador ni denominador. La evidencia competitiva sigue siendo el beat ordinario que salió mal.
- Recuperación significa fail-forward, no game over, repetición completa de año ni exclusión. No hay sistema de vidas.
- El vocabulario de recuperación sigue `OPEN` ([pregunta 53](../07-reference/open-questions.md)); «repaso» y «quedó algo dando vueltas» son copy candidato validable en TG2, no arquitectura.
- Los umbrales de disparo y el techo por año siguen `TEACHER_GATE` ([pregunta 54](../07-reference/open-questions.md)); `recovery-dev-1` es candidata y `official: false`.
- La matemática mantiene un piso de prerrequisitos accesible desde aproximadamente 7.º en toda la carrera. El año académico expresa crecimiento narrativo y contextual, no una barrera curricular. Vale también para el contenido de repaso.
- `AcademicStage` y `DifficultyBand` son ejes independientes. Cada año puede contener `CORE`, `STANDARD` y `STRETCH`; el techo sube por estructura del razonamiento.
- Identidad de carrera y `FairScore` siguen separados. La política de desarrollo actual es `fair-score-dev-2@2.0.0-post-tg1-candidate`, 85/10/5 y `official: false`.
- La duración de 8–10 minutos es un objetivo UX de la carrera completa, no timeout, bonus ni criterio de desempate. La estructura sobre la que se va a calibrar ya tiene techo conocido: 12 beats ordinarios y hasta 18 con repasos.

## Scope IN

- por año: contenido, plantillas, variantes validadas, storylets y hito de etapa;
- contenido de repaso donde una plantilla tenga un paso intermedio aislable —`none` es una respuesta válida;
- matriz de contenido previa a la implementación;
- la auditoría de escalabilidad obligatoria al terminar 1.º;
- enriquecimiento narrativo del acto del 25 de Mayo (TG1-13);
- Hitos, si se diseñan como reconocimiento determinista y narrativo.

## Orden obligatorio

```text
1.º → auditoría de escalabilidad → 2.º → 3.º → 4.º → 5.º
```

**1.º es la prueba crítica.** Al terminarlo hay que contestar: *¿qué fundaciones nuevas tuvimos que inventar?* Si la respuesta incluye otro modelo de carrera, otro motor de score, otra gramática de progreso o otra paleta, se revisa antes de seguir.

## Scope OUT

- rediseño visual, otro Career Model, otro motor de scoring, otra gramática de progreso → no son alcance de contenido;
- intentos, emisión autoritativa, personal best, tie-break, ranking y leaderboard → STAGE-09;
- congelar `fair-score-dev-2` o `recovery-dev-1` como oficiales → Teacher Gate 2 / FREEZE;
- rediseñar el compositor, el modelo de dificultad o la progresión que STAGE-07 acaba de cerrar.

## Exit gate

¿Una run completa recorre `7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESADO` con contenido real?

## Evidencia de entrada

- STAGE-07: `DONE`. GATE-TG1: `PASSED_WITH_REQUIRED_ADJUSTMENTS`.
- 20.000 carreras sintéticas de seis años, 20.000 egresadas, 0 hallazgos; peor caso 6 repasos.
- Espacio de estados de la progresión recorrido entero: un único estado terminal alcanzable, sin ciclos ni callejones.
- 898 tests en 50 archivos y 70 E2E, en verde.
- Versiones: engine `6.0.0`, snapshot `7`, action log `4`, ruleset `0.4.0-grade-7`, contenido `0.9.0-grade-7`, catálogo `grade-7-dev-5`.
- Huellas: motor `a0ed168d`, ruleset `5b9b0bc5`, contenido `dbaf5094`.

## Última reconciliación

2 de septiembre de 2026, cierre de STAGE-07.
