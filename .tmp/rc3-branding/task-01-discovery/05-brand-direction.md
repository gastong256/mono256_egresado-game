# Dirección de marca propuesta

**Recomendación: Trayectoria en papel. Estado: PROPOSED, no nueva autoridad de producto.** Conserva la identidad papel aceptada y propone una familia de ilustraciones geométricas para el enriquecimiento RC3. El encargo autoriza comparar y recomendar; no autoriza reemplazar silenciosamente ADR-017 ni el brief fotográfico de `docs/09-design-system/assets.md`.

## Identidad actual verificada

| Hipótesis | Código / evidencia | Resultado |
|---|---|---|
| Papel cálido y grilla editorial | `tokens.css`, `base.css:eg-canvas` | Sí: `#f6f5f0`, grilla `#e6e4dc`, celda 16 px. |
| Radio 0 / sin sombras | escalas apagadas en `tokens.css`; `theme.css` | Sí; excepción de text-shadow sólo Aura. |
| Schibsted Grotesk + Libre Franklin | `src/app/fonts/index.ts`, WOFF2 versionados | Sí; títulos/datos y prosa respectivamente. |
| Selección en superficie oscura | `DecisionBlock`, `ChoiceCard`, `ChallengeFrame` | Sí para modos que la usan; constructivos también presentan sobre papel. No oscurecer todas las interacciones. |
| Aura black island | `AuraBlock`, `--aura-surface` | Sí: negro reservado, no color de toda la app. |
| Lima CTA | `--action`, `Button` | Sí, sólo botón principal; no tinta de ilustración ni estados. |
| Verde escolar / rojo tensión | `--green`, `--red` | Sí; estados además tienen palabra y forma. |
| Logo gráfico | `Wordmark` | No: texto tipográfico, no SVG de marca. |
| Ilustraciones actuales | `public/.gitkeep`, ausencia de consumers de `SceneMedia` | Ninguna. El estilo fotográfico existe como brief, no como arte integrado. |
| Breakpoints | `SceneMedia`, theme de Tailwind instalado | `sm` 40rem; gameplay 412 px centrado a todas las anchuras; crop cambia, shell no se estira. |

Las referencias PNG de v0.2 fijan gramática visual, no copy ni parámetros vigentes. La captura del colectivo confirma papel, jerarquía de datos y bloque oscuro; el número de línea no se adopta como referencia local.

## Tres direcciones comparadas

| Campo | A · Trayectoria en papel | B · Lugares que cuentan | C · Sello de recorrido |
|---|---|---|---|
| Core idea | Decisiones que construyen un recorrido escolar | El lugar cotidiano cuenta la historia antes de decidir | Cada año deja una huella de lo vivido |
| Visual metaphor | Camino angular abierto sobre retícula | Archivo fotográfico escolar editorial | Marca impresa, legajo y registro |
| Personality | Clara, curiosa, juvenil sin infantilización | Cercana, tranquila, observacional | Institucional, sobria, memorable |
| Shape language | Planos geométricos simples; esquinas rectas | Encuadres de arquitectura y objetos; composición limpia | Bloques y filetes; sello abierto, no escudo |
| Typography relationship | SG visible en HTML; LF sostiene prosa; imagen sin letras | Tipografía existente contrasta con fotografía | SG fuerte, sin serif nueva; limitar mayúsculas |
| Color treatment | Papel, tinta, verde botella; rojo puntual; lima fuera del arte | Natural desaturado, papel visible; no teñir toda foto de verde | Monocromo tinta/verde; rojo para tensión existente |
| Illustration relationship | Vector editorial reproducido a WebP; grano mínimo | Fotográfico editorial del brief vigente; rostros fuera de foco | Objetos/símbolos geométricos muy reducidos |
| Strengths | Coherencia entre interiores, exteriores, personas y objetos; pocos detalles sobreviven a 412 px | Máxima continuidad con docs; cercanía de espacios sin crear elenco | Excelente a 16 px; costo bajo; reusa lenguaje de Milestone |
| Risks | Parecer infantil si cabezas y gestos se exageran; cambiar brief sin registrarlo | Realismo local falso, variación de luz/rostros, más ruido y bytes | Parecer diploma/examen o confundir marca con acierto |
| Logo implications | Wordmark actual + trayecto abstracto simple, símbolo independiente | Wordmark dominante, marca secundaria mínima | Monograma abierto o sello tipográfico; sin blasón |
| Hero implications | Patio con actividades conectadas, una sola composición | Fotografía amplia del espacio antes de un evento | Composición abstracta de hoja y recorrido |
| Favicon implications | Trayecto angular legible sin letras | Símbolo tipográfico reducido, ajeno a la foto | Muy legible si elimina marco y texto pequeño |
| Suitability | Alta: decisiones, escuela, datos y producción consistente | Alta como alternativa conservadora; más exigencia de localización visual | Media: útil para cierre, menos rica para escenas sociales |

A se recomienda porque el producto ya usa geometría, filetes y tipografía editorial. Permite un vocabulario común sin inventar mecánicas ni un protagonista, sostiene legibilidad móvil y requiere menos textura para reconocer un lugar. B sigue siendo válida si se prioriza continuidad estricta con el brief aceptado; C se aprovecha en el cierre existente sin convertir toda la experiencia en un boletín.

La economía de bytes es un objetivo de producción, no una comparación medida entre imágenes que aún no existen. La consistencia con IA es una hipótesis a validar mediante pilotos, no una garantía del generador. La aprobación de A debe quedar registrada en la documentación visual canónica durante TASK-02; si cruza identidad aceptada, revisar ADR-017 con la política de decisiones. TASK-01 no produce ese cambio.

## Brief del sistema de logo

| Variante | Concepto y geometría | Límite / escala | Fondos y color | Evitar |
|---|---|---|---|---|
| `brand.logo-primary` | Nombre Egresado + un trayecto abierto; grilla de construcción invisible | Máximo 3–4 masas geométricas en símbolo; palabra legible a 120 px de ancho | Tinta o verde escolar sobre papel; variante tinta monocroma | Nombre deformado por IA, trofeo, birrete automático, badge de examen |
| `brand.logo-horizontal` | Misma marca y nombre en una línea | Proporción aproximada 4:1, no segundo diseño | Igual al master; firma discreta de shell/pie | Emblema que agrande HUD, lema minúsculo |
| `brand.logo-mark` | Gesto de camino con una inflexión, reconocible sin palabra | 64×64 master; trazo/masa equivalente a ≥2 px a 16 px; sin huecos que colapsen | Tinta sobre papel; un solo color basta | Copiar exactamente TickMark: la marca no significa respuesta correcta |
| `brand.favicon` | Derivado óptico del mark | Probar 16, 32, 180, 192, 512 px; simplificar el de 16 si hace falta | Fondo papel opaco para app, margen interior 12–16% | Wordmark reducido, detalle fino, cuadrícula minúscula con moiré |
| `brand.social-mark` | Mark grande y composición editorial derivada | 512×512; OG 1200×630 con márgenes 8% | Papel + marca; letras compuestas después | Alias real, puntaje de prueba presentado como ganador, instituciones inventadas |

La IA puede explorar un símbolo sin letras. El acabado final se redibuja en SVG editable y el nombre se compone con Schibsted real; no se vectoriza a ciegas el ruido del raster. En la app puede mantenerse `Wordmark` como texto y agregar un mark decorativo; no es obligatorio reemplazar el texto accesible por imagen. La palabra exacta **Egresado** aparece sólo en composición manual o HTML, no dentro de una generación que exige TEXT: NONE.

## Brief del hero

Una escena editorial del patio y acceso al salón, con figuras adolescentes genéricas preparando una muestra y encontrándose. La arquitectura y la posición de mesas crean el recorrido; no hay seis casilleros numerados, barras de progreso, collage de capturas ni fórmulas flotantes. La matemática se insinúa en decisiones sobre espacio, materiales y organización, sin dibujar su solución.

- Una acción focal: preparar algo entre compañeros; las demás son contexto tenue. No multitud ni diploma central.
- Relación 16:9, fuente 3200×1800, final 1600×900; máximo propuesto 180 KB.
- Protagonismo en 70% central del ancho y 80% del alto, para tolerar crop móvil 3:2. Si la portada futura requiere otro crop, derivarlo del mismo master y validarlo antes de cargar un segundo recurso.
- Aproximadamente 25% de aire visual. Título y CTA son HTML fuera de la ilustración; no superposición que dependa del contraste del fondo.
- Papel de fondo; verde botella puntual y tinta; sin bloque negro, lima decorativa, sombras de tarjeta o brillos.
- Sin escudo, uniforme identificable, fachada escolar real o una graduación presentada como triunfo en el ranking. La competencia la explican reglas y datos, no un podio en la imagen.
- Misma técnica, perspectiva y proporciones que escenas; hero no inaugura una estética distinta.

## Personajes

**Recomendación B: figuras genéricas no identificadas**, no protagonistas recurrentes. Documentación define relaciones recurrentes sin nombres obligatorios; el código sí nombra integrantes concretos y a veces varía nombres. Una imagen que fije a Alex/Dani/Sam o Lucas/Sofía/Mateo por apariencia asignaría identidades que el producto no declaró.

Mantener proporciones adolescentes, de aproximadamente 12–17, diversidad razonable de apariencias, ropa casual/escolar sin insignias, poses naturales y escenas seguras. Sin retratos de alumnos reales, estética de jardín, caricatura regional ni etnicidad obligatoria inventada. Los mismos tipos de silueta pueden repetirse como lenguaje de dibujo, sin afirmar que son el mismo personaje. Rostros simplificados y secundarios.

## Pilotos y decisión de estilo

1. `scenario.g7.bus`: exterior, transporte, profundidad y figura de espaldas.
2. `scenario.y1.expo`: interior, personas colaborando y objeto de proyecto, sin asignar roles.
3. `scenario.y4.fundraiser`: evento/peña, materiales y contexto económico sin precios ni cantidades.

Evaluarlos juntos a 412 y 320 px: se reconoce la situación, no se revela la respuesta, ninguna cifra está rasterizada, formas y paleta coinciden, la prosa sigue dominando, el crop conserva el foco. Si uno falla, ajustar MASTER STYLE y repetir los tres antes de encargar el resto. No aprobar treinta piezas sueltas con estilos diferentes.
