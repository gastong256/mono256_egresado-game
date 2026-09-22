# Runbook de feria

Para Feria del Libro 2026, el [runbook Vercel/Supabase](vercel-supabase-production-deployment.md) fija valores y comandos reales. Ensayo local, una sola producción cloud y sin tercer proyecto Supabase.

## T-7 días

- Congelar ruleset/content de feria.
- Crear evento sintético local equivalente.
- Ejecutar simulation tests.
- Revisar nicknames/moderation controls.
- Probar QR en Android/iOS.
- Probar pantalla pública.
- Exportar/configurar fallback estático si corresponde.

## T-1 día

- Crear/confirmar evento producción.
- Verificar inicio/fin timezone correcto.
- Smoke test desde red externa.
- Confirmar DB/hosting health.
- Validar ranking vacío o baseline deseada.
- Preparar URLs/QR impresos.
- Cargar notebook de operación y proyector.

## Apertura

1. Verificar `/api/health` y `/api/health?ready=1`.
2. Confirmar evidencia del ensayo local completo.
3. Smoke cloud; partida sintética sólo en edición separada opcional.
4. Confirmar moderación.
5. Abrir leaderboard en pantalla.

## Durante

Monitorear:
- starts/completions;
- errores;
- latencia;
- nicknames;
- conectividad local.

No hacer deploy funcional durante horario de máxima afluencia salvo incidente crítico.

## Si ranking falla

Gameplay continúa. Cambiar pantalla pública a estado “ranking temporalmente pausado”. No bloquear runs.

## Si backend falla

Activar procedimiento de `fallback-and-incident-plan.md`.

## Cierre

- cerrar nuevas runs si corresponde;
- congelar ranking;
- exportar resultados agregados;
- tomar backup/snapshot según plan;
- registrar incidentes y observaciones de playtest.

## Operación de la competencia implementada

Desde STAGE-09 el runbook tiene comandos concretos. El detalle de qué hace cada
uno está en [el cierre de la etapa](../06-delivery/stage-09-fair-mode-server-ranking.md);
lo que sigue es el orden en que se usan.

### Antes de la feria

Seguir las secciones B–F del [handoff](vercel-supabase-production-deployment.md): migraciones con `supabase link` y `db push`, preflight y bootstrap con `--env-file=.env.production.local`. `pnpm db:reset` sólo se usa en ensayo local descartable, nunca como preparación de producción.

El despliegue necesita, además de la base: `EGRESADO_COMPETITION_SLUG`,
`PARTICIPANT_IDENTITY_SECRET`, los tres campos del responsable de los datos,
la versión del aviso y la credencial del organizador. Si falta alguno, la
aplicación **no atiende**: falla con un error de configuración en vez de mostrar
un aviso de privacidad incompleto.

`competition:bootstrap` es idempotente y **no pisa** una edición existente:
cambiar la seed de una competencia en curso invalidaría todas las partidas
jugadas.

**El secreto de identidad no se rota durante una edición abierta.** Rotarlo
invalida las claves derivadas y los participantes dejan de reconocerse a sí
mismos. Entre ediciones no cuesta nada.

### Apertura y cierre

Desde `/organizer`, con sesión. Cada cambio de estado pide un motivo y queda
auditado. El cierre es un timestamp del servidor: después de `closesAt` no se
empiezan partidas, y las ya emitidas se pueden enviar hasta la tolerancia
configurada.

### Verificar un ganador

1. El ranking muestra el alias.
2. En `/organizer` se abre el participante: nombre y apellido, año o curso,
   división si la hubiera y **los últimos cuatro dígitos** del documento.
3. Se le pide a quien reclama que se identifique; si la institución lo permite,
   se comparan los cuatro dígitos con su documento.
4. Se marca «identidad verificada», con motivo. Queda auditado.

El documento completo **no está en el sistema**: no se guarda. La verificación
la hace una persona mirando un documento, no una pantalla.

### Después de la feria

- Exportar el CSV desde `/organizer` antes de cualquier purga.
- Dejar pasar la ventana de retención —30 días para esta feria— para atender
  reclamos.
- Anonimizar: `pnpm competition:privacy:purge -- --env-file=.env.production.local --apply`, o la acción del
  organizador. Se van nombre, año, división y últimos cuatro dígitos; quedan el
  alias y el puntaje.

**No purgar antes de entregar los premios.** Sin nombre ni últimos cuatro
dígitos ya no se puede verificar a un ganador que reclama después. Por eso la
purga es explícita y nunca un trabajo automático.

## Qué agrega una feria con premios

Cuando el ranking reparta premios, este runbook se ejecuta junto con [modo feria y congelamiento](fair-mode-and-competition-freeze.md), que cubre política de intentos, congelamiento de versiones, control de cambios en vivo, cierre, empates, privacidad de menores y ensayo de carga y red.

Dos reglas que conviene tener a mano durante el evento:

- **No se cambia una regla de score en vivo.** Un arreglo visual o de crash que preserve la semántica se puede desplegar; datos de desafío, lógica de evaluación, coeficientes, factores de dificultad, opciones y aleatorización no. Si un defecto de corrección obliga igual, se crea una versión nueva y se decide explícitamente si las runs previas se recalculan.
- **Una anécdota de la primera hora no es evidencia.** Se anota para la próxima versión.

En «Cierre», la exportación agregada incluye además la lista auditable de candidatos a premio descripta en [leaderboard y moderación](leaderboard-and-moderation.md).
