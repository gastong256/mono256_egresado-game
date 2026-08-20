# Sistema de desafíos

## Objetivo

Evitar que Egresado se transforme en una secuencia de multiple-choice. El contenido se construye sobre un conjunto limitado de **patrones de interacción reutilizables**.

## Familias iniciales

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
