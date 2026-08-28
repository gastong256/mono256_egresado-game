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

Estos valores deben tunearse con playtests.

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
