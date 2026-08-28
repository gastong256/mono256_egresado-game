# Preguntas abiertas

Estas decisiones requieren evidencia de prototipo, playtest, implementación u operación. No deben resolverse por conveniencia dentro del código. Las preguntas 1–18 son hipótesis de experimentación: no bloquean el primer vertical slice y varias sólo pueden cerrarse mediante ese prototipo. Las preguntas 19–33 registran ambigüedades de alcance o contrato; cada una declara el gate concreto que debe cerrarla, sin bloquear trabajo anterior que no dependa de esa decisión.

## Producto

1. ¿Run objetivo de 4, 5 o 7 minutos?
2. ¿Cuántos eventos por año mantienen ritmo sin sentirse repetitivos?
3. ¿El nickname se pide antes o después de la primera run en modo libre?
4. ¿Qué tan visible debe ser el score durante la carrera?

## Dificultad

5. ¿Selección manual, adaptativa o híbrida?
6. ¿Cómo mapear 12–17 sin preguntar edad exacta?
7. ¿Se permite calculadora en ranking de feria?

## Narrativa

8. ¿Stats visibles exactas o tendencias cualitativas?
9. ¿Cuántos callbacks son necesarios para percibir continuidad?
10. ¿Qué tono humorístico valida mejor el público real?

## Ranking

11. ¿Mejor run por nickname/session o todas? ¿El default de operaciones es sólo una propuesta de playtest?
12. ¿Seed idéntica para todos o pool equivalente?
13. ¿Tiempo debe servir de desempate? ¿La sugerencia de usarlo como último criterio debe aceptarse o descartarse?

## Feria

14. ¿Habrá red escolar confiable o datos móviles?
15. ¿Cuántos participantes simultáneos se esperan?
16. ¿Existe una pantalla/proyector permanente?

## Contenido

17. ¿Qué currículo/institución concreta debe revisar progresión matemática?
18. ¿Qué escenarios cotidianos resultan más cercanos sin sesgo socioeconómico?

## Alcance y contratos

19. Las ocho plantillas transversales recomendadas por el catálogo, que abarcan etapas fuera de 7.º + 1.º, ¿son un banco de validación de mecánicas separado o deben integrar el contenido jugable de MVP 0/P0? *Gate: congelar el set y los criterios de aceptación de contenido P0.*
20. Cuando un documento dice “MVP” sin número, ¿se refiere a MVP 0, MVP 1, MVP Feria o a toda la familia previa a post-MVP? *Gate: aceptar alcance de una tarea o release que use esa etiqueta sin calificar.*
21. Cuando el nickname es opcional y se omite, ¿qué muestra la tarjeta final y puede esa run participar en un ranking oficial? *Gate: implementar la tarjeta final o elegibilidad de ranking para ese modo.*
22. ¿Cuál es el contrato canónico de creación/replay de una run —incluidos dificultad, configuración de evento, sesión/token, mode, seed, versiones y acciones— y cómo se persiste esa configuración? *Gate: implementar creación, persistencia o finish autoritativo de runs online.*
23. ¿Cuál es el schema ejecutable `challenge.v1` y qué campos obligatorios representan unidades, competencias, soluciones, edge cases y objetivos con todos sus inputs (por ejemplo, costos)? *Gate: aceptar contenido ejecutable P0 o su validador; el ejemplo actual sigue siendo ilustrativo.*

## Engine y scoring

24. ¿Cuál es la fórmula y política de redondeo final del score oficial, incluidos calidad, dificultad, velocidad, rachas y penalizaciones? *Gate: congelar el ruleset de score oficial.*
25. ~~¿Qué algoritmo PRNG y contrato de consumo/versionado se adopta para la primera implementación?~~ **Cerrada por [ADR-012](../03-architecture/adr/ADR-012-seeded-prng-and-substreams.md)**: `pure-rand` `xoroshiro128plus` fijado, substreams derivados por namespace y golden replays en `tests/unit/engine-golden.test.ts`.
26. ¿Durante cuánto tiempo y mediante qué artefactos se conservan engines, rulesets y contenido compatibles para reanudar o reproducir runs históricas? *Gate: prometer compatibilidad de resume/replay entre releases.*
27. Si el tiempo participa del score o desempate, ¿qué señales y límites autoritativos usa el servidor sin confiar en `client_elapsed_ms`? *Gate: usar velocidad en score o ranking oficial.*

## Operación, seguridad y privacidad

28. ¿Cuánto persisten checkpoints y acciones `pending_sync` después de cerrar la sesión, cuándo expiran y cómo se comunican conflictos o rechazos terminales? *Gate: aceptar persistencia y UX offline de MVP Feria.*
29. ¿Cuál es el mecanismo mínimo de moderación y “reset” requerido para MVP Feria, y qué queda reservado para el Admin UI post-MVP? *Gate: cerrar tooling y runbook operativo de MVP Feria.*
30. ¿Qué health checks, ownership, backup/restore, RPO/RTO y rehearsal son obligatorios antes de una feria? *Gate: aprobar staging y rehearsal de feria.*
31. ¿Qué política legal y de retención/eliminación aplica a runs, actions, pseudónimos y auditoría en la institución anfitriona? *Gate: persistir datos reales de participantes en una feria.*

## Producto y proveedores

32. ¿Cuál es el diseño visual definitivo validado para el público objetivo? *Gate: declarar definitivo el sistema visual de producción; no bloquea prototipos.* **Parcialmente respondida por [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md)**: la identidad papel v0.2 está implementada y cerrada del lado del diseño; falta la validación con el público objetivo, que es lo que este ítem sigue pidiendo.
33. ¿Qué proveedor, si alguno, se adopta para product analytics y error tracking, con qué datos y retención? *Gate: agregar un proveedor o enviarle telemetría real.*

## Diseño y modelo de jugador

34. ¿La interacción de presupuesto muestra un total corriente mientras el jugador arma la compra? El handoff de diseño lo especifica; la implementación no lo muestra porque calcular el total *es* el desafío, y mostrarlo lo convertiría en comparar dos números que sacó otro. El handoff marca la interacción como «especificada, no construida» y la difiere a v0.3, así que la diferencia es una decisión de gameplay pendiente y no una deuda de implementación. *Gate: construir BudgetInteraction de verdad.*
35. ¿Qué evento de 7.º introduce Aura? **Respondida**: el **acto del 25 de Mayo**, autorado como `g7.may-25-act` y tercer evento del año. Es el único momento del arco que ocurre en público, que es la condición que Aura pide: la mueve lo memorable, no lo correcto. El acto entrega entre `+1000` y `−300` según cómo salga la coreografía, así que la dimensión se establece —en positivo o en negativo— en toda partida normal. Ver [la especificación del evento](../01-game-design/challenge-catalog.md) y el [slice de 7.º](../06-delivery/vertical-slice-grade-7.md).
36. ¿Los arquetipos de cierre son los ocho perfiles del GDD o los que nombra el handoff de diseño? La pantalla usa los ocho del GDD —fuente autoritativa de game design—; el handoff nombra al pasar «El Rey del Último Minuto», «El Vago Eficiente» y «La Leyenda del Colegio», que no están en esa lista. Adoptarlos sería un cambio de game design, no de presentación. *Gate: congelar el set de perfiles de egreso.*
37. ¿Cuánto tiempo se sostiene el rechazo de snapshots v1 antes de poder borrar el camino? Hoy un checkpoint del modelo de estadísticas viejo se descarta y se ofrece partida nueva. *Gate: prometer compatibilidad de resume entre releases; se cruza con la pregunta 26.*

## Teacher Gate — decisiones del Departamento de Matemática

Incorporadas desde el [Project Blueprint v0.2](blueprint-v0.2-integration.md). **Ninguna se cierra desde el código.** Su gate es una sesión con los docentes; la forma de esa sesión está en [gates docentes](../06-delivery/teacher-gates.md), y lo que se cierre se anota en el [registro de decisiones](decision-register.md).

38. ¿Cuáles son los coeficientes y topes exactos del score competitivo? La ponderación candidata es `0,80` matemática / `0,15` equipo / `0,05` Aura, y **es un candidato, no una decisión**. *Gate: Teacher Gate 1; se cruza con la pregunta 24, que cubre el score por evento.*
39. ¿Qué valor de calidad matemática corresponde a cada resultado? La calibración candidata es `1,00 / 0,75 / 0,40 / 0,10` sobre `optimal / efficient / functional / invalid`. *Gate: Teacher Gate 1.*
40. ¿Los intentos en la feria son ilimitados o limitados a N? La recomendación es ilimitados con personal best; la decisión es del evento. *Gate: Teacher Gate 1; configuración del evento antes del congelamiento.* Se cruza con la pregunta 11.
41. ¿Qué pasa ante un empate exacto en el ranking: puesto compartido, premio compartido o desempate anunciado? Un identificador interno **no** puede decidir un premio en silencio. *Gate: aprobación del organizador antes de repartir premios.* Se cruza con la pregunta 13.
42. ¿El acto del 25 de Mayo entra a producción como desafío de 7.º o queda como ejemplar de diseño? Está implementado y jugable; lo que falta es la aprobación de contenido. *Gate: Teacher Gate 1.*
43. ¿Cuál es la duración objetivo real de una run completa, y de la demo de 7.º? *Gate: Teacher Gate 1.* Se cruza con la pregunta 1.
44. ¿Cómo se calibran las bandas `CORE / STANDARD / STRETCH` y sus costos de scheduling frente a los multiplicadores de score? *Gate: Teacher Gate 1; auditoría de equidad antes del congelamiento.*
45. ¿Qué desafíos deben ofrecer fórmula, calculadora o material de referencia, y esa disponibilidad cambia en modo competitivo? *Gate: Teacher Gate 1.* Se cruza con la pregunta 7.

## Contenido y producto, sin gate docente inmediato

46. ¿Cuántas familias de escenario y cuántas plantillas por año sostienen la variedad sin romper la duración objetivo? El rango de planificación es de seis a ocho situaciones significativas por año, y **es planificación, no requisito**. *Gate: congelar la matriz de contenido de 1.º–5.º.*

### 46-bis. El inventario final de escenarios sigue ABIERTO

El modelo de contenido de [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md) construyó el **mecanismo** para tener familias, plantillas y variantes. **No decidió el inventario.** Siguen sin resolver, todos juntos:

- cuántas familias de escenario tiene Egresado y cuáles son;
- cuántas plantillas tiene cada familia;
- cuántas variantes tiene cada plantilla;
- en qué año va cada cosa;
- si cada uno de los seis escenarios actuales se mantiene, se mueve, se rehace, se fusiona, se reemplaza o se retira.

Los seis desafíos actuales son **contenido vigente y sondas de arquitectura**, no el inventario completo del juego, y su ubicación en 7.º es consecuencia del primer slice vertical, no una decisión de producto. Las familias declaradas hoy —`bus`, `mural`, `notebook`, `group-project`, `school-fair`, `may-25`— son **CANDIDATAS**, no un catálogo cerrado.

*Gate: la auditoría de ubicación de contenido, posterior al Teacher Gate 1 y a la matriz de 1.º–5.º.* Ver [la migración del modelo de contenido](../03-architecture/content-model-migration.md).
47. ¿Cuáles son los pesos exactos con los que cada resultado empuja Estilo? Hoy son valores de desarrollo dentro del presupuesto declarado por el motor. *Gate: congelar el ruleset de perfiles.* Se cruza con la pregunta 24.
48. ¿Qué acento visual mínimo distingue cada año? Es una decisión del sistema de diseño, prevista para v0.4 y **explícitamente diferida**. No la resuelve un documento de producto. *Gate: alcance de la v0.4 del sistema de diseño.*
49. ¿Se produce el pack raster de ocho imágenes o el producto sale confirmando que la UI sola alcanza? Todas las pantallas corren hoy con cero imágenes. *Gate: alcance de la v0.3 del sistema de diseño.*
50. ¿Cuánto tiempo se conservan action logs, ranking público y datos del evento después de la feria, y qué se archiva o anonimiza? *Gate: persistir datos reales de participantes.* Se cruza con la pregunta 31.
51. ¿Qué señal de tiempo activo puede verificar el servidor si el tiempo participa del desempate? *Gate: usar tiempo en el ranking oficial.* Es la pregunta 27 vista desde el ranking competitivo.

## Diferidas a propósito

No son preguntas abiertas: son alcance excluido. Se listan para que nadie las reabra como deuda.

- sistema de avatar y arte de personaje;
- pipeline completo de arte de personajes;
- tema oscuro alternativo completo;
- arquitectura PWA/offline más allá de lo que exija la confiabilidad en la feria;
- grafo social y cuentas complejas;
- chat;
- monetización.
