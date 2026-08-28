# Sistema de desafíos

## Objetivo

Evitar que Egresado se transforme en una secuencia de multiple-choice. El contenido se construye sobre un conjunto limitado de **patrones de interacción reutilizables**.

## Familias iniciales

> **Acá «familia» significa patrón de interacción**, no dominio narrativo. La otra acepción —`ScenarioFamily`: Colectivo, Mural, Stand— está en [familias, plantillas y variantes](challenge-families-and-variants.md). Una familia de escenario puede usar varias de estas interacciones, y al revés.


### 1. Decision Card
El jugador compara opciones y elige una.

Usos:
- descuentos;
- rutas;
- compras;
- decisiones de riesgo.

### 2. Numeric Estimate / Input
Ingresa o ajusta un valor.

Usos:
- hora de llegada;
- cantidad necesaria;
- presupuesto objetivo.

### 3. Budget Builder
Agrega packs/ítems bajo restricciones.

Usos:
- fiesta;
- viaje;
- materiales.

### 4. Assignment Board
Arrastra personas/recursos a tareas.

Usos:
- trabajo grupal;
- cronograma;
- distribución de puestos.

### 5. Timeline
Ubica eventos, estima duración o selecciona ventanas.

Usos:
- colectivo;
- estudio;
- cronogramas.

### 6. Chart / Data Interpretation
Interpreta gráficos, tablas o encuestas.

Usos:
- centro de estudiantes;
- métricas de redes;
- rendimiento de una campaña.

### 7. Spatial Grid
Ubica objetos en un plano o calcula coberturas.

Usos:
- stand;
- mural;
- distribución de aula.

### 8. Information Request
Permite pedir un dato antes de decidir.

Usos:
- tamaño de muestra;
- costos ocultos;
- restricciones no visibles inicialmente.

### 9. Sequence / Trend
Predice o decide según una serie.

### 10. Special Minigame
Interacción excepcional, por ejemplo Reactor 42. No debe convertirse en dependencia para el MVP.

## Taxonomía matemática

- Cantidad.
- Proporciones y porcentajes.
- Tiempo y tasas.
- Espacio y forma.
- Patrones y relaciones.
- Datos y estadística.
- Probabilidad e incertidumbre.
- Optimización y restricciones.

## Ejemplos canónicos

### Mural
Pared 6 × 2,4 m; cobertura 8 m²/L; elegir pack suficiente/óptimo.

### Notebook
Comparar 20% de descuento vs descuento fijo/cuotas y restricción de efectivo.

### Encuesta
Interpretar 41/38/21 con muestra 90/600 y decidir nivel de confianza.

### Colectivo
28 min con 25% de demora desde 07:10 y entrada 07:45.

### Trabajo grupal
Asignar integrantes con habilidades y horas limitadas.

### Plan de datos
600 MB/día durante 12 días; comparar packs.

### Interacción de redes
Comparar engagement relativo, no likes absolutos.

## Dificultad

La dificultad no depende sólo de números grandes.

Factores:
- cantidad de variables;
- necesidad de múltiples pasos;
- decimales/fracciones;
- información irrelevante;
- información faltante;
- número de restricciones;
- incertidumbre;
- cantidad de soluciones válidas;
- necesidad de optimización y no sólo factibilidad.

## Generación procedural

Patrón recomendado:

1. Generar parámetros desde seed.
2. Resolver el problema internamente.
3. Verificar invariantes.
4. Calcular conjunto de soluciones válidas.
5. Clasificar dificultad.
6. Renderizar narrativa.

Nunca generar opciones al azar y asumir que una es correcta.

## Regla de contenido

Cada desafío debe documentar explícitamente:
- concepto matemático;
- competencia requerida;
- interacción;
- solución/es;
- función de evaluación;
- explicación de feedback;
- parámetros válidos;
- edge cases.

## Variación estructural, no sólo numérica

El patrón de generación de arriba evita que una variante salga rota. No evita que el jugador memorice la respuesta: si el mismo escenario siempre pregunta lo mismo, cambiar `25 %` por `15 %` compra una partida más y nada más.

La arquitectura vigente agrega un nivel intermedio —**plantillas**: estructuras de razonamiento distintas dentro del mismo escenario— y un catálogo aprobado de variantes prevalidado. Ver [familias, plantillas y variantes](challenge-families-and-variants.md) para la jerarquía, la generación por restricción y los controles anti-memorización, y [validación y auditoría de variantes](../04-quality/variant-validation-and-audit.md) para los invariantes que una variante aprobada debe cumplir.

La jerarquía y el pipeline están **implementados** por [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md) y [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md): cinco plantillas de producción tienen fuente generada y una fuente autorada, todas validadas. El catálogo `grade-7-dev-1` prueba profundidad paramétrica; la profundidad **cognitiva** —más de una plantilla significativa dentro de una familia de producción— sigue siendo trabajo de STAGE-04.

## Bandas de dificultad

Además de `DifficultyLevel` 1–5, la autoría y la competencia usan tres bandas —`CORE`, `STANDARD`, `STRETCH`— que describen estructura de razonamiento en vez de intensidad. La correspondencia entre ambas escalas y el presupuesto de dificultad están en [dificultad y jugabilidad universal](difficulty-and-playability.md).
