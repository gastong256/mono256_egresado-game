# Variant validation invariants

Every deployed competitive variant must satisfy domain-specific tests.

## Generic invariants

- generation terminates;
- values are finite/in range;
- at least one valid answer/path;
- no accidental duplicate options;
- intended optimum exists where required;
- no unintended tie for optimum unless design explicitly allows multiple optima;
- all outcome branches are reachable as intended;
- feedback calculations match evaluator;
- public prompt contains all information needed;
- no malformed currency/time/unit formatting;
- difficulty metadata exists;
- canonical fingerprint exists.

## UX/readability invariants

- no ugly accidental decimal complexity outside target;
- no absurd school context values;
- option text remains within practical mobile limits;
- mathematical notation can be represented accessibly.

## Statistical invariants

Across large generated sample:

- correct option positions roughly balanced when shuffled;
- no one template dominates unintentionally;
- difficulty mix matches target;
- invalid/deployment failure rate is visible and reviewed;
- duplicate/fingerprint collision rate acceptable.
