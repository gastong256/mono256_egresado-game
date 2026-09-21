# Visión de producto

## Nombre

**Egresado**

## One-liner

Videojuego web de partidas cortas donde el jugador recorre su secundaria resolviendo desafíos matemáticos contextualizados y construyendo una historia personal hasta el egreso.

## Elevator pitch

Egresado toma la progresión rápida y compartible de los simuladores de carrera basados en decisiones y la aplica a una experiencia escolar. Cada año presenta situaciones cercanas —horarios, compras, trabajos grupales, viajes, encuestas, proyectos, geometría, estadísticas y decisiones bajo incertidumbre— en las que entender los números mejora las decisiones. Las consecuencias alimentan una narrativa de carrera escolar y culminan en un perfil de egreso y un score comparable con otros jugadores.

## Problema de producto

Muchos juegos educativos separan diversión y contenido: el jugador realiza una actividad lúdica y el aprendizaje aparece como pregunta interrumpiendo el juego. Ese enfoque reduce la matemática a un requisito extrínseco.

Egresado busca que la matemática sea una herramienta para actuar dentro del sistema. El desafío no es “resolver una cuenta para continuar”, sino decidir qué comprar, cómo distribuir tiempo, cómo interpretar una encuesta, cómo asignar un equipo o cómo optimizar recursos.

## Propuesta de valor

### Para estudiantes
- Una partida breve y reconocible.
- Problemas vinculados con situaciones cotidianas.
- Resultado final que cuenta “qué clase de estudiante fuiste”.
- Posibilidad de comparar runs sin convertir la experiencia en examen.

### Para docentes
- Matemática aplicada a contextos significativos.
- Evidencia observable de razonamiento, no sólo cálculo mecánico.
- Posibilidad de discutir decisiones y alternativas después de jugar.
- Contenido ajustable por nivel de dificultad.

### Para una feria
- Entrada inmediata desde QR.
- Sin instalación ni registro obligatorio.
- Sesiones cortas con alto throughput.
- Ranking/evento común y estadísticas colectivas.
- Experiencia suficientemente clara para entender mirando a otro jugar.

## Objetivos

1. Conseguir que un alumno comprenda el loop básico en menos de 30 segundos.
2. Mantener una run estándar entre 4 y 7 minutos. Esa cifra es de cuando una
   run era **un año suelto**. Para la carrera completa de 7.º a 5.º el objetivo
   vigente es mediana 8–10 minutos con p75 ≤ 12, y vive en la
   [matriz de contenido](../01-game-design/full-career-content-matrix.md#pacing);
   lo midió el [cierre de integración y ritmo](../06-delivery/stage-08-final-integration-pacing-closure.md).
3. Hacer que al menos 70% de los desafíos exijan interpretar datos o relaciones matemáticas relevantes para la decisión.
4. Permitir rejugabilidad mediante seeds, variación procedural, rutas narrativas y perfiles finales.
5. Soportar uso simultáneo desde múltiples dispositivos durante una feria.
6. Mantener una arquitectura que permita pasar de MVP local a juego online con ranking sin reescribir el motor.

## No objetivos iniciales

- Simular exhaustivamente la vida escolar argentina.
- Reemplazar un currículo o evaluación docente.
- Crear una plataforma LMS.
- Mantener perfiles personales persistentes complejos.
- Soportar multiplayer sincrónico en el MVP.
- Incluir chat entre estudiantes.
- Introducir monetización.
- Crear una campaña narrativa de horas de duración.

## Pilares de diseño

### 1. Matemática contextual
Toda cifra visible debe tener una función. Si eliminar los números deja la decisión prácticamente igual, el desafío debe rediseñarse.

### 2. Consecuencia comprensible
Después de una elección, el jugador debe poder relacionar decisión, cálculo y resultado.

### 3. Progresión comprimida
Una partida representa años. Cada evento debe tener peso narrativo mayor que su duración real.

### 4. Diversidad de competencia
El juego no debe sugerir que “ser bueno en matemática” equivale a “ser mejor persona/estudiante”. La identidad de carrera visible son Promedio, Equipo, Aura y Estilo —ver [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md)—, y el perfil final se deriva de métricas ocultas de eficiencia, precisión, riesgo, colaboración e iniciativa. **Ningún eje de Estilo es el malo**: un Improvisador tiene que poder egresar, y ninguna forma de jugar puede ser la objetivamente correcta.

### 5. Rejugabilidad social
El resultado final debe ser compartible y comparable: score, título de perfil, logros y decisiones memorables.

## Declaración de experiencia objetivo

Al terminar una run queremos escuchar frases como:

- “Me faltaron dos litros; tendría que haber descontado la puerta.”
- “Elegí la opción más barata pero no me alcanzaba el efectivo.”
- “Yo distribuí el equipo distinto y me dio mejor puntaje.”
- “Quiero jugar otra vez para sacar otro perfil.”

No queremos que la reacción dominante sea “era un examen con animaciones”.

## Objetivo de producto para la semana de feria

Durante la feria escolar, Egresado también es una competencia repetible. Un jugador puede mejorar su mejor marca entendiendo y practicando, mientras el ranking se mantiene dominado por la matemática, reproducible y auditable.

Eso agrega dos anti-objetivos a la lista de arriba. Egresado no es:

- un concurso de cálculo mental veloz;
- un sistema donde gana quien tiene más tiempo libre para acumular partidas.

La arquitectura competitiva que sostiene esto es una **dirección propuesta, no una regla cerrada**: ver [score competitivo y ranking](../01-game-design/competitive-scoring-and-ranking.md) y [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).

## Qué está descubriendo el jugador

La pregunta del juego no es «¿puedo aprobar?». Es:

- ¿qué decisiones tomé?
- ¿cómo resolví los problemas?
- ¿qué promedio construí?
- ¿cómo trabajé con otros?
- ¿qué momentos me dieron o me costaron Aura?
- ¿me comporté más como Aplicado, Estratega o Improvisador?
- ¿qué clase de egresado fui?

## Cómo se valida esta visión

Con docentes primero y con jugadores recién en la feria. Ver [ciclo de entrega real](real-delivery-lifecycle.md): la aprobación docente no es evidencia de que los estudiantes se enganchen, y esta documentación no la presenta como tal.
