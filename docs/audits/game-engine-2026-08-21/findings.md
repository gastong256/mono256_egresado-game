# Hallazgos — auditoría del motor de juego

Base: [baseline.md](baseline.md). HEAD auditado `9f9808f`.

El baseline está verde, así que la auditoría se dirigió deliberadamente a lo que los gates no observan. Cada hallazgo tiene evidencia ejecutada, no lectura de código.

## Resumen

| ID | Sev | Categoría | Hallazgo | Impacto | Corrección |
|---|---|---|---|---|---|
| ENG-DET-001 | P1 | Determinismo | Los separadores del direccionamiento de RNG son bytes de control crudos (U+0000/U+0001) escritos literalmente en el fuente | Invisibles en cualquier editor; una normalización accidental cambia en silencio la semántica de replay de todas las runs guardadas | Escaparlos explícitamente y fijar el contrato con un test de vectores |
| ENG-STATE-001 | P1 | Modelo de estado | `restoreSnapshot` acepta estados válidos por schema pero imposibles (fase sin su payload) | Una run restaurada queda sin poder avanzar; sólo admite abandono | Invariantes estructurales verificadas en la frontera de restauración |
| ENG-SEC-001 | P2 | Trust boundary | Los constructores branded son casts sin verificación; `isSeed`/`isIdentifier` nunca se llaman | El charset del que depende el direccionamiento de RNG no está garantizado en entradas no confiables | Parseo real en la frontera + charset en los schemas |
| ENG-VER-001 | P2 | Versionado | Nada liga la versión de ruleset/contenido al comportamiento real | Cambiar una constante de política deja la versión intacta: runs viejas se reproducirían contra reglas nuevas | Fingerprint del ruleset y del contenido, verificado en tests |
| ENG-MATH-001 | P2 | Corrección numérica | `toNumber` hace `Number(n)/Number(d)`: NaN/Infinity fuera del rango double | El valor llega a `clamp01`, que lanza `EngineInvariantError`: un caso numérico se convierte en caída del motor | Conversión robusta por escalado exacto |
| ENG-SRV-001 | P2 | Autoridad de score | Ningún módulo de servidor ejercita el motor; la capacidad de ADR-004 no existe ni se prueba | La propiedad central "el servidor recalcula el score" no está demostrada | Caso de uso server-only de validación + tests |
| ENG-TEST-001 | P2 | Cobertura de invariantes | El determinismo entre Node y browser está documentado pero no probado | Una divergencia de runtime pasaría inadvertida | Test cross-runtime con valores fijados en Node |
| ENG-DOC-001 | P3 | Drift documental | ADR-012 y un comentario de test afirman separadores "espacio y `#`" | La documentación describe un contrato que no es el implementado | Corregir ADR y comentario |
| ENG-DEAD-001 | P3 | Código muerto | 6 exports nunca usados y 3 internos innecesariamente públicos | Superficie pública mayor que la real | Eliminar o reducir a interno |
| ENG-UI-001 | P3 | Robustez de UI | La tarjeta final se dibuja con score 0 y "sin perfil" si falta `completion` | Muestra un resultado inventado ante un estado imposible | Tratarlo como estado imposible, no como dato |

P0: ninguno. Todos los hallazgos fueron remediados y verificados; el detalle de la evidencia está en [final-audit.md](final-audit.md).

---

## ENG-DET-001 — separadores de RNG como bytes de control crudos

```text
Severidad: P1     Confianza: Alta     Categoría: Determinismo
Estado: Verificado (ver final-audit.md)
```

### Evidencia

`hexdump` de `src/game/random/seed.ts`, función `encodeRngPath`:

```text
2e 6a 6f 69 6e 28 27 00  27 29   .join('<NUL>')
72 65 74 75 72 6e 20 60 24 7b 73 65 65 64 7d 01   return `${seed}<SOH>
```

Los separadores son los bytes `0x00` y `0x01` escritos **literalmente** en el archivo, no como secuencias de escape. `sed` los muestra como espacio; sólo `cat -A` y `hexdump` revelan qué son.

Un probe de colisiones confirma que el esquema **funciona**: `encode("a",["b"]) = "aU+0001b"` frente a `encode("ab",[]) = "abU+0001"`, sin colisión en la junta seed/path, en la junta entre segmentos ni con espacios dentro del seed.

### Expected

El contrato de direccionamiento de substreams —del que depende la reproducibilidad de toda run guardada— debe ser legible y no debe poder perderse por accidente.

### Actual

Está codificado en bytes invisibles. Cualquier operación rutinaria que normalice caracteres de control —un formateador, un editor, un `sed`, un copy/paste, una migración de encoding— cambia silenciosamente la dirección de cada substream y, con ello, el contenido generado de todas las runs históricas. No hay ningún test que detecte esa pérdida: los golden tests fallarían, pero sin explicar la causa.

### Root cause

El separador se eligió correctamente pero se materializó como byte crudo en lugar de escape explícito, y el contrato no está fijado por ningún vector de prueba.

### Remediación

Escribir los separadores como `'U+0000'` / `'U+0001'`, documentar por qué se eligieron esos caracteres, y fijar el contrato con vectores conocidos `(seed, path) -> dirección` y `-> seed derivado`.

### Criterios de aceptación

- El fuente no contiene bytes de control fuera de tab/newline.
- Existe un test de vectores que falla si cambia la codificación o el hash.
- Los golden replays siguen pasando sin cambios (la salida no debe moverse).

Módulos: `src/game/random/seed.ts`. ADR: actualizar ADR-012. 

---

## ENG-STATE-001 — la restauración acepta estados imposibles

```text
Severidad: P1     Confianza: Alta     Categoría: Modelo de estado / trust boundary
Estado: Verificado (ver final-audit.md)
```

### Evidencia

Mutando un snapshot válido y restaurándolo:

| Mutación | Restauración | Comandos admitidos |
|---|---|---|
| `phase=challenge`, `activeEvent.challenge=null` | **aceptada** | sólo `ABANDON` |
| `phase=challenge`, `activeEvent=null` | **aceptada** | sólo `ABANDON` |
| `phase=narrative`, `activeEvent=null` | **aceptada** | sólo `ABANDON` |
| `phase=feedback`, `pendingFeedback=null` | **aceptada** | `CONTINUE` avanza, pero la UI dibuja una tarjeta narrativa |
| `status=completed`, `completion=null` | **aceptada** | ninguno |

### Expected

Un snapshot corrupto debe ser rechazado con `corrupted-snapshot`. `game-engine.md` dice que el codec "valida agresivamente y rechaza lo que no reconoce".

### Actual

El schema valida cada campo por separado pero no la **correlación** entre `phase`/`status` y su payload obligatorio. `RunState` es un registro plano con campos opcionales independientes, de modo que la fase y su carga pueden contradecirse. Restaurado ese estado, `transition` rechaza correctamente cada comando —no hay corrupción de resultado— pero la run queda sin ninguna vía de progreso.

### Root cause

La correlación fase↔payload es un invariante del dominio que no está expresado ni en el tipo ni en el validador de la frontera.

### Remediación

Añadir invariantes estructurales explícitas (`phase='challenge'` exige un desafío activo; `feedback` exige `pendingFeedback`; `narrative` exige `activeEvent`; `completed` exige `completion`; los índices no pueden contradecir la historia) y hacer que `restoreSnapshot` rechace con `corrupted-snapshot`.

Se consideró convertir `phase` en unión discriminada que lleve su payload. Se descarta en esta ola: obliga a cambiar el formato persistido y a tocar transición, selectores y UI, mientras que el defecto real está en una única frontera de confianza. La alternativa queda documentada.

### Criterios de aceptación

- Cada mutación de la tabla anterior es rechazada como `corrupted-snapshot`.
- Un snapshot legítimo sigue restaurándose sin cambios.
- Property test: todo estado alcanzable por juego real satisface las invariantes.

Módulos: `src/game/runs/snapshot.ts`, `src/game/runs/state.ts`.

---

## ENG-SEC-001 — identificadores sin parseo real en la frontera

```text
Severidad: P2     Confianza: Alta     Categoría: Trust boundary
Estado: Verificado (ver final-audit.md)
```

### Evidencia

```text
"has space" isSeed=false -> ACCEPTED by createRng
"has#hash"  isSeed=false -> ACCEPTED by createRng
""          isSeed=false -> ACCEPTED by createRng
"emoji🙂"   isSeed=false -> ACCEPTED by createRng
parseActionLog(seed="seed with space") ok=true
```

`toRunSeed`, `toChallengeId`, `toStoryletId`, etc. son casts sin verificación. `isSeed` e `isIdentifier` existen, están testeados… y **nunca se llaman desde código de producción**.

### Expected

`branded.ts` declara que los parsers "son la única vía sancionada para entrar al espacio branded" y que se usan "en fronteras de confianza".

### Actual

Son casts. El charset del que depende el direccionamiento de RNG (ENG-DET-001) no está garantizado para ninguna entrada no confiable: ni el action log ni el snapshot restringen el seed más allá de la longitud.

### Impacto

Un seed con bytes de control desplaza la frontera del direccionamiento y puede hacer que dos substreams distintos coincidan. El atacante sólo puede hacerlo sobre sus propias runs —no permite forjar el resultado de otro jugador— pero rompe una garantía documentada y deja un invariante crítico sin dueño.

### Remediación

Convertir `toRunSeed`/`toXId` en parsers que devuelvan `Result` en la frontera, mantener un constructor interno sin verificación para uso ya probado, y aplicar el charset en los schemas de action log y snapshot.

### Criterios de aceptación

- Un seed o identificador fuera del charset es rechazado por `parseActionLog` y por `restoreSnapshot`.
- `isSeed`/`isIdentifier` tienen consumidores de producción.

Módulos: `src/game/core/branded.ts`, `runs/action-log.ts`, `runs/snapshot.ts`.

---

## ENG-VER-001 — la versión no está ligada al comportamiento

```text
Severidad: P2     Confianza: Alta     Categoría: Versionado / compatibilidad
Estado: Verificado (ver final-audit.md)
```

### Evidencia

```text
ruleset version   : 0.1.0-dev
scoring policy id : development-scoring-v1
stage event budget: 2,2,2,2,2,2,1
-> nada liga esto a la cadena de versión
```

### Expected

`game-engine.md` fija que un cambio de política exige subir la versión de ruleset, y que una run sólo puede revalidarse con el mismo triple de versiones.

### Actual

La regla existe sólo como instrucción para humanos. Cambiar un factor de calidad dentro de `development-scoring-v1` deja la versión en `0.1.0-dev`; `assertCompatibleVersions` seguiría aceptando snapshots viejos y los reproduciría contra las reglas nuevas. Los golden replays fallarían, pero regenerarlos es un comando y no fuerza ninguna decisión de versión.

### Remediación

Calcular un **fingerprint** determinista del ruleset (identidades de política, configuración de etapas, pacing) y del content set (ids, etapas, dificultad, pools), y fijarlo en un test contra la versión declarada. Cambiar comportamiento sin subir versión rompe ese test con un mensaje que nombra la decisión pendiente.

### Criterios de aceptación

- Modificar una constante de política o el content set hace fallar el test de fingerprint.
- El mensaje de fallo indica qué versión hay que subir.

Módulos: `src/game/ruleset/`, `src/game/content/`, tests.

---

## ENG-MATH-001 — `toNumber` produce NaN/Infinity

```text
Severidad: P2     Confianza: Alta     Categoría: Corrección numérica
Estado: Verificado (ver final-audit.md)
```

### Evidencia

```text
toNumber(10^400 / (3*10^400+1))  => NaN
toNumber(10^200 * 10^200)        => Infinity
clamp01(NaN)                     => THROWS EngineInvariantError
```

`Number(10n**400n)` es `Infinity`; `Infinity/Infinity` es `NaN`.

### Expected

`toNumber` está documentado como conversión de presentación y alimenta `precisionFromDistance` y `efficiencyFromUsage`, cuyos resultados pasan por `clamp01`. `clamp01` trata un valor no finito como invariante rota y **lanza**.

### Actual

Un racional fuera del rango double convierte un caso numérico de borde en una caída del motor (`EngineInvariantError`), no en un rechazo tipado. Con el contenido actual no es alcanzable —los valores están acotados— pero es una primitiva fundacional que todo desafío futuro usará, y la aritmética racional no acota magnitudes por construcción.

### Remediación

Implementar `toNumber` por división escalada sobre `bigint` (cociente exacto + fracción con precisión fija), de modo que cualquier racional finito produzca un double finito, saturando explícitamente sólo si el valor realmente excede el rango double.

### Criterios de aceptación

- `toNumber` devuelve un valor finito para racionales de magnitud arbitraria dentro del rango double.
- Property test sobre magnitudes extremas sin excepciones.

Módulos: `src/game/math/rational.ts`.

---

## ENG-SRV-001 — la autoridad de score no está implementada ni probada

```text
Severidad: P2     Confianza: Alta     Categoría: Autoridad de resultado
Estado: Verificado (ver final-audit.md)
```

### Evidencia

```text
grep "@/game" src/server/  ->  sin resultados
```

### Expected

ADR-004: el cliente envía acciones y el servidor las reproduce para calcular score y perfil oficiales. `game-engine.md` afirma que el motor "corre igual en browser y en Node" y que un caso de uso server-side "recibe descriptor + action log y obtiene estado final, score y perfil validados".

### Actual

Ningún módulo de `src/server` importa el motor. La propiedad central de ADR-004 no tiene implementación ni prueba: sólo la afirmación de que sería posible. El motor se ejecuta bajo Node en los tests, pero nunca detrás de la frontera `server-only` que un endpoint real usaría.

### Remediación

Añadir un caso de uso `server-only` que reciba descriptor + action log, ejecute replay y devuelva un resultado validado con rechazos tipados. No implementar endpoints ni persistencia: la frontera y su prueba son lo que cierra el hallazgo.

### Criterios de aceptación

- Existe un caso de uso server-only que valida una run por replay.
- Test: una run jugada valida; un action log manipulado (score inflado, acción extra, secuencia rota) se rechaza.
- El resultado del servidor no confía en ningún dato calculado por el cliente.

Módulos: `src/server/`, tests de integración.

---

## ENG-TEST-001 — determinismo entre runtimes sin prueba

```text
Severidad: P2     Confianza: Alta     Categoría: Cobertura de invariantes
Estado: Verificado (ver final-audit.md)
```

### Evidencia

El E2E actual compara el harness **consigo mismo** entre recargas. No compara la salida del browser contra la de Node.

Verdad calculada en Node para `seed=e2e-alpha`:

```text
evento 0: dev.welcome        (narrativa, "Primer día")
evento 1: dev.class-photo    (narrativa)
evento 2: dev.notebook       -> dev.notebook-discount
          instancia year-1:2:dev.notebook-discount
          primera opción "20 % de descuento"
```

### Remediación

Fijar esos valores en el E2E, de modo que el browser deba reproducir exactamente lo que Node calcula.

### Criterios de aceptación

- El E2E falla si el browser diverge del resultado calculado en Node.

Módulos: `tests/e2e/`.

---

## ENG-DOC-001 — drift sobre los separadores de RNG

```text
Severidad: P3     Confianza: Alta     Categoría: Documentación
Estado: Verificado (ver final-audit.md)
```

ADR-012 afirma: *"Los separadores (espacio y `#`) están excluidos del charset"*. El comentario de `tests/unit/engine-core.test.ts` dice lo mismo. La implementación usa U+0000 y U+0001. Corregir ambos junto con ENG-DET-001.

---

## ENG-DEAD-001 — exports sin uso

```text
Severidad: P3     Confianza: Alta     Categoría: Mantenibilidad
Estado: Verificado (ver final-audit.md)
```

Nunca referenciados: `SequenceNumber`, `toSequenceNumber`, `emptyBreakdown`, `developmentQualityFactor`, `requiredLitresFor`, `ONE`, `DIFFICULTY_LEVELS`.

Públicos sin necesidad (sólo uso interno): `encodeRngPath`, `applyEffect`, `currentStageIndex`.

`RNG_ALGORITHM` está declarado como identidad del algoritmo y no lo consume nadie: debe usarse en el fingerprint de versión o eliminarse.

---

## ENG-UI-001 — tarjeta final con datos inventados

```text
Severidad: P3     Confianza: Alta     Categoría: Robustez de UI
Estado: Verificado (ver final-audit.md)
```

`GameShell` dibuja `state.run.completion?.totalScore ?? 0` y `?? 'sin perfil'`. Ante el estado imposible de ENG-STATE-001 muestra un resultado que no ocurrió. Debe tratarse como estado imposible, no como dato ausente con valor por defecto.

---

## Verificado y sin defecto

Registrado para que la auditoría sea honesta sobre su alcance.

| Área | Evidencia |
|---|---|
| Corrección de evaluadores | Oráculo independiente sobre el mural: 480 verificaciones, 0 discrepancias. Todos los desafíos: exactamente un óptimo por instancia, 0 evaluaciones no deterministas |
| Distribución de calidades | Cada desafío produce las calidades que declara; el de encuesta exige datos consultados para llegar a `optimal` (comportamiento correcto, no defecto) |
| Prototype pollution | Un snapshot con `__proto__` en `flags` se restaura sin la clave y sin contaminar `Object.prototype` — Zod la descarta |
| Contaminación del bundle | Las fixtures de desarrollo quedan sólo en el chunk de `/dev/game-engine`; `/` está limpia |
| Rendimiento | Construir la vista pública: 12 µs. Intentos de generación: 1.00–1.41 promedio, máximo 5 |
| Ciclos de import | 0, incluyendo aristas type-only |
| Nondeterminismo prohibido en el core | 0 ocurrencias reales de `Math.random`, reloj, DOM, red, storage o `process` |
| Fronteras React/Next | Ningún componente calcula reglas; `use client` sólo en `src/components`; guardas `server-only` en su sitio |
| Reduced motion | Manejado en `globals.css` |
| Transiciones inválidas | Responder fuera de fase, dos veces, a instancia obsoleta o con forma equivocada: todas rechazadas con tipo |
| Deuda declarada | 0 `TODO`/`FIXME`/`HACK`, 0 tests skipped, 0 `any` |
