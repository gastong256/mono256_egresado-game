# Integración de producto post-Teacher-Gate 1

**Estado:** integración canónica del Gate del 1 de septiembre de 2026.
**Resultado:** `PASSED_WITH_REQUIRED_ADJUSTMENTS`.

Este documento hace explícita la cadena de trazabilidad:

```text
respuesta docente raw
        ↓
interpretación de producto
        ↓
decisión canónica y madurez
        ↓
implementación actual o requisito de etapa futura
```

La [planilla completada](11-evidencia-docente-2026-09-01.md) conserva lo que
dijo el docente. Este documento registra lo que el producto decide hacer con
esa evidencia.

## Decisiones promovidas

| Decisión | Fuente | Decisión canónica | Madurez | Destino |
|---|---|---|---|---|
| D-TG1-01 | TG1-01 | Toda etapa conserva un piso de prerrequisitos matemáticos comprensible desde aproximadamente 7.º; el año expresa carrera y contexto, no una barrera curricular creciente | PRODUCT DIRECTION · TG1 ACCEPTED | Marco matemático, dificultad, autoría y STAGE-08 |
| D-TG1-02 | TG1-03 | `AcademicStage ≠ DifficultyBand`; cada etapa puede contener CORE, STANDARD y STRETCH, cuya complejidad sigue siendo estructural | PRODUCT DIRECTION · TG1 ACCEPTED | Dificultad y composición |
| D-TG1-03 | TG1-04 | Ponderación post-TG1 candidata 85 % Math / 10 % Team / 5 % Aura | IMPLEMENTED CANDIDATE · TEACHER-INFORMED · `official: false` | `fair-score-dev-2` |
| D-TG1-04 | TG1-05/TG1-06 | Una escena puede alimentar varios ejes sólo cuando cada eje mide una propiedad semánticamente distinta | PRODUCT DIRECTION · TG1 ACCEPTED | Autoría STAGE-08 |
| D-TG1-05 | TG1-07 | Las componentes competitivas sin oportunidad salen del cálculo y los pesos activos se renormalizan | PRODUCT DIRECTION · TG1 ACCEPTED · IMPLEMENTED | ADR-023 y scorer |
| D-TG1-06 | TG1-08 | Una situación estructuralmente más exigente puede recibir una recompensa competitiva pequeña, separada del costo de scheduling | PRODUCT DIRECTION · TG1 ACCEPTED; factores RECOMENDADOS | Score/dificultad |
| D-TG1-07 | TG1-09 | El mapeo discreto `optimal/efficient/functional/invalid = 100/75/40/10` queda aceptado para plantillas que no tienen métrica continua más honesta | TG1 ACCEPTED CANDIDATE | ScorePolicy |
| D-TG1-08 | TG1-10 | Los intentos competitivos son lógicamente ilimitados y el ranking conserva el mejor resultado verificado | PRODUCT DIRECTION · TG1 ACCEPTED · NOT IMPLEMENTED | STAGE-09 |
| D-TG1-09 | TG1-12 | Una carrera completa apunta a aproximadamente 8–10 minutos | PRODUCT TARGET · TG1 ACCEPTED | Calibración STAGE-08; no es score ni timeout |
| D-TG1-10 | TG1-14 | Toda run válida completada converge a `GRADUATED` | PRODUCT DIRECTION · TG1 ACCEPTED · NOT IMPLEMENTED | STAGE-07 |

TG1-02 acepta las situaciones y consignas revisadas. TG1-13 mantiene el acto del
25 de Mayo por su valor pedagógico y exige enriquecer/diversificar su narrativa
en producción futura.

## Accesibilidad universal: piso bajo, techo alto

La secuencia `7.º → 1.º → 2.º → 3.º → 4.º → 5.º` sigue siendo una carrera
escolar real. Cambian responsabilidades, situaciones, consecuencias, densidad
social, información a filtrar, planificación y combinaciones de restricciones.
No se transforma en una escalera donde cada año exige fórmulas curriculares que
impidan jugar a alguien capaz de comprender matemática de 7.º.

La regla es **piso de prerrequisitos bajo, no techo cognitivo bajo**. CORE,
STANDARD y STRETCH permanecen en cada año. La dificultad puede crecer por
estructura y estrategia sin crecer por conocimiento curricular inaccesible.

## Multi-evaluación e independencia de evidencia

Una escena puede producir Math, Team y Aura al mismo tiempo si responde tres
preguntas diferentes:

1. ¿Qué propiedad matemática se midió?
2. ¿Qué propiedad de colaboración se midió, si existe?
3. ¿Qué propiedad social/pública se midió, si existe?

**Una misma escena puede evaluar más de una dimensión, pero no puede otorgar
crédito competitivo dos veces por la misma evidencia.**

- Válido: factibilidad matemática del reparto + calidad independiente de la
  distribución de responsabilidades.
- Inválido: copiar el mismo F1 del acto a Math y Aura.

Si falta evidencia independiente, la componente declara `none`. No se obliga a
que toda plantilla ofrezca Team o Aura, y la normalización aceptada por TG1-07
evita penalizar al jugador por esa ausencia.

### Interpretación del acto y el colectivo

El docente propuso que el acto del 25 de Mayo pudiera sumar Aura según el
porcentaje correcto. Producto acepta la intención —una escena con varias
consecuencias— pero no adopta el mecanismo literal: ese porcentaje/F1 ya es
`MathPerformance`. Para aportar Aura, una futura versión de la escena necesita
otra decisión o medida, por ejemplo liderazgo, coordinación o reacción social.

La idea del colectivo se conserva como **ejemplo de autoría futura**, no regla
del template actual: varias horas matemáticamente válidas podrían tener
consecuencias sociales diferentes —llegar exageradamente temprano, con margen
adecuado o tarde para enterarse de las novedades— si un diseño posterior define
una señal social independiente.

## Intentos, seeds y personal best

“Ilimitados” no significa que el participante elige un seed fácil. La
infraestructura futura emite autoritativamente cada `RunPlan`/seed. El
participante puede pedir otra run válida, y el ranking conserva su mejor
`FairScore` verificado bajo la política activa. Persistencia, identidad y
emisión pertenecen a STAGE-09.

## Empates e Hitos

TG1-11 pidió `AJUSTAR` y propuso Hitos aleatorios con puntos para reducir
empates. La integración separa dos problemas:

- **Hitos:** oportunidad futura de reconocimiento narrativo/carrera —por
  ejemplo Abanderado o Primer escolta—, preferentemente derivada de condiciones
  deterministas o de un seed con efecto competitivo equiparado.
- **Empate de ranking:** permanece `OPEN`; dos FairScores iguales pueden empatar
  legítimamente.

No se adopta `RNG → puntos competitivos → desempate`. Un hito aleatorio no puede
otorgar ventaja arbitraria. STAGE-09 y Teacher Gate 2 deben cerrar una política
determinista y anunciada.

## Alcance de esta integración

Se publica `fair-score-dev-2` y se actualizan autoridad, tests y auditorías. No
se cambia contenido actual, perfiles de score de templates, composición,
progresión, catálogo ni gameplay. En particular, el F1 del acto y el margen del
colectivo no alimentan Aura en esta integración.
