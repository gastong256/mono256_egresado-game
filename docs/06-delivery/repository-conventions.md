# Convenciones de repositorio

## Estructura propuesta

```text
src/
  app/
    api/
    play/
    event/
    leaderboard/
  components/
    game/
    interactions/
    ui/
  game/
    core/
    rng/
    scoring/
    profiles/
    challenges/
    narrative/
  content/
    challenges/
    storylets/
    rulesets/
  server/
    runs/
    events/
    leaderboard/
    moderation/
  db/
    migrations/
  lib/
tests/
  unit/
  property/
  integration/
  e2e/
docs/
```

## Reglas de dependencia

- `game/core` no importa `components`, `app`, DB ni navegador.
- `content` puede importar tipos/schema, no UI.
- `components` consume modelos del engine mediante adapters.
- `server` puede ejecutar engine.

## IDs

Challenge instance id debe distinguir template de instancia, por ejemplo:
`mural:v2:7f31...`.

## Commits/PR

Cambios que alteran ruleset deben indicarlo explícitamente y actualizar versión correspondiente.

## Documentación

ADRs nuevos en `docs/03-architecture/adr/ADR-NNN-*`.

Cambios de feature deben actualizar requisitos y, si corresponde, matriz de trazabilidad.
