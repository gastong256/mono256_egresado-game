# ADR-027 — Congelamiento del release y gobernanza de v1

- Estado: Aceptado
- Fecha: 2026-09-22
- Supersede: el carácter **bloqueante** de [GATE-TG2](../../06-delivery/teacher-gates.md) y de la revisión humana amplia del Departamento de Matemática (D-S08-094, D-S08-095)
- Relacionado: [ADR-004](ADR-004-server-authoritative-scoring.md) · [ADR-018](ADR-018-blueprint-v0-2-decision-authority.md) · [ADR-023](ADR-023-competitive-score-policy.md) · [ADR-026](ADR-026-participant-identity-and-minor-privacy.md)

## Contexto

Hasta acá el proyecto sabía decir qué versiones corría —una tupla de siete
campos en una fila de la base— pero no tenía un lugar donde decir **qué es esta
versión del producto**. Las reglas de la competencia vivían repartidas: el
ranking en una función pura, la política de intentos en un índice parcial de
Postgres, el techo de Prestige en una lista vacía de contenido, la política de
seed en un comentario de un script, y la relación entre todo eso en la memoria
de quien lo armó.

El exit gate del congelamiento formula la pregunta con precisión: **«¿puede un
tercero reconstruir con qué reglas exactas se jugó la competencia?»** Con la
información repartida, la respuesta honesta era «sí, leyendo el repositorio
entero y sabiendo dónde mirar», que en la práctica es «no».

Al mismo tiempo, dos gates humanos seguían declarados como bloqueantes —Teacher
Gate 2 y la revisión del Departamento de Matemática humano— y el roadmap hacía
depender de ellos el congelamiento y el despliegue. La dirección de producto
cambió: esos gates dejan de ser condición de v1.

Las dos cosas se deciden juntas porque son la misma decisión vista de dos lados:
qué autoriza un release, y qué lo describe.

## Decisión

### 1. El release es un dato con huella

Existe un manifiesto —`src/release/fair-edition-v1.ts`— que declara, en un solo
lugar y en forma legible por máquina, todo lo que decide qué es esta
competencia: identidades del motor, de la ruleset, del contenido y de los
catálogos con sus SHA-256; la política de score oficial; la de Prestige; las
reglas de intento, ranking y podio; la política de seed; el contrato de
privacidad; y la cabeza del esquema con su huella.

El manifiesto **declara y no deriva**. Si derivara sus valores del código diría
siempre la verdad y no probaría nada: un catálogo regenerado cambiaría la huella
y el manifiesto la seguiría sin quejarse. Declarándolos, `pnpm release:verify`
recomputa cada uno desde la fuente y un cambio de contenido rompe la
verificación, que es lo que un congelamiento tiene que hacer.

Su identidad es una huella SHA-256 sobre su serialización canónica, fijada en un
candado comprometido. No lleva fecha de build, rama, commit ni nombre de
máquina: un artefacto reproducible da la misma huella hoy y dentro de un año, y
el commit ya es la procedencia de la fuente.

### 2. FairScore se oficializa por copia, nunca por edición

`fair-score-dev-2@2.0.0-post-tg1-candidate` se promueve a
`fair-score-v1@1.0.0-fair-edition-v1` copiando cada número y poniendo
`official: true`. Las dos candidatas quedan en el registro sin editar.

La regla que esto establece: **oficializar es un acto de identidad, no de
calibración**. Un release que cambiara un peso mientras promueve estaría
publicando una competencia distinta bajo el nombre de la revisada. La
equivalencia se prueba por comparación de configuración, por un corpus
determinista de partidas y por propiedad sobre evidencia arbitraria.

### 3. No hay estado `FROZEN` nuevo; hay vínculo con el release

Los campos competitivos de una edición ya son inmutables porque el puerto de
persistencia acepta cuatro columnas operativas y ninguna de ellas es la seed, la
tupla ni la versión del aviso. Agregar un estado para prohibir lo que el tipo no
permite expresar sería un segundo lugar donde declarar la misma verdad.

Lo que se agrega es la otra mitad: **abrir una edición exige que su tupla
congelada sea la del release desplegado**. Cerrar y archivar se permiten
siempre, porque negarse a cerrar dejaría a un organizador sin forma de sacar de
circulación una edición equivocada.

### 4. La seed se congela en la edición, no en el release

El manifiesto congela la política —una seed compartida por edición, generada al
crear la competencia— y deja el valor en la fila. Ponerlo en el release
obligaría a publicar un artefacto nuevo por feria y, peor, haría que dos ferias
distintas jugaran exactamente la misma partida.

### 5. Ninguna revisión humana amplia bloquea v1

```text
Revisión amplia del Departamento de Matemática humano   NO REQUERIDA PARA V1
Teacher Gate 2 como gate bloqueante                      SUPERSEDIDO
Ventanas de ajuste humano puntual                        OPCIONALES, POR HALLAZGO
```

El gate matemático vigente es el que el repositorio efectivamente cerró: Pre-Review
por IA → Adjudicación independiente → Remediación → Re-auditoría independiente →
Sign-off provisional del AI Mathematics Department → Auditoría final de cierre.

**Lenguaje admisible:**

```text
Validación de matemática y de producto por IA completa según los gates
cerrados del repositorio.
Ninguna revisión humana amplia es requisito de v1 bajo la gobernanza actual.
Pueden ocurrir ajustes humanos puntuales, acotados y con ventana, si se
reporta un problema concreto.
```

**Lenguaje inadmisible**, y que ningún documento de este repositorio usa:

```text
human-reviewed · human-certified · curriculum-certified · teacher-approved
```

### 6. La evidencia histórica no se borra

Los documentos que esperaban un gate humano se conservan enteros, con una nota
de superación. Un registro de decisiones que reescribe lo que decía antes deja
de ser un registro.

## Consecuencias

**A favor.** Un tercero puede reconstruir las reglas exactas con un comando. Un
cambio accidental a una semántica congelada rompe un gate en vez de llegar a una
feria. Un resultado publicado dice por sí solo si se produjo bajo una
calibración de competencia o de desarrollo. Y el camino a producción deja de
depender de una disponibilidad humana que no estaba agendada.

**En contra, y asumido.** Hay dos identidades de score con números idénticos, lo
que cuesta una explicación cada vez que alguien lee el registro; el candado hay
que regenerarlo a mano tras un cambio deliberado; y v1 sale sin validación
pedagógica humana amplia, lo que es un riesgo real de producto —no de
ingeniería— que esta decisión acepta explícitamente en lugar de disimular.

**Lo que no cambia.** Teacher Gate 1 ocurrió y sus decisiones siguen integradas.
El pacing con jugadores reales sigue sin hacerse y sigue documentado como
pendiente. Y la ruleset sigue declarando `official: false`: subirla exigiría
versionar composición, recuperación, rareza y costo, y mover la huella del plan
es exactamente el riesgo de replay que un congelamiento existe para no correr.
