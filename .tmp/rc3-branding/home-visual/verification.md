# Home — jerarquía cromática, iconos y medallas

23/09/2026. PASS del subconjunto pertinente. Alcance solicitado: sólo la landing.
No se modificaron juego, práctica, identificación, cierres, ranking autoritativo,
fechas, datos, footer ni política legal. Sin dependencias nuevas ni push.

## Criterio y fuentes consultadas

- [NN/g: Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/):
  escala, contraste y agrupación para dirigir la atención. Aplicación: acento
  verde en la promesa, explicación organizada y lima reservada a Jugar ahora.
- [Carbon: Icon usage](https://carbondesignsystem.com/elements/icons/usage/):
  iconos consistentes y vinculados al significado. Aplicación: operaciones,
  compañeros y estrella, con etiquetas siempre visibles; SVG decorativos sin
  anuncios duplicados, sin descargas externas ni biblioteca para cuatro dibujos.
- [W3C: Use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html):
  el color no es el único canal. Aplicación: estado abierto escrito, nombres de
  aportes y numerales de medallas; se conservan empates y orden del servidor.
- [W3C: Non-text contrast](https://www.w3.org/WAI/WCAG21/understanding/non-text-contrast.html):
  contraste de gráficos informativos. Aplicación: metales oscuros sobre tintes,
  estrellas neón sólo sobre negro; combinaciones agregadas al gate mantenido.

La propuesta es una interpretación de estas pautas dentro del DS de Egresado,
no una validación con participantes ni una certificación de accesibilidad.

## Implementación

- Promesa: tinta → tinta secundaria → verde escolar en «Tu propia historia».
- Estado: punto verde y palabra «Competencia abierta», sin parpadeo adicional.
- Aportes: tres bloques Surface, en fila desde tablet y apilados en móvil.
  Matemática con tinte verde/filete pesado; Equipo en papel; Aura sobre negro.
- Podio: medallas numeradas oro/plata/bronce, primer puesto de mayor escala,
  mismos puestos compartidos y desniveles; posición propia con acento verde.
- Cuatro pigmentos ocre/cobre y seis roles semánticos nuevos limitados al podio;
  plata reutiliza pigmentos existentes. Roles documentados en vitrina, guardarraíl
  actualizado y nueve pares de contraste nuevos. Ningún token existente cambia.
- Numerales sobre tintes: oro 4,91:1; plata 7,16:1; bronce 5,49:1.
  Los otros pares usados en Aura y verde ya formaban parte del sistema.

## Verificación ejecutada

- `pnpm toolchain:check`: PASS (Node 24.19.0 / pnpm 11.22.0).
- `pnpm test tests/component/home-event.test.tsx tests/component/competition-ui.test.tsx tests/component/event-countdown.test.tsx tests/component/ranking-deadline-notice.test.tsx`: 98 PASS.
- `pnpm test tests/component/home-event.test.tsx`: 9 PASS al ampliar assertions
  de nombres accesibles y numerales de puestos compartidos; incluidos en los 98.
- `pnpm design:check`: PASS; 104 archivos, cero hallazgos, 51 pares de contraste.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`: PASS.
- ESLint dirigido al test actualizado después del lint global: PASS.
- `node scripts/sync-master-spec.mjs --write` / `--check`: PASS.
- `node scripts/validate-agent-workspace.mjs`: PASS.
- `node /tmp/egresado-task-a/run-local.mjs build`: PASS.
- `node /tmp/egresado-task-a/run-local.mjs test:e2e:only tests/e2e/home-event.spec.ts tests/e2e/design-system.spec.ts --grep 'home a|UPCOMING|teclado|200 %|podio vacío|la vitrina' --no-deps --workers=4`: 26 PASS.
- `node /tmp/egresado-home-visual/review.mjs`: revisión local a 320/390/768/1280,
  cero overflow y axe sin violaciones. Capturas revisadas de portada, explicación
  y podio en `/tmp/egresado-home-visual/`.
- `git diff --check`: PASS; revisión de diff completo y estado realizada.

El wrapper carga `.env.local`, valida Supabase loopback y transmite el entorno
al build/E2E para evitar usar las credenciales remotas de `.env.production.local`.
No se ejecutó verify completo, coverage global, simulación ni suites de gameplay,
DB o deploy, por alcance visual e instrucción del PO. El servidor dev existente
se conserva en http://localhost:3000. Los servidores temporales de E2E finalizaron.
