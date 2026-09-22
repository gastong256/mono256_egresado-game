# UX decision — dónde va la ilustración

## Patrón elegido

```text
EYEBROW (momento del año)
TÍTULO DEL EVENTO
↓
ILUSTRACIÓN  (16:9, filete 1 px, sin tarjeta)
↓
CONTEXTO TEXTUAL (setup)
↓
DATOS (DataGrid)
↓
CONSIGNA + INTERACCIÓN (bloque oscuro o papel, según engine)
↓
RESULTADO
```

Es la hipótesis del Product Owner, confirmada. Se implementa en un solo lugar: `SituationCard` monta el slot `media` entre el `<h2>` y la prosa; `ChallengeFrame` decide si hay escena consultando `scene-registry.ts` por id de Template. Ninguna pantalla vuelve a decidir el orden. `NarrativeCard` (beats de apertura/cierre de año) no lleva imagen.

## Por qué ahí y no después de la prosa

El slot `media` de `SituationCard` estaba, hasta ahora, **entre la prosa y los datos**. Se movió. Con la imagen ahí el jugador leía el enunciado, encontraba una lámina, y tenía que saltarla para llegar a los datos con los que razona: exactamente el patrón `ver texto → ver imagen → volver a leer` que la tarea pide evitar. Con la imagen debajo del título, la lectura es *nombrar el evento → ver el lugar → leer lo que pasa → ver los datos → decidir*, y prosa, datos y decisión quedan contiguos. Es la gramática de una nota editorial (titular, foto, bajada), coherente con el papel y la grilla del sistema.

Se descartó la imagen por encima del eyebrow/título: a 320 px empujaba el nombre del evento por debajo del pliegue, y la ilustración se leía como banner y no como parte del relato.

## Ratio: 16:9 en todos los anchos

`SceneMedia` tenía 3:2 en mobile y 16:9 desde 640 px. Se dejó **16:9 siempre**:

- La columna de juego mide 412 px en todos los breakpoints; no hay un "desktop" que muestre más ancho. La diferencia mobile/desktop era sólo 320→412 vs 412 fijo.
- Las 24 escenas se generaron a 16:9 con el sujeto en el 70 % central: sin recorte, el sujeto siempre está entero. Un recorte 3:2 ganaba 28–37 px de alto a cambio de empujar la decisión más abajo.
- Un ratio único es predecible (sección 32 de la tarea) y el crop es cero.

Altura visible medida en el harness (dev, DPR 2), caja de la imagen:

| Viewport | Caja de imagen | Título (top) | Imagen (top) | Confirmar (top), bus / expo |
|---|---|---|---|---|
| 320 px | 254 × 143 | ~403 | ~479 | 1154 / 1930 |
| 390 px | 324 × 182 | ~353 | ~430 | 1059 / 1805 |
| 412 px | 346 × 195 | ~353 | ~430 | 1071 / 1817 |
| 1280 px | 378 × 213 | ~353 | ~430 | 1089 / 1776 |

(Las cifras incluyen el callout del harness arriba, ~250 px, que no existe en `/`.) La imagen agrega 143–213 px según ancho: dentro del rango 180–300 sugerido salvo en 320 px, donde queda un poco por debajo. Se prefirió mantener 16:9 antes que un caso especial; si en la revisión humana la imagen se siente chica a 320–360 px, el cambio es una línea en `SceneMedia` (`aspect-3/2 sm:aspect-video`) y no toca ninguna pantalla.

## Pacing y Repaso

- **Una imagen por situación ordinaria, ninguna en Repaso.** El beat de Repaso ya trae arriba las notas de lo que practica y lo que sólo comenta, y vuelve sobre un lugar que el año acaba de mostrar. Repetir la lámina era scroll sin contexto nuevo. La regla vive en `sceneForChallenge`: `view.review` presente → sin imagen; además el registro no mapea las diez Templates de Repaso. Verificado en el harness: "El viaje de hoy" (Repaso del colectivo) se muestra sin imagen y con la interacción intacta.
- **Sin precarga.** Sólo la imagen de la situación en pantalla se pide; el optimizador de Next sirve la variante de 828 px (~40–70 KB) a DPR 2. Nueve imágenes por carrera, repartidas a lo largo de la partida.
- **Sin layout shift.** La caja reserva su alto con `aspect-ratio` antes de que llegue el archivo.

## Tratamiento visual

- Filete de 1 px `border-rule`, radio 0, sin sombra, sin tarjeta blanca, montada directo sobre la hoja cuadriculada: la lámina "pegada en la carpeta" que ya describía `SceneMedia`.
- **Se retiró `saturate-85`.** Estaba pensado para fotografía; las escenas ya están pintadas con papel, tinta, verde botella y rojo puntual, y desaturarlas las alejaba de los tokens que las rodean (el verde del uniforme dejaba de coincidir con `--green`).
- El rojo en las ilustraciones (remeras, banderines, carpetas) es contextual y queda lejos del bloque de decisión y del panel de resultado; no se confunde con `insufficient`. No se recoloreó nada.
- La ilustración nunca entra en la superficie oscura ni en Aura.

## Accesibilidad

- `alt=""` en todas las escenas de situación: son ambientación; el eyebrow dice el momento, el título nombra el evento y la prosa cuenta el lugar. Describirlas duplicaría la narración al lector de pantalla. `SceneMedia` conserva `alt` opcional para el caso en que una imagen diga algo que el texto no dice.
- No hay texto, cifras, horarios ni precios dentro de las imágenes (revisión visual de las 24).
- Foco, encabezados (`h1` etapa, `h2` situación) y orden de tabulación no cambian: la imagen no es focusable.
- axe (WCAG 2.2 AA) sigue en verde en la vitrina y en las carreras E2E.

## Mapping

`Template id → asset id → ruta pública`, en `src/components/game/scene-registry.ts`. Nada en `RunState`, `RunPlan`, `ChallengeDefinition`, snapshots, action log ni huellas: el motor y el servidor no saben que las imágenes existen. Un id sin escena degrada a la situación textual de siempre.

## Excepciones

Ninguna por escenario. Las únicas reglas son las dos de arriba (ordinaria → imagen; Repaso → sin imagen) y la ausencia deliberada para las cuatro Templates DEV-only de 7.º.

## Para TASK-04 / TASK-06

- Con la imagen debajo del título, el `setup` funciona como bajada: conviene que arranque situando (lugar/momento) y no repita lo que la lámina ya muestra.
- Los títulos de Repaso ("El viaje de hoy", "Cuánto entra") ya no compiten con una imagen; pueden quedarse cortos.
