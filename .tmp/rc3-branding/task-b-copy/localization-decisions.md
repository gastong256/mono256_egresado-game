# Decisiones de localización — TASK-B

Contexto de destino: escuela secundaria argentina, compatible con NEA / Chaco /
Corrientes / Resistencia sin fijar una geografía precisa. La escuela sigue
siendo genérica (decisión de `narrative-system.md`, «la escuela permanece
anónima»).

| Tema | Decisión | Dónde |
|---|---|---|
| Voseo | Único registro. `elegí / probá / seguí / decí / marcá / poné`. Sin tuteo ni «vosotros». Verificado con grep sobre `src/components` y `src/content`. | todo |
| Léxico escolar | colectivo, curso, salón, acto, feria, peña, Intercurso, Día del Amigo, Día del Estudiante, profe, preceptor, pecheras, abono, boleto, merienda, mandados. Ya existía; se conserva. | contenido |
| «el 60» | Removido. «El colectivo viene con demora otra vez» / «el colectivo sigue viniendo con demora». Un número de línea ata la escena a una ciudad que el juego no declara y no aporta a la cuenta. La ilustración muestra un colectivo sin número, así que no hay conflicto visual. | `g7.bus-timing`, `g7.bus-latest-departure` |
| Marcas / empresas / calles / barrios | Ninguna. Auditado: no hay nombres reales de comercios, clubes, calles ni empresas de micros en el copy público. | — |
| Precios y horarios | Datos matemáticos aprobados; no se «actualizan» ni se vuelven «más realistas». Sin cambios. | catálogos |
| Nombres del elenco | Alex/Dani/Sam y Juli/Ari/Cami (expo) siguen como están: desambiguan datos por variante. No se renombra nada. | `y1.course-project-expo` |
| «maestra» en 7.º | Se conserva: 7.º grado es primaria en la organización escolar del NEA, y el acto del 25 lo reparte la maestra. En años siguientes, «profe» y «preceptor». | `g7.may-25-act`, storylets |
| Argentinismos fuertes | Sólo dentro de una voz narrativa concreta (la profe del pasillo en `g7.review`). Se retiró el «Che» inicial de esa línea porque era el único de todo el juego y sonaba forzado. | `g7.review` |
| «Recuperatorio» vs «Repaso» | **Repaso** es el label v1 cerrado por el Product Pass (`graduation-and-fail-forward.md`). Se mantiene y se usa con mayúscula inicial en toda la UI («Ir al Repaso», «Repaso: …», «el mismo Repaso»). No se introduce «recuperatorio»: en la escuela real un recuperatorio es un examen; acá es una cuenta corta que cierra el año salga como salga. | run-view, storylets |
| Notación de años | `7.º`, `1.º`, `2.º`, `3.º`, `4.º`, `5.º` con punto y ordinal; «7.º grado», «1.º año» en el encabezado de etapa. Se removieron «Cuarto año», «Tercer año», «Segundo año», «cerrar primero/segundo/tercero/cuarto/quinto» de eyebrows y títulos. | storylets, `stage-label.ts` |
| Fechas | Se conservan los momentos del calendario escolar (25 de Mayo, 21 de septiembre, marzo, diciembre) sin año. «Feria del Libro 2026» sólo en el footer institucional y en el nombre de la competencia configurada. | home, footer |
| Formato numérico | Sin cambios: coma decimal, punto de miles, hora 24 h, `$` con espacio según `pesos.ts`. | formatters |
