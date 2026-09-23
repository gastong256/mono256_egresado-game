# Notas de fuentes externas — TASK-C

| Fuente | Qué se tomó | Decisión que afectó |
|---|---|---|
| Nielsen Norman Group, *Plain Language Is for Everyone, Even Experts* | Oraciones cortas; primero lo que importa | Cada bloque del ending abre con su dato (numeral, puntaje, puesto, estilo) y lo explica después en una línea. |
| W3C, *Understanding SC 2.3.3 Animation from Interactions* | `prefers-reduced-motion`; sin información sólo por movimiento | Sin reveal ni animación nueva; el confeti existente ya se apaga con reduced motion; el resultado se lee sin esperar. |
| Microsoft, *Xbox Accessibility Guidelines* (XAG 108, lenguaje de dificultad: «no denigrar al jugador, p. ej. “Wimp Mode”») | Nombrar sin denigrar | Las franjas y el estilo nunca nombran capacidad; las frases bajas hablan de la partida. |
| Educational Data Mining 2025 / meta-análisis de gamificación (Springer, MDPI): quienes quedan abajo del leaderboard experimentan frustración; el feedback de progreso y los logros sostienen la motivación; los «low attainers» son quienes más mejoran con feedback | Feedback bajo con dimensión de maestría/replay; logros reales | Franja baja con invitación explícita a la revancha; medallero sólo con hitos verificables; recorrido que muestra lo que sí se completó. |
| Autodeterminación (competencia / autonomía) — revisión Springer 2023 | Competencia percibida cae con feedback negativo sin salida | «Egresaste» siempre primero; ninguna franja cierra sin un «próxima». |
| Game UI Database, *Level Complete* / guías de UX de juego | Un cierre muestra logro, progreso y siguiente acción sin frenar el loop | Una sola pantalla, sin modal ni pasos; acciones al final y decididas por el estado. |
| Documentación interna: `narrative-system.md` (epílogo v1, espina LOCKED), `competitive-scoring-and-ranking.md` (empate compartido, mejor intento), `rare-events-and-prestige.md` (badges display-only), ADR-004/009/026/027 | Autoridad de vocabulario, orden y evidencia | Temas del recorrido; hitos del motor como fuente; puesto server-authoritative; sin Prestige visible con techo 0. |
