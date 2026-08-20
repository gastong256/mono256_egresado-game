# Despliegue y ambientes

## Ambientes

### Local
Desarrollo, DB local o proyecto dev.

### Preview
Cada PR/despliegue de Vercel. Nunca usar datos reales de producción.

### Staging
Configuración cercana a feria para pruebas E2E/carga.

### Production
Evento real y juego público.

## CI

Pipeline mínimo:
1. install locked dependencies;
2. lint;
3. typecheck;
4. unit/property tests;
5. content validation;
6. build;
7. E2E smoke para cambios relevantes.

## Migraciones

- SQL/migration files versionados.
- Aplicación controlada a staging antes de prod.
- No editar schema productivo manualmente sin registrar migración.

## Región

Configurar funciones cerca de la región de base de datos para minimizar latencia.

## Feature flags

Usar configuración simple para:
- realtime leaderboard;
- challenge types experimentales;
- herramientas;
- perfiles nuevos.

No crear plataforma de flags propia en MVP.

## Rollback

- deploy anterior disponible;
- migrations backward-compatible cuando sea posible;
- ruleset/content version evita reinterpretar runs viejas.

## PWA

Primera versión incluye manifest/responsive. Service worker avanzado se incorpora cuando el caching esté estabilizado para evitar clientes con assets/reglas incompatibles durante iteración rápida.
