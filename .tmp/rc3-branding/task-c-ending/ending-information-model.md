# Modelo de información del ending — TASK-C

Qué existe al terminar una carrera, de dónde sale y qué hace con eso la
pantalla. Nada de esta tabla se calcula en el motor por pedido del ending; el
ending sólo lee.

## Fuentes

| Dato | Origen | Autoridad | Se muestra | Se deriva | Se omite |
|---|---|---|---|---|---|
| `graduated` | `RunState.completion.graduated` (progresión) | motor | «Egresaste» / «Terminaste el recorrido» | — | — |
| Perfil narrativo (2–4 líneas) | `buildEpilogue(...).profile` (motor, `narrativeProfile`) | motor | la primera línea, bajo «Egresaste» | — | las líneas 2–4 (redundantes con estilo y números) |
| Promedio (1–10, un decimal) | `promedio(career)` sobre `career.grades` | motor (ADR-016) | `RecordRow` «Promedio» | — | nunca como 0 si es `null` |
| Equipo (0–100, base 50) | `career.equipo` | motor | `RecordRow` «Equipo» | umbral de estilo `≥ 56` | `null` → «—» |
| Aura (con signo, sin techo) | `career.aura` | motor | `AuraBlock` | umbral de estilo/hito `≥ 1.000` | `null` → no se dibuja |
| Estilo (tres ejes, suma 100) + evidencia | `career.estilo`, `isEstiloEstablished` | motor | triángulo y leyenda si está establecido | estilo de juego | — |
| Historial por evento (etapa, Template, calidad, Repaso) | `RunState.history` | motor | — | marcador por año, años redondos | preguntas, puntos parciales |
| Progresión (Repasos, previas) | `RunState.progression.history` | motor | — | marcador «Repaso cerrado / con lo justo», hito «Volviste» (motor) | conteo de fallas |
| Eventos raros | `RunState.rare` + `careerRareEvents` | motor/contenido | título como escena del año | hito «Estuviste ahí» (motor) | — |
| Flags de contenido | `RunState.flags` (escritas por `evaluate` de cada Template) | contenido | — | tres hitos de contenido (ver `achievement-mapping.md`) | el resto |
| Hitos del motor | `earnedMilestones(state, careerMilestones)` | contenido (`career-closing.ts`) | medallero | detalle enriquecido (años, títulos raros) | — |
| Recuerdos (todos, por año) | `careerMemories(...)` expuesto por `closeCareer` | motor | una escena por año en el recorrido | — | la selección 3–5 del epílogo (sigue calculándose, no se dibuja) |
| Prestige | `scorePrestige` | motor | sólo si la edición ofreció > 0 (v1: 0) | — | — |
| FairScore verificado | `VerifiedAttemptPayload.fairScore` (servidor, replay) | servidor | número grande | franja de desempeño | el `scorePreview` local nunca se muestra |
| Puesto | `SubmissionResponse.state.you.rank` (servidor, `rankOf`) | servidor | «Tu puesto actual» | podio, 1.º | nunca se calcula en el navegador |
| Empate en el podio | `state.leaderboard` (entradas con el mismo `rank`, top 3) | servidor | «Compartís el N.º puesto» | `shared` | fuera del podio: desconocido, no se afirma |
| `personalBest` | `VerifiedAttemptPayload.personalBest` | servidor | «Es tu mejor partida» / «Nuevo mejor puntaje personal» / «sigue contando la anterior» | con `before.bestFairScore` distingue primera vs mejora | — |
| Snapshot previo (`before`) | `PublicCompetitionState` en la portada al emitir el intento: `you.rank`, `you.bestFairScore`, `leaderboard[rank 1].fairScore` | portada (lectura del servidor) | — | «Subiste al 1.º puesto», «Récord» | si no existe, esas dos frases no aparecen |
| Estado de la competencia | `SubmissionResponse.state.competition.status` | servidor | — | CTA «Jugar de nuevo» sólo si `open` | — |
| Puntaje de práctica | `PracticeResult.fairScore` (servidor, replay) | servidor | número grande | franja | ningún puesto |

## Qué se derivaba antes y se perdía

El epílogo anterior mostraba el perfil de 2–4 líneas, 3–5 recuerdos, los
números, los hitos y un «Vas camino a: Egresado» fijo; el puntaje y el puesto
quedaban en un panel separado debajo, con «Jugar de nuevo» duplicado. Se
pierde: nada. Se deja de dibujar: las líneas 2–4 del perfil y la lista de
recuerdos (reemplazada por el recorrido año por año), el sello «Aprobado»
con arquetipo fijo (era decorativo y decía siempre lo mismo).

## Qué no existe y no se inventa

- Un promedio «académico» distinto del `promedio` de carrera: no hay otro.
- Un historial de máximos del ranking: no existe columna ni endpoint; el
  récord sólo se afirma comparando con el podio visible al emitir.
- Un rank histórico propio distinto de `you.rank`.
- Abanderado, escolta, capitán, medallas por año: ningún hecho del dominio los
  produce (ver `achievement-mapping.md`).
