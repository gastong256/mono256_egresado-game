# Auditoría de score post-Teacher-Gate-1

**Fecha:** 2026-09-02

**Política principal:** `fair-score-dev-2@2.0.0-post-tg1-candidate`, `official: false`

**Comando:** `pnpm game:score -- --runs=20000 --compare`

Esta es evidencia determinista de invariantes del mecanismo, no prueba psicométrica ni evidencia de equidad entre estudiantes.

## Población

Se auditaron 23.000 planes: 20.000 `RunPlan` reales compuestos de 7.º, 1.000 de un beat, 1.000 carreras de desarrollo de ocho beats y 1.000 carreras sintéticas de doce beats/seis etapas. Todos los inputs compusieron y validaron.

## Resultado dev-2

| Invariante | Resultado |
|---|---|
| Score perfecto | min/mean/max 10.000; spread 0 |
| Un beat | máximo 10.000; spread 0 |
| Dos beats | máximo 10.000; spread 0 |
| Ocho/doce beats | máximo 10.000; spread 0 |
| Con/sin oportunidad de Equipo | máximo 10.000; penalidad 0 |
| Con/sin oportunidad de Aura | máximo 10.000; penalidad 0 |
| Matemática fuerte/secundarias bajas | 7.800–9.000 |
| Matemática débil/secundarias perfectas | 2.000–3.200 |
| Perfil medio | 5.000; spread 0 |
| Piso | 0; spread 0 |
| Empates introducidos por redondeo en la barrida | 0 |
| Hallazgos hard | 0 |

La validación ejecutable exige `math > team + aura`: 8.500 > 1.500. Equipo y Aura suman como máximo nominal 15 % cuando las tres componentes están activas. Sólo Matemática recibe el factor de dificultad y la normalización conserva el máximo.

## Comparación determinista

Con evidencia sintética idéntica en ambas policies; columnas finales son contribuciones Matemática/Equipo/Aura:

| Caso | Policy | FairScore | M | E | A |
|---|---|---:|---:|---:|---:|
| Math-only | dev-1 / dev-2 | 7.500 / 7.500 | 7.500 / 7.500 | 0 / 0 | 0 / 0 |
| Math + Team | dev-1 / dev-2 | 7.105 / 7.237 | 6.316 / 6.711 | 789 / 526 | 0 / 0 |
| Math + Team + Aura | dev-1 / dev-2 | 6.875 / 7.000 | 6.000 / 6.375 | 750 / 500 | 125 / 125 |
| Math fuerte / secundarias bajas | dev-1 / dev-2 | 7.400 / 7.800 | 7.200 / 7.650 | 150 / 100 | 50 / 50 |
| Math débil / secundarias altas | dev-1 / dev-2 | 5.200 / 4.900 | 3.200 / 3.400 | 1.500 / 1.000 | 500 / 500 |

El efecto esperado se observa: `dev-2` aumenta el énfasis matemático y reduce Equipo; no se afirma que sea empíricamente superior.

## Replay, manipulación y compatibilidad

Los 117 tests focalizados pasaron. Incluyen dos submissions competitivas reproducidas por servidor (`comp-a` canónica y `comp-b` manipulada), con **0 mismatches** entre score autoritativo y recomputación; el score/breakdown aportado por cliente se ignora o contradice campo por campo. `scoreVersion` sobrevive action log y snapshot. Una misma run mantiene historial y carrera idénticos bajo `dev-1`/`dev-2`; sólo cambia el desglose competitivo. Una versión desconocida se rechaza.

Los goldens históricos de `dev-1` permanecen: 7.651, 3.645, 10.000 y 7.484. Para los mismos cuatro fixtures, `dev-2` da 8.005, 3.247, 10.000 y 7.484.

Estilo y Promedio no son inputs de `scoreRun`; sus deltas directos son 0. Los tests de cobertura fijan además que May-25 usa su F1 sólo para Matemática.

## Advertencias

- Ninguna plantilla de producción ofrece hoy evidencia Aura competitiva independiente; la normalización la deja inactiva.
- Los factores 1,00/1,08/1,15 siguen candidatos.
- La política final, el desempate, el inventario y la configuración de evento siguen abiertos.
- La barrida prueba invariantes de ingeniería, no equidad observada con estudiantes.
