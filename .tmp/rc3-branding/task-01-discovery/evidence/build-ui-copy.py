from pathlib import Path
import json,runpy
O=Path('.tmp/rc3-branding/task-01-discovery')
j=json.loads((O/'evidence/catalog.json').read_text())
def table(h,rows):
 def c(s): return str(s).replace('|',' / ').replace('\n',' ')
 return '| '+' | '.join(h)+' |\n|'+'|'.join(['---']*len(h))+'|\n'+'\n'.join('| '+' | '.join(map(c,r))+' |' for r in rows)+'\n'
def write(n,s):(O/n).write_text(s.strip()+'\n')
# id, source symbol, audience, purpose, hierarchy, density, finding, branding, asset, risk, priority,status
rows=[
('ui.home','src/components/competition/competition-experience.tsx:CompetitionExperience','public/player','Entrada, ranking y CTA','Eyebrow → marca → promesa → prosa → estado → ranking → acción','alta','Gran volumen antes de Jugar en una hoja angosta; revisar lectura a 320 px','Jerarquizar marca y acción conservando 412 px','brand.logo-primary','medio','P0','ACTIVE'),
('ui.hero','src/components/competition/competition-experience.tsx:header','public','Presentar experiencia','Wordmark y dos párrafos; sin ilustración','media','La prosa promete mural y grupo, excluidos de la carrera pública','Mostrar decisiones de escenas activas','brand.hero','medio','P0','ACTIVE · hero textual'),
('ui.status-open','src/components/competition/competition-experience.tsx:CompetitionStatusNote','public','Comunicar ventana abierta','Callout nombre + reglas + fecha','alta','Repite reglas cerca de RankingRule; servidor es término técnico','Separar ventana de explicación competitiva','Ninguno','alto','P1','ACTIVE'),
('ui.status-upcoming','src/components/competition/competition-experience.tsx:CompetitionStatusNote','public','Apertura futura','Callout nombre y fecha o espera','baja','formatDate usa zona del navegador; no asumir reloj argentino','Fecha legible; no activar Jugar desde reloj cliente','Ninguno','alto','P1','ACTIVE'),
('ui.status-closed','src/components/competition/competition-experience.tsx:CompetitionStatusNote','public','Competencia cerrada','Callout + ranking publicado; sin iniciar','baja','Mantener diferencia cierre/resultado verificado','Persistir encabezado de evento','Ninguno','alto','P1','ACTIVE'),
('ui.not-configured','src/components/competition/competition-experience.tsx:CompetitionStatusNote','public/docente','Ausencia de edición','Callout y explicación al docente','media','Detalle operativo en superficie estudiantil','Mensaje breve y coherente con estado','Ninguno','medio','P2','ACTIVE'),
('ui.countdown','src/components/competition/competition-experience.tsx:CompetitionStatusNote','public','Posible tiempo hasta apertura/cierre','No implementado; existen opensAt/closesAt','baja','No existe fuente serverNow en DTO; reloj local puede divergir','Sólo orientación, nunca autoridad ni timer de juego','Ninguno; texto tabular','alto','P1','PROPOSED · NO EXISTE'),
('ui.self','src/components/competition/competition-experience.tsx:greeting','player','Reconocer sesión','Hola alias → mejor puntaje/puesto','media','No confundir mejor intento con intento actual','Destacar identidad pseudónima sin avatar real','Ninguno','alto','P1','ACTIVE'),
('ui.identity','src/components/competition/identity-form.tsx:IdentityForm','player','Alta y reingreso','Alias → campos privados → aviso → reconocimiento → Empezar','alta','Heading parece hablar sólo del alias; formulario completo requiere jerarquía','Marca sobria; sin hero adicional que empuje campos','brand.logo-horizontal opcional','alto','P1','ACTIVE'),
('ui.privacy','src/components/competition/privacy-summary.tsx:PrivacySummary','player','Informar tratamiento','Resumen visible → details → versión; checkbox separado','alta','No colapsar resumen al hacer polish','Conservar lectura y contraste; sin decoración','Ninguno','alto','P0','ACTIVE'),
('ui.identity-errors','src/components/competition/identity-form.tsx:errors/visible','player','Corregir campos','Error al blur/envío, primer inválido enfocado','media','No sustituir texto por rojo ni quitar explicación de disabled','Jerarquía de error consistente con Field','Ninguno','alto','P1','ACTIVE'),
('ui.leaderboard','src/components/competition/leaderboard.tsx:Leaderboard','public','Mostrar podio por puestos','Título → total → ol de filas','media','Una lista de empatados puede superar tres filas; ancho alias largo','Renglones editoriales; puesto escrito siempre','global.ranking-foundation','alto','P0','ACTIVE'),
('ui.leaderboard-empty','src/components/competition/leaderboard.tsx:entries.length','public','Ausencia de verificados','Título y párrafo','baja','“Primer puesto libre” puede sugerir premio por llegar antes','Claridad sin falsa urgencia','global.ranking-foundation','medio','P1','ACTIVE'),
('ui.own-ranking','src/components/competition/leaderboard.tsx:you.rank','player','Ubicar propio resultado','Fondo neutro + (vos); texto fuera de lista','baja','Condición rank > entries.length merece caso de empate; no rediseñar ranking para ocultarlo','Marca textual (vos), no sólo color','global.ranking-foundation','alto','P0','ACTIVE'),
('ui.ranking-rule','src/components/competition/competition-experience.tsx:RankingRule','public','Explicar empate','Caption después del ranking','media','Regla central en tamaño pequeño','Ubicación legible sin repetir párrafos','Ninguno','alto','P1','ACTIVE'),
('ui.session-actions','src/components/competition/competition-experience.tsx:mt-auto','player','Jugar, volver, cambiar participante','Primario Jugar y secundarios Volver/No soy yo','baja','No convertir “No soy yo” en borrado de participación','Consistencia del slot y foco','Ninguno','alto','P1','ACTIVE'),
('ui.load','src/components/competition/competition-experience.tsx:AttemptRun.loading','player','Esperar chunk de juego','Texto role=status','baja','Sin marca; evitar spinner ornamental y promesa de tiempo exacto','Marca compacta discreta','brand.logo-mark opcional','bajo','P2','ACTIVE'),
('ui.network-error','src/components/competition/competition-experience.tsx:readError','player','Reintentar operación','Callout único; formulario recibe error cuando está visible','media','Copy genérico; no afirmar pérdida de datos sin evidencia','Mantener causa y acción separadas','Ninguno','medio','P1','ACTIVE'),
('ui.game-shell','src/components/game/game-shell.tsx:GameCanvas/GameSheet/StageHeader','player','Ubicar etapa y avance','412 px → h1 etapa → celdas → contenido','baja','No estirar desktop ni insertar un encabezado grande','Firma compacta sólo si no compite con etapa','brand.logo-horizontal opcional','medio','P0','ACTIVE'),
('ui.career','src/components/game/career-strip.tsx:CareerStrip','player','Estado de carrera','Stats establecidos; Estilo compacto; Aura diferenciada','baja','No rellenar dimensiones ausentes con cero','Tokens y gramática actual','SVG Estilo/Aura existentes','alto','P1','ACTIVE'),
('ui.narrative','src/components/game/run-view.tsx:NarrativeCard branch','player','Aperturas y marcos','Eyebrow → título → prosa → Seguir','media','y5.intro duplica cuarto; y1.closing dice que segundo no existe','Distinguir años por texto, no seis skins','Sin raster GRADE','medio','P1','ACTIVE'),
('ui.challenge','src/components/game/challenge-frame.tsx:ChallengeFrame','player','Contexto y decisión','Contexto → datos → objetivo → controles','alta','SceneMedia no está conectado; arte puede bajar datos y CTA','Una escena neutral como máximo cuando ayuda','Escenarios del manifiesto','alto','P1','ACTIVE'),
('ui.feedback','src/components/game/feedback-panel.tsx:FeedbackPanel','player','Consecuencia razonada','Resultado → glifo/palabra → cuenta → comparación → consecuencia → cambios','alta','Mucho contenido legítimo; distinguir prosa de evidencia','Conservar marcas sobre dato, no tarjetón ilustrado','Ninguno','alto','P1','ACTIVE'),
('ui.recovery','src/components/game/run-view.tsx:review-notes','player','Cerrar obligaciones','Repaso y notas → desafío → feedback','alta','Explica debrief con vocabulario de implementación','Preservar práctica/debrief; no vidas ni penalización inventada','Reusa escena origen; preferir cero raster','alto','P2','ACTIVE'),
('ui.transitions','src/components/game/run-view.tsx / src/content/grade-*/storylets.ts','player','Cambio de año','NarrativeCard + StageHeader actualizado','media','No existe un YearResult por cada año de feria','Misma gramática, contenido propio','GRADE: cero archivos nuevos','medio','P1','ACTIVE'),
('ui.rare','src/game/runs/transition.ts:activeChallengeView; src/components/game/career-epilogue.tsx','player','Recordar evento raro','rareNote en view no montada; recuerdo condicional al final','media','No confundir capacidad del motor con banner implementado','Reusar contexto; no nuevo popup ni beat','EVENT: cero archivos nuevos','alto','P2','ACTIVE sólo si seleccionado en epílogo'),
('ui.ending','src/components/game/career-epilogue.tsx:CareerEpilogueView','player','Egreso y memoria','Egresado → perfil → recuerdos → registro → hitos → acción','alta','Pantalla larga seguida del puntaje; egreso no es ganar','Conservar orden canónico, jerarquía de cierre','ending.foundation','alto','P0','ACTIVE'),
('ui.verification-pending','src/components/competition/verification-panel.tsx:idle/verifying','player','Esperar resultado autoritativo','Bajo epílogo, status + explicación','media','Explica replay técnicamente; queda después de Jugar de nuevo del epílogo','Estado visible y sobrio','Ninguno','alto','P1','ACTIVE'),
('ui.verification-result','src/components/competition/verification-panel.tsx:verified','player','Puntaje oficial y personal best','Etiqueta → cifra → mejor intento → acciones','media','Acciones duplican Jugar de nuevo del epílogo','Priorizar diferencia entre carrera y score','ending.foundation','alto','P0','ACTIVE'),
('ui.verification-error','src/components/competition/verification-panel.tsx:failed/rejected','player','Reintento o rechazo','Callout → acciones distintas por estado','media','No tratar fallo temporal como trampa ni prometer ingreso al ranking','Preservar estados sin iconos de culpa','Ninguno','alto','P1','ACTIVE'),
('ui.storage-warning','src/components/competition/attempt-run.tsx:storageWarning','player','Informar checkpoint fallido','Callout sobre gameplay','media','No tapar interacción ni quitar condición de recarga','Conservar mensaje y continuidad','Ninguno','alto','P2','ACTIVE'),
('ui.organizer','src/app/organizer/page.tsx; src/components/competition/organizer-console.tsx','organizer','Acceso y operación','Heading → login o tablero → acciones → datos privados','alta','Branding escaso; alcance RC3 limitado a firma y tokens','Firma global sin tocar permisos/acciones','brand.logo-horizontal opcional','alto','P2','ACTIVE'),
('ui.footer','src/app/layout.tsx; src/components/competition/competition-experience.tsx','public','Posible pie persistente','No footer global implementado','baja','No inventar responsables o patrocinadores; privacidad hoy está en identificación','Pie breve con marca; datos institucionales documentados si aprobados','brand.logo-horizontal','medio','P0','PROPOSED · NO EXISTE'),
('ui.metadata','src/app/layout.tsx; src/app/page.tsx; src/app/manifest.ts','public','Pestaña, instalación, compartir','Título/descripción/manifest; sin iconos ni OG explícitos','baja','Falta compact mark; no poner información de sesión en OG','Nombre coherente y derivados','brand.favicon; brand.social-mark','medio','P0','ACTIVE metadata / iconos ausentes'),
('ui.fallbacks','src/app (sin error.tsx/loading.tsx/not-found.tsx personalizados)','public','404/error de framework','Fallbacks de Next; no branding propio localizado','baja','No afirmar que existe una 404 diseñada','Marca y vuelta a inicio en futura superficie si se acota','brand.logo-mark opcional','medio','P2','DEFAULT FRAMEWORK'),
('ui.dev','src/app/dev/{design-system,game-engine,grade-7,teacher-gate}/page.tsx','developer/docente','Inspección/demos','Harnesses y vitrina; YearResult en slice','alta','No exportar copy “años en construcción” a carrera pública','Usar vitrina como comparación; no producir arte demo ahora','4 escenarios DEV diferidos','bajo','P2','DEV-ONLY'),
]
s='''# Inventario de superficies UI

Auditoría de rutas, ramas de render y tests existentes; **no se navegó producción ni se ejecutó QA visual de navegador en esta tarea**. Las debilidades de layout son inferencias del código que TASK-02→06 deben confirmar a tamaño real. Capturas en `docs/09-design-system/reference/` son referencia histórica, no evidencia del RC.2 renderizado hoy.

Las 36 filas son unidades de auditoría: incluyen 3 oportunidades que no existen (countdown, footer y personalización de fallbacks) y estados de componentes compartidos; **no son 36 rutas ni 36 páginas implementadas**. Rutas de página actuales: `/`, `/organizer` y cuatro `/dev/*`. No existen `/jugar`, `/ranking`, `/privacy` ni una ruta separada de ending. API JSON y health no son superficies de branding.

'''
s+=table(['Surface ID','Route/component / source','Audience','Purpose','Current hierarchy','Copy density','Visual weakness','Branding opportunity','Asset opportunity','Risk','Priority','Status'],rows)
s+='''
## Modos de interacción: cobertura completa sin imágenes de solución

Todos pasan por `src/components/game/interaction-area.tsx:InteractionControls`. Se separa `InteractionKind` del motor de composición: hay once kinds presentes en las 42 Templates, aunque el modelo de producto agrupa cinco motores. Los modos adicionales de fixtures no justifican assets RC3.

'''
modes={
'numeric-input':('numeric-answer.tsx','Entrada con unidades; mínimo/máximo y formato son información protegida'),
'decision-card':('option-list.tsx','Radios; seleccionar no revela calidad'),
'timeline':('option-list.tsx','Horarios de salida; no dibujar una línea temporal que regale la resta'),
'number-grid':('number-grid.tsx','Reglas y casillas 56 px; las celdas no son fondo decorativo'),
'assignment-board':('assignment-board.tsx','Asignación semántica y select nativo; no preasignar personas en arte'),
'budget-builder':('budget-builder.tsx','Packs y cantidades; no calcular el total por rediseño'),
'quantity-builder':('budget-builder.tsx','Recursos/capacidad; no convertir wheel en ruleta animada'),
'spatial-layout':('spatial-layout.tsx','Grilla y controles X/Y/orientación; arte nunca plano solucionado'),
'schedule-builder':('schedule-builder.tsx','Bloques y ventanas; no colorear factibilidad antes de confirmar'),
'classification':('classification.tsx','Afirmaciones y categorías; puede incluir comunicación/preferencia separada'),
'route-builder':('route-builder.tsx','Orden de lugares y datos de trayecto; no completar ruta con ilustración')}
rs=[]
for k,(p,notes) in modes.items():rs.append([k,sum(t['interaction']==k for t in j['templates']),'src/components/game/interactions/'+p,notes,'Alta; sin raster de datos; imagen sólo contextual'])
s+=table(['Kind','Templates (incluye dev/recovery)','Componente','Regla de revisión','Densidad/asset'],rs)
s+='''
## Responsive y accesibilidad observados en la implementación

`tokens.css`: ancho normal 412 px, reserva wide 560 px; cuadrícula 16 px, hit targets 44/52/56 px. `base.css`: piso de 320 px, safe areas, foco 2 px separado 2 px, reduced-motion global. Shell centra en desktop; no hay un layout desktop ancho que deba preservarse. Tailwind 4 conserva sus breakpoints predeterminados; `SceneMedia` usa `sm` (40rem/640px en el theme instalado), 3:2 abajo y 16:9 arriba, `sizes` hasta 412px. No hay media-query que haga desktop a 1200px por producto.

Inventario de QA futuro: 320, 360, 390, 412, 430, 768 y 1280 px; zoom 200%; teclado; reduced-motion; pantalla vertical baja; alias largo; empates grandes; aviso legal expandido; todas las ramas del resultado; sin red y sin almacenamiento. Las grillas pueden scrollear dentro de región accesible, nunca la página por culpa de una imagen. Mantener controles nativos, foco del feedback y errores asociados. La revisión manual con VoiceOver/NVDA sigue pendiente en docs; TASK-01 no la certifica.
'''
write('02-ui-surface-inventory.md',s)
# Current text, issue, class, direction, invariants, source. Exactly two rewritten examples follow.
copy=[
('Cuarto año [en y5.intro]','P0: apertura de quinto duplicada de cuarto, incluido todo el párrafo','FREE-NARRATIVE','Corregir identidad de año y revisar prosa del cierre de carrera','StageId, flags, pesos, condiciones, orden de beats','src/content/grade-5/storylets.ts:grade5IntroId'),
('Este recorrido de práctica termina acá: segundo todavía no está disponible.','P0: se muestra y1.closing también en carrera completa; contradice los años que siguen','FREE-NARRATIVE','Separar afirmación de final del harness y transición de carrera, sin cambiar scheduling','Storylet ID, effects, progression; no retirar el beat','src/content/grade-1/storylets.ts:y1.closing'),
('Comprás la pintura del mural… repartís el trabajo grupal.','P0: home anuncia dos Templates excluidas de la carrera pública','FREE-NARRATIVE','Usar decisiones verificadas de la carrera activa; ver ejemplo A','No prometer que todas las escenas salen en una run','src/components/competition/competition-experience.tsx:header'),
('Seis años de secundaria en unos minutos.','7.º es grado, no año de secundaria; duración sin evidencia humana','FREE-NARRATIVE','Nombrar recorrido de 7.º a 5.º; no prometer duración exacta','Seis etapas; objetivo temporal no es timer ni score','src/components/competition/competition-experience.tsx:header'),
('Juego de matemática escolar','Puede hacer que la puerta parezca examen; hipótesis de tono','FREE-NARRATIVE','Probar framing de decisiones cotidianas junto al nombre','No ocultar intención educativa ni prometer certificación','src/components/competition/competition-experience.tsx:Eyebrow'),
('El 60 viene con demora otra vez.','Numeración específica sin respaldo local en el repo; no era línea 42','FREE-NARRATIVE','Neutralizar número de línea manteniendo el colectivo','Números de viaje, porcentajes, horario y objetivo son MATHEMATICALLY-LOCKED','src/content/grade-7/challenges/bus-timing.ts:narrate; bus-latest-departure.ts:narrate'),
('Jugás la carrera entera… y el servidor calcula tu puntaje. Podés jugar todas las veces que quieras…','Densidad en estado abierto; mezcla ventana, mecánica y regla','COMPETITIVE','Jerarquizar ventana y mejor intento; explicar verificación en lenguaje de jugador','Mejor VERIFICADO, intentos ilimitados, autoridad servidor','src/components/competition/competition-experience.tsx:CompetitionStatusNote'),
('Ordena el puntaje de la partida. Si dos personas empatan, comparten el puesto…','Copy preciso pero largo para caption; no debe perderse','COMPETITIVE','Conservar regla visible y contraste; recorte sólo equivalente','Sin velocidad ni orden de llegada; no inventar desempate','src/components/competition/competition-experience.tsx:RankingRule'),
('Todavía no hay partidas verificadas. El primer puesto está libre.','Puede sugerir ventaja por ser primero','COMPETITIVE','Invitar a jugar sin urgencia de primer premio','No hay resultado antes de verificación','src/components/competition/leaderboard.tsx:empty'),
('1 participante con partida verificada / N participantes con partida verificada','Repetición de verificado en ranking y sesión','COMPETITIVE','Agrupar significado, conservar conteo de participantes','No contar intentos como personas','src/components/competition/leaderboard.tsx:total'),
('Tu mejor puntaje… · puesto… / Tu puesto:…','Puede parecer resultado de última run','COMPETITIVE','Explicitar mejor intento cuando convivan ambas cifras','Usar DTO del servidor; puesto compartido y es-AR','src/components/competition/competition-experience.tsx:greeting; leaderboard.tsx'),
('¿Cómo querés aparecer?','Heading sólo cubre alias; luego solicita identificación privada','SEMI-PROTECTED','Separar alias público y validación privada con jerarquía existente','Campos, obligatoriedad, reingreso, privacidad','src/components/competition/identity-form.tsx:heading'),
('Si ya jugaste antes, completá los mismos datos y seguís siendo vos.','Puede sugerir que cambia alias al reingresar','SEMI-PROTECTED','Aclarar continuidad de participación según comportamiento existente','Mismo documento/nombre, alias original conservado','src/components/competition/identity-form.tsx; src/server/competition/participants.ts'),
('Nombre y apellido / DNI / Año o curso / División','Protegido: no convertir polish en rediseño de identidad','LEGAL/PRIVACY','Conservar etiquetas, orden lógico y división condicional','ADR-026; no eliminar ni agregar datos por brief visual','src/components/competition/identity-form.tsx'),
('Sólo los números. No guardamos el documento completo.','Ayuda esencial; no quitar por bajar densidad','LEGAL/PRIVACY','Mantener junto al campo','No afirmar anonimato absoluto ni ausencia de derivación HMAC','src/components/competition/identity-form.tsx:DNI'),
('Tus datos / Más información / Leí para qué se piden estos datos y quién los usa.','Aviso en dos capas; reconocimiento no equivale a consentimiento genérico','LEGAL/PRIVACY','Mejorar espacio sin reescritura creativa','Contenido, responsable, versión, retención de config; no inventar institución','src/components/competition/privacy-summary.tsx; src/server/competition/privacy-notice.ts:buildPrivacyNotice'),
('No soy yo','Acción corta y clara; riesgo si se renombra como borrar cuenta','SEMI-PROTECTED','Conservar significado; no requiere cambio por sí mismo','Cierra sesión del dispositivo; no borra participación','src/components/competition/competition-experience.tsx:forget'),
('El servidor está volviendo a jugar tu partida para calcular el puntaje. Tarda unos segundos.','Explica implementación; duración no garantizada','SYSTEM','Describir validación pendiente y finalidad; ver ejemplo B','No mostrar puntaje oficial ni ranking confirmado todavía','src/components/competition/verification-panel.tsx:verifying'),
('Esta partida no entra al ranking','Rechazo real distinto de red caída; tono no acusatorio correcto','COMPETITIVE','Preservar distinción y acción disponible','No convertir failed en rejected ni prometer aprobación al reintentar','src/components/competition/verification-panel.tsx:rejected'),
('Es tu mejor partida hasta ahora. Es la que cuenta en el ranking.','Correcto; no agregar victoria o podio sin dato','COMPETITIVE','Jerarquía clara con resultado actual','result.personalBest y score verificado','src/components/competition/verification-panel.tsx:personal-best'),
('Jugar de nuevo [epílogo y panel verificado]','Acción duplicada y primera visible antes de verificación','SEMI-PROTECTED','Revisar jerarquía y posición, sin cambiar emisión/submit','No perder log pendiente; autoridad y lifecycle intactos','src/components/game/career-epilogue.tsx; src/components/competition/verification-panel.tsx'),
('El puesto oficial se publica con el cierre de la edición.','Puede confundirse con ranking vivo ya visible en home','COMPETITIVE','Diferenciar ranking provisional, resultado verificado y cierre; confirmar terminología con contrato','No alterar publicación/ranking por arreglar prosa','src/components/game/career-epilogue.tsx:epilogue.mode'),
('Un único Repaso cierra lo que quedó pendiente este año, aunque la respuesta no salga completa.','Largo pero semántica esencial de fail-forward','SEMI-PROTECTED','Acortar sólo con equivalencia; no prometer dominio de todo','Un Repaso; no suma FairScore; egreso independiente del score','src/components/game/run-view.tsx:review-notes'),
('Se comenta acá; no se practica en otra interacción.','Vocabulario interno “interacción”','SEMI-PROTECTED','Lenguaje de juego que mantenga diferencia entre practicar y recordar','Debrief no es segundo ejercicio; no borrar obligaciones','src/components/game/run-view.tsx:review-debrief'),
('Repaso del año [repetido en cinco años]','Consistencia útil; puede sonar genérico, no exige cinco reescrituras','SEMI-PROTECTED','Diferenciar por contexto real del origen, sin inventar diagnóstico','Textos de debrief con matemática protegida','src/content/grade-1…5/storylets.ts; index.ts:recovery'),
('El motor rechazó la acción: {kind}','Jerga técnica y enum interno en pantalla de jugador','SYSTEM','Explicación accionable conservando diagnóstico fuera del copy principal','No ocultar rechazo ni despachar de nuevo como efecto del mensaje','src/components/game/run-view.tsx:lastRejection'),
('Preparando la partida… / Un momento…','Estados breves adecuados; no agregan marca por sí solos','SYSTEM','Conservar estado accesible y evitar espera indefinida sin contexto','role=status; disabled; carga dinámica','src/components/competition/competition-experience.tsx; identity-form.tsx'),
('No se puede guardar el avance… si recargás la página vas a perder el avance.','Consecuencia importante; no reducir a icono','SYSTEM','Mantener aviso antes de recargar; no alarmar sobre DB','Puede continuar localmente; no afirmar guardado exitoso','src/components/competition/attempt-run.tsx:storageWarning'),
('Un aula que funcione: objetivo con capacidad, ideal, columnas, pasillos, puertas y caja','Alta densidad porque contiene múltiples condiciones, no relleno','MATHEMATICALLY-LOCKED','Jerarquizar segmentos preservando todas las restricciones','Medidas, capacidad, accesibilidad del plano, opcionalidad','src/content/grade-1/challenges/classroom-layout.ts:narrate'),
('La primera expo: fases, horas, roles, visual, reserva y pedidos de integrantes','Instrucción larga; personas cambian por variante','MATHEMATICALLY-LOCKED','Mejorar lectura sin eliminar condición ni fijar elenco','Nombres que desambiguan datos, responsabilidades, horas y preferencias','src/content/grade-1/challenges/course-project-expo.ts:narrate'),
('Proyecto del Curso: la feria de tecnología / la muestra final','Títulos largos dentro de 412 px; nombre del arco se repite en eyebrow','FREE-NARRATIVE','Evaluar título corto sin perder ubicación del arco','No cambiar recurringArc, título de datos o significado del problema','src/content/grade-3/challenges/course-project-tech.ts; src/content/grade-5/challenges/course-project-final.ts'),
('Lo que no se cumplió / facts / optimalComparison / consequence','Resultado mezcla evidencia y relato; no todo es copy libre','MATHEMATICALLY-LOCKED','Separar visualmente cuenta, restricción y consecuencia','Facts, unidades, comparación y motivo de tier; relato sólo si no cambia causalidad','src/components/game/feedback-panel.tsx; src/content/grade-*/challenges/*.ts:evaluate'),
('El año que viene: Después, si querés, decí cuál te gustaría.','Preferencia opcional personal no debe parecer examen vocacional','SEMI-PROTECTED','Conservar opcionalidad y tono abierto','Viabilidad se evalúa, gusto no; no agregar opción recomendada como correcta','src/content/grade-5/challenges/next-step-options.ts:narrate'),
('Por ahora Egresado llega hasta acá. Los años siguientes están en construcción.','Obsoleto si se interpreta como producto completo; hoy YearResult es dev','FREE-NARRATIVE','Etiquetar alcance de demo; no migrar frase a fair','No confundir harness con producción','src/components/game/year-result.tsx:YearResult'),
('Arranca séptimo / El mismo lugar, otra forma / Segundo año / Tercer año / Cuarto año','Tono variable entre escena y etiqueta administrativa','FREE-NARRATIVE','Homogeneizar voz argentina sin borrar evolución narrativa','Etapa y cronología, flags y callbacks','src/content/grade-*/storylets.ts'),
('Egresado — un juego sobre decidir en la escuela / Juego web de decisiones y desafíos matemáticos','Descripciones próximas con tonos distintos','FREE-NARRATIVE','Unificar promesa en home, layout y manifest','Nombre propio y es-AR; ninguna certificación humana no acreditada','src/app/page.tsx; src/app/layout.tsx; src/app/manifest.ts'),
]
s='''# Auditoría de copy

**36 registros de revisión**, con problemas, textos que deben conservarse y fronteras protegidas. No es el copy pass final y no se editó ningún texto de producto. `CURRENT` usa cita exacta corta o un fragmento explícitamente abreviado; las cadenas completas y ejemplos por Template están en `evidence/catalog.json` y las fuentes citadas.

Prioridad de corrección: identidad de 5.º, falso final de 1.º (ambos confirmados en runs locales), promesa de home y lenguaje de verificación. No tratar una limitación de UI como regla de ranking ni corregir el motor desde un copy pass.

## Clasificación editorial

| Clase | Puede cambiar | Debe preservar |
|---|---|---|
| FREE-NARRATIVE | Ambientación, encabezados y CTA | Contexto, identidad de año, causalidad; sin nuevas promesas de gameplay. |
| SEMI-PROTECTED | Instrucción funcional y navegación | Acción exacta, requisitos, consecuencias, opcionalidad. |
| MATHEMATICALLY-LOCKED | Sólo presentación equivalente comprobada | Datos, unidades, comparadores, umbrales, ventanas, costos, restricciones, soluciones, explicación y tiers. |
| LEGAL/PRIVACY | Espaciado y jerarquía | Aviso, versión, responsable/configuración, reconocimiento, alcance público/privado. |
| SYSTEM | Lenguaje claro de estado/error | Estado real, recuperabilidad, acción segura, diagnóstico conservado. |
| COMPETITIVE | Claridad y jerarquía | Puntaje verificado, mejor intento, puestos compartidos, lifecycle, sin velocidad. |

Una cadena puede mezclar clases: gana la más restrictiva por fragmento. `setup` no es automáticamente libre: puede contener la única cifra o condición necesaria. `goal`, opciones, leyendas, filas de datos, restricciones y feedback matemático quedan protegidos en las 42 Templates, incluidas recuperaciones y dev. No copiar un ejemplo numérico del audit a todas las variantes.

'''
s+=table(['ID','CURRENT','PROBLEM','CLASSIFICATION','RECOMMENDED DIRECTION','DO NOT CHANGE','SOURCE'],[[f'C{i:02d}',*r] for i,r in enumerate(copy,1)])
s+='''
## Dos ejemplos de dirección, todavía propuestos

A. Home: “Organizá una salida, prepará la muestra del curso y decidí cómo llegar a tiempo. Recorré de 7.º a 5.º tomando decisiones con números.” Se eligen contextos públicos y no se promete que todos salgan en cada seed.

B. Verificación: “Estamos verificando tu partida. Cuando termine, vas a ver tu puntaje.” Preserva la espera y evita prometer segundos exactos o explicar replay.

## Matriz de protección por Template

La tabla siguiente cubre cada Template. Los campos computados completos (`data`, opciones, categorías, instrucciones, rangos, unidades) están en la `presentation` de `catalog.json`. **“Revisar título/setup” no autoriza tocar el archivo entero.** `evaluate`, `generate`, `scoring`, `variantSource`, `composition`, IDs, flags y catálogos quedan fuera de TASK-04.

'''
s+=table(['Template','Título actual','Título / setup','Objetivo, present y evaluate','Ámbito'],[[t['id'],t['narrative']['title'],'FREE-NARRATIVE sólo contexto sin cifras; setup mixto requiere revisión por fragmento','MATHEMATICALLY-LOCKED; acciones SEMI-PROTECTED; preferencias personales separadas','ACTIVE' if t['publicEligible'] else 'DEV-ONLY'] for t in j['templates']])
s+='''
## Localización: Resistencia, Chaco, Argentina

La voz actual ya usa voseo y léxico cercano: colectivo, curso, compañeros, escuela, feria, peña, pecheras, profe, preceptor. Conservarlo sin saturar de “che” ni infantilizar a 12–17. Evitar importar “autobús”, “instituto” como sustituto automático, “vosotros”, GPA o promociones deportivas ajenas.

La referencia encontrada es **el 60**, no “línea 42”. No hay evidencia en el contenido que vincule ese número con una línea de Resistencia. Proponer neutralización; no afirmar que esa línea no existe ni sustituirla por otra real sin investigación. El contexto local puede comunicarse con escuela y barrio cotidianos, sin calles, comercios, uniformes, destinos de viaje ni monumentos inventados. La institución y la ventana de feria están documentadas en el handoff de deployment; eso no habilita rasterizar el escudo ni replicar datos del responsable como marca.

Fechas y precios del problema son datos matemáticos, no datos de mercado que haya que “actualizar”. Mantener pesos es-AR y nombres que desambiguan participantes. Alex/Dani/Sam varían por Template/variante; Lucas/Sofía/Mateo/Vos existen en g7.group-tasks. No renombrar el elenco como parte de una localización general.

## Contradicciones y freeze

ADR-026 aceptado y `IdentityForm` piden nombre/apellido y DNI derivado, aunque la guía general inicial del repositorio describa anonimato sin apellido. Se documenta la discrepancia y se preserva la implementación aceptada: no quitar campos ni cambiar privacidad en RC3. No se reescribe asesoría legal.

`narrative-system.md` y partes de la especificación aún dicen “no implementado” para capacidades que sí existen; no usar esas etiquetas para inventar nuevos epílogos. El brief histórico de cuadernos no describe la computadora actual.

La auditoría matemática lee textos de presentación en algunos tests. Un cambio de copy puede alterar fingerprints de vistas/snapshots o romper oráculos aunque no cambie un número. TASK-04 debe demostrar equivalencia y respetar el freeze; **nunca regenerar catálogos, huellas o goldens sólo para que el gate pase**. La categoría editorial no promete compatibilidad técnica automática.
'''
write('03-copy-audit.md',s)
write('evidence/ui-copy-counts.json',json.dumps({'uiSurfaces':len(rows),'interactionKinds':len(modes),'copyRecords':len(copy)},indent=2))
print(len(rows),len(copy))
