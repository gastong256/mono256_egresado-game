# ADR-023 — Política de score competitivo

- Estado: Aceptado
- Fecha: 2026-08-29

## Evolución de carrera completa — 2026-09-10

Prestige se agrega como observador separado bajo ADR-025, sin Estilo ni evidencia
competitiva duplicada. El Product Pass cierra FairScore → Prestige → shared rank;
ningún tiempo, optimalCount ni campo diagnóstico constituye un tercer criterio.
Las cifras y versiones de implementación de este ADR son evidencia histórica.
[Decisión técnica futura](ADR-025-full-career-contract-evolution.md);
[reconciliación de producto](../../07-reference/full-career-product-audit-integration.md).
No se modifican runtime ni versiones en esta integración.

## Reconciliación post-Teacher-Gate-1 — 2026-09-02

TG1 no cambia esta arquitectura; usa el camino de calibración versionada que el ADR diseñó. Se conserva inmutable `fair-score-dev-1@1.0.0-candidate` (80/15/5) y se publica `fair-score-dev-2@2.0.0-post-tg1-candidate` (85/10/5) como candidata actual, `official: false`. Ambas resuelven por identidad o versión exacta y una referencia desconocida falla: nunca existe fallback `latest`.

TG1-07 eleva la normalización de pesos activos de decisión arquitectónica implementada a filosofía de producto aceptada. TG1-05/TG1-06 aceptan evaluación multi-eje, sin relajar la auditoría de doble conteo: cada componente debe leer evidencia semánticamente independiente. Por eso no se copia el F1 de May-25 a Aura ni se cambian perfiles de contenido actuales.

No se requiere ADR nuevo: la coexistencia de calibraciones ya estaba decidida aquí. Tampoco cambian engine, ruleset, contenido, catálogo, snapshot, action log, dificultad ni composición; `scoreVersion` es la frontera de compatibilidad específica.

## Contexto

[ADR-022](ADR-022-difficulty-model-and-run-composer.md) dejó runs **comparables antes de puntuar**: el contenido de una partida se compone una sola vez dentro de un presupuesto de dificultad, y 20.000 seeds de 7.º producen 1.404 planes distintos con carga total idéntica. Lo que no existía es qué vale lo que el jugador hizo con ese contenido.

Lo que sí había es el score por evento —`base × calidad × dificultad + bonus`— que alimenta la vista previa de la run y vive en [reglas, scoring y progresión](../../01-game-design/rules-scoring-and-progression.md). Ése responde «cómo salió este beat». La pregunta de esta etapa es otra: **cuánto vale una run entera cuando se la compara con la de otra persona**.

[El score competitivo](../../01-game-design/competitive-scoring-and-ranking.md) ya describía la capa y no estaba implementada. Este ADR la implementa, sin cerrar un solo coeficiente.

## Decisión

### 1. Cinco cosas distintas que no se colapsan en un número

```text
resultado del desafío  ≠  efecto de carrera  ≠  desempeño competitivo  ≠  FairScore  ≠  ranking
```

Un mismo beat produce las cuatro primeras a la vez y ninguna se deriva de otra por conveniencia: el trabajo grupal deja una nota en el legajo, mueve Estilo hacia Estratega, aporta un desempeño matemático y otro de equipo, y de todo eso sale una contribución al score. El ranking no existe todavía y no es de esta etapa.

### 2. La plantilla declara qué hecho suyo lee cada componente

Los evaluadores no miden lo mismo. El colectivo pregunta si elegiste la salida que llega a horario; el acto calcula un F1 sobre veinticuatro clasificaciones; el trabajo grupal responde dos preguntas separadas —si el reparto era factible y cuánto jugó a la fuerza de cada uno—. Aplanar todo eso en una métrica sería tirar evidencia que ya existe o inventar la que no.

Así que cada plantilla declara un **perfil de score**: qué señal alimenta la matemática, cuál el equipo, cuál el aura, y **por qué**. `'none'` es una decisión que hay que escribir, no un default en el que se pueda caer, y la razón es obligatoria porque la pregunta no es «qué mide esta plantilla» sino «por qué esto es un hecho *distinto* del que otra componente ya leyó».

El agregador no conoce ni un id de contenido. Una plantilla futura declara su perfil y se puntúa sola; hay un test que lo prueba con contenido que el scorer nunca vio.

### 3. La auditoría de doble conteo, y lo que encontró

| Plantilla | Matemática | Equipo | Aura | Por qué |
|---|---|---|---|---|
| `g7.bus-timing` | calidad discreta | — | — | elegir la salida correcta es su único hecho |
| `g7.bus-latest-departure` | calidad discreta | — | — | el número producido es su único hecho |
| `g7.mural-paint` | calidad discreta | — | — | la eficiencia reportada **es** el óptimo de compra |
| `g7.notebook-offer` | calidad discreta | — | — | una sola comparación |
| `g7.stand-supplies` | calidad discreta | — | — | su eficiencia es el costo mínimo, o sea la misma optimización |
| `g7.group-tasks` | calidad discreta | afinidad del reparto | — | factibilidad y afinidad son dos hechos que el evaluador mide por separado |
| `g7.may-25-act` | **F1** | — | — | la clasificación es su único hecho |

Dos resultados de esa tabla merecen decirse en voz alta.

**El stand mueve Equipo en la carrera y no aporta equipo competitivo.** Lo que mide es el costo mínimo, que ya se cobró como matemática. El efecto de carrera responde «qué le pasó al grupo»; la evidencia competitiva respondería «qué tan bien colaboró», y este evaluador no mide lo segundo. Que las dos capas discrepen es la prueba de que no son la misma.

**Ninguna plantilla de producción aporta aura competitiva hoy.** El acto es el único evento que mueve Aura, y su única medida es el F1 que la matemática ya usa; darle además aura sería cobrar el mismo hecho dos veces con otro nombre. La componente existe, está normalizada y topeada, y la ejercitan los fixtures. Preferimos una componente honestamente vacía a una señal inventada para llenarla.

### 4. La oportunidad ausente no cuesta puntos

Los planes difieren en qué contienen. Una partida compuesta de 7.º son dos beats de pura matemática; el demo docente tiene equipo; una carrera sintética tiene las tres. Puntuar la primera sobre 8.000 y la segunda sobre 10.000 castigaría a alguien por un sorteo que no hizo.

**Una componente sin oportunidad en una run sale, y su peso se reparte entre las que quedaron**, en proporción. Dos consecuencias: el juego perfecto vale exactamente 10.000 en toda run válida, y sacar una componente secundaria sólo puede **aumentar** la proporción de la matemática.

Alternativas consideradas:

- **normalizar cada componente contra sus propias oportunidades y dejar el peso quieto** — es lo mismo que puntuar sobre un máximo menor: el jugador sin contenido de equipo pierde 15 % que no tenía cómo ganar;
- **garantizar oportunidades desde el compositor** — ata la composición al score, que es exactamente lo que [ADR-022](ADR-022-difficulty-model-and-run-composer.md) separó, y no hay contenido de aura con el que cumplirlo;
- **tratar las secundarias como bonus con tope** — el juego perfecto pasaría a valer distinto según el plan, que es la invariante que esta etapa existe para sostener.

### 5. La matemática manda, y es ejecutable

`competitiveScorePolicyIssues` rechaza una política donde el peso matemático no supere la suma de los otros dos. No es una preferencia: es D-011 escrita como código, y ningún comentario bien intencionado la sostiene sola.

La evidencia sobre 23.000 planes: una run con matemática floja y secundarias perfectas llega a 3.600; una con matemática fuerte y secundarias mínimas no baja de 7.400. **No se cruzan.**

### 6. Estilo y Promedio no tienen peso porque no son componentes

No valen cero: no existen. `SCORE_COMPONENTS` es `math · team · aura`, y un peso cero es un número que alguien puede subir editando una línea.

Estilo no puntúa porque darle score a Aplicado, Estratega o Improvisador afirmaría que hay una personalidad objetivamente superior, y el juego dice explícitamente que ningún eje es el malo. Promedio no puntúa porque el desempeño matemático que lo produce ya se contó: sumarlo aparte cobra la misma habilidad dos veces.

### 7. La recompensa por dificultad no es el costo de scheduling

STAGE-05 cobra 210 centésimas por un beat `stretch` para poder **equilibrar** una run. Pagar 2,1× por resolverlo dejaría que el sorteo decidiera un ranking, que es justo lo que ese costo existe para evitar.

Son dos números distintos: 1,00 / 1,08 / 1,15, y la validación rechaza cualquiera por encima de 1,50. Se aplica a los dos lados de la razón matemática, así que un plan más difícil vale un máximo **distinto en su reparto**, nunca más grande.

### 8. Enteros, y un solo redondeo

Todo en puntos básicos sobre racionales exactos, redondeado media-arriba una sola vez al final. Un ranking es exactamente donde dos máquinas no pueden permitirse discrepar por un flotante, y el motor ya rechaza el punto flotante donde el resultado importa ([ADR-013](ADR-013-exact-rational-arithmetic.md)).

Las contribuciones del desglose se reparten por **resto mayor**, así que las partes suman el total. Un desglose cuyas partes no cierran con el número que tiene al lado es un desglose que nadie puede defender.

### 9. La run declara bajo qué calibración se juega

`scoreVersion` entra a la identidad de la run, junto a la versión del catálogo y la huella del plan, y `createRun` la comprueba contra la política que recibe. Un score bajo `fair-score-dev-1` y uno bajo `fair-score-dev-2` son afirmaciones distintas sobre la misma partida, y una submission que no dijera cuál quiso decir no se podría verificar.

Es opcional: una partida de práctica no está compitiendo, y ausente es una respuesta.

### 10. El servidor calcula el score; no lo compara

`validateSubmittedRun` reproduce la run y **puntúa desde el historial que él mismo produjo**. La submission no lleva un score que el servidor pueda mirar, y agregárselo no sirve: el parser lo ignora. Hay tests que lo intentan.

`verifyScoreClaim` es el otro lado: dado un reclamo, recalcula y reporta cada campo que no coincide —el total, cada desempeño, cada peso efectivo, cada contribución, la madurez de la política—. Un desglose editado para contar otra historia bajo un total correcto sigue siendo falso, y es el que un docente leería.

## Alternativas consideradas

**Reusar el score por evento como score competitivo.** Es la suma de puntos de una run, y suma más quien jugó más beats. Deja de comparar habilidad en cuanto dos planes tienen distinta longitud.

**Derivar las componentes de los efectos de carrera.** Tentador porque ya existen. Responden otra pregunta —qué le pasó al personaje— y usarlos habría metido Estilo y Promedio al score por la puerta de atrás.

**Un peso cero para Estilo y Promedio en vez de no tenerlos.** Un cero es una invitación.

**Redondear cada contribución por separado.** Más simple, y produce desgloses que no suman.

## Consecuencias

- `ENGINE_VERSION` pasa a `5.1.0`, `SNAPSHOT_SCHEMA_VERSION` a `6` y `ACTION_LOG_VERSION` a `4`: una run puede declarar su calibración competitiva. **Nada del juego se movió** — las runs golden reproducen el mismo recorrido, el mismo score por evento, el mismo perfil y la misma cantidad de comandos.
- **La huella del ruleset queda idéntica en `da245c60`.** Puntuar no toca una regla de juego, y una huella que no se movió lo dice mejor que cualquier comentario.
- El contenido sube a `0.8.0-grade-7` y `0.6.0-dev`: el perfil de score es contenido que decide cuánto vale una run, así que entra a la huella de contenido. El catálogo aprobado pasa a `grade-7-dev-4`, publicado al lado de `dev-3` sin editarlo.
- `pnpm game:score` audita 23.000 planes reales y sintéticos, y `--compare` corre las mismas runs bajo calibraciones alternativas para que el Teacher Gate discuta con números.
- El score no alimenta nada: ni un resultado, ni un efecto de carrera, ni una rama narrativa, ni qué contenido se compone. Puntuar es observar.

## Lo que esto no decide

La política oficial. TG1 aceptó 85/10/5, los cuatro escalones y el principio de recompensa pequeña como dirección.

**Resuelto el 22 de septiembre de 2026 (D-RC-003, [ADR-027](ADR-027-release-freeze-and-v1-governance.md)).** El FREEZE de producción publicó `fair-score-v1@1.0.0-fair-edition-v1` con `official: true` y **los mismos números** que `fair-score-dev-2`: la promoción copió y no recalibró, y la equivalencia está probada sobre un corpus determinista, sobre evidencia arbitraria y sobre los 23.000 planes de `pnpm game:score`. Las [preguntas 24 y 44](../../07-reference/open-questions.md) quedan cerradas para v1.

Lo que **no** cambió: `createRuleset` se sigue negando a construir un ruleset oficial con una calibración de desarrollo, y la ruleset de carrera completa sigue declarando `official: false` porque composición, recuperación, rareza y costo siguen siendo políticas de desarrollo. Son banderas de capas distintas.

Que 23.000 runs se comporten como se espera dice que el mecanismo preserva sus invariantes. **No dice que 85/10/5 esté psicométricamente probado**, y ninguna barrida sintética puede decirlo.

## No objetivos

Ranking, leaderboard, personal best, endpoints, persistencia e inscripción a un evento son STAGE-09. Egreso y recuperaciones, STAGE-07. El ranking no está implementado. La expectativa histórica de usar `optimalCount`
para desempatar quedó supersedida por el Product Pass; ese dato sigue diagnóstico.
