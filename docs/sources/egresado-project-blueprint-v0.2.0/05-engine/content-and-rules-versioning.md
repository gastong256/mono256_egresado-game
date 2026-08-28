# Content, rule and score versioning

## Why separate versions

A visual hotfix should not change scoring. A scoring formula change should not silently alter old runs. A content generator change should not make old seeds reconstruct differently.

Track separately:

- engine implementation;
- game rules/progression;
- content/templates;
- variant catalog;
- scoring;
- visual app release if useful.

## Competition freeze

Once official fair competition begins:

- do not change generator semantics;
- do not change score coefficients;
- do not change difficulty mappings;
- do not change content that affects score.

If a severe correctness bug requires change, create a new version and use replay/regrade policy. Do not mix scores from non-comparable versions without an explicit migration/recomputation.
