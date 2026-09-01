# Anexo · para el facilitador y el equipo

Nada de esto se muestra en la reunión salvo que alguien pregunte. Está acá para que el facilitador pueda responder en una frase y seguir.

## Respuestas de una frase, si preguntan

**«¿Los ejercicios son siempre los mismos?»**
No: cada situación tiene decenas de versiones verificadas, y el juego elige una. Lo que se elige está validado de antemano, no generado en el momento.

**«¿Cómo saben que no le tocó una partida más difícil que a otro?»**
El juego arma cada partida contra un presupuesto de dificultad, así que dos partidas distintas llevan una carga parecida antes de puntuar.

**«¿Se puede hacer trampa?»**
El resultado oficial lo recalcula el servidor reproduciendo la partida. Lo que el navegador diga sobre su propio puntaje no se lee.

**«¿Por qué esta situación y no otra?»**
Las siete de 7.º son las que existen hoy. Cuál va en qué año todavía no está decidido, y es parte de lo que queremos que nos digan.

## Los seis rasgos detrás de cada nivel

**Candidato de ingeniería. Ningún docente lo validó.** No se muestra en la reunión salvo que pidan el detalle.

Cada situación declara seis rasgos de su estructura, y el nivel sale de su suma. No se elige: se deriva.

| Rasgo | Qué mide | Rango |
|---|---|---|
| pasos | pasos encadenados antes de que exista una respuesta | 1–4 |
| restricciones | condiciones que tienen que valer **a la vez** | 0–3 |
| selección | cuánto del trabajo es decidir qué dato importa | 0–3 |
| optimización | si alcanza con una respuesta que funcione o hay que buscar la mejor | 0–2 |
| incertidumbre | lectura estadística o estimación | 0–2 |
| construcción | si la respuesta hay que **producirla** en vez de reconocerla | 0–1 |

CORE hasta 4, STANDARD hasta 7, STRETCH de 8 en adelante.

| Situación | Rasgos | Carga | Nivel |
|---|---|---|---|
| acto del 25 | 1·0·2·0·0·1 | 4 | CORE |
| colectivo, elegir | 2·1·1·1·0·0 | 5 | STANDARD |
| cuaderno en oferta | 2·1·1·1·0·0 | 5 | STANDARD |
| colectivo, construir | 2·1·1·1·0·1 | 6 | STANDARD |
| mural | 3·1·1·1·0·0 | 6 | STANDARD |
| stand de la feria | 2·2·1·2·0·1 | 8 | STRETCH |
| trabajo grupal | 2·2·2·2·0·1 | 9 | STRETCH |

**Cuatro situaciones no coinciden con el nivel que tenían autorado** antes de este modelo: el colectivo (elegir), el mural, el stand y el trabajo grupal. Eso no es un error del motor: el número viejo se escribió como perilla de ajuste en tiempo de juego y no como clasificación estructural. Cada divergencia es una pregunta concreta para el gate.

El detalle completo está en [dificultad y jugabilidad](../../01-game-design/difficulty-and-playability.md).

## Qué alimenta cada componente del puntaje

| Situación | Matemática | Equipo | Aura | Por qué |
|---|---|---|---|---|
| colectivo, elegir | calidad | — | — | elegir la salida correcta es su único hecho |
| colectivo, construir | calidad | — | — | el número producido es su único hecho |
| mural | calidad | — | — | la eficiencia que mide *es* el óptimo de compra |
| cuaderno | calidad | — | — | una sola comparación |
| stand | calidad | — | — | su eficiencia es el costo mínimo, o sea la misma optimización |
| trabajo grupal | calidad | afinidad del reparto | — | factibilidad y afinidad son dos hechos que el evaluador mide por separado |
| acto del 25 | precisión y cobertura | — | — | la clasificación es su único hecho |

El criterio que gobierna la tabla: **un mismo hecho no puede pagarse dos veces con otro nombre.** Ver [ADR-023](../../03-architecture/adr/ADR-023-competitive-score-policy.md).

## Marco de revisión matemática

Para el facilitador, si la conversación da para más. Por situación:

- validez matemática de todos los caminos de solución y del feedback;
- pertinencia curricular para la etapa;
- concepto contra cálculo: ¿la dificultad es de razonamiento o aritmética accidental?;
- pasos de razonamiento involucrados;
- estrategias válidas alternativas;
- ambigüedad: ¿hay dos lecturas razonables que cambien la respuesta?;
- supuestos ocultos;
- unidades y notación;
- exactitud y redondeo;
- si las opciones incorrectas revelan errores conceptuales típicos.

Las ocho preguntas canónicas por plantilla están en [gates docentes](../teacher-gates.md).

## Marco de revisión psicopedagógica

Práctico, no diagnóstico. **No se evalúa a nadie en esta reunión.**

- **Carga cognitiva:** ¿cuánto hay que sostener en la cabeza que no sea el problema?
- **Claridad de la consigna:** ¿se entiende qué se pide sin releer?
- **Lectura innecesaria:** ¿hay texto que no aporta a la decisión?
- **Representaciones múltiples:** ¿hay más de una forma de llegar?
- **Conocimiento previo:** ¿qué se asume que ya saben?
- **Interpretación del error:** ¿el resultado explica la consecuencia o sólo marca mal?
- **Motivación sin premio excesivo:** ¿la recompensa acompaña o reemplaza al contenido?
- **Equidad entre estrategias:** ¿una forma válida de resolver queda castigada?
- **Accesibilidad:** ¿algún estado se distingue sólo por color? ¿se puede jugar con teclado?

## Marco de diseño de juego

Ayuda a separar «matemáticamente correcto» de «buena interacción educativa»:

- ¿La decisión se siente significativa?
- **Si sacáramos los números, ¿quedaría la misma decisión?** Si sí, la matemática es decorativa.
- ¿El resultado explica una consecuencia o sólo marca correcto/incorrecto?
- ¿Quien juega tiene agencia real?
- ¿La repetición sigue siendo interesante?

## Evidencia de ingeniería

Para trazabilidad, no para la reunión.

| Qué | Estado |
|---|---|
| Casos del pack reproducibles | `pnpm teacher-gate --validate` en verde |
| Composición de partidas | 20.000 sorteos, 1.404 combinaciones distintas, carga total idéntica |
| Techo del puntaje | partida perfecta = máximo de la escala en 23.000 planes, sin dispersión |
| Una situación contra dos | mismo techo; más situaciones no da más puntaje |
| Sin oportunidad de equipo o Aura | mismo techo que con ella |
| Puntaje en el servidor | recalculado reproduciendo; lo que el cliente afirme no se lee |
| Políticas oficiales | ninguna: dificultad, composición y puntaje llevan `official: false` |
| Tests y build | `pnpm verify` en verde |

Los comandos que producen esta evidencia: `pnpm game:compose`, `pnpm game:score`, `pnpm game:score -- --compare`, `pnpm verify`.

## Buenas prácticas externas que informaron el diseño

**Distinguir claramente:** lo de abajo es contexto externo, no decisión del proyecto. Las decisiones del proyecto están en el [registro de decisiones](../../07-reference/decision-register.md).

- **Diseño Universal para el Aprendizaje (UDL):** la distinción entre una barrera de acceso y el objetivo real de la tarea. Si el objetivo es elegir la mejor alternativa, permitir calculadora saca una barrera que no era el objetivo. Por eso «¿qué apoyos deberían estar disponibles?» es una pregunta del gate y no una decisión tomada.
- **Tareas de piso bajo y techo alto** (*low floor, high ceiling*): la idea de que una misma tarea admita entrada sin conocimiento previo especial y siga ofreciendo profundidad. Es lo que permite que en una feria jueguen 7.º, 5.º año y adultos con el mismo contenido.
- **Teoría de la carga cognitiva:** la dificultad debería venir de la carga intrínseca de la tarea, no de cómo está presentada. Es el fundamento de derivar el nivel de la estructura y no del tamaño de los números.
- **Evaluación con precisión y cobertura juntas:** marcar de más y marcar de menos son errores distintos y ambos cuentan. Es lo que usa el acto del 25.

Las referencias completas están en [base teórica](../../07-reference/research-basis.md). Nada de esto anula una decisión del repositorio.

## Limitaciones conocidas del pack

1. **Los cuatro casos salen del recorrido de demostración**, que juega las seis situaciones del año seguidas. Una partida normal jugaría una o dos por año. Se puede mostrar una partida normal, pero no es lo que conviene mostrar primero: los docentes tienen que poder revisar todas las situaciones.
2. **Ninguna situación de producción alimenta Aura competitiva.** No es un olvido: es la consecuencia de no pagar el mismo hecho dos veces, y está sobre la mesa como decisión TG1-06.
3. **Sólo una situación alimenta trabajo en equipo.** Si el gate decide que el equipo debe pesar en el ranking, hace falta autorar contenido específico.
4. **No se buscó ningún caso espectacular.** Los seeds se eligieron por representatividad, no por rareza estadística.
5. **La ruta de revisión con sorteo fijo vive bajo `/dev`** y está cerrada fuera de desarrollo. Elegir el propio sorteo es exactamente lo que una competencia no puede permitir.
