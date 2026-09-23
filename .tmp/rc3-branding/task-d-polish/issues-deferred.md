# Diferido — TASK-D

| Tema | Por qué se difiere | A dónde |
|---|---|---|
| Favicon, app icons, OG image, social mark, logo, hero | assets de marca | BRANDING |
| `alt` de los logos del pie redundantes con el texto visible | el afiche de la Feria aporta «Somos con otros»; cambiarlo mueve tests de TASK-A y no aporta a estudiantes; revisar junto con los assets de marca | BRANDING |
| Rol tipográfico fluido para el numeral «Egresado» a 320 px | hoy se oculta el tilde decorativo; un `clamp` con `cqi` exige token + `cn()` + test + doc del DS | BRANDING / DS |
| Podio animado al actualizarse por poll | animar un cambio que el jugador no provocó sugiere un evento; se mantiene estático | — |
| Live region puntual para «tu puesto cambió» | el cierre ya anuncia el estado de verificación con `role="status"`; un anuncio de puesto en la portada por poll sería ruido | — |
| Orden de `y2–y5.closing` | contenido versionable (TASK-B) | bump de contenido |
| Récord contra historial completo | backend (TASK-C) | diseño de producto |
| CLS del poll de portada | datos reales que cambian; reservar alto del podio implicaría dibujar puestos vacíos | — |
| Core Web Vitals de campo | requiere producción y usuarios | post-deploy |
