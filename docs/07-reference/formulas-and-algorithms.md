# Fórmulas y algoritmos

Referencia de las fórmulas que el proyecto usa o propone, **con su estado declarado en cada una**. Una fórmula ilustrativa no es una política.

| Etiqueta | Significado |
|---|---|
| **NORMATIVA** | implementada y verificada por tests; cambiarla es un cambio de versión |
| **CANDIDATA** | propuesta con forma decidida y constantes abiertas; requiere Teacher Gate |
| **ILUSTRATIVA** | ejemplo para explicar una idea; no define comportamiento |

---

## 1 · Promedio — NORMATIVA

Promedio es la media de las notas reales, redondeada a un decimal. El estado guarda el libro de notas, no un acumulador.

```text
Promedio = Σ notas / cantidad de notas
```

Sin notas, Promedio es `null` y no se dibuja. `null` no es 0. Ver [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md).

Extensión **CANDIDATA** para años con evaluaciones de distinto peso:

```text
Promedio = Σ (peso_j × nota_j) / Σ peso_j
```

Con pesos iguales colapsa a la forma actual, así que adoptarla no cambiaría ningún resultado existente.

## 2 · Normalización de Estilo — NORMATIVA

Dado un vector de evidencia no negativa `(A, E, I)` con `S = A + E + I`:

- si `S = 0`, Estilo todavía no tiene significado y no se muestra;
- si no, `%A = 100A/S`, `%E = 100E/S`, `%I = 100I/S`.

El redondeo usa **resto mayor** con desempate sobre el orden canónico de los ejes, de modo que los tres enteros suman exactamente 100 en cualquier motor y en cualquier dispositivo. Redondear cada porcentaje por separado rompería esa suma, y eso sería no determinismo, no un detalle de presentación.

## 3 · Clasificación por precisión y cobertura — NORMATIVA

Usada por la grilla del acto del 25 de Mayo.

```text
precisión = TP / (TP + FP)
cobertura = TP / (TP + FN)
F1        = 2·TP / (2·TP + FP + FN)
```

Se juzga con las dos juntas porque cada una miente sola: marcar una celda evidente da 100 % de precisión sin haber hecho la tarea, y marcar la grilla entera da 100 % de cobertura. Los casos de denominador cero están decididos explícitamente, y los umbrales por calidad están en el [catálogo de desafíos](../01-game-design/challenge-catalog.md).

Una propuesta previa —`0,6 × precisión + 0,4 × cobertura`— también funciona, pero F1 se anula si cualquiera de las dos colapsa, que es exactamente la propiedad que hacía falta. Si algún día un contenido necesita penalizar más un lado que el otro, se usa `Fβ` con la β documentada, no un peso sin explicar.

## 4 · Score por evento — NORMATIVA en forma, ABIERTA en constantes

```text
score_evento = base × calidad × dificultad + bonus − penalizaciones
```

La forma está fijada por [reglas, scoring y progresión](../01-game-design/rules-scoring-and-progression.md) y el motor la implementa con aritmética racional exacta, redondeando una sola vez al final. Las constantes vigentes son de **desarrollo**, marcadas `production: false`, y la [pregunta 24](open-questions.md) es su gate.

## 5 · Desempeño matemático competitivo — CANDIDATA

```text
MathRaw         = Σ (1000 × q_i × d_i)
MathMax         = Σ (1000 × d_i)
MathPerformance = 10000 × MathRaw / MathMax
```

Con `q_i ∈ [0,1]` la calidad matemática del evento y `d_i` el multiplicador de su banda de dificultad. Normalizar contra el máximo alcanzable de esa run es lo que permite comparar runs armadas con plantillas distintas.

## 6 · FairScore — CANDIDATA / TEACHER GATE

```text
FairScore = round(wM × M + wT × T + wA × A)      con wM + wT + wA = 1
```

Ponderación candidata: `0,80 / 0,15 / 0,05`. **No es la fórmula oficial.** Ver [score competitivo y ranking](../01-game-design/competitive-scoring-and-ranking.md) y el [ejemplo de política](score-policy.example.json).

## 7 · Comparador de ranking — CANDIDATA

Comparación lexicográfica, gana la tupla mayor:

```text
(FairScore, MathPerformance, OptimalCount, Accuracy, DifficultySolved, −ActiveTimeMs)
```

El empate exacto requiere política explícita del organizador; no se resuelve con ruido aleatorio.

## 8 · Generación inversa — ILUSTRATIVA

Ejemplo de mural. Cobertura `c = 8 m²/L`, envases de `1`, `2` y `4 L`. Para garantizar que 2 L sea el envase mínimo suficiente, se elige el área requerida `R` tal que:

```text
8 < R ≤ 16
```

y recién después se eligen dimensiones legibles cuyo producto —menos aberturas si las hay— dé `R`. El camino inverso, elegir dimensiones y ver qué sale, produce variantes triviales o imposibles. Ver [familias, plantillas y variantes](../01-game-design/challenge-families-and-variants.md).

## Ejemplos de contrato

Los archivos siguientes son **documentación**: muestran la forma de un contrato, no configuran nada. No se importan desde runtime, sus valores no son configuración de producción y una migración no se justifica sólo en ellos.

| Archivo | Qué ilustra |
|---|---|
| [run-descriptor.example.json](run-descriptor.example.json) | identidad inmutable de una run oficial |
| [score-policy.example.json](score-policy.example.json) | política de score versionada, marcada `teacher-gate` |
| [score-breakdown.example.json](score-breakdown.example.json) | desglose de score guardado por run verificada |
| [event-config.example.json](event-config.example.json) | configuración de un evento de feria |
| [event-effects.example.json](event-effects.example.json) | efectos de un evento: carrera, ocultos y competencia, por separado |
| [challenge-authoring.example.yaml](challenge-authoring.example.yaml) | ficha de autoría de una plantilla antes de que exista código |
| [content-schema.example.json](content-schema.example.json) | ejemplo de definición de desafío |
