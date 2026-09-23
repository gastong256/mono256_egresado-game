# Notas de fuentes externas — TASK-B

Investigación breve, sólo donde cambió una decisión concreta. No se copió
ningún videojuego.

| Fuente | Qué se tomó | Decisión que afectó |
|---|---|---|
| Nielsen Norman Group, *Plain Language Is for Everyone, Even Experts* (nngroup.com/articles/plain-language-experts) | Oraciones de 15–20 palabras; front-loading; el lector gasta recursos en procesar la información, no en parsear la frase | Consignas y beats narrativos recortados a 1–2 oraciones; el Repaso dice primero qué pasó y qué hacer, y después cómo. |
| W3C, *Understanding SC 2.3.3 Animation from Interactions* (w3.org/WAI/WCAG22/Understanding/animation-from-interactions) | `prefers-reduced-motion` global; ninguna información transmitida sólo por movimiento | El hito de año usa la utilidad `motion-enter` existente (200 ms) y ningún confeti; el bloque global de reduced-motion ya lo lleva a 1 ms. |
| NN/g sobre etiquetas de botones (la URL canónica devolvió 404; se aplicó la guía conocida de la casa: verbo específico, anticipar consecuencia, evitar «OK/Next») | Un botón dice qué pasa al apretarlo | `continueLabel`: «Pasar a 3.º», «Ir al Repaso», «Ver mi egreso»; «Seguir» sólo entre eventos del mismo año. |
| Game UI Database, *Level Complete* (gameuidatabase.com/index.php?scrn=52) y guías de UX de juego (uxplanet.org/game-design-ux-best-practices) | Un cierre de nivel muestra que se completó, con jerarquía de progreso y sin frenar el loop | El hito vive en la misma pantalla que el último resultado, sin modal ni pantalla intermedia; el confeti queda para el egreso. |
| Documentación interna: `narrative-system.md` (espina LOCKED por año), `graduation-and-fail-forward.md` (label REPASO), ADR-024 | Autoridad de vocabulario y arco | Líneas de cierre por año siguen adaptación / consolidación / pertenencia / autonomía / responsabilidad / cierre; «Repaso» no se renombra. |
