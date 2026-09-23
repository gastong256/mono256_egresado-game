# Revisión de motion — TASK-D

## Decisión: CSS, sin librería

Comparación pedida por el PO antes de instalar nada:

| Necesidad | CSS actual | Web Animations API | Librería (p. ej. Motion/Framer) |
|---|---|---|---|
| CTA que se note al abrir | `motion-resolve` (pop 320 ms) al montar + hover `-translate-y-px` | posible, más código | innecesaria |
| Reloj que «salte» sobre la hora | cambio de `motion-enter` a `motion-resolve` por `data-urgency` | posible | innecesaria |
| Resultado que llega | `motion-resolve` en el puntaje | — | — |
| Hitos que se ganan | `motion-enter` + `animation-delay` escalonado | — | — |
| Hito de año | `motion-enter` (TASK-B) | — | — |
| Reduced motion | bloque global a 1 ms, ya existente | requiere código propio | requiere configuración |

Qué no resuelve bien CSS: secuencias orquestadas con interrupción y layout
animations. Ninguna hace falta acá. Una librería costaría entre 5 y 30 KB gz,
otra convención de tokens y otra superficie de mantenimiento para tres
efectos de entrada. **No se instala.**

## Sistema

Tres keyframes (`eg-enter`, `eg-pop`, `eg-fall`), cinco duraciones y dos
curvas en `tokens.css`; utilidades `motion-*`. TASK-D no agrega keyframes ni
duraciones: reutiliza. Toda animación es de entrada o de cambio, nunca en
bucle; ninguna bloquea interacción; `transform`/`opacity` solamente.

## RC3-X4 aplicado

| Micro-polish | Dónde | Cómo |
|---|---|---|
| Result reveal | cierre (puntaje verificado / de práctica) | `motion-resolve` |
| Achievement reveal | medallero | `motion-enter` con 70 ms × índice |
| Countdown tick | reloj | `motion-enter` por cifra; segundos con `motion-resolve` bajo 10 min |
| CTA response | «Jugar ahora» | `motion-resolve` al montar, `hover:-translate-y-px`, flecha que avanza (TASK-A), `active:scale-[0.99]` (Button) |
| Year milestone | hito de año | `motion-enter` (TASK-B) |
| Podium update | portada | sin animación: el podio cambia por poll y animarlo sugeriría un evento que el jugador no provocó |
