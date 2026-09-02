# Personas y contextos de uso

## Persona P1 — Estudiante explorador

**Edad objetivo:** 12–17.

Busca una experiencia rápida, entendible y no infantil. Puede no considerarse “bueno en matemática”. Tiene alta sensibilidad a cualquier interfaz que parezca examen escolar.

### Necesidades
- Entender qué hacer sin leer instrucciones extensas.
- Poder usar calculadora o apoyo cuando la dificultad es de razonamiento y no de cálculo mental.
- Recibir feedback sin humillación.
- Poder terminar incluso si comete errores.
- Obtener un resultado final interesante.

## Persona P2 — Estudiante competitivo

Quiere maximizar score y aparecer en ranking.

### Necesidades
- Reglas de scoring consistentes.
- Condiciones comparables.
- Posibilidad de reintento bajo reglas conocidas.
- Señales claras de qué mejoró o empeoró su run.

## Persona P3 — Docente

Observa o utiliza Egresado como demostración de matemática aplicada.

### Necesidades
- Comprender qué concepto matemático trabaja cada desafío.
- Poder explicar por qué una decisión funciona.
- Evitar contenido ambiguo o matemáticamente incorrecto.
- Ver que los errores producen feedback pedagógico.

## Persona P4 — Organizador de feria

Opera el juego en un contexto con ruido, múltiples dispositivos y conectividad imperfecta.

### Necesidades
- Crear/seleccionar un evento.
- Mostrar ranking.
- Ocultar nicknames inapropiados.
- Detectar si el backend o internet falla.
- Mantener el juego disponible incluso con degradación parcial.

## Persona P5 — Desarrollador/autor de contenido

Agrega desafíos y reglas.

### Necesidades
- Motor desacoplado de UI.
- Schema de contenido estable.
- Tests automáticos de resolubilidad.
- Simulación masiva de seeds.
- Versionado de reglas.

## Contextos de uso

### Feria escolar
- Carreras completas con objetivo UX de 8–10 min (TG1-12).
- Teléfonos personales y algunas PCs/tablets.
- Posible Wi-Fi saturado.
- Ranking en pantalla grande.
- Alto ingreso de usuarios anónimos.

### Aula
- Grupo con docente.
- Posibilidad de discusión posterior.
- Eventualmente seed compartido.

### Hogar
- Juego individual.
- Rejugabilidad y desafíos diarios.

## Restricciones de diseño por contexto

- Inputs táctiles de tamaño cómodo.
- Ninguna interacción esencial depende de hover.
- Texto legible en pantallas de 360 px de ancho.
- Partida no depende de round-trips constantes al servidor.
- El jugador puede recuperar la run tras refresh accidental cuando sea viable.

## Persona P6 — Visitante adulto

Familias, docentes de otras materias y visitantes que juegan una vez en la feria. Puede tener el currículo de 7.º completamente incorporado.

### Necesidades
- Que el razonamiento siga siendo interesante aunque la aritmética sea familiar.
- Que el techo del desafío venga de interpretación y optimización, no de fórmulas avanzadas.
- Entender la situación sin contexto escolar previo del juego.

Es la persona que justifica el diseño de piso bajo y techo alto: la misma pantalla tiene que funcionar para alguien de 12 y para alguien de 45. Ver [dificultad y jugabilidad universal](../01-game-design/difficulty-and-playability.md).

## Persona P7 — Agente de IA que trabaja el repositorio

Implementa, documenta o revisa sin haber participado de las decisiones.

### Necesidades
- Distinguir estado actual de arquitectura objetivo sin tener que leer código para saberlo.
- Distinguir una decisión cerrada de una recomendación y de una pregunta abierta.
- Saber qué requiere aprobación docente antes de escribirse como constante.
- Un punto de entrada que enrute, en vez de un documento maestro que haya que leer entero.

Es la persona que gobierna [ADR-018](../03-architecture/adr/ADR-018-blueprint-v0-2-decision-authority.md) y el [mapa de contexto](../08-engineering/context-map.md).
