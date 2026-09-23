# Semantic diff — TASK-B

Cambios de riesgo medio o alto. Para cada uno: qué se preguntaba antes y
después, qué datos tiene el jugador, qué restricciones aplican, qué respuesta
es válida y qué motor de interacción se usa. Las microediciones FREE (eyebrows,
títulos narrativos, estados vacíos) no se listan una por una; están en
`copy-audit.md`.

Invariantes verificadas al final (ver `verification.md`): huella del release
RC.2 intacta (`release:verify`), catálogos `grade-5-dev-6` y `1031` entradas
intactos, goldens del motor y del score sin regenerar, RunPlan y replay
sin cambios (los tests de carrera completa y de competencia reproducen los
mismos logs).

## Templates

| Template | Campo | Antes | Después | Datos afectados | Meaning changed | Rationale |
|---|---|---|---|---|---|---|
| g7.bus-timing | setup | «El 60 viene con demora otra vez. …» | «El colectivo viene con demora otra vez. …» | NO (viaje, demora, entrada y salidas están en la grilla) | NO | C06: número de línea sin fundamento local; ata la escena a una ciudad no declarada. La lámina muestra un colectivo sin número. |
| g7.bus-latest-departure | setup | «…el 60 sigue viniendo con demora…» | «…el colectivo sigue viniendo con demora…» | NO | NO | idem |
| g7.may-25-act | setup | «Te toca la coreografía folklórica frente a toda la escuela. No te acordás los pasos de memoria, así que armaste una ayudamemoria: cada paso tiene una regla, y de la tira de números que canta la maestra acompañás sólo los que la cumplen.» | «Te toca la coreografía frente a toda la escuela y no te sabés los pasos de memoria. Armaste una ayudamemoria: cada paso tiene una regla, y de los números que canta la maestra acompañás sólo los que la cumplen.» | NO (reglas, pasos y números viven en la grilla `number-grid`) | NO | Con la lámina del acto, la prosa deja de describir la escena; conserva el mecanismo completo: cada paso → una regla → marcar sólo los que cumplen. |
| y1.student-day-challenge-wheel | setup | «Es 21 de septiembre. El curso arma una rueda… cada posición tiene la misma posibilidad de salir.» | «El curso arma una rueda… cada posición tiene la misma posibilidad de salir.» | NO (`total`, regla y preferencia en el `goal` y la grilla; equiprobabilidad conservada) | NO | El eyebrow «21 de septiembre» ya lo dice; la frase repetía. La condición de equiprobabilidad —necesaria para la distribución— permanece. |
| y3.course-project-tech | title | «Proyecto del Curso: la feria de tecnología» | «La feria de tecnología» | NO | NO | C31: el eyebrow «Proyecto del Curso III» ya ubica el arco; el título duplicado no entraba bien a 320 px. |
| y3.course-project-tech | setup | «…armar el stand con la notebook prestada, el pendrive y **una hora** de laboratorio.» | «…arma el stand con lo que hay: una notebook prestada, un pendrive y **un rato** de laboratorio.» | **Sí, se retira una cifra de la prosa** que contradecía el dato: `Laboratorio` vale 8, 10, 12 o 16 minutos en las 25 variantes aprobadas (materializadas y contadas). El dato de la grilla no cambia. | NO (la restricción sigue en la grilla, con el valor correcto) | **CONTENT REVIEW NEEDED** para el autor: el comentario de cabecera del archivo todavía habla de «una hora de laboratorio». La prosa ya no afirma un valor; la matemática es la de siempre. |
| y3.route-plan | setup | «Te tocan los mandados y **a las dos** hay almuerzo en casa. Cada lugar abre y cierra a su hora.» | «Te tocan los mandados del sábado y hay que estar de vuelta para el almuerzo. Cada lugar abre y cierra a su hora.» | **Se retira una hora de la prosa**: el límite real («Tenés que volver») es 13:00, 13:20 o 13:40 según variante; «las dos» no era el límite y confundía con el dato. | NO (el límite sigue en la grilla como restricción) | Un jugador que leyera «a las dos» podía planear contra 14:00. Ahora la única hora es la de la grilla. |
| y4.course-project-fundraiser | title | «Proyecto del Curso: la peña» | «La peña» | NO | NO | C31 |
| y5.course-project-final | title | «Proyecto del Curso: la muestra final» | «La muestra final» | NO | NO | C31 |

Comprobado que ningún `goal`, instrucción de interacción, dato, opción,
leyenda ni feedback cambió: `git diff` sobre `src/content` toca sólo
`title`/`setup` de esas plantillas, `storylets.ts` y dos comentarios de
cabecera. Los tests que fijan fragmentos de `setup` (RS-MAT-001 en
`transport-pass`, RS-MAT-005 en `standings-claim`, callbacks de 1.º) pasan sin
modificación.

## Storylets

Cambios de `eyebrow`, `title` y `text`. Ningún cambio de `id`, `kind`,
`stages`, `weight`, `priority`, `requires`, `tags`, `challengePool`, `effects`
ni `followUps`: la selección narrativa, los flags y el orden de eventos son los
mismos (verificado: `full-career.test.ts`, `career-callbacks.test.ts`,
goldens del motor y las secuencias de `browser-career` / `rc3-discovery-*`
reproducidas antes y después).

| Storylet | Antes | Después | Meaning changed | Rationale |
|---|---|---|---|---|
| y5.intro | «Marzo · Cuarto año · Este año las decisiones ya no terminan en vos…» (copia de 4.º) | «El último marzo · El último año · Todo lo que decidiste hasta acá viene con vos: el curso ya sabe cómo resolvés. Este año cierra el recorrido, y también empieza a asomar lo que viene después.» | Sí: corrige identidad de año (C01) | Espina LOCKED de 5.º: cierre/futuro sin test vocacional. |
| y1.closing | «…Este recorrido de práctica termina acá: segundo todavía no está disponible.» | frase eliminada | Sí: corrige afirmación falsa (C02) | 2.º existe y sigue. |
| y2–y5.closing | «Diciembre · Cierra N · (afirma que el año terminó)» | momento del año sin posición fija («En el curso · Alguien lo empuja», «Entre semana · La agenda es tuya», «En el curso · Alguien lo sostiene», «Último año · Lo que queda escrito») | Sí, deliberado | El selector los elige después de la intro (prioridad 90) en la mayoría de las seeds; afirmaban un cierre que no había ocurrido. Reordenarlos rompe el replay (ver `progression-ux.md`). El cierre real lo pone `YearMilestone`. |
| g7.intro | «…en el pizarrón ya anunciaron la feria de fin de año.» | «…Lo primero que hay que aprender es cómo llegar a horario.» | No (ambientación) | La feria (mural/stand) es DEV-only y no llega al público; el colectivo sí es siempre el anchor de 7.º. |
| yN.review (1.º–5.º) | «Antes de cerrar primero quedó algo dando vueltas…» | «Quedó algo dando vueltas…» + eyebrow «Antes de cerrar N.º» | No | Notación de años unificada; el texto no se dibuja en la pantalla del Repaso, sólo el eyebrow. |

## Componentes

| Superficie | Antes | Después | Meaning changed | Rationale |
|---|---|---|---|---|
| Botón de continuar | «Seguir» siempre | intención derivada: Empezar 7.º / Seguir / Ir al Repaso / Pasar a N / Ver mi egreso / Cerrar N | No: mismo comando `CONTINUE`; el motor decide igual | §31–35, §44, §80. La predicción se compara contra el motor en `progression-copy.test.ts` para dos carreras completas. |
| Hito de año | no existía | `YearMilestone` en la misma pantalla, antes del CTA | No: presentación pura, sin estado ni acción | §35–38, §72–73. |
| Notas del Repaso | «Un único Repaso cierra lo que quedó pendiente este año, aunque la respuesta no salga completa.» | «Quedó algo dando vueltas este año. Lo cerrás acá, con una cuenta más corta; salga como salga, el año sigue.» | No: un solo Repaso, cierra igual, no es reintento | C23; primero qué pasó y qué hacer. |
| Debrief | «Se comenta acá; no se practica en otra interacción.» | «Esto se explica acá y se cierra con el mismo Repaso; no hay otra situación para practicarlo.» | No | C24; sin vocabulario de implementación. |
| Rechazo del motor | «El motor rechazó la acción: {kind}» | «No se pudo aplicar esa acción. Probá de nuevo. ({kind})» | No; diagnóstico conservado | C26. |
| Epílogo (fair) | «El puesto oficial se publica con el cierre de la edición.» | «Tu puntaje verificado aparece más abajo. En el ranking cuenta tu mejor partida.» | No: ranking vivo por mejor intento verificado (ADR-009, freeze) | C22/H07: la frase anterior contradecía el ranking visible en la portada. |
| Verificación | «El servidor está volviendo a jugar tu partida… Tarda unos segundos.» | «Verificando tu partida…» / «Cuando termine, vas a ver tu puntaje acá.» | No: sigue sin mostrar puntaje antes de verificar | C18. |
| Ranking vacío (abierto) | «El podio está por escribirse. / El primer puesto está libre…» | «Todavía no hay puestos. / Nadie tiene todavía una partida verificada. Jugá una y tu puntaje aparece acá.» | No | C09: sin urgencia de primer premio. |
| Identidad | «¿Cómo querés aparecer? / Si ya jugaste antes, completá los mismos datos y seguís siendo vos.» | «Elegí cómo aparecer en el ranking / Después van unos datos para validar que sos vos. Si ya jugaste antes, completá los mismos y seguís con tu alias.» | No: campos, obligatoriedad y reingreso intactos (ADR-026) | C12/C13. |

## Lo que no cambió (y se comprobó)

- Ningún número, unidad, porcentaje, precio, horario, medida, opción, fórmula
  ni restricción cuantitativa en `src/content` (diff revisado línea por línea:
  ver `verification.md`).
- Catálogos aprobados, versiones de motor/contenido/ruleset/score, RunPlan,
  fingerprints, ScorePolicy, RecoveryPolicy, RNG y action log.
- Base de datos, APIs, sesión, privacidad, lifecycle de competencia, aislamiento
  de práctica.
