# STAGE-09 — Fair mode, servidor autoritativo y ranking

## A. Veredicto

```text
STAGE-09 — FAIR MODE / AUTHORITATIVE SERVER / RANKING — DONE
```

El juego completo de STAGE-08 quedó envuelto en una competencia cuya integridad
se puede defender: el servidor emite cada intento, vuelve a jugar lo enviado,
recomputa FairScore y Prestige, y publica un ranking por mejor intento verificado
donde lo único que se ve de una persona es su alias.

No se tocó nada de la semántica del juego. Motor `10.0.0`, action log `7`,
snapshot `8`, ruleset `1.0.0-full-career`, contenido `5.5.0-grade-5`, catálogo
`grade-5-dev-6` y FairScore `2.0.0-post-tg1-candidate` quedan **idénticos**: la
partida perfecta sigue valiendo 10 000 exactos y el servidor llega a ese número
reproduciendo el log, no leyéndolo.

## B. Baseline de entrada

- HEAD de entrada: `a4fa7d8` — `docs(stage-08): close final integration and pacing stage`.
- STAGE-08 `DONE` en [etapa actual](current-stage.md); STAGE-09 `NEXT` en el
  [roadmap](implementation-sequence.md#stage-09-fair-mode-servidor-autoritativo-y-ranking).
- Baseline de tests: 96 archivos y 1898 tests de Vitest; 174 E2E de Playwright.
- Base de datos: una sola migración, `20260820000000_technical_foundation.sql`,
  sin tablas de producto. Todo el esquema de competencia es nuevo.

## C. Arquitectura

```text
SERVIDOR   emite y registra el intento (seed de la edición + runId propio)
   ↓
CLIENTE    juega local-first y registra comandos
   ↓
SERVIDOR   valida emisión y versiones → replay → FairScore + Prestige → ranking
```

La frontera de confianza es la que ADR-004 fijó y ADR-006 hace practicable: una
vez emitida la partida, el navegador juega sin hablar con el servidor —el Wi-Fi
de una escuela llena no aguanta un pedido por decisión— y el servidor decide al
final, reproduciendo.

El núcleo de verificación **no se reimplementó**. `src/server/game/validate-run.ts`
ya replayaba una submission no confiable, comprobaba versiones, revalidaba el
plan compuesto y calculaba su propio score; STAGE-09 lo compone y no lo duplica.
Lo que se agregó alrededor es la emisión, la identidad, la persistencia, la
idempotencia y el ranking.

### Capas

```text
src/app/api/competition/*        rutas finas: parsean y delegan
src/app/api/organizer/*
src/app/page.tsx                 el producto público, entero
src/app/organizer/page.tsx       la herramienta del docente

src/server/competition/          dominio: sin SQL, sin React, con reloj inyectado
  api.ts                         manejadores HTTP, probables sin levantar Next
  attempts.ts                    emisión, reanudación, envío, idempotencia
  participants.ts                registro y reingreso
  ranking.ts                     estado público
  organizer.ts                   acceso, correcciones, moderación, auditoría
  retention.ts                   anonimización
  dto.ts                         la frontera pública/privada, verificada por tipos
  editions.ts                    tupla de versiones → dependencias del motor
  identity.ts                    HMAC de identidad
  clock.ts · tokens.ts · rate-limit.ts · logging.ts · schemas.ts

src/server/persistence/competition/
  store.ts                       el puerto, escrito al nivel que Postgres garantiza
  supabase-store.ts              adaptador real
  memory-store.ts                segunda implementación real, no un mock

src/lib/competition/             reglas puras que el navegador y el servidor comparten
```

Las rutas quedan finas porque el árbol de decisiones —origen, límite de tasa,
sesión, competencia abierta— es el mismo en casi todas, y repetirlo ocho veces
es cómo se termina con una ruta que se olvidó de mirar la sesión.

## D. Unificación del producto público

**`/` es el producto.** Portada, explicación, estado de la competencia, ranking,
identificación, partida y resultado verificado son estados de una sola dirección.
No hay una URL por momento a propósito: una partida no es una página, y darle
dirección propia invitaría a compartirla, recargarla a la mitad y volver con el
botón de atrás en medio de una decisión.

El ranking vive en la portada. No se creó `/ranking`: una segunda ruta pública
para un podio de tres puestos agrega navegación sin agregar nada.

### Lo que dejó de ser público

| Antes | Ahora |
|---|---|
| `/jugar` — partida local de 7.º | `/dev/grade-7`, 404 fuera de desarrollo |
| `/dev/game-engine?seed=…&content=…` | sin cambios de acceso, y cerrado además cuando hay competencia |
| `/dev/design-system`, `/dev/teacher-gate` | ídem |

`/jugar` se movió, no se borró: el slice de 7.º es contenido real y su cobertura
vale. Lo que cambió es quién puede abrirlo. Con la competencia, una segunda
puerta pública que también dijera «jugar» sería una forma de jugar distinta de
la que se está puntuando —sin emisión, sin intento registrado, sin ranking— y el
producto público tiene que ser una sola cosa.

La compuerta de `/dev` ganó un tercer estado. Antes: abierta fuera de producción,
cerrada en producción salvo opt-in. Ahora, además: **en producción con una
competencia configurada no se abre, opt-in incluido**. El opt-in es una variable
de entorno y una variable de entorno se copia de un `.env` a otro; un despliegue
de feria con el harness encendido por arrastre no podría falsear un puntaje —la
emisión y la verificación siguen del lado del servidor— pero sí pondría una
pantalla que elige seed y contenido en la misma dirección donde los chicos están
compitiendo.

Ninguna prueba de competencia usa `/dev`. La suite de STAGE-09 entra por `/`.

Esa compuerta tiene una consecuencia que la suite de navegador tuvo que
reflejar: **las dos superficies no pueden convivir en el mismo proceso**. Un
despliegue con competencia no tiene `/dev`, así que Playwright levanta dos
servidores —uno sin competencia y con el harness abierto, para las suites de
contenido de STAGE-08; otro con la competencia configurada, para la de
STAGE-09— y cada proyecto apunta al suyo. Probar las dos contra un solo proceso
habría exigido relajar la compuerta, es decir, probar una configuración que
nadie va a desplegar.

## E. Identificación del participante

Cuatro campos, una pantalla:

```text
Alias                 público
Nombre y apellido     privado
DNI                   no se guarda: se deriva
Año o curso           privado, select derivado de la configuración
División              privado, sólo si la escuela la configura
```

No se piden correo, teléfono, domicilio, fecha de nacimiento, foto, género,
datos de salud, cuentas sociales ni datos de tutores. Ninguno hace falta para
decidir un premio.

El mismo formulario sirve para anotarse y para volver desde otro teléfono,
porque desde el lado del estudiante es la misma acción. El servidor los
distingue por la clave derivada del documento; el jugador no tiene que
acordarse de nada.

Decisiones de campo que importan y su razón:

- El documento es `type="text"` con `inputMode="numeric"`. Con `type="number"`
  la rueda del mouse cambia el valor sin que nadie lo toque, los ceros a la
  izquierda desaparecen y el navegador acepta `e` y `+`.
- `autoComplete="off"` en el documento: sin eso un gestor de contraseñas ofrece
  tarjetas de crédito en un campo numérico de ocho dígitos.
- La validación corre al salir del campo, no por tecla.
- Al enviar, el primer error recibe el foco.

### Reingreso

Si el documento ya está registrado **y el nombre coincide** —comparado sin
acentos ni caso, porque obligar a reproducir una tilde en un teclado de teléfono
es una barrera sin propósito—, se restaura la sesión y **se conserva el alias
original**: es la identidad pública que otros ya vieron en el ranking.

Si el nombre no coincide, el servidor no crea un duplicado y **no dice de quién
es el documento**. Las dos explicaciones posibles —un tipeo y alguien poniendo
el documento de otro— se ven idénticas desde el servidor, y decir cuál es
convertiría el formulario en un oráculo sobre quién se anotó. El jugador recibe
un pedido neutral de ayuda a un organizador.

La decisión completa, con su marco normativo, está en
[ADR-026](../03-architecture/adr/ADR-026-participant-identity-and-minor-privacy.md).

## F. Modelo de privacidad

### El documento se deriva, no se guarda

```text
identityHmac = HMAC-SHA-256(
  PARTICIPANT_IDENTITY_SECRET,
  `${competitionId}:${dniNormalizado}`
)
```

Se persisten la clave derivada y los **últimos cuatro dígitos**. Un DNI argentino
tiene del orden de 10⁸ valores: un hash rápido sin clave se recorre entero en
segundos, así que no sería una seudonimización sino el mismo dato escrito de otra
forma. El secreto vive fuera de la base. El id de la competencia entra en la
derivación para que la misma persona produzca claves distintas en dos ediciones.

### La frontera es un tipo, no una convención

```ts
PublicSafe<PublicLeaderboardEntry>   // no compila si aparece un campo privado
PrivateParticipant                    // sólo desde una ruta autenticada
```

La consulta pública lee la vista `competition_best_attempts`, que **no tiene** las
columnas privadas. El dato no viaja y después se oculta en React: no viaja.

### En la base

Cada tabla tiene RLS habilitada **sin una sola política**, los grants a `anon` y
`authenticated` están revocados explícitamente, y el único rol con acceso es
`service_role` —la clave secreta del BFF— con grants explícitos. El proyecto no
auto-expone entidades nuevas, así que una tabla agregada mañana nace inaccesible.

### En los logs

`CompetitionLogFields` es un tipo cerrado con nueve campos, todos opacos o
numéricos. No hay dónde poner un documento ni un nombre. Nadie escribe
`console.log(dni)`; sí escribe `console.log(submission)`, y por eso la función
de registro no acepta un objeto cualquiera.

### Retención

`EGRESADO_PRIVACY_RETENTION_DAYS` días después del cierre —120 por defecto— los
datos privados se anonimizan: se van nombre, año, división y últimos cuatro
dígitos; quedan el alias y el puntaje. La purga es explícita
(`pnpm competition:privacy:purge`, o una acción del organizador) y nunca
automática: purgar antes de verificar a los ganadores destruye la evidencia que
la retención existe para proteger.

### Configuración del responsable

Nombre, contacto y domicilio de la institución son configuración del despliegue
y se renderizan tal cual. Si falta alguno, la aplicación **falla con un error de
configuración**. Un aviso con una escuela inventada sería peor que no tener
aviso: le diría a un chico a quién reclamar y esa persona no existiría.

El control del formulario es un **reconocimiento de lectura**, no una
declaración de consentimiento: este código no puede afirmar que una tilde
resuelve la base legal del tratamiento.

## G. Modelo de datos

Migración `supabase/migrations/20260921000000_competition_fair_mode.sql`.

| Tabla | Para qué | Restricciones que hacen el trabajo |
|---|---|---|
| `competitions` | la edición: seed compartida, ventana, tupla congelada | `slug` único; ventana ordenada |
| `participants` | identidad pública y privada | `unique(competition_id, identity_hmac)`, `unique(competition_id, nickname_key)` |
| `participant_sessions` | continuidad, sin PII | `token_hash` único |
| `attempts` | cada partida, con sus versiones fijadas | `unique(participant_id, attempt_number)`, `run_id` único, **índice único parcial de un solo intento activo** |
| `organizer_sessions` | acceso del docente | `token_hash` único |
| `organizer_audit_log` | rastro de lo sensible | — |
| `rate_limit_counters` | ventana fija, contada en la base | PK `(bucket, window_start)` |

Vista `competition_best_attempts`: mejor intento verificado de cada participante
elegible, con `security_invoker` y sin ninguna columna privada. Es una vista y no
una tabla materializada porque materializar introduce un estado derivado que
puede quedar viejo justo cuando un organizador invalida un resultado — y la
medición dice que no hace falta (sección O).

Índices: `attempts_ranking_idx` parcial sobre `(competition_id, fair desc,
prestige desc)` donde `status='VERIFIED' and invalidated_at is null`;
`attempts_participant_idx`; `participants_competition_status_idx`.

### Por qué no hay transacciones explícitas

PostgREST no las ofrece, y no hacen falta: **cada operación que tiene que ser
atómica es una sola sentencia**. Un `insert` que choca contra un índice único
decide si un participante ya existe; un índice único parcial decide si ya hay
una partida en curso; un `update` con el estado esperado en el `where` decide
quién gana un doble envío; un `insert … on conflict do update` incrementa el
contador de tasa. La garantía la da la base, no el proceso — que es lo que
importa cuando hay más de una instancia.

## H. Ciclo de vida de la competencia

```text
DRAFT → UPCOMING → OPEN → CLOSED → ARCHIVED
```

`DRAFT` y `ARCHIVED` se presentan al público como `upcoming` y `closed`: son
estados de operación, y publicarlos contaría algo sobre el trabajo interno del
organizador en vez de sobre si se puede jugar.

La regla temporal, elegida y documentada porque no había decisión previa:

```text
empezar mientras la competencia está OPEN y dentro de [opensAt, closesAt)
enviar antes de closesAt + submissionGraceSeconds
```

La alternativa estricta —enviar antes del cierre, sin tolerancia— le saca el
resultado a quien empezó a las 17:52 una carrera de doce minutos, que no hizo
nada mal. La tolerancia es de la edición, se configura y se anuncia antes de
abrir. El reloj es el del servidor, inyectado como dependencia: no hay un
`Date.now()` suelto dentro de un servicio que pueda leer la hora del cliente.

Al cerrar, el ranking sigue siendo legible, no se pueden empezar partidas nuevas
y la exportación sigue disponible.

## I. Ciclo de vida del intento

**Emisión.** El servidor valida la sesión, comprueba la ventana, resuelve la
edición por su tupla exacta, recompone el plan desde la seed de la edición y
**verifica que la huella coincida con la congelada**; si una calibración se movió
después de abrir, no emite. Persiste el intento `STARTED` con las versiones
fijadas y devuelve el descriptor.

La seed es la de la **edición**, compartida por todos los intentos —decisión de
producto v1—, y lo único propio del intento es su `runId`. Dos participantes
reciben el mismo plan, las mismas variantes, la misma dificultad y el mismo
techo de oportunidades.

**Un solo intento activo.** Dos pestañas abiertas no son un ataque: son un
teléfono. El índice único parcial garantiza que haya a lo sumo una partida en
curso, y cuando choca el servicio devuelve la que existe en vez de crear una
paralela.

**Reanudación.** El servidor conserva la identidad del intento; el navegador
conserva el avance. El checkpoint está atado al id del intento **y** a la huella
del plan, comparados por canonicalización completa del descriptor. Un checkpoint
que no coincide no se adapta ni se migra: se descarta. Inventar avance sería
peor que perderlo, porque el servidor va a volver a jugar el log igual.

El motor pide un checkpoint al **resolver una situación**, no al pasar un beat
narrativo: un beat sin decisión no tiene avance que perder. La consecuencia
visible es que recargar en medio de la narración de un año vuelve a mostrar esa
narración. Es el contrato de STAGE-08 y no se tocó; lo que STAGE-09 agrega es
que el intento sigue siendo el mismo —recargar nunca abre una partida paralela—
y que el checkpoint restaurado tiene que corresponder a **esta** emisión.

**Envío e idempotencia.** El único dato del cliente que se lee es el log de
acciones. Un reenvío byte a byte devuelve el mismo resultado —se compara la
huella de la submission—; un segundo envío distinto sobre un intento ya cerrado
no reemplaza nada. Dos envíos simultáneos compiten por la misma fila en un
`update` condicionado por estado, y sólo uno la mueve.

## J. Qué no puede controlar el cliente

| El cliente afirma | Qué pasa |
|---|---|
| `score`, `fairScore`, `officialScore` | se ignora: no hay punto del camino donde se lea |
| `prestige`, `graduated`, `quality`, `variants` | ídem |
| otra `seed` | rechazado; el log no corresponde a la emisión |
| otra huella de plan | rechazado |
| otro `runId` | rechazado |
| `mode: practice` | rechazado |
| cualquier versión distinta de la fijada | `ATTEMPT_VERSION_UNSUPPORTED` |
| log truncado | no egresa: `REJECTED`, fuera del ranking |
| comando extra después del egreso | rechazado |
| transición imposible | rechazado |
| el intento de otra persona | `ATTEMPT_NOT_OWNED` |
| un log bueno bajo otro intento propio | rechazado: el `runId` es otro |
| envío sin sesión | `PARTICIPANT_SESSION_REQUIRED` |
| envío después de la tolerancia | `SUBMISSION_TOO_LATE` |
| su propia hora | no se lee: el reloj es del servidor |

Que el score se **ignore** en vez de rechazarse es deliberado y más fuerte:
rechazar por nombre obligaría a enumerar los nombres que alguien invente.

## K. Ranking

```text
1. FairScore descendente
2. PrestigeScore descendente
3. puesto compartido
```

Sin criterio terciario. Ni tiempo, ni orden de llegada, ni cantidad de intentos,
ni seed, ni alias. Un identificador estabiliza el dibujo entre empatados sin
tocar el puesto. No se suma Prestige a FairScore: 9 999 con 100 nunca supera a
10 000 con 0.

El puesto es «cuántos son estrictamente mejores, más uno»: con 100, 100, 90 y 80
los puestos son 1, 1, 3 y 4. Numerar 1, 1, 2, 3 diría que hay un segundo puesto
que nadie ganó.

Se publican los **tres primeros puestos**, no las tres primeras personas: un
empate en el podio entra entero. El puesto propio se ve siempre, en privado,
sea cual sea.

Rankea el **mejor intento verificado** de cada participante elegible. Un intento
peor posterior no reemplaza al mejor; uno rechazado, abandonado o invalidado no
entra; si el mejor se invalida, el siguiente pasa a ser el efectivo.

## L. Herramienta del organizador

`/organizer`, detrás de sesión propia. No contradice la regla de una sola puerta
pública: no es otra forma de jugar, no emite intentos y no aparece enlazada
desde ninguna pantalla de estudiante.

Puede: abrir y cerrar; ver quién está detrás de un alias —nombre, año, división
y últimos cuatro dígitos—; corregir un tipeo; ocultar un alias inapropiado sin
sacar el resultado del ranking; descalificar y reincorporar; invalidar y
restaurar un resultado; marcar la identidad de un ganador como verificada;
exportar CSV; anonimizar los datos privados.

No puede: ver un documento completo —no se guarda— ni editar la clave de
identidad. Una clave editable a mano deja de ser una identidad; un documento mal
tipeado se corrige borrando el registro y volviendo a anotarse.

Cada acción sensible exige un motivo y queda auditada con actor, acción, destino
y fecha. El registro guarda **qué campos** cambiaron, nunca sus valores: un log
con el nombre viejo y el nuevo sería una segunda copia del dato personal en un
lugar que nadie purga.

**Autenticación.** Credencial de despliegue con scrypt (`N = 2¹⁷`, `r = 8`,
`p = 1`), sesión opaca de ocho horas en cookie `HttpOnly`. No se adoptó Supabase
Auth: el repositorio no lo usa para nada y traerlo sólo para un usuario sería
superficie nueva alrededor del dato más sensible del sistema. El separador del
digest es `:` y no `$` porque los cargadores de `.env` expanden `$nombre` y
truncarían la credencial sin que nadie entienda por qué.

**Exportación.** CSV con lo que hace falta para entregar un premio. Sin clave de
identidad, sin tokens, sin IP, sin logs de acciones. El texto controlado por el
usuario se neutraliza contra inyección de fórmulas: un alias que empieza con
`=`, `+`, `-` o `@` lo ejecutaría la planilla al abrirla, y el alias es texto de
un chico de trece años probando qué pasa.

## M. Seguridad y abuso

- **Origen.** Cookies `SameSite=Lax` —que ya no viajan en un POST cruzado— más
  comprobación de `Origin` contra el host que atendió. Un pedido sin `Origin` se
  acepta sólo si tampoco trae cookie, así que nunca actúa en nombre de nadie.
- **Límite de tasa.** Ventana fija contada en Postgres, no en memoria del
  proceso: en serverless N instancias multiplicarían el límite por N justo
  cuando la ráfaga lo hace importar. Registro 12/10 min, emisión 20/5 min, envío
  40/5 min, acceso de organizador 10/15 min. Calibrado para no tocar una ráfaga
  legítima —treinta personas empezando a la vez porque el organizador dijo
  «ya»— y sí tocar lo que no se parece a una persona. La clave del balde es un
  digest de la dirección, nunca la dirección.
- **Restricciones de dominio** que hacen la mayor parte del trabajo: una
  identidad por documento y edición, un alias por edición, un intento activo por
  participante, envío idempotente.
- **Validación.** Zod en cada frontera. Los cuerpos de identidad y de acción de
  organizador son `.strict()`: un campo de más se rechaza en vez de ignorarse en
  silencio. El log de acciones entra como `unknown` y lo valida el codec del
  motor, que es quien sabe qué comandos existen; se acota el tamaño antes
  (256 KiB).
- **Respuestas.** `cache-control: no-store` en todo lo de competencia: una
  respuesta cacheada por un intermediario compartido podría mostrarle a un
  jugador el «vos» de otro.

La matriz completa, con su resultado, está en la sección J y en
`tests/integration/competition-attack.test.ts`.

## N. Tests

`pnpm verify` **en verde**, con la base local levantada:

```text
Vitest     108 archivos · 2135 tests · 0 todo
Cobertura  statements 85,50 % · branches 77,20 % · functions 87,57 % · lines 85,70 %
Playwright 218 tests en cuatro proyectos (harness y competencia × desktop y mobile)
```

La baseline de entrada era 96 archivos / 1898 tests de Vitest y 174 E2E. El
delta —12 archivos, 237 tests y 44 E2E— es íntegramente de esta etapa.

Los gates de contenido confirman que **la semántica del juego no se movió**:

```text
pnpm game:score          perfecto = 10000 exacto · spread 0 · 0 empates de redondeo
pnpm game:simulate:deep  5000 / 5000 egresadas · 0 hallazgos · peor caso 1 Repaso
pnpm game:blind-audit    sin cambios; y5.stage-screen sigue en K 78,0 · S 40 %
pnpm game:pacing         mediana 12,25–13,83 min sobre 125 carreras, como en STAGE-08
```

| Suite | Qué prueba |
|---|---|
| `tests/unit/competition-identity.test.ts` | normalización de documento y nombre, HMAC, alias, tokens, scrypt |
| `tests/unit/competition-ranking.test.ts` | comparador, puestos compartidos, corte por puesto |
| `tests/unit/competition-privacy.test.ts` | frontera pública/privada, CSV, campos de log, aviso |
| `tests/unit/competition-config.test.ts` | entorno, configuración del responsable, registro de ediciones |
| `tests/unit/development-harness-gate.test.ts` | la compuerta de `/dev`, con su tercer estado |
| `tests/integration/competition-store.test.ts` | el contrato del puerto, contra memoria **y** Postgres |
| `tests/integration/competition-lifecycle.test.ts` | identidad, emisión, ventana, envío, idempotencia, mejor intento |
| `tests/integration/competition-attack.test.ts` | la matriz de ataque |
| `tests/integration/competition-organizer.test.ts` | acceso, correcciones, moderación, auditoría, exportación, purga |
| `tests/integration/competition-performance.test.ts` | escala de feria medida |
| `tests/e2e/competition.spec.ts` | el producto entero desde `/` |

Las carreras de las suites de integración se **juegan**: nueve beats en seis
años, con las respuestas que producen los witnesses de autoría. Un log inventado
probaría que el servidor acepta lo que el test escribió; una carrera jugada
prueba que acepta lo que el juego produce.

El store en memoria **no es un mock**: es una segunda implementación real, y la
suite de contrato corre contra las dos. Si una garantía existe sólo en una, la
suite lo dice — así apareció, por ejemplo, que Postgres y memoria deletreaban
las fechas distinto.

## O. Rendimiento

Escenario: **500 participantes con tres intentos verificados cada uno**, 1500
intentos, sobre Postgres local.

```text
aislado                    mediana  7 ms · peor  9 ms
con la suite en paralelo   mediana 43 ms · peor 67 ms
carga de los 1500 intentos 19–46 s según la carga de la máquina
```

Se reportan las dos porque miden cosas distintas: la aislada es el costo de la
consulta, la otra es lo que se ve cuando la máquina está haciendo algo más. Las
dos están dos órdenes de magnitud por debajo de lo que un refresco de veinte
segundos necesita.

Sin caché, sin tabla materializada y sin infraestructura distribuida. La
consulta del mejor intento es un `distinct on` sobre un índice parcial y el
puesto se calcula sobre 500 filas. La medición es lo que permite decir que no
hace falta materializar, en vez de suponerlo.

## P. Accesibilidad

Todo lo nuevo usa el sistema de diseño existente; no se introdujo un segundo
lenguaje visual. El único componente agregado es `SelectField`, un `<select>`
nativo —teclado, lector de pantalla y la rueda del sistema operativo en un
teléfono— con opción vacía obligatoria, para que el formulario no responda por
el estudiante.

Verificado con axe (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`) sobre la
portada y el formulario a 360 px, sin violaciones; sin desborde horizontal; el
formulario se alcanza tabulando, sin foco programático; cada error queda
asociado por `aria-describedby` y anunciado con `role="alert"`; el ranking es una
lista ordenada con el puesto dibujado como número, porque un empate comparte
puesto y sin el número la segunda fila parecería un segundo lugar.

## Q. Riesgos que quedan

1. **Alguien escribe el documento de otra persona.** El sistema no lo puede
   detectar. Lo que hace es impedir el duplicado, no filtrar información sobre
   el registro existente y dejarle el caso a un organizador con rastro auditado.
   Es un riesgo de la feria, no del software.
2. **El secreto de identidad no se puede rotar dentro de una edición abierta.**
   Rotarlo invalida todas las claves derivadas. Entre ediciones no cuesta nada.
   Documentado en `.env.example` y en ADR-026.
3. **La política de score sigue siendo candidata.** `fair-score-dev-2` es
   `official: false` y oficializarla es FREEZE, no esta etapa. La competencia
   corre con la calibración que la edición fija, sea cual sea.
4. **El techo de Prestige ofrecido sigue en 0** (D-S08-084). La maquinaria
   existe, el servidor la recomputa y el ranking la usa como segundo criterio;
   lo que falta es contenido que ofrezca oportunidades, que es decisión de
   producto y no de esta etapa.
5. **La lista de aliases bloqueados es corta y deliberada.** No es un servicio de
   moderación. Lo que se escape lo resuelve un organizador ocultando el alias,
   que es la herramienta correcta para un juicio que ninguna lista automatiza.
6. **El límite de tasa falla abierto** si el contador no está disponible. La
   alternativa —dejar a toda la feria afuera por una tabla auxiliar— es peor, y
   las restricciones de dominio siguen en pie.

## R. Próximo gate

```text
STAGE-08   DONE
STAGE-09   DONE

GATE-TG2 — Teacher Gate 2                  NEXT · externo, no es ingeniería
Revisión del Departamento de Matemática    DIFERIDA a Final Delivery (D-S08-095)
Sign-off manual de la rueda                PENDIENTE · humana
Pacing empírico con jugadores              PENDIENTE · humana
FREEZE                                     después de TG2
STAGE-10 — Production hardening            después de FREEZE
```

Esta etapa **no** ejecuta Teacher Gate 2 ni la revisión humana de Matemática, y
no oficializa la configuración de competencia: congelarla es FREEZE. El
despliegue final y el hardening son STAGE-10; lo que STAGE-09 deja es una
aplicación desplegable —build de producción, migración, validación de entorno,
bootstrap de base, de competencia y de organizador— no desplegada.
