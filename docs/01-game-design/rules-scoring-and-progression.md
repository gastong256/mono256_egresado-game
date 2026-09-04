# Reglas, scoring y progresión

## Reglas globales

1. Una run se identifica por `run_id`, `seed`, `game_version`, `ruleset_version` y `content_version`.
2. Una run oficial se inicia en servidor cuando el modo requiere ranking.
3. El cliente puede previsualizar score, pero el servidor calcula el resultado oficial.
4. Cada desafío debe declarar su función de evaluación.
5. Toda variante procedural debe ser validable de forma determinista.
6. La run continúa después de errores salvo fallo técnico irrecuperable.

## Progresión temporal

Etapas canónicas:

1. 7.º grado.
2. 1.º año.
3. 2.º año.
4. 3.º año.
5. 4.º año.
6. 5.º año.
7. Egreso.

Cada etapa puede modificar:
- dificultad objetivo;
- categorías matemáticas habilitadas;
- storylets disponibles;
- peso de eventos sociales/proyectos;
- recompensas.

## Modelo de score

El score debe premiar calidad de decisión más que rapidez.

### Componentes sugeridos

`score_evento = base × calidad × dificultad + bonus_contextuales - penalizaciones`

Donde:
- `base`: valor estándar del evento.
- `calidad`: factor por inválida/funcional/eficiente/óptima.
- `dificultad`: factor del nivel del problema.
- `bonus_contextuales`: uso eficiente, predicción correcta, solución alternativa válida, etc.
- `penalizaciones`: sólo por decisiones lúdicas declaradas; nunca por usar una herramienta permitida salvo modo especial explícito.

### Factores iniciales de referencia

- inválida: 0.20–0.40.
- funcional: 0.70.
- eficiente: 0.90.
- óptima: 1.00.

Estos valores son de **desarrollo** y no oficiales: el motor los expone bajo una política nombrada marcada `production: false`, y el cargador de ruleset se niega a construir un ruleset oficial desde ahí. Su calibración final es una decisión del Departamento de Matemática ([pregunta 24](../07-reference/open-questions.md) y [pregunta 39](../07-reference/open-questions.md)), no el resultado de un playtest previo que no está garantizado. Ver [ciclo de entrega real](../00-product/real-delivery-lifecycle.md).

## Velocidad

La velocidad puede aportar un bonus pequeño con techo. No debe dominar el resultado porque:
- favorece cálculo mental sobre razonamiento;
- aumenta ansiedad;
- perjudica accesibilidad;
- incentiva adivinar.

## Rachas

Una racha puede celebrarse visualmente, pero su multiplicador debe ser controlado para no hacer imposible recuperar una run.

Ejemplo:
- 2 óptimas consecutivas: +3%.
- 3: +5%.
- 4+: cap +8%.

## Estadísticas narrativas

Las decisiones modifican stats mediante deltas pequeños y acotados. Las stats no deben sustituir el score matemático; su función principal es desbloquear/ponderar narrativa.

## Riesgo

Algunos eventos permiten decisiones con incertidumbre. El sistema debe distinguir:
- **calidad ex ante:** qué tan razonable era la decisión con la información disponible;
- **resultado ex post:** qué ocurrió por azar.

El score matemático debe basarse principalmente en calidad ex ante. El jugador no debería perder ranking porque un RNG justo produjo un resultado adverso después de una buena decisión.

## Perfil final

El perfil se calcula sobre features normalizadas:
- eficiencia;
- precisión;
- riesgo;
- colaboración (derivada de Equipo; el punto neutro cuando no hay evidencia, no cero);
- iniciativa (derivada de Estilo, no de una estadística visible);
- uso de datos adicionales;
- estabilidad entre años.

Ejemplo conceptual:

```text
Estratéga = eficiencia alta + precisión alta + riesgo moderado
Improvisador = velocidad alta + riesgo alto + uso bajo de herramientas
Líder = equipo alto + decisiones de asignación eficientes
Científico = precisión alta + preferencia por evidencia + estadística alta
```

No usar diagnósticos psicológicos ni lenguaje clínico.

## Condición de finalización

La run termina al completar el evento final o al abandonar explícitamente.

No hay repetición automática de año por bajo desempeño en el MVP. La fantasía es una carrera comprimida, no un simulador administrativo de promoción escolar.

Eso no significa que el bajo desempeño no tenga consecuencia. El **fail-forward está implementado**: un resultado ordinario alcanzado por la política puede dejar una obligación; el año la cierra con un repaso fuera de su presupuesto ordinario, y toda run válida completada alcanza `GRADUATED`. El repaso no aporta evidencia a `FairScore`, no borra el resultado original y nunca se repite en bucle.

El máximo de **un repaso por etapa** es estructura aceptada en [ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md), no una calibración ordinaria. `RecoveryPolicy` conserva el campo como literal inspeccionable `1` y calibra qué calidades disparan una obligación; el content set declara el ruteo por plantilla. Una plantilla puede declarar `none` de manera intencional. 7.º ya prueba el recorrido real: las dos plantillas del colectivo rutean a `g7.bus-travel-review`; las otras cinco plantillas ordinarias declaran `none`. Ver [egreso, recuperación y fail-forward](graduation-and-fail-forward.md).

## Este score no es el score de la competencia

Lo anterior describe el **score por evento y por run** que ve el jugador. Es una capa distinta del score competitivo de una run completa, implementado desde STAGE-06 como política candidata de desarrollo.

| Capa | Qué responde | Estado |
|---|---|---|
| Resultado de desafío | ¿qué tan bien se resolvió esta situación? | implementado |
| Score de run | ¿cuántos puntos hizo esta partida? | implementado, política de desarrollo |
| Identidad de carrera | ¿qué recorrido escolar construí? | implementado |
| Desempeño competitivo | ¿qué evidencia matemática, de equipo o de aura produjo cada beat? | implementado; Promedio y Estilo no son componentes |
| `FairScore` competitivo | ¿qué tan fuerte fue esta run bajo una `ScorePolicy` concreta? | **implementado**; `fair-score-dev-1` histórico y `fair-score-dev-2` post-TG1 actual, ambos `official: false` |
| Ranking | ¿cómo se ordenan runs verificadas y cuál es el personal best? | no implementado |

La cadena vigente mantiene límites explícitos: resultado de desafío ≠ efecto de carrera ≠ desempeño competitivo ≠ `FairScore` ≠ ranking. `MathPerformance` domina; `TeamPerformance` y `AuraPerformance` son secundarias y acotadas; Promedio y Estilo no puntúan directamente. Cuando el `RunPlan` no ofrece una componente, ésta sale del cálculo y los pesos activos se renormalizan, de modo que una ejecución perfecta conserva el máximo de 10.000.

La arquitectura y el mecanismo ya existen, incluida la aritmética entera y la recomputación en servidor. TG1 aceptó 85/10/5, los escalones de calidad, la normalización de oportunidades y el principio de recompensa pequeña; `fair-score-dev-2` los publica como candidato no oficial. Los factores exactos de dificultad, el ranking, la persistencia del personal best y el desempate siguen abiertos/futuros. Ver [score competitivo y ranking](competitive-scoring-and-ranking.md) y [ADR-023](../03-architecture/adr/ADR-023-competitive-score-policy.md).
