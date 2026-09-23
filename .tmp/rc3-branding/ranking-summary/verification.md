# RC3 — Resumen persistido y ranking acotado

Fecha: 2026-09-23. Rama local: `feat/ranking-run-summary`.

## Alcance

- Resumen v1 calculado sobre el estado ya validado, persistido en el JSONB existente.
- Ventana de hasta 12 filas; grupos empatados conservan puesto y membresía completa.
- Prioridad al representante de la sesión; contexto alrededor y huecos explícitos.
- Puntaje principal, métricas establecidas, dos reconocimientos y detalle nativo.
- Cierre y ranking comparten derivaciones puras; ningún cambio en `src/game`,
  `src/content`, `src/release`, migraciones o lockfile.
- ADR-031 y fuentes funcionales, operativas y de arquitectura actualizadas.

## Comprobaciones dirigidas

- `pnpm install --frozen-lockfile`, `pnpm toolchain:check`: PASS.
- TypeScript, lint de fronteras, formato, tokens y contraste: PASS.
- Primera selección: 124 tests PASS, incluyendo puerto en memoria/Postgres.
- Selección posterior: 30 tests PASS; últimas pruebas de resumen: 5 PASS.
- Prueba de privacidad actualizada: 16 PASS.
- Empate de 500 personas, selección de contexto, ausencia de duplicados y
  propiedades sobre 100 distribuciones arbitrarias de hasta 400 personas: PASS.
- Equivalencia de hitos con el cierre, mejor partida sin mezcla, invalidación y
  moderación, backfill idempotente y rechazo de score incompatible: PASS.
- Navegador real: 320/390/768/1280 px sin overflow; axe sin infracciones en ranking
  cerrado/expandido; apertura con Enter; sesión propia en puesto 21 con empate.
- Escala: 500 participantes / 1500 intentos; consulta mediana 115 ms, peor 161 ms
  durante suite completa. Es una medición local bajo carga, no un SLA remoto.
- Respuesta pública de la demo de 12 filas: 32.139 bytes sin comprimir.

## Datos locales

- Edición aislada `ranking-demo-local`: 36 participantes ficticios y 18 puntajes.
- Seed `ranking-demo-4`: permite observar Promedio, Equipo y Aura reales del juego.
- Segunda ejecución del seed: 0 inserciones, conserva 36 participantes / 18 scores.
- La suite E2E agregó sus partidas de prueba: al cierre hay 41 participantes
  con resultado y siete empatados en el primer puesto. Esas filas se conservaron.
- Edición anterior conservada. Backfill aplicado allí: 146 elegibles, 146
  actualizados, 0 omitidos. Repetir sobre resúmenes completos realiza 0 escrituras.
- `.env.local` activa la nueva demo; no se versiona. Servidor en localhost:3000.
- Respaldo previo de esquema/datos fuera de Git: `/tmp/egresado-ranking-backup-20260923`.

## Base de datos y límites de entorno

- `pnpm db:lint`: PASS, sin errores de schema.
- `pnpm db:types`: PASS, sin diferencias en los tipos generados.
- `pnpm db:reset`: BLOQUEADO antes de mutar. El guard detectó el stack Docker
  preexistente publicado en 0.0.0.0/:: para 54321 y 54322. No se desactivó el
  control ni se ejecutó reset por otra vía. No hay migración SQL en esta tarea.
- Sólo se usó Supabase local. El wrapper de comandos precarga las URLs y
  credenciales de `.env.local` en el proceso, con prioridad sobre los archivos
  de entorno que carga Next, y exige hostname loopback.
- No se detuvo Supabase al cerrar porque el proyecto debe seguir disponible para
  las pruebas del usuario.

## Gate final

La primera ejecución de `pnpm verify` encontró una expectativa antigua del aviso
que decía «únicamente tu alias»: 2532 tests PASS y ese test falló. Se actualizó
para comprobar la divulgación del resumen y la distinción de notas escolares;
su suite dirigida pasó.

La segunda ejecución completó todos los pasos, con estos resultados:

- Toolchain, workspace, master, secretos, dependencias de release, formato,
  lint/fronteras, TypeScript y sistema de diseño: PASS.
- 139 archivos / 2535 tests de unidad, componentes, integración y propiedades:
  PASS. Cobertura: statements 86,92 %, branches 79,93 %, functions 89,36 %,
  lines 87,15 %; todos los umbrales satisfechos.
- Validaciones de contenido, catálogos y simulaciones deterministas: PASS.
- `pnpm release:verify`: 57 comprobaciones PASS; freeze sin modificaciones.
- `pnpm build`: PASS.
- Playwright: 265 PASS / 1 FAIL. La auditoría previa de controles de primero a
  1280 px y zoom 2 midió 23 px en lugar de 44 tras normalizar por zoom.
- Se repitió únicamente el caso fallido, sin modificar aplicación ni prueba:
  `pnpm test:e2e:only tests/e2e/post-g1-accessibility-audit.spec.ts --project=chromium-desktop --grep='1280 zoom 2' --workers=1`:
  1 PASS (11,4 s). El fallo no se reprodujo en aislamiento; su causa precisa
  queda sin confirmar. No se volvió a ejecutar todo `verify`.
- `pnpm security:audit`: PASS, sin vulnerabilidades conocidas.

Veredicto funcional: implementado y cubierto por pruebas dirigidas. Veredicto
del gate transversal: **PARTIAL**; `verify` terminó con código 1 por la prueba
de navegador anterior y `db:reset` quedó bloqueado por el entorno. El reintento
dirigido exitoso no se presenta como una ejecución completa verde.

## Consulta sobre el salto del primero al tercero

Antes de la suite E2E, la API y la base local mostraban dos mejores partidas
empatadas con 10.000 puntos.
La regla vigente asigna puestos 1, 1, 3 (ranking de competición), no 1, 1, 2.
Al compactar el empate en «Compartido con 1 más» se ven las filas 1 y 3.
No es un bug y no se modificó el comparador sellado. Tras la suite E2E hay siete
primeros compartidos; la API muestra correctamente el siguiente puesto como 8.

## Evidencia visual

- [Fila propia](own-run.png)
- [320 px](ranking-320.png)
- [390 px](ranking-390.png)
- [768 px](ranking-768.png)
- [1280 px](ranking-1280.png)

## Operación posterior

Para otro entorno: ejecutar primero `pnpm competition:summaries` para diagnosticar
compatibilidad, luego `pnpm competition:summaries -- --write` para guardar los
resúmenes una vez. La consulta pública nunca hace esa reconstrucción.
Para recrear la demo local: `pnpm competition:seed:local`; activar el slug indicado
en la configuración local. El comando sólo admite destinos loopback.
