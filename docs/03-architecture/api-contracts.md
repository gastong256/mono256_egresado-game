# Contratos API

## Contrato vigente (STAGE-09)

El contrato implementado está abajo; los bloques históricos que le siguen se
conservan como antecedente y **no** son normativos.

Todas las rutas responden `cache-control: no-store` y comparten el modelo de
error de la última sección. Las operaciones competitivas protegidas exigen
mismo origen y cookie de sesión. Práctica tiene el contrato anónimo separado abajo.

### Participante

| Método y ruta | Qué hace |
|---|---|
| `GET /api/competition/state` | Estado público: edición, podio por puesto y —si hay sesión— el resumen propio. Nunca lleva un dato privado. |
| `POST /api/competition/participants` | Registro o reingreso. Cuerpo `.strict()`: `nickname`, `fullName`, `dni`, `schoolYear`, `division?`, `privacyNoticeVersion`, `privacyNoticeAcknowledged`. Un campo de más se rechaza. |
| `DELETE /api/competition/participants` | «No soy yo»: revoca la sesión de este navegador. |
| `POST /api/competition/attempts` | Emite un intento, o devuelve el activo. Devuelve `attemptId`, `attemptNumber`, `resumed` y el `descriptor` emitido. El cuerpo se ignora: el cliente no elige seed, plan, catálogo, dificultad ni política de score. |
| `POST /api/competition/attempts/{id}/submit` | Envía el log de acciones. Sólo se lee `actionLog`; lo que el cliente afirme sobre su resultado no se consulta en ningún punto. Idempotente por huella de la submission. |
| `POST /api/competition/attempts/{id}/abandon` | Abandona la partida activa. |

### Organizador

| Método y ruta | Qué hace |
|---|---|
| `POST /api/organizer/session` · `DELETE` | Acceso y salida. |
| `GET /api/organizer/dashboard` | Participantes con su identidad privada, intentos y puestos. |
| `POST /api/organizer/actions` | Estado de la edición, corrección, elegibilidad, verificación de identidad, validez de un intento y purga. Cada acción exige motivo y queda auditada. |
| `GET /api/organizer/export` | CSV de resultados. Sin clave de identidad, tokens, IP ni logs de acciones. |

El detalle —qué no puede controlar el cliente, la matriz de ataque y los códigos
de rechazo— está en
[el cierre de STAGE-09](../06-delivery/stage-09-fair-mode-server-ranking.md).

## Práctica pública vigente — RC3 / ADR-029

| Método y ruta | Request | Response 200 |
|---|---|---|
| `POST /api/practice/runs` | JSON `{}` estricto, máximo 1 KiB; sin query | `{ descriptor }` full-career `practice`/`fixed`, seed propia |
| `POST /api/practice/runs/verify` | `{ actionLog }` estricto, máximo 256 KiB y 512 acciones canónicas | `{ result: { kind: "practice", runId, fairScore, graduated } }`, calculado por replay |

No leen ni emiten cookies. Fetch cliente usa `credentials: omit`; sin sesión ni
identidad. JSON same-origin; rechaza origen ajeno y queries. Un cliente anónimo
sin Origin también puede usar la API, sujeto al mismo límite. Respuestas no-store.
No acepta score, graduation o resumen cliente. Recompone descriptor completo y
plan fingerprint desde seed antes de reproducir; una seed modificada coherentemente
es otra práctica propia, sin garantía de emisión firmada.

Errores sanitizados `{ error: { code, message } }`: `INVALID_REQUEST`/`INVALID_RUN`
400, `INCOMPATIBLE_RUN` 409, `TOO_LARGE` 413, `RATE_LIMITED` 429 (`Retry-After: 300`),
`UNAVAILABLE` 503. Lectura de bytes acotada incluso sin Content-Length. Política
`practice-limits-v1`: 120 emisiones / 240 verificaciones por 300 s y dirección
derivada, antes de composición/replay. Sólo usa `rate_limit_counters`; sin writes
competitivos. No existe estado final servidor que consultar o publicar.

## Antecedente histórico

Base conceptual: `/api/v1`.

**Ejemplos históricos no normativos.** Los bloques
siguientes preceden al contrato de carrera completa: `adaptive` en Fair, forma
`ANSWER`, `officialScore`, score 10240 y `limit=20` no son decisiones v1 vigentes.
Se conservan como antecedentes sin modificar schemas en esta integración.
La evolución se gobierna en [ADR-025](adr/ADR-025-full-career-contract-evolution.md).

## POST `/runs`

Crea run oficial.

### Request

```json
{
  "eventSlug": "feria-2026",
  "publicName": "GAS256",
  "difficulty": "adaptive"
}
```

### Response 201

```json
{
  "runId": "uuid",
  "playerId": "uuid",
  "seed": "opaque-seed",
  "mode": "fair",
  "gameVersion": "1.0.0",
  "rulesetVersion": "1.0.0",
  "contentVersion": "2026.08",
  "startedAt": "2026-08-20T18:00:00Z"
}
```

## POST `/runs/{runId}/finish`

### Request

```json
{
  "actions": [
    {
      "sequence": 0,
      "type": "ANSWER",
      "challengeId": "mural:abc",
      "payload": {"optionId": "pack-2l"},
      "elapsedMs": 18340
    }
  ],
  "clientResultHash": "optional"
}
```

### Server
1. autentica sesión anónima/token de run;
2. valida estado y límites;
3. replay;
4. calcula resultado;
5. persiste en transacción;
6. marca completed.

### Response

```json
{
  "status": "completed",
  "officialScore": 8420,
  "profile": "strategist",
  "summary": {},
  "leaderboard": {"rank": 12}
}
```

## GET `/events/{slug}`

Devuelve metadata pública del evento, no secretos administrativos.

## GET `/events/{slug}/leaderboard?limit=20`

Response:

```json
{
  "event": "feria-2026",
  "updatedAt": "...",
  "entries": [
    {"rank": 1, "publicName": "SOFI", "score": 10240}
  ]
}
```

## Error model

```json
{
  "error": {
    "code": "RUN_ALREADY_COMPLETED",
    "message": "La partida ya fue finalizada."
  }
}
```

## Idempotencia

`finish` debe ser idempotente. Un retry con el mismo payload no crea score duplicado.

## Límites

- tamaño máximo de actions/payload;
- cantidad máxima de acciones por run;
- rate limiting por IP/session/event;
- server timestamps para operación/diagnóstico, nunca para FairScore, Prestige o desempate.

## Versionado

Cambios incompatibles usan `/v2` o negociación explícita. Cambios de reglas del juego se manejan además con `rulesetVersion`.

## Superficie objetivo del backend de feria

**No implementada.** Cuando exista el modo competitivo, la superficie mínima es: crear o retomar un participante pseudónimo; emitir un `RunDescriptor` oficial; recibir un envío final con action log e idempotencia, **sin aceptar un score del cliente**; devolver Top 3 público moderado y el puesto propio por vía privada; y endpoints de moderación con autorización separada.

Los límites de contrato son parte del contrato: largo máximo de nickname, cantidad de comandos y bytes del action log, tamaño de request, límites de tasa, validación de la tupla de versiones y tope de paginación.

El diseño de esa superficie está en [arquitectura objetivo del motor](target-engine-architecture.md); su contrato concreto sigue abierto ([pregunta 22](../07-reference/open-questions.md)).

## Requisitos de producto vinculantes para el contrato futuro

- Competition Seed compartida por edición, emitida y registrada por servidor; variantes y dificultad fija comunes, runId único por intento.
- Verificar emisión, versiones/catálogo, replay, nueve ordinarios/seis etapas y egreso antes de oficializar. El action log actual es v4; los ejemplos de arriba no lo sustituyen.
- Ignorar cualquier score del cliente. Calcular FairScore (techo 10.000) y Prestige separados; no confundir el total legacy del validador con FairScore.
- Intentos ilimitados, mejor tupla verificada y puesto compartido al empatar ambos scores; sin tiempo ni clave oculta.
- Practice no envía resultados oficiales; sólo pseudónimo moderado en el Top 3 público, sin listado público de últimos.

Autoridades: [modo feria](../05-operations/fair-mode-and-competition-freeze.md),
[ranking](../01-game-design/competitive-scoring-and-ranking.md) y
[leaderboard](../05-operations/leaderboard-and-moderation.md). Formatos HTTP, DB y
autenticación siguen pendientes; no se inventa aquí un schema implementable.
