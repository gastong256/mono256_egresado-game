# Pack del Teacher Gate 1

Todo lo necesario para dar la reunión de revisión con el Departamento de Matemática. **Este pack prepara el gate; no lo da por aprobado.**

- **Duración de la sesión central:** 15 minutos.
- **Qué se decide:** nivel matemático, situaciones, niveles de dificultad y filosofía del puntaje de competencia.
- **Qué NO se decide:** tipografías, colores, espaciados ni nada del sistema de diseño. Eso ya está cerrado.
- **Estado del gate:** pendiente. Nadie lo revisó todavía.

El contrato canónico de qué se pide decidir está en [gates docentes](../teacher-gates.md) y en el [roadmap](../implementation-sequence.md). Este pack lo operacionaliza.

## Antes de convocar a nadie

```bash
pnpm dev                          # levanta la aplicación
pnpm teacher-gate --validate      # confirma que los casos reproducen
pnpm teacher-gate --prepare       # imprime el plan de la sesión
```

Si `--validate` falla, **no des la reunión**: significa que el contenido cambió y los casos ya no muestran lo que este pack promete. Buscá seeds nuevos y actualizá el manifiesto antes de convocar.

## Qué abrir el día de la reunión

| Para | Documento |
|---|---|
| Conducir minuto a minuto | [01-guion.md](01-guion.md) |
| No olvidarse de nada | [02-checklist-facilitador.md](02-checklist-facilitador.md) |
| Saber qué mostrar en cada caso | [03-casos.md](03-casos.md) |
| Conversar sobre niveles | [04-dificultad.md](04-dificultad.md) |
| Conversar sobre puntaje | [05-puntaje.md](05-puntaje.md) |
| Preguntar lo que hay que preguntar | [06-preguntas.md](06-preguntas.md) |
| Registrar lo que se decidió | [07-planilla-decisiones.md](07-planilla-decisiones.md) |

Para imprimir y repartir: [08-resumen-docente.md](08-resumen-docente.md), una o dos carillas escritas para los docentes.

Después de la reunión: [09-acta.md](09-acta.md).

Para quien quiera ir más al fondo: [10-anexo.md](10-anexo.md).

## Vocabulario de decisión

Cuatro palabras, y sólo cuatro. Se usan igual en todo el pack y en la planilla:

| Palabra | Significa |
|---|---|
| **ACEPTAR** | queda como está |
| **AJUSTAR** | la idea sirve, hay que cambiar algo concreto |
| **RECHAZAR** | no sirve, hay que pensarlo de nuevo |
| **DIFERIR** | no se decide hoy, y no bloquea seguir |

**«Se ve bien» no cierra un ítem.** Si no hay una de las cuatro palabras, el ítem queda abierto.

## Cuándo se puede dar el gate por cerrado

La lista está en [02-checklist-facilitador.md](02-checklist-facilitador.md), al final, y **empieza vacía a propósito**. Se completa después de la reunión real, con lo que los docentes hayan dicho, y recién entonces se actualizan el roadmap y el registro de decisiones.

## Una advertencia sobre qué valida esta reunión

Los docentes validan matemática, terminología, ambigüedad, credibilidad del contexto y la aceptabilidad de la filosofía de competencia.

**No validan** que un chico de 12 años entienda la pantalla sin ayuda ni que quiera volver a jugar. Eso no tiene evidencia hasta la feria y no se puede presentar de otra manera.
