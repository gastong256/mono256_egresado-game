# Validación y auditoría de variantes

**Estado: implementado.** El contrato transversal de validador, el catálogo aprobado y la auditoría estadística existen desde [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md). Lo que sigue abierto es el catálogo **oficial de la feria**, que es una decisión de evento y no de arquitectura.

Comandos: `pnpm game:variants check` reconstruye el catálogo comprometido y revalida cada entrada —forma parte de `pnpm verify`—; `pnpm game:variants audit` corre la barrida estadística grande; `pnpm game:variants build` reconstruye el artefacto.

[Validación de contenido](content-validation.md) describe la revisión completa de un desafío. Este documento cubre dos niveles distintos: la confianza matemática, estructural y de reproducibilidad **ya implementada** para una población aprobada, y el hardening competitivo que todavía depende de dificultad, composición de runs y congelamiento de feria.

## Por qué

Una variante generada en vivo puede salir ambigua, imposible, trivial o con decimales impresentables. En modo práctica eso es un bug que se arregla mañana. En una competencia con premios, el jugador que la recibió ya perdió.

De ahí la regla: **en modo oficial no se juega una variante que nadie validó.**

## Invariantes genéricos

Toda variante desplegada tiene que satisfacer, de forma ejecutable:

- la generación termina;
- todos los valores son finitos y están en rango;
- existe al menos una respuesta o camino válido;
- no hay opciones duplicadas por accidente;
- el óptimo declarado existe;
- no hay empate no intencional en el óptimo, salvo que el diseño declare múltiples óptimos;
- todas las ramas de resultado son alcanzables como se pretendía;
- el cálculo del feedback coincide con el del evaluador;
- el enunciado público contiene toda la información necesaria;
- moneda, tiempo y unidades tienen formato válido;
- existe metadata de dificultad;
- existe fingerprint canónico.

Las validaciones aplicables ya se ejecutan sobre fuentes `authored` y `generated`: primero las genéricas del pipeline y después los chequeos matemáticos específicos de cada plantilla, con oráculos independientes donde es viable. Una plantilla futura no obtiene un oráculo automáticamente: debe declarar sus validadores junto con su fuente.

## Invariantes de legibilidad

Difíciles de automatizar por completo, imprescindibles igual:

- sin complejidad decimal accidental fuera de la banda buscada;
- sin valores absurdos para un contexto escolar;
- texto de opción dentro del límite práctico de 360 px;
- notación matemática representable de forma accesible.

Un desafío correcto que no entra en la pantalla es un desafío roto. Ver [NFR](non-functional-requirements.md).

## Auditoría estadística del catálogo de desarrollo

**Implementada.** `pnpm game:variants audit` reporta por plantilla candidatos intentados, rechazos por código, duplicados por huella, problemas semánticos distintos y —cuando la interacción tiene opciones— distribución de la respuesta correcta. Los umbrales tienen razón documentada y distinguen errores bloqueantes de warnings sobre espacios finitos.

| Control | Estado |
|---|---|
| variantes aprobadas inválidas | **implementado**: exactamente 0; `check` revalida cada entrada |
| opciones duplicadas y parámetros no serializables | **implementado** como diagnósticos genéricos |
| huellas duplicadas | **implementado**: se reportan y deduplican intencionalmente |
| problemas distintos y tasa de rechazo | **implementado** por plantilla |
| posición y diversidad de respuesta correcta | **implementado** donde la interacción permite medirlas |
| distribución por bandas `CORE / STANDARD / STRETCH` | **implementado**: perfil cognitivo, banda derivada y auditoría de composición desde STAGE-05 |
| comparabilidad estructural y propiedades del score entre runs | **implementado en forma reducida**: `pnpm game:compose` + `pnpm game:score`; calibración empírica y competencia completa pendientes |

La barrida profunda de cierre de STAGE-03 recorrió **50.013 direcciones**, aprobó **30.671 problemas semánticos distintos**, rechazó **0** y produjo **0 errores**. La de cierre de STAGE-04, ya con siete plantillas, recorrió **36.064** y aprobó **7.954** con **0 rechazos**. Los warnings de duplicación de Mural, Stand y la salida más tarde describen espacios finitos que el pipeline deduplica; no significan contenido inválido ni exigen que 10.000 direcciones produzcan 10.000 problemas únicos. El caso más nítido es `g7.bus-latest-departure`: su espacio son exactamente 360 problemas —30 pares duración/demora × 4 horas de entrada × 3 márgenes—, los aprueba a los 360 y el 96 % de duplicados es la consecuencia aritmética de agotarlo. La evidencia canónica está en el [roadmap](../06-delivery/implementation-sequence.md#stage-03-generación-validación-y-catálogo-de-variantes) y en [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md).

### Catálogo de 1.º — `grade-1-dev-1`

Construido en STAGE-08 / Phase 1 con la misma política de build que 7.º (hasta
400 candidatos y 24 aprobaciones generadas por plantilla). Las siete plantillas
de 1.º intentaron 250 direcciones, aprobaron 174, rechazaron 69 y deduplicaron 7
—cada una, el candidato igual a su referencia autorada—. Los rechazos son gates de
autoría: repartos parejos que ya eran óptimos, estilos que aparecían con un solo
nivel de resultado, aulas donde apilar en orden bastaba. `check` revalida cada
entrada; el desglose por plantilla está en el
[diseño de 1.º](../01-game-design/grade-1-template-design.md#implementación-runtime-phase-1).

### Estrategia ciega — R, K y S

**Implementada** en la [remediación matemática](mathematics-remediation-implementation.md).
Una variante puede ser correcta y el catálogo, contestable sin mirar los números.
`tests/integration/blind-strategy-audit.test.ts` recorre el catálogo vigente de
carrera completa y, en cada Template cuyo espacio de respuestas es finito
—tarjetas, líneas de tiempo, clasificaciones de hasta 50.000 respuestas y
entradas numéricas de hasta 5000 valores—, evalúa **con el evaluador real** todas
las respuestas de todas las variantes:

- **R**: lo que rinde contestar al azar;
- **K**: lo que rinde repetir la mejor respuesta constante en todo el catálogo,
  por identificador o, si los identificadores cambian, por posición;
- **S**: la mayor proporción de variantes que comparten la misma respuesta
  óptima;
- los niveles alcanzables por variante y si la postura pública cambia la calidad
  matemática, que debe ser nunca.

Los techos son por Template y los fija la
[especificación de remediación](mathematics-remediation-spec.md#3-auditoría-permanente-de-estrategia-ciega-wp-audit);
no hay un umbral universal (D-S08-100). `pnpm game:blind-audit` imprime la tabla
completa, y `--keys` las respuestas que logran K y S. Es medición, no oráculo.

**Distribución por dirección.** Cuando un criterio es sobre el catálogo —cada
opción óptima en al menos tres variantes, ninguna clave en más del 35 %—, filtrar
después de aprobar es frágil. `generatedSource` acepta un gate por dirección,
`addressGates(params, index)`: la dirección fija un **papel** —qué opción es la
óptima, qué vector de verdad, qué forma—, el generador busca de forma determinista
parámetros que lo jueguen y el gate lo comprueba. Lo usan el colectivo, la
encuesta y su Repaso, la tabla del Intercurso y la muestra final.

**Gate de balance del mural.** El mural no cambió de generador: un validador de
catálogo alterna por dirección la lata óptima, 2 L o 4 L, y deja el reparto entre
el 45 % y el 55 % en todo catálogo que lo contiene (`grade-7-dev-6` en adelante).
Sus diagnósticos empiezan con «balance del catálogo» y los tests de propiedad del
generador los distinguen de un problema matemático.

Los umbrales son **heurísticas de revisión, no constantes universales**. Su función es levantar la mano; la aprobación sigue requiriendo que cada variante pase sus validaciones y que la integridad del artefacto sea reproducible.

> **Punto ciego conocido (MAT-RA-006, D-S08-120).** El alcance de esta auditoría son
> tres motores de interacción, así que las **22** Templates de construcción —el 52 %
> del catálogo— quedan fuera y se imprimen como «no enumerable». Para las siete de
> `quantity-builder` eso es **falso**: su espacio de vectores constantes tiene entre
> 125 y 1573 elementos y se recorre entero en segundos. La
> [re-auditoría independiente](independent-mathematics-reaudit.md) lo recorrió y
> encontró ahí dos respuestas constantes de `K 95,83` y `K 92,80` en Templates
> puntuables. Extender el alcance es la pregunta abierta 69.

## Auditoría Monte Carlo del armado de runs

**Implementada en forma reducida.** `pnpm game:compose` audita composición y `pnpm game:score` cruza planes con perfiles sintéticos; `--compare` mantiene constantes las runs al mover las calibraciones candidatas. La auditoría completa sobre catálogo de feria, policy aprobada y operación real sigue futura.

Pregunta que la auditoría tiene que poder responder: **¿cuánta varianza del score explica el sorteo de variantes, y no la habilidad?** Si el calendario explica una porción material, el equiparado por presupuesto de dificultad es débil y hay que corregirlo antes de la feria, no después.

Ver [dificultad y jugabilidad universal](../01-game-design/difficulty-and-playability.md) y [auditoría de equidad competitiva](competition-fairness-audit.md).

## Calibración posterior a la feria

Con datos reales se pueden estimar tasas de éxito, resultado parcial y tiempo por plantilla. Esos datos alimentan **versiones futuras**. No redefinen un score oficial ya otorgado, salvo que exista una política de regrade declarada por el evento. Ver [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).

## Reproducibilidad y casos golden

El catálogo ya existe y usa direcciones semánticas, no posiciones ni seeds guardados como contenido. `pnpm game:variants check` lo reconstruye, compara el artefacto byte a byte, recalcula huellas y revalida sus entradas; los tests materializan una misma dirección en runs y slots distintos. Los golden replays siguen protegiendo el protocolo completo del motor.

Las bandas y sus casos estructurales existen. Lo futuro es su calibración docente/empírica y el catálogo oficial congelado con el que se vaya a competir.

Regla que ya está escrita y sigue valiendo: no crear goldens que congelen decisiones todavía abiertas.
