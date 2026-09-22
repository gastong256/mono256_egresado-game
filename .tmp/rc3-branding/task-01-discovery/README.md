# Egresado RC3 — TASK-01 discovery

**TASK-01: DONE.** Handoff documental completo sobre el checkout RC.2; no se modificó el producto ni se generaron imágenes. Dirección recomendada: **Trayectoria en papel**, propuesta editorial pendiente de elección para la siguiente etapa.

```text
Repository analyzed: YES
Scenario inventory: COMPLETE
UI inventory: COMPLETE
Copy audit: COMPLETE
Existing assets inventory: COMPLETE
Asset manifest: COMPLETE
Brand direction: COMPLETE
Generation prompts: COMPLETE
Implementation plan: COMPLETE
```

Baseline: `main` · `cfcde1e1fe0f52d2554134efa9c4f28d72c8b833` · `1.0.0-rc.2` · 2026-09-22 UTC. La carpeta es local y no está ignorada por Git; no se hizo commit. Sus recomendaciones no sustituyen `docs/`, ADRs ni el freeze vigente.

## Qué contiene y cómo leerlo

| Orden | Archivo | Para qué sirve |
|---|---|---|
| 1 | [00-scope](00-scope.md) | Baseline, etapa actual, alcance y semántica congelada. |
| 2 | [05-brand-direction](05-brand-direction.md) | Comparar tres direcciones y revisar logo, hero y pilotos antes de generar. |
| 3 | [01-scenario-inventory](01-scenario-inventory.md) | Seis años; Family/Template/Variant, roles, elegibilidad, reutilización y fuentes. |
| 4 | [02-ui-surface-inventory](02-ui-surface-inventory.md) | Rutas, estados, controles, oportunidades y límites de evidencia visual. |
| 5 | [03-copy-audit](03-copy-audit.md) | 36 registros clasificados, protección de las 42 Templates y dos ejemplos de tono. |
| 6 | [11-existing-assets-inventory](11-existing-assets-inventory.md) | Archivos reales, primitivas de código y briefs todavía no producidos. |
| 7 | [04-asset-manifest](04-asset-manifest.md) | 36 contratos con IDs, archivos, formatos, tamaños, prioridades, reuso y prohibiciones. |
| 8 | [asset-generation-prompts](asset-generation-prompts.md) | MASTER STYLE, negativos, todas las fichas y waves de producción externa. |
| 9 | [06-implementation-plan](06-implementation-plan.md) | TASK-02→06, ingesta, archivos probables, dependencias y gates. |
| 10 | [07-risks-and-guardrails](07-risks-and-guardrails.md) | Hallazgos H01–H13, riesgos, invariantes y decisiones pendientes. |
| 11 | [08-source-map](08-source-map.md) | 39 documentos consultados, fuentes de código y discrepancias. |
| 12 | [12-verification](12-verification.md) | Comandos ejecutados, resultados, cobertura y checks omitidos. |

`evidence/` contiene extracción del motor, witnesses de alcanzabilidad, manifest JSON, generadores locales y logs. Son herramientas descartables de análisis, sin incorporación al tooling del producto. [final-report.txt](final-report.txt) conserva el resumen de consola.

## Resultado y hallazgos prioritarios

Se inventariaron **22 Families, 42 Templates y 1.031 variantes aprobadas**. La carrera pública admite 38 Templates, incluidos diez Repasos; cuatro Templates son DEV-ONLY. Los 28 contextos visuales propuestos agrupan esas Templates en 24 públicos y cuatro de desarrollo. Las 36 superficies son unidades de revisión y estados, no 36 páginas existentes.

Hay **8 archivos visuales/tipográficos existentes**: seis capturas documentales y dos fuentes; las primitivas HTML/CSS/SVG se inventarían por separado. El manifiesto propone **36 contratos: 8 P0, 16 P1 y 12 P2**; seis de marca, 28 de escenario y dos de UI global. P1 expresa prioridad entre candidatos, no obligación de encargar toda la cola. Primer pack recomendado: hero + tres pilotos + hasta cuatro escenas adicionales, **ocho raster como máximo**, dentro del presupuesto histórico de 6–9. Ranking y ending no requieren imágenes IA.

Prioridades de copy: quinto se presenta como cuarto; primero afirma que segundo no está disponible, incluso en carrera completa; home promete mural y trabajo grupal excluidos del catálogo público. También se registró que el brief histórico de notebook describe cuadernos, mientras el desafío actual compra una portátil. No se corrigieron cadenas ni reglas en esta tarea.

## Qué revisar y producir a continuación

1. Elegir A **Trayectoria en papel** (recomendada), B **Lugares que cuentan** o C **Sello de recorrido** en `05`. La propuesta ilustrada necesita ratificación frente al brief fotográfico histórico; la elección no está resuelta silenciosamente.
2. Generar externamente **Wave 1**, prueba de estilo de `scenario.y1.expo`, usando su bloque completo. Revisar a tamaño móvil. Si funciona, puede reutilizarse como piloto.
3. **Wave 2:** explorar una única marca compacta y generar hero. El nombre Egresado y los logos finales se componen manualmente en SVG con tipografía real; favicon y social se derivan, no requieren nuevas generaciones.
4. **Wave 3:** validar juntos colectivo, primera expo y peña. Sólo después seleccionar el resto del pack. Las cuatro escenas DEV quedan fuera.

Guardar originales y procedencia bajo `resources/rc3-assets/` siguiendo los nombres exactos de `04`; esa carpeta **todavía no se creó**. El próximo agente optimizará los derivados para `public/assets/brand/`, `public/assets/scenes/` y las convenciones metadata de Next. No pegar originales directamente al runtime.

Para el próximo chat, traer esta carpeta completa; como mínimo `README`, `00`, `04`, `05`, `06`, `07`, `asset-generation-prompts` y `evidence/assets.json`, más la dirección elegida, los originales, SVG editable y registro de procedencia. Para copy y pantallas, incluir también `01`, `02` y `03`. No traer secretos ni datos reales de participantes.

**Siguiente tarea: generación externa Wave 1/2 → TASK-02 (branding foundation).** El plan completo TASK-02→06 está preparado; no autoriza cambios de matemática, competencia, DB o despliegue.

## Evidencia y límites

128/128 carreras locales terminaron en egreso; el barrido encontró las 38 Templates públicas y los cuatro eventos raros, con seed testigo por caso. El verificador de release ejecutado con configuración local sin `.env` pasó sus 57 comprobaciones. Pasaron toolchain, instalación congelada offline sin scripts, diseño, infraestructura agentica, master y `release:check`.

No se ejecutó `pnpm verify` completo ni QA visual en navegador, lectores de pantalla, DB o proveedores. DONE corresponde al discovery y sus entregables; no certifica release RC3, pacing humano, todas las variantes matemáticas ni el estado remoto de producción. Detalle reproducible en `12-verification.md`.
