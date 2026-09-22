# Estrategia de testing

## Gates ejecutables de la base técnica

La suite actual demuestra la infraestructura, no el comportamiento futuro del juego:

- `tests/unit/`: schemas de entorno y frontera pura inicial de `game`.
- `tests/component/`: render y semántica del shell de la base.
- `tests/integration/`: contrato de liveness de `/api/health` sin depender de una DB.
- `tests/property/`: combinaciones generadas de configuración pública/server-only.
- `tests/e2e/`: smoke del shell y health en Chromium desktop y viewport Pixel 7, incluida ausencia de errores de consola.

Vitest mide los archivos enumerados en `vitest.config.ts`, que incluyen todo `src/game`, con thresholds de 85 % para statements, lines y functions, y 75 % para branches. El porcentaje no es el objetivo: la prioridad de cobertura es transiciones, replay, generadores, evaluadores, matemática, scoring, selección de storylets y serialización.

## La competencia (STAGE-09)

La suite de competencia sigue el mismo criterio que el resto: probar
**propiedades**, no implementaciones.

- `tests/unit/competition-identity.test.ts` — normalización de documento y
  nombre, derivación de identidad, alias, tokens y credencial del organizador.
- `tests/unit/competition-ranking.test.ts` — el comparador y el puesto
  compartido. Lo que defiende es la **ausencia** de todo lo demás —tiempo, orden
  de llegada, intentos, alias— como criterio.
- `tests/unit/competition-privacy.test.ts` — la frontera pública/privada contra
  el dato concreto: el nombre de Ana, su documento y su año, buscados en cada
  salida del sistema.
- `tests/unit/competition-config.test.ts` — entorno, configuración del
  responsable de los datos y resolución de la tupla de versiones.
- `tests/integration/competition-store.test.ts` — el contrato del puerto de
  persistencia, corrido contra **memoria y Postgres**. El store en memoria no es
  un mock: es una segunda implementación real, y cuando una garantía existe en
  una sola, la suite lo dice.
- `tests/integration/competition-lifecycle.test.ts` — identidad, emisión,
  ventana temporal, envío, idempotencia y mejor intento, con carreras **jugadas**
  contra el motor real: un log inventado probaría que el servidor acepta lo que
  el test escribió.
- `tests/integration/competition-attack.test.ts` — la matriz de ataque. Cada
  caso termina mirando el leaderboard: un rechazo que igual publica algo no
  sirve de nada.
- `tests/integration/competition-organizer.test.ts` — acceso, correcciones,
  moderación, auditoría, exportación y purga.
- `tests/integration/competition-performance.test.ts` — escala de feria medida,
  no supuesta.
- `tests/component/competition-ui.test.tsx` — el ranking, el formulario y el
  panel de resultado donde se ven.
- `tests/e2e/competition.spec.ts` — el producto entero desde `/`, sin `/dev`.

La suite de navegador levanta **dos servidores**, porque hay dos formas de
despliegue y no conviven: uno sin competencia y con el harness abierto, donde
corren las suites de contenido de STAGE-08, y otro con la competencia
configurada, donde corre la de STAGE-09. Un despliegue con competencia cierra
`/dev` por diseño, así que ejercitar las dos superficies contra un solo proceso
habría exigido relajar esa compuerta —es decir, probar una configuración que
nadie va a desplegar.

Dos notas de método. Las suites que tocan Postgres **se saltean con un mensaje**
cuando no hay base configurada, en vez de pasar en verde sin haber probado nada;
la evidencia de cierre se toma con la base levantada. Y la E2E de competencia
resuelve los nueve beats con el motor real a partir del descriptor **que el
servidor emitió**, dejando el avance en el checkpoint del navegador para que el
producto lo reanude y lo envíe: un solucionador de interfaz para las 28
Templates sería una segunda implementación de los witnesses de autoría, y las
suites de STAGE-08 ya recorren ese contenido beat por beat en el navegador.

El motor suma cuatro capas que no son unit tests convencionales:

- **property tests** (`tests/property/`): determinismo por seed, equivalencia entre run y replay, round-trip de serialización, rangos del RNG, selección ponderada que nunca elige peso cero, stats acotadas, score finito y no negativo, instancias generadas que cumplen sus invariantes, y estabilidad de evaluación;
- **golden replays** (`tests/unit/engine-golden.test.ts`): fijan la salida determinista exacta de seeds conocidas. Detectan un cambio accidental de protocolo; regenerarlos exige el bump de versión correspondiente;
- **simulación masiva** (`pnpm game:simulate`): miles de runs deterministas que buscan callejones sin salida, scores inválidos, divergencia de replay, deriva de snapshot y **runs que completan sin egresar**. `pnpm verify` corre 200 runs; la simulación profunda queda local, y `--content=six-stage` juega la carrera de seis años;
- **auditoría exhaustiva del espacio de estados** (`tests/unit/progression-reachability.test.ts`): donde el espacio es finito y chico, no se muestrea — se recorre entero. La progresión de un año y de una carrera de seis se enumeran completas para establecer que hay un único estado terminal alcanzable, sin ciclos ni callejones. Un muestreo puede no encontrar el bucle; una enumeración prueba que no existe.

El contenido de 1.º (STAGE-08 / Phase 1) agrega su propia pirámide:

- **oráculos por plantilla** (`tests/unit/grade-1-*.test.ts`): cada evaluador se compara con una implementación independiente en todos los planes enumerables o en respuestas arbitrarias de `fast-check`, junto con señuelos, exploits y fronteras de payload;
- **witness por variante** (`tests/unit/grade-1-catalog.test.ts`): cada entrada aprobada materializa, verifica y alcanza su máximo declarado —con Equipo máximo simultáneo donde existe—, y el artefacto se reconstruye byte a byte;
- **recorrido real** (`tests/integration/grade-1-run.test.ts`): create → comandos → snapshot/reanudación en cada frontera → replay → servidor, Repaso practicado/debriefeado, fail-closed y FairScore exacto de 10.000 con evidencia máxima;
- **UI y navegador** (`tests/component/grade-1-*.test.tsx`, `tests/e2e/grade-1.spec.ts`): controles nativos sin arrastre, teclado, 360/390 px, axe, reanudación con red cortada y el caso de dos obligaciones.

## Verificación local

`pnpm verify` es el gate integrado y exige la versión exacta de Node.js fijada en `.node-version` (`24.19.0` en esta baseline). Ejecuta en orden:

1. coherencia de Node/pnpm entre metadata, proceso y Docker;
2. validación del workspace agentic;
3. sincronización del master documental;
4. formato;
5. lint, incluidas fronteras de arquitectura;
6. TypeScript general y core sin DOM/Node;
7. unit, component, integration y property tests con cobertura;
8. validación de contenido (`pnpm game:validate-content`), también para `--content=grade-1`;
9. integridad de los catálogos aprobados de 7.º y de `7.º → 1.º`;
10. simulación determinista de 200 runs con verificación de replay y snapshot, también sobre `7.º → 1.º`;
11. build de producción;
12. smoke E2E sobre el build, incluido el harness del motor y los recorridos de 1.º.

Comandos más estrechos para iteración:

| Alcance | Comando |
|---|---|
| Coherencia del toolchain fijado | `pnpm toolchain:check` |
| Unit/component/integration/property una vez | `pnpm test` |
| Watch de Vitest | `pnpm test:watch` |
| Cobertura y thresholds | `pnpm test:coverage` |
| Build + Playwright | `pnpm test:e2e` |
| Playwright sobre un build preparado | `pnpm test:e2e:only` |
| Validación de contenido | `pnpm game:validate-content` |
| Simulación determinista | `pnpm game:simulate` |
| Simulación profunda de balance | `pnpm game:simulate:deep` |
| Tipos de app + frontera de core | `pnpm typecheck` |
| Tokens y contraste del sistema de diseño | `pnpm design:check` |
| Lint + imports/límites prohibidos | `pnpm lint` |

`pnpm release:check` verifica el piso de seguridad de Next.js y forma parte de `pnpm verify`, junto con `pnpm release:verify`, que comprueba el manifiesto congelado. La versión fijada es `16.3.5`. El GO de producción requiere además STAGE-10.

## CI

GitHub Actions separa tres jobs:

- `Quality and build`: instalación congelada, toolchain, documentación/workspace, formato, lint/fronteras, typecheck, cobertura y build.
- `Browser smoke tests`: instalación congelada, Chromium con dependencias, build, E2E desktop/mobile y artefacto del reporte.
- `Production container smoke`: build del target standalone, ejecución no-root y smoke de `/` y `/api/health` con publicación sólo en loopback del runner.

CI no inicia Supabase ni el workflow Compose de desarrollo. Cuando un cambio toque esas superficies, ejecutar y reportar los gates manuales aplicables:

- DB: `pnpm db:start`, `pnpm db:reset`, `pnpm db:lint` y `pnpm db:types`;
- Docker desarrollo: `pnpm docker:up` y health check;
- Docker portable: además del job CI, `pnpm docker:build` y smoke local de `/api/health` cuando cambie el runtime;
- supply chain: `pnpm security:audit` y `pnpm release:check`.

Agregar gates de DB/Compose a CI cuando exista una señal útil y estable que justifique su costo; no declarar cobertura CI si sólo se verificó localmente.

## Pirámide objetivo para producto

### Unit tests

- evaluadores matemáticos;
- scoring y perfiles;
- reducers y transiciones;
- RNG helpers;
- schemas y reglas versionadas.

### Property-based / generative tests

Son críticos para contenido procedural. Deben demostrar que cada challenge generado es válido y solucionable cuando se promete, que las soluciones óptimas lo son, que no hay divisiones por cero, que unidades/rangos visibles son consistentes y que un replay reproduce el mismo estado.

### Integration tests

Cuando existan contratos y schema ejecutables:

- create run → persist;
- finish → replay → score;
- idempotencia;
- leaderboard sólo con runs completed/valid;
- RLS/grants y moderación.

### E2E Playwright

Expandir la suite al implementar producto: primera run, cada interaction type, refresh/reanudación, finish online, ranking, viewport mobile/desktop y accesibilidad básica por teclado.

Escaneo de accesibilidad con `@axe-core/playwright` sobre las pantallas del juego y sobre la vitrina del sistema de diseño. La aserción incluye el HTML del nodo: una falla de contraste que sólo diga «1 nodo» obliga a reproducirla a mano para saber cuál era.

Hay además dos verificaciones que sólo tienen sentido en un browser real y que no son de accesibilidad:

- **elegir no revela el resultado**: se eligen la primera y la última opción de un desafío real y se comparan los colores computados. Una de las dos resuelve el problema y la otra no, y eso no puede notarse antes de confirmar.
- **la paleta ajena no genera nada**: se inyecta un elemento con `bg-blue-500` y se verifica que quede sin fondo. Si esa protección se cayera, el sistema de diseño pasaría a ser una sugerencia.

Ambas apagan las transiciones antes de medir: con varios workers en paralelo, leer un color mientras todavía interpola devuelve un fotograma intermedio.

## Golden seeds y simulaciones

Mantener golden seeds con resultados esperados después de decidir algoritmo PRNG, contrato de consumo y ruleset. Antes de un release de contenido, ejecutar simulaciones suficientes para detectar dificultad extrema, eventos imposibles/repetidos y distribuciones anómalas de perfiles.

No crear goldens que congelen decisiones todavía abiertas. Las preguntas 24–27 definen los gates previos para score, PRNG, compatibilidad histórica y señales temporales.

## Sistema de diseño

`pnpm design:check` corre dentro de `pnpm verify` e incluye dos gates:

- **guardarraíl de tokens**: ninguna pantalla usa la paleta cruda, un color escrito a mano, un tamaño de texto o un radio fuera del sistema;
- **contraste medido**: cada color OKLCH se convierte a sRGB y se verifican las combinaciones que el producto pinta de verdad contra los mínimos de WCAG 2.2.

Los tests de componentes cubren la semántica de las primitivas —que un botón siga siendo un `<button>`, que un error siga asociado a su campo, que un estado no dependa del color— y nunca cadenas de clases. Un test que se rompe porque cambió un `px-4` estaba mirando el lugar equivocado.

## Visual regression y playtesting humano

La regresión visual es recomendable cuando existan componentes de challenges, especialmente gráficos y layouts móviles. No se agrega una herramienta antes de tener una superficie visual estable que lo justifique.

La automatización no valida diversión ni claridad. Cada batch relevante debe probarse con usuarios reales del rango objetivo cuando sea posible, registrando dónde preguntan qué hacer, releen, adivinan, comentan consecuencias o quieren repetir.

## Simulación de competencia

**Implementada en forma reducida de ingeniería; la auditoría completa sigue futura.** `pnpm game:score` usa perfiles sintéticos con estrategia sobre 23.000 planes y `pnpm game:score -- --compare` mide las mismas runs bajo calibraciones candidatas. Verifica propiedades del mecanismo —techo perfecto, oportunidades ausentes, dominancia matemática, determinismo y rangos—, no la equidad de una competencia congelada.

La auditoría actual incluye juego perfecto, matemática fuerte con secundarias mínimas, matemática floja con secundarias perfectas, peor caso y un perfil mixto. El score no consume velocidad y el catálogo de producción no ofrece todavía una señal competitiva independiente de Aura; inventar esos perfiles como si fueran cobertura actual ocultaría ambas decisiones abiertas.

La pregunta que la simulación tiene que contestar: **¿el ranking ordena por lo que dijimos que iba a ordenar?** Si un perfil orientado a Aura le gana a uno de alta precisión matemática, la ponderación está mal, no el jugador.

La **alcanzabilidad del egreso** ya está establecida: 20.000 carreras de seis años egresan sin hallazgos, con un peor caso de un repaso por año, y la enumeración exhaustiva del espacio de progresión lo confirma sin depender del muestreo. Antes de la feria, sobre contenido y política aprobados, la auditoría completa debe mirar distribución de score, resultados inalcanzables, estrategias dominantes, empates, repetición de variantes, distribución de dificultad y extremos de estado de carrera. También debe incorporar intentos, personal best, señal temporal si se aprueba y comportamiento del fair mode real.

La simulación captura lógica y equidad. **No captura diversión**, y un resultado sintético favorable no es validación con usuarios. Ver [ciclo de entrega real](../00-product/real-delivery-lifecycle.md).

## Matriz de QA manual

La automatización no reemplaza abrir la aplicación en un teléfono. Antes de una revisión docente o de una feria, se recorre a mano:

**Viewports:** 360, 390 y 430 px; tablet en vertical; desktop centrado contra la hoja.

**Estados de juego:** tira de carrera vacía; primera aparición de Promedio; primera aparición de Equipo; Aura positiva y negativa; Estilo compacto y expandido; los cuatro resultados; opción elegida y todavía sin confirmar; hito de año; **camino de recuperación** —un año que sale mal, pide un repaso y cierra igual—; y —cuando existan— envío pendiente, personal best verificado y run completada que no supera la mejor.

**Condiciones adversas:** refresh en medio de la run; sin red antes y después de terminar; doble click en confirmar; respuesta lenta del leaderboard; nickname inválido o bloqueado; movimiento reducido; sólo teclado; zoom del navegador al 200 %.

## Variantes desplegadas

Los invariantes que una variante competitiva debe cumplir y la auditoría estadística del catálogo están en [validación y auditoría de variantes](variant-validation-and-audit.md). Las preguntas de equidad del ranking, en [auditoría de equidad competitiva](competition-fairness-audit.md).
