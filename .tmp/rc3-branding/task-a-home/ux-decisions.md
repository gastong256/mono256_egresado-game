# Decisiones UX y fronteras

## Contexto y autoridad

Consultados: context map, etapa actual/roadmap, cierres STAGE-08/09, freeze/RC,
STAGE-10A, ADR-004/009/026/027, arquitectura/API/privacidad, ranking/moderación,
FairScore v1, UX/NFR/DoD/testing, DS y vitrina real, discovery TASK-01 (inventarios,
copy, assets, dirección, plan, riesgos, fuentes) y handoff de ilustraciones.
La guía Next 16.3.5 instalada gobierna Server/Client Components e imágenes.
El código y el freeze resuelven los textos históricos desactualizados de score.

## Jerarquía

- Portada de evento: promesa a la izquierda y estado/acceso a la derecha; CTA
  único lima antes del contador y ranking. En mobile se apila sin reordenar DOM.
- `text-event-title` y `max-w-event` se declaran en DS, documentan en fundamentos,
  muestran en vitrina y validan en `cn`. Misma paleta, tipografías, radio 0, sin
  sombras. Formulario y gameplay conservan 412 px; portada llega a 960 px.
  El título escala respecto de su columna (`cqi`), no del viewport: la revisión
  visual al 200 % detectó un solapamiento que el control de overflow no veía.
  E2E comprueba también que el título quede dentro de esa columna.
- OPEN: Jugar ahora. Con intentos previos: Jugar de nuevo. Con intento activo:
  Continuar partida; misma emisión/reanudación autoritativa existente.
- UPCOMING: anticipación, apertura y reloj; sin CTA de juego.
- CLOSED: resultados antes de explicación; sin contador ni nuevos intentos.
  Se dice «Resultados del evento», no adjudicación final: submissions pendientes
  y moderación siguen siendo competencia del backend/organizador.
- Sin configurar: mensaje explícito y aviso de privacidad no disponible, sin
  solicitar datos ni inventar un responsable.
- Matemática domina el bloque de modalidad; Equipo y Aura se explican con prosa
  breve. Se eligió la variante cualitativa: no otro gráfico ni fórmula copiada.
  Los pesos oficiales 8500/1000/500 se verificaron en `competitive-policy.ts`.
- Footer institucional discreto; aviso configurado también disponible en home.
  El formulario mantiene campos, reconocimiento y texto legal intactos.

## Revisión arquitectónica

Detalle reversible de presentación; no exige ADR nuevo. No cambia DTO, API,
comparador, esquema, permisos, identidad, score, seed, replay, dependencia o
proveedor. `/` permanece Server Component dinámico, `CompetitionExperience`
conserva la frontera cliente que ya orquestaba sesión/juego. El footer llega como
slot desde el servidor; el reloj tiene estado aislado, sin renderizar la home
cada segundo. Gameplay conserva lazy loading y prefetch al iniciar.

Única adaptación de refresh: el polling existente de 20 s también observa
UPCOMING y el contador solicita un refresh al vencer. Ninguna de esas lecturas
muta la competencia. El reloj cliente es orientativo; las acciones del servidor
siguen comprobando estado y ventana aun con reloj cliente incorrecto.

Sin supuestos nuevos de producto. El encargo explícito autoriza TASK-A como
excepción visual al Scope OUT de STAGE-10, documentada en el roadmap. No cierra
STAGE-10 ni RC3. Los materiales previos y los masters entregados se conservan.

## Costo medido de primera carga

Comparación de builds de producción entre `a1a6469` (worktree temporal separado,
lockfile congelado) y TASK-A, con Chromium sin interacción. Suma gzip por recurso:
JS 154.080 → 161.474 B (**+7.394 B / +4,8 %**), CSS 8.728 → 9.343 B (+615 B).
Footer: 49.544 B WebP total, lazy. No nueva dependencia ni precarga del juego.
Es una medición de payload local, no un estudio de Core Web Vitals de campo.
[evidence/performance.json](evidence/performance.json).
