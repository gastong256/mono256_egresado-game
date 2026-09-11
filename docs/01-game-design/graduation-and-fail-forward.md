# Egreso, recuperación y fail-forward

**Estado: IMPLEMENTADO en STAGE-07** (2 de septiembre de 2026). La dirección —el error cambia el camino, no termina la partida— y el egreso garantizado fueron aceptados en TG1-14 y hoy son una propiedad de la máquina de estados, no una promesa del roadmap. La decisión completa está en [ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md).

**Producto v1 cerrado por el Product Pass:** el label visible es **REPASO**.
La terminología interna recovery/review se conserva. TG1-14 no había fijado copy;
esta decisión posterior supersede esa apertura sin afirmar que la UI ya cambió.

## Invariante

> Toda run completada válida llega a `EGRESADO`.

El jugador compite por calidad y construye un recorrido distinguible, pero no queda afuera del resto del juego por haberse equivocado.

Esto no es indulgencia: es la consecuencia de que el producto trate el error como información. Una feria en la que el juego te expulsa a los noventa segundos no es una feria en la que alguien juegue dos veces.

**No es indulgencia de otra manera tampoco:** equivocarse sigue costando. Baja el Promedio, baja el score, cambia la historia y deja rastro en cómo se egresa. Lo único que no hace es terminar la partida.

## Cómo funciona

Un beat ordinario recovery-capable con resultado **INVALID** deja una obligación.
**FUNCTIONAL no dispara Repaso** en v1; una Template con `none` conserva sólo la
consecuencia ordinaria. No se amplía cobertura para cumplir cuotas. El año no puede terminar debiéndolo, y cerrarlo es un **repaso**: una escena nueva, más chica, que aísla el paso donde estuvo el error.

Un repaso no es un reintento. No devuelve la misma pregunta ni borra lo que pasó: el resultado original sigue en la historia y sigue siendo parte de cómo egresó ese jugador. Permite progresar; no deshace.

### Por qué no se puede quedar dando vueltas

Dos hechos estructurales, y ninguno es configurable:

1. **Sólo un beat ordinario deja algo por cerrar.** Un repaso no es ordinario, así que no puede dejar nada. La recursión no es representable.
2. **Un repaso siempre cierra lo que el año debía**, salga como salga. Qué tan bien salió cambia la carrera y la historia, nunca si el año cierra.

El techo es un repaso por año, y una run nunca necesita un segundo para arreglar el primero. Por eso «toda run válida egresa» es un hecho sobre el sistema y no una esperanza sobre el jugador.

### El repaso no puntúa

Ni en el numerador ni en el denominador del [score competitivo](competitive-scoring-and-ranking.md).
Necesitar o completar Repaso tampoco otorga Prestige competitivo; puede dejar badge o memoria. La evidencia competitiva sigue siendo el beat ordinario que salió mal.

Si puntuara, fallar a propósito sería una forma de comprarse una oportunidad extra de puntuar, y toda la comparabilidad entre runs se caería por esa puerta. **Fallar y recuperarse perfecto siempre puntúa menos que jugar bien de entrada.** Hay un test que lo comprueba.

### El repaso no le come el año al jugador

Se agenda **después** de los beats ordinarios y fuera del presupuesto de uno o dos que fija [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md). Contarlo adentro le costaría una de las decisiones que el año fue compuesto para darle, que es lo contrario de lo que corresponde cuando algo salió mal.

Todas las obligaciones de un año se cierran en **un solo** repaso. Producto v1:
reunir obligaciones → seleccionar una determinísticamente → mostrar debrief breve
de las no seleccionadas → completar el único Repaso → cerrar todas → continuar.
Cerrar IDs no significa haber practicado interactivamente todos los conceptos.

Desde Phase 1 el motor lo representa: selecciona por orden canónico, deriva qué
obligaciones practica el Repaso —las que su ruta declara— y cuáles sólo se
explican con el debrief autorado, muestra las dos listas antes de la interacción y
cierra todas. La distinción se reconstruye desde el registro del año, sin estado
persistido nuevo ([ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md)).
`reviewPriority` editorial sigue siendo una recomendación, no un campo.

## Progresión separada de desempeño

El desempeño cambia:

- Promedio;
- score;
- qué contenido de recuperación aparece;
- flags e historia;
- arquetipo final;
- Aura, Equipo y Estilo donde tenga sentido contextual.

El desempeño **no** produce por sí solo un estado terminal de «no podés seguir». **No hay umbral de score ni de Promedio para egresar**: el desempeño cambia *cómo* se egresa, nunca *si*.

## Qué dice la documentación vigente

[Reglas, scoring y progresión](rules-scoring-and-progression.md) declara que en el MVP no hay repetición automática de año por bajo desempeño: la fantasía es una carrera comprimida, no un simulador administrativo de promoción escolar. **Eso sigue vigente y no se contradice.**

Lo que agrega esta dirección es el otro lado: no repetir el año tampoco significa que el bajo desempeño no tenga consecuencia. La consecuencia es narrativa y de score, comprimida en eventos, no en volver a jugar doce meses.

## Previas

Un año que cierra con lo justo deja una **previa**: estructura oculta que el contenido futuro puede retomar.

```text
1.º: te quedó una previa → 2.º/3.º: esa previa sigue ahí → 5.º: arco final de recuperación
```

Es estado narrativo oculto, no una quinta stat en el HUD. El modelo visible sigue siendo el de [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md): Promedio, Equipo, Aura y Estilo, y nada más es permanente.

Una previa **no bloquea**. Es historia, no deuda: si arrastrar obligaciones entre años pudiera impedir el egreso, el invariante se rompería para el jugador que más lo necesita. Los callbacks que las retoman son contenido de STAGE-08.

## Sin sistema de vidas

Ni corazones, ni intentos limitados, ni tres strikes, ni reintentar hasta acertar. El error genera consecuencia y contenido adicional: **más** juego, no menos minutos.

## Lenguaje

El juego no dice que fracasaste. Dice que quedó algo dando vueltas y te da la oportunidad de cerrarlo antes de que termine el año.

**REPASO** es el label v1. «Quedó algo dando vueltas» puede acompañarlo como
copy contextual; «previa» queda como memoria de carrera, no nombre por defecto de
una deuda. El wording de cada escena se valida editorialmente sin reabrir el label.

## Verificación

Lo que la etapa tenía que establecer, y con qué quedó establecido:

| Requisito | Evidencia |
|---|---|
| Toda run completable llega a `EGRESADO` | 20.000 carreras sintéticas de seis años, **20.000 egresadas, 0 hallazgos** |
| Ningún estado de fracaso académico es terminal | el espacio de estados de la progresión, recorrido entero: un único estado terminal alcanzable |
| La recuperación no crea callejones sin salida | la misma auditoría exhaustiva: sin ciclos y sin estados sin salida |
| El estado sigue siendo serializable y reproducible | snapshot v7 con la progresión adentro; replay y reanudación a través de un repaso |
| El repaso no crea oportunidad competitiva | descartado por rol en el scorer, más un test de anti-farmeo |
| El servidor no le cree al cliente | recalcula egreso, repasos y previas reproduciendo; un `graduated` adjunto no cambia nada |

`pnpm game:simulate` reporta egresos, repasos y previas, y trata como hallazgo toda run que complete sin egresar. Ver [estrategia de testing](../04-quality/testing-strategy.md).

## Estado de implementación

La fundación de progresión de STAGE-07 está implementada, y Phase 1 de STAGE-08
sumó el debrief y el contenido real de 1.º con sus dos rutas. El slice de 7.º
termina en un hito de año; la práctica de desarrollo `7.º → 1.º` recorre dos años
reales, y la carrera `7.º → 1.º → 2.º → 3.º → 4.º → 5.º → Egreso` se juega entera
sólo en el fixture sintético que prueba la estructura. 2.º a 5.º siguen en
STAGE-08, después del gate post-G1. Ver [la secuencia de implementación](../06-delivery/implementation-sequence.md).

Del contenido de producción, hoy repasa la familia colectivo: `g7.bus-travel-review` aísla la duración del viaje con demora, que es el paso que las dos plantillas del colectivo dan por sabido. Las otras declaran `none`, que es una decisión explícita: el error del mural es de redondeo de compra, el de la oferta es leer cuál quedó más barata, y el acto ocurre una vez y en público. Una recuperación inventada para completar una tabla sería peor contenido que ninguna.

El repaso que aparece es siempre el de la situación que salió mal, nunca el del año: equivocarse con el mural y recibir una cuenta de colectivos sería remediación en la forma y un disparate en el contenido. Cuando la plantilla no tiene repaso, el mal resultado simplemente queda — con su consecuencia en la nota, el score y la historia.

## Cobertura futura aprobada de diseño

Los cinco pases de Phase 0 fijan **9/25 Templates fuente recovery-capable** y sus
rutas, registradas en la
[matriz de carrera](full-career-content-matrix.md#cobertura-futura-de-recuperación).
Son diseños futuros: no agregan contenido runtime, no modifican ADR-024 ni
permiten un segundo repaso. La semántica multiobligación está cerrada; su ejecución
y adecuación pedagógica se validan en el
[audit posterior a implementar 1.º](../04-quality/post-grade-1-scalability-audit.md).
No se agregan gates de escalabilidad de recuperación por año.
