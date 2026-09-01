# Estrategia de testing

## Gates ejecutables de la base técnica

La suite actual demuestra la infraestructura, no el comportamiento futuro del juego:

- `tests/unit/`: schemas de entorno y frontera pura inicial de `game`.
- `tests/component/`: render y semántica del shell de la base.
- `tests/integration/`: contrato de liveness de `/api/health` sin depender de una DB.
- `tests/property/`: combinaciones generadas de configuración pública/server-only.
- `tests/e2e/`: smoke del shell y health en Chromium desktop y viewport Pixel 7, incluida ausencia de errores de consola.

Vitest mide los archivos enumerados en `vitest.config.ts`, que incluyen todo `src/game`, con thresholds de 85 % para statements, lines y functions, y 75 % para branches. El porcentaje no es el objetivo: la prioridad de cobertura es transiciones, replay, generadores, evaluadores, matemática, scoring, selección de storylets y serialización.

El motor suma tres capas que no son unit tests convencionales:

- **property tests** (`tests/property/`): determinismo por seed, equivalencia entre run y replay, round-trip de serialización, rangos del RNG, selección ponderada que nunca elige peso cero, stats acotadas, score finito y no negativo, instancias generadas que cumplen sus invariantes, y estabilidad de evaluación;
- **golden replays** (`tests/unit/engine-golden.test.ts`): fijan la salida determinista exacta de seeds conocidas. Detectan un cambio accidental de protocolo; regenerarlos exige el bump de versión correspondiente;
- **simulación masiva** (`pnpm game:simulate`): miles de runs deterministas que buscan callejones sin salida, scores inválidos, divergencia de replay y deriva de snapshot. `pnpm verify` corre 200 runs; la simulación profunda queda local.

## Verificación local

`pnpm verify` es el gate integrado y exige la versión exacta de Node.js fijada en `.node-version` (`24.19.0` en esta baseline). Ejecuta en orden:

1. coherencia de Node/pnpm entre metadata, proceso y Docker;
2. validación del workspace agentic;
3. sincronización del master documental;
4. formato;
5. lint, incluidas fronteras de arquitectura;
6. TypeScript general y core sin DOM/Node;
7. unit, component, integration y property tests con cobertura;
8. validación de contenido (`pnpm game:validate-content`);
9. simulación determinista de 200 runs con verificación de replay y snapshot;
10. build de producción;
11. smoke E2E sobre el build, incluido el harness del motor.

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

`pnpm release:check` es un gate adicional de seguridad: falla deliberadamente con Next.js `16.3.1` y debe pasar con `>=16.3.2` antes de publicar. No forma parte de `pnpm verify` porque hoy representa un bloqueo explícito, no una prueba verde de la base local.

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

Antes de la feria, sobre contenido y política aprobados, la auditoría completa debe mirar distribución de score, resultados inalcanzables, estrategias dominantes, empates, repetición de variantes, distribución de dificultad, extremos de estado de carrera y alcanzabilidad del egreso. También debe incorporar intentos, personal best, señal temporal si se aprueba y comportamiento del fair mode real.

La simulación captura lógica y equidad. **No captura diversión**, y un resultado sintético favorable no es validación con usuarios. Ver [ciclo de entrega real](../00-product/real-delivery-lifecycle.md).

## Matriz de QA manual

La automatización no reemplaza abrir la aplicación en un teléfono. Antes de una revisión docente o de una feria, se recorre a mano:

**Viewports:** 360, 390 y 430 px; tablet en vertical; desktop centrado contra la hoja.

**Estados de juego:** tira de carrera vacía; primera aparición de Promedio; primera aparición de Equipo; Aura positiva y negativa; Estilo compacto y expandido; los cuatro resultados; opción elegida y todavía sin confirmar; hito de año; y —cuando existan— camino de recuperación, envío pendiente, personal best verificado y run completada que no supera la mejor.

**Condiciones adversas:** refresh en medio de la run; sin red antes y después de terminar; doble click en confirmar; respuesta lenta del leaderboard; nickname inválido o bloqueado; movimiento reducido; sólo teclado; zoom del navegador al 200 %.

## Variantes desplegadas

Los invariantes que una variante competitiva debe cumplir y la auditoría estadística del catálogo están en [validación y auditoría de variantes](variant-validation-and-audit.md). Las preguntas de equidad del ranking, en [auditoría de equidad competitiva](competition-fairness-audit.md).
