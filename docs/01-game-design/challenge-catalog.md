# Catálogo semilla de desafíos

Este catálogo es backlog de contenido, no compromiso de implementar todos en MVP. Cada entrada debe pasar por la guía de autoría y validación antes de producción.

## 7.º grado

| ID | Escenario | Matemática | Interacción | Decisión/objetivo |
|---|---|---|---|---|
| C01 | Kiosco entre amigos | suma, división, presupuesto | Decision Card | elegir compra que alcance para el grupo |
| C02 | Llegar a horario | tiempo, suma de minutos | Timeline | estimar llegada y elegir transporte |
| C03 | Foto del curso | división y resto | Spatial/Decision | formar filas con restricciones |
| C04 | Mural simple | área y cobertura | Decision Card | comprar pintura suficiente |
| C05 | Repartir impresiones | división | Assignment | distribuir páginas equitativamente |
| C06 | Educación física | distancia/fracciones | Numeric Input | calcular vueltas de pista |
| C41 | Acto del 25 de Mayo | clasificación: paridad, múltiplos, primos | Number Grid | seguir la coreografía marcando los números que cumplen cada regla |

## 1.º año

| ID | Escenario | Matemática | Interacción | Decisión/objetivo |
|---|---|---|---|---|
| C07 | Semana de pruebas | tiempo, priorización | Budget/Timeline | repartir horas de estudio |
| C08 | Notebook en oferta | porcentajes | Decision Card | comparar descuento porcentual/fijo |
| C09 | Materiales para maqueta | proporciones | Budget Builder | comprar cantidades suficientes |
| C10 | Plano del aula | escala | Spatial Grid | ubicar elementos respetando escala |
| C11 | Entradas para acto | porcentajes/capacidad | Numeric/Decision | decidir si se pueden vender más |
| C12 | Recreo compartido | proporción/costo unitario | Decision Card | comparar packs |

## 2.º año

| ID | Escenario | Matemática | Interacción | Decisión/objetivo |
|---|---|---|---|---|
| C13 | Trabajo grupal | asignación/restricciones | Assignment Board | asignar personas según habilidad y horas |
| C14 | Plan de datos del viaje | tasas/unidades | Decision Card | elegir plan suficiente y eficiente |
| C15 | Subir video a la nube | velocidad/unidades | Numeric/Decision | determinar si termina antes del plazo |
| C16 | Torneo escolar | combinatoria básica | Graph/Decision | calcular partidos todos-contra-todos |
| C17 | Comprar remeras | descuentos escalonados | Budget Builder | elegir proveedor según cantidad |
| C18 | Campaña de reciclaje | razones | Chart | comparar kg/alumno entre cursos |

## 3.º año

| ID | Escenario | Matemática | Interacción | Decisión/objetivo |
|---|---|---|---|---|
| C19 | Viaje escolar | presupuesto multietapa | Budget Builder | cubrir transporte/alojamiento/actividades |
| C20 | Rifa del curso | ingresos, costo, probabilidad | Decision Card | elegir estrategia de recaudación |
| C21 | Buffet del evento | margen/costo unitario | Budget Builder | fijar combinación rentable |
| C22 | Horario de stands | intervalos/restricciones | Timeline | asignar franjas sin solapamientos |
| C23 | Cableado del stand | distancia/geometría | Spatial Grid | elegir recorrido suficiente/corto |
| C24 | Batería para exposición | consumo/tasa | Decision Card | elegir batería según duración |

## 4.º año

| ID | Escenario | Matemática | Interacción | Decisión/objetivo |
|---|---|---|---|---|
| C25 | Encuesta estudiantil | porcentajes/muestra | Chart + Request Info | juzgar confianza antes de cambiar campaña |
| C26 | Dos publicaciones | proporciones | Chart/Decision | comparar engagement rate |
| C27 | “Mejoramos 200%” | porcentajes/interpretación | Decision Card | evaluar afirmación y contexto |
| C28 | Seguidores por semana | crecimiento/función | Sequence | proyectar tendencia y decidir inversión |
| C29 | Evento con lluvia | probabilidad/riesgo | Decision Card | elegir plan logístico |
| C30 | Promedio engañoso | media/mediana | Chart | elegir medida representativa |
| C31 | Encuestas incompatibles | tamaño de muestra | Request Info | decidir qué evidencia pesa más |

## 5.º año

| ID | Escenario | Matemática | Interacción | Decisión/objetivo |
|---|---|---|---|---|
| C32 | Feria de ciencias | presupuesto + tiempo + riesgo | Multi-step | elegir proyecto viable |
| C33 | Stand final | área/perímetro/optimización | Spatial Grid | maximizar uso de espacio con circulación |
| C34 | Proyecto de software | horas/capacidad | Assignment Board | distribuir backlog entre equipo |
| C35 | Hosting del proyecto | costo fijo/variable | Decision Card | elegir plan según tráfico esperado |
| C36 | Imprimir merchandising | break-even | Numeric/Decision | determinar cantidad mínima rentable |
| C37 | Transporte a competencia | tasas/costos | Decision Card | comparar rutas y medios |
| C38 | Presentación final | scheduling | Timeline | ordenar tareas críticas antes del deadline |
| C39 | Encuesta final | estadística/intervalos | Chart | detectar conclusión excesiva |
| C40 | Fondo de egresados | porcentajes/crecimiento | Decision Card | comparar planes de ahorro simples |

## Eventos especiales / bosses

| ID | Evento | Combinación |
|---|---|---|
| B01 | Organizar el viaje | presupuesto + proporciones + tiempo |
| B02 | Torneo escolar | combinatoria + scheduling + recursos |
| B03 | Semana de exámenes | optimización + tiempo + energía |
| B04 | Centro de estudiantes | estadística + porcentajes + estrategia |
| B05 | Feria final | geometría + presupuesto + asignación + riesgo |
| B06 | Reactor 42 cameo | aritmética/composición de expresiones |

## Plantillas recomendadas para el primer vertical slice

Implementar primero una muestra deliberadamente diversa:
- C02 Timeline.
- C04 Decision Card/geometry.
- C08 porcentajes.
- C13 Assignment Board simplificado.
- C14 tasas/unidades.
- C25 Chart/Request Info.
- C33 Spatial Grid simplificado.
- C35 trade-off de costos.

Esto prueba ocho tipos de razonamiento sin necesitar contenido definitivo para todas las etapas.

## Implementado

Contenido de producto que existe en el repositorio, en `src/content/grade-7/`. Seis desafíos y nueve storylets; el resto del catálogo sigue siendo backlog.

| ID en código | Entrada del catálogo | Interacción | Matemática | Escenario implementado |
|---|---|---|---|---|
| `g7.bus-timing` | C02 | Timeline | porcentaje sobre una duración, suma de minutos | elegir a qué hora salir sabiendo que el viaje se demora |
| `g7.may-25-act` | C41 | Number Grid | paridad, múltiplos de 3 y números primos | seguir la coreografía del acto escolar con una ayudamemoria numérica |
| `g7.mural-paint` | C04 | Decision Card | área y cobertura por litro, compra por envase entero | comprar la pintura del mural |
| `g7.notebook-offer` | C08 | Decision Card | descuento porcentual contra descuento fijo | elegir la oferta que entra en el presupuesto |
| `g7.group-tasks` | C13 | Assignment Board | asignación con horas disponibles y habilidad | repartir el trabajo grupal |
| `g7.stand-supplies` | C09 | Budget Builder | costo unitario por pack, mínimo que alcanza | comprar insumos para el stand de la feria |

### Acto del 25 de Mayo

`g7.may-25-act` · interacción `number-grid` · dificultad base 2 · categorías `patterns-and-relations` y `quantity`.

**Estado: autorado.** Es contenido de producción, no una propuesta. Es también la respuesta a la pregunta abierta 35: es el evento que introduce Aura.

**Propósito narrativo.** Al jugador le toca la coreografía folklórica del acto escolar, adelante de toda la escuela. Como no se acuerda los pasos, armó una ayudamemoria: cada paso tiene una regla numérica, y de la tira de números que canta la maestra acompaña sólo los que la cumplen. Es el único momento del año que pasa en público, y ésa es exactamente la condición que Aura pide.

**Interacción.** Tres pasos, uno debajo del otro, resueltos en una sola confirmación. Cada paso muestra su señal —«Pañuelo blanco», «Pañuelo celeste», «Zapateo»— y su regla **siempre escrita**, más una grilla de ocho números en cuatro columnas. Se marca celda por celda. Ninguna celda revela si estuvo bien hasta que el motor evalúa: marcado significa «elegí ésta», nunca «acerté».

**Rondas.** Tres variantes autoradas que el seed elige, siempre en el mismo orden de dificultad:

| Paso | Señal | Regla | Objetivos por grilla |
|---|---|---|---|
| 1 | Pañuelo blanco | números pares | 4 de 8 |
| 2 | Pañuelo celeste | múltiplos de 3 | 3 de 8 |
| 3 | Zapateo | números primos | 3 de 8 |

Todos los números son enteros de 0 a 30, para que la clasificación nunca dependa de una cuenta difícil. La ronda de primos incluye el **1** a propósito: es el error clásico de la edad, y la grilla corregida lo muestra tachado sin retar a nadie.

**Matemática.**

- **Par**: entero divisible por 2. El cero es par.
- **Múltiplo de 3**: entero divisible por 3.
- **Primo**: entero mayor que 1 con exactamente dos divisores positivos. Por lo tanto **0 no es primo**, **1 no es primo** y **2 sí lo es**, el único primo par.

Las tres viven en `src/game/math/classification.ts`, fuera de React y fuera del contenido: es el único lugar del producto donde se decide si un número cumple una regla.

**Evaluación.** Los tres pasos se agregan sumando sus confusiones —`TP` aciertos, `FP` marcas de más, `FN` objetivos sin marcar— y se juzgan con un solo F1. Micro-agregar y no promediar tres F1 hace que cada celda pese lo mismo.

```
precisión = TP / (TP + FP)
cobertura = TP / (TP + FN)
F1        = 2·TP / (2·TP + FP + FN)
```

Se juzga con **las dos juntas** y no sólo con la precisión, porque cada una tiene su forma de mentir: marcar una sola celda evidente da 100 % de precisión sin haber hecho la tarea, y marcar la grilla entera da 100 % de cobertura. Los tres casos de denominador cero están decididos explícitamente: no marcar nada teniendo objetivos da precisión 0 —no marcar no es acertar—; una ronda sin objetivos y sin marcas vale 1 en las tres.

**Umbrales.** Sobre el F1 agregado, comparados como racionales exactos:

| F1 | Calidad | Lo que se lee |
|---|---|---|
| = 1 | `optimal` | Óptimo · «Impecable» |
| ≥ 0,85 | `efficient` | Resuelto · «Salió» |
| ≥ 0,70 | `functional` | Parcial · «Zafaste» |
| < 0,70 | `invalid` | Insuficiente · «Se cortó» |

Están elegidos para que ninguna estrategia degenerada pase por buena: marcar las 24 celdas da `F1 = 0,67` y cae en Insuficiente.

**Aura.** `+1000` impecable · `+400` salió con un error · `+80` zafó improvisando · `−300` se cortó. Es la dimensión que este evento existe para establecer, y puede quedar en positivo o en negativo.

**Estilo.** Aplicado cuando salió completo y con cuidado; Estratega cuando lo sostuvo leer el patrón rápido pese a un error; Improvisador cuando la coreografía se reconstruyó en vez de seguirse —tanto al zafar como al cortarse—. Ningún eje es mejor que otro.

**Promedio.** No lo toca. Un acto escolar no es una evaluación de matemática, y Promedio sale del legajo de notas reales: que un desafío tenga números no lo vuelve académico.

**Equipo.** No lo toca. Bailás vos; el curso mira.

**Fail-forward.** No hay game over. El peor acto deja Aura negativa, evidencia de Improvisador y una consecuencia narrativa, y el año sigue.

**Determinismo.** Las tres variantes se eligen con el RNG sembrado del motor, direccionado por la etapa, el índice de evento y la dificultad. Misma seed y mismas acciones producen el mismo acto. El contenido subió a `0.3.0-grade-7` porque el año cambió de siete a ocho eventos.

**Accesibilidad.** Cada celda es una casilla nativa de 56 px: se recorre con Tab y se marca con Espacio. La regla siempre está en texto y nunca es sólo un color. Los cuatro estados corregidos cambian relleno, trazo de borde y glifo a la vez, y llevan además la palabra para lector de pantalla, así que la grilla se lee entera en escala de grises.

Desvíos deliberados respecto del catálogo semilla:

- **C08 y C13 se adelantaron a 7.º grado.** El catálogo los ubica en 1.º y 2.º año. El slice necesitaba cinco tipos de interacción distintos para probar que el motor y la UI soportan variedad real, y la matemática de ambos (porcentaje simple, asignación con restricciones) es accesible en 7.º. Cuando se implementen 1.º y 2.º año, esos escenarios se reescriben con números y contexto propios de cada etapa; no se reutiliza la instancia de 7.º.
- **C09 cambió de escenario.** El catálogo lo describe como materiales para una maqueta; se implementó como insumos para el stand de la feria, porque cierra el arco narrativo del año. La matemática y la interacción son las declaradas.
- **C01, C03, C05 y C06 no se implementaron.** El resto queda como backlog para variar el año entre partidas.

El detalle de variantes, calidades y consecuencias de cada uno está en [el diseño del slice](../06-delivery/vertical-slice-grade-7.md).
