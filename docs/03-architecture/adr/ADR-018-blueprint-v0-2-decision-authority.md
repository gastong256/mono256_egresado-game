# ADR-018 — Autoridad y madurez de las decisiones del Project Blueprint v0.2

- Estado: Aceptado
- Fecha: 2026-08-28

## Contexto

El 28 de agosto de 2026 entró al repositorio el paquete **EGRESADO Project Blueprint & Technical Handoff v0.2.0**: 79 archivos que consolidan producto, game design, pedagogía, motor objetivo, calidad, operación de feria y entrega, posteriores al rediseño visual de 7.º y a las discusiones sobre competencia con premios.

El paquete no es un documento más. Trae tres cosas que la documentación existente no tenía y que, integradas mal, harían daño:

**Trae decisiones con distinto grado de madurez.** El propio paquete distingue seis niveles —`LOCKED`, `PRODUCT DIRECTION`, `RECOMMENDED`, `TEACHER GATE`, `OPEN`, `DEFERRED`— y varias de sus propuestas más concretas (la ponderación 80/15/5 del score competitivo, la política de intentos ilimitados, la calibración de calidades) son candidatas que requieren aprobación del Departamento de Matemática. Aplanarlas a «requisitos» convertiría un borrador defendible en un contrato que nadie firmó.

**Describe un ciclo de entrega real distinto del roadmap escrito.** El roadmap del repositorio valida por capas con testers; el ciclo real valida con docentes y **es probable que no haya playtest con estudiantes antes de la feria**. Documentos que asumen playtest previo describen un proceso que no va a ocurrir.

**Describe como pendiente trabajo que ya está hecho.** El capítulo de migración de estado de carrera pide reemplazar `knowledge/team/initiative/energy` por Promedio · Equipo · Aura · Estilo. Esa migración ya ocurrió: es [ADR-016](ADR-016-career-player-model.md) y `ENGINE_VERSION` `2.0.0`. Integrar el paquete tal cual haría que un agente futuro replanifique trabajo terminado.

Al mismo tiempo hay una restricción que no se puede pisar: el sistema de diseño **Claude Design v0.2** se está implementando ahora mismo y es la autoridad visual. El paquete resume decisiones visuales; ese resumen no es permiso para redecidirlas.

## Decisión

### 1. El paquete se congela como fuente, y la documentación canónica lo absorbe

El paquete queda verbatim en [`docs/sources/egresado-project-blueprint-v0.2.0/`](../../sources/README.md), con su `MANIFEST.json` intacto y verificable. No se edita.

El contenido vigente se integró en la taxonomía existente (`00-product` a `09-design-system`), en castellano rioplatense y con la terminología del proyecto. **La documentación canónica es la de `docs/`; el paquete es procedencia.** El mapa de qué documento absorbió qué, y por qué, está en [la integración del blueprint](../../07-reference/blueprint-v0.2-integration.md).

Dentro del paquete, `EGRESADO-MASTER-BLUEPRINT.md` es una vista consolidada generada de los modulares, igual que `EGRESADO-MASTER-SPEC.md` en este repositorio. Ninguno de los dos es fuente mantenible fuera de su propio paquete.

### 2. La madurez de una decisión se conserva y se escribe

Toda decisión integrada declara su nivel, y el nivel es parte de la decisión:

| Nivel | Qué significa para quien implementa |
|---|---|
| **LOCKED** | fundación aceptada; se implementa salvo que una autoridad más nueva la supere |
| **PRODUCT DIRECTION** | dirección fuerte; la arquitectura debe poder sostenerla aunque hoy no exista |
| **RECOMMENDED** | propuesta senior; se implementa **configurable**, nunca como constante inmutable |
| **TEACHER GATE** | requiere validación del Departamento de Matemática antes del congelamiento |
| **OPEN** | deliberadamente sin resolver; no se cierra dentro del código |
| **DEFERRED** | fuera de alcance a propósito; no es deuda técnica ni backlog urgente |

Regla operativa: **una constante marcada `RECOMMENDED` o `TEACHER GATE` no se escribe como número mágico.** Se escribe como política versionada con su versión declarada, igual que ya hace `src/game/scoring/` con `production: false`.

El registro único de decisiones es [`07-reference/decision-register.md`](../../07-reference/decision-register.md), que ahora contiene tanto los ADR como las decisiones del blueprint con su nivel. Las que siguen abiertas viven en [`07-reference/open-questions.md`](../../07-reference/open-questions.md). No se crea un segundo registro.

### 3. Jerarquía de fuentes de verdad

Ante contradicción, y por dominio:

| Dominio | Autoridad |
|---|---|
| Comportamiento de juego, matemática, transiciones | documentos de `docs/` + motor + tests |
| Identidad visual, tokens, presentación de Game UI | [Claude Design v0.2 y el sistema de diseño implementado](../../09-design-system/README.md) |
| Decisiones de producto de este refinamiento y su madurez | [registro de decisiones](../../07-reference/decision-register.md) |
| Estado real actual | el código |
| Configuración oficial de la competencia | configuración de evento versionada, después de la aprobación docente |

Con cuatro reglas de conflicto:

1. una captura de pantalla no cambia una regla matemática;
2. un estilo heredado del frontend no supera el handoff de diseño aprobado;
3. documentación vieja no supera una decisión de producto más nueva sin dejar el conflicto escrito;
4. una regla `TEACHER GATE` u `OPEN` se implementa detrás de política versionada, nunca como supuesto irreversible.

### 4. Presente y objetivo se escriben separados

Un documento no describe en presente una capacidad que no existe. La arquitectura futura vive en [arquitectura objetivo del motor](../target-engine-architecture.md), con el estado real de cada capacidad; [game engine](../game-engine.md) sigue describiendo lo implementado.

### 5. El blueprint no reabre el sistema de diseño

El paquete aporta contexto durable de producto —economía artística UI-first, arte selectivo, seleccionar no es acertar, ningún estado sólo por color, por qué Egresado se alejó de la gramática visual de Copero y El Ídolo— y **nada más**. Valores de token, tipografía, paleta, geometría, componentes y arte los define el sistema de diseño implementado. Los documentos de producto enlazan; no repiten valores.

## Consecuencias

- Existe un único registro de decisiones y una única lista de preguntas abiertas; el nivel de madurez es una columna, no un documento aparte.
- Los documentos de producto que asumían playtest previo a la feria quedan corregidos hacia el ciclo real, con la limitación declarada en vez de disimulada. Ver [ciclo de entrega real](../../00-product/real-delivery-lifecycle.md).
- Aparecen documentos nuevos de dirección competitiva —score, ranking, variantes, dificultad, fail-forward— todos marcados como recomendación o dirección, ninguno como regla cerrada.
- Un agente de implementación futuro puede distinguir, sin leer código, qué es actual, qué es objetivo, qué está bloqueado por una decisión docente y qué no debe decidir solo.
- El paquete original queda auditable: si mañana alguien discute qué decía la fuente, hay hash.
- **Esta integración no cambió comportamiento de producto.** Ninguna capacidad nueva se implementó al integrarla; la secuencia de trabajo está en [la secuencia de implementación](../../06-delivery/implementation-sequence.md).
