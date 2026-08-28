# Deployment and environments

## Environments

### Local/dev
Unrestricted generators, golden seeds, design-system showcase, debug tools.

### Teacher demo
Stable 7.º content and deterministic demo variant pool. No production-prize guarantees required, but behavior should represent final architecture.

### Staging/fair rehearsal
Same infrastructure/config shape as production, synthetic participants, ranking/load tests.

### Fair production
Frozen event config, official deployed variant catalog, authoritative verification, monitoring/moderation.

## Configuration isolation

Do not allow dev score/content versions to become accepted official production versions accidentally. Event record should explicitly allow only frozen version tuple.
