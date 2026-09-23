# Primitivas de UI

Viven en `src/components/ui/`. Son agnósticas del dominio: una primitiva no sabe qué es una `SolutionQuality` ni un `CareerState`. Como mucho sabe que existen cuatro *tonos* de resultado, que es vocabulario visual.

Antes de crear una, mirar `/dev/design-system`. Si el patrón ya está, se compone.

## Button

Variantes: `primary` (lima), `secondary` (contorno de tinta), `ghost` (texto subrayado).

**La lima es sólo un botón.** Es el único saturado que pisa el papel, y el momento en que aparece en cualquier otra cosa deja de significar «acá se sigue».

La prop `surface` no es estética: el deshabilitado de papel desaparece contra la pizarra del bloque de decisión, así que el botón necesita saber sobre qué está apoyado para elegir su propio gris.

El primario lleva `data-primary`, que es lo que hace contable la invariante de «uno solo por pantalla». Contarlos por color no serviría: el primario deshabilitado no es lima y sigue siendo el primario.

**El disabled nunca es la única explicación.** Si el primario está apagado, la línea de consigna dice qué falta.

## ChoiceCard

El componente más importante del juego.

> **Seleccionado es blanco, nunca verde.** Elegir significa «esta es mi decisión», no «esta es la correcta». El color de resultado aparece recién después de Confirmar.

La regla está sostenida por el tipo, no por la disciplina: mientras el estado es `pending` no hay forma de que una opción tome verde ni rojo, porque el tono sólo se lee en los estados resueltos.

Por dentro es un `<input type="radio">` dentro de su `<label>`. El input **es** la casilla de 32 px —restilado, no escondido—, así que sigue siendo el blanco del clic a tamaño completo, y las flechas entre opciones vienen gratis. El anillo de foco se pinta sobre la fila entera con `has-[:focus-visible]`, porque un anillo alrededor de una casilla de 32 px no dice qué opción está enfocada.

Dos superficies: `decision` (dentro del bloque oscuro) y `paper`. No es decoración — la decisión ocurre en oscuro y el resultado vuelve al papel, y ese cambio de superficie *es* la transición de estado.

## DataMetric y DataGrid

Todo número con el que haya que razonar va en la grilla. Esconder un dato necesario en la prosa convierte un problema de matemática en uno de lectura.

La caja se apoya sobre la cuadrícula con fondo liso y borde de tinta de 1,5 px: eso es lo que la hace leer como objeto. Un dato impar al final ocupa las dos columnas.

La variante `constraint` lleva el subrayado rojo **sobre la cifra**, con `self-start` para que abrace el número en vez de cruzar la celda.

## Ledger

El panel de resultado **siempre** muestra la aritmética real. El jugador tiene que poder ver el porqué, no sólo el veredicto: ésa es la diferencia entre un juego sobre decisiones con números y un examen con animaciones.

## Badge

Cuatro tonos: `up`, `down`, `outline`, `soft`. **Siempre con signo o flecha**, nunca sólo color: en escala de grises uno que subió y uno que bajó siguen siendo distintos.

`Eyebrow` y `Label` acompañan: son los dos únicos lugares donde el sistema escribe en versalitas.

## StageProgress

**Celdas de la cuadrícula, no una barra.** Una barra segmentada arriba era una de las cuatro decisiones que hacían que v0.1 se leyera como un juego de carrera deportiva.

Los tres estados se distinguen por **forma** antes que por color: hecho es relleno, actual es contorno de 2 px, pendiente es regla de 1 px. Las celdas son decorativas y el texto dice lo mismo, así que nadie tiene que contar cuadraditos con un lector de pantalla.

## Surface y Stamp

`Surface` es el bloque insertado, con cinco tonos: `paper`, `data`, `sunken`, `decision`, `aura`. Los dos oscuros declaran `data-surface`, que es lo que invierte el anillo de foco sin que cada control de adentro tenga que saberlo.

`Stamp` es el veredicto en una palabra, rotado. Lenguaje de legajo.

## TextField, NumberField y QuantityStepper

Etiqueta visible siempre; el placeholder nunca hace de etiqueta. El error se anuncia con `role="alert"` y marca `aria-invalid`, así que el estado nunca depende de que el borde se vea rojo.

**La validación es al blur, nunca por tecla.** Corregir a alguien mientras todavía está escribiendo el segundo dígito de `14` no es ayudar, es interrumpir.

Los tres controles del stepper llevan nombre accesible **obligatorio**, como props requeridas: un `input[type=number]` suelto sin etiqueta es una violación crítica, y dejar que el componente se pueda usar mal es dejar que el bug exista.

## NumberGrid

Una regla escrita arriba y una grilla de números abajo: el jugador marca los que la cumplen. Es la primitiva de la familia de interacción «grilla» —la juega el acto del 25 de Mayo— y no una pantalla: cualquier otra clasificación usa esta misma pieza.

Sostiene la misma regla que `ChoiceCard`, y por el mismo mecanismo:

> **Marcado no es correcto.** Mientras no llega una `resolution`, la celda marcada es **blanca con borde de tinta y tilde**, nunca verde. `resolution` es opcional y los colores de resultado sólo se leen dentro de esa rama, así que una grilla sin corregir no tiene forma de tomar verde ni rojo.

Por dentro cada celda es un `<input type="checkbox">` dentro de su `<label>`, restilado con `appearance-none` y no escondido: la celda entera de 56 px **es** la casilla. Se recorre con Tab y se marca con Espacio, que es lo que un grupo de casillas hace de forma nativa.

La consigna va arriba, en una caja de borde rojo: el rojo acá es la restricción de la pantalla —tensión, no error—, el mismo que subraya la cifra que aprieta en una caja de dato.

Los cuatro estados corregidos cambian **relleno, trazo del borde y glifo** a la vez, y llevan además la palabra en texto para lector de pantalla, así que la grilla se lee entera en escala de grises:

| | marcada | sin marcar |
|---|---|---|
| **cumplía** | `hit` — relleno verde, tilde | `missed` — borde punteado, cuadrado |
| **no cumplía** | `extra` — borde rojo, tachado | `clear` — regla fina, sin glifo |

La primitiva no clasifica: recibe el estado de cada celda ya decidido. Quién cumple la regla lo decide el dominio, en `src/game/math/classification.ts`.

## Marks

`TickMark`, `SlashMark`, `PartialMark`, `MilestoneTick`. SVG inline con `currentColor`, no un icon font ni archivos. Van `aria-hidden` sin excepción: acompañan una palabra que ya dice lo mismo, y anunciarla dos veces es ruido.

## BrandMark, BrandLogo y Wordmark

La marca en tres piezas. `BrandMark` es el isotipo —sumatoria, birrete, listón y rombo— como SVG inline en `currentColor`, de `1em` de alto; sólo el rombo lleva `fill-green`, y con `mono` cae a la tinta para invertir sobre un fondo oscuro. `Wordmark` es la palabra: Schibsted Grotesk 800 en caja mixta, texto seleccionable. `BrandLogo` compone las dos con el símbolo apoyado en la línea base, en cuatro tamaños (`sm`, `md`, `lg`, `event`).

El símbolo va `aria-hidden` siempre: un `<h1>` con el lockup se llama «Egresado», ni «sumatoria» ni el nombre dos veces. Donde el nombre ya está escrito al lado —el encabezado de la práctica— alcanza el `BrandMark` solo. No hay variante apilada porque ninguna superficie la pide; el juego no lleva marca durante un desafío. La geometría y los archivos derivados están descritos en [assets](assets.md).
