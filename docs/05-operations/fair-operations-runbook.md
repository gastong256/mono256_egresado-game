# Runbook de operación de la feria

Este documento se puede ejecutar **sin conocer el código**. Cada procedimiento
dice qué comando correr o qué botón tocar, qué esperar y qué hacer si no pasa.

Para Feria del Libro 2026 usar primero el [handoff Vercel/Supabase](vercel-supabase-production-deployment.md): fija institución, fechas, retención, URL, scopes y CLI. Los comandos siguientes apuntan explícitamente a su archivo privado.

La coreografía del día —qué revisar a T-7, qué mirar durante— está en el
[runbook de feria](fair-runbook.md). Acá están los comandos.

Los comandos de verificación no imprimen secretos. La generación de credenciales
los muestra deliberadamente: ejecutar esa sección en una terminal privada y
no copiar su salida a logs, chats ni archivos versionados.

## Vocabulario mínimo

| Palabra | Qué es |
|---|---|
| **Edición** | una feria concreta: su seed, su ventana, su estado. Una fila de la base. |
| **Release** | las reglas con las que se juega: motor, contenido, score, ranking. Está en el código y tiene huella. |
| **Intento** | una partida emitida por el servidor para una persona. |
| **Participante** | una persona anotada. Lo público de ella es su alias. |

Una edición sólo se puede **abrir** si corresponde al release desplegado. Si no
corresponde, el organizador ve un error y la edición se queda donde está.

---

## 1. Antes del evento

### 1.1 Verificar qué está desplegado

```bash
curl -fsS "$APP_URL/api/health" | jq
```

Esperado:

```json
{
  "status": "ok",
  "service": "egresado-web",
  "release": {
    "releaseId": "egresado-fair-edition-v1",
    "releaseVersion": "1.0.0-rc.5",
    "releaseChannel": "release-candidate",
    "releaseFingerprint": "ac1307fabcbcbcdb8ee8c224b016583f0b46801d5813aa968085416d4d69ce30"
  },
  "checks": [{ "name": "release-manifest", "state": "ok" }]
}
```

La **huella** es la identidad exacta de las reglas. Anotala: es lo que permite
decir, meses después, con qué reglas se jugó.

Si `releaseFingerprint` no es la que se esperaba, lo desplegado no es lo
aprobado. **No abrir.**

### 1.2 Verificar que puede atender

```bash
curl -fsS "$APP_URL/api/health?ready=1" | jq
```

Los cuatro chequeos tienen que estar en `ok`:

| Chequeo | Si está en rojo |
|---|---|
| `release-manifest` | el manifiesto no coincide con su candado: el despliegue está corrupto |
| `competition-config` | falta configuración obligatoria; ver 1.3 |
| `database` | la base no responde; ver 6.2 |
| `competition` | `degraded` significa que falta el bootstrap (1.4); `error` significa que la edición no corresponde al release (1.5) |

Un `503` es la respuesta correcta cuando algo está en rojo. `?ready=1` es lo que
hay que mirar antes de abrir; `/api/health` a secas es para el balanceador.

### 1.3 Verificar la configuración, sin imprimirla

```bash
pnpm release:preflight -- --env-file=.env.production.local
```

Lista lo que falta por nombre de variable. **Nunca imprime un valor.**

Lo que exige un despliegue de `staging` o `production`:

```text
NEXT_PUBLIC_APP_URL                   https, dominio propio, no local
SUPABASE_SECRET_KEY                   presente
SUPABASE_INTERNAL_URL                 presente
EGRESADO_COMPETITION_SLUG             presente
PARTICIPANT_IDENTITY_SECRET           ≥ 32 caracteres con entropía real
EGRESADO_ORGANIZER_USERNAME           presente
EGRESADO_ORGANIZER_PASSWORD_HASH      scrypt N=65536/131072, r=8, p=1
EGRESADO_PRIVACY_CONTROLLER_NAME      la institución real
EGRESADO_PRIVACY_CONTROLLER_CONTACT   un contacto real
EGRESADO_PRIVACY_CONTROLLER_ADDRESS   un domicilio real
EGRESADO_PRIVACY_NOTICE_VERSION       presente
EGRESADO_PRIVACY_RETENTION_DAYS       explícito, 1..3650
EGRESADO_DEV_HARNESS                  apagada
```

Generar los secretos:

```bash
pnpm secrets:generate                            # imprime, no escribe archivos
pnpm competition:organizer:hash -- "<contraseña>"  # digest del organizador
```

**El secreto de identidad no se rota durante una edición abierta.** Las claves
derivadas dependen de él: rotarlo deja a todos los participantes sin poder
reingresar. Entre ediciones no cuesta nada.

### 1.4 Crear la edición

```bash
pnpm competition:bootstrap -- \
  --env-file=.env.production.local \
  --name="Egresado - Feria del Libro 2026" \
  --status=UPCOMING \
  --opens=2026-09-23T08:00:00-03:00 \
  --closes=2026-09-25T11:00:00-03:00 \
  --grace=300
```

Imprime la seed compartida, la huella del plan y la tupla congelada. **Guardá esa
salida.** Es el registro de con qué se jugó.

Es idempotente: si la edición ya existe, no la toca. Cambiar la seed de una
competencia en curso invalidaría todas las partidas jugadas.

Una edición por feria. Para una feria nueva se usa un slug nuevo.

### 1.5 Si la edición no corresponde al release

Pasa cuando la edición se creó bajo otra versión del código —por ejemplo, antes
del congelamiento de v1—. El organizador ve:

```text
COMPETITION_NOT_CONFIGURED — la edición no corresponde a
egresado-fair-edition-v1 1.0.0-rc.5: scoreVersion esperaba … y tiene …
```

La edición vieja **no se arregla**: sus intentos se jugaron bajo otras reglas y
reetiquetarlos sería reescribir resultados. Lo que se hace:

1. Archivarla desde `/organizer` (se puede archivar siempre).
2. Cambiar `EGRESADO_COMPETITION_SLUG` al slug de la edición nueva.
3. `pnpm competition:bootstrap -- --env-file=.env.production.local` con ese slug.

Los intentos viejos se siguen pudiendo verificar y exportar.

### 1.6 Ensayo con una partida real

El ensayo local juega la carrera entera desde `/` y confirma el puntaje. En cloud, el smoke mínimo es obligatorio; una partida completa es opcional sobre el slug sintético separado del [handoff](vercel-supabase-production-deployment.md#g-verificación-cloud-y-go-pendiente). No contaminar el ranking final.

---

## 2. Abrir y cerrar

Ambas cosas desde `/organizer`, con sesión. Cada cambio pide un motivo y queda
auditado con actor, acción, destino y fecha.

| Acción | Efecto |
|---|---|
| `OPEN` | se pueden empezar partidas dentro de `[opensAt, closesAt)` |
| `CLOSED` | no se empiezan partidas nuevas; el ranking sigue legible; la exportación sigue disponible |
| `ARCHIVED` | como cerrada, y fuera de la operación normal |

`OPEN` es el único cambio que se puede rechazar, y sólo por no corresponder al
release (1.5).

El reloj es **el del servidor**. Una partida emitida antes del cierre se puede
enviar hasta `closesAt` más la tolerancia configurada (300 s por defecto). Eso
se anuncia antes de abrir.

---

## 3. Durante el evento

### 3.1 Mirar los logs

Una línea JSON por evento, con la identidad del release en cada una:

```bash
# eventos rechazados
… | jq 'select(.scope=="competition" and .outcome=="rejected")'

# errores
… | jq 'select(.outcome=="error")'

# qué release los produjo
… | jq -r '.releaseId' | sort -u
```

Los logs **no contienen** documento, nombre, alias, token, clave de identidad ni
contraseña. Si algo de eso aparece, es un defecto grave y hay que reportarlo.

### 3.2 Recuperar la sesión de un participante

No hace falta hacer nada del lado del operador. La persona vuelve a `/`, toca
«Jugar» y completa el mismo formulario: el servidor la reconoce por la clave
derivada de su documento y **conserva su alias original**, que es la identidad
pública que otros ya vieron en el ranking.

Si el nombre no coincide con el registrado, el servidor **no dice de quién es el
documento** y pide ayuda a un organizador. Desde `/organizer` se corrige el
nombre (4.1) y la persona reintenta.

### 3.3 Cambiar un alias inapropiado

`/organizer` → participante → ocultar alias, con motivo.

El puesto sigue existiendo y el puntaje sigue contando: en el ranking aparece
«Jugador oculto». Borrar la entrada le daría a un insulto el poder de sacar a
alguien del podio.

También se puede corregir el alias por otro, si la persona lo pide.

### 3.4 Ver los intentos rechazados

`/organizer` muestra, por participante, cada intento con su estado y su código
de rechazo. Los más comunes:

| Código | Qué pasó |
|---|---|
| `not-graduated` | la carrera no llegó al final |
| `ATTEMPT_VERSION_UNSUPPORTED` | el intento se emitió con versiones que el servidor ya no tiene |
| `RUN_VALIDATION_FAILED` | el log enviado no corresponde a la emisión, o el motor no lo acepta |
| `SUBMISSION_TOO_LATE` | se envió después de la tolerancia |

Un intento rechazado **conserva su evidencia** y queda fuera del ranking.

### 3.5 Invalidar un resultado

`/organizer` → intento → invalidar, con motivo.

El intento conserva su log, su puntaje y sus versiones; deja de rankear. El
siguiente mejor intento de esa persona pasa a ser el efectivo. Es reversible:
restaurar lo devuelve al ranking.

### 3.6 Descalificar y reincorporar

`/organizer` → participante → elegibilidad, con motivo.

Al descalificar se revocan sus sesiones: si no, el navegador seguiría jugando
partidas que ya no pueden entrar al ranking. Sus filas no se borran.

---

## 4. Premios

### 4.1 Verificar la identidad de un ganador

1. El ranking muestra el alias.
2. En `/organizer` se abre el participante: nombre y apellido, año o curso,
   división si la hubiera y **los últimos cuatro dígitos** del documento.
3. Se le pide a quien reclama que se identifique; si la institución lo permite,
   se comparan los cuatro dígitos con su documento.
4. Se marca «identidad verificada», con motivo. Queda auditado.

**El documento completo no está en el sistema.** No se guarda: se deriva con
HMAC por competencia y sólo quedan cuatro dígitos. La verificación la hace una
persona mirando un documento, no una pantalla.

### 4.2 Exportar el ranking final

Desde `/organizer`, o (crear primero el directorio privado):

```bash
(umask 077; mkdir -p backups)
pnpm ops:export -- --env-file=.env.production.local --out=backups/resultados-publicos.csv            # sin datos privados
pnpm ops:export -- --env-file=.env.production.local --private --out=backups/resultados-premios.csv   # con nombre y últimos 4
```

El archivo lleva un encabezado de procedencia con la edición, la seed, la huella
del plan y la huella del release: sin eso, dentro de tres años nadie puede decir
bajo qué reglas se produjeron esos números.

**El archivo con `--private` contiene datos personales de menores.** Se guarda
donde corresponda y se borra cuando deja de hacer falta.

### 4.3 Las reglas del podio, para explicarlas

```text
Se publican los TRES PRIMEROS PUESTOS, no las tres primeras personas.
Un empate en el podio entra entero: con 100, 100, 90 y 80 los puestos son
1, 1, 3 y 4, y las cuatro primeras filas son tres puestos.
Ordena FairScore; si empata, Prestige; si empata, el puesto se comparte.
No hay tercer criterio: ni tiempo, ni orden de llegada, ni cantidad de intentos.
Cuenta el MEJOR intento verificado de cada persona, nunca la suma.
```

---

## 5. Después del evento

```bash
# 1. Exportar ANTES de cualquier purga
pnpm ops:export -- --env-file=.env.production.local --private --out=backups/resultados-premios.csv

# 2. Respaldar
pnpm ops:backup -- --linked --out=backups/post-feria

# 3. Confirmar CLOSED desde /organizer; mantener el ranking final público

# 4. Mucho más tarde: purgar los datos privados
pnpm competition:privacy:purge -- --env-file=.env.production.local # informa qué haría
pnpm competition:privacy:purge -- --env-file=.env.production.local --apply  # aplica si la retención venció
```

**Retención de esta feria: 30 días después del cierre. Coordinar premios dentro de ese plazo.** No purgar antes de entregarlos. Sin nombre ni últimos cuatro
dígitos ya no se puede verificar a un ganador que reclama después. Por eso la
purga es explícita y nunca automática.

Qué se va y qué queda: se van nombre, año, división y últimos cuatro dígitos, y
se revocan las sesiones. Quedan el alias, el puntaje verificado y la evidencia
de replay, que no identifican a nadie y permiten que el ranking siga siendo
legible el año que viene.

---

## 6. Incidentes

### 6.1 El ranking no carga

El juego sigue. Las partidas se emiten, se juegan y se envían igual: el ranking
es una lectura.

1. `curl -fsS "$APP_URL/api/health?ready=1"` para ver qué chequeo está en rojo.
2. Si es `database`, ver 6.2.
3. Poner en la pantalla pública «ranking temporalmente pausado».
4. **No bloquear partidas.**

### 6.2 La base no responde

1. Confirmar con `?ready=1` que `database` está en `error`.
2. Revisar el estado del proveedor.
3. El límite de tasa falla **abierto** si su contador no está disponible, a
   propósito: dejar a toda la feria afuera por una tabla auxiliar es peor. Las
   restricciones de dominio siguen en pie.
4. Las partidas en curso siguen jugándose en el navegador —el juego es
   local-first—; lo que falla es emitir y enviar. Un envío que falla se puede
   reintentar: es idempotente.
5. Si hay que restaurar, ver 6.4.

### 6.3 Rollback de la aplicación

Primero: **un rollback de aplicación no revierte la base.** La compatibilidad de esquema no demuestra compatibilidad de replay. En Hobby ensayar dos deployments consecutivos del mismo RC.3 y configuración final; ver el [procedimiento específico](vercel-supabase-production-deployment.md#rollback-de-hobby-después-del-primer-deploy).

1. **Identificar qué está desplegado:**
   ```bash
   curl -fsS "$APP_URL/api/health" | jq -r '.release.releaseFingerprint'
   ```
2. **Revertir** al despliegue inmutable anterior desde el panel de la
   plataforma. No se reconstruye: se promueve el artefacto que ya existía.
3. **Confirmar** deployment id y huella esperados (la huella se conserva entre dos deployments del mismo RC):
   ```bash
   curl -fsS "$APP_URL/api/health" | jq -r '.release.releaseVersion, .release.releaseFingerprint'
   curl -fsS "$APP_URL/api/health?ready=1" | jq -r '.status'
   ```
4. **Comprobar la edición.** Si la edición activa se creó bajo el release nuevo
   y la versión anterior no conoce esa calibración, sus intentos no se van a
   poder verificar. Esa es la única incompatibilidad real, y es de datos: la
   salida de 1.4 dice bajo qué tupla se creó.
5. **Repetir el smoke cloud** del handoff antes de declarar el incidente cerrado; no agregar una partida sintética a la edición final.

Cuándo **no** hacer rollback: si la edición ya recibió intentos verificados bajo
el release nuevo. Ahí se arregla hacia adelante.

### 6.4 Restaurar la base

```bash
pnpm ops:backup -- --linked --out=backups/antes-de-restaurar   # primero, siempre
pnpm ops:restore -- --data=backups/x.data.sql --db-url="postgresql://…"
```

El respaldo incluye **sólo el esquema `public`**: tablas de Egresado, vistas,
funciones, índices, grants, RLS y datos. No incluye los esquemas administrados
`auth`/`storage`, roles globales del proveedor, configuración, archivos ni
secretos. El destino debe contar con los roles Supabase `anon`, `authenticated`
y `service_role`; para un destino sin tablas, aplicar primero las migraciones
versionadas o pasar `--schema=backups/x.schema.sql` junto a `--data`.

Guardas: destino único y explícito; archivos existentes; comprobación de todas
las tablas de `public`. Si hay filas exige `--force`, que permite mezclar datos,
no borra ni resuelve conflictos. Un error en la comprobación impide restaurar.
Esquema y datos se aplican en una sola transacción: cualquier error revierte
ambos. Los errores de COPY no se imprimen porque pueden contener datos privados.

`backups/` está ignorado por Git. Los dumps se crean con permisos `0600` y el
directorio nuevo con `0700`; la exportación CSV también usa `0600` y se niega a
sobrescribir un archivo existente. Guardarlos fuera del checkout y con cifrado
y acceso restringido según la operación del despliegue.

El respaldo **no incluye** `PARTICIPANT_IDENTITY_SECRET`. Si ese secreto se
perdió, las identidades restauradas no se pueden volver a derivar y nadie puede
reingresar: los resultados siguen ahí, la continuidad de sesión no.

Después de restaurar: `curl -fsS "$APP_URL/api/health?ready=1"`.

### 6.5 Qué no se toca en vivo

```text
datos de desafíos · lógica de evaluación · coeficientes de score
factores de dificultad · opciones de respuesta · aleatorización
la seed de la edición · la tupla de versiones
```

Sí se puede desplegar: un arreglo visual que no altere información ni forma de
responder, un arreglo de crash que preserve la semántica, escalado de
infraestructura y acciones de moderación.

Si un defecto de corrección obliga igual, se crea una **versión nueva** y se
decide explícitamente si las partidas previas se recalculan. No se mezclan
puntajes de versiones no comparables sin recomputación declarada.

Y: una anécdota de la primera hora no es evidencia. Se anota para la próxima
versión.

---

## 7. Verificar el release sin desplegar

```bash
pnpm release:verify     # 57 comprobaciones sobre el manifiesto y el código
pnpm release:check      # compuerta de dependencias de despliegue público
pnpm security:audit     # vulnerabilidades conocidas
```

`release:verify` recomputa desde la fuente las huellas de los catálogos y de las
migraciones, comprueba que la política de score oficial existe y es
numéricamente idéntica a la candidata que promovió, que la edición de
competencia fija exactamente la tupla del release, y que la huella coincide con
su candado.
