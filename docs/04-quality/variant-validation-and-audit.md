# Validación y auditoría de variantes

**Estado: mixto.** Los invariantes por desafío son **implementados y vigentes**. El contrato transversal de validador, el catálogo desplegado y la auditoría estadística agregada son **TARGET / RECOMENDADOS**.

[Validación de contenido](content-validation.md) describe el pipeline vigente de un desafío. Este documento describe lo que hace falta agregar cuando las variantes decidan premios: no alcanza con que cada desafío se valide a sí mismo, hace falta poder afirmar algo sobre **el conjunto desplegado**.

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

Los primeros ocho ya son la práctica del motor: cada desafío verifica su instancia generada y los property tests recorren miles de seeds. Los últimos cuatro son el agregado que pide el catálogo.

## Invariantes de legibilidad

Difíciles de automatizar por completo, imprescindibles igual:

- sin complejidad decimal accidental fuera de la banda buscada;
- sin valores absurdos para un contexto escolar;
- texto de opción dentro del límite práctico de 360 px;
- notación matemática representable de forma accesible.

Un desafío correcto que no entra en la pantalla es un desafío roto. Ver [NFR](non-functional-requirements.md).

## Auditoría estadística del catálogo

**TARGET.** Por plantilla y por catálogo, generar un reporte legible por máquina:

| Parámetro | Umbral de aceptación sugerido |
|---|---|
| variantes desplegadas inválidas | exactamente 0 |
| opciones duplicadas | exactamente 0 |
| fingerprints duplicados | tasa declarada y revisada |
| distribución por banda de dificultad | coincide con el objetivo declarado |
| posición de la opción correcta | sin sesgo severo; investigar si lo hay |
| distribución de parámetros numéricos | sin acumulación en los bordes |
| máximo teórico de score por plantilla | sin diferencias inesperadas entre plantillas |
| variantes cuya aritmética se sale de la banda | rechazar o reclasificar |

Los umbrales son **heurísticas de revisión, no constantes universales**. Su función es levantar la mano, no aprobar sola.

La validación procedural vigente ya corre N seeds por template y verifica que la opción correcta no caiga siempre en la misma posición; ver [validación de contenido](content-validation.md). Lo que falta es agregarlo por catálogo y versionarlo.

## Auditoría Monte Carlo del armado de runs

**TARGET.** Simular muchos calendarios de run contra perfiles de jugador sintéticos y comparar el score esperado por calendario.

Pregunta que la auditoría tiene que poder responder: **¿cuánta varianza del score explica el sorteo de variantes, y no la habilidad?** Si el calendario explica una porción material, el equiparado por presupuesto de dificultad es débil y hay que corregirlo antes de la feria, no después.

Ver [dificultad y jugabilidad universal](../01-game-design/difficulty-and-playability.md) y [auditoría de equidad competitiva](competition-fairness-audit.md).

## Calibración posterior a la feria

Con datos reales se pueden estimar tasas de éxito, resultado parcial y tiempo por plantilla. Esos datos alimentan **versiones futuras**. No redefinen un score oficial ya otorgado, salvo que exista una política de regrade declarada por el evento. Ver [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).

## Golden seeds

Se conservan seeds conocidas por plantilla y por banda —incluyendo casos borde— y se reproducen en CI. Los golden replays vigentes ya cumplen ese rol para el motor; el agregado es mantener golden **por variante desplegada** cuando exista catálogo.

Regla que ya está escrita y sigue valiendo: no crear goldens que congelen decisiones todavía abiertas.
