# Base teórica y referencias

Fecha de revisión: **20 de agosto de 2026**.

Este documento registra las fuentes que informan decisiones de Egresado. No implica copiar contenido, interfaz ni propiedad intelectual de productos existentes.

## 1. Referentes de producto

### Copero

La portada de Copero describe su juego de carrera con la propuesta “tomá decisiones, asumí consecuencias y construí la carrera de un futbolista paso a paso”. La referencia se usa para identificar un patrón de producto: **progresión comprimida + decisiones + consecuencias + carrera compartible**.

Fuente: https://copero.com.ar/

### El Ídolo — Potrero

El sitio oficial describe un juego gratuito de simulación de carrera en navegador, sin descarga, donde decisiones afectan estadísticas, dinero, reputación e idolatría; también incorpora minijuegos para momentos importantes. Egresado toma como inspiración abstracta la separación entre **capa de carrera** y **momentos interactivos de mayor intensidad**.

Fuente: https://www.potrerofutbol.ar/el-idolo

## 2. Narrativa adaptativa — Reigns

François Alliot documentó el diseño de Reigns como un sistema donde decisiones simples modifican dimensiones de estado y las siguientes cartas se eligen desde un pool filtrado/ponderado por ese estado. También describe cómo los jugadores construían historias emergentes conectando eventos.

Implicaciones para Egresado:
- evitar un árbol narrativo completo;
- usar storylets con condiciones/pesos;
- permitir callbacks y mini-arcos;
- hacer que pequeñas decisiones tengan consecuencias observables.

Fuente: https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-

## 3. Intrinsic integration en juegos educativos

Habgood y Ainsworth estudiaron la integración intrínseca del contenido de aprendizaje dentro del gameplay. En su trabajo con Zombie Division, la versión intrínsecamente integrada mostró mejores ganancias de aprendizaje bajo tiempo fijo y fue jugada mucho más tiempo voluntariamente que la versión extrínseca.

Implicaciones:
- no separar “juego” y “pregunta matemática” si puede evitarse;
- formular matemática como herramienta para actuar;
- usar narrativa y consecuencias para dar significado al cálculo.

Referencia:
M. P. Jacob Habgood & Shaaron E. Ainsworth (2011), *Motivating Children to Learn Effectively: Exploring the Value of Intrinsic Integration in Educational Games*, Journal of the Learning Sciences, 20(2), 169–206. DOI: 10.1080/10508406.2010.508029

Fuente: https://www.tandfonline.com/doi/full/10.1080/10508406.2010.508029

## 4. Alfabetización matemática — PISA

El marco PISA 2022 conceptualiza la alfabetización matemática alrededor de razonamiento y resolución de problemas en contextos del mundo real, incluyendo formular, usar e interpretar matemática y juzgar información cuantitativa. Sus categorías de contenido incluyen cantidad, incertidumbre/datos, cambio/relaciones y espacio/forma.

Implicaciones:
- estructurar taxonomía de Egresado sobre dominios amplios;
- priorizar interpretación y decisión, no sólo operatoria;
- incluir situaciones con información suficiente/insuficiente y datos estadísticos.

Fuente: https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/08/pisa-2022-assessment-and-analytical-framework_a124aec8/dfe0bf9c-en.pdf

## 5. MDA — Mechanics, Dynamics, Aesthetics

Hunicke, LeBlanc y Zubek proponen analizar juegos separando mecánicas, dinámicas y estética/experiencia. Egresado usa ese marco para evitar diseñar features únicamente desde implementación.

Aplicación:
- Mechanics: elegir, asignar, calcular, solicitar datos, administrar recursos.
- Dynamics: optimización, riesgo, escasez, progresión, callbacks.
- Aesthetics: tensión breve, curiosidad, orgullo, arrepentimiento, descubrimiento y comparación social.

Referencia: Robin Hunicke, Marc LeBlanc, Robert Zubek, *MDA: A Formal Approach to Game Design and Game Research*.

Fuente: https://www.cs.northwestern.edu/~hunicke/MDA.pdf

## 6. Stack web

### Next.js
Next.js se define como framework React para aplicaciones full-stack. Route Handlers permiten endpoints custom dentro del App Router. La documentación oficial también ofrece guía PWA y manifest.

Fuentes:
- https://nextjs.org/docs
- https://nextjs.org/docs/app/getting-started/route-handlers
- https://nextjs.org/docs/app/guides/progressive-web-apps

Al 20/08/2026, Next.js 16.3 es una release actual, pero el proyecto debe fijar una versión estable soportada mediante lockfile y políticas de actualización.

### Vercel
Vercel Functions ejecuta código server-side sin administrar servidores y despliega Route Handlers de Next.js como funciones. Se recomienda ejecutar funciones cerca de su datasource.

Fuentes:
- https://vercel.com/docs/functions
- https://vercel.com/frameworks/nextjs

### Supabase/PostgreSQL
Supabase proporciona un Postgres completo y capacidades de Realtime. Su documentación requiere RLS para tablas expuestas en schemas accesibles al cliente y permite autorización en Realtime. Egresado mantiene datos críticos detrás del BFF en el baseline y reserva Realtime para evolución del leaderboard.

Fuentes:
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/realtime/broadcast
- https://supabase.com/docs/guides/realtime/authorization

## 7. Decisiones derivadas

La investigación no dicta arquitectura automáticamente. Las decisiones formales están en ADRs. En particular:
- ADR-001 deriva de requisitos web/mobile y tipo de interacción.
- ADR-003 deriva de reproducibilidad, fair challenges y debugging.
- ADR-007 deriva de la necesidad de escalar contenido.
- El diseño matemático deriva de intrinsic integration + alfabetización matemática aplicada.

---

## Fuentes incorporadas desde el Project Blueprint v0.2

Fecha de acceso declarada por el paquete: **agosto de 2026**. Estas fuentes informan las recomendaciones de variantes, dificultad, competencia y seguridad; ninguna prueba causalmente nada sobre Egresado, que sigue necesitando validación con la institución. Ver [la integración del blueprint](blueprint-v0.2-integration.md).

### 8. STACK — variantes aleatorias sembradas y desplegadas

- «Deploying»: https://docs.stack-assessment.org/en/STACK_question_admin/Deploying/
- «Random objects»: https://docs.stack-assessment.org/en/CAS/Random/
- «Systematic deployment»: https://docs.stack-assessment.org/en/STACK_question_admin/Deploying_systematically/

Principio: las variantes pseudoaleatorias sembradas son reproducibles, y pregenerarlas, testearlas y desplegarlas reduce el riesgo de exponer casos imposibles o defectuosos.

Implicación: variantes deterministas, catálogo prevalidado para la feria, golden seeds, y nada de RNG sin control durante una competencia con premios. Ver [familias, plantillas y variantes](../01-game-design/challenge-families-and-variants.md).

### 9. CAST — Universal Design for Learning 3.0

- https://udlguidelines.cast.org/
- Acción y expresión: https://udlguidelines.cast.org/action-expression/
- Representación: https://udlguidelines.cast.org/representation/
- Compromiso: https://udlguidelines.cast.org/engagement/

Principios relevantes: optimizar desafío y apoyo, clarificar notación y símbolos matemáticos, usar múltiples representaciones, variar los métodos de respuesta y navegación, relevancia auténtica y feedback orientado a la acción.

Implicación: no asumir que una sola representación sirve para todos; conservar alternativas de teclado y sin arrastre; sacar barreras que no son el objetivo de la tarea; feedback que habilite acción en vez de vergüenza. Ver [dificultad y jugabilidad universal](../01-game-design/difficulty-and-playability.md).

### 10. Tareas de piso bajo y techo alto

- Revisión de literatura 2025: https://www.tandfonline.com/doi/full/10.1080/0020739X.2025.2457365
- Ejemplo en Educational Designer: https://www.educationaldesigner.org/ed/volume5/issue17/article68/

Principio: entrada accesible con conocimiento previo limitado, y espacio para razonamiento matemático más profundo, con más de un camino posible.

Implicación: los conceptos de 7.º tienen que ser abordables por cualquiera, y el desafío para adultos tiene que venir de restricciones y optimización, no de currículo avanzado.

### 11. Leaderboards repetibles y mejor puntaje

- Apple GameKit, «Choosing a leaderboard for your challenges»: https://developer.apple.com/documentation/gamekit/choosing-a-leaderboard-for-your-challenges

Principio: un desafío repetible conviene rankearlo por mejor puntaje y no por actividad acumulada, que favorece a quien juega más veces.

Implicación: personal best en vez de suma de intentos. Ver [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).

### 12. Property-based testing

- fast-check, «Why Property-Based Testing?»: https://fast-check.dev/docs/introduction/why-property-based/

Principio: los property tests siguen siendo reproducibles usando seeds y seeds de falla.

Implicación: invariantes de generador sobre miles de seeds, persistir la seed que falla y poder reproducir la variante exacta. Ya es la práctica del repositorio; ver [estrategia de testing](../04-quality/testing-strategy.md).

### 13. Accesibilidad — WCAG 2.2

- https://www.w3.org/TR/wcag/

Principios relevantes: nombre, rol y valor programáticos; estado determinable; mensajes de estado; operación por teclado.

Implicación: controles semánticos, feedback anunciado, y ninguna semántica de resultado que dependa sólo del color. Es el objetivo declarado del [sistema de diseño](../09-design-system/accessibility.md).

### 14. Seguridad de API y de juegos

- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- API4 Unrestricted Resource Consumption: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
- OWASP Game Security Framework: https://owasp.org/www-project-gamesec-framework/OGSF

Principios relevantes: validar los datos que cruzan una frontera de confianza, mantener autoritativa la lógica sensible y aplicar límites de tasa y de recursos.

Implicación: el cliente no publica un score final; el servidor valida y reproduce; se limitan creación y envío de runs y el tamaño del action log. Ver [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md) y [threat model](../04-quality/threat-model.md).

## 15. Referencias aportadas por el Full-Career Product Audit

Paquete del 9 de septiembre, integrado el 10 de septiembre de 2026.
Se conserva su bibliografía como **procedencia declarada**, no como una nueva
revisión externa ejecutada por esta reconciliación. La heterogeneidad de la
evidencia no permite afirmar que una fuente pruebe una mecánica de Egresado ni
extrapolar resultados de educación superior a estudiantes secundarios.

Las referencias repetidas tienen una sola entrada mantenible: R1 → §3 (Habgood y
Ainsworth, 2011), R3 → §5 (MDA, 2004), R4 → §4 (PISA 2022), R8 → §9 (CAST UDL 3.0,
2024), R9 → §13 (WCAG 2.2). El paquete resalta teclado, alternativas al arrastre y
redundancia de color; el target interno de 44 CSS px es una decisión de
[UX](../01-game-design/ux-interaction-design.md), no una afirmación de que todo
mínimo WCAG sea 44 px.

| ID de origen | Referencia adicional declarada | Uso y límite |
|---|---|---|
| R2 | Habgood, Ainsworth y Benford (2005), *Endogenous fantasy and learning in digital games*, Simulation & Gaming 36(4), 483–498. DOI: 10.1177/1046878105282276. | Integración entre acción y contexto; informa el Intrinsic Math Gate. |
| R5 | NCTM, *Principles to Actions: Ensuring Mathematical Success for All*. | Razonamiento, representaciones y validación; no prescribe el scorer. |
| R6 | Secretaría de Educación / Ministerio de Capital Humano, “Resolución 476/2026 — criterios para materiales de Matemática”, según el paquete. | Referencia normativa **no verificada** aquí; no se afirma existencia, vigencia ni aplicabilidad legal. Los criterios pedagógicos aceptados tienen autoridad de producto propia. |
| R7 | Plan Nacional Aprender Matemática — Nivel Secundario, materiales NAP/IPAP. | Variables, representaciones y situaciones significativas; el paquete no identifica edición/enlace precisos. |
| R10 | Skulmowski y Xu (2022), *Understanding Cognitive Load in Digital and Online Learning: a New Perspective on Extraneous Cognitive Load*, Educational Psychology Review 34, 171–196. DOI: 10.1007/s10648-021-09624-7. | Reducir fricción no matemática antes que profundidad de razonamiento. |
| R11 | Kiili, Lainema, de Freitas y Arnab (2014), *Flow framework for analyzing the quality of educational games*, Entertainment Computing 5(4), 367–377. DOI: 10.1016/j.entcom.2014.08.002. | Lente de pacing/feedback; no demuestra el target de duración local. |
| R12 | Togelius, Yannakakis, Stanley y Browne (2011), *Search-Based Procedural Content Generation: A Taxonomy and Survey*, IEEE TCIAIG 3(3), 172–186. DOI: 10.1109/TCIAIG.2011.2148116. | Espacio de variantes y validación, no obligación de usar un solver. |
| R13 | Byun y Joung (2018), *Digital game-based learning for K–12 mathematics education: A meta-analysis*, School Science and Mathematics 118(3–4), 113–126. DOI: 10.1111/ssm.12271. | Evidencia heterogénea de aprendizaje basado en juegos, sin garantía causal para Egresado. |
| R14 | Hussein, Ow, Elaish y Jensen (2022), *Digital game-based learning in K-12 mathematics education: a systematic literature review*, Education and Information Technologies 27, 2859–2891. DOI: 10.1007/s10639-021-10721-x. | Misma cautela de contexto, diseño y población. |
| R15 | Li et al. (2024), *The use of leaderboards in education: A systematic review of empirical evidence in higher education*, Journal of Computer Assisted Learning. DOI: 10.1111/jcal.13077. | Riesgos de comparación social; no extrapolar automáticamente a secundaria. |
| R16 | Nebel, Schneider, Beege y Rey (2017), *Leaderboards within educational videogames: The impact of difficulty, effort and gameplay*, Computers & Education 113, 28–41. DOI: 10.1016/j.compedu.2017.05.011. | Revisar exposición pública, dificultad y esfuerzo sin puntuar actividad acumulada. |
| R17 | Alusión del paquete a un cuasi-experimento longitudinal de 2024 en *Learning and Individual Differences*. | **Cita incompleta/no verificable con los datos aportados**: no se usa su supuesto resultado como evidencia validada. |

Destino de las decisiones, método y límites:
[integración canónica del Product Audit](full-career-product-audit-integration.md).
Teacher Gate 2, walkthroughs cognitivos/accesibles y simulación mitigan riesgo;
no sustituyen ni se presentan como playtest real con estudiantes.
