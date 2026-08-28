# Analytics y observabilidad

## Separación

**Product analytics** responde cómo se juega.
**Operational observability** responde si el sistema funciona.

## Eventos de producto mínimos

- `run_started`.
- `stage_started`.
- `challenge_presented`.
- `tool_used`.
- `info_requested`.
- `challenge_completed`.
- `stage_completed`.
- `run_completed`.
- `run_abandoned`.
- `replay_started`.

## Campos permitidos

- run id pseudónimo;
- event id;
- challenge template/id;
- category;
- difficulty;
- interaction type;
- elapsed bucket/ms;
- result quality;
- score delta;
- tool id.

No enviar PII innecesaria.

## Métricas operacionales

- request count/error rate;
- latency p50/p95/p99;
- DB errors;
- finish replay failures;
- result hash divergence;
- sync pending count;
- leaderboard latency.

## Logs estructurados

Campos recomendados:
- `request_id`;
- `run_id` cuando aplique;
- `event_id`;
- `route`;
- `error_code`;
- `duration_ms`.

## Alertas para feria

- error rate >5% durante 5 min;
- p95 finish >2 s;
- DB connectivity failures;
- aumento abrupto de invalid runs;
- no hay completions durante ventana con actividad esperada.

## Dashboards

### Operación
- starts/completions por 5 min;
- API health;
- DB health;
- pending sync.

### Producto
- funnel por año;
- tiempo por challenge;
- distribución de resultados;
- perfiles finales.

## Telemetría de feria

Porque la feria es la primera exposición real a jugadores del rango objetivo, la instrumentación tiene que estar lista el día uno y no después. Ver [ciclo de entrega real](../00-product/real-delivery-lifecycle.md).

Eventos mínimos útiles: `run_issued`, `run_started`, `challenge_started`, `challenge_completed`, `challenge_outcome`, `run_completed`, `submission_pending`, `submission_verified`, `submission_rejected` con código de motivo, y `technical_error`.

Qué **no** se manda: payloads completos de respuesta cuando no hacen falta, nombres o correos, perfilado sensible, y volumen excesivo de eventos.

Tableros operativos durante el evento: tasa de actividad y de error, éxito y latencia de envíos, salud de base de datos y API, fallas de actualización de ranking y actividad anómala de límite de tasa.

Análisis posterior a la feria: puntos de abandono, tiempo por desafío, distribución de resultados, mejora entre intentos repetidos y variantes con dificultad atípica. Esa evidencia alimenta versiones futuras; **no redefine** un score ya otorgado salvo política de regrade declarada.
