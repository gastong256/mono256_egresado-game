# Home — copy, hero y contador

23/09/2026. Ajuste de interfaz solicitado por el PO; sin cambios en consignas,
contenido jugable, motor, reglas ni versiones.

- «Tu secundaria. Tus decisiones. Tu propia historia.» en Home y tarjeta social.
- «Es tu turno», «Practicar», «Así va la competencia» y resultado sin jerga
  de verificación. Se mantiene la comprobación servidor antes de publicar.
- Hero en una fila completa; tamaños de imagen adaptados al ancho real.
- Contador destacado antes del CTA, cifras fluidas y pulso de segundos;
  urgencia según tiempo real, ocultar contador y reduced motion conservados.
- «Feria del Libro 2026» en la edición local; footer «36° Feria del Libro · 2026».
  El aviso de privacidad sustituye la exposición del slug por el nombre del evento;
  sus finalidades, datos, responsables y retención no cambian.

## Causa local del contador ausente

La fila `feria-local` estaba OPEN pero sin `closes_at`: el componente no inventa
una fecha. Se actualizaron exclusivamente nombre y cierre en PostgreSQL local,
usando `2026-09-25T14:00:00Z` (25/09, 11:00 argentina), calendario aprobado en
`docs/05-operations/vercel-supabase-production-deployment.md`. No se modificó
la apertura ni se tocó producción. No es una migración ni un cambio de seed.

## Verificación dirigida — PASS

- `pnpm toolchain:check` y `pnpm install --frozen-lockfile`: PASS.
- `pnpm test` dirigido a event-countdown, home-event, competition-ui,
  privacy-page, career-ending, practice, cn, brand-assets y competition-privacy:
  **139 tests / 9 archivos PASS**.
- `pnpm design:check`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`: PASS.
- `pnpm build` con entorno local: PASS.
- Playwright: Home, competencia, práctica, foundation y vitrina, con sus
  dependencias de privacidad: 98 PASS inicialmente; se actualizó la prueba de
  teclado al nuevo orden reloj → CTA → Practicar. Reejecución sólo de los dos
  casos de teclado y los diez casos de práctica dependientes: **12 PASS**.
  Total de la selección cubierta: **110 E2E PASS por etapas**.
- Capturas locales revisadas a 390 y 1280 px; E2E de 320–1920 px,
  zoom 200 %, axe, reduced motion, geometría del hero y reloj antes del CTA.
- Workspace y master sincronizados; `git diff --check`: PASS.

No se ejecutó `pnpm verify` completo, por instrucción del PO y alcance de UI.
No se repitieron cobertura global, simulaciones ni gates de migración/Docker.
El servidor queda en `http://localhost:3000`. Sin push.
