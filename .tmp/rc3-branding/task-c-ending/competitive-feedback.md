# Feedback competitivo — TASK-C

Todo puesto y toda afirmación salen del servidor o de una comparación con lo
que el servidor publicó. El navegador nunca calcula un rank desde el score.
Derivación: `deriveCompetitivePlacement(result, state, before)` +
`placementCopy` en `ending-model.ts`; tests en `ending-model.test.ts` y
`career-ending.test.tsx`.

| Claim | Evidencia requerida | Fuente | Estado |
|---|---|---|---|
| Puesto («Tu puesto actual: 7.º.») | `SubmissionResponse.state.you.rank` | servidor (`rankOf`, mejor intento verificado) | SUPPORTED |
| Podio («Entraste al podio.») | `rank <= 3` | servidor | SUPPORTED |
| 1.º («Estás 1.º.») | `rank === 1` y no compartido | servidor + `leaderboard` | SUPPORTED |
| Empate («Compartís el N.º puesto.») | ≥ 2 entradas del `leaderboard` con el mismo `rank`; sólo detectable en el podio (el servidor publica Top 3 completo por puesto) | servidor | SUPPORTED en podio; fuera del podio no se afirma exclusividad ni empate |
| Nuevo primer puesto («Subiste al 1.º puesto.») | `result.personalBest && rank === 1 && before.rank !== 1`; `before` = `you.rank` leído en la portada al emitir el intento | servidor (dos lecturas) | SUPPORTED con snapshot; sin snapshot no aparece |
| Mejor puntaje personal («Nuevo mejor puntaje personal.») | `result.personalBest && before.bestFairScore !== undefined` | servidor (`personalBest` lo decide el servidor al guardar) | SUPPORTED |
| Primera partida («Es tu mejor partida hasta ahora.») | `result.personalBest && before.bestFairScore === undefined` | servidor | SUPPORTED |
| No mejora («…sigue contando la anterior.») | `!result.personalBest` | servidor | SUPPORTED |
| Récord («Récord de la competencia…») | `personalBest && rank === 1 && shared === false && before.topScore !== undefined && fairScore > before.topScore`; `before.topScore` = puntaje del rank 1 del podio en la portada al emitir | servidor (dos lecturas) | **SUPPORTED con evidencia; no se infiere de rank 1** |

## Límites honestos

- El snapshot `before` se toma al emitir el intento, con el estado que la
  portada ya tenía (refrescado cada 20 s). Entre ese momento y la
  verificación pueden haber entrado otros resultados. Por eso el récord
  exige además `rank === 1` **después** y sin compartir: si alguien superó tu
  puntaje en el medio, no sos 1.º y no hay claim; si alguien lo igualó, el
  puesto es compartido y no hay claim.
- Rank 1 solo **no** produce «récord» ni «nuevo primer puesto» (test
  «1.º solo: está 1.º, sin récord por el solo hecho de estar primero»).
- No hay `historical_max` ni tabla de historia: **cero migraciones**. B20 se
  soporta con lo que hay; si el PO quisiera un récord contra todo el historial
  (incluidos intentos ya superados), eso requiere backend y queda diferido.
- «Tu puesto actual» dice «actual» a propósito: el ranking sigue vivo.
- Sin `you` en el estado (sesión perdida) no se dibuja número: «No pudimos
  leer tu puesto. Está en el ranking.» No se inventa «#—».
- Verificando: sin número, sin puesto, sin acciones que pierdan la partida.
  Red caída: «Reintentar» reenvía el mismo log (idempotente en el servidor;
  `attempt-run.tsx`), nunca un intento nuevo. Rechazado: sin puntaje ni puesto.

## Acciones

| Estado | Primario | Secundario |
|---|---|---|
| competencia · verificando | — | — (nota: «cuando termine la verificación vas a poder volver al ranking») |
| competencia · red caída | Reintentar | Volver al ranking |
| competencia · verificada/rechazada · edición `open` | Jugar de nuevo (intentos ilimitados, `rankedAttempt: best-verified`) | Volver al ranking |
| competencia · verificada · edición `closed` | Volver al ranking | — (nota: ya no admite partidas nuevas) |
| práctica · calculando | — | — |
| práctica · falló | Practicar de nuevo | Reintentar cálculo (en el bloque) |
| práctica · listo | Practicar de nuevo | — |

Siempre un solo primario (`data-primary`), comprobado en tests.
