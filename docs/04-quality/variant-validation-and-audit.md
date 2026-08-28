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
| distribución por bandas `CORE / STANDARD / STRETCH` | **TARGET** — STAGE-05 |
| comparabilidad de dificultad y score entre runs | **TARGET** — STAGE-05/STAGE-06 |

La barrida profunda de cierre de STAGE-03 recorrió **50.013 direcciones**, aprobó **30.671 problemas semánticos distintos**, rechazó **0** y produjo **0 errores**. Los warnings de duplicación de Mural y Stand describen espacios finitos que el pipeline deduplica; no significan contenido inválido ni exigen que 10.000 direcciones produzcan 10.000 problemas únicos. La evidencia canónica está en el [roadmap](../06-delivery/implementation-sequence.md#stage-03-generación-validación-y-catálogo-de-variantes) y en [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md).

Los umbrales son **heurísticas de revisión, no constantes universales**. Su función es levantar la mano; la aprobación sigue requiriendo que cada variante pase sus validaciones y que la integridad del artefacto sea reproducible.

## Auditoría Monte Carlo del armado de runs

**TARGET.** Simular muchos calendarios de run contra perfiles de jugador sintéticos y comparar el score esperado por calendario.

Pregunta que la auditoría tiene que poder responder: **¿cuánta varianza del score explica el sorteo de variantes, y no la habilidad?** Si el calendario explica una porción material, el equiparado por presupuesto de dificultad es débil y hay que corregirlo antes de la feria, no después.

Ver [dificultad y jugabilidad universal](../01-game-design/difficulty-and-playability.md) y [auditoría de equidad competitiva](competition-fairness-audit.md).

## Calibración posterior a la feria

Con datos reales se pueden estimar tasas de éxito, resultado parcial y tiempo por plantilla. Esos datos alimentan **versiones futuras**. No redefinen un score oficial ya otorgado, salvo que exista una política de regrade declarada por el evento. Ver [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).

## Reproducibilidad y casos golden

El catálogo ya existe y usa direcciones semánticas, no posiciones ni seeds guardados como contenido. `pnpm game:variants check` lo reconstruye, compara el artefacto byte a byte, recalcula huellas y revalida sus entradas; los tests materializan una misma dirección en runs y slots distintos. Los golden replays siguen protegiendo el protocolo completo del motor.

Los casos por banda de dificultad y el catálogo oficial congelado siguen siendo futuros porque esas bandas todavía no existen.

Regla que ya está escrita y sigue valiendo: no crear goldens que congelen decisiones todavía abiertas.
