# Visual review checklist — escenas RC3

**Estado: TECHNICALLY INTEGRATED · READY FOR HUMAN VISUAL REVIEW.** Nada de lo que sigue está "aprobado": lo revisa el Product Owner.

## Cómo acceder

- App local: `pnpm dev` → `http://localhost:3000` (sólo `.env.local`; Supabase local o ninguna DB; nunca producción).
- Harness de carrera completa, sin DB ni competencia: `http://localhost:3000/dev/game-engine?content=full-career&seed=<seed>` → botón **Comenzar recorrido**. Los beats narrativos avanzan con **Seguir**; cada situación pide una respuesta válida para **Confirmar** (cualquiera sirve para avanzar; una mala respuesta en el primer beat de un año dispara un Repaso al final de ese año).
- Vitrina del sistema: `http://localhost:3000/dev/design-system` → sección **Arte** muestra `SceneMedia` con `y1-expo` a cualquier ancho, sin jugar.
- Viewports sugeridos (DevTools, responsive): **320 · 360 · 390 · 412** y desktop (1280). El shell centra a 412 px en desktop; no hay layout ancho.

Qué mirar en cada pantalla: posición (título → imagen → prosa), tamaño/altura, que el sujeto se entienda, que no haya texto ni cifras en la lámina, que el rojo de la imagen no se lea como error, que la decisión no quede demasiado lejos, coherencia de paleta con la hoja, y que no haya desborde horizontal.

## Seeds recomendadas (composición verificada con el motor)

| Seed | Secuencia de situaciones → escena |
|---|---|
| `rc3-review-0` | g7.bus-latest-departure → **g7-bus** · g7.may-25-act → **g7-may-25** · y1.course-project-expo → **y1-expo** · y1.rehearsal-schedule → y1-rehearsal · y2.court-zones → y2-court · y3.transport-pass → y3-transport · y3.friend-day → y3-friend · y4.course-project-fundraiser → **y4-fundraiser** · y5.stage-screen → y5-screen |
| `rc3-review-2` | g7.bus-timing (timeline) → g7-bus · g7.may-25-act · y1.mobile-data → y1-mobile-data · y1.classroom-layout → y1-classroom · y2.team-kit-order → y2-team-kit · y2.intercurso-plan → y2-intercurso · y3.course-project-tech → y3-tech · y4.school-event-flow → y4-event · y5.stage-screen |
| `rc3-review-3` | … y2.course-project-survey → y2-survey · y2.standings-claim → y2-intercurso · y4.event-floor-plan → y4-event · y4.represent-class → y4-represent · y5.final-trip-or-event → y5-trip |
| `rc3-review-11` | … y3.route-plan → y3-route (route-builder) · y1.student-day-challenge-wheel → y1-wheel |
| `rc3-review-4` | … y3.week-planner → y3-week · y5.course-project-final → y5-final-project · y5.next-step-options → y5-next-step |
| `rc3-review-122` | … y5.course-project-final → y5-final-project · y5.yearbook → y5-yearbook |

`rc3-review-0` cubre los **tres style anchors** en una sola carrera (beats 1, 3 y 8) y siete engines distintos.

## Lista de revisión (1–2 por año + anchors + engines)

| # | Ruta / acceso | Scenario (Template) | Imagen esperada | Engine | Viewport | Qué revisar |
|---|---|---|---|---|---|---|
| 1 | `…?content=full-career&seed=rc3-review-0` · beat 1 | g7.bus-latest-departure | `g7-bus.webp` | numeric-input (bloque oscuro) | 320 / 390 / 1280 | **Anchor.** Parada sin número de línea; la prosa dice "el 60" (copy TASK-04) y la lámina no lo contradice. Distancia título → Confirmar. |
| 2 | mismo seed · beat 2 | g7.may-25-act | `g7-may-25.webp` | number-grid | 390 / 412 | Bandera y escarapelas: ¿aceptables como símbolo patrio o demasiado literales? Rojo de fajas vs rojo de eyebrow. La grilla larga: ¿la imagen alarga demasiado? |
| 3 | mismo seed · beat 3 | y1.course-project-expo | `y1-expo.webp` | assignment-board (papel) | 320 / 390 | **Anchor.** Pantalla más larga del juego; la imagen suma 143–195 px arriba. Figuras genéricas: no asignan a Alex/Dani/Sam. |
| 4 | mismo seed · beat 4 | y1.rehearsal-schedule | `y1-rehearsal.webp` | schedule-builder | 390 | Sin reloj ni agenda en la lámina. |
| 5 | mismo seed · beat 5 | y2.court-zones | `y2-court.webp` | spatial-layout | 390 / 412 | La cancha ilustrada no dibuja postas ni distancias; convive con la grilla de coordenadas de abajo. |
| 6 | mismo seed · beat 6 | y3.transport-pass | `y3-transport.webp` | decision-card (bloque oscuro) | 390 | Tarjeta genérica, sin tarifa; el bloque oscuro sigue siendo el foco. |
| 7 | mismo seed · beat 7 | y3.friend-day | `y3-friend.webp` | schedule-builder | 320 | Club genérico; ¿se entiende la tarde? |
| 8 | mismo seed · beat 8 | y4.course-project-fundraiser | `y4-fundraiser.webp` | quantity-builder | 390 / 1280 | **Anchor.** Bandejas tapadas, mantel; sin precios. Mantel a cuadros rojos junto a datos rojos: ¿confunde? |
| 9 | mismo seed · beat 9 | y5.stage-screen | `y5-screen.webp` | decision-card | 390 | Pantalla en blanco (no sugiere aspecto). |
| 10 | `seed=rc3-review-2` · beat 1 | g7.bus-timing | `g7-bus.webp` | timeline | 390 | Misma lámina que #1 con otra pregunta: reutilización correcta. |
| 11 | `seed=rc3-review-2` · beats 3–4 | y1.mobile-data / y1.classroom-layout | `y1-mobile-data.webp` / `y1-classroom.webp` | quantity-builder / spatial-layout | 360 | Celular sin interfaz; aula sin plano. |
| 12 | `seed=rc3-review-2` · beats 5–6 | y2.team-kit-order / y2.intercurso-plan | `y2-team-kit.webp` / `y2-intercurso.webp` | quantity-builder / assignment-board | 390 | Pecheras sin cantidades contables; banco junto a la cancha. |
| 13 | `seed=rc3-review-2` · beat 7 | y3.course-project-tech | `y3-tech.webp` | quantity-builder | 390 | Portátil apagada, prototipo abstracto. |
| 14 | `seed=rc3-review-2` · beat 8 | y4.school-event-flow | `y4-event.webp` | quantity-builder | 390 | Salón antes de abrir (compartida por tres Templates). |
| 15 | `seed=rc3-review-3` · beats 4, 8, 9 | y2.course-project-survey / y4.represent-class / y5.final-trip-or-event | `y2-survey` / `y4-represent` / `y5-trip` | classification / classification / decision-card | 390 | Hojas en blanco; sin votos; micro genérico sin destino. |
| 16 | `seed=rc3-review-11` · beat 6 | y3.route-plan | `y3-route.webp` | route-builder | 320 / 390 | Sin mapa ni flechas; fachadas sin cartelería. |
| 17 | `seed=rc3-review-4` · beats 6, 8, 9 | y3.week-planner / y5.course-project-final / y5.next-step-options | `y3-week` / `y5-final-project` / `y5-next-step` | schedule-builder / classification / classification | 390 | **Revisar contenido:** mural de graduación al fondo (final) y birrete + íconos de profesiones (next-step). Ver `issues-deferred.md`. |
| 18 | `seed=rc3-review-122` · beat 9 | y5.yearbook | `y5-yearbook.webp` | quantity-builder | 390 | Fotos ilegibles, sin páginas contables. |
| 19 | Cualquier seed: responder mal el primer beat del año | Repaso (p. ej. g7.bus-travel-review, "El viaje de hoy") | **ninguna** | numeric-input | 320 / 390 | Notas de Repaso arriba, situación sin lámina, interacción intacta. |
| 20 | `/dev/design-system` → Arte | — | `y1-expo.webp` | — | 320 → 1280 | Componente aislado: filete, ratio, sin filtro. |
| 21 | Ruta pública `/` (con competencia local bootstrapeada) | primera situación de la run | según seed de la edición | — | 390 | Mismo `RunView` que el harness, sin el callout de arriba: distancia real título → decisión. |

## Qué no verificar acá

Matemática, correctness, ranking, score: congelados y no tocados. Esta revisión es de posición, tamaño, crop, ritmo, legibilidad, coherencia, densidad y mobile.
