# UX e interacción

## Estrategia

Mobile-first, portrait-first, DOM-first. Desktop presenta el mismo flujo dentro de una columna central ampliada.

## Viewport de referencia

Diseñar inicialmente para ~390×844 CSS px y verificar mínimo 360 px de ancho.

## Layout base

```text
┌────────────────────────┐
│ 7.º GRADO      ▪▪□□□□□ │  etapa + progreso en celdas
├────────────────────────┤
│ Promedio │ Equipo │ ◣  │  tira de carrera (aparición progresiva)
├────────────────────────┤
│ EYEBROW                │
│ Título de la situación │
│ Prosa                  │
│ ┌────────┐ ┌────────┐  │  grilla de datos sobre papel
│ │ dato   │ │ dato   │  │
│ └────────┘ └────────┘  │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  bloque de decisión (oscuro, a sangre)
│▓ consigna             ▓│
│▓ opciones             ▓│
│▓ [ CONFIRMAR ]        ▓│  el primario vive acá mientras se decide
└────────────────────────┘
```

Al resolver, el bloque oscuro suelta el primario, aparece el panel de resultado sobre papel y el primario reaparece al final del shell. **Existe exactamente un primario montado a la vez.**

El ancho de juego es de 412 px máximo, centrado en todos los breakpoints: tablet y desktop centran contra la hoja, no ensanchan. Ver el [sistema de diseño](../09-design-system/foundations.md).

## Navegación

- No depender de browser back como parte del juego.
- Confirmar abandono de run activa.
- Persistir checkpoint local después de cada desafío.

## Patrones

### Decision cards
Cards grandes, táctiles, sin hover obligatorio.

### Drag & drop
Toda interacción puntuable debe poder completarse con tap/select **y teclado**
sin arrastrar. Si ofrece drag, éste es una vía adicional equivalente: seleccionar
origen/destino, mover con controles o reordenar mediante lista. Sin secuencias
sensibles al tiempo.

### Sliders
Mostrar valor numérico y permitir ajuste fino por botones/teclado.

### Gráficos
Etiquetas visibles; no depender sólo del color.

### Feedback
Secuencia recomendada:
1. bloquear input;
2. animación corta;
3. mostrar consecuencia numérica;
4. actualizar stats;
5. CTA continuar.

## Motion

- Duración habitual 150–350 ms.
- Respetar `prefers-reduced-motion`.
- Evitar animaciones largas que reduzcan throughput de feria.

## Audio

Opcional, nunca requerido para comprender. Estado mute persistente.

## Accesibilidad

- Contraste mínimo WCAG AA como objetivo.
- Target interno de producto ≥44×44 CSS px para controles primarios cuando el layout lo permita; no se atribuye ese número como mínimo universal de WCAG.
- Navegación por teclado para todas las acciones esenciales.
- Focus visible.
- Texto no incrustado en imágenes.
- Feedback no dependiente exclusivamente de color ni animación; palabra/glyph/marca acompañan el estado.
- Notación matemática con labels legibles; la jerga argentina aporta tono, no información necesaria para resolver.
- Sin bonus, ranking ni desempate por velocidad: lectura pausada no penaliza.

## Herramientas

Calculadora/anotador se abren como paneles no destructivos; cerrar no pierde estado.

## Loading

Gameplay no muestra loaders entre eventos si éstos ya están generados localmente. El servidor participa fuera del loop crítico.

## Errores de red

El jugador no pierde una run porque falle el leaderboard. Se muestra estado “resultado pendiente de sincronización” y se reintenta cuando corresponda.

## Aceptación por motor y walkthroughs

Los [cinco motores](challenge-system.md#cinco-motores-reutilizables-de-interacción-v1)
definen una vez contratos de teclado, puntero, touch, foco, errores/resultados,
labels programáticos, reduced motion y helper E2E. La primera aparición enseña
la interacción con una pista de un paso, nunca la solución matemática.

Antes de feria: carrera sólo teclado; touch móvil y alternativa no-drag; movimiento
reducido; comprensión sin color; viewport estrecho; zoom alto y lectura lenta.
Son pruebas proxy junto a Teacher Gate 2, no sustitutos de investigación con
estudiantes. El sistema de diseño conserva autoridad sobre tokens y primitivas.
