# Migración de 7.º grado a v0.2

Qué cambió al llevar el slice jugable del sistema oscuro v0.1 a la identidad papel, y qué **no**.

## Lo que no cambió

Vale empezar por acá, porque es la evidencia de que la migración no se llevó puesto el juego.

La matemática de los cinco desafíos autorados, su evaluación y su comportamiento determinista quedaron **intactos**. Las dos runs golden reproducen el mismo recorrido, el mismo score, el mismo perfil y la misma cantidad de comandos que antes; lo único que cambió es el hash del estado final, porque el estado ahora lleva `career` en lugar de `stats`.

## Lo que cambió

### 1. El modelo de jugador

`knowledge · team · initiative · energy` → `Promedio · Equipo · Aura · Estilo`. Es migración de datos, no re-skin: ver [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md).

Los efectos de los cinco desafíos se reescribieron contra `CareerEffects`. La mayoría declara **una o dos** dimensiones, no cuatro:

| Evento | Mueve | Por qué |
|---|---|---|
| colectivo | sólo Estilo | ejercita porcentaje y tiempo, pero nadie pone una nota |
| mural | Promedio + Estilo | la profesora lo toma como trabajo del trimestre |
| cuaderno | Equipo + Estilo | la plata es del curso y el proyecto depende de la compra |
| proyecto | Equipo + Estilo | está en juego la conducta hacia el grupo |
| feria | Equipo + Estilo | el stand es del curso |

Las tres primeras filas vienen mapeadas del handoff. Las dos últimas se autoraron acá siguiendo la misma regla, porque el handoff no las cubre.

### 2. El vocabulario de resultado

El motor sigue hablando `invalid · functional · efficient · optimal` —con sus factores de score documentados en el GDD— y el jugador lee `Insuficiente · Parcial · Resuelto · Óptimo`. La traducción es posicional y total, y vive en `components/game/outcome.ts`.

Renombrar en el dominio habría movido factores de score, tests golden y la huella del ruleset por una decisión de rótulo.

### 3. Contenido nuevo, autorado

Dos campos por resultado que el modelo v0.1 no tenía y el panel v0.2 necesita:

- **`consequence`** — qué pasa en la historia. Sin esto el panel dice qué pasó con los números pero no qué pasó en el mundo, que es su trabajo.
- **`stamp`** — el veredicto en una o dos palabras, para el sello. Opcional: no toda situación tiene uno que valga la pena.

Y tres campos de presentación en los datos: `unit`, `constraint` y `span`. Cuál de los números aprieta es una afirmación sobre el problema, y adivinarla desde la presentación sería inventarla.

Cada storylet gana un `eyebrow`: el momento del año que va arriba del título. Autorado y no derivado de `tags`, porque las tags existen para tooling y una etiqueta que el jugador lee es contenido.

### 4. Los números se escriben en es-AR

`src/content/numeros.ts` acompaña a `pesos.ts`: el motor produce `14.40` porque su salida entra en estado determinista, y el contenido lo escribe `14,40`. La pared es `6 × 2,4` y no `6,0 × 2,4` — el cero de más sugiere una precisión que la medida no tiene.

### 5. Las pantallas

| v0.1 | v0.2 |
|---|---|
| `GameShell` monolítico | `GameSheet` + `StageHeader` + `CareerStrip` + `SceneColumn` + `ActionSlot` |
| `StatRow` con cuatro barras | `CareerStrip` con aparición progresiva |
| `StageProgress` con `<progress>` | celdas de la cuadrícula |
| opciones sobre papel | opciones dentro del bloque oscuro |
| panel con ícono de librería | panel con pestaña, ledger, sello y chips |
| resumen con conteos | cierre de etapa con numeral, registro, Estilo y arquetipo |
| puntaje visible en el HUD | fuera: el score oficial lo calcula el servidor |

### 6. Compatibilidad

`ENGINE_VERSION` a `2.0.0`, snapshot a `v2`, ruleset y contenido a `0.2.0`. Un checkpoint v1 se rechaza, se descarta y se ofrece partida nueva: reanudar hacia números que nadie se ganó es peor que empezar de cero.

## Lo que no se migró, y por qué

> **Actualización.** El acto del 25 de Mayo ya está autorado en el motor y Aura sí aparece en el slice. Ver [el catálogo de desafíos](../01-game-design/challenge-catalog.md) y el [slice de 7.º](../06-delivery/vertical-slice-grade-7.md). Lo que sigue vale para el resto.

**Budget y Assignment se migraron visualmente, no funcionalmente.** El handoff los marca «especificados, no construidos» y los difiere a v0.3. En particular, el total corriente del presupuesto sigue sin mostrarse: ver el registro de preguntas abiertas.
