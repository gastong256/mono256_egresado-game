# Eventos raros y Prestige

- **Decisión de producto:** `ACCEPTED`
- **Arquitectura de implementación:** `OPEN · NOT IMPLEMENTED`
- **Calibración:** `CANDIDATE`
- **Política posterior al empate FairScore/Prestige:** `OPEN` para STAGE-09

Los eventos raros deben volver memorables y diferentes las carreras sin convertir
el ranking en una lotería. Prestige puede reconocer trayectorias y acciones
independientes como segundo criterio competitivo; nunca compensa un `FairScore`
menor. Este documento fija semántica de producto, no autoriza ni describe un
runtime existente.

## RNG determinista — regla de producto `LOCKED`

Una selección pseudoaleatoria sólo es válida si es explícita, seeded, reproducible
y verificable por replay/servidor:

```text
misma identidad de run + mismo estado/historia + mismo contexto determinista
= mismo resultado raro
```

No entra `Math.random()`, reloj implícito ni otra entropía ambiente en el core. La
dirección aceptada es un substream semántico propio —junto a composición,
variantes, narrativa y recuperación— para que cambios ajenos no desplacen el
resultado. Su arquitectura concreta deberá seguir las convenciones del motor y
quedará sujeta a revisión/ADR cuando se implemente.

## Clases y selección

- **COMMON:** contenido ordinario del catálogo/run.
- **CONDITIONAL:** aparece sólo si Carrera, historial y flags satisfacen su elegibilidad.
- **RARE:** requiere elegibilidad y luego selección RNG determinista.

Las bandas `UNCOMMON / RARE / VERY_RARE` están aceptadas; porcentajes exactos no.

```text
Carrera / historia / flags
          ↓
predicado de elegibilidad
          ↓
pool raro elegible
          ↓
RNG seeded determinista
          ↓
evento seleccionado o ninguno
```

La rareza debe tener presupuesto por run. Un orden de magnitud como 0–2 eventos
raros y máximo uno VERY_RARE es ilustrativo, no congelado. La calibración debe ser
centralizada por bandas; no se reparten porcentajes arbitrarios entre Templates.

## Tratamientos

### `NARRATIVE_ONLY`

Cambia storylet, callback, badge o display de rareza. Impacto por defecto:
`FairScore = 0`, `Prestige = 0`.

### `PRESTIGE_REPLACEMENT`

Reemplaza una oportunidad ordinaria/condicional de Prestige con el mismo máximo.
El RNG cambia la historia, no el techo competitivo.

### `SPECIAL_MILESTONE`

Puede habilitar Prestige si el jugador realiza una acción especial con evidencia
independiente, dentro del presupuesto global/de track. Debe usarse poco.

Si alguna vez existe gameplay raro con `FairScore`, reemplaza una oportunidad
equivalente en vez de agregar un beat puntuable.

## Guardrails competitivos — `LOCKED`

El RNG nunca puede:

1. decidir si el jugador egresa;
2. cambiar qué es matemáticamente correcto;
3. crear una oportunidad máxima adicional de `FairScore`;
4. decidir directamente quién gana el ranking;
5. superar el techo estructural de recuperación;
6. otorgar Prestige porque el evento apareció;
7. dar a una run un techo de Prestige mayor que a otra comparable.

## FairScore y Prestige

`FairScore ∈ [0, 10.000]` sigue siendo el criterio primario. Prestige es una
medida secundaria conceptualmente acotada a `0–100` bajo la calibración candidata.
Puede reconocer Estilo, arcos de carrera, logros especiales y desempeño en
oportunidades raras sólo cuando la evidencia no fue puntuada antes.

El orden aceptado es lexicográfico:

```text
1. FairScore DESC
2. PrestigeScore DESC
3. política de empate STAGE-09 o puesto compartido
```

No se calcula `FairScore + PrestigeScore`. Por ejemplo, `10.000 / 10 Prestige`
ordena antes que `9.999 / 100 Prestige`.

La UI futura puede mostrar algo como `10.000 +45 Prestige`, pero debe explicar
que no es una suma aritmética. El comparador, persistencia y ranking todavía no
están implementados.

## Presupuesto candidato 25 × 4

```text
STYLE                 máximo candidato 25
CAREER ARC            máximo candidato 25
SPECIAL ACHIEVEMENTS  máximo candidato 25
RARE EVENTS           máximo candidato 25
──────────────────────────────────────────
TOTAL                 máximo candidato 100
```

`SPECIAL ACHIEVEMENTS` reemplaza la etiqueta propuesta “social” para no invadir
Equipo/Aura. Magnitudes `+5 / +10 / +15 / +20 / +25` son sólo orden de magnitud
candidato. Cap, tracks, pesos y premios exactos quedan abiertos a contenido y
calibración competitiva.

## No doble conteo — `LOCKED`

Toda oportunidad debe preguntar si Matemática, Equipo o Aura ya usan la misma
evidencia. Si la respuesta es sí, puede existir como badge display-only pero
`PrestigeEligible = false`.

- “Matemática perfecta” no puede sumar Prestige: ya domina `FairScore`.
- Una trayectoria consistente de Estilo podría ser válida porque Estilo no puntúa directamente.
- “Sin recuperaciones” correlaciona con Matemática y requiere evidencia independiente; por defecto es badge.
- Un comeback narrativo más amplio podría ser elegible si no significa sólo “tuvo una nota baja/alta”.

La misma regla separa Math, Team, Aura y Prestige en cada Template.

## RNG y normalización — `LOCKED DIRECTION`

La forma válida es:

```text
RNG → aparece/reemplaza oportunidad → acción o trayectoria independiente → Prestige
```

Nunca `RNG → Prestige`. Una oportunidad rara reemplaza normalmente otra estándar
con igual techo. Así dos runs pueden contar historias distintas y seguir teniendo
la misma oportunidad competitiva máxima, lo que reduce azar y seed farming bajo
intentos ilimitados.

## Rareza visible

La rareza puede mostrarse por separado del valor competitivo, por ejemplo “MUY
RARO · 3,2 % de carreras”, sólo cuando telemetría real lo respalde. Un evento más
raro no vale automáticamente más Prestige.

## Empates e intentos

Prestige reduce empates exactos de `FairScore`, pero el producto no exige un #1
único. Si también empata Prestige, el puesto compartido es válido hasta que
STAGE-09 defina una política terciaria anunciada. Timestamp, registro, seed o RNG
no pueden decidir un premio en silencio.

TG1 aceptó intentos ilimitados y mejor resultado verificado. Normalizar el techo
de oportunidad reduce la búsqueda de seeds; emisión de seeds/run descriptors y
su política de equidad quedan abiertas para STAGE-09.

## Ejemplos actuales de diseño

| Año | Evento | Estado/tratamiento |
|---|---|---|
| 1.º | `power-outage` antes de la exposición | `RARE / CONDITIONAL / NARRATIVE_ONLY / Prestige 0` |
| 2.º | falta alguien antes del intercurso | contexto candidato; diseño detallado pendiente |
| 3.º | caída de internet durante el proyecto tecnológico | contexto candidato; diseño detallado pendiente |
| 4.º | `represent-class` | Template rara/condicional candidata; aparecer vale 0, una acción independiente podría ofrecer Prestige acotado |
| 5.º | falla de último minuto antes del evento final/egreso | contexto candidato con potencial narrativo; detalle pendiente |

## Decisiones que siguen abiertas

- porcentajes y densidad exacta de cada banda;
- cap, tracks, pesos y premios definitivos de Prestige;
- catálogo y condiciones exactas de Career Milestones;
- arquitectura versionada de selección, oportunidad y replay;
- política de emisión de seeds e intentos en STAGE-09;
- criterio posterior a un empate de FairScore y Prestige.

Estas aperturas están indexadas en [preguntas abiertas](../07-reference/open-questions.md).
No se crea un ADR en Phase 0: la semántica de producto está aceptada, pero la
decisión técnica que cruzará RNG, replay, score y ranking todavía no fue tomada.
