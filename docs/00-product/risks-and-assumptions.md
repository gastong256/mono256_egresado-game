# Riesgos y supuestos

## Supuestos de producto

- El público principal tiene 12–17 años.
- La feria prioriza partidas breves y acceso por QR.
- El juego se usa principalmente en español.
- No se necesita identidad real para participar.
- El volumen de una feria escolar entra cómodamente en arquitectura serverless + Postgres gestionado.

## Riesgos principales

| Riesgo | Impacto | Probabilidad | Mitigación |
|---|---:|---:|---|
| Se percibe como examen | Alto | Medio | walkthroughs/proxy y gate docente; matemática intrínseca; riesgo residual sin playtest previo |
| Dificultad desigual 12–17 | Alto | Alto | piso accesible y dificultad estructural; Fair fija dificultad común |
| Contenido ambiguo | Alto | Medio | math review + invariants + golden seeds |
| Wi-Fi insuficiente | Alto | Alto | gameplay local-first; pending sync; fallback |
| Ranking manipulable | Medio/Alto | Medio | scoring server-side; rate limits; auditoría |
| Nicknames ofensivos | Alto en feria | Medio | filtro + moderación inmediata |
| Scope creep | Alto | Alto | roadmap por gates; no minijuegos especiales antes de validar core |
| Demasiados componentes únicos | Medio | Medio | content-as-data + interaction types |
| RNG genera injusticia | Alto | Medio | separar calidad ex ante de outcome; seeds/event rules |
| Service worker cachea versión vieja | Medio | Medio | diferir PWA offline avanzada; versionar assets/rules |

## Riesgos pedagógicos

- confundir velocidad con capacidad matemática;
- premiar sólo una estrategia cuando existen múltiples válidas;
- usar contextos no cercanos o sesgados;
- convertir errores en señal negativa personal;
- usar estadísticas de estudiantes fuera de contexto.

## Riesgos técnicos

- drift entre engine cliente y servidor;
- cambios de RNG rompen replay;
- migraciones incompatibles durante evento;
- payloads de actions demasiado grandes;
- dependencia innecesaria de realtime.

## Mitigación transversal

La principal defensa es mantener el sistema pequeño, determinista, versionado y testeable. Cada aumento de complejidad debe responder a evidencia de uso.

## Riesgos incorporados desde el blueprint v0.2

Riesgos que aparecen cuando el juego pasa a ser una competencia con premios y cuando se acepta que la primera exposición real es la feria.

| Riesgo | Impacto | Mitigación |
|---|---:|---|
| La primera prueba con estudiantes ocurre durante la feria | Alto | gate docente como proxy, UX conservadora, simulación, telemetría, hardening; el riesgo residual se **declara**, no se disimula |
| Una variante procedural sale ambigua o imposible | Alto | catálogo de variantes prevalidado y desplegado, invariantes ejecutables |
| Los intentos ilimitados favorecen a quien tiene más tiempo libre | Medio | personal best verificado en vez de suma; intentos ilimitados v1 |
| El jugador reintenta hasta recibir una run fácil | Medio | Competition Seed compartida emitida por servidor, variantes/dificultad/rareza fijas por edición |
| El score de ranking se puede falsificar | Alto | el servidor reproduce y calcula; nunca se confía el score final del navegador |
| El score premia la velocidad por encima del razonamiento | Alto | FairScore → Prestige → shared rank; tiempo sólo diagnóstico |
| El desempeño académico se cuenta dos veces | Medio | `MathPerformance` separado del Promedio visible |
| Estilo se convierte en un objetivo de optimización | Medio | Estilo no aporta FairScore, Prestige ni oportunidades competitivas |
| Matemática trivial para adultos y difícil para 12 años | Alto | piso bajo y techo alto; complejidad por restricciones y optimización |
| El diseño visual vuelve a parecerse a los juegos de referencia | Medio | sistema de diseño v0.2 aprobado y sus gates de tokens y contraste |
| Se cambia una regla en medio de la feria | Alto | congelamiento de versiones, control de cambios y capacidad de replay/regrade |

Los detalles de cada mitigación están en [validación y auditoría de variantes](../04-quality/variant-validation-and-audit.md), [auditoría de equidad competitiva](../04-quality/competition-fairness-audit.md) y [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).

## Supuesto que cambió

El supuesto de que habría playtest con estudiantes antes de la primera release pública **ya no se sostiene**. Ver [ciclo de entrega real](real-delivery-lifecycle.md). Todo criterio de aceptación que dependa de jugadores reales antes de la feria es, hasta nuevo aviso, una intención.
