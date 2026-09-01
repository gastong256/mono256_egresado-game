# Los casos de la sesión

Cuatro casos preparados. Los dos primeros son la sesión central; los otros dos salen si sobra tiempo.

Cada uno arranca con un sorteo fijo, así que **dos personas en dos días distintos ven exactamente la misma situación**. Eso es lo que permite discutir sobre lo mismo.

Para ver la ficha completa de cualquiera:

```bash
pnpm teacher-gate --case TG1-A
```

`pnpm teacher-gate --validate` comprueba que los cuatro sigan mostrando lo que este documento dice.

---

## TG1-A · El colectivo, elegir en cuál subirse

**Para qué está:** que Egresado se entienda jugando, sin que nadie lo explique antes.
**Tiempo:** 4 minutos. **Nivel propuesto:** STANDARD.

**Qué va a ver el docente**

El viaje al colegio dura 36 minutos y hoy el colectivo demora un 50 % más. La entrada es a las 08:00, sin excepción. Hay cuatro horarios de salida: 06:59, 07:05, 07:09 y 07:19.

**Trabajo matemático**

Calcular cuánto dura el viaje hoy —36 más la mitad, 54 minutos— y decidir cuál de las cuatro salidas llega a horario. La última salida segura es 07:06, así que dos de las cuatro sirven; entre ésas, una hace esperar seis minutos más que la otra en la puerta. Elegir bien no es sólo llegar: es llegar sin perder la mañana.

**Qué observar**

- ¿Entendió qué le piden sin preguntar?
- ¿Qué dato miró primero?
- ¿Descartó opciones o calculó una sola?
- ¿El resultado le explicó la consecuencia o sólo le dijo si acertó?

**Preguntas**

- ¿Este razonamiento corresponde al nivel que esperarían en 7.º?
- ¿La dificultad viene del razonamiento o de hacer la cuenta?
- ¿La consigna es clara sin ayuda?
- ¿Cambiarían algo de la situación o de los números?

---

## TG1-B · El colectivo, decir con cuánto tiempo salir

**Para qué está:** mostrar que la misma situación puede pedir un razonamiento distinto. No otros números: otra pregunta.
**Tiempo:** 2 minutos. **Nivel propuesto:** STANDARD.

**Qué va a ver el docente**

El mismo colectivo. Hoy el viaje dura 20 minutos y demora un 15 % más. La entrada sigue siendo a las 08:00 y el grupo pide llegar 10 minutos antes. **No hay opciones para elegir:** hay que escribir el número.

**Trabajo matemático**

Recorrer la misma relación al revés. En el caso A se va hacia adelante desde cada salida; acá se va hacia atrás desde la hora de llegada, sumando el margen que pidió el grupo. La respuesta —33 minutos de anticipación— hay que construirla, no reconocerla entre alternativas.

**En qué se diferencia de A, exactamente**

| | TG1-A | TG1-B |
|---|---|---|
| Pregunta | ¿a qué salida me subo? | ¿con cuánto tiempo salgo? |
| Trabajo | evaluar cuatro candidatas y descartar | ir hacia atrás desde la llegada |
| Respuesta | está entre las opciones | la produce quien juega |
| Error | elegir mal | quedarse corto o pasarse |

Ésta es la diferencia que el pack quiere que se discuta: **no cambian los números, cambia el razonamiento**.

**Preguntas**

- ¿Es razonable que estas dos versiones convivan como situaciones distintas?
- ¿Producir la respuesta debería considerarse más exigente que elegirla entre cuatro?
- ¿Las dos deberían estar en el mismo nivel, o una es más difícil?

---

## TG1-C · El acto del 25 de Mayo *(si hay tiempo)*

**Para qué está:** revisar la única situación que ocurre en público y la única que mueve Aura.
**Tiempo:** 3 minutos. **Nivel propuesto:** CORE.

**Qué va a ver el docente**

Tres pasos de una coreografía, cada uno con su regla escrita y ocho números para marcar:

| Paso | Señal | Regla |
|---|---|---|
| 1 | Pañuelo blanco | números pares |
| 2 | Pañuelo celeste | múltiplos de 3 |
| 3 | Zapateo | números primos |

En el paso de primos aparece el **1**, a propósito: es el error clásico de la edad, y la corrección lo muestra sin retar a nadie.

**Trabajo matemático**

Clasificar según una regla. Se corrige con precisión y cobertura a la vez, así que ni marcar todo ni marcar una sola celda alcanzan.

**Preguntas — hacerlas por separado, no juntas**

*Pedagogía*
- ¿Pares, múltiplos y primos son apropiados para 7.º?
- ¿La tarea de clasificar es clara y tiene sentido matemático?
- ¿La estrategia de marcar sólo lo seguro debería dar un resultado aceptable?

*Narrativa*
- ¿El contexto del acto escolar es creíble y respetuoso?
- ¿Tiene sentido que un momento público mueva algo así como «Aura»?

*Competencia*
- ¿Un evento de este tipo debería influir en el ranking?
- Si sí, ¿qué evidencia sería distinta de la matemática que ya se mide?

---

## TG1-D · El trabajo grupal *(si hay tiempo)*

**Para qué está:** revisar la única situación que hoy aporta evidencia de trabajo en equipo al puntaje.
**Tiempo:** 3 minutos. **Nivel propuesto:** STRETCH.

**Qué va a ver el docente**

Cuatro partes del trabajo y cuatro personas con horas disponibles y fuerzas distintas. Hay que repartir sin pasarse de las horas de nadie.

**Trabajo matemático**

Asignación con dos restricciones que hay que sostener juntas, buscando el mejor reparto y no solamente uno que entre.

**Por qué está en la conversación de puntaje**

Es la única situación de 7.º donde el juego mide **dos hechos distintos**: si el reparto era factible —eso es matemática— y cuánto jugó a la fuerza de cada uno —eso es lo que la componente de equipo lee—. Se puede armar un reparto que entra y es torpe, y uno que entra y está bien pensado.

**Preguntas**

- ¿Esto es evidencia válida de trabajo en equipo, o es matemática de asignación con otro nombre?
- ¿El ranking debería medir también capacidades de trabajo en equipo?
- Si sí, ¿qué situaciones considerarían evidencia válida?

---

## Una limitación que conviene decir en voz alta

Los cuatro casos salen del **recorrido de demostración** de 7.º, que juega las seis situaciones del año seguidas. Una partida normal jugaría una o dos por año. La diferencia está explicada en [06-preguntas.md](06-preguntas.md), en la decisión TG1-12.

No se buscó ningún caso «espectacular». Se buscaron casos representativos: si una situación se ve rara, es porque el contenido la produce así, no porque se haya elegido el sorteo más raro.
