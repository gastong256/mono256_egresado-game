# Adjudicación final del techo de estrategia ciega de `y5.stage-screen`

- **Estado:** `EXECUTED` — 2026-09-18, sobre `main` en `3d88c69`
- **Gate:** `RS-MAT-008 — BLIND CEILING FINAL ADJUDICATION`
- **Rol:** Chair / Head of Mathematics Department provisional
- **Entrada:** la pregunta abierta 66, dejada por la
  [adjudicación de conflictos de contrato](mathematics-remediation-contract-conflict-adjudication.md#d-oq-66-y5stage-screen)
  (D-S08-114)
- **Veredicto:** `RS-MAT-008 BLIND CEILING FINAL ADJUDICATION — RESOLVED`

## A. Veredicto

El techo `K ≤ 70` era **estructuralmente imposible**. El menor techo factible,
demostrado y alcanzado, es:

```text
K_min_feasible = 1950 / 25 = 78,0
```

`y5.stage-screen` queda implementada y aprobada con ese techo y con todos los
demás criterios de RS-MAT-008 intactos. La remediación matemática cierra en
**14 / 14 contratos PASS**.

Nada se movió para bajar K: ni la escalera 100 / 75 / 40 / 10, ni FairScore, ni
la validez geométrica, ni el objetivo de la Template.

## B. Baseline

`main` en `3d88c69`, worktree limpio. Engine `10.0.0`, action log `7`, snapshot
`8`, ruleset de carrera `1.0.0-full-career`, score
`fair-score-dev-2@2.0.0-post-tg1-candidate`. Al empezar: contenido
`5.2.0-grade-5`, catálogo `grade-5-dev-3`, `y5.stage-screen` con R 40,8 · K 75,0
· S 52 %, un solo elemento protegido y un `it.todo` en la auditoría de estrategia
ciega. 13 de 14 contratos en PASS.

## C. El problema, formalizado

**Universo de candidatas.** Cada dirección del generador produce una variante con
pantalla, imagen, los dos elementos protegidos y su aire. Una variante es
**admisible** si pasa todos los gates por variante de RS-MAT-008: validez exacta,
óptima única, estirar inválida, imagen más alta de forma que la pantalla, imagen
que entra sin agrandar, punto 10, IM-1 y el witness —estricto, o con la excepción
estrecha de D-S08-114 donde ningún recorte es válido—.

**Selección.** El catálogo es una selección binaria `x_v ∈ {0,1}` con
`Σ x_v = N`. `N = 25` por la convención del pipeline: 24 aprobaciones generadas
más la variante autorada `reference`.

**Objetivo.** Para cada respuesta constante `a` de las seis:

```text
score_a = Σ_v x_v · score(v, a)      con  100 / 75 / 40 / 10
K       = max_a score_a / N
```

Se minimiza `K` sujeto a: punto 7 (óptima en ≥ 3 opciones, ninguna > 40 %),
punto 8 (ninguna opción salvo estirar con nivel constante), punto 9 (la heurística
del lado con más aire óptima en ≤ 50 %), punto 10, IM-1, óptima única, `S ≤ 40 %`
y aritmética exacta. Todo en enteros: se minimiza el numerador `K_num`, y
`K = K_num / 25`.

## D. Método exacto

No hizo falta un solver externo, y no se agregó ninguna dependencia: el problema
se reduce **exactamente** a un conteo, y la reducción es la prueba.

1. **Barrido del universo con los gates reales del repositorio.** Se enumeraron
   las combinaciones de pantalla, imagen y aire sobre las siete pantallas del
   diseño y se filtraron con `screenGates`, la función que el pipeline usa para
   aprobar. Resultado: **116.045 variantes admisibles**, y en todas ellas el nivel
   de «entera» es `optimal` (64.846) o `efficient` (51.199). **Nunca `functional`,
   nunca `invalid`.**
2. **Reducción.** Como «entera» no recorta nada, es válida siempre; y donde algún
   recorte es válido, ese recorte llena la pantalla y es la óptima, mientras
   «entera» y «sin agrandar» se reparten `efficient` y `functional` —«entera»
   nunca usa menos pantalla que «sin agrandar»—. Entonces, llamando `w` a la
   proporción de variantes sin recorte válido:

   ```text
   score_entera / N = 100·w + 75·(1 − w) = 75 + 25·w
   ```

   y `K ≥ 75 + 25·w` para cualquier catálogo.
3. **Enumeración exhaustiva de los repartos.** Con `N = 25`, se recorrieron
   **todos** los vectores enteros `(entera, centro, arriba, abajo)` que suman 25
   y cumplen los puntos 7, 8 y 9. El mínimo de `75 + 25·w` sobre ese conjunto es
   **78,0**, y se alcanza con `entera = 3`.

La búsqueda es determinista y no usa azar: es una enumeración completa, no una
heurística.

## E. Prueba de la cota inferior

`K < 78` es imposible:

- **`w ≥ 1/25`.** El punto 8 prohíbe que «entera» tenga el mismo nivel en todas
  las variantes, y sus dos únicos niveles posibles son `optimal` (sin recorte
  válido) y `efficient` (con recorte válido). Hacen falta las dos clases.
- **`w ≥ 1/10`.** La heurística «recortar todo del lado con más aire» acierta
  **exactamente** en las variantes cuyo único recorte válido es de un lado: si
  recortar todo de un lado entra en el aire de ese lado y no en el del otro, ese
  lado es el que más aire tiene. El punto 9 acota esas variantes al 50 %; el punto
  7 acota las de recorte por el medio al 40 %; y «entera» es óptima en el resto,
  así que `w ≥ 1 − 0,5 − 0,4 = 0,1`.
- Con `N = 25`, `w ≥ 0,1` obliga a `entera ≥ 3` y por lo tanto

  ```text
  K ≥ (3·100 + 22·75) / 25 = 1950 / 25 = 78,0
  ```

- Y `K` es un **máximo** sobre respuestas constantes, así que `K ≥ score_entera`
  sin importar cómo queden las otras cinco.

Para `N = 24` el mismo argumento da `K ≥ 78,125`, peor.

> **ERRATUM, 2026-09-18 (D-S08-123).** Acá decía además que «25 es el tamaño que
> minimiza el techo». Es **falso**, y la
> [re-auditoría independiente](independent-mathematics-reaudit.md#mat-ra-007-observation-exceso-documental-en-la-adjudicación-del-techo)
> lo probó por enumeración: `K_min(N) = 75 + 25·⌈N/10⌉/N`, que vale **77,5** para todo
> `N` múltiplo de 10 y **77,885** para `N = 26`. La cifra de `N = 24` (78,125) sí es
> correcta. **El resultado de este contrato no cambia:** el catálogo publicado tiene
> `N = 25`, donde el mínimo es exactamente **78,000**, y el techo `K ≤ 78` se cumple y
> es mínimo a ese tamaño. Lo corregido es el alcance del argumento, no su conclusión.

## F. Catálogo testigo

`K = 78` es alcanzable, y lo alcanza el catálogo publicado —no un modelo
paralelo—. El reparto sale de `SCREEN_ROLES`, un ciclo de 25 papeles que el gate
de dirección comprueba, así que el catálogo es reproducible byte a byte desde las
direcciones:

| Papel | Variantes | Óptima |
|---|---|---|
| `aire-parejo` | 10 | recortar mitad y mitad |
| `aire-arriba` | 6 | recortar sólo de arriba |
| `aire-abajo` | 6 | recortar sólo de abajo |
| `sin-aire` | 2 | la imagen entera |
| `sin-aire-grande` | 1 | la imagen entera, con «sin agrandar» aceptable |

## G. Métricas del catálogo publicado (`grade-5-dev-4`)

| Medición | Valor | Criterio |
|---|---|---|
| R | 39,8 | — |
| **K** | **78,0** (numerador 1950 / 25) | **= techo probado** ✓ |
| S | 40,0 % | ≤ 40 % ✓ |
| Óptima por opción | centro 10 · arriba 6 · abajo 6 · entera 3 | ≥ 3 opciones, ninguna > 40 % ✓ |
| Nivel de «entera» | `efficient` 22 · `optimal` 3 | no constante ✓ |
| Nivel de «sin agrandar» | `functional` 24 · `efficient` 1 | no constante ✓ |
| Nivel de los tres recortes | óptima o inválida, según la variante | no constantes ✓ |
| Nivel de «estirar» | `invalid` 25 | única constante permitida ✓ |
| Heurística del lado con más aire | óptima en 12 / 25 = 48 % | ≤ 50 % ✓ |
| Uso de «entera» | de 69,5 % a 86,5 %; 0 dentro de (70 %, 80 %) | punto 10 ✓ |
| Recortes válidos por variante | 0 → 3 · 1 → 22 · ≥ 2 → 0 | óptima única ✓ |
| Niveles alcanzables | o 25 · e 23 · f 24 · i 25 | witness ✓ |
| IM-1 | 25 / 25 | ✓ |

Las tres variantes sin recorte válido son las únicas que usan la excepción de
witness, y cada una pierde **un solo** nivel intermedio.

## H. Decisión

```text
OQ-66 — CERRADA

1. El techo K ≤ 70 de la sección 3 era imposible bajo la matemática LOCKED de
   y5.stage-screen y la escalera 100/75/40/10: «entera» es siempre válida y
   nunca baja de `efficient` donde algún recorte vale.

2. La excepción estrecha del witness —sólo donde ningún recorte es válido— se
   conserva: es necesaria y suficiente para la primera contradicción, y es
   coherente con D-S08-099, que prohíbe fabricar crédito parcial donde el
   espacio matemático no tiene ese estado.

3. El techo de esta Template pasa a ser el mínimo factible demostrado:
   K ≤ 78 sobre 25 variantes, escrito en enteros como K_num ≤ 1950.

4. No cambian la escalera, FairScore, la validez geométrica, el objetivo, la
   banda STRETCH, el pacing QUICK, el cluster `egreso` ni el motor
   `decision-card`.

5. El resto de los criterios de RS-MAT-008 sigue vigente y se cumple:
   S ≤ 40 %, reparto de la óptima, tope por opción, niveles no constantes,
   heurística de lado, punto 10, punto 11, IM-1 y óptima única.
```

## I. Lo que no cambia

D-S08-099 queda intacto —no se fabricó ningún nivel—; OQ-67 y su enmienda del
criterio 3 de RS-NEW-001 no se tocaron; los doce contratos restantes no se
reabrieron; `g7.bus-timing` (D-S08-111) sigue sin remediar, como entrada del
re-audit; y el hardening aceptado en D-S08-112 sigue en su lugar.

## J. Autorización de implementación

```text
WP-SCREEN — EJECUTADO
```

`y5.stage-screen` se reescribió con los dos elementos protegidos, las seis formas,
la geometría exacta en enteros y la generación dirigida por papel; el catálogo de
5.º se republicó como `grade-5-dev-4`; el `it.todo` se reemplazó por la afirmación
real del techo.

## K. Siguiente gate

```text
Independent Mathematics Re-Audit — NEXT
```

Con la remediación completa: 14 / 14 contratos, la tabla R/K/S, el inventario de
feedback y esta adjudicación como evidencia a re-derivar de forma independiente.
