# Métricas de éxito

## North Star inicial

**Tasa de runs completadas con intención de repetir.**

La métrica combina finalización y atractivo. En pruebas cualitativas, preguntar inmediatamente “¿jugarías otra run ahora?” permite detectar si el producto sólo se entiende o también genera rejugabilidad.

## Métricas de experiencia

- Tiempo hasta primera interacción.
- Tiempo total de run.
- Tasa de finalización.
- Tasa de reintento voluntario.
- Abandono por año/desafío.
- Uso de herramientas/pistas.
- Tiempo por tipo de interacción.

## Métricas de contenido

- % de jugadores que eligen cada opción.
- Distribución de score por desafío.
- Tasa de solución funcional/eficiente/óptima.
- Desafíos con tasa de error extrema.
- Desafíos con tiempo de resolución anómalo.
- Diferencia de desempeño por dificultad elegida, nunca por datos personales sensibles.

## Métricas lúdicas

- Diversidad de perfiles finales.
- Número medio de consecuencias narrativas activadas.
- Distribución de decisiones arriesgadas.
- Número de runs por jugador anónimo/sesión.

## Métricas de feria

- Runs iniciadas por hora.
- Runs completadas por hora.
- Usuarios concurrentes aproximados.
- Error rate API.
- Latencia p95 de start/finish/leaderboard.
- Porcentaje de runs enviadas después de modo offline/degradado.

## Targets iniciales de validación

No son contratos; sirven como hipótesis.

- 80% completa la primera run iniciada en pruebas moderadas.
- Mediana de run entre 4 y 7 minutos.
- 50% o más acepta jugar nuevamente cuando se le ofrece de inmediato.
- Menos de 5% abandona por confusión de UI en un desafío individual.
- 95% de requests críticos de feria bajo 1 s en condiciones normales.

## Métricas que NO deben convertirse en KPI principal

- Nota matemática equivalente.
- Cantidad total de clicks.
- Tiempo de pantalla por sí solo.
- Posición individual de estudiantes identificables.

El producto es lúdico y educativo; optimizar exclusivamente engagement puede llevar a patrones de diseño que contradigan el contexto escolar.

## Antes y después de la feria

Porque no hay playtest con estudiantes antes del lanzamiento, conviene separar dos clases de métrica que no se pueden mezclar: las que se pueden **cerrar antes** y las que sólo existen **después**. Ver [ciclo de entrega real](real-delivery-lifecycle.md).

### Gates medibles antes de la release

Son verificables sin jugadores reales, y por eso son gates de verdad.

- 100 % de las variantes competitivas pasan la validación de invariantes;
- 100 % de las runs oficiales son reproducibles por seed, versiones y action log;
- 0 defectos P0/P1 conocidos de motor o de ranking;
- 0 variantes con respuesta ambigua en el catálogo desplegado;
- los flujos móviles representativos pasan en 360, 390 y 430 px;
- operación completa por teclado y con movimiento reducido, verificada;
- las simulaciones de distribución de score no muestran una plantilla ni una posición de respuesta dominando de forma inesperada;
- el leaderboard no se puede actualizar con un score enviado por el cliente.

### Indicadores del Teacher Gate 1

- el contenido queda aceptado o con una lista acotada de correcciones;
- los docentes pueden explicar el objetivo matemático de cada familia de la demo;
- los principios de ranking se consideran apropiados para repartir premios;
- no se pide un rediseño fundacional.

### Evidencia recién disponible en la feria

Telemetría agregada y pseudónima: tasa de finalización, duración activa mediana, distribución de resultados por desafío, punto de abandono, tasa de error, éxito de envío al ranking, distribución de score y mejora entre intentos repetidos.

**Esta es la primera evidencia real de uso.** No puede presentarse retroactivamente como validación previa, y ninguna de las métricas de esta sección reemplaza el playtest que no ocurrió.
