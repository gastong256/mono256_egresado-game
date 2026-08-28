# Score competitivo y ranking

**Estado: RECOMENDADO / TEACHER GATE.** Nada de este documento es una regla cerrada. La separación entre identidad de carrera y score competitivo es una recomendación fuerte de arquitectura; **todos los coeficientes, topes y calibraciones son candidatos** y requieren aprobación del Departamento de Matemática antes del congelamiento de competencia. Los valores exactos siguen **OPEN** ([pregunta 24](../07-reference/open-questions.md)).

El score por evento vigente —`base × calidad × dificultad + bonus − penalizaciones`— está en [reglas, scoring y progresión](rules-scoring-and-progression.md) y es lo que el motor implementa hoy. Este documento describe la capa **competitiva** que todavía no existe.

## Tres capas que no son la misma cosa

| Capa | Qué responde | Dónde vive |
|---|---|---|
| **Resultado de desafío** | ¿qué tan bien se resolvió esta situación? | `SolutionQuality` + métricas de razonamiento |
| **Identidad de carrera** | ¿qué clase de recorrido escolar construí? | Promedio · Equipo · Aura · Estilo |
| **Score competitivo** | ¿qué tan fuerte fue esta run oficial bajo las reglas del evento? | `FairScore`, sólo en modo feria |

Están relacionadas y no son intercambiables. Un documento futuro que las trate como un solo sistema estará equivocado en las tres.

## Por qué no se multiplican las stats visibles

Una fórmula del tipo `Aura × 1 + Matemática × 10 + Equipo × 5` no significa lo que parece: las variables viven en escalas distintas.

- dominio matemático oculto: `0–1`;
- Promedio: `1–10`;
- Equipo: `0–100`;
- Aura: con signo, sin techo.

Un multiplicador no expresa peso relativo hasta que cada componente está normalizado. Antes de normalizar, el «peso» es un accidente de escala.

## Arquitectura de score recomendada

Cada evaluador devuelve, además de sus efectos de carrera, una medida de desempeño competitivo normalizada.

### Calidad matemática por evento

`q_i ∈ [0,1]`

Calibración discreta de partida, **candidata y sujeta a Teacher Gate**:

| Calidad | `q` candidato |
|---|---|
| óptima | 1,00 |
| eficiente / resuelta | 0,75 |
| funcional / parcial | 0,40 |
| inválida / insuficiente | 0,10 |

Las interacciones continuas —por ejemplo la grilla de clasificación del acto del 25 de Mayo, que ya se juzga con F1— usan su propia métrica de calidad en vez de estas cuatro cajas. Ver [catálogo de desafíos](challenge-catalog.md).

> Nota de terminología: el motor nombra las calidades `invalid · functional · efficient · optimal`; el blueprint las nombra `insufficient · partial · resolved · optimal`. Es la misma escala de cuatro escalones con distinta etiqueta. El [glosario](../07-reference/glossary.md) fija la correspondencia.

### Desempeño matemático normalizado

```text
MathRaw         = Σ (1000 × q_i × difficultyFactor_i)
MathMax         = Σ (1000 × 1,0 × difficultyFactor_i)
MathPerformance = 10000 × MathRaw / MathMax
```

Normalizar contra el máximo alcanzable de *esa* run es lo que permite comparar runs armadas con plantillas distintas.

### Contribuciones de Equipo y Aura

Si se decide que “toda la carrera cuenta”, la contribución competitiva es **una medida de evento acotada**, no el valor visible de la stat.

- `TeamPerformance ∈ [0, 10000]`;
- `AuraPerformance ∈ [0, 10000]` después de normalización y tope del evento.

Aura cruda sigue siendo con signo y sin techo para uso narrativo. Aura competitiva tiene que estar topeada: un solo momento espectacular no puede ganarle a una run matemáticamente superior.

### FairScore candidato

**RECOMENDADO / TEACHER GATE — no es la fórmula oficial.**

```text
FairScore = round(0,80 × MathPerformance + 0,15 × TeamPerformance + 0,05 × AuraPerformance)
```

La ponderación 80/15/5 es un **candidato defendible**, no una decisión tomada. Una intuición previa de `10:5:1` normaliza a 62,5 % / 31,25 % / 6,25 %, que probablemente le da demasiado peso competitivo a la conducta de equipo en una feria de matemática individual.

Quien implemente esto debe escribirlo como política versionada y configurable, nunca como constantes anónimas. Ver [ejemplo de política de score](../07-reference/score-policy.example.json).

## Qué no entra al score

### Promedio

No se suma aparte si ya está determinado por desempeño académico matemático. Sumarlo dos veces cuenta la misma habilidad dos veces.

### Estilo

No puntúa directamente. Darle score a Aplicado, Estratega o Improvisador implicaría que hay una personalidad objetivamente superior, y eso destruye el concepto de perfil: el juego dice explícitamente que ningún eje es el malo.

### Cantidad de intentos

No es desempate en ninguna dirección. Premiar más intentos premia tiempo libre; penalizarlos castiga la práctica. Queda como dato informativo salvo decisión docente explícita.

## Intentos y personal best

**RECOMENDADO / TEACHER GATE.** Política sugerida: intentos ilimitados o configurables, y el leaderboard guarda el **mejor intento**, no la suma.

Sumar intentos convierte el ranking en una medida de tiempo disponible. El mejor intento premia la mejora sin castigar a quien llegó tarde a la feria. La guía de GameKit para desafíos repetibles apunta en la misma dirección; ver [base teórica](../07-reference/research-basis.md).

La decisión entre ilimitado y N intentos es del evento y sigue abierta. La operación está en [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).

## Desempate

Sin ruido aleatorio y sin decimales inventados para forzar unicidad. Tupla lexicográfica **recomendada**:

1. `FairScore` desc;
2. `MathPerformance` / `MathRaw` desc;
3. cantidad de resultados óptimos desc;
4. precisión desc;
5. dificultad resuelta desc;
6. tiempo activo asc.

La matemática decide antes que la velocidad, y la velocidad sólo aparece al final. El desempate vigente y más simple del leaderboard está en [leaderboard y moderación](../05-operations/leaderboard-and-moderation.md); esta tupla lo extiende y todavía no lo reemplaza.

### Empate exacto

No se puede prometer que un score con significado nunca empate: garantizar unicidad exige una clave arbitraria. Para premios hace falta una **política de organizador escrita antes de la feria**: puesto compartido, premio compartido o un desempate anunciado. Un `run_id` puede dar orden de visualización estable, pero no puede decidir un premio en secreto.

Esa política es **OPEN**.

### Tiempo

Si el tiempo activo participa del desempate, hay que definirlo con cuidado: el reloj de pared se distorsiona con pestañas en segundo plano y red intermitente. Se prefieren intervalos activos controlados por el motor o marcas verificables por el servidor. La pregunta de qué señal temporal puede confiar el servidor sigue **OPEN** ([pregunta 27](../07-reference/open-questions.md)).

## Transparencia

Las reglas publicadas tienen que poder explicarse en tres frases: la matemática es lo que más pesa, las decisiones de juego secundarias suman poco, la velocidad sólo desempata. Si la explicación pública no cabe en un cartel, la fórmula es demasiado complicada para una feria.

## Estado de implementación

| Capacidad | Estado |
|---|---|
| Score por evento determinista, con política nombrada y versionada | **implementado**, marcado `production: false` |
| Separación entre stats visibles y métricas ocultas de razonamiento | **implementado** |
| `MathPerformance` / `TeamPerformance` / `AuraPerformance` normalizados | **no implementado** |
| `FairScore` y desglose competitivo | **no implementado** |
| Comparador lexicográfico versionado | **no implementado** |
| Personal best transaccional en servidor | **no implementado** |
| `scoreVersion` en la identidad de la run | **no implementado** |

Ver [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md).
