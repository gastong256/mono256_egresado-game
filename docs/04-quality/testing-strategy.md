# Estrategia de testing

## Pirámide adaptada

### Unit tests
- evaluadores matemáticos;
- scoring;
- perfiles;
- reducers;
- RNG helpers;
- schemas.

### Property-based / generative tests
Críticos para contenido procedural.

Propiedades:
- todo challenge generado es válido;
- existe solución cuando el template lo promete;
- soluciones óptimas son realmente óptimas;
- no hay divisiones por cero;
- unidades consistentes;
- valores visibles dentro de rangos;
- replay produce mismo estado.

### Integration tests
- create run → persist;
- finish → replay → score;
- idempotencia;
- leaderboard sólo completed/valid;
- moderación.

### E2E Playwright
- primera run;
- desafío de cada interaction type;
- refresh/reanudar;
- finish online;
- ranking;
- viewport mobile y desktop;
- keyboard accessibility básica.

## Golden seeds

Mantener una colección de seeds conocidas con resultados esperados. Sirven como regression suite del engine.

## Simulation tests

Antes de release de contenido:
- ejecutar miles de runs automáticas;
- detectar distribución extrema de dificultad;
- encontrar eventos imposibles/repetidos;
- medir frecuencia de profiles.

## Visual regression

Recomendado para componentes de challenge, especialmente gráficos y layouts móviles.

## Playtesting humano

Automatización no valida diversión ni claridad. Cada batch relevante debe probarse con usuarios reales del rango objetivo cuando sea posible.

Registrar:
- dónde preguntan “¿qué tengo que hacer?”;
- dónde leen dos veces;
- dónde adivinan;
- qué consecuencias comentan;
- qué problemas quieren repetir.
