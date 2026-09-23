# Progresión y CTAs — TASK-B

Objetivo: que cada botón nombre su consecuencia cuando importa, que cerrar un
año se sienta como avanzar y que 5.º cierre distinto. Sin estados nuevos del
motor, sin acciones nuevas en el log, sin cambios de RunPlan ni de replay.

## Arquitectura

```text
motor → estado semántico (runProgress, owesRecovery, ruleset.stages)
        ↓
progression-copy.ts → ContinueIntent → continueLabel / yearMilestoneCopy
        ↓
run-view.tsx → <YearMilestone> + <Button data-intent>
```

- `continueIntent(state, ruleset)` mira: ¿es el último evento planificado del
  año? (`eventInStage + 1 >= eventsInStage`); ¿el año debe un Repaso?
  (`owesRecovery`); ¿hay etapa siguiente? (`ruleset.stages[i + 1]`). Un Repaso
  abierto cuenta como «después del último evento», igual que en `advance`.
- El botón sigue despachando el mismo `CONTINUE`. `data-intent` expone la
  intención para tests; el label es sólo texto.
- Resume / reload: el snapshot restaura el mismo estado y el hito se recalcula
  desde él; no hay nada que persistir ni acknowledgement que duplicar.
- Un test compara la intención de **cada** pantalla de dos carreras reales
  (óptima y con Repasos) contra lo que el motor hizo después del `CONTINUE`.

## Momentos y labels canónicos

| Momento | Pantalla | Label | Hito |
|---|---|---|---|
| Inicio (portada) | home | Jugar ahora / Jugar de nuevo / Continuar partida · Probar sin competir | — |
| Identificación | formulario | Empezar | — |
| Apertura de 7.º | NarrativeCard «Arranca séptimo» | **Empezar 7.º** | — |
| Evento intermedio | resultado o beat narrativo | Seguir | — |
| Último evento del año, sin deuda | resultado o beat | **Pasar a 1.º** … **Pasar a 5.º** | **Año completado · N ✓ · línea** |
| Último evento del año, con deuda | resultado o beat | **Ir al Repaso** | (espera) |
| Repaso | notas + situación | Confirmar | «Quedó algo dando vueltas este año. Lo cerrás acá, con una cuenta más corta; salga como salga, el año sigue.» |
| Resultado del Repaso | resultado | **Pasar a N** | hito con «Quedó algo dando vueltas y lo cerraste igual.» |
| Apertura de un año | NarrativeCard | **Empezar N** | — |
| Último evento de 5.º | resultado o beat | **Ver mi egreso** | **Fin de la secundaria · 5.º ✓ · «Terminaste la secundaria.»** |
| Egreso | CareerEpilogueView | Jugar de nuevo | Egresado (Milestone, confeti) — TASK-C profundiza |
| Ruleset de desarrollo que termina antes de 5.º | `/dev/*` | Cerrar 7.º / Cerrar 1.º | hito sin «Fin de la secundaria» |

Líneas del hito por año (espina LOCKED de `narrative-system.md`):

```text
7.º  Ya sabés cómo funciona la escuela.
1.º  Ya tenés una forma propia de resolver.
2.º  Ya tenés un lugar en el curso.
3.º  La agenda la armaste vos.
4.º  Hubo gente que dependió de tus decisiones.
5.º  Terminaste la secundaria.
```

Sufijo dinámico, determinista, sólo desde estado existente:
- el año registró un Repaso → « Quedó algo dando vueltas y lo cerraste igual.»
- todos los resultados ordinarios del año fueron Óptimo → « Todo salió como lo pensaste.»
- si no, nada.

No hay métricas en el hito: la tira de carrera, dos bloques más arriba, ya
muestra Promedio / Equipo / Aura, y repetirlas a 320 px era ruido. No hay
arquetipos ni premios: pertenecen a TASK-C.

## Jerarquía de celebración

```text
acción correcta       → «Óptimo» + la cuenta (sobrio)
año completado        → filete 2 px, numeral text-section, tilde, una línea
egreso                → Milestone 66 px, sello, confeti (existente; TASK-C)
```

## Conflicto registrado: orden del beat de cierre en 2.º–5.º

Los storylets `yN.closing` de 2.º a 5.º tienen prioridad 90 y `requires:
always`; el selector los elige **inmediatamente después de la intro** en la
mayoría de las seeds (verificado con `browser-career`, `rc3-discovery-0/1`).
«Cierra segundo» aparecía antes de los desafíos de 2.º. Reordenarlos (bajar la
prioridad, como en `y1.closing`) cambia el orden de comandos del action log
(`CONTINUE` vs `ANSWER`) y rompe el replay de intentos emitidos con
`5.5.0-grade-5`: es un cambio de contenido versionable, fuera de TASK-B.

Mitigación aplicada, presentation-only: esos cuatro beats se reescribieron como
momentos del año sin posición fija (no afirman que el año terminó), y el cierre
real lo pone `YearMilestone`, que se deriva del estado y siempre cae en el
último evento. Pendiente para un bump de contenido: bajar la prioridad de
`y2–y5.closing` a la de `y1.closing`.
