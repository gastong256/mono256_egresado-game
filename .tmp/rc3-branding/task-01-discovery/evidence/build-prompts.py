from pathlib import Path
import json
O=Path('.tmp/rc3-branding/task-01-discovery'); assets=json.loads((O/'evidence/assets.json').read_text())
master='''Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.'''
negative='''Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.'''
s='''# Prompts de generación externa

Estado: propuestas completas; **ninguna imagen generada**. Usar sólo después de elegir dirección. Las fichas son autocontenidas: copiar el bloque completo del asset, adjuntar el piloto aprobado como referencia visual si la herramienta lo permite y conservar registro de procedencia. Los nombres de archivos son destinos, no texto a dibujar.

# MASTER STYLE

'''+master+'\n\n# NEGATIVE / AVOID\n\n'+negative+'''

# MASTER STYLE TEST — Wave 1

No es un asset extra del manifiesto ni un recurso runtime. Generar una prueba de `scenario.y1.expo` con su prompt de abajo; cotejar paleta, gesto, personas y claridad en el tamaño real. Guardar la prueba en `resources/rc3-assets/style/master-style-test-source.png` y su registro de generación en `resources/rc3-assets/style/provenance.json`. Si se aprueba, esa imagen puede convertirse en el piloto de expo; no pedir otra sólo por cambiar de wave.

# GLOBAL ASSETS

'''
for a in assets:
 if a['group']=='SCENARIO':continue
 s+='\n## '+a['id']+'\n\n'
 if a['id']=='brand.hero':
  s+='```text\n'+master+'\n\n'+f"ASSET ID: {a['id']}\nTARGET FILE: {a['sourcePath']} → {a['runtimePath']}\nASPECT RATIO: 16:9; fuente 3200×1800\nSCENE: Patio y acceso a un salón escolar, conectados visualmente por un camino angular discreto.\nPEOPLE: Figuras adolescentes genéricas colaborando; sin protagonista nominal.\nOBJECTS: Mesa de proyecto, papeles sin texto, mochila y puerta del salón.\nACTION: Preparar una muestra escolar antes de abrir.\nCOMPOSITION: Una acción central; objetos esenciales en zona segura; aire alrededor; sin collage de seis viñetas.\nLOCAL CONTEXT: Escuela argentina cotidiana, compatible con Resistencia sin identificar un edificio.\nMANDATORY DETAILS: Papel y verde botella; relación con las ilustraciones de escenas; CTA/título quedan fuera.\nAVOID: {a['risk']}. {negative}\nTEXT: NONE\n"+'```\n'
 elif a['id'] in ['brand.logo-primary','brand.logo-mark']:
  s+='''Uso: **exploración conceptual**, nunca logo raster final. Compartir una sola exploración del mark entre ambas fichas; nombre y variantes se componen después en vector.

```text
Diseñá un estudio aislado de símbolo para un juego escolar adolescente llamado Egresado, pero NO escribas ese nombre ni ninguna letra. Metáfora: recorrido y decisión. Una trayectoria angular abierta, máximo cuatro masas geométricas, esquinas rectas, terminaciones cuadradas, tinta #16181A o verde botella #1B6B3A sobre papel #F6F5F0. Sin textura, gradientes, sombras, brillo ni cuadrícula fina. Debe sobrevivir como silueta monocroma a 16×16. No usar el tilde de respuesta correcta como símbolo literal. No birrete, escudo, diploma, trofeo, libro con texto o flecha de ranking.
'''+f"ASSET ID: {a['id']}\nTARGET FILE: resources/rc3-assets/brand/logo-mark-concept-source.png; final manual {a['runtimePath']}\nASPECT RATIO: 1:1, 1024×1024\nSCENE: Símbolo aislado plano, no mockup.\nPEOPLE: NONE\nOBJECTS: Un gesto geométrico de recorrido.\nACTION: Un cambio de dirección, sin puntaje o jerarquía de personas.\nCOMPOSITION: Centro, margen 16%, sin pequeñas piezas flotantes.\nLOCAL CONTEXT: Identidad escolar argentina sin emblemas institucionales.\nMANDATORY DETAILS: Contraste fuerte; forma abierta; reconocimiento en un color.\nAVOID: Todos los negativos anteriores; no letras.\nTEXT: NONE\n"+'```\n'
 else:
  s+=f"**Producción sin IA:** {a['method']}. No enviar esta ficha a generar un raster de interfaz.\n\n"
  s+='```text\n'+f"ASSET ID: {a['id']}\nTARGET FILE: {a['runtimePath']}\nASPECT RATIO: {a['ratio']}\nSCENE: {a['subject']}\nPEOPLE: NONE\nOBJECTS: {a['objects']}\nACTION: Derivar del master aprobado / componer primitivas existentes.\nCOMPOSITION: {a['dimensions']}; mantener zona segura y legibilidad.\nLOCAL CONTEXT: Marca Egresado, es-AR sólo en HTML o composición tipográfica manual.\nMANDATORY DETAILS: {a['format']}; máximo {a['maxSize']}; alpha {a['alpha']}.\nAVOID: {a['risk']}.\nTEXT: NONE en generación; texto accesible real se compone fuera de IA.\n"+'```\n'
s+='\n# SCENARIO ASSETS\n\nTodas las P0/P1 están cubiertas arriba y abajo; también se incluyen los briefs P2. Las cuatro fichas DEV-ONLY se conservan para inventario y quedan excluidas de las waves RC3.\n'
for a in assets:
 if a['group']!='SCENARIO':continue
 s+='\n## '+a['id']+'\n\n'+a['priority']+' · '+a['status']+' · '+', '.join(a['templates'])+'\n\n'
 s+='```text\n'+master+'\n\n'+f"ASSET ID: {a['id']}\nTARGET FILE: {a['sourcePath']} → {a['runtimePath']}\nASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900\nSCENE: {a['subject']}.\nPEOPLE: {a['people']}.\nOBJECTS: {a['objects']}.\nACTION: {a['action']}.\nCOMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.\nLOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.\nMANDATORY DETAILS: {a['objects']}; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.\nAVOID: {a['risk']}. {negative}\nTEXT: NONE\n"+'```\n'
s+='''
# Orden de generación y aceptación

| Wave | Trabajo | Salida / criterio |
|---|---|---|
| 1 | MASTER STYLE TEST, usando expo | Una referencia aprobada; no lote masivo. |
| 2 | Exploración mark + hero; composición manual de logo, horizontal, favicon, social | Un solo sistema de marca. Ranking/ending se revisan como UI, no se generan. |
| 3 | Tres pilotos: colectivo, expo, peña | Juntos prueban exterior/interior/personas/objetos/evento; expo puede reutilizar Wave 1. |
| 4 | P1 restantes, de a lotes pequeños | Inventario de cola completo debajo. Priorizar máximo cuatro más en el primer pack; el presupuesto vigente no obliga a generar toda la cola. |
| 5 | P2 públicos si hay valor y capacidad | No generar DEV-ONLY salvo tarea futura separada. Nunca producir diez imágenes adicionales de Repaso. |

**Cola completa de Wave 4**: `scenario.g7.may-25`, `scenario.y1.classroom`, `scenario.y1.wheel`, `scenario.y2.survey`, `scenario.y2.court`, `scenario.y2.intercurso`, `scenario.y3.tech`, `scenario.y3.friend`, `scenario.y3.route`, `scenario.y4.event`, `scenario.y5.final-project`, `scenario.y5.trip`, `scenario.y5.screen`.

**Cola Wave 5 pública**: `scenario.y1.mobile-data`, `scenario.y1.rehearsal`, `scenario.y2.team-kit`, `scenario.y3.transport`, `scenario.y3.week`, `scenario.y4.represent`, `scenario.y5.yearbook`, `scenario.y5.next-step`.

Un lote se acepta si cada pieza reconoce su contexto a 320 px, coincide con el piloto en trazo/paleta/perspectiva, pasa crop móvil, no tiene texto/pseudotexto, no entrega respuesta ni fija parámetros, no inventa emblemas y cabe en su presupuesto después de optimizar. Ante inconsistencias se corrige el brief/referencia y se vuelve a probar; no se compensa con filtros CSS arbitrarios por escena. No conservar EXIF privado en runtime.
'''
write= lambda n,x:(O/n).write_text(x)
write('asset-generation-prompts.md',s)
