# Historia de la decisión visual

Por qué Egresado se ve como se ve, y qué **no** hay que volver a discutir.

Este documento absorbe el razonamiento del paquete de diseño v0.2, que ya no vive en el repositorio: lo que valía la pena conservar está acá, en los [assets](assets.md), en las [capturas de referencia](reference/) y en [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md). Es el registro de por qué la implementación tiene la forma que tiene, para que dentro de seis meses nadie «mejore» algo que se eligió a propósito.

## El problema que originó v0.2

La primera fundación (v0.1) era oscura: canvas negro, tipografía display condensada en mayúsculas, barra de progreso segmentada arriba y CTA verde abajo. Funcionaba. Pasaba los gates. Se veía bien.

Y se leía como **«Copero adaptado a la escuela»**.

Egresado se inspira deliberadamente en Copero y El Ídolo, pero en *principios de producto*: economía de información, velocidad, UI primero, decisiones claras, jerarquía numérica fuerte, pocos assets, progresión legible, hitos con peso. Lo que no puede heredar es la expresión visual — un juego de matemática escolar que parece un juego de carrera deportiva no es un homenaje, es una confusión de género que el cliente final (un colegio, en una feria) va a notar antes que nadie.

La auditoría de similitud identificó **cuatro decisiones que juntas formaban la huella**, y ninguna era la culpable por sí sola:

| Decisión de v0.1 | Qué aportaba a la huella |
|---|---|
| Canvas negro en todas las pantallas | el primer motor de parecido, por lejos |
| Display condensada en mayúsculas | la otra mitad de la huella deportiva |
| Barra de progreso segmentada arriba | gramática de HUD de management |
| CTA verde abajo | el remate del mismo lenguaje |

v0.2 **invierte las dos primeras y reemplaza las otras dos**.

## Los tres territorios explorados

El proceso de diseño exploró tres direcciones antes de cerrar.

| | Idea | Qué aportaba |
|---|---|---|
| **1a — Boletín** | el año como documento escolar que se cierra | gramática de cierre: numeral grande, renglones de registro, sello |
| **1b — Hoja cuadriculada** | la superficie donde se hace matemática escolar | canvas, grilla de alineación, geometría de impreso |
| **1c — Legajo** | la carpeta donde queda asentado lo que pasó | pestañas, sellos, el ledger que muestra la cuenta |

## El híbrido que quedó

v0.2 no eligió una: tomó de cada una lo que resolvía un momento distinto del juego.

```text
BASE                     → 1b · hoja cuadriculada
CIERRE DE AÑO / ETAPA    → 1a · conceptos de boletín
RESULTADO / PESTAÑA      → 1c · lenguaje de legajo
AURA                     → su propia isla negra
```

Eso explica una cosa que de otro modo parece incoherente: por qué el cierre de etapa tiene un numeral de 66 px y un sello rotado que no aparecen en ninguna otra pantalla. No es una excepción — es la única pantalla que habla el dialecto del boletín, y por eso «terminaste un año» se siente distinto de «resolviste una situación».

## Lo que **sobrevivió** de v0.1

Vale tanto como lo que cambió. Estas cuatro cosas nunca fueron derivativas y pasaron intactas:

- el modelo de jugador;
- la semántica de resultados (cuatro calidades, nunca correcto/incorrecto);
- el panel de resultado que muestra la cuenta real;
- Aura.

## Decisiones cerradas

No se reabren. Si algo de esto parece discutible, la discusión ya pasó.

| Decisión | Por qué está cerrada |
|---|---|
| **Seleccionar no es acertar** | Es la regla más importante del sistema. El estado seleccionado es blanco/neutro y el color de resultado aparece recién después de Confirmar. Si elegir pintara la opción de verde, el jugador sabría el resultado antes de decidir y la decisión dejaría de existir. |
| **Promedio · Equipo · Aura · Estilo** | Ver [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md). Los cuatro sostuvieron los tres arquetipos con claridad en el prototipo; no hace falta una quinta estadística persistente. |
| **Dominio matemático oculto** | Existe en el estado y no se renderiza. Convertir estado interno en tablero es cómo una pantalla de juego se vuelve un dashboard. |
| **Economía de arte UI-first** | Si una pantalla funciona sin imagen, sale sin imagen. La UI *es* la identidad visual. |
| **Identidad papel v0.2** | Ver [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md). |
| **Los colores calibrados** | Cada tono se eligió y se midió de a uno. No se resamplean «para que combinen mejor». |

## Anti-patrones: qué haría que Egresado dejara de ser Egresado

Rechazado explícitamente por la dirección de arte:

estética de educación infantil · SaaS genérico · glassmorphism · cyberpunk · RPG de fantasía · cliché neón gamer · pizarrón, lápiz y regla como decoración · fondos ilustrados grandes · degradados · ornamento de gamificación · HUD de RPG.

Y de vuelta desde v0.1, porque ya se probó y no funcionó:

geometría de tarjeta deportiva · HUD de management futbolero · display condensada en mayúsculas para títulos · canvas oscuro en todas partes · progresión segmentada estilo deportivo · encuadre de hito deportivo.

## Checklist de distancia

Para cualquier pantalla nueva. Si alguna respuesta es «no», la pantalla se volvió genérica.

1. ¿Se ve la cuadrícula del papel alrededor de los bloques?
2. ¿Los títulos están en caja mixta, sin versalitas gritadas?
3. ¿La marca de corrección cae *sobre* el dato y no en un marco?
4. ¿El radio es 0 y no hay ninguna sombra?
5. ¿El verde brillante aparece únicamente dentro de un bloque negro de Aura?
6. ¿Seleccionar sigue siendo blanco, sin revelar el resultado?
7. ¿El progreso son celdas y no una barra segmentada arriba?
8. ¿El resultado muestra la cuenta real, y no sólo un veredicto?
9. ¿La pantalla seguiría siendo reconocible en escala de grises?

## Lo que la implementación decidió, y por qué

Tres cosas no venían resueltas del paquete de diseño y se resolvieron acá. Las tres quedan registradas porque son exactamente el tipo de decisión que alguien podría creer arbitraria.

**El vocabulario de resultado se traduce, no se renombra.** El motor habla el vocabulario del GDD —`invalid · functional · efficient · optimal`, con sus factores de score documentados— y el jugador lee `Insuficiente · Parcial · Resuelto · Óptimo`. La correspondencia es posicional y total, así que traducir en la capa de presentación no pierde ni inventa nada; renombrar en el dominio habría movido factores de score, tests golden y la huella del ruleset por una decisión de rótulo.

**Los arquetipos de cierre son los ocho perfiles del GDD.** El handoff nombra al pasar tres arquetipos que no están en esa lista —«El Rey del Último Minuto», «El Vago Eficiente», «La Leyenda del Colegio»— como ilustración del tono buscado. Adoptarlos sería un cambio de game design, no de presentación, así que la pantalla usa los ocho nombres del GDD y la diferencia va al registro de preguntas abiertas.

**Aura todavía no aparece en el juego, y es correcto.** Ninguno de los cinco eventos autorados de 7.º es socialmente memorable: el acto del 25 de Mayo, que es el que introduce Aura en el prototipo de diseño, es contenido de diseño y no está autorado en el motor. Las primitivas de Aura están construidas y probadas, y se ven en la vitrina; la tira no la muestra porque el modelo dice que no hay nada que mostrar. Autorar un evento memorable para que la dimensión «aparezca» sería inventar una consecuencia que ningún documento pidió.
