# Seguridad y privacidad

## Objetivos

- Evitar manipulación trivial de rankings.
- Minimizar datos de menores.
- Reducir superficie de abuso.
- Mantener secretos sólo server-side.

## Privacidad por diseño

MVP no necesita:
- email;
- contraseña;
- apellido;
- edad exacta;
- escuela;
- ubicación precisa;
- redes sociales.

Nickname es pseudónimo público y debe tratarse como contenido moderable.

## Trust boundaries

El browser es no confiable.

No confiar en:
- score;
- elapsed time sin límites/validación;
- challenge result;
- flags;
- stage final;
- versión declarada arbitrariamente.

## Scoring autoritativo

Servidor reconstruye score desde configuración emitida y secuencia de acciones.

## Token de run

Una run oficial debe estar asociada a sesión/cookie segura o token firmado de corta vida. No usar `runId` como único secreto.

## Rate limits

Aplicar a:
- creación de runs;
- finish;
- validación de nickname;
- endpoints administrativos.

## Supabase

Si tablas quedan expuestas por Data API, habilitar RLS y permisos mínimos. Alternativamente mantener tablas críticas accesibles sólo desde server/BFF.

Nunca exponer secret/service role key al cliente.

## Moderación

- longitud acotada;
- normalización Unicode;
- lista de bloqueo básica;
- revisión manual rápida;
- capacidad de ocultar entrada.

No intentar construir un filtro perfecto; mantener controles operacionales.

## Logging

No registrar payloads innecesarios con información personal. Redactar tokens y secretos.

## Dependencias

- lockfile versionado;
- actualizaciones de seguridad regulares;
- secret scanning;
- headers seguros;
- HTTPS obligatorio en producción.

## Amenazas de ranking

Mitigaciones:
- score server-side;
- limits de tiempo/plausibilidad;
- acción sequence válida;
- run one-time completion;
- detección de outliers;
- ability to invalidate run.

No prometer anti-cheat absoluto: el objetivo es impedir manipulación trivial y preservar integridad razonable en una feria escolar.
