# Preguntas abiertas

Estas decisiones requieren evidencia de prototipo, playtest, implementación u operación. No deben resolverse por conveniencia dentro del código. Las preguntas 1–18 son hipótesis de experimentación: no bloquean el primer vertical slice y varias sólo pueden cerrarse mediante ese prototipo. Las preguntas 19–33 registran ambigüedades de alcance o contrato; cada una declara el gate concreto que debe cerrarla, sin bloquear trabajo anterior que no dependa de esa decisión.

## Producto

1. ~~¿Run objetivo de 4, 5 o 7 minutos?~~ **Cerrada por TG1-12:** la carrera completa apunta a aproximadamente **8–10 minutos**. Queda abierta la calibración empírica de pacing, no el objetivo.
2. Cantidad Normal/Fair v1 cerrada en nueve beats y [envolvente](../01-game-design/full-career-content-matrix.md#envolvente-normalfair-v1). Falta validar copy, transiciones y Repasos contra mediana 8–10 min / p75 ≤12 min. *Gate: carrera real y walkthroughs, no reabrir cantidad por conveniencia.*
3. ¿El nickname se pide antes o después de la primera run en modo libre?
4. ¿Qué tan visible debe ser el score durante la carrera?

## Dificultad

5. Dificultad fija para Fair v1 bajo edición común. Selección manual/adaptativa/híbrida abierta sólo para modos no oficiales. *Gate: experiencia de esos modos; ADR-025 preserva separación.*
6. ¿Cómo mapear 12–17 sin preguntar edad exacta?
7. ¿Se permite calculadora en ranking de feria?

## Narrativa

8. ¿Stats visibles exactas o tendencias cualitativas?
9. ¿Cuántos callbacks son necesarios para percibir continuidad dentro del modelo braided-linear de intensidad media ya aceptado?
10. ¿Qué tono dentro de la dirección aceptada —realismo escolar, humor frecuente y absurdo ocasional— valida mejor el público real?

## Ranking

11. ~~¿Mejor run o todas?~~ **Cerrada por TG1/Product Pass:** mejor resultado verificado por participante, no suma; identidad/persistencia STAGE-09.
12. ~~¿Seed común o pool equivalente?~~ **Cerrada v1:** Competition Seed compartida server-issued por edición; mismos plan/variantes/dificultad fija/estado raro en reintentos. Practice procedural no oficial. [Modo feria](../05-operations/fair-mode-and-competition-freeze.md).
13. ~~¿Tiempo como criterio terciario?~~ **Supersedida/cerrada:** FairScore → Prestige → puesto compartido; sin velocidad ni criterio oculto.

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

24. ¿Qué aprobación/freeze y evidencia empírica requiere la política oficial? Mecanismo/redondeo implementados en ADR-023; se conserva `fair-score-dev-2` 85/10/5, no oficial. Velocidad/bonus temporales excluidos de v1. *Gate: STAGE-09/TG2 y FREEZE.*
25. ~~¿Qué algoritmo PRNG y contrato de consumo/versionado se adopta para la primera implementación?~~ **Cerrada por [ADR-012](../03-architecture/adr/ADR-012-seeded-prng-and-substreams.md)**: `pure-rand` `xoroshiro128plus` fijado, substreams derivados por namespace y golden replays en `tests/unit/engine-golden.test.ts`.
26. ¿Durante cuánto tiempo y mediante qué artefactos se conservan engines, rulesets y contenido compatibles para reanudar o reproducir runs históricas? *Gate: prometer compatibilidad de resume/replay entre releases.*
27. ~~¿Señal temporal para puntuar/desempatar?~~ **Supersedida v1:** tiempo sólo diagnóstico UX/telemetría. El cierre operativo del servidor no es velocidad de juego.

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
35. ¿Qué evento de 7.º introduce Aura? **Respondida para la Teacher Demo Candidate**: el **acto del 25 de Mayo**, autorado como `g7.may-25-act` y tercer evento del arco amplio. Es el único momento de ese arco que ocurre en público, que es la condición que Aura pide: la mueve lo memorable, no lo correcto. El acto entrega entre `+1000` y `−300` según cómo salga la coreografía, así que la demo establece la dimensión en positivo o negativo. Una partida normal compuesta sólo la establece si su `RunPlan` selecciona el acto; Aura no es obligatoria por año. Ver [la especificación del evento](../01-game-design/challenge-catalog.md) y el [slice de 7.º](../06-delivery/vertical-slice-grade-7.md).
36. El epílogo v1 cierra una síntesis autorada de 2–4 líneas, sin reducir la carrera a un tipo ni usar errores como identidad. El slice actual conserva sus perfiles históricos; los títulos casuales del handoff visual no los reemplazan. Falta copy concreto y adaptación de la UI al epílogo canónico. *Gate: autoría/implementación del cierre STAGE-08.*
37. ¿Cuánto tiempo se sostiene el rechazo de snapshots v1 antes de poder borrar el camino? Hoy un checkpoint del modelo de estadísticas viejo se descarta y se ofrece partida nueva. *Gate: prometer compatibilidad de resume entre releases; se cruza con la pregunta 26.*

## Teacher Gate — decisiones del Departamento de Matemática

Incorporadas desde el [Project Blueprint v0.2](blueprint-v0.2-integration.md). Se cierran sólo con la autoridad indicada, nunca por conveniencia del código. Teacher Gate 1 ya resolvió o acotó varias; la trazabilidad vive en el [registro de decisiones](decision-register.md).

38. ~~¿Deben Equipo y Aura participar, qué ponderación usar y cómo tratar oportunidades ausentes?~~ **Cerrada en dirección por TG1-04/TG1-05/TG1-06/TG1-07:** las tres participan, el candidato post-Gate es `fair-score-dev-2` 85/10/5 y se normalizan sólo los pesos activos. Sigue **OPEN** su oficialización/freeze en la pregunta 24 y la cobertura independiente de contenido en STAGE-08.
39. ~~¿Qué valor de calidad matemática corresponde a cada resultado?~~ **Cerrada por TG1-09:** `1,00 / 0,75 / 0,40 / 0,10` sobre `optimal / efficient / functional / invalid`; una métrica continua honesta, como F1, no se aplana a cuatro cajas.
40. ~~¿Los intentos en la feria son ilimitados o limitados a N?~~ **Cerrada en producto por TG1-10:** ilimitados y se conserva el mejor resultado verificado. Emisión autoritativa, identidad y persistencia siguen en STAGE-09; el jugador no elige seed.
41. ~~¿Tercer criterio?~~ **Cerrada v1:** puesto compartido. Premios comunes o desafío separado se anuncian por el organizador, sin agregar criterio al ranking. *Gate operativo: antes de repartir premios.*
42. ~~¿El acto del 25 de Mayo entra a producción?~~ **Cerrada por TG1-13:** `KEEP` pedagógico; su narrativa debe enriquecerse y diversificarse en STAGE-08. No se agregó Aura competitiva porque hoy no existe una evidencia independiente del F1 matemático.
43. ~~¿Cuál es la duración objetivo real?~~ **Cerrada por TG1-12:** 8–10 minutos para la carrera completa, como target UX sin timer ni score de velocidad.
44. **Narrowed por TG1-03/TG1-08:** las bandas `CORE / STANDARD / STRETCH` y el principio de una recompensa competitiva pequeña están aceptados. Sigue **OPEN** la calibración exacta de factores; 1,00/1,08/1,15 permanece candidata y separada de los costos de scheduling 1,00/1,50/2,10.
45. ¿Qué desafíos deben ofrecer fórmula, calculadora o material de referencia, y esa disponibilidad cambia en modo competitivo? *Gate: Teacher Gate 1.* Se cruza con la pregunta 7.

## Contenido y producto, sin gate docente inmediato

46. Product Pass conserva las 25 Templates y distingue formas semánticas de números. Los [targets de autoría](../01-game-design/content-authoring-guide.md#profundidad-de-variantes) son objetivos, no límites. Falta catálogo real. *Gate: implementación incremental, no otro pase de prediseño.*

### 46-bis. Catálogo ejecutable pendiente, prediseño cerrado

7.º conserva sus ocho Templates —siete ordinarias y un Repaso—. 1.º ya tiene sus
cinco Templates y dos Repasos en el catálogo de desarrollo `grade-1-dev-1`; las
20 de 2.º–5.º, sus rutas y sus `none` siguen aprobados sólo en diseño. No
añadir/reemplazar familias salvo contradicción técnica, invalidez matemática o
evidencia docente/de acceso real. Variantes aprobadas se producen contra
targets, no se confunden con beats por carrera.

*Gate: autoría/validación incremental.* Ver [matriz](../01-game-design/full-career-content-matrix.md).

47. ¿Qué pesos/hechos estratégicos expresan Estilo en cada Template? Ya se excluye inferir identidad de Math sola, azar o INVALID; nunca aporta FairScore/Prestige. 1.º implementa rasgos candidatos (`grade-1-strategy-evidence@1-candidate`) con un gate que impide atar un estilo a un nivel de resultado; los pesos siguen abiertos. *Gate: autoría/freeze de perfiles.*
48. ¿Qué acento visual mínimo distingue cada año? Es una decisión del sistema de diseño, prevista para v0.4 y **explícitamente diferida**. No la resuelve un documento de producto. *Gate: alcance de la v0.4 del sistema de diseño.*
49. ¿Se produce el pack raster de ocho imágenes o el producto sale confirmando que la UI sola alcanza? Todas las pantallas corren hoy con cero imágenes. *Gate: alcance de la v0.3 del sistema de diseño.*
50. ¿Cuánto tiempo se conservan action logs, ranking público y datos del evento después de la feria, y qué se archiva o anonimiza? *Gate: persistir datos reales de participantes.* Se cruza con la pregunta 31.
51. ~~¿Tiempo activo verificable para desempate?~~ **Supersedida v1**, igual que 27: sin ranking temporal.
52. ¿Qué nombres/hechos exactos tendrá cada logro? Tracks, slots y exclusiones cerrados en [Prestige](../01-game-design/rare-events-and-prestige.md); falta contenido concreto. *Gate: autoría STAGE-08 y auditoría/freeze STAGE-09; no bloquea Phase 0.*
53. ~~¿Vocabulario de recuperación?~~ **Cerrada:** label **REPASO**; recovery/review internos; previa como historia. Copy contextual sigue revisión editorial/docente sin reabrir label.
54. ~~¿INVALID o FUNCTIONAL dispara?~~ **Cerrada v1:** sólo INVALID de fuentes recovery-capable; `none` explícito válido. FUNCTIONAL no dispara. Policy ejecutable no oficializada por este cierre.

La **capacidad** no forma parte de esta pregunta abierta: bajo [ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md), una etapa juega como máximo un repaso estructural. Cambiar ese límite requeriría reconsiderar explícitamente el ADR y repetir sus pruebas de boundedness, pacing y egreso; no alcanza con calibrar una policy.

55. ~~¿La semántica multiobligación se sostiene con contenido real?~~ **Cerrada el 2026-09-14:** el [audit post-G1](../04-quality/post-grade-1-scalability-audit.md#resultado-de-la-ejecución-2026-09-14) forzó `classroom-layout INVALID + rehearsal-schedule INVALID` con un Repaso máximo y dio `PASS WITH REQUIRED HARDENING — RESOLVED`: uno se practica, el resto se debriefea, todas cierran, sin recursión ni efecto en FairScore, y replay, reanudación y servidor reproducen la distinción. `reviewPriority` sigue recomendación editorial.
56. ~~¿Cap/tracks/presupuesto Prestige?~~ **Cerrada v1:** 40 Career Arc/40 Special/20 Rare, máximo 100; STYLE 25 y 25×4 supersedidos. Autoría/validación de evidencia y slots pendientes.
57. ~~¿Defaults de rareza/densidad?~~ **Calibración v1 documentada:** 15 % / 7,5 % / 2 %, máximo 2 raros, máximo 1 puntuable y 1 VERY_RARE. Ajustable por evidencia mediante policy versionada. *Gate residual: simulación/telemetría; no freeze.*
58. **Frontera resuelta en [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md):** slots/techos comunes de edición, reemplazo compatible, evidencia independiente y replay. Falta implementar/validar oportunidades concretas. *Gate: autoría Prestige y STAGE-09; no bloqueo de prediseño.*
59. **Diseño cerrado:** checkpoint #2 y Product Pass conservan placement/pacing/evaluación/señales/mappings de las 25 Templates. Parámetros/evaluadores se producen bajo la guía; duración real pendiente en 2. Siguiente: Phase 1 G1.
60. **DEFERRED:** Aura rara adicional de 1.º no integra v1 ni bloquea G1; Aura ordinaria ausente. Sólo revisar ante situación legítima con evidencia independiente, sin cuotas.
61. ¿La escuela adquiere una marca ficticia/paródica y el jugador una personalización liviana más allá del nickname? Ambas son stretch, no core STAGE-08. *Gate: disponibilidad de alcance y revisión de portabilidad/privacidad.*
62. ~~¿Algoritmo de Narrative Salience?~~ **Cerrada v1:** 3–5 recuerdos por segmentos, prioridades autoradas/ID; [narrativa](../01-game-design/narrative-system.md#narrative-salience). Implementación futura ADR-025, no otro pase de epílogo.

La [integración](full-career-product-audit-integration.md) registra supersesiones.
Permanecen pendientes pacing empírico, catálogo/logros ejecutables, calibración,
freeze y operación/privacidad. Project max 2 es LOCKED v1; contratos futuros en
ADR-025 y STOP post-G1 preservado. No se declara runtime nuevo.

## Gobernanza matemática provisional

Abiertas por la [adjudicación del Departamento de Matemática provisional](../04-quality/mathematics-department-ai-adjudication.md) y por el diferimiento de la revisión humana (D-S08-095). Las 63–65 no bloquean la remediación; las 66 y 67 son los puntos de decisión de sus dos STOP y bloquean el re-audit.

63. ¿Cómo se ejecuta la revisión del Departamento de Matemática humano diferida a Final Delivery / Pre-Release Acceptance respecto de Teacher Gate 2: es parte de TG2, lo precede o es un gate propio? *Gate: planificar la aceptación de pre-release.* Mientras tanto, ningún documento la da por hecha ni la fusiona con TG2.
64. ¿Los sign-offs manuales explícitos que la [guía de autoría](../01-game-design/content-authoring-guide.md#profundidad-de-variantes) exige para doce Templates —incluida la rueda del Día del Estudiante, que hoy figura como gate humano de STAGE-08— se ejecutan también en la revisión humana diferida, o conservan su momento actual? *Gate: cierre de STAGE-08.* La decisión D-S08-095 no los difirió.
65. Las banderas de riesgo aceptado de la adjudicación —cobertura de probabilidad y funciones, memorización dentro de una edición Fair, piso de la opción segura del mural y de la escalera asimétrica— requieren juicio humano. *Gate: revisión humana diferida.* Ver [sección N](../04-quality/mathematics-department-ai-adjudication.md#n-riesgos-aceptados-y-banderas-para-la-revisión-humana-final).
66. **STOP de RS-MAT-008** (`y5.stage-screen`): ¿se exime a la pantalla del acto del witness de tres niveles no inválidos **sólo** en las variantes donde ningún recorte es válido —la imagen entera óptima que el punto 4 autoriza—, o se conserva la regla 2.6 y se reescriben los puntos 7, 8 y 9 y los techos K ≤ 70 · S ≤ 40 %? La primera es coherente con D-S08-099, pero su factibilidad no está medida. *Gate: bloquea el Independent Mathematics Re-Audit.* Ver [STOP 1](../04-quality/mathematics-remediation-implementation.md#stop-1-rs-mat-008-y5stage-screen) y D-S08-105.
67. **STOP de RS-NEW-001, criterio 3** (`y5.course-project-final`): ¿el criterio «mantener, repartir y recortar entre los planes óptimos» se reformula sobre planes válidos —donde ya se cumple—, o se autoriza un cambio de escalera que el contrato hoy prohíbe? *Gate: bloquea el Independent Mathematics Re-Audit.* Ver [STOP 2](../04-quality/mathematics-remediation-implementation.md#stop-2-rs-new-001-criterio-3-y5course-project-final) y D-S08-106.

## Diferidas a propósito

No son preguntas abiertas: son alcance excluido. Se listan para que nadie las reabra como deuda.

- sistema de avatar y arte de personaje;
- pipeline completo de arte de personajes;
- tema oscuro alternativo completo;
- arquitectura PWA/offline más allá de lo que exija la confiabilidad en la feria;
- grafo social y cuentas complejas;
- chat;
- monetización.
