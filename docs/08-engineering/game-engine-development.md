# Desarrollo sobre el motor de juego

Guía operativa para trabajar en `src/game`. La arquitectura y las decisiones están en [game engine](../03-architecture/game-engine.md); acá está el cómo.

## Comandos

| Objetivo | Comando |
|---|---|
| Validar contenido (schema, referencias, cobertura, generación) | `pnpm game:validate-content` |
| Validar contenido con estadísticas por desafío | `pnpm game:validate-content -- --seeds=300 --stats` |
| Simulación determinista de runs | `pnpm game:simulate` |
| Simulación con seed y verificación configurables | `pnpm game:simulate -- --runs=2000 --seed=balance --verify=10 --verbose` |
| Simulación profunda (local, no CI) | `pnpm game:simulate:deep` |
| Tests (unit, component, integration, property) | `pnpm test` |
| Gate transversal completo | `pnpm verify` |

`pnpm verify` incluye validación de contenido y una simulación de 200 runs. La simulación profunda queda fuera del gate por costo.

Ambos CLI viven en `scripts/game/` y no en `src/game`: el core determinista no puede leer `process`, argv ni stdout, así que la herramienta que lo maneja vive donde tocar el entorno es legítimo. Se ejecutan con `vite-node`, que resuelve TypeScript sin duplicar un pipeline de build.

## Harness de desarrollo

Ruta: `/dev/game-engine?seed=<seed>`.

Existe en desarrollo siempre. En cualquier otro entorno hace falta el opt-in **server-only** `EGRESADO_DEV_HARNESS=true`; sin él la ruta devuelve 404. La suite Playwright lo activa para su propio servidor, y así puede ejercitar el harness contra un build de producción real sin que la ruta quede accesible en un deploy.

El harness usa contenido de desarrollo y lo declara en pantalla. No es la pantalla del juego.

El panel de diagnóstico muestra seed, versiones, fase, etapa, storylet, instancia de desafío, últimos eventos de dominio y flags: es lo necesario para reproducir un bug a partir de un seed.

## Invariantes que no se negocian

- Nada de `Math.random`, reloj global, DOM, red, storage ni `process` dentro de `src/game`.
- El estado persistido es JSON-compatible: sin `Date`, `Map`, `Set`, clases ni funciones.
- Las reglas viven en el motor. Un componente React nunca evalúa una respuesta.
- Los rechazos esperados son valores `Result`; las excepciones marcan invariantes rotas.
- El contenido es data. Ninguna condición ni efecto puede ser un callback.

Estas reglas se verifican con lint de fronteras, un proyecto TypeScript sin DOM/Node para el core y tests que corren ESLint sobre fuentes sintéticas.

## Agregar un challenge type

1. Leer [sistema de desafíos](../01-game-design/challenge-system.md), [guía de autoría](../01-game-design/content-authoring-guide.md) y [marco matemático](../01-game-design/math-design-framework.md). Usar la skill `egresado-challenge-authoring`.
2. Crear el módulo con `defineChallenge<TModel>({ ... })`. Declarar `id`, `interaction`, `categories`, `stages`, `baseDifficulty` y `tools`.
3. `generate` debe **construir** parámetros válidos, no confiar en el reintento. El reintento es una red de seguridad para el caso raro, no un sustituto de resolver el problema internamente.
4. `verify` declara las invariantes: existe al menos una solución funcional, el óptimo existe si se declara, no hay división por cero, no hay opciones equivalentes engañosas, las unidades son consistentes y los valores entran en la UI.
5. `present` no puede filtrar la solución.
6. `evaluate` devuelve calidad, feedback estructurado con los números que explican la consecuencia, métricas, efectos de stats y flags.
7. Registrar la definición en el content set y referenciarla desde un storylet cuyas etapas estén incluidas en las del desafío.
8. Correr `pnpm game:validate-content -- --stats` y `pnpm game:simulate`.

## Agregar un interaction type

1. Agregar la variante a `InteractionKind`, a `InteractionPresentation` y a `InteractionAnswer` en `src/game/challenges/interactions.ts`.
2. Agregar el schema de respuesta a `interactionAnswerSchema` en `src/game/runs/commands.ts`.
3. Compilar. El proyecto va a fallar en los `switch` exhaustivos que falten: el renderer (`src/components/game/interaction-area.tsx`), el guard de envío y el agente sintético. Esa es la cobertura garantizada por tipos: no hay `Record<string, Component>` que pueda quedar incompleto en silencio.
4. Implementar el renderer con semántica accesible: control nativo, etiqueta, foco visible, target ≥44 px y significado que no dependa del color.
5. Si la familia se describe con drag & drop, la vía accesible por teclado/tap se implementa primero y por sí sola.

## Agregar una condición o un efecto de storylet

1. Agregar la variante a `StoryletCondition` o `StoryletEffect`.
2. Implementar el caso en `evaluateCondition` / `applyEffect` y en su `validate*` correspondiente.
3. Los `switch` exhaustivos y `assertNever` señalan lo que falte.
4. Agregar el caso a `tests/unit/engine-core.test.ts`, que cubre cada variante.

## Crear un ruleset de desarrollo

`createRuleset` valida etapas, orden escolar canónico, presupuesto de eventos, categorías y pacing.

Un ruleset **oficial** exige políticas marcadas `production`. Hoy ninguna lo está —las preguntas abiertas 5 y 24 siguen abiertas—, así que pedir `official: true` falla a propósito. Eso es lo que impide que un placeholder de desarrollo puntúe un ranking real.

## Cambios que afectan replay

Antes de mergear un cambio que altere salida determinista, decidir explícitamente qué versión sube:

| Cambió | Subir |
|---|---|
| transición, consumo de RNG, derivación de seed, action log, snapshot codec, generación de un desafío existente | `ENGINE_VERSION` |
| scoring, dificultad, progresión, perfil | versión de ruleset |
| datos de desafíos o storylets | versión de contenido |

Los golden tests fallan ante cualquier cambio accidental. Regenerarlos **sin** subir la versión correspondiente invalida en silencio los replays guardados; el archivo de golden tests documenta el procedimiento.

## Cobertura

Los umbrales de Vitest (85 % statements/lines/functions, 75 % branches) aplican a la base enumerada en `vitest.config.ts`, que ahora incluye todo `src/game`. La prioridad de cobertura es transiciones, replay, generadores, evaluadores, matemática, scoring, selección de storylets y serialización; no se persigue un porcentaje por sí mismo.

## Simulación y balance

`pnpm game:simulate` reporta runs completadas, eventos por run, min/promedio/máximo de score, distribución de calidades y de perfiles, y hallazgos. Verifica además replay y round-trip de snapshot en una muestra.

El agente sintético responde **desde la vista pública**, sin ver el modelo ni el evaluador, así que es un proxy honesto de un cliente. Como responde al azar, la distribución de calidades y de perfiles que reporta describe juego aleatorio, no juego humano: sirve para detectar defectos estructurales, no para balancear todavía.

## Deuda conocida

- Las familias `spatial-grid`, `sequence/trend` y `special minigame` no están contratadas.
- No hay persistencia de checkpoint: el motor pide el snapshot, el controller expone el sink y nadie lo escribe todavía.
- No hay endpoints de runs ni ranking; el motor ya expone lo que un caso de uso server-side necesitaría.
- Las políticas de scoring, dificultad y perfil son de desarrollo y están marcadas como tales.
