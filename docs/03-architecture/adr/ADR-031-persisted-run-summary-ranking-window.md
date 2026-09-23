# ADR-031 — Resumen persistido y ventana del ranking

- Estado: Aceptado por encargo explícito del Product Owner
- Fecha: 2026-09-23
- Alcance: excepción RC3 posterior al freeze; presentación y proyección de resultados, sin cambiar juego ni comparador.

## Contexto

El ranking exponía sólo alias, puesto y FairScore del Top 3. Los hechos del cierre
existían en el replay, pero no todos se guardaban en `verified_summary`. Repetir
ese trabajo en cada polling sería innecesario. El PO autoriza publicar el resumen
de la mejor partida, compactar empates, mostrar contexto propio y actualizar el
seed local. No autoriza modificar el motor sellado, reglas, contenido o puntajes.

## Decisión

1. Persistir `verified_summary.ranking`, proyección con `version: 1`, en la misma
   finalización condicional que guarda score y log. Incluye Promedio/Equipo/Aura,
   Estilo establecido, perfil, estilo editorial, componentes del FairScore,
   graduación, eventos/óptimos, recuperaciones/previas del juego, hitos, recorrido
   por año y recuerdos seleccionados. No incluye mastery, flags crudos, respuestas,
   identidad ni datos escolares reales. El cliente no aporta este resumen.
2. El validador devuelve el estado final **sólo al caso de uso servidor**. La
   proyección usa ese estado ya reproducido, sin segundo replay. Las derivaciones
   existentes del cierre se comparten en `src/lib/presentation`, frontera pura que
   puede leer `game` y `lib`, pero no red, persistencia, servidor o React. No se
   modifica `src/game`, `src/content`, sus versiones ni el manifiesto congelado.
3. Conservar tabla, JSONB, vista de mejores intentos, RLS e índices existentes.
   Elegir primero una ventana del índice compacto de mejores resultados; pedir
   sus resúmenes en un único batch de hasta 12 ids. No leer action logs de
   partidas finalizadas al consultar el ranking. La posición nunca se persiste.
4. Política de presentación `RANKING_WINDOW` v1: máximo 12 grupos/filas. Primeros
   siete grupos y hasta dos grupos antes/después del propio, completando cupos
   libres desde arriba. Sin resultado propio: primeros nueve y últimos tres
   cuando hay más de doce grupos. Una fila representa una partida concreta;
   si hay empate se elige un representante estable, con prioridad a la persona
   de la sesión, y se informa el número completo de acompañantes. La elección
   del representante no adjudica ventaja o premio. Los saltos declaran cuántas
   personas no se dibujan. Todos los miembros del podio siguen contabilizados.
5. Conservar FairScore → Prestige → puesto compartido y medallas sólo para
   puestos reales 1/2/3. No renumerar grupos: seis primeros implican siguiente
   puesto 7. El cierre usa `sharedCount` para no confundir una fila compactada
   con un récord exclusivo. Prestige sigue sin mostrarse (techo ofrecido 0).
6. DTO por whitelist y schema anidado: `summary`, `sharedCount`, `gapBefore` son
   adiciones. Resumen antiguo/inválido: puntaje vigente y detalle no disponible,
   sin ceros inventados ni replay en GET. El aviso de privacidad describe los
   resultados del juego ahora públicos; los campos privados permanecen privados.
7. `pnpm competition:summaries` realiza simulación sin escritura por defecto;
   `-- --write` completa una sola vez los intentos históricos compatibles.
   Verifica edición exacta, emisión, score y Prestige antes de escribir; no
   sobrescribe otra versión ni toca resultado/log. Debe ejecutarse expresamente
   en el entorno objetivo. Nunca corre al iniciar la app o desde una ruta pública.
8. `pnpm competition:seed:local` sólo admite loopback, crea la edición aislada
   `ranking-demo-local` con participantes ficticios y partidas reproducibles de
   distintas calidades. Es idempotente y no reemplaza ediciones anteriores.

## Consecuencias y alternativas

No hay migración SQL ni infraestructura nueva. Un despliegue anterior ignora la
propiedad JSON adicional; la proyección es aditiva. Volver al código anterior
restaura su presentación, sin recalcular ni revertir puntajes. Las runs antiguas
sin versiones compatibles mantienen score y se reportan como omitidas.

Se rechazan caché global personalizada (podría mezclar `isYou`), reconstrucción
en cada GET, copias separadas de las reglas de hitos, un leaderboard materializado
que se desincronice de moderación y agregar reglas como Abanderado/Escolta.

El ranking sigue ordenando el índice compacto en servidor; el batch de detalle y
la respuesta pública están acotados. Esto es apropiado para la escala de feria;
un índice SQL de posiciones sería otro cambio, sujeto a medición.

## UX y evidencia requerida

Puntaje de la partida como dato principal, métricas secundarias con sus escalas,
dos reconocimientos visibles y `details/summary` nativo para el resto. Alias largo,
320 px, tablet, desktop, teclado y axe. Sin dependencia nueva ni cambios de identidad.
Referencia: [divulgación progresiva de NN/g](https://www.nngroup.com/articles/progressive-disclosure/)
y [alineación numérica de GOV.UK](https://design-system.service.gov.uk/components/table/).

Pruebas: equivalencia con cierre existente; selección con empates masivos, límites,
contexto propio y huecos; backfill idempotente/fail-closed; puerto en memoria y
Postgres; invalidación, mejor intento, ausencia de PII; accesibilidad y freeze.
La excepción modifica la superficie pública de FR-012 y supersede el límite de
presentación Top 3 de ADR-026/TASK-A; no su elegibilidad, ranking o premios.
