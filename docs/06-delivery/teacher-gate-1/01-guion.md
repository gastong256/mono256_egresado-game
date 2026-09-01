# Guion de la sesión · 15 minutos

Para el facilitador. Los textos entre comillas son para decir en voz alta, no para leer palabra por palabra.

**Regla de oro:** la primera partida se juega **sin explicación previa**. Lo más valioso de esta reunión es dónde alguien que sabe matemática se traba solo, y explicar antes destruye ese dato para siempre.

---

## 00:00 – 01:00 · Contexto

**Objetivo:** que sepan qué se les pide y qué no.

**Qué decís:**

> «Egresado es un juego de partidas cortas donde un estudiante recorre la secundaria resolviendo situaciones con matemática. Hoy no venimos a mostrarles si el software anda: eso ya está probado. Venimos a que decidan cuatro cosas: si la matemática es apropiada, si los niveles que propusimos son razonables, cómo debería armarse el puntaje de una competencia, y qué habría que cambiar antes de producir el resto del juego.
>
> Van a jugar dos situaciones. **No les voy a explicar cómo se juegan**, a propósito: quiero ver dónde se traban.»

**Qué NO explicás todavía:** el modelo de carrera, las variantes, cómo se compone una partida, el puntaje. Todo eso viene después de que jueguen.

---

## 01:00 – 05:00 · Caso TG1-A · El colectivo

**Objetivo:** que Egresado se entienda jugando.

**Qué mostrás:** `pnpm teacher-gate --case TG1-A` da la URL. Abrís, le pasás el teclado o el teléfono, y te callás.

**Qué hace el docente:** escribe un nombre, avanza, y resuelve la situación del colectivo.

**Qué observás y anotás** — esto es el dato, no su opinión:

- ¿Entendió qué le piden sin preguntar?
- ¿Qué dato miró primero?
- ¿Descartó opciones o calculó una sola?
- ¿Dónde dudó?
- Cuando resolvió, ¿el resultado le explicó la consecuencia o sólo le dijo si acertó?

**Qué preguntás, recién ahora:**

> «¿Este razonamiento corresponde al nivel que esperarían en 7.º?»
>
> «¿La dificultad viene del razonamiento o de hacer la cuenta?»
>
> «¿La consigna se entiende sin ayuda?»

**Tipo de decisión:** TG1-01 (nivel matemático) y TG1-02 (situaciones).

**Si se va de tiempo:** cortás la conversación sobre los números concretos —«eso lo anoto y lo vemos después»— y pasás al caso B. El contraste es más importante que afinar un enunciado.

---

## 05:00 – 07:00 · Caso TG1-B · El mismo colectivo, otra pregunta

**Objetivo:** mostrar que dos partidas pueden pedir razonamientos distintos, no sólo otros números. Es la idea que sostiene todo el diseño de contenido.

**Qué mostrás:** `pnpm teacher-gate --case TG1-B`. Otra vez sin explicar.

**Qué decís, sólo si no lo nota solo:**

> «Es la misma situación de antes. ¿Qué cambió?»

**Qué observás:**

- ¿Notó que es el mismo contexto con la pregunta dada vuelta?
- ¿Le costó más producir el número que elegir entre opciones?

**Qué preguntás:**

> «¿Es razonable que estas dos versiones convivan como situaciones distintas?»
>
> «¿Producir la respuesta debería considerarse más exigente que elegirla entre cuatro?»

**Tipo de decisión:** TG1-03 (clasificación de dificultad).

**Lo que NO hacés acá:** explicar cómo se generan las variantes ni cuántas hay. Si preguntan, respondés en una frase y seguís.

---

## 07:00 – 10:00 · Niveles

**Objetivo:** que revisen la clasificación propuesta de las siete situaciones.

**Qué mostrás:** la tabla de [04-dificultad.md](04-dificultad.md), impresa o en pantalla. `pnpm teacher-gate --difficulty` da la misma lista desde el motor.

**Qué decís:**

> «Clasificamos cada situación en tres niveles. La idea es que el nivel salga de cuántas cosas hay que sostener a la vez, no de qué tan feas son las cuentas. Estos son nuestros candidatos y necesitamos que los revisen.»

**Qué preguntás:**

> «¿Alguna está claramente mal ubicada?»
>
> «¿Hay alguna donde la dificultad venga de la aritmética y no del razonamiento?»
>
> «¿El mismo contenido le seguiría resultando un desafío a un adulto?»

**Tipo de decisión:** TG1-03.

**MUST DISCUSS.** Si el tiempo aprieta, se recortan los casos C y D, no esto: la clasificación condiciona todo el contenido de 1.º a 5.º.

---

## 10:00 – 13:00 · Puntaje

**Objetivo:** decidir la filosofía, no los decimales.

**Qué mostrás:** [05-puntaje.md](05-puntaje.md), y `pnpm teacher-gate --scores` para los ejemplos y la comparación.

**Qué decís, en este orden** — filosofía primero, números después:

> «Separamos dos cosas. Una es la carrera del personaje: promedio, equipo, aura y estilo, que es la historia de ese chico. La otra es el puntaje de competencia, que decide el ranking de la feria. No son lo mismo, y creemos que el promedio no debería sumar dos veces.
>
> La propuesta es que la matemática pese claramente más que todo lo demás junto. Miren estos cuatro ejemplos.»

**Qué preguntás, en orden de importancia:**

> «¿Aceptan un puntaje dominado por la matemática?»
>
> «¿El trabajo en equipo debería influir en el ranking? ¿Qué situaciones considerarían evidencia válida?»
>
> «Aura hoy no aporta puntos de competencia: el acto del 25 mueve Aura en la historia, pero lo único que medimos ahí es matemática, y usarlo dos veces sería premiar lo mismo dos veces. ¿Aura debería influir?»
>
> «Una partida puede no incluir una situación de equipo. En ese caso no se pierden esos puntos: el peso se reparte entre lo que sí estuvo. ¿Les parece aceptable que dos partidas midan combinaciones distintas?»

**Tipo de decisión:** TG1-04 a TG1-07.

**MUST DISCUSS:** dominancia de la matemática y equipo/Aura. Si falta tiempo, la normalización por oportunidad se puede diferir un día, pero no más: bloquea el diseño de contenido de los años siguientes.

---

## 13:00 – 15:00 · Decisiones

**Objetivo:** salir con una palabra por ítem, no con una sensación.

**Qué hacés:** abrís [07-planilla-decisiones.md](07-planilla-decisiones.md) y la recorrés en voz alta.

**Qué decís:**

> «Necesito una de cuatro palabras por cada punto: aceptar, ajustar, rechazar o diferir. Si es ajustar, necesito saber qué. Si no hay acuerdo, lo anoto como desacuerdo y no lo cierro.»

**Lo que no hacés:** forzar consenso. Un desacuerdo registrado es un resultado válido y útil; un «se ve bien» de compromiso no lo es.

---

## Si sobra tiempo

En este orden:

1. **TG1-C · El acto del 25 de Mayo** (3 min) — pedagogía, narrativa y competencia, preguntadas por separado. Ver [03-casos.md](03-casos.md).
2. **TG1-D · El trabajo grupal** (3 min) — la única situación que hoy aporta evidencia de equipo.

## Si falta tiempo

Se difieren, en este orden:

1. política de intentos (TG1-10);
2. política de empate (TG1-11);
3. duración objetivo de la partida (TG1-12).

Ninguna de las tres bloquea la etapa siguiente. La justificación está en [06-preguntas.md](06-preguntas.md).

## Qué no explicar nunca en esta reunión

- Cómo se generan las variantes por dentro.
- Qué es un seed, un catálogo o una huella.
- Cómo el servidor verifica una partida.
- Nada de arquitectura de software.

Si alguien pregunta, hay una respuesta de una frase en el [anexo](10-anexo.md). Después de la reunión.
