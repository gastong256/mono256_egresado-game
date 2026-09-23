# Personalización con alias — TASK-D

Fuente única: `PublicSelfSummary.nickname` (sesión del participante en `/`),
que ya viaja a la portada. Se pasa por props hasta `RunView` y el cierre;
la práctica no pide alias y no lo inventa; el harness de desarrollo tampoco.
Nada nuevo se persiste ni se loguea. Máximo 24 caracteres por validación;
las frases llevan `[overflow-wrap:anywhere]`. Texto React, nunca HTML.

| Surface | Current text | Nickname useful? | Implemented? | Reason |
|---|---|---|---|---|
| Portada, saludo | «Hola, {alias}» | sí | ya existía (TASK-A) | reconoce la sesión |
| Portada, mejor puntaje | «Tu mejor puntaje: N…» | no | no | el saludo de arriba ya nombra |
| Identificación | «Elegí cómo aparecer en el ranking» | no | no | todavía no hay alias |
| Apertura 7.º (narrativa) | «Arranca séptimo…» | débil | no | es contenido autorado; el hito de cierre nombra mejor |
| Situaciones | enunciado de cada Template | no | no | el alias no aporta a la cuenta y podría sonar artificial («Sofi, decí cuántos minutos…») |
| Resultado de una situación | «Óptimo / Insuficiente…» | no | no | feedback sobre la decisión, no sobre la persona |
| Repaso | «Quedó algo dando vueltas…» | no | no | evitar personalizar el momento de error |
| Hito de 7.º | «Ya sabés cómo funciona la escuela…» | **sí** | **sí**: «{alias}, cerraste tu primer año. Ya sabés…» | primer año cerrado: el recorrido empieza a ser suyo |
| Hitos de 1.º–4.º | línea del año | no | no | cuatro menciones seguidas serían un tic |
| Hito de 5.º | «Terminaste la secundaria…» | **sí** | **sí**: «{alias}, terminaste la secundaria.» | culminación |
| Cierre, EGRESASTE | «Egresaste» | **sí** | **sí**: «Egresaste, {alias}.» | el momento de mayor jerarquía |
| Cierre, mejor puntaje personal | «Nuevo mejor puntaje personal…» | débil | no | el egreso ya lo nombró en la misma pantalla |
| Cierre, franja | «Gran recorrido.» | no | no | la frase habla del recorrido, no de la persona |
| Ranking | filas | no (prohibido) | sólo «(vos)» existente | nunca dentro de nombres ajenos |
| Práctica | — | no hay alias | no | modo sin PII |

Total por carrera en competencia: 4 momentos (saludo, cierre de 7.º, cierre
de 5.º, egreso). Sin alias todas las frases vuelven a su forma neutra
(`personalizedName` descarta vacío/espacios). Sin estructuras con género.
Tests: `progression-copy.test.ts` (sólo 7.º y 5.º; vacío = neutro; alias
largo con «HTML» queda como texto), `career-ending.test.tsx` («Egresaste,
AliasLargoDePruebaABCD.» y sin `<b>` en el DOM), E2E `competition.spec`
(`toContainText('Egresaste')`).
