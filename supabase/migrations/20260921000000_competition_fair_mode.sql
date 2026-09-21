-- STAGE-09 — Fair mode, servidor autoritativo y ranking.
--
-- Todo el esquema de competencia vive en `public` porque es el único schema que
-- PostgREST expone, pero **nada de esto es legible por la clave publicable**:
-- cada tabla habilita RLS sin una sola política, y los grants a `anon` y
-- `authenticated` se revocan explícitamente. El único acceso es el del BFF con
-- la clave secreta, que corre como `service_role` y salta RLS. La separación
-- entre dato público y dato privado de un menor es, por lo tanto, física: no
-- hay ruta desde el navegador a estas filas.
--
-- ADR-005 (Postgres/Supabase), ADR-009 (ranking por edición) y ADR-026
-- (identidad de participante con HMAC por competencia).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Competencias
-- ---------------------------------------------------------------------------

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'UPCOMING', 'OPEN', 'CLOSED', 'ARCHIVED')),

  -- Vigencia. El cierre es un timestamp del servidor, nunca del cliente, y la
  -- tolerancia de envío tardío es configuración de la edición y no una
  -- constante escondida en el código.
  opens_at timestamptz,
  closes_at timestamptz,
  submission_grace_seconds integer not null default 300
    check (submission_grace_seconds between 0 and 86400),

  -- Competition Seed compartida: una sola seed por edición, emitida y
  -- registrada acá. Todos los intentos de la edición reciben el mismo plan,
  -- las mismas variantes, la misma dificultad y el mismo techo de
  -- oportunidades; lo único propio de cada intento es su runId.
  run_seed text not null check (run_seed ~ '^[A-Za-z0-9._:-]{1,128}$'),
  run_plan_fingerprint text not null,

  -- Tupla de versiones congelada. La verificación usa estos valores, nunca
  -- "la última": un intento emitido bajo una calibración se verifica bajo esa
  -- calibración o no se verifica.
  engine_version text not null,
  ruleset_version text not null,
  content_version text not null,
  variant_catalog_version text not null,
  score_version text not null,
  action_log_version integer not null,
  snapshot_version integer not null,

  -- Privacidad: versión de la nota vigente cuando se registró cada
  -- participante, y retención declarada de los datos privados.
  privacy_notice_version text not null,
  retention_days integer not null default 120
    check (retention_days between 1 and 3650),

  results_frozen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint competitions_window_ordered
    check (opens_at is null or closes_at is null or opens_at < closes_at)
);

comment on table public.competitions is
  'Una edición de competencia. La seed y la tupla de versiones se congelan al crearla.';

-- ---------------------------------------------------------------------------
-- Participantes
-- ---------------------------------------------------------------------------

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null
    references public.competitions (id) on delete cascade,

  -- Lo único público de una persona en todo el sistema.
  public_nickname text not null check (char_length(public_nickname) between 2 and 24),
  nickname_key text not null,
  nickname_hidden boolean not null default false,

  -- Privado. Sólo lo lee un organizador autenticado.
  full_name_private text check (char_length(full_name_private) between 1 and 120),
  school_year_private text check (char_length(school_year_private) between 1 and 32),
  division_private text check (char_length(division_private) between 1 and 16),

  -- Identidad derivada: HMAC-SHA-256 con secreto de servidor sobre
  -- `competitionId:dniNormalizado`. El DNI en claro no se guarda en ninguna
  -- parte; los últimos cuatro dígitos alcanzan para que un docente verifique
  -- a un ganador en persona.
  identity_hmac text not null check (identity_hmac ~ '^[0-9a-f]{64}$'),
  dni_last4_private text check (dni_last4_private ~ '^[0-9]{4}$'),

  status text not null default 'ELIGIBLE'
    check (status in ('ELIGIBLE', 'DISQUALIFIED')),
  status_reason text,
  identity_verified_at timestamptz,

  privacy_notice_version text not null,
  anonymized_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint participants_identity_unique unique (competition_id, identity_hmac),
  constraint participants_nickname_unique unique (competition_id, nickname_key)
);

comment on column public.participants.identity_hmac is
  'HMAC-SHA-256 con secreto de servidor. No es un hash del DNI: sin el secreto no se puede recomputar.';

create index participants_competition_status_idx
  on public.participants (competition_id, status);

-- ---------------------------------------------------------------------------
-- Sesiones de participante
-- ---------------------------------------------------------------------------

create table public.participant_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null
    references public.participants (id) on delete cascade,
  -- Sólo el digest. El token vive en la cookie del jugador y en ningún otro lado.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz
);

create index participant_sessions_participant_idx
  on public.participant_sessions (participant_id);

-- ---------------------------------------------------------------------------
-- Intentos
-- ---------------------------------------------------------------------------

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null
    references public.competitions (id) on delete cascade,
  participant_id uuid not null
    references public.participants (id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),

  status text not null default 'STARTED'
    check (status in ('STARTED', 'ABANDONED', 'SUBMITTED', 'VERIFIED', 'REJECTED')),

  -- Emisión. El runId es propio del intento; la seed y el plan son los de la
  -- edición, copiados acá para que la verificación no dependa de que la fila
  -- de la competencia no haya cambiado después.
  run_id text not null unique check (run_id ~ '^[A-Za-z0-9._:-]{1,128}$'),
  seed text not null,
  run_plan_fingerprint text not null,

  engine_version text not null,
  ruleset_version text not null,
  content_version text not null,
  variant_catalog_version text not null,
  score_version text not null,
  action_log_version integer not null,
  snapshot_version integer not null,

  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  verified_at timestamptz,

  -- El artefacto que el servidor vuelve a jugar. Sólo comandos: nunca contiene
  -- nombre, DNI ni nada que identifique a una persona.
  action_log jsonb,
  submission_digest text,

  verified_fair_score integer check (verified_fair_score between 0 and 10000),
  verified_prestige_score integer check (verified_prestige_score >= 0),
  verified_summary jsonb,
  rejection_code text,

  invalidated_at timestamptz,
  invalidated_reason text,

  constraint attempts_number_unique unique (participant_id, attempt_number),
  constraint attempts_verified_has_score check (
    status <> 'VERIFIED'
      or (verified_fair_score is not null and verified_at is not null)
  ),
  constraint attempts_rejected_has_code check (
    status <> 'REJECTED' or rejection_code is not null
  )
);

comment on constraint attempts_number_unique on public.attempts is
  'Intentos ilimitados, numerados por participante; la unicidad hace imposible duplicar el número bajo concurrencia.';

-- Un solo intento activo por participante. Es la restricción de dominio que
-- previene intentos paralelos sin necesidad de un lock aplicativo.
create unique index attempts_one_active_per_participant
  on public.attempts (participant_id)
  where status = 'STARTED';

-- El índice del ranking: el orden es exactamente el del comparador v1.
create index attempts_ranking_idx
  on public.attempts (
    competition_id,
    verified_fair_score desc,
    verified_prestige_score desc
  )
  where status = 'VERIFIED' and invalidated_at is null;

create index attempts_participant_idx
  on public.attempts (participant_id, attempt_number desc);

-- ---------------------------------------------------------------------------
-- Mejor intento verificado por participante elegible
-- ---------------------------------------------------------------------------
--
-- Una vista, no una tabla materializada: a escala de feria el `distinct on`
-- sobre el índice de ranking resuelve en milisegundos, y materializar
-- introduciría un estado derivado que puede quedar viejo justo cuando un
-- organizador invalida un resultado.
--
-- `security_invoker` hace que la vista respete la RLS de las tablas base en
-- lugar de saltarla con los permisos de quien la creó.

create view public.competition_best_attempts
with (security_invoker = true) as
select distinct on (a.participant_id)
  a.competition_id,
  a.participant_id,
  a.id as attempt_id,
  p.public_nickname,
  p.nickname_hidden,
  a.verified_fair_score,
  a.verified_prestige_score,
  a.verified_at
from public.attempts a
join public.participants p on p.id = a.participant_id
where a.status = 'VERIFIED'
  and a.invalidated_at is null
  and p.status = 'ELIGIBLE'
order by
  a.participant_id,
  a.verified_fair_score desc,
  a.verified_prestige_score desc,
  a.id;

comment on view public.competition_best_attempts is
  'Mejor intento verificado de cada participante elegible. No expone ningún campo privado.';

-- ---------------------------------------------------------------------------
-- Sesiones de organizador y auditoría
-- ---------------------------------------------------------------------------

create table public.organizer_sessions (
  id uuid primary key default gen_random_uuid(),
  organizer_username text not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table public.organizer_audit_log (
  id bigint generated always as identity primary key,
  competition_id uuid references public.competitions (id) on delete set null,
  actor text not null,
  action text not null,
  target_type text,
  target_id text,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index organizer_audit_log_competition_idx
  on public.organizer_audit_log (competition_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Límite de tasa
-- ---------------------------------------------------------------------------
--
-- Contadores de ventana fija en la base. Un mapa en memoria de proceso no
-- sirve en serverless: cada instancia contaría por su cuenta.

create table public.rate_limit_counters (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

create index rate_limit_counters_window_idx
  on public.rate_limit_counters (window_start);

-- Incremento atómico de la ventana. Un `insert ... on conflict do update`
-- resuelve el caso "todavía no existe" y el caso "ya existe" en una sola
-- sentencia, así que dos pedidos simultáneos suman dos y nunca uno.
create function public.competition_bump_rate_limit(
  p_bucket text,
  p_window_start timestamptz
) returns integer
language sql
as $$
  insert into public.rate_limit_counters (bucket, window_start, hits)
  values (p_bucket, p_window_start, 1)
  on conflict (bucket, window_start)
  do update set hits = public.rate_limit_counters.hits + 1
  returning hits;
$$;

-- ---------------------------------------------------------------------------
-- Cierre de acceso
-- ---------------------------------------------------------------------------

alter table public.competitions enable row level security;
alter table public.participants enable row level security;
alter table public.participant_sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.organizer_sessions enable row level security;
alter table public.organizer_audit_log enable row level security;
alter table public.rate_limit_counters enable row level security;

-- Ninguna política: con RLS habilitada y sin policies, `anon` y `authenticated`
-- no ven una sola fila aunque alguien les otorgue el grant por error. El
-- revoke explícito cierra además la lectura de metadatos.
--
-- El único rol con acceso es `service_role`, el de la clave secreta del BFF, y
-- el grant es explícito porque el proyecto no auto-expone entidades nuevas: una
-- tabla agregada mañana nace inaccesible hasta que alguien decida lo contrario,
-- que es exactamente el default que se quiere alrededor de datos de menores.
revoke all on public.competitions from anon, authenticated;
revoke all on public.participants from anon, authenticated;
revoke all on public.participant_sessions from anon, authenticated;
revoke all on public.attempts from anon, authenticated;
revoke all on public.organizer_sessions from anon, authenticated;
revoke all on public.organizer_audit_log from anon, authenticated;
revoke all on public.rate_limit_counters from anon, authenticated;
revoke all on public.competition_best_attempts from anon, authenticated;
revoke all on function public.competition_bump_rate_limit(text, timestamptz)
  from anon, authenticated;

grant select, insert, update, delete on
  public.competitions,
  public.participants,
  public.participant_sessions,
  public.attempts,
  public.organizer_sessions,
  public.organizer_audit_log,
  public.rate_limit_counters
  to service_role;
grant usage, select on all sequences in schema public to service_role;
grant select on public.competition_best_attempts to service_role;
grant execute on function public.competition_bump_rate_limit(text, timestamptz)
  to service_role;
