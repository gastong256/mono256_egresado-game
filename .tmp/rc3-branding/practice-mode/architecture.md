# Arquitectura

`/test` → `PracticeExperience` → controller/RunView existentes → checkpoint local.
`POST /api/practice/runs` emite descriptor full-career; `/verify` recompone y
reproduce mediante `validateSubmittedRun`, devolviendo FairScore y egreso reales.

Comparte `createFullCareerRunDescriptor`, `createFullCareerDependencies`, composer,
catálogos hosteables aprobados, interacciones, recuperación, ScorePolicy, epílogo e
ilustraciones públicas. No duplica edición ni modifica core, catálogo o versiones.
“Aprobado” designa el estado técnico vigente del catálogo; no afirma revisión
humana o teacher certification nueva.

No comparte participante, sesión, CompetitionStore, emisión/submission oficial,
mejor intento, ranking ni seed de evento. La seed usa 192 bits aleatorios del
servidor con prefijo `practice-v1-`; cada reinicio tiene nuevo runId UUID. El
catálogo es finito: otra seed no promete que cada pregunta sea distinta.

Descriptor entero y plan se recomponen antes del replay. No hay firma ni nuevo
secreto: cambiar coherentemente seed/plan sólo crea una práctica propia. Un log
válido puede verificarse otra vez; no hay efecto que deduplicar ni claim de autoría.
La UI muestra exclusivamente el FairScore devuelto por servidor al finalizar.

La run vive en memoria y `egresado.practice.v1.active` (snapshot + action log con
descriptor). Reanudar no emite otra run. Una partida nueva reemplaza el checkpoint
tras emisión exitosa. Último checkpoint gana entre pestañas; no hay sincronización
activa ni bloqueo distribuido. Incompatibilidad/corrupción se explica, sin migrar
silenciosamente. Sin storage se puede jugar con advertencia de pérdida al recargar.

Infraestructura compartida extraída: rate limit/fingerprint, contador RPC y logging.
Práctica recibe sólo `RateLimitCounter`; ESLint veta casos y persistencia competitiva.
Competencia conserva sus límites y fail-open; práctica falla cerrado. No necesita
migration, env, proveedor o dependencia nuevos; topología y freeze RC2 intactos.
