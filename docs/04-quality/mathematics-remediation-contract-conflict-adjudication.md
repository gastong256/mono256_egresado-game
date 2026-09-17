# Adjudicación de los conflictos de contrato de la remediación matemática

- **Estado:** `EXECUTED` — 2026-09-17, sobre `main` en `066f383`
- **Gate:** `MATHEMATICS REMEDIATION — CONTRACT CONFLICT ADJUDICATION`
- **Rol:** Chair / Head of Mathematics Department provisional, con mandato del
  Product Owner para resolver las preguntas abiertas 66 y 67
- **Entrada:** los dos STOP de la
  [implementación de la remediación](mathematics-remediation-implementation.md#h-stop-registrados)
- **Veredicto:** `CONTRACT CONFLICT ADJUDICATION — BLOCKED`
  (OQ-67 `RESOLVED`; OQ-66 `BLOCKED`: la enmienda autorizada **no** vuelve
  factibles los criterios restantes)

## A. Veredicto

| Pregunta | Contrato | Resultado |
|---|---|---|
| OQ-67 | RS-NEW-001, criterio 3 | **RESOLVED.** Criterio reformulado sobre planes válidos, sin tocar la escalera. Ya lo cumple el catálogo vigente: el test reemplaza al `it.todo` |
| OQ-66 | RS-MAT-008 | **BLOCKED.** La excepción estrecha del witness resuelve la contradicción que la motivó, pero el techo `K ≤ 70` sigue siendo **inalcanzable por estructura**: el mínimo demostrable es **K = 78** |

Por lo tanto:

```text
Mathematics Remediation Implementation — BLOCKED
  13 / 14 contratos PASS
  RS-MAT-008 — BLOCKED, ahora por el techo K, no por el witness
```

No se relajó ningún techo, no se implementó WP-SCREEN y no se adoptó la opción
(b) por cuenta propia: el contrato lo prohíbe y el mandato lo prohíbe.

## B. Baseline

`main` en `066f383`, worktree limpio. Engine `10.0.0`, action log `7`, snapshot
`8`, ruleset de carrera `1.0.0-full-career`, score
`fair-score-dev-2@2.0.0-post-tg1-candidate`. Contenido `0.10.0-grade-7`,
`1.1.0-grade-1`, `2.2.0-grade-2`, `3.2.0-grade-3`, `4.2.0-grade-4`,
`5.2.0-grade-5`. Catálogos `grade-7-dev-6`, `grade-1-dev-2`, `grade-2-dev-3`,
`grade-3-dev-3`, `grade-4-dev-3`, `grade-5-dev-3`.

Medición focal de entrada, reproducida desde el código y el catálogo publicados:

| Medición | Valor |
|---|---|
| `y5.stage-screen` | K 75,0 · S 52 % · la mejor constante es «entera» |
| `y5.course-project-final` | K 56,8 · S 28 % · «repartir todo» óptimo en 0 de 25 |
| Disposiciones en planes válidos | mantener · repartir · **recortar** |
| Disposiciones en planes óptimos | mantener · repartir |
| Variantes con un plan válido que recorta | 25 de 25 |
| Variantes con un plan **efficient** que recorta | 25 de 25 |

## C. Alcance

Sólo OQ-66 y OQ-67. No se reabren los doce contratos cerrados, ni MAT-010,
MAT-012, MAT-013, ni el hallazgo D-S08-111 de `g7.bus-timing`, ni el hardening
aceptado en D-S08-112. No se ejecuta el Independent Mathematics Re-Audit.

## D. OQ-66 — `y5.stage-screen`

### D.1 La contradicción, re-derivada desde el código

Sobre `src/content/grade-5/challenges/stage-screen.ts` y el modelo que exige
RS-MAT-008 —dos elementos protegidos, seis opciones, escalera del punto 4—:

1. **Los tres recortes muestran el mismo rectángulo.** Los tres llenan el ancho y
   recortan lo que sobra del alto, así que los tres cubren `pantalla × pantalla`:
   su uso de pantalla es idéntico. Se diferencian sólo en **de dónde** sacan el
   recorte, que es lo que decide su validez.
2. **Por lo tanto, una variante aprobada tiene cero o un recorte válido.** Si dos
   fueran válidos empatarían en el uso de pantalla y el gate de óptima única
   (punto 4) rechaza la variante.
3. **Con cero recortes válidos**, las únicas opciones válidas son «entera» y «sin
   agrandar» —estirar es inválida siempre—, así que hay a lo sumo dos niveles no
   inválidos y el witness genérico (`tierWitnessIssues`, regla 2.6) rechaza la
   variante. Eso prohíbe exactamente lo que el punto 4 autoriza: que la imagen
   entera sea la óptima. **Ésta es la contradicción que la opción (a) resuelve.**
4. **Con un recorte válido**, las válidas son ese recorte (óptimo, 100 % de
   pantalla), «entera» y «sin agrandar». Como «entera» agranda hasta el borde,
   nunca usa menos pantalla que «sin agrandar»; para que existan `efficient` y
   `functional`, «entera» tiene que ser `efficient` y «sin agrandar`
   `functional`, **en toda variante de este tipo**.
5. **«Entera» nunca es inválida**: no recorta nada y no deforma.

De 4 y 5: el nivel de «entera» es `optimal` donde no hay recorte válido y
`efficient` donde lo hay. Nunca baja de `efficient`.

### D.2 La consecuencia que la opción (a) no resuelve

K es el promedio, sobre el catálogo, del puntaje de la mejor respuesta constante.
Con la escalera 100 / 75 / 40 / 10 y el punto anterior:

```text
K ≥ K(«entera») = 100·w + 75·(1 − w) = 75 + 25·w
```

donde `w` es la proporción de variantes sin recorte válido. Y `w` no puede ser 0:
el punto 8 prohíbe que una opción tenga el mismo nivel en todas las variantes, y
«entera» sólo varía si el catálogo trae los dos tipos de variante. Entonces
**K > 75 siempre**, contra un techo de **70**.

Peor: los puntos 7 y 9 fijan un piso más alto. La heurística «recortar todo del
lado con más aire» acierta exactamente en las variantes cuyo único recorte válido
es de un lado —si recortar todo de un lado entra en el aire de ese lado y no en el
del otro, ese lado es el que más aire tiene—, así que el punto 9 exige
`un-lado ≤ 50 %`; el punto 7 exige `centro ≤ 40 %`; y entonces
`w ≥ 1 − 0,5 − 0,4 = 0,1`:

```text
K ≥ 75 + 25 · 0,1 = 77,5
```

Con las poblaciones que publica el pipeline (24 o 25 variantes por Template), el
mínimo entero es **K = 78,0** (n = 25) y **K = 78,125** (n = 24).

### D.3 Prototipo y mediciones

Se construyó el prototipo completo de la opción (a) —dos elementos protegidos con
su alto y su aire, seis opciones, validez y áreas en **aritmética exacta** de
enteros, escalera del punto 4, excepción de witness sólo donde no hay recorte
válido, punto 10 y la perturbación ±15 % de IM-1— y se barrió el espacio entero.

| Medición | Valor |
|---|---|
| Direcciones candidatas barridas | 2.826.450 |
| Variantes admisibles (todos los gates + witness estricto o exento) | 68.370 |
| Nivel de «entera» | `efficient` 35.335 · `optimal` 33.035 · **`functional` 0 · `invalid` 0** |
| Nivel de «sin agrandar» | `functional` 65.180 · `efficient` 3.190 |
| Óptima | entera 33.035 · centro 12.259 · arriba 11.538 · abajo 11.538 |
| Recortes válidos por variante | 1 → 35.335 · 0 → 33.035 · **2 o 3 → 0** |
| Variantes exentas del witness | 33.035, todas con cero recortes válidos |

Catálogos reales construidos desde ese espacio:

| Catálogo (n = 25) | Punto 7 | Punto 8 | Punto 9 | S | **K** |
|---|---|---|---|---|---|
| Dirigido (entera 5 · centro 8 · arriba 6 · abajo 6) | 4 opciones, máx. 32 % ✓ | sin niveles constantes ✓ | 48 % ✓ | 32 % ✓ | **80,0** ✗ |
| Que minimiza K (entera 1 · centro 9 · arriba 8 · abajo 7) | máx. 36 % ✓ | ✓ | **60 %** ✗ | 36 % ✓ | **76,0** ✗ |
| Óptimo teórico bajo 7, 8 y 9 (entera 3 · centro 10 · arriba 2 · abajo 10) | máx. 40 % ✓ | ✓ | 48 % ✓ | 40 % ✓ | **78,0** ✗ |

Es decir: con la excepción estrecha se pueden satisfacer **simultáneamente** los
puntos 1–5, 7, 8, 9, 10, 11, IM-1, óptima única, aritmética exacta y `S ≤ 40 %`.
El único criterio que ningún reparto alcanza es **`K ≤ 70`**, y el déficit mínimo
es de **8 puntos**.

### D.4 Por qué ninguna parametrización lo salva

El piso no depende de los números elegidos, sino de la forma del espacio:

- «entera» siempre es válida, así que su peor nivel posible es `functional`;
- `functional` para «entera» exige que otra opción válida cargue `efficient`, y
  las únicas otras válidas son el recorte —que usa el 100 % y es la óptima— y
  «sin agrandar» —que nunca usa más que «entera»—;
- por eso «entera» sólo puede ser `functional` en una variante que **omita el
  nivel `efficient`**, y ésa es justamente la variante que la excepción
  autorizada **no** cubre, porque tiene un recorte válido.

El barrido lo confirma: entre 68.370 variantes admisibles, «entera» es
`functional` en **cero**.

Como referencia, y **sin autorización para adoptarlo**: si la excepción se
ampliara a cualquier variante que omita un nivel intermedio, aparecen 6.223
variantes con «entera» `functional` y el techo pasa a ser alcanzable
—`K ≤ 70` exige entonces que «entera» sea `functional` en al menos el
`14,3 % + 0,71·w` del catálogo—. Es una decisión de producto, no de
implementación.

### D.5 Decisión

```text
OQ-66 — NO CERRADA

La opción (a) —excepción estrecha del witness para y5.stage-screen, sólo en
variantes sin ningún recorte válido— es correcta y suficiente para la
contradicción que la motivó, pero NO vuelve factible el contrato completo:
el techo K ≤ 70 de la sección 3 es inalcanzable por estructura, con un piso
demostrado de K = 78.

RS-MAT-008 sigue BLOCKED. No se implementa WP-SCREEN. No se relaja el techo.
No se adopta la opción (b) sin decisión del Product Owner.
```

### D.6 Punto de decisión mínimo

Una de estas tres, y ninguna la puede tomar la implementación:

1. **Fijar el techo de `y5.stage-screen` en su piso estructural** —`K ≤ 80` con el
   catálogo dirigido de D.3, o `K ≤ 78` exigiendo el reparto que minimiza K sin
   romper el punto 9— y mantener `S ≤ 40 %`. Es reconocer que una opción siempre
   válida y casi siempre buena tiene un piso de estrategia ciega, igual que el
   piso de 70 ya aceptado para `g7.mural-paint` (MAT-006).
2. **Ampliar la excepción del witness** a cualquier variante que omita un nivel
   intermedio, lo que permite «entera» `functional` y vuelve alcanzable `K ≤ 70`.
   Debilita el witness más allá de lo que D-S08-099 respalda y afecta a la
   Template entera, no sólo al caso sin recortes.
3. **Cambiar el conjunto de opciones** del punto 2 —por ejemplo, que «entera» no
   esté siempre disponible—, que el contrato prohíbe explícitamente.

La recomendación del Chair es la **1**, con el techo justificado por la medición y
no por conveniencia; pero la decisión es del Product Owner.

### D.7 Qué queda intacto

La Template sigue exactamente como la dejó la remediación: un elemento protegido,
cinco formas de proyectar más estirar, catálogo `grade-5-dev-3`, K 75,0 y S 52 %,
y el `it.todo` de la auditoría de estrategia ciega que nombra el STOP. No se tocó
`stage-screen.ts`.

## E. OQ-67 — `y5.course-project-final`

### E.1 La imposibilidad, re-derivada

Con la escalera `LOCKED` de la Template:

```text
recortar una tarea esencial      → invalid
recortar una tarea no esencial   → no sobrevive todo lo no esencial → no es optimal
```

Ningún plan óptimo puede contener «recortar», en ninguna variante posible. No es
una carencia del catálogo: es la definición de `optimal`. Exigirlo obligaría a
cambiar la escalera, que el mismo contrato prohíbe.

### E.2 Lo que el catálogo publicado ya hace

Enumerando los planes de las 25 variantes de `grade-5-dev-3`:

| Medición | Valor |
|---|---|
| Disposiciones en planes válidos | mantener · repartir · recortar |
| Disposiciones en planes `efficient` | mantener · repartir · **recortar** |
| Disposiciones en planes `optimal` | mantener · repartir |
| Variantes con un plan válido que recorta | 25 / 25 |
| Variantes con un plan `efficient` que recorta | 25 / 25 |
| Formas con recortar viable | `menos-horas` 8/8 · `todo-esencial` 10/10 · `se-cae-el-video` 7/7 |
| Variantes con óptimos que usan mantener · repartir | 25 / 25 · 25 / 25 |
| «Repartir todo» óptimo | 0 / 25 |
| K · S | 56,8 · 28 % |

«Recortar» no es una disposición muerta: es un intercambio real que alcanza el
nivel `efficient` en toda variante y en las tres formas semánticas. Lo que no
puede ser —y no debe pedirse— es que sea `optimal`.

### E.3 Decisión

```text
OQ-67 — CERRADA

Se reformula el criterio 3 de RS-NEW-001 sobre los planes matemáticamente
válidos. No se cambia la escalera. No se exige «recortar» entre los óptimos.
```

### E.4 Criterio 3 enmendado (texto canónico)

> 3. **Las tres disposiciones están vivas.** En el catálogo aprobado, y en cada
>    variante: mantener, repartir y recortar aparecen en planes matemáticamente
>    válidos; «recortar» alcanza al menos el nivel `efficient`, es decir que
>    aparece como intercambio legítimo y no sólo en planes inválidos; y el
>    conjunto de planes óptimos sigue siendo no trivial, con mantener y repartir
>    —las dos disposiciones que la escalera permite que sean óptimas— presentes
>    entre ellos. La escalera no cambia: `invalid` recorta lo esencial, deja la
>    tarea de quien no está o pasa las horas de alguien; `functional` el plan
>    cierra; `efficient` sobrevive parte de lo no esencial; `optimal` sobrevive
>    todo lo no esencial.

Sin cuotas inventadas: la condición es cobertura estructural por variante y por
forma semántica, que es lo que el catálogo real sostiene y lo que el test
comprueba.

### E.5 Implementación

Ningún cambio de contenido, generador, catálogo ni versión: el catálogo vigente ya
cumple el criterio enmendado. El `it.todo` se reemplazó por el test real
«RS-NEW-001 criterio 3 enmendado: recortar es una decisión viva en toda variante y
forma» en `tests/integration/mathematics-remediation.test.ts`, que comprueba los
tres puntos por variante y la cobertura de las tres formas. El test que demuestra
la imposibilidad se conserva como premisa de la enmienda.

**RS-NEW-001 queda PASS.**

## F. Autorización de implementación

```text
Resumido en esta tarea:
- RS-NEW-001, criterio 3 enmendado  → implementado y verificado

NO resumido:
- WP-SCREEN / RS-MAT-008            → sigue BLOCKED, a la espera de D.6
```

## G. Fuera de alcance

Los doce contratos ya cerrados; MAT-010, MAT-012 y MAT-013; el hallazgo de
`g7.bus-timing` (D-S08-111), que se conserva sin remediar para el re-audit; el
hardening aceptado en D-S08-112; el pacing; la revisión humana; y el Independent
Mathematics Re-Audit, que sigue `PENDING`.

## I. Hallazgo de la ejecución

La verificación de cierre falló una vez por **cobertura**, no por contenido:
84,99 % de sentencias contra un umbral de 85 %. La causa no era esta tarea. Las
ramas de rechazo del fixture de desarrollo `dev.bus-departure` —respuesta de otro
motor, literal no decimal, margen negativo— sólo las tocaban los tests de
propiedad, que sortean su semilla en cada corrida, así que la cobertura del
fixture, y con ella el total del repositorio, se movía entre corridas: 85,05 %,
85,01 % y 84,99 % en tres ejecuciones del mismo árbol.

Se corrigió con un test determinista de esas tres ramas y de la escalera completa
del fixture desde una dirección fija (`tests/unit/content-model.test.ts`). La
cobertura queda en **85,09 %** y **el umbral no se tocó** (D-S08-115). Bajar el
umbral habría sido exactamente la clase de relajación silenciosa que la
especificación prohíbe.

## H. Evidencia

- Repositorio: `src/content/grade-5/challenges/stage-screen.ts`,
  `src/content/grade-5/challenges/course-project-final.ts`,
  `src/content/authoring.ts` (`tierWitnessIssues`),
  `tests/integration/blind-strategy-audit.test.ts`,
  `tests/integration/mathematics-remediation.test.ts`, catálogo `grade-5-dev-3`.
- Prototipo de la opción (a): barrido exhaustivo de 2.826.450 direcciones con
  aritmética exacta, ejecutado fuera del repositorio; sus conteos están en D.3 y
  son reproducibles desde la definición del espacio que ahí se describe.
- Inferencia de ingeniería y didáctica: D.2, D.4 y E.1 son demostraciones sobre
  las definiciones del contrato, no observaciones estadísticas.
- No se usó bibliografía externa: los dos conflictos son formales e internos.
