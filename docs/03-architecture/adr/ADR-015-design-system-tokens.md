# ADR-015 — Sistema de diseño con tokens semánticos y paleta restringida

- Estado: Aceptado — reemplazado parcialmente por [ADR-017](ADR-017-paper-visual-identity.md)
- Fecha: 2026-08-22

> **Qué sigue vigente y qué no.** La gobernanza de esta decisión sigue en pie: la cadena de tokens en una sola dirección, la paleta de Tailwind apagada y el contraste como gate obligatorio. Lo que ADR-017 reemplaza son los *valores* y las dependencias: la paleta pasó de OKLCH a hexadecimal, la escala tipográfica pasó a los roles de v0.2, el radio pasó a 0 en todo el sistema, y `geist` y `lucide-react` salieron.

## Contexto

Después del primer slice jugable, cada pantalla decidía sus propios colores, radios y tamaños de texto. Con una etapa implementada eso funcionaba; con seis años de secundaria por delante y desarrollo asistido por agentes, garantiza deriva: dos pantallas escritas con un mes de diferencia no se van a parecer, y nadie va a notar cuándo dejaron de parecerse.

El estado concreto era peor que desprolijo: el CSS global pintaba un lienzo crema con degradado terracota mientras los componentes usaban `slate-*` de Tailwind. Ninguno de los dos venía de una decisión de marca, y ninguno de los dos ganaba.

La dirección de marca del producto —verde, rojo, blanco y gris— tampoco estaba implementada en ningún lado.

Tailwind 4.3.3 permite definir tokens desde CSS con `@theme`, lo que abre una posibilidad que la configuración en JavaScript no daba: **apagar** la paleta por defecto.

## Decisión

Se implementa el Egresado Design System v0.1 con tres decisiones estructurales.

### 1. Cadena de tokens en una sola dirección

```text
paleta primitiva (OKLCH)  →  token semántico  →  componente
```

Los componentes de producto consumen `bg-primary` y `text-foreground-muted`, nunca `bg-green-600` ni `text-gray-600`. La paleta cruda es asunto de la capa de tema.

La paleta se define en OKLCH porque es perceptualmente uniforme: verde, rojo y gris comparten la misma rampa de luminosidad, y eso es lo que hace que se sientan de la misma familia. El gris lleva una traza mínima del tono verde, porque un gris neutro puro se percibe violáceo al lado del verde de marca.

Los tokens semánticos viven en `:root` como variables CSS y se exponen a Tailwind con `@theme inline`. Un segundo tema es un bloque de redefiniciones, no una reescritura de componentes.

### 2. La paleta por defecto de Tailwind queda apagada

```css
--color-*: initial;
--text-*: initial;
--radius-*: initial;
--shadow-*: initial;
```

`bg-blue-500`, `text-2xl` y `rounded-3xl` dejan de generar CSS. No es una preferencia estética: es lo que convierte al sistema de diseño en una regla en vez de una sugerencia. Un agente que escriba `bg-purple-400` produce un elemento sin fondo, y eso se ve.

Lo que el apagado no cubre —un hexadecimal escrito a mano, la paleta cruda usada en una pantalla— lo cubre `pnpm design:check`, un script corto con cuatro reglas. Deliberadamente no es un plugin de ESLint: el objetivo es atajar las formas conocidas de deriva, no auditar estética.

### 3. El contraste es un gate, no una guía

`pnpm design:check` convierte cada color OKLCH a sRGB y verifica las combinaciones que el producto pinta de verdad contra los mínimos de WCAG 2.2: 4,5:1 para texto y 3:1 para contorno de control y estado.

Existe porque «se ve oscuro» no es una medición. Durante la construcción bloqueó tres combinaciones que a ojo pasaban por buenas, entre ellas el verde de marca en 4,27:1 con texto blanco.

## Dependencias que entran

| Paquete | Problema que resuelve |
|---|---|
| `clsx` + `tailwind-merge` | una sola utilidad `cn()` que compone clases y resuelve conflictos |
| `class-variance-authority` | variantes tipadas donde realmente hay variantes |
| `lucide-react` | un único lenguaje de íconos, con importación por ícono |
| `geist` | tipografía variable servida localmente, sin CDN ni descarga en build |

Quedan fuera a propósito: Radix —ninguna interacción actual supera al HTML nativo—, Storybook —la vitrina en `/dev/design-system` alcanza y cuesta menos— y cualquier CSS-in-JS en runtime.

No hay `ThemeProvider`. Con un solo tema, las variables CSS alcanzan.

## Consecuencias

- Agregar una etapa nueva es componer primitivas y escribir contenido. Elegir un verde, un radio o un estilo de botón deja de ser parte del trabajo.
- Agregar un rol tipográfico o una escala propia obliga a declararla en `cn()`. `tailwind-merge` trae su propio mapa de grupos y ante un nombre desconocido puede clasificarlo mal: eso hizo que `text-heading` borrara `text-primary-foreground` y los botones primarios salieran con tinta oscura sobre verde, sin que fallara ningún test ni ningún tipo. Hay un test que cubre cada escala.
- Agregar una combinación de colores nueva a la interfaz obliga a agregarla a la lista del gate de contraste.
- Un color que el browser lee antes del CSS —el `theme_color` del manifiesto— necesita un literal. La única copia permitida vive en `src/lib/ui/brand.ts` y un test verifica que coincida con su token.
- El tema oscuro queda diferido, pero no bloqueado: ningún componente supone que blanco es fondo ni que el gris oscuro es texto.
- La regla de producto **elegir no es acertar** queda sostenida por el sistema: el estado seleccionado es neutro y nunca verde, y hay un test end-to-end que verifica que dos opciones de distinta calidad se vean idénticas antes de confirmar.
