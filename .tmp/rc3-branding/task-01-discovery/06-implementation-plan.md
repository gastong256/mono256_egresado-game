# Plan TASK-02 → TASK-06

Cada tarea futura parte de este snapshot y revalida HEAD, instrucciones y contrato congelado. Un cambio posterior del repo invalida la suposición de que todas las referencias siguen idénticas. Mantener propuestas visuales separadas de decisiones competitivas.

## TASK-02 — Branding foundation + shell + footer + metadata

- **Inputs:** aprobación de una dirección de `05`; master de logo y mark editable; derivados favicon/social; manifiesto `04`; inventario UI/copy. Usar skill de diseño y revisar autoridad de identidad antes de adoptar ilustración frente a fotografía.
- **Outputs:** sistema de firma reutilizable, pie breve si aporta, iconos de pestaña/app, OG estático genérico, documentación visual canónica reconciliada. Wordmark puede continuar siendo texto; no hace falta una imagen para imprimir el nombre.
- **Archivos probables:** `src/components/ui/wordmark.tsx`, `src/components/game/game-shell.tsx`, `src/components/competition/competition-experience.tsx`, `src/app/layout.tsx`, `src/app/manifest.ts`, archivos de metadata nuevos, `public/assets/brand/`. Si exige nuevo token, su revisión corresponde a tokens/contraste, no a valores por pantalla.
- **Dependencias/assets:** `brand.logo-primary`, `logo-horizontal`, `logo-mark`, `favicon`, `social-mark`. El mark es un master; las variantes se derivan, no se generan independientemente.
- **Riesgo:** medio; un header mayor desplaza interacción y un footer puede exponer información institucional no autorizada. No añadir rutas privadas a navegación pública.
- **Verificación:** `pnpm toolchain:check`, `pnpm design:check`, formato/lint/typecheck; inspección de favicon 16/32, manifest, OG y nombre accesible; pantallas a 320/412/1280, teclado y reduced-motion. `pnpm verify` antes de cierre integrado. Si cambia decisión visual aceptada, revisión arquitectónica/ADR según política, sin crear decisiones de producto implícitas.
- **Frozen:** tokens semánticos base salvo cambio visual expresamente documentado; reglas, catálogos, privacidad, APIs, CSP y topología.

## TASK-03 — Home + countdown + ranking

- **Inputs:** TASK-02, hero aceptado, inventario de ramas de home, contrato DTO existente y reglas de ranking congeladas.
- **Outputs:** portada con promesa que corresponde al catálogo público, mejor jerarquía de estado/acción/ranking; countdown únicamente si se confirma útil y puede hacerse como dato orientativo. Mantener estados upcoming/open/closed/not-configured completos.
- **Archivos probables:** `competition-experience.tsx`, `leaderboard.tsx`, componentes UI compuestos; sin tocar `src/server/competition`, DTO ni comparador de ranking para resolver un diseño.
- **Assets:** `brand.hero`, `global.ranking-foundation` (HTML/CSS, no raster). El ranking no necesita trofeos generados.
- **Dependencias:** fuentes de `opensAt/closesAt` ya existen; no existe serverNow público. No hardcodear fecha de feria dentro del componente. `formatDate` hoy usa zona del navegador: presentar zona explícita si el contrato autorizado lo permite; documentar equivalencia.
- **Riesgo:** alto en lenguaje competitivo. El countdown no abre/cierra una edición, no termina una run, no habilita submit y nunca puntúa velocidad. Ante fecha ausente/inválida usar texto existente. Al llegar a cero, refrescar estado por canal existente sin fingir transición. No agregar backend para un reloj cosmético dentro de RC3.
- **Verificación:** filas empatadas más allá de tres personas, podio vacío, alias largo, jugador fuera del podio, estado cerrado, desconexión, reloj desfasado, fecha ausente, cambio de ventana; accessibility y 320px. `tests/component/competition-ui.test.tsx`, `tests/e2e/competition.spec.ts`, gates de diseño y `pnpm verify` al cerrar.
- **Frozen:** orden/empate/podio, mejor intento, emisión, refresh y sesión salvo adaptación visual sin efectos; ninguna consulta nueva de datos privados.

## TASK-04 — Copy + localization pass

- **Inputs:** `03-copy-audit.md`, evidencia de ramas activas, las 42 Templates y clasificación por fragmento. Priorizar C01–C06; no hacer replace global.
- **Outputs:** copy claro y argentino; corregir quinto/falso cierre de primero/home; menos jerga en verificación y recuperación, con significado idéntico. Máximo cambio coherente por lote.
- **Archivos probables:** `competition-experience.tsx`, `identity-form.tsx`, `verification-panel.tsx`, `run-view.tsx`, textos puntuales de `src/content/grade-*/storylets.ts` y `narrate` sólo cuando el contrato del freeze lo admita. **Editar un archivo de contenido no habilita editar su generador/evaluador.**
- **Dependencias:** cambios narrativos dentro de content pueden entrar en huellas/goldens o parser de auditoría. Antes de editarlos, localizar ese vínculo y demostrar equivalencia; si exige alterar artefacto competitivo congelado, registrar bloqueo de ese fragmento y resolver mediante tarea/decisión autorizada aparte. No actualizar lock para ocultar diferencia.
- **Assets:** ninguno; los prompts conservan números y letras fuera del arte.
- **Riesgo:** alto en consigna matemática, privacy y competencia. No convertir recuperación en segundo intento puntuable, alias en anonimato absoluto o preferencia vocacional en respuesta correcta.
- **Verificación:** comparar antes/después de datos, unidades, reglas, formatos y opciones por variante afectada; tests de contenido y auditoría ciega aplicables, replay/goldens sin regeneración automática, escenarios de UI. Mantener release verification verde. No imponer nuevas variantes ni cantidades.
- **Frozen:** matemática, condiciones, callbacks/flags, IDs/versiones, evaluadores, puntuación, catálogos, legal/privacidad. Cadenas legales se conservan; una revisión legal no se disfraza de localización.

## TASK-05 — Ending + result feedback

- **Inputs:** contrato de `CareerEpilogueView`, `VerificationPanel`, `AttemptRun`, memoria/hitos; TASK-02 y copy clasificado.
- **Outputs:** jerarquía legible entre egreso, perfil/recuerdos, carrera y puntaje verificado; revisión de CTAs duplicados y estados pending/failed/rejected/verified. Conservar orden narrativo canónico.
- **Archivos probables:** `career-epilogue.tsx`, `milestone.tsx`, `feedback-panel.tsx`, `verification-panel.tsx`, composición en `attempt-run.tsx` sólo de presentación.
- **Assets:** `ending.foundation`, primitivas ya existentes; cero diploma/score raster. No ilustraciones distintas para “ganador” y “perdedor”.
- **Dependencias:** no mover emisión, envío, idempotencia, checkpoint o limpieza del log para reubicar un botón. Si el hallazgo de CTA requiere lifecycle distinto, escalar fuera del polish.
- **Riesgo:** alto; egresar no equivale a ganar ni toda mejora personal equivale a podio. El score local no ocupa el lugar del oficial.
- **Verificación:** práctica frente a fair; egreso con desempeño bajo; dimensions null; recuerdos raros opcionales; resultado no superior al mejor; red caída y submit rechazado; foco y lectores; `competition-ui`, E2E de carrera y epílogo; `pnpm verify`.
- **Frozen:** orden/selección de memorias, hitos, cálculo de perfil, egreso, FairScore y ranking.

## TASK-06 — Scenario artwork integration + polish + revisión RC3

- **Inputs:** assets recibidos según manifest y provenance; TASK-02→05 cerradas; tres pilotos consistentes y arte aprobado. Inventario 24 públicos, 4 dev excluidos.
- **Outputs:** primer pack acotado integrado por mapping de presentación, sin añadir media a RunState/RunPlan/ChallengeDefinition; fallback sin imagen; reporte de QA y candidato RC3 preparado para revisión. Cualquier formalización de versión/release sigue gobernanza propia; esta tarea no autoriza deploy/push/tag.
- **Archivos probables:** registro nuevo de presentación en `src/components/game/` o capa UI equivalente, `challenge-frame.tsx`, `scene-media.tsx`, `public/assets/scenes/`, y documentación de assets. Registrar una ruta por ID de Template y reutilizarla para familias/repasos; no una rama React ad hoc por escenario ni una ruta por Variant.
- **Assets:** hero y hasta 7 escenas (propuesta de pack ≤8 raster total); candidatos adicionales esperan valor demostrado y presupuesto explícito. Se puede entregar RC3 sin ilustrar cada Template. Máximo una escena por situación, normalmente ninguna en Repaso.
- **Dependencias:** adaptar conscientemente `SceneMedia` a arte: `saturate-85` actual fue pensado para fotografía y altera paleta ilustrada. Medir antes de conservar/quitar; cambio central, no filtro arbitrario por pantalla. Su `fill` + aspect-ratio ya reserva caja; ajustar `sizes` sólo si cambia ancho real.
- **Riesgo:** medio/alto: arte que regala una solución, ocupa demasiada altura, genera layout shift o exige red durante una run. No precargar todos los escenarios. Mantener la interacción completa si no llega ninguna imagen.
- **Verificación:** imágenes inexistentes/lentas, sin red, crops 3:2/16:9, 320–1280, teclado, reduced-motion, identificación de escenas, bytes y render. Medir carga inicial, no sólo suma de archivos en disco. `pnpm design:check`, tests relevantes, `pnpm verify`, `pnpm release:check` y `pnpm release:verify` sin update-lock de semántica. DB/Docker no se tocan para un cambio exclusivamente visual.
- **Frozen:** todo gameplay, replay, esquema, contratos, seed, RNG, catálogos, scoring, seguridad y deployment.

## Ingesta concreta

```text
resources/rc3-assets/                 # source entregado; no público
├── style/master-style-test-source.png
├── style/provenance.json
├── brand/logo-mark-concept-source.png
├── brand/logo-primary.svg            # master manual editable
├── brand/logo-horizontal.svg
├── brand/logo-mark.svg
├── brand/hero-source.png
└── scenarios/
    ├── grade-7/scenario-g7-bus-source.png
    ├── grade-1/scenario-y1-expo-source.png
    ├── grade-2/…
    ├── grade-3/…
    ├── grade-4/scenario-y4-fundraiser-source.png
    └── grade-5/…

public/assets/brand/                  # derivados runtime optimizados
public/assets/scenes/                 # filenames exactos en manifest
src/app/favicon.ico                  # convenciones metadata Next instalado
src/app/apple-icon.png
src/app/opengraph-image.png
```

El nombre exacto de cada original y derivado está en `04` y `evidence/assets.json`. No crear event/institutional sólo por tener carpetas: no hay pedidos de arte institucional autorizados. Los SVG finales se inspeccionan y sanitizan; la app no carga URLs remotas ni incorpora generadores IA en runtime. Conservar archivo fuente, permiso/procedencia, export y checksum por separado. Alpha sólo en marca SVG; escenas y PNG app opacos. La optimización y copia se ejecutan en TASK-02/06, no aquí.

## Gates de avance

Wave 1 aprueba técnica; Wave 2 fija master; Wave 3 confirma tres contextos; TASK-02 establece marca; TASK-03/04/05 resuelven superficies; TASK-06 integra el pack y verifica. Un hallazgo de gameplay, privacidad o autoridad se registra aparte: el sprint visual no lo resuelve cambiando reglas. La aprobación de estilo solicitada al usuario es una decisión de diseño sobre este brief concreto, no una aprobación de deploy.
