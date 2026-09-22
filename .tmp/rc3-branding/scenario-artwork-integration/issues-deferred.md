# Issues deferred — integración de escenas RC3

Nada de lo que sigue bloquea la revisión visual. Se registra para las tareas que siguen (TASK-02 marca, TASK-03 home, TASK-04 copy, TASK-05 ending, TASK-06 polish/RC3).

## Assets: revisión de contenido (NEEDS ASSET REVIEW, no regenerados)

| Asset | Observación | Riesgo | Propuesta |
|---|---|---|---|
| `scenario.y5.next-step` | En la lámina hay un **birrete** sobre el escritorio y cuatro burbujas con íconos de profesión (estetoscopio/cruz, balanza/edificio, portátil/circuito, maletín/barras). El manifiesto pedía "sin profesiones jerarquizadas, títulos universitarios ni elección ganadora". No jerarquiza ni resuelve el desafío (las opciones del desafío son de tiempos y costos), pero el birrete es el cliché que la dirección de marca quería evitar. | bajo | PO decide: aceptar, o pedir regeneración sin birrete y con burbujas más abstractas. Marcado **NEEDS ASSET REVISION (opcional)**. |
| `scenario.y5.final-project` | Mural de fondo con siluetas de graduación lanzando birretes. Es contexto de "muestra final", no de ranking, pero conviene confirmar que no se lea como "egresar = ganar". | bajo | Aceptar o pedir fondo neutro. |
| `scenario.g7.may-25` | Bandera argentina, escarapelas y Cabildo; trajes folklóricos. Culturalmente correctos para un acto del 25 de Mayo y no caricaturescos, pero son símbolos patrios reales (el manifiesto sólo prohibía "banderas inventadas"). | bajo | Confirmar con el PO/docente. |
| `scenario.y4.fundraiser` | Mantel a cuadros rojos y banderines rojos junto a datos que usan rojo de restricción (`--red`). En la captura no se confunde con `insufficient`, pero es la escena con más rojo. | bajo | Revisar en el móvil real; si molesta, es un pedido de regeneración, no un filtro. |
| `scenario.y1.mobile-data` | Hoja pinchada en la pared con pseudotexto ilegible (líneas). No legible a ningún ancho. | mínimo | Aceptar. |
| Todas | Grano de papel deliberado: a q85 se conserva; si alguien percibe "ruido", es el estilo, no un artefacto. | — | — |
| Todas | Personajes: figuras adolescentes genéricas, sin rasgos asignados a Alex/Dani/Sam/Lucas/Sofía/Mateo. Verificado por lectura de las 24 láminas; no hay retratos ni rostros en foco fotográfico. | — | — |

## Assets faltantes / diferidos

- **DEV-only** (`g7.group`, `g7.mural`, `g7.notebook`, `g7.stand`): no entregados, no integrados, no habilitados. Correcto según tarea. `/dev/grade-7` sigue mostrando esas situaciones sin imagen (degradación normal).
- **Hero, logo, favicon, OG, social**: fuera de alcance (TASK-02). `resources/rc3-assets/brand/` y `provenance.json` no existían en este batch.
- **`public/assets/milestones/`**: reservado en docs; nada producido; no se creó la carpeta.
- No hay `provenance.json` con herramienta/modelo/prompt/seed de generación: los SHA-256 quedaron en `asset-mapping.md`; la procedencia de generación (modelo, fecha, prompt) la tiene el PO y conviene guardarla en `.tmp/rc3-branding/` para el registro de TASK-02.

## UX a confirmar en revisión humana

- **Altura a 320 px** (143 px de imagen): si se siente chica, pasar `SceneMedia` a `aspect-3/2 sm:aspect-video` (una línea). Ver `ux-decision.md`.
- **Pantallas largas por engine** (assignment-board de la expo, grilla del 25 de Mayo): la imagen suma 143–213 px arriba de una interacción que ya es larga. Alternativa si el PO lo pide: omitir imagen en `assignment-board`/`number-grid` (regla por engine en `sceneForChallenge`); hoy no se hizo para mantener un patrón predecible.
- **Ruta pública `/`**: la revisión se hizo en el harness (con callout de desarrollo arriba). En `/` el `RunView` es el mismo pero sin ese callout; conviene una pasada allí con una competencia local bootstrapeada (la DB local de esta máquina no tenía el schema de competencia migrado).

## Copy para TASK-04 (visto al integrar; no se cambió nada)

- `g7.bus-*`: la prosa dice "el 60" y la lámina muestra un colectivo sin número (por diseño). Coherente hoy; si TASK-04 neutraliza la línea (C06 del copy audit), la imagen no necesita cambio.
- `y1.course-project-expo`: setup "El Proyecto del Curso llega a su exposición. Alex, Dani y Sam se reparten…" convive bien con la lámina de cuatro figuras genéricas; no nombrar quién es quién en la imagen.
- `y5.intro` "Cuarto año" (C01) y `y1.closing` (C02) siguen pendientes; no son de esta tarea.
- Con la imagen debajo del título, el `setup` de cada situación funciona como bajada: en TASK-04 conviene que arranque situando lugar/momento sin describir lo que la lámina ya muestra.

## Documentación y gobernanza

- `docs/09-design-system/assets.md` describía el pack como "briefeado, no generado" con un brief **fotográfico**; se actualizó el estado (integrado, dirección ilustrada) y se dejó el brief histórico marcado como superado. **La ratificación de "Trayectoria en papel" frente a ADR-017 sigue pendiente** y corresponde a TASK-02 (posible ADR o nota en decision-history). ADR-017 no se editó.
- `docs/09-design-system/game-components.md` (SceneMedia) y `README.md` (v0.2 "deja afuera") actualizados al estado real. `sync-master-spec --check` sigue en verde (esos documentos no forman parte del master).
- **`.tmp/` no está en `.gitignore`.** Se lo excluyó de Prettier (`.prettierignore`) y de ESLint (`globalIgnores`) porque `pnpm lint`/`pnpm format:check` fallaban sobre los archivos del discovery; decisión pendiente del PO: ignorarlo en git o versionarlo como handoff. No se tocó `.gitignore`.
- **`.env.production.local` está en el checkout.** `next build` / `next start` (NODE_ENV=production) lo cargan con prioridad sobre `.env.local`, así que `pnpm build` y `pnpm test:e2e` en esta máquina apuntarían a producción si no se fijan las variables en el entorno del proceso. Esta tarea corrió build y E2E con un wrapper temporal que fija `.env.local` en `process.env` (no inspeccionó ni modificó el archivo). Recomendación operativa: no dejar `.env.production.local` en el checkout de desarrollo, o que `scripts/run-e2e.mjs` fije explícitamente las variables locales.
- Vercel Hobby: el optimizador de Next transforma cada escena por ancho pedido (≈3 anchos × 24 escenas, cacheado). Volumen despreciable; si alguna vez se quisiera evitar, `unoptimized` + servir el WebP de 1600 px directo cuesta ~100 KB extra por situación en móvil.

## Tests

- `tests/unit/scene-registry.test.ts` fija: cobertura de las 28 Templates públicas, cero Repasos con imagen, cero DEV-only, archivos WebP existentes ≤ 250 KB, escenas compartidas, y que un beat de Repaso no recibe imagen aunque su Template la tenga.
- `tests/component/scene-media.test.tsx` fija: posición título → imagen → prosa, `alt=""`, caja 16:9, Repaso sin imagen con interacción intacta, sin `priority`/preload, `alt` explícito opcional.
- No se agregó visual regression; las capturas de esta tarea son evidencia de sesión, no oráculo.
