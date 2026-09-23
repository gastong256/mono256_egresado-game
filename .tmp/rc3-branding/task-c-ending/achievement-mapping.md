# Mapeo de hitos — TASK-C

Regla: un hito se muestra sólo si un hecho registrado lo sostiene. Ninguno
suma puntos, cambia FairScore/Prestige, ordena el ranking ni se guarda.
Derivación: `deriveAchievements(state, milestones, memories)` en
`src/components/game/ending/ending-model.ts`; test en
`tests/unit/ending-model.test.ts` («un hito ausente no aparece»).

| Achievement | Source fact | Derivation | Display label · detail | Can appear? |
|---|---|---|---|---|
| Egresado | `completion.graduated && seis etapas en history` | hito del motor `milestone.graduated` | «Egresado» · «Terminaste los seis años.» | Sí, toda carrera completa |
| Un año redondo | todos los beats ordinarios de una etapa con `quality === 'optimal'` | hito del motor `milestone.perfect-year`; el ending calcula además **qué años** con la misma regla (`perfectYears`) | «Un año redondo» · «Año(s) entero(s) con todo Óptimo: 7.º y 3.º.» | Sí |
| Volviste | `progression.history.length > 0` | hito del motor `milestone.came-back` | «Volviste» · «Un año te dejó debiendo algo y lo cerraste igual.» | Sí, si hubo Repaso |
| Estuviste ahí | `rare.length > 0` | hito del motor `milestone.saw-something-rare`; el ending suma los títulos de los eventos raros desde los recuerdos | «Estuviste ahí» · «Te tocó algo que no le pasa a todas las carreras: Se cortó la luz.» | Sí, si la seed sorteó rareza |
| Una forma propia | `career.estiloEvidence >= 6` | hito del motor `milestone.style-identity` | «Una forma propia» · «Tu manera de resolver quedó marcada.» | Sí |
| Acto impecable | flag `g7.actoImpecable === true` (escrita por `g7.may-25-act` en resultado Óptimo) | flag de contenido | «Acto impecable» · «La coreografía del 25 de Mayo salió sin un paso de más.» | Sí, cuando el plan incluye el acto y salió Óptimo |
| Proyecto redondo | alguna de `y1.project.outcome`, `y2.survey.outcome`, `y3.projectTech.outcome`, `y4.fundraiser.outcome`, `y5.projectFinal.outcome` con valor `'optimal'` | flag de contenido (las Templates del Proyecto del Curso escriben su calidad) | «Proyecto redondo» · «Un año del Proyecto del Curso salió de la mejor manera posible.» | Sí |
| Todos participaron | flag `y1.project.everyone-participated === true` (expo de 1.º) | flag de contenido | «Todos participaron» · «En la expo de 1.º nadie se quedó sin una parte.» | Sí, si la expo entró en el plan |
| El curso te recuerda | `career.aura >= 1000` | dimensión de carrera (un acto impecable vale +1.000) | «El curso te recuerda» · «Aura de +1.000 o más: un momento público que no se olvida.» | Sí |

## Propuestos por el PO que no existen en el dominio

| Ejemplo | Buscado en | Resultado | Decisión |
|---|---|---|---|
| Abanderado | flags, milestones, storylets, docs (GDD, narrativa, reglas) | ninguna mención | **DEFERRED — requires game/content design** |
| Escolta | idem | ninguna | DEFERRED |
| Capitán del equipo | idem; `y2.intercurso-plan` y `y4.shift-coverage` escriben `*.outcome`/`*.strategy`, no un rol | ninguna | DEFERRED (podría derivarse de un hecho futuro, no de Equipo alto) |
| Medalla por año | no hay evaluación por año en el motor | — | el recorrido muestra el marcador del año («Todo Óptimo», «Repaso cerrado»); no se acuña medalla |

## Vacío

Sin hitos, la sección no se dibuja (`AchievementCabinet` devuelve `null`). No
hay premio de consuelo. Con una carrera completa siempre hay al menos
«Egresado», así que en producción el medallero nunca queda vacío; el test
cubre el caso igual.
