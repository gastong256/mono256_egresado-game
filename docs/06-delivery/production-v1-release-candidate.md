# PRODUCTION V1 FREEZE — Egresado Fair Edition v1 Release Candidate

## A. Veredicto

```text
PRODUCTION V1 FREEZE & RELEASE CANDIDATE — READY
```

Este repositorio representa un **Release Candidate reproducible**: un tercero
puede reconstruir con qué reglas exactas se juega la competencia, verificarlo
con un comando y desplegarlo sin depender de nada que no esté versionado.

Lo que **no** dice este veredicto: que esté desplegado, que se haya probado
contra infraestructura real, ni que sea `PRODUCTION READY — GO`. Eso es
[STAGE-10](implementation-sequence.md#stage-10-production-hardening).

## B. Baseline de entrada

- HEAD de entrada: `78fc6ee` — `feat(stage-09): close fair mode, authoritative server and ranking`.
- [STAGE-09 `DONE`](stage-09-fair-mode-server-ranking.md); STAGE-08 `DONE`.
- Tests de entrada: 108 archivos y 2135 tests de Vitest; 218 E2E de Playwright.
- Base de datos de entrada: dos migraciones, cabeza
  `20260921000000_competition_fair_mode.sql`.
- Versiones de entrada: motor `10.0.0`, action log `7`, snapshot `8`, ruleset
  `1.0.0-full-career`, contenido `5.5.0-grade-5`, catálogo `grade-5-dev-6`,
  FairScore `2.0.0-post-tg1-candidate` (`official: false`).

Un gate estaba en rojo al entrar y nadie lo había corrido: `pnpm release:check`
fallaba porque Next.js estaba fijado en `16.3.1`, por debajo del parche de
seguridad `16.3.2` que el propio gate exige. Ahora corre dentro de
`pnpm verify`, que es donde tenía que estar.

## C. Reconciliación de gobernanza

**La revisión humana amplia deja de bloquear el roadmap.**

| Antes | Ahora |
|---|---|
| `GATE-TG2 — Teacher Gate 2` · `TEACHER_GATE` · siguiente | `SUPERSEDED` como gate bloqueante |
| Revisión del Departamento de Matemática humano · diferida a Final Delivery | **No requerida para v1** |
| `FREEZE` dependía de `GATE-TG2` | `FREEZE` `DONE`, sin dependencia humana |

El lenguaje correcto, y el único que este repositorio puede sostener:

```text
Validación de matemática y de producto por IA: completa según los gates
cerrados del repositorio.
Ninguna revisión humana amplia es requisito de v1 bajo la gobernanza actual.
Pueden ocurrir ajustes humanos puntuales, en ventanas controladas, si se
reporta un problema concreto.
```

**No** se afirma `human-reviewed`, `human-certified`, `curriculum-certified` ni
`teacher-approved`, y ninguna frase de este repositorio lo hace.

La evidencia histórica se conserva entera. Los documentos que esperaban un gate
humano —[gates docentes](teacher-gates.md), [ciclo de entrega
real](../00-product/real-delivery-lifecycle.md), el [paquete de revisión para el
Departamento de Matemática](../04-quality/mathematics-department-human-review-packet.md)—
siguen donde estaban, con una nota de superación encima. La decisión está en
[ADR-027](../03-architecture/adr/ADR-027-release-freeze-and-v1-governance.md) y
en el [registro de decisiones](../07-reference/decision-register.md).

Lo que **no** cambia: Teacher Gate 1 ocurrió y sus decisiones siguen integradas;
los ajustes humanos puntuales siguen siendo posibles y deseables; y el pacing
con jugadores reales sigue sin hacerse, y sigue documentado como tal.

## D. Identidad del release

```text
releaseId          egresado-fair-edition-v1
releaseName        Egresado Fair Edition v1
releaseVersion     1.0.0-rc.1
releaseChannel     release-candidate
releaseFingerprint 1affb2a82f4726a77cedbf4e20c82055f6c04a07d67e42674eb8e9e6da16007e
```

La huella es SHA-256 sobre la serialización canónica del manifiesto entero. No
lleva fecha de build, rama, commit ni nombre de máquina: un artefacto
reproducible tiene que dar la misma huella hoy y dentro de un año. El commit es
la procedencia de la fuente y la cuenta git.

| Artefacto | Dónde |
|---|---|
| Manifiesto | `src/release/fair-edition-v1.ts` |
| Contrato y parser | `src/release/manifest.ts` |
| Candado de la huella | `src/release/fair-edition-v1.lock.json` |
| Verificación | `pnpm release:verify` (57 comprobaciones) |
| Regeneración deliberada | `pnpm release:verify -- --update-lock` |

El manifiesto **declara** y no deriva. Si derivara sus valores del código diría
siempre la verdad y no probaría nada: un catálogo regenerado cambiaría la huella
y el manifiesto la seguiría sin quejarse. Declarándolos, un cambio de contenido
rompe la verificación, que es lo que un congelamiento tiene que hacer.

## E. Bundle congelado

```text
motor              10.0.0
action log         7
snapshot           8
RNG                xoroshiro128plus
edición            full-career-v1
ruleset            full-career @ 1.0.0-full-career
contenido          5.5.0-grade-5
catálogo oficial   grade-5-dev-6 · 1031 entradas
score              fair-score-v1 @ 1.0.0-fair-edition-v1 (official: true)
prestige           prestige-dev-1 @ 1.0.0-candidate · techo ofrecido 0
esquema            20260921000000_competition_fair_mode.sql · 2 migraciones
```

Huellas de integridad de los catálogos, recomputadas por `release:verify` desde
los artefactos comprometidos:

| Catálogo | Contenido | Entradas | SHA-256 | Rankea |
|---|---|---|---|---|
| `grade-5-dev-6` | `5.5.0-grade-5` | 1031 | `12c11dd8…4e8d1fdd` | sí |
| `grade-4-dev-5` | `4.4.0-grade-4` | 858 | `a03d77cc…85914cd9` | no |
| `grade-3-dev-5` | `3.4.0-grade-3` | 686 | `e0295877…adeae9ef` | no |
| `grade-2-dev-5` | `2.4.0-grade-2` | 512 | `e7df495a…4948ca4d` | no |
| `grade-1-dev-4` | `1.3.0-grade-1` | 363 | `ae911cab…6fb44aa4` | no |

**No se renombró ni se republicó ningún catálogo.** Que un identificador diga
`dev` es historia de cómo se generó, no una promesa de mutabilidad: cada versión
publicada es inmutable y está validada. Republicar los cinco para que el nombre
se lea mejor movería 3.450 entradas, y cada movimiento es riesgo de replay a
cambio de nada.

## F. Oficialización de FairScore

```text
fair-score-dev-2 @ 2.0.0-post-tg1-candidate  (official: false)
        ↓  promoción por copia, sin recalibrar
fair-score-v1    @ 1.0.0-fair-edition-v1     (official: true)
```

Las dos candidatas quedan en el registro, **sin editar**: un intento emitido
bajo una calibración se verifica bajo esa calibración o no se verifica, y borrar
una versión publicada convierte evidencia guardada en algo que nadie puede
volver a puntuar.

Evidencia de equivalencia, en cuatro formas independientes:

| Prueba | Resultado |
|---|---|
| Comparación campo por campo (`scorePolicyDifferences`) | sin diferencias |
| Corpus determinista de **2.142 secuencias sintéticas** sobre las 42 Templates del catálogo | 1.936 puntuables: FairScore/componentes idénticos; 206 rechazos iguales |
| Propiedad sobre evidencia arbitraria (500 casos, `fast-check`) | idéntico |
| `pnpm game:score` sobre 23.000 planes | `perfect min=10000 mean=10000 max=10000 spread=0`, `rounding ties 0` |

Invariantes explícitamente comprobados y sin mover: partida perfecta = **10.000
exactos** en las tres bandas y en la carrera de nueve beats; pesos **85 / 10 /
5**; escalones **100 / 75 / 40 / 10**; factores de dificultad `core 1,00 ·
standard 1,08 · stretch 1,15`; recuperación fuera del score; Estilo y Promedio
sin peso.

Lo único que cambia entre las dos identidades es la identidad: mismo
`fairScore`, mismo `mathRaw`, mismo `mathMax`, mismos `components`, y
`official` en `true`.

**La ruleset sigue declarando `official: false`, y no es una contradicción.**
Son dos banderas de capas distintas: la de la ruleset dice que composición,
recuperación, rareza y costo siguen siendo políticas de desarrollo —subirlas
exigiría versionarlas todas y mover la huella del plan, que es exactamente el
riesgo de replay que un congelamiento existe para no correr—; la del score dice
con qué calibración se rankea, que es la que un resultado publicado tiene que
poder nombrar.

## G. Prestige en v1

```text
infraestructura de Prestige        soportada
oportunidad competitiva ofrecida   ninguna
techo ofrecido efectivo            0
rol en el ranking                  segundo criterio de desempate
columna pública                    no
```

Congelado como realidad, no autorado. `careerPrestigeOpportunities` está vacío
(D-S08-084) y `release:verify` lo recomputa: el techo ofrecido es 0 porque la
suma de lo autorado es 0. El servidor lo sigue recomputando desde el replay y
el ranking lo sigue usando para desempatar, así que una edición futura que
autorice oportunidades no necesita tocar el ranking.

**Cambio de v1:** `prestigeScore` salió del DTO del podio público. Una columna
que diría `0` para toda la feria ocupa ancho en un teléfono de 360 px y sugiere
que hay algo que conseguir. Sigue en la vista privada del organizador y en la
respuesta de verificación del propio intento, donde el número significa algo.

## H. Congelamiento de la competencia

### Por qué no hay un estado `FROZEN` nuevo

Los campos competitivos **ya son inmutables**, y no por disciplina:
`CompetitionStore.updateCompetition` acepta cuatro columnas —`status`,
`opensAt`, `closesAt`, `resultsFrozenAt`— y ninguna es la seed, la tupla ni la
versión del aviso. No existe una ruta, una acción de organizador ni un método
del puerto que las mueva. Agregar un estado para prohibir lo que el tipo ya no
permite expresar sería un segundo lugar donde declarar la misma verdad, y por lo
tanto un segundo lugar del que puede quedar desincronizada.

Lo que faltaba era la otra mitad, y es lo que este freeze agrega: **abrir una
edición exige que corresponda al release congelado**
(`src/server/competition/freeze.ts`). Una edición creada antes del FREEZE tiene
campos perfectamente estables que sencillamente no son los de Fair Edition v1.

```text
DRAFT / UPCOMING  →  OPEN     requiere coincidir con el manifiesto
OPEN              →  CLOSED   siempre permitido
cualquiera        →  ARCHIVED siempre permitido
```

Negarse a **abrir** es la garantía; negarse a cerrar dejaría a un organizador
sin forma de sacar de circulación una edición equivocada.

### Campos congelados e inmutables

```text
runSeed · runPlanFingerprint
engineVersion · rulesetVersion · contentVersion · variantCatalogVersion
scoreVersion · actionLogVersion · snapshotVersion
privacyNoticeVersion
```

### Campos operativos, y los únicos que se mueven

```text
status · opensAt · closesAt · resultsFrozenAt
```

## I. Reglas de la competencia

| Regla | v1 |
|---|---|
| Seed | una compartida por edición; se genera al hacer bootstrap y queda en la fila |
| Intentos | ilimitados; **uno activo** por participante (índice único parcial) |
| Intento que rankea | el **mejor verificado** de cada participante elegible |
| Envío tardío | hasta `closesAt` más la tolerancia de la edición (300 s por defecto) |
| Abandono | lo inicia el participante |
| Orden | FairScore ↓, luego Prestige ↓ |
| Tercer criterio | **ninguno** |
| Empate | puesto compartido |
| Podio | **tres puestos**, no tres filas: el empate entra entero |
| Descalificado | fuera del ranking, con sus filas intactas |
| Invalidado | fuera del ranking; el siguiente pasa a ser el efectivo; restaurable |

### Por qué la seed se congela en la edición y no en el release

La decisión canónica del repositorio trata la seed como configuración de la
**edición**: se genera una vez con aleatoriedad criptográfica al crear la
competencia, y queda en su fila junto con la huella del plan que produce. El
manifiesto congela la **política** —`seedPolicy: shared-per-edition`,
`seedFrozenAt: edition-bootstrap`— y deja el valor donde tiene que estar.

Ponerlo en el release obligaría a publicar un artefacto nuevo por feria y, peor,
haría que dos ferias distintas jugaran exactamente la misma partida. La
operación de congelar el valor es de STAGE-10.

## J. Producto público

`/` sigue siendo la única puerta: portada, estado de la competencia, ranking,
identificación, carrera completa, resultado verificado y volver a jugar son
estados de una sola dirección. `/organizer` existe detrás de sesión y no se
enlaza desde ninguna pantalla de estudiante.

El build de producción confirma que no hay ruta pública de desarrollo: con una
competencia configurada, `/dev/*` devuelve **404** incluso con
`EGRESADO_DEV_HARNESS=true`. Verificado contra el servidor real, no sólo por
tipos.

## K. Modelo de datos y privacidad

| Dato | Dónde vive |
|---|---|
| Alias | público |
| Nombre y apellido, año, división | privado; sólo ruta autenticada de organizador |
| Documento | **no se guarda**: HMAC-SHA-256 por competencia + últimos 4 dígitos |
| Puntaje verificado, log de acciones | interno; el log no contiene datos de personas |
| Seed y huella del plan | internos; no salen en el estado público |

Contrato de privacidad congelado: versión del aviso, responsable, contacto,
domicilio y retención son **configuración obligatoria del despliegue**, con
nombres fijados en el manifiesto y valores que este repositorio no inventa.
`EGRESADO_PRIVACY_RETENTION_DAYS` por defecto 120.

## L. Base de datos

```text
cabeza          20260921000000_competition_fair_mode.sql
migraciones     2
huella          faf128c4491bb0f406b520b05094e2b2345324f1e2fc049cc762232005ae214f
```

- **Aplicación limpia verificada:** `pnpm db:reset` recrea el esquema desde cero
  y aplica las dos migraciones, dos veces durante esta tarea.
- **Camino de upgrade desde STAGE-09 verificado:** una edición con
  `fair-score-dev-2` congelado sigue resolviendo su edición y sus intentos
  siguen verificándose; lo que no puede es reabrirse bajo el release. Probado en
  `tests/integration/competition-freeze.test.ts` y observado contra la base real.
- **Acceso:** RLS habilitada en las siete tablas, sin una sola política; grants
  revocados a `anon` y `authenticated`; único acceso por `service_role`.
  Probado **con la clave publicable real** contra la API de datos en
  `tests/integration/database-access-model.test.ts`, con control positivo: el
  servidor ve la fila que `anon` no ve.
- **Restricciones que hacen el trabajo:** identidad única por edición, alias
  único por edición, índice único parcial de un solo intento activo,
  finalización condicionada por estado, contador de tasa atómico.
- **Índices:** `attempts_ranking_idx` parcial, `attempts_participant_idx`,
  `participants_competition_status_idx`. Medidos, no supuestos (sección P).
- **Migraciones destructivas:** ninguna. Esta versión no borra ni renombra nada,
  así que la app anterior corre contra este esquema sin cambios.

## M. Configuración y secretos

### Semántica congelada (release)

Versiones de motor, ruleset, score y catálogo; reglas de ranking, podio e
intentos; política de seed; versión del contrato de privacidad; esquema.

### Configuración del entorno (despliegue)

```text
EGRESADO_ENVIRONMENT                  local | staging | production
NEXT_PUBLIC_APP_URL                   origen canónico
SUPABASE_INTERNAL_URL                 proyecto
SUPABASE_SECRET_KEY                   clave de servicio
EGRESADO_COMPETITION_SLUG             edición activa
PARTICIPANT_IDENTITY_SECRET           secreto del HMAC de identidad
EGRESADO_ORGANIZER_USERNAME           credencial del organizador
EGRESADO_ORGANIZER_PASSWORD_HASH      digest scrypt
EGRESADO_PRIVACY_CONTROLLER_NAME      institución responsable
EGRESADO_PRIVACY_CONTROLLER_CONTACT   canal de contacto
EGRESADO_PRIVACY_CONTROLLER_ADDRESS   domicilio
EGRESADO_PRIVACY_NOTICE_VERSION       versión del aviso
EGRESADO_PRIVACY_RETENTION_DAYS       retención
EGRESADO_SCHOOL_YEARS                 años elegibles (opcional)
EGRESADO_SCHOOL_DIVISIONS             divisiones (opcional)
```

Sólo nombres. Ningún valor de este repositorio es una credencial.

`EGRESADO_ENVIRONMENT` es nuevo y existe porque `NODE_ENV=production` sólo dice
que el build está optimizado: es lo que `next start` pone en la máquina de quien
desarrolla y en la suite de navegador, que corren un build de producción contra
`127.0.0.1` a propósito. Ausente con `NODE_ENV=production` significa
`production`, que es el default seguro.

### Fallo temprano

`src/instrumentation.ts` corre una vez por instancia, **antes del primer
pedido**, y en `staging` o `production` exige el contrato completo
(`src/config/production.ts`): https propio y no local, proyecto de base real,
secreto con entropía real, digest de scrypt con `N ≥ 65536`, datos del
responsable presentes y **no de ejemplo**, y la compuerta de desarrollo apagada.

El mensaje nombra variables y problemas, **nunca valores**: un log de arranque
termina en un panel que mira más gente de la que debería ver un secreto.

`pnpm release:preflight` contesta la misma pregunta antes de desplegar.

### Higiene de secretos

- `.env.example` sólo tiene placeholders. `pnpm secrets:check` corre en `verify`.
- `pnpm secrets:generate` imprime valores nuevos y **no escribe ningún archivo**.
- Cualquier credencial que haya aparecido en un log, un chat o una nota es, por
  definición, de desarrollo. La credencial de organizador local **no sirve** para
  staging ni producción y no se reutiliza.
- El secreto de identidad **no se rota dentro de una edición abierta**: las
  claves derivadas dependen de él.

## N. Seguridad

| Control | Estado |
|---|---|
| `Content-Security-Policy` | nonce por pedido vía `src/proxy.ts`; `script-src` sin `unsafe-inline`; `connect-src 'self'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains`, sólo en producción, sin `preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | cámara, geolocalización, micrófono, pago, USB y cohorte apagados |
| `frame-ancestors` / `X-Frame-Options` | `'none'` / `DENY` |
| Cookies de sesión | `HttpOnly`, `Secure` en producción, `SameSite=Lax`, `path=/`, expiración del servidor |
| Tokens | opacos, 32 bytes; la base guarda sólo el SHA-256 |
| Organizador | scrypt `N = 2¹⁷`, sesión de 8 h |
| Origen | `Origin` comprobado contra el host; un pedido sin `Origin` sólo pasa sin cookie |
| Límite de tasa | ventana fija contada en Postgres |
| Errores | códigos estables; ni stack, ni SQL, ni host, ni configuración |

La política de contenido **se verificó contra el servidor real**: los 13 scripts
que Next sirve en `/` llevan el nonce, y la suite de navegador carga la página
entera sin un solo error de consola. Un CSP que rompe la hidratación se ve
exactamente igual que uno que funciona si sólo se mira el encabezado.

`style-src` admite `'unsafe-inline'` y es deliberado: React escribe atributos
`style` —las grillas de la agenda y del plano calculan columnas— y restringirlo
exigiría reescribir esas interacciones el mismo día del congelamiento, a cambio
de cerrar un vector mucho más débil que el de script, que sí queda cerrado.

### Límite de tasa y el NAT de la escuela

```text
registro               60 / 5 min   por IP derivada
emisión de intento     30 / 5 min   por participante
envío                  60 / 5 min   por participante
acceso de organizador  10 / 15 min  por IP derivada
estado público        240 / 1 min
```

Un edificio entero comparte una IP. El ensayo comprueba las dos mitades: 24
registros seguidos desde una sola dirección pasan; un cliente que supera el
límite se corta exactamente en 60 y el resto de la escuela sigue entrando. Los
límites de intento y envío se cuentan por participante, así que el NAT no los
toca. La topología real se valida en STAGE-10.

## O. Salud y observabilidad

```text
GET /api/health            vida    release-manifest
GET /api/health?ready=1    listo   + competition-config, database, competition
```

`?ready=1` devuelve **503** cuando algo está en rojo; la vida devuelve 200
siempre que el proceso responda, porque un orquestador que reinicia por una base
caída pierde las sesiones de toda la feria para arreglar algo que no está en el
proceso.

Ninguno de los dos publica un secreto, una cadena de conexión, un dato de una
persona ni un stack. Probado enumerando cadenas prohibidas sobre la respuesta
serializada.

La identidad del release sale en tres lugares: el health, la línea JSON de
arranque y **cada línea del log de competencia**. Durante un incidente, «¿qué
está desplegado?» se contesta con `curl`.

`CompetitionLogFields` sigue siendo un tipo cerrado de nueve campos opacos, y
ahora hay un test que comprueba lo que se serializa de verdad, no sólo lo que el
tipo permite.

## P. Respaldo, restauración y rollback

| Procedimiento | Estado |
|---|---|
| Respaldo de base (`pnpm ops:backup`) | **probado localmente**: 16,23 KiB de esquema público y 3,67 MiB de datos |
| Restauración (`pnpm ops:restore`) | **probada localmente**: 44 competencias, 2.075 participantes y 6.087 intentos restaurados sobre un esquema recién creado |
| Guardas de restauración | probadas: sin destino explícito no corre; sobre una base con filas exige `--force` |
| Exportación de resultados (`pnpm ops:export`) | disponible, con encabezado de procedencia |
| Respaldo/restauración **remotos** | `READY FOR STAGE-10 REHEARSAL` |
| Rollback de aplicación | procedimiento escrito; `READY FOR STAGE-10 REHEARSAL` |

Las herramientas envuelven `supabase db dump` y `psql`, no un formato propio: un
respaldo en formato propio sólo se puede restaurar con el código que lo
escribió, y el momento en que hace falta restaurar es exactamente el momento en
que ese código puede ser el que falló.

**Lo que un respaldo no devuelve:** `PARTICIPANT_IDENTITY_SECRET` no vive en la
base. Sin él, las claves de identidad restauradas no se pueden volver a derivar
y nadie puede reingresar.

**Compatibilidad con rollback:** esta versión no introduce migraciones
destructivas. El esquema de v1 es el mismo que el de STAGE-09, así que la app
anterior corre contra esta base sin cambios. La incompatibilidad va en la otra
dirección y es de datos, no de esquema: una competencia creada con
`fair-score-v1` no la puede abrir una app que no conozca esa calibración.

## Q. Rendimiento y bundle

### Bundle del estudiante

| Medida | Antes | Ahora |
|---|---|---|
| JS inicial de `/` sin comprimir | 2.270,5 KiB | **616,9 KiB** |
| JS inicial de `/` con gzip | 608,5 KiB | **189,0 KiB** |
| Chunks servidos en `/` | 11 | 8 |
| HTML de `/` (gzip) | — | 4,1 KiB |
| CSS | — | 40,1 KiB |
| Fuentes | — | 74,3 KiB |
| Total de chunks del build | — | 2.388,1 KiB |

El cambio: `AttemptRun` —que arrastra el motor y el contenido de los seis años,
28 Templates y 1031 variantes aprobadas— pasó a `next/dynamic`. Todo eso sigue
llegando al navegador, porque el juego es local-first (ADR-006) y una carrera no
puede pedirle un beat al servidor por decisión; lo que cambia es **cuándo**.

Para que la separación no se pague como una espera, se prefetchea al entrar al
formulario de identificación: mientras el estudiante completa cuatro campos y el
servidor emite el intento, el chunk ya llegó. **Sin cambio semántico**: la
partida, el replay y la verificación son idénticos, y la suite de navegador
juega la carrera entera.

### Baseline local

Medido contra Postgres local. Son baselines de regresión, **no SLOs**: son
números de una laptop.

| Operación | Mediana | Peor |
|---|---|---|
| Registro de participante | 16 ms | 22 ms |
| Emisión de intento | 432 ms | 446 ms |
| Verificación por replay | 437 ms | 466 ms |
| Estado público | 15 ms | 15 ms |
| Exportación CSV | 28 ms | 28 ms |
| Ranking · 500 participantes × 3 intentos | 15 ms | 15 ms |
| Build de producción (limpio) | 15,7 s | — |
| Carga de 1.500 intentos | 21,5 s | — |

Los ~430 ms de emisión y verificación son **composición y replay del motor**, no
base de datos: componer la carrera de nueve beats y volver a jugarla es el
trabajo, y es el mismo que hace que el resultado no dependa del navegador.

## R. Ensayo local de competencia

`tests/integration/competition-rc-simulation.test.ts`, contra Postgres real y
los servicios reales, recorre la jornada entera:

```text
abrir contra el release congelado            ✓
24 registros desde una sola IP (NAT)         ✓
6 participantes reales, carreras jugadas     ✓ nueve beats, seis años
empate deliberado en el podio                ✓
segundo intento peor no desplaza al mejor    ✓
partida trucada rechazada y fuera del ranking ✓
invalidar un resultado                       ✓
descalificar un participante                 ✓
auditoría sin datos personales               ✓
podio por puesto con el empate entero        ✓
exportación CSV sin claves ni tokens         ✓
cerrar: ranking legible, sin partidas nuevas ✓
purga de retención sobre datos sintéticos    ✓
archivar                                     ✓
```

La escala vive aparte, en `competition-performance.test.ts`: 500 participantes y
1.500 intentos verificados. Mezclarlas habría dado un test de veinte minutos que
nadie corre.

## S. Verificación

La continuación ejecutó un único `pnpm verify` completo: exit 0 en **600,27 s**.
Los barridos profundos identificados como evidencia anterior no se repitieron,
por instrucción del Product Owner; los demás gates se midieron nuevamente.

| Gate | Resultado |
|---|---|
| `pnpm toolchain:check` | verde |
| `pnpm lint` (incluye fronteras de arquitectura) | verde |
| `pnpm typecheck` | verde |
| `pnpm format:check` | verde |
| `pnpm design:check` | verde |
| `pnpm test:coverage` | **119 archivos · 2.323 tests · 0 omitidos / todo** |
| Cobertura | statements 85,67 % · branches 77,58 % · functions 87,68 % · lines 85,90 % |
| `pnpm game:validate-content` ×6 | verde |
| `pnpm game:variants check` ×6 | verde |
| `pnpm game:simulate` ×6 | verde |
| `pnpm game:simulate:deep` (agente anterior; evidencia aceptada) | 5000 / 5000 egresadas · 0 hallazgos · peor caso 1 Repaso |
| `pnpm game:score` (agente anterior; evidencia aceptada) | `perfect 10000/10000/10000 spread=0` · `rounding ties 0` |
| `pnpm game:blind-audit` (agente anterior; evidencia aceptada) | sin cambios · `y5.stage-screen` sigue en K 78,0 · S 40 % |
| `pnpm game:pacing` (agente anterior; evidencia aceptada) | mediana 12,25–13,83 min sobre 125 carreras, como en STAGE-08 |
| `pnpm release:check` | verde con Next.js 16.3.5 |
| `pnpm release:verify` | 57 comprobaciones en verde |
| `pnpm security:audit` | sin vulnerabilidades conocidas |
| `pnpm build` | verde, **sin una sola advertencia** |
| `pnpm test:e2e:only` | **222 tests** en cuatro proyectos |
| `node scripts/sync-master-spec.mjs --check` | verde |
| `git diff --check` | limpio |

Delta contra la baseline de STAGE-09: **+11 archivos, +188 tests de Vitest, +4
E2E**, todos de esta etapa.

Suites nuevas:

| Suite | Qué prueba |
|---|---|
| `tests/unit/fair-score-officialisation.test.ts` | equivalencia exacta de la promoción |
| `tests/unit/release-manifest.test.ts` | manifiesto, huella y guardián de inmutabilidad |
| `tests/unit/production-config.test.ts` | contrato de producción y fallo temprano |
| `tests/unit/security-headers.test.ts` | cada directiva del CSP y cada encabezado |
| `tests/unit/session-cookies.test.ts` | atributos de cookie en modo producción |
| `tests/unit/observability-redaction.test.ts` | redacción de logs y saneamiento de errores |
| `tests/unit/operations-restore.test.ts` | restauración atómica, comprobaciones fallidas y errores sin PII |
| `tests/integration/competition-freeze.test.ts` | inmutabilidad y migración desde STAGE-09 |
| `tests/integration/database-access-model.test.ts` | RLS y grants con la clave publicable real |
| `tests/integration/ranking-release-regression.test.ts` | ranking y podio congelados |
| `tests/integration/competition-rc-simulation.test.ts` | el ensayo de feria completo |

## T. Lo que falta para desplegar

Sólo valores del mundo real y la infraestructura. Ningún trabajo de ingeniería
de producto.

| Qué | Quién |
|---|---|
| Proyecto de Supabase de producción y su clave secreta | operación |
| Dominio y `NEXT_PUBLIC_APP_URL` en https | operación |
| `PARTICIPANT_IDENTITY_SECRET` generado en el gestor de secretos | operación |
| Credencial del organizador, con dueño | institución |
| **Nombre real de la institución responsable** | institución |
| **Contacto y domicilio reales para el aviso de privacidad** | institución |
| Ventana real de la feria (`opensAt` / `closesAt`) | institución |
| Ventana de retención explícita (120 días es la referencia, no un default de producción) | institución |
| `EGRESADO_ENVIRONMENT=production` | operación |

`pnpm release:preflight` los verifica sin imprimirlos, y el arranque se niega a
atender si falta alguno o si alguno sigue siendo un valor de ejemplo.

## U. No bloqueantes, para después de v1

- Techo de Prestige ofrecido en 0: es contenido, y autorarlo es una edición nueva.
- Pacing validado con jugadores reales.
- Republicación cosmética de los catálogos `*-dev-*` bajo nombres de release.
- Oficializar composición, recuperación y rareza para poder declarar la ruleset
  `official: true`.
- Observabilidad con proveedor externo; hoy son líneas JSON en stdout.
- `y5.multi-option-comparison-review`, `y4.shift-coverage` y `y2.intercurso-plan`
  siguen auditados por políticas y no por barrido exhaustivo.
- Restauración a un punto en el tiempo del proveedor, en vez de sólo dumps.

## V. Próximo paso

```text
STAGE-10 — PRODUCTION DEPLOYMENT / HARDENING / DRY RUN / GO-NO-GO
```

Lo que **no** se hizo acá, por contrato: desplegar, validar contra staging
remoto, ensayar respaldo y restauración contra producción, ensayar rollback
remoto, load test remoto, dry run de competencia con infraestructura real y
GO/NO-GO.

## W. Continuación del trabajo interrumpido — 22 de septiembre

Se retomó en `main`, HEAD `78fc6ee8882188a676074e0a11ca78e86e8b74eb`, con
los cambios de este RC sin commit. STAGE-09 estaba canónicamente DONE. Los
conteos y mediciones de las secciones anteriores fueron reportados por el
agente anterior; esta sección identifica la evidencia nueva y sus diferencias.
El Product Owner pidió **una sola ejecución completa adicional de `pnpm verify`**,
aceptando la evidencia anterior cuando coincida, en lugar de repetir dos veces.

Se cerraron estos defectos de terminación:

- Índice, MANIFEST y master omitían cuatro documentos nuevos; se integraron,
  con trazabilidad y reconciliación del README y de la gobernanza histórica.
- El logger propagaba propiedades extra y el test aceptaba una fuga de DNI y
  nombre. Ahora selecciona campos permitidos y el test exige que no se filtren.
- El arranque anunciaba éxito antes de validar producción; ahora valida primero.
- Readiness devolvía 200 ante edición ausente (`degraded`); devuelve 503 y dos
  regresiones separan readiness de liveness.
- Se corrigieron tres accesos de índice de TypeScript en el E2E de health; el
  typecheck los detectó. El prefetch opcional del
  cliente absorbe un fallo de descarga sin generar un rechazo sin manejar.
- Configuración: se rechazan origen con ruta/query, IPv6 local y dominio de
  ejemplo; se exige retención explícita y parámetros scrypt verificables.
- El restore podía continuar tras una sonda fallida, restaurar parcialmente y
  publicar errores COPY con datos privados. Ahora falla cerrado, restaura en una
  transacción y sanea su salida; cuatro tests ejercitan esas condiciones.
- El dump incluía `auth`, fuera de las migraciones de aplicación. La primera
  restauración descartable lo detectó y se revirtió completamente. Se limita el
  respaldo a `public`, que es la totalidad de la persistencia de Egresado.
- Dumps con permisos privados, `backups/` ignorado y exportación sin sobrescribir.
- El build Docker detectó que `.dockerignore` excluía helpers importados por
  las CLI de auditoría/pacing. Los tests entran ahora al builder para el
  typecheck; el runner sigue copiando sólo el standalone. Se excluye `backups/`
  del contexto para no incorporar datos privados.
- CI conserva su smoke local declarando el entorno, y ejecuta los dos controles
  de release. Los tipos regenerados incorporan el RPC existente del rate limit.

Evidencia nueva: instalación congelada, 52 tests puntuales, auditoría sin
vulnerabilidades, `release:check`, `release:verify` (57 comprobaciones), `db:lint`
y `db:types`. Ambas migraciones se aplicaron a una **base nueva descartable** en
el Postgres local ya activo; luego `ops:restore` repuso **44 competencias,
2.075 participantes y 6.087 intentos** desde `ops:backup`. El dump público midió
**16.232 KiB de esquema y 3758.243 KiB de datos**, con permisos `0600`.
Un segundo destino vacío se reconstruyó con esquema y datos del dump en una
sola transacción, con los mismos conteos.
Se conserva la base original: no se ejecuta `db:reset` sobre datos preexistentes.
Los resets históricos de las tablas anteriores son evidencia reportada del
agente anterior; el ensayo nuevo usa migraciones completas sobre base vacía.

**Resultado: PASS.** Una sola ejecución completa de `pnpm verify`, exit 0,
**600,27 s**; 119 archivos, **2.323 tests**, 0 omitidos/todo; **222 E2E** en
cuatro proyectos (2,6 min). Incluye formato, lint/fronteras, TypeScript, diseño,
cobertura, seis validaciones de contenido/catálogos, seis simulaciones,
57 comprobaciones del manifiesto y build de producción. El build no emitió
advertencias; Playwright informa sólo la colisión `NO_COLOR`/`FORCE_COLOR` del
runner, sin fallos ni reintentos ocultos.

**Reproducibilidad y operación:** instalación desde lockfile, migraciones
completas en base vacía, restauración esquema+datos en otra base vacía,
rechazo de destino ocupado y rollback real tras un SQL fallido. Se eliminó
todo el esquema parcial de la prueba fallida. `pnpm docker:build` pasó tras
corregir el contexto; el runner ejecuta como `node`, sirve `/` y health 200 en
modo local, y responde 500 sin servir el producto si falta la configuración
obligatoria de producción. El proceso de Next puede permanecer vivo con ese
error: no se confunde con un arranque listo.

**Bundle re-medido:** ocho scripts iniciales, **617,0 KiB raw / 188,5 KiB gzip**
en el standalone. Concuerda con 616,9 / 189,0 del informe previo; el HTML sin
competencia pesa 2,8 KiB gzip y no se compara con el HTML de una feria configurada.

**Escala re-medida durante coverage paralelo:** 500 participantes × 3 intentos;
ranking mediana **23 ms**, peor **28 ms**, carga 83,482 s. Ensayo de servicios
contra Postgres: registro mediana 95 ms; emisión 1590 ms; replay 1552 ms;
estado público 14 ms; exportación 52 ms. Es contención de tests en paralelo,
no un SLO ni una comparación controlada con la medición aislada anterior.

**Corrección de conteo de equivalencia:** el corpus existente no contenía 1.288
partidas completas. Genera **2.142 secuencias sintéticas sobre 42 Templates**:
**1.936 puntuables** con FairScore y componentes iguales y **206 rechazadas**
por ambas políticas. Se corrigió el texto sin cambiar matemática ni tests.

**Limpieza:** se eliminaron las dos bases descartables, los dumps privados y los
contenedores creados para el smoke. Supabase ya estaba activo al retomar y se
conserva. `.env.local` no se imprimió ni modificó. No se ejecutaron `docker:up`/
`docker:down`: el workflow de desarrollo Compose no cambió; se probó el runner
que sí afecta este RC. No se hizo deploy, push, ensayo remoto, revisión humana
ni trabajo de producto nuevo. El siguiente paso es STAGE-10.

El código y tests quedaron verificados antes de cerrar esta evidencia. Los
últimos cambios son documentación y un comentario del corpus; se revalidan
índices, master, formato y diff sin repetir el gate completo.
