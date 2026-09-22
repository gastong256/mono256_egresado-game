# Riesgos, guardrails y cuestiones abiertas

Este registro vive en `.tmp` por el scope explícito. No modifica `docs/07-reference/open-questions.md` ni convierte recomendaciones en decisiones LOCKED. Los hallazgos funcionales se registran para revisión separada; no se arreglan dentro del diseño por conveniencia.

## Locked para RC3

| Frontera | Guardrail verificable |
|---|---|
| Matemática | Sin números, unidades, comparadores, condiciones, soluciones ni feedback equivalente alterados. Cero datos variables en arte. |
| FairScore | Política/versión/pesos/tiers/normalización idénticos; no otorgar puntos por imagen, rapidez, recuperación o egreso. |
| Ranking | Personal best verificado; FairScore → Prestige → empate compartido; ningún criterio visual implícito decide puesto. |
| RunPlan/RNG | No tocar compositor, seed, catálogo ni orden de consumo; mapping visual fuera del core. |
| Autoridad servidor | No score oficial anticipado, no reloj cliente que emita/cierre/verifique intentos. |
| DB/migraciones | Ninguna modificación ni operación remota/local sobre datos para este sprint visual. |
| Privacidad | Preservar ADR-026, campos, permisos, aviso, versión y separación público/privado. Sin alias real ni DNI en screenshots/OG/arte. |
| Seguridad | Mantener server-only, cookies, CSP, boundaries y configuración. No CDN/generador remoto dentro de una run. |
| Competition lifecycle | Mantener intentos activos, reingreso, idempotencia, submission y ventanas. Un botón reubicado no cambia esas reglas. |
| Release infrastructure/deployment | No tags/push/deploy, cambios de proveedor, locks o scripts para tolerar diferencias. RC3 se prepara bajo gobernanza vigente. |
| Diseño | Radio 0, sombras sólo excepción Aura, tokens semánticos, lima sólo CTA, selección neutral, null distinto de cero. |

## Riesgos visuales y mitigación

| Riesgo | Mitigación / gate |
|---|---|
| Inconsistencia entre generaciones | Un master aprobado, tres pilotos juntos y lotes pequeños; referencia de estilo y procedencia guardadas. |
| Copy altera matemática | Clasificar por fragmento; revisar contra todas las variantes afectadas y oráculos; no regenerar fingerprints para ocultar cambios. |
| Arte sugiere respuesta | Mostrar preparación neutral; prohibir planos, rutas, cantidades, horarios, asignaciones, ratios y caras asociadas a afinidades. |
| Layout shift | Aspect-ratio y dimensiones reservadas antes de cargar; prueba con imágenes lentas/inexistentes. |
| Páginas demasiado largas | Una imagen como máximo, cero si no aporta; Repaso sin imagen duplicada; comparar pliegue y distancia de CTA a 320 px. |
| Sobrecarga visual | Conservar datos y controles como foco; limitar textura/personajes/objetos; no fondos diferentes por año. |
| Regresión móvil | Crop central compatible 3:2/16:9; 320–430 px, safe area y teclado; no escalar opciones debajo del target táctil. |
| Contraste | No superponer copy sobre imagen; tokens existentes y design:check; verificar arte contra papel a tamaño real. |
| Texto generado o pseudotexto | Rechazar la pieza, no taparla con CSS; letras/datos en HTML, logo final tipográfico manual. |
| Celebración engañosa del ranking | Egreso para toda run completada; podio sólo desde datos oficiales; todos los empatados conservan puesto; sin ganadores inventados. |
| Referencias culturales falsas | Escuela/barrio genéricos; neutralizar “el 60” sin inventar línea real; no caricatura regional, destinos ni instituciones sin fuente. |
| Payload excesivo | Hero ≤180 KB, escena ≤120 KB, sin precarga masiva; primer pack ≤8 raster propuesto; medir home e interacción. |
| Imagen bloquea experiencia offline | Fallback completo sin raster; texto, datos y controles presentes; ningún fetch de arte entra al motor. |
| Pérdida de semántica accesible | Alt contextual o vacío por redundancia; marca accesible una vez; foco/alertas/labels conservados; sin chart raster. |
| Cambio de paleta por saturate-85 | Evaluar ajuste central de SceneMedia para ilustración; no filtros únicos por asset. |
| Personajes inconsistentes | Figuras anónimas, sin rasgos asignados a nombres variables ni fotos de menores reales. |
| Confusión símbolo/acierto | Mark de trayecto distinto de TickMark; no usar color de resultado en selección. |
| Fotografía histórica tratada como dirección vigente ilustrada | Elegir explícitamente A/B/C; registrar aceptación en docs antes de integrar nueva estética. |
| Perder compatibilidad por copy | Examinar serialización/huellas y parsers de auditoría antes de editar `src/content`; cambios no equivalentes quedan fuera del sprint. |

## Hallazgos con procedencia y acción siguiente

| ID | Hallazgo | Evidencia | Acción propuesta / límite |
|---|---|---|---|
| H01 | Quinto se presenta como “Cuarto año” y repite párrafo | `grade-5/storylets.ts:y5.intro`, witness `rc3-discovery-0` | TASK-04, texto narrativo equivalente; no stageId ni flags. |
| H02 | Primero anuncia que segundo no está disponible dentro de full career | `grade-1/storylets.ts:y1.closing`, witness `rc3-discovery-0` | TASK-04; corregir scope de la frase sin retirar evento. |
| H03 | Home promete mural/trabajo grupal que el plan público no puede elegir | `CompetitionExperience:header`, `GRADE_7_HOSTABLE_TEMPLATES` | TASK-03/04; usar escenas activas, no ampliar catálogo/plan. |
| H04 | Brief histórico notebook ilustra cuadernos; contenido actual compra portátil | `assets.md:scene.notebook`, `notebook-offer.ts:narrate` | Corregir brief futuro; contexto DEV, no generar por defecto para RC3. |
| H05 | RareNote existe en view pero ningún componente la monta | `transition.ts:activeChallengeView`, búsqueda `rareNote` en components sin resultados | Documentar capacidad vs representación; no agregar banners/acciones automáticamente. Epílogo puede mostrar recuerdo. |
| H06 | CTA Jugar de nuevo aparece en epílogo y panel posterior | `AttemptRun`, `CareerEpilogueView`, `VerificationPanel` | TASK-05: jerarquía/posición; no cambiar lifecycle o pérdida de submit bajo polish. |
| H07 | Home muestra ranking vivo; epílogo habla de puesto al cierre | `RankingRule`, `CareerEpilogueView` | Precisar lenguaje COMPETITIVE; no alterar momento de publicación. |
| H08 | Hay documentación parcial desactualizada | `narrative-system.md`, FR-003/011, `testing-strategy.md`, evolución DS | El código y cierres actuales acreditan existencia; reconciliar docs en tarea autorizada. |
| H09 | Guía general de minimización sin apellido difiere de ADR-026 | AGENTS.md frente a ADR aceptado y formulario actual | Preservar contrato específico aceptado; no reinterpretar privacidad con marca/copy. |
| H10 | Estado de deployment: usuario informa funcional; checkout conserva GO pendiente | Pedido del usuario vs current-stage / STAGE-10A | Registrar procedencias; no acceso remoto ni declaración de readiness nueva. |
| H11 | Campo de puesto propio usa comparación contra número de filas | `leaderboard.tsx:you.rank > entries.length` | Observación de código, no bug confirmado. Probar empates/membership al implementar; no cambiar ranking por conjetura. |
| H12 | `SceneMedia` está listo pero sin uso; budget documental 6–9 raster | `scene-media.tsx`, `assets.md` | Banco completo no significa encargo masivo; primer pack acotado, resto opcional. |
| H13 | Hora de fecha visible usa timezone del navegador | `CompetitionStatusNote:formatDate` | TASK-03: revisar zona explícita; countdown no autoridad, no hardcodear ventana. |

## Decisiones humanas para el siguiente paso

1. Elegir entre A (recomendada), B o C y confirmar la familia de ilustraciones frente al brief histórico fotográfico. Se revisa el documento concreto `05`, no un logo final inexistente.
2. Aprobar un style test y los tres pilotos; confirmar pack inicial acotado. El resto de P1 es cola opcional, no obligación de producir 16 escenas de una vez.
3. Entregar originales y procedencia en `resources/rc3-assets/` según `04`; logo final editable, no sólo raster.

Estas decisiones no impiden terminar discovery. Quedan abiertas para producción e integración posterior. No se solicita aquí aprobación para ejecutar ninguna operación de proveedor.
