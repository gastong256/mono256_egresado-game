# Marco de diseño matemático

## Propósito

Definir cómo Egresado usa matemática de forma auténtica, escalable y apropiada para estudiantes de 12–17 años.

## Principio central

La matemática debe ser necesaria para comprender o mejorar una acción en el juego. Se evita el patrón “juego → pausa → ejercicio → juego”.

## Ciclo cognitivo objetivo

1. **Interpretar** una situación.
2. **Identificar** datos relevantes y faltantes.
3. **Formular** una representación matemática.
4. **Operar/razonar** con ella.
5. **Decidir**.
6. **Interpretar** la consecuencia.

## Dominios

Alineación conceptual con categorías amplias de alfabetización matemática:

### Cantidad
Dinero, unidades, escalas, conteos, divisiones.

### Cambio y relaciones
Tasas, crecimiento, secuencias, funciones.

### Espacio y forma
Área, perímetro, escala, disposición espacial.

### Incertidumbre y datos
Probabilidad, muestras, gráficos, porcentajes, evidencia.

## Progresión orientativa

| Etapa | Foco dominante | Ejemplos |
|---|---|---|
| 7.º | operaciones, tiempo, dinero, área simple | compras, horarios, mural |
| 1.º | porcentajes, proporciones, escalas | descuentos, repartos |
| 2.º | tasas y restricciones | consumo, velocidad, presupuesto |
| 3.º | problemas multietapa, optimización | recaudación, asignación |
| 4.º | estadística, probabilidad, funciones | encuestas, tendencias |
| 5.º | integración e incertidumbre | proyecto final, trade-offs |

La progresión real debe adaptarse al currículo de la institución si se usa pedagógicamente de forma formal.

## Niveles de variante de un mismo escenario

### Básico
Números enteros, una restricción, una operación principal.

### Intermedio
Decimales/porcentajes, dos pasos, varias opciones válidas.

### Avanzado
Datos irrelevantes, restricciones múltiples, optimización, incertidumbre.

Ejemplo Mural:
- básico: 6×2, cobertura 6 m²/L;
- intermedio: 6×2,4, cobertura 8;
- avanzado: descontar puerta, dos manos, comparar packs/precio.

## Herramientas

Permitir calculadora cuando el objetivo sea modelar/decidir. Un modo competitivo puede limitar herramientas sólo si esa limitación forma parte explícita de la competencia evaluada.

## Feedback

El feedback debe incluir los números que explican la consecuencia.

### Correcto/óptimo
Mostrar por qué alcanza y por qué es eficiente.

### Incorrecto
Mostrar la restricción violada, no sólo la respuesta esperada.

### Solución alternativa
Reconocerla si cumple las reglas, incluso si no era la respuesta prevista originalmente.

## Ambigüedad

No publicar un desafío si:
- existen interpretaciones razonables no contempladas;
- faltan unidades;
- redondeo cambia la respuesta sin regla declarada;
- varias respuestas son equivalentes y el sistema marca sólo una;
- la narrativa contradice el modelo matemático.

## Redondeo

Cada desafío declara:
- precisión interna;
- regla de redondeo de display;
- tolerancia de input;
- unidad esperada.

No comparar floats de forma exacta.

## Validación pedagógica

Antes de marcar contenido como `production_ready`:
- revisión matemática;
- revisión de lenguaje;
- prueba con al menos un usuario del rango objetivo **cuando sea posible**, sabiendo que antes de la feria probablemente no lo sea: la validación formal previa es la del Departamento de Matemática, ver [gates docentes](../06-delivery/teacher-gates.md);
- test procedural de invariantes.

## Piso bajo, techo alto

La dificultad no sube por números más grandes ni por decimales más feos: sube por cantidad de relaciones, restricciones simultáneas, información irrelevante que hay que filtrar, planificación multipaso, optimización y incertidumbre. Un desafío rico puede usar aritmética elemental.

Esto no es sólo pedagogía: es un requisito de producto. En la feria juegan chicos de 7.º y adultos, y una sola «dificultad media de currículo» deja afuera a los dos extremos. El desarrollo completo —bandas `CORE / STANDARD / STRETCH`, presupuesto de dificultad y su correspondencia con `DifficultyLevel` 1–5— está en [dificultad y jugabilidad universal](difficulty-and-playability.md).

### Los tres niveles de variante, en las tres escalas

| Este documento | Banda de autoría | Nivel del motor |
|---|---|---|
| básico | CORE | 1–2 |
| intermedio | STANDARD | 3 |
| avanzado | STRETCH | 4–5 |

Es una lectura documental para poder leer juntos los tres vocabularios. No implica ninguna migración de código.

## Apoyos y barreras de acceso

Si el objetivo de una tarea es modelar y decidir, la fórmula visible o la calculadora no bajan el techo: sacan una barrera que no era el objetivo. Es la distinción de UDL entre barrera de acceso y objetivo real de la tarea; ver [base teórica](../07-reference/research-basis.md).

Qué desafíos ofrecen qué apoyo, y si eso cambia en modo competitivo, es una decisión docente pendiente ([preguntas 7 y 45](../07-reference/open-questions.md)).
