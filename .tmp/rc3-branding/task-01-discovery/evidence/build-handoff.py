from pathlib import Path
import json,re,struct,subprocess,collections
ROOT=Path.cwd(); OUT=ROOT/'.tmp/rc3-branding/task-01-discovery'
j=json.loads((OUT/'evidence/catalog.json').read_text())
reach=json.loads((OUT/'evidence/reachability.json').read_text())
def write(name,s): (OUT/name).write_text(s.strip()+'\n')
def table(headers,rows):
 def cell(v): return str(v).replace('|',' / ').replace('\n',' ')
 return '| '+' | '.join(headers)+' |\n|'+'|'.join(['---']*len(headers))+'|\n'+'\n'.join('| '+' | '.join(map(cell,r))+' |' for r in rows)+'\n'
def source(t):
 for p in sorted((ROOT/'src/content').glob('grade-*/challenges/*.ts')):
  s=p.read_text(); pattern="'"+t['id']+"'"
  if pattern in s:
   pos=s.index(pattern); line=s[:pos].count('\n')+1
   symbols=re.findall(r'export const (\w+) = defineChallenge',s[:pos]); return str(p.relative_to(ROOT)),'narrate / present ('+t['id']+')',line
 raise ValueError(t['id'])
# Curated visual contexts: no mathematical parameters, solutions or person counts.
# key, templates, subject, people, objects, action, risk, category
specs=[
('g7-bus','g7.bus-timing g7.bus-latest-departure g7.bus-travel-review','Parada de colectivo en una mañana escolar','Figuras adolescentes de espaldas, sin identidades asignadas','Colectivo sin número de línea, refugio simple, mochilas','Esperar antes de ir a la escuela','Sin reloj legible ni horario, sin línea 60, sin identificar una salida correcta','FAMILY'),
('g7-may-25','g7.may-25-act','Preparación de un acto escolar del 25 de Mayo','Adolescentes ensayando; docente lateral opcional','Salón sencillo, pañuelos lisos, escenario bajo','Preparar una coreografía folklórica sin mostrar pasos de solución','Sin grilla de números, disfraces caricaturescos, banderas inventadas ni una pose que resuelva la regla','FAMILY'),
('g7-group','g7.group-tasks','Mesa de trabajo para el proyecto de la feria','Figuras sin retratos asignados a Lucas, Sofía, Mateo o Vos','Papeles en blanco y materiales escolares','Preparar materiales antes del reparto','No asignar tareas o afinidades; no fijar número de integrantes como dato visual','FAMILY'),
('g7-mural','g7.mural-paint','Pared exterior preparada para pintar un mural','Sin personas necesarias','Lona, rodillo, recipientes cerrados sin etiqueta','Preparación del espacio','No medidas, área, cantidad o tamaños de envase que sugieran solución','FAMILY'),
('g7-notebook','g7.notebook-offer','Computadora portátil para el proyecto del curso','Manos opcionales sin identidad','Una computadora portátil apagada y carpeta sin texto','Mirar el equipo antes de comparar ofertas','Notebook significa computadora; no cuadernos como sujeto principal, precios, descuentos o marcas','FAMILY'),
('g7-stand','g7.stand-supplies','Merienda de un stand escolar en preparación','Figuras de fondo opcionales','Mesa, recipientes opacos y vajilla genérica','Preparar el puesto antes de abrir','No representar packs o porciones contables ni precios','FAMILY'),
('y1-classroom','y1.classroom-layout y1.scale-fit-review','Aula antes de una exposición','Sin personas necesarias','Mesas sin disposición final, puerta, caja de materiales','Preparar el aula','No plano cenital, cuadrícula a escala, pasillo resuelto ni cantidad de sillas que responda el problema','FAMILY'),
('y1-expo','y1.course-project-expo','Primera exposición del Proyecto del Curso','Adolescentes genéricos sin asignarlos a Alex, Dani o Sam','Mesa de muestra, soporte vacío, materiales sin texto','Conversar antes de distribuir responsabilidades','No fijar quién presenta, fases, roles ni afinidades','TEMPLATE'),
('y1-mobile-data','y1.mobile-data','Organización del celular para las actividades del curso','Una figura adolescente en plano medio, rostro simplificado','Celular sin interfaz legible, carpeta','Consultar el celular en una mesa escolar','No barras de consumo, apps reconocibles, MB o cuotas de uso','FAMILY'),
('y1-rehearsal','y1.rehearsal-schedule y1.schedule-review','Salón antes del ensayo del Día del Estudiante','Figuras adolescentes preparando el lugar','Soporte de cartel vacío, equipo de sonido genérico, materiales','Preparar un ensayo','Sin agenda resuelta, reloj, horarios ni secuencia de actividades','FAMILY'),
('y1-wheel','y1.student-day-challenge-wheel','Encuentro escolar del Día del Estudiante','Adolescentes en una actividad compartida sin protagonista','Soporte circular visto de canto, elementos de juego guardados','Preparar las actividades del encuentro','No ruleta de casino, sectores visibles, probabilidades ni número de posiciones','FAMILY'),
('y2-survey','y2.course-project-survey y2.data-claim-review','Revisión de una encuesta del curso','Adolescentes conversando alrededor de una mesa','Hojas sin texto, portapapeles y sobres','Revisar lo que se puede contar de una consulta','Sin gráficos, porcentajes o votos que validen una afirmación','TEMPLATE'),
('y2-court','y2.court-zones','Cancha escolar antes de armar las postas','Figuras pequeñas al borde, no ubicadas como postas','Cancha en perspectiva oblicua, implementos guardados','Preparar un encuentro deportivo','No distancias, coordenadas, marcas de postas, sector techado a escala ni plan óptimo','FAMILY'),
('y2-intercurso','y2.intercurso-plan y2.standings-claim','Preparación del Intercurso junto a la cancha','Adolescentes genéricos del curso','Banco lateral, portapapeles sin texto, bolso deportivo','Conversar antes de organizar la jornada','No alineación de equipos, resultados, puestos o partidos dibujados; sirve para plan y tabla','FAMILY'),
('y2-team-kit','y2.team-kit-order','Preparación de pecheras para el Intercurso','Manos opcionales','Telas y pecheras parcialmente plegadas sin marcas','Preparar un pedido','No cantidades contables ni colores de equipos que den proporciones; sin escudos','FAMILY'),
('y3-tech','y3.course-project-tech y3.rate-capacity-review','Stand de la feria de tecnología en preparación','Adolescentes genéricos trabajando juntos','Portátil, pendrive, piezas de prototipo abstracto','Preparar una muestra con recursos compartidos','No métricas de almacenamiento, conexiones que certifiquen internet ni piezas que resuelvan cantidades','TEMPLATE'),
('y3-friend','y3.friend-day','Encuentro de amigos por la tarde cerca de un club barrial','Adolescentes de 14–17 en poses cotidianas','Banco, bolsos, entrada genérica sin nombre','Encontrarse antes de la actividad','No horarios, rutas, número fijo de asistentes o clubes reales','FAMILY'),
('y3-route','y3.route-plan','Esquina barrial durante los mandados del sábado','Figura adolescente caminando por la vereda','Fachadas genéricas sin cartelería, bolsa reutilizable','Hacer mandados en el barrio','Sin mapa, calles, flechas, rutas o comercios reales; no ordenar los destinos','FAMILY'),
('y3-transport','y3.transport-pass y3.fixed-variable-review','Decisión de cómo pagar los viajes escolares','Manos opcionales en primer plano','Tarjeta de transporte completamente genérica, colectivo al fondo','Preparar el viaje del mes','Sin marca de tarjeta, tarifa, boleto legible o indicación de opción más barata','FAMILY'),
('y3-week','y3.week-planner','Escritorio al preparar la semana','Sin personas necesarias','Cuaderno cerrado, mochila, carpetas lisas','Preparar materiales de la semana','Sin calendario, horarios o planificación resuelta; no copiar diagrama de interacción','FAMILY'),
('y4-fundraiser','y4.course-project-fundraiser y4.margin-review','Preparativos de una peña escolar','Adolescentes preparando mesas, vestimenta cotidiana','Bandejas tapadas, mantel, decoración austera','Preparar una actividad para recaudar','No cantidades, precios, márgenes, alcohol ni estereotipos regionales','TEMPLATE'),
('y4-event','y4.event-floor-plan y4.school-event-flow y4.shift-coverage y4.spatial-capacity-review','Salón escolar antes de recibir un evento','Figuras dispersas preparando el lugar','Puerta, mesas apiladas, puesto lateral sin carteles','Preparar el salón antes de abrir','Sin plano, filas contables, roles asignados o flujo óptimo; imagen previa al problema válida para tres escenas','FAMILY'),
('y4-represent','y4.represent-class','Conversación del curso con el consejo escolar','Adolescente genérico ante interlocutores sin jerarquía heroica','Mesa sencilla, carpeta sin texto','Presentar ideas con escucha mutua','Sin votos, aprobaciones visuales, micrófono de campaña ni autoridad institucional inventada','FAMILY'),
('y5-final-project','y5.course-project-final','Preparación de la muestra final del curso','Adolescentes revisando materiales sin roles nominales','Mesa de muestra, panel vacío y material sin texto','Reorganizar el trabajo antes de exponer','No tarea tachada, solución de contingencia, promesas o asignaciones predeterminadas','TEMPLATE'),
('y5-trip','y5.final-trip-or-event y5.multi-option-comparison-review','Preparación de un viaje de egreso','Adolescentes con bolsos, sin promoción turística','Micro genérico y equipaje','Reunirse antes de salir','No destino, empresa, costo, paquetes ni cantidad de pasajeros que decida la comparación','TEMPLATE'),
('y5-screen','y5.stage-screen','Preparativos de la pantalla del acto de egreso','Figuras de fondo opcionales','Proyector y pantalla vacía vistos en oblicuo','Preparar la proyección antes de mostrar la imagen','No imagen proyectada, relación de aspecto comparativa, fecha o cartel; nunca ilustrar cómo encaja','TEMPLATE'),
('y5-yearbook','y5.yearbook y5.proportion-capacity-review','Mesa de preparación de un anuario','Manos adolescentes opcionales','Libro cerrado sin título, hojas parcialmente superpuestas','Seleccionar recuerdos sin mostrar reparto','Sin páginas contables, fotos identificables, secciones o cuotas resueltas','TEMPLATE'),
('y5-next-step','y5.next-step-options','Materiales abiertos al terminar la escuela','Figura adolescente reflexionando sin destino decidido','Carpetas lisas, mochila, ventana a un entorno cotidiano','Pensar qué viene después','Sin profesiones jerarquizadas, títulos universitarios, sueldos, horarios ni elección ganadora','FAMILY'),
]
T={t['id']:t for t in j['templates']}; mapping={}; assets=[]
for key,ids,subject,people,objects,action,risk,category in specs:
 ts=[T[x] for x in ids.split()]; active=any(t['publicEligible'] for t in ts); anchor=any(t['placement']=='anchor' for t in ts)
 priority='P1' if active and (anchor or key=='g7-may-25') else 'P2'
 asset={'id':'scenario.'+key.replace('-','.',1),'category':category,'group':'SCENARIO','templates':ids.split(),'priority':priority,'required':'Optional','active':active,'filename':key+'.webp','sourceFilename':'scenario-'+key+'-source.png','sourcePath':'resources/rc3-assets/scenarios/grade-'+('7' if key.startswith('g7') else key[1])+'/scenario-'+key+'-source.png','runtimePath':'public/assets/scenes/'+key+'.webp','format':'WebP','sourceFormat':'PNG sin pérdida','ratio':'16:9','dimensions':'1600×900; fuente 3200×1800 preferida','alpha':'NO','subject':subject,'people':people,'objects':objects,'action':action,'risk':risk,'alt':subject+'.','sourceRefs':[source(t)[0]+':'+source(t)[1] for t in ts],'maxSize':'120 KB','method':'IA externa; selección humana; optimización posterior','status':'PROPOSED' if active else 'DEFERRED — DEV-ONLY'}
 assets.append(asset)
 for t in ts: mapping[t['id']]=asset
# Every template must have exactly one explicit mapping, including all reviews.
assert len(mapping)==42 and len(assets)==28
G=[
('brand.logo-primary','BRAND','Logo principal compuesto sobre papel','logo-primary.svg','SVG','1:1','512×512 viewBox; mínimo conjunto 120 px','YES','Wordmark Egresado en Schibsted Grotesk con marca de trayectoria','No lettering de IA: símbolo conceptual sin texto; composición del nombre en vector manual','Manual/vector; IA sólo exploración del símbolo'),
('brand.logo-horizontal','BRAND','Firma horizontal para shell y pie','logo-horizontal.svg','SVG','4:1','800×200 viewBox; mínimo 120×30','YES','Nombre y marca en una sola línea','Derivar del mismo master; no generar una segunda marca','Derivación manual del logo principal'),
('brand.logo-mark','BRAND','Marca compacta independiente','logo-mark.svg','SVG','1:1','64×64 viewBox; prueba a 16 y 32 px','YES','Trayecto angular abierto con un cambio de dirección','No tilde idéntico a acierto, flecha de ranking, birrete genérico o detalle fino','Manual/vector; IA sólo boceto conceptual'),
('brand.favicon','BRAND','Identidad en pestaña y acceso directo','favicon.ico','ICO + PNG','1:1','16/32 ICO; apple 180, app 192/512 PNG','NO','La marca compacta sobre papel','Derivar; no encoger logo con letras; no transparencia en PNG de app','Derivación técnica sin IA'),
('brand.social-mark','BRAND','Marca social y tarjeta OG','social-mark.png','PNG','1:1 + 1.91:1 OG','512×512; derivado OG 1200×630','NO','Marca sobre papel con composición tipográfica fuera del raster generado','No puntaje, nombre privado, podio inventado, institución no autorizada','Composición manual; reutiliza logo y hero'),
('brand.hero','BRAND','Portada del producto','hero.webp','WebP','16:9','1600×900; fuente 3200×1800 preferida','NO','Patio escolar: un recorrido geométrico conecta mesa de proyecto, encuentro y salón','Sin seis casilleros numerados, números flotantes, graduación que prometa ganar o datos matemáticos','IA externa'),
('global.ranking-foundation','GLOBAL','Jerarquía del ranking público','leaderboard.tsx','HTML/CSS','fluido','320–412 px; filas flexibles','N/A','Puesto escrito, alias y puntaje verificado en renglones editoriales','Sin tres pedestales rígidos, trofeos por persona, score dibujado o empate oculto','Composición con primitivas existentes; sin IA'),
('ending.foundation','ENDING','Egreso y resultado de carrera','milestone.tsx','HTML/CSS/SVG inline','fluido','320–412 px','N/A','Numeral o nombre de cierre, sello y confeti existentes','No diploma raster, nota inventada ni celebración de puesto antes de verificar','Reutilización de Milestone; sin IA'),
]
for id,cat,subject,fn,fmt,ratio,dim,alpha,visual,risk,method in G:
 path='resources/rc3-assets/brand/'+fn.replace('.webp','-source.png').replace('.ico','-source.svg')
 if id.startswith('global.') or id.startswith('ending.'): path='N/A — contrato en este handoff; no importar imagen'
 runtime='public/assets/brand/'+fn
 if id=='brand.favicon':runtime='src/app/favicon.ico; src/app/apple-icon.png; public/assets/brand/app-icon-192.png; public/assets/brand/app-icon-512.png'
 if id=='brand.social-mark':runtime='public/assets/brand/social-mark.png; src/app/opengraph-image.png'
 if id=='global.ranking-foundation':runtime='src/components/competition/leaderboard.tsx (existente)'
 if id=='ending.foundation':runtime='src/components/game/milestone.tsx (existente)'
 assets.append(dict(id=id,category=cat,group='BRAND' if cat=='BRAND' else 'GLOBAL UI',templates=[],priority='P0',required='Required para foundation RC3; no es requisito funcional del RC.2',active=True,filename=fn,sourceFilename=Path(path).name,sourcePath=path,runtimePath=runtime,format=fmt,sourceFormat='SVG editable manual / PNG conceptual; nunca tratar PNG como vector' if fmt not in ['WebP','HTML/CSS','HTML/CSS/SVG inline'] else ('PNG sin pérdida' if fmt=='WebP' else 'Código existente'),ratio=ratio,dimensions=dim,alpha=alpha,subject=visual,people='Figuras adolescentes genéricas sólo en hero; ausentes en marca',objects=subject,action='Representar recorrido y decisiones',risk=risk,alt='Egresado' if cat=='BRAND' and id!='brand.hero' else ('Patio escolar y estudiantes preparando proyectos.' if id=='brand.hero' else 'Decorativo aria-hidden; el texto HTML comunica el estado'),sourceRefs=['src/components/ui/wordmark.tsx:Wordmark','docs/09-design-system/assets.md'] if cat=='BRAND' else [runtime.split(' (')[0]],maxSize='180 KB' if id=='brand.hero' else ('200 KB OG / 60 KB social' if id=='brand.social-mark' else ('30 KB ICO / 80 KB PNG 512' if id=='brand.favicon' else ('12 KB SVG' if fmt=='SVG' else '0 KB de imágenes nuevas'))),method=method,status='PROPOSED'))
write('evidence/assets.json',json.dumps(assets,ensure_ascii=False,indent=2))
# Inventory.
intro='''# Inventario canónico de situaciones

Baseline: `cfcde1e1fe0f52d2554134efa9c4f28d72c8b833`, RC.2. Extraído de `createFullCareerDependencies().catalog`, con 1 instancia aprobada materializada por Template, más todos los IDs de variantes conservados en [catalog.json](evidence/catalog.json). Es un relevamiento de contenido, no una nueva aprobación matemática.

**22 Families · 42 Templates · 1.031 variantes aprobadas.** Hay 32 Templates ordinarias y 10 de Repaso. La carrera pública admite **28 ordinarias + 10 de Repaso**; las otras 4 son exclusivas del recorrido de desarrollo de 7.º. La suma de familias por año no equivale a familias únicas: `course-project` cruza cinco años.

**28 contextos visuales propuestos: 24 públicos y 4 DEV-ONLY.** Ésta es una agrupación editorial para ahorrar imágenes, no un nuevo tipo ni ID del motor. No son 42 ilustraciones y mucho menos 1.031. Los 10 Repasos reutilizan contexto; tampoco se generan imágenes extra por rareza. Elegibilidad no garantiza aparición en una seed concreta; el servidor congela la seed de cada edición. No se inspeccionó la seed productiva.

`placement` canónico sólo admite `anchor`, `checkpoint`, `special`, `recovery`. “Secondary” es el rol del slot del plan: puede alojar otra anchor, checkpoint o special. La prioridad visual no altera esos roles.

Superficie pública común: `/` → `CompetitionExperience` → `AttemptRun` → `RunView` → `ChallengeFrame` → `SituationCard`. Actualmente **ninguna monta SceneMedia**. Los controles y diagramas HTML/SVG forman parte del problema, no del arte decorativo.

Los títulos siguientes son del desafío (`narrate`); `RunView` no apila la prosa del storylet sobre el desafío. Los ejemplos paramétricos completos son evidencia, nunca copy listo para pegar en otra variante.
'''
rows=[]
for grade,stage in [('7.º','grade-7'),('1.º','year-1'),('2.º','year-2'),('3.º','year-3'),('4.º','year-4'),('5.º','year-5')]:
 ts=[t for t in j['templates'] if stage in t['stages']]
 rows.append([grade,len({t['family'] for t in ts}),len(ts),sum(t['placement']!='recovery' and t['publicEligible'] for t in ts),sum(t['placement']=='recovery' for t in ts),sum(len(t['approvedVariants']) for t in ts)])
intro+='\n'+table(['Año','Families presentes','Templates','Ordinarias públicas','Repasos','Variantes aprobadas'],rows)
for grade,stage in [('7.º','grade-7'),('1.º','year-1'),('2.º','year-2'),('3.º','year-3'),('4.º','year-4'),('5.º','year-5')]:
 intro+='\n## '+grade+'\n\n';rows=[]
 for t in j['templates']:
  if stage not in t['stages']:continue
  a=mapping[t['id']];p,s,l=source(t)
  role='Recovery condicional' if t['placement']=='recovery' else ('Anchor o Secondary' if t['placement']=='anchor' else 'Secondary')
  surface='`/` · ChallengeFrame' if t['publicEligible'] else '`/dev/grade-7` · ChallengeFrame (DEV-ONLY)'
  notes=('Repaso: no puntúa; reutilizar escena, preferir omitir imagen. ' if t['placement']=='recovery' else '')+a['risk']
  if not t['publicEligible']:notes='Fuera de hostableTemplates; no generar para producción. '+notes
  rows.append([grade,t['family'],t['id'],f"{len(t['approvedVariants'])} IDs aprobados en grade-5-dev-6; lista exacta en catalog.json",t['narrative']['title'],a['subject'],a['category']+' · '+t['family'],', '.join(t['categories']),t['interaction']+' / '+t['composition']['interactionEngine'],t['placement']+' · '+role,surface,'Sin raster; controles de '+t['interaction'],a['id'],a['filename'],' / '.join(a['templates']),a['priority'],notes,f'`{p}:{l}` · `{s}`'])
 intro+=table(['Grade','Family ID','Template ID','Variant scope','Display title','Scenario','Narrative theme / granularidad','Mathematical domain','Interaction kind / engine','Rol canónico / slot','Current UI surface','Existing asset','Suggested asset ID','Suggested filename','Reusability','Priority','Notes','Sources'],rows)
intro+='''
## Reutilización y cobertura de Repaso

La map `recovery.reviews` de [catalog.json](evidence/catalog.json) conserva todas las relaciones origen→Repaso. Hay once orígenes y diez Templates de recuperación: las dos preguntas del colectivo comparten una. No extender recuperación a familias que no la declaran. `RunView` muestra la obligación practicada y el debrief de las otras; “se cerró” no significa que se practicaron todas.

## Escenas compartidas y escenas distintas

- Las dos preguntas del colectivo y su Repaso comparten `scenario.g7.bus`.
- Plan y tabla del Intercurso comparten una vista previa neutral junto a la cancha. Las postas tienen otra escena porque su contexto espacial necesita distinguirse, sin dibujar su plano.
- Salón, cola y turnos del evento comparten una vista del salón **antes** de abrir. El Repaso de capacidad reutiliza esa vista. El cluster permite a lo sumo un beat por carrera, de modo que no obliga a ver repetida la misma imagen.
- Proyecto del Curso tiene una sola Family pero cinco momentos visualmente distintos: expo, encuesta, tecnología, peña y muestra final. Necesita cinco briefs TEMPLATE, sin inventar una nueva Family.
- Viaje, anuario y pantalla comparten Family `egreso`, pero son objetos y escenas diferentes. Se mantienen tres briefs; cada Repaso comparte el que corresponde.
- Variantes de disponibilidad, contingencia, geometría o comunicación cambian condiciones; el arte muestra la preparación, no un estado incompatible. Sus parámetros permanecen en HTML.

## Rare events: cuatro registros, cero imágenes nuevas

`careerRareEvents` tiene cuatro entradas (su comentario “uno por año” no describe los seis años). No hay eventos raros registrados para 7.º ni 4.º. `activeChallengeView` entrega `rareNote`, pero **RunView/ChallengeFrame no la renderizan**. Puede reaparecer como recuerdo si `buildEpilogue` la selecciona; no prometer una tarjeta visible durante el desafío. Los tratamientos `variant-modifier` pertenecen al motor y quedan congelados.

'''
rows=[]
for e in j['rareEvents']:
 a=mapping[e['hostTemplate']];rows.append([e['id'],e['stage'],e['hostTemplate'],e['treatment'],e['note']['title'],'EVENT → reutiliza '+a['id'],'P2; no archivo extra','Epilogue memories cuando seleccionado; sin banner actual','src/content/rare-events.ts:careerRareEvents; src/game/narrative/epilogue.ts:careerMemories'])
intro+=table(['Event ID','Año','Host','Tratamiento','Título','Asset','Prioridad','Visibilidad','Fuente'],rows)
intro+='\n## Beats narrativos, transiciones y finales\n\nNo se proponen seis fondos por año. Los once beats de marco de la carrera usan `NarrativeCard`; cierre final usa `Milestone`. `YearResult` es el cierre del slice/dev, no una pantalla intermedia del Fair Mode. La siguiente tabla conserva los storylets sin desafío, incluidos los que sólo sirven a desarrollo; cruzar con `evidence/reachability.json` para witnesses del barrido.\n\n'
rows=[]
for s in j['storylets']:
 if s['challengePool']:continue
 witness=reach['storylets'].get(s['id'])
 status=('ACTIVE condicional' if s['id'].endswith('.review') else 'ACTIVE')+' · witness '+witness if witness else 'DEV-ONLY · fuera del recorrido público'
 rows.append([s['id'],s['stages'][0],s['title'],status,'Sin imagen; gramática GRADE compartida; ending.foundation sólo al egresar','src/content/grade-'+('7' if s['id'].startswith('g7') else s['id'][1])+'/storylets.ts'])
intro+=table(['Storylet','Etapa','Título actual','Estado','Asset decision','Fuente'],rows)
intro+='\nEl final agrega cinco hitos de display posibles (`milestone.graduated`, `perfect-year`, `came-back`, `saw-something-rare`, `style-identity`) desde `src/content/career-closing.ts`. Son texto y glifos reutilizados, sin cinco medallas nuevas ni Prestige adicional.\n'
write('01-scenario-inventory.md',intro)
# Manifest, full per-asset contract.
s='''# Manifiesto de assets candidatos

**Estado PROPOSED.** Los IDs son del handoff visual; no reemplazan IDs del motor. Cada ficha es un contrato de producción. Ningún asset fue generado ni integrado en TASK-01.

**36 contratos de asset: 8 P0, 16 P1 y 12 P2; 6 BRAND, 28 SCENARIO y 2 GLOBAL UI.** Entre los 28 escenarios, 4 son DEV-ONLY y no se encargan para RC3 público. Los formatos derivados de favicon/OG no se cuentan como nuevas ideas ni como nuevas generaciones. Ranking y ending son contratos de composición en código, no pedidos de imágenes. 24 ilustraciones públicas + 1 hero son el banco máximo de candidatos IA; no un lote obligatorio.

La dirección propuesta es “Trayectoria en papel”. Requiere ratificación editorial frente al brief fotográfico histórico de `docs/09-design-system/assets.md`; esta carpeta no cambia una decisión aceptada. El presupuesto vigente de 6–9 raster se conserva para el primer lote: hero + 3 pilotos y hasta 4 escenarios adicionales si aportan valor (8 raster). El resto queda opcional, aunque su brief sea P1. Ampliar el banco integrado exige una decisión explícita posterior y actualizar la documentación canónica.

Fuentes externas recibidas → `resources/rc3-assets/`; archivos servidos → `public/assets/`. Se conserva el destino canónico `public/assets/scenes/` en vez de abrir un segundo árbol `public/illustrations/`. Las carpetas son propuestas; aún no se crean. Registrar para cada entrega: assetId, nombre, herramienta/modelo/versión, prompt, fecha, seed si existe, referencia de estilo aprobada, licencia/permiso declarado y SHA-256. Conservar originales; nunca servirlos automáticamente.

## Reglas comunes heredadas por todas las fichas

Texto en generación: **NONE**. El nombre Egresado se compone después con tipografía real; datos matemáticos, puestos, alias, fechas y errores siempre son HTML. Sin escudos, logos, uniformes identificables, marcas comerciales, números, soluciones, watermarks, retratos de personas reales, infantilización o sexualización.

Alt de escena: lugar y momento, nunca la solución ni la mecánica. Si duplica exactamente el contexto inmediato, usar `alt=""` tras revisión de accesibilidad; `SceneMedia` exige una cadena explícita. Marca junto al mismo nombre visible: decorativa; marca única: nombre accesible “Egresado”. No incrustar explicaciones importantes en el alt de una imagen decorativa.

Estado de generación común: NOT GENERATED; integración: NOT INTEGRATED (los componentes foundation ya existen, el polish RC3 no). Dependencias comunes: dirección aprobada, style test, tres pilotos, revisión de crop/semántica/contraste, TASK-02 para marca y TASK-06 para escenarios. No modificar el motor para conectar assets.

Escenarios 16:9: sujeto y objetos esenciales dentro del 70% central del ancho y 80% central del alto; debe sobrevivir al crop 3:2 móvil de SceneMedia sin perder la acción. Una imagen máxima por situación, frecuentemente cero; Repaso por defecto sin repetir raster. El arte nunca desplaza los datos ni entrega una respuesta.

'''
for a in assets:
 s+='\n## '+a['id']+'\n\n'
 s+=table(['Campo','Contrato'],[
 ['Asset ID',a['id']],['Category / granularity',a['group']+' / '+a['category']],['Scenario/Surface',', '.join(a['templates']) or a['objects']],['Priority',a['priority']],['Required/Optional',a['required']],['Reachability / status',a['status']],['Target filename',a['filename']],['Source asset path',a['sourcePath']],['Runtime target path',a['runtimePath']],['Target final format',a['format']],['Suggested source format',a['sourceFormat']],['Aspect ratio',a['ratio']],['Recommended dimensions',a['dimensions']],['Maximum recommended size',a['maxSize']],['Transparent background?',a['alpha']],['Visual subject',a['subject']],['Narrative purpose',a['action']+'; contexto antes de decidir, sin anticipar resultado'],['Required elements',a['objects']+'; '+a['people']],['Forbidden elements',a['risk']+'; negativos comunes'],['Text inside image?','NO en IA; sólo composición tipográfica manual del nombre en marca/OG'],['Alt strategy',a['alt']+'; aplicar regla común de duplicación'],['Reuse scope',', '.join(a['templates']) or 'GLOBAL; derivado del mismo master'],['Dependencies','Reglas comunes; '+('no producir para RC3 público' if not a['active'] else 'TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas')],['Generation method',a['method']],['Generation status','NOT GENERATED'],['Integration status','NOT INTEGRATED; foundation existente no equivale a RC3 integrado'],['Source references','; '.join(a['sourceRefs'])]])
s+='''
## Formatos y criterio de aceptación

| Categoría | Fuente | Runtime | Motivo / aceptación |
|---|---|---|---|
| Símbolo y firmas | SVG editable manual; PNG IA sólo concepto | SVG local ≤12 KB | Escalable, mono/color; sin scripts, referencias externas ni fuentes remotas. Contornos del nombre sólo para export; HTML conserva nombre accesible. |
| Hero | PNG 3200×1800 | WebP 1600×900 ≤180 KB | Imagen compacta; reservar caja; validar crop 3:2. No usar PNG masivo en portada. |
| Escenas | PNG 3200×1800 | WebP 1600×900 ≤120 KB | Contrato existente; `sizes` acompaña 412 px. AVIF opcional sólo si reduce bytes sin degradación visible; no requisito ni nuevo pipeline. |
| Favicon/app | Derivado del SVG | ICO 16/32, PNG 180/192/512 | Pruebas a tamaño nativo; PNG opaco con margen, no wordmark microscópico. |
| Social/OG | Composición manual | PNG 512 y 1200×630 ≤200 KB OG | Texto legible y datos genéricos; nunca screenshot de una sesión. |
| Ranking/ending/progreso | Primitivas actuales | HTML/CSS/SVG inline | Números vivos, accesibles; cero raster de estados. |

B15: IA externa produce hero y escenas aprobadas. Puede explorar el símbolo, pero la salida final de logo, variantes, favicon y social necesita composición/derivación manual. No generar botones, checks de respuesta, triángulo de Estilo, Aura, charts, planos, calendarios, medallas por puesto o texto legal. GRADE/EVENT/DECORATIVE tienen cero archivos nuevos: ya cuentan con contexto y primitivas; el inventario está completo aunque una categoría no pida assets.

## Matriz final de producción

```text
TOTAL ASSETS .......... 36 contratos candidatos
P0 .................... 8
P1 ................... 16
P2 ................... 12 (incluye 4 DEV-ONLY diferidos)
BRAND ................. 6
SCENARIO ............. 28 (24 públicos + 4 DEV-ONLY)
GLOBAL UI ............. 2 (ranking + ending; código, no imágenes)
OPTIONAL ............. 28 escenarios; no exige producirlos todos
```

Los 8 P0 son foundation propuesta para RC3, no carencias funcionales de RC.2. Hay 25 posibles ilustraciones públicas IA (hero + 24 escenarios); las demás fichas son masters/derivados de marca o composición UI. El primer pack sigue limitado a hero + 3 pilotos + hasta 4 escenas adicionales (≤8 raster). Las cuatro escenas DEV no entran a ese pack. Ningún archivo nuevo por Variant, Repaso, Grade o Event.
'''
write('04-asset-manifest.md',s)
# Existing file assets: inventory every tracked image/font, not build caches.
files=subprocess.check_output(['git','ls-files'],text=True).splitlines(); existing=[]
for name in files:
 p=ROOT/name
 if p.suffix.lower() not in ['.png','.jpg','.jpeg','.webp','.avif','.svg','.ico','.woff','.woff2','.ttf','.otf','.gif']:continue
 b=p.read_bytes();dims='N/A'
 if p.suffix=='.png':dims='×'.join(map(str,struct.unpack('>II',b[16:24])))
 existing.append(dict(path=name,format=p.suffix[1:],dimensions=dims,bytes=len(b),used='DOC-ONLY · referenciada por docs/09-design-system/assets.md' if name.startswith('docs/') else 'ACTIVE · src/app/fonts/index.ts',purpose='Captura del handoff v0.2' if name.startswith('docs/') else 'Fuente local variable Latin 400–900',style='Papel editorial' if name.startswith('docs/') else 'Schibsted: títulos/datos; Libre Franklin: prosa',quality='Referencia de sistema; copy y valores pueden estar desactualizados' if name.startswith('docs/') else 'Formato web versionado; licencia OFL adjunta',reuse='Referencia sí; nunca rasterizar UI' if name.startswith('docs/') else 'Sí, conservar'))
write('evidence/existing-assets.json',json.dumps(existing,ensure_ascii=False,indent=2))
s='''# Assets existentes

**8 archivos binarios versionados: 6 PNG de referencia + 2 fuentes WOFF2.** `public/` sólo contiene `.gitkeep`; `resources/` no existe. No hay logos exportados, SVG independientes, favicon, iconos app, OG, fotografías, audio ni ilustraciones de escenas. Se inspeccionó el inventario de archivos versionados y los directorios de producto; caches de build, reportes, node_modules y adjuntos privados no son assets de producto.

'''+table(['Path','Format','Dimensions','Bytes','Used/unused','Purpose','Style','Quality','Reusable?'],[[a[k] for k in ['path','format','dimensions','bytes','used','purpose','style','quality','reuse']] for a in existing])
s+='''
## Assets de código (no sumados a los 8 archivos)

| Fuente / símbolo | Formato / dimensión | Uso | Calidad y reuso |
|---|---|---|---|
| `src/components/ui/wordmark.tsx:Wordmark` | Texto SG 800, tracking −0,03 | Home; dev | Reusable; no es un archivo de logo. |
| `src/components/ui/marks.tsx:TickMark` | SVG viewBox 20×20 | Resultado | Mantener semántica de acierto, no convertir en decoración de opción. |
| `marks.tsx:SlashMark` | SVG viewBox 20×20 | Insuficiente | Reusable, currentColor. |
| `marks.tsx:PartialMark` | CSS 11×11 | Parcial | Reusable. |
| `marks.tsx:MilestoneTick` | SVG viewBox 34×34 | Cierre | Reusable. |
| `src/components/game/estilo-triangle.tsx:EstiloTriangle` | SVG calculado desde datos | HUD/cierre | No reemplazar por bitmap. |
| `src/components/game/confetti.tsx` | 18 tiras CSS | Hitos | Determinista; reduced-motion. |
| `src/components/game/aura-display.tsx:AuraBlock` | CSS y texto | HUD/feedback/cierre | Negro reservado, no imagen. |
| `src/components/ui/quantity-stepper.tsx` | CSS signos | Controles | Mantener nombres accesibles. |
| `src/components/ui/progress.tsx:StageProgress` | CSS celdas y texto | Etapa | No imágenes por año. |
| `src/styles/base.css:eg-canvas` | Gradientes CSS 16 px | Hoja | Reusable sin descargar textura. |
| `src/components/game/interactions/*` | HTML/SVG dinámico | Datos/controles | Activos; dibujos matemáticos protegidos. |

Las licencias `src/app/fonts/OFL-*.txt` acompañan ambas fuentes. No reexportarlas con una licencia inventada. Los tamaños de código no son bytes de una descarga individual; medir bundle en la implementación, no sumarlos como archivos raster.

## Briefs que no son assets producidos

`docs/09-design-system/assets.md` contiene ocho briefs raster, ocho pictogramas y briefs de audio: **DOC-ONLY**. Sus imágenes no están ausentes por un fallo de carga; nunca fueron generadas. `SceneMedia` existe pero no tiene consumidores de producto. Las referencias congeladas de `docs/sources/` no suman binarios visuales versionados y no se editaron.

Diferencia relevante: `scene.notebook` histórico propone cuadernos de librería, pero `g7.notebook-offer.narrate` actual dice “La notebook del curso” y compra una computadora. Otro handoff no debe generar cuadernos por traducir el identificador. La captura de colectivo muestra el 60; sirve como referencia visual, no como dato local verificado.
'''
write('11-existing-assets-inventory.md',s)
print(json.dumps({'templates':len(T),'visualContexts':len(specs),'assets':len(assets),'priorities':dict(collections.Counter(a['priority'] for a in assets)),'existingFiles':len(existing)},indent=2))
