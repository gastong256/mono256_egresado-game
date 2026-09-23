# Privacidad UX — verificación local

Fecha: 2026-09-23. Base: `f0b7fc8`. Alcance: ADR-030.

## Resultado

Home conserva un enlace de privacidad en el footer. `/privacidad` publica el
aviso v1 íntegro desde su generador existente. El formulario elimina el checkbox
y acepta al enviar mediante **Aceptar y jugar**, con micro-copy y enlace accesible
en otra pestaña. Leer la política conserva los campos y no envía aceptación.
El servidor sigue exigiendo reconocimiento afirmativo y versión vigente.

La decisión y las fuentes legales están en
[ADR-030](../../../docs/03-architecture/adr/ADR-030-privacy-page-and-action-acknowledgement.md).
No se certifica la base jurídica institucional ni la capacidad de menores.

## Evidencia

- `pnpm toolchain:check`: PASS, Node 24.19.0 y pnpm 11.22.0.
- `pnpm install --frozen-lockfile`: PASS; sin cambios de dependencias.
- Pruebas específicas de componente/integración: 97 + 2 PASS.
- Pruebas específicas de privacidad E2E: 10 PASS, desktop y móvil.
- `pnpm security:audit`: PASS, sin vulnerabilidades conocidas.
- `pnpm verify`, con entorno Supabase local: primera ejecución interrumpida
  por SIGTERM durante cobertura, sin diagnóstico de una prueba fallida.
- Repetición con `VITEST_MAX_WORKERS=4`: PASS en workspace/master, secretos,
  release dependency gate, formato, lint/fronteras, TypeScript, diseño,
  **2478 tests en 134 archivos**, contenido/catálogos, simulaciones, manifiesto
  congelado y build. Cobertura: statements 86,86 %, branches 79,80 %,
  functions 89,28 %, lines 87,09 %.
- En la última etapa de esa ejecución, E2E terminó 261 PASS / 1 FAIL: un
  localizador existente de «Modo práctica» coincidía también con el anuncio
  accesible de navegación de Next. Se precisaron esos localizadores con
  `exact: true`; no se cambió el producto para satisfacer la prueba.
- Prettier y ESLint del spec corregido: PASS. Se reinició la suite completa
  con servidores de prueba limpios: `pnpm test:e2e:only`, **262 PASS**, 3,3 min.
- Revisión visual manual de política desktop/móvil y formulario móvil;
  E2E de teclado, zoom, axe, SSR sin JavaScript y nonce CSP: PASS.
- `git diff --check`: PASS. `/` y `/privacidad` locales responden HTTP 200.

Conclusión: PASS por etapas. No se afirma una ejecución monolítica final de
`pnpm verify` con exit 0: tras cambiar exclusivamente los localizadores se
repitieron formato/lint del spec y toda la etapa E2E, conservando la evidencia
anterior de las demás etapas.

No se ejecutaron gates de migración/DB ni contenedores: no cambian schema,
persistencia ni infraestructura. No hubo deploy ni push. El servidor local
queda disponible en `http://localhost:3000` para revisión.
