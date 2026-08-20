# Egresado — instrucciones del repositorio

Egresado es un videojuego web de partidas breves donde estudiantes recorren la secundaria resolviendo desafios matematicos contextualizados. La experiencia debe sentirse como un juego de decisiones y consecuencias, no como un examen presentado con animaciones.

## Autoridad y contexto

- `docs/` es la fuente autoritativa de producto, juego, pedagogia y arquitectura. Empeza por [docs/08-engineering/context-map.md](docs/08-engineering/context-map.md) y carga solo los documentos que correspondan a la tarea.
- Los archivos individuales son las fuentes mantenibles. `docs/EGRESADO-MASTER-SPEC.md` es una vista generada; nunca lo edites como unica fuente.
- Ante contradicciones, aplica este orden: ADR aceptado para decisiones tecnicas; especificacion funcional para comportamiento visible; GDD/reglas para gameplay; marco matematico para pedagogia y dificultad; backlog/historias para orden de implementacion.
- Para documentos no ordenados explicitamente, usa el documento especializado sin contradecir fuentes de mayor autoridad. Si dos fuentes siguen en conflicto, registra o actualiza [docs/07-reference/open-questions.md](docs/07-reference/open-questions.md); no inventes una decision.

## Antes de modificar

1. Inspecciona `git status` y lee los `AGENTS.md` entre la raiz y cada subtree que vayas a modificar; las instrucciones mas cercanas son mas especificas.
2. Delimita la tarea con el context map y lee las fuentes requeridas.
3. Inspecciona la implementacion, tests, lockfile y scripts existentes antes de proponer cambios.
4. Declara supuestos no resueltos y evita convertirlos silenciosamente en comportamiento.

No implementes producto o gameplay sin una tarea explicitamente acotada.

## Invariantes no negociables

- El motor es TypeScript puro, determinista y reproducible por seed, versiones y acciones. No depende de React, DOM, red, DB, almacenamiento local, hora global no inyectada ni `Math.random()` directo.
- Mantene separadas UI/adapters, `game-core`, contenido, servidor y persistencia. El contenido sobre interacciones existentes es data, no componentes ad hoc.
- Una run activa se ejecuta localmente despues de iniciarse y tolera cortes temporales; local-first no vuelve oficial un resultado offline.
- El browser es no confiable. El cliente envia acciones y solo previsualiza score; el servidor reproduce la run y calcula score/perfil oficial para ranking.
- Toda compatibilidad de replay depende de `game_version`, `ruleset_version` y `content_version`; los cambios que alteren resultados deben versionarse.
- El MVP minimiza datos de menores: sin email, password, apellido, fecha de nacimiento, escuela, ubicacion precisa ni identidad real innecesaria. Los nicknames son contenido publico pseudonimo y moderable.

## Decisiones y dependencias

- Segui [docs/08-engineering/dependency-and-decision-policy.md](docs/08-engineering/dependency-and-decision-policy.md).
- Crea o actualiza un ADR cuando la decision cruza modulos, es costosa de revertir, cambia una NFR significativa, proveedor/plataforma, seguridad o compatibilidad de runs. Actualiza tambien el registro de decisiones.
- Un cambio de regla de producto/juego se resuelve en documentacion autoritativa y trazabilidad, no dentro de feature code. Una pregunta sin decision va al registro de preguntas abiertas.
- No agregues dependencias especulativas. El lockfile y las versiones instaladas gobiernan las APIs reales.

## Next.js y evidencia

- Para cualquier tarea Next.js, si existe `node_modules/next/dist/docs/`, lee primero la guia relevante de esa version; si la version instalada no incluye esa ruta, usa la documentacion upstream que corresponda a esa version.
- Si `next dev` agrega un bloque entre `<!-- BEGIN:nextjs-agent-rules -->` y `<!-- END:nextjs-agent-rules -->`, conserva ese bloque y manten estas reglas fuera de sus marcadores.

## Verificacion

- Implementa el cambio coherente mas pequeno, agrega o actualiza tests y ejecuta los gates aplicables definidos por el repositorio y la Definition of Done.
- Para infraestructura documental/agentica ejecuta `node scripts/validate-agent-workspace.mjs` y `node scripts/sync-master-spec.mjs --check`.
- Antes de finalizar, revisa `git diff --check`, el diff completo y `git status`. Reporta comandos ejecutados, resultados y checks omitidos; no declares validacion que no corriste.
