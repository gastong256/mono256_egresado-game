# Load and network test plan

## Why

A school fair creates bursty arrivals, shared Wi-Fi and ranking refreshes.

## Test scenarios

- many run issuance requests in a short burst;
- concurrent final submissions;
- leaderboard polling while submissions occur;
- duplicate/retry submissions;
- high latency;
- transient offline during run;
- database/API restart or degraded response;
- moderation during load.

## Success properties

- no duplicate official run result;
- personal-best update remains correct under concurrency;
- leaderboard reads do not block verification path excessively;
- clients retain pending submission;
- rate limits reject abuse without blocking expected fair burst.

Choose numeric concurrency targets from expected attendance and multiply by a safety factor; do not invent cloud scale without event estimates.
