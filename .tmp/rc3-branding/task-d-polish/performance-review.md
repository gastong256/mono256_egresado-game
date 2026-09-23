# Revisión de performance — TASK-D

Mediciones en Chromium sobre el build de producción local (`PerformanceObserver`
inyectado desde el script de QA; no son datos de campo).

| Superficie | LCP | CLS | Elemento LCP | Notas |
|---|---|---|---|---|
| `/` OPEN real | 372 ms | 0,000 | texto de la portada (wordmark/promesa) | SSR completo; fuentes locales `next/font`; sin imagen above the fold |
| `/` con fixture (reemplazo por poll) | ~100 ms | 0,04–0,16 | — | el CLS es el reemplazo del estado inyectado a los 20 s (aparece el reloj); en producción el estado inicial ya trae fechas y no hay salto |
| `/test` | — | 0 | — | intro sin imágenes |
| Juego | — | 0 | — | `SceneMedia` reserva 16:9 con `aspect-ratio`; una imagen por situación, `sizes="(max-width: 412px) 100vw, 412px"`, sin `priority`, lazy por defecto |

Presupuesto y decisiones:

- **Sin dependencias nuevas.** Motion con los tres keyframes existentes;
  ninguna librería de animación (ver `motion-review.md`).
- **Islas cliente:** `/` sigue siendo Server Component que renderiza
  `CompetitionExperience` (cliente, necesario por sesión, fetch y pantallas);
  el reloj es su propio componente con estado propio: el tick re-renderiza
  sólo al reloj (sin cambio). `generateMetadata` reutiliza la misma lectura
  pública que la página.
- **Bundle:** el cierre y el hito son componentes de presentación sin
  dependencias; `ending-model.ts` es puro. No se agregó analizador; no hay
  regresión material (misma lista de dependencias, mismos chunks dinámicos de
  `attempt-run`/`practice-run`).
- **Imágenes:** 24 WebP ≤ 165 KB servidos por el optimizador de Next a 828 px
  en DPR 2 (≈40–70 KB); pie con 3 WebP `unoptimized` (49,5 KB total) y
  dimensiones intrínsecas. Sin precarga masiva.
- **INP:** los manejadores de la portada y del juego no hacen trabajo pesado;
  el cierre calcula sus derivaciones una vez por render de un estado final.
- **Riesgos restantes:** el poll de 20 s de la portada puede mover el layout
  cuando cambia el podio (aceptado; datos reales); Core Web Vitals de campo
  no se midieron.
