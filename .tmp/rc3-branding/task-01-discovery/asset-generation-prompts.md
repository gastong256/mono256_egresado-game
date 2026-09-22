# Prompts de generación externa

Estado: propuestas completas; **ninguna imagen generada**. Usar sólo después de elegir dirección. Las fichas son autocontenidas: copiar el bloque completo del asset, adjuntar el piloto aprobado como referencia visual si la herramienta lo permite y conservar registro de procedencia. Los nombres de archivos son destinos, no texto a dibujar.

# MASTER STYLE

Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

# NEGATIVE / AVOID

Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.

# MASTER STYLE TEST — Wave 1

No es un asset extra del manifiesto ni un recurso runtime. Generar una prueba de `scenario.y1.expo` con su prompt de abajo; cotejar paleta, gesto, personas y claridad en el tamaño real. Guardar la prueba en `resources/rc3-assets/style/master-style-test-source.png` y su registro de generación en `resources/rc3-assets/style/provenance.json`. Si se aprueba, esa imagen puede convertirse en el piloto de expo; no pedir otra sólo por cambiar de wave.

# GLOBAL ASSETS


## brand.logo-primary

Uso: **exploración conceptual**, nunca logo raster final. Compartir una sola exploración del mark entre ambas fichas; nombre y variantes se componen después en vector.

```text
Diseñá un estudio aislado de símbolo para un juego escolar adolescente llamado Egresado, pero NO escribas ese nombre ni ninguna letra. Metáfora: recorrido y decisión. Una trayectoria angular abierta, máximo cuatro masas geométricas, esquinas rectas, terminaciones cuadradas, tinta #16181A o verde botella #1B6B3A sobre papel #F6F5F0. Sin textura, gradientes, sombras, brillo ni cuadrícula fina. Debe sobrevivir como silueta monocroma a 16×16. No usar el tilde de respuesta correcta como símbolo literal. No birrete, escudo, diploma, trofeo, libro con texto o flecha de ranking.
ASSET ID: brand.logo-primary
TARGET FILE: resources/rc3-assets/brand/logo-mark-concept-source.png; final manual public/assets/brand/logo-primary.svg
ASPECT RATIO: 1:1, 1024×1024
SCENE: Símbolo aislado plano, no mockup.
PEOPLE: NONE
OBJECTS: Un gesto geométrico de recorrido.
ACTION: Un cambio de dirección, sin puntaje o jerarquía de personas.
COMPOSITION: Centro, margen 16%, sin pequeñas piezas flotantes.
LOCAL CONTEXT: Identidad escolar argentina sin emblemas institucionales.
MANDATORY DETAILS: Contraste fuerte; forma abierta; reconocimiento en un color.
AVOID: Todos los negativos anteriores; no letras.
TEXT: NONE
```

## brand.logo-horizontal

**Producción sin IA:** Derivación manual del logo principal. No enviar esta ficha a generar un raster de interfaz.

```text
ASSET ID: brand.logo-horizontal
TARGET FILE: public/assets/brand/logo-horizontal.svg
ASPECT RATIO: 4:1
SCENE: Nombre y marca en una sola línea
PEOPLE: NONE
OBJECTS: Firma horizontal para shell y pie
ACTION: Derivar del master aprobado / componer primitivas existentes.
COMPOSITION: 800×200 viewBox; mínimo 120×30; mantener zona segura y legibilidad.
LOCAL CONTEXT: Marca Egresado, es-AR sólo en HTML o composición tipográfica manual.
MANDATORY DETAILS: SVG; máximo 12 KB SVG; alpha YES.
AVOID: Derivar del mismo master; no generar una segunda marca.
TEXT: NONE en generación; texto accesible real se compone fuera de IA.
```

## brand.logo-mark

Uso: **exploración conceptual**, nunca logo raster final. Compartir una sola exploración del mark entre ambas fichas; nombre y variantes se componen después en vector.

```text
Diseñá un estudio aislado de símbolo para un juego escolar adolescente llamado Egresado, pero NO escribas ese nombre ni ninguna letra. Metáfora: recorrido y decisión. Una trayectoria angular abierta, máximo cuatro masas geométricas, esquinas rectas, terminaciones cuadradas, tinta #16181A o verde botella #1B6B3A sobre papel #F6F5F0. Sin textura, gradientes, sombras, brillo ni cuadrícula fina. Debe sobrevivir como silueta monocroma a 16×16. No usar el tilde de respuesta correcta como símbolo literal. No birrete, escudo, diploma, trofeo, libro con texto o flecha de ranking.
ASSET ID: brand.logo-mark
TARGET FILE: resources/rc3-assets/brand/logo-mark-concept-source.png; final manual public/assets/brand/logo-mark.svg
ASPECT RATIO: 1:1, 1024×1024
SCENE: Símbolo aislado plano, no mockup.
PEOPLE: NONE
OBJECTS: Un gesto geométrico de recorrido.
ACTION: Un cambio de dirección, sin puntaje o jerarquía de personas.
COMPOSITION: Centro, margen 16%, sin pequeñas piezas flotantes.
LOCAL CONTEXT: Identidad escolar argentina sin emblemas institucionales.
MANDATORY DETAILS: Contraste fuerte; forma abierta; reconocimiento en un color.
AVOID: Todos los negativos anteriores; no letras.
TEXT: NONE
```

## brand.favicon

**Producción sin IA:** Derivación técnica sin IA. No enviar esta ficha a generar un raster de interfaz.

```text
ASSET ID: brand.favicon
TARGET FILE: src/app/favicon.ico; src/app/apple-icon.png; public/assets/brand/app-icon-192.png; public/assets/brand/app-icon-512.png
ASPECT RATIO: 1:1
SCENE: La marca compacta sobre papel
PEOPLE: NONE
OBJECTS: Identidad en pestaña y acceso directo
ACTION: Derivar del master aprobado / componer primitivas existentes.
COMPOSITION: 16/32 ICO; apple 180, app 192/512 PNG; mantener zona segura y legibilidad.
LOCAL CONTEXT: Marca Egresado, es-AR sólo en HTML o composición tipográfica manual.
MANDATORY DETAILS: ICO + PNG; máximo 30 KB ICO / 80 KB PNG 512; alpha NO.
AVOID: Derivar; no encoger logo con letras; no transparencia en PNG de app.
TEXT: NONE en generación; texto accesible real se compone fuera de IA.
```

## brand.social-mark

**Producción sin IA:** Composición manual; reutiliza logo y hero. No enviar esta ficha a generar un raster de interfaz.

```text
ASSET ID: brand.social-mark
TARGET FILE: public/assets/brand/social-mark.png; src/app/opengraph-image.png
ASPECT RATIO: 1:1 + 1.91:1 OG
SCENE: Marca sobre papel con composición tipográfica fuera del raster generado
PEOPLE: NONE
OBJECTS: Marca social y tarjeta OG
ACTION: Derivar del master aprobado / componer primitivas existentes.
COMPOSITION: 512×512; derivado OG 1200×630; mantener zona segura y legibilidad.
LOCAL CONTEXT: Marca Egresado, es-AR sólo en HTML o composición tipográfica manual.
MANDATORY DETAILS: PNG; máximo 200 KB OG / 60 KB social; alpha NO.
AVOID: No puntaje, nombre privado, podio inventado, institución no autorizada.
TEXT: NONE en generación; texto accesible real se compone fuera de IA.
```

## brand.hero

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: brand.hero
TARGET FILE: resources/rc3-assets/brand/hero-source.png → public/assets/brand/hero.webp
ASPECT RATIO: 16:9; fuente 3200×1800
SCENE: Patio y acceso a un salón escolar, conectados visualmente por un camino angular discreto.
PEOPLE: Figuras adolescentes genéricas colaborando; sin protagonista nominal.
OBJECTS: Mesa de proyecto, papeles sin texto, mochila y puerta del salón.
ACTION: Preparar una muestra escolar antes de abrir.
COMPOSITION: Una acción central; objetos esenciales en zona segura; aire alrededor; sin collage de seis viñetas.
LOCAL CONTEXT: Escuela argentina cotidiana, compatible con Resistencia sin identificar un edificio.
MANDATORY DETAILS: Papel y verde botella; relación con las ilustraciones de escenas; CTA/título quedan fuera.
AVOID: Sin seis casilleros numerados, números flotantes, graduación que prometa ganar o datos matemáticos. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## global.ranking-foundation

**Producción sin IA:** Composición con primitivas existentes; sin IA. No enviar esta ficha a generar un raster de interfaz.

```text
ASSET ID: global.ranking-foundation
TARGET FILE: src/components/competition/leaderboard.tsx (existente)
ASPECT RATIO: fluido
SCENE: Puesto escrito, alias y puntaje verificado en renglones editoriales
PEOPLE: NONE
OBJECTS: Jerarquía del ranking público
ACTION: Derivar del master aprobado / componer primitivas existentes.
COMPOSITION: 320–412 px; filas flexibles; mantener zona segura y legibilidad.
LOCAL CONTEXT: Marca Egresado, es-AR sólo en HTML o composición tipográfica manual.
MANDATORY DETAILS: HTML/CSS; máximo 0 KB de imágenes nuevas; alpha N/A.
AVOID: Sin tres pedestales rígidos, trofeos por persona, score dibujado o empate oculto.
TEXT: NONE en generación; texto accesible real se compone fuera de IA.
```

## ending.foundation

**Producción sin IA:** Reutilización de Milestone; sin IA. No enviar esta ficha a generar un raster de interfaz.

```text
ASSET ID: ending.foundation
TARGET FILE: src/components/game/milestone.tsx (existente)
ASPECT RATIO: fluido
SCENE: Numeral o nombre de cierre, sello y confeti existentes
PEOPLE: NONE
OBJECTS: Egreso y resultado de carrera
ACTION: Derivar del master aprobado / componer primitivas existentes.
COMPOSITION: 320–412 px; mantener zona segura y legibilidad.
LOCAL CONTEXT: Marca Egresado, es-AR sólo en HTML o composición tipográfica manual.
MANDATORY DETAILS: HTML/CSS/SVG inline; máximo 0 KB de imágenes nuevas; alpha N/A.
AVOID: No diploma raster, nota inventada ni celebración de puesto antes de verificar.
TEXT: NONE en generación; texto accesible real se compone fuera de IA.
```

# SCENARIO ASSETS

Todas las P0/P1 están cubiertas arriba y abajo; también se incluyen los briefs P2. Las cuatro fichas DEV-ONLY se conservan para inventario y quedan excluidas de las waves RC3.

## scenario.g7.bus

P1 · PROPOSED · g7.bus-timing, g7.bus-latest-departure, g7.bus-travel-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.g7.bus
TARGET FILE: resources/rc3-assets/scenarios/grade-7/scenario-g7-bus-source.png → public/assets/scenes/g7-bus.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Parada de colectivo en una mañana escolar.
PEOPLE: Figuras adolescentes de espaldas, sin identidades asignadas.
OBJECTS: Colectivo sin número de línea, refugio simple, mochilas.
ACTION: Esperar antes de ir a la escuela.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Colectivo sin número de línea, refugio simple, mochilas; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin reloj legible ni horario, sin línea 60, sin identificar una salida correcta. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.g7.may-25

P1 · PROPOSED · g7.may-25-act

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.g7.may-25
TARGET FILE: resources/rc3-assets/scenarios/grade-7/scenario-g7-may-25-source.png → public/assets/scenes/g7-may-25.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Preparación de un acto escolar del 25 de Mayo.
PEOPLE: Adolescentes ensayando; docente lateral opcional.
OBJECTS: Salón sencillo, pañuelos lisos, escenario bajo.
ACTION: Preparar una coreografía folklórica sin mostrar pasos de solución.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Salón sencillo, pañuelos lisos, escenario bajo; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin grilla de números, disfraces caricaturescos, banderas inventadas ni una pose que resuelva la regla. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.g7.group

P2 · DEFERRED — DEV-ONLY · g7.group-tasks

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.g7.group
TARGET FILE: resources/rc3-assets/scenarios/grade-7/scenario-g7-group-source.png → public/assets/scenes/g7-group.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Mesa de trabajo para el proyecto de la feria.
PEOPLE: Figuras sin retratos asignados a Lucas, Sofía, Mateo o Vos.
OBJECTS: Papeles en blanco y materiales escolares.
ACTION: Preparar materiales antes del reparto.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Papeles en blanco y materiales escolares; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No asignar tareas o afinidades; no fijar número de integrantes como dato visual. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.g7.mural

P2 · DEFERRED — DEV-ONLY · g7.mural-paint

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.g7.mural
TARGET FILE: resources/rc3-assets/scenarios/grade-7/scenario-g7-mural-source.png → public/assets/scenes/g7-mural.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Pared exterior preparada para pintar un mural.
PEOPLE: Sin personas necesarias.
OBJECTS: Lona, rodillo, recipientes cerrados sin etiqueta.
ACTION: Preparación del espacio.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Lona, rodillo, recipientes cerrados sin etiqueta; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No medidas, área, cantidad o tamaños de envase que sugieran solución. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.g7.notebook

P2 · DEFERRED — DEV-ONLY · g7.notebook-offer

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.g7.notebook
TARGET FILE: resources/rc3-assets/scenarios/grade-7/scenario-g7-notebook-source.png → public/assets/scenes/g7-notebook.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Computadora portátil para el proyecto del curso.
PEOPLE: Manos opcionales sin identidad.
OBJECTS: Una computadora portátil apagada y carpeta sin texto.
ACTION: Mirar el equipo antes de comparar ofertas.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Una computadora portátil apagada y carpeta sin texto; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Notebook significa computadora; no cuadernos como sujeto principal, precios, descuentos o marcas. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.g7.stand

P2 · DEFERRED — DEV-ONLY · g7.stand-supplies

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.g7.stand
TARGET FILE: resources/rc3-assets/scenarios/grade-7/scenario-g7-stand-source.png → public/assets/scenes/g7-stand.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Merienda de un stand escolar en preparación.
PEOPLE: Figuras de fondo opcionales.
OBJECTS: Mesa, recipientes opacos y vajilla genérica.
ACTION: Preparar el puesto antes de abrir.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Mesa, recipientes opacos y vajilla genérica; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No representar packs o porciones contables ni precios. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y1.classroom

P1 · PROPOSED · y1.classroom-layout, y1.scale-fit-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y1.classroom
TARGET FILE: resources/rc3-assets/scenarios/grade-1/scenario-y1-classroom-source.png → public/assets/scenes/y1-classroom.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Aula antes de una exposición.
PEOPLE: Sin personas necesarias.
OBJECTS: Mesas sin disposición final, puerta, caja de materiales.
ACTION: Preparar el aula.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Mesas sin disposición final, puerta, caja de materiales; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No plano cenital, cuadrícula a escala, pasillo resuelto ni cantidad de sillas que responda el problema. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y1.expo

P1 · PROPOSED · y1.course-project-expo

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y1.expo
TARGET FILE: resources/rc3-assets/scenarios/grade-1/scenario-y1-expo-source.png → public/assets/scenes/y1-expo.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Primera exposición del Proyecto del Curso.
PEOPLE: Adolescentes genéricos sin asignarlos a Alex, Dani o Sam.
OBJECTS: Mesa de muestra, soporte vacío, materiales sin texto.
ACTION: Conversar antes de distribuir responsabilidades.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Mesa de muestra, soporte vacío, materiales sin texto; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No fijar quién presenta, fases, roles ni afinidades. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y1.mobile-data

P2 · PROPOSED · y1.mobile-data

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y1.mobile-data
TARGET FILE: resources/rc3-assets/scenarios/grade-1/scenario-y1-mobile-data-source.png → public/assets/scenes/y1-mobile-data.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Organización del celular para las actividades del curso.
PEOPLE: Una figura adolescente en plano medio, rostro simplificado.
OBJECTS: Celular sin interfaz legible, carpeta.
ACTION: Consultar el celular en una mesa escolar.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Celular sin interfaz legible, carpeta; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No barras de consumo, apps reconocibles, MB o cuotas de uso. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y1.rehearsal

P2 · PROPOSED · y1.rehearsal-schedule, y1.schedule-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y1.rehearsal
TARGET FILE: resources/rc3-assets/scenarios/grade-1/scenario-y1-rehearsal-source.png → public/assets/scenes/y1-rehearsal.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Salón antes del ensayo del Día del Estudiante.
PEOPLE: Figuras adolescentes preparando el lugar.
OBJECTS: Soporte de cartel vacío, equipo de sonido genérico, materiales.
ACTION: Preparar un ensayo.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Soporte de cartel vacío, equipo de sonido genérico, materiales; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin agenda resuelta, reloj, horarios ni secuencia de actividades. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y1.wheel

P1 · PROPOSED · y1.student-day-challenge-wheel

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y1.wheel
TARGET FILE: resources/rc3-assets/scenarios/grade-1/scenario-y1-wheel-source.png → public/assets/scenes/y1-wheel.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Encuentro escolar del Día del Estudiante.
PEOPLE: Adolescentes en una actividad compartida sin protagonista.
OBJECTS: Soporte circular visto de canto, elementos de juego guardados.
ACTION: Preparar las actividades del encuentro.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Soporte circular visto de canto, elementos de juego guardados; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No ruleta de casino, sectores visibles, probabilidades ni número de posiciones. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y2.survey

P1 · PROPOSED · y2.course-project-survey, y2.data-claim-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y2.survey
TARGET FILE: resources/rc3-assets/scenarios/grade-2/scenario-y2-survey-source.png → public/assets/scenes/y2-survey.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Revisión de una encuesta del curso.
PEOPLE: Adolescentes conversando alrededor de una mesa.
OBJECTS: Hojas sin texto, portapapeles y sobres.
ACTION: Revisar lo que se puede contar de una consulta.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Hojas sin texto, portapapeles y sobres; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin gráficos, porcentajes o votos que validen una afirmación. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y2.court

P1 · PROPOSED · y2.court-zones

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y2.court
TARGET FILE: resources/rc3-assets/scenarios/grade-2/scenario-y2-court-source.png → public/assets/scenes/y2-court.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Cancha escolar antes de armar las postas.
PEOPLE: Figuras pequeñas al borde, no ubicadas como postas.
OBJECTS: Cancha en perspectiva oblicua, implementos guardados.
ACTION: Preparar un encuentro deportivo.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Cancha en perspectiva oblicua, implementos guardados; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No distancias, coordenadas, marcas de postas, sector techado a escala ni plan óptimo. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y2.intercurso

P1 · PROPOSED · y2.intercurso-plan, y2.standings-claim

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y2.intercurso
TARGET FILE: resources/rc3-assets/scenarios/grade-2/scenario-y2-intercurso-source.png → public/assets/scenes/y2-intercurso.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Preparación del Intercurso junto a la cancha.
PEOPLE: Adolescentes genéricos del curso.
OBJECTS: Banco lateral, portapapeles sin texto, bolso deportivo.
ACTION: Conversar antes de organizar la jornada.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Banco lateral, portapapeles sin texto, bolso deportivo; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No alineación de equipos, resultados, puestos o partidos dibujados; sirve para plan y tabla. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y2.team-kit

P2 · PROPOSED · y2.team-kit-order

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y2.team-kit
TARGET FILE: resources/rc3-assets/scenarios/grade-2/scenario-y2-team-kit-source.png → public/assets/scenes/y2-team-kit.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Preparación de pecheras para el Intercurso.
PEOPLE: Manos opcionales.
OBJECTS: Telas y pecheras parcialmente plegadas sin marcas.
ACTION: Preparar un pedido.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Telas y pecheras parcialmente plegadas sin marcas; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No cantidades contables ni colores de equipos que den proporciones; sin escudos. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y3.tech

P1 · PROPOSED · y3.course-project-tech, y3.rate-capacity-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y3.tech
TARGET FILE: resources/rc3-assets/scenarios/grade-3/scenario-y3-tech-source.png → public/assets/scenes/y3-tech.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Stand de la feria de tecnología en preparación.
PEOPLE: Adolescentes genéricos trabajando juntos.
OBJECTS: Portátil, pendrive, piezas de prototipo abstracto.
ACTION: Preparar una muestra con recursos compartidos.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Portátil, pendrive, piezas de prototipo abstracto; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No métricas de almacenamiento, conexiones que certifiquen internet ni piezas que resuelvan cantidades. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y3.friend

P1 · PROPOSED · y3.friend-day

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y3.friend
TARGET FILE: resources/rc3-assets/scenarios/grade-3/scenario-y3-friend-source.png → public/assets/scenes/y3-friend.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Encuentro de amigos por la tarde cerca de un club barrial.
PEOPLE: Adolescentes de 14–17 en poses cotidianas.
OBJECTS: Banco, bolsos, entrada genérica sin nombre.
ACTION: Encontrarse antes de la actividad.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Banco, bolsos, entrada genérica sin nombre; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No horarios, rutas, número fijo de asistentes o clubes reales. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y3.route

P1 · PROPOSED · y3.route-plan

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y3.route
TARGET FILE: resources/rc3-assets/scenarios/grade-3/scenario-y3-route-source.png → public/assets/scenes/y3-route.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Esquina barrial durante los mandados del sábado.
PEOPLE: Figura adolescente caminando por la vereda.
OBJECTS: Fachadas genéricas sin cartelería, bolsa reutilizable.
ACTION: Hacer mandados en el barrio.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Fachadas genéricas sin cartelería, bolsa reutilizable; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin mapa, calles, flechas, rutas o comercios reales; no ordenar los destinos. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y3.transport

P2 · PROPOSED · y3.transport-pass, y3.fixed-variable-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y3.transport
TARGET FILE: resources/rc3-assets/scenarios/grade-3/scenario-y3-transport-source.png → public/assets/scenes/y3-transport.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Decisión de cómo pagar los viajes escolares.
PEOPLE: Manos opcionales en primer plano.
OBJECTS: Tarjeta de transporte completamente genérica, colectivo al fondo.
ACTION: Preparar el viaje del mes.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Tarjeta de transporte completamente genérica, colectivo al fondo; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin marca de tarjeta, tarifa, boleto legible o indicación de opción más barata. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y3.week

P2 · PROPOSED · y3.week-planner

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y3.week
TARGET FILE: resources/rc3-assets/scenarios/grade-3/scenario-y3-week-source.png → public/assets/scenes/y3-week.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Escritorio al preparar la semana.
PEOPLE: Sin personas necesarias.
OBJECTS: Cuaderno cerrado, mochila, carpetas lisas.
ACTION: Preparar materiales de la semana.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Cuaderno cerrado, mochila, carpetas lisas; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin calendario, horarios o planificación resuelta; no copiar diagrama de interacción. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y4.fundraiser

P1 · PROPOSED · y4.course-project-fundraiser, y4.margin-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y4.fundraiser
TARGET FILE: resources/rc3-assets/scenarios/grade-4/scenario-y4-fundraiser-source.png → public/assets/scenes/y4-fundraiser.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Preparativos de una peña escolar.
PEOPLE: Adolescentes preparando mesas, vestimenta cotidiana.
OBJECTS: Bandejas tapadas, mantel, decoración austera.
ACTION: Preparar una actividad para recaudar.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Bandejas tapadas, mantel, decoración austera; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No cantidades, precios, márgenes, alcohol ni estereotipos regionales. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y4.event

P1 · PROPOSED · y4.event-floor-plan, y4.school-event-flow, y4.shift-coverage, y4.spatial-capacity-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y4.event
TARGET FILE: resources/rc3-assets/scenarios/grade-4/scenario-y4-event-source.png → public/assets/scenes/y4-event.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Salón escolar antes de recibir un evento.
PEOPLE: Figuras dispersas preparando el lugar.
OBJECTS: Puerta, mesas apiladas, puesto lateral sin carteles.
ACTION: Preparar el salón antes de abrir.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Puerta, mesas apiladas, puesto lateral sin carteles; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin plano, filas contables, roles asignados o flujo óptimo; imagen previa al problema válida para tres escenas. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y4.represent

P2 · PROPOSED · y4.represent-class

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y4.represent
TARGET FILE: resources/rc3-assets/scenarios/grade-4/scenario-y4-represent-source.png → public/assets/scenes/y4-represent.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Conversación del curso con el consejo escolar.
PEOPLE: Adolescente genérico ante interlocutores sin jerarquía heroica.
OBJECTS: Mesa sencilla, carpeta sin texto.
ACTION: Presentar ideas con escucha mutua.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Mesa sencilla, carpeta sin texto; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin votos, aprobaciones visuales, micrófono de campaña ni autoridad institucional inventada. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y5.final-project

P1 · PROPOSED · y5.course-project-final

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y5.final-project
TARGET FILE: resources/rc3-assets/scenarios/grade-5/scenario-y5-final-project-source.png → public/assets/scenes/y5-final-project.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Preparación de la muestra final del curso.
PEOPLE: Adolescentes revisando materiales sin roles nominales.
OBJECTS: Mesa de muestra, panel vacío y material sin texto.
ACTION: Reorganizar el trabajo antes de exponer.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Mesa de muestra, panel vacío y material sin texto; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No tarea tachada, solución de contingencia, promesas o asignaciones predeterminadas. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y5.trip

P1 · PROPOSED · y5.final-trip-or-event, y5.multi-option-comparison-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y5.trip
TARGET FILE: resources/rc3-assets/scenarios/grade-5/scenario-y5-trip-source.png → public/assets/scenes/y5-trip.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Preparación de un viaje de egreso.
PEOPLE: Adolescentes con bolsos, sin promoción turística.
OBJECTS: Micro genérico y equipaje.
ACTION: Reunirse antes de salir.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Micro genérico y equipaje; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No destino, empresa, costo, paquetes ni cantidad de pasajeros que decida la comparación. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y5.screen

P1 · PROPOSED · y5.stage-screen

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y5.screen
TARGET FILE: resources/rc3-assets/scenarios/grade-5/scenario-y5-screen-source.png → public/assets/scenes/y5-screen.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Preparativos de la pantalla del acto de egreso.
PEOPLE: Figuras de fondo opcionales.
OBJECTS: Proyector y pantalla vacía vistos en oblicuo.
ACTION: Preparar la proyección antes de mostrar la imagen.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Proyector y pantalla vacía vistos en oblicuo; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: No imagen proyectada, relación de aspecto comparativa, fecha o cartel; nunca ilustrar cómo encaja. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y5.yearbook

P2 · PROPOSED · y5.yearbook, y5.proportion-capacity-review

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y5.yearbook
TARGET FILE: resources/rc3-assets/scenarios/grade-5/scenario-y5-yearbook-source.png → public/assets/scenes/y5-yearbook.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Mesa de preparación de un anuario.
PEOPLE: Manos adolescentes opcionales.
OBJECTS: Libro cerrado sin título, hojas parcialmente superpuestas.
ACTION: Seleccionar recuerdos sin mostrar reparto.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Libro cerrado sin título, hojas parcialmente superpuestas; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin páginas contables, fotos identificables, secciones o cuotas resueltas. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

## scenario.y5.next-step

P2 · PROPOSED · y5.next-step-options

```text
Ilustración editorial geométrica para Egresado, juego de decisiones de escuela argentina para adolescentes de aproximadamente 12–17 años. Apariencia de vector de pocas tintas reproducido en papel, formas planas legibles y bordes nítidos, sin volumen 3D. Contornos de grosor uniforme, terminación cuadrada y detalle mínimo; perspectiva oblicua suave y consistente, sin lente gran angular. Paleta limitada: papel cálido #F6F5F0, tinta #16181A, gris #C9C6BE, verde botella #1B6B3A; rojo #C0272D sólo en un detalle contextual pequeño que no indique resultado. Sin lima ni neón; el CTA y Aura reservan esos colores en la interfaz. Grano de impresión casi imperceptible en masas grandes, no ruido sobre contornos. Luz difusa sin sombras proyectadas dramáticas, sin gradientes brillantes. Arquitectura escolar o barrial argentina genérica; no fachada real, institución, calle o marca inventada. Figuras de proporciones adolescentes naturales, rostros simplificados no focales, ropa casual/escolar no identificable, diversidad razonable sin asignar etnicidad ni identidad a nombres del juego. Una acción principal, pocos grupos de objetos, 25% de aire visual. Conservar todo lo esencial dentro del 70% central del ancho y 80% del alto para recorte móvil. La imagen ambienta el momento anterior a decidir: no enseña una respuesta, reparto, ruta, horario, cantidad ni estado correcto. Compatible con UI de papel cuadriculado, tipografía editorial, radio cero y sin sombras. TEXT: NONE; ninguna letra, número, palabra, fecha o símbolo matemático legible.

ASSET ID: scenario.y5.next-step
TARGET FILE: resources/rc3-assets/scenarios/grade-5/scenario-y5-next-step-source.png → public/assets/scenes/y5-next-step.webp
ASPECT RATIO: 16:9; fuente preferida 3200×1800, final 1600×900
SCENE: Materiales abiertos al terminar la escuela.
PEOPLE: Figura adolescente reflexionando sin destino decidido.
OBJECTS: Carpetas lisas, mochila, ventana a un entorno cotidiano.
ACTION: Pensar qué viene después.
COMPOSITION: Vista oblicua simple; una acción focal; elementos esenciales dentro del 70% central del ancho y 80% del alto; tolerar crop móvil 3:2.
LOCAL CONTEXT: Escuela y barrio argentinos cotidianos; compatible con Resistencia, Chaco, sin lugares ni datos locales inventados.
MANDATORY DETAILS: Carpetas lisas, mochila, ventana a un entorno cotidiano; contexto anterior a decidir; no ilustrar los parámetros del problema; gesto humano natural.
AVOID: Sin profesiones jerarquizadas, títulos universitarios, sueldos, horarios ni elección ganadora. Evitar: texto o pseudotexto, letras, cifras, precios, porcentajes, relojes legibles, calendarios, fórmulas, marcas de agua, firmas, logos, escudos, uniformes reales, marcas comerciales, datos personales, datos o solución del desafío, badges de respuesta correcta, podios que anuncien ganadores, fotorealismo brillante, 3D, anime, caricatura infantil, cabezas gigantes, poses adultizadas, sexualización, estereotipos regionales, banderas o instituciones inventadas, manos deformes, personajes duplicados, sombras, neón, lima decorativa, fondos negros, saturación alta, detalle fino y composición cargada.
TEXT: NONE
```

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
