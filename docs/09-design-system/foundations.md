# Fundamentos

Cuadrícula, geometría, layout y movimiento. Los valores viven en `src/styles/`; acá está el criterio.

## La cuadrícula

Celda de **16 px**. Padding y alturas en múltiplos de 8.

La utilidad `.eg-canvas` la dibuja con dos degradados lineales, y es el fondo de **toda** pantalla. No es decoración: es el sistema de alineación con el que los datos se leen como objetos apoyados sobre una hoja en lugar de como párrafos.

Es también el cambio de una línea que hace que algo se vea como Egresado. Si una pantalla nueva no muestra la cuadrícula alrededor de sus bloques, se volvió genérica.

## Geometría

| | Valor |
|---|---|
| Radio | **0, siempre** |
| Regla | 1 px |
| Caja de dato | 1,5 px de tinta |
| Sección | 2 px de tinta |
| Pestaña / módulo | 3 px superior en el color del estado |
| Sombra | **ninguna** |

La profundidad la da el peso del borde y el contraste de fondo, igual que un impreso. Las dos escalas están apagadas (`--radius-*` y `--shadow-*`) y el guardarraíl rechaza cualquier `rounded-*` o `shadow-*` en código de producto.

La única excepción es el resplandor de Aura, que no es una sombra sino luz, y vive dentro del único bloque negro del sistema.

## La marca de corrección

El device de la identidad. El tilde verde y el subrayado rojo del docente, convertidos en sistema:

| Marca | Significa |
|---|---|
| Tilde verde lleno | resultado conseguido |
| Tilde verde en contorno | alcanzó, pero de más |
| Cuadrado gris | resolvió una parte |
| Tachado rojo | no alcanzó |
| Subrayado rojo corto | el dato que era la restricción |

**La marca cae sobre el dato o la opción, nunca en un marco alrededor.** Eso es precisamente lo que la separa de un frame deportivo, y por qué el subrayado de una restricción abraza la cifra en vez de cruzar la celda.

Los cuatro glifos son SVG inline con `currentColor` y terminación cuadrada. Van `aria-hidden` sin excepción: acompañan una palabra que ya dice lo mismo.

## Layout

- Viewport de juego: **412 px máximo**, centrado, en todos los breakpoints.
- Gutter de 16 px, con safe area.
- Verificado a **320 / 360 / 390 / 412**, y con zoom 2 sobre 1280. 320 px es el piso de reflow: `html` declara `min-width: 320px`.
- Tablet y desktop **centran**, no estiran. Un máximo mayor (≤560 px) queda reservado para interacciones genuinamente anchas.

Estirar el juego a 1200 px no mejora ni leer un enunciado ni comparar cuatro opciones: sólo obliga a barrer la cabeza de un lado al otro de la pantalla.

## Portada de evento (RC3 TASK-A)

La entrada pública y su podio usan `max-w-event` (60rem): en desktop separan
marca y promesa en dos columnas y, debajo, reloj y acceso en otra fila;
a 320 px se apilan. Es una composición de
portada autorizada para TASK-A, no un cambio del viewport de juego. El formulario
y la partida conservan `max-w-viewport` (412 px).

El ajuste de Home autorizado el 23/09 muestra la ilustración a todo el ancho de
ambas columnas. El bloque de acceso abierto reúne estado, acción y reloj sobre
superficie blanca con filete superior verde escolar. «Ya podés jugar» explicita
la disponibilidad; el único primario lima usa `text-data-lg` en teléfono y
`text-section` desde 640 px, con altura mínima de 72/80 px respectivamente.
En móvil y tablet vertical, el orden es estado y sesión, Jugar, contador y
Practicar secundario. Desde 1024 px, acceso y reloj comparten dos columnas;
así la tablet vertical no comprime las cifras ni los textos de sesión.
El contador conserva las cuatro unidades, cifras `text-countdown` fluidas y
la fecha absoluta en hora argentina. «Tiempo que queda para jugar» e icono de
reloj acompañan el tinte verde escolar; durante la última hora, el tinte rojo
y «Última hora para jugar» / «Últimos minutos para jugar» refuerzan la urgencia.
La lima permanece exclusiva del botón. La espera de apertura conserva papel
hundido y «Empieza en» para diferenciarla de la ventana jugable.
Las cifras cambian sin fundido: un
pop por segundo era movimiento continuo y su opacidad a mitad de camino dejaba la
cifra en gris (un escaneo de contraste la medía en 2,6:1). La urgencia escrita y
el rojo siguen dependiendo del tiempo real restante. El contador permanece visible sin botón para ocultarlo
y conserva reduced motion. El ranking agrega un aviso escrito de días/horas/minutos
restantes con `text-goal`, filete y rojo semántico; sólo se anima al cambiar la
frase, respetando reduced motion.

En un teléfono la promesa es **una sola línea** debajo de la marca —«Tu
secundaria. Tus decisiones. Tu propia historia.»— y el párrafo de apertura no se
muestra: con tres renglones de 25 px más el párrafo, el estado de la competencia
y el botón de jugar quedaban debajo del pliegue de una pantalla de 360 × 740, y lo
primero que alguien busca al abrir el enlace en la feria es si puede jugar ahora.
Desde tablet vuelve la versión completa al lado de la marca. El ranking, por su
parte, se pliega en teléfono: se ven el podio, los dos puestos siguientes y la
fila propia con sus vecinas, y un botón abre el resto; desde tablet la lista se
ve entera. El DOM conserva siempre las filas en el orden del servidor.

`text-event-title` amplía la firma tipográfica existente sólo en la portada,
con caja mixta, sin logo nuevo. Su escala fluida usa el ancho del contenedor
(`cqi`, columna de marca con `@container`) para evitar solapamientos al ampliar al 200 %.
El podio usa numerales de la escala existente,
filetes y desniveles; el DOM siempre mantiene el orden de puestos del servidor.
El contador no anima por cifra. La fecha escrita permanece visible.

**Practicar** usa borde de tinta como acción secundaria. El footer reserva 160 px
en escritorio y 208 px en móvil como mínimos: permite crecer con texto ampliado.
En escritorio alinea enlace legal, marcas institucionales y crédito en tres
columnas; en móvil sube las marcas a una fila propia. Ambas marcas tienen 112 px
de alto; el crédito del desarrollador conserva su enlace textual, sin logo, en
una sola línea con el tamaño `text-label`, peso normal y sin espaciado extra. Un
icono de GitHub de 16 px, separado 4 px del texto, enlaza al repositorio con objetivo táctil
de 44 px y nombre accesible. La máscara circular de Piacentini es
un recorte de presentación de ese insumo solicitado por el PO; no cambia el
radio cero de los componentes. Los WebP se derivan de `resources/footer/` con
`scripts/brand/build-footer-assets.ts`.

### Jerarquía cromática del Home

La promesa conserva el primer renglón en tinta, baja el segundo a tinta secundaria
y destaca «Tu propia historia» con verde escolar. El punto de competencia abierta
usa ese mismo verde junto a la palabra, sin parpadeo ni significado exclusivo del color.

La explicación del puntaje usa `Surface` y tres bloques con iconos vectoriales:
operaciones matemáticas, compañeros y estrella de cuatro puntas. En escritorio
forman una fila; en móvil se apilan en el mismo orden. Matemática lleva un tinte
verde y filete más pesado; Equipo queda en papel; Aura usa la superficie negra
existente con neón y texto secundario de contraste medido. La explicación de la
contribución al puntaje permanece escrita: el tamaño de los bloques no es un gráfico.

Las medallas se limitan al podio del Home y acompañan los numerales 1/2/3.
El primer puesto mantiene mayor escala y las columnas su desnivel; los empates
no duplican medallas ni alteran el orden del servidor. Los SVG son decorativos,
`aria-hidden`, de trazo consistente y sin animación adicional. Los bordes,
el radio cero y la cuadrícula continúan siendo los del sistema.

## El slot de acción

**Existe exactamente un primario montado a la vez.** Mientras se decide vive dentro del bloque oscuro, junto a las opciones; al resolver salta al final del shell, debajo del panel de resultado. Nunca hay que scrollear para atrás para continuar.

El slot se ancla con `margin-top: auto` sobre una columna de altura mínima, así el primario cae siempre en el mismo lugar esté la pantalla llena o casi vacía. Que el botón no se mueva entre escenas es lo que permite jugar sin volver a buscarlo cada vez.

Hay un test end-to-end que cuenta los primarios en cada paso del año.

## Movimiento

Cinco duraciones, dos curvas, **tres keyframes en total**. Todo lo demás es una `transition`.

| Utilidad | Duración | Para qué |
|---|---|---|
| `motion-select` | 140 ms | elegir una opción |
| `motion-enter` | 200 ms | el bloque de contenido en cada cambio de escena |
| `motion-resolve` | 320 ms | un pop por resolución, sólo el panel de resultado |
| `motion-progress` | 420 ms | celda de progreso y transiciones numéricas |
| `motion-estilo` | 320 ms | polígono y centroide del triángulo |

Sin librería de animación, sin Lottie, sin video. **Nunca se anima el ancho de un borde**: reflowea.

RC3 (TASK-D) reutiliza los mismos tres keyframes para la energía competitiva
sin agregar un cuarto: el CTA lima de la portada y el puntaje verificado del
cierre entran con `motion-resolve`; las tarjetas del medallero entran con
`motion-enter` escalonado por `animation-delay`; y el reloj del evento no anima
sus cifras: un pop por segundo era la única animación continua del producto y se
retiró (ajuste de Home del 23/09); `data-urgency` deriva del tiempo real que
falta. Ninguna animación es continua ni bloquea; con reduced motion todas duran
1 ms.

El confeti del cierre son 18 tiras de CSS de 3×12 px con posiciones y retardos deterministas. Deterministas a propósito: el mismo cierre tiene que verse igual en dos capturas, y una captura de regresión con `Math.random()` adentro no sirve para nada. Dispara en cierre de etapa, egreso y Aura de `+1.000`, y en ningún otro lugar.

## Reduced motion

Un solo bloque global lleva las cinco duraciones a 1 ms. **Ninguna información se transmite sólo por movimiento**: los porcentajes de Estilo están impresos, el resultado está escrito y el progreso se distingue por forma. El confeti directamente no se dibuja — una tira detenida sobre el título no es una celebración discreta.

## Ranking público: jerarquía RC6

El puesto real decide densidad y escala: primero destacado, segundo y tercero
más compactos, resto uniforme mientras el contenido lo permita. Alturas fluidas
para alias largos, empates, zoom y métricas ausentes; nunca recortar para cumplir
una altura fija. Se reutilizan roles tipográficos existentes, medallas y tokens
semánticos. Oro/plata/bronce identifican el podio, verde escolar identifica la
fila propia y los iconos; Aura mantiene su negro/neón. La lima sigue reservada
al CTA principal. El detalle nativo se abre con teclado/toque; ninguna información
requiere hover. Los reconocimientos combinan icono con nombre escrito.
