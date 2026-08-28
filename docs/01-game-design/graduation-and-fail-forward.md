# Egreso, recuperación y fail-forward

**Estado: PRODUCT DIRECTION.** La dirección —el error cambia el camino, no termina la partida— está decidida. La forma concreta de la recuperación, el lenguaje de las previas y qué años la ofrecen son **OPEN**, y el tono de esa recuperación es **TEACHER GATE**.

## Invariante buscado

> Toda run completada válida llega a `EGRESADO`.

El jugador compite por calidad y construye un recorrido distinguible, pero no queda afuera del resto del juego por haberse equivocado.

Esto no es indulgencia: es la consecuencia de que el producto trate el error como información. Una feria en la que el juego te expulsa a los noventa segundos no es una feria en la que alguien juegue dos veces.

## Progresión separada de desempeño

El desempeño cambia:

- Promedio;
- score;
- qué contenido de recuperación aparece;
- flags e historia;
- arquetipo final;
- Aura, Equipo y Estilo donde tenga sentido contextual.

El desempeño **no** produce por sí solo un estado terminal de “no podés seguir”.

## Qué dice hoy la documentación vigente

[Reglas, scoring y progresión](rules-scoring-and-progression.md) declara que en el MVP no hay repetición automática de año por bajo desempeño: la fantasía es una carrera comprimida, no un simulador administrativo de promoción escolar. **Eso sigue vigente y no se contradice.**

Lo que agrega esta dirección es el otro lado: no repetir el año tampoco significa que el bajo desempeño no tenga consecuencia. La consecuencia es narrativa y de score, comprimida en eventos, no en volver a jugar doce meses.

## Patrón de cierre de año

Estados comprimidos sugeridos, **no implementados**:

- promoción directa;
- cierre normal;
- recuperación requerida;
- promoción «con lo justo» con materia pendiente que vuelve después.

Una recuperación también puede salir mal. El sistema converge igual, con otra consecuencia comprimida, en vez de encerrar al jugador en un bucle.

## Previas

Una estructura oculta de materias pendientes permite callbacks:

```text
1.º: te quedó una previa → 2.º/3.º: esa previa sigue ahí → 5.º: arco final de recuperación
```

Es estado narrativo oculto, no una quinta stat en el HUD. El modelo visible sigue siendo el de [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md): Promedio, Equipo, Aura y Estilo, y nada más es permanente.

## Sin sistema de vidas

Ni corazones, ni intentos limitados, ni tres strikes. El error genera consecuencia y contenido adicional, no menos minutos de juego.

## Requisito de verificación

Cuando esta dirección se implemente, la simulación y los property tests tienen que establecer que:

- toda run completable llega a `EGRESADO`;
- ningún estado de fracaso académico es terminal;
- la recuperación no puede crear un callejón sin salida;
- el estado sigue siendo serializable y reproducible por replay.

La simulación masiva vigente (`pnpm game:simulate`) ya busca callejones sin salida y divergencia de replay; el invariante de egreso se suma a esa capa cuando exista contenido de recuperación. Ver [estrategia de testing](../04-quality/testing-strategy.md).

## Estado de implementación

El slice de 7.º termina en un hito de año, no en el egreso. La carrera completa `7.º → 1.º → 2.º → 3.º → 4.º → 5.º → Egreso`, el arco de recuperación y el arquetipo final son **contenido futuro**; ver [la secuencia de implementación](../06-delivery/implementation-sequence.md).
