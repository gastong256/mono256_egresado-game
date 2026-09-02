# Acta del Teacher Gate 1

**Gate ejecutado. Resultado formal: `PASSED_WITH_REQUIRED_ADJUSTMENTS` — APROBADO CON AJUSTES REQUERIDOS.**

Esta acta separa la [evidencia docente raw](11-evidencia-docente-2026-09-01.md)
de la [interpretación de producto post-Gate](12-integracion-post-gate.md). Un
comentario docente no se reescribe como si fuera una decisión técnica.

## Sesión

| Dato | Registro |
|---|---|
| Fecha | 1 de septiembre de 2026 |
| Duración real | No consignada en la evidencia recibida |
| Facilitador | Dev |
| Participantes | Docente |
| Modalidad | No consignada en la evidencia recibida |

No se inventan nombres, institución, duración ni modalidad que la planilla no
registró.

## Versiones revisadas

La planilla raw no consignó la tupla técnica mostrada. El único pack versionado
del repositorio para esa sesión es `tg1-pack-1`, agregado por el commit
`8fea512`, y sus casos se reproducen hoy con el siguiente contexto. Esto queda
registrado como **contexto reproducible del material**, no como una afirmación
retroactiva de que la planilla anotó esos valores.

| Dato | Contexto reproducible |
|---|---|
| Commit del pack | `8fea512` |
| Versión del pack | `tg1-pack-1` |
| Motor | `5.1.0` |
| Contenido | `0.8.0-grade-7` |
| Reglas | `0.3.0-grade-7` |
| Catálogo de situaciones | `grade-7-dev-4` |
| Política de dificultad | `candidate@1.0.0-candidate`, `official: false` |
| Política de composición | `grade-7-composed@1.0.0-candidate`, `official: false` |
| Política de puntaje revisada | `fair-score-dev-1@1.0.0-candidate`, `official: false` |

`pnpm teacher-gate --validate` reproduce TG1-A…TG1-D contra ese contexto. La
nueva `fair-score-dev-2` se publica **después** del Gate; no se atribuye a lo que
estaba ejecutándose durante la sesión.

## Casos revisados

La planilla registró decisiones contra los cuatro casos. No consignó duración
por caso, dispositivo ni observaciones de la hoja del facilitador.

| Caso | Evidencia de revisión | Registro disponible |
|---|---|---|
| TG1-A · colectivo, elegir | Sí | TG1-01/TG1-02 |
| TG1-B · colectivo, construir | Sí | TG1-01/TG1-03 |
| TG1-C · acto del 25 | Sí | TG1-06/TG1-13 |
| TG1-D · trabajo grupal | Sí | TG1-05 |

## Decisiones docentes

La columna “Respuesta docente” transcribe la palabra marcada. “Integración” es
la decisión de producto posterior y enlaza su desarrollo completo.

| ID | Respuesta docente | Comentario o cambio pedido | ¿Bloqueaba? | Integración post-Gate |
|---|---|---|---|---|
| TG1-01 | **AJUSTAR** | La matemática mostrada es apropiada; todo el juego debe seguir siendo universalmente jugable desde 7.º y la dificultad no debe subir por año/edad | Sí | Regla universal y `AcademicStage ≠ DifficultyBand`, integrada |
| TG1-02 | **ACEPTAR** | Sin comentario adicional | Sí | Situaciones y consignas mostradas aceptadas |
| TG1-03 | **ACEPTAR** | Sin reclasificaciones pedidas | Sí | CORE/STANDARD/STRETCH aceptado como dificultad estructural |
| TG1-04 | **ACEPTAR** | Preferencia B: 85/10/5 | Sí | `fair-score-dev-2`, no oficial |
| TG1-05 | **ACEPTAR** | Incorporar decisiones sociales; “hacerlo todo yo” puede resolver matemática y ser socialmente pobre | Sí | Equipo legítimo con evidencia independiente; contenido futuro |
| TG1-06 | **ACEPTAR** | Permitir escenas multievaluadas; se propusieron el acto y márgenes del colectivo | Sí | Se acepta la intención multi-eje; se rechaza duplicar el mismo F1 como Math y Aura |
| TG1-07 | **ACEPTAR** | Sin alternativa pedida | Sí | Normalización de pesos activos aceptada |
| TG1-08 | **ACEPTAR** | Sin comentario adicional | No | Recompensa pequeña por dificultad aceptada en principio; factores exactos siguen candidatos |
| TG1-09 | **ACEPTAR** | Sin valores alternativos | No | 100/75/40/10 aceptado para resultados discretos |
| TG1-10 | **ACEPTAR** | Intentos ilimitados con mejor intento | No | Requisito futuro: mejor resultado verificado y emisión autoritativa |
| TG1-11 | **AJUSTAR** | Hitos aleatorios con reconocimiento/puntos para reducir empates y buscar un Tier | No | Se separan Hitos narrativos de desempate; no se adopta bonus competitivo aleatorio; desempate queda OPEN |
| TG1-12 | **ACEPTAR** | 8–10 minutos | No | Target UX de run completa, no timeout ni señal de score |
| TG1-13 | **ACEPTAR** | Pedagogía OK; narrativa a enriquecer con alternativas como deportes y competencias | Sí | KEEP pedagógico + ENRICH narrativo en STAGE-08 |
| TG1-14 | **ACEPTAR** | Sin vocabulario preferido | No | Egreso garantizado aceptado; vocabulario de recuperación queda OPEN para STAGE-07 |

## Ajustes requeridos

### Integrados antes de declarar STAGE-07 READY

| # | Ajuste | Origen | Resultado |
|---|---|---|---|
| 1 | Accesibilidad matemática universal y separación año/dificultad | TG1-01 | Regla canónica de producto, matemática y autoría |
| 2 | Nueva ponderación competitiva 85/10/5 | TG1-04 | `fair-score-dev-2`, `official: false`, con auditoría profunda |
| 3 | Multi-evaluación sin doble conteo | TG1-05/TG1-06 | Guardarraíl canónico y checklist de autoría |
| 4 | Normalización, recompensa y calidad con madurez docente | TG1-07/TG1-08/TG1-09 | Documentación y tests reconciliados |
| 5 | Intentos, duración y egreso como requisitos futuros | TG1-10/TG1-12/TG1-14 | Handoffs STAGE-09, STAGE-08 y STAGE-07 |
| 6 | Separar Hitos de desempate competitivo | TG1-11 | Hitos futuros; política de empate OPEN y sin RNG competitivo |
| 7 | Mantener el acto y enriquecer su narrativa | TG1-13 | KEEP + ENRICH asignado a STAGE-08 |

### Asignados a etapas futuras

| Trabajo | Etapa propietaria |
|---|---|
| Implementar egreso, fail-forward y recuperaciones deterministas | STAGE-07 |
| Producir evidencia independiente de Equipo/Aura y enriquecer narrativas | STAGE-08 |
| Explorar deportes/competencias e Hitos narrativos | STAGE-08, con revisión de producto |
| Emitir intentos autoritativos, guardar personal best y operar ranking | STAGE-09 |
| Cerrar desempate, configuración final y política oficial | STAGE-09 / Teacher Gate 2 / FREEZE |

Asignar trabajo a una etapa no significa que el runtime ya lo implemente.

## Diferidos y abiertos

Ningún ítem fue marcado `DIFERIR` por el docente. La integración conserva
abiertas las partes para las que la respuesta no definió una semántica completa:

- política final y determinista de empate;
- diseño exacto de Hitos;
- calibración exacta de los factores de recompensa por dificultad;
- vocabulario de recuperación;
- oficialización final de la ScorePolicy;
- inventario final de contenido y configuración final de competencia.

## Desacuerdos

La planilla no consignó desacuerdos. TG1-11 fue `AJUSTAR`, no consenso sobre un
algoritmo de desempate.

## Resultado del Gate

- ☐ **APROBADO** — sin ajustes bloqueantes.
- ☒ **APROBADO CON AJUSTES REQUERIDOS** — equivalente canónico:
  `PASSED_WITH_REQUIRED_ADJUSTMENTS`.
- ☐ **NO APROBADO / REQUIERE REVISIÓN**.

El fundamento pedagógico/producto permite continuar: los ajustes bloqueantes
quedaron integrados como decisiones canónicas o requisitos con etapa
propietaria. Esto no constituye playtest con estudiantes ni prueba
psicométrica de que 85/10/5 sea una calibración final.

**Firma del facilitador:** no consignada en la evidencia recibida.
