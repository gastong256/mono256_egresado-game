# ADR-024 — Progresión, recuperación y egreso

- Estado: Aceptado
- Fecha: 2026-09-02

## Contexto

El Teacher Gate 1 aceptó una regla corta y absoluta: **toda run válida completada llega al egreso** (D-TG1-10). El jugador no está averiguando *si* egresa. Está averiguando *cómo*.

Aceptarla no la hacía cierta. El motor no tenía estado terminal de egreso, un mal resultado no tenía más consecuencia que su score y su efecto de carrera, y la estructura de previas que [egreso y fail-forward](../../01-game-design/graduation-and-fail-forward.md) describe no existía. Este ADR la vuelve ejecutable **antes** de construir 1.º a 5.º, para que ningún año tenga que inventar su propio sistema de fracaso y promoción.

La regla sólo significa algo si equivocarse sigue costando. Un juego donde el error no tiene consecuencia no es indulgente: es aburrido, y no es lo que la dirección de producto pidió.

## Decisión

### 1. Un mal resultado deja algo por cerrar

Un beat ordinario que sale mal crea una **obligación**: algo que el año tiene que cerrar antes de poder terminar. Cerrarla es un beat de **repaso**, no un reintento.

La obligación se direcciona semánticamente —año, beat de origen, contenido— y nunca por posición en una lista, así que una reproducción la reconstruye en el mismo orden porque el orden es una propiedad de la run.

### 2. Por qué no puede entrar en bucle

Dos hechos estructurales, y ninguno de los dos es configurable:

1. **Sólo un beat ordinario crea obligaciones.** Un repaso no es ordinario, así que no puede crear una. No hay regla que salga mal ni bandera que quede mal puesta: la recursión es irrepresentable.
2. **Un repaso siempre cierra lo que el año debía**, salga como salga. Qué tan bien salió cambia la carrera y la historia —un año cerrado *con lo justo* deja una **previa**, que el contenido futuro puede retomar— pero nunca si el año cierra.

El peor caso es un repaso por año, y una run nunca necesita un segundo para arreglar el primero. Ese techo es lo que convierte «toda run válida egresa» en un hecho sobre la máquina de estados y no en una esperanza sobre el jugador.

**No es un sistema de vidas.** Ni corazones, ni tres strikes, ni reintentar hasta acertar. Equivocarse compra **más** juego, no menos, y la consecuencia viaja con el jugador en vez de terminarlo.

### 3. Un año no puede terminar debiendo

El repaso se agenda después de los beats ordinarios y antes de que el año cierre, **fuera del presupuesto de uno o dos beats** de [ADR-019](ADR-019-scenario-family-template-variant.md). Contarlo adentro le costaría al jugador una de las decisiones que el año fue compuesto para darle, que es lo contrario de lo que corresponde cuando algo salió mal.

Todas las obligaciones de un año se cierran en **un solo** repaso. Cerrarlas de a una haría que un mal año costara tantos beats extra como errores tuvo, y una carrera son seis años; el objetivo de 8 a 10 minutos que el Gate fijó no lo sostendría.

### 4. El egreso lo decide la progresión

`GRADUATED` es terminal y lo decide el estado de progresión, no «pasaron todos los eventos visibles». Una run egresa cuando jugó su último año sin deber nada — que, por las reglas de arriba, es toda run válida completada. Una que terminó antes porque el contenido no pudo servirla **no** egresa, y decirlo es cómo ese defecto queda a la vista en vez de disfrazarse de final.

**El egreso no tiene umbral de score ni de Promedio.** El desempeño cambia *cómo* se egresa, nunca *si*.

### 5. La recuperación no es evidencia competitiva

Ésta es la frontera con [ADR-023](ADR-023-competitive-score-policy.md), y es la más importante de esta etapa.

Los beats ordinarios de una run fueron compuestos para ser comparables con los de cualquier otra. Un repaso existe sólo porque uno de ellos salió mal. Puntuarlo convertiría fallar a propósito en una forma de comprarse una oportunidad extra, y toda la comparabilidad que el compositor construye se caería por esa puerta.

Así que **un repaso no puntúa**: ni en el numerador ni en el denominador. La evidencia competitiva sigue siendo el beat ordinario que salió mal.

Se aplica en dos lugares a propósito. El perfil de score de la plantilla lo documenta; el agregador lo descarta **por su rol**, no por una bandera en el historial, de modo que un llamador que arme evidencia de otra manera tampoco pueda esquivarlo.

Recuperarse tampoco borra lo que pasó. El resultado original sigue en la historia y sigue siendo parte de cómo egresó ese jugador: un repaso permite progresar, no deshace.

### 6. El contenido del repaso es determinista y aprobado

Se deriva de la identidad semántica de la obligación sobre un substream fijo. La misma run, el mismo error y la misma política llegan al mismo repaso en una reproducción meses después y en un servidor que nunca vio la primera partida.

Sale del catálogo aprobado, exactamente como un beat ordinario: lo juega la misma persona bajo las mismas reglas y no le corresponde un catálogo más laxo. Y prefiere una variante que el jugador no haya visto — devolverle la pregunta que acaba de errar no es remediar, es reintentar.

**El ruteo es por plantilla, no por año.** El content set declara qué repasa qué, y la obligación recuerda cuál situación salió mal, así que el repaso que aparece es el de *esa* situación. La primera versión de este diseño elegía el repaso del año, y era un error: un jugador que se equivocaba con el mural recibía una cuenta de colectivos. Es remediación en la forma y un disparate en el contenido.

De ahí sale la consecuencia que importa: **una plantilla sin repaso declarado no deja nada por cerrar.** `none` es una decisión escrita e inspeccionable, no un silencio que el motor rellena con lo que el año tenga a mano. El mal resultado tiene consecuencia —nota, score, carrera, historia— y no deuda. Y como una obligación sólo existe cuando hay contenido que la cierra, la rama «el año debe algo que no puede cerrar» deja de ser alcanzable con contenido bien declarado, en vez de quedar como un final ruidoso a la espera.

Se eligió derivarlo de la obligación en vez de meter contingencias en el `RunPlan` porque es la solución más chica que cumple todo: determinista, reproducible, verificable por servidor, y **sin tocar el esquema ni la huella del plan**. Un plan con ramas condicionales habría hecho participar de la identidad de la run a contenido que la mayoría de las runs nunca juega.

### 7. Qué repasa 7.º, y por qué eso

`g7.bus-travel-review`, una plantilla nueva con rol `recovery`, y **sólo** para las dos plantillas del colectivo. Piden lo mismo por caminos opuestos y las dos apoyan sobre un paso intermedio: cuánto dura el viaje una vez aplicada la demora. Ahí vive el error más común, y el enunciado completo lo esconde detrás de la decisión.

Las otras seis declaran `none`, y cada una por su motivo: el error del mural es de redondeo de compra y aislarlo daría una cuenta trivial; el de la oferta es leer cuál quedó más barata, sin paso intermedio; el stand y el trabajo grupal miden decisiones de reparto, no media cuenta; y el acto del 25 de Mayo ocurre una vez y en público, así que repetirlo aparte lo volvería un trámite. Inventarles un repaso para llenar la tabla sería peor contenido que no tenerlo.

El repaso aísla ese paso. No es la misma pregunta más fácil ni otra pregunta distinta: es la cuenta que la anterior daba por sabida, sola y a la vista, con el primer término nombrado como andamio.

**No escala el currículo.** El Gate separó el año escolar del prerrequisito matemático (D-TG1-01), y eso vale también acá: una recuperación que exigiera matemática más avanzada convertiría el error en una barrera. Es `core`, más liviana que lo que remedia, y esa asimetría es intencional — baja el piso sin bajar el techo del concepto.

### 8. La progresión es genérica

Ni el motor ni la política conocen un id de contenido. Qué se repasa y cómo se lo cuenta lo declara el content set; la progresión sólo sabe que un año debe algo y que hay contenido con rol `recovery` para cerrarlo.

La prueba de que alcanza es una carrera sintética de seis años —`7.º · 1.º · 2.º · 3.º · 4.º · 5.º`— que se juega entera con el mismo código y sin un solo `if (stage === …)`. Si un año futuro tuviera que ser un caso especial para converger, ese fixture es donde aparecería primero.

## Alternativas consideradas

**Repetir el año.** Es lo que la escuela real hace y lo que [reglas, scoring y progresión](../../01-game-design/rules-scoring-and-progression.md) ya había descartado: la fantasía es una carrera comprimida, no un simulador administrativo de promoción.

**Un repaso por obligación.** Pedagógicamente más prolijo y aritméticamente insostenible: dos errores en un año costarían dos beats extra, seis años los multiplican, y el objetivo de duración no sobrevive.

**Arrastrar obligaciones entre años como bloqueo.** Es la lectura literal de «previas», y rompe el invariante: un jugador que acumulara más obligaciones que capacidad de repaso no podría egresar nunca. Las previas quedan como **historia**, no como deuda que bloquea, que es lo que el documento de diseño pedía —estado narrativo oculto, no una quinta barra.

**Contingencias de recuperación dentro del `RunPlan`.** Habría metido en la identidad de la run contenido que la mayoría de las runs no juega, y habría movido el esquema y la huella del plan para eso.

**Que el repaso puntúe.** Descartado en §5. Habría hecho de equivocarse una estrategia.

## Consecuencias

- `ENGINE_VERSION` pasa a `6.0.0` y `SNAPSHOT_SCHEMA_VERSION` a `7`: el estado de una run lleva ahora qué debe, cómo lo cerró y si egresó. **El action log no se movió**: un repaso se responde como cualquier otro beat y no necesita un comando nuevo; subirle la versión por un cambio que no codifica habría hecho ver incompatibles todos los logs guardados con un formato que siguen cumpliendo.
- **El ruleset sube por primera vez desde que existe el modelo de contenido**: `0.4.0-grade-7`. Qué resultado deja algo por cerrar y cuántos repasos puede jugar un año son reglas de progresión, y dos jugadores bajo políticas distintas no están jugando al mismo juego. La huella del ruleset las cubre número por número.
- El contenido de 7.º sube a `0.9.0-grade-7` por la plantilla de repaso, y el catálogo aprobado a `grade-7-dev-5` — 185 variantes, 0 rechazos—, publicado al lado de `dev-4` sin editarlo.
- Las runs golden reproducen el mismo recorrido, el mismo score por evento, el mismo perfil y la misma cantidad de comandos — y ahora terminan en egreso.
- `pnpm game:simulate` reporta egresos, repasos y previas, y trata como hallazgo toda run que complete sin egresar.
- Ninguna calibración es oficial: `recovery-dev-1` lleva `official: false` como las de dificultad, composición y score.

## Evidencia

| Qué | Resultado |
|---|---|
| Carreras sintéticas de seis años | **20.000 simuladas, 20.000 egresadas, 0 hallazgos** |
| Peor caso de repasos | **6 en una carrera de seis años** — el techo de la política, uno por año |
| Espacio de estados de la progresión | recorrido **entero**: 64 años posibles y 64 carreras; un único estado terminal alcanzable |
| Convergencia sobre formas de jugar | property tests sobre 300 seeds × tres estilos, incluida la peor forma posible |
| 7.º real | una situación sin resolver dispara el repaso, el repaso cierra el año y la partida egresa |
| `none` de verdad | fallar el acto —que no declara repaso— no deja nada por cerrar, y el año cierra igual |
| Sin farmeo | fallar y recuperarse perfecto siempre puntúa menos que jugar bien de entrada |
| Servidor | recalcula egreso y repasos reproduciendo; un reclamo adjunto no cambia nada |

## Lo que esto no decide

El **vocabulario**. TG1-14 aceptó el egreso garantizado y no aportó palabras: «repaso», «quedó algo dando vueltas» y «previa» son candidatos, y la pregunta sigue abierta. Cambiarlos es copy, no arquitectura.

Los **umbrales**. Que `invalid` deje algo por cerrar y `functional` no es una decisión de política, no de motor, y va al Teacher Gate 2 con el resto de la calibración.

## No objetivos

Ranking, personal best, intentos y persistencia siguen siendo STAGE-09. El contenido de 1.º a 5.º y el arquetipo final de carrera completa, STAGE-08. Los Hitos y el desempate siguen sin implementarse, y ningún bonus aleatorio entró por esta puerta.
