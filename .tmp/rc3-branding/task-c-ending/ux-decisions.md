# Decisiones UX — TASK-C

## Jerarquía de información

```text
1  FIN DE LA SECUNDARIA · Egresado (h1, 66 px) · EGRESASTE · una línea de perfil
2  Resultado: puntaje verificado (66 px) · franja · TU PUESTO ACTUAL · claim · mejor partida
3  Tu estilo: nombre + línea · triángulo de Estilo · Promedio / Equipo / Aura
4  Tus hitos (medallero; oculto si no hay)
5  Tu recorrido: 7.º … 5.º, tema del arco · marcador · escena del año
6  Línea de cierre · acciones
```

Por qué el puesto va segundo y no sexto: la pregunta que un participante de
feria se hace después de «¿terminé?» es «¿cómo quedé?», y enterrarlo bajo la
timeline lo convertía en un pie de página (TASK-01 H07, encargo §116). El
epílogo v1 de `narrative-system.md` lo ponía último; TASK-C lo sube por
decisión del PO y deja el resto del orden (graduación → perfil → estilo/
números → hitos → recorrido). Se registra en el documento canónico como nota
RC3, sin reescribir el diseño cerrado.

Por qué la graduación sigue primera y más grande: es lo único que toda run
consigue; el puntaje es lo que distingue una run de otra. Si el número fuera
lo primero, egresar dejaría de sentirse como algo.

Por qué la franja va pegada al puntaje y la línea de cierre a las acciones: la
frase corta explica el número que se acaba de leer; la larga dice qué hacer con
eso justo donde está el botón.

## Estilo antes que números

El estilo es una lectura de la carrera; los números son su evidencia. Leerlos
en ese orden (nombre → línea → triángulo → registro) evita que la pantalla
parezca un dashboard: primero se entiende, después se comprueba.

## Medallero

Tarjetas de tinta sobre papel con tilde verde, grilla de una columna en móvil
y dos desde `sm`. Sin oro/plata/bronce: un hito no compite con nadie. Sin
sección cuando no hay hitos: un panel vacío afirma una ausencia que no hace
falta afirmar. Podio y medallero se distinguen en lugar (el podio vive en el
bloque de resultado), lenguaje («puesto» vs «hito») y forma (número grande vs
tarjeta con tilde).

## Recorrido

Lista vertical, un renglón por año, grilla de dos columnas (numeral, texto).
Nunca horizontal: seis años a 320 px no entran en una fila y un scroll lateral
escondería el final. Marcador por palabra —«Todo Óptimo», «Repaso cerrado»,
«Repaso con lo justo», «Completado»— nunca por color. La escena del año sale
de los recuerdos que el motor ya deriva (raro > icónico > Repaso > ordinario),
así el recorrido cuenta lo que TASK-B cerró año por año sin guardar copias.

## Motion

Sin animación nueva. El confeti CSS existente (18 tiras deterministas, 1,4 s)
sigue disparando en el egreso y en ningún otro lugar; con
`prefers-reduced-motion` no se dibuja. Ningún reveal escalonado: el jugador
puede leer y actuar desde el primer frame, y el puntaje aparece cuando el
servidor responde, no cuando termina una animación.

## Responsive

Columna de 412 px centrada en todos los anchos (shell existente). Verificado a
320 / 390 / 412 / 1280 y al 200 % de zoom sobre 1280 sin scroll horizontal
(script de capturas + `reflow` en E2E). Los numerales grandes usan
`text-milestone` (66 px) y entran a 320 px con cinco dígitos y punto de miles.

## Accesibilidad

- `h1` = «Egresado» (el numeral del hito); `h2` por sección, con
  `aria-labelledby`.
- Orden DOM = orden visual = orden de lectura.
- Estado de verificación en `role="status"` `aria-live="polite"`; el bloque
  de resultado no anuncia dos veces.
- Ningún estado sólo por color: claim en texto, marcador por palabra, tilde
  `aria-hidden` junto a la etiqueta.
- Un solo primario; «Reintentar» es el primario cuando la red falló.
- Contraste: sólo tokens del sistema (`design:check`).

## Lo que no se hizo a propósito

- No hay gráfico de torta, radar ni barras nuevos: el triángulo de Estilo ya
  existe y es el único dibujo, con sus porcentajes impresos al lado.
- No se muestra `scorePreview` local ni antes ni después de verificar.
- No se duplican «Jugar de nuevo»: las acciones viven en un solo lugar y las
  decide el estado de la edición.
