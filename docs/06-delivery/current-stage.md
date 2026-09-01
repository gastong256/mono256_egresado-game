# Etapa actual

Vista corta del estado de ejecución. El detalle completo, los contratos de todas las etapas y el protocolo de actualización están en el [roadmap de implementación](implementation-sequence.md), que es la autoridad.

---

## GATE-TG1 — Teacher Gate 1

**Estado:** `TEACHER_GATE`, pendiente. Es el hito actual, y **no es una etapa de ingeniería**: lo que falta es una decisión externa del Departamento de Matemática, no código.

## Por qué es el hito actual

Sus dos dependencias están `DONE`. STAGE-04 dejó una Demo Candidate jugable de 7.º; STAGE-06 dejó el score competitivo implementado, medido y **sin un solo coeficiente cerrado**. Ver [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md), [ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md) y [ADR-023](../03-architecture/adr/ADR-023-competitive-score-policy.md).

Lo que sigue no es implementar más: es que alguien que enseña matemática mire lo que hay y decida. Seguir construyendo sobre calibraciones que ningún docente aprobó es cómo un proyecto llega a una feria con un ranking que no puede defender.

## Qué se lleva al Gate

- **La Demo Candidate de 7.º**: siete plantillas, seis interacciones, seis dominios y las cuatro dimensiones de carrera, en un recorrido jugable.
- **La partida normal compuesta**: uno o dos beats por año, para que la diferencia entre demostración y partida se vea en pantalla.
- **La clasificación de dificultad candidata** de las siete plantillas, con las cuatro divergencias respecto del nivel autorado que son preguntas concretas: ¿el mural es realmente más liviano que el colectivo? ¿El stand y el trabajo grupal son `STRETCH` para 7.º?
- **La calibración competitiva candidata**: 80/15/5, los cuatro escalones de calidad, las recompensas por dificultad y los topes, con la evidencia de qué hacen sobre 23.000 planes.
- **La tabla de doble conteo**: qué componente lee cada plantilla y por qué, incluida la decisión de que ninguna plantilla de producción aporte aura competitiva.

## Preguntas que el Gate tiene que responder

- [ ] Nivel matemático y terminología de las siete situaciones.
- [ ] Duración objetivo de una run y densidad de la demostración.
- [ ] Ponderación del score competitivo: ¿80/15/5, u otra?
- [ ] Calibración de los cuatro escalones de calidad.
- [ ] Bandas y costos de dificultad ([pregunta 44](../07-reference/open-questions.md)).
- [ ] Política de intentos y de empate.
- [ ] Lenguaje de recuperación y de egreso.
- [ ] Si el acto del 25 de Mayo entra a producción ([pregunta 42](../07-reference/open-questions.md)).

## Criterios de aceptación

- [ ] Feedback registrado ítem por ítem.
- [ ] Cada comentario clasificado como aceptado, rechazado o diferido.
- [ ] Las decisiones cerradas actualizan el [registro de decisiones](../07-reference/decision-register.md).
- [ ] Las que siguen abiertas quedan en [preguntas abiertas](../07-reference/open-questions.md).
- [ ] La ScorePolicy candidata fue revisada por los docentes.
- [ ] **No se presentó la validación docente como playtest con estudiantes.**
- [ ] Este documento y el [roadmap](implementation-sequence.md) actualizados antes de empezar STAGE-07.

## El pack está preparado

Todo el material para dar la reunión está en [el pack del Teacher Gate 1](teacher-gate-1/README.md): guion minuto a minuto, cuatro casos con sorteo fijo que reproducen la misma situación en cualquier máquina, tabla de niveles y de puntaje escritas para leer en voz alta, planilla de decisiones y acta.

Antes de convocar a nadie:

```bash
pnpm dev
pnpm teacher-gate --validate
pnpm teacher-gate --prepare
```

Si `--validate` falla, el contenido cambió y los casos ya no muestran lo que el pack promete. **No se da la reunión con casos obsoletos.**

## Herramientas para conducir la sesión

- `pnpm game:score` — qué hace la calibración candidata sobre 23.000 planes.
- `pnpm game:score -- --compare` — las mismas runs bajo 80/15/5, 85/10/5, 90/10/0 y sin recompensa por dificultad. Mover el dial deja de ser una discusión abstracta.
- `pnpm game:compose` — la distribución de composición: 20.000 años de 7.º, 1.404 planes distintos, carga idéntica.
- `pnpm teacher-gate --case TG1-A` — la ficha de un caso, con la URL para jugarlo.
- El juego en `/jugar`, que sigue jugando el arco completo de la demostración con un sorteo al azar.

## Qué NO se hace mientras el Gate está pendiente

- Cerrar coeficientes de score o de dificultad por decisión de ingeniería.
- Ranking, leaderboard, personal best, endpoints o persistencia → STAGE-09.
- Egreso, recuperaciones o contenido de 1.º–5.º → STAGE-07 y STAGE-08.
- Congelar el catálogo oficial de la feria: es una decisión de evento.
- Declarar oficial cualquier política: `createRuleset` lo impide por diseño, y las tres calibraciones vigentes llevan `official: false`.

## Bloqueos

**Externo, y es el punto.** El gate depende de la disponibilidad del Departamento de Matemática. Ninguna tarea de ingeniería lo desbloquea.

## Si el Gate se demora

STAGE-07 depende de él y no debería empezar. Lo que sí puede avanzar sin comprometer decisiones docentes es trabajo de infraestructura de STAGE-09 que no fije reglas —sesión, límites de tasa, persistencia— siempre que no congele un coeficiente ni implemente ranking. Esa decisión es de producto y no está tomada.

## Evidencia disponible

- Score competitivo — [ADR-023](../03-architecture/adr/ADR-023-competitive-score-policy.md); `fair-score-dev-1`, `official: false`; juego perfecto = 10.000 en los 23.000 planes auditados, y las franjas de matemática fuerte y floja no se cruzan.
- Modelo de dificultad y compositor — [ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md); 20.000 seeds, 1.404 planes distintos, carga total idéntica.
- Catálogo aprobado dentro del juego — [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md); catálogos `grade-7-dev-1` a `dev-4`, inmutables.
- Pipeline de variantes — [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md).
- Modelo de contenido — [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md).
- Career Model v2 — [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md).
- Sistema de diseño v0.2 — [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md).
- Verificación autoritativa — el servidor reproduce la run, valida su plan y **calcula** su propio score competitivo.
- Versionado — `ENGINE_VERSION 5.1.0`, `SNAPSHOT_SCHEMA_VERSION 6`, `ACTION_LOG_VERSION 4`, contenido `0.8.0-grade-7` y `0.6.0-dev`.

## Siguiente etapa

STAGE-07 — invariante de egreso, fail-forward y recuperaciones, que depende de este gate.

## Última reconciliación

29 de agosto de 2026, al cerrar STAGE-06, con `pnpm verify` en verde.
