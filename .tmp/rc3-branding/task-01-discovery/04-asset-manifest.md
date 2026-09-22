# Manifiesto de assets candidatos

**Estado PROPOSED.** Los IDs son del handoff visual; no reemplazan IDs del motor. Cada ficha es un contrato de producción. Ningún asset fue generado ni integrado en TASK-01.

**36 contratos de asset: 8 P0, 16 P1 y 12 P2; 6 BRAND, 28 SCENARIO y 2 GLOBAL UI.** Entre los 28 escenarios, 4 son DEV-ONLY y no se encargan para RC3 público. Los formatos derivados de favicon/OG no se cuentan como nuevas ideas ni como nuevas generaciones. Ranking y ending son contratos de composición en código, no pedidos de imágenes. 24 ilustraciones públicas + 1 hero son el banco máximo de candidatos IA; no un lote obligatorio.

La dirección propuesta es “Trayectoria en papel”. Requiere ratificación editorial frente al brief fotográfico histórico de `docs/09-design-system/assets.md`; esta carpeta no cambia una decisión aceptada. El presupuesto vigente de 6–9 raster se conserva para el primer lote: hero + 3 pilotos y hasta 4 escenarios adicionales si aportan valor (8 raster). El resto queda opcional, aunque su brief sea P1. Ampliar el banco integrado exige una decisión explícita posterior y actualizar la documentación canónica.

Fuentes externas recibidas → `resources/rc3-assets/`; archivos servidos → `public/assets/`. Se conserva el destino canónico `public/assets/scenes/` en vez de abrir un segundo árbol `public/illustrations/`. Las carpetas son propuestas; aún no se crean. Registrar para cada entrega: assetId, nombre, herramienta/modelo/versión, prompt, fecha, seed si existe, referencia de estilo aprobada, licencia/permiso declarado y SHA-256. Conservar originales; nunca servirlos automáticamente.

## Reglas comunes heredadas por todas las fichas

Texto en generación: **NONE**. El nombre Egresado se compone después con tipografía real; datos matemáticos, puestos, alias, fechas y errores siempre son HTML. Sin escudos, logos, uniformes identificables, marcas comerciales, números, soluciones, watermarks, retratos de personas reales, infantilización o sexualización.

Alt de escena: lugar y momento, nunca la solución ni la mecánica. Si duplica exactamente el contexto inmediato, usar `alt=""` tras revisión de accesibilidad; `SceneMedia` exige una cadena explícita. Marca junto al mismo nombre visible: decorativa; marca única: nombre accesible “Egresado”. No incrustar explicaciones importantes en el alt de una imagen decorativa.

Estado de generación común: NOT GENERATED; integración: NOT INTEGRATED (los componentes foundation ya existen, el polish RC3 no). Dependencias comunes: dirección aprobada, style test, tres pilotos, revisión de crop/semántica/contraste, TASK-02 para marca y TASK-06 para escenarios. No modificar el motor para conectar assets.

Escenarios 16:9: sujeto y objetos esenciales dentro del 70% central del ancho y 80% central del alto; debe sobrevivir al crop 3:2 móvil de SceneMedia sin perder la acción. Una imagen máxima por situación, frecuentemente cero; Repaso por defecto sin repetir raster. El arte nunca desplaza los datos ni entrega una respuesta.


## scenario.g7.bus

| Campo | Contrato |
|---|---|
| Asset ID | scenario.g7.bus |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | g7.bus-timing, g7.bus-latest-departure, g7.bus-travel-review |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | g7-bus.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-7/scenario-g7-bus-source.png |
| Runtime target path | public/assets/scenes/g7-bus.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Parada de colectivo en una mañana escolar |
| Narrative purpose | Esperar antes de ir a la escuela; contexto antes de decidir, sin anticipar resultado |
| Required elements | Colectivo sin número de línea, refugio simple, mochilas; Figuras adolescentes de espaldas, sin identidades asignadas |
| Forbidden elements | Sin reloj legible ni horario, sin línea 60, sin identificar una salida correcta; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Parada de colectivo en una mañana escolar.; aplicar regla común de duplicación |
| Reuse scope | g7.bus-timing, g7.bus-latest-departure, g7.bus-travel-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-7/challenges/bus-timing.ts:narrate / present (g7.bus-timing); src/content/grade-7/challenges/bus-latest-departure.ts:narrate / present (g7.bus-latest-departure); src/content/grade-7/challenges/bus-travel-review.ts:narrate / present (g7.bus-travel-review) |

## scenario.g7.may-25

| Campo | Contrato |
|---|---|
| Asset ID | scenario.g7.may-25 |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | g7.may-25-act |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | g7-may-25.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-7/scenario-g7-may-25-source.png |
| Runtime target path | public/assets/scenes/g7-may-25.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Preparación de un acto escolar del 25 de Mayo |
| Narrative purpose | Preparar una coreografía folklórica sin mostrar pasos de solución; contexto antes de decidir, sin anticipar resultado |
| Required elements | Salón sencillo, pañuelos lisos, escenario bajo; Adolescentes ensayando; docente lateral opcional |
| Forbidden elements | Sin grilla de números, disfraces caricaturescos, banderas inventadas ni una pose que resuelva la regla; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Preparación de un acto escolar del 25 de Mayo.; aplicar regla común de duplicación |
| Reuse scope | g7.may-25-act |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-7/challenges/may-25-act.ts:narrate / present (g7.may-25-act) |

## scenario.g7.group

| Campo | Contrato |
|---|---|
| Asset ID | scenario.g7.group |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | g7.group-tasks |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | DEFERRED — DEV-ONLY |
| Target filename | g7-group.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-7/scenario-g7-group-source.png |
| Runtime target path | public/assets/scenes/g7-group.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Mesa de trabajo para el proyecto de la feria |
| Narrative purpose | Preparar materiales antes del reparto; contexto antes de decidir, sin anticipar resultado |
| Required elements | Papeles en blanco y materiales escolares; Figuras sin retratos asignados a Lucas, Sofía, Mateo o Vos |
| Forbidden elements | No asignar tareas o afinidades; no fijar número de integrantes como dato visual; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Mesa de trabajo para el proyecto de la feria.; aplicar regla común de duplicación |
| Reuse scope | g7.group-tasks |
| Dependencies | Reglas comunes; no producir para RC3 público |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-7/challenges/group-tasks.ts:narrate / present (g7.group-tasks) |

## scenario.g7.mural

| Campo | Contrato |
|---|---|
| Asset ID | scenario.g7.mural |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | g7.mural-paint |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | DEFERRED — DEV-ONLY |
| Target filename | g7-mural.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-7/scenario-g7-mural-source.png |
| Runtime target path | public/assets/scenes/g7-mural.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Pared exterior preparada para pintar un mural |
| Narrative purpose | Preparación del espacio; contexto antes de decidir, sin anticipar resultado |
| Required elements | Lona, rodillo, recipientes cerrados sin etiqueta; Sin personas necesarias |
| Forbidden elements | No medidas, área, cantidad o tamaños de envase que sugieran solución; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Pared exterior preparada para pintar un mural.; aplicar regla común de duplicación |
| Reuse scope | g7.mural-paint |
| Dependencies | Reglas comunes; no producir para RC3 público |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-7/challenges/mural-paint.ts:narrate / present (g7.mural-paint) |

## scenario.g7.notebook

| Campo | Contrato |
|---|---|
| Asset ID | scenario.g7.notebook |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | g7.notebook-offer |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | DEFERRED — DEV-ONLY |
| Target filename | g7-notebook.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-7/scenario-g7-notebook-source.png |
| Runtime target path | public/assets/scenes/g7-notebook.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Computadora portátil para el proyecto del curso |
| Narrative purpose | Mirar el equipo antes de comparar ofertas; contexto antes de decidir, sin anticipar resultado |
| Required elements | Una computadora portátil apagada y carpeta sin texto; Manos opcionales sin identidad |
| Forbidden elements | Notebook significa computadora; no cuadernos como sujeto principal, precios, descuentos o marcas; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Computadora portátil para el proyecto del curso.; aplicar regla común de duplicación |
| Reuse scope | g7.notebook-offer |
| Dependencies | Reglas comunes; no producir para RC3 público |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-7/challenges/notebook-offer.ts:narrate / present (g7.notebook-offer) |

## scenario.g7.stand

| Campo | Contrato |
|---|---|
| Asset ID | scenario.g7.stand |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | g7.stand-supplies |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | DEFERRED — DEV-ONLY |
| Target filename | g7-stand.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-7/scenario-g7-stand-source.png |
| Runtime target path | public/assets/scenes/g7-stand.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Merienda de un stand escolar en preparación |
| Narrative purpose | Preparar el puesto antes de abrir; contexto antes de decidir, sin anticipar resultado |
| Required elements | Mesa, recipientes opacos y vajilla genérica; Figuras de fondo opcionales |
| Forbidden elements | No representar packs o porciones contables ni precios; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Merienda de un stand escolar en preparación.; aplicar regla común de duplicación |
| Reuse scope | g7.stand-supplies |
| Dependencies | Reglas comunes; no producir para RC3 público |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-7/challenges/stand-supplies.ts:narrate / present (g7.stand-supplies) |

## scenario.y1.classroom

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y1.classroom |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y1.classroom-layout, y1.scale-fit-review |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y1-classroom.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-1/scenario-y1-classroom-source.png |
| Runtime target path | public/assets/scenes/y1-classroom.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Aula antes de una exposición |
| Narrative purpose | Preparar el aula; contexto antes de decidir, sin anticipar resultado |
| Required elements | Mesas sin disposición final, puerta, caja de materiales; Sin personas necesarias |
| Forbidden elements | No plano cenital, cuadrícula a escala, pasillo resuelto ni cantidad de sillas que responda el problema; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Aula antes de una exposición.; aplicar regla común de duplicación |
| Reuse scope | y1.classroom-layout, y1.scale-fit-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-1/challenges/classroom-layout.ts:narrate / present (y1.classroom-layout); src/content/grade-1/challenges/classroom-layout.ts:narrate / present (y1.scale-fit-review) |

## scenario.y1.expo

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y1.expo |
| Category / granularity | SCENARIO / TEMPLATE |
| Scenario/Surface | y1.course-project-expo |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y1-expo.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-1/scenario-y1-expo-source.png |
| Runtime target path | public/assets/scenes/y1-expo.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Primera exposición del Proyecto del Curso |
| Narrative purpose | Conversar antes de distribuir responsabilidades; contexto antes de decidir, sin anticipar resultado |
| Required elements | Mesa de muestra, soporte vacío, materiales sin texto; Adolescentes genéricos sin asignarlos a Alex, Dani o Sam |
| Forbidden elements | No fijar quién presenta, fases, roles ni afinidades; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Primera exposición del Proyecto del Curso.; aplicar regla común de duplicación |
| Reuse scope | y1.course-project-expo |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-1/challenges/course-project-expo.ts:narrate / present (y1.course-project-expo) |

## scenario.y1.mobile-data

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y1.mobile-data |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y1.mobile-data |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y1-mobile-data.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-1/scenario-y1-mobile-data-source.png |
| Runtime target path | public/assets/scenes/y1-mobile-data.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Organización del celular para las actividades del curso |
| Narrative purpose | Consultar el celular en una mesa escolar; contexto antes de decidir, sin anticipar resultado |
| Required elements | Celular sin interfaz legible, carpeta; Una figura adolescente en plano medio, rostro simplificado |
| Forbidden elements | No barras de consumo, apps reconocibles, MB o cuotas de uso; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Organización del celular para las actividades del curso.; aplicar regla común de duplicación |
| Reuse scope | y1.mobile-data |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-1/challenges/mobile-data.ts:narrate / present (y1.mobile-data) |

## scenario.y1.rehearsal

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y1.rehearsal |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y1.rehearsal-schedule, y1.schedule-review |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y1-rehearsal.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-1/scenario-y1-rehearsal-source.png |
| Runtime target path | public/assets/scenes/y1-rehearsal.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Salón antes del ensayo del Día del Estudiante |
| Narrative purpose | Preparar un ensayo; contexto antes de decidir, sin anticipar resultado |
| Required elements | Soporte de cartel vacío, equipo de sonido genérico, materiales; Figuras adolescentes preparando el lugar |
| Forbidden elements | Sin agenda resuelta, reloj, horarios ni secuencia de actividades; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Salón antes del ensayo del Día del Estudiante.; aplicar regla común de duplicación |
| Reuse scope | y1.rehearsal-schedule, y1.schedule-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-1/challenges/rehearsal-schedule.ts:narrate / present (y1.rehearsal-schedule); src/content/grade-1/challenges/rehearsal-schedule.ts:narrate / present (y1.schedule-review) |

## scenario.y1.wheel

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y1.wheel |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y1.student-day-challenge-wheel |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y1-wheel.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-1/scenario-y1-wheel-source.png |
| Runtime target path | public/assets/scenes/y1-wheel.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Encuentro escolar del Día del Estudiante |
| Narrative purpose | Preparar las actividades del encuentro; contexto antes de decidir, sin anticipar resultado |
| Required elements | Soporte circular visto de canto, elementos de juego guardados; Adolescentes en una actividad compartida sin protagonista |
| Forbidden elements | No ruleta de casino, sectores visibles, probabilidades ni número de posiciones; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Encuentro escolar del Día del Estudiante.; aplicar regla común de duplicación |
| Reuse scope | y1.student-day-challenge-wheel |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-1/challenges/student-day-challenge-wheel.ts:narrate / present (y1.student-day-challenge-wheel) |

## scenario.y2.survey

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y2.survey |
| Category / granularity | SCENARIO / TEMPLATE |
| Scenario/Surface | y2.course-project-survey, y2.data-claim-review |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y2-survey.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-2/scenario-y2-survey-source.png |
| Runtime target path | public/assets/scenes/y2-survey.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Revisión de una encuesta del curso |
| Narrative purpose | Revisar lo que se puede contar de una consulta; contexto antes de decidir, sin anticipar resultado |
| Required elements | Hojas sin texto, portapapeles y sobres; Adolescentes conversando alrededor de una mesa |
| Forbidden elements | Sin gráficos, porcentajes o votos que validen una afirmación; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Revisión de una encuesta del curso.; aplicar regla común de duplicación |
| Reuse scope | y2.course-project-survey, y2.data-claim-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-2/challenges/course-project-survey.ts:narrate / present (y2.course-project-survey); src/content/grade-2/challenges/course-project-survey.ts:narrate / present (y2.data-claim-review) |

## scenario.y2.court

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y2.court |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y2.court-zones |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y2-court.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-2/scenario-y2-court-source.png |
| Runtime target path | public/assets/scenes/y2-court.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Cancha escolar antes de armar las postas |
| Narrative purpose | Preparar un encuentro deportivo; contexto antes de decidir, sin anticipar resultado |
| Required elements | Cancha en perspectiva oblicua, implementos guardados; Figuras pequeñas al borde, no ubicadas como postas |
| Forbidden elements | No distancias, coordenadas, marcas de postas, sector techado a escala ni plan óptimo; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Cancha escolar antes de armar las postas.; aplicar regla común de duplicación |
| Reuse scope | y2.court-zones |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-2/challenges/court-zones.ts:narrate / present (y2.court-zones) |

## scenario.y2.intercurso

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y2.intercurso |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y2.intercurso-plan, y2.standings-claim |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y2-intercurso.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-2/scenario-y2-intercurso-source.png |
| Runtime target path | public/assets/scenes/y2-intercurso.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Preparación del Intercurso junto a la cancha |
| Narrative purpose | Conversar antes de organizar la jornada; contexto antes de decidir, sin anticipar resultado |
| Required elements | Banco lateral, portapapeles sin texto, bolso deportivo; Adolescentes genéricos del curso |
| Forbidden elements | No alineación de equipos, resultados, puestos o partidos dibujados; sirve para plan y tabla; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Preparación del Intercurso junto a la cancha.; aplicar regla común de duplicación |
| Reuse scope | y2.intercurso-plan, y2.standings-claim |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-2/challenges/intercurso-plan.ts:narrate / present (y2.intercurso-plan); src/content/grade-2/challenges/standings-claim.ts:narrate / present (y2.standings-claim) |

## scenario.y2.team-kit

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y2.team-kit |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y2.team-kit-order |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y2-team-kit.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-2/scenario-y2-team-kit-source.png |
| Runtime target path | public/assets/scenes/y2-team-kit.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Preparación de pecheras para el Intercurso |
| Narrative purpose | Preparar un pedido; contexto antes de decidir, sin anticipar resultado |
| Required elements | Telas y pecheras parcialmente plegadas sin marcas; Manos opcionales |
| Forbidden elements | No cantidades contables ni colores de equipos que den proporciones; sin escudos; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Preparación de pecheras para el Intercurso.; aplicar regla común de duplicación |
| Reuse scope | y2.team-kit-order |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-2/challenges/team-kit-order.ts:narrate / present (y2.team-kit-order) |

## scenario.y3.tech

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y3.tech |
| Category / granularity | SCENARIO / TEMPLATE |
| Scenario/Surface | y3.course-project-tech, y3.rate-capacity-review |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y3-tech.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-3/scenario-y3-tech-source.png |
| Runtime target path | public/assets/scenes/y3-tech.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Stand de la feria de tecnología en preparación |
| Narrative purpose | Preparar una muestra con recursos compartidos; contexto antes de decidir, sin anticipar resultado |
| Required elements | Portátil, pendrive, piezas de prototipo abstracto; Adolescentes genéricos trabajando juntos |
| Forbidden elements | No métricas de almacenamiento, conexiones que certifiquen internet ni piezas que resuelvan cantidades; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Stand de la feria de tecnología en preparación.; aplicar regla común de duplicación |
| Reuse scope | y3.course-project-tech, y3.rate-capacity-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-3/challenges/course-project-tech.ts:narrate / present (y3.course-project-tech); src/content/grade-3/challenges/course-project-tech.ts:narrate / present (y3.rate-capacity-review) |

## scenario.y3.friend

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y3.friend |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y3.friend-day |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y3-friend.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-3/scenario-y3-friend-source.png |
| Runtime target path | public/assets/scenes/y3-friend.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Encuentro de amigos por la tarde cerca de un club barrial |
| Narrative purpose | Encontrarse antes de la actividad; contexto antes de decidir, sin anticipar resultado |
| Required elements | Banco, bolsos, entrada genérica sin nombre; Adolescentes de 14–17 en poses cotidianas |
| Forbidden elements | No horarios, rutas, número fijo de asistentes o clubes reales; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Encuentro de amigos por la tarde cerca de un club barrial.; aplicar regla común de duplicación |
| Reuse scope | y3.friend-day |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-3/challenges/friend-day.ts:narrate / present (y3.friend-day) |

## scenario.y3.route

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y3.route |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y3.route-plan |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y3-route.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-3/scenario-y3-route-source.png |
| Runtime target path | public/assets/scenes/y3-route.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Esquina barrial durante los mandados del sábado |
| Narrative purpose | Hacer mandados en el barrio; contexto antes de decidir, sin anticipar resultado |
| Required elements | Fachadas genéricas sin cartelería, bolsa reutilizable; Figura adolescente caminando por la vereda |
| Forbidden elements | Sin mapa, calles, flechas, rutas o comercios reales; no ordenar los destinos; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Esquina barrial durante los mandados del sábado.; aplicar regla común de duplicación |
| Reuse scope | y3.route-plan |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-3/challenges/route-plan.ts:narrate / present (y3.route-plan) |

## scenario.y3.transport

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y3.transport |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y3.transport-pass, y3.fixed-variable-review |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y3-transport.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-3/scenario-y3-transport-source.png |
| Runtime target path | public/assets/scenes/y3-transport.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Decisión de cómo pagar los viajes escolares |
| Narrative purpose | Preparar el viaje del mes; contexto antes de decidir, sin anticipar resultado |
| Required elements | Tarjeta de transporte completamente genérica, colectivo al fondo; Manos opcionales en primer plano |
| Forbidden elements | Sin marca de tarjeta, tarifa, boleto legible o indicación de opción más barata; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Decisión de cómo pagar los viajes escolares.; aplicar regla común de duplicación |
| Reuse scope | y3.transport-pass, y3.fixed-variable-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-3/challenges/transport-pass.ts:narrate / present (y3.transport-pass); src/content/grade-3/challenges/transport-pass.ts:narrate / present (y3.fixed-variable-review) |

## scenario.y3.week

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y3.week |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y3.week-planner |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y3-week.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-3/scenario-y3-week-source.png |
| Runtime target path | public/assets/scenes/y3-week.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Escritorio al preparar la semana |
| Narrative purpose | Preparar materiales de la semana; contexto antes de decidir, sin anticipar resultado |
| Required elements | Cuaderno cerrado, mochila, carpetas lisas; Sin personas necesarias |
| Forbidden elements | Sin calendario, horarios o planificación resuelta; no copiar diagrama de interacción; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Escritorio al preparar la semana.; aplicar regla común de duplicación |
| Reuse scope | y3.week-planner |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-3/challenges/week-planner.ts:narrate / present (y3.week-planner) |

## scenario.y4.fundraiser

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y4.fundraiser |
| Category / granularity | SCENARIO / TEMPLATE |
| Scenario/Surface | y4.course-project-fundraiser, y4.margin-review |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y4-fundraiser.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-4/scenario-y4-fundraiser-source.png |
| Runtime target path | public/assets/scenes/y4-fundraiser.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Preparativos de una peña escolar |
| Narrative purpose | Preparar una actividad para recaudar; contexto antes de decidir, sin anticipar resultado |
| Required elements | Bandejas tapadas, mantel, decoración austera; Adolescentes preparando mesas, vestimenta cotidiana |
| Forbidden elements | No cantidades, precios, márgenes, alcohol ni estereotipos regionales; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Preparativos de una peña escolar.; aplicar regla común de duplicación |
| Reuse scope | y4.course-project-fundraiser, y4.margin-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-4/challenges/course-project-fundraiser.ts:narrate / present (y4.course-project-fundraiser); src/content/grade-4/challenges/course-project-fundraiser.ts:narrate / present (y4.margin-review) |

## scenario.y4.event

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y4.event |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y4.event-floor-plan, y4.school-event-flow, y4.shift-coverage, y4.spatial-capacity-review |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y4-event.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-4/scenario-y4-event-source.png |
| Runtime target path | public/assets/scenes/y4-event.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Salón escolar antes de recibir un evento |
| Narrative purpose | Preparar el salón antes de abrir; contexto antes de decidir, sin anticipar resultado |
| Required elements | Puerta, mesas apiladas, puesto lateral sin carteles; Figuras dispersas preparando el lugar |
| Forbidden elements | Sin plano, filas contables, roles asignados o flujo óptimo; imagen previa al problema válida para tres escenas; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Salón escolar antes de recibir un evento.; aplicar regla común de duplicación |
| Reuse scope | y4.event-floor-plan, y4.school-event-flow, y4.shift-coverage, y4.spatial-capacity-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-4/challenges/event-floor-plan.ts:narrate / present (y4.event-floor-plan); src/content/grade-4/challenges/school-event-flow.ts:narrate / present (y4.school-event-flow); src/content/grade-4/challenges/shift-coverage.ts:narrate / present (y4.shift-coverage); src/content/grade-4/challenges/event-floor-plan.ts:narrate / present (y4.spatial-capacity-review) |

## scenario.y4.represent

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y4.represent |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y4.represent-class |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y4-represent.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-4/scenario-y4-represent-source.png |
| Runtime target path | public/assets/scenes/y4-represent.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Conversación del curso con el consejo escolar |
| Narrative purpose | Presentar ideas con escucha mutua; contexto antes de decidir, sin anticipar resultado |
| Required elements | Mesa sencilla, carpeta sin texto; Adolescente genérico ante interlocutores sin jerarquía heroica |
| Forbidden elements | Sin votos, aprobaciones visuales, micrófono de campaña ni autoridad institucional inventada; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Conversación del curso con el consejo escolar.; aplicar regla común de duplicación |
| Reuse scope | y4.represent-class |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-4/challenges/represent-class.ts:narrate / present (y4.represent-class) |

## scenario.y5.final-project

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y5.final-project |
| Category / granularity | SCENARIO / TEMPLATE |
| Scenario/Surface | y5.course-project-final |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y5-final-project.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-5/scenario-y5-final-project-source.png |
| Runtime target path | public/assets/scenes/y5-final-project.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Preparación de la muestra final del curso |
| Narrative purpose | Reorganizar el trabajo antes de exponer; contexto antes de decidir, sin anticipar resultado |
| Required elements | Mesa de muestra, panel vacío y material sin texto; Adolescentes revisando materiales sin roles nominales |
| Forbidden elements | No tarea tachada, solución de contingencia, promesas o asignaciones predeterminadas; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Preparación de la muestra final del curso.; aplicar regla común de duplicación |
| Reuse scope | y5.course-project-final |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-5/challenges/course-project-final.ts:narrate / present (y5.course-project-final) |

## scenario.y5.trip

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y5.trip |
| Category / granularity | SCENARIO / TEMPLATE |
| Scenario/Surface | y5.final-trip-or-event, y5.multi-option-comparison-review |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y5-trip.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-5/scenario-y5-trip-source.png |
| Runtime target path | public/assets/scenes/y5-trip.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Preparación de un viaje de egreso |
| Narrative purpose | Reunirse antes de salir; contexto antes de decidir, sin anticipar resultado |
| Required elements | Micro genérico y equipaje; Adolescentes con bolsos, sin promoción turística |
| Forbidden elements | No destino, empresa, costo, paquetes ni cantidad de pasajeros que decida la comparación; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Preparación de un viaje de egreso.; aplicar regla común de duplicación |
| Reuse scope | y5.final-trip-or-event, y5.multi-option-comparison-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-5/challenges/final-trip.ts:narrate / present (y5.final-trip-or-event); src/content/grade-5/challenges/final-trip.ts:narrate / present (y5.multi-option-comparison-review) |

## scenario.y5.screen

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y5.screen |
| Category / granularity | SCENARIO / TEMPLATE |
| Scenario/Surface | y5.stage-screen |
| Priority | P1 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y5-screen.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-5/scenario-y5-screen-source.png |
| Runtime target path | public/assets/scenes/y5-screen.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Preparativos de la pantalla del acto de egreso |
| Narrative purpose | Preparar la proyección antes de mostrar la imagen; contexto antes de decidir, sin anticipar resultado |
| Required elements | Proyector y pantalla vacía vistos en oblicuo; Figuras de fondo opcionales |
| Forbidden elements | No imagen proyectada, relación de aspecto comparativa, fecha o cartel; nunca ilustrar cómo encaja; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Preparativos de la pantalla del acto de egreso.; aplicar regla común de duplicación |
| Reuse scope | y5.stage-screen |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-5/challenges/stage-screen.ts:narrate / present (y5.stage-screen) |

## scenario.y5.yearbook

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y5.yearbook |
| Category / granularity | SCENARIO / TEMPLATE |
| Scenario/Surface | y5.yearbook, y5.proportion-capacity-review |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y5-yearbook.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-5/scenario-y5-yearbook-source.png |
| Runtime target path | public/assets/scenes/y5-yearbook.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Mesa de preparación de un anuario |
| Narrative purpose | Seleccionar recuerdos sin mostrar reparto; contexto antes de decidir, sin anticipar resultado |
| Required elements | Libro cerrado sin título, hojas parcialmente superpuestas; Manos adolescentes opcionales |
| Forbidden elements | Sin páginas contables, fotos identificables, secciones o cuotas resueltas; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Mesa de preparación de un anuario.; aplicar regla común de duplicación |
| Reuse scope | y5.yearbook, y5.proportion-capacity-review |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-5/challenges/yearbook.ts:narrate / present (y5.yearbook); src/content/grade-5/challenges/yearbook.ts:narrate / present (y5.proportion-capacity-review) |

## scenario.y5.next-step

| Campo | Contrato |
|---|---|
| Asset ID | scenario.y5.next-step |
| Category / granularity | SCENARIO / FAMILY |
| Scenario/Surface | y5.next-step-options |
| Priority | P2 |
| Required/Optional | Optional |
| Reachability / status | PROPOSED |
| Target filename | y5-next-step.webp |
| Source asset path | resources/rc3-assets/scenarios/grade-5/scenario-y5-next-step-source.png |
| Runtime target path | public/assets/scenes/y5-next-step.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 120 KB |
| Transparent background? | NO |
| Visual subject | Materiales abiertos al terminar la escuela |
| Narrative purpose | Pensar qué viene después; contexto antes de decidir, sin anticipar resultado |
| Required elements | Carpetas lisas, mochila, ventana a un entorno cotidiano; Figura adolescente reflexionando sin destino decidido |
| Forbidden elements | Sin profesiones jerarquizadas, títulos universitarios, sueldos, horarios ni elección ganadora; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Materiales abiertos al terminar la escuela.; aplicar regla común de duplicación |
| Reuse scope | y5.next-step-options |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa; selección humana; optimización posterior |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/content/grade-5/challenges/next-step-options.ts:narrate / present (y5.next-step-options) |

## brand.logo-primary

| Campo | Contrato |
|---|---|
| Asset ID | brand.logo-primary |
| Category / granularity | BRAND / BRAND |
| Scenario/Surface | Logo principal compuesto sobre papel |
| Priority | P0 |
| Required/Optional | Required para foundation RC3; no es requisito funcional del RC.2 |
| Reachability / status | PROPOSED |
| Target filename | logo-primary.svg |
| Source asset path | resources/rc3-assets/brand/logo-primary.svg |
| Runtime target path | public/assets/brand/logo-primary.svg |
| Target final format | SVG |
| Suggested source format | SVG editable manual / PNG conceptual; nunca tratar PNG como vector |
| Aspect ratio | 1:1 |
| Recommended dimensions | 512×512 viewBox; mínimo conjunto 120 px |
| Maximum recommended size | 12 KB SVG |
| Transparent background? | YES |
| Visual subject | Wordmark Egresado en Schibsted Grotesk con marca de trayectoria |
| Narrative purpose | Representar recorrido y decisiones; contexto antes de decidir, sin anticipar resultado |
| Required elements | Logo principal compuesto sobre papel; Figuras adolescentes genéricas sólo en hero; ausentes en marca |
| Forbidden elements | No lettering de IA: símbolo conceptual sin texto; composición del nombre en vector manual; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Egresado; aplicar regla común de duplicación |
| Reuse scope | GLOBAL; derivado del mismo master |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | Manual/vector; IA sólo exploración del símbolo |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/components/ui/wordmark.tsx:Wordmark; docs/09-design-system/assets.md |

## brand.logo-horizontal

| Campo | Contrato |
|---|---|
| Asset ID | brand.logo-horizontal |
| Category / granularity | BRAND / BRAND |
| Scenario/Surface | Firma horizontal para shell y pie |
| Priority | P0 |
| Required/Optional | Required para foundation RC3; no es requisito funcional del RC.2 |
| Reachability / status | PROPOSED |
| Target filename | logo-horizontal.svg |
| Source asset path | resources/rc3-assets/brand/logo-horizontal.svg |
| Runtime target path | public/assets/brand/logo-horizontal.svg |
| Target final format | SVG |
| Suggested source format | SVG editable manual / PNG conceptual; nunca tratar PNG como vector |
| Aspect ratio | 4:1 |
| Recommended dimensions | 800×200 viewBox; mínimo 120×30 |
| Maximum recommended size | 12 KB SVG |
| Transparent background? | YES |
| Visual subject | Nombre y marca en una sola línea |
| Narrative purpose | Representar recorrido y decisiones; contexto antes de decidir, sin anticipar resultado |
| Required elements | Firma horizontal para shell y pie; Figuras adolescentes genéricas sólo en hero; ausentes en marca |
| Forbidden elements | Derivar del mismo master; no generar una segunda marca; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Egresado; aplicar regla común de duplicación |
| Reuse scope | GLOBAL; derivado del mismo master |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | Derivación manual del logo principal |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/components/ui/wordmark.tsx:Wordmark; docs/09-design-system/assets.md |

## brand.logo-mark

| Campo | Contrato |
|---|---|
| Asset ID | brand.logo-mark |
| Category / granularity | BRAND / BRAND |
| Scenario/Surface | Marca compacta independiente |
| Priority | P0 |
| Required/Optional | Required para foundation RC3; no es requisito funcional del RC.2 |
| Reachability / status | PROPOSED |
| Target filename | logo-mark.svg |
| Source asset path | resources/rc3-assets/brand/logo-mark.svg |
| Runtime target path | public/assets/brand/logo-mark.svg |
| Target final format | SVG |
| Suggested source format | SVG editable manual / PNG conceptual; nunca tratar PNG como vector |
| Aspect ratio | 1:1 |
| Recommended dimensions | 64×64 viewBox; prueba a 16 y 32 px |
| Maximum recommended size | 12 KB SVG |
| Transparent background? | YES |
| Visual subject | Trayecto angular abierto con un cambio de dirección |
| Narrative purpose | Representar recorrido y decisiones; contexto antes de decidir, sin anticipar resultado |
| Required elements | Marca compacta independiente; Figuras adolescentes genéricas sólo en hero; ausentes en marca |
| Forbidden elements | No tilde idéntico a acierto, flecha de ranking, birrete genérico o detalle fino; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Egresado; aplicar regla común de duplicación |
| Reuse scope | GLOBAL; derivado del mismo master |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | Manual/vector; IA sólo boceto conceptual |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/components/ui/wordmark.tsx:Wordmark; docs/09-design-system/assets.md |

## brand.favicon

| Campo | Contrato |
|---|---|
| Asset ID | brand.favicon |
| Category / granularity | BRAND / BRAND |
| Scenario/Surface | Identidad en pestaña y acceso directo |
| Priority | P0 |
| Required/Optional | Required para foundation RC3; no es requisito funcional del RC.2 |
| Reachability / status | PROPOSED |
| Target filename | favicon.ico |
| Source asset path | resources/rc3-assets/brand/favicon-source.svg |
| Runtime target path | src/app/favicon.ico; src/app/apple-icon.png; public/assets/brand/app-icon-192.png; public/assets/brand/app-icon-512.png |
| Target final format | ICO + PNG |
| Suggested source format | SVG editable manual / PNG conceptual; nunca tratar PNG como vector |
| Aspect ratio | 1:1 |
| Recommended dimensions | 16/32 ICO; apple 180, app 192/512 PNG |
| Maximum recommended size | 30 KB ICO / 80 KB PNG 512 |
| Transparent background? | NO |
| Visual subject | La marca compacta sobre papel |
| Narrative purpose | Representar recorrido y decisiones; contexto antes de decidir, sin anticipar resultado |
| Required elements | Identidad en pestaña y acceso directo; Figuras adolescentes genéricas sólo en hero; ausentes en marca |
| Forbidden elements | Derivar; no encoger logo con letras; no transparencia en PNG de app; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Egresado; aplicar regla común de duplicación |
| Reuse scope | GLOBAL; derivado del mismo master |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | Derivación técnica sin IA |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/components/ui/wordmark.tsx:Wordmark; docs/09-design-system/assets.md |

## brand.social-mark

| Campo | Contrato |
|---|---|
| Asset ID | brand.social-mark |
| Category / granularity | BRAND / BRAND |
| Scenario/Surface | Marca social y tarjeta OG |
| Priority | P0 |
| Required/Optional | Required para foundation RC3; no es requisito funcional del RC.2 |
| Reachability / status | PROPOSED |
| Target filename | social-mark.png |
| Source asset path | resources/rc3-assets/brand/social-mark.png |
| Runtime target path | public/assets/brand/social-mark.png; src/app/opengraph-image.png |
| Target final format | PNG |
| Suggested source format | SVG editable manual / PNG conceptual; nunca tratar PNG como vector |
| Aspect ratio | 1:1 + 1.91:1 OG |
| Recommended dimensions | 512×512; derivado OG 1200×630 |
| Maximum recommended size | 200 KB OG / 60 KB social |
| Transparent background? | NO |
| Visual subject | Marca sobre papel con composición tipográfica fuera del raster generado |
| Narrative purpose | Representar recorrido y decisiones; contexto antes de decidir, sin anticipar resultado |
| Required elements | Marca social y tarjeta OG; Figuras adolescentes genéricas sólo en hero; ausentes en marca |
| Forbidden elements | No puntaje, nombre privado, podio inventado, institución no autorizada; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Egresado; aplicar regla común de duplicación |
| Reuse scope | GLOBAL; derivado del mismo master |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | Composición manual; reutiliza logo y hero |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/components/ui/wordmark.tsx:Wordmark; docs/09-design-system/assets.md |

## brand.hero

| Campo | Contrato |
|---|---|
| Asset ID | brand.hero |
| Category / granularity | BRAND / BRAND |
| Scenario/Surface | Portada del producto |
| Priority | P0 |
| Required/Optional | Required para foundation RC3; no es requisito funcional del RC.2 |
| Reachability / status | PROPOSED |
| Target filename | hero.webp |
| Source asset path | resources/rc3-assets/brand/hero-source.png |
| Runtime target path | public/assets/brand/hero.webp |
| Target final format | WebP |
| Suggested source format | PNG sin pérdida |
| Aspect ratio | 16:9 |
| Recommended dimensions | 1600×900; fuente 3200×1800 preferida |
| Maximum recommended size | 180 KB |
| Transparent background? | NO |
| Visual subject | Patio escolar: un recorrido geométrico conecta mesa de proyecto, encuentro y salón |
| Narrative purpose | Representar recorrido y decisiones; contexto antes de decidir, sin anticipar resultado |
| Required elements | Portada del producto; Figuras adolescentes genéricas sólo en hero; ausentes en marca |
| Forbidden elements | Sin seis casilleros numerados, números flotantes, graduación que prometa ganar o datos matemáticos; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Patio escolar y estudiantes preparando proyectos.; aplicar regla común de duplicación |
| Reuse scope | GLOBAL; derivado del mismo master |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | IA externa |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/components/ui/wordmark.tsx:Wordmark; docs/09-design-system/assets.md |

## global.ranking-foundation

| Campo | Contrato |
|---|---|
| Asset ID | global.ranking-foundation |
| Category / granularity | GLOBAL UI / GLOBAL |
| Scenario/Surface | Jerarquía del ranking público |
| Priority | P0 |
| Required/Optional | Required para foundation RC3; no es requisito funcional del RC.2 |
| Reachability / status | PROPOSED |
| Target filename | leaderboard.tsx |
| Source asset path | N/A — contrato en este handoff; no importar imagen |
| Runtime target path | src/components/competition/leaderboard.tsx (existente) |
| Target final format | HTML/CSS |
| Suggested source format | Código existente |
| Aspect ratio | fluido |
| Recommended dimensions | 320–412 px; filas flexibles |
| Maximum recommended size | 0 KB de imágenes nuevas |
| Transparent background? | N/A |
| Visual subject | Puesto escrito, alias y puntaje verificado en renglones editoriales |
| Narrative purpose | Representar recorrido y decisiones; contexto antes de decidir, sin anticipar resultado |
| Required elements | Jerarquía del ranking público; Figuras adolescentes genéricas sólo en hero; ausentes en marca |
| Forbidden elements | Sin tres pedestales rígidos, trofeos por persona, score dibujado o empate oculto; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Decorativo aria-hidden; el texto HTML comunica el estado; aplicar regla común de duplicación |
| Reuse scope | GLOBAL; derivado del mismo master |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | Composición con primitivas existentes; sin IA |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/components/competition/leaderboard.tsx |

## ending.foundation

| Campo | Contrato |
|---|---|
| Asset ID | ending.foundation |
| Category / granularity | GLOBAL UI / ENDING |
| Scenario/Surface | Egreso y resultado de carrera |
| Priority | P0 |
| Required/Optional | Required para foundation RC3; no es requisito funcional del RC.2 |
| Reachability / status | PROPOSED |
| Target filename | milestone.tsx |
| Source asset path | N/A — contrato en este handoff; no importar imagen |
| Runtime target path | src/components/game/milestone.tsx (existente) |
| Target final format | HTML/CSS/SVG inline |
| Suggested source format | Código existente |
| Aspect ratio | fluido |
| Recommended dimensions | 320–412 px |
| Maximum recommended size | 0 KB de imágenes nuevas |
| Transparent background? | N/A |
| Visual subject | Numeral o nombre de cierre, sello y confeti existentes |
| Narrative purpose | Representar recorrido y decisiones; contexto antes de decidir, sin anticipar resultado |
| Required elements | Egreso y resultado de carrera; Figuras adolescentes genéricas sólo en hero; ausentes en marca |
| Forbidden elements | No diploma raster, nota inventada ni celebración de puesto antes de verificar; negativos comunes |
| Text inside image? | NO en IA; sólo composición tipográfica manual del nombre en marca/OG |
| Alt strategy | Decorativo aria-hidden; el texto HTML comunica el estado; aplicar regla común de duplicación |
| Reuse scope | GLOBAL; derivado del mismo master |
| Dependencies | Reglas comunes; TASK-02 marca / TASK-03 ranking / TASK-05 ending / TASK-06 escenas |
| Generation method | Reutilización de Milestone; sin IA |
| Generation status | NOT GENERATED |
| Integration status | NOT INTEGRATED; foundation existente no equivale a RC3 integrado |
| Source references | src/components/game/milestone.tsx |

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
