# ADR-016 — Modelo de jugador de carrera: Promedio, Equipo, Aura y Estilo

- Estado: Aceptado
- Fecha: 2026-08-28

## Contexto

El motor definía cuatro estadísticas visibles en `src/game/progression/stats.ts`: `knowledge`, `team`, `initiative` y `energy`. Las cuatro eran enteros acotados de 0 a 100, todas arrancaban en un punto medio y cada resultado de desafío empujaba dos o tres a la vez.

Ese modelo tenía tres problemas que no se arreglaban con una pantalla mejor.

**Ninguna de las cuatro significaba algo escolar.** `knowledge` subía 4 puntos por comprar bien la pintura del mural. No es una nota, no es un promedio, no es nada que un estudiante de doce años reconozca de su propia vida: es un contador de XP con nombre de materia.

**Todas empezaban en 50.** Un jugador que todavía no había tomado ninguna decisión veía cuatro barras a la mitad. La interfaz afirmaba cuatro cosas sobre alguien de quien no sabía nada.

**Todas se movían siempre.** Un panel de resultado terminaba mostrando cuatro cambios por cada decisión, lo que convierte cualquier consecuencia en ruido: si todo cambia siempre, nada cambió.

El handoff de diseño v0.2 marcó explícitamente el reemplazo como **migración de datos, no re-skin**, y el modelo nuevo era la única parte del paquete que el motor tenía que aceptar antes de que se pudiera dibujar una sola pantalla.

## Decisión

Se reemplaza `PlayerStats` por `CareerState`, con cuatro dimensiones visibles y dos sistemas ocultos.

```ts
interface CareerState {
  grades: readonly number[]                       // oculto: las notas reales
  equipo: number | null                           // 0–100
  aura: number | null                             // con signo, sin techo
  estilo: { aplicado; estratega; improvisador }   // suman exactamente 100
  estiloEvidence: number                          // oculto
  mastery: Partial<Record<MathCategory, number>>  // oculto
}
```

### 1. `null` no es cero

Una dimensión que la run no tocó todavía **no tiene valor**, y la interfaz no dibuja nada en lugar de dibujar un cero. La tira de carrera arranca vacía y cada celda aparece la primera vez que su dimensión se mueve.

No es una sutileza de presentación: mostrar `Promedio 0` antes de la primera nota le dice a alguien de doce años que va mal en una materia que todavía no empezó. El tipo lo hace imposible de escribir por accidente.

### 2. Promedio se deriva de notas reales

El estado guarda la lista de notas y `promedio()` devuelve su media redondeada a un decimal. No es un acumulador que suba con cada acierto.

De ahí sale la regla de contenido más importante del modelo: **un evento mueve Promedio sólo si es genuinamente académico**. Decidir a qué hora tomar el colectivo ejercita porcentaje y tiempo, pero nadie pone una nota, así que no toca Promedio. El mural sí: la profesora lo toma como parte del trabajo del trimestre.

Guardar las notas y no el promedio es lo que hace que esa afirmación sea auditable, y lo que permite que en 3.º año haya varias notas por trimestre sin cambiar nada del motor.

### 3. Cada evento declara sólo lo que puede tocar

```ts
interface CareerEffects {
  grade?: number
  equipo?: number
  aura?: number
  estilo?: { axis; amount }
  mastery?: readonly MasteryGain[]   // lo agrega el motor, no el contenido
}
```

La ausencia de una clave significa que el evento no puede mover esa dimensión. El motor devuelve un `CareerChange` con una entrada por dimensión que efectivamente se movió, y la interfaz dibuja un chip por entrada presente.

`Promedio +0` no es un caso que la UI tenga que recordar evitar: **no es representable**.

### 4. Aura tiene signo y no tiene techo

Aura es capital narrativo —momentos memorables, no cálculos correctos—. Un cálculo correcto nunca produce Aura. Nunca es una barra ni un porcentaje, y el signo va siempre explícito.

### 5. Estilo es ternario y siempre suma 100

Ningún eje es el malo: un Improvisador tiene que poder egresar. La renormalización usa el resto mayor con desempate sobre el orden canónico de los ejes, así que los tres enteros suman exactamente 100 en cualquier motor y en cualquier dispositivo — que es requisito de determinismo, no prolijidad.

### 6. Dominio matemático lo calcula el motor

`mastery` se deriva de las categorías declaradas por el desafío y de la calidad alcanzada, no de lo que escriba cada autor de contenido. Así todas las familias contribuyen en la misma escala y nadie puede hacer que un tema pese cinco veces más por descuido. Es un sistema oculto: alimenta la dificultad adaptativa de v0.3 y **no se renderiza nunca**.

## Compatibilidad de runs

La migración cambia el estado de la run, la función de transición y el códec de snapshots. En los términos de `core/versioning.ts` eso es un cambio de motor:

- `ENGINE_VERSION` pasa a `2.0.0`;
- el ruleset y el contenido de desarrollo pasan a `0.2.0-dev`;
- el contenido de 7.º pasa a `0.2.0-grade-7`;
- `SNAPSHOT_SCHEMA_VERSION` pasa a `2`.

**No hay migración de snapshots de v1 a v2, y es deliberado.** Las dos formas no describen lo mismo: una run jugada bajo v1 no tiene notas ni Aura, y fabricarlas inventaría una carrera que ese jugador nunca tuvo. Un snapshot v1 se rechaza como versión no soportada, la aplicación descarta el checkpoint y ofrece una partida nueva. Reanudar hacia números que nadie se ganó es peor que empezar de cero.

## Qué **no** cambió

Vale la pena decirlo porque es la evidencia de que la migración no se llevó puesto el juego: las dos runs golden reproducen **el mismo recorrido, el mismo score, el mismo perfil y la misma cantidad de comandos** que antes. Lo único que cambió es el hash del estado final, porque el estado ahora lleva `career` en lugar de `stats`.

La matemática de los cinco desafíos autorados, su evaluación y su comportamiento determinista quedaron intactos.

## Consecuencias

- Las condiciones narrativas `stat-at-least` / `stat-at-most` pasan a `career-at-least` / `career-at-most` sobre una dimensión. Una dimensión en `null` **no satisface un umbral en ninguna dirección**: «sin evidencia» no es «poco».
- Las dos dimensiones ocultas del perfil que leían estadísticas visibles ahora leen la carrera: `collaboration` sale de Equipo normalizado —con el punto neutro cuando no hay evidencia, no con cero— e `initiative` sale de la parte de Estilo que no es por-el-libro. La política de perfiles sigue siendo de desarrollo y no oficial.
- El contenido declara efectos más chicos y más específicos. La mayoría de los resultados de 7.º mueven una o dos dimensiones, no cuatro.
- El panel de resultado gana una consecuencia narrativa y un sello autorados por resultado. Sin eso el panel dice qué pasó con los números pero no qué pasó en la historia, que es su trabajo.
- La aparición progresiva de la tira de carrera deja de ser una decisión de la interfaz: es un hecho del dominio que la UI lee.
