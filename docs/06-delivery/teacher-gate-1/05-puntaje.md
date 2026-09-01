# El puntaje de competencia · para conversar

**Nada de esta página está decidido.** Es la propuesta que traemos, y lo que necesitamos es que la revisen.

## Primero: dos cosas que no son la misma

| La carrera del personaje | El puntaje de competencia |
|---|---|
| Promedio, Equipo, Aura, Estilo | Matemática, Equipo, Aura |
| Cuenta qué clase de recorrido escolar armó ese chico | Decide el orden en el ranking de la feria |
| Cambia con la historia y con las decisiones | Sólo mira el desempeño medible de la partida |

Están relacionadas, y no son intercambiables. Dos consecuencias concretas:

**El Promedio no suma puntos de competencia.** El promedio sale del desempeño matemático que ya estamos midiendo; sumarlo aparte contaría la misma habilidad dos veces.

**El Estilo no suma puntos de competencia.** Aplicado, Estratega e Improvisador son formas distintas de resolver, no mejores y peores. Darle puntos a una diría que hay una personalidad objetivamente superior, y eso rompe la idea del perfil.

## La propuesta, en una frase

**La matemática pesa claramente más que todo lo demás junto**, y lo demás suma poco y con techo.

En números candidatos: 80 % matemática, 15 % trabajo en equipo, 5 % Aura. Sobre una escala de 0 a 10.000.

## Qué mide cada componente hoy

| Componente | De dónde sale | Situaciones que la alimentan hoy |
|---|---|---|
| **Matemática** | qué tan bien se resolvió cada situación | las siete |
| **Trabajo en equipo** | cuánto jugó el reparto a la fuerza de cada persona | sólo el trabajo grupal |
| **Aura** | desempeño en un momento público | **ninguna, hoy** |

### Por qué Aura no suma hoy, aunque exista

El acto del 25 de Mayo **sí** modifica Aura en la historia del personaje. Pero lo único que ahí se puede medir es qué tan bien clasificó los números, y eso ya se cuenta como matemática. Usar el mismo resultado también como Aura sería premiar dos veces la misma acción con otro nombre.

Así que la componente existe, está limitada por un tope, y hoy ninguna situación de producción la alimenta. Preferimos una componente honestamente vacía a inventar una señal para llenarla.

**Pregunta:** ¿Aura debería influir en el puntaje competitivo? Si sí, ¿qué tendría que medir un evento para que sea evidencia distinta de la matemática?

### Por qué el stand mueve Equipo y no suma equipo

El stand de la feria cambia la relación con el grupo en la historia. Pero lo que ahí medimos es el costo mínimo, que ya es la componente matemática. El cambio en la carrera responde «qué le pasó al grupo»; la evidencia competitiva respondería «qué tan bien colaboró», y esa situación no mide lo segundo.

**Pregunta:** ¿queremos que el ranking mida también capacidades de trabajo en equipo, además de matemática? Si sí, ¿qué tipo de situaciones considerarían evidencia válida?

## Cuando una partida no ofrece una componente

Una partida puede no incluir ninguna situación de trabajo en equipo. En ese caso, **el estudiante no pierde esos puntos por algo que no pudo elegir**: el peso se reparte entre los aspectos que sí estuvieron presentes.

La consecuencia buena: una partida perfecta llega al máximo, siempre, sin importar qué combinación le tocó.

La consecuencia que hay que decidir: **dos partidas podrían estar midiendo combinaciones secundarias distintas**. Una mide matemática y equipo; otra, sólo matemática.

**Pregunta:** ¿les parece aceptable? Las alternativas serían exigir que toda partida incluya una situación de equipo, o dejar el trabajo en equipo afuera del ranking.

## Cuánto vale cada resultado

Cada situación se resuelve en uno de cuatro niveles. La calibración candidata:

| Resultado | Vale |
|---|---|
| Óptima | 100 % |
| Eficiente | 75 % |
| Funcional | 40 % |
| Inválida | 10 % |

Las situaciones que miden algo más fino usan su propia medida en vez de estas cuatro cajas. El acto del 25, por ejemplo, se juzga combinando precisión y cobertura, así que un 86 % y un 99 % no valen lo mismo aunque caigan en el mismo escalón.

**Preguntas:**
- ¿Las diferencias entre niveles representan bien el mérito matemático?
- ¿Una resolución inválida debería recibir algo de crédito, o cero?
- ¿Funcional al 40 % les parece razonable?

## Una pequeña ventaja por resolver lo difícil

Resolver una situación de mayor complejidad da una bonificación chica: 8 % para STANDARD y 15 % para STRETCH.

Es deliberadamente chica. El juego ya intenta que las partidas tengan una carga total comparable **antes** de puntuar; la bonificación sólo reconoce que dentro de esa carga pareja hay situaciones que piden más.

**Pregunta, con las dos posiciones sobre la mesa:**

> Si el juego ya intenta que las partidas tengan una dificultad total comparable, ¿resolver una situación STRETCH debería además otorgar una pequeña ventaja en el puntaje?

*A favor:* reconoce un esfuerzo cognitivo real, y es tan chica que no decide un ranking por sí sola.
*En contra:* si las partidas ya son comparables, la bonificación es un premio por un sorteo que el estudiante no eligió.

## Cuatro ejemplos reales

Calculados con el motor, no inventados para la reunión. `pnpm teacher-gate --scores` los reproduce.

| Partida | Puntaje | Qué muestra |
|---|---|---|
| Todo óptimo (colectivo + acto) | **10.000** | una partida perfecta llega al máximo |
| Todo óptimo, una sola situación | **10.000** | menos situaciones no significa menos techo |
| Matemática óptima, reparto grupal torpe | **7.651** | el equipo flojo baja poco |
| Matemática floja, reparto grupal perfecto | **3.645** | el equipo perfecto no compra la partida |

Los dos primeros son la evidencia de equidad que más nos importa: **nadie debería tener un techo mayor sólo por la combinación de situaciones que le tocó.**

Los dos últimos son la dominancia de la matemática, medida: la distancia entre 7.651 y 3.645 la produce el desempeño matemático, no el trabajo en equipo.

## Tres ponderaciones posibles

| | Matemática | Equipo | Aura | Qué enfatiza |
|---|---|---|---|---|
| **A** | 80 % | 15 % | 5 % | mantiene la matemática dominante y deja lugar a lo demás |
| **B** | 85 % | 10 % | 5 % | reduce el impacto del trabajo en equipo |
| **C** | 90 % | 10 % | 0 % | Aura queda fuera del ranking |

Sobre las mismas cuatro partidas:

| Partida | A · 80/15/5 | B · 85/10/5 | C · 90/10/0 |
|---|---|---|---|
| Todo óptimo (dos situaciones) | 10.000 | 10.000 | 10.000 |
| Todo óptimo (una situación) | 10.000 | 10.000 | 10.000 |
| Matemática óptima, equipo torpe | 7.651 | 8.005 | 8.040 |
| Matemática floja, equipo perfecto | 3.645 | 3.247 | 3.208 |

Donde las tres columnas coinciden, la partida no ofrecía trabajo en equipo ni Aura: no hay nada sobre lo que la ponderación pueda cambiar algo.

**Ninguna de las tres es la recomendada.** Elegir una, o pedir otra, es parte de lo que se decide hoy.

## Lo que no está en el puntaje, y por qué

**La cantidad de intentos.** Premiar más intentos premia tiempo libre; castigarlos castiga la práctica. Queda como dato informativo salvo que ustedes decidan otra cosa.

**La velocidad.** No entra en el puntaje. Si alguna vez se usara para desempatar, habría que decidirlo explícitamente: el reloj mide también qué teléfono tiene cada uno y cuánto tarda en leer.
