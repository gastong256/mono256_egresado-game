# Telemetry and observability

## Purpose

Because the first real target-user exposure is the fair, aggregate telemetry is valuable for operations and later learning.

## Minimal useful events

- run_issued;
- run_started;
- challenge_started;
- challenge_completed;
- challenge_outcome;
- run_completed;
- submission_pending;
- submission_verified;
- submission_rejected with reason code;
- technical_error.

## Avoid

- full answer payloads in general analytics when not needed;
- personal names/emails;
- sensitive profiling;
- excessive event volume.

## Operational dashboards

- active/error rate;
- submission success/latency;
- database/API health;
- ranking update failures;
- abnormal rate-limit activity.

## Product analysis after fair

- abandonment points;
- time by challenge;
- outcome distributions;
- repeat-attempt improvement;
- variant difficulty outliers.
