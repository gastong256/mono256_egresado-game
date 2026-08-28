# ADR-020 — Pipeline de variantes y catálogo aprobado

- Estado: Aceptado
- Fecha: 2026-08-28

## Contexto

[ADR-019](ADR-019-scenario-family-template-variant.md) dio a una variante identidad, dirección y substream propios. Lo que no dio fue **población**: cada plantilla sigue trayendo dos o tres casos escritos a mano.

Para una feria eso no alcanza, por dos razones distintas.

**La primera es el jugador.** Tres grillas fijas de ocho números en el acto del 25 de Mayo son el contenido más memorizable del juego: la segunda vez que alguien lo juega ya sabe qué celdas marcar. La variación existe para que la segunda partida siga siendo una partida.

**La segunda es el premio.** Si las variantes se generaran en vivo, el jugador que recibiera una ambigua, imposible o trivial ya habría perdido cuando alguien lo notara. Un número al azar en runtime produce decimales impresentables, óptimos empatados, opciones duplicadas y dificultad desbalanceada, y en una competencia eso no se puede deshacer.

La consigna es entonces una sola:

> **Variabilidad no es aleatoriedad libre.**

## Decisión

### 1. Un pipeline, y generar no es aprobar

```text
fuente            registros autorados, o un espacio de candidatos direccionado
  ↓ resolver      parámetros, desde la dirección y nada más
  ↓ materializar  la instancia que el jugador vería
  ↓ validar       genéricas primero, después la matemática de la plantilla
  ↓ canonizar     la vista semántica que la plantilla declara de sus parámetros
  ↓ huella        SHA-256 de esa vista
  ↓ deduplicar    dos direcciones, un problema → una entrada
  ↓ aprobar       a un catálogo versionado
```

Un candidato que un generador produjo es una **propuesta**. Sólo entra al catálogo el que sobrevivió a todo, y el rechazado va al reporte —nunca al artefacto con una marca de «no usar»—.

### 2. Fuentes híbridas: autorada y generada

Una plantilla declara de dónde salen sus variantes, y las dos formas pasan por el mismo pipeline.

| Plantilla | Fuente | Por qué |
|---|---|---|
| `g7.bus-timing` | generada | duración, demora, entrada y salidas son cuatro números sin copy adentro |
| `g7.mural-paint` | generada | ancho, alto y rendimiento cambian la decisión por completo |
| `g7.notebook-offer` | generada | precio, porcentaje y descuento fijo son puro parámetro |
| `g7.stand-supplies` | generada | porciones y presupuesto; el catálogo del kiosco queda fijo porque es copy |
| `g7.may-25-act` | generada | la coreografía es la escena y no se toca; los **números** son lo que se memoriza |
| `g7.group-tasks` | **autorada** | los parámetros *son* el contenido: Lucas, Sofía, Mateo y Vos tienen nombre |

**Autorada no quiere decir confiable.** Una variante escrita a mano pasa por las mismas validaciones, la misma huella y la misma deduplicación, y su oráculo —una búsqueda exhaustiva sobre todos los repartos posibles— es tan independiente como el de cualquier generador.

No se proceduraliza por deporte. Una plantilla cuyo espacio útil es chico y cuyo valor está en la escritura se queda autorada, y eso se documenta.

### 3. Generación por restricción, nunca sorteo y esperanza

Un generador construye parámetros que **ya** cumplen la intención de la plantilla. No sortea campos y después mira qué salió.

El mural es el caso más claro y va al revés de punta a punta: se elige el envase que se quiere que sea la respuesta, de ahí sale el intervalo de litros que lo hace el mínimo suficiente, de ahí el intervalo de área, y recién entonces se buscan ancho y alto legibles cuyo producto caiga adentro. El colectivo elige primero los márgenes de llegada —uno óptimo, uno o dos tarde, todos distintos— y deriva los horarios restando.

La evidencia de que funciona es el número que el pipeline reporta: **50.013 candidatos, cero rechazos**.

### 4. Números que un chico puede calcular

Las restricciones de generación incluyen la legibilidad, no sólo la validez: demoras que dan minutos enteros sobre la duración elegida, precios en centenas de pesos para que cualquier porcentaje dé pesos redondos, paredes con un decimal como mucho, números de grilla entre 1 y 30. Una variante matemáticamente correcta con un `17,48375` adentro es una variante rechazada.

### 5. Oráculos independientes

Un validador que reusa el razonamiento del generador confirma con gusto el error del generador. Donde se puede costear, la validación recalcula por otro camino:

- el colectivo recalcula viaje y márgenes desde los parámetros crudos;
- el mural clasifica los envases con aritmética entera en centésimas, sin pasar por los racionales del desafío;
- el stand resuelve el costo mínimo por **enumeración exhaustiva** de las 13 × 9 × 6 combinaciones, mientras el desafío lo resuelve por programación dinámica;
- el acto reimplementa paridad, divisibilidad y primalidad —esta última por división por tentativa—;
- el trabajo grupal busca el mejor reparto factible recorriendo las permutaciones.

Esto ya encontró errores reales durante esta etapa: un error de unidades en el oráculo del mural y un descuento fijo que podía superar el precio del cuaderno.

### 6. Una variante es la misma para todos

El substream de una variante se deriva de un **seed de contenido fijo** más su dirección semántica, y no del seed de la run. `bus/g7.bus-timing/c00042` es el mismo problema en toda partida, que es lo que hace que un catálogo prevalidado signifique algo y lo que hace que una competencia sea comparable.

El seed de la run sigue decidiendo **qué** variantes ve una partida. No decide qué contienen.

Una validación genérica lo exige: cada candidato se materializa dos veces, en dos runs distintas y en dos posiciones distintas, y si las dos vistas difieren se rechaza con `address-not-deterministic`.

### 7. Huella semántica, distinta de la identidad

```text
fingerprint = sha256(canonical({ familyId, templateId, content }))
```

Deliberadamente **excluidos**: el id de la variante, la versión del generador, la versión del catálogo y cualquier cosa con reloj adentro. Dos direcciones que producen el mismo problema tienen que colisionar —así se detecta un duplicado— y una variante autorada que resulta igual a una generada es genuinamente el mismo problema.

`ChallengeVariantRef` sigue siendo la identidad referencial; la huella es identidad de contenido. Son dos preguntas distintas y se responden por separado.

El SHA-256 está implementado en TypeScript portable dentro del motor, porque el núcleo corre en el navegador y su lista de dependencias tiene dos entradas. Es el algoritmo estándar, no uno inventado, y está verificado contra los vectores publicados de FIPS 180-4 y contra `node:crypto`. Los ocho hex del digest FNV que versiona rulesets no alcanzaban: a diez mil entradas un hash de 32 bits colisiona alrededor de una vez cada cien.

### 8. El catálogo aprobado no es el catálogo de contenido

| | Responde |
|---|---|
| `ContentCatalog` ([ADR-019](ADR-019-scenario-family-template-variant.md)) | qué familias y plantillas existen |
| `ApprovedVariantCatalog` (este ADR) | qué variantes concretas pasaron validación y pueden desplegarse bajo una versión |

Una entrada guarda **dirección y huella**, nunca parámetros: los parámetros son función pura de la dirección, y guardarlos duplicaría un dato derivable creando una segunda cosa que se puede desactualizar. La huella convierte eso en una afirmación verificable: se recalcula desde el código y se compara.

### 9. El catálogo se versiona y el build es reproducible

`grade-7-dev-1`. Nunca `latest`, y explícitamente **no** el catálogo de la feria: congelar el catálogo oficial de una competencia es una decisión de evento que todavía no se tomó.

El artefacto se ordena por dirección, no registra nada volátil —ni fecha, ni ruta, ni máquina— y se escribe con el formato exacto que Prettier produce, así que vive en el repositorio sin pelearse con el formateador. Dos builds del mismo código dan el mismo archivo byte a byte, y hay tests que lo prueban, incluido uno que registra el contenido en orden inverso y obtiene el mismo catálogo.

`pnpm game:variants check` recompila el catálogo en memoria, lo compara con el comprometido y revalida cada entrada. Está dentro de `pnpm verify`. La barrida estadística grande es otro comando, `pnpm game:variants audit`, porque tarda distinto y se corre en otro momento.

### 10. La auditoría tiene que encontrar problemas

Un reporte que siempre dice OK es decoración. La auditoría mide, por plantilla: candidatos, rechazos por código, duplicados, problemas distintos, y —donde la interacción tiene opciones— dónde cae la respuesta correcta y cuántas respuestas distintas existen.

Los umbrales están documentados con su razón. Bloquean los casos en los que desplegar sería indefendible —una plantilla que no aprueba nada, un generador que rechaza nueve de cada diez, una respuesta siempre igual— y avisan sin bloquear cuando la señal es sobre el tamaño del espacio y no sobre la corrección del contenido.

### 11. El juego actual no cambia

Las variantes curadas siguen siendo las que la partida de 7.º juega. El catálogo aprobado existe, se prueba resoluble y jugable, y **todavía no alimenta la selección de una run**: enriquecer el contenido es de la etapa siguiente y componer una run es de la posterior.

La evidencia: las runs golden reproducen el mismo recorrido, el mismo score, el mismo perfil y la misma cantidad de comandos, y la simulación de 5.000 runs da la misma distribución de calidades y perfiles que antes.

## Alternativas consideradas

**Generar en runtime.** Es lo más simple de escribir y lo peor de defender: la primera variante ambigua la descubre un jugador durante la competencia. Es exactamente lo que STACK documenta como el riesgo de la aleatorización sin despliegue previo.

**Proceduralizar las seis plantillas.** Habría exigido generar nombres de personas para el trabajo grupal, que es escribir contenido con un generador en lugar de escribirlo.

**Guardar los parámetros en el catálogo.** Duplicar un dato derivable y crear una segunda fuente que se desactualiza. La huella da la misma garantía y además detecta la desactualización.

**Reusar el digest FNV de 32 bits.** Alcanza para un tripwire de versión sobre una cadena corta; no para deduplicar decenas de miles de variantes.

**Un hash no criptográfico de 128 bits.** Habría servido, pero SHA-256 es el primitivo que cualquiera reconoce y puede verificar contra vectores publicados.

## Consecuencias

- `ENGINE_VERSION` pasa a `4.0.0` y `SNAPSHOT_SCHEMA_VERSION` a `4`: el descriptor de una run puede declarar de qué catálogo salió. El campo es **opcional** —una run que juega variantes curadas no salió de ningún catálogo y lo dice omitiéndolo—, pero la forma serializada se movió y un snapshot `3.x` se rechaza en vez de adivinarse.
- Las versiones de contenido suben a `0.4.0-dev` y `0.5.0-grade-7`: qué genera cada dirección es identidad de contenido. **El ruleset no sube** y su huella quedó idéntica en `d3319440`, que es la evidencia de que ninguna política se tocó.
- El substream de variante dejó de depender del seed de la run. Ninguna plantilla de producción lo usaba todavía, así que el juego no se movió; las plantillas de desarrollo sí dependen de la run, y por eso el pipeline las rechaza —lo cual es el contraejemplo con el que se prueba la validación.
- Agregar una plantilla nueva con su generador, sus validadores y su metadata no toca el pipeline. Hay un test que registra una familia entera que el pipeline nunca vio.
- El catálogo comprometido queda como artefacto verificable en el repositorio, y `pnpm verify` falla si alguien cambia un generador sin reconstruirlo.

## No objetivos

Bandas de dificultad, `difficultyCost`, presupuesto por año y compositor de runs son de la etapa siguiente. Score competitivo, egreso, contenido de 1.º a 5.º, ranking y modo feria, más adelante. **El inventario final de escenarios sigue abierto**, y el tamaño del catálogo es configuración, no política de contenido: aprobar ciento treinta y tres variantes no dice que el juego necesite ciento treinta y tres.
