# API contracts — conceptual fair backend

Exact framework/route naming follows repository conventions.

## POST /events/{eventId}/participants

Creates/resumes pseudonymous participant. Validate nickname length/characters and event state.

## POST /events/{eventId}/runs

Issues official RunDescriptor.

Server determines:

- rule versions;
- score version;
- seed;
- variant assignments.

Client cannot request an “easy” difficulty or arbitrary seed for prize mode.

## POST /runs/{runId}/submit

Payload:

- canonical action log;
- client completion metadata if useful;
- idempotency key.

Do not accept authoritative `fairScore` from browser.

Responses:

- verified result;
- pending/processing;
- rejected with non-sensitive reason code.

## GET /events/{eventId}/leaderboard

Returns moderated public best results, pagination/limit capped.

## Admin moderation endpoints

Separate authorization. Never exposed merely by obscurity.

## Contract limits

- nickname max length;
- action count/log bytes;
- request body size;
- rate limits;
- version validation;
- pagination limit.
