# Accesibilidad

Objetivo: WCAG 2.2 nivel AA. No es una certificación formal — es el estándar contra el que se mide y se verifica.

## Contraste

`pnpm design:check` resuelve cada rol semántico hasta su pigmento y verifica las combinaciones que el producto pinta de verdad: 4,5:1 para texto, 3:1 para contorno de control y estado.

Existe porque «se ve oscuro» no es una medición. Nota histórica: en dos rondas anteriores del sistema el token de etiqueta falló AA a 4,1–4,4:1 pareciendo suficientemente gris. **El piso para texto de 9–11 px sobre papel no se aclara.**

Un par está fuera de la lista a propósito y otro se mide por encima de lo que la norma exige; conviene saber por qué:

- la **celda de progreso pendiente** y el **triángulo de referencia** son andamiaje. No portan información que no esté también escrita —«Evento 3 de 7» y los tres porcentajes del label—, y los estados que sí informan se distinguen por forma. Subirles el contraste las convertiría en ruido que compite con el dato.
- el **primario deshabilitado** sobre pizarra se mide contra 4,5:1 aunque WCAG 2.2 exima a los controles inactivos (SC 1.4.3, «Incidental»): «Confirmar» apagado es lo primero que se ve al entrar a una decisión en un teléfono, y una palabra que apenas se adivina se lee como un error de la pantalla. Y el disabled nunca es la única explicación.

## Nada se distingue sólo por color

| Estado | Color | Segundo canal |
|---|---|---|
| Óptimo | verde | tilde lleno + la palabra |
| Resuelto | verde | tilde en contorno + la palabra |
| Parcial | gris | cuadrado + la palabra |
| Insuficiente | rojo | tachado + la palabra |
| Seleccionado | blanco | casilla llena + tilde |
| Aura + / − | verde / rojo | signo explícito |
| Ejes de Estilo | un solo verde | trazo lleno / guionado / punteado |
| Progreso | verde | forma: lleno / contorno 2 px / regla 1 px |
| Restricción en un dato | rojo | subrayado sobre la cifra |
| Tarea sin asignar | — | borde punteado |

**Todo el sistema se verificó en escala de grises.** Si una pantalla nueva deja de ser legible sin color, algo se apoyó en el color solo.

## Foco

Una sola regla en todo el producto: 2 px de tinta, separada 2 px. Negra y no verde, así nunca se confunde con un color de estado. La única variación es sobre las dos superficies oscuras, donde se invierte — y lo declara el contenedor, no cada control.

## Semántica

El orden es: **HTML nativo → primitiva accesible headless → ARIA a mano**, en ese orden y sin saltear.

- Los grupos de opción son radios nativos que comparten `name`: flechas, selección con espacio y anuncio como grupo, sin una línea de ARIA.
- Los botones son `<button>` de verdad, nunca un `div` con rol.
- El bloque de decisión es un `<fieldset>` nombrado con `aria-labelledby`.
- El panel de resultado se anuncia con `role="alert"` y recibe foco al aparecer.
- El SVG del triángulo lleva `role="img"` y un label con los tres porcentajes.
- Los brackets de Aura, el confeti y las marcas de corrección van `aria-hidden`: acompañan texto que ya dice lo mismo.

## Objetivos táctiles y teclado

44 px mínimo, 52 px las opciones, 56 px las celdas de grilla. Operación completa por teclado con orden de DOM lógico, verificada end-to-end.

**Toda interacción de arrastre tiene ruta alternativa.** El tablero de asignación usa `select` nativos como vía principal; el arrastre sería una mejora encima del mismo estado. Es un requisito duro, no una preferencia.

Una región que scrollea horizontalmente tiene que ser alcanzable con el teclado: sin `tabIndex` nadie que no use un puntero llega a su mitad derecha.

## Texto que no se sale de su caja

El scroll horizontal del documento no ve todo. Una etiqueta de opción comprimida a una columna de una palabra por renglón, o un nombre de ítem que asoma por fuera de su fila, no ensanchan la página y pasan un chequeo de `scrollWidth`. Por eso las auditorías de navegador de 1.º y de 5.º buscan además cualquier elemento con texto propio cuyo contenido sea más ancho que su caja sin nada que lo recorte, y fallan si aparece uno. Las dos causas conocidas —el detalle de una opción robándole la fila a la etiqueta y el selector de cantidad aplastando el nombre del ítem— se resolvieron dándole a la etiqueta un ancho mínimo de 9 rem antes de ceder.

Los `select` de las interacciones van en 16 px: por debajo de eso, Safari en iPhone amplía la página al enfocar el control, y la partida queda con zoom hasta que alguien lo deshace con los dedos.

## Reflow, movimiento e idioma

Sin scroll horizontal de 320 a 1920 px; el shell de 412 px centra en vez de estirarse. El piso es explícito: `html` declara `min-width: 320px`, el ancho con el que WCAG 1.4.10 mide reflow. A 320 px no se pierde información ni funcionalidad: la tira de carrera refluye a dos filas y todo —navegación, decisión, resultado y Repaso— se sigue operando por teclado y por tap. Una representación que necesita dos dimensiones por significado, como la grilla del plano, puede scrollear **dentro de su propia región**, que es alcanzable por teclado; nunca la página entera, y nunca como única vía para resolver el desafío: los controles de X, Y y orientación completan la respuesta por sí solos. `prefers-reduced-motion` es un solo bloque global y no se pierde información. `<html lang="es-AR">`, porque el juego escribe coma decimal, punto de miles y hora de 24 h.

## Cómo se verifica

```bash
pnpm design:check   # contraste medido, por nombre de token
pnpm test:e2e       # axe-core sobre cada pantalla, en desktop y mobile
```

Los escaneos automáticos cubren inicio, nombre, apertura, situación, resultado, cierre y la vitrina. Detectan aproximadamente un tercio de los problemas reales: **no reemplazan** una revisión manual con teclado ni una lectura con lector de pantalla.

## Todavía sin verificar

Lectura con VoiceOver y NVDA. Está especificado y no probado, y queda anotado como tal en vez de darlo por hecho.
