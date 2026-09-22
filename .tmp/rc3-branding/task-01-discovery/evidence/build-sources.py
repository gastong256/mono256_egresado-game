from pathlib import Path
import json
O=Path('.tmp/rc3-branding/task-01-discovery')
docs={
'docs/README.md':'Autoridad e índice; lectura inicial',
'docs/08-engineering/context-map.md':'Rutas de lectura; contexto de producto/diseño/freeze',
'docs/EGRESADO-MASTER-SPEC.md':'Cabecera y vista de personas; no sustituyó fuentes individuales',
'docs/06-delivery/current-stage.md':'STAGE-08/09, freeze, STAGE-10A y GO pendiente',
'docs/06-delivery/implementation-sequence.md':'Resumen, capacidades, Scope IN/OUT y contratos STAGE-00→10; no reauditoría de todos los anexos',
'docs/06-delivery/stage-08-final-integration-pacing-closure.md':'A–G y secciones I–T: contenido real, interacciones, accesibilidad, pacing y límites de evidencia',
'docs/06-delivery/stage-09-fair-mode-server-ranking.md':'A–E: arquitectura, rutas, identidad y frontera pública',
'docs/06-delivery/production-v1-release-candidate.md':'Preámbulo, A–D, freeze/compatibilidad; RC.1 es histórico',
'docs/06-delivery/stage-10a-deployment-adaptation.md':'Estado, baseline, arquitectura, compatibilidad y evidencia local',
'docs/05-operations/vercel-supabase-production-deployment.md':'Topología, perfil aprobado, handoff A–C; ningún paso ejecutado',
'docs/06-delivery/definition-of-done.md':'Gates aplicables y distinción documentación/release',
'docs/04-quality/testing-strategy.md':'Capas de verificación, UI, competencia, QA manual y límites; contrastada con scripts actuales',
'docs/03-architecture/game-engine.md':'Restricciones, módulos, descriptor, estado y ciclo de vida',
'docs/02-functional/functional-specification.md':'FR-001→014; contrastados contra implementación',
'docs/01-game-design/narrative-system.md':'Objetivo, storylets, progresión por año y elenco relacional',
'docs/07-reference/decision-register.md':'Filas de identidad/feria/freeze/deployment (D-S09/D-RC/D-S10A)',
'docs/07-reference/open-questions.md':'Preguntas 24–44 y notas de madurez/compatibilidad',
'docs/08-engineering/dependency-and-decision-policy.md':'Authority, trigger ADR y versionado',
'docs/09-design-system/README.md':'Identidad, cadena, reglas, gates y evolución histórica',
'docs/09-design-system/assets.md':'Arte existente/briefs, presupuesto y ruta runtime',
'docs/09-design-system/foundations.md':'Retícula, layout, medidas, geometría y movimiento',
'docs/09-design-system/accessibility.md':'Contraste, semántica, teclado y verificación pendiente',
'docs/09-design-system/typography.md':'Fuentes, roles y números',
'docs/09-design-system/contribution.md':'Primitivas y criterios de evolución',
'docs/09-design-system/ui-components.md':'Primitivas de decisión, datos, controles, marcas y estados',
}
for n in ['003','004','007','015','017','019','020','022','023','024','025','026','027','028']:
 p=next(Path('docs/03-architecture/adr').glob('ADR-'+n+'-*'));docs[str(p)]='Decisión aceptada y consecuencias aplicables; ADR largos leídos por secciones de decisión'
for p in docs:assert Path(p).exists(),p
sources=[
('Release actual','src/release/fair-edition-v1.ts:FAIR_EDITION_V1; fair-edition-v1.lock.json','docs/06-delivery/stage-10a-deployment-adaptation.md; scripts/release/verify.ts','Tupla y catálogo competitivo','FROZEN'),
('Familias/templates efectivos','src/content/full-career.ts:createFullCareerDependencies; grade-5/registry.ts:createGrade5Catalog','src/game/challenges/content-catalog.ts; tests/integration/full-career.test.ts','22 familias, 42 templates','ACTIVE / FROZEN'),
('Variantes competitivas','src/content/grade-5/variant-catalog.grade-5-dev-6.json','src/release/fair-edition-v1.ts:catalogs','1.031 entradas; no sumar acumulativos','ACTIVE / FROZEN'),
('Años inferiores acumulativos','src/content/grade-{1,2,3,4}/index.ts y registry.ts','Catálogos fijados por manifiesto','Contribuyen al acumulativo; presets propios de desarrollo','ACTIVE como contenido / DEV-ONLY presets'),
('7.º público','src/content/grade-7/composition.ts:GRADE_7_HOSTABLE_TEMPLATES','src/content/full-career.ts:fullCareerCompositionPolicy','bus-timing, bus-latest-departure, may-25-act','ACTIVE'),
('7.º demo completo','src/content/grade-7/index.ts:grade7Challenges; demo-plan.ts','src/app/dev/grade-7/page.tsx; tests/e2e/grade-7-slice.spec.ts','mural/group/notebook/stand además de contenido compartido','DEV-ONLY para cuatro contextos'),
('Replays históricos','src/content/grade-7/variant-catalogs.ts; src/server/competition/editions.ts','src/content/grade-7/variant-catalog.grade-7-dev-1…8.json','Versions retenidas; full-career-tg1-candidate sólo verificación histórica','LEGACY / FROZEN'),
('Fixtures sintéticos','src/game/testing/fixtures/','tests/unit/engine-golden.test.ts','dev.* no son escenas de producción','DEV-ONLY'),
('Modelos Family/Template/Variant','src/game/challenges/content-model.ts; contracts.ts','ADR-019 / ADR-020','Contexto vs estructura vs parámetros','ACTIVE'),
('Composición y roles','src/content/full-career.ts; src/game/plan/run-plan.ts','tests/integration/full-career.test.ts:primeros tres tests','9 beats, 6 anchors y 3 slots secundarios','FROZEN'),
('Recuperación','src/content/grade-*/index.ts:RecoveryContent; src/game/progression/recovery.ts','ADR-024/025; evidence/catalog.json:recovery','11 orígenes → 10 templates; 1 repaso/año','ACTIVE / FROZEN'),
('Rareza','src/content/rare-events.ts:careerRareEvents','src/game/runs/transition.ts:activeChallengeView; src/game/narrative/epilogue.ts:careerMemories','4 eventos; rareNote no montada en challenge; memoria condicional','ACTIVE / presentación parcial'),
('Arco y cierres','src/content/grade-*/storylets.ts; src/content/career-closing.ts','src/game/narrative/epilogue.ts:buildEpilogue; tests/unit/prestige-and-epilogue.test.ts','Proyecto, hitos y recuerdos','ACTIVE'),
('Home pública','src/app/page.tsx; src/components/competition/competition-experience.tsx','tests/e2e/competition.spec.ts; tests/component/competition-ui.test.tsx','/ es portada/identificación/juego/resultado','ACTIVE'),
('Estado de competencia','CompetitionStatusNote; src/lib/competition/contracts.ts','src/server/competition/dto.ts','status/opensAt/closesAt; sin countdown','ACTIVE; countdown PROPOSED'),
('Ranking/podio','src/components/competition/leaderboard.tsx; src/lib/competition/ranking.ts','tests/component/competition-ui.test.tsx; release manifest','Puestos numéricos y empates; mejor verificado','ACTIVE / FROZEN'),
('Identidad y aviso','src/components/competition/identity-form.tsx; privacy-summary.tsx; src/server/competition/privacy-notice.ts','ADR-026; tests/unit/competition-privacy.test.ts','Alias público; datos privados para validación','ACTIVE / FROZEN'),
('Juego y controles','src/components/game/run-view.tsx; challenge-frame.tsx; interaction-area.tsx; interactions/','tests/e2e/grade-*.spec.ts; tests/component/grade-1-constructive.test.tsx','11 InteractionKinds catalogados','ACTIVE'),
('Resultado de carrera','src/components/game/career-epilogue.tsx; src/components/competition/attempt-run.tsx; verification-panel.tsx','tests/unit/prestige-and-epilogue.test.ts; tests/component/competition-ui.test.tsx','Egreso local narrativo / score oficial posterior','ACTIVE'),
('Cierre del slice','src/components/game/year-result.tsx','src/components/game/game-container.tsx; dev/grade-7','No se usa como cierre intermedio del fair','DEV-ONLY'),
('Organizador','src/app/organizer/page.tsx; src/components/competition/organizer-console.tsx','tests/e2e/competition.spec.ts','Sólo branding compartido en scope','ACTIVE'),
('Acceso desarrollo','src/server/development/harness-access.ts:isDevelopmentHarnessEnabled','src/app/dev/*/page.tsx; tests/e2e/competition.spec.ts','Cerrado en producción con competencia','DEV-ONLY'),
('Rutas retiradas','Ausentes src/app/jugar y src/app/ranking','docs/06-delivery/stage-09-fair-mode-server-ranking.md:D; tests/e2e/competition.spec.ts','No crear assets para pantallas inexistentes','LEGACY'),
('Tokens y fonts','src/styles/tokens.css; theme.css; base.css; src/app/fonts/index.ts','ADR-015/017; docs/09-design-system/','Papel, radio0, fuentes, foco, motion','ACTIVE'),
('Marca e iconografía','src/components/ui/wordmark.tsx; marks.tsx; game/estilo-triangle.tsx','docs/09-design-system/assets.md','Código nativo, no logo exportado','ACTIVE'),
('Arte contextual','src/components/game/scene-media.tsx:SceneMedia','docs/09-design-system/assets.md','Implementado sin consumers; briefs sin generar','DOC-ONLY arte / componente disponible'),
('Metadata','src/app/layout.tsx; page.tsx; manifest.ts','Next local docs metadata/images','Sin favicon/OG/assets app explícitos','ACTIVE metadata / PROPOSED derivados'),
('Referencias visuales','docs/09-design-system/reference/*.png','docs/09-design-system/assets.md','6 PNG de referencia; no capturas nuevas de RC.2','DOC-ONLY'),
('Propuesta RC3','05-brand-direction.md; 04-asset-manifest.md','Contraste con ADR-017 y assets.md','No es decisión aceptada del sistema','PROPOSED'),
]
def table(h,rs):
 return '| '+' | '.join(h)+' |\n|'+'|'.join(['---']*len(h))+'|\n'+'\n'.join('| '+' | '.join(str(x).replace('|',' / ').replace('\n',' ') for x in r)+' |' for r in rs)+'\n'
s='''# Mapa de fuentes y trazabilidad

Baseline HEAD `cfcde1e1fe0f52d2554134efa9c4f28d72c8b833`. Fecha 2026-09-22. Las rutas se interpretan desde la raíz del repo salvo archivos de este handoff. `:símbolo` identifica el contrato concreto; en `01` hay además líneas de definición.

Estados: **ACTIVE** se usa hoy; **FROZEN** preserva compatibilidad; **DEV-ONLY** no es producto competitivo; **LEGACY** histórico/retirado; **DOC-ONLY** intención o referencia no producida. **PROPOSED** es una recomendación de esta tarea. No sustituir estos estados por “existe en un archivo”.

'''+table(['Topic','Canonical source','Secondary source / evidencia existente','Relevant symbol / hallazgo','Status'],sources)
s+='\n## Documentación consultada: '+str(len(docs))+' archivos de docs\n\nLectura dirigida a las secciones indicadas; no se afirma revisión integral de cada documento largo. Además: README raíz, AGENTS raíz, tres SKILL.md, package/lockfile/scripts y guías locales de Next.\n\n'+table(['Archivo','Alcance de lectura'],docs.items())
s+='''
## Guías técnicas locales

- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`: tamaños, `fill`, `sizes`, carga y assets locales.
- `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`: metadata de servidor, iconos y archivos OG.
- `node_modules/tailwindcss/theme.css`: breakpoint `sm: 40rem` instalado.
- `package.json`, `.node-version`, `pnpm-lock.yaml`, `next.config.ts`, `scripts/verify.mjs`: APIs/versiones y gates de este checkout.

No se hizo investigación web. No hubo decisión que necesitara confirmar datos locales externos, tendencias o proveedores; se usaron el repositorio y docs de la versión instalada. Los enlaces oficiales presentes en documentos históricos no se presentan como fuentes web consultadas por TASK-01.

## Evidencia ejecutable producida aquí

- `evidence/extract.ts` + `discovery.config.mjs`: extracción sin .env ni red; reutiliza motor real y fuentes aprobadas. El alias server-only sólo se usa para inspección local del verificador, como el stub de tests; no cambia configuración de la app.
- `evidence/catalog.json`: 22 familias, metadata y una presentación aprobada materializada por cada Template, los 1.031 IDs de variante, 50 storylets, recuperación y rareza. Contiene ejemplos numéricos del juego, nunca datos de participantes.
- `evidence/reachability.json`: 128/128 egresadas, witness por cada una de las 38 Templates públicas, 44 storylets observados y cuatro eventos raros. Se puede reproducir una seed sin conocer la seed de feria.
- `evidence/assets.json`: los 36 contratos visuales y el mapping de las 42 Templates. Es la base legible por máquina de `01`, `04` y prompts.
- `evidence/existing-assets.json`: ocho archivos con dimensiones/tamaño; `ui-copy-counts.json` fija conteos de revisión.
- `evidence/build-*.py`: generación local de tablas/prompts desde datos extraídos y decisiones editoriales explícitas; no pertenece al tooling de producto.

La cobertura del inventario cruza catálogo → elegibilidad → witnesses → UI → asset. “Una instancia por Template” no equivale a auditar 1.031 enunciados diferentes ni a validar todas las respuestas. Los resultados históricos citados de E2E/pacing son de sus documentos; los checks ejecutados en esta tarea están separados en `12-verification.md`.

## Discrepancias preservadas

Ver H01–H13 en `07`. En particular: y5 dice cuarto, y1 anuncia final de práctica en carrera completa, hero promete escenas dev, notebook cambia de objeto respecto del brief, rareNote no se monta en desafío, metadata aún sin marca gráfica, y documentación mantiene rótulos de capacidades futuras que el código ya implementó. La intención del usuario de un deployment activo no se convirtió en una comprobación remota.
'''
(O/'08-source-map.md').write_text(s)
(O/'evidence/reviewed-documents.json').write_text(json.dumps(docs,ensure_ascii=False,indent=2)+'\n')
print('Reviewed docs:',len(docs))
