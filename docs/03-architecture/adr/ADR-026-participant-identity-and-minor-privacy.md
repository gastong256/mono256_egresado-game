# ADR-026 — Identidad de participante y privacidad de menores en competencia

- Estado: Aceptado
- Fecha: 2026-09-21
- Supersede parcialmente: [ADR-008](ADR-008-anonymous-identity.md)
- Relacionado: [ADR-004](ADR-004-server-authoritative-scoring.md) · [ADR-005](ADR-005-postgres-supabase.md) · [ADR-009](ADR-009-event-leaderboards.md)

## Contexto

ADR-008 fijó para el MVP una identidad anónima: player UUID, nickname moderado
y cookie, sin apellido, correo ni fecha de nacimiento. Esa decisión sigue siendo
correcta para lo que resolvía —un juego local sin premios— y el propio ADR
anticipó su límite: «si se agregan cuentas futuras se requiere ADR nuevo de
identidad/privacidad».

STAGE-09 agrega un requisito que ADR-008 no contemplaba y que no se puede
satisfacer con un seudónimo suelto: **la institución tiene que poder saber a
quién le entrega un premio**. Un ranking de alias no dice quién es «Sofi23», y
dos personas pueden elegir aliases parecidos. El modo feria ya preveía esta
tensión y dejaba la puerta abierta —«se evita nombre completo, salvo que la
institución lo requiera y lo gobierne»—, además de preferir «un mapeo externo
controlado por el organizador».

Ese mapeo externo se evaluó y se descartó por una razón operativa concreta: una
planilla aparte que asocie alias con nombres es una copia de datos personales
sin control de acceso, sin auditoría y sin fecha de borrado, sostenida por
quien la haya creado. El dato existe igual; lo único que cambia es que nadie lo
protege.

Los participantes son estudiantes de secundaria y en su mayoría menores de edad.

## Decisión

Se implementa identificación de participante **dentro** del producto, con
minimización agresiva y una frontera pública/privada verificada por tipos y por
tests.

### Qué se pide, una sola vez

```text
Alias                 público
Nombre y apellido     privado
DNI                   no se guarda; se deriva
Año o curso           privado
División              privado, sólo si la escuela la configura
```

**No** se piden correo, teléfono, domicilio, fecha de nacimiento, foto, género,
datos de salud, cuentas sociales ni datos de madres, padres o tutores. Ninguno
hace falta para decidir un premio, y cada uno sería un dato de un menor guardado
sin propósito.

La división es configurable y está ausente por defecto: una escuela que no la
necesita para distinguir estudiantes no debería pedirla.

### El alias es lo único público

El ranking muestra alias, puntaje y puesto. Nada más. No hay curso, ni edad, ni
nombre legal, ni contacto, ni marca de tiempo que permita perfilar a alguien.

La frontera no es una convención: los tipos públicos **no tienen un campo** donde
poner un dato privado, y `PublicSafe<T>` falla la compilación si alguien agrega
uno. La consulta pública lee una vista que no contiene las columnas privadas, así
que el dato no viaja y después se oculta en React — no viaja.

### El DNI se deriva, no se guarda

```text
participantIdentityKey = HMAC-SHA-256(
  PARTICIPANT_IDENTITY_SECRET,
  `${competitionId}:${dniNormalizado}`
)
```

Se persisten la clave derivada y los **últimos cuatro dígitos**. El número
completo no queda en ninguna fila, ningún log, ninguna respuesta y ningún
checkpoint del navegador.

Por qué HMAC con secreto y no SHA-256 a secas: un DNI argentino tiene del orden
de 10⁸ valores posibles. Un hash rápido sin clave se recorre entero en segundos,
así que un digest sin clave **no es una seudonimización** — es el mismo dato
escrito de otra forma. El secreto vive fuera de la base, así que quien obtenga
una copia de la base no puede deshacerlo.

Por qué entra el id de la competencia: la misma persona en dos ediciones produce
claves distintas. Dos bases no se pueden cruzar para reconstruir un historial
que nadie pidió. Es minimización por construcción, no por política.

Por qué se conservan los últimos cuatro dígitos: son lo que permite que un
docente, con nombre, año y alias a la vista, confirme en persona que quien
reclama el premio es quien jugó — sin retener el documento completo para eso.

### El documento identifica; no autentica

Saber un DNI no es saber una contraseña. La sesión que se emite da
**continuidad** —«seguís siendo vos entre partidas»— y nunca es prueba de
identidad para entregar un premio. La verificación del ganador la hace una
persona, presencialmente, y queda registrada.

De ahí sale la respuesta ante un conflicto: si el documento ya está registrado
con otro nombre, el servidor **no crea un duplicado y no dice de quién es**.
Devuelve un pedido neutral de ayuda a un organizador, porque las dos
explicaciones posibles —un tipeo y alguien poniendo el documento de otro— se ven
idénticas desde el servidor, y sólo una persona puede distinguirlas. Decir cuál
es convertiría el formulario en un oráculo sobre quién se anotó.

### Sesiones

Token opaco de 32 bytes, cookie `HttpOnly`, `Secure` en producción,
`SameSite=Lax`, treinta días, revocable. En la base se guarda el SHA-256 del
token, no el token: quien lea la tabla de sesiones no puede hacerse pasar por
nadie. La cookie no lleva alias, ni id de participante, ni ninguna afirmación
que el cliente pueda leer o alterar.

### Retención

Los datos privados se conservan hasta `EGRESADO_PRIVACY_RETENTION_DAYS` días
después del cierre —120 por defecto— y después se anonimizan: se van nombre,
año, división y últimos cuatro dígitos; quedan el alias y el puntaje, que no
identifican a nadie y dejan el ranking legible el año siguiente.

La purga es una operación explícita (`pnpm competition:privacy:purge` o una
acción del organizador) y no un trabajo automático, porque purgar antes de
verificar a los ganadores destruye la evidencia que la retención existe para
proteger.

### Configuración del responsable

El nombre de la institución, su contacto y su domicilio son configuración del
despliegue y se renderizan tal cual en el aviso. Si falta alguno, la aplicación
**falla con un error de configuración** en vez de mostrar un aviso incompleto.
Un aviso con una escuela inventada sería peor que no tener aviso: le diría a un
chico a quién reclamar, y esa persona no existiría.

El control del formulario es un **reconocimiento de lectura**, no una
declaración de consentimiento. Este código no puede afirmar que una tilde
resuelve la base legal del tratamiento; eso lo define la institución.

## Marco al que responde

Esto es ingeniería de privacidad por diseño, no asesoramiento legal, y se opera
bajo la política de la institución responsable. El diseño se hizo mirando:

- **Ley 25.326, art. 4** — datos adecuados, pertinentes y no excesivos; sin uso
  incompatible; destrucción cuando dejan de ser necesarios. De ahí salen la
  lista corta de campos, la ausencia de correo y fecha de nacimiento, el HMAC
  por competencia y la retención con fecha.
- **art. 6** — información previa, clara y expresa sobre finalidad,
  destinatarios, responsable y derechos. De ahí sale el aviso en dos capas antes
  del primer envío, con el responsable configurado y no inventado.
- **art. 9 y 10** — seguridad y confidencialidad. De ahí salen RLS sin políticas
  sobre cada tabla, grants explícitos sólo a la clave del servidor, tokens
  hasheados, credencial del organizador con scrypt y auditoría de cada acceso
  sensible.
- **Guía de la AAIP sobre niñas, niños y adolescentes en entornos digitales** —
  de ahí salen la minimización agresiva y que el ranking no publique curso,
  edad, nombre ni ningún dato que permita ubicar a un chico fuera del juego.
- **OWASP** — de ahí salen los parámetros de scrypt y la decisión de no usar un
  hash rápido sin clave sobre un identificador de baja entropía.

## Consecuencias

- La institución puede identificar a un ganador sin que el producto publique
  nada de él, y sin que exista una planilla paralela fuera de control.
- Una copia de la base no revela documentos: sin el secreto, las claves
  derivadas no se invierten.
- Rotar `PARTICIPANT_IDENTITY_SECRET` invalida todas las claves de esa edición,
  así que **no se rota durante una competencia abierta**. Entre ediciones no
  cuesta nada: las claves viejas no se vuelven a consultar.
- Un documento mal tipeado no se corrige editando la clave —una clave editable a
  mano deja de ser una identidad— sino borrando el registro y volviendo a
  anotarse. La operación queda documentada y auditada.
- Dos personas con el mismo nombre no se fusionan: la deduplicación es por
  documento y sólo por documento. Un parecido de nombres nunca une dos
  registros.
- Persiste el riesgo, inherente a la feria, de que alguien escriba el documento
  de otra persona. El sistema no lo puede detectar; lo que hace es impedir el
  duplicado, no filtrar información sobre el registro existente y dejarle el
  caso a un organizador con un registro auditado.
