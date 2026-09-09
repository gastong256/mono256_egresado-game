# Alcance y roadmap

## Estrategia de entrega

La validación debe ocurrir en capas. El proyecto sólo incorpora infraestructura o variedad de contenido cuando la capa anterior demuestra valor.

## MVP 0 — Prototipo local

### Objetivo
Validar que el loop central sea comprensible y divertido.

### Incluye
- Landing mínima.
- Nickname local opcional.
- Carrera parcial: 7.º grado y 1.º año.
- 8–10 desafíos de inventario/cobertura para el prototipo (objetivo histórico; no longitud de una run normal).
- 3–4 patrones de interacción.
- Feedback de consecuencias.
- Score local provisional.
- Perfil final simplificado.
- Juego completamente cliente-side.
- Seed local determinista.

**Objetivo histórico de MVP 0.** El conteo de 8–10 se escribió antes de [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md) como meta de contenido disponible y cobertura de demostración para 7.º + 1.º. Se conserva como antecedente; no define el presupuesto actual de una run normal, que selecciona uno o dos beats por etapa desde un catálogo que puede ser mucho más rico.

### No incluye
- Base de datos.
- Ranking global.
- Auth.
- Realtime.
- PWA offline completa.
- Admin de contenido.

### Criterio de salida

> **Corregido por el ciclo de entrega real.** Este criterio se escribió asumiendo una tanda de testers antes de seguir. Esa tanda no está garantizada: la primera exposición a estudiantes del rango objetivo es la feria. Ver [ciclo de entrega real](real-delivery-lifecycle.md).

- Un adulto que no participó del desarrollo completa una run sin explicación verbal, y se registra dónde preguntó qué hacer.
- Duración media dentro del rango deseado, medida por simulación y por esa prueba proxy.
- Se detectan al menos 3 desafíos que generan comentario o discusión.
- El Departamento de Matemática acepta la dirección en el Teacher Gate 1.

Los tres primeros son evidencia proxy y se declaran como tal. El cuarto es el gate real.

## MVP 1 — Producto web jugable

### Incluye
- Carrera completa: 7.º a 5.º.
- 30–40 desafíos base o combinaciones equivalentes disponibles mediante parametrización; no todos se juegan en una run.
- 6–8 patrones de interacción.
- API de runs.
- PostgreSQL/Supabase.
- Ranking por evento.
- Score autoritativo en servidor.
- Perfiles finales.
- Analytics básico.
- Deploy público.

### Criterio de salida
- Puede soportar una prueba escolar controlada.
- No existen resultados oficiales calculados exclusivamente en cliente.
- Los desafíos procedurales pasan validación automatizada.

## MVP Feria — Operación real

### Incluye
- Evento de feria con seed/ruleset común.
- QR de entrada.
- Leaderboard público.
- Moderación de nicknames.
- Pantalla de proyección.
- Modo degradado para mala conectividad.
- Runbook operacional.
- Métricas de partidas iniciadas/completadas.
- Protección básica contra abuso.

### Criterio de salida
- Ensayo de carga y conectividad realizado.
- Plan de fallback probado.
- El organizador puede resetear/ocultar scores sin despliegue.

## Post-MVP

Posibles líneas:
- Daily challenge.
- Desafíos por curso/nivel.
- Más perfiles narrativos.
- Minijuegos especiales como Reactor 42.
- PWA instalable con soporte offline avanzado.
- Panel de administración de contenido.
- Modo docente para crear eventos.
- Comparación de decisiones por cohorte.
- Partidas privadas por código.
- Temporadas.
- Internacionalización.
- Multiplayer asíncrono.

## Fuera de alcance hasta nueva decisión

- Chat o mensajería entre menores.
- Login social obligatorio.
- Publicación de datos personales.
- Marketplace o compras.
- Publicidad.
- Sistema de amigos.
- Moderación social compleja.
- IA generativa creando problemas en producción sin validación determinista.

## Cómo se corresponden las capas con el ciclo real

Las capas MVP describen **qué se construye**. Las fases del [ciclo de entrega real](real-delivery-lifecycle.md) describen **quién valida y cuándo se congela**. Son dos ejes, no dos planes en competencia.

| Capa de alcance | Fase del ciclo real | Quién valida |
|---|---|---|
| MVP 0 — prototipo local | Fase A — demo candidata de 7.º | prueba proxy con adultos; **sin estudiantes** |
| — | Fase B — Teacher Gate 1 | Departamento de Matemática |
| — | Fase C — congelamiento de fundaciones | equipo |
| MVP 1 — producto web jugable | Fase D — producción del juego completo | tests, simulación y auditorías |
| — | Fase E — Teacher Gate 2 | Departamento de Matemática |
| MVP Feria — operación real | Fase F — congelamiento y hardening | ensayo de carga, red y operación |
| — | Fase G — semana de feria | **primera evidencia real de uso** |
| Post-MVP | Fase H — post-feria | decisión de producto |

## Alcance completo del producto

La progresión completa es `7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESO`. Cada etapa usa la misma gramática de diseño y de motor: los años posteriores agregan complejidad de contenido, **no un sistema de UI nuevo**.

El producto completo, más allá del MVP Feria, incluye: catálogo completo de escenarios y variantes deterministas, modelo de carrera Promedio · Equipo · Aura · Estilo, dominio matemático y flags ocultos, recuperación fail-forward donde corresponda, arquetipo final, score oficial de feria, ranking por evento, política de intentos configurable, reglas y contenido versionados, verificación de runs en servidor, moderación de nicknames y operación de feria.

Ver [alcance objetivo del motor](../03-architecture/target-engine-architecture.md) para el estado real de cada capacidad.

## Escalamiento temático por año

Dirección de escalada **lúdica y narrativa**, no currículo-gate. TG1-01 exige que todos los años conserven un piso matemático accesible desde aproximadamente 7.º. Los dominios de la tabla son contextos posibles: cualquier concepto debe presentarse con apoyos suficientes y la dificultad viene de la estructura.

| Etapa | Qué se agrega como desafío |
|---|---|
| 7.º | **adaptación / entrada:** aprender la escuela y la gramática del juego con tiempo, porcentajes, área, presupuesto, asignación simple y divisibilidad |
| 1.º | **consolidación:** rutinas y vínculos ya conocidos; asignación, agenda, autogestión, probabilidad y construcción espacial |
| 2.º | **pertenencia / identidad:** grupos, cooperación, competencia, reputación y lugar propio |
| 3.º | **autonomía:** tiempo, recursos, tecnología, movilidad y trade-offs más autodirigidos |
| 4.º | **responsabilidad:** coordinación, liderazgo y consecuencias públicas con restricciones y optimización accesible |
| 5.º | **cierre / futuro:** proyecto y eventos finales, callbacks, egreso y síntesis del recorrido |

Esta progresión narrativa está aceptada en la
[envolvente de diseño de STAGE-08](../01-game-design/stage-08-product-design-envelope.md).
7.º y 1.º ocurren en la misma escuela: 1.º no repite la adaptación institucional.

### Producción de contenido después del Teacher Gate 1

No se autoran los años en secuencia sin catálogo. La
[matriz completa v0.3](../01-game-design/full-career-content-matrix.md) reúne 25
Templates con los cinco pases de 1.º–5.º `DESIGN-CANDIDATE-APPROVED`. Phase 0
continúa con Full-Career Cross-Content Audit, los pases de Rare Events / Milestones
/ Prestige y Career Epilogue v1, y la reconciliación final. Sólo después de cerrar
la fase se implementa 1.º real, se ejecuta la auditoría obligatoria y, si pasa,
se escala 2.º–5.º. Ver [secuencia de implementación](../06-delivery/implementation-sequence.md).

La referencia histórica de seis a ocho situaciones significativas por año describe **profundidad posible del catálogo**, no beats obligatorios en una run. No fija un requisito ni una cantidad final: cada run normal selecciona uno o dos beats por etapa, mientras el catálogo debe ofrecer más opciones para sostener la rejugabilidad. La profundidad definitiva sigue abierta ([pregunta 46](../07-reference/open-questions.md)).
