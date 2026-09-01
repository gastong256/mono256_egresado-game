# Gates docentes

**Estado: TEACHER GATE.** Este documento define qué se le pide decidir al Departamento de Matemática y cuándo. **No decide nada por ellos.** Cada ítem cerrado en una de estas sesiones se anota en el [registro de decisiones](../07-reference/decision-register.md); cada ítem que queda abierto, en [preguntas abiertas](../07-reference/open-questions.md).

Ubicación en el ciclo: [ciclo de entrega real](../00-product/real-delivery-lifecycle.md).

## Qué valida y qué no valida un gate docente

Valida: nivel matemático, terminología, corrección, ambigüedad, credibilidad del contexto, semántica de los resultados, plausibilidad de la dificultad relativa y aceptabilidad de la filosofía de competencia.

**No valida:** que un estudiante de 12 años entienda la pantalla sin ayuda, ni que quiera jugar de nuevo. Eso sigue sin evidencia hasta la feria, y no se puede presentar de otra manera.

## Marco de revisión por plantilla

Cada familia o plantilla se revisa contra ocho preguntas:

1. **Pertinencia curricular** — ¿la matemática es razonable para la etapa?
2. **Corrección** — ¿todos los caminos de solución y el feedback son válidos?
3. **Ambigüedad** — ¿hay dos interpretaciones razonables que cambien la respuesta?
4. **Contexto** — ¿la situación escolar es creíble y respetuosa?
5. **Objetivo cognitivo** — ¿la dificultad viene del razonamiento buscado o de aritmética accidental?
6. **Apoyos** — ¿debería haber fórmula, calculadora o referencia disponible?
7. **Semántica de resultado** — ¿tienen sentido las cuatro calidades para este desafío?
8. **Equidad competitiva** — ¿la banda de dificultad es plausible frente a las otras plantillas?

Con invariantes robustos, los docentes no necesitan inspeccionar cada variante desplegada, pero sí variantes representativas y de borde por plantilla y banda.

---

## Teacher Gate 1 — revisión de la demo de 7.º

### Qué se demuestra

- el recorrido completo de 7.º;
- al menos dos runs que muestren variación real, no reordenamiento de opciones;
- varios patrones de interacción;
- Promedio, Equipo, Aura y Estilo apareciendo cuando adquieren significado;
- el cierre de año;
- el desglose propuesto de score competitivo;
- cómo funcionan bandas y variantes.

### Forma de la sesión

1. El docente juega una primera run **sin explicación previa**. Se anota dónde pregunta qué hacer.
2. Vuelve a jugar y observa la variación.
3. Recién ahí se explican el modelo de carrera y la arquitectura de variantes.
4. Se muestra la propuesta de score: matemática dominante, mejor intento, velocidad sólo como desempate.
5. Se recorre la lista de decisiones abiertas y se pide decisión explícita.

No se usa la reunión para elegir tipografías, espaciados ni tokens: eso ya está cerrado por el sistema de diseño.

### Decisiones pedidas

**Matemática**
- ¿Los conceptos son apropiados para la etapa?
- ¿La terminología es correcta?
- ¿Los contextos son creíbles?
- ¿Qué desafíos necesitan fórmula, calculadora o referencia?

**Dificultad**
- ¿Las bandas CORE / STANDARD / STRETCH son razonables?
- ¿El mismo contenido elemental sigue ofreciendo desafío a un adulto?

**Competencia**
- ¿Se acepta un score dominado por la matemática?
- ¿Se acepta una contribución secundaria y acotada de Equipo y Aura?
- La política candidata renormaliza los pesos cuando el `RunPlan` no ofrece Equipo o Aura: ¿son aceptables distintos conjuntos de oportunidad, debe el compositor exigir cierta cobertura o hace falta otro modelo?
- Hoy sólo `g7.group-tasks` ofrece Equipo competitivo independiente y ninguna plantilla de producción ofrece Aura competitiva independiente: ¿deben participar esas componentes, y con qué evidencia futura?
- ¿Se acepta la recompensa competitiva candidata `1,00 / 1,08 / 1,15`, separada de los costos de scheduling que ya equiparan estructuralmente los planes?
- ¿Se acepta el mapeo candidato `1,00 / 0,75 / 0,40 / 0,10` para `optimal / efficient / functional / invalid`?
- ¿Intentos ilimitados con mejor intento, o límite?
- ¿Orden de desempate?

**Producto**
- ¿Es aceptable que toda run completada llegue al egreso, con recuperación en vez de game over?
- ¿El tono y el humor son apropiados?
- ¿Cuál es la duración objetivo de una run?
- ¿El acto del 25 de Mayo entra a producción o queda como ejemplar de diseño?

### Preguntas a registrar del docente

- ¿Qué se sintió demasiado fácil o demasiado difícil?
- ¿Qué apoyo matemático debería estar visible?
- ¿Las palabras y los contextos suenan naturales para estudiantes?
- ¿Algún resultado se siente injusto?
- ¿La filosofía de score es apropiada para repartir premios?
- ¿Qué situaciones de 7.º se mantienen, se sacan o se agregan?

### Salida

Una lista acotada de correcciones y una decisión por cada ítem anterior. **No se acepta un «se ve bien» libre como cierre de un ítem.**

---

## Checklist de congelamiento de fundaciones

Después de las correcciones del Gate 1, se congela si todo esto es cierto:

- sistema de diseño aceptado;
- modelo de carrera aceptado;
- gramática de desafío y de resultado aceptada;
- arquitectura de variantes aceptada;
- filosofía de score aceptada, o sus parámetros documentados como pendientes;
- reglas de autoría de contenido aprobadas por los docentes;
- ningún bloqueante arquitectónico abierto para 1.º–5.º;
- tests deterministas y de replay de 7.º en verde.

Después del congelamiento, los años siguientes pueden agregar contenido e incluso interacciones genuinamente nuevas, pero no reabren la arquitectura de card, botón, stat o scoring sin evidencia de defecto.

---

## Teacher Gate 2 — aceptación del juego completo

Ocurre cuando existen 1.º–5.º y el ranking. Es aceptación y último detalle, no otra exploración de concepto.

Se revisa:

- contenido y catálogo de todas las etapas;
- variantes de borde representativas;
- duración de la carrera completa;
- comportamiento de recuperación y egreso;
- arquetipos finales;
- fórmula exacta de score y su explicación pública;
- interfaz del ranking;
- política de intentos;
- política exacta de empate y de premios;
- reglas de nickname;
- instrucciones del evento.

Después de la aprobación se congelan contenido, reglas y score; sólo quedan hardening y arreglos no semánticos antes de la feria. Ver [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).
