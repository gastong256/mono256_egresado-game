# Score competitivo y ranking

**Estado post-TG1:** mecanismo implementado; filosofía y ponderación 85/10/5 aceptadas como dirección docente; política todavía candidata y no oficial. Teacher Gate 1 no prueba equidad psicométrica ni reemplaza el congelamiento de competencia. La fórmula oficial final sigue **OPEN** ([pregunta 24](../07-reference/open-questions.md)).

El score por evento vigente —`base × calidad × dificultad + bonus − penalizaciones`— está en [reglas, scoring y progresión](rules-scoring-and-progression.md) y sigue siendo la capa de carrera. La capa **competitiva** conserva `fair-score-dev-1@1.0.0-candidate` como calibración histórica pre-Gate 80/15/5; las runs nuevas usan `fair-score-dev-2@2.0.0-post-tg1-candidate`, 85/10/5 y `official: false`. Ver [ADR-023](../03-architecture/adr/ADR-023-competitive-score-policy.md).

## Tres capas que no son la misma cosa

| Capa | Qué responde | Dónde vive |
|---|---|---|
| **Resultado de desafío** | ¿qué tan bien se resolvió esta situación? | `SolutionQuality` + métricas de razonamiento |
| **Identidad de carrera** | ¿qué clase de recorrido escolar construí? | Promedio · Equipo · Aura · Estilo |
| **Score competitivo** | ¿qué tan fuerte fue esta run bajo una calibración concreta? | `FairScore`, cuando el descriptor declara `scoreVersion` |

Están relacionadas y no son intercambiables. Un documento futuro que las trate como un solo sistema estará equivocado en las tres.

## Por qué no se multiplican las stats visibles

Una fórmula del tipo `Aura × 1 + Matemática × 10 + Equipo × 5` no significa lo que parece: las variables viven en escalas distintas.

- dominio matemático oculto: `0–1`;
- Promedio: `1–10`;
- Equipo: `0–100`;
- Aura: con signo, sin techo.

Un multiplicador no expresa peso relativo hasta que cada componente está normalizado. Antes de normalizar, el «peso» es un accidente de escala.

## Arquitectura de score implementada con calibración candidata

Cada evaluador devuelve, además de sus efectos de carrera, una medida de desempeño competitivo normalizada.

### Calidad matemática por evento

`q_i ∈ [0,1]`

Calibración discreta **aceptada en TG1-09 como candidato de desarrollo**:

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

### FairScore post-TG1 candidato

**TEACHER-INFORMED CANDIDATE — no es la fórmula oficial.**

```text
FairScore = round(0,85 × MathPerformance + 0,10 × TeamPerformance + 0,05 × AuraPerformance)
```

TG1-04 eligió 85/10/5 y reafirmó que matemática debe pesar más que Equipo y Aura juntos. Es una dirección de producto informada por docente, no una afirmación de superioridad empírica.

La implementación lo expresa como políticas inmutables resolubles por identidad o versión exacta, sin fallback `latest`. `dev-1` permanece reproducible; `dev-2` es la candidata actual. El desglose guarda id y versión, y `RunDescriptor.scoreVersion` guarda la versión exacta. Ver [ejemplo de política de score](../07-reference/score-policy.example.json).

### Qué pasa cuando una run no tiene la oportunidad

Los planes difieren en qué contienen: una partida compuesta de 7.º son dos beats de pura matemática y no ofrece ni equipo ni aura. Puntuarla sobre 8.000 mientras otra se puntúa sobre 10.000 castigaría a alguien por un sorteo que no hizo.

**Una componente sin oportunidad sale, y su peso se reparte entre las que quedaron.** TG1-07 aceptó esta filosofía. El juego perfecto vale 10.000 en toda run válida, y sacar una secundaria sólo puede aumentar la proporción de la matemática. No se fuerza cobertura de Equipo/Aura desde el compositor.

### Qué componente lee cada plantilla

Cada plantilla declara qué hecho suyo alimenta cada componente, y por qué es un hecho **distinto** del que otra ya leyó. La tabla de cobertura de 7.º está en el ADR; sus dos resultados incómodos vale la pena adelantarlos:

- **el stand mueve Equipo en la carrera y no aporta equipo competitivo**, porque su eficiencia es el costo mínimo que la matemática ya cobró;
- **ninguna plantilla de producción aporta aura competitiva**, porque el acto —el único evento que mueve Aura— sólo mide el F1 que la matemática ya usa. La componente existe, está topeada y la ejercitan los fixtures. Una componente honestamente vacía es mejor que una señal inventada para llenarla.

TG1-05/TG1-06 aceptaron escenas multi-eje con una condición: cada eje debe leer un hecho semánticamente independiente. Es válido separar factibilidad matemática de calidad de colaboración. Es inválido copiar el mismo F1 del acto a Matemática y Aura. La sugerencia sobre May-25 se conserva como intención para STAGE-08; antes de aportar Aura necesita una decisión pública/social distinta.

### Evidencia de la calibración candidata

Sobre 23.000 planes compuestos —20.000 años reales de 7.º más planes de uno, ocho y doce beats de fixtures— `fair-score-dev-2` da:

| Perfil sintético | Score |
|---|---|
| juego perfecto | 10.000 en **todos** los planes, sin dispersión |
| matemática fuerte, secundarias mínimas | 7.800 – 9.000 |
| matemática floja, secundarias perfectas | 2.000 – 3.200 |
| peor juego posible | 0 |

Las dos franjas del medio **no se cruzan**. `pnpm game:score` reproduce la tabla y `--compare` incluye la comparación histórica `dev-1`/`dev-2` con contribuciones por componente.

Nada de esto demuestra que 85/10/5 sea psicométricamente justo. Demuestra que el mecanismo cumple las invariantes que se le pidieron bajo esa candidata.

## Qué no entra al score

### Promedio

No se suma aparte si ya está determinado por desempeño académico matemático. Sumarlo dos veces cuenta la misma habilidad dos veces.

### Estilo

No puntúa directamente. Darle score a Aplicado, Estratega o Improvisador implicaría que hay una personalidad objetivamente superior, y eso destruye el concepto de perfil: el juego dice explícitamente que ningún eje es el malo.

### Cantidad de intentos

No es desempate en ninguna dirección. Premiar más intentos premia tiempo libre; penalizarlos castiga la práctica. Queda como dato informativo salvo decisión docente explícita.

## Intentos y personal best

**TG1 ACCEPTED PRODUCT DIRECTION.** Los intentos son lógicamente ilimitados y el ranking futuro conserva el **mejor resultado verificado**, no la suma.

Sumar intentos convierte el ranking en una medida de tiempo disponible. El mejor intento premia la mejora sin castigar a quien llegó tarde a la feria. La guía de GameKit para desafíos repetibles apunta en la misma dirección; ver [base teórica](../07-reference/research-basis.md).

STAGE-09 implementará emisión autoritativa, identidad y persistencia. Ilimitado no significa elegir una seed fácil: la infraestructura asigna cada `RunPlan`/seed. La operación está en [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).

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

Esa política es **OPEN**. TG1-11 pidió ajustarla y propuso Hitos aleatorios para reducir empates. La integración separa dos problemas: los Hitos son una oportunidad futura de reconocimiento narrativo/carrera; no agregan puntos aleatorios ni garantizan un puesto único. Empates legítimos pueden existir y STAGE-09/TG2 decidirán el criterio anunciado.

### Tiempo

Si el tiempo activo participa del desempate, hay que definirlo con cuidado: el reloj de pared se distorsiona con pestañas en segundo plano y red intermitente. Se prefieren intervalos activos controlados por el motor o marcas verificables por el servidor. La pregunta de qué señal temporal puede confiar el servidor sigue **OPEN** ([pregunta 27](../07-reference/open-questions.md)).

## Transparencia

Las reglas publicadas tienen que poder explicarse en tres frases: la matemática es lo que más pesa, las decisiones de juego secundarias suman poco, la velocidad sólo desempata. Si la explicación pública no cabe en un cartel, la fórmula es demasiado complicada para una feria.

## Estado de implementación

| Capacidad | Estado |
|---|---|
| Score por evento determinista, con política nombrada y versionada | **implementado**, marcado `production: false` |
| Separación entre stats visibles y métricas ocultas de razonamiento | **implementado** |
| `MathPerformance` / `TeamPerformance` / `AuraPerformance` normalizados | **implementado**, en puntos básicos enteros |
| `FairScore` y desglose competitivo | **implementado**; `fair-score-dev-1` histórico y `fair-score-dev-2` actual, ambos `official: false` |
| Recomputación y verificación autoritativa del score en servidor | **implementado**: el servidor puntúa reproduciendo, y `verifyScoreClaim` contradice un reclamo campo por campo |
| Comparador lexicográfico versionado | **no implementado**; sin ranking no tiene a qué ordenar, y el desglose ya reporta el primer criterio que va a necesitar |
| Personal best transaccional en servidor | **no implementado** |
| `scoreVersion` en la identidad de la run | **implementado**, opcional: una partida de práctica no está compitiendo |

Ver [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md).
