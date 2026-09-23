# ADR-029 — Práctica pública aislada de la competencia

- Estado: Aceptado por el encargo explícito del Product Owner
- Fecha: 2026-09-23
- Relacionados: ADR-004, ADR-006, ADR-021, ADR-023, ADR-025, ADR-027 y ADR-028

## Contexto

El PO autoriza `/test` en producción como práctica anónima permanente durante
el sprint RC3. El core ya admite `mode: 'practice'`; `createFullCareerRunDescriptor`
y `createFullCareerDependencies` ya comparten el contenido hosteable aprobado,
composición, recuperación, egreso y FairScore oficial. No hace falta otro motor,
edición de contenido, scorer ni cambio de codecs/versiones congeladas.

## Decisión

1. `/test` usa casos de uso propios bajo `src/server/practice`, con
   `POST /api/practice/runs` y `POST /api/practice/runs/verify`. Nunca recibe un
   CompetitionStore ni llama a emisión, participantes, sesiones o submissions
   competitivas. No consulta la competencia activa ni su seed.
2. Emisión sin parámetros: seed aleatoria de 192 bits con namespace
   `practice-v1-`, runId independiente y descriptor compuesto mediante la fábrica
   de carrera completa existente, `practice`/`fixed` y política oficial vigente.
   No acepta seed, catálogo, dificultad ni overrides por cuerpo/query.
3. Verificación stateless: parsea el action log canónico, recompone el descriptor
   completo desde seed/runId y exige igualdad antes del replay existente. Sólo
   devuelve resultado de práctica calculado por `validateSubmittedRun`; nunca
   lee score, egreso o resumen aportados por cliente. No publica `VERIFIED` ni
   un puesto competitivo. No se firma el descriptor: cambiar seed coherentemente
   sólo cambia una práctica propia; un fingerprint o versión incompatible falla.
4. Namespace local `egresado.practice.v1.active`: snapshot y action log, cuyo
   descriptor identifica la run. Recargar ofrece continuar sin nueva emisión.
   Estado corrupto/incompatible se explica y permite comenzar otra práctica.
   Nueva partida reemplaza el avance sólo después de una emisión exitosa.
   Una práctica activa por navegador; entre pestañas gana el último checkpoint.
5. Reutiliza controller, RunView, ChallengeFrame, ilustraciones y epílogo real.
   Identificación visible en todos los estados: **Modo práctica**. El resultado
   dice **Puntaje de práctica** y **no modifica el ranking**. Home agrega un
   enlace secundario, disponible aun sin evento o después del cierre.
6. Rate limit por dirección derivada, namespace propio: 120 emisiones y 240
   verificaciones por 300 segundos (política `practice-limits-v1`). Permite una
   ráfaga de varias aulas tras el mismo NAT y reintentos de red. Usa sólo la RPC
   atómica existente sobre `rate_limit_counters`, mediante un puerto que no puede
   escribir entidades competitivas. El secreto de derivación reutiliza uno de
   los secretos server-only existentes con separación de dominio; no hay env
   nueva. Local sin DB usa un contador de memoria acotado. En despliegue público,
   fallo del contador impide el trabajo costoso con 503; no afecta la política
   fail-open existente de la competencia.
7. POST same-origin, JSON acotado a 256 KiB durante lectura del stream y máximo
   canónico de 512 comandos. Respuestas no-store, sin cookies; fetch de práctica
   omite credenciales. Logs estructurados con scope practice y campos cerrados,
   sin IP, seed, acciones o datos personales. `/dev` y CSP conservan sus guards.

## Consecuencias

La única persistencia servidor es el contador de seguridad. No migrations, env,
proveedor ni secreto nuevo. Jugar y verificar práctica no puede actualizar el
mejor intento, ranking o sesión de un participante, incluso si ya tiene cookie.
La infraestructura de límites y logging se comparte; las reglas de juego no se
copian. Una seed diferente no garantiza preguntas distintas en cada repetición:
se sortean dentro del mismo catálogo finito, sin consultar el plan oficial.

Sin conectividad se juega y conserva avance; emisión/verificación requieren red.
Un cambio futuro de versiones puede invalidar un checkpoint, nunca migrarlo
silenciosamente. La práctica no certifica autoría de las respuestas ni habilita
premios. El release competitivo RC2 y sus fingerprints permanecen intactos;
esta autorización no corta RC3 ni declara GO de STAGE-10.

## Alternativas descartadas

- Competition ficticia o `ranked=false`: agrega persistencia y rutas de fuga.
- Reutilizar endpoints con `mode=test`: mezcla permisos y efectos competitivos.
- Otra ScorePolicy/edición copiada: se desincroniza de la matemática real.
- Firmas/sesión/secretos nuevos: costo sin protección competitiva que justificar.
- Sólo puntaje local: no ejercita el replay autoritativo solicitado.

## Evidencia requerida

Emisión/replay reales, descriptor manipulado, límites de bytes/comandos/tasa,
contenido hosteable, egreso con repaso, score equivalente al scorer real,
checkpoint/resume/retry, invariantes de tablas/ranking/best/cookie y E2E del
build de producción con `/dev` cerrado. Gates de arquitectura, diseño y release.
