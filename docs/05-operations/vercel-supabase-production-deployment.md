# Feria del Libro 2026 — despliegue manual Vercel + Supabase

Preparación STAGE-10A, 22 de septiembre de 2026. Decisión
[ADR-028](../03-architecture/adr/ADR-028-zero-cost-fair-deployment.md).
Este procedimiento lo ejecuta el operador **después** del commit/tag local.
STAGE-10A no inicia sesiones de proveedores, no crea proyectos, no hace push ni
despliega. La evidencia local está en el
[reporte de adaptación](../06-delivery/stage-10a-deployment-adaptation.md).

## Topología y límites

```text
Browser → Vercel Hobby / Next.js / Node.js Functions (gru1)
        → HTTPS / Supabase Data API → PostgreSQL Free (sa-east-1)
```

Una aplicación Production, un proyecto Supabase de producción, una rama `main`,
USD 0; aproximadamente diez jugadores simultáneos y 200 partidas en tres días.
El Supabase local es el ensayo equivalente a staging. La cuenta ya tiene otro
proyecto Free: no se pausa, borra ni reutiliza. No se requiere un tercero.

`Supabase Project URL ≠ Postgres connection string`. El BFF usa
`@supabase/supabase-js`, protegido por `server-only`. El navegador usa las API de
Egresado; no consume Supabase directamente. `DATABASE_URL`, `POSTGRES_URL`, URLs
de pooler y contraseña PostgreSQL no pertenecen al runtime Vercel. La CLI oficial
puede conectar a PostgreSQL para migraciones/dumps, sin cambiar esta arquitectura.

Las siete tablas de competencia tienen RLS sin policies y grants revocados a
`anon`/`authenticated`. La vista de mejores intentos es `security_invoker` y
también está cerrada. `service_role` tiene grants explícitos; es el rol que
habilita la nueva clave secreta. Datos privados y sesiones sólo salen por casos
de uso autorizados del servidor. No se reescriben las migraciones existentes.

## Perfil aprobado

| Campo | Valor |
|---|---|
| Institución responsable | Colegio Integral Piacentini |
| Domicilio | Gobernador Florencio Tenev 250, Ruta Nacional 16, Colectora Norte Km 12, H3500 Resistencia, Chaco, Argentina |
| Contacto | Profesora de Matemática (maitezacgorac97@gmail.com) |
| Nombre público | Egresado - Feria del Libro 2026 |
| Slug | `egresado-fdl-2026` |
| Zona horaria | `America/Argentina/Buenos_Aires` |
| Apertura | `2026-09-23T08:00:00-03:00` = `2026-09-23T11:00:00Z` |
| Cierre | `2026-09-25T11:00:00-03:00` = `2026-09-25T14:00:00Z` |
| Último envío | cierre + 300 s: `2026-09-25T11:05:00-03:00`, inclusive |
| Retención privada | 30 días desde el cierre; vence `2026-10-25T14:00:00Z` |
| Años | `7.º,1.º,2.º,3.º,4.º,5.º` |
| División | no se configura ni recolecta |
| Organizador | `organizador`, cuenta compartida aceptada para aproximadamente tres personas |
| Después del cierre | sin nuevos intentos; ranking público legible |

La contraseña no tiene default. La seed la genera el bootstrap canónico.

## A. GitHub — publicar la fuente cuando el operador esté listo

1. Verificar `git branch --show-current` = `main` y `git status --porcelain` vacío.
2. `pnpm release:verify` debe identificar `1.0.0-rc.4` y la huella del
   [checklist](../06-delivery/release-checklist.md).
3. El operador comprueba su acceso a GitHub y ejecuta:
   ```bash
   git push --atomic origin main v1.0.0-rc.4
   ```
4. Antes de conectar Vercel, incorporar `vercel.json` a cualquier rama antigua
   que se vaya a seguir usando. La configuración se lee de la revisión enviada;
   una rama que todavía no la contiene no queda protegida por el archivo de main.

La política Git deshabilita auto-deploys no-main, incluidas ramas con `/`, usando
`**: false`, `main: true`. No reemplaza la selección de Production Branch en el
panel ni bloquea despliegues manuales del propietario.

RC4 conserva el esquema de RC2/RC3. El PO confirma el 23/09 que las migraciones
ya están en producción y todavía no hubo partidas allí: no se vuelve a aplicar
el historial, no se ejecuta el seed local ni `competition:summaries`. Las partidas
nuevas guardan automáticamente el resumen del ranking. La confirmación es del
operador; este cierre no inspeccionó ni modificó Supabase remoto.

## B. Supabase Dashboard — un proyecto Free de producción

1. Crear **egresado-fdl-2026**, plan **Free**, región específica **South America —
   São Paulo (`sa-east-1`)**. Confirmar el segundo cupo disponible; si la cuenta
   no lo permite, detenerse y resolver el límite sin tocar el proyecto ajeno.
2. Guardar contraseña de PostgreSQL y project-ref en el gestor privado del
   operador. Verificar versión PostgreSQL compatible con el local (17).
3. Obtener Project URL HTTPS y una clave **Secret `sb_secret_…`** en API Keys.
   No usar la legacy JWT `service_role`; no crear claves públicas para la app.
4. Mantener Data API habilitado para `public`. No agregar policies públicas ni
   grants para resolver un error de acceso. Revisar Security Advisor después de
   las migraciones, junto con los grants/RLS de la migración, sin abrir tablas.
5. Confirmar que el proyecto está activo. No activar add-ons pagos.

## C. Supabase CLI — aplicar el historial sin seed

Desde la raíz del checkout RC4, con Docker disponible para los dumps y la CLI
fijada por el repositorio:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <PROJECT_REF>
pnpm exec supabase migration list --linked
pnpm exec supabase db push --dry-run
pnpm exec supabase db push
pnpm exec supabase migration list --linked
```

Antes de confirmar el push, cotejar el project-ref enlazado con el Dashboard.
La contraseña se entrega al prompt privado de la CLI. No guardarla en Vercel ni
como argumento en un comando compartido. El dry-run debe listar solamente las
migraciones pendientes del repositorio. Al terminar, local y remoto deben tener:

```text
20260820000000  technical_foundation
20260921000000  competition_fair_mode   ← cabeza del release
```

**Nunca** usar `--include-seed`, `db reset --linked` ni `db reset --db-url` en
producción. `pnpm db:reset` pertenece sólo a un stack local descartable. No
pegar SQL de migraciones en Dashboard como ruta normal. Si falla el push,
conservar el error saneado y revisar historia antes de reintentar; no usar
`migration repair` para ocultar una aplicación incompleta.

## D. Secretos locales y archivo del operador

Crear una copia privada sin sobrescribir una anterior (Bash/POSIX):

```bash
(umask 077; set -C; cat deployment/vercel-supabase-production.env.example > .env.production.local)
chmod 600 .env.production.local
(umask 077; mkdir -p backups)
```

Editar localmente los placeholders. No ejecutar `source .env.production.local`:
el loader interpreta dotenv literalmente, sin expansión de shell. En Windows,
proteger con ACL privada del usuario; la comprobación de bits POSIX no aplica.
El archivo queda ignorado por Git. No adjuntarlo a issues ni artefactos CI.

En terminal privada, sin captura de salida:

```bash
pnpm secrets:generate
pnpm competition:organizer:hash -- '<contraseña privada de al menos 12 caracteres>'
```

El segundo comando usa la contraseña elegida por la persona. Evitar dejarla en
historial; en Bash se puede usar `read -rs -p 'Contraseña: ' organizer_password`,
pasar `"$organizer_password"` al comando y luego `unset organizer_password`.
El argumento sigue siendo visible para procesos locales autorizados mientras
se deriva: ejecutar en la máquina privada del operador. Nunca copiar la
contraseña a este repositorio. Guardar el digest como secreto también.

`PARTICIPANT_IDENTITY_SECRET` es material de recuperación: guardarlo **separado
de la base** en gestor de contraseñas o registro offline bajo control de la
institución. Un dump no lo contiene. No rotarlo durante la edición. Compartir la
credencial del organizador por un canal privado con las tres personas; la
cuenta compartida no atribuye cada acción a una persona distinta.

### Variables exactas en Vercel

Todas van **sólo en Production**. Config = visible para operadores autorizados;
Secret/Sensitive = valor sensible. No copiar secretos a Preview ni Development.
Las comillas de dotenv delimitan valores; no pegarlas como parte del valor al
cargar manualmente el dashboard.

| Nombre | Clasificación | Configuración |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | pública / Config | origen HTTPS elegido, sin ruta ni query |
| `EGRESADO_ENVIRONMENT` | servidor / Config | `production` |
| `ENABLE_EXPERIMENTAL_COREPACK` | build / Config | `1` |
| `SUPABASE_INTERNAL_URL` | servidor / Config | Project URL HTTPS de producción |
| `SUPABASE_SECRET_KEY` | servidor / **sensible** | nueva Secret key; placeholder no válido |
| `EGRESADO_DEV_HARNESS` | servidor / Config | `false` |
| `EGRESADO_COMPETITION_SLUG` | servidor / Config | `egresado-fdl-2026` |
| `PARTICIPANT_IDENTITY_SECRET` | servidor / **sensible** | generado y respaldado por separado |
| `EGRESADO_PRIVACY_CONTROLLER_NAME` | servidor / Config | institución de la tabla aprobada |
| `EGRESADO_PRIVACY_CONTROLLER_CONTACT` | servidor / Config | contacto aprobado |
| `EGRESADO_PRIVACY_CONTROLLER_ADDRESS` | servidor / Config | domicilio aprobado |
| `EGRESADO_PRIVACY_NOTICE_VERSION` | servidor / Config | `1` |
| `EGRESADO_PRIVACY_RETENTION_DAYS` | servidor / Config | `30` |
| `EGRESADO_SCHOOL_YEARS` | servidor / Config | `7.º,1.º,2.º,3.º,4.º,5.º` |
| `EGRESADO_ORGANIZER_USERNAME` | servidor / Config | `organizador` |
| `EGRESADO_ORGANIZER_PASSWORD_HASH` | servidor / **sensible** | digest scrypt del comando canónico |
| `EGRESADO_SCHOOL_DIVISIONS` | omitida | no se recolecta |
| `NEXT_PUBLIC_SUPABASE_URL` | omitida | no requerida por el navegador |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | omitida | no requerida por el navegador |
| `DATABASE_URL`, `POSTGRES_URL`, `SUPABASE_DB_PASSWORD` | omitidas | sólo CLI separada cuando corresponda |
| contraseña del organizador en claro | omitida | nunca es una variable de la aplicación |

Los campos de privacidad son configuración server-only, pero se publican
intencionalmente en el aviso. No son secretos.

### Selección de entorno en las CLI

```bash
pnpm release:preflight -- --env-file=.env.production.local
pnpm competition:privacy:purge -- --env-file=.env.production.local
pnpm ops:export -- --env-file=.env.production.local --out=backups/ranking-publico.csv
```

Precedencia: **proceso > archivo explícito > `.env.local` > `.env`**. Ambas
formas `--env-file=ruta` y `--env-file ruta` funcionan. Archivo explícito ausente,
directorio, argumento duplicado/vacío o permisos abiertos en POSIX: fallo antes
de acceder a la base. Nunca se imprimen valores del archivo.

Usar un shell limpio, sin variables de Egresado/Supabase exportadas que anulen
la copia privada. Completar todos los campos de la plantilla: no depender de
fallbacks locales para URL, clave, slug o secretos. Si `.env.local`/`.env`
contiene divisiones o el par público de Supabase, en la **copia privada para
CLI** agregar esos tres nombres con valor vacío para anularlos; no cargarlos en
Vercel. No ejecutar `pnpm verify`, builds locales, `db:env` ni tests mientras exista `.env.production.local` en el checkout: Next.js también lo carga automáticamente. Para volver al desarrollo, moverlo al almacenamiento privado externo y usar `--env-file` con esa ruta cuando se opere producción.
El preflight valida forma/configuración; no demuestra conectividad ni que el
project-ref sea el esperado. Cotejarlo antes de bootstrap, export o purga.

`ops:backup -- --linked` usa el proyecto de la CLI, **no** este env-file.
`ops:restore` exige su propio destino explícito. Revisar ambos por separado.

## E. Vercel Dashboard — contrato del proyecto

Importar `gastong256/mono256_egresado-game` desde GitHub, plan **Hobby**:

| Ajuste | Valor |
|---|---|
| Framework preset | Next.js |
| Root directory | raíz del repositorio |
| Production Branch / Branch Tracking | `main` |
| Node.js Version | `24.x` |
| Install command | default / auto-detected |
| Build command | default, script `build` → `next build` |
| Output directory | default Next.js |
| Function region | `gru1`, desde `vercel.json` |
| Auto deployments | sólo `main` |

Elegir nombre **egresado** si está disponible. Si no, **egresado-fdl26**.
Antes de Deploy, poner el origen real correspondiente en `NEXT_PUBLIC_APP_URL`
tanto en Vercel como en el archivo privado. Preferido
`https://egresado.vercel.app`; fallback `https://egresado-fdl26.vercel.app`.
Comprobar la URL asignada en Domains. No usar el hostname efímero del deployment
para pruebas de POST: el control Origin espera el origen canónico.
Si se cambia el nombre/origen, actualizar ambos y reconstruir: Next congela
`NEXT_PUBLIC_*` en build. No agregar un alias que redirija sin revisar origen.

Cargar la tabla de variables **antes** del primer build, sólo en Production.
Corepack respeta pnpm `11.22.0`; comprobar esa versión y Node 24 en Build Logs.
El rango `>=24.19.0 <25` conserva el mínimo local y selecciona la línea 24 de
Vercel; el proveedor administra sus parches. Si el log muestra un parche menor
al mínimo, detenerse por incompatibilidad efectiva; no desactivar engine-strict.
No fijar timeout/memoria, no activar standalone ni duplicar headers en Vercel.
Las API siguen en Node; CSP/nonce, HSTS, cookies y cierre de `/dev` los conserva
Next.js. La región de las Functions no implica que assets/CDN y routing corran
exclusivamente en São Paulo.

## F. Bootstrap de la edición final

Con RC4 y preflight aprobado:

```bash
pnpm competition:bootstrap -- \
  --env-file=.env.production.local \
  --name="Egresado - Feria del Libro 2026" \
  --status=UPCOMING \
  --opens=2026-09-23T08:00:00-03:00 \
  --closes=2026-09-25T11:00:00-03:00 \
  --grace=300
```

No agregar `--seed`. Guardar stdout de bootstrap como evidencia privada de la
seed, huella del plan y versiones. Es idempotente: si la edición existe **no la
corrige ni la pisa**. Cotejar nombre, ventana y retención en el registro/panel;
un mensaje «ya existe» no demuestra que tenga el perfil correcto.

## G. Verificación cloud y GO pendiente

```bash
APP_URL=https://egresado.vercel.app  # o el fallback elegido
curl -fsS "$APP_URL/api/health"
curl -fsS "$APP_URL/api/health?ready=1"
curl -sS -D - -o /dev/null "$APP_URL/"
curl -sS -o /dev/null -w '%{http_code}\n' "$APP_URL/dev/grade-7"
```

Obligatorio antes de GO:

- liveness 200 y release `1.0.0-rc.4`, fingerprint idéntico al candado;
- readiness 200, `release-manifest`, `competition-config`, `database` y
  `competition` en `ok`; antes del bootstrap, `competition: degraded`/503 es
  esperado, después no;
- landing con institución/contacto correctos, estado según el calendario aprobado y ranking vacío antes de jugar;
- `/test`, `/privacidad` y `/puntajes` accesibles; formulario, footer y explicación de puntaje correctos;
- login real del organizador y operación desde el origen canónico;
- headers CSP, HSTS, nosniff, frame protection y cookies seguras;
- `/dev/grade-7` devuelve 404; sin acceso a herramientas de desarrollo;
- Functions en `gru1`, Supabase en `sa-east-1`, migraciones coincidentes,
  Secret key nueva, Security Advisor revisado y ausencia de secretos Production
  en Preview/Development;
- no errores del proveedor, dump hecho y restauración local comprobada.

Ensayo cloud completo **recomendado y opcional**: antes del bootstrap final,
configurar temporalmente `egresado-fdl-2026-smoke` en el archivo privado y en
Vercel, reconstruir el mismo RC, bootstrap con una ventana breve propia y jugar
sólo con datos sintéticos. Archivar smoke desde `/organizer`, restaurar slug
final en ambos lugares, redeploy del mismo RC, ejecutar el bootstrap final de
F y comprobar readiness. No insertar partidas de prueba en el ranking final.
El ensayo local completo sigue siendo la evidencia de producto obligatoria.

### Rollback de Hobby, después del primer deploy

Crear dos deployments Production consecutivos del **mismo RC.4 y configuración
final**, ambos servidos previamente por el dominio canónico. Anotar ids, commit,
fingerprint y slug. Desde Production Deployment → Instant Rollback, volver al
inmediatamente anterior y repetir health/readiness/login. La huella será la
misma; cambia el deployment id. No confundir ese resultado con un fallo.

Hobby permite volver al deployment inmediatamente anterior. El rollback conserva
sus variables antiguas y no revierte la DB. Luego usar **Undo Rollback** para
restaurar la asignación automática de dominios y confirmar que main vuelve a
auto-publicar. No usar como target el deployment smoke con otro slug. Con intentos
reales, preferir fix-forward salvo compatibilidad demostrada; código anterior
al freeze puede desconocer FairScore oficial.

## H. Backup y ensayo de restauración sin tercer proyecto

La CLI debe seguir enlazada al project-ref de producción. Hacer dump antes del
evento, al final de los días 23 y 24, y al cierre del 25. Al final de cada día
exportar ranking público; al cierre, también resultados privados para premios.

```bash
pnpm ops:backup -- --linked --out=backups/pre-evento
pnpm ops:export -- --env-file=.env.production.local --out=backups/ranking-dia-1.csv
# Repetir dump con out=backups/dia-1, backups/dia-2 y backups/cierre.
pnpm ops:export -- --env-file=.env.production.local --out=backups/ranking-final.csv
pnpm ops:export -- --env-file=.env.production.local --private --out=backups/premios-final.csv
```

El wrapper genera `*.schema.sql` y `*.data.sql` de `public` con permisos 0600;
CSV rechaza sobrescritura. No incluye auth/storage, roles globales, historial
`supabase_migrations` ni secretos. Conservar también tag, lock, migration head,
conteos y project-ref. HMAC separado. Copiar backups cifrados fuera del checkout;
no enviarlos a GitHub, artefactos CI ni repositorios cloud con PII.

Con el Supabase **local ya activo**, crear una base distinta y vacía, sin tocar
`postgres` ni resetear datos locales preexistentes:

```bash
PGHOST=127.0.0.1 PGPORT=54322 PGUSER=postgres PGPASSWORD=postgres createdb egresado_restore_stage10
pnpm ops:restore -- \
  --schema=backups/pre-evento/<DUMP>.schema.sql \
  --data=backups/pre-evento/<DUMP>.data.sql \
  --db-url=postgresql://postgres:postgres@127.0.0.1:54322/egresado_restore_stage10
```

Los roles Supabase ya existen en ese cluster local. No usar `--force`. Exigir
restauración atómica exitosa y cotejar conteos de competencias/participantes/
intentos con los registrados del origen durante una ventana sin escrituras.
Revisar columnas, constraints, RLS/grants y tupla de versiones de la edición
restaurada contra `src/release/fair-edition-v1.ts`; `pnpm release:verify` valida
la fuente, no consulta el dump. Para esquemas nuevos, comprobar que la versión
de `psql`/Postgres local sea compatible con el servidor del dump.

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/egresado_restore_stage10 \
  --no-psqlrc -c 'select slug, engine_version, ruleset_version, content_version, variant_catalog_version, score_version, action_log_version, snapshot_version from public.competitions;'
# Sólo después de documentar el ensayo, borrar LA BASE DESCARTABLE:
PGHOST=127.0.0.1 PGPORT=54322 PGUSER=postgres PGPASSWORD=postgres dropdb egresado_restore_stage10
```

Credenciales `postgres:postgres` de esos comandos son únicamente las locales del
CLI. No sustituir por la contraseña cloud ni convertir esta restauración en una
escritura remota. Un restore cloud descartable es opcional si existe capacidad
adicional gratuita, nunca requisito ni motivo para pausar el proyecto ajeno.

## I. Apertura, cierre y retención

D-1 y cada mañana: readiness, proyecto activo, red externa, origen correcto,
login organizador y snapshot de versión. Free puede pausar por baja actividad
sostenida; revisar Dashboard si falla readiness. No se agrega keep-alive cron.

El 23/09 alrededor de **07:50**, `/organizer` → **OPEN**, con motivo. El reloj
del servidor bloquea nuevos intentos hasta **08:00**. El 25/09 a **11:00** deja
de emitir automáticamente por `closesAt`, aunque el estado todavía diga OPEN.
Mantener la ventana de envío hasta **11:05**, luego marcar/confirmar **CLOSED**,
exportar y respaldar. Ranking permanece legible; no archivar la edición final
como sustituto de cerrar. Conservar evidencia operativa en privado.

El 25/10 a partir de 11:00, comprobar y aplicar la purga explícita:

```bash
pnpm competition:privacy:purge -- --env-file=.env.production.local
pnpm competition:privacy:purge -- --env-file=.env.production.local --apply
```

Coordinar premios antes de ese plazo. La purga de DB no borra CSV ni dumps:
eliminar también las copias privadas bajo la retención aprobada. Preservar sólo
las exportaciones públicas y evidencia sin datos privados que corresponda.

## Contratos oficiales consultados

Consulta: **2026-09-22**, fuentes oficiales vivas; se revalidan en el dashboard
real al ejecutar el handoff. Ninguna consulta acredita una cuenta ni un deploy.

- [Vercel regions](https://vercel.com/docs/functions/configuring-functions/region): Hobby admite una región; se fija `gru1` cerca de la base.
- [Vercel regions list](https://vercel.com/docs/regions): São Paulo es `gru1`.
- [Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions): Node 24.x soportado, parches administrados por Vercel.
- [Package managers](https://vercel.com/docs/package-managers) y [Corepack](https://vercel.com/docs/builds/configure-a-build#corepack): lockfile v9 no fija pnpm 11; `ENABLE_EXPERIMENTAL_COREPACK=1` permite usar `packageManager` sin comando de instalación propio.
- [Git configuration](https://vercel.com/docs/project-configuration/git-configuration): minimatch, default true para ramas sin regla, cualquier coincidencia true habilita. `**` cubre barras, `main` es la única excepción.
- [Git deployments](https://vercel.com/docs/git): la rama Production se selecciona en el panel; las otras serían Preview por defecto.
- [Environment variables](https://vercel.com/docs/environment-variables) y [Sensitive variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables): scope Production separado; interfaz vigente Config/Secret, compatible con Sensitive legacy.
- [Instant Rollback](https://vercel.com/docs/instant-rollback): Hobby al deployment inmediatamente anterior; variables conservadas y Undo Rollback para reanudar asignación automática.
- [Esquema vercel.json](https://openapi.vercel.sh/vercel.json): validación sin login; no requiere instalar Vercel CLI.
- [Supabase billing FAQ](https://supabase.com/docs/guides/platform/billing-faq): dos proyectos Free activos, con cuotas de miembros Owner/Admin de la organización.
- [Supabase regions](https://supabase.com/docs/guides/platform/regions): región específica `sa-east-1`.
- [API keys](https://supabase.com/docs/guides/getting-started/api-keys): `sb_secret_…` privilegiada y server-only; retirada de claves legacy anunciada para fin de 2026, sin inventar una fecha de corte más precisa.
- [Data API](https://supabase.com/docs/guides/api): REST/PostgREST a partir del esquema, protegido con permisos y RLS.
- [CLI](https://supabase.com/docs/reference/cli): login/link, migration list, db push dry-run/push; seed sólo mediante opción explícita.
- [Backups](https://supabase.com/docs/guides/platform/backups): para Free, exportación regular con CLI y copia externa; no depender del workflow de backups descargables de planes pagos.
- [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing): actividad baja en ventana de siete días puede causar pausa; revisar antes del evento, sin agregar infraestructura.
