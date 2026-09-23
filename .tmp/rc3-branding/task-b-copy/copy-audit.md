# Auditoría de copy — TASK-B

Base: `main` · `7ea70d7` (practice mode) · 2026-09-23. Superficies públicas:
`/` (portada, identificación, partida, epílogo, verificación), `/test`
(práctica) y la capa de juego compartida (`RunView`, `ChallengeFrame`,
`FeedbackPanel`, `CareerEpilogueView`). No se auditan organizer, harness
`/dev/*`, tests ni logs, salvo strings compartidos que llegan al público.

Clasificación: **FREE** (reescribible con criterio), **SEMI** (contiene
información del desafío; sólo si todos los hechos y relaciones se conservan),
**LOCKED** (datos que determinan una respuesta; no se tocan). Una cadena mixta
se clasifica por su fragmento más restrictivo.

Las 1.031 variantes no se listan una por una: se audita al nivel de Template
(narrate) y de componente. Las cifras interpoladas en `setup`/`goal` son LOCKED
aunque la frase que las rodea sea SEMI.

## Resumen

| Grupo | Registros | FREE | SEMI | LOCKED | Cambiados |
|---|---|---|---|---|---|
| Home / estado / ranking / identidad / verificación / footer | 27 | 19 | 8 | 0 | 12 |
| Juego: shell, CTA, Repaso, resultado, rechazo | 14 | 11 | 3 | 0 | 8 |
| Epílogo / práctica | 12 | 9 | 3 | 0 | 5 |
| Storylets (intro, escenas, cierre, repaso) × 6 años | 46 | 46 | 0 | 0 | 27 |
| Templates públicas (título / setup / goal / instrucciones) × 28 + 10 Repasos | 38 | 38 títulos · setups SEMI | 38 goals SEMI/LOCKED | datos, opciones, feedback | 9 |
| **Total** | **137** | | | | **61** |

## Superficies de competencia y práctica

| Surface | File | Identifier | Current copy | Class | Problem | Direction | Risk | Estado |
|---|---|---|---|---|---|---|---|---|
| home eyebrow (sin edición) | competition-experience.tsx | Eyebrow not-configured | Juego de matemática escolar | FREE | Suena a examen (C05); difiere de metadata | «Un juego sobre decidir en la escuela» | bajo | CAMBIADO |
| home eyebrow (edición) | idem | competition.name | {nombre} | FREE | — | conservar | — | — |
| home tagline | idem | h1 sub | Tu secundaria. Tus decisiones. Tu lugar en el ranking. | FREE | TASK-A; correcto | conservar | — | — |
| home promesa | idem | p | Del primer día a la graduación. Resolvé situaciones… | FREE | Correcto (C03 ya resuelto por TASK-A) | conservar | — | — |
| home trayecto | idem | 7.º → … → Egreso | FREE | correcto | conservar | — | — |
| estado abierto | CompetitionStatusNote | open | Jugá, mejorá tu puntaje y buscá tu lugar en el podio. | FREE | No dice la regla que importa (mejor partida) | «Jugá las veces que quieras: en el ranking cuenta tu mejor partida verificada.» | bajo | CAMBIADO |
| estado próximo | idem | upcoming | La próxima partida puede ser la tuya. Volvé cuando… | FREE | No ofrece acción ahora | «Cuando abra vas a poder jugar desde acá. Mientras tanto, podés probar sin competir.» | bajo | CAMBIADO |
| estado cerrado | idem | closed | El ranking queda publicado. Ya no se pueden empezar partidas nuevas. | FREE | claro | conservar | — | — |
| sin edición | idem | not-configured | El juego está listo, pero ningún organizador… Volvé cuando se anuncie… | FREE | Empty state sin acción | agrega «Mientras tanto podés probar sin competir» | bajo | CAMBIADO |
| saludo | idem | greeting | Hola, {alias} | SEMI (alias) | seguro (texto React) | conservar | — | — |
| mejor puntaje | idem | bestFairScore | Tu mejor puntaje: N | SEMI | Puede leerse como último intento (C11) | «Tu mejor puntaje: N. Es el que cuenta en el ranking.» | bajo | CAMBIADO |
| CTA principal | idem | play | Jugar ahora / Jugar de nuevo / Continuar partida / Preparando partida… | SEMI | correctos | conservar | — | — |
| práctica link | idem | link | Probar sin competir | FREE | correcto | conservar | — | — |
| privacidad link | idem | a#privacy | Tus datos y privacidad, antes de jugar | FREE | ok | conservar | — | — |
| no soy yo | idem | forget | No soy yo | SEMI | correcto (C17) | conservar | — | — |
| errores red | idem | readError | Algo salió mal. Probá de nuevo. / No pudimos conectarnos. Probá de nuevo. | FREE | ok | conservar | — | — |
| errores servidor | server/competition/errors.ts | playerMessageFor | 20 mensajes en castellano | SEMI | ya en lenguaje de jugador | conservar | — | — |
| ranking título | leaderboard.tsx | h2 | Ranking / Resultados del evento | FREE | ok | conservar | — | — |
| ranking vacío | leaderboard.tsx | empty | El podio está por escribirse. / El primer puesto está libre… | FREE | Sugiere ventaja por llegar primero (C09) | «Todavía no hay puestos.» / «Nadie tiene todavía una partida verificada. Jugá una y tu puntaje aparece acá.» | bajo | CAMBIADO |
| regla de ranking | leaderboard.tsx | caption | Cuenta tu mejor partida verificada. Si hay empate… | SEMI | correcta (C08) | conservar | — | — |
| identidad heading | identity-form.tsx | h2 | ¿Cómo querés aparecer? / Si ya jugaste antes… | SEMI | Cubre sólo alias; reingreso ambiguo (C12/C13) | «Elegí cómo aparecer en el ranking» + «Después van unos datos para validar que sos vos. Si ya jugaste antes, completá los mismos y seguís con tu alias.» | bajo | CAMBIADO |
| alias hint | identity-form.tsx | hint | Es lo único que se ve en el ranking. | SEMI | no dice que no es el nombre real | + «No hace falta tu nombre real.» | bajo | CAMBIADO |
| campos privados | identity-form.tsx | labels/hints/errores | Nombre y apellido / DNI / Año o curso / División / Sólo los números… | LEGAL | ADR-026 | conservar íntegros | — | — |
| aviso privacidad | privacy-summary.tsx | Tus datos / Más información / Versión | LEGAL | conservar | — | — | — |
| verificando | verification-panel.tsx | verifying | Verificando… / El servidor está volviendo a jugar tu partida… Tarda unos segundos. | SEMI | explica implementación y promete duración (C18) | «Verificando tu partida…» / «Cuando termine, vas a ver tu puntaje acá.» | bajo | CAMBIADO |
| fallo verificación | idem | failed | No se pudo verificar | SEMI | no dice que el recorrido se conserva | «No pudimos verificar tu partida» + «Tu recorrido no se pierde: reintentá cuando tengas conexión.» | bajo | CAMBIADO |
| rechazo | idem | rejected | El servidor no pudo confirmar el resultado… | SEMI | ok; se saca «servidor» | «No pudimos confirmar el resultado…, así que no suma al ranking.» | bajo | CAMBIADO |
| mejor partida | idem | personal-best | Es tu mejor partida hasta ahora… / Tu mejor partida anterior sigue siendo… | SEMI | segunda frase ambigua | «No superó tu mejor partida: en el ranking sigue contando la anterior.» | bajo | CAMBIADO |
| footer | institutional-footer.tsx | logos + aviso | Colegio…, Feria del Libro 2026, developed by… | LEGAL/inst. | ligado al evento (§54 permite) | conservar | — | — |
| práctica header | practice-experience.tsx | Modo práctica · No participa del ranking. | FREE | correcto | conservar | — | — |
| práctica intro | idem | body | Recorré la secundaria completa… no modifica tu resultado competitivo. / No te pedimos nombre, DNI ni año real… | FREE | densidad; «año real» raro | «Es el mismo juego, de 7.º a 5.º, con las mismas reglas de puntaje. Lo que hagas acá no entra al ranking ni cambia tu resultado en la competencia.» / «…ni curso… seguir después.» | bajo | CAMBIADO |
| práctica CTAs | idem | Empezar práctica / Continuar práctica / Empezar otra práctica / Conservar mi práctica / Guardar y salir | SEMI | correctos | conservar | — | — |
| práctica resultado | practice-run.tsx | Puntaje de práctica / Este puntaje es de práctica y no modifica el ranking. / Reintentar cálculo | SEMI | correctos; E2E los fija | conservar | — | — |

## Capa de juego

| Surface | File | Identifier | Current copy | Class | Problem | Direction | Risk | Estado |
|---|---|---|---|---|---|---|---|---|
| etapa | stage-label.ts | STAGE_LABEL | 7.º grado, 1.º año … Egreso | FREE | consistente | conservar; se expone `stageNumeral` | — | — |
| progreso | ui/progress.tsx | sr-only | Evento n de m | SEMI | ok | conservar | — | — |
| CTA continuar | run-view.tsx | continue | Seguir (siempre) | FREE | Genérico en hitos: cambio de año, Repaso, egreso (§31–35) | intención derivada del estado: Empezar 7.º / Seguir / Ir al Repaso / Pasar a N / Ver mi egreso | medio (tests) | CAMBIADO |
| hito de año | (nuevo) year-milestone.tsx | — | no existía | FREE | Pasar de año no se sentía (§35–38) | «Año completado · N ✓ · línea» en la misma pantalla, antes del CTA | medio | NUEVO |
| CTA confirmar | run-view.tsx | submit | Confirmar | SEMI | correcto; tests | conservar | — | — |
| falta para confirmar | interaction-area.tsx | missingRequirement | Elegí una opción… / Escribí un número… / Falta asignar N tareas… | SEMI | claros, con voseo | conservar | — | — |
| Repaso: notas | run-view.tsx | review-notes | Repaso: {título} / Un único Repaso cierra lo que quedó pendiente este año, aunque la respuesta no salga completa. | SEMI | Explica la regla, no qué hacer (C23) | «Quedó algo dando vueltas este año. Lo cerrás acá, con una cuenta más corta; salga como salga, el año sigue.» (misma semántica: un Repaso, cierra igual) | bajo | CAMBIADO |
| Repaso: debrief | run-view.tsx | review-debrief | Se comenta acá; no se practica en otra interacción. | SEMI | vocabulario interno «interacción» (C24) | «Esto se explica acá y se cierra con el mismo Repaso; no hay otra situación para practicarlo.» | bajo | CAMBIADO |
| rechazo del motor | run-view.tsx | rejection | El motor rechazó la acción: {kind} | SYSTEM | jerga (C26) | «No se pudo aplicar esa acción. Probá de nuevo. ({kind})» (diagnóstico conservado; test lo lee) | bajo | CAMBIADO |
| resultado | feedback-panel.tsx / outcome.ts | Resultado · Óptimo/Resuelto/Parcial/Insuficiente · Lo que no se cumplió | LOCKED-vocab DS | correcto, no humilla | conservar | — | — |
| chips / Aura | career-chips.tsx / aura-display.tsx | Promedio 8,0 → 8,4 · Equipo +4 · Estratega ↑ | SEMI | correctos | conservar | — | — |
| tira | career-strip.tsx | Promedio / Equipo / Aura / Ver estilo… | SEMI | correctos | conservar | — | — |
| guardar avance | attempt-run.tsx / practice-run.tsx | No se puede guardar el avance… | SYSTEM | correcto (C28) | conservar | — | — |
| cargando | competition-experience.tsx / practice-experience.tsx | Preparando la partida… / Preparando tu práctica… | SYSTEM | ok | conservar | — | — |
| epílogo | career-epilogue.tsx | Fin de la secundaria · Egresado · Egresaste / Terminaste el recorrido · Tu recorrido · Hitos · Vas camino a · Aprobado DIC · 5.º | FREE | orden canónico; TASK-C lo profundiza | conservar | — | — |
| epílogo nota fair | career-epilogue.tsx | mode note | El puesto oficial se publica con el cierre de la edición. | SEMI | contradice ranking vivo (C22/H07) | «Tu puntaje verificado aparece más abajo. En el ranking cuenta tu mejor partida.» | bajo | CAMBIADO |
| epílogo nota práctica | idem | practice note | Esto es una partida de práctica… no entra en ningún ranking. | SEMI | correcto; E2E lo fija | conservar | — | — |
| Jugar de nuevo ×2 | career-epilogue.tsx + verification-panel.tsx | play-again | duplicado (C21/H06) | SEMI | jerarquía de ending | **DEFERRED a TASK-C** (no mover lifecycle) | — | DIFERIDO |
| year-result (dev) | year-result.tsx | Por ahora Egresado llega hasta acá… | FREE | sólo `/dev/grade-7` (C34) | fuera de alcance público; no se migra | — | NO PÚBLICO |

## Storylets (por año)

Sólo se muestran públicamente: `eyebrow` (arriba de cada situación),
`title`+`text` de beats narrativos (intro y cierre) y `title`/`eyebrow` de
escenas y repasos como recuerdo del epílogo. El `text` de una escena con
desafío no se dibuja (RunView usa el enunciado del desafío).

| Año | Storylet | Antes | Problema | Después | Estado |
|---|---|---|---|---|---|
| 7.º | g7.intro | Apertura · Arranca séptimo · «…en el pizarrón ya anunciaron la feria de fin de año.» | promete contenido DEV-only (mural/stand) | Primer día · Arranca séptimo · «El aula huele a cuaderno nuevo y todavía nadie sabe los nombres de todos. Lo primero que hay que aprender es cómo llegar a horario.» | CAMBIADO |
| 7.º | g7.bus / g7.may-25 | Segunda semana / Acto escolar | ok | conservar | — |
| 7.º | g7.review | Antes de cerrar el año · «Che, esa cuenta…» | «Che» aislado; nombre de año | Antes de cerrar 7.º · sin «Che» | CAMBIADO |
| 7.º | mural/notebook/lead/support/group/fair-stand | — | DEV-only | sin cambio | NO PÚBLICO |
| 1.º | y1.intro | Empieza primero · «…El Proyecto del Curso I acompaña el año: habrá una exposición, aunque esta vez te toque decidir en otra parte.» | frase confusa | Marzo · «…Este año arranca el Proyecto del Curso, que va a acompañarte hasta 5.º.» | CAMBIADO |
| 1.º | escenas | Rutinas propias / Proyecto del Curso I / Preparar el espacio / **Preparación del Día del Estudiante** / 21 de septiembre | eyebrow largo a 320 px | «Antes del Día del Estudiante» | CAMBIADO (1) |
| 1.º | y1.closing | Cierra primero · «…Este recorrido de práctica termina acá: segundo todavía no está disponible.» | **C02 falso final** | Diciembre · sin la última frase | CAMBIADO |
| 1.º–5.º | yN.review | Antes de cerrar primero… · Repaso del año · «Antes de cerrar primero quedó algo…» | nombres de año en palabras; «repaso» minúscula | Antes de cerrar N.º · texto unificado con «Repaso» | CAMBIADO |
| 2.º | y2.intro | Marzo · Segundo año | título administrativo (C35) | Marzo · Ya no sos el nuevo | CAMBIADO |
| 2.º | y2.closing | Diciembre · Cierra segundo · «El Intercurso quedó atrás…» | **aparece después de la intro** (prioridad 90) y afirma cierre; ver conflicto en semantic-diff | En el curso · Alguien lo empuja · texto sin posición | CAMBIADO |
| 3.º | y3.intro | Marzo · Tercer año | administrativo | Marzo · Nadie te dice el orden | CAMBIADO |
| 3.º | escena transport-pass | Marzo | repite el eyebrow de la intro | Todos los días | CAMBIADO |
| 3.º | y3.closing | Diciembre · Cierra tercero · «Terminás el año…» | idem 2.º | Entre semana · La agenda es tuya | CAMBIADO |
| 4.º | y4.intro | Marzo · Cuarto año | administrativo | Marzo · Hay gente esperando | CAMBIADO |
| 4.º | y4.closing | Diciembre · Cierra cuarto · «Se terminó el año del evento…» | idem | En el curso · Alguien lo sostiene | CAMBIADO |
| 5.º | y5.intro | Marzo · **Cuarto año** · texto de 4.º | **C01 P0** | El último marzo · El último año · texto propio de cierre/futuro | CAMBIADO |
| 5.º | escenas | **Marzo** (viaje) / Proyecto del Curso V / Octubre / **El acto** / Diciembre | repite intro; «El acto» vago | Viaje de egresados / … / Acto de egreso | CAMBIADO (2) |
| 5.º | y5.closing | Diciembre · Cierra quinto · «Terminaste…» | puede aparecer antes del último desafío | Último año · Lo que queda escrito | CAMBIADO |

## Templates públicas

Sólo `title` y `setup` son candidatos; `goal`, instrucciones, datos, opciones,
leyendas y feedback quedan protegidos. Las 10 de Repaso se revisaron y no se
tocan (títulos cortos, setups con la cuenta aislada).

| Template | Título | Setup | Class | Decisión |
|---|---|---|---|---|
| g7.bus-timing | El colectivo de siempre | «El 60 viene con demora…» | SEMI | **«El colectivo viene con demora otra vez…»** (C06) |
| g7.bus-latest-departure | La pregunta del grupo | «…el 60 sigue viniendo…» | SEMI | **«…el colectivo sigue viniendo…»** |
| g7.bus-travel-review | El viaje de hoy | ok | SEMI | conservar |
| g7.may-25-act | 25 de Mayo | 3 oraciones, «folklórica», «tira de números» | SEMI | **acortada**; conserva regla por paso y «acompañás sólo los que la cumplen» |
| y1.classroom-layout | Un aula que funcione | ok, contiene la restricción cualitativa | SEMI | conservar |
| y1.course-project-expo | La primera expo | callback + nombres por variante | SEMI/LOCKED | conservar |
| y1.mobile-data | Datos para estos días | cifras interpoladas | LOCKED | conservar |
| y1.rehearsal-schedule | Antes del ensayo | callback | SEMI | conservar |
| y1.student-day-challenge-wheel | La rueda del curso | «Es 21 de septiembre.» repite el eyebrow | SEMI | **removido «Es 21 de septiembre.»**; se conserva «misma posibilidad de salir» |
| y2.course-project-survey | Lo que dice la encuesta | cifras | LOCKED | conservar |
| y2.court-zones | Las postas de la cancha | cifras | LOCKED | conservar |
| y2.intercurso-plan | El plan del Intercurso | ok | SEMI | conservar |
| y2.standings-claim | La tabla del Intercurso | frases fijadas por RS-MAT-005 | LOCKED | conservar |
| y2.team-kit-order | Las pecheras del Intercurso | cifras | LOCKED | conservar |
| y3.course-project-tech | **Proyecto del Curso: la feria de tecnología** | «…y una hora de laboratorio.» | SEMI | **título «La feria de tecnología»** (C31; el eyebrow ya dice Proyecto del Curso III) · **«un rato de laboratorio»**: el dato real es 8–16 min según variante (ver semantic-diff) |
| y3.friend-day | El Día del Amigo | ok | SEMI | conservar |
| y3.route-plan | Los mandados del sábado | «a las dos hay almuerzo» vs límite 13:00–13:40 | SEMI | **«hay que estar de vuelta para el almuerzo»**; el límite exacto está en la grilla |
| y3.transport-pass | Cómo pagar el colectivo | frases fijadas por RS-MAT-001 | LOCKED | conservar |
| y3.week-planner | La semana que viene | conteos coinciden con constantes | SEMI | conservar |
| y4.course-project-fundraiser | **Proyecto del Curso: la peña** | ok | SEMI | **título «La peña»** |
| y4.event-floor-plan / school-event-flow / shift-coverage | El salón / La cola / Los turnos del evento | ok; «tres horas» = 3 bloques fijos | SEMI | conservar |
| y4.represent-class | Representar al curso | ok | SEMI | conservar |
| y5.course-project-final | **Proyecto del Curso: la muestra final** | callbacks | SEMI | **título «La muestra final»** |
| y5.final-trip-or-event | El viaje | «cuatro paquetes» = 4 constantes | SEMI | conservar |
| y5.next-step-options | El año que viene | opcionalidad conservada (C33) | SEMI | conservar |
| y5.stage-screen | La pantalla del acto | ok | SEMI | conservar |
| y5.yearbook | El anuario | callback | SEMI | conservar |
| 10 Repasos | Repaso: … / Cuánto entra / Lo que se paga una vez / … | «una sola cuenta» | SEMI | conservar |

## Hallazgos de TASK-01 verificados

| ID | Estado en `main` antes de TASK-B | Resolución |
|---|---|---|
| C01 5.º = «Cuarto año» | vigente | resuelto |
| C02 «segundo todavía no está disponible» | vigente | resuelto |
| C03 home promete mural/grupo | ya resuelto por TASK-A | — |
| C04 «Seis años de secundaria en unos minutos» | ya reemplazado por TASK-A | — |
| C05 «Juego de matemática escolar» | vigente (sólo sin edición) | resuelto |
| C06 «el 60» | vigente | resuelto |
| C07/C08 densidad estado/regla | parcialmente mejorado por TASK-A | estado abierto reescrito |
| C09 «primer puesto libre» | vigente | resuelto |
| C11 mejor puntaje vs último | vigente | resuelto |
| C12/C13 heading identidad | vigente | resuelto |
| C18 verificación explica replay | vigente | resuelto |
| C21 Jugar de nuevo ×2 | vigente | diferido a TASK-C |
| C22 «puesto oficial al cierre» | vigente | resuelto |
| C23/C24 copy de Repaso | vigente | resuelto |
| C26 «El motor rechazó» | vigente | resuelto |
| C31 títulos «Proyecto del Curso: …» | vigente | resuelto |
| C34 «años en construcción» | sólo `/dev` | no público, sin cambio |
| C35 títulos administrativos de año | vigente | resuelto |
| C36 descripciones distintas | metadata coherente; eyebrow alineado | resuelto |
| H04 notebook = cuaderno (brief de assets) | brief histórico; contenido dice notebook | sin cambio |
